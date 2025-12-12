import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Shield, Database, Eye, Lock, Share2, Globe, Server, UserCheck, Bell, Mail } from 'lucide-react';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Flock Privacy Policy - Learn how we collect, use, protect, and share your personal information.',
};

export default function PrivacyPage() {
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
            <h1 className="text-lg font-semibold text-white">Privacy Policy</h1>
            <p className="text-xs text-white/40">Data protection & privacy</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 md:px-6 py-12">
        {/* Hero */}
        <div className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-2xl p-8 md:p-10 mb-8">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center shrink-0">
              <Shield className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Privacy Policy</h2>
              <p className="text-white/50">Effective Date: December 10, 2024</p>
              <p className="text-white/50 text-sm mt-1">Last Updated: December 10, 2024</p>
            </div>
          </div>
          <div className="mt-6 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <p className="text-sm text-white/60">
              At Flock, we take your privacy seriously. This Privacy Policy explains how Flock, Inc. (&quot;Flock,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) collects, uses, discloses, and protects your personal information when you use our platform and services.
            </p>
          </div>
        </div>

        {/* Privacy Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { icon: Lock, title: 'Encrypted Data', desc: 'All data encrypted in transit and at rest' },
            { icon: Eye, title: 'No Selling Data', desc: 'We never sell your personal information' },
            { icon: UserCheck, title: 'You Control', desc: 'Full control over your data and visibility' },
          ].map((item) => (
            <div key={item.title} className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <item.icon className="w-8 h-8 text-emerald-400 mb-3" />
              <h3 className="font-semibold text-white text-sm mb-1">{item.title}</h3>
              <p className="text-xs text-white/50">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Table of Contents */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 mb-8">
          <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Contents</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { num: '1', title: 'Information We Collect', href: '#collect' },
              { num: '2', title: 'How We Use Your Information', href: '#use' },
              { num: '3', title: 'Information Sharing', href: '#sharing' },
              { num: '4', title: 'API & Aggregated Data', href: '#api' },
              { num: '5', title: 'Data Security', href: '#security' },
              { num: '6', title: 'Data Retention', href: '#retention' },
              { num: '7', title: 'Your Privacy Rights', href: '#rights' },
              { num: '8', title: 'Cookies & Tracking', href: '#cookies' },
              { num: '9', title: 'International Transfers', href: '#international' },
              { num: '10', title: 'Children\'s Privacy', href: '#children' },
              { num: '11', title: 'Changes to Policy', href: '#changes' },
              { num: '12', title: 'Contact Us', href: '#contact' },
            ].map((item) => (
              <a
                key={item.num}
                href={item.href}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.03] transition-all group"
              >
                <span className="w-6 h-6 rounded-md bg-[var(--color-accent)]/10 flex items-center justify-center text-xs font-bold text-[var(--color-accent)]">{item.num}</span>
                <span className="text-sm text-white/60 group-hover:text-white transition-colors">{item.title}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {/* Section 1 */}
          <section id="collect" className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Database className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">1. Information We Collect</h3>
                <p className="text-xs text-white/40">Data categories and sources</p>
              </div>
            </div>
            <div className="p-6 space-y-6 text-white/70 text-sm leading-relaxed">
              <div>
                <h4 className="text-white font-medium mb-3">1.1 Information You Provide Directly</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { label: 'Account Information', items: 'Full name, .edu email address, personal email (optional), graduation year' },
                    { label: 'Profile Information', items: 'Current status (employed/student/etc.), employer, job title, grad school, program, degree' },
                    { label: 'Location Data', items: 'City, state, country, latitude/longitude coordinates (from search selection)' },
                    { label: 'Social Links', items: 'LinkedIn URL, Twitter/X URL, personal website, Instagram handle' },
                    { label: 'Preferences', items: 'Roommate status, privacy settings, notification preferences' },
                    { label: 'Communications', items: 'Direct messages to other users, support inquiries' },
                  ].map((item) => (
                    <div key={item.label} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <h5 className="text-white text-xs font-semibold mb-2">{item.label}</h5>
                      <p className="text-xs text-white/50">{item.items}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-white font-medium mb-3">1.2 Information Collected Automatically</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                    <span><strong className="text-white">Device Information:</strong> Browser type, operating system, device identifiers</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                    <span><strong className="text-white">Usage Data:</strong> Pages visited, features used, search queries, session duration</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                    <span><strong className="text-white">Log Data:</strong> IP address, access times, referring URLs, error logs</span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-medium mb-3">1.3 Information from Third Parties</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                    <span><strong className="text-white">Authentication:</strong> We receive your email address from Supabase Auth when you sign in via magic link</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                    <span><strong className="text-white">Geocoding:</strong> We use OpenStreetMap Nominatim to convert your location search to coordinates</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section id="use" className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Eye className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">2. How We Use Your Information</h3>
                <p className="text-xs text-white/40">Purposes and legal bases</p>
              </div>
            </div>
            <div className="p-6 space-y-4 text-white/70 text-sm leading-relaxed">
              <p>We use your personal information for the following purposes:</p>
              
              <div className="space-y-3">
                {[
                  { title: 'Provide and Operate Services', desc: 'To create and maintain your account, display your profile to other users, enable messaging, and show you on the alumni map' },
                  { title: 'Network Matching', desc: 'To connect you with alumni from your institution and people within 50 miles of your location' },
                  { title: 'Communication', desc: 'To send you service-related notifications, respond to inquiries, and provide customer support' },
                  { title: 'Analytics & Improvement', desc: 'To analyze usage patterns, improve our services, and develop new features' },
                  { title: 'Safety & Security', desc: 'To detect, prevent, and address fraud, abuse, and security issues' },
                  { title: 'Legal Compliance', desc: 'To comply with applicable laws, regulations, and legal processes' },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02]">
                    <div className="w-2 h-2 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                    <div>
                      <h5 className="text-white font-medium text-sm">{item.title}</h5>
                      <p className="text-xs text-white/50 mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <h5 className="text-emerald-400 font-medium text-sm mb-2">Legal Basis (GDPR)</h5>
                <p className="text-xs text-emerald-400/70">
                  We process your data based on: (a) your consent; (b) performance of our contract with you; (c) our legitimate interests in operating and improving our services; and (d) compliance with legal obligations.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section id="sharing" className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Share2 className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">3. Information Sharing</h3>
                <p className="text-xs text-white/40">Who we share data with</p>
              </div>
            </div>
            <div className="p-6 space-y-4 text-white/70 text-sm leading-relaxed">
              <h4 className="text-white font-medium">3.1 Profile Visibility to Other Users</h4>
              <p>Your profile information is visible to other verified Flock users who meet one of these criteria:</p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                  <span>Users from your same institution (verified by .edu domain)</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                  <span>Users within 50 miles of your location</span>
                </li>
              </ul>

              <div className="mt-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <h5 className="text-white font-medium text-sm mb-2">What&apos;s Visible vs. Hidden</h5>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="text-xs text-emerald-400 font-medium mb-2">✓ Visible to Others</p>
                    <ul className="text-xs text-white/50 space-y-1">
                      <li>• Name, graduation year</li>
                      <li>• City and state (not exact address)</li>
                      <li>• Job title, employer (if enabled)</li>
                      <li>• Grad school, program (if enabled)</li>
                      <li>• Social links you provide</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs text-red-400 font-medium mb-2">✗ Never Shared</p>
                    <ul className="text-xs text-white/50 space-y-1">
                      <li>• Exact coordinates (lat/lng)</li>
                      <li>• Email addresses</li>
                      <li>• IP address</li>
                      <li>• Device information</li>
                      <li>• Usage analytics</li>
                    </ul>
                  </div>
                </div>
              </div>

              <h4 className="text-white font-medium mt-6">3.2 Service Providers</h4>
              <p>We share information with trusted third-party service providers who assist us in operating our platform:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                {[
                  { name: 'Supabase', purpose: 'Database, authentication, real-time messaging' },
                  { name: 'Vercel', purpose: 'Website hosting and deployment' },
                  { name: 'OpenStreetMap', purpose: 'Location geocoding (city search only)' },
                  { name: 'Stadia Maps', purpose: 'Map tile rendering' },
                ].map((provider) => (
                  <div key={provider.name} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                    <p className="text-white text-xs font-medium">{provider.name}</p>
                    <p className="text-xs text-white/40">{provider.purpose}</p>
                  </div>
                ))}
              </div>

              <h4 className="text-white font-medium mt-6">3.3 Legal Requirements</h4>
              <p>We may disclose your information if required by law, legal process, or government request, or to protect the rights, property, or safety of Flock, our users, or the public.</p>

              <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <h5 className="text-red-400 font-medium text-sm mb-2">We Never Sell Your Data</h5>
                <p className="text-xs text-red-400/70">
                  Flock does not sell, rent, or trade your personal information to third parties for marketing purposes. Ever.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4 - API */}
          <section id="api" className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center">
                <Server className="w-5 h-5 text-[var(--color-accent)]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">4. API & Aggregated Data</h3>
                <p className="text-xs text-white/40">Institutional data access</p>
              </div>
            </div>
            <div className="p-6 space-y-4 text-white/70 text-sm leading-relaxed">
              <p>
                <strong className="text-white">4.1 Flock API.</strong> We offer an API to authorized institutional customers (universities, career services offices) that provides access to aggregated, anonymized alumni data.
              </p>

              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <h5 className="text-emerald-400 font-medium text-sm mb-3">Privacy Protections in API Data</h5>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-xs text-emerald-400/80">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <span><strong>K-Anonymity:</strong> All data is aggregated with a minimum cohort size of 5 users to prevent individual identification</span>
                  </li>
                  <li className="flex items-start gap-2 text-xs text-emerald-400/80">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <span><strong>No Personal Identifiers:</strong> API responses never include names, emails, or exact locations</span>
                  </li>
                  <li className="flex items-start gap-2 text-xs text-emerald-400/80">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <span><strong>Statistical Only:</strong> Data is provided as counts, percentages, and distributions</span>
                  </li>
                </ul>
              </div>

              <p>
                <strong className="text-white">4.2 Example API Data.</strong> The API may provide aggregated data such as:
              </p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] mt-2 shrink-0" />
                  <span>Geographic distribution: &quot;42 alumni in New York, NY&quot;</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] mt-2 shrink-0" />
                  <span>Employment statistics: &quot;Top 10 employers of your alumni&quot;</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] mt-2 shrink-0" />
                  <span>Education outcomes: &quot;15% pursuing graduate degrees&quot;</span>
                </li>
              </ul>

              <p>
                <strong className="text-white">4.3 Opt-Out.</strong> You cannot opt out of having your data included in aggregate statistics, as this data is anonymized and cannot be traced back to you. However, you can delete your account to remove your data from future aggregations.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section id="security" className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Lock className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">5. Data Security</h3>
                <p className="text-xs text-white/40">How we protect your data</p>
              </div>
            </div>
            <div className="p-6 space-y-4 text-white/70 text-sm leading-relaxed">
              <p>We implement industry-standard security measures to protect your personal information:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { icon: Lock, title: 'Encryption in Transit', desc: 'All data transmitted over TLS 1.3 encryption' },
                  { icon: Database, title: 'Encryption at Rest', desc: 'Database encrypted with AES-256' },
                  { icon: Shield, title: 'Access Controls', desc: 'Role-based access, Row Level Security (RLS)' },
                  { icon: Server, title: 'Infrastructure', desc: 'SOC 2 compliant hosting (Supabase, Vercel)' },
                ].map((item) => (
                  <div key={item.title} className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-start gap-3">
                    <item.icon className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-white font-medium text-sm">{item.title}</h5>
                      <p className="text-xs text-white/50 mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-4">
                While we implement robust security measures, no system is 100% secure. We encourage you to use strong, unique passwords for your email account (which is used for authentication) and to notify us immediately if you suspect any unauthorized access.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section id="retention" className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Database className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">6. Data Retention</h3>
                <p className="text-xs text-white/40">How long we keep your data</p>
              </div>
            </div>
            <div className="p-6 space-y-4 text-white/70 text-sm leading-relaxed">
              <p>
                <strong className="text-white">6.1 Active Accounts.</strong> We retain your personal information for as long as your account is active and as needed to provide you with our services.
              </p>
              <p>
                <strong className="text-white">6.2 Deleted Accounts.</strong> When you delete your account:
              </p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                  <span>Your profile is immediately removed from the platform</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                  <span>Your messages may remain visible to recipients</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                  <span>Backup copies may persist for up to 30 days</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                  <span>Aggregated, anonymized data may persist indefinitely</span>
                </li>
              </ul>
              <p>
                <strong className="text-white">6.3 Legal Requirements.</strong> We may retain certain information as required by law or for legitimate business purposes (e.g., fraud prevention, legal disputes).
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section id="rights" className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">7. Your Privacy Rights</h3>
                <p className="text-xs text-white/40">Control over your data</p>
              </div>
            </div>
            <div className="p-6 space-y-4 text-white/70 text-sm leading-relaxed">
              <p>Depending on your location, you may have the following rights regarding your personal information:</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { right: 'Access', desc: 'Request a copy of your personal data' },
                  { right: 'Correction', desc: 'Update inaccurate or incomplete data' },
                  { right: 'Deletion', desc: 'Request deletion of your account and data' },
                  { right: 'Portability', desc: 'Export your data in a machine-readable format' },
                  { right: 'Restriction', desc: 'Limit how we process your data' },
                  { right: 'Objection', desc: 'Object to certain processing activities' },
                ].map((item) => (
                  <div key={item.right} className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/10">
                    <h5 className="text-violet-400 font-medium text-sm">{item.right}</h5>
                    <p className="text-xs text-white/50 mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>

              <p className="mt-4">
                <strong className="text-white">How to Exercise Your Rights:</strong> You can access and update most of your information directly through your account settings. For other requests, contact us at <a href="mailto:privacy@flock.app" className="text-[var(--color-accent)] hover:underline">privacy@flock.app</a>.
              </p>

              <div className="mt-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <h5 className="text-white font-medium text-sm mb-2">California Residents (CCPA)</h5>
                <p className="text-xs text-white/50">
                  California residents have additional rights under the CCPA, including the right to know what personal information we collect and the right to opt-out of the sale of personal information. We do not sell personal information.
                </p>
              </div>
            </div>
          </section>

          {/* Section 8 */}
          <section id="cookies" className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Globe className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">8. Cookies & Tracking Technologies</h3>
                <p className="text-xs text-white/40">How we use browser storage</p>
              </div>
            </div>
            <div className="p-6 space-y-4 text-white/70 text-sm leading-relaxed">
              <p>
                <strong className="text-white">8.1 Essential Cookies.</strong> We use essential cookies to maintain your session and authentication state. These are necessary for the platform to function and cannot be disabled.
              </p>
              <p>
                <strong className="text-white">8.2 Local Storage.</strong> We use browser local storage to cache certain preferences and improve performance. This data stays on your device.
              </p>
              <p>
                <strong className="text-white">8.3 Analytics.</strong> We may use privacy-focused analytics to understand how users interact with our platform. We do not use third-party tracking pixels or advertising cookies.
              </p>
            </div>
          </section>

          {/* Section 9 */}
          <section id="international" className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Globe className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">9. International Data Transfers</h3>
                <p className="text-xs text-white/40">Cross-border data flows</p>
              </div>
            </div>
            <div className="p-6 space-y-4 text-white/70 text-sm leading-relaxed">
              <p>
                Flock is based in the United States, and your information is processed and stored in the United States. If you are accessing Flock from outside the United States, please be aware that your information will be transferred to, stored, and processed in the United States, where data protection laws may differ from those in your country.
              </p>
              <p>
                By using Flock, you consent to this transfer. We implement appropriate safeguards to ensure your data is protected in accordance with this Privacy Policy.
              </p>
            </div>
          </section>

          {/* Section 10 */}
          <section id="children" className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">10. Children&apos;s Privacy</h3>
                <p className="text-xs text-white/40">Age restrictions</p>
              </div>
            </div>
            <div className="p-6 space-y-4 text-white/70 text-sm leading-relaxed">
              <p>
                Flock is not intended for users under the age of 18. We do not knowingly collect personal information from children. If we learn that we have collected personal information from a child under 18, we will take steps to delete that information as quickly as possible.
              </p>
              <p>
                If you believe a child has provided us with personal information, please contact us at <a href="mailto:privacy@flock.app" className="text-[var(--color-accent)] hover:underline">privacy@flock.app</a>.
              </p>
            </div>
          </section>

          {/* Section 11 */}
          <section id="changes" className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">11. Changes to This Policy</h3>
                <p className="text-xs text-white/40">Policy updates</p>
              </div>
            </div>
            <div className="p-6 space-y-4 text-white/70 text-sm leading-relaxed">
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the &quot;Last Updated&quot; date at the top.
              </p>
              <p>
                For significant changes, we may also send you a notification via email or through the platform. Your continued use of Flock after any changes indicates your acceptance of the updated Privacy Policy.
              </p>
            </div>
          </section>

          {/* Section 12 - Contact */}
          <section id="contact" className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-2xl p-8 text-center">
            <Mail className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-3">Contact Us About Privacy</h3>
            <p className="text-white/60 mb-6 max-w-lg mx-auto">
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact our Privacy Team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:privacy@flock.app"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-all"
              >
                <Mail className="w-4 h-4" />
                privacy@flock.app
              </a>
              <Link
                href="/terms"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white/80 text-sm font-medium hover:bg-white/[0.08] transition-all"
              >
                View Terms of Service
              </Link>
            </div>
            <p className="text-xs text-white/30 mt-6">
              Flock, Inc. • Delaware, USA
            </p>
          </section>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
