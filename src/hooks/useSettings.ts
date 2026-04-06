import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type SystemSettings = {
  id: string;
  username: string;
  passcode: string;
  penalty_rate: number;
  grace_period: number;
  lease_expiry_days: number;
  updated_at: string;
};

export function useSettings() {
  const queryClient = useQueryClient();

  const settings = useQuery({
    queryKey: ["system_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .limit(1)
        .single();
      
      if (error && error.code !== "PGRST116") throw error; // PGRST116 is 'no rows'
      return data as SystemSettings | null;
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (newSettings: Partial<SystemSettings>) => {
      const currentSettings = settings.data;
      
      let promise;
      if (currentSettings?.id) {
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
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["system_settings"] }),
  });

  return {
    settings,
    updateSettings,
  };
}
