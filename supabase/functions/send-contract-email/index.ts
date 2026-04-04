import nodemailer from "npm:nodemailer@6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { clientEmail, clientName, contractUrl, contractId } = await req.json();

    if (!clientEmail || !contractUrl) {
      return new Response(
        JSON.stringify({ error: "clientEmail et contractUrl sont requis" }),
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

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: gmailUser, pass: gmailPass },
    });

    const prenom = (clientName || "").split(" ")[0] || clientName || "Client";

    await transporter.sendMail({
      from: `"Man's Location" <${gmailUser}>`,
      to: clientEmail,
      subject: `Votre contrat de location — ${contractId}`,
      html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:white;border-radius:16px;overflow:hidden;max-width:600px;width:100%">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0a1940,#1e3a8a);padding:28px 32px;text-align:center">
            <div style="color:white;font-size:22px;font-weight:800;letter-spacing:-0.5px">🚗 Man's Location</div>
            <div style="color:rgba(255,255,255,0.7);font-size:13px;margin-top:6px">Location de véhicules</div>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px">
            <p style="font-size:16px;color:#1e3a8a;font-weight:700;margin:0 0 12px">Bonjour ${prenom},</p>
            <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 20px">
              Votre contrat de location <strong>#${contractId}</strong> a bien été enregistré.<br>
              Vous pouvez le consulter et le télécharger en cliquant sur le bouton ci-dessous.
            </p>
            <div style="text-align:center;margin:28px 0">
              <a href="${contractUrl}" target="_blank"
                style="display:inline-block;background:linear-gradient(135deg,#0a1940,#1e3a8a);color:white;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:0.3px">
                📄 Télécharger mon contrat
              </a>
            </div>
            <p style="font-size:12px;color:#6b7280;line-height:1.6;margin:0">
              Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
              <a href="${contractUrl}" style="color:#1e3a8a;word-break:break-all">${contractUrl}</a>
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:18px 32px;border-top:1px solid #e5e7eb;text-align:center">
            <p style="font-size:11px;color:#9ca3af;margin:0">
              Ce mail a été envoyé automatiquement suite à la création de votre contrat de location.<br>
              Conservez ce lien — il vous permet d'accéder à votre contrat à tout moment.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
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
