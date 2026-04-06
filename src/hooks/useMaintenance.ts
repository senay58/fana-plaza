import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type MaintenanceLog = {
  id: string;
  room_id: string;
  description: string;
  severity: "Low" | "Medium" | "High";
  status: "Pending" | "Assigned" | "In Progress" | "Completed";
  log_type?: "plumbing" | "electrical" | "cleaning" | "general" | string;
  assigned_to?: string;
  deadline?: string;
  created_at: string;
  rooms?: {
    number: string;
    business_name?: string;
  };
};

export function useMaintenance() {
  const queryClient = useQueryClient();

  const maintenanceLogs = useQuery({
    queryKey: ["maintenance-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_logs")
        .select("*, rooms(number, business_name)")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as MaintenanceLog[];
    },
  });

  const addMaintenanceLog = useMutation({
    mutationFn: async (log: Omit<MaintenanceLog, "id" | "created_at" | "rooms">) => {
      const { data, error } = await supabase.from("maintenance_logs").insert([log]).select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["maintenance-logs"] }),
  });

  const updateMaintenanceStatus = useMutation({
    mutationFn: async ({ id, status, assigned_to }: { id: string; status?: MaintenanceLog["status"]; assigned_to?: string }) => {
      const updates: any = {};
      if (status) updates.status = status;
      if (assigned_to) updates.assigned_to = assigned_to;
      
      const { data, error } = await supabase
        .from("maintenance_logs")
        .update(updates)
        .eq("id", id)
        .select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["maintenance-logs"] }),
  });

  const deleteMaintenanceLog = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("maintenance_logs").delete().eq("id", id);
      if (error) throw error;
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
