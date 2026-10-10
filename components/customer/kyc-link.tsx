"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, ChevronRight, RotateCcw, PencilLine, Loader2 } from "lucide-react";
import { buildKycUrl } from "@/lib/kyc-link";
import { fetchKycStatusAction, type KycStatusResult } from "@/app/actions/kyc-status-action";

interface KycLinkProps {
  mobile: string | null | undefined;
}

/** The KYC call-to-action under the membership card, labelled by where the
    customer's KYC stands:
      none        → Complete your KYC
      draft       → Continue your KYC
      submitted   → KYC submitted · Request reopen
      reopened    → KYC reopened · Update & resubmit
    Every state opens the same KYC link; the portal itself shows the reopen
    step for a submitted KYC, and a resubmit there sets it back to SUBMITTED.
    A button rather than an anchor, so the link is never shown on hover. */
export function KycLink({ mobile }: KycLinkProps) {
  const url = buildKycUrl(mobile);
  const [kyc, setKyc] = useState<KycStatusResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!url || !mobile) return;
    let live = true;
    const load = () =>
      fetchKycStatusAction(mobile).then((result) => {
        if (live) {
          setKyc(result);
          setLoading(false);
        }
      });
    load();
    // The customer reopens or resubmits in another tab; refresh on return.
    const onFocus = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      live = false;
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [url, mobile]);

  if (!url) return null;

  const status = kyc?.status ?? "NONE";
  const ref = kyc?.kycRef ? ` · ${kyc.kycRef}` : "";
  const view =
    status === "SUBMITTED"
      ? {
          title: `KYC submitted${ref}`,
          sub: "Need to change something? Request reopen",
          action: "Request reopen",
          icon: <ShieldCheck className="h-5 w-5" />,
          tone: "border-emerald-200 from-emerald-50 to-teal-50 hover:border-emerald-300",
          badge: "bg-emerald-600",
          accent: "text-emerald-700",
        }
      : status === "REOPENED"
        ? {
            title: `KYC reopened${ref}`,
            sub: "Update your details and submit again",
            action: "Resubmit",
            icon: <RotateCcw className="h-5 w-5" />,
            tone: "border-amber-200 from-amber-50 to-orange-50 hover:border-amber-300",
            badge: "bg-amber-500",
            accent: "text-amber-700",
          }
        : {
            title: status === "DRAFT" ? "Continue your KYC" : "Complete your KYC",
            sub:
              status === "DRAFT"
                ? "Pick up where you left off and submit"
                : "Verify your identity to unlock all other process",
            action: null,
            icon: status === "DRAFT" ? <PencilLine className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />,
            tone: "border-blue-200 from-blue-50 to-indigo-50 hover:border-blue-300",
            badge: "bg-blue-600",
            accent: "text-blue-600",
          };

  return (
    <button
      type="button"
      onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
      className={`w-full flex items-center gap-3 rounded-xl border bg-gradient-to-r px-4 py-3 text-left shadow-sm transition-all hover:shadow-md active:scale-[0.99] ${view.tone}`}
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white ${view.badge}`}>
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : view.icon}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block truncate text-sm font-semibold text-slate-800">{view.title}</span>
        <span className="block text-xs text-slate-500">{view.sub}</span>
      </span>
      {view.action && (
        <span className={`shrink-0 text-xs font-semibold ${view.accent}`}>{view.action}</span>
      )}
      <ChevronRight className={`h-4 w-4 shrink-0 ${view.accent}`} />
    </button>
  );
}
