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
