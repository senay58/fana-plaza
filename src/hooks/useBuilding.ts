import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type Floor = {
  id: string;
  number: number;
  name?: string;
  type: "commercial" | "residential";
};

export type Room = {
  id: string;
  floor_id: string;
  number: string;
  size?: number;
  rent_price: number;
  status: "vacant" | "occupied" | "maintenance";
  is_manager_office?: boolean;
  room_type?: "Studio" | "Single Bedroom" | "Double Bedroom" | "Penthouse";
  business_name?: string;
};

export function useBuilding() {
  const queryClient = useQueryClient();

  const floors = useQuery({
    queryKey: ["floors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("floors").select("*").order("number", { ascending: true });
      if (error) throw error;
      return data as Floor[];
    },
  });

  const rooms = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rooms").select("*").order("number");
      if (error) throw error;
      return data as Room[];
    },
  });

  const vacantRooms = useQuery({
    queryKey: ["rooms", "vacant"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("*, floors(name)")
        .eq("status", "vacant")
        .eq("is_manager_office", false)
        .order("number");
      
      if (error) throw error;
      return data;
    },
  });

  const addFloor = useMutation({
    mutationFn: async (floor: Omit<Floor, "id">) => {
      const { data, error } = await supabase.from("floors").insert([floor]).select();
      if (error) {
        console.error("Supabase Error (addFloor):", error);
        throw error;
      }
      return data[0];
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["floors"] }),
  });

  const deleteFloor = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("floors").delete().eq("id", id);
      if (error) {
        console.error("Supabase Error (deleteFloor):", error);
        throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["floors"] }),
  });

  const addRoom = useMutation({
    mutationFn: async (room: Omit<Room, "id">) => {
      const { data, error } = await supabase.from("rooms").insert([room]).select();
      if (error) {
        console.error("Supabase Error (addRoom):", error);
        throw error;
      }
      return data[0];
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rooms"] }),
  });

  const deleteRoom = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rooms").delete().eq("id", id);
      if (error) {
        console.error("Supabase Error (deleteRoom):", error);
        throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rooms"] }),
  });

  const updateRoom = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Room> & { id: string }) => {
      const { data, error } = await supabase.from("rooms").update(updates).eq("id", id).select();
      if (error) {
        console.error("Supabase Error (updateRoom):", error);
        throw error;
      }
      return data[0];
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rooms"] }),
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
