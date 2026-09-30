import { serverGraphQLService } from "@/app/apollo/dal-server";
import {
  GET_BILLING_BY_MOBILE,
  GET_TEXTILES_BILLING_BY_MOBILE,
} from "@/app/apollo/graphql/billing/billing-queries";
import {
  CREATE_CUSTOMER_BILLING,
  RESEND_BILLING_OTP,
  UPDATE_BILLING_INFO,
  UPDATE_JEWELLERY_BILLING,
  VERIFY_CUSTOMER_BILLING,
} from "@/app/apollo/graphql/billing/billing-mutations";
import type {
  BillingByMobileResult,
  CreateBillingInput,
  CreateBillingResult,
  CreateCustomerBillingResponse,
  GetBillingByMobileResponse,
  GetTextilesBillingResponse,
  ResendBillingOtpResponse,
  ResendOtpResult,
  TextilesBillingResult,
  UpdateBillingForJewelleryResponse,
  UpdateBillingInfoInput,
  UpdateBillingInfoResponse,
  UpdateBillingInfoResult,
  UpdateJewelleryBillingInput,
  UpdateJewelleryBillingResult,
  VerifyBillingResult,
  VerifyCustomerBillingResponse,
} from "@/app/apollo/graphql/billing/billing-types";

/**
 * Server-side billing fetchers.
 *
 * Each unwraps the data access envelope and throws on failure, so the action
 * layer can wrap it in one place. See
 * {@link file://../../../actions/action-result.ts}.
 */

/** Raise the error the data access layer reported, or the missing-data case. */
function unwrap<TResponse, TField>(
  result: { data: TResponse | null; error: Error | null },
  pick: (data: TResponse) => TField | undefined,
  operation: string
): TField {
  if (result.error) throw result.error;
  const value = result.data ? pick(result.data) : undefined;
  if (value === undefined || value === null) {
    throw new Error(`${operation} returned no data`);
  }
  return value;
}

export async function fetchBillingByMobile(
  mobileNo: string
): Promise<BillingByMobileResult> {
  const result = await serverGraphQLService.query<GetBillingByMobileResponse>(
    GET_BILLING_BY_MOBILE,
    { mobileNo }
  );
  return unwrap(result, (d) => d.getBillingByMobile, "Mobile lookup");
}

export async function createCustomerBilling(
  input: CreateBillingInput
): Promise<CreateBillingResult> {
  const result = await serverGraphQLService.mutate<CreateCustomerBillingResponse>(
    CREATE_CUSTOMER_BILLING,
    { input }
  );
  return unwrap(result, (d) => d.createCustomerBilling, "Registration");
}

export async function verifyCustomerBilling(
  membershipId: string,
  mobileNo: string,
  otpCode: string
): Promise<VerifyBillingResult> {
  const result = await serverGraphQLService.mutate<VerifyCustomerBillingResponse>(
    VERIFY_CUSTOMER_BILLING,
    { input: { membershipId, mobileNo, otpCode } }
  );
  return unwrap(result, (d) => d.verifyCustomerBilling, "OTP verification");
}

export async function resendBillingOtp(
  mobileNo: string,
  sendSms: boolean = true,
  sendWhatsapp: boolean = false
): Promise<ResendOtpResult> {
  const result = await serverGraphQLService.mutate<ResendBillingOtpResponse>(
    RESEND_BILLING_OTP,
    { input: { mobileNo, sendSms, sendWhatsapp } }
  );
  return unwrap(result, (d) => d.resendBillingOtp, "Resend OTP");
}

export async function fetchTextilesBillingByMobile(
  mobileNo: string
): Promise<TextilesBillingResult> {
  const result = await serverGraphQLService.query<GetTextilesBillingResponse>(
    GET_TEXTILES_BILLING_BY_MOBILE,
    { mobileNo }
  );
  return unwrap(result, (d) => d.getTextilesBillingByMobile, "Textiles lookup");
}

export async function updateBillingForJewellery(
  input: UpdateJewelleryBillingInput
): Promise<UpdateJewelleryBillingResult> {
  // This mutation takes its arguments individually, not as one input object.
  const result = await serverGraphQLService.mutate<UpdateBillingForJewelleryResponse>(
    UPDATE_JEWELLERY_BILLING,
    {
      mobileNo: input.mobileNo,
      jewStoreId: input.jewStoreId,
      doorNo: input.doorNo,
      street: input.street,
      area: input.area,
      taluk: input.taluk,
      city: input.city,
      state: input.state,
      pincode: input.pincode,
      country: input.country,
    }
  );
  return unwrap(result, (d) => d.updateBillingForJewellery, "Jewellery update");
}

export async function updateBillingInfo(
  input: UpdateBillingInfoInput
): Promise<UpdateBillingInfoResult> {
  const result = await serverGraphQLService.mutate<UpdateBillingInfoResponse>(
    UPDATE_BILLING_INFO,
    { input }
  );
  return unwrap(result, (d) => d.updateBillingInfo, "Billing update");
}
