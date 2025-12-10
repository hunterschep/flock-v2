'use client';

import Link from 'next/link';
import { Home, ArrowLeft, MapPin } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4">
      <div className="glass-strong rounded-2xl p-8 md:p-12 text-center max-w-md">
        {/* 404 Number */}
        <div className="mb-6">
          <span className="text-7xl md:text-8xl font-bold text-[var(--color-accent)]">
            404
          </span>
        </div>
        
        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[var(--color-accent)]/10 flex items-center justify-center">
          <MapPin className="w-8 h-8 text-[var(--color-accent)]" />
        </div>
        
        {/* Message */}
        <h1 className="text-2xl font-bold text-white mb-3">
          Page Not Found
        </h1>
        <p className="text-white/50 mb-8 text-sm">
          Looks like you&apos;ve wandered off the map. This page doesn&apos;t exist or has been moved.
        </p>
        
        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="glass-button px-6 py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white/70 font-medium flex items-center justify-center gap-2 hover:bg-white/[0.06] transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
