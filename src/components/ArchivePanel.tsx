// IMPROVED: ArchivePanel component for viewing, managing, and exporting saved estimates
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, FileSpreadsheet, FileText, Archive, ArrowUpDown, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSimulatorState, type SavedEstimate } from "@/contexts/SimulatorStateContext";
import type { CargoLine } from "@/utils/costCalculations";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// IMPROVED: added individual fleet cost sort keys
type SortKey = "name" | "type" | "savedAt" | "route" | "weight" | "pombalense" | "fleet6t" | "fleet9t" | "fleet15t" | "cheapest";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function getRoute(e: SavedEstimate) {
  if (e.origin && e.destination) return `${e.origin} → ${e.destination}`;
  if (e.destination) return `Espinho → ${e.destination}`;
  return "—";
}

function getWeightOrMeters(e: SavedEstimate) {
  if (e.type === "polymers") return e.totalWeightTon ? `${e.totalWeightTon.toFixed(1)} ton` : "—";
  const parts: string[] = [];
  if (e.weightTon) parts.push(`${e.weightTon.toFixed(1)} ton`);
  if (e.totalMeters) parts.push(`${e.totalMeters.toFixed(1)} m`);
  return parts.length > 0 ? parts.join(" / ") : "—";
}

function getDateString() {
  return new Date().toISOString().slice(0, 10);
}

