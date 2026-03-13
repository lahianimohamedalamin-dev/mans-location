import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xubivjnyhdhhviqmwrkz.supabase.co";
const SUPABASE_KEY = "sb_publishable_p-6VZsWTQOQCoap9nTay7g_wUpQN2rq";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);