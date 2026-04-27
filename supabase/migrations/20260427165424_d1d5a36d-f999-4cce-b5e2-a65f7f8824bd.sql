
-- forms table
CREATE TABLE public.forms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;

-- Owners can do everything on their own forms
CREATE POLICY "Owners select own forms" ON public.forms
  FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Owners insert own forms" ON public.forms
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners update own forms" ON public.forms
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Owners delete own forms" ON public.forms
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- Anyone (anon + authenticated) can read a form to fill it in
CREATE POLICY "Public can view forms" ON public.forms
  FOR SELECT TO anon, authenticated USING (true);

-- responses table
CREATE TABLE public.responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a response anonymously (no user_id stored)
CREATE POLICY "Public can submit responses" ON public.responses
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Only the form owner can read responses
CREATE POLICY "Form owners read responses" ON public.responses
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.forms f WHERE f.id = responses.form_id AND f.owner_id = auth.uid())
  );

-- Only the form owner can delete responses
CREATE POLICY "Form owners delete responses" ON public.responses
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.forms f WHERE f.id = responses.form_id AND f.owner_id = auth.uid())
  );

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER set_updated_at_forms BEFORE UPDATE ON public.forms
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX idx_forms_owner ON public.forms(owner_id);
CREATE INDEX idx_responses_form ON public.responses(form_id);
