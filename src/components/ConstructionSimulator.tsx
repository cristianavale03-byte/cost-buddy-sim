import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, TrendingDown, Lock, AlertTriangle, Info, RotateCcw, Save, Check, X } from "lucide-react";
import { ccPrices, dimensionTypes, fleetVehicles, deliveryCostPerEntry, type CCPriceEntry } from "@/data/fleetData";
import { calculateFleetCostByMeters, findCheapest, type FleetCostResult } from "@/utils/costCalculations";
import { CostComparisonChart } from "./CostComparisonChart";
import type { ConstructionLine } from "@/utils/costCalculations";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { usePombalenseExtraRate } from "@/hooks/usePombalenseExtraRate";
import { getConstructionRoundTripKm } from "@/data/distanceData";
// IMPROVED: use context for state persistence across tabs
import { useSimulatorState, defaultConstruction, type SavedEstimate } from "@/contexts/SimulatorStateContext";

const ccDestinations = ccPrices.map(p => p.destination).sort();

const dimensionOrder = [
  { label: "Chapas 2×1.05m", meters: 1.05 },
  { label: "Chapas 3×2m", meters: 2 },
  { label: "Chapas 4 a 6m", meters: 6 },
  { label: "Chapas 7 a 8m", meters: 8 },
];

const dimensionToCCField: Record<string, keyof CCPriceEntry> = {
  "Chapas 2×1.05m": "chapas2x1",
  "Chapas 3×2m": "chapas3x2",
  "Chapas 4 a 6m": "chapas4a6",
  "Chapas 7 a 8m": "chapas7a8",
};

const MAX_PLATE_LENGTH = 13.6;
const MAX_WEIGHT_REBOQUE = 25;

// IMPROVED: normalize plate count and reuse a valid default construction line
const normalizePositiveInt = (value: number | string) => Math.max(1, Math.floor(Number(value) || 1));
const createConstructionLine = (): ConstructionLine => ({
  id: crypto.randomUUID(),
  numPlates: 1,
  dimensionLabel: "",
  lengthMeters: 0,
  weightTon: 0,
});

interface FleetOptionResult extends FleetCostResult {
  lengthExcessive: boolean;
  weightExcessive: boolean;
}

interface ConstructionResult {
  destination: string;
  largestPlateLabel: string;
  largestPlateMeters: number;
  ccColumnUsed: string;
  custoBase: number | null;
  custo3Eixos: number | null;
  custoReboque: number | null;
  pricingMode: "base" | "3eixos" | "reboque";
  numFreights: number;
  totalMeters: number;
  custoFinal: number;
  custoKm: number | null;
  custoMetro: number | null;
  fleetOptions: FleetOptionResult[];
  impossible: boolean;
  impossibleReason: string | null;
}

function getCCEntryPrice(entry: CCPriceEntry, field: keyof CCPriceEntry): number | null {
  const val = entry[field];
  return typeof val === "number" ? val : null;
}

