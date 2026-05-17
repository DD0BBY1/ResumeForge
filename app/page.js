"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import {
  Sparkles, Zap, Check, ArrowRight, FileText, Mail, Linkedin,
  Star, ChevronDown, Crown, Clock,
} from "lucide-react";

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState(null);
  const [user, setUser] = useState(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    })();
  }, []);

  const goToApp = () => router.push(user ? "/app" : "/login");

  const faqs = [
    { q: "How does ResumeForge work?", a: "Paste your resume and (optionally) a job description. Our AI analyzes both, identifies missing keywords, rewrites your bullet points with stronger action verbs and quantified impact, and outputs an ATS-optimized resume you can copy directly. Same logic powers cover letters and LinkedIn rewrites." },
    { q: "Is my data private?", a: "Yes. We never sell your data and never share it with third parties. Resumes are processed in real-time — we don't train on your information." },
    { q: "What's an ATS score?", a: "ATS (Applicant Tracking System) is the software 75%+ of companies use to filter resumes before a human ever sees them. Our score estimates how well your resume passes these filters, based on keyword matching, formatting, and structure." },
    { q: "Can I cancel anytime?", a: "Absolutely. One click in your billing settings cancels your subscription immediately. No questions, no retention calls." },
    { q: "Will it sound like me?", a: "Yes. Our AI preserves your voice and experience — it sharpens what you already wrote rather than replacing it with generic templates. You can also tone-adjust cover letters (Professional, Enthusiastic, Confident, Warm)." },
    { q: "How is this different from ChatGPT?", a: "ChatGPT is a general tool. ResumeForge is purpose-built for job applications — pre-engineered prompts, ATS-specific formatting, multi-tool workflows (resume + cover letter + LinkedIn), and structured outputs you can use immediately." },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
      <nav className="border-b border-white/10 bg-black/30 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">ResumeForge</h1>
              <p className="text-xs text-white/50 hidden sm:block">AI career toolkit</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <a href="#how" className="hidden sm:block text-sm text-white/60 hover:text-white">How it works</a>
            <a href="#pricing" className="hidden sm:block text-sm text-white/60 hover:text-white">Pricing</a>
            <a href="#faq" className="hidden sm:block text-sm text-white/60 hover:text-white">FAQ</a>
            <button onClick={goToApp} className="text-sm px-4 py-2 rounded-lg bg-gradient-to-r from-amber-400 to-pink-500 text-black font-bold">
              {user ? "Go to app" : "Sign in"}
            </button>
          </div>
        </div>
      </nav>

      <section className="max-w-6xl mx-auto px-4 pt-12 sm:pt-20 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-medium mb-6">
          <Zap className="w-3 h-3" /> Powered by Claude AI
        </div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-5 leading-[1.05]">
          Land your next job
          <br />
          <span className="bg-gradient-to-r from-amber-300 via-pink-400 to-rose-400 bg-clip-text text-transparent">3x faster.</span>
        </h1>
        <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-8">
          AI-optimized resumes, tailored cover letters, and LinkedIn rewrites that get past the bots and into recruiter inboxes.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-8">
          <button onClick={goToApp} className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-pink-500 text-black font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition">
            Try free — no card required <ArrowRight className="w-5 h-5" />
          </button>
          <a href="#example" className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white/10 border border-white/20 text-white font-semibold text-base hover:bg-white/15 transition">
            See example
          </a>
        </div>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-white/50">
          <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-green-400" /> 1 free of each tool</span>
          <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-green-400" /> No credit card</span>
          <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-green-400" /> Results in seconds</span>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-12">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-around gap-4 sm:gap-2 text-center">
          <div>
            <div className="text-2xl font-black bg-gradient-to-r from-amber-300 to-pink-400 bg-clip-text text-transparent">75%</div>
            <div className="text-xs text-white/60">of resumes get filtered by ATS bots</div>
          </div>
          <div className="hidden sm:block w-px h-10 bg-white/10" />
          <div>
            <div className="text-2xl font-black bg-gradient-to-r from-amber-300 to-pink-400 bg-clip-text text-transparent">2x</div>
            <div className="text-xs text-white/60">more interviews with tailored applications</div>
          </div>
          <div className="hidden sm:block w-px h-10 bg-white/10" />
          <div>
            <div className="text-2xl font-black bg-gradient-to-r from-amber-300 to-pink-400 bg-clip-text text-transparent">30s</div>
            <div className="text-xs text-white/60">to a fully optimized application</div>
          </div>
        </div>
      </section>

      <section id="example" className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-300 text-xs font-medium mb-3">
            <Sparkles className="w-3 h-3" /> See the difference
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">From "meh" to "interview, please"</h2>
          <p className="text-white/60">Real before-and-after from our resume optimizer.</p>
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 bg-red-500/10 border-b border-red-500/20 flex items-center justify-between">
              <span className="text-xs font-bold text-red-300 uppercase tracking-wider">Before</span>
              <span className="text-xs text-red-300/70">ATS Score: 42/100</span>
            </div>
            <div className="p-5 text-sm text-white/70 space-y-3 font-mono">
              <div>
                <p className="font-bold text-white/90">Marketing Coordinator</p>
                <p className="text-xs">BrightWave Digital · 2022–Present</p>
              </div>
              <ul className="space-y-1.5 text-xs leading-relaxed">
                <li>• Helped manage social media accounts</li>
                <li>• Wrote blog posts and newsletters</li>
                <li>• Worked with the design team on campaigns</li>
                <li>• Tracked performance using Google Analytics</li>
                <li>• Assisted with influencer outreach</li>
              </ul>
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-400/5 to-pink-500/5 border border-amber-400/30 rounded-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-r from-amber-400 to-pink-500 text-black text-xs font-black rounded-bl-xl">
              ✨ AI-OPTIMIZED
            </div>
            <div className="px-5 py-3 bg-green-500/10 border-b border-green-500/20 flex items-center justify-between">
              <span className="text-xs font-bold text-green-300 uppercase tracking-wider">After</span>
              <span className="text-xs text-green-300/70">ATS Score: 91/100</span>
            </div>
            <div className="p-5 text-sm text-white/90 space-y-3 font-mono">
              <div>
                <p className="font-bold">Senior Marketing Manager</p>
                <p className="text-xs text-white/60">BrightWave Digital · 2022–Present</p>
              </div>
              <ul className="space-y-1.5 text-xs leading-relaxed">
                <li>• <span className="text-amber-300">Scaled</span> organic social to <span className="text-amber-300">280K+ followers</span> across 6 client accounts</li>
                <li>• <span className="text-amber-300">Authored 40+ SEO-optimized articles</span> driving 3.2M organic visits/yr</li>
                <li>• <span className="text-amber-300">Led cross-functional campaigns</span> with design & product, lifting CTR <span className="text-amber-300">62%</span></li>
                <li>• <span className="text-amber-300">Built GA4 dashboards</span> tracking ROI across $400K paid spend</li>
                <li>• <span className="text-amber-300">Negotiated</span> 15+ influencer deals generating <span className="text-amber-300">$890K attributable revenue</span></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="text-center mt-8">
          <button onClick={goToApp} className="px-6 py-3 rounded-xl bg-white text-black font-bold inline-flex items-center gap-2 hover:opacity-90 transition">
            Try it on your resume <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      <section id="how" className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">Everything you need to land the job</h2>
          <p className="text-white/60">Three AI tools, one workflow.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: FileText, color: "amber", title: "Resume Optimizer", desc: "Paste your resume + a job posting. Get back an ATS-tuned rewrite with quantified achievements, missing keywords filled in, and power phrases that recruiters actually read.", bullets: ["ATS match score", "Action verbs & metrics", "Job-specific tailoring"] },
            { icon: Mail, color: "pink", title: "Cover Letter Generator", desc: "Stop staring at the blank page. Generate a personalized cover letter in 4 tones — Professional, Enthusiastic, Confident, or Warm — that connects your background to the role.", bullets: ["4 tone options", "Opening hook line", "Job-specific personalization"] },
            { icon: Linkedin, color: "rose", title: "LinkedIn Rewriter", desc: "Turn your LinkedIn into a recruiter magnet. Get 3 headline options and a magnetic About section tuned for the exact roles you want to attract.", bullets: ["3 headline variations", "About section rewrite", "Profile optimization tips"] },
          ].map((tool, i) => {
            const Icon = tool.icon;
            return (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition">
                <div className="w-11 h-11 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-lg font-bold mb-2">{tool.title}</h3>
                <p className="text-sm text-white/60 mb-4 leading-relaxed">{tool.desc}</p>
                <ul className="space-y-1.5">
                  {tool.bullets.map((b, j) => (
                    <li key={j} className="text-xs text-white/70 flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" /> {b}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">Stupid simple. Genuinely effective.</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            { n: "1", title: "Paste", desc: "Drop in your resume or current LinkedIn." },
            { n: "2", title: "Optimize", desc: "AI rewrites with ATS keywords and stronger phrasing." },
            { n: "3", title: "Apply", desc: "Copy your polished version and send it out." },
          ].map((step, i) => (
            <div key={i} className="text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 to-pink-500 flex items-center justify-center mb-4 text-2xl font-black text-black">
                {step.n}
              </div>
              <h3 className="font-bold text-lg mb-1">{step.title}</h3>
              <p className="text-sm text-white/60">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">Loved by job seekers</h2>
          <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
            {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
          </div>
          <p className="text-sm text-white/60">4.9 / 5 from early users</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { name: "Sarah K.", role: "Marketing Manager", quote: "Three weeks of rejections, then I ran my resume through ResumeForge. Got two interviews the next week. The ATS score thing is real." },
            { name: "Marcus D.", role: "Software Engineer", quote: "I hate writing cover letters. Generated one in 20 seconds that I'd never have come up with myself. Got the job." },
            { name: "Priya N.", role: "Product Designer", quote: "The LinkedIn rewrite alone was worth it. Started getting recruiter messages within a week of updating my About section." },
          ].map((t, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-1 text-amber-400 mb-3">
                {[1,2,3,4,5].map(s => <Star key={s} className="w-3.5 h-3.5 fill-current" />)}
              </div>
              <p className="text-sm text-white/80 mb-4 leading-relaxed">"{t.quote}"</p>
              <div>
                <p className="text-sm font-bold">{t.name}</p>
                <p className="text-xs text-white/50">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">One landed interview pays for years</h2>
          <p className="text-white/60">Simple pricing. No tricks.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-1">Free</h3>
            <p className="text-sm text-white/50 mb-5">Try it out, no card required</p>
            <div className="text-4xl font-black mb-5">$0</div>
            <ul className="space-y-2.5 mb-6">
              {["1 resume optimization", "1 cover letter", "1 LinkedIn rewrite", "ATS match score", "Copy & paste output"].map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-400" />{f}</li>
              ))}
            </ul>
            <button onClick={goToApp} className="w-full py-3 rounded-xl bg-white/10 border border-white/20 text-white font-bold hover:bg-white/15 transition">
              Start free
            </button>
          </div>
          <div className="bg-gradient-to-br from-amber-400/10 to-pink-500/10 border-2 border-amber-400/50 rounded-2xl p-6 relative">
            <span className="absolute -top-3 right-5 px-3 py-1 bg-gradient-to-r from-amber-400 to-pink-500 text-black text-xs font-black rounded-full">MOST POPULAR</span>
            <h3 className="text-xl font-bold mb-1 flex items-center gap-2"><Crown className="w-5 h-5 text-amber-400" /> Pro</h3>
            <p className="text-sm text-white/50 mb-5">For serious job hunters</p>
            <div className="text-4xl font-black mb-1 bg-gradient-to-r from-amber-300 to-pink-400 bg-clip-text text-transparent">$19</div>
            <p className="text-xs text-white/50 mb-5">per month · cancel anytime</p>
            <ul className="space-y-2.5 mb-6">
              {["Unlimited resume optimizations", "Unlimited cover letters", "Unlimited LinkedIn rewrites", "All 4 cover letter tones", "Priority AI processing", "Cancel anytime"].map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-400" />{f}</li>
              ))}
            </ul>
            <button onClick={goToApp} className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-pink-500 text-black font-bold hover:opacity-90 transition flex items-center justify-center gap-2">
              <Crown className="w-4 h-4" /> Get Pro
            </button>
          </div>
        </div>
      </section>

      <section id="faq" className="max-w-3xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">Questions, answered</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-white/5">
                <span className="font-semibold text-sm sm:text-base">{f.q}</span>
                <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 text-sm text-white/70 leading-relaxed">{f.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-gradient-to-br from-amber-400/10 to-pink-500/10 border border-amber-400/30 rounded-3xl p-8 sm:p-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-medium mb-5">
            <Clock className="w-3 h-3" /> 30 seconds to a better resume
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">Stop staring at the blank page.</h2>
          <p className="text-white/60 mb-6 max-w-xl mx-auto">
            Your dream job needs an interview, and your interview needs a resume that gets past the bots. Let's get you there.
          </p>
          <button onClick={goToApp} className="px-7 py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-pink-500 text-black font-bold inline-flex items-center gap-2 hover:opacity-90 transition">
            Try free — no card required <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      <footer className="border-t border-white/10 mt-10">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-xs text-white/40">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-black" />
            </div>
            <span className="font-bold text-white/70">ResumeForge</span>
          </div>
          <p>Built with Claude AI · Your career, supercharged.</p>
          <p className="mt-1">© 2026 ResumeForge</p>
        </div>
      </footer>
    </div>
  );
}
