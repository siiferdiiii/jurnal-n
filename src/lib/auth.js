import { supabase } from './supabase';

/** Sign up with email + password */
export async function signUp(email, password, displayName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
    },
  });
  if (error) throw error;
  return data;
}

/** Sign in with email + password */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/** Sign out current user */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/** Get current session (returns null if not logged in) */
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/** Subscribe to auth state changes. Returns unsubscribe function. */
export function onAuthStateChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return () => subscription.unsubscribe();
}
