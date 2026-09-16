import type { Session, User } from "@supabase/supabase-js";

import { authApi } from "@/src/api/auth";
import { env, isSupabaseConfigured } from "@/src/config/env";
import { getSupabaseClient } from "@/src/auth/supabase";

export type SignUpInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

export type SignInInput = {
  email: string;
  password: string;
};

function mapAuthError(message: string): string {
  if (message.toLowerCase().includes("invalid login credentials")) {
    return "Email or password is incorrect.";
  }
  return message;
}

export const authService = {
  isConfigured() {
    return isSupabaseConfigured();
  },

  async getSession(): Promise<Session | null> {
    if (!isSupabaseConfigured()) return null;
    const { data, error } = await getSupabaseClient().auth.getSession();
    if (error) throw new Error(mapAuthError(error.message));
    return data.session;
  },

  async getUser(): Promise<User | null> {
    if (!isSupabaseConfigured()) return null;
    const { data, error } = await getSupabaseClient().auth.getUser();
    if (error || !data.user) return null;
    return data.user;
  },

  async signIn(input: SignInInput) {
    const { data, error } = await getSupabaseClient().auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });
    if (error) throw new Error(mapAuthError(error.message));
    return data;
  },

  async signUp(input: SignUpInput) {
    const { data, error } = await getSupabaseClient().auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          first_name: input.firstName,
          last_name: input.lastName,
        },
        emailRedirectTo: `${env.siteUrl}/auth/callback?next=/account`,
      },
    });
    if (error) throw new Error(mapAuthError(error.message));
    return data;
  },

  async signOut() {
    try {
      await authApi.logout();
    } catch {
      // Server logout may fail when cookie auth is unavailable on mobile.
    }
    const { error } = await getSupabaseClient().auth.signOut();
    if (error) throw new Error(mapAuthError(error.message));
  },

  async resetPassword(email: string) {
    const { error } = await getSupabaseClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${env.siteUrl}/auth/callback?next=/reset-password`,
    });
    if (error) throw new Error(mapAuthError(error.message));
  },

  async refreshSession() {
    const { data, error } = await getSupabaseClient().auth.refreshSession();
    if (error) throw new Error(mapAuthError(error.message));
    return data.session;
  },

  async updatePassword(password: string) {
    const { error } = await getSupabaseClient().auth.updateUser({ password });
    if (error) throw new Error(mapAuthError(error.message));
  },

  async fetchProfile() {
    return authApi.me();
  },
};
