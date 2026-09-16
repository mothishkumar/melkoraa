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

import { setAccessTokenProvider, setSessionHandlers } from "@/src/api/client";
import type { AuthMeDto } from "@/src/api/types/auth";
import {
  authService,
  type SignInInput,
  type SignUpInput,
} from "@/src/auth/auth-service";
import {
  consumePendingAction,
  type PendingAction,
} from "@/src/auth/pending-actions";
import { getSupabaseClient } from "@/src/auth/supabase";
import { cartService } from "@/src/services/cart.service";
import { wishlistService } from "@/src/services/wishlist.service";
import { isSupabaseConfigured } from "@/src/config/env";

type AuthContextValue = {
  configured: boolean;
  restoring: boolean;
  session: Session | null;
  user: User | null;
  profile: AuthMeDto | null;
  signIn: (input: SignInInput) => Promise<PendingAction | null>;
  signUp: (input: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  processPendingAction: () => Promise<PendingAction | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [restoring, setRestoring] = useState(true);
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

  const clearSession = useCallback(async () => {
    setSession(null);
    setUser(null);
    setProfile(null);
    try {
      await getSupabaseClient().auth.signOut();
    } catch {
      // ignore
    }
  }, []);

  const refreshAccessToken = useCallback(async () => {
    const nextSession = await authService.refreshSession();
    if (!nextSession?.access_token) return null;
    setSession(nextSession);
    setUser(nextSession.user);
    return nextSession.access_token;
  }, []);

  useEffect(() => {
    setAccessTokenProvider(async () => session?.access_token ?? null);
    setSessionHandlers(refreshAccessToken, clearSession);
  }, [session, refreshAccessToken, clearSession]);

  useEffect(() => {
    if (!configured) {
      setRestoring(false);
      return;
    }

    let mounted = true;

    authService.getSession().then((initialSession) => {
      if (!mounted) return;
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setRestoring(false);
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

  const processPendingAction = useCallback(async () => {
    const pending = await consumePendingAction();
    if (!pending) return null;

    if (pending.type === "add_to_cart") {
      await cartService.addItem({
        variantId: pending.variantId,
        quantity: pending.quantity,
      });
    } else if (pending.type === "wishlist_toggle") {
      await wishlistService.toggleItem(pending.productId);
    }

    return pending;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      configured,
      restoring,
      session,
      user,
      profile,
      async signIn(input) {
        const result = await authService.signIn(input);
        setSession(result.session);
        setUser(result.user);
        return processPendingAction();
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
      async updatePassword(password) {
        await authService.updatePassword(password);
      },
      refreshProfile,
      processPendingAction,
    }),
    [
      configured,
      restoring,
      session,
      user,
      profile,
      refreshProfile,
      processPendingAction,
    ],
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
