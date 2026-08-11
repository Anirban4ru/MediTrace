-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'INSPECTOR_ROLE',
    display_name TEXT
);

-- AUTOMATIC PROFILE CREATION TRIGGER
-- This automatically inserts a row into public.profiles when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role, display_name)
  VALUES (
    new.id,
    COALESCE((new.raw_user_meta_data->>'role'), 'INSPECTOR_ROLE'),
    COALESCE((new.raw_user_meta_data->>'display_name'), split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- BATCHES
CREATE TABLE IF NOT EXISTS public.batches (
    batch_id TEXT PRIMARY KEY,
    product_name TEXT,
    manufacturer TEXT,
    manufacturer_label TEXT,
    current_status TEXT,
    units INTEGER,
    serial TEXT,
    origin_lat DOUBLE PRECISION,
    origin_lng DOUBLE PRECISION,
    origin_label TEXT,
    dest_lat DOUBLE PRECISION,
    dest_lng DOUBLE PRECISION,
    dest_label TEXT,
    provision_tx TEXT,
    provision_block INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TELEMETRY CHECKPOINTS
CREATE TABLE IF NOT EXISTS public.telemetry_checkpoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id TEXT REFERENCES public.batches(batch_id) ON DELETE CASCADE,
    timestamp BIGINT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    temperature DOUBLE PRECISION,
    signer TEXT,
    tx_hash TEXT,
    breached BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ALERTS
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id TEXT,
    alert_type TEXT,
    message TEXT,
    severity TEXT,
    acknowledged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id TEXT,
    event_type TEXT,
    actor TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- VERIFICATIONS
CREATE TABLE IF NOT EXISTS public.verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id TEXT,
    authenticity_score DOUBLE PRECISION,
    anomalies_detected BOOLEAN,
    processing_time_ms INTEGER,
    bounding_boxes INTEGER,
    ssim_distance DOUBLE PRECISION,
    proof_tx_hash TEXT,
    proof_block INTEGER,
    contract_address TEXT,
    chain TEXT,
    inspector TEXT,
    verified_at BIGINT,
    method TEXT,
    image_preview TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
