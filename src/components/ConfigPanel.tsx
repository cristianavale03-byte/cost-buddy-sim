import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fleetVehicles, genericWeightPrices, dimensionTypes, deliveryCostPerEntry } from "@/data/fleetData";

export function ConfigPanel() {
  return (
    <div className="space-y-6">
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

      {/* Pombalense weight prices */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tabela de Preços Pombalense (por peso)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[400px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Até (kg)</TableHead>
                  <TableHead className="text-right">Custo (€)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {genericWeightPrices
                  .filter((p) => p.kgUpTo > 0)
                  .map((p) => (
                    <TableRow key={p.kgUpTo}>
                      <TableCell>{p.kgUpTo.toLocaleString("pt-PT")} kg</TableCell>
                      <TableCell className="text-right">{p.cost} €</TableCell>
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

      {/* Other params */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Outros Parâmetros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Custo por entrega interna</span>
              <span className="font-medium">{deliveryCostPerEntry} €</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Suplemento comprimento excessivo (>6m)</span>
              <span className="font-medium">+20%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
