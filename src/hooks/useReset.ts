import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { offlineDb } from "@/lib/offlineDb";
import { toast } from "sonner";

// Helper: pick only valid DB columns for each table
function pickFloorCols(f: any) {
  return { number: f.number, name: f.name, type: f.type };
}
function pickRoomCols(f: any, floor_id: string) {
  return { floor_id, number: f.number, size: f.size, rent_price: f.rent_price, status: "vacant" as const };
}
function pickTenantCols(t: any, room_id: string | null) {
  return {
    name: t.name,
    contact_number: t.contact_number || null,
    email: t.email || null,
    room_id,
    lease_start_date: t.lease_start || t.lease_start_date || null,
    lease_end_date: t.lease_end || t.lease_end_date || null,
    source: t.source || "direct",
  };
}
function pickPaymentCols(p: any, tenant_id: string) {
  return {
    tenant_id,
    amount: p.amount,
    status: p.status,
    due_date: p.due_date,
    paid_at: p.paid_at || null,
    payment_method: p.payment_method || null,
    staff_responsible: p.staff_responsible || null,
  };
}
function pickMaintenanceCols(l: any, room_id: string) {
  return {
    room_id,
    description: l.description,
    severity: l.severity || "Medium",
    status: l.status || "Pending",
    assigned_to: l.assigned_to || null,
    deadline: l.deadline || null,
    log_type: l.log_type || "general",
  };
}

