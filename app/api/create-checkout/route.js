import Stripe from "stripe";
import { createClient } from "@/lib/supabase-server";

export async function POST(request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const origin = request.headers.get("origin");

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
    customer_email: user.email,
    client_reference_id: user.id,
    metadata: { user_id: user.id },
    success_url: `${origin}/?upgraded=true`,
    cancel_url: `${origin}/`,
  });

  return Response.json({ url: session.url });
}
