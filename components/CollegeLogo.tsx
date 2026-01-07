'use client';

import { useState } from 'react';
import Image from 'next/image';
import { GraduationCap } from 'lucide-react';

const LOGO_DEV_TOKEN = 'pk_H-1oHygYSEqPESrXnZ21Wg';

interface CollegeLogoProps {
  domain: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showFallback?: boolean;
}

const sizeMap = {
  sm: 20,
  md: 28,
  lg: 36,
  xl: 48,
};

const containerSizeMap = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
  xl: 'w-12 h-12',
};

/**
 * Displays a college logo from Logo.dev
 * Falls back to a graduation cap icon if logo fails to load
 */
export function CollegeLogo({ 
  domain, 
  size = 'md', 
  className = '',
  showFallback = true 
}: CollegeLogoProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const pixelSize = sizeMap[size];
  const containerClass = containerSizeMap[size];
  
  // Clean the domain (remove any protocol or path)
  const cleanDomain = domain?.replace(/^https?:\/\//, '').split('/')[0] || '';
  
  if (!cleanDomain) {
    if (showFallback) {
      return (
        <div className={`${containerClass} rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center ${className}`}>
          <GraduationCap className="w-1/2 h-1/2 text-[var(--color-accent)]" />
        </div>
      );
    }
    return null;
  }
  
  const logoUrl = `https://img.logo.dev/${cleanDomain}?token=${LOGO_DEV_TOKEN}&size=${pixelSize * 2}&format=png`;
  
  if (hasError && showFallback) {
    return (
      <div className={`${containerClass} rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center ${className}`}>
        <GraduationCap className="w-1/2 h-1/2 text-[var(--color-accent)]" />
      </div>
    );
  }
  
  if (hasError && !showFallback) {
    return null;
  }
  
  return (
    <div className={`${containerClass} rounded-lg bg-white/[0.05] flex items-center justify-center overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-white/[0.03] animate-pulse rounded-lg" />
      )}
      <Image
        src={logoUrl}
        alt={`${cleanDomain} logo`}
        width={pixelSize}
        height={pixelSize}
        className="object-contain"
        onError={() => setHasError(true)}
        onLoad={() => setIsLoading(false)}
        unoptimized // Logo.dev handles optimization
      />
    </div>
  );
}

/**
 * Extract domain from email address
 * e.g., "hunter@bc.edu" -> "bc.edu"
 */
export function getDomainFromEmail(email: string): string | null {
  if (!email || !email.includes('@')) return null;
  return email.split('@')[1]?.toLowerCase() || null;
}

