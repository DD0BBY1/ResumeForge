"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import {
  Sparkles, FileText, Mail, Linkedin, Check, ArrowRight, Zap, Crown,
  Coins, Target, Clock, Shield, Star, ChevronDown,
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    })();
  }, []);

  const goToApp = () => {
    if (user) router.push("/app");
    else router.push("/login");
  };

  const faqs = [
    {
      q: "How is this different from ChatGPT?",
      a: "ChatGPT is a general-purpose chatbot. ResumeForge is purpose-built for job applications: it knows ATS systems, extracts keywords from job postings, scores match quality, and saves every version. No prompting required — paste your resume and the job description, get a tailored result.",
    },
    {
      q: "Will recruiters know I used AI?",
      a: "No. The output reads like you wrote it — your experience, your voice, just sharpened for the specific role. We don't add cliché AI phrases or generic filler.",
    },
    {
      q: "Is my data safe?",
      a: "Yes. Your data is encrypted, never sold, and never used to train AI models. You can delete any saved generation at any time. See our Privacy Policy for full details.",
    },
    {
      q: "What if the output isn't great?",
      a: "Each tool generates a complete, ready-to-use result. If you want to try again, use another credit and refine your job description for better results. Pro users get unlimited regenerations.",
    },
    {
      q: "Does it work for non-tech jobs?",
      a: "Yes. Marketing, sales, healthcare, trades, education, finance — works for any industry. The AI adapts to the language and conventions of your field.",
    },
    {
      q: "Can I cancel anytime?",
      a: "Pro is cancel-anytime — you keep access until the end of your billing period. Boost Pack is a one-time purchase with no recurring charges.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-20 border-b border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">ResumeForge</h1>
              <p className="text-xs text-white/50">AI career toolkit</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href="#pricing" className="text-sm text-white/70 hover:text-white hidden sm:inline">Pricing</a>
            <a href="#faq" className="text-sm text-white/70 hover:text-white hidden sm:inline">FAQ</a>
            <button onClick={goToApp} className="text-sm px-4 py-2 rounded-lg bg-gradient-to-r from-amber-400 to-pink-500 text-black font-bold">
              {user ? "Open app" : "Sign in"}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 py-16 sm:py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-semibold mb-6">
          <Sparkles className="w-3 h-3" /> Built with Claude AI
        </div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-6 leading-tight">
          Get your resume past the bots and{" "}
          <span className="bg-gradient-to-r from-amber-300 to-pink-400 bg-clip-text text-transparent">in front of humans</span>
        </h1>
        <p className="text-lg sm:text-xl text-white/70 mb-8 max-w-2xl mx-auto leading-relaxed">
          AI that rewrites your resume, cover letter, and LinkedIn to match the exact job you want. 30 seconds. ATS-optimized. Try it free.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-12">
          <button onClick={goToApp} className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-pink-500 text-black font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition">
            Try it free <ArrowRight className="w-5 h-5" />
          </button>
          <a href="#pricing" className="text-sm text-white/60 hover:text-white">See pricing →</a>
        </div>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-white/50">
          <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-green-400" /> No credit card required</span>
          <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-green-400" /> 1 free use of each tool</span>
          <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-green-400" /> Works in 30 seconds</span>
        </div>
      </section>

      {/* The 3 tools */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">Three tools. One toolkit.</h2>
          <p className="text-white/60">Everything you need to land interviews — without spending hours rewriting.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            {
              icon: FileText, color: "text-amber-400", bgGlow: "from-amber-400/10",
              title: "Resume Optimizer",
              desc: "Rewrites your resume to match the job posting. Adds missing keywords. Returns an ATS match score so you know where you stand.",
            },
            {
              icon: Mail, color: "text-pink-400", bgGlow: "from-pink-500/10",
              title: "Cover Letter Generator",
              desc: "Personalized cover letters that actually get read. Pick from 4 tones. Each one references the company and role specifically.",
            },
            {
              icon: Linkedin, color: "text-blue-400", bgGlow: "from-blue-500/10",
              title: "LinkedIn Rewriter",
              desc: "Headlines and About sections that attract recruiters. Tailored to the roles you want, not the ones you've done.",
            },
          ].map((tool, i) => {
            const Icon = tool.icon;
            return (
              <div key={i} className={`bg-gradient-to-br ${tool.bgGlow} via-white/5 to-white/5 border border-white/10 rounded-2xl p-6`}>
                <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${tool.color}`} />
                </div>
                <h3 className="font-bold text-lg mb-2">{tool.title}</h3>
                <p className="text-sm text-white/70 leading-relaxed">{tool.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Before / After example */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">See the difference</h2>
          <p className="text-white/60">Same person. Same experience. Way better resume.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="text-xs uppercase tracking-wider text-white/40 font-bold mb-3">Before</div>
            <p className="text-sm text-white/70 leading-relaxed font-mono">
              Worked at marketing department. Did social media posts and helped with campaigns. Used various tools and worked on projects with team members. Responsible for content.
            </p>
          </div>
          <div className="bg-gradient-to-br from-amber-400/10 to-pink-500/10 border border-amber-400/30 rounded-2xl p-6">
            <div className="text-xs uppercase tracking-wider text-amber-300 font-bold mb-3">After ResumeForge</div>
            <p className="text-sm text-white/90 leading-relaxed font-mono">
              Led content strategy for a 5-channel social media presence (Instagram, TikTok, LinkedIn) — growing follower base by 47% in 8 months. Launched 12 campaigns generating $340K in attributed pipeline.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-5xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">Simple pricing. Real results.</h2>
          <p className="text-white/60">No subscriptions traps. No "premium tier" with the actual features.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {/* Free */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col">
            <h3 className="font-bold text-lg mb-1">Free</h3>
            <p className="text-xs text-white/50 mb-5">Try before you commit</p>
            <div className="text-3xl font-black mb-1">$0</div>
            <p className="text-xs text-white/50 mb-5">forever</p>
            <ul className="space-y-2.5 mb-6 flex-1 text-sm">
              <li className="flex gap-2"><Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" /><span>1 resume optimization</span></li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" /><span>1 cover letter</span></li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" /><span>1 LinkedIn rewrite</span></li>
            </ul>
            <button onClick={goToApp} className="w-full py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-semibold hover:bg-white/15 transition">
              Try free
            </button>
          </div>
          {/* Boost Pack */}
          <div className="bg-gradient-to-br from-blue-500/10 to-white/5 border border-blue-500/30 rounded-2xl p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-1"><Coins className="w-4 h-4 text-blue-400" /><h3 className="font-bold text-lg">Boost Pack</h3></div>
            <p className="text-xs text-white/50 mb-5">One-time, no subscription</p>
            <div className="text-3xl font-black mb-1">$14</div>
            <p className="text-xs text-white/50 mb-5">CAD · one-time</p>
            <ul className="space-y-2.5 mb-6 flex-1 text-sm">
              <li className="flex gap-2"><Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" /><span>5 resume optimizations</span></li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" /><span>5 cover letters</span></li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" /><span>5 LinkedIn rewrites</span></li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" /><span>Credits never expire</span></li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" /><span>No recurring charges</span></li>
            </ul>
            <button onClick={goToApp} className="w-full py-2.5 rounded-xl bg-white/10 border border-blue-500/40 text-blue-200 text-sm font-bold hover:bg-blue-500/20 transition">
              Get Boost Pack
            </button>
          </div>
          {/* Pro */}
          <div className="bg-gradient-to-br from-amber-400/10 to-pink-500/10 border-2 border-amber-400/50 rounded-2xl p-6 relative flex flex-col">
            <span className="absolute -top-3 right-4 px-2.5 py-1 bg-gradient-to-r from-amber-400 to-pink-500 text-black text-xs font-black rounded-full">BEST VALUE</span>
            <div className="flex items-center gap-2 mb-1"><Crown className="w-4 h-4 text-amber-400" /><h3 className="font-bold text-lg">Pro</h3></div>
            <p className="text-xs text-white/50 mb-5">For serious job hunters</p>
            <div className="text-3xl font-black mb-1 bg-gradient-to-r from-amber-300 to-pink-400 bg-clip-text text-transparent">$19</div>
            <p className="text-xs text-white/50 mb-5">CAD · per month</p>
            <ul className="space-y-2.5 mb-6 flex-1 text-sm">
              <li className="flex gap-2"><Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" /><span>Unlimited everything</span></li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" /><span>All 4 cover letter tones</span></li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" /><span>Priority AI processing</span></li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" /><span>Cancel anytime</span></li>
            </ul>
            <button onClick={goToApp} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-pink-500 text-black text-sm font-bold hover:opacity-90 transition flex items-center justify-center gap-1.5">
              <Crown className="w-4 h-4" /> Get Pro
            </button>
          </div>
        </div>
        <p className="text-center text-xs text-white/40 mt-8">All prices in CAD. Secure payment via Stripe.</p>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-3xl mx-auto px-4 py-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">Common questions</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-white/5 transition"
              >
                <span className="font-semibold text-sm sm:text-base pr-3">{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-white/60 flex-shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 text-sm text-white/70 leading-relaxed">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="bg-gradient-to-br from-amber-400/10 to-pink-500/10 border border-amber-400/30 rounded-3xl p-10 sm:p-14">
          <h2 className="text-3xl sm:text-4xl font-black mb-4">Land your next interview.</h2>
          <p className="text-white/70 mb-8 max-w-xl mx-auto">
            Free to try. $14 to unlock 15 uses. The ATS doesn't stand a chance.
          </p>
          <button onClick={goToApp} className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-pink-500 text-black font-bold text-lg inline-flex items-center gap-2 hover:opacity-90 transition">
            Start free <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-10">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-black" />
            </div>
            <span className="text-sm text-white/60">© 2026 ResumeForge</span>
          </div>
          <div className="flex items-center gap-5 text-xs text-white/50">
            <a href="/privacy" className="hover:text-white">Privacy</a>
            <a href="/terms" className="hover:text-white">Terms</a>
            <a href="mailto:hello@resumeforge.ca" className="hover:text-white">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
