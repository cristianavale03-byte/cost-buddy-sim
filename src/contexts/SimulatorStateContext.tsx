// IMPROVED: centralized state context — estimates now persisted in Supabase
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { CargoLine } from "@/utils/costCalculations";
import { fetchEstimates, insertEstimate, deleteEstimate as deleteEstimateSvc, clearAllEstimates } from "@/services/supabaseService";

export interface SavedEstimate {
  id: string;
  name: string;
  savedAt: string;
  savedBy?: string;
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
  fleet6tCost?: number;
  fleet6tWarning?: string;
  fleet9tCost?: number;
  fleet9tWarning?: string;
  fleet15tCost?: number;
  fleet15tWarning?: string;
  cheapestOption?: string;
  heavyLoadComparison?: object;
  weightTon?: number;
  totalMeters?: number;
  largestPlateLabel?: string;
  numFreights?: number;
  constructionPombalenseCost?: number;
  extraRateApplied?: number;
  chosenOption?: string;
  observations?: string;
}

interface PolymerState {
  origin: string;
  destination: string;
  totalKm: number;
  numFreightsManual: number;
  cargoLines: CargoLine[];
  results: any | null;
}

interface SimulatorStateContextType {
  polymer: PolymerState;
  setPolymer: React.Dispatch<React.SetStateAction<PolymerState>>;
  savedEstimates: SavedEstimate[];
  setSavedEstimates: React.Dispatch<React.SetStateAction<SavedEstimate[]>>;
  loadingEstimates: boolean;
}

const defaultPolymer: PolymerState = {
  origin: "",
  destination: "",
  totalKm: 0,
  numFreightsManual: 0,
  cargoLines: [{ id: crypto.randomUUID(), client: "", cargoType: "polymers", weightTon: 0, numPallets: 0, lengthMeters: 0, numPlates: 0 }],
  results: null,
};

const SimulatorStateContext = createContext<SimulatorStateContextType | null>(null);

// IMPROVED: map DB row (snake_case) to app interface (camelCase)
function dbToEstimate(row: any): SavedEstimate {
  return {
    id: row.id,
    name: row.name,
    savedAt: row.saved_at,
    savedBy: row.saved_by ?? undefined,
    type: row.type,
    origin: row.origin ?? undefined,
    destination: row.destination ?? undefined,
    totalKm: row.total_km != null ? Number(row.total_km) : undefined,
    totalWeightTon: row.total_weight_ton != null ? Number(row.total_weight_ton) : undefined,
    cargoLines: row.cargo_lines ?? undefined,
    pombalenseTotalCost: row.pombalense_total_cost != null ? Number(row.pombalense_total_cost) : undefined,
    pombalensetWeightCost: row.pombalense_weight_cost != null ? Number(row.pombalense_weight_cost) : undefined,
    pombalensetDeliveryCost: row.pombalense_delivery_cost != null ? Number(row.pombalense_delivery_cost) : undefined,
    bestFleetOption: row.best_fleet_option ?? undefined,
    bestFleetCost: row.best_fleet_cost != null ? Number(row.best_fleet_cost) : undefined,
    fleet6tCost: row.fleet_6t_cost != null ? Number(row.fleet_6t_cost) : undefined,
    fleet9tCost: row.fleet_9t_cost != null ? Number(row.fleet_9t_cost) : undefined,
    fleet15tCost: row.fleet_15t_cost != null ? Number(row.fleet_15t_cost) : undefined,
    cheapestOption: row.cheapest_option ?? undefined,
    heavyLoadComparison: row.heavy_load_comparison ?? undefined,
    weightTon: row.weight_ton != null ? Number(row.weight_ton) : undefined,
    totalMeters: row.total_meters != null ? Number(row.total_meters) : undefined,
    largestPlateLabel: row.largest_plate_label ?? undefined,
    numFreights: row.num_freights ?? undefined,
    constructionPombalenseCost: row.construction_pombalense_cost != null ? Number(row.construction_pombalense_cost) : undefined,
    extraRateApplied: row.extra_rate_applied != null ? Number(row.extra_rate_applied) : undefined,
    chosenOption: row.chosen_option ?? undefined,
    observations: row.observations ?? undefined,
  };
}

// IMPROVED: map app interface (camelCase) to DB row (snake_case) for insert
function estimateToDb(e: SavedEstimate): Record<string, unknown> {
  return {
    id: e.id,
    name: e.name,
    saved_at: e.savedAt,
    saved_by: e.savedBy ?? null,
    type: e.type,
    origin: e.origin ?? null,
    destination: e.destination ?? null,
    total_km: e.totalKm ?? null,
    total_weight_ton: e.totalWeightTon ?? null,
    cargo_lines: e.cargoLines ?? null,
    pombalense_total_cost: e.pombalenseTotalCost ?? null,
    pombalense_weight_cost: e.pombalensetWeightCost ?? null,
    pombalense_delivery_cost: e.pombalensetDeliveryCost ?? null,
    best_fleet_option: e.bestFleetOption ?? null,
    best_fleet_cost: e.bestFleetCost ?? null,
    fleet_6t_cost: e.fleet6tCost ?? null,
    fleet_9t_cost: e.fleet9tCost ?? null,
    fleet_15t_cost: e.fleet15tCost ?? null,
    cheapest_option: e.cheapestOption ?? null,
    heavy_load_comparison: e.heavyLoadComparison ?? null,
    weight_ton: e.weightTon ?? null,
    total_meters: e.totalMeters ?? null,
    largest_plate_label: e.largestPlateLabel ?? null,
    num_freights: e.numFreights ?? null,
    construction_pombalense_cost: e.constructionPombalenseCost ?? null,
    extra_rate_applied: e.extraRateApplied ?? null,
    chosen_option: e.chosenOption ?? null,
    observations: e.observations ?? null,
  };
}

export function SimulatorStateProvider({ children }: { children: ReactNode }) {
  const [polymer, setPolymer] = useState<PolymerState>(defaultPolymer);
  const [savedEstimates, setSavedEstimatesLocal] = useState<SavedEstimate[]>([]);
  const [loadingEstimates, setLoadingEstimates] = useState(true);

  // IMPROVED: load estimates from Supabase on mount
  useEffect(() => {
    fetchEstimates()
      .then(rows => setSavedEstimatesLocal(rows.map(dbToEstimate)))
      .catch(() => {})
      .finally(() => setLoadingEstimates(false));
  }, []);

  // IMPROVED: optimistic update wrapper — persists to Supabase in background
  const setSavedEstimates: React.Dispatch<React.SetStateAction<SavedEstimate[]>> = (action) => {
    setSavedEstimatesLocal(prev => {
      const next = typeof action === "function" ? action(prev) : action;

      // Detect added items
      const added = next.filter(n => !prev.some(p => p.id === n.id));
      added.forEach(e => insertEstimate(estimateToDb(e)).catch(() => {}));

      // Detect removed items
      const removed = prev.filter(p => !next.some(n => n.id === p.id));
      if (removed.length === prev.length && next.length === 0) {
        // clear all
        clearAllEstimates().catch(() => {});
      } else {
        removed.forEach(e => deleteEstimateSvc(e.id).catch(() => {}));
      }

      return next;
    });
  };

  return (
    <SimulatorStateContext.Provider value={{ polymer, setPolymer, savedEstimates, setSavedEstimates, loadingEstimates }}>
      {children}
    </SimulatorStateContext.Provider>
  );
}

export function useSimulatorState() {
  const ctx = useContext(SimulatorStateContext);
  if (!ctx) throw new Error("useSimulatorState must be used within SimulatorStateProvider");
  return ctx;
}

export { defaultPolymer };
