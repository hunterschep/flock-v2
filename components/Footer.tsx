'use client';

import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="relative z-10 border-t border-white/[0.06] bg-[var(--color-bg)]">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-[var(--color-accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 14c2-2 4-3 6-2M5 17c2-2 4-3 6-2" strokeLinecap="round" />
                  <path d="M13 10c3-3 5-4 8-3M12 14c3-3 5-4 8-3" strokeLinecap="round" />
                </svg>
              </div>
              <span className="text-base md:text-lg font-semibold text-white">Flock</span>
            </div>
            <p className="text-white/50 text-xs md:text-sm max-w-xs mb-4 md:mb-5 leading-relaxed hidden md:block">
              Connect with alumni from your university. Discover who&apos;s in your city. Build meaningful professional relationships.
            </p>
            <div className="flex items-center gap-2">
              <a
                href="https://twitter.com/flockapp"
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 md:p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/10 transition-all"
                aria-label="Twitter"
              >
                <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a
                href="https://linkedin.com/company/flock"
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 md:p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/10 transition-all"
                aria-label="LinkedIn"
              >
                <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"/>
                </svg>
              </a>
            </div>
          </div>
          
          {/* Product Links */}
          <div>
            <h3 className="text-[10px] md:text-xs font-medium text-white/70 mb-2 md:mb-4 uppercase tracking-wider">Product</h3>
            <ul className="space-y-2 md:space-y-3">
              <li>
                <Link href="/dashboard" className="text-white/50 hover:text-white text-xs md:text-sm transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/messages" className="text-white/50 hover:text-white text-xs md:text-sm transition-colors">
                  Messages
                </Link>
              </li>
              <li>
                <Link href="/profile/edit" className="text-white/50 hover:text-white text-xs md:text-sm transition-colors">
                  Profile
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Legal Links */}
          <div>
            <h3 className="text-[10px] md:text-xs font-medium text-white/70 mb-2 md:mb-4 uppercase tracking-wider">Legal</h3>
            <ul className="space-y-2 md:space-y-3">
              <li>
                <Link href="/privacy" className="text-white/50 hover:text-white text-xs md:text-sm transition-colors">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-white/50 hover:text-white text-xs md:text-sm transition-colors">
                  Terms
                </Link>
              </li>
              <li>
                <a href="mailto:support@flock.app" className="text-white/50 hover:text-white text-xs md:text-sm transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom bar */}
        <div className="mt-6 md:mt-10 pt-4 md:pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-2 md:gap-4">
          <p className="text-white/30 text-xs md:text-sm">
            © {currentYear} Flock
          </p>
          <div className="flex items-center gap-1.5 md:gap-2 text-white/30 text-xs md:text-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}
