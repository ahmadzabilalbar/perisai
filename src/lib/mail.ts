import "server-only";
import nodemailer from "nodemailer";

/**
 * Outgoing email via SMTP (e.g. Gmail with an App Password:
 * SMTP_HOST=smtp.gmail.com, SMTP_PORT=465, SMTP_USER=you@gmail.com, SMTP_PASS=<app password>).
 */

export function isMailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

let transport: ReturnType<typeof nodemailer.createTransport> | null = null;
function transporter() {
  if (!transport) {
    const port = Number(process.env.SMTP_PORT) || 465;
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transport;
}

export async function sendMail({ to, subject, text, html }: { to: string; subject: string; text: string; html: string }) {
  await transporter().sendMail({
    from: process.env.MAIL_FROM || `PERISAI <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html,
  });
}
