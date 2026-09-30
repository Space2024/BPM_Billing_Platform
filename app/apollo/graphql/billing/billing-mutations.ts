import { gql } from "@apollo/client";

/** Start a registration and send the one-time password. */
export const CREATE_CUSTOMER_BILLING = gql`
  mutation CREATE_CUSTOMER_BILLING($input: CreateCustomerBillingInput!) {
    createCustomerBilling(input: $input) {
      success
      message
      membershipId
    }
  }
`;

/** Confirm the one-time password and issue the membership. */
export const VERIFY_CUSTOMER_BILLING = gql`
  mutation VERIFY_CUSTOMER_BILLING($input: VerifyCustomerBillingInput!) {
    verifyCustomerBilling(input: $input) {
      success
      billingStatus
      membershipId
      mobileNo
      message
      qrCodeUrl
      tierGrade
    }
  }
`;

export const RESEND_BILLING_OTP = gql`
  mutation BILLING_RESEND_OTP($input: ResendBillingOtpInput!) {
    resendBillingOtp(input: $input) {
      success
      status
      message
      mobileNo
    }
  }
`;

/**
 * Attach a jewellery store and address to an existing textiles customer.
 *
 * Takes its arguments individually rather than as one input object, matching the
 * backend signature for this operation.
 */
export const UPDATE_JEWELLERY_BILLING = gql`
  mutation UPDATE_JEWELLERY_BILLING(
    $mobileNo: String!
    $jewStoreId: String!
    $doorNo: String!
    $street: String!
    $area: String!
    $taluk: String
    $city: String!
    $state: String!
    $pincode: String!
    $country: String!
  ) {
    updateBillingForJewellery(
      input: {
        mobileNo: $mobileNo
        jewStoreId: $jewStoreId
        doorNo: $doorNo
        street: $street
        area: $area
        taluk: $taluk
        city: $city
        state: $state
        pincode: $pincode
        country: $country
      }
    ) {
      success
      message
      jewStoreId
      doorNo
      city
      qrCodeUrl
      tierGrade
    }
  }
`;

/** Amend a registration that is still pending verification. */
export const UPDATE_BILLING_INFO = gql`
  mutation UPDATE_CUSTOMER_PENDING_BILLING($input: UpdateBillingInfoInput!) {
    updateBillingInfo(input: $input) {
      success
      message
    }
  }
`;
