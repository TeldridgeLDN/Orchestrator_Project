/**
 * Utility Functions
 * 
 * Common utility functions used throughout the application.
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names using clsx and tailwind-merge
 * This allows for conditional classes and proper Tailwind class merging
 * 
 * @example
 * cn('px-2 py-1', condition && 'bg-blue-500', 'text-white')
 * // Returns: 'px-2 py-1 bg-blue-500 text-white' (if condition is true)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

