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

    const checkEvents = async () => {
      const mode = settings.data?.lease_expiry_days || 1; // 1 = Once, 2 = Twice, 0 = Disabled
      if (mode === 0) return;

      const today = startOfDay(new Date());

      // 1. Check Lease Expirations
      for (const tenant of tenants.data) {
        if (tenant.status === 'archived' || !tenant.lease_end) continue;
        const leaseEnd = startOfDay(new Date(tenant.lease_end));
        const daysLeft = differenceInDays(leaseEnd, today);
        let shouldTrigger = false;
        if (daysLeft === 5) shouldTrigger = true;
        if (mode === 2 && daysLeft === 3) shouldTrigger = true;

        if (shouldTrigger) {
          const title = `Lease Expiration Warning: ${tenant.name}`;
          const message = `The lease for unit assignment involving ${tenant.name} is scheduled to expire in ${daysLeft} days.`;
          const existing = notifications.data?.find(n => n.title === title && n.message === message);
          if (!existing) {
            await supabase.from("notifications").insert([{ title, message, type: "warning", is_read: false }]);
          }
        }
      }
    };

    checkEvents();
  }, [tenants.data, settings.data, notifications.data]);
}
