import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase-server";

const FREE_TRIAL_USES = 1;
const CREDIT_FIELDS = {
  resume: "credits_resume",
  cover: "credits_cover",
  linkedin: "credits_linkedin",
};

export async function POST(request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_pro, credits_resume, credits_cover, credits_linkedin")
    .eq("id", user.id)
    .single();

  const { prompt, tool, maxTokens = 4000, title = "" } = await request.json();
  const creditField = CREDIT_FIELDS[tool];

  if (!profile?.is_pro) {
    const credits = profile?.[creditField] || 0;

    if (credits > 0) {
      // proceed
    } else {
      const { count } = await supabase
        .from("tool_usage")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("tool", tool);

      if ((count || 0) >= FREE_TRIAL_USES) {
        return Response.json({
          error: "upgrade_required",
          credits: 0,
        }, { status: 402 });
      }
    }
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    });
    const text = message.content.map((c) => c.text || "").join("\n");

    // Record usage tracking
    await supabase.from("tool_usage").insert({ user_id: user.id, tool });

    // Parse and save to history
    let parsedResult = null;
    try {
      parsedResult = JSON.parse(text.replace(/```json|```/g, "").trim());
      await supabase.from("generations").insert({
        user_id: user.id,
        tool,
        title: title.slice(0, 200) || `${tool} generation`,
        result: parsedResult,
      });
    } catch (parseErr) {
      console.error("Failed to parse/save generation:", parseErr);
    }

    // Decrement credit if user has them
    if (!profile?.is_pro && (profile?.[creditField] || 0) > 0) {
      await supabase
        .from("profiles")
        .update({ [creditField]: profile[creditField] - 1 })
        .eq("id", user.id);
    }

    return Response.json({ text });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "AI failed" }, { status: 500 });
  }
}
