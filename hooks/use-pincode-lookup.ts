"use client";

import { useState, useEffect } from "react";
import { toTitleCaseSafe } from "@/lib/utils";
import { gatewayFetch } from "@/lib/gateway-fetch";
import { GATEWAY_SERVICE } from "@/app/apollo/lib/gateway-channel";

export interface PincodeData {
  areas: string[];
  taluk: string;
  city: string;
  state: string;
  country: string;
}

interface PostOffice {
  Name: string;
  Block: string;
  District: string;
  State: string;
  Circle: string;
  Region: string;
  Pincode: string;
  Country: string;
}

interface PincodeApiResponse {
  Message: string;
  Status: string;
  PostOffice: PostOffice[] | null;
}

/** A finished lookup, tagged with the pincode it answers. */
interface Lookup {
  pincode: string;
  data: PincodeData | null;
  error: string | null;
}

export function usePincodeLookup(pincode: string) {
  const [lookup, setLookup] = useState<Lookup | null>(null);

  // Only a complete six digit pincode is worth looking up.
  const isValid = /^\d{6}$/.test(pincode);

  useEffect(() => {
    if (!isValid) return;

    // Cleanup aborts this request as soon as the pincode changes, so at most one
    // lookup is ever in flight.
    const controller = new AbortController();

    gatewayFetch<PincodeApiResponse>(
      GATEWAY_SERVICE.PINCODE,
      { pinCode: pincode },
      { signal: controller.signal }
    )
      .then((result) => {
        // A superseded lookup must not write state the current one owns
        if (controller.signal.aborted) return;

        if (result?.Status !== "Success" || !result.PostOffice?.length) {
          setLookup({ pincode, data: null, error: "Pincode not found" });
          return;
        }

        const po = result.PostOffice[0];
        setLookup({
          pincode,
          error: null,
          data: {
            areas: result.PostOffice.map((p) => toTitleCaseSafe(p.Name)).filter(Boolean),
            taluk: toTitleCaseSafe(po.Block),
            city: toTitleCaseSafe(po.District),
            state: toTitleCaseSafe(po.State),
            country: toTitleCaseSafe(po.Country) || "India",
          },
        });
      })
      .catch((err) => {
        if (controller.signal.aborted || err.name === "AbortError") return;
        setLookup({ pincode, data: null, error: "Failed to fetch pincode details" });
      });

    return () => {
      controller.abort();
    };
  }, [pincode, isValid]);

  // Everything returned is derived from the pincode being shown right now,
  // instead of being reset inside the effect. That has two consequences.
  //
  // A result can only surface for the pincode it was fetched for, so a slow
  // answer for an earlier pincode never leaks through. And loading can no longer
  // stick on: before, clearing the field mid-lookup aborted the request before
  // its `finally` ran, which left `loading` true until the next complete lookup.
  const current = isValid && lookup?.pincode === pincode ? lookup : null;

  return {
    loading: isValid && current === null,
    error: current?.error ?? null,
    data: current?.data ?? null,
  };
}
