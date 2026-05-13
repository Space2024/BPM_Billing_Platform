"use client";
import { useState, useEffect } from "react";
import { Loader2, ArrowLeft, Store, MapPin, X, ArrowRight } from "lucide-react";
import { fetchTextilesBillingAction, updateJewelleryBillingAction, resendOtpAction } from "@/app/customer/actions";
import { useCrossFormStore } from "@/lib/store";
import { notify } from "@/components/ui/notifications";
import { crossFormStep1Schema, crossFormFullSchema } from "@/lib/validations/billing";
import { StoreOption, TextilesBillingResult } from "@/types/billing";
import { HiddenMobile } from "@/components/customer/hidden-mobile";
import { StoreCombobox } from "@/components/customer/store-combobox";
import { usePincodeLookup } from "@/hooks/use-pincode-lookup";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toTitleCase } from "@/lib/utils";
import { AreaCombobox } from "@/components/customer/area-combobox";

// ─── Field wrapper (matches registration-form style) ────────────────────────

function Field({
  id, label, required, error, children,
}: { id: string; label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5 flex flex-col">
      <Label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
      {error && (
        <span className="text-[11px] text-red-500 font-medium leading-tight mt-0.5">
          {error}
        </span>
      )}
    </div>
  );
}

// ─── Section heading ─────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-100">
      {children}
    </div>
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface TextilesJewelleryCrossFormProps {
  mobileNo: string;
  stores: StoreOption[];
  /** Called once on mount — used to auto-resend OTP for billing_pending resumption */
  onMounted?: () => void | Promise<void>;
  /** When true, show Update & Verify OTP button instead of Submit Details */
  isPendingUpdate?: boolean;
  onSuccess: (details: {
    membershipId: string;
    firstName: string;
    lastName: string;
    prefix: string;
    city: string;
    tierGrade?: string | null;
    qrCodeUrl?: string | null;
  }) => void;
  onBack: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TextilesJewelleryCrossForm({
  mobileNo,
  stores,
  onMounted,
  onSuccess,
  onBack,
  isPendingUpdate = false,
}: TextilesJewelleryCrossFormProps) {
  // Get clearForm from Zustand store
  const clearForm = useCrossFormStore((state) => state.clearForm);
  
  const [fetching, setFetching] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [textilesData, setTextilesData] = useState<TextilesBillingResult | null>(null);
  const [showChannelModal, setShowChannelModal] = useState(false);

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setTimeout(() => {
      validateAll(false);
    }, 0);
  };

  // Zustand store
  const selectedJewStoreId = useCrossFormStore((state) => state.selectedJewStoreId);
  const setSelectedJewStoreId = useCrossFormStore((state) => state.setSelectedJewStoreId);
  const doorNo = useCrossFormStore((state) => state.doorNo);
  const setDoorNo = useCrossFormStore((state) => state.setDoorNo);
  const street = useCrossFormStore((state) => state.street);
  const setStreet = useCrossFormStore((state) => state.setStreet);
  const pincode = useCrossFormStore((state) => state.pincode);
  const setPincode = useCrossFormStore((state) => state.setPincode);
  const area = useCrossFormStore((state) => state.area);
  const setArea = useCrossFormStore((state) => state.setArea);
  const taluk = useCrossFormStore((state) => state.taluk);
  const setTaluk = useCrossFormStore((state) => state.setTaluk);
  const city = useCrossFormStore((state) => state.city);
  const setCity = useCrossFormStore((state) => state.setCity);
  const state = useCrossFormStore((state) => state.state);
  const setState = useCrossFormStore((state) => state.setState);
  const country = useCrossFormStore((state) => state.country);
  const setCountry = useCrossFormStore((state) => state.setCountry);
  const mobileStep = useCrossFormStore((state) => state.mobileStep);
  const setMobileStep = useCrossFormStore((state) => state.setMobileStep);

  // Only jewellery stores in combobox
  const jewStores = stores.filter((s) => s.storeType?.toLowerCase().includes("jewel"));

  // Available areas from pincode lookup
  const [availableAreas, setAvailableAreas] = useState<string[]>([]);

  // Pincode auto-fill
  const { loading: pincodeLoading, data: pincodeData, error: pincodeError } = usePincodeLookup(pincode);

  useEffect(() => {
    if (pincodeData) {
      setAvailableAreas(pincodeData.areas);
      if (!area && pincodeData.areas.length > 0) setArea(pincodeData.areas[0]);
      if (!taluk) setTaluk(pincodeData.taluk);
      if (!city) setCity(pincodeData.city);
      if (!state) setState(pincodeData.state);
      if (!country || country === "India") setCountry(pincodeData.country);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pincodeData]);

  // Auto-fetch textiles record on mount + call onMounted (for OTP resend in pending resumption)
  useEffect(() => {
    async function loadData() {
      setFetching(true);
      setError(null);
      const { data, error: err } = await fetchTextilesBillingAction(mobileNo);
      if (err || !data?.success) {
        setError(err || "Failed to load customer details.");
      } else {
        setTextilesData(data);
        // Pre-fill all address fields from existing record
        if (data.doorNo) setDoorNo(data.doorNo);
        if (data.street) setStreet(data.street);
        if (data.pincode) setPincode(data.pincode);
        if (data.area) setArea(data.area);
        if (data.taluk) setTaluk(data.taluk);
        if (data.city) setCity(data.city);
        if (data.state) setState(data.state);
        if (data.country) setCountry(data.country);
        // Auto-select jewellery store if already assigned
        if (data.jewStoreId) setSelectedJewStoreId(data.jewStoreId);
      }
      setFetching(false);
      // Fire onMounted after data loads (e.g. auto-resend OTP for pending)
      if (onMounted) await onMounted();
    }
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobileNo]);

  function validateStep1(showErrorsAndFocus: boolean = true): boolean {
    const result = crossFormStep1Schema.safeParse({ storeId: selectedJewStoreId });
    if (!result.success) {
      const formatted = result.error.format();
      const errs: Record<string, string> = {};
      if (formatted.storeId?._errors[0]) errs.storeId = formatted.storeId._errors[0];
      setFieldErrors(errs);

      if (showErrorsAndFocus) {
        setTouched(prev => ({ ...prev, ...Object.fromEntries(Object.keys(errs).map(k => [k, true])) }));
        setTimeout(() => {
          const els = document.querySelectorAll('.border-red-500');
          for (let i = 0; i < els.length; i++) {
            const el = els[i] as HTMLElement;
            if (el.offsetParent !== null) {
              el.focus();
              break;
            }
          }
        }, 50);
      }
      return false;
    }
    setFieldErrors({});
    if (showErrorsAndFocus) setError(null);
    return true;
  }

  function validateAll(showErrorsAndFocus: boolean = true): boolean {
    const dataToValidate = { storeId: selectedJewStoreId, doorNo: doorNo.trim(), street: street.trim(), pincode: pincode.trim(), area: area.trim(), city: city.trim(), state: state.trim() };
    const result = crossFormFullSchema.safeParse(dataToValidate);
    
    if (!result.success) {
      const formatted = result.error.format() as any;
      const errs: Record<string, string> = {};
      if (formatted.storeId?._errors[0]) errs.storeId = formatted.storeId._errors[0];
      if (formatted.doorNo?._errors[0]) errs.doorNo = formatted.doorNo._errors[0];
      if (formatted.street?._errors[0]) errs.street = formatted.street._errors[0];
      if (formatted.pincode?._errors[0]) errs.pincode = formatted.pincode._errors[0];
      if (formatted.area?._errors[0]) errs.area = formatted.area._errors[0];
      if (formatted.city?._errors[0]) errs.city = formatted.city._errors[0];
      if (formatted.state?._errors[0]) errs.state = formatted.state._errors[0];
      setFieldErrors(errs);

      if (showErrorsAndFocus) {
        setTouched(prev => ({ ...prev, ...Object.fromEntries(Object.keys(errs).map(k => [k, true])) }));
        setTimeout(() => {
          const els = document.querySelectorAll('.border-red-500');
          for (let i = 0; i < els.length; i++) {
            const el = els[i] as HTMLElement;
            if (el.offsetParent !== null) {
              el.focus();
              break;
            }
          }
        }, 50);
      }
      return false;
    }
    setFieldErrors({});
    if (showErrorsAndFocus) setError(null);
    return true;
  }

  // ── Derived Valid State ───────────────────────────────────────────────────
  const isStep1Valid = !!selectedJewStoreId;
  const isAddressValid = !!(doorNo.trim() && street.trim() && pincode.trim().length === 6 && area.trim());
  const isAllValid = isStep1Valid && isAddressValid;

  function handleMobileNext() {
    if (!validateStep1()) return;
    setMobileStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateAll()) return;

    // For billing_pending: show channel modal to resend OTP before submitting
    if (isPendingUpdate) {
      setShowChannelModal(true);
      return;
    }

    await doSubmit();
  }

  async function doSubmit(sms = true, wa = false) {
    setSubmitting(true);

    // For billing_pending: resend OTP with chosen channel first
    if (isPendingUpdate) {
      await resendOtpAction(mobileNo, sms, wa);
    }

    const { data, error: err } = await updateJewelleryBillingAction({
      mobileNo,
      jewStoreId: selectedJewStoreId,
      doorNo: doorNo.trim(),
      street: street.trim(),
      area: area.trim(),
      taluk: taluk.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      country: country.trim() || "India",
    });
    setSubmitting(false);

    if (err || !data?.success) {
      const msg = err || data?.message || "Failed to update details. Please try again.";
      setError(msg);
      notify.error(msg);
      return;
    }

    notify.success("Store details updated successfully");

    // Clear all cross-form data from sessionStorage after successful update
    clearForm();

    onSuccess({
      membershipId: textilesData?.membershipId || "",
      firstName: textilesData?.firstName || "",
      lastName: textilesData?.lastName || "",
      prefix: textilesData?.prefix || "",
      city: city.trim(),
      tierGrade: data?.tierGrade || textilesData?.billingStatus || null,
      qrCodeUrl: data?.qrCodeUrl || null,
    });
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
        <p className="text-sm text-slate-500 font-medium">Loading member details…</p>
      </div>
    );
  }

  // ── Fatal error ───────────────────────────────────────────────────────────

  if (!textilesData && error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={onBack} className="w-full h-11">
          <ArrowLeft className="h-4 w-4 mr-1" /> Go Back
        </Button>
      </div>
    );
  }

  const originalStore = stores.find((s) => s.storeId === textilesData?.storeId);

  // ── Address fields block (reused across desktop + mobile) ─────────────────

  const addressFields = (
    <div className="space-y-4">
      <SectionTitle>Address Details</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <Field id="jcf-doorNo" label="Door No." required error={touched.doorNo ? fieldErrors.doorNo : undefined}>
          <Input
            id="jcf-doorNo"
            value={doorNo}
            onChange={(e) => setDoorNo(toTitleCase(e.target.value))} onBlur={() => handleBlur("doorNo")}
            disabled={submitting}
            placeholder="12A"
            className={`h-10 ${touched.doorNo && fieldErrors.doorNo ? "!border-2 !border-red-500 focus-visible:!ring-red-500/20" : ""}`}
          />
        </Field>
        <Field id="jcf-street" label="Street" required error={touched.street ? fieldErrors.street : undefined}>
          <Input
            id="jcf-street"
            value={street}
            onChange={(e) => setStreet(toTitleCase(e.target.value))} onBlur={() => handleBlur("street")}
            disabled={submitting}
            placeholder="Street / Road"
            className={`h-10 ${touched.street && fieldErrors.street ? "!border-2 !border-red-500 focus-visible:!ring-red-500/20" : ""}`}
          />
        </Field>
        <Field id="jcf-pincode" label="Pincode" required error={touched.pincode ? fieldErrors.pincode : undefined}>
          <div className="relative">
            <Input
              id="jcf-pincode"
              value={pincode}
              inputMode="numeric"
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                setPincode(val);
                if (val.length < 6) { setAvailableAreas([]); setArea(""); setTaluk(""); setCity(""); setState(""); }
              }}
              onBlur={() => handleBlur("pincode")}
              disabled={submitting}
              placeholder="600002"
              className={`h-10 pr-8 ${touched.pincode && fieldErrors.pincode ? "!border-2 !border-red-500 focus-visible:!ring-red-500/20" : ""}`}
              maxLength={6}
            />
            {pincodeLoading && (
              <MapPin className="absolute right-2.5 top-2.5 h-4 w-4 text-blue-500 animate-pulse" />
            )}
          </div>
          {pincodeError && <p className="text-xs text-amber-600 mt-1">{pincodeError}</p>}
        </Field>
        <Field id="jcf-area" label="Area" required error={touched.area ? fieldErrors.area : undefined}>
          {availableAreas.length > 0 ? (
            <AreaCombobox areas={availableAreas} value={area} onChange={setArea} disabled={submitting} error={touched.area ? !!fieldErrors.area : false} />
          ) : (
            <Input
              id="jcf-area"
              value={area}
              onChange={(e) => setArea(toTitleCase(e.target.value))}
              disabled={submitting}
              placeholder="Area / Colony"
              className={`h-10 ${touched.area && fieldErrors.area ? "!border-2 !border-red-500 focus-visible:!ring-red-500/20" : ""}`}
            />
          )}
        </Field>
        <Field id="jcf-taluk" label="Taluk">
          <Input
            id="jcf-taluk"
            value={taluk}
            onChange={(e) => setTaluk(toTitleCase(e.target.value))}
            disabled={true}
            placeholder="Taluk (optional)"
            className="h-10 bg-slate-50 cursor-not-allowed"
          />
        </Field>
        <Field id="jcf-city" label="City" required>
          <Input
            id="jcf-city"
            value={city}
            onChange={(e) => setCity(toTitleCase(e.target.value))}
            disabled={true}
            placeholder="City"
            className="h-10 bg-slate-50 cursor-not-allowed"
          />
        </Field>
        <Field id="jcf-state" label="State" required>
          <Input
            id="jcf-state"
            value={state}
            onChange={(e) => setState(toTitleCase(e.target.value))}
            disabled={true}
            placeholder="State"
            className="h-10 bg-slate-50 cursor-not-allowed"
          />
        </Field>
        <Field id="jcf-country" label="Country">
          <Input
            id="jcf-country"
            value={country}
            onChange={(e) => setCountry(toTitleCase(e.target.value))}
            disabled={true}
            placeholder="Country"
            className="h-10 bg-slate-50 cursor-not-allowed"
          />
        </Field>
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
    <form onSubmit={handleSubmit} noValidate>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg md:text-sm font-bold tracking-wide bg-gradient-to-r from-blue-700 via-blue-500 to-blue-900 bg-clip-text text-transparent drop-shadow-sm">
            Select Store & Update Address
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Choose your jewellery store to proceed with registration
          </p>
        </div>
        <Badge variant="outline" className="shrink-0 px-2.5 py-1 text-slate-600 bg-white shadow-sm border-slate-200">
          <HiddenMobile mobile={mobileNo} className="text-[11px]" />
        </Badge>
      </div>

      <Separator className="mb-5" />

      {/* ── DESKTOP: two columns ─────────────────────────────────────────────── */}
      <div className="hidden lg:grid lg:grid-cols-2 lg:gap-8">

        {/* Left: Auto-filled info + Store picker */}
        <div className="space-y-5">
          {/* Auto-filled personal details */}
          <div className="space-y-4">
            <SectionTitle>Member Details (Auto-filled)</SectionTitle>
            <div className="grid grid-cols-3 gap-3">
              <Field id="jcf-prefix-d" label="Prefix">
                <Input
                  id="jcf-prefix-d"
                  value={textilesData?.prefix || ""}
                  disabled
                  className="h-10 bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </Field>
              <Field id="jcf-firstName-d" label="First Name">
                <Input
                  id="jcf-firstName-d"
                  value={textilesData?.firstName || ""}
                  disabled
                  className="h-10 bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </Field>
              <Field id="jcf-lastName-d" label="Last Name">
                <Input
                  id="jcf-lastName-d"
                  value={textilesData?.lastName || ""}
                  disabled
                  className="h-10 bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </Field>
            </div>
          </div>

          {/* Original store */}
          <div className="space-y-4">
            <SectionTitle>Existing Textiles Store</SectionTitle>
            <div className="flex items-center gap-2.5 px-3 h-10 rounded-md border border-slate-200 bg-slate-50">
              <Store className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="text-sm text-slate-500 truncate">
                {originalStore
                  ? `${originalStore.storeName} – ${originalStore.location}`
                  : (textilesData?.storeId || "N/A")}
              </span>
            </div>
          </div>

          {/* Jewellery store picker */}
          <div className="space-y-4">
            <SectionTitle>Select Jewellery Store</SectionTitle>
            <Field id="jcf-store-d" label="Jewellery Store" required error={touched.storeId ? fieldErrors.storeId : undefined}>
              <StoreCombobox
                stores={jewStores}
                value={selectedJewStoreId}
                onChange={(storeId) => setSelectedJewStoreId(storeId)}
                disabled={submitting}
                placeholder="Search jewellery store..."
                error={touched.storeId ? !!fieldErrors.storeId : false}
              />
            </Field>
          </div>
        </div>

        {/* Right: Address */}
        <div>{addressFields}</div>
      </div>

      {/* ── MOBILE: multi-step ───────────────────────────────────────────────── */}
      <div className="lg:hidden space-y-5">

        {/* Step 1: Auto-filled + Store picker */}
        {mobileStep === 1 && (
          <>
            <div className="space-y-4">
              <SectionTitle>Member Details (Auto-filled)</SectionTitle>
              <div className="grid grid-cols-3 gap-3">
                <Field id="jcf-prefix-m" label="Prefix">
                  <Input
                    id="jcf-prefix-m"
                    value={textilesData?.prefix || ""}
                    disabled
                    className="h-10 bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                </Field>
                <Field id="jcf-firstName-m" label="First Name">
                  <Input
                    id="jcf-firstName-m"
                    value={textilesData?.firstName || ""}
                    disabled
                    className="h-10 bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                </Field>
                <Field id="jcf-lastName-m" label="Last Name">
                  <Input
                    id="jcf-lastName-m"
                    value={textilesData?.lastName || ""}
                    disabled
                    className="h-10 bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                </Field>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <SectionTitle>Existing Textiles Store</SectionTitle>
              <div className="flex items-center gap-2.5 px-3 h-10 rounded-md border border-slate-200 bg-slate-50">
                <Store className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="text-sm text-slate-500 truncate">
                  {originalStore
                    ? `${originalStore.storeName} – ${originalStore.location}`
                    : (textilesData?.storeId || "N/A")}
                </span>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <SectionTitle>Select Jewellery Store</SectionTitle>
              <Field id="jcf-store-m" label="Jewellery Store" required error={touched.storeId ? fieldErrors.storeId : undefined}>
                <StoreCombobox
                  stores={jewStores}
                  value={selectedJewStoreId}
                  onChange={(storeId) => setSelectedJewStoreId(storeId)}
                  disabled={submitting}
                  placeholder="Search jewellery store..."
                  error={touched.storeId ? !!fieldErrors.storeId : false}
                />
              </Field>
            </div>
          </>
        )}

        {/* Step 2: Address */}
        {mobileStep === 2 && addressFields}

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 py-1">
          <div className={`h-1.5 w-8 rounded-full transition-colors ${mobileStep === 1 ? "bg-blue-600" : "bg-slate-200"}`} />
          <div className={`h-1.5 w-8 rounded-full transition-colors ${mobileStep === 2 ? "bg-blue-600" : "bg-slate-200"}`} />
        </div>
      </div>

      {/* ── Error ─────────────────────────────────────────────────────────────── */}
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {/* ── Actions ───────────────────────────────────────────────────────────── */}
      <div className="flex gap-3 pt-4 mt-1">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (mobileStep === 2) {
              setMobileStep(1);
              setError(null);
            } else {
              onBack();
            }
          }}
          disabled={submitting}
          className="flex-1 h-11"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {mobileStep === 2 ? "Previous" : "Back"}
        </Button>

        {/* Mobile: Next step button (step 1 only) */}
        {mobileStep === 1 && (
          <Button
            type="button"
            onClick={handleMobileNext}
            disabled={submitting || !isStep1Valid}
            className="flex-[2] h-11 font-semibold lg:hidden"
          >
            Next →
          </Button>
        )}

        {/* Submit: always on desktop, only on step 2 on mobile */}
        {/* Mobile step 2: Submit */}
        {(mobileStep === 2) && (
          <Button
            type="submit"
            disabled={submitting || !isAllValid}
            className={`flex-[2] h-11 font-semibold ${
              isPendingUpdate
                ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                : ""
            }`}
          >
            {submitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating…</>
            ) : isPendingUpdate ? (
              <><ArrowRight className="mr-2 h-4 w-4" />Update &amp; Verify OTP</>
            ) : (
              "Submit Details"
            )}
          </Button>
        )}

        {/* Desktop submit (always visible on desktop) */}
        <Button
          type="submit"
          disabled={submitting || !isAllValid}
          className={[
            "flex-[2] h-11 font-semibold hidden lg:flex",
            isPendingUpdate
              ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              : "",
          ].filter(Boolean).join(" ")}
        >
          {submitting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating…</>
          ) : isPendingUpdate ? (
            <><ArrowRight className="mr-2 h-4 w-4" />Update &amp; Verify OTP</>
          ) : (
            "Submit Details"
          )}
        </Button>
      </div>
    </form>

    {/* ── Channel popup modal — Premium Design ─────────────────────────────── */}
    {showChannelModal && (
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        style={{ background: "rgba(15,23,42,0.6)", backdropFilter: "blur(8px)" }}
        onClick={() => setShowChannelModal(false)}
      >
        <div
          className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-[0_32px_80px_-12px_rgba(0,0,0,0.5)]"
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.6)" }}>Secure OTP Delivery</p>
                  <h3 className="text-lg font-bold text-white leading-tight mt-0.5">Choose channel</h3>
                </div>
              </div>
              <button onClick={() => setShowChannelModal(false)} className="p-1.5 rounded-full transition-colors mt-0.5 flex-shrink-0" style={{ background: "rgba(255,255,255,0.12)" }}>
                <X className="h-3.5 w-3.5 text-white" />
              </button>
            </div>
          </div>

          {/* Options */}
          <div className="bg-white px-5 pt-4 pb-3 space-y-3">
            {/* SMS */}
            <button
              type="button"
              onClick={() => { setShowChannelModal(false); doSubmit(true, false); }}
              disabled={submitting}
              className="relative w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-white text-left overflow-hidden transition-all duration-200 hover:shadow-[0_4px_24px_-4px_rgba(29,78,216,0.25)] hover:border-blue-200 hover:-translate-y-0.5 group"
            >
              <div className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-gradient-to-b from-blue-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-50 group-hover:bg-blue-600 transition-colors duration-200 shadow-sm">
                <svg className="h-6 w-6 text-blue-600 group-hover:text-white transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 group-hover:text-blue-700 transition-colors">SMS</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">Delivered as a text message</p>
              </div>
              <div className="flex-shrink-0 w-7 h-7 rounded-full border-2 border-slate-200 group-hover:border-blue-500 group-hover:bg-blue-500 flex items-center justify-center transition-all duration-200">
                <svg className="h-3.5 w-3.5 text-transparent group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </button>

            {/* WhatsApp */}
            <button
              type="button"
              onClick={() => { setShowChannelModal(false); doSubmit(false, true); }}
              disabled={submitting}
              className="relative w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-white text-left overflow-hidden transition-all duration-200 hover:shadow-[0_4px_24px_-4px_rgba(22,163,74,0.25)] hover:border-green-200 hover:-translate-y-0.5 group"
            >
              <div className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-gradient-to-b from-green-400 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center bg-green-50 group-hover:bg-green-600 transition-colors duration-200 shadow-sm">
                <svg className="h-6 w-6 text-green-600 group-hover:text-white transition-colors duration-200" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 group-hover:text-green-700 transition-colors">WhatsApp</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">Delivered via WhatsApp</p>
              </div>
              <div className="flex-shrink-0 w-7 h-7 rounded-full border-2 border-slate-200 group-hover:border-green-500 group-hover:bg-green-500 flex items-center justify-center transition-all duration-200">
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
              <p className="text-[10px] text-slate-400 font-medium">OTP expires in 10 minutes · Encrypted delivery</p>
            </div>
          </div>
        </div>
      </div>
    )}
  </>);
}
