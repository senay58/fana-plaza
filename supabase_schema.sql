-- SQL MIGRATION FOR FANA PLAZA MANAGER

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Floors table
CREATE TABLE IF NOT EXISTS floors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number INTEGER UNIQUE NOT NULL,
  name TEXT,
  type TEXT DEFAULT 'commercial', -- 'commercial', 'residential'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  floor_id UUID REFERENCES floors(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  size DECIMAL,
  rent_price DECIMAL DEFAULT 0,
  status TEXT DEFAULT 'vacant', -- 'vacant', 'occupied', 'maintenance'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(floor_id, number)
);

-- 4. Create Tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  contact_number TEXT,
  email TEXT,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  lease_start_date DATE,
  lease_end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create Tenant Documents table
CREATE TABLE IF NOT EXISTS tenant_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Path in Supabase Storage
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  amount DECIMAL NOT NULL,
  status TEXT DEFAULT 'pending', -- 'paid', 'pending'
  due_date DATE DEFAULT CURRENT_DATE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Enable RLS (Row Level Security)
ALTER TABLE floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 8. Basic policy: Allow all access for development (PUBLIC / ANON)
-- WARNING: In production, switch this back to authenticated with proper userId checks!
ALTER TABLE floors DISABLE ROW LEVEL SECURITY;
ALTER TABLE rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Ensuring tables are accessible via API for development
DROP POLICY IF EXISTS "Allow all for authenticated" ON floors;
DROP POLICY IF EXISTS "Allow all for authenticated" ON rooms;
DROP POLICY IF EXISTS "Allow all for authenticated" ON tenants;
DROP POLICY IF EXISTS "Allow all for authenticated" ON tenant_documents;
DROP POLICY IF EXISTS "Allow all for authenticated" ON payments;
DROP POLICY IF EXISTS "Allow all for authenticated" ON notifications;

CREATE POLICY "Enable all for developer" ON floors FOR ALL TO public USING (true);
CREATE POLICY "Enable all for developer" ON rooms FOR ALL TO public USING (true);
CREATE POLICY "Enable all for developer" ON tenants FOR ALL TO public USING (true);
CREATE POLICY "Enable all for developer" ON tenant_documents FOR ALL TO public USING (true);
CREATE POLICY "Enable all for developer" ON payments FOR ALL TO public USING (true);
CREATE POLICY "Enable all for developer" ON notifications FOR ALL TO public USING (true);

-- 9. Feature Updates: Airbnb, Commercial, and Maintenance Overhaul
ALTER TABLE tenants 
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'direct';

-- Ensure maintenance_logs table exists (in case it was missing from schema script)
CREATE TABLE IF NOT EXISTS maintenance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  severity TEXT DEFAULT 'Medium',
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated" ON maintenance_logs;
CREATE POLICY "Enable all for developer" ON maintenance_logs FOR ALL TO public USING (true);

-- Add new properties to maintenance_logs
ALTER TABLE maintenance_logs
  ADD COLUMN IF NOT EXISTS assigned_to TEXT,
  ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS log_type TEXT DEFAULT 'general';

-- Add new properties to payments
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS staff_responsible TEXT;
