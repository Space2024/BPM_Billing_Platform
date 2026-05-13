import { z } from "zod";

// Mobile Number Validation
export const mobileSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number starting with 6-9");

// Base Store Selection Schema
export const storeSelectionSchema = z.object({
  storeId: z.string().min(1, "Please select a store"),
});

// Personal Details Schema
export const personalDetailsSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

// Address Schema
export const addressSchema = z.object({
  doorNo: z.string().min(1, "Door No. is required"),
  street: z.string().min(1, "Street is required"),
  pincode: z.string().min(6, "Pincode is required"),
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
