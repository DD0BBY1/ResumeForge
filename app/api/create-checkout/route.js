import Stripe from "stripe";
import { createClient } from "@/lib/supabase-server";

export async function POST(request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });

  const { plan = "pro" } = await request.json().catch(() => ({}));

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const origin = request.headers.get("origin");

  let session;

  if (plan === "boost") {
    // One-time payment for credit pack
    const priceId = process.env.STRIPE_PRICE_ID_BOOST;
    if (!priceId) return Response.json({ error: "Boost not configured" }, { status: 500 });

    session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: { user_id: user.id, plan: "boost" },
      success_url: `${origin}/app?upgraded=boost`,
      cancel_url: `${origin}/app`,
    });
  } else {
    // Subscription for Pro
    const priceId = process.env.STRIPE_PRICE_ID_PRO;
    if (!priceId) return Response.json({ error: "Pro not configured" }, { status: 500 });

    session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: { user_id: user.id, plan: "pro" },
      success_url: `${origin}/app?upgraded=pro`,
      cancel_url: `${origin}/app`,
    });
  }

  return Response.json({ url: session.url });
}
