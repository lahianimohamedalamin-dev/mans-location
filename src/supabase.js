import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Variables REACT_APP_SUPABASE_URL et REACT_APP_SUPABASE_KEY manquantes. Vérifiez votre fichier .env.local');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);