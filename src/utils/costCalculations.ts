import {
  fleetVehicles,
  cfZones,
  ccPrices,
  deliveryCostPerEntry,
  type FleetVehicle,
  type CFZone,
  type CCPriceEntry,
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
  zoneName?: string;
}

// Find the best matching CF zone for an origin + destination
export function findCFZone(originName: string, destinationName: string): CFZone | null {
  const originId = originName.includes("Gulpilhares") || originName.includes("Espinho") ? 1
    : originName.includes("Meirinhas") ? 2
    : originName.includes("Maia") ? 3
    : 0;

  const zones = cfZones.filter(z => z.originId === originId);
  
  // Try exact match first
  for (const zone of zones) {
    if (zone.destinations.some(d => d.toLowerCase() === destinationName.toLowerCase())) {
      return zone;
    }
  }
  
  // Try partial match
  for (const zone of zones) {
    if (zone.destinations.some(d => 
      d.toLowerCase().includes(destinationName.toLowerCase()) ||
      destinationName.toLowerCase().includes(d.toLowerCase())
    )) {
      return zone;
    }
  }

  // Fallback: return most common zone for this origin
  return zones.length > 0 ? zones[zones.length - 1] : null;
}

// Get CF weight cost from a specific zone
export function getCFWeightCost(zone: CFZone, weightKg: number): number {
  const sorted = [...zone.prices].sort((a, b) => a.kgUpTo - b.kgUpTo);
  
  for (const entry of sorted) {
    if (weightKg <= entry.kgUpTo) {
      return entry.cost;
    }
  }

  // Beyond table: check if beyondTenTonPerTon exists
  if (zone.beyondTenTonPerTon && weightKg > 10000) {
    const tons = weightKg / 1000;
    return zone.beyondTenTonPerTon * tons;
  }

  // Check full load prices
  if (zone.fullLoadPrices) {
    return zone.fullLoadPrices.threeAxle ?? zone.fullLoadPrices.trailer ?? sorted[sorted.length - 1]?.cost ?? 0;
  }

  return sorted[sorted.length - 1]?.cost ?? 0;
}

// Get CC construction price for a destination and plate type
export function getCCPrice(destinationName: string, ccField: keyof CCPriceEntry): number | null {
  const entry = ccPrices.find(p => 
    p.destination.toLowerCase() === destinationName.toLowerCase() ||
    p.destination.toLowerCase().includes(destinationName.toLowerCase()) ||
    destinationName.toLowerCase().includes(p.destination.toLowerCase())
  );
  if (!entry) return null;
  const val = entry[ccField];
  return typeof val === "number" ? val : null;
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

// Calculate Pombalense cost using CF zone lookup
export function calculatePombalenseCost(
  totalWeightTon: number,
  originName: string,
  destinationName: string,
  numDeliveries: number = 1
): PombalenseCostResult {
  const zone = findCFZone(originName, destinationName);
  const weightKg = totalWeightTon * 1000;
  
  let weightCost = 0;
  let zoneName = "Zona genérica";
  
  if (zone) {
    weightCost = getCFWeightCost(zone, weightKg);
    zoneName = zone.zoneName;
  }
  
  const deliveryCost = numDeliveries > 1 ? (numDeliveries - 1) * deliveryCostPerEntry : 0;

  return {
    weightCost,
    deliveryCost,
    totalCost: weightCost + deliveryCost,
    numFreights: 1,
    zoneName,
  };
}

// Calculate all options for polymers
export function calculateAllPolymerOptions(
  totalWeightTon: number,
  totalKm: number,
  originName: string = "",
  destinationName: string = "",
  numDeliveries: number = 1
) {
  const pombalense = calculatePombalenseCost(totalWeightTon, originName, destinationName, numDeliveries);
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

// Calculate construction Pombalense cost using CC table
export interface ConstructionPombalenseResult {
  prices: { label: string; cost: number | null }[];
  totalCost: number;
  deliveryCost: number;
  supplement: number;
}

export function calculateConstructionPombalense(
  destinationName: string,
  lines: ConstructionLine[],
  numDeliveries: number = 1
): ConstructionPombalenseResult {
  const dimensionTypesMap: Record<string, keyof CCPriceEntry> = {
    "Chapas 2×1.05m": "chapas2x1",
    "Chapas 3×2m": "chapas3x2",
    "Chapas 4 a 6m": "chapas4a6",
    "Chapas 7 a 8m": "chapas7a8",
  };

  const prices: { label: string; cost: number | null }[] = [];
  let totalCost = 0;

  for (const line of lines) {
    if (line.numPlates <= 0) continue;
    const ccField = dimensionTypesMap[line.dimensionLabel];
    if (!ccField) continue;
    const unitCost = getCCPrice(destinationName, ccField);
    prices.push({ label: `${line.numPlates}x ${line.dimensionLabel}`, cost: unitCost });
    if (unitCost !== null) {
      totalCost += unitCost; // CC prices are per full load
    }
  }

  const deliveryCost = numDeliveries > 0 ? numDeliveries * deliveryCostPerEntry : 0;

  return {
    prices,
    totalCost: totalCost + deliveryCost,
    deliveryCost,
    supplement: 0,
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
