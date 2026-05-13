"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Phone,
  Loader2,
  Crown,
  CheckCircle2,
  ArrowLeft,
  Download,
} from "lucide-react";

import { lookupMobileAction, fetchTextilesBillingAction, fetchProxyImageBase64, resendOtpAction, updateBillingInfoAction } from "@/app/customer/actions";
import { RegistrationForm } from "@/components/customer/registration-form";
import { TextilesJewelleryCrossForm } from "@/components/customer/textiles-jewellery-cross-form";
import { useRegistrationFormStore, useCrossFormStore } from "@/lib/store";
import { OtpPanel } from "@/components/customer/otp-panel";
import { mobileSchema } from "@/lib/validations/billing";

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
import { Badge } from "@/components/ui/badge";
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
}

export function CustomerShell({ stores, staffEcno }: CustomerShellProps) {
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

        const hasAddress = !!(texData && texData.doorNo && texData.city);

        if (hasAddress) {
          // If address is already filled, inject texData into lookupResult so the UI displays correctly
          const updatedData = { ...data };
          if (!updatedData.customer) {
            updatedData.customer = {
              customerTitle: texData.prefix || "",
              customerName: `${texData.firstName || ""} ${texData.lastName || ""}`.trim(),
              mobileNo: mobile,
              doorNo: texData.doorNo || "",
              city: texData.city || "",
              status: texData.billingStatus || "PROCESSING"
            } as any;
          } else {
            updatedData.customer.city = texData.city || updatedData.customer.city;
          }
          setLookupResult(updatedData);
          setStep("existing_found");
        } else {
          // Address missing -> ask for address update via crossover form
          setStep("textiles_jewellery_cross");
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
    const tierGrade = pc?.tierGrade || lookupResult.billingStatus;
    const qrCodeUrl = lookupResult.qrCodeUrl ?? pc?.qrCodeUrl;

    // ── Tier config (inline) ────────────────────────────────────────────────
    const t = level.toUpperCase();
    const isPlatinum = t.includes("PLATINUM");
    const isGold = t.includes("GOLD") || t === "A";
    const isSilver = t.includes("SILVER") || t === "B";
    const tierGradient = isPlatinum
      ? "from-slate-700 via-slate-600 to-slate-800"
      : isGold ? "from-amber-700 via-yellow-600 to-amber-800"
        : isSilver ? "from-slate-500 via-slate-400 to-slate-600"
          : "from-blue-800 via-blue-700 to-blue-900";
    const tierBadge = isPlatinum
      ? "bg-slate-400/20 text-slate-100 border-slate-400/40"
      : isGold ? "bg-amber-300/20 text-amber-100 border-amber-400/40"
        : isSilver ? "bg-slate-200/20 text-slate-100 border-slate-300/40"
          : "bg-blue-400/20 text-blue-100 border-blue-400/40";
    const tierLabel = isPlatinum ? "Platinum"
      : isGold ? "Gold"
        : isSilver ? "Silver"
          : (t === "VERIFIED" || t === "ACTIVE MEMBER") ? "Processing"
            : tierGrade ? tierGrade
              : level ? level
                : "Processing";
    const tierGlow = isPlatinum ? "shadow-slate-400/30"
      : isGold ? "shadow-amber-400/30"
        : isSilver ? "shadow-slate-300/30"
          : "shadow-blue-400/30";

    return (
      <div className="space-y-5 max-w-md mx-auto w-full">
        {/* Loyalty Note at the top (only for non-loyalty customers) */}
        {lookupResult.source !== "program_master" && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center shadow-sm">
            <p className="text-xs font-medium text-blue-800 leading-relaxed">
              <span className="font-bold">Note:</span> Join our Loyalty Program and get a welcome bonus up to ₹200 along with exclusive privileges and luxurious rewards. Become part of our Loyalty Circle today.{" "}
              <a
                href="https://www.blupeacock.in/Blupeacock-Membership-Account/join_membership"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-900 font-bold underline hover:underline"
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

          {/* Top row: logo + tier badge */}
          <div className="relative flex items-center justify-between mb-5">
            <img
              src="/blupeacock3.png"
              alt="Logo"
              width={90}
              height={30}
              className="object-contain brightness-0 invert opacity-90"
            />
            <Badge
              className={`
                flex items-center gap-1.5 px-3 py-1 rounded-full
                text-xs font-semibold border ${tierBadge} backdrop-blur-sm
              `}
            >
              <Crown className="h-3.5 w-3.5" />
              {tierLabel.toUpperCase()}
            </Badge>
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
                {membershipId}
              </p>
            </div>
          )}

          {/* Divider */}
          <div className="relative border-t border-white/20 my-4" />

          {/* Bottom row: mobile + status */}
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/60">Mobile</p>
              <div className="text-sm font-semibold text-white mt-0.5">
                <HiddenMobile mobile={mobile} iconClassName="hover:bg-white/20" />
              </div>
            </div>
            <Badge className="bg-white/10 border-white/20 text-white text-xs px-2 py-0.5 rounded-full">
              Active Member
            </Badge>
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
        onBack={reset}
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
