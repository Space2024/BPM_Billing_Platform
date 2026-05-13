// ─── Billing Types ────────────────────────────────────────────────────────────

export interface ProgramCustomer {
  membershipId: string;
  level: string | number;
  tierGrade?: string | null;
  qrCodeUrl?: string | null;
  firstName: string;
  lastName: string;
  memberStatus: string;
  storeId: string;
  doorNo: string;
  street: string;
  pincode: string;
  area: string;
  city: string;
  state: string;
}

export interface Customer {
  customerTitle: string;
  customerName: string;
  mobileNo: string;
  email: string;
  dateOfBirth: string;
  doorNo: string;
  street: string;
  pinCode: string;
  area: string;
  taluk: string;
  city: string;
  state: string;
  status: string;
}

export interface BillingByMobileResult {
  success: boolean;
  source: string | null;
  message: string;
  alreadyRegistered: boolean;
  membershipId: string | null;
  billingStatus: string | null;
  firstName: string | null;
  lastName: string | null;
  mobileNo: string | null;
  qrCodeUrl: string | null;
  // Top-level address / store fields (billing_pending)
  storeId: string | null;
  storeType: string | null;
  jewStoreId: string | null;
  doorNo: string | null;
  street: string | null;
  area: string | null;
  taluk: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  country: string | null;
  programCustomer: ProgramCustomer | null;
  customer: Customer | null;
}

// ─── Store Types ──────────────────────────────────────────────────────────────

export interface StoreOption {
  storeCode: string;
  storeId: string;
  storeName: string;
  storeType: string;
  branchId: string;
  location: string;
}

// ─── Create Billing Input / Result ────────────────────────────────────────────

export interface CreateBillingInput {
  firstName: string;
  lastName: string;
  mobileNo: string;
  prefix: string;
  storeId: string;
  doorNo?: string;
  street?: string;
  area?: string;
  taluk?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  staffEcno?: string;
  sendSms?: boolean;
  sendWhatsapp?: boolean;
}

export interface CreateBillingResult {
  success: boolean;
  message: string;
  membershipId: string | null;
}

// ─── Verify Billing ───────────────────────────────────────────────────────────

export interface VerifyBillingResult {
  success: boolean;
  billingStatus: string | null;
  membershipId: string | null;
  mobileNo: string | null;
  message: string;
  qrCodeUrl: string | null;
  tierGrade: string | null;
}

// ─── Resend OTP ───────────────────────────────────────────────────────────────

export interface ResendOtpResult {
  success: boolean;
  status: string | null;
  message: string;
  mobileNo: string | null;
}

// ─── Textiles & Jewellery Cross ───────────────────────────────────────────────

export interface TextilesBillingResult {
  success: boolean;
  membershipId: string | null;
  prefix: string | null;
  firstName: string | null;
  lastName: string | null;
  storeId: string | null;
  jewStoreId: string | null;
  billingStatus: string | null;
  doorNo: string | null;
  street: string | null;
  area: string | null;
  taluk: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  country: string | null;
}

export interface UpdateJewelleryBillingInput {
  mobileNo: string;
  jewStoreId: string;
  doorNo: string;
  street: string;
  area: string;
  taluk: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface UpdateJewelleryBillingResult {
  success: boolean;
  message: string;
  jewStoreId: string | null;
  doorNo: string | null;
  city: string | null;
  qrCodeUrl: string | null;
  tierGrade: string | null;
}

// ─── Update Billing Info (billing_pending update flow) ────────────────────────

export interface UpdateBillingInfoInput {
  membershipId: string;
  firstName?: string;
  lastName?: string;
  prefix?: string;
  storeId?: string;
  doorNo?: string;
  street?: string;
  area?: string;
  taluk?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

export interface UpdateBillingInfoResult {
  success: boolean;
  message: string;
}

// ─── Page State Enum ──────────────────────────────────────────────────────────

export type PageStep =
  | "mobile_entry"
  | "existing_found"
  | "registration_form"
  | "textiles_jewellery_cross"
  | "otp_verify"
  | "pending_update_otp"
  | "success";
