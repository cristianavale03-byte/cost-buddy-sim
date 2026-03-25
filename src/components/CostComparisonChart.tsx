import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

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

  const COLORS = ["hsl(var(--primary))", "hsl(210, 70%, 50%)", "hsl(190, 70%, 45%)", "hsl(160, 60%, 40%)"];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(2)} €`, "Custo"]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="custo" radius={[6, 6, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.custo === minCost ? "hsl(142, 71%, 45%)" : COLORS[index % COLORS.length]}
                    opacity={entry.custo === minCost ? 1 : 0.7}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          A barra <span className="text-green-600 font-semibold">verde</span> indica a opção mais económica
        </p>
      </CardContent>
    </Card>
  );
}
