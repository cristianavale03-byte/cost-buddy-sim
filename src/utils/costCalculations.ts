import {
  fleetVehicles,
  genericWeightPrices,
  deliveryCostPerEntry,
  type FleetVehicle,
} from "@/data/fleetData";

export interface CargoLine {
  id: string;
  client: string;
  weightTon: number;
}

export interface ConstructionLine {
  id: string;
  numPlates: number;
  dimensionLabel: string;
  lengthMeters: number;
}

export interface FleetCostResult {
  vehicleName: string;
  costPerKm: number;
  capacityTon: number;
  capacityMeters: number;
  numFreights: number;
  totalCost: number;
  costPerTon?: number;
  costPerKm2?: number;
}

export interface PombalenseCostResult {
  weightCost: number;
  deliveryCost: number;
  totalCost: number;
  numFreights: number;
}

// Get Pombalense cost for a given weight in kg
export function getPombalenseWeightCost(weightKg: number): number {
  const sorted = [...genericWeightPrices]
    .filter((p) => p.kgUpTo > 0)
    .sort((a, b) => a.kgUpTo - b.kgUpTo);

  for (const entry of sorted) {
    if (weightKg <= entry.kgUpTo) {
      return entry.cost;
    }
  }
  return sorted[sorted.length - 1]?.cost ?? 0;
}

// Calculate number of freights needed
export function calculateFreights(totalWeight: number, capacity: number): number {
  if (capacity <= 0) return 0;
  return Math.ceil(totalWeight / capacity);
}

// Calculate own fleet cost for a given vehicle
export function calculateFleetCost(
  vehicle: FleetVehicle,
  totalKm: number,
  totalWeightTon: number
): FleetCostResult {
  const numFreights = calculateFreights(totalWeightTon, vehicle.capacityTon);
  const roundTripKm = totalKm * 2;
  const totalCost = vehicle.costPerKm * roundTripKm * numFreights;

  return {
    vehicleName: vehicle.name,
    costPerKm: vehicle.costPerKm,
    capacityTon: vehicle.capacityTon,
    capacityMeters: vehicle.capacityMeters,
    numFreights,
    totalCost,
    costPerTon: totalWeightTon > 0 ? totalCost / totalWeightTon : 0,
    costPerKm2: totalKm > 0 ? totalCost / totalKm : 0,
  };
}

// Calculate Pombalense cost for polymers/equipment
export function calculatePombalenseCost(
  totalWeightTon: number,
  hasInternalDelivery: boolean = true
): PombalenseCostResult {
  const weightKg = totalWeightTon * 1000;
  const weightCost = getPombalenseWeightCost(weightKg);
  const numFreights = 1; // Pombalense handles in single load typically
  const deliveryCost = hasInternalDelivery ? deliveryCostPerEntry * 3 : 0; // 3 deliveries as per model

  return {
    weightCost,
    deliveryCost,
    totalCost: weightCost + deliveryCost,
    numFreights,
  };
}

// Calculate all options for polymers
export function calculateAllPolymerOptions(
  totalWeightTon: number,
  totalKm: number,
  hasInternalDelivery: boolean = true
) {
  const pombalense = calculatePombalenseCost(totalWeightTon, hasInternalDelivery);
  const fleetOptions = fleetVehicles.map((v) =>
    calculateFleetCost(v, totalKm, totalWeightTon)
  );

  return { pombalense, fleetOptions };
}

// Calculate fleet cost for construction (by meters)
export function calculateFleetCostByMeters(
  vehicle: FleetVehicle,
  totalKm: number,
  totalMeters: number
): FleetCostResult {
  const numFreights = calculateFreights(totalMeters, vehicle.capacityMeters);
  const roundTripKm = totalKm * 2;
  const totalCost = vehicle.costPerKm * roundTripKm * numFreights;

  return {
    vehicleName: vehicle.name,
    costPerKm: vehicle.costPerKm,
    capacityTon: vehicle.capacityTon,
    capacityMeters: vehicle.capacityMeters,
    numFreights,
    totalCost,
    costPerKm2: totalKm > 0 ? totalCost / totalKm : 0,
  };
}

// Calculate construction Pombalense cost
export function calculateConstructionPombalense(
  totalMeters: number,
  maxPlateLength: number,
  totalKm: number,
  numDeliveries: number = 3
): { metroCost: number; deliveryCost: number; totalCost: number; supplement: number } {
  // Base metro cost scales with km and length
  // From model: base cost ~332€ for 360km, Chapas 4-6m
  const baseCostPerKm = 332 / 360;
  let metroCost = baseCostPerKm * totalKm;

  // Supplement for excessive length (>6m)
  let supplement = 0;
  if (maxPlateLength > 6) {
    supplement = metroCost * 0.2; // 20% supplement
  }

  metroCost += supplement;
  const deliveryCost = numDeliveries * deliveryCostPerEntry;

  return {
    metroCost,
    deliveryCost,
    totalCost: metroCost + deliveryCost,
    supplement,
  };
}

// Find cheapest option
export function findCheapest(
  pombalenseTotal: number,
  fleetOptions: FleetCostResult[]
): string {
  let minCost = pombalenseTotal;
  let cheapest = "Pombalense";

  for (const opt of fleetOptions) {
    if (opt.totalCost < minCost) {
      minCost = opt.totalCost;
      cheapest = opt.vehicleName;
    }
  }

  return cheapest;
}
