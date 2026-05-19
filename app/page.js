export const metadata = {
  title: "Privacy Policy — ResumeForge",
  description: "How ResumeForge collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <a href="/" className="text-sm text-amber-400 hover:underline mb-8 inline-block">← Back to home</a>
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-white/50 mb-10">Last updated: May 18, 2026</p>

        <div className="space-y-8 text-white/80 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Who we are</h2>
            <p>
              ResumeForge ("we", "us", "our") is operated by Timothy Larson as a sole proprietorship based in Canada.
              The service is accessible at resumeforge.ca. If you have questions about this policy, email{" "}
              <a href="mailto:hello@resumeforge.ca" className="text-amber-400 hover:underline">hello@resumeforge.ca</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. What we collect</h2>
            <p className="mb-3">When you use ResumeForge, we collect:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account info:</strong> your email address and password (passwords are encrypted and never stored in plaintext).</li>
              <li><strong>Content you submit:</strong> resumes, cover letter content, LinkedIn bios, and job descriptions you paste into the tools.</li>
              <li><strong>Generated outputs:</strong> the AI-generated rewrites we produce for you, saved to your account history.</li>
              <li><strong>Usage data:</strong> which tools you use and how many credits you have remaining.</li>
              <li><strong>Payment info:</strong> handled entirely by Stripe — we never see or store your credit card details.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. How we use it</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To generate AI rewrites of the content you submit.</li>
              <li>To save your generation history so you can revisit past results.</li>
              <li>To process payments and track your credits balance.</li>
              <li>To send you account-related emails (purchase receipts, password resets).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. AI processing</h2>
            <p>
              Content you submit is sent to Anthropic (Claude API) to generate rewrites. Anthropic's data handling
              is governed by their terms — they do not use your data to train their models when accessed via the API.
              We do not sell your data to anyone.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Who we share data with</h2>
            <p className="mb-3">We share data only with the third-party services required to run ResumeForge:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Supabase:</strong> hosts our database (account info, generation history)</li>
              <li><strong>Vercel:</strong> hosts our application</li>
              <li><strong>Stripe:</strong> processes payments</li>
              <li><strong>Anthropic:</strong> powers the AI generations</li>
            </ul>
            <p className="mt-3">We do not sell, rent, or share your data for marketing purposes.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Your rights</h2>
            <p>You can:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Delete any generation from your history at any time within the app.</li>
              <li>Request full deletion of your account and all associated data by emailing us.</li>
              <li>Request a copy of all data we hold about you.</li>
              <li>Cancel a Pro subscription at any time through Stripe's customer portal.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">7. Cookies</h2>
            <p>
              We use essential cookies for authentication (so you stay logged in). We do not currently use
              advertising or analytics cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">8. Data retention</h2>
            <p>
              We retain your data as long as your account is active. Generations remain saved until you delete
              them. If you delete your account, all associated data is permanently removed within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">9. Changes to this policy</h2>
            <p>
              We may update this policy as the service evolves. Material changes will be communicated by email
              or via a notice on the site.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">10. Contact</h2>
            <p>
              Questions, concerns, data requests:{" "}
              <a href="mailto:hello@resumeforge.ca" className="text-amber-400 hover:underline">hello@resumeforge.ca</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
