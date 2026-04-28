-- URLs publiques lisibles : /f/<slug> (en plus des anciens liens /f/<uuid>)

CREATE EXTENSION IF NOT EXISTS unaccent;

ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS slug TEXT;

UPDATE public.forms
SET slug = regexp_replace(
  regexp_replace(lower(unaccent(trim(title))), '[^a-z0-9]+', '-', 'g'),
  '(^-+|-+$)',
  '',
  'g'
)
WHERE slug IS NULL OR slug = '';

UPDATE public.forms SET slug = 'formulaire' WHERE slug IS NULL OR slug = '';

ALTER TABLE public.forms ALTER COLUMN slug SET NOT NULL;

ALTER TABLE public.forms DROP CONSTRAINT IF EXISTS forms_slug_key;
ALTER TABLE public.forms ADD CONSTRAINT forms_slug_key UNIQUE (slug);

CREATE INDEX IF NOT EXISTS idx_forms_slug ON public.forms(slug);
