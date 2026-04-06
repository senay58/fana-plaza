-- FANA PLAZA MANAGER: EXECUTIVE REGISTRY EXPANSION (V4.0)
-- RUN THIS IN YOUR SUPABASE SQL EDITOR TO ACTIVATE IDENTITY PLATES & PREDICTIVE ALERTS

-- 1. SYSTEM SETTINGS TABLE (Branding & Policy)
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT DEFAULT 'admin@fanaplaza.com',
    passcode TEXT DEFAULT '1234',
    penalty_rate NUMERIC DEFAULT 5,
    grace_period INTEGER DEFAULT 5,
    lease_expiry_days INTEGER DEFAULT 7, -- Custom warning threshold
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure lease_expiry_days exists for existing tables
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='system_settings' AND column_name='lease_expiry_days') THEN
        ALTER TABLE public.system_settings ADD COLUMN lease_expiry_days INTEGER DEFAULT 7;
    END IF;
END $$;

-- 2. TENANTS TABLE (Detailed Identity Plate)
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS id_number TEXT,
ADD COLUMN IF NOT EXISTS business_type TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS lease_start TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS lease_end TIMESTAMPTZ;

-- 3. TENANT DOCUMENTS TABLE (Archival)
CREATE TABLE IF NOT EXISTS public.tenant_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. HARDENED RLS POLICIES (Public for management dev)
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_documents ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public system_settings access') THEN
        CREATE POLICY "Public system_settings access" ON public.system_settings FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public tenant_documents access') THEN
        CREATE POLICY "Public tenant_documents access" ON public.tenant_documents FOR ALL USING (true);
    END IF;
END $$;

-- 5. AUTOMATIC ROOM STATUS TRIGGER (Enhanced)
CREATE OR REPLACE FUNCTION public.handle_room_occupancy()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.rooms SET status = 'occupied' WHERE id = NEW.room_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.rooms SET status = 'vacant' WHERE id = OLD.room_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_tenant_unit_change ON public.tenants;
CREATE TRIGGER on_tenant_unit_change
AFTER INSERT OR DELETE ON public.tenants
FOR EACH ROW EXECUTE FUNCTION public.handle_room_occupancy();
