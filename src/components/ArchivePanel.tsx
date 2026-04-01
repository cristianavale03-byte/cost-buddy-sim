// IMPROVED: ArchivePanel component for viewing, managing, and exporting saved estimates
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, FileSpreadsheet, FileText, Archive, ArrowUpDown } from "lucide-react";
import { useSimulatorState, type SavedEstimate } from "@/contexts/SimulatorStateContext";
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
  const { savedEstimates, setSavedEstimates } = useSimulatorState();
  const [sortKey, setSortKey] = useState<SortKey>("savedAt");
  const [sortAsc, setSortAsc] = useState(false);

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

    const head = [["Nome", "Tipo", "Data/Hora", "Rota", "Peso/Metros", "Pombalense (€)", "Frota 6t (€)", "Frota 9t (€)", "Frota 15t (€)", "Mais Económico"]];
    const body = sorted.map(e => [
      e.name,
      e.type === "polymers" ? "Polímeros" : "Construção",
      formatDate(e.savedAt),
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

  if (savedEstimates.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-2">
            <Archive className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhuma estimativa guardada nesta sessão.
            </p>
            <p className="text-xs text-muted-foreground">
              Simula e guarda resultados nos separadores Polímeros ou Construção.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
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
              {sorted.map(e => (
                <TableRow key={e.id}>
                  <TableCell className="text-xs py-2 font-medium">{e.name}</TableCell>
                  <TableCell className="text-xs py-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {e.type === "polymers" ? "Polímeros" : "Construção"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs py-2">{formatDate(e.savedAt)}</TableCell>
                  <TableCell className="text-xs py-2">{getRoute(e)}</TableCell>
                  <TableCell className="text-xs py-2">{getWeightOrMeters(e)}</TableCell>
                  <TableCell className="text-xs py-2 font-medium">{e.pombalenseTotalCost?.toFixed(2) ?? "—"} €</TableCell>
                  <TableCell className="text-xs py-2">
                    {e.bestFleetOption ? (
                      <span>{e.bestFleetOption} ({e.bestFleetCost?.toFixed(2)} €)</span>
                    ) : "—"}
                  </TableCell>
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
