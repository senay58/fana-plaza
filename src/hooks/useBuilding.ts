import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { offlineDb, Floor, Room } from "@/lib/offlineDb";

export type { Floor, Room };

export function useBuilding() {
  const queryClient = useQueryClient();

  const floors = useQuery({
    queryKey: ["floors"],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return offlineDb.getFloors().sort((a, b) => a.number - b.number);
      }
      try {
        const { data, error } = await supabase.from("floors").select("*").order("number", { ascending: true });
        if (error) throw error;
        return data as Floor[];
      } catch (err) {
        console.warn("Supabase fetchFloors error, falling back to local registry:", err);
        return offlineDb.getFloors().sort((a, b) => a.number - b.number);
      }
    },
    retry: 1,
  });

  const rooms = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return offlineDb.getRooms().sort((a, b) => a.number.localeCompare(b.number));
      }
      try {
        const { data, error } = await supabase.from("rooms").select("*").order("number");
        if (error) throw error;
        return data as Room[];
      } catch (err) {
        console.warn("Supabase fetchRooms error, falling back to local registry:", err);
        return offlineDb.getRooms().sort((a, b) => a.number.localeCompare(b.number));
      }
    },
    retry: 1,
  });

  const vacantRooms = useQuery({
    queryKey: ["rooms", "vacant"],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        const allFloors = offlineDb.getFloors();
        return offlineDb.getRooms()
          .filter(r => r.status === "vacant" && !r.is_manager_office)
          .map(r => ({
            ...r,
            floors: {
              name: allFloors.find(f => f.id === r.floor_id)?.name || "Floor"
            }
          }))
          .sort((a, b) => a.number.localeCompare(b.number));
      }
      try {
        const { data, error } = await supabase
          .from("rooms")
          .select("*, floors(name)")
          .eq("status", "vacant")
          .eq("is_manager_office", false)
          .order("number");
        
        if (error) throw error;
        return data;
      } catch (err) {
        console.warn("Supabase fetchVacantRooms error, falling back to local registry:", err);
        const allFloors = offlineDb.getFloors();
        return offlineDb.getRooms()
          .filter(r => r.status === "vacant" && !r.is_manager_office)
          .map(r => ({
            ...r,
            floors: {
              name: allFloors.find(f => f.id === r.floor_id)?.name || "Floor"
            }
          }))
          .sort((a, b) => a.number.localeCompare(b.number));
      }
    },
    retry: 1,
  });

  const addFloor = useMutation({
    mutationFn: async (floor: Omit<Floor, "id" | "created_at">) => {
      const newFloor: Floor = {
        ...floor,
        id: `f-${Date.now()}`,
        created_at: new Date().toISOString(),
      };

      if (!isSupabaseConfigured) {
        const current = offlineDb.getFloors();
        offlineDb.saveFloors([...current, newFloor]);
        return newFloor;
      }

      try {
        const { data, error } = await supabase.from("floors").insert([floor]).select();
        if (error) throw error;
        return data[0];
      } catch (err) {
        console.warn("Supabase addFloor failed, fallback to local registry:", err);
        const current = offlineDb.getFloors();
        offlineDb.saveFloors([...current, newFloor]);
        return newFloor;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["floors"] });
    },
  });

  const deleteFloor = useMutation({
    mutationFn: async (id: string) => {
      if (!isSupabaseConfigured) {
        const floorsList = offlineDb.getFloors().filter(f => f.id !== id);
        const roomsList = offlineDb.getRooms().filter(r => r.floor_id !== id);
        offlineDb.saveFloors(floorsList);
        offlineDb.saveRooms(roomsList);
        return;
      }

      try {
        const { error } = await supabase.from("floors").delete().eq("id", id);
        if (error) throw error;
      } catch (err) {
        console.warn("Supabase deleteFloor failed, fallback to local registry:", err);
        const floorsList = offlineDb.getFloors().filter(f => f.id !== id);
        const roomsList = offlineDb.getRooms().filter(r => r.floor_id !== id);
        offlineDb.saveFloors(floorsList);
        offlineDb.saveRooms(roomsList);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["floors"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });

  const addRoom = useMutation({
    mutationFn: async (room: Omit<Room, "id" | "created_at">) => {
      const newRoom: Room = {
        ...room,
        id: `r-${Date.now()}`,
        created_at: new Date().toISOString(),
      };

      if (!isSupabaseConfigured) {
        const current = offlineDb.getRooms();
        offlineDb.saveRooms([...current, newRoom]);
        return newRoom;
      }

      try {
        const { data, error } = await supabase.from("rooms").insert([room]).select();
        if (error) throw error;
        return data[0];
      } catch (err) {
        console.warn("Supabase addRoom failed, fallback to local registry:", err);
        const current = offlineDb.getRooms();
        offlineDb.saveRooms([...current, newRoom]);
        return newRoom;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["rooms", "vacant"] });
    },
  });

  const deleteRoom = useMutation({
    mutationFn: async (id: string) => {
      if (!isSupabaseConfigured) {
        const current = offlineDb.getRooms().filter(r => r.id !== id);
        offlineDb.saveRooms(current);
        return;
      }

      try {
        const { error } = await supabase.from("rooms").delete().eq("id", id);
        if (error) throw error;
      } catch (err) {
        console.warn("Supabase deleteRoom failed, fallback to local registry:", err);
        const current = offlineDb.getRooms().filter(r => r.id !== id);
        offlineDb.saveRooms(current);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["rooms", "vacant"] });
    },
  });

  const updateRoom = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Room> & { id: string }) => {
      if (!isSupabaseConfigured) {
        const current = offlineDb.getRooms();
        const updated = current.map(r => r.id === id ? { ...r, ...updates } as Room : r);
        offlineDb.saveRooms(updated);
        return updated.find(r => r.id === id);
      }

      try {
        const { data, error } = await supabase.from("rooms").update(updates).eq("id", id).select();
        if (error) throw error;
        return data[0];
      } catch (err) {
        console.warn("Supabase updateRoom failed, fallback to local registry:", err);
        const current = offlineDb.getRooms();
        const updated = current.map(r => r.id === id ? { ...r, ...updates } as Room : r);
        offlineDb.saveRooms(updated);
        return updated.find(r => r.id === id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["rooms", "vacant"] });
    },
  });

  return {
    floors,
    rooms,
    vacantRooms,
    addFloor,
    deleteFloor,
    addRoom,
    deleteRoom,
    updateRoom,
  };
}
