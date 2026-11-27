-- ============================================================================
-- QR MENU - DIGITAL MENU SYSTEM
-- Migration 006: Immutable Admin Audit Logs (Non-Destructive Additive Migration)
-- Run this in your Supabase Dashboard -> SQL Editor after Migration 005.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (char_length(trim(action)) > 0 AND char_length(action) <= 80),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('category', 'product', 'business_settings', 'storage')),
  entity_id TEXT CHECK (entity_id IS NULL OR char_length(entity_id) <= 100),
  summary TEXT NOT NULL CHECK (char_length(trim(summary)) > 0 AND char_length(summary) <= 240),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at
  ON public.admin_audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_entity
  ON public.admin_audit_logs (entity_type, created_at DESC);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Public/anonymous users have zero privileges on audit logs.
-- Audit logs are append-only: UPDATE and DELETE are completely revoked.
REVOKE ALL ON public.admin_audit_logs FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.admin_audit_logs TO authenticated;

DROP POLICY IF EXISTS "Admin can read audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admin can read audit logs"
  ON public.admin_audit_logs
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admin can append own audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admin can append own audit logs"
  ON public.admin_audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
    AND actor_user_id = auth.uid()
  );
