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

// IMPROVED: added custoBaseEfetivo and optionUsed to determine which option was applied
export interface HeavyLoadComparison {
  custoCFIncremental: number;
  custoThreeAxle: number | null;
  custoTrailer: number | null;
  suggestThreeAxle: boolean;
  suggestTrailer: boolean;
  custoBaseEfetivo: number;
  optionUsed: "CF" | "3Eixos" | "Reboque";
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
  // IMPROVED: warning for capacity exceeded per trip
  warning?: string;
}

export interface PombalenseCostResult {
  weightCost: number;
  deliveryCost: number;
  totalCost: number;
  numFreights: number;
  zoneName?: string;
}

// IMPROVED: removed fallback — returns null if no zone found
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

  // IMPROVED: no fallback — return null if no match
  return null;
}

// IMPROVED: weight zero protection
export function getCFWeightCost(zone: CFZone, weightKg: number): number {
  if (weightKg <= 0) return 0;
  
  const sorted = [...zone.prices].sort((a, b) => a.kgUpTo - b.kgUpTo);
  
  for (const entry of sorted) {
    if (weightKg <= entry.kgUpTo) {
      return entry.cost;
    }
  }

  if (zone.beyondTenTonPerTon && weightKg > 10000) {
    const tons = weightKg / 1000;
    return zone.beyondTenTonPerTon * tons;
  }

  if (zone.fullLoadPrices) {
    return zone.fullLoadPrices.threeAxle ?? zone.fullLoadPrices.trailer ?? sorted[sorted.length - 1]?.cost ?? 0;
  }

  return sorted[sorted.length - 1]?.cost ?? 0;
}

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

export function calculateFreights(totalWeight: number, capacity: number): number {
  if (capacity <= 0) return 0;
  return Math.ceil(totalWeight / capacity);
}

// IMPROVED: removed *2 from roundTripKm — user inputs total distance
export function calculateFleetCost(
  vehicle: FleetVehicle,
  totalKm: number,
  totalWeightTon: number
): FleetCostResult {
  const numFreights = calculateFreights(totalWeightTon, vehicle.capacityTon);
  const roundTripKm = totalKm;
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

// IMPROVED: delivery cost = numDeliveries * 25€ (min 0), weight zero protection
export function calculatePombalenseCost(
  totalWeightTon: number,
  originName: string,
  destinationName: string,
  numDeliveries: number = 0
): PombalenseCostResult {
  if (totalWeightTon <= 0) {
    return { weightCost: 0, deliveryCost: 0, totalCost: 0, numFreights: 1, zoneName: undefined };
  }

  const zone = findCFZone(originName, destinationName);
  const weightKg = totalWeightTon * 1000;
  
  let weightCost = 0;
  let zoneName: string | undefined = undefined;
  
  if (zone) {
    weightCost = getCFWeightCost(zone, weightKg);
    zoneName = zone.zoneName;
  }
  
  // IMPROVED: delivery cost = numDeliveries * 25€ (no "minus 1" logic)
  const deliveryCost = numDeliveries > 0 ? numDeliveries * deliveryCostPerEntry : 0;

  return {
    weightCost,
    deliveryCost,
    totalCost: weightCost + deliveryCost,
    numFreights: 1,
    zoneName,
  };
}

// IMPROVED: added capacity warning per trip, heavy load comparison for >10 ton
export function calculateAllPolymerOptions(
  totalWeightTon: number,
  totalKm: number,
  originName: string = "",
  destinationName: string = "",
  numDeliveries: number = 0,
  manualFreights: number = 1
) {
  const pombalense = calculatePombalenseCost(totalWeightTon, originName, destinationName, numDeliveries);
  pombalense.numFreights = manualFreights;
  pombalense.totalCost = (pombalense.weightCost + pombalense.deliveryCost) * manualFreights;
  
  const fleetOptions = fleetVehicles.map((v) => {
    const result = calculateFleetCost(v, totalKm, totalWeightTon);
    // IMPROVED: check weight per trip vs capacity
    const weightPerTrip = totalWeightTon / manualFreights;
    let warning: string | undefined;
    if (weightPerTrip > v.capacityTon) {
      warning = "Carga por deslocação excede capacidade deste veículo";
    }
    result.numFreights = manualFreights;
    result.totalCost = v.costPerKm * totalKm * manualFreights;
    result.costPerTon = totalWeightTon > 0 ? result.totalCost / totalWeightTon : 0;
    result.costPerKm2 = totalKm > 0 ? result.totalCost / totalKm : 0;
    result.warning = warning;
    return result;
  });

  // IMPROVED: heavy load comparison with custoBaseEfetivo — picks cheapest option and applies to pombalense totalCost
  let heavyLoadComparison: HeavyLoadComparison | null = null;
  const isMeirinhas = originName.includes("Meirinhas");
  
  // IMPROVED: trigger heavy load analysis at >= 10 ton (inclusive)
  if (totalWeightTon >= 10 && !isMeirinhas) {
    const zone = findCFZone(originName, destinationName);
    const beyondRate = zone?.beyondTenTonPerTon ?? 0;
    const custoCFIncremental = totalWeightTon * beyondRate;
    
    const custoThreeAxle = getCCPrice(destinationName, "threeAxle");
    let custoTrailer: number | null = null;
    let suggestThreeAxle = false;
    let suggestTrailer = false;
    
    // IMPROVED: determine custoBaseEfetivo as the cheapest available option
    let custoBaseEfetivo = custoCFIncremental;
    let optionUsed: "CF" | "3Eixos" | "Reboque" = "CF";
    
    if (custoThreeAxle !== null && custoThreeAxle < custoBaseEfetivo) {
      custoBaseEfetivo = custoThreeAxle;
      optionUsed = "3Eixos";
      suggestThreeAxle = true;
    }
    
    // IMPROVED: always fetch trailer cost for comparison
    custoTrailer = getCCPrice(destinationName, "trailer");
    if (custoTrailer !== null && custoTrailer < custoBaseEfetivo) {
      custoBaseEfetivo = custoTrailer;
      optionUsed = "Reboque";
      suggestTrailer = true;
      suggestThreeAxle = false;
    }
    
    heavyLoadComparison = {
      custoCFIncremental,
      custoThreeAxle,
      custoTrailer,
      suggestThreeAxle,
      suggestTrailer,
      custoBaseEfetivo,
      optionUsed,
    };
    
    // IMPROVED: apply custoBaseEfetivo to pombalense totalCost
    pombalense.weightCost = custoBaseEfetivo;
    pombalense.totalCost = (custoBaseEfetivo + pombalense.deliveryCost) * manualFreights;
  }

  return { pombalense, fleetOptions, heavyLoadComparison };
}

// IMPROVED: removed *2 from roundTripKm
export function calculateFleetCostByMeters(
  vehicle: FleetVehicle,
  totalKm: number,
  totalMeters: number
): FleetCostResult {
  const numFreights = calculateFreights(totalMeters, vehicle.capacityMeters);
  const roundTripKm = totalKm;
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
      totalCost += unitCost;
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
