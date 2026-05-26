import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { offlineDb, SystemSettings } from "@/lib/offlineDb";

export type { SystemSettings };

export function useSettings() {
  const queryClient = useQueryClient();

  const settings = useQuery({
    queryKey: ["system_settings"],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return offlineDb.getSettings();
      }
      try {
        const { data, error } = await supabase
          .from("system_settings")
          .select("*")
          .limit(1)
          .single();
        
        if (error && error.code !== "PGRST116") throw error;
        if (!data) return offlineDb.getSettings();
        return data as SystemSettings;
      } catch (err) {
        console.warn("Supabase fetchSettings error, falling back to local registry:", err);
        return offlineDb.getSettings();
      }
    },
    retry: 1, // Minimize retry delay to load instantly
  });

  const updateSettings = useMutation({
    mutationFn: async (newSettings: Partial<SystemSettings>) => {
      const currentSettings = settings.data || offlineDb.getSettings();
      
      if (!isSupabaseConfigured) {
        const updated = { ...currentSettings, ...newSettings, updated_at: new Date().toISOString() } as SystemSettings;
        offlineDb.saveSettings(updated);
        return updated;
      }

      try {
        let promise;
        if (currentSettings?.id && currentSettings.id !== "settings-default") {
          promise = supabase
            .from("system_settings")
            .update({ ...newSettings, updated_at: new Date().toISOString() })
            .eq("id", currentSettings.id);
        } else {
          promise = supabase
            .from("system_settings")
            .insert([{ ...newSettings, updated_at: new Date().toISOString() }]);
        }

        const { data, error } = await promise.select();
        if (error) throw error;
        return data[0] as SystemSettings;
      } catch (err) {
        console.warn("Supabase updateSettings failed, saving to local registry:", err);
        const updated = { ...currentSettings, ...newSettings, updated_at: new Date().toISOString() } as SystemSettings;
        offlineDb.saveSettings(updated);
        return updated;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["system_settings"] }),
  });

  return {
    settings,
    updateSettings,
  };
}
