import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { authService } from '@/lib/auth/authService';

type AuthContextValue = {
  user: any;
  guestMode: boolean;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  enterGuestMode: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const GUEST_KEY = 'wte_guest_mode';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [guestMode, setGuestMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const storedGuest = await AsyncStorage.getItem(GUEST_KEY);
        if (mounted && storedGuest === '1') setGuestMode(true);
      } catch {
        // ignore
      }

      const { user: currentUser } = await authService.getCurrentUser();
      if (mounted) {
        setUser(currentUser);
        setLoading(false);
      }
    })();

    const { data } = authService.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);

      // 一旦登录成功，退出游客模式
      if (session?.user) {
        setGuestMode(false);
        try {
          await AsyncStorage.removeItem(GUEST_KEY);
        } catch {
          // ignore
        }
      }
    });

    return () => {
      mounted = false;
      data?.subscription?.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      guestMode,
      loading,
      async signUp(email, password) {
        const { data, error } = await authService.signUp(email, password);
        if (error) throw error;
        return data;
      },
      async signIn(email, password) {
        const { data, error } = await authService.signIn(email, password);
        if (error) throw error;
        return data;
      },
      async signOut() {
        const { error } = await authService.signOut();
        if (error) throw error;
      },
      async enterGuestMode() {
        setGuestMode(true);
        try {
          await AsyncStorage.setItem(GUEST_KEY, '1');
        } catch {
          // ignore
        }
      },
    }),
    [guestMode, loading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

