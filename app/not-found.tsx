'use client';

import Link from 'next/link';
import { Home, ArrowLeft, MapPin } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen gradient-mesh flex items-center justify-center px-4 relative overflow-hidden">
      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500/20 rounded-full mix-blend-lighten filter blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/20 rounded-full mix-blend-lighten filter blur-3xl animate-pulse animation-delay-2000" />
      
      <div className="glass-strong rounded-3xl p-8 sm:p-12 text-center max-w-lg relative z-10">
        {/* 404 Number */}
        <div className="mb-6">
          <span className="text-8xl sm:text-9xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-400 via-pink-400 to-rose-400 animate-gradient">
            404
          </span>
        </div>
        
        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center ring-2 ring-rose-400/20">
          <MapPin className="w-10 h-10 text-rose-400" />
        </div>
        
        {/* Message */}
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3 drop-shadow-lg">
          Page Not Found
        </h1>
        <p className="text-white/70 mb-8 text-sm sm:text-base">
          Looks like you&apos;ve wandered off the map. This page doesn&apos;t exist or has been moved.
        </p>
        
        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="glass-button px-6 py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 hover:scale-105 transition-all"
          >
            <Home className="w-5 h-5" />
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="glass-light px-6 py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2 hover:bg-white/20 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

