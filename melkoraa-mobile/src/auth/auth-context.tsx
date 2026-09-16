import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { setAccessTokenProvider } from "@/src/api/client";
import type { AuthMeDto } from "@/src/api/types/auth";
import {
  authService,
  type SignInInput,
  type SignUpInput,
} from "@/src/auth/auth-service";
import { getSupabaseClient } from "@/src/auth/supabase";
import { isSupabaseConfigured } from "@/src/config/env";

type AuthContextValue = {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: AuthMeDto | null;
  signIn: (input: SignInInput) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthMeDto | null>(null);
  const configured = isSupabaseConfigured();

  const refreshProfile = useCallback(async () => {
    if (!session) {
      setProfile(null);
      return;
    }
    try {
      const me = await authService.fetchProfile();
      setProfile(me);
    } catch {
      setProfile(null);
    }
  }, [session]);

  useEffect(() => {
    setAccessTokenProvider(async () => session?.access_token ?? null);
  }, [session]);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    let mounted = true;

    authService.getSession().then((initialSession) => {
      if (!mounted) return;
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setLoading(false);
    });

    const { data } = getSupabaseClient().auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [configured]);

  useEffect(() => {
    if (!session) {
      setProfile(null);
      return;
    }
    refreshProfile();
  }, [session, refreshProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      configured,
      loading,
      session,
      user,
      profile,
      async signIn(input) {
        const result = await authService.signIn(input);
        setSession(result.session);
        setUser(result.user);
      },
      async signUp(input) {
        const result = await authService.signUp(input);
        setSession(result.session);
        setUser(result.user);
      },
      async signOut() {
        await authService.signOut();
        setSession(null);
        setUser(null);
        setProfile(null);
      },
      async resetPassword(email) {
        await authService.resetPassword(email);
      },
      refreshProfile,
    }),
    [configured, loading, session, user, profile, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
