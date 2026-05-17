"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import {
  Sparkles, FileText, Target, Copy, Check, Loader2, ArrowRight, Zap,
  Mail, Linkedin, Lock, Crown, LogOut, Gift,
} from "lucide-react";

async function callClaudeAPI(prompt, tool, maxTokens = 4000) {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, tool, maxTokens }),
  });
  if (res.status === 402) return { upgradeRequired: true };
  if (res.status === 401) return { needsLogin: true };
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return { text: data.text };
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition"
    >
      {copied ? <><Check className="w-3.5 h-3.5 text-green-400" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
    </button>
  );
}

function FreeUseIndicator({ isPro, used, tool }) {
  if (isPro) return null;
  const remaining = Math.max(0, 1 - used);
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${
      remaining > 0
        ? "bg-green-500/10 border-green-500/30 text-green-300"
        : "bg-amber-500/10 border-amber-500/30 text-amber-300"
    }`}>
      <Gift className="w-3.5 h-3.5" />
      {remaining > 0 ? (
        <span><b>{remaining} free use</b> remaining for this tool</span>
      ) : (
        <span>Free trial used — upgrade to Pro for unlimited</span>
      )}
    </div>
  );
}

function ResumeOptimizer({ isPro, onUpgrade, onNeedLogin, usage, onUse }) {
  const [resume, setResume] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const resultRef = useRef(null);

  const optimize = async () => {
    if (!resume.trim()) return setError("Please paste your resume first.");
    setError(""); setLoading(true); setResult(null);

    const prompt = `You are an expert resume writer. Optimize this resume${jobDesc.trim() ? " for the target job" : ""}.

RESUME:
${resume}

${jobDesc.trim() ? `TARGET JOB:\n${jobDesc}\n` : ""}

Return ONLY JSON (no markdown):
{
  "optimizedResume": "full rewritten resume with line breaks",
  "atsScore": 0-100,
  "keyImprovements": ["5 improvements"],
  "missingKeywords": ["keywords added"],
  "powerPhrases": ["3 strong phrases"]
}`;

    try {
      const res = await callClaudeAPI(prompt, "resume");
      if (res.needsLogin) return onNeedLogin();
      if (res.upgradeRequired) return onUpgrade();
      const parsed = JSON.parse(res.text.replace(/```json|```/g, "").trim());
      setResult(parsed);
      onUse("resume");
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch {
      setError("Something went wrong. Try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      <FreeUseIndicator isPro={isPro} used={usage.resume || 0} tool="resume" />
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-amber-400" /><label className="font-semibold text-sm">Your current resume</label></div>
        <textarea value={resume} onChange={(e) => setResume(e.target.value)} placeholder="Paste your full resume here..." className="w-full h-44 bg-black/30 border border-white/10 rounded-xl p-4 text-sm placeholder:text-white/30 focus:outline-none focus:border-amber-400/50 resize-none" />
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2"><Target className="w-4 h-4 text-pink-400" /><label className="font-semibold text-sm">Target job description</label><span className="text-xs text-white/40">optional</span></div>
        <textarea value={jobDesc} onChange={(e) => setJobDesc(e.target.value)} placeholder="Paste the job posting..." className="w-full h-28 bg-black/30 border border-white/10 rounded-xl p-4 text-sm placeholder:text-white/30 focus:outline-none focus:border-pink-400/50 resize-none" />
      </div>
      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl p-3">{error}</div>}
      <button onClick={optimize} disabled={loading} className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-pink-500 text-black font-bold flex items-center justify-center gap-2 disabled:opacity-50">
        {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Optimizing...</> : <>Optimize my resume <ArrowRight className="w-5 h-5" /></>}
      </button>
      {result && (
        <div ref={resultRef} className="space-y-5 pt-2">
          <div className="bg-gradient-to-br from-amber-400/10 to-pink-500/10 border border-amber-400/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-white/70">ATS Match Score</span><span className="text-3xl font-black bg-gradient-to-r from-amber-300 to-pink-400 bg-clip-text text-transparent">{result.atsScore}/100</span></div>
            <div className="w-full bg-black/30 rounded-full h-2 overflow-hidden"><div className="h-full bg-gradient-to-r from-amber-400 to-pink-500 transition-all duration-1000" style={{ width: `${result.atsScore}%` }} /></div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-black/20"><span className="font-semibold text-sm">Optimized Resume</span><CopyBtn text={result.optimizedResume} /></div>
            <pre className="p-5 text-sm whitespace-pre-wrap font-sans text-white/90 max-h-96 overflow-y-auto">{result.optimizedResume}</pre>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5"><h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-400" /> Improvements</h3><ul className="space-y-2">{result.keyImprovements.map((item, i) => <li key={i} className="text-sm text-white/70 flex gap-2"><span className="text-amber-400 mt-0.5">✓</span>{item}</li>)}</ul></div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5"><h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Target className="w-4 h-4 text-pink-400" /> Keywords Added</h3><div className="flex flex-wrap gap-2">{result.missingKeywords.map((kw, i) => <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-200">{kw}</span>)}</div></div>
          </div>
        </div>
      )}
    </div>
  );
}

function CoverLetter({ isPro, onUpgrade, onNeedLogin, usage, onUse }) {
  const [resume, setResume] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [tone, setTone] = useState("professional");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const resultRef = useRef(null);

  const generate = async () => {
    if (!resume.trim() || !jobDesc.trim()) return setError("Resume and job description required.");
    setError(""); setLoading(true); setResult(null);

    const prompt = `Write a ${tone} cover letter.

JOB:
${jobDesc}

CANDIDATE RESUME:
${resume}

Return ONLY JSON:
{
  "coverLetter": "full cover letter with line breaks, start with 'Dear Hiring Manager,'",
  "hookLine": "strongest opening sentence",
  "personalizationPoints": ["3 personalization details"]
}`;

    try {
      const res = await callClaudeAPI(prompt, "cover", 2500);
      if (res.needsLogin) return onNeedLogin();
      if (res.upgradeRequired) return onUpgrade();
      const parsed = JSON.parse(res.text.replace(/```json|```/g, "").trim());
      setResult(parsed);
      onUse("cover");
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch {
      setError("Something went wrong. Try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      <FreeUseIndicator isPro={isPro} used={usage.cover || 0} tool="cover" />
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-amber-400" /><label className="font-semibold text-sm">Your resume</label></div>
        <textarea value={resume} onChange={(e) => setResume(e.target.value)} placeholder="Paste your resume..." className="w-full h-32 bg-black/30 border border-white/10 rounded-xl p-4 text-sm placeholder:text-white/30 focus:outline-none focus:border-amber-400/50 resize-none" />
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2"><Target className="w-4 h-4 text-pink-400" /><label className="font-semibold text-sm">Job description</label></div>
        <textarea value={jobDesc} onChange={(e) => setJobDesc(e.target.value)} placeholder="Paste the job posting..." className="w-full h-32 bg-black/30 border border-white/10 rounded-xl p-4 text-sm placeholder:text-white/30 focus:outline-none focus:border-pink-400/50 resize-none" />
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <label className="font-semibold text-sm mb-3 block">Tone</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {["professional", "enthusiastic", "confident", "warm"].map((t) => (
            <button key={t} onClick={() => setTone(t)} className={`text-sm py-2.5 rounded-xl transition border capitalize ${tone === t ? "bg-gradient-to-r from-amber-400/20 to-pink-500/20 border-amber-400/50 text-white" : "bg-black/20 border-white/10 text-white/60"}`}>{t}</button>
          ))}
        </div>
      </div>
      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl p-3">{error}</div>}
      <button onClick={generate} disabled={loading} className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-pink-500 text-black font-bold flex items-center justify-center gap-2 disabled:opacity-50">
        {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Writing...</> : <>Write my cover letter <ArrowRight className="w-5 h-5" /></>}
      </button>
      {result && (
        <div ref={resultRef} className="space-y-4 pt-2">
          <div className="bg-gradient-to-br from-amber-400/10 to-pink-500/10 border border-amber-400/30 rounded-2xl p-5"><div className="text-xs uppercase tracking-wider text-amber-300 mb-2 font-semibold">Your hook</div><p className="text-white/90 italic">"{result.hookLine}"</p></div>
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-black/20"><span className="font-semibold text-sm">Cover Letter</span><CopyBtn text={result.coverLetter} /></div>
            <pre className="p-5 text-sm whitespace-pre-wrap font-sans text-white/90 max-h-96 overflow-y-auto leading-relaxed">{result.coverLetter}</pre>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5"><h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-400" /> Personalized for this job</h3><ul className="space-y-2">{result.personalizationPoints.map((item, i) => <li key={i} className="text-sm text-white/70 flex gap-2"><span className="text-amber-400 mt-0.5">✓</span>{item}</li>)}</ul></div>
        </div>
      )}
    </div>
  );
}

function LinkedInRewriter({ isPro, onUpgrade, onNeedLogin, usage, onUse }) {
  const [bio, setBio] = useState("");
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const resultRef = useRef(null);

  const rewrite = async () => {
    if (!bio.trim() || !goal.trim()) return setError("Both fields required.");
    setError(""); setLoading(true); setResult(null);

    const prompt = `Rewrite this LinkedIn presence.

CURRENT BIO:
${bio}

GOAL:
${goal}

Return ONLY JSON:
{
  "headlines": ["3 headlines under 220 chars"],
  "aboutSection": "About section, first person, 3-4 paragraphs, ends with CTA",
  "tips": ["3 profile tips"]
}`;

    try {
      const res = await callClaudeAPI(prompt, "linkedin", 2500);
      if (res.needsLogin) return onNeedLogin();
      if (res.upgradeRequired) return onUpgrade();
      const parsed = JSON.parse(res.text.replace(/```json|```/g, "").trim());
      setResult(parsed);
      onUse("linkedin");
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch {
      setError("Something went wrong. Try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      <FreeUseIndicator isPro={isPro} used={usage.linkedin || 0} tool="linkedin" />
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2"><Linkedin className="w-4 h-4 text-amber-400" /><label className="font-semibold text-sm">Current LinkedIn bio</label></div>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Paste your current LinkedIn About..." className="w-full h-36 bg-black/30 border border-white/10 rounded-xl p-4 text-sm placeholder:text-white/30 focus:outline-none focus:border-amber-400/50 resize-none" />
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2"><Target className="w-4 h-4 text-pink-400" /><label className="font-semibold text-sm">What are you trying to attract?</label></div>
        <textarea value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. 'Senior PM roles at B2B SaaS startups'" className="w-full h-24 bg-black/30 border border-white/10 rounded-xl p-4 text-sm placeholder:text-white/30 focus:outline-none focus:border-pink-400/50 resize-none" />
      </div>
      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl p-3">{error}</div>}
      <button onClick={rewrite} disabled={loading} className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-pink-500 text-black font-bold flex items-center justify-center gap-2 disabled:opacity-50">
        {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Rewriting...</> : <>Rewrite my LinkedIn <ArrowRight className="w-5 h-5" /></>}
      </button>
      {result && (
        <div ref={resultRef} className="space-y-4 pt-2">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5"><h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-400" /> Headlines</h3><div className="space-y-2">{result.headlines.map((h, i) => <div key={i} className="bg-black/30 border border-white/10 rounded-xl p-3 flex items-start justify-between gap-3"><p className="text-sm text-white/90 flex-1">{h}</p><CopyBtn text={h} /></div>)}</div></div>
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"><div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-black/20"><span className="font-semibold text-sm">About section</span><CopyBtn text={result.aboutSection} /></div><pre className="p-5 text-sm whitespace-pre-wrap font-sans text-white/90 max-h-96 overflow-y-auto leading-relaxed">{result.aboutSection}</pre></div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5"><h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-400" /> Profile tips</h3><ul className="space-y-2">{result.tips.map((tip, i) => <li key={i} className="text-sm text-white/70 flex gap-2"><span className="text-amber-400 mt-0.5">→</span>{tip}</li>)}</ul></div>
        </div>
      )}
    </div>
  );
}

function UpgradeModal({ onClose }) {
  const [loading, setLoading] = useState(false);
  const checkout = async () => {
    setLoading(true);
    const res = await fetch("/api/create-checkout", { method: "POST" });
    const { url } = await res.json();
    if (url) window.location.href = url;
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 border border-white/10 rounded-3xl max-w-md w-full p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white text-xl">×</button>
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 to-pink-500 flex items-center justify-center mb-4"><Crown className="w-7 h-7 text-black" /></div>
        <h2 className="text-2xl font-bold text-center mb-2">Unlock Pro</h2>
        <p className="text-center text-white/60 text-sm mb-6">You've used your free try. Go unlimited for $19/mo.</p>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3 mb-5">
          {["Unlimited resume optimizations", "Unlimited cover letters", "Unlimited LinkedIn rewrites", "All 4 cover letter tones", "Priority AI processing"].map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-400 flex-shrink-0" /><span className="text-white/80">{f}</span></div>
          ))}
        </div>
        <div className="text-center mb-5"><div className="text-4xl font-black bg-gradient-to-r from-amber-300 to-pink-400 bg-clip-text text-transparent">$19</div><div className="text-xs text-white/50">per month · cancel anytime</div></div>
        <button onClick={checkout} disabled={loading} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-pink-500 text-black font-bold flex items-center justify-center gap-2 disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Crown className="w-4 h-4" /> Upgrade Now</>}
        </button>
        <p className="text-center text-xs text-white/40 mt-3">One landed interview pays for years.</p>
      </div>
    </div>
  );
}

export default function AppPage() {
  const [tab, setTab] = useState("resume");
  const [user, setUser] = useState(null);
  const [isPro, setIsPro] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [usage, setUsage] = useState({});
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data } = await supabase.from("profiles").select("is_pro").eq("id", user.id).single();
        setIsPro(data?.is_pro || false);
        setUsage(user.user_metadata?.usage || {});
      }
      setCheckingAuth(false);

      if (new URLSearchParams(window.location.search).get("upgraded")) {
        setTimeout(async () => {
          const { data } = await supabase.from("profiles").select("is_pro").eq("id", user?.id).single();
          setIsPro(data?.is_pro || false);
        }, 2000);
      }
    })();
  }, []);

  const onNeedLogin = () => router.push("/login");
  const onUse = (tool) => setUsage((u) => ({ ...u, [tool]: (u[tool] || 0) + 1 }));
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null); setIsPro(false);
    router.push("/");
  };

  const tabs = [
    { id: "resume", label: "Resume", icon: FileText },
    { id: "cover", label: "Cover Letter", icon: Mail },
    { id: "linkedin", label: "LinkedIn", icon: Linkedin },
  ];

  if (checkingAuth) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-6 h-6 text-white animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
      <div className="border-b border-white/10 bg-black/30 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 hover:opacity-90 transition">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-pink-500 flex items-center justify-center"><Sparkles className="w-5 h-5 text-black" /></div>
            <div><h1 className="font-bold text-lg leading-none">ResumeForge</h1><p className="text-xs text-white/50">AI career toolkit</p></div>
          </a>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {isPro ? <span className="text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400/20 to-pink-500/20 border border-amber-400/50 text-amber-200 font-semibold flex items-center gap-1"><Crown className="w-3 h-3" /> Pro</span> : <button onClick={() => setShowUpgrade(true)} className="text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-pink-500 text-black font-bold flex items-center gap-1"><Crown className="w-3 h-3" /> Go Pro</button>}
                <button onClick={signOut} className="text-xs p-1.5 rounded-lg bg-white/5 hover:bg-white/10"><LogOut className="w-3.5 h-3.5" /></button>
              </>
            ) : (
              <button onClick={() => router.push("/login")} className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20">Sign in</button>
            )}
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 pb-3 flex gap-1.5">
          {tabs.map((t) => {
            const Icon = t.icon;
            return <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition ${tab === t.id ? "bg-white/10 text-white border border-white/20" : "text-white/50"}`}><Icon className="w-3.5 h-3.5" />{t.label}</button>;
          })}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="text-center py-4 mb-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">{tab === "resume" && "Optimize your resume"}{tab === "cover" && "Write your cover letter"}{tab === "linkedin" && "Rewrite your LinkedIn"}</h2>
          <p className="text-sm text-white/60">
            {tab === "resume" && "Tailored ATS-friendly rewrites in 30 seconds."}
            {tab === "cover" && "Personalized cover letters that get read."}
            {tab === "linkedin" && "Headlines & About sections that attract recruiters."}
          </p>
        </div>
        {tab === "resume" && <ResumeOptimizer isPro={isPro} onUpgrade={() => setShowUpgrade(true)} onNeedLogin={onNeedLogin} usage={usage} onUse={onUse} />}
        {tab === "cover" && <CoverLetter isPro={isPro} onUpgrade={() => setShowUpgrade(true)} onNeedLogin={onNeedLogin} usage={usage} onUse={onUse} />}
        {tab === "linkedin" && <LinkedInRewriter isPro={isPro} onUpgrade={() => setShowUpgrade(true)} onNeedLogin={onNeedLogin} usage={usage} onUse={onUse} />}
      </div>

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}

      <div className="text-center text-xs text-white/30 py-6 px-4">Built with Claude AI</div>
    </div>
  );
}
