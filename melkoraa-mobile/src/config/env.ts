export type AppEnvironment = "development" | "production";

const DEFAULT_PROD_API_URL = "https://www.melkoraa.in/api/v1";
const DEFAULT_PROD_SITE_URL = "https://www.melkoraa.in";

const PRIVATE_HOST_PATTERN =
  /(^|\/\/)(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:|\/|$)/i;

function trimUrl(value: string): string {
  return value.trim().replace(/\/$/, "");
}

export function resolveAppEnvironment(
  raw = process.env.EXPO_PUBLIC_APP_ENV ?? process.env.APP_ENV,
): AppEnvironment {
  return raw === "production" ? "production" : "development";
}

export function assertProductionApiUrl(url: string, appEnv: AppEnvironment): void {
  if (appEnv !== "production") return;
  if (PRIVATE_HOST_PATTERN.test(url)) {
    throw new Error(
      "Production builds cannot target localhost or private-network API URLs.",
    );
  }
}

export function resolveApiUrl(
  appEnv: AppEnvironment,
  explicit?: string,
  devFallback?: string,
): string {
  if (explicit && explicit.trim().length > 0) {
    const url = trimUrl(explicit);
    assertProductionApiUrl(url, appEnv);
    return url;
  }

  if (appEnv === "production") {
    return DEFAULT_PROD_API_URL;
  }

  const devUrl = devFallback ? trimUrl(devFallback) : DEFAULT_PROD_API_URL;
  assertProductionApiUrl(devUrl, appEnv);
  return devUrl;
}

export function resolveSiteUrl(explicit?: string): string {
  return trimUrl(explicit && explicit.trim().length > 0 ? explicit : DEFAULT_PROD_SITE_URL);
}

const appEnv = resolveAppEnvironment();

export const env = {
  appEnv,
  isProduction: appEnv === "production",
  apiUrl: resolveApiUrl(
    appEnv,
    process.env.EXPO_PUBLIC_API_URL,
    process.env.EXPO_PUBLIC_DEV_API_URL,
  ),
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? "",
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "",
  siteUrl: resolveSiteUrl(process.env.EXPO_PUBLIC_SITE_URL),
};

export function isSupabaseConfigured(): boolean {
  return env.supabaseUrl.length > 0 && env.supabaseAnonKey.length > 0;
}
