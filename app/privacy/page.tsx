import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Flock Privacy Policy - Learn how we protect and handle your data.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      {/* Header */}
      <header className="glass-header sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-5 h-5 text-white/70" />
          </Link>
          <h1 className="text-lg font-semibold text-white">Privacy Policy</h1>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 md:px-6 py-12">
        <div className="glass-card rounded-xl p-6 md:p-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center">
              <Shield className="w-7 h-7 text-[var(--color-accent)]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Privacy Policy</h2>
              <p className="text-white/50 text-sm">Last updated: December 2024</p>
            </div>
          </div>

          <div className="space-y-8 text-white/70">
            <section>
              <h3 className="text-lg font-semibold text-white mb-3">1. Information We Collect</h3>
              <p className="mb-3">
                We collect information you provide directly to us, such as when you create an account, 
                update your profile, or communicate with other users. This includes:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-white/60">
                <li>Name and email address (including .edu email)</li>
                <li>Graduation year and university information</li>
                <li>Current location (city and state)</li>
                <li>Employment or education status</li>
                <li>Social media links you choose to share</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">2. How We Use Your Information</h3>
              <p className="mb-3">We use the information we collect to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-white/60">
                <li>Provide, maintain, and improve our services</li>
                <li>Connect you with alumni from your university</li>
                <li>Send you notifications about new connections and messages</li>
                <li>Respond to your comments, questions, and requests</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">3. Information Sharing</h3>
              <p>
                Your profile information is visible to other verified users from your university network. 
                We do not sell your personal information to third parties. Your exact location coordinates 
                are never shared publicly - only your city and state are displayed.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">4. Data Security</h3>
              <p>
                We implement appropriate security measures to protect your personal information against 
                unauthorized access, alteration, disclosure, or destruction. All data is encrypted in 
                transit and at rest.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">5. Your Rights</h3>
              <p className="mb-3">You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-white/60">
                <li>Access and update your personal information</li>
                <li>Delete your account and associated data</li>
                <li>Control your profile visibility settings</li>
                <li>Opt out of non-essential communications</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">6. Contact Us</h3>
              <p>
                If you have any questions about this Privacy Policy, please contact us at{' '}
                <a href="mailto:privacy@flock.app" className="text-[var(--color-accent)] hover:underline">
                  privacy@flock.app
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
