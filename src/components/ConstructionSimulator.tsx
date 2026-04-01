import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, TrendingDown, Lock, AlertTriangle, Info } from "lucide-react";
import { ccPrices, dimensionTypes, fleetVehicles, type CCPriceEntry } from "@/data/fleetData";
import { calculateFleetCostByMeters, findCheapest, type FleetCostResult } from "@/utils/costCalculations";
import { CostComparisonChart } from "./CostComparisonChart";
import type { ConstructionLine } from "@/utils/costCalculations";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { usePombalenseExtraRate } from "@/hooks/usePombalenseExtraRate";
import { getConstructionRoundTripKm } from "@/data/distanceData";

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

const MAX_VEHICLE_LENGTH_METERS = 13.6;
const MAX_VEHICLE_WEIGHT_TON = 15;

interface ConstructionResult {
  destination: string;
  largestPlateLabel: string;
  largestPlateMeters: number;
  custoBase: number | null;
  custo3Eixos: number | null;
  custoReboque: number | null;
  isExcessive: boolean;
  numFreights: number;
  totalMeters: number;
  custoFinal: number;
  custoKm: number | null;
  custoMetro: number | null;
  fleetOptions: FleetCostResult[];
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
  let largestLabel = dimensionOrder[0].label;

  for (const line of lines) {
    if (line.numPlates <= 0) continue;
    const dim = dimensionOrder.find(d => d.label === line.dimensionLabel);
    if (dim && dim.meters > largestMeters) {
      largestMeters = dim.meters;
      largestLabel = dim.label;
    }
  }

  const totalMeters = largestMeters;

  if (largestMeters > MAX_VEHICLE_LENGTH_METERS) {
    return {
      destination, largestPlateLabel: largestLabel, largestPlateMeters: largestMeters,
      custoBase: null, custo3Eixos: null, custoReboque: null, isExcessive: false,
      numFreights: 0, totalMeters, custoFinal: 0, custoKm: null, custoMetro: null,
      fleetOptions: [], impossible: true, impossibleReason: "comprimento excedente",
    };
  }

  if (weightTon > MAX_VEHICLE_WEIGHT_TON) {
    return {
      destination, largestPlateLabel: largestLabel, largestPlateMeters: largestMeters,
      custoBase: null, custo3Eixos: null, custoReboque: null, isExcessive: false,
      numFreights: 0, totalMeters, custoFinal: 0, custoKm: null, custoMetro: null,
      fleetOptions: [], impossible: true, impossibleReason: "peso excedente",
    };
  }

  const ccField = dimensionToCCField[largestLabel];
  let custoBase = ccField ? getCCEntryPrice(entry, ccField) : null;

  const isExcessive = largestLabel === "Chapas 7 a 8m";
  const custo3Eixos = getCCEntryPrice(entry, "threeAxle");
  const custoReboque = getCCEntryPrice(entry, "trailer");

  let effectiveCostPerFreight: number;
  if (isExcessive && custo3Eixos !== null) {
    effectiveCostPerFreight = custo3Eixos;
  } else if (custoBase !== null) {
    effectiveCostPerFreight = custoBase;
  } else if (custo3Eixos !== null) {
    effectiveCostPerFreight = custo3Eixos;
  } else {
    effectiveCostPerFreight = 0;
  }

  if (extraRate > 0) {
    effectiveCostPerFreight = effectiveCostPerFreight * (1 + extraRate / 100);
  }

  const numFreights = manualFreights;
  const custoFinal = effectiveCostPerFreight * numFreights;

  const fleetOptions = fleetVehicles.map(v => {
    const result = calculateFleetCostByMeters(v, totalKm, totalMeters);
    result.numFreights = manualFreights;
    result.totalCost = v.costPerKm * totalKm * manualFreights;
    result.costPerKm2 = totalKm > 0 ? result.totalCost / totalKm : 0;
    return result;
  });

