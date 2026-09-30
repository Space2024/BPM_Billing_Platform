"use server";

/**
 * Compatibility layer over the actions in {@link file://../actions}.
 *
 * The customer components were written against a `{ data?, error? }` envelope.
 * The data access layer now returns the `ActionResult` discriminated union used
 * across the estate, which narrows `data` on the success branch. This module
 * adapts one to the other so the components did not all have to change at once.
 *
 * New code should import from `@/app/actions/billing-actions` and
 * `@/app/actions/store-actions` directly. Once every call site here has moved,
 * this file can go.
 */

import type { ActionResult } from "@/app/actions/action-result";
import {
  createBilling,
  getBillingByMobile,
  getTextilesBilling,
  resendOtp,
  updateJewelleryBilling,
  updatePendingBillingInfo,
  verifyBillingOtp,
} from "@/app/actions/billing-actions";
import { getStores } from "@/app/actions/store-actions";
import { fetchProxyImageBase64 as proxyImageBase64 } from "@/app/actions/image-actions";

import type {
  BillingByMobileResult,
  CreateBillingInput,
  CreateBillingResult,
  ResendOtpResult,
  TextilesBillingResult,
  UpdateBillingInfoInput,
  UpdateBillingInfoResult,
  UpdateJewelleryBillingInput,
  UpdateJewelleryBillingResult,
  VerifyBillingResult,
} from "@/types/billing";
import type { StoreOption } from "@/types/billing";

/** Legacy envelope: data present on success, error string on failure. */
type Legacy<T> = { data?: T; error?: string };

function toLegacy<T>(result: ActionResult<T>, fallback: string): Legacy<T> {
  return result.success ? { data: result.data } : { error: result.error || fallback };
}

// ─── Look up mobile number ────────────────────────────────────────────────────

export async function lookupMobileAction(
  mobileNo: string
): Promise<Legacy<BillingByMobileResult>> {
  return toLegacy(await getBillingByMobile(mobileNo), "Lookup failed");
}

// ─── Fetch all stores ─────────────────────────────────────────────────────────

export async function fetchStoresAction(): Promise<{
  stores?: StoreOption[];
  error?: string;
}> {
  const result = await getStores();
  return result.success
    ? { stores: result.data }
    : { error: result.error || "Failed to load stores" };
}

// ─── Create billing registration ──────────────────────────────────────────────

export async function createBillingAction(
  input: CreateBillingInput
): Promise<Legacy<CreateBillingResult>> {
  return toLegacy(await createBilling(input), "Registration failed");
}

// ─── Verify OTP ───────────────────────────────────────────────────────────────

export async function verifyOtpAction(
  membershipId: string,
  mobileNo: string,
  otpCode: string
): Promise<Legacy<VerifyBillingResult>> {
  return toLegacy(
    await verifyBillingOtp(membershipId, mobileNo, otpCode),
    "OTP verification failed"
  );
}

// ─── Resend OTP ───────────────────────────────────────────────────────────────

export async function resendOtpAction(
  mobileNo: string,
  sendSms: boolean = true,
  sendWhatsapp: boolean = false
): Promise<Legacy<ResendOtpResult>> {
  return toLegacy(
    await resendOtp(mobileNo, sendSms, sendWhatsapp),
    "Resend OTP failed"
  );
}

// ─── Textiles and jewellery cross-over ────────────────────────────────────────

export async function fetchTextilesBillingAction(
  mobileNo: string
): Promise<Legacy<TextilesBillingResult>> {
  return toLegacy(
    await getTextilesBilling(mobileNo),
    "Failed to fetch textiles billing"
  );
}

export async function updateJewelleryBillingAction(
  input: UpdateJewelleryBillingInput
): Promise<Legacy<UpdateJewelleryBillingResult>> {
  return toLegacy(
    await updateJewelleryBilling(input),
    "Failed to update jewellery billing"
  );
}

// ─── Update billing_pending info ──────────────────────────────────────────────

export async function updateBillingInfoAction(
  input: UpdateBillingInfoInput
): Promise<Legacy<UpdateBillingInfoResult>> {
  return toLegacy(
    await updatePendingBillingInfo(input),
    "Failed to update billing info"
  );
}

// ─── Proxy image to base64 ────────────────────────────────────────────────────

// Wrapped rather than re-exported: every export of a "use server" module has to
// be an async function declared in it, so a bare re-export is not reliable here.
export async function fetchProxyImageBase64(url: string): Promise<string | null> {
  return proxyImageBase64(url);
}
