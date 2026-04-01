// IMPROVED: centralized state context to preserve simulator data across tab navigation
import { createContext, useContext, useState, type ReactNode } from "react";
import type { CargoLine, ConstructionLine } from "@/utils/costCalculations";

export interface SavedEstimate {
  id: string;
  name: string;
  savedAt: string;
  type: "polymers" | "construction";
  origin?: string;
  destination?: string;
  totalKm?: number;
  totalWeightTon?: number;
  cargoLines?: CargoLine[];
  pombalenseTotalCost?: number;
  pombalensetWeightCost?: number;
  pombalensetDeliveryCost?: number;
  bestFleetOption?: string;
  bestFleetCost?: number;
  // IMPROVED: individual fleet costs for archive table
  fleet6tCost?: number;
  fleet9tCost?: number;
  fleet15tCost?: number;
  cheapestOption?: string;
  heavyLoadComparison?: object;
  weightTon?: number;
  totalMeters?: number;
  largestPlateLabel?: string;
  numFreights?: number;
  constructionPombalenseCost?: number;
  extraRateApplied?: number;
}

interface PolymerState {
  origin: string;
  destination: string;
  totalKm: number;
  numFreightsManual: number;
  cargoLines: CargoLine[];
  results: any | null;
}

interface ConstructionState {
  destination: string;
  totalKm: number;
  lines: ConstructionLine[];
  numFreightsManual: number;
  results: any | null;
}

interface SimulatorStateContextType {
  polymer: PolymerState;
  setPolymer: React.Dispatch<React.SetStateAction<PolymerState>>;
  construction: ConstructionState;
  setConstruction: React.Dispatch<React.SetStateAction<ConstructionState>>;
  savedEstimates: SavedEstimate[];
  setSavedEstimates: React.Dispatch<React.SetStateAction<SavedEstimate[]>>;
}

const defaultPolymer: PolymerState = {
  origin: "",
  destination: "",
  totalKm: 0,
  numFreightsManual: 0,
  cargoLines: [{ id: crypto.randomUUID(), client: "", weightTon: 0 }],
  results: null,
};

const defaultConstruction: ConstructionState = {
  destination: "",
  totalKm: 0,
  lines: [{ id: crypto.randomUUID(), numPlates: 0, dimensionLabel: "", lengthMeters: 0, weightTon: 0 }],
  numFreightsManual: 0,
  results: null,
};

const SimulatorStateContext = createContext<SimulatorStateContextType | null>(null);

export function SimulatorStateProvider({ children }: { children: ReactNode }) {
  const [polymer, setPolymer] = useState<PolymerState>(defaultPolymer);
  const [construction, setConstruction] = useState<ConstructionState>(defaultConstruction);
  // IMPROVED: persist savedEstimates in localStorage across sessions
  const [savedEstimates, setSavedEstimates] = useState<SavedEstimate[]>(() => {
    try {
      const stored = localStorage.getItem("agi-saved-estimates");
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  // IMPROVED: sync savedEstimates to localStorage on every change
  const setSavedEstimatesAndPersist: React.Dispatch<React.SetStateAction<SavedEstimate[]>> = (action) => {
    setSavedEstimates(prev => {
      const next = typeof action === "function" ? action(prev) : action;
      try { localStorage.setItem("agi-saved-estimates", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  return (
    <SimulatorStateContext.Provider value={{ polymer, setPolymer, construction, setConstruction, savedEstimates, setSavedEstimates: setSavedEstimatesAndPersist }}>
      {children}
    </SimulatorStateContext.Provider>
  );
}

export function useSimulatorState() {
  const ctx = useContext(SimulatorStateContext);
  if (!ctx) throw new Error("useSimulatorState must be used within SimulatorStateProvider");
  return ctx;
}

export { defaultPolymer, defaultConstruction };
