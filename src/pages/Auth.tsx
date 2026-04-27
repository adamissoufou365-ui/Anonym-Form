import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!loading && user) navigate("/", { replace: true }); }, [user, loading, navigate]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        toast.success("Compte créé. Vous êtes connecté.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Connecté");
      }
    } catch (err: any) {
      toast.error(err.message || "Erreur");
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-background grain flex flex-col">
      <header className="border-b border-border">
        <div className="container py-4 flex justify-center">
          <Button asChild variant="ghost" size="sm">
            <Link to="/"><ArrowLeft className="h-4 w-4" /> Retour</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center gap-2 border border-primary/30 bg-primary/5 px-3 py-1.5 mb-6 font-mono text-xs uppercase tracking-widest text-primary">
            <ShieldCheck className="h-3.5 w-3.5" /> Espace créateur
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tighter mb-3">
            {mode === "signin" ? "Connexion" : "Créer un compte"}
          </h1>
          <p className="text-muted-foreground mb-8">
            Un compte pour gérer <em>vos</em> formulaires. <br/>Les répondants restent 100% anonymes.
          </p>

          <form onSubmit={handleEmail} className="space-y-4 text-center">
            <div>
              <Label htmlFor="email" className="font-mono text-xs uppercase tracking-wider">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 border-2" />
            </div>
            <div>
              <Label htmlFor="password" className="font-mono text-xs uppercase tracking-wider">Mot de passe</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 border-2" />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {mode === "signin" ? "Se connecter" : "Créer mon compte"}
            </Button>
          </form>

          <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors w-full text-center">
            {mode === "signin" ? "Pas de compte ? " : "Déjà inscrit ? "}
            <span className="text-primary font-medium underline underline-offset-4">
              {mode === "signin" ? "Créer un compte" : "Se connecter"}
            </span>
          </button>
        </div>
      </main>
    </div>
  );
};

export default Auth;
