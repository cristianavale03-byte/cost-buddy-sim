import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, TrendingDown, Info, RotateCcw, Save, Check, X } from "lucide-react";
import { origins, cfZones, ccPrices, fleetVehicles } from "@/data/fleetData";
import { getEstimatedRoundTripKm } from "@/data/distanceData";
import {
  calculateAllPolymerOptions,
  calculateLinearMeters,
  calculateTotalWeight,
  selectPombalenseTable,
  findCheapest,
  findCFZone,
  type CargoLine,
} from "@/utils/costCalculations";
import { CostComparisonChart } from "./CostComparisonChart";
import { usePombalenseExtraRate } from "@/hooks/usePombalenseExtraRate";
import { useSimulatorState, defaultPolymer, type SavedEstimate } from "@/contexts/SimulatorStateContext";

const cargoTypeLabels: Record<CargoLine["cargoType"], string> = {
  polymers: "Polímeros",
  equipment: "Equipamentos",
  construction: "Construção",
};

export function CostSimulator() {
  const { polymer, setPolymer, savedEstimates, setSavedEstimates } = useSimulatorState();
  const { rate: extraRate } = usePombalenseExtraRate();

  const { origin, destination, totalKm, numFreightsManual, cargoLines, results } = polymer;

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [estimateName, setEstimateName] = useState("");
  const [chosenOption, setChosenOption] = useState("");
  const [observations, setObservations] = useState("");

  const totalWeight = calculateTotalWeight(cargoLines);
  const linearMeters = calculateLinearMeters(cargoLines);
  const tableToUse = selectPombalenseTable(cargoLines);
  const numDeslocacoes = numFreightsManual;

  const originId = origin.includes("Gulpilhares") || origin.includes("Espinho") ? 1
    : origin.includes("Meirinhas") ? 2
    : origin.includes("Maia") ? 3
    : 0;
  const filteredDestinations = origin
    ? [...new Set([
        ...cfZones.filter(z => z.originId === originId).flatMap(z => z.destinations),
        ...ccPrices.map(p => p.destination),
      ])].sort()
    : [];

  const update = (partial: Partial<typeof polymer>) => {
    setPolymer(prev => ({ ...prev, ...partial }));
  };

  const setCargoLines = (lines: CargoLine[]) => update({ cargoLines: lines });
  const setResults = (r: typeof results) => update({ results: r });

  const addLine = () => {
    setCargoLines([...cargoLines, { id: crypto.randomUUID(), client: "", cargoType: "polymers", weightTon: 0, numPallets: 0, lengthMeters: 0, numPlates: 0 }]);
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

  const handleClear = () => {
    setPolymer({ ...defaultPolymer, cargoLines: [{ id: crypto.randomUUID(), client: "", cargoType: "polymers", weightTon: 0, numPallets: 0, lengthMeters: 0, numPlates: 0 }] });
    setShowSaveDialog(false);
    setEstimateName("");
    setChosenOption("");
    setObservations("");
  };

  const [baseWeightCost, setBaseWeightCost] = useState<number | null>(null);

  const simulate = () => {
    if (totalKm <= 0 || totalWeight <= 0) return;
    const result = calculateAllPolymerOptions(cargoLines, totalKm, origin, destination, numDeslocacoes);

    const baseCost = result.pombalense.weightCost;
    if (extraRate > 0) {
      const factor = 1 + extraRate / 100;
      result.pombalense.weightCost = baseCost * factor;
      result.pombalense.totalCost = result.pombalense.weightCost + result.pombalense.deliveryCost;
      result.fleetOptions = result.fleetOptions.map((o: any) => ({
        ...o,
        totalCost: o.warning ? 0 : o.totalCost * factor,
        costPerTon: o.costPerTon ? o.costPerTon * factor : o.costPerTon,
        costPerKm2: o.costPerKm2 ? o.costPerKm2 * factor : o.costPerKm2,
      }));
      setBaseWeightCost(baseCost);
    } else {
      setBaseWeightCost(null);
    }

    setResults(result);
  };

  const handleSaveEstimate = () => {
    if (!estimateName.trim() || !results) return;
    const cheapestOpt = findCheapest(results.pombalense.totalCost, results.fleetOptions);
    const bestFleet = results.fleetOptions.filter((o: any) => !o.warning).sort((a: any, b: any) => a.totalCost - b.totalCost)[0];
    const estimate: SavedEstimate = {
      id: crypto.randomUUID(),
      name: estimateName.trim(),
      savedAt: new Date().toISOString(),
      savedBy: sessionStorage.getItem("agi-user-name") ?? "Anónimo",
      type: "polymers",
      origin,
      destination,
      totalKm,
      totalWeightTon: totalWeight,
      totalMeters: linearMeters,
      cargoLines,
      pombalenseTotalCost: results.pombalense.totalCost,
      pombalensetWeightCost: results.pombalense.weightCost,
      pombalensetDeliveryCost: results.pombalense.deliveryCost,
      bestFleetOption: bestFleet?.vehicleName,
      bestFleetCost: bestFleet?.totalCost,
      fleet6tCost: !results.fleetOptions.find((o: any) => o.vehicleName?.includes("6"))?.warning ? results.fleetOptions.find((o: any) => o.vehicleName?.includes("6"))?.totalCost : undefined,
      fleet6tWarning: results.fleetOptions.find((o: any) => o.vehicleName?.includes("6"))?.warning,
      fleet9tCost: !results.fleetOptions.find((o: any) => o.vehicleName?.includes("9"))?.warning ? results.fleetOptions.find((o: any) => o.vehicleName?.includes("9"))?.totalCost : undefined,
      fleet9tWarning: results.fleetOptions.find((o: any) => o.vehicleName?.includes("9"))?.warning,
      fleet15tCost: !results.fleetOptions.find((o: any) => o.vehicleName?.includes("15"))?.warning ? results.fleetOptions.find((o: any) => o.vehicleName?.includes("15"))?.totalCost : undefined,
      fleet15tWarning: results.fleetOptions.find((o: any) => o.vehicleName?.includes("15"))?.warning,
      cheapestOption: cheapestOpt,
      heavyLoadComparison: results.heavyLoadComparison,
      extraRateApplied: extraRate,
      chosenOption: chosenOption || undefined,
      observations: observations.trim() || undefined,
    };
    setSavedEstimates(prev => [...prev, estimate]);
    setShowSaveDialog(false);
    setEstimateName("");
    setChosenOption("");
    setObservations("");
  };

  const zoneFound = results
    ? (tableToUse === "CC"
        ? ccPrices.some(p => p.destination.toLowerCase() === destination.toLowerCase() || p.destination.toLowerCase().includes(destination.toLowerCase()) || destination.toLowerCase().includes(p.destination.toLowerCase()))
        : findCFZone(origin, destination) !== null || (results.heavyLoadComparison !== null && results.heavyLoadComparison.custoBaseEfetivo > 0))
    : true;

  const cheapest = results
    ? findCheapest(results.pombalense.totalCost, results.fleetOptions)
    : null;

  const chartData = results
    ? [
        ...(zoneFound ? [{ name: "Pombalense", custo: Math.round(results.pombalense.totalCost * 100) / 100 }] : []),
        ...results.fleetOptions
          .filter((o: any) => !o.warning)
          .map((o: any) => ({
            name: o.vehicleName,
            custo: Math.round(o.totalCost * 100) / 100,
          })),
      ]
    : [];

  // Viable fleet vehicles for summary
  const viableFleet = fleetVehicles.filter(v => totalWeight <= v.capacityTon && linearMeters <= v.capacityMeters);

  // Check if any line has construction type to show/hide columns
  const hasPolymersOrEquipment = cargoLines.some(l => l.cargoType === "polymers" || l.cargoType === "equipment");
  const hasConstruction = cargoLines.some(l => l.cargoType === "construction");

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Dados do Transporte</CardTitle>
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
                min={0}
                value={numFreightsManual}
                onChange={e => update({ numFreightsManual: Math.max(0, Number(e.target.value)) })}
              />
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3 shrink-0" /> 25 € por deslocação extra
              </p>
            </div>
          </div>

          {/* Cargo lines table */}
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
                  <TableHead className="text-xs py-1 w-[130px]">Tipo de Carga</TableHead>
                  <TableHead className="text-xs py-1">Peso (ton)</TableHead>
                  <TableHead className="text-xs py-1">Nº Paletes</TableHead>
                  <TableHead className="text-xs py-1">Comp. (m)</TableHead>
                  <TableHead className="text-xs py-1">Nº Placas</TableHead>
                  <TableHead className="w-10 py-1"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cargoLines.map((line) => {
                  const isConstruction = line.cargoType === "construction";
                  const isPolyOrEquip = line.cargoType === "polymers" || line.cargoType === "equipment";
                  return (
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
                        <Select
                          value={line.cargoType}
                          onValueChange={(val) => updateLine(line.id, "cargoType", val)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="polymers">Polímeros</SelectItem>
                            <SelectItem value="equipment">Equipamentos</SelectItem>
                            <SelectItem value="construction">Construção</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      {/* Peso (ton) — always editable */}
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
                      {/* Nº Paletes — visible for polymers/equipment */}
                      <TableCell className="py-1">
                        {isPolyOrEquip ? (
                          <Input
                            className="h-8"
                            type="number"
                            min={0}
                            value={line.numPallets || ""}
                            onChange={(e) => updateLine(line.id, "numPallets", Math.max(0, parseInt(e.target.value) || 0))}
                            placeholder="0"
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      {/* Comp. (m) — visible for construction */}
                      <TableCell className="py-1">
                        {isConstruction ? (
                          <Input
                            className="h-8"
                            type="number"
                            step="0.1"
                            value={line.lengthMeters || ""}
                            onChange={(e) => updateLine(line.id, "lengthMeters", Number(e.target.value))}
                            placeholder="0.0"
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      {/* Nº Placas — visible for construction */}
                      <TableCell className="py-1">
                        {isConstruction ? (
                          <Input
                            className="h-8"
                            type="number"
                            min={1}
                            value={line.numPlates || ""}
                            onChange={(e) => updateLine(line.id, "numPlates", Math.max(1, parseInt(e.target.value) || 1))}
                            placeholder="1"
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
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
                  );
                })}
              </TableBody>
            </Table>

            {/* Summary below table */}
            <div className="mt-3 p-3 rounded-md bg-muted/50 space-y-1.5">
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
                <span>Peso total: <span className="font-bold text-foreground">{totalWeight.toFixed(1)} ton</span></span>
                <span>Comprimento linear total: <span className="font-bold text-foreground">{linearMeters.toFixed(1)} m</span></span>
                <span className="flex items-center gap-1">
                  Tabela Pombalense: <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-100">{tableToUse}</Badge>
                </span>
              </div>
              {fleetVehicles.length > 0 && (
                <div className="text-xs space-y-0.5">
                  <span className="text-muted-foreground">Ocupação estimada:</span>
                  {fleetVehicles.map((v) => {
                    const metersOk = linearMeters <= v.capacityMeters;
                    const weightOk = totalWeight <= v.capacityTon;
                    const allOk = metersOk && weightOk;
                    return (
                      <div
                        key={v.name}
                        className={`rounded px-1.5 py-0.5 ${allOk ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300" : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"}`}
                      >
                        <span className="font-medium">{v.name}:</span>{" "}
                        <span className={!metersOk ? "font-bold underline" : ""}>{linearMeters.toFixed(1)} m</span> / {v.capacityMeters} m,{" "}
                        <span className={!weightOk ? "font-bold underline" : ""}>{totalWeight.toFixed(1)} ton</span> / {v.capacityTon} ton
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-2 flex items-center justify-end">
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

          <div className="flex items-center gap-2 px-1">
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowSaveDialog(true)}>
              <Save className="h-3 w-3 mr-1" /> Guardar Estimativa
            </Button>
          </div>

          {/* Save estimate dialog */}
          <Dialog open={showSaveDialog} onOpenChange={(open) => { if (!open) { setShowSaveDialog(false); setEstimateName(""); setChosenOption(""); setObservations(""); } }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base">Guardar Estimativa</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs">Nome da estimativa</Label>
                  <Input
                    className="h-9 text-sm"
                    value={estimateName}
                    onChange={(e) => setEstimateName(e.target.value)}
                    placeholder="Ex: Viagem Lisboa 12/04"
                    autoFocus
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Opção realizada</Label>
                  <Select value={chosenOption} onValueChange={setChosenOption}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Selecionar opção utilizada" /></SelectTrigger>
                    <SelectContent>
                      {zoneFound && <SelectItem value="Pombalense">Pombalense — {results.pombalense.totalCost?.toFixed(2)} €</SelectItem>}
                      {results.fleetOptions.filter((o: any) => !o.warning).map((o: any) => (
                        <SelectItem key={o.vehicleName} value={o.vehicleName}>{o.vehicleName} — {o.totalCost?.toFixed(2)} €</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Observações</Label>
                  <Textarea
                    className="text-sm min-h-[80px]"
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder="Notas adicionais sobre esta estimativa..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => { setShowSaveDialog(false); setEstimateName(""); setChosenOption(""); setObservations(""); }}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleSaveEstimate} disabled={!estimateName.trim()}>
                  <Save className="h-3 w-3 mr-1" /> Guardar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

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
                                {results.heavyLoadComparison.optionUsed === "CF" && `CF: ${results.pombalense.weightCost.toFixed(2)} €${baseWeightCost !== null ? ` (${baseWeightCost.toFixed(2)} €)` : ""}`}
                                {results.heavyLoadComparison.optionUsed === "3Eixos" && `3 Eixos: ${results.pombalense.weightCost.toFixed(2)} €${baseWeightCost !== null ? ` (${baseWeightCost.toFixed(2)} €)` : ""}`}
                                {results.heavyLoadComparison.optionUsed === "Reboque" && `Reboque: ${results.pombalense.weightCost.toFixed(2)} €${baseWeightCost !== null ? ` (${baseWeightCost.toFixed(2)} €)` : ""}`}
                              </p>
                            ) : tableToUse === "CC" ? (
                              <p className="text-[10px] text-muted-foreground">Custo por comprimento (CC): {results.pombalense.weightCost.toFixed(2)} €{baseWeightCost !== null ? ` (${baseWeightCost.toFixed(2)} €` : ""}{results.pombalense.zoneName ? ` — ${results.pombalense.zoneName}` : ""}{baseWeightCost !== null ? ")" : ""}</p>
                            ) : (
                              <p className="text-[10px] text-muted-foreground">Custo por peso: {results.pombalense.weightCost.toFixed(2)} €{baseWeightCost !== null ? ` (${baseWeightCost.toFixed(2)} €)` : ""}</p>
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
                      const hasWarning = !!opt.warning;
                      return (
                        <TableRow
                          key={opt.vehicleName}
                          className={hasWarning ? "bg-destructive/10" : cheapest === opt.vehicleName ? "bg-green-50 dark:bg-green-950/30" : ""}
                        >
                          <TableCell className="font-medium text-xs py-2">
                            {opt.vehicleName}
                            {hasWarning && (
                              <span className="ml-1 text-[10px] bg-destructive/20 text-destructive px-1.5 py-0.5 rounded-full">
                                {opt.warning}
                              </span>
                            )}
                            {!hasWarning && cheapest === opt.vehicleName && (
                              <span className="ml-1 text-[10px] bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-1.5 py-0.5 rounded-full">
                                Mais económico
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-xs py-2">{hasWarning ? "—" : opt.numFreights}</TableCell>
                          <TableCell className="text-right font-bold text-xs py-2">{hasWarning ? "—" : `${opt.totalCost.toFixed(2)} €`}</TableCell>
                          <TableCell className="text-right text-xs py-2">{hasWarning ? "—" : (opt.costPerTon?.toFixed(2) ?? "-")}</TableCell>
                          <TableCell className="text-right text-xs py-2">{hasWarning ? "—" : (opt.costPerKm2?.toFixed(2) ?? "-")}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* Heavy load analysis inline */}
                {results.heavyLoadComparison && (
                  <div className="mt-3 pt-3 border-t border-border space-y-1.5">
                    <p className="text-xs font-semibold">⚖️ Análise de Carga Completa</p>
                    {numDeslocacoes > 0 && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Info className="h-3 w-3 shrink-0" /> Com deslocações, CF incremental ignorado
                      </p>
                    )}
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span className={numDeslocacoes > 0 ? "line-through opacity-50" : ""}>
                        CF incremental
                        {results.heavyLoadComparison.optionUsed === "CF" && (
                          <span className="ml-1 text-[10px] bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-1.5 py-0.5 rounded-full">
                            ✅ Aplicada
                          </span>
                        )}
                      </span>
                      <span className={`font-medium text-foreground ${numDeslocacoes > 0 ? "line-through opacity-50" : ""}`}>{results.heavyLoadComparison.custoCFIncremental.toFixed(2)} €</span>
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

            <CostComparisonChart data={chartData} title="Comparação de Custos" />
          </div>
        </>
      )}
    </div>
  );
}
