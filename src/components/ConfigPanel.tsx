import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Info, Upload, RotateCcw, AlertTriangle, CheckCircle2, FileText } from "lucide-react";
import { fleetVehicles, cfZones, ccPrices, dimensionTypes, deliveryCostPerEntry, transferCosts, type CFZone, type CCPriceEntry } from "@/data/fleetData";
import { usePombalenseExtraRate } from "@/hooks/usePombalenseExtraRate";
// IMPROVED: PDF upload + price-table overrides
import { usePriceTableOverrides } from "@/hooks/usePriceTableOverrides";
import { parseCFTableFromPDF, parseCCTableFromPDF } from "@/utils/pdfParser";

type CFParseResult = { zones: CFZone[]; warnings: string[] } | null;
type CCParseResult = { entries: CCPriceEntry[]; warnings: string[] } | null;

export function ConfigPanel() {
  const [selectedOrigin, setSelectedOrigin] = useState("1");
  // IMPROVED: loadingRate from Supabase
  const { rate: extraRate, setRate: setExtraRate, loadingRate } = usePombalenseExtraRate();

  // IMPROVED: PDF upload state
  const { cfOverride, ccOverride, setCFOverride, setCCOverride, clearOverrides } = usePriceTableOverrides();
  const cfFileRef = useRef<HTMLInputElement>(null);
  const ccFileRef = useRef<HTMLInputElement>(null);
  const [cfProcessing, setCfProcessing] = useState(false);
  const [ccProcessing, setCcProcessing] = useState(false);
  const [cfParse, setCfParse] = useState<CFParseResult>(null);
  const [ccParse, setCcParse] = useState<CCParseResult>(null);

  const handleCFFile = async (file: File) => {
    setCfProcessing(true);
    setCfParse(null);
    try {
      const result = await parseCFTableFromPDF(file);
      setCfParse(result);
    } finally {
      setCfProcessing(false);
    }
  };

  const handleCCFile = async (file: File) => {
    setCcProcessing(true);
    setCcParse(null);
    try {
      const result = await parseCCTableFromPDF(file);
      setCcParse(result);
    } finally {
      setCcProcessing(false);
    }
  };

  const filteredZones = cfZones.filter(z => z.originId === Number(selectedOrigin));

  return (
    <div className="space-y-6">
      {/* IMPROVED: PDF upload to update CF/CC price tables */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="h-4 w-4" /> Atualizar Tabelas de Preços
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* === CF block === */}
          <div className="space-y-3 border-b pb-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-sm font-semibold">Tabela CF (Carga Fracionada)</h4>
              {cfOverride && (
                <Badge variant="default" className="bg-green-600 hover:bg-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Tabela CF atualizada ({cfOverride.length} zonas)
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                ref={cfFileRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleCFFile(f);
                  e.target.value = "";
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => cfFileRef.current?.click()}
                disabled={cfProcessing}
              >
                <FileText className="h-4 w-4 mr-1" />
                {cfProcessing ? "A processar PDF..." : "Carregar PDF CF"}
              </Button>
              {cfOverride && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { clearOverrides("cf"); setCfParse(null); }}
                >
                  <RotateCcw className="h-4 w-4 mr-1" /> Repor tabela original
                </Button>
              )}
            </div>

            {cfParse && (
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>{cfParse.zones.length}</strong> zonas extraídas
                </p>
                {cfParse.zones.length > 0 && (
                  <ul className="text-xs text-muted-foreground space-y-1 max-h-40 overflow-auto border rounded p-2">
                    {cfParse.zones.map((z, i) => (
                      <li key={i}>
                        <span className="font-medium">{z.zoneName}</span> — {z.prices.length} entradas
                        {z.beyondTenTonPerTon ? ` · além 10t: ${z.beyondTenTonPerTon}€/ton` : ""}
                      </li>
                    ))}
                  </ul>
                )}
                {cfParse.warnings.length > 0 && (
                  <div className="border border-amber-400 bg-amber-50 dark:bg-amber-950/20 rounded p-2 text-xs space-y-1">
                    <p className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Avisos de parse — verifica estes dados antes de confirmar
                    </p>
                    <ul className="list-disc list-inside text-amber-800 dark:text-amber-300">
                      {cfParse.warnings.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                )}
                {cfParse.zones.length > 0 && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setCFOverride(cfParse.zones);
                      setCfParse(null);
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Confirmar e aplicar
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* === CC block === */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-sm font-semibold">Tabela CC (Construção)</h4>
              {ccOverride && (
                <Badge variant="default" className="bg-green-600 hover:bg-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Tabela CC atualizada ({ccOverride.length} destinos)
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                ref={ccFileRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleCCFile(f);
                  e.target.value = "";
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => ccFileRef.current?.click()}
                disabled={ccProcessing}
              >
                <FileText className="h-4 w-4 mr-1" />
                {ccProcessing ? "A processar PDF..." : "Carregar PDF CC"}
              </Button>
              {ccOverride && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { clearOverrides("cc"); setCcParse(null); }}
                >
                  <RotateCcw className="h-4 w-4 mr-1" /> Repor tabela original
                </Button>
              )}
            </div>

            {ccParse && (
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>{ccParse.entries.length}</strong> destinos extraídos
                </p>
                {ccParse.entries.length > 0 && (
                  <ul className="text-xs text-muted-foreground space-y-1 border rounded p-2">
                    {ccParse.entries.slice(0, 5).map((e, i) => (
                      <li key={i}>
                        <span className="font-medium">{e.destination}</span>
                        {e.chapas2x1 ? ` · 2×1: ${e.chapas2x1}€` : ""}
                        {e.chapas3x2 ? ` · 3×2: ${e.chapas3x2}€` : ""}
                        {e.threeAxle ? ` · 3Eixos: ${e.threeAxle}€` : ""}
                        {e.trailer ? ` · Reb: ${e.trailer}€` : ""}
                      </li>
                    ))}
                    {ccParse.entries.length > 5 && (
                      <li className="italic">… e mais {ccParse.entries.length - 5} destinos</li>
                    )}
                  </ul>
                )}
                {ccParse.warnings.length > 0 && (
                  <div className="border border-amber-400 bg-amber-50 dark:bg-amber-950/20 rounded p-2 text-xs space-y-1">
                    <p className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Avisos de parse — verifica estes dados antes de confirmar
                    </p>
                    <ul className="list-disc list-inside text-amber-800 dark:text-amber-300">
                      {ccParse.warnings.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                )}
                {ccParse.entries.length > 0 && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setCCOverride(ccParse.entries);
                      setCcParse(null);
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Confirmar e aplicar
                  </Button>
                )}
              </div>
            )}
          </div>

          <p className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-1 border-t pt-3">
            <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
            <span>O parse automático de PDF pode conter erros. Verifica sempre os avisos antes de confirmar. Em caso de dúvida, repõe a tabela original.</span>
          </p>
        </CardContent>
      </Card>

      {/* IMPROVED: Pombalense extra rate config */}
      <Card>
        <CardHeader>
        <CardTitle className="text-lg">Taxa Extra Transporte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-3">
            <Label htmlFor="extra-rate" className="whitespace-nowrap">Taxa extra (%)</Label>
            {/* IMPROVED: disable input while loading from Supabase */}
            <Input
              id="extra-rate"
              type="number"
              value={loadingRate ? "" : (extraRate || "")}
              onChange={e => setExtraRate(Math.max(0, Number(e.target.value)))}
              placeholder={loadingRate ? "A carregar..." : "0"}
              className="w-24"
              min={0}
              step={0.5}
              disabled={loadingRate}
            />
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Info className="h-3 w-3" /> Aplica-se aos custos da Pombalense e da frota interna. As deslocações extras (25 €/deslocação) não são afetadas.
          </p>
        </CardContent>
      </Card>

      {/* Fleet costs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Custos Frota Própria</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Veículo</TableHead>
                <TableHead className="text-right">€/km</TableHead>
                <TableHead className="text-right">Capacidade (ton)</TableHead>
                <TableHead className="text-right">Capacidade (m)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fleetVehicles.map((v) => (
                <TableRow key={v.name}>
                  <TableCell className="font-medium">{v.name}</TableCell>
                  <TableCell className="text-right">{v.costPerKm.toFixed(6)} €</TableCell>
                  <TableCell className="text-right">{v.capacityTon} t</TableCell>
                  <TableCell className="text-right">{v.capacityMeters} m</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* CF Price tables by origin */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tabela CF Pombalense (Carga Fracionada por peso)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Origem:</span>
            <Select value={selectedOrigin} onValueChange={setSelectedOrigin}>
              <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Gulpilhares/Espinho</SelectItem>
                <SelectItem value="2">Meirinhas</SelectItem>
                <SelectItem value="3">Maia</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {filteredZones.map((zone) => (
            <div key={zone.zoneId} className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">{zone.zoneName}</h4>
              <p className="text-xs text-muted-foreground">
                Destinos: {zone.destinations.join(", ")}
              </p>
              <div className="max-h-[250px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Até (kg)</TableHead>
                      <TableHead className="text-right">Custo (€)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {zone.prices.map((p) => (
                      <TableRow key={p.kgUpTo}>
                        <TableCell>{p.kgUpTo.toLocaleString("pt-PT")} kg</TableCell>
                        <TableCell className="text-right">{p.cost.toFixed(2)} €</TableCell>
                      </TableRow>
                    ))}
                    {zone.beyondTenTonPerTon && (
                      <TableRow>
                        <TableCell className="font-medium">Além de 10 Ton.</TableCell>
                        <TableCell className="text-right">{zone.beyondTenTonPerTon.toFixed(2)} €/ton</TableCell>
                      </TableRow>
                    )}
                    {zone.fullLoadPrices && (
                      <>
                        {zone.fullLoadPrices.threeAxle && (
                          <TableRow>
                            <TableCell className="font-medium">3 Eixos</TableCell>
                            <TableCell className="text-right">{zone.fullLoadPrices.threeAxle.toFixed(2)} €</TableCell>
                          </TableRow>
                        )}
                        {zone.fullLoadPrices.trailer && (
                          <TableRow>
                            <TableCell className="font-medium">Reboque</TableCell>
                            <TableCell className="text-right">{zone.fullLoadPrices.trailer.toFixed(2)} €</TableCell>
                          </TableRow>
                        )}
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* CC Construction prices */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tabela CC Pombalense (Cargas Completas — Construção)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-2">
            {ccPrices.length} destinos com preços por tipo de chapa. Vigência: 01/02/2026.
          </p>
          <div className="max-h-[500px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background">Destino</TableHead>
                  {dimensionTypes.map((d) => (
                    <TableHead key={d.label} className="text-right text-xs">{d.label}</TableHead>
                  ))}
                  <TableHead className="text-right text-xs">3 Eixos</TableHead>
                  <TableHead className="text-right text-xs">Reboque</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ccPrices.map((p) => (
                  <TableRow key={p.destination}>
                    <TableCell className="font-medium sticky left-0 bg-background text-xs">{p.destination}</TableCell>
                    <TableCell className="text-right text-xs">{p.chapas2x1 ? `${p.chapas2x1} €` : "-"}</TableCell>
                    <TableCell className="text-right text-xs">{p.chapas3x2 ? `${p.chapas3x2} €` : "-"}</TableCell>
                    <TableCell className="text-right text-xs">{p.chapas4a6 ? `${p.chapas4a6} €` : "-"}</TableCell>
                    <TableCell className="text-right text-xs">{p.chapas7a8 ? `${p.chapas7a8} €` : "-"}</TableCell>
                    <TableCell className="text-right text-xs">{p.threeAxle ? `${p.threeAxle} €` : "-"}</TableCell>
                    <TableCell className="text-right text-xs">{p.trailer ? `${p.trailer} €` : "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dimension types */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tipos de Dimensão (Construção)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Metros</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dimensionTypes.map((d) => (
                <TableRow key={d.label}>
                  <TableCell className="font-medium">{d.label}</TableCell>
                  <TableCell className="text-right">{d.meters} m</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Transfer costs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Custos de Transferência Interna</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>De</TableHead>
                <TableHead>Para</TableHead>
                <TableHead className="text-right">Custo (€)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transferCosts.map((t) => (
                <TableRow key={`${t.from}-${t.to}`}>
                  <TableCell>{t.from}</TableCell>
                  <TableCell>{t.to}</TableCell>
                  <TableCell className="text-right">{t.cost.toFixed(2)} €</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              {/* IMPROVED: renamed to "deslocação" */}
              <span className="text-muted-foreground">Custo por deslocação interna (cliente excedente)</span>
              <span className="font-medium">{deliveryCostPerEntry} €</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
