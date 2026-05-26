import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = 
  Boolean(
    supabaseUrl && 
    supabaseUrl !== 'YOUR_SUPABASE_PROJECT_URL' && 
    supabaseAnonKey && 
    supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY'
  ) && (
    typeof window === 'undefined' || 
    localStorage.getItem("operating_mode") !== "local"
  );

if (!isSupabaseConfigured) {
  console.warn('Supabase credentials missing, using placeholders, or operating in local-only override mode.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

