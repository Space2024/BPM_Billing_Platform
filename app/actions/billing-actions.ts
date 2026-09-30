"use server";

import { runAction, type ActionResult } from "@/app/actions/action-result";
import {
  createCustomerBilling,
  fetchBillingByMobile,
  fetchTextilesBillingByMobile,
  resendBillingOtp,
  updateBillingForJewellery,
  updateBillingInfo,
  verifyCustomerBilling,
} from "@/app/apollo/hooks/billing/fetch-billing-server";
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
} from "@/app/apollo/graphql/billing/billing-types";

/**
 * Billing server actions.
 *
 * Each is a one-line delegation to a fetcher in the data access layer, wrapped
 * by runAction so every failure comes back in the same envelope.
 */

export async function getBillingByMobile(
  mobileNo: string
): Promise<ActionResult<BillingByMobileResult>> {
  return runAction("look up mobile number", () => fetchBillingByMobile(mobileNo));
}

export async function createBilling(
  input: CreateBillingInput
): Promise<ActionResult<CreateBillingResult>> {
  return runAction("create billing registration", () => createCustomerBilling(input));
}

export async function verifyBillingOtp(
  membershipId: string,
  mobileNo: string,
  otpCode: string
): Promise<ActionResult<VerifyBillingResult>> {
  return runAction("verify OTP", () =>
    verifyCustomerBilling(membershipId, mobileNo, otpCode)
  );
}

export async function resendOtp(
  mobileNo: string,
  sendSms: boolean = true,
  sendWhatsapp: boolean = false
): Promise<ActionResult<ResendOtpResult>> {
  return runAction("resend OTP", () =>
    resendBillingOtp(mobileNo, sendSms, sendWhatsapp)
  );
}

export async function getTextilesBilling(
  mobileNo: string
): Promise<ActionResult<TextilesBillingResult>> {
  return runAction("fetch textiles billing", () =>
    fetchTextilesBillingByMobile(mobileNo)
  );
}

export async function updateJewelleryBilling(
  input: UpdateJewelleryBillingInput
): Promise<ActionResult<UpdateJewelleryBillingResult>> {
  return runAction("update jewellery billing", () =>
    updateBillingForJewellery(input)
  );
}

export async function updatePendingBillingInfo(
  input: UpdateBillingInfoInput
): Promise<ActionResult<UpdateBillingInfoResult>> {
  return runAction("update billing info", () => updateBillingInfo(input));
}
