import type {Session, SupabaseClient} from '@supabase/supabase-js';
import type {AdminProfile} from '../types/menu';
import {getFriendlyErrorMessage, supabase} from './supabase';

export interface AuthorizedAdminSession {
  session: Session;
  profile: AdminProfile;
}

export async function verifyAdminProfile(
  userId: string,
  client: SupabaseClient | null = supabase
): Promise<AdminProfile | null> {
  if (!client) return null;

  const {data, error} = await client
    .from('admin_profiles')
    .select('id, auth_user_id, email, created_at')
    .eq('auth_user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(getFriendlyErrorMessage(error, 'Failed to verify administrator profile.'));
  }

  return data;
}

export async function getAuthorizedAdminSession(
  client: SupabaseClient | null = supabase
): Promise<AuthorizedAdminSession | null> {
  if (!client) return null;

  // Verify the current JWT directly with Supabase Auth server rather than trusting localStorage cache alone
  const {data: userData, error: userError} = await client.auth.getUser();
  if (userError || !userData.user) {
    return null;
  }

  const {data: sessionData, error: sessionError} = await client.auth.getSession();
  if (sessionError || !sessionData.session) {
    return null;
  }

  const profile = await verifyAdminProfile(userData.user.id, client);
  if (!profile) {
    // Sign out any authenticated user who is not registered in admin_profiles
    await client.auth.signOut();
    return null;
  }

  return {
    session: sessionData.session,
    profile,
  };
}

export async function requireAuthorizedAdmin(
  client: SupabaseClient | null = supabase
): Promise<AuthorizedAdminSession> {
  const authSession = await getAuthorizedAdminSession(client);
  if (!authSession) {
    throw new Error('Administrator authorization required.');
  }
  return authSession;
}

export async function signInAdmin(
  email: string,
  password: string,
  client: SupabaseClient | null = supabase
): Promise<AuthorizedAdminSession> {
  if (!client) {
    throw new Error('Supabase is not configured. Add your environment variables first.');
  }

  const normalizedEmail = email.trim();
  if (!normalizedEmail || !password) {
    throw new Error('Email and password are required.');
  }

  const {data, error} = await client.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error || !data.session || !data.user) {
    throw new Error(getFriendlyErrorMessage(error, 'Authentication failed.'));
  }

  const profile = await verifyAdminProfile(data.user.id, client);
  if (!profile) {
    await client.auth.signOut();
    throw new Error(
      'This account is not registered as the authorized administrator in admin_profiles.'
    );
  }

  return {
    session: data.session,
    profile,
  };
}

export async function signOutAdmin(client: SupabaseClient | null = supabase): Promise<void> {
  if (!client) return;
  const {error} = await client.auth.signOut();
  if (error) {
    throw new Error(getFriendlyErrorMessage(error, 'Failed to sign out.'));
  }
}
