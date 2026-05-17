import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase-server";

export async function POST(request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_pro")
    .eq("id", user.id)
    .single();

  const { prompt, tool, maxTokens = 4000 } = await request.json();

  // Free users: 1 use per tool, tracked in user_metadata
  if (!profile?.is_pro) {
    const usage = user.user_metadata?.usage || {};
    if ((usage[tool] || 0) >= 1) {
      return Response.json({ error: "upgrade_required" }, { status: 402 });
    }
    await supabase.auth.updateUser({
      data: { usage: { ...usage, [tool]: (usage[tool] || 0) + 1 } },
    });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    });
    const text = message.content.map((c) => c.text || "").join("\n");
    return Response.json({ text });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "AI failed" }, { status: 500 });
  }
}
