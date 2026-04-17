// IMPROVED: hook to manage CF/CC price table overrides via localStorage
import { useCallback, useEffect, useState } from "react";
import type { CFZone, CCPriceEntry } from "@/data/fleetData";

const CF_KEY = "agi-cf-override";
const CC_KEY = "agi-cc-override";

function readOverride<T>(key: string): T[] | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

export function getCFOverrideSync(): CFZone[] | null {
  return readOverride<CFZone>(CF_KEY);
}

export function getCCOverrideSync(): CCPriceEntry[] | null {
  return readOverride<CCPriceEntry>(CC_KEY);
}

export function usePriceTableOverrides() {
  const [cfOverride, setCFState] = useState<CFZone[] | null>(() => getCFOverrideSync());
  const [ccOverride, setCCState] = useState<CCPriceEntry[] | null>(() => getCCOverrideSync());

  // Listen for cross-tab/storage changes
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === CF_KEY) setCFState(getCFOverrideSync());
      if (e.key === CC_KEY) setCCState(getCCOverrideSync());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setCFOverride = useCallback((zones: CFZone[]) => {
    localStorage.setItem(CF_KEY, JSON.stringify(zones));
    setCFState(zones);
  }, []);

  const setCCOverride = useCallback((entries: CCPriceEntry[]) => {
    localStorage.setItem(CC_KEY, JSON.stringify(entries));
    setCCState(entries);
  }, []);

  const clearOverrides = useCallback((which?: "cf" | "cc") => {
    if (!which || which === "cf") {
      localStorage.removeItem(CF_KEY);
      setCFState(null);
    }
    if (!which || which === "cc") {
      localStorage.removeItem(CC_KEY);
      setCCState(null);
    }
  }, []);

  return { cfOverride, ccOverride, setCFOverride, setCCOverride, clearOverrides };
}
