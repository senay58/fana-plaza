import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTenants } from "@/hooks/useTenants";
import { useBuilding } from "@/hooks/useBuilding";
import { 
  Search, 
  Trash2, 
  Plus,
  Download,
  Save,
  Paperclip,
  Calendar,
  Building,
  Mail,
  Phone,
  Settings2,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from "@/components/ui/sheet";
import { format } from "date-fns";

export default function Tenants() {
  const { tenants, addTenant, updateTenant, deleteTenant, uploadFile, documents, deleteDocument } = useTenants();
  const { floors, rooms, vacantRooms, updateRoom } = useBuilding();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ email: "", contact_number: "" });
  
  const tenantDocs = documents(selectedTenant?.id);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [newTenant, setNewTenant] = useState({ 
    name: "", 
    email: "", 
    contact_number: "", 
    room_id: "",
    id_number: "",
    business_type: "",
    emergency_contact: "",
    lease_start: format(new Date(), 'yyyy-MM-dd'),
    lease_end: "",
    source: "direct" as "direct" | "airbnb"
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTenant) return;
    try {
      await uploadFile.mutateAsync({ 
        tenantId: selectedTenant.id, 
        file, 
        name: file.name 
      });
      toast.success("Document archived.");
    } catch (e) {
      toast.error("Upload failed.");
    }
  };

  const handleUpdateNotes = async (notes: string) => {
    if (!selectedTenant) return;
    try {
      await updateTenant.mutateAsync({ id: selectedTenant.id, notes });
      setSelectedTenant({ ...selectedTenant, notes });
      toast.success("Notes synchronized.");
    } catch (e) {
      toast.error("Failed to sync notes.");
    }
  };

  const handleAddTenant = async () => {
    if (!newTenant.name || !newTenant.room_id) {
      toast.error("Name and Unit assignment are mandatory.");
      return;
    }
    
    try {
      const submissionData = {
        ...newTenant,
        lease_start: newTenant.lease_start ? new Date(newTenant.lease_start).toISOString() : new Date().toISOString(),
        lease_end: newTenant.lease_end || null,
        email: newTenant.email || null,
        contact_number: newTenant.contact_number || null,
        id_number: newTenant.id_number || null
      };

      await addTenant.mutateAsync(submissionData);

      const assignedRoom = rooms.data?.find(r => r.id === newTenant.room_id);
      if (assignedRoom?.room_type?.toLowerCase() === 'commercial') {
        updateRoom.mutate({ id: assignedRoom.id, business_name: newTenant.name });
      }
      
      setNewTenant({ 
        name: "", email: "", contact_number: "", room_id: "",
        id_number: "", business_type: "", emergency_contact: "", 
        lease_start: format(new Date(), 'yyyy-MM-dd'), lease_end: "", source: "direct"
      });
      setIsAddOpen(false);
      toast.success("Tenant successfully established.");
    } catch (e) {
      toast.error("Registration failed.");
    }
  };

  const filteredTenants = tenants.data?.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoomInfo = (roomId?: string) => {
    if (!roomId) return { number: "Unassigned", floor: "N/A" };
    const room = rooms.data?.find(r => r.id === roomId);
    if (!room) return { number: "Unknown", floor: "N/A" };
    const floor = floors.data?.find(f => f.id === room.floor_id);
    return { number: room.number, floor: floor?.name || "Floor" };
  };

  if (tenants.isLoading || rooms.isLoading) return <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-[0.2em] animate-pulse">Syncing Registry...</div>;

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 px-1">Tenants</h2>
          <p className="text-sm text-slate-500 px-1">Manage resident identities, lease terms and documentation</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search registry..." 
              className="pl-9 h-10 bg-white border-border rounded-lg text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            onClick={() => setIsAddOpen(true)}
            className="h-10 px-4 bg-primary text-white rounded-lg font-bold text-xs flex gap-2 shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" /> Add Tenant
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredTenants?.map(tenant => {
          const room = getRoomInfo(tenant.room_id);
          return (
            <div 
              key={tenant.id} 
              className="card-professional p-6 flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-lg border border-slate-200">
                  {tenant.name.charAt(0)}
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 truncate">{tenant.name}</h3>
                    {tenant.source === 'airbnb' && (
                      <span className="bg-[#ff5a5f]/10 text-[#ff5a5f] border-none px-2 py-0.5 rounded-full text-[8px] uppercase tracking-wider font-black">Airbnb</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1.5">
                       <Building className="w-3 h-3" /> {room.floor} • Unit {room.number}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1.5">
                       <Calendar className="w-3 h-3" /> Since {tenant.lease_start ? format(new Date(tenant.lease_start), 'MMM yyyy') : 'Recently'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                 <Button 
                   size="sm" 
                   variant="ghost" 
                   className="h-9 px-4 text-slate-500 hover:text-primary hover:bg-slate-50 border border-border rounded-lg text-xs font-bold gap-2"
                   onClick={() => setSelectedTenant(tenant)}
                 >
                   Profile <Settings2 className="w-3.5 h-3.5" />
                 </Button>
                 <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-9 w-9 text-slate-300 hover:text-rose-600 hover:bg-rose-50 border border-transparent rounded-lg transition-all"
                  onClick={() => {
                    if (confirm("Remove resident from registry?")) {
                      deleteTenant.mutate(tenant.id);
                    }
                  }}
                 >
                   <Trash2 className="w-4 h-4" />
                 </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Tenant Modal */}
      <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
        <SheetContent className="bg-white border-l border-border sm:max-w-md p-8 overflow-y-auto custom-scrollbar">
           <SheetHeader className="mb-8 p-0">
              <SheetTitle className="text-xl font-bold text-slate-900">Add New Tenant</SheetTitle>
              <SheetDescription className="text-xs font-semibold text-slate-500">Register a new resident in the Plaza Registry</SheetDescription>
           </SheetHeader>
           
           <div className="space-y-6">
              <div className="space-y-1.5">
                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-0.5">Full Name</label>
                 <Input className="h-10 rounded-lg text-sm" value={newTenant.name} onChange={e => setNewTenant({...newTenant, name: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-0.5">ID Number</label>
                   <Input className="h-10 rounded-lg text-sm" value={newTenant.id_number} onChange={e => setNewTenant({...newTenant, id_number: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-0.5">Assigned Unit</label>
                   <Select value={newTenant.room_id} onValueChange={val => setNewTenant({...newTenant, room_id: val})}>
                      <SelectTrigger className="h-10 rounded-lg text-xs font-semibold">
                         <SelectValue placeholder="Select Unit" />
                      </SelectTrigger>
                      <SelectContent className="max-h-64 rounded-lg border-border">
                         {vacantRooms.data?.filter(r => !r.is_manager_office).map(r => (
                           <SelectItem key={r.id} value={r.id} className="text-xs">{r.floors?.name} - {r.number}</SelectItem>
                         ))}
                      </SelectContent>
                   </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-0.5">Email</label>
                 <Input type="email" className="h-10 rounded-lg text-sm" value={newTenant.email} onChange={e => setNewTenant({...newTenant, email: e.target.value})} />
              </div>

              <div className="space-y-1.5">
                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-0.5">Phone</label>
                 <Input className="h-10 rounded-lg text-sm" value={newTenant.contact_number} onChange={e => setNewTenant({...newTenant, contact_number: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-0.5">Lease Custom Start</label>
                    <Input type="date" className="h-10 rounded-lg text-sm" value={newTenant.lease_start} onChange={e => setNewTenant({...newTenant, lease_start: e.target.value})} />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-0.5">Lease Expiry</label>
                    <Input type="date" className="h-10 rounded-lg text-sm" value={newTenant.lease_end} onChange={e => setNewTenant({...newTenant, lease_end: e.target.value})} />
                 </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-0.5">Acquisition Source</label>
                    <Select value={newTenant.source} onValueChange={val => setNewTenant({...newTenant, source: val as any})}>
                       <SelectTrigger className="h-10 rounded-lg text-xs font-semibold">
                          <SelectValue placeholder="Source" />
                       </SelectTrigger>
                       <SelectContent className="rounded-lg border-border">
                          <SelectItem value="direct">Direct Leasing</SelectItem>
                          <SelectItem value="airbnb">Airbnb / Booking</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
              </div>

              <Button 
                onClick={handleAddTenant}
                className="w-full h-11 bg-primary text-white font-bold rounded-lg shadow-lg shadow-primary/20 mt-4"
              >
                Register Tenant
              </Button>
           </div>
        </SheetContent>
      </Sheet>

      {/* Profile Detail (Sheet) */}
      <Sheet open={!!selectedTenant} onOpenChange={(open) => {
        if (!open) {
          setSelectedTenant(null);
          setIsEditing(false);
        }
      }}>
        <SheetContent className="bg-white border-l border-border sm:max-w-md p-0 overflow-hidden flex flex-col">
          <div className="p-8 bg-slate-50 border-b border-border flex-shrink-0">
             <div className="flex items-center justify-between mb-4">
                <Button 
                   variant="ghost" 
                   size="sm" 
                   className="h-8 px-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-all gap-2 border border-transparent hover:border-primary/20"
                   onClick={() => {
                     if (isEditing) {
                        // Handle Save
                        updateTenant.mutate({ id: selectedTenant.id, ...editData });
                        setSelectedTenant({ ...selectedTenant, ...editData });
                        setIsEditing(false);
                        toast.success("Profile registry updated.");
                     } else {
                        setEditData({ email: selectedTenant.email || "", contact_number: selectedTenant.contact_number || "" });
                        setIsEditing(true);
                     }
                   }}
                >
                   {isEditing ? <><Save className="w-3.5 h-3.5" /> Sync Profile</> : <><Settings2 className="w-3.5 h-3.5" /> Edit Profile</>}
                </Button>
             </div>
             <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20">
                   {selectedTenant?.name.charAt(0)}
                </div>
                <div>
                   <h2 className="text-lg font-bold text-slate-900 leading-tight">{selectedTenant?.name}</h2>
                   <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-1">ID: {selectedTenant?.id_number || 'No ID Logged'}</p>
                </div>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
            {/* structural assignment */}
            <div className="grid grid-cols-2 gap-6 bg-white p-4 rounded-xl border border-border shadow-sm">
               <div className="space-y-0.5">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Floor</p>
                  <p className="text-xs font-bold text-slate-900 uppercase">{getRoomInfo(selectedTenant?.room_id).floor}</p>
               </div>
               <div className="space-y-0.5">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Unit</p>
                  <p className="text-xs font-bold text-primary uppercase">#{getRoomInfo(selectedTenant?.room_id).number}</p>
               </div>
            </div>

            {/* lease terms */}
            <div className="grid grid-cols-2 gap-6 bg-white p-4 rounded-xl border border-border shadow-sm">
               <div className="space-y-0.5">
                  <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">Lease Initiated</p>
                  <p className="text-xs font-bold text-slate-900 uppercase">{selectedTenant?.lease_start ? format(new Date(selectedTenant.lease_start), 'MMMM dd, yyyy') : 'Unknown'}</p>
               </div>
               <div className="space-y-0.5">
                  <p className="text-[9px] font-bold text-rose-500 uppercase tracking-wider">Contract Expires</p>
                  <p className="text-xs font-bold text-slate-900 uppercase">{selectedTenant?.lease_end ? format(new Date(selectedTenant.lease_end), 'MMMM dd, yyyy') : 'Indefinite'}</p>
               </div>
            </div>

            {/* contact */}
            <div className="space-y-4">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Contact Details</p>
               <div className="space-y-3">
                 <div className="flex items-center gap-3 text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 group focus-within:border-primary/30 transition-all">
                    <Mail className="w-4 h-4 text-slate-400" />
                    {isEditing ? (
                      <input 
                        className="bg-transparent text-xs font-semibold w-full focus:outline-none text-slate-900"
                        value={editData.email}
                        onChange={e => setEditData({ ...editData, email: e.target.value })}
                        placeholder="Email Address"
                      />
                    ) : (
                      <span className="text-xs font-semibold">{selectedTenant?.email || 'N/A'}</span>
                    )}
                 </div>
                 <div className="flex items-center gap-3 text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 group focus-within:border-primary/30 transition-all">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    {isEditing ? (
                      <input 
                        className="bg-transparent text-xs font-semibold w-full focus:outline-none text-slate-900"
                        value={editData.contact_number}
                        onChange={e => setEditData({ ...editData, contact_number: e.target.value })}
                        placeholder="Phone Number"
                      />
                    ) : (
                      <>
                        <span className="text-xs font-semibold flex-1">{selectedTenant?.contact_number || 'N/A'}</span>
                        {selectedTenant?.contact_number && (
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            className="h-7 text-[9px] uppercase font-bold text-primary tracking-widest bg-primary/10 hover:bg-primary/20 shrink-0"
                            onClick={() => window.location.href = `sms:${selectedTenant.contact_number}?body=Hello ${encodeURIComponent(selectedTenant.name)}, `}
                          >
                             Send Text
                          </Button>
                        )}
                      </>
                    )}
                 </div>
               </div>
            </div>

            {/* notes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pl-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manager Notes</p>
                <Save className="w-3.5 h-3.5 text-slate-300" />
              </div>
              <textarea 
                className="w-full bg-white border border-border rounded-xl p-4 text-xs text-slate-800 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary/10 shadow-sm"
                placeholder="Internal notes about the tenant..."
                defaultValue={selectedTenant?.notes}
                onBlur={(e) => handleUpdateNotes(e.target.value)}
              />
            </div>

            {/* docs */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pl-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Archived Documents</p>
                <label className="cursor-pointer flex items-center gap-1.5 text-[9px] font-bold text-primary hover:text-primary/80 transition-all uppercase">
                  <Plus className="w-3.5 h-3.5" /> Upload New
                  <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} />
                </label>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {tenantDocs.data?.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-border shadow-sm hover:border-primary/30 transition-all group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-primary border border-blue-100">
                        <Paperclip className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-900 truncate uppercase">{doc.name}</p>
                        <p className="text-[8px] font-semibold text-slate-400">{format(new Date(doc.created_at), 'MMMM dd, yyyy')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <a 
                        href={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/documents/${doc.file_path}`} 
                        target="_blank" 
                        title="View Document"
                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                      ><ExternalLink className="w-4 h-4" /></a>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Delete Document"
                        onClick={async () => {
                          if (confirm("Delete this document? This action cannot be reversed.")) {
                            try {
                              await deleteDocument.mutateAsync({ id: doc.id, filePath: doc.file_path });
                              toast.success("Document destroyed.");
                            } catch (e) {
                              toast.error("Failed to delete document.");
                            }
                          }
                        }}
                        className="h-8 w-8 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                {tenantDocs.data?.length === 0 && (
                  <div className="text-center py-8 border border-dashed border-border rounded-xl">
                    <p className="text-[10px] font-medium text-slate-400 uppercase italic">No documents attached</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
