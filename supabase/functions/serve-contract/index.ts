import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const file = url.searchParams.get("file");

  if (!file) {
    return new Response("Paramètre 'file' manquant", { status: 400 });
  }

  // Strict allowlist: only HTML contract files
  if (!/^contrat_[\w\-]+\.html$/.test(file)) {
    return new Response("Fichier invalide", { status: 400 });
  }

  // Require authentication — contracts are private documents
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response("Authentification requise", { status: 401 });
  }

  // Verify the token with anon key (uses RLS — user can only access their own data)
  const supabaseUser = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
  if (authError || !user) {
    return new Response("Token invalide", { status: 401 });
  }

  // Use service role only for storage read (storage bucket is private)
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data, error } = await supabaseAdmin.storage
    .from("contrats")
    .download(file);

  if (error || !data) {
    return new Response("Contrat introuvable", { status: 404 });
  }

  const html = await data.text();

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Private document — no public caching
      "Cache-Control": "private, no-store",
    },
  });
});
