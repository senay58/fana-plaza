import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { useBuilding } from "@/hooks/useBuilding";
import { Plus, Trash2, LayoutGrid, Info, Building2, DatabaseZap, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { seedBuildingFoundation } from "@/lib/seedBuilding";
import { isSupabaseConfigured } from "@/lib/supabase";

export default function BuildingConfiguration() {
  const { floors, addFloor, deleteFloor, addRoom, deleteRoom, rooms } = useBuilding();
  
  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [newRoomPrice, setNewRoomPrice] = useState("");
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeed = async () => {
    if (!isSupabaseConfigured) {
      toast.error("Supabase not configured in .env.local", {
        description: "Please add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY first."
      });
      return;
    }
    
    setIsSeeding(true);
    const promise = seedBuildingFoundation();
    toast.promise(promise, {
      loading: "Clearing old data and seeding foundation...",
      success: "Foundation re-built successfully!",
      error: "Failed to seed foundation. Check your database permissions."
    });
    await promise;
    setIsSeeding(false);
    floors.refetch();
    rooms.refetch();
  };

  const handleAddFloor = async () => {
    const nextNumber = floors.data?.length 
      ? Math.max(...floors.data.map(f => f.number)) + 1 
      : 0;
    
    try {
      await addFloor.mutateAsync({
        number: nextNumber,
        type: "commercial",
        name: nextNumber === 0 ? "Ground Floor" : `Floor ${nextNumber}`
      });
      toast.success("Floor added successfully");
    } catch (e) {
      toast.error("Failed to add floor");
    }
  };

  const handleAddRoom = async (floorId: string) => {
    if (!newRoomNumber) {
      toast.error("Please enter a room number");
      return;
    }
    
    try {
      await addRoom.mutateAsync({
        floor_id: floorId,
        number: newRoomNumber,
        rent_price: Number(newRoomPrice) || 0,
        status: "vacant"
      });
      setNewRoomNumber("");
      setNewRoomPrice("");
      toast.success("Room added successfully");
    } catch (e) {
      toast.error("Failed to add room. Room number might already exist on this floor.");
    }
  };

  if (floors.isLoading) return <div className="p-12 text-center text-slate-500 font-black uppercase tracking-[0.3em] animate-pulse">Scanning Structural Data...</div>;

  return (
    <div className="min-h-screen space-y-10 pb-20">
      <Header 
        title="Building Architecture" 
        subtitle="Manage floors, rooms, and lease pricing infrastructure" 
      />

      {/* Connection Status Banner - Midnight Rose */}
      {!isSupabaseConfigured && (
        <Card className="border-none bg-rose-500/10 border-rose-500/20 mb-10 group transition-all hover:bg-rose-500/15 rounded-3xl">
          <CardContent className="flex items-center gap-6 py-6 px-8">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center text-rose-400 animate-pulse border border-rose-500/30">
              <ShieldAlert className="w-6 h-6 flex-shrink-0" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-black text-rose-400 uppercase tracking-widest">Connectivity Offline</h4>
              <p className="text-xs font-bold text-rose-300 opacity-60 mt-1">Please provide your credentials in <code className="bg-rose-500/20 px-2 py-0.5 rounded font-mono text-white">.env.local</code>.</p>
            </div>
            <Button variant="outline" size="sm" className="bg-rose-500 text-white border-none hover:bg-rose-600 font-black uppercase text-[10px] tracking-widest px-6 h-10 rounded-xl shadow-lg shadow-rose-500/20" asChild>
              <a href="https://supabase.com" target="_blank" rel="noreferrer">Initialize Now</a>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Statistics or Info Card - Midnight Indigo */}
        <Card className="lg:col-span-1 border-none bg-card/40 backdrop-blur-md rounded-3xl shadow-2xl border-t border-white/5">
          <CardHeader className="p-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
                <Info className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-black text-white uppercase tracking-tight">Strategy Center</CardTitle>
                <CardDescription className="text-xs font-bold text-slate-500 mt-0.5">Plaza structural metrics</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6 pt-0">
            <div className="grid gap-3">
              <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Floors</span>
                <Badge variant="secondary" className="bg-primary/20 text-primary border border-primary/20 font-black px-3 py-1 rounded-full">{floors.data?.length || 0}</Badge>
              </div>
              <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Units</span>
                <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-black px-3 py-1 rounded-full">{rooms.data?.length || 0}</Badge>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Button onClick={handleAddFloor} className="w-full bg-primary hover:bg-blue-600 font-black uppercase text-[10px] tracking-widest h-12 rounded-2xl shadow-xl shadow-primary/20">
                <Plus className="w-4 h-4 mr-2" />
                Add New Floor
              </Button>
              <Button 
                variant="outline" 
                onClick={handleSeed} 
                disabled={isSeeding}
                className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10 font-black uppercase text-[10px] tracking-widest h-12 rounded-2xl"
              >
                <DatabaseZap className="w-4 h-4 mr-2 text-primary" />
                Seed Real Foundation
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Floors and Rooms Management */}
        <div className="lg:col-span-2">
          <div className="space-y-6">
            {floors.data?.sort((a,b) => a.number - b.number).map((floor) => (
              <Card key={floor.id} className="border-none bg-card/40 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl border-t border-white/5 group">
                <Accordion type="single" collapsible>
                  <AccordionItem value={floor.id} className="border-none">
                    <AccordionTrigger className="px-8 hover:no-underline py-6 group-hover:bg-white/[0.01] transition-colors">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                          <Building2 className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                          <div className="text-base font-black text-white tracking-tight uppercase">{floor.name}</div>
                          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{floor.type} Infrastructure</div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-8 pb-8 pt-4 space-y-8">
                      <div className="p-6 bg-black/20 rounded-2xl border border-white/5 space-y-6">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-1 underline underline-offset-4 decoration-2">Unit Configuration</label>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                          <input 
                            placeholder="Unit ID (e.g. 101)" 
                            value={newRoomNumber}
                            onChange={(e) => setNewRoomNumber(e.target.value)}
                            className="md:col-span-2 bg-white/5 border border-white/10 h-11 px-4 rounded-xl text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                          <input 
                            placeholder="Rent (ETB)" 
                            type="number"
                            value={newRoomPrice}
                            onChange={(e) => setNewRoomPrice(e.target.value)}
                            className="md:col-span-2 bg-white/5 border border-white/10 h-11 px-4 rounded-xl text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                          <Button onClick={() => handleAddRoom(floor.id)} className="bg-primary hover:bg-blue-600 h-11 rounded-xl font-black uppercase text-[10px] tracking-widest">
                            <Plus className="w-4 h-4 mr-2" />
                            Deploy
                          </Button>
                        </div>

                        {/* Room Grid */}
                        <div className="flex gap-3 flex-wrap pt-2">
                          {rooms.data?.filter(r => r.floor_id === floor.id).sort((a,b) => a.number.localeCompare(b.number)).map(room => (
                            <div key={room.id} className="group relative px-5 py-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/40 hover:bg-primary/5 transition-all w-28 text-center shadow-lg">
                              <div className="text-xs font-black text-white tracking-tight">{room.number}</div>
                              <div className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-tighter">ETB {room.rent_price.toLocaleString()}</div>
                              <button 
                                onClick={() => deleteRoom.mutate(room.id)}
                                className="absolute -top-2 -right-2 w-7 h-7 rounded-xl bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:scale-110 active:scale-95"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                          {rooms.data?.filter(r => r.floor_id === floor.id).length === 0 && (
                            <div className="text-[10px] text-slate-700 font-bold uppercase tracking-widest py-4 italic">No units deployed on this floor</div>
                          )}
                        </div>
                      </div>

                      <div className="pt-4 flex justify-between items-center bg-white/[0.01] p-4 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-2 text-rose-500/60">
                          <ShieldAlert className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase tracking-wide">Critical: Full chain deletion active</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            if(confirm("Are you sure you want to delete this floor and all its units?")) {
                              deleteFloor.mutate(floor.id);
                            }
                          }}
                          className="text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 font-black uppercase text-[10px] tracking-widest px-5 h-9 rounded-xl border border-transparent hover:border-rose-500/20"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Purge Floor
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </Card>
            ))}
          </div>

          {floors.data?.length === 0 && (
            <div className="py-40 text-center space-y-8 bg-card/20 rounded-[3rem] border border-dashed border-white/10">
              <div className="w-24 h-24 bg-white/[0.02] rounded-[2rem] flex items-center justify-center mx-auto border border-white/[0.05]">
                <LayoutGrid className="w-10 h-10 text-slate-800" />
              </div>
              <div className="space-y-2">
                <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-xs">Architectural Void</p>
                <p className="text-[10px] text-slate-600 font-bold uppercase">Initialize the building foundation to begin</p>
              </div>
              <Button onClick={handleAddFloor} className="bg-primary hover:bg-blue-600 px-12 h-12 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-primary/20">Initialize Ground Floor</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
