-- Run these exact commands in the Supabase SQL editor

-- 1. Ensure commercial room type tracking exists (safe override)
-- Note: Room types usually dictate pricing or structure, but for logic sake, we just need to ensure the columns we heavily rely on are present.

-- 2. Add full Airbnb support to tenants
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'direct';

-- 3. Add Maintenance Operational Log Columns
ALTER TABLE maintenance_logs
  ADD COLUMN IF NOT EXISTS assigned_to TEXT,
  ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS log_type TEXT DEFAULT 'general';

-- 4. Add Payment Audit Columns
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS staff_responsible TEXT;
