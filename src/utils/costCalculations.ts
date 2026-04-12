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
  cargoType: "polymers" | "equipment" | "construction";
  // Polímeros e Equipamentos — por peso e paletes
  weightTon: number;
  numPallets: number; // nº de paletes (cada par ocupa 1.2m de comprimento)
  // Construção — por comprimento
  lengthMeters: number; // comprimento da placa/chapa em metros
  numPlates: number; // nº de placas/chapas
}

// Calcula metros lineares totais a partir das linhas de carga
export function calculateLinearMeters(lines: CargoLine[]): number {
  // Paletes: somar todas as paletes primeiro, depois aplicar ceil(total/2)*1.2
  const totalPallets = lines
    .filter(l => l.cargoType === "polymers" || l.cargoType === "equipment")
    .reduce((sum, l) => sum + l.numPallets, 0);
  const palletMeters = totalPallets > 0 ? Math.ceil(totalPallets / 2) * 1.2 : 0;

  // Construção: comprimento linear = máximo entre todas as placas (não soma)
  const constructionLines = lines.filter(l => l.cargoType === "construction");
  const constructionMeters = constructionLines.length > 0
    ? Math.max(...constructionLines.map(l => l.lengthMeters))
    : 0;

  return palletMeters + constructionMeters;
}

// Soma o peso total (ton) de todas as linhas
export function calculateTotalWeight(lines: CargoLine[]): number {
  return lines.reduce((sum, line) => sum + line.weightTon, 0);
}

