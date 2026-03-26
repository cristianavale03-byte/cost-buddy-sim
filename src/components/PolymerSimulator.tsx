import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, TrendingDown } from "lucide-react";
import { locations, origins } from "@/data/fleetData";
import { fleetVehicles } from "@/data/fleetData";
import {
  calculateAllPolymerOptions,
  findCheapest,
  type CargoLine,
} from "@/utils/costCalculations";
import { CostComparisonChart } from "./CostComparisonChart";

export function PolymerSimulator() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [totalKm, setTotalKm] = useState<number>(0);
  const [numFreightsManual, setNumFreightsManual] = useState<number>(1);
  const [cargoLines, setCargoLines] = useState<CargoLine[]>([
    { id: crypto.randomUUID(), client: "", weightTon: 0 },
  ]);
  const [results, setResults] = useState<ReturnType<typeof calculateAllPolymerOptions> | null>(null);

  const totalWeight = cargoLines.reduce((sum, l) => sum + l.weightTon, 0);

  const addLine = () => {
    setCargoLines([...cargoLines, { id: crypto.randomUUID(), client: "", weightTon: 0 }]);
  };

  const removeLine = (id: string) => {
    if (cargoLines.length > 1) {
      setCargoLines(cargoLines.filter((l) => l.id !== id));
    }
  };

  const updateLine = (id: string, field: keyof CargoLine, value: string | number) => {
    setCargoLines(cargoLines.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  };

  const simulate = () => {
    if (totalKm <= 0 || totalWeight <= 0) return;
    const numDeliveries = cargoLines.filter(l => l.client && l.weightTon > 0).length;
    const result = calculateAllPolymerOptions(totalWeight, totalKm, origin, destination, numDeliveries, numFreightsManual);
    setResults(result);
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
      {/* Inputs */}
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
                  {locations.map((l) => (
                    <SelectItem key={l.id} value={l.name}>{l.name}</SelectItem>
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
                placeholder="Ex: 150"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cargo lines */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Cargas</CardTitle>
          <Button size="sm" variant="outline" onClick={addLine}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Peso Bruto (ton)</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cargoLines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>
                    <Input
                      value={line.client}
                      onChange={(e) => updateLine(line.id, "client", e.target.value)}
                      placeholder="Nome do cliente"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.1"
                      value={line.weightTon || ""}
                      onChange={(e) => updateLine(line.id, "weightTon", Number(e.target.value))}
                      placeholder="0.0"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeLine(line.id)}
                      disabled={cargoLines.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Carga Total: <span className="font-bold text-foreground">{totalWeight.toFixed(1)} ton</span> ({(totalWeight * 1000).toFixed(0)} kg)
            </p>
            <Button onClick={simulate} disabled={totalKm <= 0 || totalWeight <= 0}>
              Simular Custos
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <>
          {results.pombalense.zoneName && (
            <div className="text-sm text-muted-foreground px-1">
              Tabela Pombalense aplicada: <span className="font-medium text-foreground">{results.pombalense.zoneName}</span>
            </div>
          )}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                Resultados da Simulação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Opção</TableHead>
                    <TableHead className="text-right">Nº Fretes</TableHead>
                    <TableHead className="text-right">Custo Total (€)</TableHead>
                    <TableHead className="text-right">€/ton</TableHead>
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
                    <TableCell className="text-right">{results.pombalense.numFreights}</TableCell>
                    <TableCell className="text-right font-bold">{results.pombalense.totalCost.toFixed(2)} €</TableCell>
                    <TableCell className="text-right">{totalWeight > 0 ? (results.pombalense.totalCost / totalWeight).toFixed(2) : "-"}</TableCell>
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
                      <TableCell className="text-right">{opt.costPerTon?.toFixed(2) ?? "-"}</TableCell>
                      <TableCell className="text-right">{opt.costPerKm2?.toFixed(2) ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <CostComparisonChart data={chartData} title="Comparação de Custos — Polímeros/Equipamentos" />
        </>
      )}
    </div>
  );
}
