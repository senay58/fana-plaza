import { useEffect } from "react";
import { useTenants } from "./useTenants";
import { useSettings } from "./useSettings";
import { supabase } from "@/lib/supabase";
import { useNotifications } from "./useNotifications";
import { differenceInDays, startOfDay } from "date-fns";

export function useAutoNotifications() {
  const { tenants } = useTenants();
  const { settings } = useSettings();
  const { notifications } = useNotifications();

  useEffect(() => {
    if (!tenants.data || !settings.data) return;

    const checkLeases = async () => {
      const mode = settings.data?.lease_expiry_days || 1; // 1 = Once, 2 = Twice, 0 = Disabled
      if (mode === 0) return;

      const today = startOfDay(new Date());

      for (const tenant of tenants.data) {
        if (!tenant.lease_end) continue;

        const leaseEnd = startOfDay(new Date(tenant.lease_end));
        const daysLeft = differenceInDays(leaseEnd, today);
        
        let shouldTrigger = false;
        if (daysLeft === 5) shouldTrigger = true;
        if (mode === 2 && daysLeft === 3) shouldTrigger = true;

        if (shouldTrigger) {
          const title = `Lease Expiration Warning: ${tenant.name}`;
          const message = `The lease for unit assignment involving ${tenant.name} is scheduled to expire in ${daysLeft} days (${leaseEnd.toLocaleDateString()}). Please initiate SMS renewal protocols.`;

          // Check if we already sent THIS specific day-bracket notification
          const existing = notifications.data?.find(
            n => n.title.includes(tenant.name) && n.message.includes(`in ${daysLeft} days`)
          );

          if (!existing) {
            await supabase.from("notifications").insert([{
              title,
              message,
              type: "warning",
              is_read: false
            }]);
          }
        }
      }
    };

    checkLeases();
  }, [tenants.data, settings.data, notifications.data]);
}
