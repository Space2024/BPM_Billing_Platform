"use server";

import { encodeMobile } from "@/lib/kyc-link";

export type KycStatus = "NONE" | "DRAFT" | "SUBMITTED" | "REOPENED";

export interface KycStatusResult {
  status: KycStatus;
  kycRef: string | null;
}

const KYC_BASE_URL = (process.env.NEXT_PUBLIC_BLUPEACOCK_KYC_PLATFORM ?? "").replace(/\/+$/, "");
const KNOWN: KycStatus[] = ["NONE", "DRAFT", "SUBMITTED", "REOPENED"];

/** Where the customer's KYC stands, from the KYC portal's /kyc-status route
    (crm_blupm_kyc, src/app/kyc-status/route.ts). Null when it cannot be told —
    the card then shows the plain "Complete your KYC" button. */
export async function fetchKycStatusAction(mobile: string): Promise<KycStatusResult | null> {
  const digits = String(mobile ?? "").replace(/\D/g, "");
  if (!KYC_BASE_URL || digits.length !== 10) return null;
  try {
    const res = await fetch(`${KYC_BASE_URL}/kyc-status?k=${encodeMobile(digits)}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const status = KNOWN.includes(json?.status) ? (json.status as KycStatus) : null;
    return status ? { status, kycRef: typeof json?.kycRef === "string" ? json.kycRef : null } : null;
  } catch (err) {
    console.error("[KYC status]", err);
    return null;
  }
}
