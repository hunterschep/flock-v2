import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate custom buckets for color scale based on max value
 * Returns an array of threshold values for D3 color scale
 */
export function getCustomBuckets(maxValue: number): number[] {
  if (maxValue <= 0) return [0, 1];
  
  if (maxValue <= 5) {
    return [1, 2, 3, 4, 5];
  } else if (maxValue <= 10) {
    return [2, 4, 6, 8, 10];
  } else if (maxValue <= 20) {
    return [5, 10, 15, 20];
  } else if (maxValue <= 50) {
    return [10, 20, 30, 40, 50];
  } else if (maxValue <= 100) {
    return [20, 40, 60, 80, 100];
  } else if (maxValue <= 500) {
    return [100, 200, 300, 400, 500];
  } else {
    // For very large values, use logarithmic-ish buckets
    const step = Math.ceil(maxValue / 5);
    return [step, step * 2, step * 3, step * 4, maxValue];
  }
}

