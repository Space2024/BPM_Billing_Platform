"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Phone,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  Download,
  X,
} from "lucide-react";

import { lookupMobileAction, fetchTextilesBillingAction, fetchProxyImageBase64, resendOtpAction, updateBillingInfoAction } from "@/app/customer/actions";
import { RegistrationForm } from "@/components/customer/registration-form";
import { TextilesJewelleryCrossForm } from "@/components/customer/textiles-jewellery-cross-form";
import { useRegistrationFormStore, useCrossFormStore } from "@/lib/store";
import { OtpPanel } from "@/components/customer/otp-panel";
import { mobileSchema } from "@/lib/validations/billing";
import { formatMembershipId } from "@/lib/utils";

import {
  BillingByMobileResult,
  CreateBillingResult,
  VerifyBillingResult,
  StoreOption,
  PageStep,
  UpdateBillingInfoInput,
} from "@/types/billing";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { MembershipSuccessCard, getTierConfig } from "@/components/customer/membership-success-card";
import { HiddenMobile } from "@/components/customer/hidden-mobile";
import { useSessionState } from "@/components/customer/use-session-state";
import { notify } from "@/components/ui/notifications";

interface CustomerShellProps {
  stores: StoreOption[];
  /** EC number of the staff member whose QR code was scanned */
  staffEcno?: string;
  /**
   * Store matched from store_info.storeCode against the branch the scanned
   * staff member is on duty at today. When set, the store field is pre-selected
   * with this store and locked. Null when no branch matched (head office staff,
   * or the attendance lookup was unavailable) — the customer then picks a store.
   */
  lockedStore?: StoreOption | null;
}

