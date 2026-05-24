import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type Tenant = {
  id: string;
  name: string;
  contact_number?: string;
  email?: string;
  room_id?: string;
  id_number?: string;
  business_type?: string;
  emergency_contact?: string;
  lease_start?: string;
  lease_end?: string;
  notes?: string;
  source?: 'direct' | 'airbnb';
  status?: 'active' | 'archived' | 'evicted';
  move_out_date?: string;
};

export type Document = {
  id: string;
  tenant_id: string;
  name: string;
  file_path: string;
  file_type?: string;
  created_at: string;
};

export function useTenants() {
  const queryClient = useQueryClient();

  const tenants = useQuery({
    queryKey: ["tenants"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tenants").select("*").order("name");
      if (error) throw error;
      return data as Tenant[];
    },
  });

  const addTenant = useMutation({
    mutationFn: async (tenant: Omit<Tenant, "id">) => {
      const { data, error } = await supabase.from("tenants").insert([tenant]).select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tenants"] }),
  });

  const updateTenant = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Tenant> & { id: string }) => {
      const { data, error } = await supabase.from("tenants").update(updates).eq("id", id).select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tenants"] }),
  });

  const deleteTenant = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tenants").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tenants"] }),
  });
  
  const renewLease = useMutation({
    mutationFn: async ({ id, duration, unit }: { id: string, duration: 'days' | 'weeks' | 'months', unit: number }) => {
      // 1. Get current tenant
      const { data: tenant, error: fetchError } = await supabase.from("tenants").select("lease_end").eq("id", id).single();
      if (fetchError) throw fetchError;

      const currentEnd = tenant.lease_end ? new Date(tenant.lease_end) : new Date();
      const baseDate = currentEnd < new Date() ? new Date() : currentEnd;
      
      let newEnd = new Date(baseDate);
      if (duration === 'days') newEnd.setDate(newEnd.getDate() + unit);
      if (duration === 'weeks') newEnd.setDate(newEnd.getDate() + (unit * 7));
      if (duration === 'months') newEnd.setMonth(newEnd.getMonth() + unit);

      const { data, error } = await supabase
        .from("tenants")
        .update({ lease_end: newEnd.toISOString() })
        .eq("id", id)
        .select();
      
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tenants"] }),
  });

  const uploadFile = useMutation({
    mutationFn: async ({ tenantId, file, name }: { tenantId: string; file: File; name: string }) => {
      const path = `tenant-${tenantId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("documents").upload(path, file);
      if (uploadError) throw uploadError;

      const { data, error: dbError } = await supabase.from("tenant_documents").insert([
        { tenant_id: tenantId, name, file_path: path, file_type: file.type }
      ]).select();
      if (dbError) throw dbError;
      return data[0];
    },
    onSuccess: (data) => queryClient.invalidateQueries({ queryKey: ["documents", data.tenant_id] }),
  });

  const deleteDocument = useMutation({
    mutationFn: async ({ id, filePath }: { id: string; filePath: string }) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage.from("documents").remove([filePath]);
      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase.from("tenant_documents").delete().eq("id", id);
      if (dbError) throw dbError;
    },
    onSuccess: (_, variables) => {
      // Try to invalidate generically, or if tenantId isn't easily available, just invalidate all docs
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  const documents = (tenantId: string) => useQuery({
    queryKey: ["documents", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase.from("tenant_documents").select("*").eq("tenant_id", tenantId);
      if (error) throw error;
      return data as Document[];
    },
    enabled: !!tenantId,
  });

  const checkoutTenant = useMutation({
    mutationFn: async ({ id, roomStatus }: { id: string; roomStatus: 'vacant' | 'maintenance' }) => {
      // 1. Get the tenant's current room_id before we unassign
      const { data: tenant, error: fetchError } = await supabase
        .from("tenants")
        .select("room_id")
        .eq("id", id)
        .single();
      if (fetchError) throw fetchError;

      const previousRoomId = tenant?.room_id;

      // 2. Archive the tenant: unassign room, set status, record move-out date
      const { error: updateError } = await supabase
        .from("tenants")
        .update({
          room_id: null,
          status: 'archived',
          move_out_date: new Date().toISOString(),
          lease_end: new Date().toISOString(),
        })
        .eq("id", id);
      if (updateError) throw updateError;

      // 3. Explicitly set the room status (in case the trigger doesn't cover the chosen status)
      if (previousRoomId) {
        const { error: roomError } = await supabase
          .from("rooms")
          .update({ status: roomStatus })
          .eq("id", previousRoomId);
        if (roomError) throw roomError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });

  return {
    tenants,
    addTenant,
    updateTenant,
    deleteTenant,
    uploadFile,
    documents,
    renewLease,
    deleteDocument,
    checkoutTenant,
  };
}
