import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

interface ChartDataItem {
  name: string;
  custo: number;
}

interface CostComparisonChartProps {
  data: ChartDataItem[];
  title: string;
}

export function CostComparisonChart({ data, title }: CostComparisonChartProps) {
  if (!data.length) return null;

  const minCost = Math.min(...data.map((d) => d.custo));
  const maxCost = Math.max(...data.map((d) => d.custo));
  const range = maxCost - minCost;

  const sorted = [...data].sort((a, b) => a.custo - b.custo);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-2">
        {sorted.map((item, idx) => {
          const diff = item.custo - minCost;
          const diffPercent = minCost > 0 ? (diff / minCost) * 100 : 0;
          const isCheapest = item.custo === minCost;
          const barWidth = range > 0 ? ((item.custo - minCost) / range) * 100 : 0;

          return (
            <div
              key={item.name}
              className={`relative p-2.5 rounded-lg border transition-all ${
                isCheapest
                  ? "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/40"
                  : "border-border bg-muted/30"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {isCheapest ? (
                    <div className="shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <TrendingDown className="h-3.5 w-3.5 text-green-700 dark:text-green-300" />
                    </div>
                  ) : (
                    <div className="shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                      <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className={`text-xs font-medium truncate ${isCheapest ? "text-green-800 dark:text-green-200" : "text-foreground"}`}>
                      {item.name}
                    </p>
                    <p className={`text-sm font-bold ${isCheapest ? "text-green-700 dark:text-green-300" : "text-foreground"}`}>
                      {item.custo.toFixed(2)} €
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {isCheapest ? (
                    <span className="text-[10px] bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-0.5 rounded-full font-medium">
                      Mais económico
                    </span>
                  ) : (
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-destructive">
                        +{diff.toFixed(2)} €
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        +{diffPercent.toFixed(1)}%
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Visual bar showing relative cost difference */}
              {!isCheapest && range > 0 && (
                <div className="mt-1.5 h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-destructive/40 rounded-full transition-all"
                    style={{ width: `${Math.min(barWidth, 100)}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* Summary: savings between cheapest and most expensive */}
        {sorted.length > 1 && range > 0 && (
          <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Diferença máx.:</span>
            <span className="font-medium text-foreground">
              {range.toFixed(2)} € ({minCost > 0 ? ((range / minCost) * 100).toFixed(1) : "—"}%)
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
