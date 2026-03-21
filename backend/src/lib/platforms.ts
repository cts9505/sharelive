export const ALLOWED_HOST_SUFFIXES = [
  ".vercel.app",
  ".netlify.app",
  ".onrender.com",
  ".railway.app",
  ".up.railway.app",
  ".fly.dev",
  ".herokuapp.com",
  ".azurewebsites.net",
  ".azurestaticapps.net",
  ".pages.dev",
  ".workers.dev",
  ".firebaseapp.com",
  ".web.app",
] as const;

export function isSupportedPlatformUrl(targetUrl: string): boolean {
  try {
    const hostname = new URL(targetUrl).hostname.toLowerCase();
    return ALLOWED_HOST_SUFFIXES.some((suffix) => {
      const normalized = suffix.slice(1);
      return hostname === normalized || hostname.endsWith(suffix);
    });
  } catch {
    return false;
  }
}
