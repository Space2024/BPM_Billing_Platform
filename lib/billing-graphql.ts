import {
  BillingByMobileResult,
  CreateBillingInput,
  CreateBillingResult,
  VerifyBillingResult,
  ResendOtpResult,
  StoreOption,
  TextilesBillingResult,
  UpdateJewelleryBillingInput,
  UpdateJewelleryBillingResult,
  UpdateBillingInfoInput,
  UpdateBillingInfoResult,
} from "@/types/billing";

// ─── GraphQL Endpoint & Auth ───────────────────────────────────────────────────

const GQL_ENDPOINT =
  process.env.NEXT_PUBLIC_BLUPEACOCK_MEMBERSHIP_PLATFORM ||
  "http://14.96.15.50:7080/v3/Blizzard";

const GQL_TOKEN =
  process.env.NEXT_PUBLIC_BLUPEACOCK_MEMBERSHIP_EMPOWERMENT || "";

async function gqlFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
  options?: RequestInit
): Promise<T> {
  const body = JSON.stringify({ query, variables });

  const res = await fetch(GQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(GQL_TOKEN && { Authorization: `Bearer ${GQL_TOKEN}` }),
    },
    body,
    cache: "no-store",
    ...options,
  });

  if (!res.ok) {
    let serverBody = "";
    try {
      serverBody = await res.text();
    } catch (_) { /* ignore */ }

    console.error("──── GQL 400 DEBUG ────");
    console.error("Endpoint:", GQL_ENDPOINT);
    console.error("Request body:", body);
    console.error("Response status:", res.status, res.statusText);
    console.error("Response body:", serverBody);
    console.error("───────────────────────");

    throw new Error(
      `GraphQL network error: ${res.status} ${res.statusText} | ${serverBody}`
    );
  }

  const json = await res.json();

  if (json.errors?.length) {
    console.error("──── GQL ERRORS ────", JSON.stringify(json.errors, null, 2));
    throw new Error(json.errors[0].message || "GraphQL error");
  }

  return json.data as T;
}

// ─── GET_BILLING_BY_MOBILE ────────────────────────────────────────────────────

const GET_BILLING_BY_MOBILE = /* GraphQL */ `
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

export async function getBillingByMobile(
  mobileNo: string
): Promise<BillingByMobileResult> {
  const data = await gqlFetch<{ getBillingByMobile: BillingByMobileResult }>(
    GET_BILLING_BY_MOBILE,
    { mobileNo }
  );
  return data.getBillingByMobile;
}

// ─── GET_ALL_STORES ───────────────────────────────────────────────────────────

const GET_ALL_STORES = /* GraphQL */ `
  query GetStoresForDropdown {
    findAllStores {
      storeCode
      storeId
      storeName
      storeType
      branchId
      location
    }
  }
`;

export async function getAllStores(): Promise<StoreOption[]> {
  try {
    const data = await gqlFetch<{ findAllStores: StoreOption[] }>(
      GET_ALL_STORES,
      undefined,
      // Aggressively cache stores for 1 hour to ensure ultra-fast pure SSR performance
      { cache: "force-cache", next: { revalidate: 3600 } }
    );
    return data.findAllStores ?? [];
  } catch (err) {
    console.error("getAllStores failed, returning empty list:", err);
    return [];
  }
}

// ─── CREATE_CUSTOMER_BILLING ──────────────────────────────────────────────────

const CREATE_CUSTOMER_BILLING = /* GraphQL */ `
  mutation CREATE_CUSTOMER_BILLING($input: CreateCustomerBillingInput!) {
    createCustomerBilling(input: $input) {
      success
      message
      membershipId
    }
  }
`;

export async function createCustomerBilling(
  input: CreateBillingInput
): Promise<CreateBillingResult> {
  const data = await gqlFetch<{
    createCustomerBilling: CreateBillingResult;
  }>(CREATE_CUSTOMER_BILLING, { input });
  return data.createCustomerBilling;
}

// ─── VERIFY_CUSTOMER_BILLING ──────────────────────────────────────────────────

const VERIFY_CUSTOMER_BILLING = /* GraphQL */ `
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

export async function verifyCustomerBilling(
  membershipId: string,
  mobileNo: string,
  otpCode: string
): Promise<VerifyBillingResult> {
  const data = await gqlFetch<{
    verifyCustomerBilling: VerifyBillingResult;
  }>(VERIFY_CUSTOMER_BILLING, { input: { membershipId, mobileNo, otpCode } });
  return data.verifyCustomerBilling;
}

// ─── RESEND_BILLING_OTP ───────────────────────────────────────────────────────

const RESEND_BILLING_OTP = /* GraphQL */ `
  mutation BILLING_RESEND_OTP($input: ResendBillingOtpInput!) {
    resendBillingOtp(input: $input) {
      success
      status
      message
      mobileNo
    }
  }
`;

export async function resendBillingOtp(
  mobileNo: string,
  sendSms: boolean = true,
  sendWhatsapp: boolean = false
): Promise<ResendOtpResult> {
  const data = await gqlFetch<{ resendBillingOtp: ResendOtpResult }>(
    RESEND_BILLING_OTP,
    { input: { mobileNo, sendSms, sendWhatsapp } }
  );
  return data.resendBillingOtp;
}

// ─── TEXTILES BILLING CROSS ───────────────────────────────────────────────────

const GET_TEXTILES_BILLING_BY_MOBILE = /* GraphQL */ `
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

export async function getTextilesBillingByMobile(
  mobileNo: string
): Promise<TextilesBillingResult> {
  const data = await gqlFetch<{ getTextilesBillingByMobile: TextilesBillingResult }>(
    GET_TEXTILES_BILLING_BY_MOBILE,
    { mobileNo }
  );
  return data.getTextilesBillingByMobile;
}

const UPDATE_JEWELLERY_BILLING = /* GraphQL */ `
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
    updateBillingForJewellery(input: {
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
    }) {
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

export async function updateBillingForJewellery(
  input: UpdateJewelleryBillingInput
): Promise<UpdateJewelleryBillingResult> {
  const data = await gqlFetch<{ updateBillingForJewellery: UpdateJewelleryBillingResult }>(
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
  return data.updateBillingForJewellery;
}

// ─── UPDATE_BILLING_INFO (billing_pending update) ─────────────────────────────────

const UPDATE_BILLING_INFO = /* GraphQL */ `
  mutation UPDATE_CUSTOMER_PENDING_BILLING($input: UpdateBillingInfoInput!) {
    updateBillingInfo(input: $input) {
      success
      message
    }
  }
`;

export async function updateBillingInfo(
  input: UpdateBillingInfoInput
): Promise<UpdateBillingInfoResult> {
  const data = await gqlFetch<{ updateBillingInfo: UpdateBillingInfoResult }>(
    UPDATE_BILLING_INFO,
    { input }
  );
  return data.updateBillingInfo;
}
