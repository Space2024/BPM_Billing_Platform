"use client";

import { useState, useEffect } from "react";
import { Loader2, UserPlus, ArrowRight, ArrowLeft, MapPin } from "lucide-react";
import { usePincodeLookup } from "@/hooks/use-pincode-lookup";
import { registrationStep1Schema, registrationFullSchema } from "@/lib/validations/billing";

import { StoreCombobox } from "@/components/customer/store-combobox";
import { createBillingAction } from "@/app/customer/actions";
import { StoreOption, CreateBillingResult } from "@/types/billing";
import { HiddenMobile } from "@/components/customer/hidden-mobile";
import { useRegistrationFormStore } from "@/lib/store";
import { notify } from "@/components/ui/notifications";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toTitleCase } from "@/lib/utils";
import { AreaCombobox } from "@/components/customer/area-combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Constants ─────────────────────────────────────────────────────────────────

const PREFIXES = ["Mr", "Mrs", "Ms", "Dr", "Prof"];

function isJewelleryStore(storeType: string) {
  return storeType?.toLowerCase().includes("jewel");
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface RegistrationFormProps {
  mobileNo: string;
  stores: StoreOption[];
  staffEcno?: string;
  initialData?: {
    customerTitle?: string | null;
    customerName?: string | null;
    email?: string | null;
    dateOfBirth?: string | null;
    doorNo?: string | null;
    street?: string | null;
    pinCode?: string | null;
    area?: string | null;
    taluk?: string | null;
    city?: string | null;
    state?: string | null;
  } | null;
  /** Pre-select a store by storeId (used for billing_pending resumption) */
  initialStoreId?: string | null;
  /** When true, show Update & Verify button instead of Register & Send OTP */
  isPendingUpdate?: boolean;
  /** membershipId of the billing_pending record (required when isPendingUpdate=true) */
  pendingMembershipId?: string | null;
  /** Called with the diff payload when user clicks Update & Verify */
  onRequestUpdate?: (payload: Record<string, string>) => void;
  onSuccess: (result: CreateBillingResult, details: { firstName: string; lastName: string; prefix: string; city: string }) => void;
  onBack: () => void;
}

// ─── Field wrapper ──────────────────────────────────────────────────────────────

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

// ─── Section heading ───────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-100">
      {children}
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function RegistrationForm({
  mobileNo,
  stores,
  staffEcno,
  onSuccess,
  onBack,
  initialData,
  initialStoreId,
  isPendingUpdate = false,
  pendingMembershipId,
  onRequestUpdate,
}: RegistrationFormProps) {
  // Zustand store
  const selectedStoreId = useRegistrationFormStore((state) => state.selectedStoreId);
  const setSelectedStoreId = useRegistrationFormStore((state) => state.setSelectedStoreId);
  const prefix = useRegistrationFormStore((state) => state.prefix);
  const setPrefix = useRegistrationFormStore((state) => state.setPrefix);
  const firstName = useRegistrationFormStore((state) => state.firstName);
  const setFirstName = useRegistrationFormStore((state) => state.setFirstName);
  const lastName = useRegistrationFormStore((state) => state.lastName);
  const setLastName = useRegistrationFormStore((state) => state.setLastName);
  const doorNo = useRegistrationFormStore((state) => state.doorNo);
  const setDoorNo = useRegistrationFormStore((state) => state.setDoorNo);
  const street = useRegistrationFormStore((state) => state.street);
  const setStreet = useRegistrationFormStore((state) => state.setStreet);
  const pincode = useRegistrationFormStore((state) => state.pincode);
  const setPincode = useRegistrationFormStore((state) => state.setPincode);
  const area = useRegistrationFormStore((state) => state.area);
  const setArea = useRegistrationFormStore((state) => state.setArea);
  const taluk = useRegistrationFormStore((state) => state.taluk);
  const setTaluk = useRegistrationFormStore((state) => state.setTaluk);
  const city = useRegistrationFormStore((state) => state.city);
  const setCity = useRegistrationFormStore((state) => state.setCity);
  const state = useRegistrationFormStore((state) => state.state);
  const setState = useRegistrationFormStore((state) => state.setState);
  const country = useRegistrationFormStore((state) => state.country);
  const setCountry = useRegistrationFormStore((state) => state.setCountry);
  const mobileStep = useRegistrationFormStore((state) => state.mobileStep);
  const setMobileStep = useRegistrationFormStore((state) => state.setMobileStep);
  
  const selectedStore = stores.find(s => s.storeId === selectedStoreId) ?? null;

  // Initialize from initialData if provided
  useEffect(() => {
    if (initialStoreId && !selectedStoreId) {
      setSelectedStoreId(initialStoreId);
    }
    if (initialData) {
      if (initialData.customerTitle) {
        const sanitized = sanitizePrefix(initialData.customerTitle);
        if (sanitized !== prefix) setPrefix(sanitized);
      }
      if (initialData.customerName) {
        const parts = initialData.customerName.trim().split(" ");
        const initFirstName = parts[0] || "";
        const initLastName = parts.slice(1).join(" ") || "";
        if (initFirstName && !firstName) setFirstName(initFirstName);
        if (initLastName && !lastName) setLastName(initLastName);
      }
      if (initialData.doorNo && !doorNo) setDoorNo(initialData.doorNo);
      if (initialData.street && !street) setStreet(initialData.street);
      if (initialData.pinCode && !pincode) setPincode(initialData.pinCode);
      if (initialData.area && !area) setArea(initialData.area);
      if (initialData.taluk && !taluk) setTaluk(initialData.taluk);
      if (initialData.city && !city) setCity(initialData.city);
      if (initialData.state && !state) setState(initialData.state);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sanitizePrefix = (raw: string | null | undefined) => {
    if (!raw) return "Mr";
    const cleaned = raw.replace(/\./g, "").trim();
    const match = PREFIXES.find(p => p.toLowerCase() === cleaned.toLowerCase());
    return match || "Mr";
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setTimeout(() => {
      validateAll(undefined, false);
    }, 0);
  };

  // OTP channel preference (set when user picks in popup)
  const [sendSms, setSendSms] = useState(true);
  const [sendWhatsapp, setSendWhatsapp] = useState(false);
  const [showChannelModal, setShowChannelModal] = useState(false);

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

  const showAddress = selectedStore ? isJewelleryStore(selectedStore.storeType) : false;

  function handleStoreChange(storeId: string, store: StoreOption | null) {
    setSelectedStoreId(storeId);
    setError(null);
    setFieldErrors({});
    setMobileStep(1);
  }

  // Validate step 1 fields (used for mobile "Next" gate)
  function validateStep1(dataOverride?: any, showErrorsAndFocus: boolean = true): boolean {
    const dataToValidate = dataOverride || { storeId: selectedStoreId, firstName: firstName.trim(), lastName: lastName.trim() };
    const result = registrationStep1Schema.safeParse(dataToValidate);
    
    if (!result.success) {
      const formatted = result.error.format();
      const errs: Record<string, string> = {};
      if (formatted.storeId?._errors[0]) errs.storeId = formatted.storeId._errors[0];
      if (formatted.firstName?._errors[0]) errs.firstName = formatted.firstName._errors[0];
      if (formatted.lastName?._errors[0]) errs.lastName = formatted.lastName._errors[0];
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

  function validateAll(dataOverride?: any, showErrorsAndFocus: boolean = true): boolean {
    const baseData = { storeId: selectedStoreId, firstName: firstName.trim(), lastName: lastName.trim() };
    const addressData = { doorNo: doorNo.trim(), street: street.trim(), pincode: pincode.trim(), area: area.trim(), city: city.trim(), state: state.trim() };
    
    const dataToValidate = dataOverride || (showAddress ? { ...baseData, ...addressData } : baseData);
    const schemaToUse = showAddress ? registrationFullSchema : registrationStep1Schema;

    const result = schemaToUse.safeParse(dataToValidate);
    
    if (!result.success) {
      const formatted = result.error.format() as any;
      const errs: Record<string, string> = {};
      if (formatted.storeId?._errors[0]) errs.storeId = formatted.storeId._errors[0];
      if (formatted.firstName?._errors[0]) errs.firstName = formatted.firstName._errors[0];
      if (formatted.lastName?._errors[0]) errs.lastName = formatted.lastName._errors[0];
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
  const isStep1Valid = !!(selectedStoreId && firstName.trim() && lastName.trim());
  const isAddressValid = !!(doorNo.trim() && street.trim() && pincode.trim().length === 6 && area.trim());
  const isAllValid = showAddress ? (isStep1Valid && isAddressValid) : isStep1Valid;

  function handleMobileNext() {
    if (!validateStep1()) return;
    setMobileStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateAll()) return;

    // In update mode: compute diff and hand off to parent via onRequestUpdate
    if (isPendingUpdate && onRequestUpdate) {
      const payload: Record<string, string> = {};
      if (firstName.trim() !== (initialData?.customerName?.split(" ")[0] || "")) payload.firstName = firstName.trim();
      if (lastName.trim() !== (initialData?.customerName?.split(" ").slice(1).join(" ") || "")) payload.lastName = lastName.trim();
      if (selectedStoreId && selectedStoreId !== initialStoreId) payload.storeId = selectedStoreId;
      if (doorNo.trim() !== (initialData?.doorNo || "")) payload.doorNo = doorNo.trim();
      if (street.trim() !== (initialData?.street || "")) payload.street = street.trim();
      if (pincode.trim() !== (initialData?.pinCode || "")) payload.pincode = pincode.trim();
      if (area.trim() !== (initialData?.area || "")) payload.area = area.trim();
      if (city.trim() !== (initialData?.city || "")) payload.city = city.trim();
      if (state.trim() !== (initialData?.state || "")) payload.state = state.trim();
      // Always open channel modal — resend OTP first, then update after verify
      setShowChannelModal(true);
      return;
    }

    // Normal registration: open channel picker before submitting
    setShowChannelModal(true);
  }

  async function submitWithChannel(sms: boolean, wa: boolean) {
    setShowChannelModal(false);
    setLoading(true);

    // ── Update mode: resend OTP first, then parent handles OTP verify + update ──
    if (isPendingUpdate && onRequestUpdate) {
      // Compute diff
      const payload: Record<string, string> = {};
      if (firstName.trim() !== (initialData?.customerName?.split(" ")[0] || "")) payload.firstName = firstName.trim();
      if (lastName.trim() !== (initialData?.customerName?.split(" ").slice(1).join(" ") || "")) payload.lastName = lastName.trim();
      if (selectedStoreId && selectedStoreId !== initialStoreId) payload.storeId = selectedStoreId;
      if (doorNo.trim() !== (initialData?.doorNo || "")) payload.doorNo = doorNo.trim();
      if (street.trim() !== (initialData?.street || "")) payload.street = street.trim();
      if (pincode.trim() !== (initialData?.pinCode || "")) payload.pincode = pincode.trim();
      if (area.trim() !== (initialData?.area || "")) payload.area = area.trim();
      if (city.trim() !== (initialData?.city || "")) payload.city = city.trim();
      if (state.trim() !== (initialData?.state || "")) payload.state = state.trim();
      setLoading(false);
      onRequestUpdate(payload);
      return;
    }

    const input = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      mobileNo,
      prefix,
      storeId: selectedStoreId,
      staffEcno: staffEcno?.trim() || "COUNTER",
      sendSms: sms,
      sendWhatsapp: wa,
      ...(showAddress && {
        doorNo: doorNo.trim(),
        street: street.trim(),
        pincode: pincode.trim(),
        area: area.trim(),
        taluk: taluk.trim(),
        city: city.trim(),
        state: state.trim(),
        country: country.trim(),
      }),
    };

    const { data, error: err } = await createBillingAction(input);
    setLoading(false);

    if (err || !data?.success) {
      const msg = err || data?.message || "Registration failed. Please try again.";
      setError(msg);
      notify.error(msg);
      return;
    }

    notify.success("Registration initiated successfully");

    onSuccess(data, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      prefix,
      city: showAddress ? city.trim() : (selectedStore?.location || ""),
    });
  }

  // ── Address fields block (reused in both desktop right col + mobile step 2) ──

  const addressFields = (
    <div className="space-y-4">
      <SectionTitle>Address Details</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <Field id="doorNo" label="Door No." required error={touched.doorNo ? fieldErrors.doorNo : undefined}>
          <Input id="doorNo" value={doorNo} onChange={(e) => setDoorNo(toTitleCase(e.target.value))} onBlur={() => handleBlur("doorNo")}
            disabled={loading} placeholder="12A" className={`h-10 ${touched.doorNo && fieldErrors.doorNo ? "!border-2 !border-red-500 focus-visible:!ring-red-500/20" : ""}`} />
        </Field>
        <Field id="street" label="Street" required error={touched.street ? fieldErrors.street : undefined}>
          <Input id="street" value={street} onChange={(e) => setStreet(toTitleCase(e.target.value))} onBlur={() => handleBlur("street")}
            disabled={loading} placeholder="Street / Road" className={`h-10 ${touched.street && fieldErrors.street ? "!border-2 !border-red-500 focus-visible:!ring-red-500/20" : ""}`} />
        </Field>
        <Field id="pincode" label="Pincode" required error={touched.pincode ? fieldErrors.pincode : undefined}>
          <div className="relative">
            <Input id="pincode" value={pincode} inputMode="numeric"
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                setPincode(val);
                // Clear fields when pincode changes so auto-fill can overwrite
                if (val.length < 6) { setAvailableAreas([]); setArea(""); setTaluk(""); setCity(""); setState(""); }
              }}
              onBlur={() => handleBlur("pincode")}
              disabled={loading} placeholder="600002" className={`h-10 pr-8 ${touched.pincode && fieldErrors.pincode ? "!border-2 !border-red-500 focus-visible:!ring-red-500/20" : ""}`} maxLength={6} />
            {pincodeLoading && (
              <MapPin className="absolute right-2.5 top-2.5 h-4 w-4 text-blue-500 animate-pulse" />
            )}
          </div>
          {pincodeError && <p className="text-xs text-amber-600 mt-1">{pincodeError}</p>}
        </Field>
        <Field id="area" label="Area" required error={touched.area ? fieldErrors.area : undefined}>
          {availableAreas.length > 0 ? (
            <AreaCombobox areas={availableAreas} value={area} onChange={setArea} disabled={loading} error={touched.area ? !!fieldErrors.area : false} />
          ) : (
            <Input id="area" value={area} onChange={(e) => setArea(toTitleCase(e.target.value))} onBlur={() => handleBlur("area")}
              disabled={loading} placeholder="Area / Colony" className={`h-10 ${touched.area && fieldErrors.area ? "!border-2 !border-red-500 focus-visible:!ring-red-500/20" : ""}`} />
          )}
        </Field>
        <Field id="taluk" label="Taluk">
          <Input id="taluk" value={taluk} onChange={(e) => setTaluk(toTitleCase(e.target.value))}
            disabled={true} placeholder="Taluk (optional)" className="h-10 bg-slate-50 cursor-not-allowed" />
        </Field>
        <Field id="city" label="City" required>
          <Input id="city" value={city} onChange={(e) => setCity(toTitleCase(e.target.value))}
            disabled={true} placeholder="City" className="h-10 bg-slate-50 cursor-not-allowed" />
        </Field>
        <Field id="state" label="State" required>
          <Input id="state" value={state} onChange={(e) => setState(toTitleCase(e.target.value))}
            disabled={true} placeholder="State" className="h-10 bg-slate-50 cursor-not-allowed" />
        </Field>
        <Field id="country" label="Country">
          <Input id="country" value={country} onChange={(e) => setCountry(toTitleCase(e.target.value))}
            disabled={true} placeholder="Country" className="h-10 bg-slate-50 cursor-not-allowed" />
        </Field>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Channel popup modal — Premium Design ─────────────────────────────── */}
      {showChannelModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: "rgba(15,23,42,0.6)", backdropFilter: "blur(8px)" }}
          onClick={() => setShowChannelModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-[0_32px_80px_-12px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Gradient header ─────────────────────────────────────────────── */}
            <div
              className="relative px-6 pt-6 pb-5 overflow-hidden"
              style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #1a56db 60%, #1e40af 100%)" }}
            >
              {/* Decorative circles */}
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10" style={{ background: "radial-gradient(circle, white, transparent)" }} />
              <div className="absolute bottom-0 -left-4 w-20 h-20 rounded-full opacity-10" style={{ background: "radial-gradient(circle, white, transparent)" }} />

              <div className="relative flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {/* Shield icon */}
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.6)" }}>
                      Secure OTP Delivery
                    </p>
                    <h3 className="text-lg font-bold text-white leading-tight mt-0.5">
                      Choose channel
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setShowChannelModal(false)}
                  className="p-1.5 rounded-full transition-colors mt-0.5 flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.12)" }}
                >
                  <X className="h-3.5 w-3.5 text-white" />
                </button>
              </div>
            </div>

            {/* ── Options ────────────────────────────────────────────────────── */}
            <div className="bg-white px-5 pt-4 pb-3 space-y-3">
              {/* SMS */}
              <button
                type="button"
                onClick={() => submitWithChannel(true, false)}
                disabled={loading}
                className="relative w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-white text-left overflow-hidden transition-all duration-200 hover:shadow-[0_4px_24px_-4px_rgba(29,78,216,0.25)] hover:border-blue-200 hover:-translate-y-0.5 group"
              >
                {/* Left accent bar */}
                <div className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-gradient-to-b from-blue-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                {/* Icon */}
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
                onClick={() => submitWithChannel(false, true)}
                disabled={loading}
                className="relative w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-white text-left overflow-hidden transition-all duration-200 hover:shadow-[0_4px_24px_-4px_rgba(22,163,74,0.25)] hover:border-green-200 hover:-translate-y-0.5 group"
              >
                {/* Left accent bar */}
                <div className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-gradient-to-b from-green-400 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                {/* Icon */}
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

            {/* ── Trust footer ──────────────────────────────────────────────── */}
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

      <form onSubmit={handleSubmit} noValidate>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg md:text-lg font-bold tracking-tight bg-gradient-to-r from-blue-700 via-blue-500 to-blue-900 bg-clip-text text-transparent drop-shadow-sm">
            Get Started
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Complete the registration form to become a member
          </p>
        </div>
        <Badge variant="outline" className="shrink-0 px-2.5 py-1 text-slate-600 bg-white shadow-sm border-slate-200">
          <HiddenMobile mobile={mobileNo} className="text-[11px]" />
        </Badge>
      </div>

      <Separator className="mb-5" />

      {/* ── DESKTOP layout: two columns ─────────────────────────────────────── */}
      <div className="hidden lg:grid lg:grid-cols-2 lg:gap-8">

        {/* Left column: Store + Personal */}
        <div className="space-y-5">
          {/* Store */}
          <div className="space-y-4">
            <SectionTitle>Store Selection</SectionTitle>
            <Field id="store-select-d" label="Store" required error={touched.storeId ? fieldErrors.storeId : undefined}>
              <StoreCombobox
                stores={stores}
                value={selectedStoreId}
                onChange={handleStoreChange}
                disabled={loading}
                placeholder="Search and select a store..."
                error={touched.storeId ? !!fieldErrors.storeId : false}
              />
              {selectedStore && showAddress && (
                <div className="flex items-center mt-1.5">
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    Address required
                  </Badge>
                </div>
              )}
            </Field>
          </div>

          {/* Personal details */}
          {selectedStoreId && (
            <div className="space-y-4">
              <SectionTitle>Personal Details</SectionTitle>
              <div className="grid grid-cols-3 gap-3">
                <Field id="prefix-d" label="Prefix" required>
                  <Select value={prefix} onValueChange={setPrefix} disabled={loading}>
                    <SelectTrigger id="prefix-d" className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PREFIXES.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field id="firstName-d" label="First Name" required error={touched.firstName ? fieldErrors.firstName : undefined}>
                  <Input id="firstName-d" value={firstName}
                    onChange={(e) => setFirstName(toTitleCase(e.target.value))} onBlur={() => handleBlur("firstName")}
                    disabled={loading} placeholder="First name" className={`h-10 ${touched.firstName && fieldErrors.firstName ? "!border-2 !border-red-500 focus-visible:!ring-red-500/20" : ""}`} />
                </Field>
                <Field id="lastName-d" label="Last Name" required error={touched.lastName ? fieldErrors.lastName : undefined}>
                  <Input id="lastName-d" value={lastName}
                    onChange={(e) => setLastName(toTitleCase(e.target.value))} onBlur={() => handleBlur("lastName")}
                    disabled={loading} placeholder="Last name" className={`h-10 ${touched.lastName && fieldErrors.lastName ? "!border-2 !border-red-500 focus-visible:!ring-red-500/20" : ""}`} />
                </Field>
              </div>
            </div>
          )}
        </div>

        {/* Right column: Address (jewellery only) */}
        <div>
          {showAddress ? (
            addressFields
          ) : selectedStoreId ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[160px] rounded-xl border-2 border-dashed border-slate-100 text-slate-400 text-sm text-center p-6">
              <p className="font-medium">No address required</p>
              <p className="text-xs mt-1">This store type does not require address details</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[160px] rounded-xl border-2 border-dashed border-slate-100 text-slate-300 text-xs text-center p-6">
              Select a store to continue
            </div>
          )}
        </div>
      </div>

      {/* ── MOBILE layout: multi-step ───────────────────────────────────────── */}
      <div className="lg:hidden space-y-5">

        {/* Step 1: Store + Personal */}
        {mobileStep === 1 && (
          <>
            {/* Store */}
            <div className="space-y-4">
              <SectionTitle>Store Selection</SectionTitle>
              <Field id="store-select-m" label="Store" required error={touched.storeId ? fieldErrors.storeId : undefined}>
                <StoreCombobox
                  stores={stores}
                  value={selectedStoreId}
                  onChange={handleStoreChange}
                  disabled={loading}
                  placeholder="Search and select a store..."
                  error={touched.storeId ? !!fieldErrors.storeId : false}
                />
                {selectedStore && showAddress && (
                  <div className="flex items-center mt-1.5">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      Address required
                    </Badge>
                  </div>
                )}
              </Field>
            </div>

            {/* Personal details */}
            {selectedStoreId && (
              <>
                <Separator />
                <div className="space-y-4">
                  <SectionTitle>Personal Details</SectionTitle>
                  <div className="grid grid-cols-3 gap-3">
                    <Field id="prefix-m" label="Prefix" required>
                      <Select value={prefix} onValueChange={setPrefix} disabled={loading}>
                        <SelectTrigger id="prefix-m" className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PREFIXES.map((p) => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field id="firstName-m" label="First Name" required error={touched.firstName ? fieldErrors.firstName : undefined}>
                      <Input id="firstName-m" value={firstName}
                        onChange={(e) => setFirstName(toTitleCase(e.target.value))} onBlur={() => handleBlur("firstName")}
                        disabled={loading} placeholder="First name" className={`h-10 ${touched.firstName && fieldErrors.firstName ? "!border-2 !border-red-500 focus-visible:!ring-red-500/20" : ""}`} />
                    </Field>
                    <Field id="lastName-m" label="Last Name" required error={touched.lastName ? fieldErrors.lastName : undefined}>
                      <Input id="lastName-m" value={lastName}
                        onChange={(e) => setLastName(toTitleCase(e.target.value))} onBlur={() => handleBlur("lastName")}
                        disabled={loading} placeholder="Last name" className={`h-10 ${touched.lastName && fieldErrors.lastName ? "!border-2 !border-red-500 focus-visible:!ring-red-500/20" : ""}`} />
                    </Field>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* Step 2: Address (mobile only, jewellery) */}
        {mobileStep === 2 && showAddress && addressFields}

        {/* Mobile step indicator */}
        {showAddress && selectedStoreId && (
          <div className="flex items-center justify-center gap-2 py-1">
            <div className={`h-1.5 w-8 rounded-full transition-colors ${mobileStep === 1 ? "bg-blue-600" : "bg-slate-200"}`} />
            <div className={`h-1.5 w-8 rounded-full transition-colors ${mobileStep === 2 ? "bg-blue-600" : "bg-slate-200"}`} />
          </div>
        )}
      </div>

      {/* ── Error ──────────────────────────────────────────────────────────── */}
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {/* ── Actions ────────────────────────────────────────────────────────── */}
      <div className="flex gap-3 pt-4 mt-1">
        {/* Back / Prev step */}
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
          disabled={loading}
          className="flex-1 h-11"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {mobileStep === 2 ? "Previous" : "Back"}
        </Button>

        {/* Next (mobile step 1 → 2) — only shown on mobile when address required */}
        {mobileStep === 1 && showAddress && (
          <Button
            type="button"
            onClick={handleMobileNext}
            disabled={loading || !isStep1Valid}
            className="flex-[2] h-11 font-semibold lg:hidden"
          >
            Next
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        )}

        {/* Submit — always visible on desktop; on mobile only on last step */}
        <Button
          type="submit"
          disabled={loading || !isAllValid}
          className={[
            "flex-[2] h-11 font-semibold",
            // On mobile with address required, hide on step 1 (show on step 2 only)
            showAddress && mobileStep === 1 ? "hidden lg:flex" : "",
            isPendingUpdate
              ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              : "",
          ].filter(Boolean).join(" ")}
        >
          {loading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isPendingUpdate ? "Preparing…" : "Registering..."}</>
          ) : isPendingUpdate ? (
            <><ArrowRight className="mr-2 h-4 w-4" />Update &amp; Verify OTP</>
          ) : (
            <><UserPlus className="mr-2 h-4 w-4" />Register &amp; Send OTP</>
          )}
        </Button>
      </div>
    </form>
    </>
  );
}
