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

// Personal Details Schema
export const personalDetailsSchema = z.object({
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
