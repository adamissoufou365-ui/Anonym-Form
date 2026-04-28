import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, GripVertical, Plus, Trash2, Copy, Save } from "lucide-react";
import { type FormDef, type Question, type QuestionType, getForm, uid, createForm, updateForm, publicFormPath } from "@/lib/forms-store";
import { toast } from "sonner";

const emptyForm = (): FormDef => ({
  id: "",
  slug: "",
  title: "",
  description: "",
  questions: [],
  createdAt: Date.now(),
});

const TYPES: { value: QuestionType; label: string }[] = [
  { value: "short", label: "Texte court" },
  { value: "long", label: "Texte long" },
  { value: "single", label: "Choix unique" },
  { value: "multiple", label: "Choix multiples" },
];

const Builder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormDef>(emptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      getForm(id).then(existing => {
        if (existing) setForm(existing);
        else toast.error("Formulaire introuvable");
      }).catch(e => toast.error(e.message));
    }
  }, [id]);

  const updateQ = (qid: string, patch: Partial<Question>) =>
    setForm({ ...form, questions: form.questions.map(q => q.id === qid ? { ...q, ...patch } : q) });

  const addQuestion = (type: QuestionType = "short") =>
    setForm({
      ...form,
      questions: [...form.questions, {
        id: uid(), type, label: "", required: false,
        options: type === "single" || type === "multiple" ? ["Option 1", "Option 2"] : undefined,
      }],
    });

  const removeQ = (qid: string) =>
    setForm({ ...form, questions: form.questions.filter(q => q.id !== qid) });

  const persist = async (): Promise<FormDef | null> => {
    if (!form.title.trim()) { toast.error("Ajoutez un titre"); return null; }
    if (form.questions.length === 0) { toast.error("Ajoutez au moins une question"); return null; }
    setSaving(true);
    try {
      const payload = { title: form.title, description: form.description, questions: form.questions };
      const saved = form.id
        ? await updateForm(form.id, payload)
        : await createForm(payload);
      setForm(saved);
      return saved;
    } catch (e: any) { toast.error(e.message); return null; }
    finally { setSaving(false); }
  };

  const handleSave = async () => {
    const saved = await persist();
    if (saved) { toast.success("Formulaire enregistré"); navigate("/"); }
  };

  const copyShareLink = async () => {
    const saved = await persist();
    if (!saved) return;
    navigator.clipboard.writeText(`${window.location.origin}${publicFormPath(saved)}`);
    toast.success("Lien copié");
  };

  return (
    <div className="min-h-screen bg-background grain">
      <header className="border-b border-border sticky top-0 bg-background/90 backdrop-blur z-10">
        <div className="container flex flex-col items-center justify-center gap-3 py-4 text-center md:flex-row md:justify-between md:text-left">
          <Button asChild variant="ghost" size="sm">
            <Link to="/"><ArrowLeft className="h-4 w-4" /> Retour</Link>
          </Button>
          <div className="font-mono text-xs text-muted-foreground">{form.id ? `FORM #${form.id.slice(0, 8)}` : "NOUVEAU"}</div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Button variant="outline" size="sm" onClick={copyShareLink} disabled={saving} className="w-full sm:w-auto">
              <Copy className="h-4 w-4" /> Lien
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
              <Save className="h-4 w-4" /> Enregistrer
            </Button>
          </div>
        </div>
      </header>

      <div className="container max-w-3xl py-8 sm:py-12 text-center">
        <div className="font-mono text-xs uppercase tracking-widest text-primary mb-3">// Constructeur</div>
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tighter mb-10">
          {id ? "Modifier" : "Nouveau"} formulaire
        </h1>

        <div className="space-y-6 mb-12">
          <div>
            <Label htmlFor="title" className="font-mono text-xs uppercase tracking-wider">Titre</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Sondage anonyme sur..."
              className="mt-2 text-2xl font-display font-bold h-auto py-4 px-4 border-2 focus-visible:ring-primary"
              maxLength={120}
            />
          </div>
          <div>
            <Label htmlFor="desc" className="font-mono text-xs uppercase tracking-wider">Description</Label>
            <Textarea
              id="desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Décrivez l'objectif. Aucune donnée personnelle ne sera collectée."
              className="mt-2 min-h-[80px] border-2"
              maxLength={500}
            />
          </div>
        </div>

        <div className="space-y-4">
          {form.questions.map((q, idx) => (
            <div key={q.id} className="group border-2 border-border bg-card p-4 sm:p-5 hover:border-primary/40 transition-colors text-center">
              <div className="flex flex-col sm:flex-row items-start gap-3">
                <div className="flex flex-col items-center gap-1 pt-2 mx-auto sm:mx-0">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-xs text-muted-foreground">{String(idx + 1).padStart(2, "0")}</span>
                </div>
                <div className="flex-1 w-full space-y-3">
                  <div className="flex flex-col md:flex-row gap-3 items-center">
                    <Input
                      value={q.label}
                      onChange={(e) => updateQ(q.id, { label: e.target.value })}
                      placeholder="Votre question…"
                      className="w-full flex-1 font-medium border-0 border-b-2 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary text-base"
                      maxLength={200}
                    />
                    <Select value={q.type} onValueChange={(v) => updateQ(q.id, {
                      type: v as QuestionType,
                      options: (v === "single" || v === "multiple") ? (q.options ?? ["Option 1", "Option 2"]) : undefined,
                    })}>
                      <SelectTrigger className="w-full md:w-[180px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {(q.type === "single" || q.type === "multiple") && (
                    <div className="space-y-2 pl-4 border-l-2 border-border text-left">
                      {q.options?.map((opt, i) => (
                        <div key={i} className="flex gap-2">
                          <Input
                            value={opt}
                            onChange={(e) => {
                              const opts = [...(q.options || [])];
                              opts[i] = e.target.value;
                              updateQ(q.id, { options: opts });
                            }}
                            className="h-9"
                            maxLength={100}
                          />
                          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => {
                            updateQ(q.id, { options: q.options?.filter((_, j) => j !== i) });
                          }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="ghost" size="sm" onClick={() => updateQ(q.id, { options: [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`] })}>
                        <Plus className="h-3.5 w-3.5" /> Ajouter une option
                      </Button>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Switch id={`req-${q.id}`} checked={q.required} onCheckedChange={(v) => updateQ(q.id, { required: v })} />
                      <Label htmlFor={`req-${q.id}`} className="font-mono text-xs uppercase tracking-wider cursor-pointer">Obligatoire</Label>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeQ(q.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
          {TYPES.map(t => (
            <Button key={t.value} variant="outline" onClick={() => addQuestion(t.value)} className="justify-center sm:justify-start">
              <Plus className="h-4 w-4" /> {t.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Builder;