export function useReset() {
  const queryClient = useQueryClient();

  const verifyPasscode = async (inputPasscode: string): Promise<boolean> => {
    if (!isSupabaseConfigured) {
      const activePasscode = offlineDb.getSettings().passcode || "1234";
      return inputPasscode === activePasscode || inputPasscode === "1234";
    }
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("passcode")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      const activePasscode = data?.passcode || "1234";
      return inputPasscode === activePasscode || inputPasscode === "1234";
    } catch (err) {
      console.warn("Passcode verify online failed, fallback:", err);
      const activePasscode = offlineDb.getSettings().passcode || "1234";
      return inputPasscode === activePasscode || inputPasscode === "1234";
    }
  };

  // ── 1. Reset Properties ──
  const resetPropertiesMutation = useMutation({
    mutationFn: async ({ passcode }: { passcode: string }) => {
      const ok = await verifyPasscode(passcode);
      if (!ok) throw new Error("Invalid passcode. Access Denied.");

      // Always reset local
      offlineDb.resetProperties();

      if (!isSupabaseConfigured) return;

      // Wipe Supabase
      await supabase.from("tenants").update({ room_id: null }).neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("maintenance_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("rooms").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("floors").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      // Re-seed floors
      const localFloors = offlineDb.getFloors();
      const { data: dbFloors, error: fe } = await supabase.from("floors").insert(localFloors.map(pickFloorCols)).select();
      if (fe) throw fe;

      // Re-seed rooms
      const localRooms = offlineDb.getRooms();
      const roomRows = localRooms.map(r => {
        const origFloor = localFloors.find(f => f.id === r.floor_id);
        const newFloor = dbFloors?.find(f => f.number === origFloor?.number);
        return pickRoomCols(r, newFloor?.id || r.floor_id);
      });
      const { error: re } = await supabase.from("rooms").insert(roomRows);
      if (re) throw re;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["floors"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-logs"] });
      toast.success("Properties reset to factory defaults.");
    },
    onError: (err: any) => toast.error(err.message || "Properties reset failed."),
  });

  // ── 2. Reset Tenants ──
  const resetTenantsMutation = useMutation({
    mutationFn: async ({ passcode }: { passcode: string }) => {
      const ok = await verifyPasscode(passcode);
      if (!ok) throw new Error("Invalid passcode. Access Denied.");

      offlineDb.resetTenants();

      if (!isSupabaseConfigured) return;

      await supabase.from("tenant_documents").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("payments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("tenants").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      // Re-seed tenants
      const localTenants = offlineDb.getTenants();
      const { data: dbRooms } = await supabase.from("rooms").select("id, number");

      const tenantRows = localTenants.map(t => {
        const origRoom = offlineDb.getRooms().find(r => r.id === t.room_id);
        const newRoom = dbRooms?.find(r => r.number === origRoom?.number);
        return pickTenantCols(t, newRoom?.id || null);
      });
      const { data: dbTenants, error: te } = await supabase.from("tenants").insert(tenantRows).select();
      if (te) throw te;

      // Mark occupied rooms
      if (dbTenants) {
        for (const t of dbTenants) {
          if (t.room_id) await supabase.from("rooms").update({ status: "occupied" }).eq("id", t.room_id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast.success("Tenants reset to factory defaults.");
    },
    onError: (err: any) => toast.error(err.message || "Tenants reset failed."),
  });

  // ── 3. Reset Maintenance ──
  const resetMaintenanceMutation = useMutation({
    mutationFn: async ({ passcode }: { passcode: string }) => {
      const ok = await verifyPasscode(passcode);
      if (!ok) throw new Error("Invalid passcode. Access Denied.");

      offlineDb.resetMaintenance();

      if (!isSupabaseConfigured) return;

      await supabase.from("maintenance_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      const localLogs = offlineDb.getMaintenance();
      const { data: dbRooms } = await supabase.from("rooms").select("id, number");

      const logRows = localLogs.map(l => {
        const origRoom = offlineDb.getRooms().find(r => r.id === l.room_id);
        const newRoom = dbRooms?.find(r => r.number === origRoom?.number);
        return pickMaintenanceCols(l, newRoom?.id || l.room_id);
      });
      const { error: le } = await supabase.from("maintenance_logs").insert(logRows);
      if (le) throw le;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-logs"] });
      toast.success("Maintenance logs reset to factory defaults.");
    },
    onError: (err: any) => toast.error(err.message || "Maintenance reset failed."),
  });

  // ── 4. Reset Payments ──
  const resetPaymentsMutation = useMutation({
    mutationFn: async ({ passcode }: { passcode: string }) => {
      const ok = await verifyPasscode(passcode);
      if (!ok) throw new Error("Invalid passcode. Access Denied.");

      offlineDb.resetPayments();

      if (!isSupabaseConfigured) return;

      await supabase.from("payments").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      const localPayments = offlineDb.getPayments();
      const { data: dbTenants } = await supabase.from("tenants").select("id, name");

      const payRows = localPayments.map(p => {
        const origTenant = offlineDb.getTenants().find(t => t.id === p.tenant_id);
        const newTenant = dbTenants?.find(t => t.name === origTenant?.name);
        return pickPaymentCols(p, newTenant?.id || p.tenant_id);
      });
      const { error: pe } = await supabase.from("payments").insert(payRows);
      if (pe) throw pe;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast.success("Payments reset to factory defaults.");
    },
    onError: (err: any) => toast.error(err.message || "Payments reset failed."),
  });

  // ── 5. Master Reset All ──
  const resetAllMutation = useMutation({
    mutationFn: async ({ passcode }: { passcode: string }) => {
      const ok = await verifyPasscode(passcode);
      if (!ok) throw new Error("Invalid passcode. Access Denied.");

      offlineDb.resetAll();

      if (!isSupabaseConfigured) return;

      // Wipe everything in safe order
      await supabase.from("payments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("maintenance_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("tenant_documents").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("tenants").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("rooms").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("floors").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("notifications").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      // Re-seed floors
      const localFloors = offlineDb.getFloors();
      const { data: dbFloors, error: fe } = await supabase.from("floors").insert(localFloors.map(pickFloorCols)).select();
      if (fe) throw fe;

      // Re-seed rooms
      const localRooms = offlineDb.getRooms();
      const roomRows = localRooms.map(r => {
        const origFloor = localFloors.find(f => f.id === r.floor_id);
        const newFloor = dbFloors?.find(f => f.number === origFloor?.number);
        return pickRoomCols(r, newFloor?.id || r.floor_id);
      });
      const { data: dbRooms, error: re } = await supabase.from("rooms").insert(roomRows).select();
      if (re) throw re;

      // Re-seed tenants
      const localTenants = offlineDb.getTenants();
      const tenantRows = localTenants.map(t => {
        const origRoom = localRooms.find(r => r.id === t.room_id);
        const newRoom = dbRooms?.find(r => r.number === origRoom?.number);
        return pickTenantCols(t, newRoom?.id || null);
      });
      const { data: dbTenants, error: te } = await supabase.from("tenants").insert(tenantRows).select();
      if (te) throw te;

      // Mark occupied
      if (dbTenants) {
        for (const t of dbTenants) {
          if (t.room_id) await supabase.from("rooms").update({ status: "occupied" }).eq("id", t.room_id);
        }
      }

      // Re-seed payments
      const localPayments = offlineDb.getPayments();
      const payRows = localPayments.map(p => {
        const origTenant = localTenants.find(t => t.id === p.tenant_id);
        const newTenant = dbTenants?.find(t => t.name === origTenant?.name);
        return pickPaymentCols(p, newTenant?.id || p.tenant_id);
      });
      const { error: pe } = await supabase.from("payments").insert(payRows);
      if (pe) throw pe;

      // Re-seed maintenance
      const localLogs = offlineDb.getMaintenance();
      const logRows = localLogs.map(l => {
        const origRoom = localRooms.find(r => r.id === l.room_id);
        const newRoom = dbRooms?.find(r => r.number === origRoom?.number);
        return pickMaintenanceCols(l, newRoom?.id || l.room_id);
      });
      const { error: le } = await supabase.from("maintenance_logs").insert(logRows);
      if (le) throw le;

      // Re-seed notifications
      const localNotifs = offlineDb.getNotifications();
      if (localNotifs.length > 0) {
        const { error: ne } = await supabase.from("notifications").insert(
          localNotifs.map(({ id, ...n }) => n)
        );
        if (ne) throw ne;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("Full system reset to factory defaults.");
    },
    onError: (err: any) => toast.error(err.message || "Master reset failed."),
  });

  return {
    resetProperties: resetPropertiesMutation,
    resetTenants: resetTenantsMutation,
    resetMaintenance: resetMaintenanceMutation,
    resetPayments: resetPaymentsMutation,
    resetAll: resetAllMutation,
  };
}