export function ArchivePanel() {
  // IMPROVED: loadingEstimates from Supabase
  const { savedEstimates, setSavedEstimates, loadingEstimates } = useSimulatorState();
  const [sortKey, setSortKey] = useState<SortKey>("savedAt");
  const [sortAsc, setSortAsc] = useState(false);
  // IMPROVED: detail dialog state
  const [detailEstimate, setDetailEstimate] = useState<SavedEstimate | null>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const sortFn = (a: SavedEstimate, b: SavedEstimate): number => {
    let va: string | number = "";
    let vb: string | number = "";
    switch (sortKey) {
      case "name": va = a.name; vb = b.name; break;
      case "type": va = a.type; vb = b.type; break;
      case "savedAt": va = a.savedAt; vb = b.savedAt; break;
      case "route": va = getRoute(a); vb = getRoute(b); break;
      case "weight": va = a.totalWeightTon ?? a.weightTon ?? 0; vb = b.totalWeightTon ?? b.weightTon ?? 0; break;
      case "pombalense": va = a.pombalenseTotalCost ?? 0; vb = b.pombalenseTotalCost ?? 0; break;
      // IMPROVED: sort by individual fleet costs
      case "fleet6t": va = a.fleet6tCost ?? 0; vb = b.fleet6tCost ?? 0; break;
      case "fleet9t": va = a.fleet9tCost ?? 0; vb = b.fleet9tCost ?? 0; break;
      case "fleet15t": va = a.fleet15tCost ?? 0; vb = b.fleet15tCost ?? 0; break;
      case "cheapest": va = a.cheapestOption ?? ""; vb = b.cheapestOption ?? ""; break;
    }
    const cmp = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
    return sortAsc ? cmp : -cmp;
  };

  const sorted = [...savedEstimates].sort(sortFn);

  const handleDelete = (id: string) => {
    setSavedEstimates(prev => prev.filter(e => e.id !== id));
  };

  const handleClearAll = () => {
    if (window.confirm("Tem a certeza que deseja limpar todo o arquivo?")) {
      setSavedEstimates([]);
    }
  };

  // IMPROVED: export to Excel using SheetJS
  const exportExcel = () => {
    const rows = sorted.map(e => ({
      Nome: e.name,
      Tipo: e.type === "polymers" ? "Polímeros" : "Construção",
      "Data/Hora": formatDate(e.savedAt),
      "Guardado por": e.savedBy ?? "—",
      Rota: getRoute(e),
      "Peso/Metros": getWeightOrMeters(e),
      "Pombalense (€)": e.pombalenseTotalCost?.toFixed(2) ?? "—",
      // IMPROVED: individual fleet cost columns
      "Frota 6t (€)": e.fleet6tCost?.toFixed(2) ?? "—",
      "Frota 9t (€)": e.fleet9tCost?.toFixed(2) ?? "—",
      "Frota 15t (€)": e.fleet15tCost?.toFixed(2) ?? "—",
      "Opção Mais Económica": e.cheapestOption ?? "—",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Estimativas");
    XLSX.writeFile(wb, `estimativas-frota-AGI-${getDateString()}.xlsx`);
  };

  // IMPROVED: export to PDF using jsPDF + autotable
  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("Simulador de Custos de Frota — AGI", 14, 15);
    doc.setFontSize(9);
    doc.text(`Exportado em: ${formatDate(new Date().toISOString())}`, 14, 22);

    const head = [["Nome", "Tipo", "Data/Hora", "Guardado por", "Rota", "Peso/Metros", "Pombalense (€)", "Frota 6t (€)", "Frota 9t (€)", "Frota 15t (€)", "Mais Económico"]];
    const body = sorted.map(e => [
      e.name,
      e.type === "polymers" ? "Polímeros" : "Construção",
      formatDate(e.savedAt),
      e.savedBy ?? "—",
      getRoute(e),
      getWeightOrMeters(e),
      e.pombalenseTotalCost?.toFixed(2) ?? "—",
      // IMPROVED: individual fleet cost columns in PDF
      e.fleet6tCost?.toFixed(2) ?? "—",
      e.fleet9tCost?.toFixed(2) ?? "—",
      e.fleet15tCost?.toFixed(2) ?? "—",
      e.cheapestOption ?? "—",
    ]);

    autoTable(doc, { head, body, startY: 28, styles: { fontSize: 8 }, headStyles: { fillColor: [41, 65, 148] } });
    doc.save(`estimativas-frota-AGI-${getDateString()}.pdf`);
  };

  const SortHeader = ({ label, sortKeyVal }: { label: string; sortKeyVal: SortKey }) => (
    <TableHead className="text-xs py-1 cursor-pointer select-none" onClick={() => handleSort(sortKeyVal)}>
      <span className="flex items-center gap-1">
        {label}
        <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
      </span>
    </TableHead>
  );

  // IMPROVED: show spinner while loading from Supabase
  if (loadingEstimates) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-2">
            <div className="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-muted border-t-primary" />
            <p className="text-sm text-muted-foreground">A carregar estimativas…</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (savedEstimates.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-2">
            <Archive className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhuma estimativa guardada.
            </p>
            <p className="text-xs text-muted-foreground">
              Simula e guarda resultados nos separadores Polímeros ou Construção.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // IMPROVED: compute average comparison between Pombalense and best fleet
  const comparableEstimates = savedEstimates.filter(e => {
    const hasPomb = e.pombalenseTotalCost != null && e.pombalenseTotalCost > 0;
    const hasFleet = (e.fleet6tCost != null && e.fleet6tCost > 0) ||
                     (e.fleet9tCost != null && e.fleet9tCost > 0) ||
                     (e.fleet15tCost != null && e.fleet15tCost > 0);
    return hasPomb && hasFleet;
  });

  const avgStats = (() => {
    if (comparableEstimates.length === 0) return null;
    let totalDiff = 0; // positive = fleet cheaper
    let pombWins = 0;
    let fleetWins = 0;
    comparableEstimates.forEach(e => {
      const pomb = e.pombalenseTotalCost!;
      const fleetCosts = [e.fleet6tCost, e.fleet9tCost, e.fleet15tCost].filter((c): c is number => c != null && c > 0);
      const bestFleet = Math.min(...fleetCosts);
      totalDiff += pomb - bestFleet;
      if (pomb < bestFleet) pombWins++;
      else if (bestFleet < pomb) fleetWins++;
    });
    const avgDiff = totalDiff / comparableEstimates.length;
    return { avgDiff, pombWins, fleetWins, total: comparableEstimates.length };
  })();

  return (
    <div className="space-y-4">
      {/* IMPROVED: Average comparison banner */}
      {avgStats && (
        <Card className={avgStats.avgDiff > 0 ? "border-blue-300 dark:border-blue-700" : "border-green-300 dark:border-green-700"}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center h-10 w-10 rounded-full ${avgStats.avgDiff > 0 ? "bg-blue-100 dark:bg-blue-900/50" : "bg-green-100 dark:bg-green-900/50"}`}>
                  <ArrowUpDown className={`h-5 w-5 ${avgStats.avgDiff > 0 ? "text-blue-600 dark:text-blue-400" : "text-green-600 dark:text-green-400"}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    {avgStats.avgDiff > 0
                      ? "Em média, a Frota Própria é mais económica"
                      : avgStats.avgDiff < 0
                        ? "Em média, a Pombalense é mais económica"
                        : "Em média, os custos são iguais"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Diferença média: <span className="font-medium">{Math.abs(avgStats.avgDiff).toFixed(2)} €</span> por estimativa
                    {" · "}Baseado em {avgStats.total} estimativa{avgStats.total > 1 ? "s" : ""} comparável{avgStats.total > 1 ? "is" : ""}
                  </p>
                </div>
              </div>
              <div className="flex gap-4 text-xs">
                <div className="text-center">
                  <span className="block text-lg font-bold text-green-600 dark:text-green-400">{avgStats.pombWins}</span>
                  <span className="text-muted-foreground">Pombalense</span>
                </div>
                <div className="text-center">
                  <span className="block text-lg font-bold text-blue-600 dark:text-blue-400">{avgStats.fleetWins}</span>
                  <span className="text-muted-foreground">Frota</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* IMPROVED: export buttons */}
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={exportExcel}>
            <FileSpreadsheet className="h-3 w-3 mr-1" /> Exportar Excel
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={exportPDF}>
            <FileText className="h-3 w-3 mr-1" /> Exportar PDF
          </Button>
        </div>
        <Button size="sm" variant="destructive" className="h-8 text-xs" onClick={handleClearAll}>
          <Trash2 className="h-3 w-3 mr-1" /> Limpar arquivo
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Archive className="h-4 w-4" />
            Estimativas Guardadas ({savedEstimates.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <Table>
            <TableHeader>
              <TableRow>
                <SortHeader label="Nome" sortKeyVal="name" />
                <SortHeader label="Tipo" sortKeyVal="type" />
                <SortHeader label="Data/Hora" sortKeyVal="savedAt" />
                {/* IMPROVED: new column for who saved the estimate */}
                <TableHead className="text-xs py-1">Guardado por</TableHead>
                <SortHeader label="Rota" sortKeyVal="route" />
                <SortHeader label="Peso/Metros" sortKeyVal="weight" />
                <SortHeader label="Pombalense (€)" sortKeyVal="pombalense" />
                {/* IMPROVED: individual fleet cost columns */}
                <SortHeader label="Frota 6t (€)" sortKeyVal="fleet6t" />
                <SortHeader label="Frota 9t (€)" sortKeyVal="fleet9t" />
                <SortHeader label="Frota 15t (€)" sortKeyVal="fleet15t" />
                <SortHeader label="Mais Económico" sortKeyVal="cheapest" />
                <TableHead className="w-10 py-1"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map(e => {
                // IMPROVED: highlight cheapest cost cell with green background
                const costs = [
                  { key: "pombalense", val: e.pombalenseTotalCost },
                  { key: "fleet6t", val: e.fleet6tCost },
                  { key: "fleet9t", val: e.fleet9tCost },
                  { key: "fleet15t", val: e.fleet15tCost },
                ].filter(c => c.val != null && c.val > 0);
                const minCost = costs.length > 0 ? Math.min(...costs.map(c => c.val!)) : null;
                const cheapestKey = costs.find(c => c.val === minCost)?.key;
                const greenCls = "bg-green-100 dark:bg-green-900/40";

                return (
                <TableRow key={e.id}>
                  <TableCell className="text-xs py-2 font-medium">{e.name}</TableCell>
                  <TableCell className="text-xs py-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {e.type === "polymers" ? "Polímeros" : "Construção"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs py-2">{formatDate(e.savedAt)}</TableCell>
                  {/* IMPROVED: display saved_by */}
                  <TableCell className="text-xs py-2">{e.savedBy ?? "—"}</TableCell>
                  <TableCell className="text-xs py-2">{getRoute(e)}</TableCell>
                  <TableCell className="text-xs py-2">{getWeightOrMeters(e)}</TableCell>
                  <TableCell className={`text-xs py-2 font-medium ${cheapestKey === "pombalense" ? greenCls : ""}`}>{e.pombalenseTotalCost?.toFixed(2) ?? "—"} €</TableCell>
                  <TableCell className={`text-xs py-2 ${cheapestKey === "fleet6t" ? greenCls : ""}`}>{e.fleet6tCost?.toFixed(2) ?? "—"} €</TableCell>
                  <TableCell className={`text-xs py-2 ${cheapestKey === "fleet9t" ? greenCls : ""}`}>{e.fleet9tCost?.toFixed(2) ?? "—"} €</TableCell>
                  <TableCell className={`text-xs py-2 ${cheapestKey === "fleet15t" ? greenCls : ""}`}>{e.fleet15tCost?.toFixed(2) ?? "—"} €</TableCell>
                  <TableCell className="text-xs py-2">
                    {e.cheapestOption === "Pombalense" ? (
                      <Badge className="text-[10px] bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-100">
                        Pombalense
                      </Badge>
                    ) : e.cheapestOption ? (
                      <Badge className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-100">
                        {e.cheapestOption}
                      </Badge>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="py-2">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDelete(e.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
