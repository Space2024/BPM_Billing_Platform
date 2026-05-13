"use client";

import { useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function CustomerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Customer route error:", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="fixed top-0 left-0 right-0 h-1.5 bg-blue-700 z-50" />

      <div className="w-full max-w-sm text-center space-y-5">
        <Image
          src="/blupeacock3.png"
          alt="Blupeacock Logo"
          width={160}
          height={160}
          className="object-contain mx-auto"
        />

        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <h1 className="text-lg font-semibold text-slate-800">Something went wrong</h1>
          <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
            We couldn&apos;t load the billing platform. Please check your connection and try again.
          </p>
          {error?.digest && (
            <p className="text-[11px] text-slate-400 font-mono">Ref: {error.digest}</p>
          )}
        </div>

        <Button onClick={reset} className="w-full h-11 font-semibold">
          Try again
        </Button>
      </div>

      <div className="fixed bottom-0 left-0 right-0 h-1.5 bg-blue-700 z-50" />
    </main>
  );
}
