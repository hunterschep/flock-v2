'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Scale, Shield, AlertTriangle, Users, Globe, Ban, CreditCard } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { ContactModal } from '@/components/ContactForm';

export default function TermsPage() {
  const [contactOpen, setContactOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[var(--color-bg)]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-5 h-5 text-white/70" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-white">Terms of Service</h1>
            <p className="text-xs text-white/40">Legal agreement</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 md:px-6 py-12">
        {/* Hero */}
        <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-2xl p-8 md:p-10 mb-8">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0">
              <FileText className="w-8 h-8 text-[var(--color-accent)]" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Terms of Service</h2>
              <p className="text-white/50">Effective Date: December 10, 2024</p>
              <p className="text-white/50 text-sm mt-1">Last Updated: December 10, 2024</p>
            </div>
          </div>
          <div className="mt-6 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <p className="text-sm text-white/60">
              These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you and Flock (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) governing your access to and use of the Flock platform, including our website, mobile applications, and API services.
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { icon: Scale, label: 'Eligibility', href: '#eligibility' },
            { icon: Users, label: 'User Conduct', href: '#conduct' },
            { icon: Globe, label: 'API Terms', href: '#api' },
            { icon: Shield, label: 'Liability', href: '#liability' },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all"
            >
              <item.icon className="w-4 h-4 text-[var(--color-accent)]" />
              <span className="text-sm text-white/70">{item.label}</span>
            </a>
          ))}
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {/* Section 1 */}
          <section id="acceptance" className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center text-sm font-bold text-[var(--color-accent)]">1</span>
              <h3 className="text-lg font-semibold text-white">Acceptance of Terms</h3>
            </div>
            <div className="p-6 space-y-4 text-white/70 text-sm leading-relaxed">
              <p>
                By creating an account, accessing, or using Flock, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you may not access or use our services.
              </p>
              <p>
                We reserve the right to modify these Terms at any time. We will provide notice of material changes by posting the updated Terms on our website and updating the &quot;Last Updated&quot; date. Your continued use of Flock after such modifications constitutes your acceptance of the revised Terms.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section id="eligibility" className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center text-sm font-bold text-[var(--color-accent)]">2</span>
              <h3 className="text-lg font-semibold text-white">Eligibility Requirements</h3>
            </div>
            <div className="p-6 space-y-4 text-white/70 text-sm leading-relaxed">
              <p>To create an account and use Flock, you must:</p>
              <ul className="space-y-3 ml-4">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] mt-2 shrink-0" />
                  <span>Be at least 18 years of age or the age of majority in your jurisdiction</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] mt-2 shrink-0" />
                  <span>Possess a valid email address from an accredited educational institution (typically ending in .edu)</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] mt-2 shrink-0" />
                  <span>Be a current student, recent graduate, or alumnus of an accredited college or university</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] mt-2 shrink-0" />
                  <span>Provide accurate, current, and complete information during registration</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] mt-2 shrink-0" />
                  <span>Have the legal capacity to enter into a binding agreement</span>
                </li>
              </ul>
              <p className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400/80">
                <strong>Note:</strong> We reserve the right to verify your eligibility at any time and may suspend or terminate accounts that do not meet these requirements.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center text-sm font-bold text-[var(--color-accent)]">3</span>
              <h3 className="text-lg font-semibold text-white">Account Registration and Security</h3>
            </div>
            <div className="p-6 space-y-4 text-white/70 text-sm leading-relaxed">
              <p>
                <strong className="text-white">3.1 Account Creation.</strong> You must provide accurate and complete information when creating your account. You agree to maintain and promptly update your account information to keep it accurate and current.
              </p>
              <p>
                <strong className="text-white">3.2 Authentication.</strong> Flock uses passwordless authentication via magic links sent to your registered email address. You are responsible for maintaining the security of your email account. Any activities conducted through your Flock account are your responsibility.
              </p>
              <p>
                <strong className="text-white">3.3 Unauthorized Access.</strong> You must immediately <button onClick={() => setContactOpen(true)} className="text-[var(--color-accent)] hover:underline">notify us</button> if you suspect any unauthorized access to or use of your account.
              </p>
              <p>
                <strong className="text-white">3.4 One Account Per Person.</strong> Each individual may maintain only one Flock account. Creating multiple accounts may result in termination of all associated accounts.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section id="conduct" className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center text-sm font-bold text-[var(--color-accent)]">4</span>
              <h3 className="text-lg font-semibold text-white">Acceptable Use and Prohibited Conduct</h3>
            </div>
            <div className="p-6 space-y-4 text-white/70 text-sm leading-relaxed">
              <p><strong className="text-white">4.1 Acceptable Use.</strong> You agree to use Flock only for lawful purposes and in accordance with these Terms. Flock is designed to facilitate professional networking among university alumni.</p>
              
              <p><strong className="text-white">4.2 Prohibited Conduct.</strong> You agree not to:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                {[
                  'Harass, abuse, threaten, or intimidate other users',
                  'Post false, misleading, or deceptive information',
                  'Impersonate any person or entity',
                  'Use the platform for unauthorized commercial purposes',
                  'Scrape, crawl, or harvest user data without authorization',
                  'Attempt to gain unauthorized access to any systems',
                  'Transmit malware, viruses, or harmful code',
                  'Interfere with or disrupt the platform\'s infrastructure',
                  'Violate any applicable laws or regulations',
                  'Circumvent any rate limits or access controls',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                    <Ban className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                    <span className="text-xs text-white/60">{item}</span>
                  </div>
                ))}
              </div>
              
              <p className="mt-4">
                <strong className="text-white">4.3 Location Data.</strong> To prevent abuse, location updates are limited to once every 30 days. Providing false location information violates these Terms and may result in account termination.
              </p>
            </div>
          </section>

          {/* Section 5 - API Terms */}
          <section id="api" className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-sm font-bold text-violet-400">5</span>
              <h3 className="text-lg font-semibold text-white">API Terms of Service</h3>
            </div>
            <div className="p-6 space-y-4 text-white/70 text-sm leading-relaxed">
              <p>
                <strong className="text-white">5.1 API Access.</strong> The Flock API is available to authorized institutional customers under separate commercial agreements. API access requires a valid API key and adherence to rate limits and usage restrictions.
              </p>
              <p>
                <strong className="text-white">5.2 Data Aggregation.</strong> All data provided through the API is aggregated and anonymized. We employ k-anonymity principles to ensure no individual user can be identified from API responses. Minimum cohort sizes of 5 are enforced for all aggregate queries.
              </p>
              <p>
                <strong className="text-white">5.3 Permitted Use.</strong> API data may only be used for:
              </p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-2 shrink-0" />
                  <span>Institutional research and reporting on alumni outcomes</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-2 shrink-0" />
                  <span>Career services dashboards and student guidance</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-2 shrink-0" />
                  <span>Accreditation and compliance reporting</span>
                </li>
              </ul>
              <p>
                <strong className="text-white">5.4 Prohibited API Use.</strong> You may not use API data to: (a) attempt to identify individual users; (b) sell or redistribute raw data; (c) make employment or admissions decisions about specific individuals; or (d) combine with other datasets to de-anonymize users.
              </p>
              <p>
                <strong className="text-white">5.5 Rate Limits.</strong> API usage is subject to rate limits based on your subscription tier. Exceeding rate limits may result in temporary suspension of API access.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center text-sm font-bold text-[var(--color-accent)]">6</span>
              <h3 className="text-lg font-semibold text-white">Intellectual Property Rights</h3>
            </div>
            <div className="p-6 space-y-4 text-white/70 text-sm leading-relaxed">
              <p>
                <strong className="text-white">6.1 Flock&apos;s Rights.</strong> The Flock platform, including all software, designs, text, graphics, logos, and other content, is owned by Flock, Inc. and protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works without our express written permission.
              </p>
              <p>
                <strong className="text-white">6.2 Your Content.</strong> You retain ownership of content you submit to Flock. By posting content, you grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content solely for the purpose of operating and providing the Flock service.
              </p>
              <p>
                <strong className="text-white">6.3 Feedback.</strong> Any feedback, suggestions, or ideas you provide about Flock may be used by us without any obligation to compensate you.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center text-sm font-bold text-[var(--color-accent)]">7</span>
              <h3 className="text-lg font-semibold text-white">Messaging and Communications</h3>
            </div>
            <div className="p-6 space-y-4 text-white/70 text-sm leading-relaxed">
              <p>
                <strong className="text-white">7.1 Direct Messages.</strong> Flock provides real-time messaging functionality to facilitate connections between alumni. You are solely responsible for the content of messages you send.
              </p>
              <p>
                <strong className="text-white">7.2 Message Retention.</strong> Messages are stored to provide service functionality. You may delete your messages; however, copies may remain in recipients&apos; accounts. Deleted messages may be retained in backups for a limited period.
              </p>
              <p>
                <strong className="text-white">7.3 Prohibited Communications.</strong> You may not use Flock&apos;s messaging system for spam, solicitation, harassment, or any communication that violates these Terms.
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section id="fees" className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-emerald-400" />
              </span>
              <h3 className="text-lg font-semibold text-white">Fees and Payments</h3>
            </div>
            <div className="p-6 space-y-4 text-white/70 text-sm leading-relaxed">
              <p>
                <strong className="text-white">8.1 Free Services.</strong> Basic access to Flock is provided free of charge to eligible users with a valid .edu email address.
              </p>
              <p>
                <strong className="text-white">8.2 Premium Features.</strong> We may offer premium features or services for a fee. Any fees will be clearly disclosed before you purchase, and purchases are subject to additional terms provided at the time of purchase.
              </p>
              <p>
                <strong className="text-white">8.3 API Pricing.</strong> Institutional API access is available for free with standard rate limits. For higher limits or custom features, <button onClick={() => setContactOpen(true)} className="text-[var(--color-accent)] hover:underline">contact us</button>.
              </p>
            </div>
          </section>

          {/* Section 9 */}
          <section className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center text-sm font-bold text-[var(--color-accent)]">9</span>
              <h3 className="text-lg font-semibold text-white">Termination</h3>
            </div>
            <div className="p-6 space-y-4 text-white/70 text-sm leading-relaxed">
              <p>
                <strong className="text-white">9.1 Termination by You.</strong> You may delete your account at any time through your account settings. Upon deletion, your profile information will be removed from the platform, though aggregated, anonymized data may persist.
              </p>
              <p>
                <strong className="text-white">9.2 Termination by Flock.</strong> We may suspend or terminate your account at any time, with or without notice, for conduct that we believe violates these Terms, is harmful to other users, or is harmful to Flock&apos;s business interests.
              </p>
              <p>
                <strong className="text-white">9.3 Effect of Termination.</strong> Upon termination, your right to use Flock ceases immediately. Sections of these Terms that by their nature should survive termination will remain in effect.
              </p>
            </div>
          </section>

          {/* Section 10 */}
          <section id="liability" className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </span>
              <h3 className="text-lg font-semibold text-white">Disclaimers and Limitation of Liability</h3>
            </div>
            <div className="p-6 space-y-4 text-white/70 text-sm leading-relaxed">
              <p>
                <strong className="text-white">10.1 Disclaimer of Warranties.</strong> FLOCK IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
              </p>
              <p>
                <strong className="text-white">10.2 User Interactions.</strong> We are not responsible for the conduct of users or the content of communications between users. You interact with other users at your own risk.
              </p>
              <p>
                <strong className="text-white">10.3 Limitation of Liability.</strong> TO THE MAXIMUM EXTENT PERMITTED BY LAW, FLOCK SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY SHALL NOT EXCEED THE GREATER OF (A) $100 OR (B) THE AMOUNTS PAID BY YOU TO FLOCK IN THE TWELVE MONTHS PRECEDING THE CLAIM.
              </p>
            </div>
          </section>

          {/* Section 11 */}
          <section className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center text-sm font-bold text-[var(--color-accent)]">11</span>
              <h3 className="text-lg font-semibold text-white">Indemnification</h3>
            </div>
            <div className="p-6 space-y-4 text-white/70 text-sm leading-relaxed">
              <p>
                You agree to indemnify, defend, and hold harmless Flock, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including attorneys&apos; fees) arising from: (a) your use of Flock; (b) your violation of these Terms; (c) your violation of any third-party rights; or (d) your content.
              </p>
            </div>
          </section>

          {/* Section 12 */}
          <section className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center text-sm font-bold text-[var(--color-accent)]">12</span>
              <h3 className="text-lg font-semibold text-white">Dispute Resolution</h3>
            </div>
            <div className="p-6 space-y-4 text-white/70 text-sm leading-relaxed">
              <p>
                <strong className="text-white">12.1 Governing Law.</strong> These Terms are governed by the laws of the State of Delaware, without regard to conflict of law principles.
              </p>
              <p>
                <strong className="text-white">12.2 Arbitration.</strong> Any dispute arising from these Terms or your use of Flock shall be resolved through binding arbitration administered by the American Arbitration Association in accordance with its Commercial Arbitration Rules. The arbitration shall take place in Delaware, and judgment on the award may be entered in any court of competent jurisdiction.
              </p>
              <p>
                <strong className="text-white">12.3 Class Action Waiver.</strong> You agree that any dispute resolution proceedings will be conducted only on an individual basis and not in a class, consolidated, or representative action.
              </p>
            </div>
          </section>

          {/* Section 13 */}
          <section className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center text-sm font-bold text-[var(--color-accent)]">13</span>
              <h3 className="text-lg font-semibold text-white">General Provisions</h3>
            </div>
            <div className="p-6 space-y-4 text-white/70 text-sm leading-relaxed">
              <p>
                <strong className="text-white">13.1 Entire Agreement.</strong> These Terms, together with our Privacy Policy, constitute the entire agreement between you and Flock regarding your use of the service.
              </p>
              <p>
                <strong className="text-white">13.2 Severability.</strong> If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in effect.
              </p>
              <p>
                <strong className="text-white">13.3 No Waiver.</strong> Our failure to enforce any right or provision of these Terms will not be deemed a waiver of such right or provision.
              </p>
              <p>
                <strong className="text-white">13.4 Assignment.</strong> You may not assign or transfer your rights under these Terms without our prior written consent. We may assign our rights without restriction.
              </p>
            </div>
          </section>

          {/* Contact Section */}
          <section className="bg-gradient-to-br from-[var(--color-accent)]/10 to-transparent border border-[var(--color-accent)]/20 rounded-2xl p-8 text-center">
            <h3 className="text-xl font-semibold text-white mb-3">Questions About These Terms?</h3>
            <p className="text-white/60 mb-6 max-w-lg mx-auto">
              If you have any questions about these Terms of Service, please don&apos;t hesitate to reach out.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setContactOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-accent)] text-white text-sm font-semibold hover:bg-[var(--color-accent)]/90 transition-all"
              >
                Contact Us
              </button>
              <Link
                href="/privacy"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white/80 text-sm font-medium hover:bg-white/[0.08] transition-all"
              >
                View Privacy Policy
              </Link>
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
