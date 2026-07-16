import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// Capitalises each word, treating any non-alphanumeric char (dot, hyphen,
// apostrophe, slash) as a word break — so "r.s.puram" becomes "R.S.Puram".
export function toTitleCase(str: string): string {
  return str.replace(
    /[A-Za-z0-9]+/g,
    (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );
}

/** Title-cases a value that may be null/undefined, returning "" when absent. */
export function toTitleCaseSafe(value: string | null | undefined): string {
  return value ? toTitleCase(value) : "";
}
