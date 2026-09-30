import { gql } from "@apollo/client";

/**
 * Look a customer up by mobile number.
 *
 * The `source` field drives the whole flow: `program_master` is an existing
 * loyalty member, `billing_verified` a confirmed billing customer, and
 * `billing_pending` a registration that never finished.
 */
export const GET_BILLING_BY_MOBILE = gql`
  query GET_BILLING_BY_MOBILE($mobileNo: String!) {
    getBillingByMobile(mobileNo: $mobileNo) {
      success
      source
      message
      alreadyRegistered
      membershipId
      billingStatus
      firstName
      lastName
      mobileNo
      qrCodeUrl
      storeId
      storeType
      jewStoreId
      doorNo
      street
      area
      taluk
      city
      state
      pincode
      country
      programCustomer {
        membershipId
        level
        tierGrade
        qrCodeUrl
        firstName
        lastName
        memberStatus
        storeId
        doorNo
        street
        pincode
        area
        city
        state
      }
      customer {
        customerTitle
        customerName
        mobileNo
        email
        dateOfBirth
        doorNo
        street
        pinCode
        area
        taluk
        city
        state
        status
      }
    }
  }
`;

/** Existing textiles record for a customer crossing over to jewellery. */
export const GET_TEXTILES_BILLING_BY_MOBILE = gql`
  query TEXTILE_BILLING($mobileNo: String!) {
    getTextilesBillingByMobile(input: { mobileNo: $mobileNo }) {
      success
      membershipId
      prefix
      firstName
      lastName
      storeId
      jewStoreId
      billingStatus
      doorNo
      street
      area
      taluk
      city
      state
      pincode
      country
    }
  }
`;
