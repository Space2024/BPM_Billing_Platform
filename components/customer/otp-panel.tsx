"use client";

import { useState, useEffect } from "react";
import { Loader2, ShieldCheck, RefreshCw, MessageSquare, Phone as PhoneIcon, X } from "lucide-react";

import { verifyOtpAction, resendOtpAction } from "@/app/customer/actions";
import { VerifyBillingResult } from "@/types/billing";
import { HiddenMobile } from "@/components/customer/hidden-mobile";
import { notify } from "@/components/ui/notifications";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";

interface OtpPanelProps {
  membershipId: string;
  mobileNo: string;
  onSuccess: (result: VerifyBillingResult) => void;
  onBack: () => void;
}

const RESEND_SECONDS = 60;

// ── Channel Popup Modal ──────────────────────────────────────────────────────

interface ChannelModalProps {
  onClose: () => void;
  onSelect: (sms: boolean, wa: boolean) => void;
  resending: boolean;
}

function ChannelModal({ onClose, onSelect, resending }: ChannelModalProps) {
  const [selected, setSelected] = useState<"sms" | "whatsapp">("sms");

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(15,23,42,0.6)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-[0_32px_80px_-12px_rgba(0,0,0,0.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Gradient header ─────────────────────────────────────────────── */}
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
                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Secure OTP Delivery
                </p>
                <h3 className="text-lg font-bold text-white leading-tight mt-0.5">Choose channel</h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full transition-colors mt-0.5 flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.12)" }}
            >
              <X className="h-3.5 w-3.5 text-white" />
            </button>
          </div>
        </div>

        {/* ── Channel options ─────────────────────────────────────────────── */}
        <div className="bg-white px-5 pt-4 pb-3 space-y-3">
          {/* SMS */}
          <button
            type="button"
            onClick={() => setSelected("sms")}
            className={`relative w-full flex items-center gap-4 p-4 rounded-2xl border text-left overflow-hidden transition-all duration-200 group ${
              selected === "sms"
                ? "border-blue-200 shadow-[0_4px_24px_-4px_rgba(29,78,216,0.2)] -translate-y-0.5 bg-white"
                : "border-slate-100 bg-white hover:border-blue-200 hover:shadow-[0_4px_24px_-4px_rgba(29,78,216,0.15)] hover:-translate-y-0.5"
            }`}
          >
            <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-full bg-gradient-to-b from-blue-400 to-blue-600 transition-opacity ${selected === "sms" ? "opacity-100" : "opacity-0 group-hover:opacity-60"}`} />
            <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-colors duration-200 ${selected === "sms" ? "bg-blue-600" : "bg-blue-50 group-hover:bg-blue-100"}`}>
              <svg className={`h-6 w-6 transition-colors duration-200 ${selected === "sms" ? "text-white" : "text-blue-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold transition-colors ${selected === "sms" ? "text-blue-700" : "text-slate-800"}`}>SMS</p>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">Delivered as a text message</p>
            </div>
            <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${selected === "sms" ? "border-blue-500 bg-blue-500" : "border-slate-300"}`}>
              {selected === "sms" && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          </button>

          {/* WhatsApp */}
          <button
            type="button"
            onClick={() => setSelected("whatsapp")}
            className={`relative w-full flex items-center gap-4 p-4 rounded-2xl border text-left overflow-hidden transition-all duration-200 group ${
              selected === "whatsapp"
                ? "border-green-200 shadow-[0_4px_24px_-4px_rgba(22,163,74,0.2)] -translate-y-0.5 bg-white"
                : "border-slate-100 bg-white hover:border-green-200 hover:shadow-[0_4px_24px_-4px_rgba(22,163,74,0.15)] hover:-translate-y-0.5"
            }`}
          >
            <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-full bg-gradient-to-b from-green-400 to-green-600 transition-opacity ${selected === "whatsapp" ? "opacity-100" : "opacity-0 group-hover:opacity-60"}`} />
            <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-colors duration-200 ${selected === "whatsapp" ? "bg-green-600" : "bg-green-50 group-hover:bg-green-100"}`}>
              <svg className={`h-6 w-6 transition-colors duration-200 ${selected === "whatsapp" ? "text-white" : "text-green-600"}`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold transition-colors ${selected === "whatsapp" ? "text-green-700" : "text-slate-800"}`}>WhatsApp</p>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">Delivered via WhatsApp</p>
            </div>
            <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${selected === "whatsapp" ? "border-green-500 bg-green-500" : "border-slate-300"}`}>
              {selected === "whatsapp" && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          </button>
        </div>

        {/* ── Confirm button ───────────────────────────────────────────────── */}
        <div className="bg-white px-5 pb-5 space-y-3">
          <button
            onClick={() => onSelect(selected === "sms", selected === "whatsapp")}
            disabled={resending}
            className={`w-full h-12 rounded-2xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all duration-200 shadow-lg active:scale-[0.98] ${
              selected === "whatsapp"
                ? "bg-gradient-to-r from-green-500 to-green-600 shadow-green-200 hover:shadow-green-300 hover:shadow-xl"
                : "bg-gradient-to-r from-blue-500 to-blue-700 shadow-blue-200 hover:shadow-blue-300 hover:shadow-xl"
            }`}
          >
            {resending ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Sending…</>
            ) : (
              <>{selected === "whatsapp" ? "Send via WhatsApp" : "Send via SMS"}</>
            )}
          </button>

          {/* Trust line */}
          <div className="flex items-center justify-center gap-1.5">
            <svg className="h-3 w-3 text-slate-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <p className="text-[10px] text-slate-400 font-medium">OTP expires in 10 minutes · Encrypted delivery</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── OTP Panel ────────────────────────────────────────────────────────────────

export function OtpPanel({ membershipId, mobileNo, onSuccess, onBack }: OtpPanelProps) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [showChannelModal, setShowChannelModal] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  async function handleVerify(codeToVerify?: string) {
    const code = typeof codeToVerify === "string" ? codeToVerify : otp;
    if (code.length < 6) { setError("Please enter the 6-digit verification code"); return; }
    setLoading(true);
    setError(null);
    const { data, error: err } = await verifyOtpAction(membershipId, mobileNo, code);
    setLoading(false);
    if (err || !data?.success) {
      const msg = err || data?.message || "Verification failed";
      setError(msg);
      notify.error(msg);
      return;
    }
    notify.success("OTP verified successfully");
    onSuccess(data);
  }

  async function handleResend(sms: boolean, wa: boolean) {
    setResending(true);
    setError(null);
    const { data, error: err } = await resendOtpAction(mobileNo, sms, wa);
    setResending(false);
    setShowChannelModal(false);
    if (err || !data?.success) {
      const msg = err || data?.message || "Failed to resend verification code";
      setError(msg);
      notify.error(msg);
      return;
    }
    notify.success("Verification code resent");
    setCountdown(RESEND_SECONDS);
    setOtp("");
  }

  return (
    <>
      {/* Channel selection popup */}
      {showChannelModal && (
        <ChannelModal
          onClose={() => setShowChannelModal(false)}
          onSelect={handleResend}
          resending={resending}
        />
      )}

      <div className="space-y-5">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-700" />
            <h2 className="text-lg font-semibold text-slate-800 tracking-tight">
              Verification
            </h2>
          </div>
          <p className="text-sm text-slate-500">
            Enter the 6-digit code sent to{" "}
            <span className="font-semibold text-slate-700">
              <HiddenMobile mobile={mobileNo} className="text-sm" />
            </span>
          </p>
        </div>

        <Separator />

        {/* OTP Input */}
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={(val) => { setOtp(val); setError(null); }}
            onComplete={(val) => handleVerify(val)}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        {/* Verify button */}
        <Button
          onClick={() => handleVerify()}
          disabled={loading || otp.length < 6}
          className="w-full h-11 font-semibold"
        >
          {loading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying…</>
          ) : (
            "Verify & Complete"
          )}
        </Button>

        {/* Resend + Back */}
        <div className="flex items-center justify-between text-sm">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-slate-500 h-8 px-2">
            ← Back
          </Button>

          {countdown > 0 ? (
            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
              Resend in
              <Badge variant="secondary" className="font-mono text-xs px-1.5 py-0.5">
                {countdown}s
              </Badge>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowChannelModal(true)}
              disabled={resending}
              className="text-blue-700 hover:text-blue-800 h-8 px-2"
            >
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${resending ? "animate-spin" : ""}`} />
              Resend Code
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
