/**
 * Types for the billing GraphQL operations.
 *
 * The result and input types are the shared ones in `@/types/billing`,
 * re-exported so the Apollo layer imports from a single place. The response
 * envelopes below are specific to this layer: each wraps one operation's result
 * under the root field the backend returns it in.
 */

import type {
  BillingByMobileResult,
  CreateBillingResult,
  ResendOtpResult,
  TextilesBillingResult,
  UpdateBillingInfoResult,
  UpdateJewelleryBillingResult,
  VerifyBillingResult,
} from "@/types/billing";

export type {
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

// ─── Queries ───────────────────────────────────────────────────────────────────

export interface GetBillingByMobileResponse {
  getBillingByMobile: BillingByMobileResult;
}

export interface GetTextilesBillingResponse {
  getTextilesBillingByMobile: TextilesBillingResult;
}

// ─── Mutations ─────────────────────────────────────────────────────────────────

export interface CreateCustomerBillingResponse {
  createCustomerBilling: CreateBillingResult;
}

export interface VerifyCustomerBillingResponse {
  verifyCustomerBilling: VerifyBillingResult;
}

export interface ResendBillingOtpResponse {
  resendBillingOtp: ResendOtpResult;
}

export interface UpdateBillingForJewelleryResponse {
  updateBillingForJewellery: UpdateJewelleryBillingResult;
}

export interface UpdateBillingInfoResponse {
  updateBillingInfo: UpdateBillingInfoResult;
}
