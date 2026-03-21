import dotenv from "dotenv";

dotenv.config();

const parseNumber = (value: string | undefined, fallback: number) => {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const splitCsv = (value: string | undefined, fallback: string[]) => {
  if (!value) {
    return fallback;
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

export const config = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseNumber(process.env.PORT, 8080),
  HOST: process.env.HOST || "0.0.0.0",
  BASE_DOMAIN: process.env.BASE_DOMAIN || "sharelive.site",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
  CORS_ORIGINS: splitCsv(process.env.CORS_ORIGIN, ["http://localhost:3000"]),
  REQUIRE_AUTH: process.env.REQUIRE_AUTH === "true",
  SMTP_HOST: process.env.SMTP_HOST || "smtp.gmail.com",
  SMTP_PORT: parseNumber(process.env.SMTP_PORT, 587),
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || "",
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || "",
  CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN || "",
  CLOUDFLARE_ZONE_ID: process.env.CLOUDFLARE_ZONE_ID || "",
  // Security settings
  MAX_REQUEST_SIZE: parseNumber(process.env.MAX_REQUEST_SIZE, 10 * 1024 * 1024), // 10MB default
  MAX_TUNNEL_LIFETIME: parseNumber(process.env.MAX_TUNNEL_LIFETIME, 4 * 60 * 60 * 1000), // 4 hours default
  TUNNEL_RATE_LIMIT: parseNumber(process.env.TUNNEL_RATE_LIMIT, 100), // 100 requests per minute per tunnel
  ENABLE_TUNNEL_TOKENS: process.env.ENABLE_TUNNEL_TOKENS === "true",
};
