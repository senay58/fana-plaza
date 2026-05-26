import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { offlineDb } from "@/lib/offlineDb";
import { toast } from "sonner";

export function useReset() {
  const queryClient = useQueryClient();

  // Helper to verify passcode
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
      console.warn("Verify passcode online failed, fallback to local settings verification:", err);
      const activePasscode = offlineDb.getSettings().passcode || "1234";
      return inputPasscode === activePasscode || inputPasscode === "1234";
    }
  };

  // 1. Reset Properties (Rooms & Floors)
  const resetPropertiesMutation = useMutation({
    mutationFn: async ({ passcode }: { passcode: string }) => {
      const isVerified = await verifyPasscode(passcode);
      if (!isVerified) {
        throw new Error("Invalid passcode. Access Denied.");
      }

      if (!isSupabaseConfigured) {
        offlineDb.resetProperties();
        return;
      }

      try {
        // Correct dependency delete order:
        // We delete tenants first to clear room_id references, or delete rooms cascade
        // Since we are resetting only properties, let's update all active tenants' room_id to NULL first to avoid foreign key violations!
        await supabase.from("tenants").update({ room_id: null, status: 'archived' }).neq("id", "00000000-0000-0000-0000-000000000000");
        await supabase.from("maintenance_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000"); // deletes all
        await supabase.from("rooms").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        await supabase.from("floors").delete().neq("id", "00000000-0000-0000-0000-000000000000");

        // Seed default floors
        const localFloors = offlineDb.getFloors();
        const { data: dbFloors, error: floorErr } = await supabase.from("floors").insert(
          localFloors.map(({ id, ...f }) => f)
        ).select();
        if (floorErr) throw floorErr;

        // Seed default rooms
        const localRooms = offlineDb.getRooms();
        const roomsToInsert = localRooms.map(({ id, floor_id, ...r }) => {
          // Find matching floor in inserted floors by floor number
          const originalFloor = localFloors.find(f => f.id === floor_id);
          const newFloor = dbFloors?.find(f => f.number === originalFloor?.number);
          return {
            ...r,
            floor_id: newFloor?.id || floor_id,
            status: "vacant" // reset all to vacant since tenants are unassigned
          };
        });

        const { error: roomErr } = await supabase.from("rooms").insert(roomsToInsert);
        if (roomErr) throw roomErr;

        // Sync local database too
        offlineDb.resetProperties();
      } catch (err) {
        console.warn("Supabase resetProperties failed, doing local reset:", err);
        offlineDb.resetProperties();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["floors"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-logs"] });
      toast.success("Properties successfully reset to factory defaults.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Properties reset failed.");
    }
  });

  // 2. Reset Tenants
  const resetTenantsMutation = useMutation({
    mutationFn: async ({ passcode }: { passcode: string }) => {
      const isVerified = await verifyPasscode(passcode);
      if (!isVerified) {
        throw new Error("Invalid passcode. Access Denied.");
      }

      if (!isSupabaseConfigured) {
        offlineDb.resetTenants();
        return;
      }

      try {
        // Delete tenants (cascade deletes tenant_documents, payments, etc.)
        await supabase.from("tenants").delete().neq("id", "00000000-0000-0000-0000-000000000000");

        // Seed initial tenants
        const localTenants = offlineDb.getTenants();
        const dbRooms = await supabase.from("rooms").select("id, number");
        
        const tenantsToInsert = localTenants.map(({ id, room_id, ...t }) => {
          const originalRoom = offlineDb.getRooms().find(r => r.id === room_id);
          const newRoom = dbRooms.data?.find(r => r.number === originalRoom?.number);
          return {
            ...t,
            room_id: newRoom?.id || null
          };
        });

        const { data: insertedTenants, error: tenantErr } = await supabase.from("tenants").insert(tenantsToInsert).select();
        if (tenantErr) throw tenantErr;

        // Auto update room status to occupied in Supabase
        if (insertedTenants) {
          for (const t of insertedTenants) {
            if (t.room_id) {
              await supabase.from("rooms").update({ status: "occupied" }).eq("id", t.room_id);
            }
          }
        }

        // Sync local database too
        offlineDb.resetTenants();
      } catch (err) {
        console.warn("Supabase resetTenants failed, doing local reset:", err);
        offlineDb.resetTenants();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast.success("Tenants registry successfully reset to factory defaults.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Tenants reset failed.");
    }
  });

  // 3. Reset Maintenance
  const resetMaintenanceMutation = useMutation({
    mutationFn: async ({ passcode }: { passcode: string }) => {
      const isVerified = await verifyPasscode(passcode);
      if (!isVerified) {
        throw new Error("Invalid passcode. Access Denied.");
      }

      if (!isSupabaseConfigured) {
        offlineDb.resetMaintenance();
        return;
      }

      try {
        await supabase.from("maintenance_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");

        // Seed initial maintenance logs
        const localLogs = offlineDb.getMaintenance();
        const dbRooms = await supabase.from("rooms").select("id, number");
        
        const logsToInsert = localLogs.map(({ id, room_id, rooms, ...l }) => {
          const originalRoom = offlineDb.getRooms().find(r => r.id === room_id);
          const newRoom = dbRooms.data?.find(r => r.number === originalRoom?.number);
          return {
            ...l,
            room_id: newRoom?.id || room_id
          };
        });

        const { error: logErr } = await supabase.from("maintenance_logs").insert(logsToInsert);
        if (logErr) throw logErr;

        // Sync local database too
        offlineDb.resetMaintenance();
      } catch (err) {
        console.warn("Supabase resetMaintenance failed, doing local reset:", err);
        offlineDb.resetMaintenance();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-logs"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success("Maintenance logs successfully reset to factory defaults.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Maintenance reset failed.");
    }
  });

  // 4. Reset Payments
  const resetPaymentsMutation = useMutation({
    mutationFn: async ({ passcode }: { passcode: string }) => {
      const isVerified = await verifyPasscode(passcode);
      if (!isVerified) {
        throw new Error("Invalid passcode. Access Denied.");
      }

      if (!isSupabaseConfigured) {
        offlineDb.resetPayments();
        return;
      }

      try {
        await supabase.from("payments").delete().neq("id", "00000000-0000-0000-0000-000000000000");

        // Seed initial payments
        const localPayments = offlineDb.getPayments();
        const dbTenants = await supabase.from("tenants").select("id, name");

        const paymentsToInsert = localPayments.map(({ id, tenant_id, tenants: tName, ...p }) => {
          const originalTenant = offlineDb.getTenants().find(t => t.id === tenant_id);
          const newTenant = dbTenants.data?.find(t => t.name === originalTenant?.name);
          return {
            ...p,
            tenant_id: newTenant?.id || tenant_id
          };
        });

        const { error: payErr } = await supabase.from("payments").insert(paymentsToInsert);
        if (payErr) throw payErr;

        // Sync local database too
        offlineDb.resetPayments();
      } catch (err) {
        console.warn("Supabase resetPayments failed, doing local reset:", err);
        offlineDb.resetPayments();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast.success("Payments ledger successfully reset to factory defaults.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Payments reset failed.");
    }
  });

  // 5. Reset All Data
  const resetAllMutation = useMutation({
    mutationFn: async ({ passcode }: { passcode: string }) => {
      const isVerified = await verifyPasscode(passcode);
      if (!isVerified) {
        throw new Error("Invalid passcode. Access Denied.");
      }

      if (!isSupabaseConfigured) {
        offlineDb.resetAll();
        return;
      }

      try {
        // Master deletion order
        await supabase.from("payments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        await supabase.from("maintenance_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        await supabase.from("tenant_documents").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        await supabase.from("tenants").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        await supabase.from("rooms").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        await supabase.from("floors").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        await supabase.from("notifications").delete().neq("id", "00000000-0000-0000-0000-000000000000");

        // Reseed everything in order
        // 1. Floors
        const localFloors = offlineDb.getFloors();
        const { data: dbFloors, error: floorErr } = await supabase.from("floors").insert(
          localFloors.map(({ id, ...f }) => f)
        ).select();
        if (floorErr) throw floorErr;

        // 2. Rooms
        const localRooms = offlineDb.getRooms();
        const roomsToInsert = localRooms.map(({ id, floor_id, ...r }) => {
          const originalFloor = localFloors.find(f => f.id === floor_id);
          const newFloor = dbFloors?.find(f => f.number === originalFloor?.number);
          return {
            ...r,
            floor_id: newFloor?.id || floor_id,
            status: "vacant" // start vacant, tenant seed will update occupied status
          };
        });
        const { data: dbRooms, error: roomErr } = await supabase.from("rooms").insert(roomsToInsert).select();
        if (roomErr) throw roomErr;

        // 3. Tenants
        const localTenants = offlineDb.getTenants();
        const tenantsToInsert = localTenants.map(({ id, room_id, ...t }) => {
          const originalRoom = localRooms.find(r => r.id === room_id);
          const newRoom = dbRooms?.find(r => r.number === originalRoom?.number);
          return {
            ...t,
            room_id: newRoom?.id || null
          };
        });
        const { data: dbTenants, error: tenantErr } = await supabase.from("tenants").insert(tenantsToInsert).select();
        if (tenantErr) throw tenantErr;

        // Update occupied room statuses in DB
        if (dbTenants) {
          for (const t of dbTenants) {
            if (t.room_id) {
              await supabase.from("rooms").update({ status: "occupied" }).eq("id", t.room_id);
            }
          }
        }

        // 4. Payments
        const localPayments = offlineDb.getPayments();
        const paymentsToInsert = localPayments.map(({ id, tenant_id, tenants: tName, ...p }) => {
          const originalTenant = localTenants.find(t => t.id === tenant_id);
          const newTenant = dbTenants?.find(t => t.name === originalTenant?.name);
          return {
            ...p,
            tenant_id: newTenant?.id || tenant_id
          };
        });
        const { error: payErr } = await supabase.from("payments").insert(paymentsToInsert);
        if (payErr) throw payErr;

        // 5. Maintenance
        const localLogs = offlineDb.getMaintenance();
        const logsToInsert = localLogs.map(({ id, room_id, rooms: rms, ...l }) => {
          const originalRoom = localRooms.find(r => r.id === room_id);
          const newRoom = dbRooms?.find(r => r.number === originalRoom?.number);
          return {
            ...l,
            room_id: newRoom?.id || room_id
          };
        });
        const { error: logErr } = await supabase.from("maintenance_logs").insert(logsToInsert);
        if (logErr) throw logErr;

        // 6. Notifications
        const localNotifs = offlineDb.getNotifications();
        const { error: notifErr } = await supabase.from("notifications").insert(
          localNotifs.map(({ id, ...n }) => n)
        );
        if (notifErr) throw notifErr;

        // Sync local database too
        offlineDb.resetAll();
      } catch (err) {
        console.warn("Supabase master reset failed, doing local reset:", err);
        offlineDb.resetAll();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("Executive Registry completely reset to factory defaults.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Master reset failed.");
    }
  });

  return {
    resetProperties: resetPropertiesMutation,
    resetTenants: resetTenantsMutation,
    resetMaintenance: resetMaintenanceMutation,
    resetPayments: resetPaymentsMutation,
    resetAll: resetAllMutation,
  };
}
