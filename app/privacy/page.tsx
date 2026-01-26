export default function Privacy() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 text-gray-100">
      <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 bg-clip-text text-transparent">
        Privacy Policy
      </h1>
      <p className="text-gray-400 mb-8">Last updated: January 26, 2026</p>
      
      <div className="space-y-8 text-gray-300 leading-relaxed">
        <p>
          Voxi Labs (&quot;we&quot;, &quot;us&quot;) respects your privacy. This Policy explains how we collect, use, and protect information when you use Merlin at boxeslabs.com.
        </p>
        
        <section>
          <h2 className="text-2xl font-semibold text-amber-300 mb-3">1. Information We Collect</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong className="text-amber-200">Birth data</strong>: Date, time, and place of birth (entered by you) — used only to generate your personal chart.
            </li>
            <li>
              <strong className="text-amber-200">Account info</strong>: Email (via Clerk auth) and payment details (handled securely by Stripe — we do not store card info).
            </li>
            <li>
              <strong className="text-amber-200">Usage data</strong>: Basic analytics (page views, etc.) via tools like Vercel Analytics.
            </li>
          </ul>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold text-amber-300 mb-3">2. How We Use It</h2>
          <p>
            We use birth data solely to calculate and display your chart. We do not sell, share, or use it for marketing. Email is used for account access and support only.
          </p>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold text-amber-300 mb-3">3. Data Sharing</h2>
          <p>
            We share data only with service providers (Clerk for auth, Stripe for payments, Vercel for hosting) under strict confidentiality. No third-party sharing for ads or other purposes.
          </p>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold text-amber-300 mb-3">4. Data Security</h2>
          <p>
            We use industry-standard measures to protect your information. However, no system is 100% secure.
          </p>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold text-amber-300 mb-3">5. Your Rights</h2>
          <p>
            Contact us to request access, correction, or deletion of your data (subject to legal requirements). We retain birth data only as long as your account is active.
          </p>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold text-amber-300 mb-3">6. Children&apos;s Privacy</h2>
          <p>
            The Service is not directed at children under 13. We do not knowingly collect data from them.
          </p>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold text-amber-300 mb-3">7. Changes & Contact</h2>
          <p>
            We may update this Policy. Check back periodically. Questions? Email: <a href="mailto:kai@boxeslabs.com" className="text-amber-400 hover:text-amber-300 underline">kai@boxeslabs.com</a>
          </p>
          <p className="mt-2">Voxi Labs, Norfolk, Virginia, USA.</p>
        </section>
      </div>
    </div>
  );
}
