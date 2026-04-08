import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Truck, LogIn } from "lucide-react";

const VALID_USERNAME = "utilizador1";
const VALID_PASSWORD = "AGI2026!";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  // IMPROVED: step 2 asks for user display name before entering app
  const [authenticated, setAuthenticated] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      sessionStorage.setItem("agi-auth", "true");
      setAuthenticated(true);
    } else {
      setError("Utilizador ou password incorretos.");
    }
  };

  // IMPROVED: save display name and proceed to app
  const handleContinue = () => {
    sessionStorage.setItem("agi-user-name", displayName.trim() || "Anónimo");
    navigate("/");
  };

  // IMPROVED: name step after successful login
  if (authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
              <Truck className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-xl">Como te chamas?</CardTitle>
            <p className="text-sm text-muted-foreground">Para identificar quem guardou cada estimativa</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); handleContinue(); }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Nome (opcional)</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ex: João"
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full">
                <LogIn className="h-4 w-4 mr-2" /> Continuar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
            <Truck className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-xl">Simulador de Custos AGI</CardTitle>
          <p className="text-sm text-muted-foreground">Introduza as suas credenciais</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Utilizador</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(""); }}
                placeholder="Utilizador"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="Password"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full">
              <LogIn className="h-4 w-4 mr-2" /> Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
