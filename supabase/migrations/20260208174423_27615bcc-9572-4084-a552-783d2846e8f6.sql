-- ============================================================================
-- Neon Migration: Swift Status Tracker
-- Consolidated from Supabase migrations
-- ============================================================================

-- 0. Helper function to generate a random public_id (replaces pgcrypto's gen_random_bytes)
CREATE OR REPLACE FUNCTION public.generate_public_id()
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(replace(gen_random_uuid()::text, '-', ''))
$$;

-- 1. Create app_role enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'user');
  END IF;
END $$;

-- 2. Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create transfers table
CREATE TABLE IF NOT EXISTS public.transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id TEXT NOT NULL UNIQUE DEFAULT public.generate_public_id(),
  sender_name TEXT NOT NULL,
  sender_reference TEXT,
  recipient_name TEXT NOT NULL,
  amount NUMERIC(20, 8) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  method TEXT NOT NULL CHECK (method IN ('bank', 'crypto')),
  bank_name TEXT,
  account_number TEXT,
  account_name TEXT,
  bank_country TEXT,
  crypto_type TEXT,
  wallet_address TEXT,
  network TEXT,
  transaction_hash TEXT,
  fee_amount NUMERIC,
  fee_btc_address TEXT,
  fee_paid BOOLEAN NOT NULL DEFAULT false,
  fee_paid_at TIMESTAMPTZ,
  fee_note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;

-- 4. Create transfer_timeline_events table
CREATE TABLE IF NOT EXISTS public.transfer_timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID REFERENCES public.transfers(id) ON DELETE CASCADE NOT NULL,
  step_name TEXT NOT NULL,
  step_order INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.transfer_timeline_events ENABLE ROW LEVEL SECURITY;

-- 5. Helper function: is_admin (uses Neon auth user ID from JWT claim)
-- NOTE: auth.uid() is provided by Neon's built-in auth extension.
-- Enable it in the Neon Console: Project → Branch → Auth → Enable Auth.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = COALESCE(
      NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid,
      '00000000-0000-0000-0000-000000000000'::uuid
    )
      AND role = 'admin'
  )
$$;

-- 6. Public view for transfers (exposes all fields as final migration state)
CREATE OR REPLACE VIEW public.transfers_public
WITH (security_invoker = on)
AS
SELECT
  t.public_id,
  t.sender_name,
  t.recipient_name,
  t.amount,
  t.currency,
  t.method,
  t.status,
  t.bank_name,
  t.bank_country,
  t.network,
  t.crypto_type,
  t.updated_at,
  t.created_at,
  t.fee_amount,
  t.fee_btc_address,
  t.wallet_address,
  t.fee_paid,
  t.fee_paid_at,
  t.fee_note,
  t.admin_notes,
  t.account_number,
  CASE WHEN t.account_number IS NOT NULL THEN '****' || RIGHT(t.account_number, 4) ELSE NULL END AS account_number_masked
FROM public.transfers t;

-- 7. Function: get_timeline_by_public_id (called from TransferStatus page)
CREATE OR REPLACE FUNCTION public.get_timeline_by_public_id(p_public_id TEXT)
RETURNS SETOF public.transfer_timeline_events
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tte.*
  FROM public.transfer_timeline_events tte
  JOIN public.transfers t ON t.id = tte.transfer_id
  WHERE t.public_id = p_public_id
  ORDER BY tte.step_order ASC;
$$;

-- 8. RLS Policies for user_roles (admin-only management)
DROP POLICY IF EXISTS "Admins can manage user_roles" ON public.user_roles;
CREATE POLICY "Admins can manage user_roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 9. RLS Policies for transfers (admin-only management)
DROP POLICY IF EXISTS "Admins can manage transfers" ON public.transfers;
CREATE POLICY "Admins can manage transfers"
  ON public.transfers FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 10. RLS Policies for transfer_timeline_events (admin-only management)
DROP POLICY IF EXISTS "Admins can manage timeline events" ON public.transfer_timeline_events;
CREATE POLICY "Admins can manage timeline events"
  ON public.transfer_timeline_events FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 11. Public read access via views and functions
-- Grant anon role access to the public view and the RPC function
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.transfers_public TO anon;
GRANT EXECUTE ON FUNCTION public.get_timeline_by_public_id TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transfer_timeline_events TO anon;

-- 12. Update trigger for transfers.updated_at (drop if exists for idempotency)
DROP TRIGGER IF EXISTS update_transfers_updated_at ON public.transfers;
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_transfers_updated_at
  BEFORE UPDATE ON public.transfers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 13. Comments for documentation
COMMENT ON COLUMN public.transfers.fee_amount IS 'Optional fee charge amount for the transfer';
COMMENT ON COLUMN public.transfers.fee_btc_address IS 'BTC address where the fee should be sent';
COMMENT ON COLUMN public.transfers.fee_paid IS 'Whether the fee has been confirmed as paid';
COMMENT ON COLUMN public.transfers.fee_paid_at IS 'Timestamp when the fee payment was confirmed';
COMMENT ON COLUMN public.transfers.fee_note IS 'Custom fee note text displayed to the recipient';
