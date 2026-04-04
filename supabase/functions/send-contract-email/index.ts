import nodemailer from "npm:nodemailer@6";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { clientEmail, clientName, contractId } = body;

    // Accepte fileName OU contractUrl (rétrocompatibilité)
    let storageFileName = body.fileName;
    if (!storageFileName && body.contractUrl) {
      const parts = body.contractUrl.split("/");
      storageFileName = decodeURIComponent(parts[parts.length - 1]);
    }

    if (!clientEmail || !storageFileName) {
      return new Response(
        JSON.stringify({ error: "clientEmail et fileName/contractUrl sont requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const gmailUser = Deno.env.get("GMAIL_USER");
    const gmailPass = Deno.env.get("GMAIL_APP_PASSWORD");
    if (!gmailUser || !gmailPass) {
      return new Response(
        JSON.stringify({ error: "Variables GMAIL manquantes" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Récupérer le HTML depuis Storage
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: fileData, error: fileErr } = await supabase.storage
      .from("contrats")
      .download(storageFileName);
    if (fileErr || !fileData) {
      throw new Error("Fichier introuvable dans Storage : " + (fileErr?.message || storageFileName));
    }
    const htmlContent = await fileData.text();

    const prenom = (clientName || "").split(" ")[0] || "Client";
    const id = contractId || storageFileName;

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: gmailUser, pass: gmailPass },
    });

    await transporter.sendMail({
      from: `"Man's Location" <${gmailUser}>`,
      to: clientEmail,
      subject: `Votre contrat de location — Man's Location`,
      html: `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:white;border-radius:16px;overflow:hidden;max-width:600px;width:100%">
      <tr><td style="background:#0a1940;padding:28px 32px;text-align:center">
        <div style="color:white;font-size:22px;font-weight:800">🚗 Man's Location</div>
        <div style="color:rgba(255,255,255,0.7);font-size:13px;margin-top:6px">Location de véhicules</div>
      </td></tr>
      <tr><td style="padding:32px">
        <p style="font-size:16px;color:#1e3a8a;font-weight:700;margin:0 0 12px">Bonjour ${prenom},</p>
        <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 16px">
          Votre contrat de location est disponible en pièce jointe.<br><br>
          <strong>Pour obtenir votre PDF :</strong><br>
          1. Ouvrez la pièce jointe <code>contrat_${id}.html</code><br>
          2. Elle s'ouvre dans votre navigateur<br>
          3. Faites <strong>Ctrl+P</strong> (ou Cmd+P sur Mac)<br>
          4. Choisissez <strong>"Enregistrer en PDF"</strong>
        </p>
        <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:14px">
          <p style="margin:0;font-size:13px;color:#16a34a;font-weight:700">📎 Pièce jointe : contrat_${id}.html</p>
        </div>
      </td></tr>
      <tr><td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e5e7eb;text-align:center">
        <p style="font-size:11px;color:#9ca3af;margin:0">Man's Location — mail automatique</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`,
      attachments: [{
        filename: `contrat_${id}.html`,
        content: htmlContent,
        contentType: "text/html; charset=utf-8",
      }],
    });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-contract-email error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