export interface ConstructionLine {
  id: string;
  numPlates: number;
  dimensionLabel: string;
  lengthMeters: number;
  weightTon: number;
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

// Seleciona tabela Pombalense: CC se todas as linhas forem construção, CF caso contrário
export function selectPombalenseTable(lines: CargoLine[]): "CF" | "CC" {
  if (lines.length > 0 && lines.every(l => l.cargoType === "construction")) return "CC";
  return "CF";
}

// Mapeia comprimento (metros) para campo CC
function lengthToCCField(lengthMeters: number): keyof CCPriceEntry | null {
  if (lengthMeters <= 1.05) return "chapas2x1";
  if (lengthMeters <= 2) return "chapas3x2";
  if (lengthMeters <= 6) return "chapas4a6";
  if (lengthMeters <= 8) return "chapas7a8";
  return null; // > 8m → 3 Eixos
}

function lengthToCCLabel(lengthMeters: number): string {
  if (lengthMeters <= 1.05) return "Chapas 2×1.05m";
  if (lengthMeters <= 2) return "Chapas 3×2m";
  if (lengthMeters <= 6) return "Chapas 4 a 6m";
  if (lengthMeters <= 8) return "Chapas 7 a 8m";
  return "> 8m (3 Eixos)";
}

// IMPROVED: refactored to receive CargoLine[] and derive all values internally
export function calculateAllPolymerOptions(
  lines: CargoLine[],
  totalKm: number,
  originName: string = "",
  destinationName: string = "",
  numDeliveries: number = 0,
  manualFreights: number = 1
) {
  const totalWeightTon = calculateTotalWeight(lines);
  const linearMeters = calculateLinearMeters(lines);
  const tableToUse = selectPombalenseTable(lines);

  let pombalense: PombalenseCostResult;

  if (tableToUse === "CC") {
    // CC logic: use longest plate to determine price category
    const maxLength = Math.max(...lines.map(l => l.lengthMeters), 0);
    let weightCost = 0;
    let ccPricingLabel = lengthToCCLabel(maxLength);

    if (totalWeightTon >= 15 && totalWeightTon < 25) {
      // >= 15t and < 25t → always Reboque
      const costR = getCCPrice(destinationName, "trailer");
      weightCost = costR ?? 0;
      ccPricingLabel = "Reboque (peso ≥ 15 ton)";
    } else if (maxLength > 8) {
      // > 8m → 3 Eixos or Reboque (cheapest)
      const cost3 = getCCPrice(destinationName, "threeAxle");
      const costR = getCCPrice(destinationName, "trailer");
      if (cost3 !== null && costR !== null) {
        if (cost3 <= costR) {
          weightCost = cost3;
          ccPricingLabel = "3 Eixos (comprimento > 8m)";
        } else {
          weightCost = costR;
          ccPricingLabel = "Reboque (comprimento > 8m)";
        }
      } else {
        weightCost = cost3 ?? costR ?? 0;
        ccPricingLabel = cost3 !== null ? "3 Eixos (comprimento > 8m)" : "Reboque (comprimento > 8m)";
      }
    } else if (numDeliveries > 2 || totalWeightTon > 8) {
      // > 2 deliveries OR > 8 ton (and < 15t) → 3 Eixos
      const cost3 = getCCPrice(destinationName, "threeAxle");
      weightCost = cost3 ?? 0;
      const reason = numDeliveries > 2 && totalWeightTon > 8
        ? "> 2 deslocações e > 8 ton"
        : numDeliveries > 2
        ? "> 2 deslocações"
        : "> 8 ton";
      ccPricingLabel = `3 Eixos (${reason})`;
    } else {
      const ccField = lengthToCCField(maxLength);
      if (ccField) {
        const baseCost = getCCPrice(destinationName, ccField);
        if (baseCost !== null) {
          weightCost = baseCost;
          // ccPricingLabel already set by lengthToCCLabel
        } else {
          // Fallback: 3 Eixos → Reboque
          const cost3 = getCCPrice(destinationName, "threeAxle");
          const costR = getCCPrice(destinationName, "trailer");
          weightCost = cost3 ?? costR ?? 0;
          ccPricingLabel = cost3 !== null ? "3 Eixos (fallback)" : "Reboque (fallback)";
        }
      }
    }

    const deliveryCost = numDeliveries > 0 ? numDeliveries * deliveryCostPerEntry : 0;
    pombalense = {
      weightCost,
      deliveryCost,
      totalCost: weightCost + deliveryCost,
      numFreights: numDeliveries,
      zoneName: ccPricingLabel,
    };
  } else {
    // CF logic (existing)
    pombalense = calculatePombalenseCost(totalWeightTon, originName, destinationName, numDeliveries);
    pombalense.numFreights = numDeliveries;
    pombalense.totalCost = pombalense.weightCost + pombalense.deliveryCost;
  }

  // Fleet options: only viable if weight AND linear meters fit
  const fleetOptions: FleetCostResult[] = fleetVehicles.map((v) => {
    const weightOk = totalWeightTon <= v.capacityTon;
    const metersOk = linearMeters <= v.capacityMeters;
    const viable = weightOk && metersOk;
    const totalCost = viable ? v.costPerKm * totalKm : 0;

    return {
      vehicleName: v.name,
      costPerKm: v.costPerKm,
      capacityTon: v.capacityTon,
      capacityMeters: v.capacityMeters,
      numFreights: viable ? 1 : 0,
      totalCost,
      costPerTon: viable && totalWeightTon > 0 ? totalCost / totalWeightTon : 0,
      costPerKm2: viable && totalKm > 0 ? totalCost / totalKm : 0,
      warning: !viable
        ? (!weightOk && !metersOk ? "Carga excessiva (peso e comprimento)"
          : !weightOk ? "Carga excessiva"
          : "Comprimento excessivo")
        : undefined,
    };
  });

  // Heavy load comparison (CF table only, >= 10 ton, not Meirinhas)
  let heavyLoadComparison: HeavyLoadComparison | null = null;
  const isMeirinhas = originName.includes("Meirinhas");

  if (tableToUse === "CF" && totalWeightTon >= 10 && !isMeirinhas) {
    const zone = findCFZone(originName, destinationName);
    const beyondRate = zone?.beyondTenTonPerTon ?? 0;
    const custoCFIncremental = totalWeightTon * beyondRate;

    const custoThreeAxle = getCCPrice(destinationName, "threeAxle");
    let custoTrailer: number | null = null;
    let suggestThreeAxle = false;
    let suggestTrailer = false;

    const skipCFIncremental = numDeliveries > 0;

    let custoBaseEfetivo = skipCFIncremental ? Infinity : custoCFIncremental;
    let optionUsed: "CF" | "3Eixos" | "Reboque" = skipCFIncremental ? "3Eixos" : "CF";

    if (custoThreeAxle !== null && custoThreeAxle < custoBaseEfetivo) {
      custoBaseEfetivo = custoThreeAxle;
      optionUsed = "3Eixos";
      suggestThreeAxle = true;
    }

    custoTrailer = getCCPrice(destinationName, "trailer");
    if (custoTrailer !== null && custoTrailer < custoBaseEfetivo) {
      custoBaseEfetivo = custoTrailer;
      optionUsed = "Reboque";
      suggestTrailer = true;
      suggestThreeAxle = false;
    }

    if (skipCFIncremental && custoBaseEfetivo === Infinity) {
      custoBaseEfetivo = custoCFIncremental;
      optionUsed = "CF";
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

    pombalense.weightCost = custoBaseEfetivo;
    pombalense.totalCost = custoBaseEfetivo + pombalense.deliveryCost;
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
    if (!opt.warning && opt.totalCost < minCost) {
      minCost = opt.totalCost;
      cheapest = opt.vehicleName;
    }
  }

  return cheapest;
}
