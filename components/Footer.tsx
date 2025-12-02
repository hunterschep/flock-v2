'use client';

import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="glass-header border-t border-white/10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/30 to-pink-500/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 14c2-2 4-3 6-2M5 17c2-2 4-3 6-2" strokeLinecap="round" />
                  <path d="M13 10c3-3 5-4 8-3M12 14c3-3 5-4 8-3" strokeLinecap="round" />
                </svg>
              </div>
              <span className="text-xl font-bold text-white">Flock</span>
            </div>
            <p className="text-white/60 text-sm max-w-sm mb-4">
              Connect with alumni from your university. Discover who&apos;s in your city. Build meaningful professional relationships.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://twitter.com/flockapp"
                target="_blank"
                rel="noopener noreferrer"
                className="glass-light p-2 rounded-lg hover:bg-white/20 transition-all"
                aria-label="Twitter"
              >
                <svg className="w-5 h-5 text-white/70" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a
                href="https://linkedin.com/company/flock"
                target="_blank"
                rel="noopener noreferrer"
                className="glass-light p-2 rounded-lg hover:bg-white/20 transition-all"
                aria-label="LinkedIn"
              >
                <svg className="w-5 h-5 text-white/70" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"/>
                </svg>
              </a>
            </div>
          </div>
          
          {/* Product Links */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Product</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/dashboard" className="text-white/60 hover:text-white text-sm transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/messages" className="text-white/60 hover:text-white text-sm transition-colors">
                  Messages
                </Link>
              </li>
              <li>
                <Link href="/profile/edit" className="text-white/60 hover:text-white text-sm transition-colors">
                  Profile
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Legal Links */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/privacy" className="text-white/60 hover:text-white text-sm transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-white/60 hover:text-white text-sm transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <a href="mailto:support@flock.app" className="text-white/60 hover:text-white text-sm transition-colors">
                  Contact Support
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom bar */}
        <div className="mt-8 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-sm">
            © {currentYear} Flock. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-white/40 text-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}

