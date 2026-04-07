import nodemailer from "npm:nodemailer@6";
import { createClient } from "npm:@supabase/supabase-js@2";

// Restrict CORS to known origins only
const ALLOWED_ORIGINS = [
  "https://mans-location.vercel.app",
  "http://localhost:3000",
];

function getCorsHeaders(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}

// Strict email format validation
function isValidEmail(email: string): boolean {
  return /^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{2,}$/.test(email) && email.length <= 320;
}

// Escape HTML to prevent injection in email body
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

// Sanitize a string to safe alphanumeric + limited chars (for filenames/IDs)
function sanitizeId(str: string): string {
  return str.replace(/[^a-zA-Z0-9\-_]/g, "").slice(0, 100);
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Require authentication — only authenticated users can send contract emails
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Authentification requise" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: "Authentification invalide" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { clientEmail, clientName, contractId, pdfBase64 } = await req.json();

    if (!clientEmail || !pdfBase64) {
      return new Response(
        JSON.stringify({ error: "clientEmail et pdfBase64 sont requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    if (!isValidEmail(clientEmail)) {
      return new Response(
        JSON.stringify({ error: "Format email invalide" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate PDF size (max 10 MB in base64 ≈ 13.6 MB encoded)
    if (pdfBase64.length > 14_000_000) {
      return new Response(
        JSON.stringify({ error: "PDF trop volumineux (max 10 Mo)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const gmailUser = Deno.env.get("GMAIL_USER");
    const gmailPass = Deno.env.get("GMAIL_APP_PASSWORD");
    if (!gmailUser || !gmailPass) {
      // Log server-side only, no details to client
      console.error("GMAIL env vars missing");
      return new Response(
        JSON.stringify({ error: "Erreur configuration serveur" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize user-controlled values before embedding in HTML
    const prenom = escapeHtml((clientName || "").split(" ")[0] || "Client").slice(0, 50);
    const id = sanitizeId(contractId || "location");

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
          Votre contrat de location est disponible en pièce jointe (PDF).
        </p>
        <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:14px">
          <p style="margin:0;font-size:13px;color:#16a34a;font-weight:700">📎 contrat_${id}.pdf</p>
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
        filename: `contrat_${id}.pdf`,
        content: pdfBase64,
        encoding: "base64",
        contentType: "application/pdf",
      }],
    });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    // Log full error server-side, return generic message to client
    console.error("send-contract-email error:", err);
    return new Response(
      JSON.stringify({ error: "Erreur lors de l'envoi" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
