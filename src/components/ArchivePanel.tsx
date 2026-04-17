// IMPROVED: ArchivePanel component for viewing, managing, and exporting saved estimates
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, FileSpreadsheet, FileText, Archive, ArrowUpDown, Eye, Search } from "lucide-react";
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
  const [searchName, setSearchName] = useState("");
  const [filterType, setFilterType] = useState<"all" | "polymers" | "construction">("all");
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

  const filtered = savedEstimates.filter(e => {
    if (searchName && !e.name.toLowerCase().includes(searchName.toLowerCase())) return false;
    if (filterType !== "all" && e.type !== filterType) return false;
    return true;
  });
  const sorted = [...filtered].sort(sortFn);

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

  // IMPROVED: export to PDF with corporate cover, branded header/footer, styled table and summary
  const exportPDF = () => {
    // IMPROVED: corporate brand palette
    const BRAND = {
      navy: [22, 54, 92] as [number, number, number],
      blue: [41, 85, 148] as [number, number, number],
      lightBlue: [235, 242, 252] as [number, number, number],
      green: [39, 111, 57] as [number, number, number],
      lightGreen: [234, 248, 238] as [number, number, number],
      gray: [100, 100, 105] as [number, number, number],
      lightGray: [245, 245, 247] as [number, number, number],
      white: [255, 255, 255] as [number, number, number],
      black: [30, 30, 35] as [number, number, number],
    };

    const doc = new jsPDF({ orientation: "landscape" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const exportedAt = formatDate(new Date().toISOString());

    // IMPROVED: cover page
    doc.setFillColor(...BRAND.navy);
    doc.rect(0, 0, pageWidth, pageHeight, "F");
    // decorative block in lower third
    doc.setFillColor(...BRAND.blue);
    doc.rect(0, pageHeight * (2 / 3), pageWidth, pageHeight / 3, "F");

    doc.setTextColor(...BRAND.white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(48);
    doc.text("AGI", pageWidth / 2, pageHeight / 3, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(22);
    doc.text("Simulador de Custos de Frota", pageWidth / 2, pageHeight / 3 + 14, { align: "center" });

    // separator line
    doc.setDrawColor(...BRAND.white);
    doc.setLineWidth(0.5);
    const lineW = pageWidth * 0.6;
    doc.line((pageWidth - lineW) / 2, pageHeight / 3 + 22, (pageWidth + lineW) / 2, pageHeight / 3 + 22);

    doc.setTextColor(...BRAND.lightBlue);
    doc.setFontSize(16);
    doc.text("Arquivo de Estimativas", pageWidth / 2, pageHeight / 3 + 32, { align: "center" });

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text(`Exportado em: ${exportedAt}`, pageWidth / 2, pageHeight / 3 + 42, { align: "center" });

    doc.setFontSize(11);
    doc.text(`${sorted.length} estimativa${sorted.length !== 1 ? "s" : ""} exportada${sorted.length !== 1 ? "s" : ""}`, pageWidth / 2, pageHeight - 20, { align: "center" });

    doc.addPage();

    // IMPROVED: per-page header/footer hook
    const drawHeaderFooter = () => {
      // header
      doc.setFillColor(...BRAND.navy);
      doc.rect(0, 0, pageWidth, 14, "F");
      doc.setTextColor(...BRAND.white);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("AGI — Simulador de Custos de Frota", 10, 9);
      doc.text("Arquivo de Estimativas", pageWidth - 10, 9, { align: "right" });
      doc.setDrawColor(...BRAND.blue);
      doc.setLineWidth(0.5);
      doc.line(0, 14, pageWidth, 14);

      // footer
      doc.setDrawColor(...BRAND.blue);
      doc.setLineWidth(0.5);
      doc.line(0, pageHeight - 12, pageWidth, pageHeight - 12);
      doc.setTextColor(...BRAND.gray);
      doc.setFontSize(8);
      doc.text(`Exportado em: ${exportedAt}`, 10, pageHeight - 5);
      const pageNum = (doc as any).internal.getCurrentPageInfo().pageNumber;
      const totalPages = doc.internal.getNumberOfPages();
      doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth - 10, pageHeight - 5, { align: "right" });
    };

    const head = [["Nome", "Tipo", "Data", "Rota", "Peso", "Pombalense", "Frota 6t", "Frota 9t", "Frota 15t", "Mais económico"]];
    const body = sorted.map(e => [
      e.name,
      e.type === "polymers" ? "Polímeros" : "Construção",
      formatDate(e.savedAt),
      getRoute(e),
      getWeightOrMeters(e),
      e.pombalenseTotalCost != null ? `${e.pombalenseTotalCost.toFixed(2)} €` : "—",
      e.fleet6tCost != null ? `${e.fleet6tCost.toFixed(2)} €` : "—",
      e.fleet9tCost != null ? `${e.fleet9tCost.toFixed(2)} €` : "—",
      e.fleet15tCost != null ? `${e.fleet15tCost.toFixed(2)} €` : "—",
      e.cheapestOption ?? "—",
    ]);

    autoTable(doc, {
      startY: 20,
      margin: { top: 20, bottom: 16 },
      head,
      body,
      theme: "plain",
      headStyles: {
        fillColor: BRAND.navy,
        textColor: BRAND.white,
        fontSize: 8,
        fontStyle: "bold",
        cellPadding: { top: 5, bottom: 5, left: 4, right: 4 },
        halign: "left",
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 20 },
        2: { cellWidth: 24 },
        3: { cellWidth: 34 },
        4: { cellWidth: 20 },
        5: { cellWidth: 22, halign: "right" },
        6: { cellWidth: 18, halign: "right" },
        7: { cellWidth: 18, halign: "right" },
        8: { cellWidth: 18, halign: "right" },
        9: { cellWidth: 22 },
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: { top: 4, bottom: 4, left: 4, right: 4 },
        textColor: BRAND.black,
      },
      alternateRowStyles: {
        fillColor: BRAND.lightGray,
      },
      didParseCell: (data) => {
        if (data.section === "body") {
          const e = sorted[data.row.index];
          if (!e) return;
          const costs = [
            { val: e.pombalenseTotalCost, col: 5 },
            { val: e.fleet6tCost, col: 6 },
            { val: e.fleet9tCost, col: 7 },
            { val: e.fleet15tCost, col: 8 },
          ].filter(c => c.val != null && c.val > 0) as { val: number; col: number }[];
          if (costs.length > 0) {
            const minVal = Math.min(...costs.map(c => c.val));
            const cheapCol = costs.find(c => c.val === minVal);
            if (cheapCol && data.column.index === cheapCol.col) {
              data.cell.styles.fillColor = BRAND.lightGreen;
              data.cell.styles.textColor = BRAND.green;
              data.cell.styles.fontStyle = "bold";
            }
          }
          if (data.column.index === 9) {
            if (e.cheapestOption === "Pombalense") {
              data.cell.styles.textColor = BRAND.green;
              data.cell.styles.fontStyle = "bold";
            } else if (e.cheapestOption) {
              data.cell.styles.textColor = BRAND.blue;
              data.cell.styles.fontStyle = "bold";
            }
          }
        }
      },
      didDrawPage: () => {
        drawHeaderFooter();
      },
    });

    // IMPROVED: summary page
    doc.addPage();
    drawHeaderFooter();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...BRAND.navy);
    doc.text("Sumário", 14, 25);
    doc.setDrawColor(...BRAND.blue);
    doc.setLineWidth(0.5);
    doc.line(14, 28, pageWidth - 14, 28);

    // Stats
    const polyCount = sorted.filter(e => e.type === "polymers").length;
    const conCount = sorted.filter(e => e.type === "construction").length;
    let pombWins = 0;
    let fleetWins = 0;
    sorted.forEach(e => {
      if (e.cheapestOption === "Pombalense") pombWins++;
      else if (e.cheapestOption) fleetWins++;
    });

    const metrics: { label: string; value: string }[] = [
      { label: "Total de estimativas", value: String(sorted.length) },
      { label: "Polímeros / Construção", value: `${polyCount} / ${conCount}` },
      { label: "Pombalense mais económica", value: String(pombWins) },
      { label: "Frota própria mais económica", value: String(fleetWins) },
    ];

    const gridX = 14;
    const gridY = 36;
    const cellW = (pageWidth - 28 - 8) / 2;
    const cellH = 26;
    metrics.forEach((m, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = gridX + col * (cellW + 8);
      const y = gridY + row * (cellH + 6);
      doc.setFillColor(...BRAND.lightGray);
      doc.roundedRect(x, y, cellW, cellH, 3, 3, "F");
      doc.setTextColor(...BRAND.gray);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(m.label, x + 5, y + 9);
      doc.setTextColor(...BRAND.navy);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(m.value, x + 5, y + 20);
    });

    // Average per type table
    const types: Array<{ key: "polymers" | "construction"; label: string }> = [
      { key: "polymers", label: "Polímeros" },
      { key: "construction", label: "Construção" },
    ];
    const avgRows = types.map(t => {
      const items = sorted.filter(e => e.type === t.key);
      const pombs = items.map(e => e.pombalenseTotalCost).filter((v): v is number => v != null && v > 0);
      const bestFleets = items
        .map(e => {
          const fc = [e.fleet6tCost, e.fleet9tCost, e.fleet15tCost].filter((v): v is number => v != null && v > 0);
          return fc.length > 0 ? Math.min(...fc) : null;
        })
        .filter((v): v is number => v != null);
      const avgPomb = pombs.length > 0 ? pombs.reduce((a, b) => a + b, 0) / pombs.length : null;
      const avgFleet = bestFleets.length > 0 ? bestFleets.reduce((a, b) => a + b, 0) / bestFleets.length : null;
      return [
        t.label,
        avgPomb != null ? `${avgPomb.toFixed(2)} €` : "—",
        avgFleet != null ? `${avgFleet.toFixed(2)} €` : "—",
      ];
    });

    autoTable(doc, {
      startY: gridY + cellH * 2 + 6 + 10,
      margin: { left: 14, right: 14, bottom: 16 },
      head: [["Tipo", "Custo médio Pombalense", "Custo médio melhor frota"]],
      body: avgRows,
      theme: "plain",
      headStyles: {
        fillColor: BRAND.navy,
        textColor: BRAND.white,
        fontSize: 9,
        fontStyle: "bold",
        cellPadding: 4,
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 4,
        textColor: BRAND.black,
      },
      alternateRowStyles: { fillColor: BRAND.lightGray },
      didDrawPage: () => {
        drawHeaderFooter();
      },
    });

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

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nome..."
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
            className="h-8 text-xs pl-8"
          />
        </div>
        <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
          <SelectTrigger className="h-8 text-xs w-[140px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="polymers">Polímeros</SelectItem>
            <SelectItem value="construction">Construção</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Archive className="h-4 w-4" />
            Estimativas Guardadas ({filtered.length}{filtered.length !== savedEstimates.length ? ` de ${savedEstimates.length}` : ""})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <Table>
            <TableHeader>
              <TableRow>
                <SortHeader label="Nº Viagem" sortKeyVal="name" />
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
                <TableHead className="text-xs py-1">Opção Realizada</TableHead>
                <TableHead className="w-10 py-1"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map(e => {
                // IMPROVED: use stored warnings for fleet inviability
                const costs = [
                  { key: "pombalense", val: e.pombalenseTotalCost },
                  { key: "fleet6t", val: e.fleet6tCost },
                  { key: "fleet9t", val: e.fleet9tCost },
                  { key: "fleet15t", val: e.fleet15tCost },
                ].filter(c => c.val != null && c.val > 0);
                const minCost = costs.length > 0 ? Math.min(...costs.map(c => c.val!)) : null;
                const cheapestKey = costs.find(c => c.val === minCost)?.key;
                const greenCls = "bg-green-100 dark:bg-green-900/40";
                const excessiveCls = "text-destructive font-medium";

                const extraRate = e.extraRateApplied ?? 0;
                const baseValue = (val: number) => extraRate > 0 ? val / (1 + extraRate / 100) : null;

                const renderFleetCell = (cost: number | undefined, warning: string | undefined, key: string) => {
                  if (warning) {
                    return <TableCell className={`text-xs py-2 ${excessiveCls}`}>{warning}</TableCell>;
                  }
                  if (cost != null) {
                    const base = baseValue(cost);
                    return (
                      <TableCell className={`text-xs py-2 ${cheapestKey === key ? greenCls : ""}`}>
                        {cost.toFixed(2)} €
                        {base != null && <span className="block text-[10px] text-muted-foreground">({base.toFixed(2)} €)</span>}
                      </TableCell>
                    );
                  }
                  return <TableCell className="text-xs py-2">—</TableCell>;
                };

                return (
                <TableRow key={e.id}>
                  <TableCell className="text-xs py-2 font-medium">{e.name}</TableCell>
                  <TableCell className="text-xs py-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {e.type === "polymers" ? "Polímeros" : "Construção"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs py-2">{formatDate(e.savedAt)}</TableCell>
                  <TableCell className="text-xs py-2">{e.savedBy ?? "—"}</TableCell>
                  <TableCell className="text-xs py-2">{getRoute(e)}</TableCell>
                  <TableCell className="text-xs py-2">{getWeightOrMeters(e)}</TableCell>
                  <TableCell className={`text-xs py-2 font-medium ${cheapestKey === "pombalense" ? greenCls : ""}`}>
                    {e.pombalenseTotalCost?.toFixed(2) ?? "—"} €
                    {e.pombalenseTotalCost != null && extraRate > 0 && (
                      <span className="block text-[10px] text-muted-foreground font-normal">({baseValue(e.pombalenseTotalCost)?.toFixed(2)} €)</span>
                    )}
                  </TableCell>
                  {renderFleetCell(e.fleet6tCost, e.fleet6tWarning, "fleet6t")}
                  {renderFleetCell(e.fleet9tCost, e.fleet9tWarning, "fleet9t")}
                  {renderFleetCell(e.fleet15tCost, e.fleet15tWarning, "fleet15t")}
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
                  <TableCell className="text-xs py-2">{e.chosenOption ?? "—"}</TableCell>
                  <TableCell className="py-2 flex gap-1">
                    {/* IMPROVED: detail view button */}
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setDetailEstimate(e)}>
                      <Eye className="h-3 w-3 text-muted-foreground" />
                    </Button>
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

      {/* IMPROVED: detail popup for estimate */}
      <Dialog open={!!detailEstimate} onOpenChange={(open) => { if (!open) setDetailEstimate(null); }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">Detalhe — {detailEstimate?.name}</DialogTitle>
          </DialogHeader>
          {detailEstimate && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <DetailRow label="Tipo" value={detailEstimate.type === "polymers" ? "Polímeros" : "Construção"} />
                <DetailRow label="Data/Hora" value={formatDate(detailEstimate.savedAt)} />
                <DetailRow label="Guardado por" value={detailEstimate.savedBy ?? "Anónimo"} />
                <DetailRow label="Origem" value={detailEstimate.origin ?? "—"} />
                <DetailRow label="Destino" value={detailEstimate.destination ?? "—"} />
                <DetailRow label="Km totais" value={detailEstimate.totalKm != null ? `${detailEstimate.totalKm} km` : "—"} />
                <DetailRow label="Peso total" value={detailEstimate.totalWeightTon != null ? `${detailEstimate.totalWeightTon.toFixed(2)} ton` : detailEstimate.weightTon != null ? `${detailEstimate.weightTon.toFixed(2)} ton` : "—"} />
                {detailEstimate.totalMeters != null && <DetailRow label="Metros totais" value={`${detailEstimate.totalMeters.toFixed(1)} m`} />}
                {detailEstimate.largestPlateLabel && <DetailRow label="Maior placa" value={detailEstimate.largestPlateLabel} />}
                <DetailRow label="Nº deslocações" value={detailEstimate.numFreights != null ? String(detailEstimate.numFreights) : "—"} />
                {detailEstimate.extraRateApplied != null && detailEstimate.extraRateApplied > 0 && (
                  <DetailRow label="Taxa extra aplicada" value={`${detailEstimate.extraRateApplied}%`} />
                )}
                {detailEstimate.chosenOption && (
                  <DetailRow label="Opção realizada" value={detailEstimate.chosenOption} />
                )}
              </div>

              {/* Cargo lines detail */}
              {detailEstimate.cargoLines && (detailEstimate.cargoLines as CargoLine[]).length > 0 && (
                <div>
                  <p className="font-semibold text-xs mb-1">Linhas de carga ({(detailEstimate.cargoLines as CargoLine[]).length})</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs py-1">Cliente</TableHead>
                        <TableHead className="text-xs py-1">Tipo</TableHead>
                        <TableHead className="text-xs py-1 text-right">Paletes</TableHead>
                        <TableHead className="text-xs py-1 text-right">Peso (ton)</TableHead>
                        <TableHead className="text-xs py-1 text-right">Comp. (m)</TableHead>
                        <TableHead className="text-xs py-1 text-right">Placas</TableHead>
                        <TableHead className="text-xs py-1">Sobreponível</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(detailEstimate.cargoLines as CargoLine[]).map((line, i) => {
                        const typeLabel = line.cargoType === "polymers" ? "Polímeros" : line.cargoType === "equipment" ? "Equipamentos" : line.cargoType === "construction" ? "Construção" : line.cargoType ?? "—";
                        return (
                          <TableRow key={i}>
                            <TableCell className="text-xs py-1">{line.client || "—"}</TableCell>
                            <TableCell className="text-xs py-1">{typeLabel}</TableCell>
                            <TableCell className="text-xs py-1 text-right">{line.cargoType !== "construction" ? (line.numPallets ?? "—") : "—"}</TableCell>
                            <TableCell className="text-xs py-1 text-right">{line.weightTon != null ? line.weightTon.toFixed(2) : "—"}</TableCell>
                            <TableCell className="text-xs py-1 text-right">{line.lengthMeters != null && line.lengthMeters > 0 ? line.lengthMeters.toFixed(1) : "—"}</TableCell>
                            <TableCell className="text-xs py-1 text-right">{line.numPlates != null && line.numPlates > 0 ? line.numPlates : "—"}</TableCell>
                            <TableCell className="text-xs py-1">{line.cargoType === "equipment" ? (line.stackable ? "Sim" : "Não") : "—"}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Cost summary */}
              <div>
                <p className="font-semibold text-xs mb-1">Custos</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <DetailRow label="Pombalense" value={detailEstimate.pombalenseTotalCost != null ? `${detailEstimate.pombalenseTotalCost.toFixed(2)} €` : detailEstimate.constructionPombalenseCost != null ? `${detailEstimate.constructionPombalenseCost.toFixed(2)} €` : "—"} />
                  <DetailRow label="Frota 6t" value={detailEstimate.fleet6tCost != null ? `${detailEstimate.fleet6tCost.toFixed(2)} €` : "—"} />
                  <DetailRow label="Frota 9t" value={detailEstimate.fleet9tCost != null ? `${detailEstimate.fleet9tCost.toFixed(2)} €` : "—"} />
                  <DetailRow label="Frota 15t" value={detailEstimate.fleet15tCost != null ? `${detailEstimate.fleet15tCost.toFixed(2)} €` : "—"} />
                  <DetailRow label="Mais económico" value={detailEstimate.cheapestOption ?? "—"} />
                </div>
              </div>

              {detailEstimate.observations && (
                <div>
                  <p className="font-semibold text-xs mb-1">Observações</p>
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">{detailEstimate.observations}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// IMPROVED: helper component for detail rows
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </>
  );
}
