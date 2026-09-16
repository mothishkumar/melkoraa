import * as Linking from "expo-linking";

import { getSupabaseClient } from "@/src/auth/supabase";

type ParsedAuthParams = {
  accessToken?: string;
  refreshToken?: string;
  code?: string;
  type?: string;
  error?: string;
  errorDescription?: string;
};

export type AuthCallbackResult = {
  nextPath: "/(auth)/reset-password" | "/(tabs)/profile";
};

function parseAuthParams(url: string): ParsedAuthParams {
  const parsed = Linking.parse(url);
  const query = parsed.queryParams ?? {};
  const hash = url.includes("#") ? url.split("#")[1] : "";
  const hashParams = new URLSearchParams(hash);

  const read = (key: string) => {
    const fromQuery = query[key];
    if (typeof fromQuery === "string" && fromQuery.length > 0) return fromQuery;
    const fromHash = hashParams.get(key);
    return fromHash && fromHash.length > 0 ? fromHash : undefined;
  };

  return {
    accessToken: read("access_token"),
    refreshToken: read("refresh_token"),
    code: read("code"),
    type: read("type"),
    error: read("error"),
    errorDescription: read("error_description"),
  };
}

export function mobileAuthRedirect(path = "auth/callback"): string {
  return Linking.createURL(path);
}

export async function completeAuthCallbackFromUrl(
  url: string,
): Promise<AuthCallbackResult> {
  const params = parseAuthParams(url);

  if (params.error) {
    throw new Error(params.errorDescription ?? params.error);
  }

  const supabase = getSupabaseClient();

  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) throw error;
    return {
      nextPath:
        params.type === "recovery"
          ? "/(auth)/reset-password"
          : "/(tabs)/profile",
    };
  }

  if (params.accessToken && params.refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: params.accessToken,
      refresh_token: params.refreshToken,
    });
    if (error) throw error;
    return {
      nextPath:
        params.type === "recovery"
          ? "/(auth)/reset-password"
          : "/(tabs)/profile",
    };
  }

  throw new Error("Auth link did not include a valid session.");
}
