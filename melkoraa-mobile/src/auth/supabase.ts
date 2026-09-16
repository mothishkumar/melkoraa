import "react-native-url-polyfill/auto";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";

import { env, isSupabaseConfigured } from "@/src/config/env";
import { secureStorage } from "@/src/auth/secure-storage";

const SUPABASE_AUTH_STORAGE_KEY = "melkoraa.supabase.auth";

let client: SupabaseClient | null = null;

function createSupabaseClient(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env.",
    );
  }

  const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      storage: secureStorage,
      storageKey: SUPABASE_AUTH_STORAGE_KEY,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  if (Platform.OS !== "web") {
    AppState.addEventListener("change", (state) => {
      if (state === "active") {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });
  }

  return supabase;
}

export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    client = createSupabaseClient();
  }
  return client;
}

export async function getAccessToken(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const { data } = await getSupabaseClient().auth.getSession();
  return data.session?.access_token ?? null;
}
