import { createClient } from '@supabase/supabase-js';

// Clé publique Supabase (anon key) — conçue pour être embarquée côté client
// La sécurité réelle repose sur les politiques RLS dans Supabase
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || "https://xubivjnyhdhhviqmwrkz.supabase.co";
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_KEY || "sb_publishable_p-6VZsWTQOQCoap9nTay7g_wUpQN2rq";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
