import { useState, useEffect } from "react";
import Image from "next/image";
import { Crown, Star, Shield, Gem, ArrowLeft, Loader2, Download, Verified } from "lucide-react";
import { fetchProxyImageBase64 } from "@/app/customer/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VerifyBillingResult } from "@/types/billing";
import { HiddenMobile } from "@/components/customer/hidden-mobile";

// ─── Tier config ───────────────────────────────────────────────────────────────

type TierConfig = {
  label: string;
  gradient: string;
  badgeBg: string;
  icon: React.ReactNode;
  glow: string;
};

export function getTierConfig(tier: string | null | undefined): TierConfig {
  const t = String(tier ?? "").toUpperCase();
  if (t.includes("PLATINUM"))
    return {
      label: "PLATINUM",
      gradient: "from-slate-700 via-slate-600 to-slate-800",
      badgeBg: "bg-slate-400/20 text-slate-100 border-slate-400/40",
      icon: <Gem className="h-4 w-4" />,
      glow: "shadow-slate-400/30",
    };
  if (t.includes("GOLD") || t === "A")
    return {
      label: tier ? tier.toUpperCase() : "GOLD",
      gradient: "from-amber-700 via-yellow-600 to-amber-800",
      badgeBg: "bg-amber-300/20 text-amber-100 border-amber-400/40",
      icon: <Crown className="h-4 w-4" />,
      glow: "shadow-amber-400/30",
    };
  if (t.includes("SILVER") || t === "B")
    return {
      label: tier ? tier.toUpperCase() : "SILVER",
      gradient: "from-slate-500 via-slate-400 to-slate-600",
      badgeBg: "bg-slate-200/20 text-slate-100 border-slate-300/40",
      icon: <Star className="h-4 w-4" />,
      glow: "shadow-slate-300/30",
    };
  return {
    label: (t === "VERIFIED" || !tier || tier.length >= 12) ? "PROCESSING" : tier.toUpperCase(),
    gradient: "from-blue-800 via-blue-700 to-blue-900",
    badgeBg: "bg-blue-400/20 text-blue-100 border-blue-400/40",
    icon: <Shield className="h-4 w-4" />,
    glow: "shadow-blue-400/30",
  };
}

// ─── Shared Premium Card Shell ─────────────────────────────────────────────────

interface MembershipSuccessCardProps {
  result: VerifyBillingResult;
  customerName?: string;
  customerCity?: string;
  onReset: () => void;
}

export function MembershipSuccessCard({ result, customerName, customerCity, onReset }: MembershipSuccessCardProps) {
  const [qrLoaded, setQrLoaded] = useState(false);
  const [proxyQrUrl, setProxyQrUrl] = useState<string | null>(null);
  const tier = getTierConfig(result.tierGrade);

  useEffect(() => {
    if (result.qrCodeUrl && !proxyQrUrl) {
      fetchProxyImageBase64(result.qrCodeUrl).then(base64 => {
        setProxyQrUrl(base64 || result.qrCodeUrl!);
      });
    }
  }, [result.qrCodeUrl, proxyQrUrl]);

  const handleDownloadCard = async (id: string) => {
    const cardElement = document.getElementById("success-membership-card-element");
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

  // QR code value = membershipId (customer shows this at store)
  const qrValue = result.membershipId ?? "";

  return (
    <div className="space-y-5">
      {/* Loyalty Note at the top */}
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

      {/* Premium membership card */}
      <div
        id="success-membership-card-element"
        className={`
          relative overflow-hidden rounded-3xl
          bg-gradient-to-br ${tier.gradient}
          shadow-2xl ${tier.glow}
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

        {/* Top row: brand logo + tier badge */}
        <div className="relative flex items-center justify-between mb-5">
          <Image
            src="/blupeacock3.png"
            alt="Logo"
            width={90}
            height={30}
            className="object-contain brightness-0 invert opacity-90"
          />
          <Badge
            className={`
              flex items-center gap-1.5 px-3 py-1 rounded-full
              text-xs font-semibold border ${tier.badgeBg} backdrop-blur-sm
            `}
          >
            {tier.icon}
            {tier.label}
          </Badge>
        </div>

        {/* Customer Name & City */}
        {(customerName || customerCity) && (
          <div className="relative text-center mb-5">
            {customerName && <p className="text-xl font-bold text-white tracking-wide">{customerName}</p>}
            {customerCity && <p className="text-sm text-white/70 mt-0.5">{customerCity}</p>}
          </div>
        )}

        {/* QR Code Streamed from URL */}
        {result.qrCodeUrl && (
          <div className="relative flex justify-center mb-5">
            <div className="bg-white p-3 rounded-2xl shadow-lg ring-2 ring-white/30 relative w-[204px] h-[204px] flex items-center justify-center">
              {!qrLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
                </div>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={proxyQrUrl || result.qrCodeUrl}
                alt="Membership QR Code"
                width={180}
                height={180}
                onLoad={() => setQrLoaded(true)}
                className={`rounded-lg object-contain relative z-10 transition-opacity duration-300 ${qrLoaded ? "opacity-100" : "opacity-0"}`}
              />
              
              {/* Download Overlay Button */}
              {qrLoaded && (
                <button
                  onClick={() => handleDownloadCard(result.membershipId || "member")}
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
        <div className="relative text-center mb-4">
          <p className="text-[10px] font-medium tracking-widest uppercase text-white/60 mb-1">
            Membership ID
          </p>
          <p className="text-3xl font-bold font-mono tracking-wider text-white drop-shadow-sm">
            {result.membershipId}
          </p>
        </div>

        {/* Divider */}
        <div className="relative border-t border-white/20 my-4" />

        {/* Bottom row: mobile + status */}
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/60">Mobile</p>
            <div className="text-sm font-semibold text-white mt-0.5">
              <HiddenMobile mobile={result.mobileNo ?? ""} iconClassName="hover:bg-white/20" />
            </div>
          </div>
          {/* {result.billingStatus && ( */}
            <Badge className="bg-white/10 border-white/20 text-white text-xs px-2 py-0.5 rounded-full uppercase tracking-wider">
            Active Member
              {/* {result.billingStatus} */}
            </Badge>
          {/*  )}*/}
        </div>
      </div>

      <div className="text-center px-2">
        <p className="text-base font-semibold text-slate-800">🎉 Welcome!</p>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Show this QR code at the Store for Quick Billing.
        </p>
      </div>

      {/* Loyalty Note was moved to the top */}

      <Button
        variant="outline"
        onClick={onReset}
        className="w-full h-10 text-sm gap-2 border-slate-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Register Another
      </Button>
    </div>
  );
}
