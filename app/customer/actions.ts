"use server";

import {
  getBillingByMobile as gqlGetBillingByMobile,
  getAllStores as gqlGetAllStores,
  createCustomerBilling as gqlCreateCustomerBilling,
  verifyCustomerBilling as gqlVerifyCustomerBilling,
  resendBillingOtp as gqlResendBillingOtp,
  getTextilesBillingByMobile as gqlGetTextilesBillingByMobile,
  updateBillingForJewellery as gqlUpdateBillingForJewellery,
  updateBillingInfo as gqlUpdateBillingInfo,
} from "@/lib/billing-graphql";

import {
  BillingByMobileResult,
  StoreOption,
  CreateBillingInput,
  CreateBillingResult,
  VerifyBillingResult,
  ResendOtpResult,
  TextilesBillingResult,
  UpdateJewelleryBillingInput,
  UpdateJewelleryBillingResult,
  UpdateBillingInfoInput,
  UpdateBillingInfoResult,
} from "@/types/billing";

// Note: Server actions cannot directly access browser APIs like localStorage
// The unique IDs are already added in the HTTP headers by the GraphQL fetch function
// For additional tracking, we can add server-side request metadata

// ─── Look up mobile number ────────────────────────────────────────────────────

export async function lookupMobileAction(
  mobileNo: string
): Promise<{ data?: BillingByMobileResult; error?: string }> {
  try {
    const data = await gqlGetBillingByMobile(mobileNo);
    return { data };
  } catch (err) {
    return { error: (err as Error).message || "Lookup failed" };
  }
}

// ─── Fetch all stores ─────────────────────────────────────────────────────────

export async function fetchStoresAction(): Promise<{
  stores?: StoreOption[];
  error?: string;
}> {
  try {
    const stores = await gqlGetAllStores();
    return { stores };
  } catch (err) {
    return { error: (err as Error).message || "Failed to load stores" };
  }
}

// ─── Create billing registration ──────────────────────────────────────────────

export async function createBillingAction(
  input: CreateBillingInput
): Promise<{ data?: CreateBillingResult; error?: string }> {
  try {
    const data = await gqlCreateCustomerBilling(input);
    return { data };
  } catch (err) {
    return { error: (err as Error).message || "Registration failed" };
  }
}

// ─── Verify OTP ───────────────────────────────────────────────────────────────

export async function verifyOtpAction(
  membershipId: string,
  mobileNo: string,
  otpCode: string
): Promise<{ data?: VerifyBillingResult; error?: string }> {
  try {
    const data = await gqlVerifyCustomerBilling(membershipId, mobileNo, otpCode);
    return { data };
  } catch (err) {
    return { error: (err as Error).message || "OTP verification failed" };
  }
}

// ─── Resend OTP ───────────────────────────────────────────────────────────────

export async function resendOtpAction(
  mobileNo: string,
  sendSms: boolean = true,
  sendWhatsapp: boolean = false
): Promise<{ data?: ResendOtpResult; error?: string }> {
  try {
    const data = await gqlResendBillingOtp(mobileNo, sendSms, sendWhatsapp);
    return { data };
  } catch (err) {
    return { error: (err as Error).message || "Resend OTP failed" };
  }
}

// ─── Textiles & Jewellery Cross ───────────────────────────────────────────────

export async function fetchTextilesBillingAction(
  mobileNo: string
): Promise<{ data?: TextilesBillingResult; error?: string }> {
  try {
    const data = await gqlGetTextilesBillingByMobile(mobileNo);
    return { data };
  } catch (err) {
    return { error: (err as Error).message || "Failed to fetch textiles billing" };
  }
}

export async function updateJewelleryBillingAction(
  input: UpdateJewelleryBillingInput
): Promise<{ data?: UpdateJewelleryBillingResult; error?: string }> {
  try {
    const data = await gqlUpdateBillingForJewellery(input);
    return { data };
  } catch (err) {
    return { error: (err as Error).message || "Failed to update jewellery billing" };
  }
}

// ─── Update billing_pending info ───────────────────────────────────────────────────

export async function updateBillingInfoAction(
  input: UpdateBillingInfoInput
): Promise<{ data?: UpdateBillingInfoResult; error?: string }> {
  try {
    const data = await gqlUpdateBillingInfo(input);
    return { data };
  } catch (err) {
    return { error: (err as Error).message || "Failed to update billing info" };
  }
}

// ─── Proxy Image to Base64 (Bypass CORS for html-to-image) ────────────────────
export async function fetchProxyImageBase64(url: string): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = res.headers.get("content-type") || "image/png";
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  } catch (error) {
    console.error("Failed to proxy image:", error);
    return null;
  }
}
