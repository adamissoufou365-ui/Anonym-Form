import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Inbox } from "lucide-react";
import { getForm, listResponses, type FormDef, type FormResponse, publicFormPath } from "@/lib/forms-store";
import { toast } from "sonner";

const formatDate = (ts: number) => new Date(ts).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });

const FormResponses = () => {
  const { id } = useParams();
  const [form, setForm] = useState<FormDef | null>(null);
  const [responses, setResponses] = useState<FormResponse[]>([]);

  useEffect(() => {
    if (!id) return;
    Promise.all([getForm(id), listResponses(id)])
      .then(([f, r]) => { setForm(f); setResponses(r); })
      .catch(e => toast.error(e.message));
  }, [id]);

  const exportCSV = () => {
    if (!form) return;
    const headers = ["#", "Date", ...form.questions.map(q => q.label || q.id)];
    const rows = responses.map((r, i) => [
      String(i + 1),
      formatDate(r.submittedAt),
      ...form.questions.map(q => {
        const v = r.answers[q.id];
        if (Array.isArray(v)) return v.join("; ");
        return (v as string) || "";
      }),
    ]);
    const csv = [headers, ...rows].map(row =>
      row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${form.title || "form"}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (!form) {
    return (
      <div className="min-h-screen bg-background grain flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-4xl font-bold mb-4">Formulaire introuvable</h1>
          <Button asChild><Link to="/">Retour</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background grain">
      <header className="border-b border-border">
        <div className="container flex flex-col items-center justify-center gap-3 py-4 text-center sm:flex-row sm:justify-between">
          <Button asChild variant="ghost" size="sm">
            <Link to="/"><ArrowLeft className="h-4 w-4" /> Retour</Link>
          </Button>
          <Button size="sm" variant="outline" onClick={exportCSV} disabled={responses.length === 0} className="w-full sm:w-auto">
            <Download className="h-4 w-4" /> Exporter CSV
          </Button>
        </div>
      </header>

      <div className="container max-w-5xl py-10 sm:py-12 text-center">
        <div className="font-mono text-xs uppercase tracking-widest text-primary mb-3">// Réponses</div>
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tighter mb-2">{form.title}</h1>
        <p className="text-muted-foreground mb-10">
          <span className="text-primary font-mono">{responses.length}</span> {responses.length > 1 ? "réponses anonymes reçues" : "réponse anonyme reçue"}
        </p>

        {responses.length === 0 ? (
          <div className="border border-dashed border-border p-16 text-center">
            <Inbox className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">Aucune réponse pour le moment.</p>
            <p className="font-mono text-xs text-muted-foreground">
              Partagez le lien :{" "}
              <span className="text-primary">{window.location.origin}{publicFormPath(form)}</span>
            </p>
          </div>
        ) : (
          <div className="space-y-px bg-border border border-border">
            {responses.map((r, i) => (
              <div key={r.id} className="bg-card p-4 sm:p-6 text-center">
                <div className="flex flex-col items-center justify-center gap-1 mb-4 pb-3 border-b border-border">
                  <div className="font-display text-xl font-bold">Réponse #{String(i + 1).padStart(3, "0")}</div>
                  <div className="font-mono text-xs text-muted-foreground">{formatDate(r.submittedAt)}</div>
                </div>
                <dl className="grid gap-4 md:grid-cols-2 text-left">
                  {form.questions.map(q => {
                    const v = r.answers[q.id];
                    const display = Array.isArray(v) ? v.join(", ") : (v as string) || "—";
                    return (
                      <div key={q.id}>
                        <dt className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-1">{q.label || q.id}</dt>
                        <dd className="text-foreground whitespace-pre-wrap break-words">{display}</dd>
                      </div>
                    );
                  })}
                </dl>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FormResponses;
