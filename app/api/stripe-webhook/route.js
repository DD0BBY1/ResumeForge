import Stripe from "stripe";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const CREDITS_PER_PACK = 5; // 5 of each tool

export async function POST(request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return new Response(`Webhook error: ${err.message}`, { status: 400 });
  }

  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.user_id || session.client_reference_id;
    const plan = session.metadata?.plan;

    if (!userId) return Response.json({ received: true });

    if (plan === "boost") {
      // One-time pack: ADD credits to existing balance
      const { data: profile } = await supabase
        .from("profiles")
        .select("credits_resume, credits_cover, credits_linkedin")
        .eq("id", userId)
        .single();

      await supabase
        .from("profiles")
        .update({
          credits_resume: (profile?.credits_resume || 0) + CREDITS_PER_PACK,
          credits_cover: (profile?.credits_cover || 0) + CREDITS_PER_PACK,
          credits_linkedin: (profile?.credits_linkedin || 0) + CREDITS_PER_PACK,
          stripe_customer_id: session.customer,
        })
        .eq("id", userId);
    } else if (plan === "pro") {
      // Subscription: set is_pro = true
      await supabase
        .from("profiles")
        .update({
          is_pro: true,
          stripe_customer_id: session.customer,
          stripe_price_id: process.env.STRIPE_PRICE_ID_PRO,
        })
        .eq("id", userId);
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object;
    await supabase
      .from("profiles")
      .update({ is_pro: false, stripe_price_id: null })
      .eq("stripe_customer_id", sub.customer);
  }

  return Response.json({ received: true });
}
