import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, TrendingDown, Lock, AlertTriangle } from "lucide-react";
import { ccPrices, dimensionTypes, fleetVehicles, type CCPriceEntry } from "@/data/fleetData";
import { calculateFleetCostByMeters, findCheapest, type FleetCostResult } from "@/utils/costCalculations";
import { CostComparisonChart } from "./CostComparisonChart";
import type { ConstructionLine } from "@/utils/costCalculations";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Only destinations from CC table
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

// Vehicle capacity limits for feasibility checks
const MAX_VEHICLE_LENGTH_METERS = 13.6; // trailer max
const MAX_VEHICLE_WEIGHT_TON = 15; // largest fleet vehicle

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
  weightTon: number
): ConstructionResult | null {
  const entry = ccPrices.find(p =>
    p.destination.toLowerCase() === destination.toLowerCase() ||
    p.destination.toLowerCase().includes(destination.toLowerCase()) ||
    destination.toLowerCase().includes(p.destination.toLowerCase())
  );

  if (!entry) return null;

  // Find the largest plate dimension
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

  const totalMeters = lines.reduce((sum, l) => sum + l.lengthMeters * l.numPlates, 0);

  // Feasibility check
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

  // Get cost based on largest plate
  const ccField = dimensionToCCField[largestLabel];
  const custoBase = ccField ? getCCEntryPrice(entry, ccField) : null;

  // Excessive = chapas 7-8m
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

  // Freights based on total meters / vehicle capacity
  const vehicleCapacityMeters = isExcessive ? 13.6 : 12;
  const numFreights = totalMeters > 0 ? Math.ceil(totalMeters / vehicleCapacityMeters) : 1;

  const custoFinal = effectiveCostPerFreight * numFreights;

  const fleetOptions = fleetVehicles.map(v =>
    calculateFleetCostByMeters(v, totalKm, totalMeters)
  );

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
  const [numFreightsManual, setNumFreightsManual] = useState<number>(1);
  const [results, setResults] = useState<ConstructionResult | null>(null);

  const totalMeters = lines.reduce((sum, l) => sum + l.lengthMeters * l.numPlates, 0);

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
    const result = calculateConstructionCost(destination, lines, totalKm, weightTon);
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dados do Transporte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                Origem <Lock className="h-3 w-3 text-muted-foreground" />
              </Label>
              <Input value="Espinho" disabled className="bg-muted font-medium" />
            </div>
            <div className="space-y-2">
              <Label>Destino</Label>
              <Select value={destination} onValueChange={setDestination}>
                <SelectTrigger><SelectValue placeholder="Selecionar destino" /></SelectTrigger>
                <SelectContent>
                  {ccDestinations.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Km Totais (ida)</Label>
              <Input
                type="number"
                value={totalKm || ""}
                onChange={e => setTotalKm(Number(e.target.value))}
                placeholder="Ex: 360"
              />
            </div>
            <div className="space-y-2">
              <Label>Peso Total (ton)</Label>
              <Input
                type="number"
                value={weightTon || ""}
                onChange={e => setWeightTon(Number(e.target.value))}
                placeholder="Ex: 5"
                step="0.1"
              />
            </div>
            <div className="space-y-2">
              <Label>Nº de Fretes</Label>
              <Input
                type="number"
                value={numFreightsManual || ""}
                onChange={e => setNumFreightsManual(Math.max(1, Number(e.target.value)))}
                placeholder="1"
                min={1}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Placas / Chapas</CardTitle>
          <Button size="sm" variant="outline" onClick={addLine}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Placas</TableHead>
                <TableHead>Tipo / Comprimento</TableHead>
                <TableHead>Comprimento (m)</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map(line => (
                <TableRow key={line.id}>
                  <TableCell>
                    <Input
                      type="number"
                      value={line.numPlates || ""}
                      onChange={e => updatePlates(line.id, Number(e.target.value))}
                      placeholder="0"
                    />
                  </TableCell>
                  <TableCell>
                    <Select value={line.dimensionLabel} onValueChange={v => updateDimension(line.id, v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {dimensionTypes.map(d => (
                          <SelectItem key={d.label} value={d.label}>{d.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{line.lengthMeters} m</TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" onClick={() => removeLine(line.id)} disabled={lines.length === 1}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Comprimento Total: <span className="font-bold text-foreground">{totalMeters.toFixed(1)} m</span>
            </p>
            <Button onClick={simulate} disabled={!destination}>
              Simular Custos
            </Button>
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
              <span className="block mt-1 text-sm">
                A placa maior ({results.largestPlateMeters}m) excede a capacidade máxima do veículo ({MAX_VEHICLE_LENGTH_METERS}m).
              </span>
            )}
            {results.impossibleReason === "peso excedente" && (
              <span className="block mt-1 text-sm">
                O peso total ({weightTon} ton) excede a capacidade máxima do veículo ({MAX_VEHICLE_WEIGHT_TON} ton).
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {results && !results.impossible && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                Resultados — Subcontratação (Pombalense)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="p-3 bg-muted/50 rounded-md">
                  <p className="text-xs text-muted-foreground">Origem</p>
                  <p className="font-semibold">Espinho</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-md">
                  <p className="text-xs text-muted-foreground">Destino</p>
                  <p className="font-semibold">{results.destination}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-md">
                  <p className="text-xs text-muted-foreground">Placa Maior</p>
                  <p className="font-semibold">{results.largestPlateLabel} ({results.largestPlateMeters}m)</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-md">
                  <p className="text-xs text-muted-foreground">Total Metros</p>
                  <p className="font-semibold">{results.totalMeters.toFixed(1)} m</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-md">
                  <p className="text-xs text-muted-foreground">Nº de Fretes</p>
                  <p className="font-semibold">{results.numFreights}</p>
                </div>
              </div>

              <div className="p-4 border rounded-md space-y-2">
                <p className="font-medium text-sm">Detalhe de Preços CC — {results.destination}</p>
                
                <div className="flex justify-between text-sm">
                  <span>Custo Base ({results.largestPlateLabel})</span>
                  <span className="font-medium">
                    {results.custoBase !== null ? `${results.custoBase.toFixed(2)} €` : "N/D"}
                  </span>
                </div>

                {results.isExcessive && (
                  <>
                    <div className="flex justify-between text-sm border-t pt-1">
                      <span className="text-primary font-medium">Custo 3 Eixos (aplicado)</span>
                      <span className="font-bold text-primary">
                        {results.custo3Eixos !== null ? `${results.custo3Eixos.toFixed(2)} €` : "N/D"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Custo Reboque (referência)</span>
                      <span>{results.custoReboque !== null ? `${results.custoReboque.toFixed(2)} €` : "N/D"}</span>
                    </div>
                  </>
                )}

                <div className="flex justify-between text-sm border-t pt-1">
                  <span>Nº de Fretes</span>
                  <span className="font-medium">{results.numFreights}</span>
                </div>

                <div className="flex justify-between text-sm font-bold border-t pt-2 text-lg">
                  <span>Custo Total Final</span>
                  <span>{results.custoFinal.toFixed(2)} €</span>
                </div>

                <div className="flex gap-6 text-xs text-muted-foreground pt-1">
                  <span>€/km: {results.custoKm !== null ? results.custoKm.toFixed(2) : "—"}</span>
                  <span>€/metro (placa maior): {results.custoMetro !== null ? results.custoMetro.toFixed(2) : "—"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Comparação: Subcontratação vs Frota Própria</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Opção</TableHead>
                    <TableHead className="text-right">Nº Fretes</TableHead>
                    <TableHead className="text-right">Custo Total (€)</TableHead>
                    <TableHead className="text-right">€/km</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className={cheapest === "Pombalense" ? "bg-green-50 dark:bg-green-950/30" : ""}>
                    <TableCell className="font-medium">
                      Pombalense (Subcontratação)
                      {cheapest === "Pombalense" && (
                        <span className="ml-2 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-0.5 rounded-full">
                          Mais económico
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{results.numFreights}</TableCell>
                    <TableCell className="text-right font-bold">{results.custoFinal.toFixed(2)} €</TableCell>
                    <TableCell className="text-right">{results.custoKm !== null ? results.custoKm.toFixed(2) : "—"}</TableCell>
                  </TableRow>
                  {results.fleetOptions.map(opt => (
                    <TableRow
                      key={opt.vehicleName}
                      className={cheapest === opt.vehicleName ? "bg-green-50 dark:bg-green-950/30" : ""}
                    >
                      <TableCell className="font-medium">
                        {opt.vehicleName}
                        {cheapest === opt.vehicleName && (
                          <span className="ml-2 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-0.5 rounded-full">
                            Mais económico
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{opt.numFreights}</TableCell>
                      <TableCell className="text-right font-bold">{opt.totalCost.toFixed(2)} €</TableCell>
                      <TableCell className="text-right">{opt.costPerKm2?.toFixed(2) ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <CostComparisonChart data={chartData} title="Comparação de Custos — Construção" />
        </>
      )}
    </div>
  );
}
