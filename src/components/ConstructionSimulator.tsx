import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, TrendingDown } from "lucide-react";
import { origins, dimensionTypes, ccPrices } from "@/data/fleetData";
import { fleetVehicles } from "@/data/fleetData";
import {
  calculateFleetCostByMeters,
  calculateConstructionPombalense,
  findCheapest,
  type ConstructionLine,
  type FleetCostResult,
  type ConstructionPombalenseResult,
} from "@/utils/costCalculations";
import { CostComparisonChart } from "./CostComparisonChart";

// Get unique CC destinations for the select
const ccDestinations = ccPrices.map(p => p.destination).sort();

export function ConstructionSimulator() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [totalKm, setTotalKm] = useState<number>(0);
  const [lines, setLines] = useState<ConstructionLine[]>([
    { id: crypto.randomUUID(), numPlates: 0, dimensionLabel: "Chapas 4 a 6m", lengthMeters: 6 },
  ]);

  const [results, setResults] = useState<{
    pombalense: ConstructionPombalenseResult;
    fleetOptions: FleetCostResult[];
  } | null>(null);

  const totalMeters = lines.reduce((sum, l) => sum + l.lengthMeters * l.numPlates, 0);

  const addLine = () => {
    setLines([...lines, { id: crypto.randomUUID(), numPlates: 0, dimensionLabel: "Chapas 4 a 6m", lengthMeters: 6 }]);
  };

  const removeLine = (id: string) => {
    if (lines.length > 1) setLines(lines.filter((l) => l.id !== id));
  };

  const updateDimension = (id: string, label: string) => {
    const dim = dimensionTypes.find((d) => d.label === label);
    setLines(
      lines.map((l) =>
        l.id === id ? { ...l, dimensionLabel: label, lengthMeters: dim?.meters ?? 6 } : l
      )
    );
  };

  const updatePlates = (id: string, num: number) => {
    setLines(lines.map((l) => (l.id === id ? { ...l, numPlates: num } : l)));
  };

  const simulate = () => {
    if (!destination) return;
    const numDeliveries = lines.reduce((sum, l) => sum + l.numPlates, 0);
    const pombalense = calculateConstructionPombalense(destination, lines, Math.ceil(numDeliveries / 10));
    const fleetOptions = fleetVehicles.map((v) =>
      calculateFleetCostByMeters(v, totalKm, totalMeters)
    );
    setResults({ pombalense, fleetOptions });
  };

  const cheapest = results
    ? findCheapest(results.pombalense.totalCost, results.fleetOptions)
    : null;

  const chartData = results
    ? [
        { name: "Pombalense", custo: Math.round(results.pombalense.totalCost * 100) / 100 },
        ...results.fleetOptions.map((o) => ({
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Origem</Label>
              <Select value={origin} onValueChange={setOrigin}>
                <SelectTrigger><SelectValue placeholder="Selecionar origem" /></SelectTrigger>
                <SelectContent>
                  {origins.map((o) => (
                    <SelectItem key={o.id} value={o.name}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Destino</Label>
              <Select value={destination} onValueChange={setDestination}>
                <SelectTrigger><SelectValue placeholder="Selecionar destino" /></SelectTrigger>
                <SelectContent>
                  {ccDestinations.map((d) => (
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
                onChange={(e) => setTotalKm(Number(e.target.value))}
                placeholder="Ex: 360"
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
              {lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>
                    <Input
                      type="number"
                      value={line.numPlates || ""}
                      onChange={(e) => updatePlates(line.id, Number(e.target.value))}
                      placeholder="0"
                    />
                  </TableCell>
                  <TableCell>
                    <Select value={line.dimensionLabel} onValueChange={(v) => updateDimension(line.id, v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {dimensionTypes.map((d) => (
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

      {results && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                Resultados da Simulação
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results.pombalense.prices.length > 0 && (
                <div className="mb-4 p-3 bg-muted/50 rounded-md text-sm space-y-1">
                  <p className="font-medium">Preços CC Pombalense ({destination}):</p>
                  {results.pombalense.prices.map((p, i) => (
                    <div key={i} className="flex justify-between">
                      <span>{p.label}</span>
                      <span className="font-medium">{p.cost !== null ? `${p.cost.toFixed(2)} €` : "N/D"}</span>
                    </div>
                  ))}
                  {results.pombalense.deliveryCost > 0 && (
                    <div className="flex justify-between border-t pt-1 mt-1">
                      <span>Entregas internas</span>
                      <span className="font-medium">{results.pombalense.deliveryCost.toFixed(2)} €</span>
                    </div>
                  )}
                </div>
              )}
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
                    <TableCell className="text-right">1</TableCell>
                    <TableCell className="text-right font-bold">{results.pombalense.totalCost.toFixed(2)} €</TableCell>
                    <TableCell className="text-right">{totalKm > 0 ? (results.pombalense.totalCost / totalKm).toFixed(2) : "-"}</TableCell>
                  </TableRow>
                  {results.fleetOptions.map((opt) => (
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
                      <TableCell className="text-right">{opt.costPerKm2?.toFixed(2) ?? "-"}</TableCell>
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
