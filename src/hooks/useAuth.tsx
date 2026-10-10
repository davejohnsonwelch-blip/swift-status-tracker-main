import { useEffect, useState, useCallback } from "react";
import { User, Session } from "@supabase/auth-js";
import { neon } from "@/integrations/neon/client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdmin = useCallback(async (userId: string | null) => {
    if (!userId) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    const { data } = await neon
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    setIsAdmin(!!data);
    setLoading(false);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = neon.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session ?? null);
        setUser(session?.user ?? null);
        if (session?.user) {
          checkAdmin(session.user.id);
        } else {
          checkAdmin(null);
        }
      }
    );

    neon.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        checkAdmin(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [checkAdmin]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await neon.auth.signInWithPassword({ email, password });
    if (!error) {
      await new Promise(resolve => setTimeout(resolve, 100));
      neon.auth.getSession();
    }
    return { error };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await neon.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    if (!error) {
      await new Promise(resolve => setTimeout(resolve, 100));
      neon.auth.getSession();
    }
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    await neon.auth.signOut();
    setIsAdmin(false);
  }, []);

  return { user, session, loading, isAdmin, signIn, signUp, signOut };
}
