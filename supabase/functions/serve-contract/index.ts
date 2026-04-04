import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const file = url.searchParams.get("file");

  if (!file) {
    return new Response("Paramètre 'file' manquant", { status: 400 });
  }

  // Sécurité : seulement des fichiers du bucket contrats
  if (!/^contrat_[\w\-]+\.html$/.test(file)) {
    return new Response("Fichier invalide", { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data, error } = await supabase.storage
    .from("contrats")
    .download(file);

  if (error || !data) {
    return new Response("Contrat introuvable", { status: 404 });
  }

  const html = await data.text();

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
});
