import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTenants, Tenant } from "@/hooks/useTenants";
import { useBuilding } from "@/hooks/useBuilding";
import { usePayments, Payment } from "@/hooks/usePayments";
import { 
  Search, 
  Trash2, 
  Plus,
  Save,
  Paperclip,
  Calendar,
  Building,
  Mail,
  Phone,
  Settings2,
  ExternalLink,
  Wallet,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  User,
  ArrowUpRight
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";

export default function Tenants() {
  const { 
    tenants, 
    addTenant, 
    updateTenant, 
    deleteTenant, 
    uploadFile, 
    documents, 
    deleteDocument,
    checkoutTenant 
  } = useTenants();
  
  const { floors, rooms, vacantRooms, updateRoom } = useBuilding();
  const { payments, updatePaymentStatus, deletePayment } = usePayments();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [listTab, setListTab] = useState<"active" | "archived">("active");
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ email: "", contact_number: "" });
  
  const tenantDocs = documents(selectedTenant?.id || "");
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Checkout states
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutRoomStatus, setCheckoutRoomStatus] = useState<'vacant' | 'maintenance'>('vacant');

  // Tenant-specific payment reconciliation
  const [isReconcileOpen, setIsReconcileOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [reconcileData, setReconcileData] = useState({
    method: "Bank Transfer",
    staff: "",
  });

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
        status: 'active' as const,
        lease_start: newTenant.lease_start ? new Date(newTenant.lease_start).toISOString() : new Date().toISOString(),
        lease_end: newTenant.lease_end ? new Date(newTenant.lease_end).toISOString() : undefined,
        email: newTenant.email || undefined,
        contact_number: newTenant.contact_number || undefined,
        id_number: newTenant.id_number || undefined
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

  const handleReconcileSubmit = async () => {
    if (!selectedPayment) return;
    try {
      await updatePaymentStatus.mutateAsync({
        id: selectedPayment.id,
        status: "paid",
        method: reconcileData.method,
        staff: reconcileData.staff || undefined,
      });
      toast.success("Payment successfully reconciled.");
      setIsReconcileOpen(false);
      setSelectedPayment(null);
      setReconcileData({ method: "Bank Transfer", staff: "" });
    } catch (error: any) {
      toast.error(error.message || "Reconciliation failed.");
    }
  };

  const handleWaivePayment = async (id: string) => {
    if (confirm("Are you sure you want to waive (delete) this invoice? This cannot be undone.")) {
      try {
        await deletePayment.mutateAsync(id);
        toast.success("Invoice waived.");
      } catch (error: any) {
        toast.error(error.message || "Failed to waive payment.");
      }
    }
  };

  // Filter tenants by active/archived state + search term
  const filteredTenants = tenants.data?.filter(t => {
    const matchesSearch = 
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const isArchived = t.status === "archived";
    const matchesTab = listTab === "active" ? !isArchived : isArchived;

    return matchesSearch && matchesTab;
  });

  const getRoomInfo = (roomId?: string) => {
    if (!roomId) return { number: "Unassigned", floor: "N/A" };
    const room = rooms.data?.find(r => r.id === roomId);
    if (!room) return { number: "Unknown", floor: "N/A" };
    const floor = floors.data?.find(f => f.id === room.floor_id);
    return { number: room.number, floor: floor?.name || "Floor" };
  };

  // Get selected tenant's ledger
  const selectedTenantPayments = payments.data?.filter(p => p.tenant_id === selectedTenant?.id) || [];
  const selectedTenantPendingPayments = selectedTenantPayments.filter(p => p.status === "pending");
  const selectedTenantBalance = selectedTenantPendingPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  if (tenants.isLoading || rooms.isLoading || payments.isLoading) {
    return (
      <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-[0.2em] animate-pulse">
        Syncing Registry...
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 px-1">Tenants</h2>
          <p className="text-sm text-slate-500 px-1">Manage resident identities, lease terms, billing history and checkout processes</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Active / Archive Toggle */}
          <div className="flex border border-border bg-white rounded-lg p-0.5 w-full sm:w-auto self-stretch">
            <button
              onClick={() => setListTab("active")}
              className={`flex-1 sm:flex-initial text-center px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                listTab === "active" 
                  ? "bg-slate-900 text-white shadow-sm" 
                  : "text-slate-400 hover:text-slate-900"
              }`}
            >
              Active Residents
            </button>
            <button
              onClick={() => setListTab("archived")}
              className={`flex-1 sm:flex-initial text-center px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                listTab === "archived" 
                  ? "bg-slate-900 text-white shadow-sm" 
                  : "text-slate-400 hover:text-slate-900"
              }`}
            >
              Archived History
            </button>
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search registry..." 
              className="pl-9 h-10 bg-white border-border rounded-lg text-sm w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {listTab === "active" && (
            <Button 
              onClick={() => setIsAddOpen(true)}
              className="h-10 px-4 bg-primary text-white rounded-lg font-bold text-xs flex gap-2 shadow-lg shadow-primary/20 w-full sm:w-auto shrink-0"
            >
              <Plus className="w-4 h-4" /> Add Tenant
            </Button>
          )}
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
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg border ${
                  tenant.status === 'archived' 
                    ? 'bg-slate-50 text-slate-400 border-slate-100' 
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {tenant.name.charAt(0)}
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`text-sm font-bold truncate ${tenant.status === 'archived' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                      {tenant.name}
                    </h3>
                    {tenant.source === 'airbnb' && tenant.status !== 'archived' && (
                      <span className="bg-[#ff5a5f]/10 text-[#ff5a5f] border-none px-2 py-0.5 rounded-full text-[8px] uppercase tracking-wider font-black">Airbnb</span>
                    )}
                    {tenant.status === 'archived' && (
                      <span className="bg-slate-100 text-slate-500 border-none px-2 py-0.5 rounded-full text-[8px] uppercase tracking-wider font-bold">Archived</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1.5">
                       <Building className="w-3 h-3" /> {tenant.status === 'archived' ? 'No Room Assigned' : `${room.floor} • Unit ${room.number}`}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1.5">
                       <Calendar className="w-3 h-3" /> 
                       {tenant.status === 'archived' && tenant.move_out_date
                         ? `Moved Out: ${format(new Date(tenant.move_out_date), 'MMM dd, yyyy')}`
                         : `Since ${tenant.lease_start ? format(new Date(tenant.lease_start), 'MMM yyyy') : 'Recently'}`
                       }
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
                   Profile / Ledger <Settings2 className="w-3.5 h-3.5" />
                 </Button>
                 <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-9 w-9 text-slate-300 hover:text-rose-600 hover:bg-rose-50 border border-transparent rounded-lg transition-all"
                  onClick={() => {
                    if (confirm("Remove resident permanently from registry?")) {
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
        {filteredTenants?.length === 0 && (
          <div className="text-center py-16 card-professional">
            <p className="text-slate-400 font-medium italic text-xs uppercase tracking-wider">No residents logged in this registry state</p>
          </div>
        )}
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

      {/* Profile Detail Sheet (With Tabbed Structure) */}
      <Sheet open={!!selectedTenant} onOpenChange={(open) => {
        if (!open) {
          setSelectedTenant(null);
          setIsEditing(false);
        }
      }}>
        <SheetContent className="bg-white border-l border-border sm:max-w-md p-0 overflow-hidden flex flex-col">
          {/* Header Panel */}
          <div className="p-8 bg-slate-50 border-b border-border flex-shrink-0">
             <div className="flex items-center justify-between mb-4">
                <Button 
                   variant="ghost" 
                   size="sm" 
                   disabled={selectedTenant?.status === 'archived'}
                   className="h-8 px-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-all gap-2 border border-transparent hover:border-primary/20"
                   onClick={() => {
                     if (isEditing) {
                        updateTenant.mutate({ id: selectedTenant!.id, ...editData });
                        setSelectedTenant({ ...selectedTenant!, ...editData });
                        setIsEditing(false);
                        toast.success("Profile registry updated.");
                     } else {
                        setEditData({ email: selectedTenant!.email || "", contact_number: selectedTenant!.contact_number || "" });
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

          <Tabs defaultValue="profile" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="w-full flex rounded-none border-b border-border bg-slate-50/50 p-0 h-11 shrink-0">
              <TabsTrigger value="profile" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-slate-500 data-[state=active]:text-primary font-bold text-xs">Profile Details</TabsTrigger>
              <TabsTrigger value="billing" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-slate-500 data-[state=active]:text-primary font-bold text-xs">Billing & Ledger</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar mt-0">
              {/* Unit Assignment */}
              <div className="grid grid-cols-2 gap-6 bg-white p-4 rounded-xl border border-border shadow-sm">
                 <div className="space-y-0.5">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Floor</p>
                    <p className="text-xs font-bold text-slate-900 uppercase">
                      {selectedTenant?.status === 'archived' ? 'N/A' : getRoomInfo(selectedTenant?.room_id).floor}
                    </p>
                 </div>
                 <div className="space-y-0.5">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Unit</p>
                    <p className="text-xs font-bold text-primary uppercase">
                      {selectedTenant?.status === 'archived' ? 'Archived / Checked Out' : `#${getRoomInfo(selectedTenant?.room_id).number}`}
                    </p>
                 </div>
              </div>

              {/* Lease terms */}
              <div className="grid grid-cols-2 gap-6 bg-white p-4 rounded-xl border border-border shadow-sm">
                 <div className="space-y-0.5">
                    <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">Lease Initiated</p>
                    <p className="text-xs font-bold text-slate-900 uppercase">{selectedTenant?.lease_start ? format(new Date(selectedTenant.lease_start), 'MMMM dd, yyyy') : 'Unknown'}</p>
                 </div>
                 <div className="space-y-0.5">
                    <p className="text-[9px] font-bold text-rose-500 uppercase tracking-wider">
                      {selectedTenant?.status === 'archived' ? 'Checked Out' : 'Contract Expires'}
                    </p>
                    <p className="text-xs font-bold text-slate-900 uppercase">
                      {selectedTenant?.status === 'archived' && selectedTenant.move_out_date
                        ? format(new Date(selectedTenant.move_out_date), 'MMMM dd, yyyy')
                        : selectedTenant?.lease_end ? format(new Date(selectedTenant.lease_end), 'MMMM dd, yyyy') : 'Indefinite'
                      }
                    </p>
                 </div>
              </div>

              {/* Contact */}
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
                        <span className="text-xs font-semibold flex-1">{selectedTenant?.contact_number || 'N/A'}</span>
                      )}
                   </div>
                 </div>
              </div>

              {/* Notes */}
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

              {/* Documents */}
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
            </TabsContent>

            {/* Billing Ledger Tab */}
            <TabsContent value="billing" className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar mt-0">
              
              {/* Checkout / Move-Out Command Banner */}
              {selectedTenant?.status !== 'archived' && (
                <div className="p-4 bg-slate-900 rounded-xl text-white shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Lease Lifecycle Control</p>
                      <h4 className="text-xs font-bold uppercase tracking-wider">Finalize Resident Lease</h4>
                    </div>
                    <Button 
                      onClick={() => setIsCheckoutOpen(true)}
                      className="bg-rose-600 text-white hover:bg-rose-700 font-bold uppercase text-[9px] tracking-widest h-8 px-3 rounded-lg"
                    >
                      Checkout Tenant
                    </Button>
                  </div>
                </div>
              )}

              {/* Financial Balance Summary Card */}
              {selectedTenantBalance > 0 ? (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest">Pending Balance</p>
                    <h3 className="text-lg font-black text-rose-600">
                      ${selectedTenantBalance.toFixed(2)}
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-rose-100/50 flex items-center justify-center text-rose-600 border border-rose-200/50">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Balance Settled</p>
                    <h3 className="text-lg font-black text-emerald-600">$0.00</h3>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-emerald-100/50 flex items-center justify-center text-emerald-600 border border-emerald-200/50">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
              )}

              {/* Transactions Ledger */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Payment Transactions History</p>
                <div className="grid grid-cols-1 gap-3">
                  {selectedTenantPayments.map(p => (
                    <div key={p.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-bold text-slate-900">Monthly Lease Invoice</p>
                          <p className="text-[8px] font-semibold text-slate-400">Due {p.due_date ? format(new Date(p.due_date), 'MMMM dd, yyyy') : 'N/A'}</p>
                        </div>
                        <span className="text-xs font-bold text-slate-900">${Number(p.amount).toFixed(2)}</span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/50">
                        <div>
                          {p.status === "paid" ? (
                            <Badge className="bg-emerald-100/50 text-emerald-700 border-none font-bold text-[8px] uppercase px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                              Paid via {p.payment_method || 'Bank Transfer'}
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-100/50 text-amber-700 border-none font-bold text-[8px] uppercase px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                              Pending Reconciliation
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {p.status === "pending" && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedPayment(p);
                                  setIsReconcileOpen(true);
                                }}
                                className="text-[10px] font-bold text-primary hover:underline"
                              >
                                Reconcile
                              </button>
                              <button
                                onClick={() => handleWaivePayment(p.id)}
                                className="text-[10px] font-bold text-rose-600 hover:underline"
                              >
                                Waive
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {selectedTenantPayments.length === 0 && (
                    <div className="text-center py-10 border border-dashed border-border rounded-xl">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase italic">No payment transactions recorded</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Checkout Move-Out Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="rounded-xl border-border bg-white sm:max-w-md p-6 shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-rose-500" /> Process Move-Out / Checkout
            </DialogTitle>
            <DialogDescription className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Finalize lease termination for {selectedTenant?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Balance Check */}
            {selectedTenantPendingPayments.length > 0 ? (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-rose-700 font-bold text-xs uppercase">
                  <AlertCircle className="w-4 h-4 text-rose-500" /> Outstanding Balance Warning
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  This resident has an outstanding balance of <span className="font-bold text-rose-600">${selectedTenantBalance.toFixed(2)}</span> ({selectedTenantPendingPayments.length} pending invoices). Please reconcile or waive these payments before checking out.
                </p>
                <div className="max-h-28 overflow-y-auto space-y-1.5 pt-1.5 border-t border-rose-200/40">
                  {selectedTenantPendingPayments.map(p => (
                    <div key={p.id} className="flex justify-between items-center text-[10px] text-slate-700">
                      <span>Due {p.due_date ? format(new Date(p.due_date), 'MM-dd-yyyy') : 'N/A'}</span>
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold">${Number(p.amount).toFixed(2)}</span>
                        <button 
                          onClick={() => {
                            setSelectedPayment(p);
                            setIsReconcileOpen(true);
                          }}
                          className="text-primary hover:underline font-bold"
                        >Pay</button>
                        <button 
                          onClick={async () => {
                            if (confirm("Waive this invoice?")) {
                              await deletePayment.mutateAsync(p.id);
                              toast.success("Invoice waived.");
                            }
                          }}
                          className="text-rose-600 hover:underline font-bold"
                        >Waive</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <div className="space-y-0.5">
                  <p className="text-emerald-800 font-bold text-xs uppercase">All Dues Cleared</p>
                  <p className="text-[10px] text-slate-500">The tenant has a $0.00 outstanding balance. Ready for checkout.</p>
                </div>
              </div>
            )}

            {/* Room Status Select */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">New Unit Status</Label>
              <Select
                value={checkoutRoomStatus}
                onValueChange={(val: any) => setCheckoutRoomStatus(val)}
              >
                <SelectTrigger className="h-10 rounded-lg text-xs font-semibold bg-white border-border">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent className="rounded-lg border-border">
                  <SelectItem value="vacant">Vacant (Ready to lease)</SelectItem>
                  <SelectItem value="maintenance">Under Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 bg-slate-50 border border-border rounded-lg text-[10px] text-slate-500">
              <p className="font-bold uppercase mb-1 text-slate-700">Actions that will occur:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Tenant will be unassigned from Unit #{getRoomInfo(selectedTenant?.room_id).number}</li>
                <li>Lease contract end date will be set to today</li>
                <li>Tenant status will be updated to 'archived'</li>
                <li>Unit #{getRoomInfo(selectedTenant?.room_id).number} status will set to '{checkoutRoomStatus}'</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="mt-6 flex gap-2">
            <Button
              variant="outline"
              className="h-10 text-xs font-bold border-border rounded-lg"
              onClick={() => setIsCheckoutOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="h-10 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700 shadow-md shadow-rose-100"
              onClick={async () => {
                if (!selectedTenant) return;
                try {
                  await checkoutTenant.mutateAsync({
                    id: selectedTenant.id,
                    roomStatus: checkoutRoomStatus,
                  });
                  toast.success("Tenant successfully checked out. Lease terminated.");
                  setIsCheckoutOpen(false);
                  setSelectedTenant(null); // Close sheet too
                } catch (err: any) {
                  toast.error(err.message || "Failed to process checkout.");
                }
              }}
            >
              Confirm Move-Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reconcile Modal (Used globally in this page) */}
      <Dialog open={isReconcileOpen} onOpenChange={setIsReconcileOpen}>
        <DialogContent className="rounded-xl border-border bg-white sm:max-w-md p-6 shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" /> Reconcile Receipt
            </DialogTitle>
            <DialogDescription className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Mark invoice as Paid
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-border flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-500">Invoice Amount</span>
              <span className="font-bold text-slate-900 text-sm">
                ${selectedPayment && Number(selectedPayment.amount).toFixed(2)}
              </span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payment Method</Label>
              <Select
                value={reconcileData.method}
                onValueChange={(val) => setReconcileData({ ...reconcileData, method: val })}
              >
                <SelectTrigger className="h-10 rounded-lg text-xs font-semibold bg-white border-border">
                  <SelectValue placeholder="Select Method" />
                </SelectTrigger>
                <SelectContent className="rounded-lg border-border">
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Staff Responsible</Label>
              <Input
                placeholder="Receiver name or initials..."
                value={reconcileData.staff}
                onChange={(e) => setReconcileData({ ...reconcileData, staff: e.target.value })}
                className="h-10 rounded-lg text-sm bg-white border-border"
              />
            </div>
          </div>

          <DialogFooter className="mt-6 flex gap-2">
            <Button
              variant="outline"
              className="h-10 text-xs font-bold border-border rounded-lg"
              onClick={() => {
                setIsReconcileOpen(false);
                setSelectedPayment(null);
              }}
            >
              Cancel
            </Button>
            <Button
              className="h-10 text-xs font-bold bg-primary text-white rounded-lg hover:bg-primary/95"
              onClick={handleReconcileSubmit}
            >
              Confirm Reconciliation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
