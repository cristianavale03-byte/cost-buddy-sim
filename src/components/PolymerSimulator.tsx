import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, TrendingDown, Info } from "lucide-react";
import { origins, cfZones } from "@/data/fleetData";
import {
  calculateAllPolymerOptions,
  findCheapest,
  findCFZone,
  type CargoLine,
} from "@/utils/costCalculations";
import { CostComparisonChart } from "./CostComparisonChart";
import { usePombalenseExtraRate } from "@/hooks/usePombalenseExtraRate";

export function PolymerSimulator() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [totalKm, setTotalKm] = useState<number>(0);
  // IMPROVED: default deslocações = 0
  const [numFreightsManual, setNumFreightsManual] = useState<number>(0);
  const [cargoLines, setCargoLines] = useState<CargoLine[]>([
    { id: crypto.randomUUID(), client: "", weightTon: 0 },
  ]);
  const [results, setResults] = useState<ReturnType<typeof calculateAllPolymerOptions> | null>(null);
  const { rate: extraRate } = usePombalenseExtraRate();

  const totalWeight = cargoLines.reduce((sum, l) => sum + l.weightTon, 0);

  // IMPROVED: filter destinations by selected origin's cfZones
  const originId = origin.includes("Gulpilhares") || origin.includes("Espinho") ? 1
    : origin.includes("Meirinhas") ? 2
    : origin.includes("Maia") ? 3
    : 0;
  const filteredDestinations = origin
    ? [...new Set(cfZones.filter(z => z.originId === originId).flatMap(z => z.destinations))].sort()
    : [];

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

  // IMPROVED: reset destination when origin changes
  const handleOriginChange = (val: string) => {
    setOrigin(val);
    setDestination("");
    setResults(null);
  };

  const simulate = () => {
    if (totalKm <= 0 || totalWeight <= 0) return;
    // IMPROVED: numDeliveries = numFreightsManual (min 0)
    const result = calculateAllPolymerOptions(totalWeight, totalKm, origin, destination, numFreightsManual, Math.max(1, numFreightsManual));
    
    // IMPROVED: apply extra rate to weightCost before summing
    if (extraRate > 0) {
      result.pombalense.weightCost = result.pombalense.weightCost * (1 + extraRate / 100);
      result.pombalense.totalCost = (result.pombalense.weightCost + result.pombalense.deliveryCost) * Math.max(1, numFreightsManual);
    }
    
    setResults(result);
  };

  // IMPROVED: if findCFZone returns null, pombalense has no valid cost
  const zoneFound = results ? findCFZone(origin, destination) !== null : true;

  const cheapest = results
    ? findCheapest(results.pombalense.totalCost, results.fleetOptions)
    : null;

  const chartData = results
    ? [
        ...(zoneFound ? [{ name: "Pombalense", custo: Math.round(results.pombalense.totalCost * 100) / 100 }] : []),
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Origem</Label>
              {/* IMPROVED: origin change resets destination */}
              <Select value={origin} onValueChange={handleOriginChange}>
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
              {/* IMPROVED: destinations filtered by origin; disabled if no origin */}
              <Select value={destination} onValueChange={setDestination} disabled={!origin}>
                <SelectTrigger>
                  <SelectValue placeholder={origin ? "Selecionar destino" : "Seleciona primeiro a origem"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredDestinations.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              {/* IMPROVED: label changed to ida + volta */}
              <Label>Km Totais (ida + volta)</Label>
              <Input
                type="number"
                value={totalKm || ""}
                onChange={(e) => setTotalKm(Number(e.target.value))}
                placeholder="Ex: 300"
              />
            </div>
            <div className="space-y-2">
              {/* IMPROVED: renamed from "Fretes" to "Deslocações", default 0 */}
              <Label>Nº de Deslocações</Label>
              <Input
                type="number"
                value={numFreightsManual}
                onChange={(e) => setNumFreightsManual(Math.max(0, Number(e.target.value)))}
                placeholder="0"
                min={0}
              />
              {/* IMPROVED: info note about extra delivery cost */}
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" /> Cada deslocação é cobrada a 25 € pela Pombalense
              </p>
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
                    {/* IMPROVED: renamed column header */}
                    <TableHead className="text-right">Nº Deslocações</TableHead>
                    <TableHead className="text-right">Custo Total (€)</TableHead>
                    <TableHead className="text-right">€/ton</TableHead>
                    <TableHead className="text-right">€/km</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* IMPROVED: show "—" if no zone found, show cost breakdown */}
                  <TableRow className={zoneFound && cheapest === "Pombalense" ? "bg-green-50 dark:bg-green-950/30" : ""}>
                    <TableCell className="font-medium">
                      <div>
                        Pombalense (Subcontratação)
                        {zoneFound && cheapest === "Pombalense" && (
                          <span className="ml-2 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-0.5 rounded-full">
                            Mais económico
                          </span>
                        )}
                        {/* IMPROVED: show extra rate badge */}
                        {zoneFound && extraRate > 0 && (
                          <span className="ml-2 text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-full">
                            +{extraRate}% aplicado
                          </span>
                        )}
                      </div>
                      {/* IMPROVED: cost breakdown detail */}
                      {zoneFound && (
                        <div className="mt-1">
                          <p className="text-xs text-muted-foreground">Custo por peso: {results.pombalense.weightCost.toFixed(2)} €</p>
                          {results.pombalense.deliveryCost > 0 && (
                            <p className="text-xs text-muted-foreground">Custo deslocações: {results.pombalense.deliveryCost.toFixed(2)} €</p>
                          )}
                        </div>
                      )}
                      {/* IMPROVED: heavy load analysis moved inside Pombalense row */}
                      {results.heavyLoadComparison && (
                        <div className="mt-3 pt-3 border-t border-border space-y-2">
                          <p className="text-xs font-semibold">⚖️ Análise de Carga Completa</p>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Custo CF incremental (além 10 ton)</span>
                            <span className="font-medium text-foreground">{results.heavyLoadComparison.custoCFIncremental.toFixed(2)} €</span>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Custo 3 Eixos (tabela CC)</span>
                            <span className="font-medium text-foreground">
                              {results.heavyLoadComparison.custoThreeAxle !== null
                                ? `${results.heavyLoadComparison.custoThreeAxle.toFixed(2)} €`
                                : "Não disponível"}
                            </span>
                          </div>
                          {results.heavyLoadComparison.suggestThreeAxle && (
                            <span className="inline-block text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-0.5 rounded-full">
                              ✅ 3 Eixos mais económico
                            </span>
                          )}
                          {totalWeight > 15 && (
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Custo Reboque</span>
                              <span className="font-medium text-foreground">
                                {results.heavyLoadComparison.custoTrailer !== null
                                  ? `${results.heavyLoadComparison.custoTrailer.toFixed(2)} €`
                                  : "Não disponível"}
                              </span>
                            </div>
                          )}
                          {results.heavyLoadComparison.suggestTrailer && (
                            <span className="inline-block text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-0.5 rounded-full">
                              ✅ Reboque mais económico
                            </span>
                          )}
                          {!results.heavyLoadComparison.suggestThreeAxle && !results.heavyLoadComparison.suggestTrailer && (
                            <p className="text-xs text-muted-foreground italic">
                              CF continua a ser a opção mais económica para este volume
                            </p>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{zoneFound ? results.pombalense.numFreights : "—"}</TableCell>
                    <TableCell className="text-right font-bold">{zoneFound ? `${results.pombalense.totalCost.toFixed(2)} €` : "—"}</TableCell>
                    <TableCell className="text-right">{zoneFound && totalWeight > 0 ? (results.pombalense.totalCost / totalWeight).toFixed(2) : "—"}</TableCell>
                    <TableCell className="text-right">{zoneFound && totalKm > 0 ? (results.pombalense.totalCost / totalKm).toFixed(2) : "—"}</TableCell>
                  </TableRow>
                  {results.fleetOptions.map((opt) => {
                    const isWeightExcessive = totalWeight > opt.capacityTon;
                    return (
                      <TableRow
                        key={opt.vehicleName}
                        className={isWeightExcessive ? "bg-destructive/10" : cheapest === opt.vehicleName ? "bg-green-50 dark:bg-green-950/30" : ""}
                      >
                        <TableCell className="font-medium">
                          {opt.vehicleName}
                          {isWeightExcessive && (
                            <span className="ml-2 text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded-full">
                              Peso excessivo
                            </span>
                          )}
                          {/* IMPROVED: amber badge for capacity warning per trip */}
                          {!isWeightExcessive && opt.warning && (
                            <span className="ml-2 text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-full">
                              {opt.warning}
                            </span>
                          )}
                          {!isWeightExcessive && !opt.warning && cheapest === opt.vehicleName && (
                            <span className="ml-2 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-0.5 rounded-full">
                              Mais económico
                            </span>
                          )}
                        </TableCell>
                        {/* IMPROVED: renamed "Fretes" to "Deslocações" */}
                        <TableCell className="text-right">{isWeightExcessive ? "—" : opt.numFreights}</TableCell>
                        <TableCell className="text-right font-bold">{isWeightExcessive ? "—" : `${opt.totalCost.toFixed(2)} €`}</TableCell>
                        <TableCell className="text-right">{isWeightExcessive ? "—" : (opt.costPerTon?.toFixed(2) ?? "-")}</TableCell>
                        <TableCell className="text-right">{isWeightExcessive ? "—" : (opt.costPerKm2?.toFixed(2) ?? "-")}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* IMPROVED: heavy load comparison block for >10 ton */}
          {results.heavyLoadComparison && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">⚖️ Análise de Carga Completa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Custo CF incremental (além 10 ton)</span>
                  <span className="font-medium">{results.heavyLoadComparison.custoCFIncremental.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Custo 3 Eixos (tabela CC, mesmo destino)</span>
                  <span className="font-medium">
                    {results.heavyLoadComparison.custoThreeAxle !== null
                      ? `${results.heavyLoadComparison.custoThreeAxle.toFixed(2)} €`
                      : "Não disponível para este destino"}
                  </span>
                </div>
                {results.heavyLoadComparison.suggestThreeAxle && (
                  <span className="inline-block text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-0.5 rounded-full">
                    ✅ 3 Eixos mais económico
                  </span>
                )}
                {totalWeight > 15 && (
                  <div className="flex justify-between text-sm">
                    <span>Custo Reboque</span>
                    <span className="font-medium">
                      {results.heavyLoadComparison.custoTrailer !== null
                        ? `${results.heavyLoadComparison.custoTrailer.toFixed(2)} €`
                        : "Não disponível"}
                    </span>
                  </div>
                )}
                {results.heavyLoadComparison.suggestTrailer && (
                  <span className="inline-block text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-0.5 rounded-full">
                    ✅ Reboque mais económico
                  </span>
                )}
                {!results.heavyLoadComparison.suggestThreeAxle && !results.heavyLoadComparison.suggestTrailer && (
                  <p className="text-xs text-muted-foreground italic">
                    CF continua a ser a opção mais económica para este volume
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <CostComparisonChart data={chartData} title="Comparação de Custos — Polímeros/Equipamentos" />
        </>
      )}
    </div>
  );
}
