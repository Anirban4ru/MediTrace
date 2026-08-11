-- Supabase Row Level Security (RLS) Policies

-- 1. Enable RLS on all tables
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Create a helper function to get the current user's role from the profiles table
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 3. SELECT Policies: Everyone authenticated can SELECT
DROP POLICY IF EXISTS "Allow authenticated SELECT on batches" ON batches;
CREATE POLICY "Allow authenticated SELECT on batches" ON batches FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated SELECT on telemetry_checkpoints" ON telemetry_checkpoints;
CREATE POLICY "Allow authenticated SELECT on telemetry_checkpoints" ON telemetry_checkpoints FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated SELECT on alerts" ON alerts;
CREATE POLICY "Allow authenticated SELECT on alerts" ON alerts FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated SELECT on audit_logs" ON audit_logs;
CREATE POLICY "Allow authenticated SELECT on audit_logs" ON audit_logs FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated SELECT on verifications" ON verifications;
CREATE POLICY "Allow authenticated SELECT on verifications" ON verifications FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated SELECT on profiles" ON profiles;
CREATE POLICY "Allow authenticated SELECT on profiles" ON profiles FOR SELECT TO authenticated USING (true);

-- 4. INSERT / UPDATE Policies keyed off profiles.role
-- Manufacturer can insert batches
DROP POLICY IF EXISTS "Manufacturer can insert batches" ON batches;
CREATE POLICY "Manufacturer can insert batches" ON batches 
FOR INSERT TO authenticated 
WITH CHECK (public.get_user_role() IN ('MANUFACTURER_ROLE', 'SUPERIOR_HEAD_ROLE'));

-- Carrier can insert telemetry_checkpoints
DROP POLICY IF EXISTS "Carrier can insert telemetry" ON telemetry_checkpoints;
CREATE POLICY "Carrier can insert telemetry" ON telemetry_checkpoints 
FOR INSERT TO authenticated 
WITH CHECK (public.get_user_role() IN ('CARRIER_ROLE', 'MANUFACTURER_ROLE', 'SUPERIOR_HEAD_ROLE'));

-- Admin / Inspector can update alerts
DROP POLICY IF EXISTS "Admin can update alerts" ON alerts;
CREATE POLICY "Admin can update alerts" ON alerts 
FOR UPDATE TO authenticated 
USING (public.get_user_role() IN ('INSPECTOR_ROLE', 'ADMIN_ROLE', 'admin', 'SUPERIOR_HEAD_ROLE'));

-- Admin / Inspector can insert audit logs
DROP POLICY IF EXISTS "Admin can insert audit logs" ON audit_logs;
CREATE POLICY "Admin can insert audit logs" ON audit_logs 
FOR INSERT TO authenticated 
WITH CHECK (public.get_user_role() IN ('INSPECTOR_ROLE', 'ADMIN_ROLE', 'admin', 'SUPERIOR_HEAD_ROLE'));

-- Inspector can insert verifications
DROP POLICY IF EXISTS "Inspector can insert verifications" ON verifications;
CREATE POLICY "Inspector can insert verifications" ON verifications
FOR INSERT TO authenticated
WITH CHECK (public.get_user_role() IN ('INSPECTOR_ROLE', 'ADMIN_ROLE', 'admin', 'SUPERIOR_HEAD_ROLE'));

-- Superior Head can update profiles (Role Allocation)
DROP POLICY IF EXISTS "Superior Head can update profiles" ON profiles;
CREATE POLICY "Superior Head can update profiles" ON profiles
FOR UPDATE TO authenticated
USING (public.get_user_role() = 'SUPERIOR_HEAD_ROLE');

-- Users can insert their own profile during signup (triggered via handle_new_user, which uses SECURITY DEFINER, but if they hit it directly, we need this)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);
