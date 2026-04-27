import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const BASE_URL = "https://classlink-production-1313.up.railway.app";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