export function CustomerShell({ stores, staffEcno, lockedStore = null }: CustomerShellProps) {
  // Get clear functions from stores
  const clearRegistrationForm = useRegistrationFormStore((state) => state.clearForm);
  const clearCrossForm = useCrossFormStore((state) => state.clearForm);
  
  const [step, setStep] = useSessionState<PageStep>("cs_step", "mobile_entry");
  const [mobile, setMobile] = useSessionState("cs_mobile", "");
  const [mobileError, setMobileError] = useState<string | null>(null);
  const [lookupResult, setLookupResult] = useSessionState<BillingByMobileResult | null>("cs_lookup", null);
  const [createResult, setCreateResult] = useSessionState<CreateBillingResult | null>("cs_create", null);
  const [verifyResult, setVerifyResult] = useSessionState<VerifyBillingResult | null>("cs_verify", null);
  const [registrationDetails, setRegistrationDetails] = useSessionState<{ firstName: string; lastName: string; prefix: string; city: string } | null>("cs_reg", null);
  const [qrLoaded, setQrLoaded] = useState(false);
  const [proxyQrUrl, setProxyQrUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  // For billing_pending resumption: store the existing membershipId to reuse in OTP panel
  const [pendingMembershipId, setPendingMembershipId] = useSessionState<string | null>("cs_pendingId", null);
  // For billing_pending update flow: diff payload to apply after OTP verify
  const [pendingUpdatePayload, setPendingUpdatePayload] = useSessionState<Record<string, string> | null>("cs_pendingPayload", null);
  // For jewellery purchase confirmation popup
  const [showJewelleryPopup, setShowJewelleryPopup] = useState(false);

  // The scanned QR belongs to a staff member on duty at a jewellery branch, so
  // the customer is standing at a jewellery counter being billed.
  const staffIsJewellery = !!lockedStore?.storeType?.toLowerCase().includes("jewel");

  useEffect(() => {
    if (step === "existing_found" && lookupResult) {
      const url = lookupResult.qrCodeUrl ?? lookupResult.programCustomer?.qrCodeUrl;
      if (url && !proxyQrUrl) {
        fetchProxyImageBase64(url).then(base64 => {
          setProxyQrUrl(base64 || url);
        });
      }
    }
  }, [step, lookupResult, proxyQrUrl]);

  const handleDownloadCard = async (id: string) => {
    const cardElement = document.getElementById("membership-card-element");
    if (!cardElement) return;

    try {
      const htmlToImage = await import("html-to-image");
      const dataUrl = await htmlToImage.toPng(cardElement, {
        pixelRatio: 2,
        backgroundColor: "transparent",
      });

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `blupeacock_card_${id}.png`;
      link.click();
    } catch (err) {
      console.error("Failed to capture card", err);
    }
  };

  // ── Lookup ────────────────────────────────────────────────────────────────

  function handleLookup() {
    const result = mobileSchema.safeParse(mobile);
    if (!result.success) {
      setMobileError(result.error.issues[0].message);
      return;
    }
    setMobileError(null);
    startTransition(async () => {
      const { data, error } = await lookupMobileAction(mobile);
      if (error || !data) {
        setMobileError(error || "Unexpected error. Try again.");
        notify.error(error || "Unexpected error. Try again.");
        return;
      }
      setLookupResult(data);
      notify.success("Member lookup successful");
      if (data.source === "program_master") {
        setStep("existing_found");
      } else if (data.source === "billing_verified" || data.source === "biiling_verified") {
        // Fetch textiles info to reliably check if they already have an address
        const { data: texData } = await fetchTextilesBillingAction(mobile);

        // Never re-ask "Purchasing Jewellery?" to a customer who is already a
        // jewellery customer. Two cases per the data model:
        //   • Direct jewellery customer → store_type is Jewellery (jewStoreId
        //     is empty for them). The lookup result carries store_type directly.
        //   • Textiles customer who crossed over → store_type is Textiles and
        //     jewStoreId is populated.
        // Trim to guard against whitespace-only values that are truthy.
        const isJewelleryType = !!data.storeType?.toLowerCase().includes("jewel");
        const hasJewellery =
          isJewelleryType ||
          !!data.jewStoreId?.trim() ||
          !!texData?.jewStoreId?.trim();
        const hasAddress =
          !!texData &&
          !!texData.doorNo?.trim() &&
          !!texData.city?.trim();

        // The textiles record supplies a customer block the lookup result may
        // lack, so the membership card and the cross-over form both have
        // something to show. Applied only on the routed branches, leaving the
        // popup path's data exactly as it was.
        const mergedData = { ...data };
        if (!mergedData.customer) {
          mergedData.customer = {
            customerTitle: texData?.prefix || "",
            customerName: `${texData?.firstName || ""} ${texData?.lastName || ""}`.trim(),
            mobileNo: mobile,
            doorNo: texData?.doorNo || "",
            city: texData?.city || "",
            status: texData?.billingStatus || "PROCESSING"
          } as any;
        } else {
          mergedData.customer.city = texData?.city || mergedData.customer.city;
        }

        if (hasJewellery) {
          // Already a jewellery customer, so there is nothing to cross over.
          setLookupResult(mergedData);
          setStep("existing_found");
        } else if (staffIsJewellery) {
          // A jewellery-branch staff QR answers "Purchasing Jewellery?" by
          // itself, so skip that question and open the cross-over form, which
          // presets and locks the store for that branch. This also rescues
          // textiles customers who already have an address: they were shown
          // their card and could never be given a jewellery store.
          setLookupResult(mergedData);
          setStep("textiles_jewellery_cross");
        } else if (hasAddress) {
          setLookupResult(mergedData);
          setStep("existing_found");
        } else {
          // Address missing -> ask if purchasing jewellery first
          setShowJewelleryPopup(true);
        }
      } else if (data.source === "billing_pending") {
        // ── Smart resumption for pending registrations ──────────────────────
        setPendingMembershipId(data.membershipId);
        if (data.jewStoreId) {
          // Has jewellery store → show cross form and auto-trigger OTP
          setStep("textiles_jewellery_cross");
        } else if (data.storeId) {
          // Has store → show registration form in UPDATE mode (no fresh OTP resend yet)
          setStep("registration_form");
        } else {
          // No store yet → fresh registration
          setStep("registration_form");
        }
      } else {
        setStep("registration_form");
      }
    });
  }

  function reset() {
    sessionStorage.clear();
    setStep("mobile_entry");
    setMobile("");
    setMobileError(null);
    setLookupResult(null);
    setCreateResult(null);
    setVerifyResult(null);
    setRegistrationDetails(null);
    setPendingMembershipId(null);
    setPendingUpdatePayload(null);
  }

  function handleRegistrationSuccess(
    result: CreateBillingResult,
    details: { firstName: string; lastName: string; prefix: string; city: string }
  ) {
    setCreateResult(result);
    setRegistrationDetails(details);
    setStep("otp_verify");
  }

  function handleOtpSuccess(result: VerifyBillingResult) {
    setVerifyResult(result);
    // If this was triggered by an update flow, apply the update now
    if (pendingUpdatePayload && pendingMembershipId) {
      const input: UpdateBillingInfoInput = {
        membershipId: pendingMembershipId,
        ...pendingUpdatePayload,
      };
      updateBillingInfoAction(input).then(({ data, error: err }) => {
        if (err || !data?.success) {
          console.error("updateBillingInfo failed:", err || data?.message);
          notify.error(err || data?.message || "Failed to update address");
        } else {
          notify.success("Address updated successfully");
        }
      });
    }
    // Note: OTP verification success notification is already shown in OtpPanel component
    
    // Clear all registration form data from sessionStorage after successful verification
    clearRegistrationForm();
    
    setStep("success");
  }

  // ── STEP: Mobile Entry ────────────────────────────────────────────────────

  if (step === "mobile_entry") {
    return (
      <>
        {/* ── Jewellery Purchase Popup ─────────────────────────────────────────── */}
        {showJewelleryPopup && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            style={{ background: "rgba(15,23,42,0.6)", backdropFilter: "blur(8px)" }}
            onClick={() => setShowJewelleryPopup(false)}
          >
            <div
              className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-[0_32px_80px_-12px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Gradient header */}
              <div
                className="relative px-6 pt-6 pb-5 overflow-hidden"
                style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #1a56db 60%, #1e40af 100%)" }}
              >
                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10" style={{ background: "radial-gradient(circle, white, transparent)" }} />
                <div className="absolute bottom-0 -left-4 w-20 h-20 rounded-full opacity-10" style={{ background: "radial-gradient(circle, white, transparent)" }} />
                <div className="relative flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.6)" }}>Purchase Confirmation</p>
                      <h3 className="text-lg font-bold text-white leading-tight mt-0.5">Purchasing Jewellery?</h3>
                    </div>
                  </div>
                  <button onClick={() => setShowJewelleryPopup(false)} className="p-1.5 rounded-full transition-colors mt-0.5 flex-shrink-0" style={{ background: "rgba(255,255,255,0.12)" }}>
                    <X className="h-3.5 w-3.5 text-white" />
                  </button>
                </div>
              </div>

              {/* Options */}
              <div className="bg-white px-5 pt-4 pb-3 space-y-3">
                {/* YES - Show Cross Form */}
                <button
                  type="button"
                  onClick={() => {
                    setShowJewelleryPopup(false);
                    setStep("textiles_jewellery_cross");
                  }}
                  className="relative w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-white text-left overflow-hidden transition-all duration-200 hover:shadow-[0_4px_24px_-4px_rgba(34,197,94,0.25)] hover:border-green-200 hover:-translate-y-0.5 group"
                >
                  <div className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-gradient-to-b from-green-400 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center bg-green-50 group-hover:bg-green-600 transition-colors duration-200 shadow-sm">
                    <CheckCircle2 className="h-6 w-6 text-green-600 group-hover:text-white transition-colors duration-200" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 group-hover:text-green-700 transition-colors">Yes, I am</p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">Complete jewellery registration</p>
                  </div>
                  <div className="flex-shrink-0 w-7 h-7 rounded-full border-2 border-slate-200 group-hover:border-green-500 group-hover:bg-green-500 flex items-center justify-center transition-all duration-200">
                    <svg className="h-3.5 w-3.5 text-transparent group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </button>

                {/* NO - Show QR Code */}
                <button
                  type="button"
                  onClick={() => {
                    setShowJewelleryPopup(false);
                    setStep("existing_found");
                  }}
                  className="relative w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-white text-left overflow-hidden transition-all duration-200 hover:shadow-[0_4px_24px_-4px_rgba(29,78,216,0.25)] hover:border-blue-200 hover:-translate-y-0.5 group"
                >
                  <div className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-gradient-to-b from-blue-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-50 group-hover:bg-blue-600 transition-colors duration-200 shadow-sm">
                    <svg className="h-6 w-6 text-blue-600 group-hover:text-white transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 group-hover:text-blue-700 transition-colors">No, not today</p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">Show my membership details</p>
                  </div>
                  <div className="flex-shrink-0 w-7 h-7 rounded-full border-2 border-slate-200 group-hover:border-blue-500 group-hover:bg-blue-500 flex items-center justify-center transition-all duration-200">
                    <svg className="h-3.5 w-3.5 text-transparent group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </button>
              </div>

              {/* Trust footer */}
              <div className="bg-white px-5 pb-5">
                <div className="flex items-center justify-center gap-1.5 py-2 border-t border-slate-50">
                  <svg className="h-3 w-3 text-slate-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <p className="text-[10px] text-slate-400 font-medium">Choose your preferred option</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-5 max-w-md mx-auto w-full">
        <div className="space-y-1">
         <h1 className="text-sm md:text-sm font-bold tracking-wide bg-gradient-to-r from-blue-700 via-blue-500 to-blue-900 bg-clip-text text-transparent drop-shadow-sm">
            Continue with Mobile Verification
         </h1>
          <p className="text-sm text-slate-500">
            Enter your 10-digit mobile number below
          </p>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="mobile-input" className="text-sm font-medium">
            Mobile Number
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              id="mobile-input"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              autoFocus
              value={mobile}
              onChange={(e) => {
                let val = e.target.value.replace(/\D/g, "");
                // Prevent starting with 0-5
                val = val.replace(/^[0-5]+/, "").slice(0, 10);
                setMobile(val);
                setMobileError(null);
              }}
              onKeyDown={(e) => { if (e.key === "Enter" && !isPending && mobile.length === 10) handleLookup(); }}
              disabled={isPending}
              placeholder="Enter 10-digit mobile number"
              className={`pl-9 h-11 text-base ${mobileError ? "!border-2 !border-red-500 focus-visible:!ring-red-500/20" : ""}`}
            />
          </div>

          {mobileError && (
            <Alert variant="destructive" className="py-2.5">
              <AlertDescription className="text-xs">{mobileError}</AlertDescription>
            </Alert>
          )}
        </div>

        <Button
          onClick={handleLookup}
          disabled={isPending || mobile.length < 10}
          className="w-full h-11 text-sm font-semibold"
          size="lg"
        >
          {isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Checking...</>
          ) : (
            "Continue"
          )}
        </Button>
      </div>
      </>
    );
  }

  // ── STEP: Existing Member Found ───────────────────────────────────────────

  if (step === "existing_found" && lookupResult) {
    const pc = lookupResult.programCustomer;
    const cu = lookupResult.customer;
    const displayName =
      pc ? `${pc.firstName} ${pc.lastName}`
        : cu ? cu.customerName
          : `${lookupResult.firstName ?? ""} ${lookupResult.lastName ?? ""}`.trim();
    const displayCity = pc?.city ?? cu?.city ?? "";
    const membershipId = lookupResult.membershipId ?? pc?.membershipId ?? "";
    const level = String(pc?.level || lookupResult.billingStatus || "PROCESSING");
    const qrCodeUrl = lookupResult.qrCodeUrl ?? pc?.qrCodeUrl;

    // ── Tier config (inline) ────────────────────────────────────────────────
    const t = level.toUpperCase();
    const isPlatinum = t.includes("PLATINUM");
    const isGold = t.includes("GOLD") || t === "A";
    const isSilver = t.includes("SILVER") || t === "B";
    const tierGradient = isPlatinum
      ? "from-[#23262e] via-[#59616f] to-[#101216]"
      : isGold ? "from-[#412c0b] via-[#c4932c] to-[#1f1404]"
        : isSilver ? "from-[#333b45] via-[#7c8794] to-[#202730]"
          : "from-[#131a54] via-[#2a45c4] to-[#06091e]";
    const tierGlow = isPlatinum ? "shadow-slate-500/40"
      : isGold ? "shadow-amber-600/40"
        : isSilver ? "shadow-slate-400/40"
          : "shadow-blue-700/45";

    return (
      <div className="space-y-5 max-w-md mx-auto w-full">
        {/* Loyalty Note at the top (only for non-loyalty customers) */}
        {lookupResult.source !== "program_master" && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-3 text-center shadow-md">
            <p className="text-xs font-medium text-green-900 leading-relaxed">
              <span className="font-bold bg-green-200 px-2 py-0.5 rounded text-green-900">Note:</span> Join our Loyalty Program and get a welcome bonus up to <span className="text-lg font-extrabold text-green-700 inline-block mx-0.5">₹200</span> along with exclusive privileges and luxurious rewards. Become part of our Loyalty Circle today.{" "}
              <a
                href="https://www.blupeacock.in/Blupeacock-Membership-Account/join_membership"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-700 font-extrabold underline decoration-2 underline-offset-2 hover:text-green-900 hover:decoration-green-900 transition-colors"
              >
                Click here to join now
              </a>
            </p>
          </div>
        )}

        {/* ── Premium membership card ── */}
        <div
          id="membership-card-element"
          className={`
            relative overflow-hidden rounded-3xl
            bg-gradient-to-br ${tierGradient}
            shadow-2xl ${tierGlow}
            p-6
          `}
        >
          {/* Dot-grid texture */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />

          {/* Top row: logo */}
          <div className="relative flex items-center mb-5">
            <img
              src="/blupeacock3.png"
              alt="Logo"
              width={90}
              height={30}
              className="object-contain brightness-0 invert opacity-90"
            />
          </div>

          {/* Member name */}
          <div className="relative text-center mb-5">
            <p className="text-lg font-bold text-white tracking-wide">{displayName}</p>
            {displayCity && (
              <p className="text-xs text-white/60 mt-0.5">{displayCity}</p>
            )}
          </div>

          {/* QR Code Streamed from URL */}
          {qrCodeUrl && (
            <div className="relative flex justify-center mb-5">
              <div className="bg-white p-3 rounded-2xl shadow-lg ring-2 ring-white/30 relative w-[204px] h-[204px] flex items-center justify-center">
                {!qrLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
                  </div>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={proxyQrUrl || qrCodeUrl}
                  alt="Membership QR Code"
                  width={180}
                  height={180}
                  onLoad={() => setQrLoaded(true)}
                  className={`rounded-lg object-contain relative z-10 transition-opacity duration-300 ${qrLoaded ? "opacity-100" : "opacity-0"}`}
                />

                {/* Download Overlay Button */}
                {qrLoaded && (
                  <button
                    onClick={() => handleDownloadCard(membershipId)}
                    className="absolute bottom-2 right-2 z-20 bg-white/90 p-2 rounded-full shadow-md hover:bg-blue-50 text-blue-600 transition-all active:scale-95 group"
                    title="Download Membership Card"
                  >
                    <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Membership ID */}
          {membershipId && (
            <div className="relative text-center mb-4">
              <p className="text-[10px] font-medium tracking-widest uppercase text-white/60 mb-1">
                Membership ID
              </p>
              <p className="text-2xl font-bold font-mono tracking-wider text-white drop-shadow-sm">
                {formatMembershipId(membershipId)}
              </p>
            </div>
          )}

          {/* Divider */}
          <div className="relative border-t border-white/20 my-4" />

          {/* Bottom row: mobile */}
          <div className="relative flex items-center">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/60">Mobile</p>
              <div className="text-sm font-semibold text-white mt-0.5">
                <HiddenMobile mobile={mobile} iconClassName="hover:bg-white/20" />
              </div>
            </div>
          </div>
        </div>

        {/* Sub-text */}
        <div className="text-center px-2">
          <p className="text-xs text-slate-500 leading-relaxed">
            Show this QR code at the Store for Quick Billing.
          </p>
        </div>

        <Button variant="outline" onClick={reset} className="w-full h-10 text-sm gap-2 border-slate-200">
          <ArrowLeft className="h-4 w-4" />
          Search Another
        </Button>
      </div>
    );
  }


  // ── STEP: Registration Form ───────────────────────────────────────────────

  if (step === "registration_form") {
    const lr = lookupResult;
    const baseCustomer = lr?.customer || {} as any;
    const isPendingUpdate = lr?.source === "billing_pending" && !!pendingMembershipId;

    // Merge customer sub-object with top-level billing_pending address fields.
    // Note: Customer type uses "pinCode" (capital C); BillingByMobileResult uses "pincode".
    const initialCustomerData = {
      ...baseCustomer,
      customerName:
        baseCustomer.customerName ||
        `${lr?.firstName || ""} ${lr?.lastName || ""}`.trim(),
      doorNo:  baseCustomer.doorNo  || lr?.doorNo  || "",
      street:  baseCustomer.street  || lr?.street  || "",
      pinCode: baseCustomer.pinCode || lr?.pincode  || "",
      area:    baseCustomer.area    || lr?.area     || "",
      taluk:   baseCustomer.taluk   || lr?.taluk    || "",
      city:    baseCustomer.city    || lr?.city     || "",
      state:   baseCustomer.state   || lr?.state    || "",
    };

    // Pre-select storeId from billing_pending top-level field
    const preselectedStoreId = lr?.storeId ?? null;

    return (
      <RegistrationForm
        mobileNo={mobile}
        stores={stores}
        staffEcno={staffEcno}
        lockedStore={lockedStore}
        initialData={initialCustomerData}
        initialStoreId={preselectedStoreId}
        isPendingUpdate={isPendingUpdate}
        pendingMembershipId={pendingMembershipId}
        onRequestUpdate={(payload) => {
          // Store the diff payload and resend OTP, then go to OTP verify
          setPendingUpdatePayload(payload);
          resendOtpAction(mobile).then(({ data, error: err }) => {
            if (err || !data?.success) {
              console.error("Resend OTP failed:", err);
              notify.error(err || "Failed to resend OTP");
              return;
            }
            notify.info("OTP resent for verification");
            setCreateResult({ success: true, message: "OTP resent for update", membershipId: pendingMembershipId });
            setStep("pending_update_otp");
          });
        }}
        onSuccess={handleRegistrationSuccess}
        onBack={reset}
      />
    );
  }


  // ── STEP: Textiles to Jewellery Cross ─────────────────────────────────────

  if (step === "textiles_jewellery_cross") {
    const isResumingPending = !!pendingMembershipId;

    return (
      <TextilesJewelleryCrossForm
        mobileNo={mobile}
        stores={stores}
        lockedStore={lockedStore}
        isPendingUpdate={isResumingPending}
        onSuccess={(details) => {
          setRegistrationDetails({
            firstName: details.firstName,
            lastName: details.lastName,
            prefix: details.prefix,
            city: details.city,
          });

          if (isResumingPending) {
            // billing_pending resumption: address updated + OTP already sent via channel modal
            setCreateResult({ success: true, message: "Address updated, verify OTP", membershipId: pendingMembershipId });
            setStep("otp_verify");
          } else {
            // Normal cross-over: go straight to success (no OTP needed)
            setVerifyResult({
              success: true,
              membershipId: details.membershipId,
              mobileNo: mobile,
              message: "Successfully registered for Jewellery",
              billingStatus: details.tierGrade || "Member",
              qrCodeUrl: details.qrCodeUrl || null,
              tierGrade: details.tierGrade || null,
            });
            
            // Clear all registration form data from sessionStorage after successful registration
            clearCrossForm();
            
            setStep("success");
          }
        }}
        onBack={() => {
          // An established customer who decides against jewellery lands back on
          // their membership card instead of at the start of the flow. Only a
          // pending resumption has nothing to fall back to.
          if (!pendingMembershipId && lookupResult) {
            setStep("existing_found");
          } else {
            reset();
          }
        }}
      />
    );
  }

  // ── STEP: OTP Verification ────────────────────────────────────────────────

  if (step === "otp_verify" && (createResult || pendingMembershipId)) {
    // Use pendingMembershipId for billing_pending resumption, or createResult for fresh registration
    const membershipIdForOtp = pendingMembershipId || createResult?.membershipId!;
    return (
      <div className="max-w-md mx-auto w-full">
        <OtpPanel
          membershipId={membershipIdForOtp}
          mobileNo={mobile}
          onSuccess={handleOtpSuccess}
          onBack={() => {
            if (pendingMembershipId) {
              reset();
            } else {
              setStep("registration_form");
            }
          }}
        />
      </div>
    );
  }

  // ── STEP: pending_update_otp — OTP verify before applying the update ─────

  if (step === "pending_update_otp" && pendingMembershipId) {
    return (
      <div className="max-w-md mx-auto w-full">
        <OtpPanel
          membershipId={pendingMembershipId}
          mobileNo={mobile}
          onSuccess={handleOtpSuccess}
          onBack={() => setStep("registration_form")}
        />
      </div>
    );
  }

  // ── STEP: Success ─────────────────────────────────────────────────────────

  if (step === "success" && verifyResult) {
    const fullName = registrationDetails
      ? `${registrationDetails.prefix} ${registrationDetails.firstName} ${registrationDetails.lastName}`
      : undefined;

    return (
      <div className="max-w-md mx-auto w-full">
        <MembershipSuccessCard result={verifyResult} onReset={reset} customerName={fullName} customerCity={registrationDetails?.city} />
      </div>
    );
  }

  return null;
}
