// IMPROVED: PDF parser for CF and CC price tables
import { pdfjsLib } from "@/lib/pdfWorker";
import type { CFZone, CCPriceEntry } from "@/data/fleetData";

// Extract raw text per page from PDF
async function extractPagesText(file: File): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((it: any) => (typeof it.str === "string" ? it.str : ""))
      .join(" ");
    pages.push(text);
  }
  return pages;
}

// Parse Portuguese number "1.234,56" or "1234,56" or "1234.56" → number
function parseNum(raw: string): number | null {
  if (!raw) return null;
  let s = raw.trim().replace(/\s/g, "").replace(/€/g, "");
  // remove thousand separators "."
  if (/,\d{1,2}$/.test(s)) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    s = s.replace(/,/g, "");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// IMPROVED: parse CF (Carga Fracionada) table from PDF
export async function parseCFTableFromPDF(
  file: File
): Promise<{ zones: CFZone[]; warnings: string[] }> {
  const warnings: string[] = [];
  const zones: CFZone[] = [];

  try {
    const pages = await extractPagesText(file);
    const fullText = pages.join("\n");

    // Split by "Zona" markers
    const zoneChunks = fullText.split(/(?=Zona\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/i);
    let zoneIdCounter = 1;

    for (const chunk of zoneChunks) {
      if (!/Zona/i.test(chunk)) continue;

      // Origin
      const originMatch = chunk.match(/Origem[:\s]+([A-Za-zÀ-ÿ\/\s]+?)(?=\s{2,}|Zona|$)/i);
      const originName = originMatch ? originMatch[1].trim() : "Desconhecida";

      // Zone name
      const zoneNameMatch = chunk.match(/Zona\s+([^\n]+?)(?=Destinos|kg|Origem|$)/i);
      const zoneName = zoneNameMatch ? zoneNameMatch[1].trim().slice(0, 120) : `Zona ${zoneIdCounter}`;

      // Destinations
      const destMatch = chunk.match(/Destinos?[:\s]+([^\n]+?)(?=kg|At[éee]|$)/i);
      const destinations = destMatch
        ? destMatch[1].split(/[,;]/).map(d => d.trim()).filter(Boolean)
        : [];

      // Price entries: pattern like "510 kg 80,00" or "510 80,00"
      const priceRegex = /(\d{2,5})\s*kg[^\d]+(\d{1,3}(?:[.,]\d{2})?)/gi;
      const prices: { kgUpTo: number; cost: number }[] = [];
      let m: RegExpExecArray | null;
      while ((m = priceRegex.exec(chunk)) !== null) {
        const kg = parseInt(m[1], 10);
        const cost = parseNum(m[2]);
        if (kg > 0 && cost !== null && cost > 0) {
          prices.push({ kgUpTo: kg, cost });
        }
      }

      // Beyond 10 ton
      let beyondTenTonPerTon: number | undefined;
      const beyondMatch = chunk.match(/Al[éee]m\s+de\s+10\s*Ton[^\d]+(\d{1,3}(?:[.,]\d{2})?)/i);
      if (beyondMatch) {
        const v = parseNum(beyondMatch[1]);
        if (v) beyondTenTonPerTon = v;
      }

      if (prices.length < 3) {
        warnings.push(`Zona "${zoneName}" ignorada: apenas ${prices.length} entradas de preço extraídas.`);
        continue;
      }

      zones.push({
        originId: zoneIdCounter,
        originName,
        zoneId: zoneIdCounter,
        zoneName,
        destinations,
        minKg: prices[0]?.kgUpTo ?? 0,
        prices,
        beyondTenTonPerTon,
      });
      zoneIdCounter++;
    }

    if (zones.length === 0) {
      warnings.push("Nenhuma zona CF foi reconhecida no PDF. Verifica o formato do documento.");
    }
  } catch (e: any) {
    warnings.push(`Erro a processar PDF: ${e?.message ?? "desconhecido"}`);
  }

  return { zones, warnings };
}

// IMPROVED: parse CC (Construção) table from PDF
export async function parseCCTableFromPDF(
  file: File
): Promise<{ entries: CCPriceEntry[]; warnings: string[] }> {
  const warnings: string[] = [];
  const entries: CCPriceEntry[] = [];

  try {
    const pages = await extractPagesText(file);
    const fullText = pages.join("\n");

    // Look for header to confirm format
    const hasHeaders =
      /Chapas\s*2\s*[×x]\s*1/i.test(fullText) &&
      /Chapas\s*3\s*[×x]\s*2/i.test(fullText) &&
      /Chapas\s*4\s*a\s*6/i.test(fullText) &&
      /Chapas\s*7\s*a\s*8/i.test(fullText);

    if (!hasHeaders) {
      warnings.push("Cabeçalhos da tabela CC não detetados (Chapas 2×1, 3×2, 4 a 6, 7 a 8). A tentar parse mesmo assim.");
    }

    // Split by lines / row markers — try to capture: destination + 4-6 numbers
    // Heuristic: a destination is a sequence of letters before a series of numbers
    const rowRegex = /([A-ZÀ-Ÿ][A-Za-zÀ-ÿ\.\-\s']{2,40}?)\s+((?:\d{1,4}(?:[.,]\d{2})?\s*[-–]?\s*){2,6})/g;
    let m: RegExpExecArray | null;
    while ((m = rowRegex.exec(fullText)) !== null) {
      const destination = m[1].trim().replace(/\s+/g, " ");
      // Skip header words
      if (/^(Chapas|Eixos|Reboque|Destino|Origem|Zona)/i.test(destination)) continue;
      if (destination.length < 3) continue;

      const nums = m[2].trim().split(/\s+/).map(parseNum).filter((n): n is number => n !== null && n > 0);
      if (nums.length < 2) continue;

      const entry: CCPriceEntry = { destination };
      // Map columns: 2x1, 3x2, 4a6, 7a8, 3Eixos, Reboque
      const fields: (keyof CCPriceEntry)[] = ["chapas2x1", "chapas3x2", "chapas4a6", "chapas7a8", "threeAxle", "trailer"];
      nums.slice(0, 6).forEach((n, i) => {
        (entry as any)[fields[i]] = n;
      });
      entries.push(entry);
    }

    if (entries.length === 0) {
      warnings.push("Nenhum destino CC foi extraído. Verifica o formato do PDF.");
    } else if (entries.length < 10) {
      warnings.push(`Apenas ${entries.length} destinos extraídos — verifica se o PDF está completo.`);
    }
  } catch (e: any) {
    warnings.push(`Erro a processar PDF: ${e?.message ?? "desconhecido"}`);
  }

  return { entries, warnings };
}
