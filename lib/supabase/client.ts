import { createBrowserClient } from '@supabase/ssr';

// Funcția ta existentă (perfectă pentru Server Components / SSR)
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

// Instanță directă reutilizabilă pentru apeluri rapide din Client Components
export const supabase = createClient();