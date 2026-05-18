"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import {
  Sparkles, FileText, Target, Copy, Check, Loader2, ArrowRight, Zap,
  Mail, Linkedin, Crown, LogOut, Gift, Coins, Download, History, Trash2, Clock,
} from "lucide-react";

async function callClaudeAPI(prompt, tool, maxTokens = 4000, title = "") {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, tool, maxTokens, title }),
  });
  if (res.status === 402) return { upgradeRequired: true };
  if (res.status === 401) return { needsLogin: true };
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return { text: data.text };
}
function downloadAsPDF(title, content) {
  const win = window.open("", "_blank");
  if (!win) return alert("Please allow popups to download.");

  const escapeHTML = (s) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const lines = content.split("\n");
  let html = "";
  let inList = false;
  let nameFound = false;
  let nameLine = "";
  let prevWasEmpty = false;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    if (!trimmed) {
      if (inList) { html += "</ul>"; inList = false; }
      // Only add spacer if previous wasn't already empty (prevents stacked blank space)
      if (!prevWasEmpty) html += '<div class="spacer"></div>';
      prevWasEmpty = true;
      continue;
    }
    prevWasEmpty = false;

    // First non-bullet line = name (becomes H1)
    if (!nameFound && trimmed.length < 60 && !/^[•\-*]/.test(trimmed)) {
      nameFound = true;
      nameLine = trimmed;
      html += `<h1>${escapeHTML(trimmed)}</h1>`;
      continue;
    }

    // Contact line (within first 5 lines, has @ or | or phone number)
    if (nameFound && i < 5 && (/[@|]/.test(trimmed) || /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(trimmed))) {
      html += `<p class="contact">${escapeHTML(trimmed)}</p>`;
      continue;
    }

    // All-caps section header (must be >3 chars, all caps, no bullets)
    if (trimmed === trimmed.toUpperCase() && trimmed.length >= 4 && trimmed.length < 50 && /[A-Z]{3,}/.test(trimmed) && !/[•\-]/.test(trimmed)) {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<h2>${escapeHTML(trimmed)}</h2>`;
      continue;
    }

    // Bullet
    if (/^[•\-*]/.test(trimmed)) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += `<li>${escapeHTML(trimmed.replace(/^[•\-*]\s*/, ""))}</li>`;
      continue;
    }

    // Job title or date line
    if (trimmed.includes("—") || trimmed.includes(" - ") || trimmed.includes(" at ") || /\b(20\d{2}|19\d{2}|present)\b/i.test(trimmed)) {
      if (inList) { html += "</ul>"; inList = false; }
      const isDates = /\b(20\d{2}|19\d{2}|present)\b/i.test(trimmed) && trimmed.length < 40;
      html += isDates ? `<p class="dates">${escapeHTML(trimmed)}</p>` : `<p class="role">${escapeHTML(trimmed)}</p>`;
      continue;
    }

    if (inList) { html += "</ul>"; inList = false; }
    html += `<p>${escapeHTML(trimmed)}</p>`;
  }
  if (inList) html += "</ul>";

  const doc = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>${nameLine ? escapeHTML(nameLine) : "Document"}</title>
<style>
@page { margin: 0.6in; size: letter; }
* { box-sizing: border-box; }
body { font-family: 'Calibri', 'Helvetica Neue', Arial, sans-serif; font-size: 10.5pt; line-height: 1.4; color: #1a1a1a; margin: 0; padding: 0; }
h1 { font-size: 22pt; margin: 0 0 2px 0; font-weight: 700; letter-spacing: 0.5px; color: #0a0a0a; }
.contact { font-size: 10pt; color: #555; margin: 0 0 14px 0; border-bottom: 1.5px solid #0a0a0a; padding-bottom: 10px; }
h2 { font-size: 11.5pt; margin: 16px 0 6px 0; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #0a0a0a; border-bottom: 1.5px solid #0a0a0a; padding-bottom: 2px; }
.role { font-weight: 600; margin: 8px 0 0 0; font-size: 11pt; }
.dates { font-size: 9.5pt; color: #666; margin: 0 0 4px 0; font-style: italic; }
p { margin: 3px 0; }
ul { margin: 2px 0 6px 0; padding-left: 18px; }
li { margin: 1px 0; line-height: 1.35; }
.spacer { height: 2px; }
@media print { body { padding: 0; } }
</style></head><body>
${html}
<script>window.onload=()=>setTimeout(()=>window.print(),100);</script>
</body></html>`;

  win.document.open();
  win.document.write(doc);
  win.document.close();
}

function copyText(text) {
  navigator.clipboard.writeText(text);
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        copyText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition"
    >
      {copied ? <><Check className="w-3.5 h-3.5 text-green-400" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
    </button>
  );
}

function DownloadBtn({ title, content }) {
  return (
    <button
      onClick={() => downloadAsPDF(title, content)}
      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-amber-400/20 border border-amber-400/30 text-amber-200 hover:bg-amber-400/30 transition"
    >
      <Download className="w-3.5 h-3.5" /> PDF
    </button>
  );
}

function UsageIndicator({ isPro, credits, freeUsed, tool, onUpgrade }) {
  if (isPro) return null;
  if (credits > 0) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${
        credits > 2 ? "bg-blue-500/10 border-blue-500/30 text-blue-300" : "bg-amber-500/10 border-amber-500/30 text-amber-300"
      }`}>
        <Coins className="w-3.5 h-3.5" />
        <span><b>{credits} credit{credits === 1 ? "" : "s"}</b> remaining for this tool</span>
      </div>
    );
  }
  const freeRemaining = Math.max(0, 1 - freeUsed);
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${
      freeRemaining > 0 ? "bg-green-500/10 border-green-500/30 text-green-300" : "bg-amber-500/10 border-amber-500/30 text-amber-300"
    }`}>
      <Gift className="w-3.5 h-3.5" />
      {freeRemaining > 0 ? (<span><b>{freeRemaining} free use</b> remaining for this tool</span>) : (
        <><span>Free trial used — </span><button onClick={onUpgrade} className="font-bold underline">get more</button></>
      )}
    </div>
  );
}

