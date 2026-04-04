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
    const { clientEmail, clientName, contractId, fileName } = await req.json();

    if (!clientEmail || !fileName) {
      return new Response(
        JSON.stringify({ error: "clientEmail et fileName sont requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const gmailUser = Deno.env.get("GMAIL_USER");
    const gmailPass = Deno.env.get("GMAIL_APP_PASSWORD");
    if (!gmailUser || !gmailPass) {
      return new Response(
        JSON.stringify({ error: "Variables GMAIL_USER / GMAIL_APP_PASSWORD manquantes" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Récupérer le HTML du contrat depuis Storage
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: fileData, error: fileErr } = await supabase.storage
      .from("contrats")
      .download(fileName);
    if (fileErr || !fileData) throw new Error("Impossible de récupérer le contrat : " + fileErr?.message);
    const htmlContent = await fileData.text();

    const prenom = (clientName || "").split(" ")[0] || "Client";

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
      html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:white;border-radius:16px;overflow:hidden;max-width:600px;width:100%">
        <tr>
          <td style="background:#0a1940;padding:28px 32px;text-align:center">
            <div style="color:white;font-size:22px;font-weight:800">🚗 Man's Location</div>
            <div style="color:rgba(255,255,255,0.7);font-size:13px;margin-top:6px">Location de véhicules</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px">
            <p style="font-size:16px;color:#1e3a8a;font-weight:700;margin:0 0 12px">Bonjour ${prenom},</p>
            <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 20px">
              Votre contrat de location a bien été enregistré.<br>
              <strong>Votre contrat est joint à ce mail</strong> (fichier <code>contrat_${contractId}.html</code>).<br><br>
              Pour l'ouvrir : double-cliquez sur la pièce jointe → il s'ouvre dans votre navigateur → faites <strong>Ctrl+P</strong> (ou Cmd+P sur Mac) → choisissez <strong>"Enregistrer en PDF"</strong>.
            </p>
            <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:16px;margin:16px 0">
              <p style="margin:0;font-size:13px;color:#16a34a;font-weight:700">✅ Pièce jointe : contrat_${contractId}.html</p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:18px 32px;border-top:1px solid #e5e7eb;text-align:center">
            <p style="font-size:11px;color:#9ca3af;margin:0">Mail envoyé automatiquement par Man's Location</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
      attachments: [{
        filename: `contrat_${contractId}.html`,
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
