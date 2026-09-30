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

// Name / address fields accept letters plus the three permitted punctuation
// marks — dot, comma and at-sign. Everything else (#, &, quotes, …) is stripped
// as the user types. Address lines additionally allow digits, and door numbers
// also allow slash and hyphen for formats like "12/A" and "3-B".
const NAME_DISALLOWED = /[^A-Za-z .,@]/g;
const ADDRESS_DISALLOWED = /[^A-Za-z0-9 .,@]/g;
const DOOR_NO_DISALLOWED = /[^A-Za-z0-9 .,@/-]/g;

/** Strips disallowed characters from a name and title-cases what remains. */
export function formatName(value: string | null | undefined): string {
  return value ? toTitleCase(value.replace(NAME_DISALLOWED, "")) : "";
}

/** Strips disallowed characters from an address line and title-cases it. */
export function formatAddressText(value: string | null | undefined): string {
  return value ? toTitleCase(value.replace(ADDRESS_DISALLOWED, "")) : "";
}

/** Like {@link formatAddressText}, but keeps the / and - used in door numbers. */
export function formatDoorNo(value: string | null | undefined): string {
  return value ? toTitleCase(value.replace(DOOR_NO_DISALLOWED, "")) : "";
}

/**
 * Spaces a membership number into groups of four, the way an Aadhaar number is
 * printed, so it can be read aloud or checked against a receipt without losing
 * your place. A twelve digit id becomes "2627 0007 3210".
 *
 * Only a plain digit run is grouped. An id carrying letters or punctuation is
 * returned untouched, since it has its own formatting.
 */
export function formatMembershipId(value: string | null | undefined): string {
  if (!value) return "";
  const compact = String(value).replace(/\s+/g, "");
  if (!/^\d+$/.test(compact)) return String(value);
  return compact.replace(/(\d{4})(?=\d)/g, "$1 ");
}
