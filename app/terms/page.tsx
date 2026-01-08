'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Mail } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { ContactModal } from '@/components/ContactForm';

export default function TermsPage() {
  const [contactOpen, setContactOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[var(--color-bg)]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-white/70" />
          </Link>
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-[var(--color-accent)]" />
            <h1 className="text-lg font-semibold text-white">Terms of Service</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-3xl mx-auto px-4 md:px-6 py-12">
        <div className="mb-8">
          <p className="text-white/40 text-sm">Last Updated: December 10, 2024</p>
        </div>

        <div className="prose prose-invert prose-sm max-w-none space-y-8">
          {/* Introduction */}
          <p className="text-white/70 leading-relaxed">
            These Terms of Service govern your use of Flock, an alumni networking platform. By using Flock, you agree to these terms.
          </p>

          {/* Eligibility */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">Eligibility</h2>
            <p className="text-white/70">
              To use Flock, you must be at least 18 years old and have a valid .edu email address from an accredited college or university. You must be a current student, recent graduate, or alumnus.
            </p>
          </section>

          {/* Your Account */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">Your Account</h2>
            <div className="text-white/70 space-y-3">
              <p>You&apos;re responsible for maintaining accurate profile information and for all activity under your account.</p>
              <p>We use passwordless authentication via magic links to your email. Keep your email account secure.</p>
              <p>One account per person. Creating multiple accounts may result in termination.</p>
            </div>
          </section>

          {/* Acceptable Use */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">Acceptable Use</h2>
            <p className="text-white/70 mb-3">Flock is for professional alumni networking. You agree not to:</p>
            <ul className="text-white/70 space-y-1 list-disc list-inside">
              <li>Harass, abuse, or threaten other users</li>
              <li>Post false or misleading information</li>
              <li>Scrape or harvest user data</li>
              <li>Use the platform for spam or unauthorized solicitation</li>
              <li>Attempt to circumvent security measures</li>
              <li>Violate any applicable laws</li>
            </ul>
            <p className="text-white/70 mt-3">
              Location updates are limited to once every 30 days to prevent abuse.
            </p>
          </section>

          {/* API Terms */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">API Access</h2>
            <div className="text-white/70 space-y-3">
              <p>The Flock API provides aggregated, anonymized alumni statistics to authorized customers. All API data uses k-anonymity (minimum 5 users per data point) to prevent individual identification.</p>
              <p>API users may not attempt to de-anonymize users, sell raw data, or use data for decisions about specific individuals.</p>
            </div>
          </section>

          {/* Content */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">Your Content</h2>
            <p className="text-white/70">
              You retain ownership of content you post. By using Flock, you grant us a license to display your profile and messages to other users as part of the service.
            </p>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">Termination</h2>
            <p className="text-white/70">
              You can delete your account anytime. We may suspend or terminate accounts that violate these terms.
            </p>
          </section>

          {/* Disclaimers */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">Disclaimers</h2>
            <div className="text-white/70 space-y-3">
              <p>Flock is provided &quot;as is&quot; without warranties. We don&apos;t guarantee uninterrupted service.</p>
              <p>We&apos;re not responsible for user interactions or content. Use caution when connecting with others.</p>
              <p>Our liability is limited to $100 or amounts you&apos;ve paid us, whichever is greater.</p>
            </div>
          </section>

          {/* Legal */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">Legal</h2>
            <div className="text-white/70 space-y-3">
              <p><strong className="text-white">Governing Law:</strong> These terms are governed by Delaware law.</p>
              <p><strong className="text-white">Disputes:</strong> Disputes will be resolved through binding arbitration on an individual basis (no class actions).</p>
              <p><strong className="text-white">Changes:</strong> We may update these terms. Continued use after changes constitutes acceptance.</p>
            </div>
          </section>

          {/* Contact */}
          <section className="pt-8 border-t border-white/[0.06]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Questions?</h2>
                <p className="text-white/50 text-sm">Contact us about these terms.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setContactOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/[0.05] border border-white/[0.1] text-white text-sm font-medium hover:bg-white/[0.08] transition-all"
                >
                  <Mail className="w-4 h-4" />
                  Contact Us
                </button>
                <Link
                  href="/privacy"
                  className="inline-flex items-center px-5 py-2.5 rounded-lg text-white/60 text-sm font-medium hover:text-white transition-all"
                >
                  Privacy Policy →
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
      
      <Footer />
      
      <ContactModal 
        isOpen={contactOpen}
        onClose={() => setContactOpen(false)}
        subject="Terms Inquiry"
        title="Contact Us"
      />
    </div>
  );
}
