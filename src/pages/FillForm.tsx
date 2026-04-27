import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { getForm, submitResponse, type FormDef } from "@/lib/forms-store";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const FillForm = () => {
  const { id } = useParams();
  const [form, setForm] = useState<FormDef | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    getForm(id).then(f => setForm(f)).catch(() => setForm(null)).finally(() => setLoading(false));
  }, [id]);

  const setAnswer = (qid: string, value: string | string[]) =>
    setAnswers(prev => ({ ...prev, [qid]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    for (const q of form.questions) {
      if (q.required) {
        const v = answers[q.id];
        if (!v || (Array.isArray(v) && v.length === 0) || (typeof v === "string" && !v.trim())) {
          toast.error(`Question requise : ${q.label || "(sans titre)"}`);
          return;
        }
      }
    }
    setBusy(true);
    try {
      await submitResponse(form.id, answers);
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'envoi");
    } finally { setBusy(false); }
  };

  if (loading) return <div className="min-h-screen bg-background grain" />;

  if (!form) {
    return (
      <div className="min-h-screen bg-background grain flex items-center justify-center">
        <div className="text-center">
          <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">// 404</div>
          <h1 className="font-display text-4xl font-bold mb-4">Formulaire introuvable</h1>
          <Button asChild><Link to="/">Retour à l'accueil</Link></Button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background grain flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="inline-flex h-20 w-20 items-center justify-center bg-primary text-primary-foreground mb-6">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h1 className="font-display text-4xl font-bold mb-3">Merci.</h1>
          <p className="text-muted-foreground mb-8">Votre réponse a été enregistrée anonymement. Aucune donnée personnelle n'a été collectée.</p>
          <Button asChild variant="outline"><Link to="/">Créer mon propre formulaire</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background grain">
      <div className="container max-w-2xl py-12 md:py-20">
        <div className="inline-flex items-center gap-2 border border-primary/30 bg-primary/5 px-3 py-1.5 mb-8 font-mono text-xs uppercase tracking-widest text-primary">
          <ShieldCheck className="h-3.5 w-3.5" /> Réponse 100% anonyme
        </div>

        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tighter text-balance mb-4">
          {form.title}
        </h1>
        {form.description && (
          <p className="text-muted-foreground text-lg leading-relaxed mb-10">{form.description}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {form.questions.map((q, idx) => (
            <div key={q.id} className="border-l-2 border-border pl-6 hover:border-primary transition-colors">
              <div className="flex items-baseline gap-3 mb-3">
                <span className="font-mono text-xs text-primary">{String(idx + 1).padStart(2, "0")}</span>
                <Label className="text-base font-medium leading-snug">
                  {q.label || "(question sans titre)"}
                  {q.required && <span className="text-destructive ml-1">*</span>}
                </Label>
              </div>

              {q.type === "short" && (
                <Input
                  value={(answers[q.id] as string) || ""}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  className="border-0 border-b-2 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
                  maxLength={500}
                />
              )}
              {q.type === "long" && (
                <Textarea
                  value={(answers[q.id] as string) || ""}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  className="border-2 min-h-[120px]"
                  maxLength={2000}
                />
              )}
              {q.type === "single" && (
                <RadioGroup value={(answers[q.id] as string) || ""} onValueChange={(v) => setAnswer(q.id, v)} className="space-y-2">
                  {q.options?.map((opt, i) => (
                    <div key={i} className="flex items-center gap-3 border border-border p-3 hover:border-primary/40 transition-colors cursor-pointer">
                      <RadioGroupItem value={opt} id={`${q.id}-${i}`} />
                      <Label htmlFor={`${q.id}-${i}`} className="cursor-pointer flex-1 font-normal">{opt}</Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
              {q.type === "multiple" && (
                <div className="space-y-2">
                  {q.options?.map((opt, i) => {
                    const arr = (answers[q.id] as string[]) || [];
                    const checked = arr.includes(opt);
                    return (
                      <div key={i} className="flex items-center gap-3 border border-border p-3 hover:border-primary/40 transition-colors cursor-pointer">
                        <Checkbox
                          id={`${q.id}-${i}`}
                          checked={checked}
                          onCheckedChange={(v) => {
                            if (v) setAnswer(q.id, [...arr, opt]);
                            else setAnswer(q.id, arr.filter(x => x !== opt));
                          }}
                        />
                        <Label htmlFor={`${q.id}-${i}`} className="cursor-pointer flex-1 font-normal">{opt}</Label>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          <div className="pt-4">
            <Button type="submit" size="lg" className="w-full md:w-auto" disabled={busy}>Envoyer ma réponse</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FillForm;
