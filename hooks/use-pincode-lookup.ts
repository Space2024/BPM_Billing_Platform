"use client";

import { useState, useEffect, useRef } from "react";
import { toTitleCase } from "@/lib/utils";

const PINCODE_API_URL = "https://cust.spacetextiles.net/Postal-Code-List";

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

const titleCase = (value: string | null | undefined) =>
  value ? toTitleCase(value) : "";

export function usePincodeLookup(pincode: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PincodeData | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Only look up when we have exactly 6 digits
    if (!/^\d{6}$/.test(pincode)) {
      setData(null);
      setError(null);
      return;
    }

    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    fetch(PINCODE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinCode: pincode }),
      signal: controller.signal,
    })
      .then((r) => {
        if (!r.ok) throw new Error(`Request failed with status ${r.status}`);
        return r.json();
      })
      .then((result: PincodeApiResponse) => {
        if (result?.Status !== "Success" || !result.PostOffice?.length) {
          setError("Pincode not found");
          setData(null);
          return;
        }

        const po = result.PostOffice[0];
        setData({
          areas: result.PostOffice.map((p) => titleCase(p.Name)).filter(Boolean),
          taluk: titleCase(po.Block),
          city: titleCase(po.District),
          state: titleCase(po.State),
          country: titleCase(po.Country) || "India",
        });
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setError("Failed to fetch pincode details");
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [pincode]);

  return { loading, error, data };
}
