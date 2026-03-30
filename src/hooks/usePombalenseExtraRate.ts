// IMPROVED: Hook to manage Pombalense extra rate via localStorage
import { useState, useEffect } from "react";

const STORAGE_KEY = "agi-pombalense-extra-rate";
const DEFAULT_RATE = 0;

export function usePombalenseExtraRate() {
  const [rate, setRateState] = useState<number>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored !== null ? Number(stored) : DEFAULT_RATE;
  });

  const setRate = (newRate: number) => {
    setRateState(newRate);
    localStorage.setItem(STORAGE_KEY, String(newRate));
  };

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) setRateState(Number(stored));
  }, []);

  return { rate, setRate };
}
