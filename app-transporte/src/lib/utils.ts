import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utilitários para responsividade
export const breakpoints = {
  mobile: '640px',
  tablet: '768px', 
  desktop: '1024px',
  wide: '1280px'
}

// Classes responsivas comuns
export const responsive = {
  container: 'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6',
  card: 'bg-white rounded-lg border shadow-sm p-4 lg:p-6',
  button: 'h-10 px-4 py-2 sm:h-11 sm:px-6 sm:py-3',
  input: 'h-10 sm:h-11 px-3 py-2',
  text: {
    xs: 'text-xs sm:text-sm',
    sm: 'text-sm sm:text-base', 
    base: 'text-base sm:text-lg',
    lg: 'text-lg sm:text-xl',
    xl: 'text-xl sm:text-2xl',
    '2xl': 'text-2xl sm:text-3xl'
  }
}