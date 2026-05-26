import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { offlineDb, Tenant } from "@/lib/offlineDb";

export type { Tenant };

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
      if (!isSupabaseConfigured) {
        return offlineDb.getTenants().sort((a, b) => a.name.localeCompare(b.name));
      }
      try {
        const { data, error } = await supabase.from("tenants").select("*").order("name");
        if (error) throw error;
        return data as Tenant[];
      } catch (err) {
        console.warn("Supabase fetchTenants error, falling back to local registry:", err);
        return offlineDb.getTenants().sort((a, b) => a.name.localeCompare(b.name));
      }
    },
    retry: 1,
  });

  const addTenant = useMutation({
    mutationFn: async (tenant: Omit<Tenant, "id" | "created_at">) => {
      const newTenant: Tenant = {
        ...tenant,
        id: `t-${Date.now()}`,
        created_at: new Date().toISOString(),
        status: tenant.status || 'active',
      };

      if (!isSupabaseConfigured) {
        const current = offlineDb.getTenants();
        offlineDb.saveTenants([...current, newTenant]);
        
        // Auto update room status to occupied in offlineDb
        if (newTenant.room_id) {
          const rooms = offlineDb.getRooms();
          const updatedRooms = rooms.map(r => r.id === newTenant.room_id ? { ...r, status: "occupied" as const } : r);
          offlineDb.saveRooms(updatedRooms);
        }
        
        return newTenant;
      }

      try {
        const { data, error } = await supabase.from("tenants").insert([tenant]).select();
        if (error) throw error;
        return data[0];
      } catch (err) {
        console.warn("Supabase addTenant failed, fallback to local registry:", err);
        const current = offlineDb.getTenants();
        offlineDb.saveTenants([...current, newTenant]);
        
        if (newTenant.room_id) {
          const rooms = offlineDb.getRooms();
          const updatedRooms = rooms.map(r => r.id === newTenant.room_id ? { ...r, status: "occupied" as const } : r);
          offlineDb.saveRooms(updatedRooms);
        }
        
        return newTenant;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });

  const updateTenant = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Tenant> & { id: string }) => {
      if (!isSupabaseConfigured) {
        const current = offlineDb.getTenants();
        const oldTenant = current.find(t => t.id === id);
        const updated = current.map(t => t.id === id ? { ...t, ...updates } as Tenant : t);
        offlineDb.saveTenants(updated);

        // Handle room reassignment updates in offlineDb
        if (updates.room_id !== undefined && oldTenant?.room_id !== updates.room_id) {
          const rooms = offlineDb.getRooms();
          let updatedRooms = [...rooms];
          if (oldTenant?.room_id) {
            updatedRooms = updatedRooms.map(r => r.id === oldTenant.room_id ? { ...r, status: "vacant" as const } : r);
          }
          if (updates.room_id) {
            updatedRooms = updatedRooms.map(r => r.id === updates.room_id ? { ...r, status: "occupied" as const } : r);
          }
          offlineDb.saveRooms(updatedRooms);
        }

        return updated.find(t => t.id === id);
      }

      try {
        const { data, error } = await supabase.from("tenants").update(updates).eq("id", id).select();
        if (error) throw error;
        return data[0];
      } catch (err) {
        console.warn("Supabase updateTenant failed, fallback to local registry:", err);
        const current = offlineDb.getTenants();
        const oldTenant = current.find(t => t.id === id);
        const updated = current.map(t => t.id === id ? { ...t, ...updates } as Tenant : t);
        offlineDb.saveTenants(updated);

        if (updates.room_id !== undefined && oldTenant?.room_id !== updates.room_id) {
          const rooms = offlineDb.getRooms();
          let updatedRooms = [...rooms];
          if (oldTenant?.room_id) {
            updatedRooms = updatedRooms.map(r => r.id === oldTenant.room_id ? { ...r, status: "vacant" as const } : r);
          }
          if (updates.room_id) {
            updatedRooms = updatedRooms.map(r => r.id === updates.room_id ? { ...r, status: "occupied" as const } : r);
          }
          offlineDb.saveRooms(updatedRooms);
        }

        return updated.find(t => t.id === id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });

  const deleteTenant = useMutation({
    mutationFn: async (id: string) => {
      if (!isSupabaseConfigured) {
        const current = offlineDb.getTenants();
        const oldTenant = current.find(t => t.id === id);
        const remaining = current.filter(t => t.id !== id);
        offlineDb.saveTenants(remaining);

        if (oldTenant?.room_id) {
          const rooms = offlineDb.getRooms();
          const updatedRooms = rooms.map(r => r.id === oldTenant.room_id ? { ...r, status: "vacant" as const } : r);
          offlineDb.saveRooms(updatedRooms);
        }
        return;
      }

      try {
        const { error } = await supabase.from("tenants").delete().eq("id", id);
        if (error) throw error;
      } catch (err) {
        console.warn("Supabase deleteTenant failed, fallback to local registry:", err);
        const current = offlineDb.getTenants();
        const oldTenant = current.find(t => t.id === id);
        const remaining = current.filter(t => t.id !== id);
        offlineDb.saveTenants(remaining);

        if (oldTenant?.room_id) {
          const rooms = offlineDb.getRooms();
          const updatedRooms = rooms.map(r => r.id === oldTenant.room_id ? { ...r, status: "vacant" as const } : r);
          offlineDb.saveRooms(updatedRooms);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
  
  const renewLease = useMutation({
    mutationFn: async ({ id, duration, unit }: { id: string, duration: 'days' | 'weeks' | 'months', unit: number }) => {
      const calculateNewEnd = (leaseEndStr?: string) => {
        const currentEnd = leaseEndStr ? new Date(leaseEndStr) : new Date();
        const baseDate = currentEnd < new Date() ? new Date() : currentEnd;
        const newEnd = new Date(baseDate);
        if (duration === 'days') newEnd.setDate(newEnd.getDate() + unit);
        if (duration === 'weeks') newEnd.setDate(newEnd.getDate() + (unit * 7));
        if (duration === 'months') newEnd.setMonth(newEnd.getMonth() + unit);
        return newEnd.toISOString();
      };

      if (!isSupabaseConfigured) {
        const current = offlineDb.getTenants();
        const tenant = current.find(t => t.id === id);
        const newEnd = calculateNewEnd(tenant?.lease_end);
        const updated = current.map(t => t.id === id ? { ...t, lease_end: newEnd } as Tenant : t);
        offlineDb.saveTenants(updated);
        return updated.find(t => t.id === id);
      }

      try {
        const { data: tenant, error: fetchError } = await supabase.from("tenants").select("lease_end").eq("id", id).single();
        if (fetchError) throw fetchError;

        const newEnd = calculateNewEnd(tenant.lease_end);

        const { data, error } = await supabase
          .from("tenants")
          .update({ lease_end: newEnd })
          .eq("id", id)
          .select();
        
        if (error) throw error;
        return data[0];
      } catch (err) {
        console.warn("Supabase renewLease failed, fallback to local registry:", err);
        const current = offlineDb.getTenants();
        const tenant = current.find(t => t.id === id);
        const newEnd = calculateNewEnd(tenant?.lease_end);
        const updated = current.map(t => t.id === id ? { ...t, lease_end: newEnd } as Tenant : t);
        offlineDb.saveTenants(updated);
        return updated.find(t => t.id === id);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tenants"] }),
  });

  const uploadFile = useMutation({
    mutationFn: async ({ tenantId, file, name }: { tenantId: string; file: File; name: string }) => {
      const mockDoc: Document = {
        id: `d-${Date.now()}`,
        tenant_id: tenantId,
        name,
        file_path: `mock-docs/${file.name}`,
        file_type: file.type,
        created_at: new Date().toISOString(),
      };

      if (!isSupabaseConfigured) {
        const localDocs = JSON.parse(localStorage.getItem(`fana_documents_${tenantId}`) || "[]");
        localStorage.setItem(`fana_documents_${tenantId}`, JSON.stringify([...localDocs, mockDoc]));
        return mockDoc;
      }

      try {
        const path = `tenant-${tenantId}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from("documents").upload(path, file);
        if (uploadError) throw uploadError;

        const { data, error: dbError } = await supabase.from("tenant_documents").insert([
          { tenant_id: tenantId, name, file_path: path, file_type: file.type }
        ]).select();
        if (dbError) throw dbError;
        return data[0];
      } catch (err) {
        console.warn("Supabase uploadFile failed, fallback to local registry:", err);
        const localDocs = JSON.parse(localStorage.getItem(`fana_documents_${tenantId}`) || "[]");
        localStorage.setItem(`fana_documents_${tenantId}`, JSON.stringify([...localDocs, mockDoc]));
        return mockDoc;
      }
    },
    onSuccess: (data) => queryClient.invalidateQueries({ queryKey: ["documents", data.tenant_id] }),
  });

  const deleteDocument = useMutation({
    mutationFn: async ({ id, filePath, tenantId }: { id: string; filePath: string; tenantId?: string }) => {
      if (!isSupabaseConfigured && tenantId) {
        const localDocs = JSON.parse(localStorage.getItem(`fana_documents_${tenantId}`) || "[]") as Document[];
        const remaining = localDocs.filter(d => d.id !== id);
        localStorage.setItem(`fana_documents_${tenantId}`, JSON.stringify(remaining));
        return;
      }

      try {
        const { error: storageError } = await supabase.storage.from("documents").remove([filePath]);
        if (storageError) throw storageError;

        const { error: dbError } = await supabase.from("tenant_documents").delete().eq("id", id);
        if (dbError) throw dbError;
      } catch (err) {
        console.warn("Supabase deleteDocument failed, fallback to local registry:", err);
        if (tenantId) {
          const localDocs = JSON.parse(localStorage.getItem(`fana_documents_${tenantId}`) || "[]") as Document[];
          const remaining = localDocs.filter(d => d.id !== id);
          localStorage.setItem(`fana_documents_${tenantId}`, JSON.stringify(remaining));
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  const documents = (tenantId: string) => useQuery({
    queryKey: ["documents", tenantId],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return JSON.parse(localStorage.getItem(`fana_documents_${tenantId}`) || "[]") as Document[];
      }
      try {
        const { data, error } = await supabase.from("tenant_documents").select("*").eq("tenant_id", tenantId);
        if (error) throw error;
        return data as Document[];
      } catch (err) {
        console.warn("Supabase fetchDocuments error, falling back to local registry:", err);
        return JSON.parse(localStorage.getItem(`fana_documents_${tenantId}`) || "[]") as Document[];
      }
    },
    enabled: !!tenantId,
    retry: 1,
  });

  const checkoutTenant = useMutation({
    mutationFn: async ({ id, roomStatus }: { id: string; roomStatus: 'vacant' | 'maintenance' }) => {
      if (!isSupabaseConfigured) {
        const current = offlineDb.getTenants();
        const tenant = current.find(t => t.id === id);
        const previousRoomId = tenant?.room_id;

        const updated = current.map(t => t.id === id ? {
          ...t,
          room_id: null,
          status: 'archived' as const,
          move_out_date: new Date().toISOString(),
          lease_end: new Date().toISOString(),
        } : t);
        offlineDb.saveTenants(updated);

        if (previousRoomId) {
          const rooms = offlineDb.getRooms();
          const updatedRooms = rooms.map(r => r.id === previousRoomId ? { ...r, status: roomStatus } : r);
          offlineDb.saveRooms(updatedRooms);
        }
        return;
      }

      try {
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

        // 3. Explicitly set the room status
        if (previousRoomId) {
          const { error: roomError } = await supabase
            .from("rooms")
            .update({ status: roomStatus })
            .eq("id", previousRoomId);
          if (roomError) throw roomError;
        }
      } catch (err) {
        console.warn("Supabase checkoutTenant failed, fallback to local registry:", err);
        const current = offlineDb.getTenants();
        const tenant = current.find(t => t.id === id);
        const previousRoomId = tenant?.room_id;

        const updated = current.map(t => t.id === id ? {
          ...t,
          room_id: null,
          status: 'archived' as const,
          move_out_date: new Date().toISOString(),
          lease_end: new Date().toISOString(),
        } : t);
        offlineDb.saveTenants(updated);

        if (previousRoomId) {
          const rooms = offlineDb.getRooms();
          const updatedRooms = rooms.map(r => r.id === previousRoomId ? { ...r, status: roomStatus } : r);
          offlineDb.saveRooms(updatedRooms);
        }
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
