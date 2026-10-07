import { Resend } from "resend";

const MAX_NAME = 80;
const MAX_EMAIL = 120;
const MAX_MESSAGE = 2000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fail = (error: string, status: number) =>
  Response.json({ ok: false, error }, { status });

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail("Solicitud inválida.", 400);
  }

  // Honeypot: un bot rellena este campo oculto. Se responde "ok" sin enviar nada.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return Response.json({ ok: true, name: "" });
  }

  // Se quitan saltos de línea del nombre porque va en el asunto del correo.
  const name = String(body.name ?? "").replace(/[\r\n]+/g, " ").trim();
  const email = String(body.email ?? "").trim();
  const message = String(body.message ?? "").trim();

  if (!name || !email || !message) {
    return fail("Completa todos los campos.", 400);
  }
  if (name.length > MAX_NAME || email.length > MAX_EMAIL || message.length > MAX_MESSAGE) {
    return fail("Algún campo supera la longitud permitida.", 400);
  }
  if (!EMAIL_RE.test(email)) {
    return fail("El correo electrónico no es válido.", 400);
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !to || !from) {
    console.error("[contact] Faltan RESEND_API_KEY, CONTACT_TO_EMAIL o CONTACT_FROM_EMAIL en .env");
    return fail("El envío de mensajes no está disponible por ahora.", 500);
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: email,
      subject: `[Arcade Vault] Mensaje de ${name}`,
      text: `Nombre: ${name}\nCorreo: ${email}\n\n${message}`,
    });
    if (error) {
      console.error("[contact] Resend rechazó el envío:", error);
      return fail("No se pudo enviar el mensaje. Inténtalo de nuevo más tarde.", 500);
    }
  } catch (err) {
    console.error("[contact] Error inesperado al enviar:", err);
    return fail("No se pudo enviar el mensaje. Inténtalo de nuevo más tarde.", 500);
  }

  return Response.json({ ok: true, name });
}
