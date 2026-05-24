-- FANA PLAZA MANAGER: TENANT CHECKOUT MIGRATION
-- Run this in your Supabase SQL Editor to enable the checkout workflow.

-- 1. Add 'status' column to tenants table (active, archived, evicted)
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 2. Add 'move_out_date' column to record when the tenant left
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS move_out_date TIMESTAMPTZ;

-- 3. Update the room occupancy trigger to also handle UPDATE (room_id change / nullification)
CREATE OR REPLACE FUNCTION public.handle_room_occupancy()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF NEW.room_id IS NOT NULL THEN
            UPDATE public.rooms SET status = 'occupied' WHERE id = NEW.room_id;
        END IF;
    ELSIF (TG_OP = 'UPDATE') THEN
        -- If room_id changed (tenant moved or checked out)
        IF OLD.room_id IS DISTINCT FROM NEW.room_id THEN
            -- Free up the old room if it existed
            IF OLD.room_id IS NOT NULL THEN
                UPDATE public.rooms SET status = 'vacant' WHERE id = OLD.room_id;
            END IF;
            -- Occupy the new room if assigned
            IF NEW.room_id IS NOT NULL THEN
                UPDATE public.rooms SET status = 'occupied' WHERE id = NEW.room_id;
            END IF;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        IF OLD.room_id IS NOT NULL THEN
            UPDATE public.rooms SET status = 'vacant' WHERE id = OLD.room_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Re-create the trigger to include UPDATE events
DROP TRIGGER IF EXISTS on_tenant_unit_change ON public.tenants;
CREATE TRIGGER on_tenant_unit_change
AFTER INSERT OR UPDATE OR DELETE ON public.tenants
FOR EACH ROW EXECUTE FUNCTION public.handle_room_occupancy();
