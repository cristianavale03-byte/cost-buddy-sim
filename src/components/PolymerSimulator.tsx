import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, TrendingDown, Info, RotateCcw, Save, Check, X } from "lucide-react";
import { origins, cfZones } from "@/data/fleetData";
import { getEstimatedRoundTripKm } from "@/data/distanceData";
import {
  calculateAllPolymerOptions,
  findCheapest,
  findCFZone,
  type CargoLine,
} from "@/utils/costCalculations";
import { CostComparisonChart } from "./CostComparisonChart";
import { usePombalenseExtraRate } from "@/hooks/usePombalenseExtraRate";
// IMPROVED: use context for state persistence across tabs
import { useSimulatorState, defaultPolymer, type SavedEstimate } from "@/contexts/SimulatorStateContext";

export function PolymerSimulator() {
  const { polymer, setPolymer, savedEstimates, setSavedEstimates } = useSimulatorState();
  const { rate: extraRate } = usePombalenseExtraRate();

  // IMPROVED: read state from context instead of local useState
  const { origin, destination, totalKm, numFreightsManual, cargoLines, results } = polymer;

  // IMPROVED: save estimate inline input state
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [estimateName, setEstimateName] = useState("");

  const totalWeight = cargoLines.reduce((sum, l) => sum + l.weightTon, 0);

  const originId = origin.includes("Gulpilhares") || origin.includes("Espinho") ? 1
    : origin.includes("Meirinhas") ? 2
    : origin.includes("Maia") ? 3
    : 0;
  const filteredDestinations = origin
    ? [...new Set(cfZones.filter(z => z.originId === originId).flatMap(z => z.destinations))].sort()
    : [];

  // IMPROVED: helper to update context
  const update = (partial: Partial<typeof polymer>) => {
    setPolymer(prev => ({ ...prev, ...partial }));
  };

  const setCargoLines = (lines: CargoLine[]) => update({ cargoLines: lines });
  const setResults = (r: typeof results) => update({ results: r });

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

  const handleOriginChange = (val: string) => {
    update({ origin: val, destination: "", totalKm: 0, results: null });
  };

  const handleDestinationChange = (val: string) => {
    const estimated = getEstimatedRoundTripKm(origin, val);
    update({ destination: val, totalKm: estimated !== null ? estimated : totalKm });
  };

  // IMPROVED: clear all fields and reset context
  const handleClear = () => {
    setPolymer({ ...defaultPolymer, cargoLines: [{ id: crypto.randomUUID(), client: "", weightTon: 0 }] });
    setShowSaveInput(false);
    setEstimateName("");
  };

  const simulate = () => {
    if (totalKm <= 0 || totalWeight <= 0) return;
    const result = calculateAllPolymerOptions(totalWeight, totalKm, origin, destination, numFreightsManual);
    
    if (extraRate > 0) {
      result.pombalense.weightCost = result.pombalense.weightCost * (1 + extraRate / 100);
      result.pombalense.totalCost = result.pombalense.weightCost + result.pombalense.deliveryCost;
    }
    
    setResults(result);
  };

  // IMPROVED: save estimate to context
  const handleSaveEstimate = () => {
    if (!estimateName.trim() || !results) return;
    const cheapestOpt = findCheapest(results.pombalense.totalCost, results.fleetOptions);
    const bestFleet = results.fleetOptions.filter((o: any) => totalWeight <= o.capacityTon).sort((a: any, b: any) => a.totalCost - b.totalCost)[0];
    const estimate: SavedEstimate = {
      id: crypto.randomUUID(),
      name: estimateName.trim(),
      savedAt: new Date().toISOString(),
      type: "polymers",
      origin,
      destination,
      totalKm,
      totalWeightTon: totalWeight,
      cargoLines,
      pombalenseTotalCost: results.pombalense.totalCost,
      pombalensetWeightCost: results.pombalense.weightCost,
      pombalensetDeliveryCost: results.pombalense.deliveryCost,
      bestFleetOption: bestFleet?.vehicleName,
      bestFleetCost: bestFleet?.totalCost,
      // IMPROVED: individual fleet costs for archive columns
      fleet6tCost: results.fleetOptions.find((o: any) => o.vehicleName?.includes("6"))?.totalCost,
      fleet9tCost: results.fleetOptions.find((o: any) => o.vehicleName?.includes("9"))?.totalCost,
      fleet15tCost: results.fleetOptions.find((o: any) => o.vehicleName?.includes("15"))?.totalCost,
      cheapestOption: cheapestOpt,
      heavyLoadComparison: results.heavyLoadComparison,
      extraRateApplied: extraRate,
    };
    setSavedEstimates(prev => [...prev, estimate]);
    setShowSaveInput(false);
    setEstimateName("");
  };

  const zoneFound = results ? findCFZone(origin, destination) !== null : true;

  const cheapest = results
    ? findCheapest(results.pombalense.totalCost, results.fleetOptions)
    : null;

  const chartData = results
    ? [
        ...(zoneFound ? [{ name: "Pombalense", custo: Math.round(results.pombalense.totalCost * 100) / 100 }] : []),
        ...results.fleetOptions
          .filter((o: any) => totalWeight <= o.capacityTon)
          .map((o: any) => ({
            name: o.vehicleName,
            custo: Math.round(o.totalCost * 100) / 100,
          })),
      ]
    : [];

  return (
    <div className="space-y-4">
      {/* Combined inputs + cargo in one card */}
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
              <Label className="text-xs">Origem</Label>
              <Select value={origin} onValueChange={handleOriginChange}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Selecionar origem" /></SelectTrigger>
                <SelectContent>
                  {origins.map((o) => (
                    <SelectItem key={o.id} value={o.name}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Destino</Label>
              <Select value={destination} onValueChange={handleDestinationChange} disabled={!origin}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={origin ? "Selecionar destino" : "Seleciona primeiro a origem"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredDestinations.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Km Totais (ida + volta)</Label>
              <Input
                className="h-9"
                type="number"
                value={totalKm || ""}
                onChange={(e) => update({ totalKm: Number(e.target.value) })}
                placeholder="Ex: 300"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nº de Deslocações</Label>
              <Input
                className="h-9"
                type="number"
                value={numFreightsManual}
                onChange={(e) => update({ numFreightsManual: Math.max(0, Number(e.target.value)) })}
                placeholder="0"
                min={0}
              />
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3 shrink-0" /> 25 €/deslocação (Pombalense)
              </p>
            </div>
          </div>

          {/* Cargo lines inline */}
          <div className="border-t pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Cargas</span>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={addLine}>
                <Plus className="h-3 w-3 mr-1" /> Adicionar
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs py-1">Cliente</TableHead>
                  <TableHead className="text-xs py-1">Peso Bruto (ton)</TableHead>
                  <TableHead className="w-10 py-1"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cargoLines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className="py-1">
                      <Input
                        className="h-8"
                        value={line.client}
                        onChange={(e) => updateLine(line.id, "client", e.target.value)}
                        placeholder="Nome do cliente"
                      />
                    </TableCell>
                    <TableCell className="py-1">
                      <Input
                        className="h-8"
                        type="number"
                        step="0.1"
                        value={line.weightTon || ""}
                        onChange={(e) => updateLine(line.id, "weightTon", Number(e.target.value))}
                        placeholder="0.0"
                      />
                    </TableCell>
                    <TableCell className="py-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => removeLine(line.id)}
                        disabled={cargoLines.length === 1}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Carga Total: <span className="font-bold text-foreground">{totalWeight.toFixed(1)} ton</span> ({(totalWeight * 1000).toFixed(0)} kg)
              </p>
              <Button size="sm" onClick={simulate} disabled={totalKm <= 0 || totalWeight <= 0}>
                Simular Custos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <>
          {results.pombalense.zoneName && (
            <div className="text-xs text-muted-foreground px-1">
              Tabela Pombalense: <span className="font-medium text-foreground">{results.pombalense.zoneName}</span>
            </div>
          )}

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

          {/* Results table + chart side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Resultados da Simulação
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs w-[40%]">Opção</TableHead>
                      <TableHead className="text-xs text-right">Desloc.</TableHead>
                      <TableHead className="text-xs text-right">Custo Total</TableHead>
                      <TableHead className="text-xs text-right">€/ton</TableHead>
                      <TableHead className="text-xs text-right">€/km</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className={zoneFound && cheapest === "Pombalense" ? "bg-green-50 dark:bg-green-950/30" : ""}>
                      <TableCell className="font-medium text-xs py-2">
                        <div>
                          Pombalense
                          {zoneFound && cheapest === "Pombalense" && (
                            <span className="ml-1 text-[10px] bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-1.5 py-0.5 rounded-full">
                              Mais económico
                            </span>
                          )}
                          {zoneFound && extraRate > 0 && (
                            <span className="ml-1 text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 px-1.5 py-0.5 rounded-full">
                              +{extraRate}%
                            </span>
                          )}
                        </div>
                        {zoneFound && (
                          <div className="mt-0.5 space-y-0.5">
                            {results.heavyLoadComparison ? (
                              <p className="text-[10px] text-muted-foreground">
                                {results.heavyLoadComparison.optionUsed === "CF" && `CF: ${results.pombalense.weightCost.toFixed(2)} €`}
                                {results.heavyLoadComparison.optionUsed === "3Eixos" && `3 Eixos: ${results.pombalense.weightCost.toFixed(2)} €`}
                                {results.heavyLoadComparison.optionUsed === "Reboque" && `Reboque: ${results.pombalense.weightCost.toFixed(2)} €`}
                              </p>
                            ) : (
                              <p className="text-[10px] text-muted-foreground">Peso: {results.pombalense.weightCost.toFixed(2)} €</p>
                            )}
                            {results.pombalense.deliveryCost > 0 && (
                              <p className="text-[10px] text-muted-foreground">Desloc.: {results.pombalense.deliveryCost.toFixed(2)} €</p>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-xs py-2">{zoneFound ? results.pombalense.numFreights : "—"}</TableCell>
                      <TableCell className="text-right font-bold text-xs py-2">{zoneFound ? `${results.pombalense.totalCost.toFixed(2)} €` : "—"}</TableCell>
                      <TableCell className="text-right text-xs py-2">{zoneFound && totalWeight > 0 ? (results.pombalense.totalCost / totalWeight).toFixed(2) : "—"}</TableCell>
                      <TableCell className="text-right text-xs py-2">{zoneFound && totalKm > 0 ? (results.pombalense.totalCost / totalKm).toFixed(2) : "—"}</TableCell>
                    </TableRow>
                    {results.fleetOptions.map((opt: any) => {
                      const isWeightExcessive = totalWeight > opt.capacityTon;
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
                            {!isWeightExcessive && opt.warning && (
                              <span className="ml-1 text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 px-1.5 py-0.5 rounded-full">
                                {opt.warning}
                              </span>
                            )}
                            {!isWeightExcessive && !opt.warning && cheapest === opt.vehicleName && (
                              <span className="ml-1 text-[10px] bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-1.5 py-0.5 rounded-full">
                                Mais económico
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-xs py-2">{isWeightExcessive ? "—" : opt.numFreights}</TableCell>
                          <TableCell className="text-right font-bold text-xs py-2">{isWeightExcessive ? "—" : `${opt.totalCost.toFixed(2)} €`}</TableCell>
                          <TableCell className="text-right text-xs py-2">{isWeightExcessive ? "—" : (opt.costPerTon?.toFixed(2) ?? "-")}</TableCell>
                          <TableCell className="text-right text-xs py-2">{isWeightExcessive ? "—" : (opt.costPerKm2?.toFixed(2) ?? "-")}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* Heavy load analysis inline */}
                {results.heavyLoadComparison && (
                  <div className="mt-3 pt-3 border-t border-border space-y-1.5">
                    <p className="text-xs font-semibold">⚖️ Análise de Carga Completa</p>
                    {numFreightsManual > 0 && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Info className="h-3 w-3 shrink-0" /> Com deslocações, CF incremental ignorado
                      </p>
                    )}
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span className={numFreightsManual > 0 ? "line-through opacity-50" : ""}>
                        CF incremental
                        {results.heavyLoadComparison.optionUsed === "CF" && (
                          <span className="ml-1 text-[10px] bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-1.5 py-0.5 rounded-full">
                            ✅ Aplicada
                          </span>
                        )}
                      </span>
                      <span className={`font-medium text-foreground ${numFreightsManual > 0 ? "line-through opacity-50" : ""}`}>{results.heavyLoadComparison.custoCFIncremental.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>
                        3 Eixos (CC)
                        {results.heavyLoadComparison.optionUsed === "3Eixos" && (
                          <span className="ml-1 text-[10px] bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-1.5 py-0.5 rounded-full">
                            ✅ Aplicada
                          </span>
                        )}
                      </span>
                      <span className="font-medium text-foreground">
                        {results.heavyLoadComparison.custoThreeAxle !== null
                          ? `${results.heavyLoadComparison.custoThreeAxle.toFixed(2)} €`
                          : "N/D"}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>
                        Reboque
                        {results.heavyLoadComparison.optionUsed === "Reboque" && (
                          <span className="ml-1 text-[10px] bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-1.5 py-0.5 rounded-full">
                            ✅ Aplicada
                          </span>
                        )}
                      </span>
                      <span className="font-medium text-foreground">
                        {results.heavyLoadComparison.custoTrailer !== null
                          ? `${results.heavyLoadComparison.custoTrailer.toFixed(2)} €`
                          : "N/D"}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <CostComparisonChart data={chartData} title="Comparação de Custos — Polímeros" />
          </div>
        </>
      )}
    </div>
  );
}
