import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { offlineDb, Notification } from "@/lib/offlineDb";

export type { Notification };

export function useNotifications() {
  const queryClient = useQueryClient();

  const notifications = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return offlineDb.getNotifications().sort((a, b) => b.created_at.localeCompare(a.created_at));
      }
      try {
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return data as Notification[];
      } catch (err) {
        console.warn("Supabase fetchNotifications error, falling back to local registry:", err);
        return offlineDb.getNotifications().sort((a, b) => b.created_at.localeCompare(a.created_at));
      }
    },
    retry: 1,
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      if (!isSupabaseConfigured) {
        const current = offlineDb.getNotifications();
        const updated = current.map(n => n.id === id ? { ...n, is_read: true } as Notification : n);
        offlineDb.saveNotifications(updated);
        return;
      }

      try {
        const { error } = await supabase
          .from("notifications")
          .update({ is_read: true })
          .eq("id", id);
        if (error) throw error;
      } catch (err) {
        console.warn("Supabase markAsRead failed, fallback to local registry:", err);
        const current = offlineDb.getNotifications();
        const updated = current.map(n => n.id === id ? { ...n, is_read: true } as Notification : n);
        offlineDb.saveNotifications(updated);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const deleteNotification = useMutation({
    mutationFn: async (id: string) => {
      if (!isSupabaseConfigured) {
        const current = offlineDb.getNotifications().filter(n => n.id !== id);
        offlineDb.saveNotifications(current);
        return;
      }

      try {
        const { error } = await supabase.from("notifications").delete().eq("id", id);
        if (error) throw error;
      } catch (err) {
        console.warn("Supabase deleteNotification failed, fallback to local registry:", err);
        const current = offlineDb.getNotifications().filter(n => n.id !== id);
        offlineDb.saveNotifications(current);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return {
    notifications,
    markAsRead,
    deleteNotification,
  };
}
