import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { format, endOfMonth, subMonths } from "date-fns";

export type Payment = {
  id: string;
  tenant_id: string;
  amount: number;
  status: "paid" | "pending";
  due_date: string;
  paid_at?: string;
  payment_method?: "Cash" | "Bank Transfer" | "Mobile Money" | string;
  staff_responsible?: string;
  tenants?: {
    name: string;
    contact_number?: string;
  };
};

export function usePayments() {
  const queryClient = useQueryClient();

  const payments = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("payments").select("*, tenants(name, contact_number)").order("due_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updatePaymentStatus = useMutation({
    mutationFn: async ({ id, status, method, staff }: { id: string; status: "paid" | "pending"; method?: string; staff?: string }) => {
      let updates: any = { 
        status, 
        paid_at: status === "paid" ? new Date().toISOString() : null 
      };
      if (method) updates.payment_method = method;
      if (staff) updates.staff_responsible = staff;

      // Primary Attempt (with new audit columns)
      let { data, error } = await supabase
        .from("payments")
        .update(updates)
        .eq("id", id)
        .select();

      // Fallback Attempt (without audit columns to guarantee success)
      if (error && (error.message?.includes("column") || error.code === "PGRST204")) {
         console.warn("Database audit columns missing, falling back to core payment update...");
         const coreUpdates = {
            status, 
            paid_at: status === "paid" ? new Date().toISOString() : null 
         };
         
         const retry = await supabase
            .from("payments")
            .update(coreUpdates)
            .eq("id", id)
            .select();
         
         data = retry.data;
         error = retry.error;
         
         if (error && (error.message?.includes("column") || error.code === "PGRST204")) {
           console.warn("paid_at column missing, falling back to absolute minimal update...");
           const minimal = await supabase.from("payments").update({ status }).eq("id", id).select();
           data = minimal.data;
           error = minimal.error;
         }
      }

      if (error) throw error;
      return data[0];
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payments"] }),
  });

  const generateMonthlyPayments = useMutation({
    mutationFn: async () => {
      // 0. Cleanup: Delete any pending payments for tenants that no longer exist or aren't in rooms
      const { data: currentTenants } = await supabase.from("tenants").select("id").not("room_id", "is", null);
      const activeTenantIds = new Set(currentTenants?.map(t => t.id) || []);
      
      const { data: allPending } = await supabase.from("payments").select("id, tenant_id").eq("status", "pending");
      const orphans = allPending?.filter(p => !activeTenantIds.has(p.tenant_id)).map(p => p.id) || [];
      
      if (orphans.length > 0) {
        await supabase.from("payments").delete().in("id", orphans);
      }

      // 1. Get all tenants who have an assigned room (filtering for active/linked tenants)
      const { data: tenants, error: tenantError } = await supabase
        .from("tenants")
        .select("*, rooms!inner(rent_price, room_type)");
      
      if (tenantError) throw tenantError;

      // 2. Determine current month bounds
      const now = new Date();
      const firstDay = format(now, 'yyyy-MM-01');
      const lastDay = format(endOfMonth(now), 'yyyy-MM-dd');
      
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      
      // 3. Get existing payments within this specific month window (current billing check)
      const { data: existingPayments, error: paymentError } = await supabase
        .from("payments")
        .select("tenant_id, due_date")
        .gte("due_date", firstDay)
        .lte("due_date", lastDay);
      
      if (paymentError) throw paymentError;

      // 3b. Special check for Commercial: quarterly billing (no bill if generated in last 2 months)
      const twoMonthsAgo = format(subMonths(now, 2), 'yyyy-MM-01');
      const { data: recentPayments } = await supabase
        .from("payments")
        .select("tenant_id")
        .gte("due_date", twoMonthsAgo);
      
      const existingTenantIds = new Set(existingPayments.map(p => p.tenant_id));
      const commercialBlockedIds = new Set(recentPayments?.map(p => p.tenant_id) || []);
      
      // 4. Generate missing invoices on their specific anniversary day
      const newPayments = tenants
        .filter(t => {
           // Residential: Block if billed this month
           if (t.rooms?.room_type?.toLowerCase() !== 'commercial') {
              return !existingTenantIds.has(t.id);
           }
           // Commercial: Block if billed in the last 2 months (Quarterly Logic)
           return !commercialBlockedIds.has(t.id);
        })
        .map(t => {
          let anniversaryDay = "01"; // Fallback
          if (t.lease_start) {
             const d = new Date(t.lease_start);
             if (!isNaN(d.getTime())) {
               anniversaryDay = String(d.getDate()).padStart(2, '0');
             }
          }
          
          let targetDate = `${year}-${month}-${anniversaryDay}`;
          // Ensure valid date (e.g. Feb 30th -> Feb 28th)
          const testDate = new Date(targetDate);
          if (isNaN(testDate.getTime()) || testDate.getMonth() + 1 !== Number(month)) {
             targetDate = lastDay;
          }

          const isCommercial = t.rooms?.room_type?.toLowerCase() === 'commercial';
          
          return {
            tenant_id: t.id,
            amount: (t.rooms?.rent_price || 0) * 1, // Monthly billing for all tenant types
            status: "pending",
            due_date: targetDate
          };
        });

      if (newPayments.length === 0) return { message: "All profiles are synchronized." };

      // 5. Insert new payments
      const { error: insertError } = await supabase
        .from("payments")
        .insert(newPayments);
      
      if (insertError) throw insertError;
      return { message: `${newPayments.length} invoices generated.` };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payments"] }),
  });

  const deletePayment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payments"] }),
  });

  return {
    payments,
    updatePaymentStatus,
    generateMonthlyPayments,
    deletePayment,
  };
}
