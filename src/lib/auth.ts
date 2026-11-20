import type {Session} from '@supabase/supabase-js';
import type {AdminProfile} from '../types/menu';
import {getFriendlyErrorMessage, supabase} from './supabase';

export interface AuthorizedAdminSession {
  session: Session;
  profile: AdminProfile;
}

export async function verifyAdminProfile(userId: string): Promise<AdminProfile | null> {
  if (!supabase) return null;

  const {data, error} = await supabase
    .from('admin_profiles')
    .select('id, auth_user_id, email, created_at')
    .eq('auth_user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(getFriendlyErrorMessage(error, 'Failed to verify administrator profile.'));
  }

  return data;
}

export async function getAuthorizedAdminSession(): Promise<AuthorizedAdminSession | null> {
  if (!supabase) return null;

  const {data, error} = await supabase.auth.getSession();
  if (error) {
    throw new Error(getFriendlyErrorMessage(error, 'Unable to read authentication session.'));
  }

  if (!data.session?.user) {
    return null;
  }

  const profile = await verifyAdminProfile(data.session.user.id);
  if (!profile) {
    // Sign out any authenticated user who is not registered in admin_profiles
    await supabase.auth.signOut();
    return null;
  }

  return {
    session: data.session,
    profile,
  };
}

export async function signInAdmin(email: string, password: string): Promise<AuthorizedAdminSession> {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add your environment variables first.');
  }

  const normalizedEmail = email.trim();
  if (!normalizedEmail || !password) {
    throw new Error('Email and password are required.');
  }

  const {data, error} = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error || !data.session || !data.user) {
    throw new Error(getFriendlyErrorMessage(error, 'Authentication failed.'));
  }

  const profile = await verifyAdminProfile(data.user.id);
  if (!profile) {
    await supabase.auth.signOut();
    throw new Error(
      'This account is not registered as the authorized administrator in admin_profiles.'
    );
  }

  return {
    session: data.session,
    profile,
  };
}

export async function signOutAdmin(): Promise<void> {
  if (!supabase) return;
  const {error} = await supabase.auth.signOut();
  if (error) {
    throw new Error(getFriendlyErrorMessage(error, 'Failed to sign out.'));
  }
}
