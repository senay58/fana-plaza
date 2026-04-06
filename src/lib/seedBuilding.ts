import { supabase } from "./supabase";

const foundation = [
  { floor: 0, name: "Ground Floor", units: ["01", "02", "03"] },
  { floor: 1, name: "Floor 1", units: ["01", "02", "03", "04"] },
  { floor: 2, name: "Floor 2", units: ["01", "02", "03", "04", "05", "06"] },
  { floor: 3, name: "Floor 3", units: ["01", "02", "03", "04"] },
  { floor: 4, name: "Floor 4", units: ["01", "02", "03", "04", "05"] },
  { floor: 5, name: "Floor 5", units: ["01", "02", "03", "04", "05"] },
  { floor: 6, name: "Floor 6", units: ["01", "02", "03", "04", "05"] },
  { floor: 7, name: "Floor 7", units: ["01", "02", "03", "04", "05"] },
  { floor: 8, name: "Floor 8", units: ["01", "02", "03", "04", "05"] },
  { floor: 9, name: "Floor 9", units: ["01", "02", "03", "04", "05"] },
];

export async function seedBuildingFoundation() {
  console.log("Starting building seed (clearing old data first)...");
  
  // 1. Clear existing rooms and floors to "trim down" to fresh state
  // We delete rooms first because they depend on floors
  const { error: clearRoomsError } = await supabase.from("rooms").delete().neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all
  const { error: clearFloorsError } = await supabase.from("floors").delete().neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

  if (clearRoomsError || clearFloorsError) {
    console.error("Error clearing old data:", clearRoomsError || clearFloorsError);
  }

  for (const f of foundation) {
    // 2. Create floor
    const { data: floorData, error: floorError } = await supabase
      .from("floors")
      .insert({ number: f.floor, name: f.name, type: f.floor === 0 ? "commercial" : "residential" })
      .select()
      .single();

    if (floorError) {
      console.error(`Error seeding floor ${f.floor}:`, floorError);
      continue;
    }

    // 3. Create rooms for this floor
    const roomsToInsert = f.units.map(u => ({
      floor_id: floorData.id,
      number: u,
      rent_price: f.floor === 0 ? 25000 : 12000,
      status: "vacant"
    }));

    const { error: roomsError } = await supabase
      .from("rooms")
      .insert(roomsToInsert);

    if (roomsError) {
      console.error(`Error seeding rooms for floor ${f.floor}:`, roomsError);
    }
  }
  
  console.log("Seed completed successfully!");
  return true;
}
