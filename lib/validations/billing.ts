import { z } from "zod";

// Mobile Number Validation
export const mobileSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number starting with 6-9");

// Base Store Selection Schema
export const storeSelectionSchema = z.object({
  storeId: z.string().min(1, "Please select a store"),
});

// Allowed characters: letters (plus digits for address lines) and the three
// permitted punctuation marks — dot, comma and at-sign.
const NAME_PATTERN = /^[A-Za-z .,@]+$/;
const ADDRESS_PATTERN = /^[A-Za-z0-9 .,@]+$/;
// Door numbers also allow / and - for formats like "12/A" and "3-B".
const DOOR_NO_PATTERN = /^[A-Za-z0-9 .,@/-]+$/;
const NAME_MESSAGE = "Only letters and . , @ are allowed";
const ADDRESS_MESSAGE = "Only letters, numbers and . , @ are allowed";
const DOOR_NO_MESSAGE = "Only letters, numbers and . , @ / - are allowed";

// ─── Title Prefix ─────────────────────────────────────────────────────────────
// The only titles the billing platform accepts. Nothing else may be submitted:
// not a blank, and not a value carried in from an older customer record such as
// "Selvan" or "Thiru". Such a value has to be corrected by the user, because
// substituting a default would register the customer under the wrong title.

export const PREFIXES = ["Mr", "Mrs", "Ms", "Dr", "Prof"] as const;

export type Prefix = (typeof PREFIXES)[number];

const PREFIX_MESSAGE = `Select a valid prefix: ${PREFIXES.join(", ")}`;

export const prefixSchema = z.enum(PREFIXES, { message: PREFIX_MESSAGE });

/** True only for an exact, canonical prefix. */
export function isValidPrefix(value: string | null | undefined): value is Prefix {
  return !!value && (PREFIXES as readonly string[]).includes(value);
}

/**
 * Map a stored title onto its canonical prefix, tolerating case and a trailing
 * dot so "mr." resolves to "Mr".
 *
 * Returns "" when the value cannot be mapped. That empty result is deliberate:
 * it leaves the field unset so strict validation reports it, rather than
 * silently substituting a default and hiding bad data.
 */
export function normalizePrefix(raw: string | null | undefined): Prefix | "" {
  if (!raw) return "";
  const cleaned = raw.replace(/\./g, "").trim();
  return PREFIXES.find((p) => p.toLowerCase() === cleaned.toLowerCase()) ?? "";
}

// Personal Details Schema
export const personalDetailsSchema = z.object({
  prefix: prefixSchema,
  firstName: z.string().min(1, "First name is required").regex(NAME_PATTERN, NAME_MESSAGE),
  lastName: z.string().min(1, "Last name is required").regex(NAME_PATTERN, NAME_MESSAGE),
});

// Address Schema
export const addressSchema = z.object({
  doorNo: z.string().min(1, "Door No. is required").regex(DOOR_NO_PATTERN, DOOR_NO_MESSAGE),
  street: z.string().min(1, "Street is required").regex(ADDRESS_PATTERN, ADDRESS_MESSAGE),
  pincode: z.string().min(6, "Pincode is required").regex(/^\d{6}$/, "Pincode must be 6 digits"),
  area: z.string().min(1, "Area is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
});

// Registration Form - Step 1 Schema
export const registrationStep1Schema = storeSelectionSchema.merge(personalDetailsSchema);

// Registration Form - Full Schema (with address)
export const registrationFullSchema = registrationStep1Schema.merge(addressSchema);

// Cross Form - Step 1 Schema
export const crossFormStep1Schema = z.object({
  storeId: z.string().min(1, "Please select a Jewellery Store"),
});

// Cross Form - Full Schema
export const crossFormFullSchema = crossFormStep1Schema.merge(addressSchema);
