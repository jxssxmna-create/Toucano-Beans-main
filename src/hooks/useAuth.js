import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { fetchUserProfile, isAdminUser } from '../lib/adminAuth';

export function useAuth() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authEvent, setAuthEvent] = useState(null);

  const refreshProfile = useCallback(async (user) => {
    if (!user) {
      setProfile(null);
      return null;
    }
    const data = await fetchUserProfile(user.id);
    setProfile(data);
    return data;
  }, []);

  useEffect(() => {
    let mounted = true;
    let subscription = null;

    async function init() {
      if (!isSupabaseConfigured) {
        if (mounted) {
          setSession(null);
          setProfile(null);
          setLoading(false);
        }
        return;
      }

      try {
        const { data, error } = await supabase.auth.getSession();
        if (!mounted) return;
        if (error) {
          console.error('[useAuth] getSession:', error.message);
          setSession(null);
        } else {
          setSession(data.session);
          if (data.session?.user) await refreshProfile(data.session.user);
        }
      } catch (err) {
        console.error('[useAuth] init error:', err);
        if (mounted) setSession(null);
      } finally {
        if (mounted) setLoading(false);
      }

      const { data: listener } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
        if (!mounted) return;
        setAuthEvent(event);
        setSession(nextSession);
        if (nextSession?.user) {
          await refreshProfile(nextSession.user);
        } else {
          setProfile(null);
        }
      });
      subscription = listener.subscription;
    }

    init();
    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [refreshProfile]);

  const isAdmin = useMemo(
    () => isAdminUser(session?.user, profile),
    [session, profile]
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setSession(null);
    setProfile(null);
  }, []);

  return {
    session,
    profile,
    loading,
    isAdmin,
    authEvent,
    signOut,
    refreshProfile,
  };
}
