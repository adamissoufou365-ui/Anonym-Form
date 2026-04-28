import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
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
import { ArrowLeft, Download, Inbox, Trash2 } from "lucide-react";
import { deleteResponse, getForm, listResponses, type FormDef, type FormResponse, publicFormPath } from "@/lib/forms-store";
import { downloadResponsesXlsx } from "@/lib/export-responses-xlsx";
import { toast } from "sonner";

const formatDate = (ts: number) => new Date(ts).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });

const FormResponses = () => {
  const { id } = useParams();
  const [form, setForm] = useState<FormDef | null>(null);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([getForm(id), listResponses(id)])
      .then(([f, r]) => {
        const sorted = [...r].sort((a, b) => b.submittedAt - a.submittedAt);
        setForm(f);
        setResponses(sorted);
      })
      .catch(e => toast.error(e.message));
  }, [id]);

  // Ordre métier: les plus anciens ont les plus petits numéros.
  const rankById = useMemo(() => {
    const asc = [...responses].sort((a, b) => a.submittedAt - b.submittedAt);
    return new Map(asc.map((r, idx) => [r.id, idx + 1]));
  }, [responses]);

  const exportExcel = async () => {
    if (!form || responses.length === 0) return;
    try {
      await downloadResponsesXlsx(form, responses);
      toast.success("Export Excel telecharge");
    } catch (e: any) {
      toast.error(e.message || "Export impossible");
    }
  };

  const handleDeleteResponse = async (responseId: string) => {
    setDeletingId(responseId);
    try {
      await deleteResponse(responseId);
      setResponses((prev) => prev.filter((r) => r.id !== responseId));
      toast.success("Réponse supprimée");
    } catch (e: any) {
      toast.error(e.message || "Suppression impossible");
    } finally {
      setDeletingId(null);
    }
  };

  const renderAnswerBody = (raw: unknown) => {
    const v = raw as string | string[] | undefined;
    if (Array.isArray(v)) {
      if (v.length === 0) return <span className="text-muted-foreground">—</span>;
      return (
        <ul className="list-disc pl-5 space-y-1">
          {v.map((item, idx) => (
            <li key={idx} className="break-words">{item}</li>
          ))}
        </ul>
      );
    }
    const s = (v as string) || "";
    if (!s.trim()) return <span className="text-muted-foreground">—</span>;
    return <span className="break-words whitespace-pre-wrap">{s}</span>;
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
          <Button size="sm" variant="outline" onClick={() => void exportExcel()} disabled={responses.length === 0} className="w-full sm:w-auto">
            <Download className="h-4 w-4" /> Exporter Excel
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
                  <div className="font-display text-xl font-bold">Réponse #{String(rankById.get(r.id) ?? i + 1).padStart(3, "0")}</div>
                  <div className="font-mono text-xs text-muted-foreground">{formatDate(r.submittedAt)}</div>
                </div>
                <ol className="mx-auto max-w-3xl space-y-4 text-left">
                  {form.questions.map((q, qi) => (
                    <li key={q.id} className="border-l-2 border-primary/40 pl-4">
                      <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                        {String(qi + 1).padStart(2, "0")} · {q.label || q.id}
                      </div>
                      <div className="text-foreground">{renderAnswerBody(r.answers[q.id])}</div>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FormResponses;
