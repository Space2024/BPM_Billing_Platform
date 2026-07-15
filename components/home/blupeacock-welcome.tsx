"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

const MEMBERSHIP_URL =
  "https://www.blupeacock.in/Blupeacock-Membership-Account/join_membership";

/** Seconds the welcome splash is shown before the visitor is sent onward. */
const REDIRECT_SECONDS = 6;

export function BlupeacockWelcome() {
  const [remaining, setRemaining] = useState(REDIRECT_SECONDS);
  const [cancelled, setCancelled] = useState(false);

  const goNow = useCallback(() => {
    window.location.href = MEMBERSHIP_URL;
  }, []);

  useEffect(() => {
    if (cancelled) return;

    // Drive the countdown off a fixed deadline rather than accumulating ticks,
    // so a throttled/background tab can't stretch the redirect out.
    const deadline = Date.now() + REDIRECT_SECONDS * 1000;

    const id = window.setInterval(() => {
      const left = Math.max(0, deadline - Date.now());
      setRemaining(left / 1000);
      if (left === 0) {
        window.clearInterval(id);
        goNow();
      }
    }, 50);

    return () => window.clearInterval(id);
  }, [cancelled, goNow]);

  const seconds = Math.ceil(remaining);
  const progress = 1 - remaining / REDIRECT_SECONDS;

  return (
    <main
      // svh (not vh) so mobile browser chrome can't push content off-screen.
      className="relative flex min-h-svh justify-center overflow-hidden bg-white sm:items-center sm:px-4 sm:py-10"
      style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}
    >
      {/* Peacock iridescence */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="bp-aura bp-aura-1" />
        <div className="bp-aura bp-aura-2" />
        <div className="bp-aura bp-aura-3" />
        {/* Fade the aura toward the edges so the card stays the focal point. */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent_28%,rgba(255,255,255,0.75)_82%)]" />
      </div>

      <section className="bp-rise relative flex w-full flex-col sm:max-w-lg">
        {/* On mobile the content sits straight on the aura — a full-bleed card
            surface would just paint over the iridescence. The glass card only
            exists from sm up, where it floats. flex-1 absorbs leftover height. */}
        <div className="relative flex flex-1 flex-col justify-center overflow-hidden px-6 py-12 sm:flex-none sm:rounded-[28px] sm:border sm:border-white/70 sm:bg-white/75 sm:px-10 sm:py-10 sm:shadow-[0_30px_80px_-20px_rgba(26,86,213,0.35)] sm:backdrop-blur-xl">
          {/* Hairline of brand colour along the card's top edge. */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 hidden h-px bg-gradient-to-r from-transparent via-[#1b9ad6]/60 to-transparent sm:block"
          />

          {/* Logo + iridescent bloom */}
          <div className="relative flex h-24 shrink-0 items-center justify-center">
            <div
              aria-hidden
              className="bp-eye absolute h-36 w-[300px] rounded-full sm:w-[380px]"
            />
            <Image
              src="/blupeacock3.png"
              alt="Blupeacock"
              width={300}
              height={75}
              priority
              className="relative w-[300px] object-contain sm:w-[350px]"
            />
          </div>

          <div className="mt-7 text-center sm:mt-6">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1b9ad6]/20 bg-[#1b9ad6]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#1a56d5]">
              <ShieldCheck className="size-3" />
              Membership
            </span>

            {/* Two-tone headline echoing the logo's own navy BLU → azure
                PEACOCK transition, so the gradient reads as brand cohesion
                rather than decoration. */}
            <h1 className="mt-5 sm:mt-4">
              <span
                className="block text-[22px] font-normal italic leading-none text-slate-500/90 sm:text-[26px]"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
              >
                Welcome
              </span>
              {/* inline-block, not block: bg-clip-text maps the gradient to the
                  element box, so a full-width box would leave the centred text
                  sampling only the middle of the ramp. Hugging the text lets the
                  whole navy→azure sweep land on the glyphs.
                  Sizes are set so the longest line clears the card's inner width
                  (342px mobile / 432px desktop) with breathing room; text-balance
                  evens out the two lines instead of orphaning "Awaits.". */}
              <span className="mt-1.5 inline-block text-balance bg-gradient-to-r from-[#2d2a6e] via-[#1a56d5] to-[#1b9ad6] bg-clip-text pb-1 text-[32px] font-bold leading-[1.12] tracking-[-0.02em] text-transparent sm:mt-2 sm:text-[28px]">
                A New Experience Awaits.
              </span>
            </h1>

            {/* Copy + measure tuned together to break cleanly over two lines at
                both breakpoints — a longer string orphans "set up." on line 3. */}
            <p className="mx-auto mt-3.5 max-w-sm text-[15px] leading-relaxed text-slate-600">
              Your membership account is a moment away. We&rsquo;re taking you to
              the join page.
            </p>
          </div>

          {/* Countdown */}
          {!cancelled ? (
            <div className="mt-9 sm:mt-8">
              <div className="flex items-baseline justify-between text-xs">
                <span className="font-medium text-slate-500">
                  Redirecting you now
                </span>
                <span
                  aria-hidden
                  className="font-semibold tabular-nums text-[#1a56d5]"
                >
                  {seconds}s
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#2d2a6e] via-[#1a56d5] to-[#1b9ad6] transition-[width] duration-100 ease-linear"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>
          ) : (
            // Matches the countdown block's height so the CTA doesn't jump.
            <p className="mt-9 flex h-[30px] items-center justify-center text-center text-xs font-medium text-slate-500 sm:mt-8">
              Auto-redirect stopped &mdash; continue whenever you&rsquo;re ready.
            </p>
          )}

          {/* Actions */}
          <div className="mt-7 flex flex-col items-center gap-3.5 sm:mt-6 sm:gap-3">
            {/* A real anchor: works before hydration and without JS. */}
            <Button
              asChild
              size="lg"
              className="h-13 w-full rounded-2xl text-[15px] font-semibold shadow-lg shadow-[#1a56d5]/25 sm:h-12 sm:rounded-xl sm:text-sm"
            >
              <a href={MEMBERSHIP_URL}>
                Join Membership Now
                <ArrowRight />
              </a>
            </Button>

            {!cancelled && (
              <button
                type="button"
                onClick={() => setCancelled(true)}
                className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 underline-offset-4 transition-colors hover:text-[#1a56d5] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a56d5] focus-visible:ring-offset-1"
              >
                Stay on this page
              </button>
            )}
          </div>

          {/* WCAG 2.2.1: describe the time limit and how to stop it, without
              announcing every tick of the visual countdown. */}
          <p className="sr-only">
            You will be redirected to the Blupeacock membership signup page in
            about {REDIRECT_SECONDS} seconds. Use the &ldquo;Stay on this
            page&rdquo; button to stop the automatic redirect, or the &ldquo;Join
            Membership Now&rdquo; link to continue immediately.
          </p>
        </div>

        <div className="shrink-0 px-4 pb-7 pt-6 sm:mt-8 sm:p-0">
          <p className="bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 bg-clip-text text-center text-[11px] font-semibold uppercase tracking-wider text-transparent">
            © {new Date().getFullYear()} Space Textiles Pvt. Ltd.
          </p>
        </div>
      </section>
    </main>
  );
}
