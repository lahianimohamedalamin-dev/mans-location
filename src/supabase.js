import { createClient } from '@supabase/supabase-js';

// Les variables d'environnement sont injectées au build (REACT_APP_*)
// Si non définies (CI/CD sans .env.local), on utilise les valeurs de fallback
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || "https://xubivjnyhdhhviqmwrkz.supabase.co";
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_KEY || "sb_publishable_p-6VZsWTQOQCoap9nTay7g_wUpQN2rq";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
