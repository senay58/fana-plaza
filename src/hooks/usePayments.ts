import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { format, endOfMonth, subMonths } from "date-fns";
import { offlineDb, Payment } from "@/lib/offlineDb";

export type { Payment };

export function usePayments() {
  const queryClient = useQueryClient();

  const payments = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return offlineDb.getPayments().sort((a, b) => b.due_date.localeCompare(a.due_date));
      }
      try {
        const { data, error } = await supabase
          .from("payments")
          .select("*, tenants(name, contact_number)")
          .order("due_date", { ascending: false });
        if (error) throw error;
        return data as Payment[];
      } catch (err) {
        console.warn("Supabase fetchPayments error, falling back to local registry:", err);
        return offlineDb.getPayments().sort((a, b) => b.due_date.localeCompare(a.due_date));
      }
    },
    retry: 1,
  });

  const updatePaymentStatus = useMutation({
    mutationFn: async ({ id, status, method, staff }: { id: string; status: "paid" | "pending"; method?: string; staff?: string }) => {
      const updates: any = { 
        status, 
        paid_at: status === "paid" ? new Date().toISOString() : null 
      };
      if (method) updates.payment_method = method;
      if (staff) updates.staff_responsible = staff;

      if (!isSupabaseConfigured) {
        const current = offlineDb.getPayments();
        const updated = current.map(p => p.id === id ? { ...p, ...updates } as Payment : p);
        offlineDb.savePayments(updated);
        return updated.find(p => p.id === id);
      }

      try {
        let { data, error } = await supabase
          .from("payments")
          .update(updates)
          .eq("id", id)
          .select();

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
      } catch (err) {
        console.warn("Supabase updatePaymentStatus failed, fallback to local registry:", err);
        const current = offlineDb.getPayments();
        const updated = current.map(p => p.id === id ? { ...p, ...updates } as Payment : p);
        offlineDb.savePayments(updated);
        return updated.find(p => p.id === id);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payments"] }),
  });

  const generateMonthlyPayments = useMutation({
    mutationFn: async () => {
      const runOfflineGeneration = () => {
        const currentTenants = offlineDb.getTenants().filter(t => t.room_id !== null && t.room_id !== undefined);
        const currentRooms = offlineDb.getRooms();
        const activeTenantIds = new Set(currentTenants.map(t => t.id));

        let currentPayments = offlineDb.getPayments();
        // Remove orphans
        currentPayments = currentPayments.filter(p => activeTenantIds.has(p.tenant_id));

        const now = new Date();
        const firstDay = format(now, 'yyyy-MM-01');
        const lastDay = format(endOfMonth(now), 'yyyy-MM-dd');
        
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');

        const existingPayments = currentPayments.filter(p => p.due_date >= firstDay && p.due_date <= lastDay);
        const existingTenantIds = new Set(existingPayments.map(p => p.tenant_id));

        const twoMonthsAgo = format(subMonths(now, 2), 'yyyy-MM-01');
        const recentPayments = currentPayments.filter(p => p.due_date >= twoMonthsAgo);
        const commercialBlockedIds = new Set(recentPayments.map(p => p.tenant_id));

        const newPayments: Payment[] = currentTenants
          .filter(t => {
             const room = currentRooms.find(r => r.id === t.room_id);
             if (room?.room_type?.toLowerCase() !== 'commercial') {
                return !existingTenantIds.has(t.id);
             }
             return !commercialBlockedIds.has(t.id);
          })
          .map(t => {
            const room = currentRooms.find(r => r.id === t.room_id);
            let anniversaryDay = "01";
            if (t.lease_start) {
               const d = new Date(t.lease_start);
               if (!isNaN(d.getTime())) {
                 anniversaryDay = String(d.getDate()).padStart(2, '0');
               }
            }
            
            let targetDate = `${year}-${month}-${anniversaryDay}`;
            const testDate = new Date(targetDate);
            if (isNaN(testDate.getTime()) || testDate.getMonth() + 1 !== Number(month)) {
               targetDate = lastDay;
            }

            return {
              id: `p-${Date.now()}-${t.id}`,
              tenant_id: t.id,
              amount: room?.rent_price || 0,
              status: "pending",
              due_date: targetDate,
              paid_at: null,
              created_at: new Date().toISOString()
            };
          });

        if (newPayments.length > 0) {
          offlineDb.savePayments([...currentPayments, ...newPayments]);
        }
        return { message: newPayments.length === 0 ? "All profiles are synchronized." : `${newPayments.length} invoices generated.` };
      };

      if (!isSupabaseConfigured) {
        return runOfflineGeneration();
      }

      try {
        // 0. Cleanup: Delete any pending payments for tenants that no longer exist or aren't in rooms
        const { data: currentTenants } = await supabase.from("tenants").select("id").not("room_id", "is", null);
        const activeTenantIds = new Set(currentTenants?.map(t => t.id) || []);
        
        const { data: allPending } = await supabase.from("payments").select("id, tenant_id").eq("status", "pending");
        const orphans = allPending?.filter(p => !activeTenantIds.has(p.tenant_id)).map(p => p.id) || [];
        
        if (orphans.length > 0) {
          await supabase.from("payments").delete().in("id", orphans);
        }

        // 1. Get all tenants who have an assigned room
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
        
        // 3. Get existing payments
        const { data: existingPayments, error: paymentError } = await supabase
          .from("payments")
          .select("tenant_id, due_date")
          .gte("due_date", firstDay)
          .lte("due_date", lastDay);
        
        if (paymentError) throw paymentError;

        // 3b. Special check for Commercial
        const twoMonthsAgo = format(subMonths(now, 2), 'yyyy-MM-01');
        const { data: recentPayments } = await supabase
          .from("payments")
          .select("tenant_id")
          .gte("due_date", twoMonthsAgo);
        
        const existingTenantIds = new Set(existingPayments.map(p => p.tenant_id));
        const commercialBlockedIds = new Set(recentPayments?.map(p => p.tenant_id) || []);
        
        // 4. Generate missing invoices
        const newPayments = tenants
          .filter(t => {
             if (t.rooms?.room_type?.toLowerCase() !== 'commercial') {
                return !existingTenantIds.has(t.id);
             }
             return !commercialBlockedIds.has(t.id);
          })
          .map(t => {
            let anniversaryDay = "01";
            if (t.lease_start) {
               const d = new Date(t.lease_start);
               if (!isNaN(d.getTime())) {
                 anniversaryDay = String(d.getDate()).padStart(2, '0');
               }
            }
            
            let targetDate = `${year}-${month}-${anniversaryDay}`;
            const testDate = new Date(targetDate);
            if (isNaN(testDate.getTime()) || testDate.getMonth() + 1 !== Number(month)) {
               targetDate = lastDay;
            }
            
            return {
              tenant_id: t.id,
              amount: (t.rooms?.rent_price || 0) * 1,
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
      } catch (err) {
        console.warn("Supabase generateMonthlyPayments failed, fallback to local registry:", err);
        return runOfflineGeneration();
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payments"] }),
  });

  const deletePayment = useMutation({
    mutationFn: async (id: string) => {
      if (!isSupabaseConfigured) {
        const current = offlineDb.getPayments().filter(p => p.id !== id);
        offlineDb.savePayments(current);
        return;
      }

      try {
        const { error } = await supabase.from("payments").delete().eq("id", id);
        if (error) throw error;
      } catch (err) {
        console.warn("Supabase deletePayment failed, fallback to local registry:", err);
        const current = offlineDb.getPayments().filter(p => p.id !== id);
        offlineDb.savePayments(current);
      }
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
