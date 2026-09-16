const DEFAULT_API_URL = "https://www.melkoraa.in/api/v1";

function requireEnv(name: string, value: string | undefined): string {
  if (!value || value.trim().length === 0) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env and set required values.`,
    );
  }
  return value.trim().replace(/\/$/, "");
}

export const env = {
  apiUrl: requireEnv(
    "EXPO_PUBLIC_API_URL",
    process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL,
  ),
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? "",
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "",
  siteUrl: (process.env.EXPO_PUBLIC_SITE_URL ?? "https://www.melkoraa.in").replace(
    /\/$/,
    "",
  ),
};

export function isSupabaseConfigured(): boolean {
  return env.supabaseUrl.length > 0 && env.supabaseAnonKey.length > 0;
}
