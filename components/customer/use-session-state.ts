import React from "react";

export function useSessionState<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = React.useState<T>(() => {
    // Initialize state from sessionStorage on mount
    if (typeof window !== "undefined") {
      try {
        const item = sessionStorage.getItem(key);
        if (item) {
          return JSON.parse(item);
        }
      } catch (e) {
        // Ignore errors
      }
    }
    return initialValue;
  });

  // Save to sessionStorage whenever state changes
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(key, JSON.stringify(state));
      } catch (e) {
        // Ignore errors
      }
    }
  }, [key, state]);

  return [state, setState];
}

/**
 * Clear all registration form data from sessionStorage
 */
export function clearRegistrationFormData(): void {
  if (typeof window === "undefined") return;
  
  const keys = [
    "rf_store",
    "rf_prefix",
    "rf_fn",
    "rf_ln",
    "rf_dn",
    "rf_str",
    "rf_pin",
    "rf_area",
    "rf_tal",
    "rf_city",
    "rf_state",
    "rf_country",
    "rf_step",
  ];
  
  keys.forEach(key => {
    try {
      sessionStorage.removeItem(key);
    } catch (e) {
      // Ignore errors
    }
  });
}

/**
 * Clear all cross-form (textiles-jewellery) data from sessionStorage
 */
export function clearCrossFormData(): void {
  if (typeof window === "undefined") return;
  
  const keys = [
    "cf_jewstore",
    "cf_dn",
    "cf_str",
    "cf_pin",
    "cf_area",
    "cf_tal",
    "cf_city",
    "cf_state",
    "cf_country",
    "cf_step",
  ];
  
  keys.forEach(key => {
    try {
      sessionStorage.removeItem(key);
    } catch (e) {
      // Ignore errors
    }
  });
}