function calculateConstructionCost(
  destination: string,
  lines: ConstructionLine[],
  totalKm: number,
  weightTon: number,
  manualFreights: number = 1,
  extraRate: number = 0
): ConstructionResult | null {
  const entry = ccPrices.find(p =>
    p.destination.toLowerCase() === destination.toLowerCase() ||
    p.destination.toLowerCase().includes(destination.toLowerCase()) ||
    destination.toLowerCase().includes(p.destination.toLowerCase())
  );

  if (!entry) return null;

  let largestMeters = 0;
  for (const line of lines) {
    if (line.numPlates <= 0) continue;
    if (line.lengthMeters > largestMeters) {
      largestMeters = line.lengthMeters;
    }
  }

  // Map length to CC price category
  let largestLabel: string;
  if (largestMeters <= 1.05) {
    largestLabel = "Chapas 2×1.05m";
  } else if (largestMeters <= 2) {
    largestLabel = "Chapas 3×2m";
  } else if (largestMeters <= 6) {
    largestLabel = "Chapas 4 a 6m";
  } else if (largestMeters <= 8) {
    largestLabel = "Chapas 7 a 8m";
  } else {
    // > 8m → uses 3 eixos/reboque pricing, but label stays descriptive
    largestLabel = "Chapas > 8m";
  }

  const totalMeters = largestMeters;

  // Global impossible: plate exceeds absolute max or weight exceeds reboque
  if (largestMeters > MAX_PLATE_LENGTH) {
    return {
      destination, largestPlateLabel: largestLabel, largestPlateMeters: largestMeters,
      ccColumnUsed: largestLabel, custoBase: null, custo3Eixos: null, custoReboque: null,
      pricingMode: "base", numFreights: 0, totalMeters, custoFinal: 0, custoKm: null, custoMetro: null,
      fleetOptions: [], impossible: true, impossibleReason: "comprimento excedente",
    };
  }

  if (weightTon > MAX_WEIGHT_REBOQUE) {
    return {
      destination, largestPlateLabel: largestLabel, largestPlateMeters: largestMeters,
      ccColumnUsed: largestLabel, custoBase: null, custo3Eixos: null, custoReboque: null,
      pricingMode: "base", numFreights: 0, totalMeters, custoFinal: 0, custoKm: null, custoMetro: null,
      fleetOptions: [], impossible: true, impossibleReason: "peso excedente (> 25 ton)",
    };
  }

  const ccField = dimensionToCCField[largestLabel];
  const custoBase = ccField ? getCCEntryPrice(entry, ccField) : null;
  const custo3Eixos = getCCEntryPrice(entry, "threeAxle");
  const custoReboque = getCCEntryPrice(entry, "trailer");

  // Determine pricing mode based on weight
  // IMPROVED: if base price is N/D, fallback to 3 Eixos then Reboque
  let pricingMode: "base" | "3eixos" | "reboque";
  let effectiveCostPerFreight: number;

  if (weightTon > 15) {
    pricingMode = "reboque";
    effectiveCostPerFreight = custoReboque ?? custo3Eixos ?? custoBase ?? 0;
  } else if (largestMeters > 8) {
    pricingMode = "3eixos";
    effectiveCostPerFreight = custo3Eixos ?? custoReboque ?? 0;
  } else {
    // ≤ 8m → use CC column price, fallback to 3 Eixos then Reboque
    if (custoBase !== null) {
      pricingMode = "base";
      effectiveCostPerFreight = custoBase;
    } else if (custo3Eixos !== null) {
      pricingMode = "3eixos";
      effectiveCostPerFreight = custo3Eixos;
    } else if (custoReboque !== null) {
      pricingMode = "reboque";
      effectiveCostPerFreight = custoReboque;
    } else {
      pricingMode = "base";
      effectiveCostPerFreight = 0;
    }
  }

  // IMPROVED: apply extra rate to both Pombalense and fleet costs
  const factor = extraRate > 0 ? 1 + extraRate / 100 : 1;
  if (extraRate > 0) {
    effectiveCostPerFreight = effectiveCostPerFreight * factor;
  }

  const numFreights = manualFreights;
  const deliveryCost = numFreights > 0 ? numFreights * deliveryCostPerEntry : 0;
  const custoFinal = effectiveCostPerFreight + deliveryCost;

  // Fleet options: check per-vehicle length and weight
  const fleetOptions: FleetOptionResult[] = fleetVehicles.map(v => {
    const lengthExcessive = largestMeters > v.capacityMeters;
    const weightExcessive = weightTon > v.capacityTon;
    const result = calculateFleetCostByMeters(v, totalKm, totalMeters);
    result.numFreights = 1;
    result.totalCost = v.costPerKm * totalKm * factor;
    result.costPerKm2 = totalKm > 0 ? result.totalCost / totalKm : 0;
    return { ...result, lengthExcessive, weightExcessive };
  });

  return {
    destination,
    largestPlateLabel: largestLabel,
    largestPlateMeters: largestMeters,
    ccColumnUsed: pricingMode === "reboque" ? "Reboque" : pricingMode === "3eixos" ? "3 Eixos" : largestLabel,
    custoBase,
    custo3Eixos,
    custoReboque,
    pricingMode,
    numFreights,
    totalMeters,
    custoFinal,
    custoKm: totalKm > 0 ? custoFinal / totalKm : null,
    custoMetro: largestMeters > 0 ? custoFinal / largestMeters : null,
    fleetOptions,
    impossible: false,
    impossibleReason: null,
  };
}

