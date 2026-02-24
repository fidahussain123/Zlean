import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

export type Role = 'super_admin' | 'admin' | 'worker' | 'customer';

export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: Role;
  shopId?: string;
}

export type AuthContextType = {
  user: AuthUser | null;
  session: Session | null;
  ready: boolean;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  ready: false,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setReady(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setReady(false);
        fetchProfile(session.user.id);
      } else {
        setUser(null);
        setReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        setUser({
          id: data.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          role: data.role as Role,
          shopId: data.shop_id,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setReady(true);
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, ready }}>
      {children}
    </AuthContext.Provider>
  );
}