  return {
    destination,
    largestPlateLabel: largestLabel,
    largestPlateMeters: largestMeters,
    custoBase,
    custo3Eixos: isExcessive ? custo3Eixos : null,
    custoReboque: isExcessive ? custoReboque : null,
    isExcessive,
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
  const [destination, setDestination] = useState("");
  const [totalKm, setTotalKm] = useState<number>(0);
  const [weightTon, setWeightTon] = useState<number>(0);
  const [lines, setLines] = useState<ConstructionLine[]>([
    { id: crypto.randomUUID(), numPlates: 0, dimensionLabel: "Chapas 4 a 6m", lengthMeters: 6 },
  ]);
  const [numFreightsManual, setNumFreightsManual] = useState<number>(0);
  const [results, setResults] = useState<ConstructionResult | null>(null);
  const { rate: extraRate } = usePombalenseExtraRate();

  const largestPlateMeters = Math.max(...lines.filter(l => l.numPlates > 0).map(l => l.lengthMeters), 0);
  const totalMeters = largestPlateMeters;

  const addLine = () => {
    setLines([...lines, { id: crypto.randomUUID(), numPlates: 0, dimensionLabel: "Chapas 4 a 6m", lengthMeters: 6 }]);
  };

  const removeLine = (id: string) => {
    if (lines.length > 1) setLines(lines.filter(l => l.id !== id));
  };

  const updateDimension = (id: string, label: string) => {
    const dim = dimensionTypes.find(d => d.label === label);
    setLines(lines.map(l =>
      l.id === id ? { ...l, dimensionLabel: label, lengthMeters: dim?.meters ?? 6 } : l
    ));
  };

  const updatePlates = (id: string, num: number) => {
    setLines(lines.map(l => (l.id === id ? { ...l, numPlates: num } : l)));
  };

  const simulate = () => {
    if (!destination) return;
    const result = calculateConstructionCost(destination, lines, totalKm, weightTon, Math.max(1, numFreightsManual), extraRate);
    setResults(result);
  };

  const cheapest = results && !results.impossible
    ? findCheapest(results.custoFinal, results.fleetOptions)
    : null;

  const chartData = results && !results.impossible
    ? [
        { name: "Pombalense", custo: Math.round(results.custoFinal * 100) / 100 },
        ...results.fleetOptions.map(o => ({
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
          <CardTitle className="text-lg">Dados do Transporte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1">
                Origem <Lock className="h-3 w-3 text-muted-foreground" />
              </Label>
              <Input className="h-9" value="Espinho" disabled />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Destino</Label>
              <Select value={destination} onValueChange={(val) => {
                setDestination(val);
                const estimated = getConstructionRoundTripKm(val);
                if (estimated !== null) setTotalKm(estimated);
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
              <Input className="h-9" type="number" value={totalKm || ""} onChange={e => setTotalKm(Number(e.target.value))} placeholder="Ex: 360" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Peso Total (ton)</Label>
              <Input className="h-9" type="number" value={weightTon || ""} onChange={e => setWeightTon(Number(e.target.value))} placeholder="Ex: 5" step="0.1" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nº de Deslocações</Label>
              <Input className="h-9" type="number" value={numFreightsManual} onChange={e => setNumFreightsManual(Math.max(0, Number(e.target.value)))} placeholder="0" min={0} />
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
                  <TableHead className="text-xs py-1">Tipo / Comprimento</TableHead>
                  <TableHead className="text-xs py-1">Comp. (m)</TableHead>
                  <TableHead className="w-10 py-1"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map(line => (
                  <TableRow key={line.id}>
                    <TableCell className="py-1">
                      <Input className="h-8" type="number" value={line.numPlates || ""} onChange={e => updatePlates(line.id, Number(e.target.value))} placeholder="0" />
                    </TableCell>
                    <TableCell className="py-1">
                      <Select value={line.dimensionLabel} onValueChange={v => updateDimension(line.id, v)}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {dimensionTypes.map(d => (
                            <SelectItem key={d.label} value={d.label}>{d.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground py-1">{line.lengthMeters} m</TableCell>
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
                Placa maior ({results.largestPlateMeters}m) excede capacidade ({MAX_VEHICLE_LENGTH_METERS}m).
              </span>
            )}
            {results.impossibleReason === "peso excedente" && (
              <span className="block mt-1 text-xs">
                Peso ({weightTon} ton) excede capacidade ({MAX_VEHICLE_WEIGHT_TON} ton).
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {results && !results.impossible && (
        <>
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
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 bg-muted/50 rounded-md">
                    <p className="text-[10px] text-muted-foreground">Placa Maior</p>
                    <p className="text-xs font-semibold">{results.largestPlateLabel}</p>
                  </div>
                  <div className="p-2 bg-muted/50 rounded-md">
                    <p className="text-[10px] text-muted-foreground">Comp.</p>
                    <p className="text-xs font-semibold">{results.totalMeters.toFixed(1)} m</p>
                  </div>
                  <div className="p-2 bg-muted/50 rounded-md">
                    <p className="text-[10px] text-muted-foreground">Deslocações</p>
                    <p className="text-xs font-semibold">{results.numFreights}</p>
                  </div>
                </div>

                <div className="p-3 border rounded-md space-y-1.5 text-xs">
                  <p className="font-medium">Preços CC — {results.destination}</p>
                  <div className="flex justify-between">
                    <span>Base ({results.largestPlateLabel})</span>
                    <span className="font-medium">{results.custoBase !== null ? `${results.custoBase.toFixed(2)} €` : "N/D"}</span>
                  </div>
                  {results.isExcessive && (
                    <>
                      <div className="flex justify-between border-t pt-1">
                        <span className="text-primary font-medium">3 Eixos (aplicado)</span>
                        <span className="font-bold text-primary">{results.custo3Eixos !== null ? `${results.custo3Eixos.toFixed(2)} €` : "N/D"}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Reboque (ref.)</span>
                        <span>{results.custoReboque !== null ? `${results.custoReboque.toFixed(2)} €` : "N/D"}</span>
                      </div>
                    </>
                  )}
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
                    {results.fleetOptions.map(opt => {
                      const isWeightExcessive = weightTon > opt.capacityTon;
                      return (
                        <TableRow
                          key={opt.vehicleName}
                          className={isWeightExcessive ? "bg-destructive/10" : cheapest === opt.vehicleName ? "bg-green-50 dark:bg-green-950/30" : ""}
                        >
                          <TableCell className="font-medium text-xs py-2">
                            {opt.vehicleName}
                            {isWeightExcessive && (
                              <span className="ml-1 text-[10px] bg-destructive/20 text-destructive px-1.5 py-0.5 rounded-full">
                                Peso excessivo
                              </span>
                            )}
                            {!isWeightExcessive && cheapest === opt.vehicleName && (
                              <span className="ml-1 text-[10px] bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-1.5 py-0.5 rounded-full">
                                Mais económico
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-xs py-2">{isWeightExcessive ? "—" : opt.numFreights}</TableCell>
                          <TableCell className="text-right font-bold text-xs py-2">{isWeightExcessive ? "—" : `${opt.totalCost.toFixed(2)} €`}</TableCell>
                          <TableCell className="text-right text-xs py-2">{isWeightExcessive ? "—" : (opt.costPerKm2?.toFixed(2) ?? "—")}</TableCell>
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