export function ConstructionSimulator() {
  const { construction, setConstruction, savedEstimates, setSavedEstimates } = useSimulatorState();
  const { rate: extraRate } = usePombalenseExtraRate();

  // IMPROVED: read state from context instead of local useState
  const { destination, totalKm, lines, numFreightsManual, results } = construction;

  // IMPROVED: save estimate inline input state
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [estimateName, setEstimateName] = useState("");

  // IMPROVED: normalize persisted lines so plate count is always a positive integer
  useEffect(() => {
    const hasInvalidPlateCounts = lines.some(line => line.numPlates !== normalizePositiveInt(line.numPlates));
    if (!hasInvalidPlateCounts) return;

    setConstruction(prev => ({
      ...prev,
      lines: prev.lines.map(line => ({
        ...line,
        numPlates: normalizePositiveInt(line.numPlates),
      })),
    }));
  }, [lines, setConstruction]);

  const weightTon = lines.reduce((sum, l) => sum + (l.weightTon || 0), 0);
  const largestPlateMeters = Math.max(...lines.filter(l => l.numPlates > 0).map(l => l.lengthMeters), 0);
  const totalMeters = largestPlateMeters;

  // IMPROVED: helper to update context
  const update = (partial: Partial<typeof construction>) => {
    setConstruction(prev => ({ ...prev, ...partial }));
  };

  // IMPROVED: normalize line data before storing it in context
  const setLines = (value: ConstructionLine[] | ((prev: ConstructionLine[]) => ConstructionLine[])) => {
    setConstruction(prev => {
      const nextLines = typeof value === "function" ? value(prev.lines) : value;
      return {
        ...prev,
        lines: nextLines.map(line => ({
          ...line,
          numPlates: normalizePositiveInt(line.numPlates),
        })),
      };
    });
  };
  const setResults = (r: typeof results) => update({ results: r });

  // IMPROVED: new rows always start with one plate
  const addLine = () => {
    setLines(prev => [...prev, createConstructionLine()]);
  };

  const removeLine = (id: string) => {
    if (lines.length > 1) setLines(prev => prev.filter(l => l.id !== id));
  };

  const updateDimension = (id: string, label: string) => {
    const dim = dimensionTypes.find(d => d.label === label);
    setLines(prev => prev.map(l =>
      l.id === id ? { ...l, dimensionLabel: label, lengthMeters: dim?.meters ?? 6 } : l
    ));
  };

  // IMPROVED: plate count accepts only positive integers
  const updatePlates = (id: string, value: string) => {
    const numPlates = normalizePositiveInt(value);
    setLines(prev => prev.map(l => (l.id === id ? { ...l, numPlates } : l)));
  };

  const updateWeight = (id: string, weight: number) => {
    setLines(prev => prev.map(l => (l.id === id ? { ...l, weightTon: weight } : l)));
  };

  const updateLength = (id: string, length: number) => {
    setLines(prev => prev.map(l => (l.id === id ? { ...l, lengthMeters: length } : l)));
  };

  // IMPROVED: clear all fields and reset context with one plate by default
  const handleClear = () => {
    setConstruction({ ...defaultConstruction, lines: [createConstructionLine()] });
    setShowSaveInput(false);
    setEstimateName("");
  };

  const simulate = () => {
    if (!destination) return;
    const result = calculateConstructionCost(destination, lines, totalKm, weightTon, numFreightsManual, extraRate);
    setResults(result);
  };

  // IMPROVED: save estimate to context
  const handleSaveEstimate = () => {
    if (!estimateName.trim() || !results) return;
    const validFleet = results.fleetOptions.filter((o: any) => !o.lengthExcessive && !o.weightExcessive);
    const cheapestOpt = findCheapest(results.custoFinal, validFleet);
    const bestFleet = validFleet.sort((a: any, b: any) => a.totalCost - b.totalCost)[0];
    // IMPROVED: include saved_by from session
    const estimate: SavedEstimate = {
      id: crypto.randomUUID(),
      name: estimateName.trim(),
      savedAt: new Date().toISOString(),
      savedBy: sessionStorage.getItem("agi-user-name") ?? "Anónimo",
      type: "construction",
      origin: "Espinho",
      destination,
      totalKm,
      weightTon,
      totalMeters: results.totalMeters,
      largestPlateLabel: results.largestPlateLabel,
      numFreights: results.numFreights,
      constructionPombalenseCost: results.custoFinal,
      pombalenseTotalCost: results.custoFinal,
      bestFleetOption: bestFleet?.vehicleName,
      bestFleetCost: bestFleet?.totalCost,
      // IMPROVED: individual fleet costs for archive columns
      fleet6tCost: results.fleetOptions.find((o: any) => o.vehicleName?.includes("6"))?.totalCost,
      fleet9tCost: results.fleetOptions.find((o: any) => o.vehicleName?.includes("9"))?.totalCost,
      fleet15tCost: results.fleetOptions.find((o: any) => o.vehicleName?.includes("15"))?.totalCost,
      cheapestOption: cheapestOpt,
      extraRateApplied: extraRate,
    };
    setSavedEstimates(prev => [...prev, estimate]);
    setShowSaveInput(false);
    setEstimateName("");
  };

  const validFleetOptions = results && !results.impossible
    ? results.fleetOptions.filter((o: any) => !o.lengthExcessive && !o.weightExcessive)
    : [];

  const cheapest = results && !results.impossible
    ? findCheapest(results.custoFinal, validFleetOptions)
    : null;

  const chartData = results && !results.impossible
    ? [
        { name: "Pombalense", custo: Math.round(results.custoFinal * 100) / 100 },
        ...validFleetOptions.map((o: any) => ({
          name: o.vehicleName,
          custo: Math.round(o.totalCost * 100) / 100,
        })),
      ]
    : [];

  return (
    <div className="space-y-4">
      {/* Combined inputs card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Dados do Transporte</CardTitle>
            {/* IMPROVED: clear button to reset all fields */}
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleClear}>
              <RotateCcw className="h-3 w-3 mr-1" /> Limpar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1">
                Origem <Lock className="h-3 w-3 text-muted-foreground" />
              </Label>
              <Input className="h-9" value="Espinho" disabled />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Destino</Label>
              <Select value={destination} onValueChange={(val) => {
                const estimated = getConstructionRoundTripKm(val);
                update({ destination: val, totalKm: estimated !== null ? estimated : totalKm });
              }}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Selecionar destino" /></SelectTrigger>
                <SelectContent>
                  {ccDestinations.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Km Totais (ida + volta)</Label>
              <Input className="h-9" type="number" value={totalKm || ""} onChange={e => update({ totalKm: Number(e.target.value) })} placeholder="Ex: 360" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nº de Deslocações</Label>
              <Input className="h-9" type="number" value={numFreightsManual} onChange={e => update({ numFreightsManual: Math.max(0, Number(e.target.value)) })} placeholder="0" min={0} />
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3 shrink-0" /> 25 €/deslocação (Pombalense)
              </p>
            </div>
          </div>

          {/* Plates inline */}
          <div className="border-t pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Placas / Chapas</span>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={addLine}>
                <Plus className="h-3 w-3 mr-1" /> Adicionar
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs py-1">Nº Placas</TableHead>
                  <TableHead className="text-xs py-1">Comp. (m)</TableHead>
                  <TableHead className="text-xs py-1">Peso Total (ton)</TableHead>
                  <TableHead className="w-10 py-1"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map(line => (
                  <TableRow key={line.id}>
                    <TableCell className="py-1">
                      {/* IMPROVED: number of plates accepts only positive integers */}
                      <Input className="h-8" type="number" min={1} step={1} value={normalizePositiveInt(line.numPlates)} onChange={e => updatePlates(line.id, e.target.value)} placeholder="1" />
                    </TableCell>
                    <TableCell className="py-1">
                      <Input className="h-8" type="number" value={line.lengthMeters || ""} onChange={e => updateLength(line.id, Number(e.target.value))} placeholder="0.0" step="0.1" />
                    </TableCell>
                    <TableCell className="py-1">
                      <Input className="h-8" type="number" value={line.weightTon || ""} onChange={e => updateWeight(line.id, Number(e.target.value))} placeholder="0.0" step="0.1" />
                    </TableCell>
                    <TableCell className="py-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeLine(line.id)} disabled={lines.length === 1}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Placa Maior: <span className="font-bold text-foreground">{totalMeters.toFixed(1)} m</span>
                <span className="ml-3">Peso Total: <span className="font-bold text-foreground">{weightTon.toFixed(1)} ton</span></span>
              </p>
              <Button size="sm" onClick={simulate} disabled={!destination}>
                Simular Custos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {results && results.impossible && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Viagem impossível</AlertTitle>
          <AlertDescription>
            Motivo: <span className="font-bold">{results.impossibleReason}</span>
            {results.impossibleReason === "comprimento excedente" && (
              <span className="block mt-1 text-xs">
                Placa maior ({results.largestPlateMeters}m) excede limite máximo ({MAX_PLATE_LENGTH}m).
              </span>
            )}
            {results.impossibleReason?.includes("peso") && (
              <span className="block mt-1 text-xs">
                Peso ({weightTon} ton) excede limite máximo ({MAX_WEIGHT_REBOQUE} ton).
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {results && !results.impossible && (
        <>
          {/* IMPROVED: save estimate button + inline input */}
          <div className="flex items-center gap-2 px-1">
            {!showSaveInput ? (
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowSaveInput(true)}>
                <Save className="h-3 w-3 mr-1" /> Guardar Estimativa
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  className="h-7 text-xs w-48"
                  value={estimateName}
                  onChange={(e) => setEstimateName(e.target.value)}
                  placeholder="Nome da estimativa"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleSaveEstimate()}
                />
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSaveEstimate} disabled={!estimateName.trim()}>
                  <Check className="h-3 w-3 text-green-600" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setShowSaveInput(false); setEstimateName(""); }}>
                  <X className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            )}
          </div>

          {/* Pombalense detail + comparison side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Subcontratação (Pombalense)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="p-2 bg-muted/50 rounded-md">
                    <p className="text-[10px] text-muted-foreground">Placa Maior</p>
                    <p className="text-xs font-semibold">{results.totalMeters.toFixed(1)} m</p>
                  </div>
                  <div className="p-2 bg-muted/50 rounded-md">
                    <p className="text-[10px] text-muted-foreground">Coluna CC</p>
                    <p className="text-xs font-semibold">{results.ccColumnUsed}</p>
                  </div>
                  <div className="p-2 bg-muted/50 rounded-md">
                    <p className="text-[10px] text-muted-foreground">Peso Total</p>
                    <p className="text-xs font-semibold">{weightTon.toFixed(1)} ton</p>
                  </div>
                  <div className="p-2 bg-muted/50 rounded-md">
                    <p className="text-[10px] text-muted-foreground">Deslocações</p>
                    <p className="text-xs font-semibold">{results.numFreights}</p>
                  </div>
                </div>

                <div className="p-3 border rounded-md space-y-1.5 text-xs">
                  <p className="font-medium">Preços CC — {results.destination}</p>
                  <div className="flex justify-between">
                    <span>Base ({results.ccColumnUsed})</span>
                    <span className={`font-medium ${results.pricingMode === "base" ? "text-primary font-bold" : ""}`}>
                      {results.custoBase !== null ? `${results.custoBase.toFixed(2)} €` : "N/D"}
                      {results.pricingMode === "base" && " ✓"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>3 Eixos (≤ 15 ton)</span>
                    <span className={`font-medium ${results.pricingMode === "3eixos" ? "text-primary font-bold" : ""}`}>
                      {results.custo3Eixos !== null ? `${results.custo3Eixos.toFixed(2)} €` : "N/D"}
                      {results.pricingMode === "3eixos" && " ✓"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reboque (15–25 ton)</span>
                    <span className={`font-medium ${results.pricingMode === "reboque" ? "text-primary font-bold" : ""}`}>
                      {results.custoReboque !== null ? `${results.custoReboque.toFixed(2)} €` : "N/D"}
                      {results.pricingMode === "reboque" && " ✓"}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-1.5 text-sm">
                    <span>Custo Total</span>
                    <span>
                      {results.custoFinal.toFixed(2)} €
                      {extraRate > 0 && (
                        <span className="ml-1 text-[10px] font-normal bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 px-1.5 py-0.5 rounded-full">
                          +{extraRate}%
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex gap-4 text-[10px] text-muted-foreground">
                    <span>€/km: {results.custoKm !== null ? results.custoKm.toFixed(2) : "—"}</span>
                    <span>€/m: {results.custoMetro !== null ? results.custoMetro.toFixed(2) : "—"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Comparação: Sub. vs Frota</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Opção</TableHead>
                      <TableHead className="text-xs text-right">Desloc.</TableHead>
                      <TableHead className="text-xs text-right">Custo Total</TableHead>
                      <TableHead className="text-xs text-right">€/km</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className={cheapest === "Pombalense" ? "bg-green-50 dark:bg-green-950/30" : ""}>
                      <TableCell className="font-medium text-xs py-2">
                        Pombalense
                        {cheapest === "Pombalense" && (
                          <span className="ml-1 text-[10px] bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-1.5 py-0.5 rounded-full">
                            Mais económico
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-xs py-2">{results.numFreights}</TableCell>
                      <TableCell className="text-right font-bold text-xs py-2">{results.custoFinal.toFixed(2)} €</TableCell>
                      <TableCell className="text-right text-xs py-2">{results.custoKm !== null ? results.custoKm.toFixed(2) : "—"}</TableCell>
                    </TableRow>
                    {results.fleetOptions.map((opt: any) => {
                      const isExcessive = opt.lengthExcessive || opt.weightExcessive;
                      const badges: string[] = [];
                      if (opt.lengthExcessive) badges.push("Comprimento excessivo");
                      if (opt.weightExcessive) badges.push("Peso excessivo");
                      return (
                        <TableRow
                          key={opt.vehicleName}
                          className={isExcessive ? "bg-destructive/10" : cheapest === opt.vehicleName ? "bg-green-50 dark:bg-green-950/30" : ""}
                        >
                          <TableCell className="font-medium text-xs py-2">
                            {opt.vehicleName}
                            {badges.map((b: string) => (
                              <span key={b} className="ml-1 text-[10px] bg-destructive/20 text-destructive px-1.5 py-0.5 rounded-full">
                                {b}
                              </span>
                            ))}
                            {!isExcessive && cheapest === opt.vehicleName && (
                              <span className="ml-1 text-[10px] bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-1.5 py-0.5 rounded-full">
                                Mais económico
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-xs py-2">{isExcessive ? "—" : opt.numFreights}</TableCell>
                          <TableCell className="text-right font-bold text-xs py-2">{isExcessive ? "—" : `${opt.totalCost.toFixed(2)} €`}</TableCell>
                          <TableCell className="text-right text-xs py-2">{isExcessive ? "—" : (opt.costPerKm2?.toFixed(2) ?? "—")}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <CostComparisonChart data={chartData} title="Comparação de Custos — Construção" />
        </>
      )}
    </div>
  );
}
