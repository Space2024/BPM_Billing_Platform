// Link to the KYC portal (crm_blupm_kyc) for a customer.
//
// The mobile is sent base36-encoded as ?k= — the same scheme crm_bpm_customers
// uses for its pass links — so the plain number never appears in the URL.
// The KYC page decodes it server-side (src/lib/kyc/mobileToken.ts there).

const KYC_BASE_URL = (process.env.NEXT_PUBLIC_BLUPEACOCK_KYC_PLATFORM ?? "").replace(/\/+$/, "");

export function encodeMobile(mobile: string): string {
  const num = parseInt(mobile, 10);
  if (isNaN(num)) return "";
  return num.toString(36);
}

/** The KYC portal URL for this mobile, or null when the base URL is unset or
    the mobile is not a 10-digit number. */
export function buildKycUrl(mobile: string | null | undefined): string | null {
  const digits = String(mobile ?? "").replace(/\D/g, "");
  if (!KYC_BASE_URL || digits.length !== 10) return null;
  const token = encodeMobile(digits);
  return token ? `${KYC_BASE_URL}/?k=${token}` : null;
}
