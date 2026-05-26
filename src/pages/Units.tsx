import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useBuilding } from "@/hooks/useBuilding";
import { useReset } from "@/hooks/useReset";
import { 
  Search, 
  Filter, 
  Pencil, 
  ShieldCheck, 
  Building, 
  Layers,
  ChevronDown,
  ChevronUp,
  Trash2,
  PlusCircle,
  RefreshCw
} from "lucide-react";

import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

export default function Units() {
  const { floors, rooms, updateRoom, addFloor, deleteFloor, addRoom, deleteRoom } = useBuilding();
  const { resetProperties } = useReset();
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetPasscode, setResetPasscode] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const handleResetProperties = async () => {
    setIsResetting(true);
    try {
      await resetProperties.mutateAsync({ passcode: resetPasscode });
      setIsResetDialogOpen(false);
      setResetPasscode("");
    } catch (e) {
      // Errors are handled by the hook
    } finally {
      setIsResetting(false);
    }
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [expandedFloors, setExpandedFloors] = useState<string[]>([]);

  // New States
  const [isAddingFloor, setIsAddingFloor] = useState(false);
  const [newFloorData, setNewFloorData] = useState({ number: "", name: "", type: "commercial" });
  
  const [addingRoomFloorId, setAddingRoomFloorId] = useState<string | null>(null);
  const [newRoomData, setNewRoomData] = useState({ number: "", rent_price: "", room_type: "Commercial" });

  const toggleFloor = (floorId: string) => {
    setExpandedFloors(prev => 
      prev.includes(floorId) 
        ? prev.filter(id => id !== floorId) 
        : [...prev, floorId]
    );
  };

  const getStatusColor = (status: string, isManager: boolean) => {
    if (isManager) return "bg-blue-600 text-white border-blue-700 shadow-sm";
    if (status === "occupied") return "bg-emerald-600 text-white border-emerald-700 shadow-sm";
    if (status === "maintenance") return "bg-amber-400 text-black border-amber-500 shadow-sm";
    return "bg-rose-600 text-white border-rose-700 shadow-sm"; // Vacant is Red
  };

  const handleUpdate = async () => {
    if (!editingRoom) return;
    try {
      await updateRoom.mutateAsync({
        id: editingRoom.id,
        number: editingRoom.number,
        rent_price: Number(editingRoom.rent_price),
        room_type: editingRoom.room_type,
        business_name: editingRoom.business_name
      });
      toast.success(`Unit ${editingRoom.number} updated.`);
      setEditingRoom(null);
    } catch (e) {
      toast.error("Failed to update registry.");
    }
  };

  const handleAddFloor = async () => {
    try {
      await addFloor.mutateAsync({
        number: Number(newFloorData.number),
        name: newFloorData.name,
        type: newFloorData.type as "commercial" | "residential"
      });
      toast.success("Floor layout created.");
      setIsAddingFloor(false);
      setNewFloorData({ number: "", name: "", type: "commercial" });
    } catch (e) {
      toast.error("Failed to add floor");
    }
  };

  const handleAddRoom = async () => {
    if (!addingRoomFloorId) return;
    try {
      await addRoom.mutateAsync({
        floor_id: addingRoomFloorId,
        number: newRoomData.number,
        rent_price: Number(newRoomData.rent_price),
        status: "vacant",
        room_type: newRoomData.room_type as any
      });
      toast.success("Unit created safely.");
      setAddingRoomFloorId(null);
      setNewRoomData({ number: "", rent_price: "", room_type: "Commercial" });
    } catch (e) {
      toast.error("Failed to add unit");
    }
  };

  const handleDeleteFloor = async (id: string, e: any) => {
    e.stopPropagation();
    if (window.confirm("WARNING: Are you sure you want to delete this specific floor and ALL units inside it?")) {
      await deleteFloor.mutateAsync(id);
      toast.success("Floor purged.");
    }
  };

  const handleDeleteRoom = async (id: string, e: any) => {
    e.stopPropagation();
    if (window.confirm("Delete this individual unit permanently?")) {
      await deleteRoom.mutateAsync(id);
      toast.success("Unit deleted.");
    }
  };

  if (floors.isLoading || rooms.isLoading) return <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-[0.2em] animate-pulse">Syncing Property Assets...</div>;

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 px-1">Properties</h2>
          <p className="text-sm text-slate-500 px-1">Manage units, occupancy and naming across all floors</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* RESET PROPERTIES BUTTON & DIALOG */}
          <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-10 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold uppercase tracking-widest text-[10px] px-4 shrink-0 rounded-lg shadow-sm">
                <RefreshCw className="w-3.5 h-3.5 mr-2" /> Reset Properties
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-xl bg-white border-border sm:max-w-md p-6">
               <DialogHeader>
                  <DialogTitle className="text-lg font-bold text-slate-900 text-rose-600">Reset Properties</DialogTitle>
                  <DialogDescription className="text-xs font-semibold text-slate-500">
                    Are you sure you want to reset all rooms and floors to the initial default state? This action requires authorization.
                  </DialogDescription>
               </DialogHeader>
               <div className="space-y-4 py-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Enter Passcode to Confirm</label>
                    <Input 
                      type="password" 
                      placeholder="Enter passcode"
                      value={resetPasscode} 
                      onChange={e => setResetPasscode(e.target.value)} 
                      className="h-10 rounded-lg text-sm bg-slate-50 border-border" 
                    />
                 </div>
               </div>
               <DialogFooter className="flex gap-2">
                 <Button onClick={() => setIsResetDialogOpen(false)} variant="ghost" className="flex-1 rounded-lg">Cancel</Button>
                 <Button 
                   onClick={handleResetProperties} 
                   disabled={isResetting || !resetPasscode}
                   className="flex-1 h-11 bg-rose-600 hover:bg-rose-700 text-white font-bold tracking-widest rounded-lg shadow-lg shadow-rose-600/20"
                 >
                   {isResetting ? "RESETTING..." : "CONFIRM RESET"}
                 </Button>
               </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ADD INTERACTIVE FLOOR MODAL HERE */}
          <Dialog open={isAddingFloor} onOpenChange={setIsAddingFloor}>
            <DialogTrigger asChild>
              <Button className="h-10 bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase tracking-widest text-[10px] px-4 shrink-0 rounded-lg shadow-md shadow-slate-900/10">
                <PlusCircle className="w-3.5 h-3.5 mr-2" /> New Floor
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-xl bg-white border-border sm:max-w-md p-6">
               <DialogHeader>
                  <DialogTitle className="text-lg font-bold text-slate-900">Add Property Floor</DialogTitle>
                  <DialogDescription className="text-xs font-semibold text-slate-500">Establish a new vertical level</DialogDescription>
               </DialogHeader>
               <div className="space-y-4 py-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Floor Index (e.g. 1, 2, 3)</label>
                    <Input type="number" value={newFloorData.number} onChange={e => setNewFloorData({...newFloorData, number: e.target.value})} className="h-10 rounded-lg text-sm bg-slate-50" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Display Name (e.g. Ground Floor)</label>
                    <Input value={newFloorData.name} onChange={e => setNewFloorData({...newFloorData, name: e.target.value})} className="h-10 rounded-lg text-sm bg-slate-50" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Zoning Type</label>
                    <Select value={newFloorData.type} onValueChange={val => setNewFloorData({...newFloorData, type: val})}>
                      <SelectTrigger className="h-10 rounded-lg text-sm bg-slate-50"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl border-border">
                         <SelectItem value="commercial">Commercial</SelectItem>
                         <SelectItem value="residential">Residential</SelectItem>
                      </SelectContent>
                    </Select>
                 </div>
               </div>
               <DialogFooter>
                 <Button onClick={handleAddFloor} className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold tracking-widest rounded-lg shadow-lg">CREATE FLOOR</Button>
               </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search units..." 
              className="pl-9 h-10 bg-white border-border rounded-lg text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 h-10 bg-white border-border rounded-lg text-xs font-semibold">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="rounded-lg border-border">
              <SelectItem value="all">All Units</SelectItem>
              <SelectItem value="vacant">Vacant</SelectItem>
              <SelectItem value="occupied">Occupied</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-6">
        {floors.data?.sort((a,b) => a.number - b.number).map(floor => {
          const floorRooms = rooms.data?.filter(r => r.floor_id === floor.id) || [];
          const isExpanded = expandedFloors.includes(floor.id);
          
          const filteredFloorRooms = floorRooms.filter(r => {
            const nameMatch = r.business_name?.toLowerCase().includes(searchTerm.toLowerCase());
            const numberMatch = r.number.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesSearch = nameMatch || numberMatch;
            const matchesStatus = statusFilter === "all" || r.status === statusFilter;
            return matchesSearch && matchesStatus;
          }).sort((a,b) => a.number.localeCompare(b.number));

          if (filteredFloorRooms.length === 0 && searchTerm) return null;

          return (
            <div key={floor.id} className="card-professional">
              <button 
                onClick={() => toggleFloor(floor.id)}
                className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors border-b border-border last:border-b-0"
              >
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-sm">
                      {floor.number}
                   </div>
                   <div className="text-left">
                      <h3 className="text-sm font-bold text-slate-900">{floor.name}</h3>
                      <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{floor.type} Floor</p>
                   </div>
                </div>

                <div className="flex items-center gap-3 md:gap-6">
                   <div className="hidden lg:flex items-center gap-3">
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                         <span className="text-[10px] font-bold text-emerald-700">{floorRooms.filter(r => r.status === 'vacant').length} Vacant</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 rounded-full border border-blue-100">
                         <span className="text-[10px] font-bold text-blue-700">{floorRooms.filter(r => r.status === 'occupied').length} Occupied</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
                         <Layers className="w-3 h-3 text-slate-500" />
                         <span className="text-[10px] font-bold text-slate-700">{floorRooms.length > 0 ? Math.round((floorRooms.filter(r => r.status === 'occupied').length / floorRooms.length) * 100) : 0}%</span>
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="h-8 bg-blue-50 hover:bg-blue-100 text-blue-700 font-black uppercase text-[9px] tracking-widest px-3 border border-blue-100 rounded-lg shadow-sm"
                        onClick={(e) => { e.stopPropagation(); setAddingRoomFloorId(floor.id); }}
                      >
                         <PlusCircle className="w-3 h-3 mr-1.5" /> Unit
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-100 transition-colors"
                        onClick={(e) => handleDeleteFloor(floor.id, e)}
                      >
                         <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      <div className="w-px h-5 bg-border mx-1" />
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                   </div>
                </div>
              </button>

              {isExpanded && (
                <div className="p-6 bg-slate-50/30">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredFloorRooms.map(room => (
                      <div key={room.id} className="bg-white border border-border rounded-xl p-6 shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between min-h-[220px]">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1 min-w-0">
                               <h4 className="text-sm font-bold text-slate-900 truncate">Unit {room.number}</h4>
                               <p className="text-[10px] font-semibold text-primary/80 uppercase">{room.room_type || 'Studio'}</p>
                            </div>
                            <Dialog open={!!editingRoom && editingRoom.id === room.id} onOpenChange={(open) => !open && setEditingRoom(null)}>
                              <div className="flex items-center gap-1">
                                <Button
                                  onClick={(e) => handleDeleteRoom(room.id, e)}
                                  size="icon"
                                  variant="ghost"
                                  className="w-8 h-8 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all shrink-0"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                                <DialogTrigger asChild>
                                  <Button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingRoom({...room});
                                    }}
                                    size="icon" 
                                    variant="ghost" 
                                    className="w-8 h-8 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-50 border border-border shrink-0"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                </DialogTrigger>
                              </div>
                              <DialogContent className="rounded-xl bg-white sm:max-w-md p-6 border-border shadow-2xl">
                                <DialogHeader>
                                  <DialogTitle className="text-lg font-bold text-slate-900">Edit Asset</DialogTitle>
                                  <DialogDescription className="text-xs font-semibold text-slate-500">Unit #{room.number} Registry</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-5 py-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-0.5">Room Number</label>
                                      <Input value={editingRoom?.number} onChange={e => setEditingRoom({...editingRoom, number: e.target.value})} className="h-10 rounded-lg text-sm" />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-0.5">Style</label>
                                      <Select value={editingRoom?.room_type || 'Studio'} onValueChange={val => setEditingRoom({...editingRoom, room_type: val})}>
                                        <SelectTrigger className="h-10 rounded-lg text-sm">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-lg">
                                          <SelectItem value="Studio">Studio</SelectItem>
                                          <SelectItem value="Single Bedroom">Single Bedroom</SelectItem>
                                          <SelectItem value="Double Bedroom">Double Bedroom</SelectItem>
                                          <SelectItem value="Penthouse">Penthouse</SelectItem>
                                          <SelectItem value="Commercial">Commercial</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-0.5">Business Name</label>
                                    <Input placeholder="E.g. Fana Coffee..." value={editingRoom?.business_name || ""} onChange={e => setEditingRoom({...editingRoom, business_name: e.target.value})} className="h-10 rounded-lg text-sm" />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-0.5">Monthly Rent (ETB)</label>
                                    <Input type="number" value={editingRoom?.rent_price} onChange={e => setEditingRoom({...editingRoom, rent_price: e.target.value})} className="h-10 rounded-lg text-sm" />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button onClick={handleUpdate} className="w-full h-11 bg-primary text-white font-bold rounded-lg shadow-lg shadow-primary/20">Save Changes</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>

                          <div className={`p-3 rounded-lg border flex flex-col justify-center min-h-[64px] ${room.business_name ? 'bg-slate-50/50 border-slate-100' : 'bg-transparent border-dashed border-slate-200'}`}>
                             {room.business_name ? (
                               <>
                                 <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Occupant Business</p>
                                 <p className="text-xs font-bold text-slate-800 truncate">{room.business_name}</p>
                               </>
                             ) : (
                               <p className="text-[10px] font-medium text-slate-400 uppercase italic text-center">No business assigned</p>
                             )}
                          </div>
                        </div>

                        <div className="mt-6 space-y-4 pt-4 border-t border-border/60">
                           <div className="flex items-center justify-between">
                             <div className="space-y-0.5">
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Monthly Rate</p>
                                <p className="text-sm font-bold text-slate-900 tracking-tight">ETB {room.rent_price.toLocaleString()}</p>
                             </div>
                             <Badge variant="outline" className={`h-6 px-3 border-none text-[8px] font-bold uppercase ${getStatusColor(room.status, room.is_manager_office)}`}>
                                {room.is_manager_office ? 'HQ Office' : room.status}
                             </Badge>
                           </div>

                           <div className="flex gap-2">
                              <Select value={room.status} onValueChange={(val) => updateRoom.mutate({ id: room.id, status: val as any })}>
                                <SelectTrigger className="h-9 flex-1 bg-white border-border rounded-lg text-[9px] font-bold uppercase tracking-wider">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg border-border">
                                   <SelectItem value="vacant">Vacant</SelectItem>
                                   <SelectItem value="occupied">Occupied</SelectItem>
                                   <SelectItem value="maintenance">Maintenance</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => updateRoom.mutate({ id: room.id, is_manager_office: !room.is_manager_office })}
                                className={`h-9 w-9 rounded-lg border transition-colors ${room.is_manager_office ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm' : 'bg-white text-slate-400 border-border hover:bg-slate-50'}`}
                              >
                                <ShieldCheck className="w-4 h-4" />
                              </Button>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {rooms.data?.length === 0 && !rooms.isLoading && (
        <div className="py-32 text-center border-2 border-dashed border-border rounded-2xl">
           <Building className="w-12 h-12 text-slate-200 mx-auto mb-4" />
           <p className="text-sm font-medium text-slate-400">Registry is currently empty</p>
        </div>
      )}
      {/* ADD ROOM MODAL FOR SPECIFIC FLOOR */}
      <Dialog open={!!addingRoomFloorId} onOpenChange={(open) => !open && setAddingRoomFloorId(null)}>
        <DialogContent className="rounded-xl bg-white border-border sm:max-w-md p-6">
           <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900">Add New Unit</DialogTitle>
              <DialogDescription className="text-xs font-semibold text-slate-500">Append a property to this floor registry</DialogDescription>
           </DialogHeader>
           <div className="space-y-4 py-4">
             <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Unit Code/Number</label>
                    <Input value={newRoomData.number} onChange={e => setNewRoomData({...newRoomData, number: e.target.value})} className="h-10 rounded-lg text-sm bg-slate-50" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Base Rent (ETB)</label>
                    <Input type="number" value={newRoomData.rent_price} onChange={e => setNewRoomData({...newRoomData, rent_price: e.target.value})} className="h-10 rounded-lg text-sm bg-slate-50" />
                 </div>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Configuration Layout</label>
                <Select value={newRoomData.room_type} onValueChange={val => setNewRoomData({...newRoomData, room_type: val})}>
                  <SelectTrigger className="h-10 rounded-lg text-sm bg-slate-50"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl border-border">
                    <SelectItem value="Studio">Studio</SelectItem>
                    <SelectItem value="Single Bedroom">Single Bedroom</SelectItem>
                    <SelectItem value="Double Bedroom">Double Bedroom</SelectItem>
                    <SelectItem value="Penthouse">Penthouse</SelectItem>
                    <SelectItem value="Commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
             </div>
           </div>
           <DialogFooter>
             <Button onClick={handleAddRoom} className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white tracking-widest font-bold shadow-lg shadow-blue-600/20 rounded-lg">CREATE UNIT</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
