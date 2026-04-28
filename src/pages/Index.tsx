import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { listMyForms, deleteForm, countResponses, type FormDef, publicFormPath } from "@/lib/forms-store";
import { ArrowUpRight, Plus, Trash2, MessageSquareText, Link2, LogOut, LogIn } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [forms, setForms] = useState<FormDef[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const refresh = async () => {
    if (!user) { setForms([]); setCounts({}); return; }
    try {
      const list = await listMyForms();
      setForms(list);
      const entries = await Promise.all(list.map(async (f) => [f.id, await countResponses(f.id)] as const));
      setCounts(Object.fromEntries(entries));
    } catch (e: any) { toast.error(e.message); }
  };

  useEffect(() => { if (!loading) refresh(); }, [user, loading]);

  const handleDelete = async (id: string) => {
    try { await deleteForm(id); await refresh(); toast.success("Formulaire supprimé"); }
    catch (e: any) { toast.error(e.message); }
  };

  const copyLink = (form: Pick<FormDef, "slug" | "id">) => {
    navigator.clipboard.writeText(`${window.location.origin}${publicFormPath(form)}`);
    toast.success("Lien copié dans le presse-papiers");
  };

  const handleNew = () => {
    if (!user) { navigate("/auth"); return; }
    navigate("/builder");
  };

  return (
    <div className="min-h-screen bg-background grain">
      <header className="border-b border-border">
        <div className="container flex flex-col items-center justify-center gap-4 py-5 text-center sm:flex-row sm:justify-between sm:text-left">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-7 w-7 bg-primary" style={{ clipPath: "polygon(0 0, 100% 0, 100% 70%, 70% 100%, 0 100%)" }} />
            <span className="font-display text-lg font-bold tracking-tight">ANONYM<span className="text-primary">/</span>FORM</span>
          </Link>
          <nav className="flex w-full flex-wrap items-center justify-center gap-2 text-sm font-medium sm:w-auto sm:gap-3">
            {user ? (
              <>
                <a href="#forms" className="hidden sm:inline text-muted-foreground hover:text-foreground transition-colors mr-3">Mes formulaires</a>
                <span className="hidden md:inline font-mono text-xs text-muted-foreground truncate max-w-[160px]">{user.email}</span>
                <Button variant="ghost" size="sm" onClick={signOut} className="w-full sm:w-auto"><LogOut className="h-4 w-4" /> Déconnexion</Button>
                <Button size="sm" onClick={handleNew} className="w-full sm:w-auto"><Plus className="h-4 w-4" /> Nouveau</Button>
              </>
            ) : (
              <Button asChild size="sm" variant="default" className="w-full sm:w-auto">
                <Link to="/auth"><LogIn className="h-4 w-4" /> Se connecter</Link>
              </Button>
            )}
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="container py-24 md:py-32 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 border border-border bg-card/50 px-3 py-1 mb-8 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              100% anonyme · zéro tracking
            </div>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[0.95] tracking-tighter">
              <span className="block lg:whitespace-nowrap">Récoltez des réponses</span>
              <span className="block text-primary lg:whitespace-nowrap">sans laisser de traces.</span>
            </h1>
            <p className="mt-8 max-w-xl lg:max-w-3xl mx-auto text-lg text-muted-foreground leading-relaxed">
              <span className="block lg:whitespace-nowrap">Construisez des formulaires anonymes en quelques secondes.</span>
              <span className="block lg:whitespace-nowrap">Les répondants restent invisibles ; vous gardez le contrôle de vos formulaires depuis votre compte.</span>
            </p>
            <div className="mt-10 flex flex-col sm:flex-row sm:flex-wrap justify-center gap-3 sm:gap-4">
              <Button size="lg" className="group w-full sm:w-auto" onClick={handleNew}>
                {user ? "Créer un formulaire" : "Commencer — créer un compte"}
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Button>
              {user && (
                <Button asChild size="lg" variant="outline" className="w-full sm:w-auto"><a href="#forms">Voir mes formulaires</a></Button>
              )}
            </div>

            <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border">
              {[
                { k: "00", v: "Cookies répondants" },
                { k: "00", v: "IPs stockées" },
                { k: "∞", v: "Formulaires" },
                { k: "100%", v: "Anonyme" },
              ].map((s) => (
                <div key={s.v} className="bg-background p-6">
                  <div className="font-display text-3xl font-bold text-primary">{s.k}</div>
                  <div className="mt-1 font-mono text-xs uppercase tracking-wider text-muted-foreground">{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {user && (
        <section id="forms" className="container py-20 border-t border-border text-center">
          <div className="flex flex-col items-center justify-center gap-4 mb-10">
            <div>
              <div className="font-mono text-xs uppercase tracking-widest text-primary mb-2">// Vos créations</div>
              <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tighter">Formulaires</h2>
            </div>
            <Button variant="outline" onClick={handleNew} className="w-full sm:w-auto"><Plus className="h-4 w-4" /> Nouveau formulaire</Button>
          </div>

          {forms.length === 0 ? (
            <div className="border border-dashed border-border p-16 text-center">
              <p className="text-muted-foreground mb-6">Aucun formulaire pour le moment.</p>
              <Button onClick={handleNew}>Créer le premier</Button>
            </div>
          ) : (
            <div className="grid gap-px bg-border border border-border md:grid-cols-2 lg:grid-cols-3">
              {forms.map((f) => {
                const count = counts[f.id] ?? 0;
                return (
                  <article key={f.id} className="group bg-card p-6 flex flex-col gap-4 hover:bg-secondary transition-colors text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="font-mono text-xs text-muted-foreground truncate">#{f.id.slice(0, 8)}</div>
                      <div className="font-mono text-xs px-2 py-0.5 bg-primary/10 text-primary border border-primary/20">
                        {count} {count > 1 ? "réponses" : "réponse"}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display text-xl font-bold leading-tight mb-2">{f.title || "Sans titre"}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{f.description || "Pas de description"}</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-3 border-t border-border">
                      <Button asChild size="sm" variant="ghost" className="w-full sm:flex-1 sm:w-auto">
                        <Link to={`/builder/${f.id}`}>Éditer</Link>
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => copyLink(f)} title="Copier le lien">
                        <Link2 className="h-4 w-4" />
                      </Button>
                      <Button asChild size="sm" variant="ghost" title="Réponses">
                        <Link to={`/responses/${f.id}`}><MessageSquareText className="h-4 w-4" /></Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" title="Supprimer">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer ce formulaire ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action est irréversible. Le formulaire et ses réponses seront supprimés définitivement.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(f.id)}>
                              Oui, supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      <footer className="border-t border-border py-8">
        <div className="container flex flex-col items-center justify-center gap-2 text-xs font-mono text-muted-foreground text-center">
          <span>© ANONYM/FORM — Plateforme professionnelle de collecte anonyme.</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
