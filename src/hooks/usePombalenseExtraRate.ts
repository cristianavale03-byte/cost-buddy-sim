// IMPROVED: Hook to manage Pombalense extra rate via Supabase settings table
import { useState, useEffect } from "react";
import { fetchExtraRate, upsertExtraRate } from "@/services/supabaseService";

export function usePombalenseExtraRate() {
  const [rate, setRateState] = useState<number>(0);
  const [loadingRate, setLoadingRate] = useState(true);

  // IMPROVED: load rate from Supabase on mount
  useEffect(() => {
    fetchExtraRate()
      .then(r => setRateState(r))
      .catch(() => {})
      .finally(() => setLoadingRate(false));
  }, []);

  // IMPROVED: persist rate to Supabase on change
  const setRate = (newRate: number) => {
    setRateState(newRate);
    upsertExtraRate(newRate).catch(() => {});
  };

  return { rate, setRate, loadingRate };
}
