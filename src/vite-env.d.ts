/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  /** Alias accepté : la clé "anon" publique du projet Supabase */
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** Alias accepté : certains templates nomment cette variable différemment */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
