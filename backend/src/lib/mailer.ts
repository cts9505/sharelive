import { config } from "../config";

let transporterPromise: Promise<any | null> | null = null;

async function getTransporter() {
  if (!config.SMTP_USER || !config.SMTP_PASS) {
    return null;
  }

  if (!transporterPromise) {
    transporterPromise = (async () => {
      const nodemailer = await import("nodemailer");
      return nodemailer.default.createTransport({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT,
        secure: false,
        auth: {
          user: config.SMTP_USER,
          pass: config.SMTP_PASS,
        },
      });
    })();
  }

  return transporterPromise;
}

export async function sendMail(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const transporter = await getTransporter();

  if (!transporter) {
    console.warn("[MAILER] SMTP not configured, skipping email send");
    return false;
  }

  await transporter.sendMail({
    from: `"ShareLive" <${config.SMTP_USER}>`,
    ...options,
  });

  return true;
}
