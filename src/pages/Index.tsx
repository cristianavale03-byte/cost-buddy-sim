import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CostSimulator } from "@/components/PolymerSimulator";
import { ConfigPanel } from "@/components/ConfigPanel";
import { ArchivePanel } from "@/components/ArchivePanel";
import { Truck, Package2, Settings, Archive } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("simulator");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Truck className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Simulador de Custos de Frota</h1>
              <p className="text-sm text-muted-foreground">Frota Própria vs Subcontratação — AGI</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-2xl">
            <TabsTrigger value="simulator" className="flex items-center gap-2">
              <Package2 className="h-4 w-4" />
              <span className="hidden sm:inline">Simulador de Custos</span>
            </TabsTrigger>
            <TabsTrigger value="archive" className="flex items-center gap-2">
              <Archive className="h-4 w-4" />
              <span className="hidden sm:inline">Arquivo</span>
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Configuração</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="simulator">
            <CostSimulator />
          </TabsContent>

          <TabsContent value="archive">
            <ArchivePanel />
          </TabsContent>

          <TabsContent value="config">
            <ConfigPanel />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
