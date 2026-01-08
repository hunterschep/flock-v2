'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Mail } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { ContactModal } from '@/components/ContactForm';

export default function PrivacyPage() {
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
            <Shield className="w-5 h-5 text-emerald-400" />
            <h1 className="text-lg font-semibold text-white">Privacy Policy</h1>
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
            Flock (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information when you use our alumni networking platform.
          </p>

          {/* What We Collect */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">What We Collect</h2>
            <div className="text-white/70 space-y-3">
              <p><strong className="text-white">Account Information:</strong> Name, .edu email, graduation year, and institution.</p>
              <p><strong className="text-white">Profile Information:</strong> Employment status, employer, job title, graduate school, location (city/state), and social links you choose to add.</p>
              <p><strong className="text-white">Usage Data:</strong> Pages visited, features used, and session information for service improvement.</p>
              <p><strong className="text-white">Messages:</strong> Direct messages you send to other users through our platform.</p>
            </div>
          </section>

          {/* How We Use It */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">How We Use Your Information</h2>
            <ul className="text-white/70 space-y-2 list-disc list-inside">
              <li>Display your profile to verified alumni from your institution and nearby users</li>
              <li>Enable messaging between users</li>
              <li>Show aggregated alumni data on the map and analytics</li>
              <li>Improve and maintain the platform</li>
              <li>Respond to your inquiries</li>
            </ul>
          </section>

          {/* What We Share */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">What We Share</h2>
            <div className="text-white/70 space-y-3">
              <p><strong className="text-white">With Other Users:</strong> Your name, city/state, graduation year, and profile details you provide are visible to verified users from your institution or within 50 miles of you.</p>
              <p><strong className="text-white">Never Shared:</strong> Your email address, exact coordinates, and IP address are never shared with other users.</p>
              <p><strong className="text-white">Service Providers:</strong> We use Supabase (database/auth), Vercel (hosting), and Carto (maps) to operate the platform.</p>
              <p><strong className="text-white">API Data:</strong> Our institutional API provides only aggregated, anonymized statistics (e.g., &quot;45 alumni in New York&quot;). Individual users cannot be identified.</p>
            </div>
            <div className="mt-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-sm text-emerald-400">
                <strong>We never sell your personal data.</strong>
              </p>
            </div>
          </section>

          {/* Security */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">Security</h2>
            <p className="text-white/70">
              Your data is encrypted in transit (TLS) and at rest. We use row-level security to ensure users only access data they&apos;re authorized to see. Our infrastructure is hosted on SOC 2 compliant platforms.
            </p>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">Your Rights</h2>
            <ul className="text-white/70 space-y-2 list-disc list-inside">
              <li><strong className="text-white">Access & Update:</strong> Edit your profile anytime in account settings</li>
              <li><strong className="text-white">Delete:</strong> Delete your account to remove your data from the platform</li>
              <li><strong className="text-white">Export:</strong> Request a copy of your data by contacting us</li>
            </ul>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">Cookies</h2>
            <p className="text-white/70">
              We use essential cookies for authentication and session management. We do not use advertising or third-party tracking cookies.
            </p>
          </section>

          {/* Children */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">Age Requirement</h2>
            <p className="text-white/70">
              Flock is for users 18 and older. We do not knowingly collect data from minors.
            </p>
          </section>

          {/* Updates */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">Policy Updates</h2>
            <p className="text-white/70">
              We may update this policy occasionally. Material changes will be posted here with an updated date.
            </p>
          </section>

          {/* Contact */}
          <section className="pt-8 border-t border-white/[0.06]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Questions?</h2>
                <p className="text-white/50 text-sm">Contact us about privacy concerns.</p>
              </div>
              <button
                onClick={() => setContactOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/[0.05] border border-white/[0.1] text-white text-sm font-medium hover:bg-white/[0.08] transition-all"
              >
                <Mail className="w-4 h-4" />
                Contact Us
              </button>
            </div>
          </section>
        </div>
      </main>
      
      <Footer />
      
      <ContactModal 
        isOpen={contactOpen}
        onClose={() => setContactOpen(false)}
        subject="Privacy Inquiry"
        title="Privacy Inquiry"
      />
    </div>
  );
}
