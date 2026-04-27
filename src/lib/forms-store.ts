import { supabase } from "@/integrations/supabase/client";

export type QuestionType = "short" | "long" | "single" | "multiple";

export interface Question {
  id: string;
  type: QuestionType;
  label: string;
  required: boolean;
  options?: string[];
}

export interface FormDef {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  createdAt: number;
}

export interface FormResponse {
  id: string;
  formId: string;
  answers: Record<string, string | string[]>;
  submittedAt: number;
}

export const uid = () => Math.random().toString(36).slice(2, 10);

const rowToForm = (r: any): FormDef => ({
  id: r.id,
  title: r.title ?? "",
  description: r.description ?? "",
  questions: (r.questions ?? []) as Question[],
  createdAt: new Date(r.created_at).getTime(),
});

const rowToResp = (r: any): FormResponse => ({
  id: r.id,
  formId: r.form_id,
  answers: (r.answers ?? {}) as Record<string, string | string[]>,
  submittedAt: new Date(r.submitted_at).getTime(),
});

export async function listMyForms(): Promise<FormDef[]> {
  const { data, error } = await supabase.from("forms").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToForm);
}

export async function getForm(id: string): Promise<FormDef | null> {
  const { data, error } = await supabase.from("forms").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? rowToForm(data) : null;
}

export async function createForm(form: Omit<FormDef, "id" | "createdAt">): Promise<FormDef> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");
  const { data, error } = await supabase.from("forms").insert({
    owner_id: user.id,
    title: form.title,
    description: form.description,
    questions: form.questions as any,
  }).select().single();
  if (error) throw error;
  return rowToForm(data);
}

export async function updateForm(id: string, form: Partial<Omit<FormDef, "id" | "createdAt">>): Promise<FormDef> {
  const patch: any = {};
  if (form.title !== undefined) patch.title = form.title;
  if (form.description !== undefined) patch.description = form.description;
  if (form.questions !== undefined) patch.questions = form.questions;
  const { data, error } = await supabase.from("forms").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return rowToForm(data);
}

export async function deleteForm(id: string): Promise<void> {
  const { error } = await supabase.from("forms").delete().eq("id", id);
  if (error) throw error;
}

export async function submitResponse(formId: string, answers: Record<string, string | string[]>): Promise<void> {
  const { error } = await supabase.from("responses").insert({ form_id: formId, answers: answers as any });
  if (error) throw error;
}

export async function listResponses(formId: string): Promise<FormResponse[]> {
  const { data, error } = await supabase.from("responses").select("*").eq("form_id", formId).order("submitted_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToResp);
}

export async function countResponses(formId: string): Promise<number> {
  const { count, error } = await supabase.from("responses").select("*", { count: "exact", head: true }).eq("form_id", formId);
  if (error) throw error;
  return count ?? 0;
}
