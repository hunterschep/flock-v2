import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Flock Terms of Service - The rules and guidelines for using our platform.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen gradient-mesh">
      {/* Header */}
      <header className="glass-header sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="glass-light p-2 rounded-lg hover:bg-white/20 transition-all"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <h1 className="text-xl font-bold text-white">Terms of Service</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="glass-card p-8 sm:p-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center">
              <FileText className="w-8 h-8 text-rose-400" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Terms of Service</h2>
              <p className="text-white/60 text-sm">Last updated: December 2024</p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none space-y-6 text-white/80">
            <section>
              <h3 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h3>
              <p>
                By accessing or using Flock, you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use our service.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">2. Eligibility</h3>
              <p>
                To use Flock, you must:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Be at least 18 years old</li>
                <li>Have a valid .edu email address from an accredited institution</li>
                <li>Be a current student, recent graduate, or alumni</li>
                <li>Provide accurate and truthful information in your profile</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">3. User Conduct</h3>
              <p>You agree not to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Use the service for any unlawful purpose</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Share false or misleading information</li>
                <li>Attempt to access other users&apos; accounts</li>
                <li>Use the service for commercial solicitation without permission</li>
                <li>Scrape or collect user data without authorization</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">4. Account Security</h3>
              <p>
                You are responsible for maintaining the security of your account. We use magic link 
                authentication for enhanced security. Notify us immediately if you suspect unauthorized 
                access to your account.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">5. Content Ownership</h3>
              <p>
                You retain ownership of all content you post on Flock. By posting content, you grant 
                us a non-exclusive license to display that content to other users as part of the service.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">6. Termination</h3>
              <p>
                We reserve the right to suspend or terminate accounts that violate these terms or 
                engage in behavior harmful to other users or the platform. You may delete your 
                account at any time.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">7. Disclaimer</h3>
              <p>
                Flock is provided &quot;as is&quot; without warranties of any kind. We are not responsible 
                for user-generated content or interactions between users.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">8. Contact</h3>
              <p>
                For questions about these Terms, contact us at{' '}
                <a href="mailto:legal@flock.app" className="text-rose-400 hover:text-rose-300 transition-colors">
                  legal@flock.app
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