function ResumeOptimizer({ isPro, credits, freeUsed, onUpgrade, onNeedLogin, onUse, loaded }) {
  const [resume, setResume] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const resultRef = useRef(null);

  useEffect(() => {
    if (loaded) {
      setResult(loaded);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [loaded]);

  const optimize = async () => {
    if (!resume.trim()) return setError("Please paste your resume first.");
    setError(""); setLoading(true); setResult(null);

    const titleHint = jobDesc.trim().split("\n")[0]?.slice(0, 80) || "Resume optimization";

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
      const res = await callClaudeAPI(prompt, "resume", 4000, titleHint);
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
      <UsageIndicator isPro={isPro} credits={credits} freeUsed={freeUsed} tool="resume" onUpgrade={onUpgrade} />
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
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-black/20">
              <span className="font-semibold text-sm">Optimized Resume</span>
              <div className="flex gap-2">
                <DownloadBtn title="Optimized Resume" content={result.optimizedResume} />
                <CopyBtn text={result.optimizedResume} />
              </div>
            </div>
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

function CoverLetter({ isPro, credits, freeUsed, onUpgrade, onNeedLogin, onUse, loaded }) {
  const [resume, setResume] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [tone, setTone] = useState("professional");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const resultRef = useRef(null);

  useEffect(() => {
    if (loaded) {
      setResult(loaded);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [loaded]);

  const generate = async () => {
    if (!resume.trim() || !jobDesc.trim()) return setError("Resume and job description required.");
    setError(""); setLoading(true); setResult(null);

    const titleHint = jobDesc.trim().split("\n")[0]?.slice(0, 80) || "Cover letter";

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
      const res = await callClaudeAPI(prompt, "cover", 2500, titleHint);
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
      <UsageIndicator isPro={isPro} credits={credits} freeUsed={freeUsed} tool="cover" onUpgrade={onUpgrade} />
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
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-black/20">
              <span className="font-semibold text-sm">Cover Letter</span>
              <div className="flex gap-2">
                <DownloadBtn title="Cover Letter" content={result.coverLetter} />
                <CopyBtn text={result.coverLetter} />
              </div>
            </div>
            <pre className="p-5 text-sm whitespace-pre-wrap font-sans text-white/90 max-h-96 overflow-y-auto leading-relaxed">{result.coverLetter}</pre>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5"><h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-400" /> Personalized for this job</h3><ul className="space-y-2">{result.personalizationPoints.map((item, i) => <li key={i} className="text-sm text-white/70 flex gap-2"><span className="text-amber-400 mt-0.5">✓</span>{item}</li>)}</ul></div>
        </div>
      )}
    </div>
  );
}

function LinkedInRewriter({ isPro, credits, freeUsed, onUpgrade, onNeedLogin, onUse, loaded }) {
  const [bio, setBio] = useState("");
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const resultRef = useRef(null);

  useEffect(() => {
    if (loaded) {
      setResult(loaded);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [loaded]);

  const rewrite = async () => {
    if (!bio.trim() || !goal.trim()) return setError("Both fields required.");
    setError(""); setLoading(true); setResult(null);

    const titleHint = goal.trim().slice(0, 80) || "LinkedIn rewrite";

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
      const res = await callClaudeAPI(prompt, "linkedin", 2500, titleHint);
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
      <UsageIndicator isPro={isPro} credits={credits} freeUsed={freeUsed} tool="linkedin" onUpgrade={onUpgrade} />
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
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-black/20">
              <span className="font-semibold text-sm">About section</span>
              <div className="flex gap-2">
                <DownloadBtn title="LinkedIn About" content={result.aboutSection} />
                <CopyBtn text={result.aboutSection} />
              </div>
            </div>
            <pre className="p-5 text-sm whitespace-pre-wrap font-sans text-white/90 max-h-96 overflow-y-auto leading-relaxed">{result.aboutSection}</pre>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5"><h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-400" /> Profile tips</h3><ul className="space-y-2">{result.tips.map((tip, i) => <li key={i} className="text-sm text-white/70 flex gap-2"><span className="text-amber-400 mt-0.5">→</span>{tip}</li>)}</ul></div>
        </div>
      )}
    </div>
  );
}

function HistoryTab({ onOpenGeneration }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const supabase = createClient();

  const load = async () => {
    setLoading(true);
    let q = supabase.from("generations").select("*").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("tool", filter);
    const { data } = await q;
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const deleteItem = async (id) => {
    if (!confirm("Delete this saved generation?")) return;
    await supabase.from("generations").delete().eq("id", id);
    setItems(items.filter(i => i.id !== id));
  };

  const formatDate = (ts) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  };

  const toolIcons = { resume: FileText, cover: Mail, linkedin: Linkedin };
  const toolLabels = { resume: "Resume", cover: "Cover Letter", linkedin: "LinkedIn" };
  const toolColors = { resume: "text-amber-400", cover: "text-pink-400", linkedin: "text-blue-400" };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {[
          { id: "all", label: "All" },
          { id: "resume", label: "Resumes" },
          { id: "cover", label: "Cover Letters" },
          { id: "linkedin", label: "LinkedIn" },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`text-xs px-3 py-1.5 rounded-lg transition ${
              filter === f.id ? "bg-white/15 border border-white/30 text-white" : "bg-white/5 border border-white/10 text-white/60"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl py-16 text-center">
          <History className="w-10 h-10 mx-auto text-white/20 mb-3" />
          <p className="text-white/60 text-sm">No saved generations yet.</p>
          <p className="text-white/40 text-xs mt-1">Your past resumes, cover letters, and LinkedIn rewrites will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const Icon = toolIcons[item.tool];
            return (
              <div key={item.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-white/20 transition flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${toolColors[item.tool]}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-white/50 uppercase tracking-wider font-semibold">{toolLabels[item.tool]}</span>
                    <span className="text-xs text-white/40 flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDate(item.created_at)}</span>
                  </div>
                  <p className="text-sm text-white/90 mt-0.5 truncate">{item.title || `${toolLabels[item.tool]} generation`}</p>
                </div>
                <button
                  onClick={() => onOpenGeneration(item)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-pink-500 text-black font-bold hover:opacity-90 transition"
                >
                  Open
                </button>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="p-2 rounded-lg text-white/40 hover:text-red-300 hover:bg-red-500/10 transition"
                  aria-label="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function UpgradeModal({ onClose }) {
  const [loading, setLoading] = useState(null);

  const checkout = async (plan) => {
    setLoading(plan);
    const res = await fetch("/api/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 border border-white/10 rounded-3xl max-w-2xl w-full p-6 relative my-8">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white text-xl">×</button>
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Need more uses?</h2>
          <p className="text-white/60 text-sm">Two ways to keep going. Pick what fits.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col">
            <div className="flex items-center gap-2 mb-1"><Coins className="w-4 h-4 text-blue-400" /><h3 className="text-lg font-bold">Boost Pack</h3></div>
            <p className="text-xs text-white/50 mb-4">One-time purchase</p>
            <div className="text-3xl font-black mb-1">$14</div>
            <p className="text-xs text-white/50 mb-4">one-time, no subscription</p>
            <ul className="space-y-2 mb-5 flex-1">
              {["5 resume optimizations", "5 cover letters", "5 LinkedIn rewrites", "Credits never expire", "No recurring charges"].map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs"><Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" /><span className="text-white/80">{f}</span></li>
              ))}
            </ul>
            <button onClick={() => checkout("boost")} disabled={loading !== null} className="w-full py-2.5 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-sm hover:bg-white/15 transition disabled:opacity-50 flex items-center justify-center gap-1">
              {loading === "boost" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buy Boost Pack"}
            </button>
          </div>
          <div className="bg-gradient-to-br from-amber-400/10 to-pink-500/10 border-2 border-amber-400/50 rounded-2xl p-5 relative flex flex-col">
            <span className="absolute -top-3 right-4 px-2.5 py-1 bg-gradient-to-r from-amber-400 to-pink-500 text-black text-xs font-black rounded-full">BEST VALUE</span>
            <div className="flex items-center gap-2 mb-1"><Crown className="w-4 h-4 text-amber-400" /><h3 className="text-lg font-bold">Pro</h3></div>
            <p className="text-xs text-white/50 mb-4">Serious job hunters</p>
            <div className="text-3xl font-black mb-1 bg-gradient-to-r from-amber-300 to-pink-400 bg-clip-text text-transparent">$19</div>
            <p className="text-xs text-white/50 mb-4">per month · cancel anytime</p>
            <ul className="space-y-2 mb-5 flex-1">
              {["Unlimited everything", "All 4 cover letter tones", "Priority AI processing", "Cancel anytime"].map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs"><Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" /><span className="text-white/80">{f}</span></li>
              ))}
            </ul>
            <button onClick={() => checkout("pro")} disabled={loading !== null} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-pink-500 text-black font-bold text-sm hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-1">
              {loading === "pro" ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Crown className="w-4 h-4" /> Get Pro</>}
            </button>
          </div>
        </div>
        <p className="text-center text-xs text-white/40 mt-5">One landed interview pays for years.</p>
      </div>
    </div>
  );
}

export default function AppPage() {
  const [tab, setTab] = useState("resume");
  const [user, setUser] = useState(null);
  const [isPro, setIsPro] = useState(false);
  const [credits, setCredits] = useState({ resume: 0, cover: 0, linkedin: 0 });
  const [freeUsed, setFreeUsed] = useState({ resume: 0, cover: 0, linkedin: 0 });
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loadedResult, setLoadedResult] = useState(null);
  const router = useRouter();
  const supabase = createClient();

  const loadAll = async (userId) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_pro, credits_resume, credits_cover, credits_linkedin")
      .eq("id", userId)
      .single();

    setIsPro(profile?.is_pro || false);
    setCredits({
      resume: profile?.credits_resume || 0,
      cover: profile?.credits_cover || 0,
      linkedin: profile?.credits_linkedin || 0,
    });

    if (!profile?.is_pro) {
      const tools = ["resume", "cover", "linkedin"];
      const counts = {};
      for (const tool of tools) {
        const { count } = await supabase
          .from("tool_usage")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("tool", tool);
        counts[tool] = count || 0;
      }
      setFreeUsed(counts);
    }
  };

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) await loadAll(user.id);
      setCheckingAuth(false);

      const upgraded = new URLSearchParams(window.location.search).get("upgraded");
      if (upgraded && user) {
        setTimeout(() => loadAll(user.id), 2500);
      }
    })();
  }, []);

  const onNeedLogin = () => router.push("/login");
  const onUse = (tool) => {
    setFreeUsed((u) => ({ ...u, [tool]: (u[tool] || 0) + 1 }));
    setCredits((c) => ({ ...c, [tool]: Math.max(0, (c[tool] || 0) - (c[tool] > 0 ? 1 : 0)) }));
  };
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null); setIsPro(false);
    router.push("/");
  };

  const openGeneration = (item) => {
    setLoadedResult(item.result);
    setTab(item.tool);
  };

  const switchTab = (newTab) => {
    if (newTab !== tab) setLoadedResult(null);
    setTab(newTab);
  };

  const tabs = [
    { id: "resume", label: "Resume", icon: FileText },
    { id: "cover", label: "Cover", icon: Mail },
    { id: "linkedin", label: "LinkedIn", icon: Linkedin },
    { id: "history", label: "History", icon: History },
  ];

  const totalCredits = credits.resume + credits.cover + credits.linkedin;

  if (checkingAuth) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-6 h-6 text-white animate-spin" /></div>;
  }

  const StatusBadge = () => {
    if (isPro) return <span className="text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400/20 to-pink-500/20 border border-amber-400/50 text-amber-200 font-semibold flex items-center gap-1"><Crown className="w-3 h-3" /> Pro</span>;
    if (totalCredits > 0) return <button onClick={() => setShowUpgrade(true)} className="text-xs px-3 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/40 text-blue-200 font-semibold flex items-center gap-1 hover:bg-blue-500/25"><Coins className="w-3 h-3" /> {totalCredits} credits</button>;
    return <button onClick={() => setShowUpgrade(true)} className="text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-pink-500 text-black font-bold flex items-center gap-1"><Crown className="w-3 h-3" /> Upgrade</button>;
  };

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
                <StatusBadge />
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
            return <button key={t.id} onClick={() => switchTab(t.id)} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition ${tab === t.id ? "bg-white/10 text-white border border-white/20" : "text-white/50"}`}><Icon className="w-3.5 h-3.5" /><span className="hidden xs:inline sm:inline">{t.label}</span></button>;
          })}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {tab !== "history" && (
          <div className="text-center py-4 mb-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">{tab === "resume" && "Optimize your resume"}{tab === "cover" && "Write your cover letter"}{tab === "linkedin" && "Rewrite your LinkedIn"}</h2>
            <p className="text-sm text-white/60">
              {tab === "resume" && "Tailored ATS-friendly rewrites in 30 seconds."}
              {tab === "cover" && "Personalized cover letters that get read."}
              {tab === "linkedin" && "Headlines & About sections that attract recruiters."}
            </p>
          </div>
        )}
        {tab === "history" && (
          <div className="text-center py-4 mb-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Your saved work</h2>
            <p className="text-sm text-white/60">Everything you've generated, ready to revisit.</p>
          </div>
        )}
        {tab === "resume" && <ResumeOptimizer isPro={isPro} credits={credits.resume} freeUsed={freeUsed.resume} onUpgrade={() => setShowUpgrade(true)} onNeedLogin={onNeedLogin} onUse={onUse} loaded={loadedResult} />}
        {tab === "cover" && <CoverLetter isPro={isPro} credits={credits.cover} freeUsed={freeUsed.cover} onUpgrade={() => setShowUpgrade(true)} onNeedLogin={onNeedLogin} onUse={onUse} loaded={loadedResult} />}
        {tab === "linkedin" && <LinkedInRewriter isPro={isPro} credits={credits.linkedin} freeUsed={freeUsed.linkedin} onUpgrade={() => setShowUpgrade(true)} onNeedLogin={onNeedLogin} onUse={onUse} loaded={loadedResult} />}
        {tab === "history" && <HistoryTab onOpenGeneration={openGeneration} />}
      </div>

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}

      <div className="text-center text-xs text-white/30 py-6 px-4">Built with Claude AI</div>
    </div>
  );
}
