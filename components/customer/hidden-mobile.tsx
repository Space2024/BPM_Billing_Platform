"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface HiddenMobileProps {
  mobile: string;
  className?: string;
  iconClassName?: string;
}

export function HiddenMobile({ mobile, className, iconClassName }: HiddenMobileProps) {
  const [show, setShow] = useState(false);

  // If mobile is not exactly 10 digits or is empty, we still try to mask it appropriately
  const masked = mobile ? mobile.replace(/./g, "•") : "••••••••••";

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="font-mono">{show ? mobile : masked}</span>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          setShow(!show);
        }}
        className={cn(
          "p-0.5 rounded opacity-70 hover:opacity-100 transition-all focus:outline-none focus:ring-2 focus:ring-slate-400/50",
          iconClassName
        )}
        aria-label={show ? "Hide mobile number" : "Show mobile number"}
      >
        {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
    </span>
  );
}
