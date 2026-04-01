// IMPROVED: controlled Tabs state to preserve active tab across re-renders
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PolymerSimulator } from "@/components/PolymerSimulator";
import { ConstructionSimulator } from "@/components/ConstructionSimulator";
import { ConfigPanel } from "@/components/ConfigPanel";
// IMPROVED: added ArchivePanel tab
import { ArchivePanel } from "@/components/ArchivePanel";
import { Truck, Package, Building2, Settings, Archive } from "lucide-react";

const Index = () => {
  // IMPROVED: controlled state preserves active tab when navigating
  const [activeTab, setActiveTab] = useState("polymers");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* IMPROVED: added 4th tab "Arquivo" */}
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="polymers" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Polímeros</span>
            </TabsTrigger>
            <TabsTrigger value="construction" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Construção</span>
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

          <TabsContent value="polymers">
            <PolymerSimulator />
          </TabsContent>

          <TabsContent value="construction">
            <ConstructionSimulator />
          </TabsContent>

          {/* IMPROVED: new Archive tab */}
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
