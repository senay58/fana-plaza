import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { offlineDb, MaintenanceLog } from "@/lib/offlineDb";

export type { MaintenanceLog };

export function useMaintenance() {
  const queryClient = useQueryClient();

  const maintenanceLogs = useQuery({
    queryKey: ["maintenance-logs"],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return offlineDb.getMaintenance().sort((a, b) => b.created_at.localeCompare(a.created_at));
      }
      try {
        const { data, error } = await supabase
          .from("maintenance_logs")
          .select("*, rooms(number, business_name)")
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        return data as MaintenanceLog[];
      } catch (err) {
        console.warn("Supabase fetchMaintenance error, falling back to local registry:", err);
        return offlineDb.getMaintenance().sort((a, b) => b.created_at.localeCompare(a.created_at));
      }
    },
    retry: 1,
  });

  const addMaintenanceLog = useMutation({
    mutationFn: async (log: Omit<MaintenanceLog, "id" | "created_at" | "rooms">) => {
      const newLog: MaintenanceLog = {
        ...log,
        id: `m-${Date.now()}`,
        created_at: new Date().toISOString(),
      };

      if (!isSupabaseConfigured) {
        const current = offlineDb.getMaintenance();
        offlineDb.saveMaintenance([...current, newLog]);
        
        // Auto update room status to maintenance in offlineDb if severity is High or type demands it
        const rooms = offlineDb.getRooms();
        const updatedRooms = rooms.map(r => r.id === log.room_id ? { ...r, status: "maintenance" as const } : r);
        offlineDb.saveRooms(updatedRooms);

        return newLog;
      }

      try {
        const { data, error } = await supabase.from("maintenance_logs").insert([log]).select();
        if (error) throw error;
        return data[0];
      } catch (err) {
        console.warn("Supabase addMaintenanceLog failed, fallback to local registry:", err);
        const current = offlineDb.getMaintenance();
        offlineDb.saveMaintenance([...current, newLog]);
        
        const rooms = offlineDb.getRooms();
        const updatedRooms = rooms.map(r => r.id === log.room_id ? { ...r, status: "maintenance" as const } : r);
        offlineDb.saveRooms(updatedRooms);

        return newLog;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-logs"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });

  const updateMaintenanceStatus = useMutation({
    mutationFn: async ({ id, status, assigned_to }: { id: string; status?: MaintenanceLog["status"]; assigned_to?: string }) => {
      const updates: any = {};
      if (status) updates.status = status;
      if (assigned_to) updates.assigned_to = assigned_to;

      if (!isSupabaseConfigured) {
        const current = offlineDb.getMaintenance();
        const updated = current.map(m => m.id === id ? { ...m, ...updates } as MaintenanceLog : m);
        offlineDb.saveMaintenance(updated);

        // If completed, set the room status back to vacant in offlineDb if it was on maintenance
        if (status === "Completed") {
          const log = current.find(m => m.id === id);
          if (log) {
            const rooms = offlineDb.getRooms();
            const room = rooms.find(r => r.id === log.room_id);
            if (room && room.status === "maintenance") {
              const updatedRooms = rooms.map(r => r.id === log.room_id ? { ...r, status: "vacant" as const } : r);
              offlineDb.saveRooms(updatedRooms);
            }
          }
        }

        return updated.find(m => m.id === id);
      }

      try {
        const { data, error } = await supabase
          .from("maintenance_logs")
          .update(updates)
          .eq("id", id)
          .select();
        if (error) throw error;
        return data[0];
      } catch (err) {
        console.warn("Supabase updateMaintenanceStatus failed, fallback to local registry:", err);
        const current = offlineDb.getMaintenance();
        const updated = current.map(m => m.id === id ? { ...m, ...updates } as MaintenanceLog : m);
        offlineDb.saveMaintenance(updated);

        if (status === "Completed") {
          const log = current.find(m => m.id === id);
          if (log) {
            const rooms = offlineDb.getRooms();
            const room = rooms.find(r => r.id === log.room_id);
            if (room && room.status === "maintenance") {
              const updatedRooms = rooms.map(r => r.id === log.room_id ? { ...r, status: "vacant" as const } : r);
              offlineDb.saveRooms(updatedRooms);
            }
          }
        }

        return updated.find(m => m.id === id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-logs"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });

  const deleteMaintenanceLog = useMutation({
    mutationFn: async (id: string) => {
      if (!isSupabaseConfigured) {
        const current = offlineDb.getMaintenance().filter(m => m.id !== id);
        offlineDb.saveMaintenance(current);
        return;
      }

      try {
        const { error } = await supabase.from("maintenance_logs").delete().eq("id", id);
        if (error) throw error;
      } catch (err) {
        console.warn("Supabase deleteMaintenanceLog failed, fallback to local registry:", err);
        const current = offlineDb.getMaintenance().filter(m => m.id !== id);
        offlineDb.saveMaintenance(current);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["maintenance-logs"] }),
  });

  return {
    maintenanceLogs,
    addMaintenanceLog,
    updateMaintenanceStatus,
    deleteMaintenanceLog,
  };
}
