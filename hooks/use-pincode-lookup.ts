"use client";

import { useState, useEffect, useRef } from "react";

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
  Division: string;
  State: string;
  Country: string;
}

interface PincodeApiResponse {
  Status: string;
  PostOffice: PostOffice[] | null;
}

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

    fetch(`https://api.postalpincode.in/pincode/${pincode}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((json: PincodeApiResponse[]) => {
        const result = json[0];
        if (result?.Status !== "Success" || !result.PostOffice?.length) {
          setError("Pincode not found");
          setData(null);
          return;
        }

        const po = result.PostOffice[0];
        setData({
          areas: result.PostOffice.map(p => p.Name || "").filter(Boolean),
          taluk: po.Block || po.Division || "",
          city: po.District || "",
          state: po.State || "",
          country: po.Country || "India",
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
