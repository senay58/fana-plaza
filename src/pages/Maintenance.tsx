import { useMaintenance, MaintenanceLog } from "@/hooks/useMaintenance";
import { useBuilding } from "@/hooks/useBuilding";
import { useReset } from "@/hooks/useReset";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  Wrench, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Trash2,
  Zap,
  Droplet,
  Sparkles,
  AlertCircle,
  Save,
  User,
  RefreshCw
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format, isBefore, endOfDay } from "date-fns";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

export default function Maintenance() {
  const { maintenanceLogs, addMaintenanceLog, updateMaintenanceStatus, deleteMaintenanceLog } = useMaintenance();
  const { rooms } = useBuilding();
  const { resetMaintenance } = useReset();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeQueue, setActiveQueue] = useState("All Logs");
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  // Reset states
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetPasscode, setResetPasscode] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const [newLog, setNewLog] = useState({
    room_id: "",
    description: "",
    severity: "Medium" as MaintenanceLog["severity"],
    status: "Pending" as MaintenanceLog["status"],
    log_type: "general" as MaintenanceLog["log_type"],
    assigned_to: "",
    deadline: ""
  });

  const getStatusColor = (status: string, deadline?: string) => {
    // Red -> Overdue (Escalations)
    if (deadline && status !== "Completed" && isBefore(new Date(deadline), new Date())) {
      return "bg-rose-50 text-rose-700 border-rose-200 outline-rose-100";
    }
    // Orange -> Pending / Assigned
    if (status === "Pending" || status === "Assigned") return "bg-orange-50 text-orange-700 border-orange-200 outline-orange-100";
    // Blue -> In Progress
    if (status === "In Progress") return "bg-blue-50 text-blue-700 border-blue-200 outline-blue-100";
    // Green -> Completed
    if (status === "Completed") return "bg-emerald-50 text-emerald-700 border-emerald-200 outline-emerald-100";
    return "bg-slate-50 text-slate-700 border-slate-200 outline-slate-100";
  };

  const getIcon = (type?: string, status?: string) => {
    if (status === "Completed") return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    switch (type) {
      case "plumbing": return <Droplet className="w-5 h-5 text-blue-500" />;
      case "electrical": return <Zap className="w-5 h-5 text-amber-500" />;
      case "cleaning": return <Sparkles className="w-5 h-5 text-teal-500" />;
      default: return <Wrench className="w-5 h-5 text-slate-500" />;
    }
  };

  const isOverdue = (deadline?: string) => {
    if (!deadline) return false;
    return isBefore(new Date(deadline), new Date());
  };

  const filteredLogs = maintenanceLogs.data?.filter(log => {
    // 1. Search filter
    const matchesSearch = log.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.rooms?.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (log.assigned_to && log.assigned_to.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!matchesSearch) return false;

    // 2. Queue routing filter
    if (activeQueue === "Escalations") {
      return log.status !== "Completed" && isOverdue(log.deadline);
    }
    if (activeQueue === "All Logs") return true;
    if (activeQueue === "Assigned") return log.status === "Assigned";
    if (activeQueue === "Active Work") return log.status === "In Progress";
    if (activeQueue === "Closed Logs") return log.status === "Completed";
    
    return true;
  });

  const handleAddLog = async () => {
    if (!newLog.room_id || !newLog.description) {
      toast.error("Please fill in mandatory fields (Unit and Description).");
      return;
    }

    try {
      const logData = {
        ...newLog,
        assigned_to: newLog.assigned_to || undefined,
        deadline: newLog.deadline ? new Date(newLog.deadline).toISOString() : undefined,
        status: newLog.assigned_to ? "Assigned" : "Pending"
      };
      // @ts-ignore
      await addMaintenanceLog.mutateAsync(logData);
      setIsAddOpen(false);
      setNewLog({ room_id: "", description: "", severity: "Medium", status: "Pending", log_type: "general", assigned_to: "", deadline: "" });
      toast.success("Maintenance request logged and routed.");
    } catch (e) {
      toast.error("Failed to create log.");
    }
  };

  const handleResetMaintenance = async () => {
    setIsResetting(true);
    try {
      await resetMaintenance.mutateAsync({ passcode: resetPasscode });
      setIsResetDialogOpen(false);
      setResetPasscode("");
    } catch (e) {
      // Errors handled by hook
    } finally {
      setIsResetting(false);
    }
  };

  const handleAssignmentUpdate = async (id: string, staffName: string) => {
    try {
      await updateMaintenanceStatus.mutateAsync({ 
        id, 
        assigned_to: staffName,
        status: "Assigned" // Auto-promote to Assigned queue when staff is added
      });
      toast.success(`Ticket assigned to ${staffName}`);
    } catch(e) {
      toast.error("Failed to update assignment.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 px-1">Maintenance Operations</h2>
          <p className="text-sm text-slate-500 px-1">Assignment tracking, service queues, and operational logs</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search tickets, units or staff..." 
              className="pl-9 h-11 bg-white border-border rounded-lg text-sm shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-11 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold uppercase tracking-widest text-[10px] px-4 shrink-0 rounded-lg shadow-sm">
                <RefreshCw className="w-3.5 h-3.5 mr-2" /> Reset
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-xl bg-white border-border sm:max-w-md p-6">
               <DialogHeader>
                  <DialogTitle className="text-lg font-bold text-slate-900 text-rose-600">Reset Maintenance Logs</DialogTitle>
                  <DialogDescription className="text-xs font-semibold text-slate-500">
                    Are you sure you want to delete all maintenance tickets? This action requires authorization.
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
                   onClick={handleResetMaintenance} 
                   disabled={isResetting || !resetPasscode}
                   className="flex-1 h-11 bg-rose-600 hover:bg-rose-700 text-white font-bold tracking-widest rounded-lg shadow-lg shadow-rose-600/20"
                 >
                   {isResetting ? "RESETTING..." : "CONFIRM RESET"}
                 </Button>
               </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="h-11 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs flex gap-2 shadow-xl shadow-slate-900/20 uppercase tracking-widest transition-all">
                <Plus className="w-4 h-4" /> New Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl border-border bg-white sm:max-w-xl p-8 shadow-2xl">
              <DialogHeader className="mb-6">
                <DialogTitle className="text-2xl font-black text-slate-900 uppercase tracking-tight">Create Service Ticket</DialogTitle>
                <DialogDescription className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Route a new request into the operational queues</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Location (Unit)</label>
                    <Select value={newLog.room_id} onValueChange={(val) => setNewLog({...newLog, room_id: val})}>
                      <SelectTrigger className="h-11 border-border rounded-lg text-sm font-semibold bg-slate-50/50">
                        <SelectValue placeholder="Select Unit Number" />
                      </SelectTrigger>
                      <SelectContent className="max-h-64 rounded-xl border-border">
                        {rooms.data?.map(room => (
                          <SelectItem key={room.id} value={room.id} className="text-xs">
                            Unit {room.number} {room.business_name ? `- ${room.business_name}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Category</label>
                    <Select value={newLog.log_type} onValueChange={(val: any) => setNewLog({...newLog, log_type: val})}>
                      <SelectTrigger className="h-11 border-border rounded-lg text-sm font-semibold bg-slate-50/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border">
                        <SelectItem value="plumbing">Plumbing</SelectItem>
                        <SelectItem value="electrical">Electrical</SelectItem>
                        <SelectItem value="cleaning">Cleaning / Janitorial</SelectItem>
                        <SelectItem value="general">General Repair</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Description of Issue</label>
                  <Input 
                    placeholder="E.g. Leaking pipe in the main bathroom..." 
                    className="h-11 border-border rounded-lg text-sm font-medium bg-slate-50/50"
                    value={newLog.description}
                    onChange={(e) => setNewLog({...newLog, description: e.target.value})}
                  />
                </div>

                <div className="p-5 bg-slate-50 rounded-xl border border-border space-y-4">
                   <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Routing & Assignment (Optional)</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-0.5 flex items-center gap-1.5"><User className="w-3 h-3"/> Assign To Staff</label>
                       <Input 
                         placeholder="Enter staff name..." 
                         className="h-10 border-white rounded-lg text-xs font-semibold shadow-sm"
                         value={newLog.assigned_to}
                         onChange={(e) => setNewLog({...newLog, assigned_to: e.target.value})}
                       />
                     </div>
                     <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-0.5 flex items-center gap-1.5"><Clock className="w-3 h-3"/> Deadline Tracker</label>
                       <Input 
                         type="date"
                         className="h-10 border-white rounded-lg text-xs font-semibold shadow-sm"
                         value={newLog.deadline}
                         onChange={(e) => setNewLog({...newLog, deadline: e.target.value})}
                       />
                     </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Priority</label>
                    <Select value={newLog.severity} onValueChange={(val: any) => setNewLog({...newLog, severity: val})}>
                      <SelectTrigger className="h-11 border-border rounded-lg text-sm font-semibold bg-slate-50/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border">
                        <SelectItem value="Low">Low Priority</SelectItem>
                        <SelectItem value="Medium">Medium Priority</SelectItem>
                        <SelectItem value="High">High Priority</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Initial Status</label>
                    <Select value={newLog.status} onValueChange={(val: any) => setNewLog({...newLog, status: val})}>
                      <SelectTrigger className="h-11 border-border rounded-lg text-sm font-semibold bg-slate-50/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border">
                        <SelectItem value="Pending">Pending (Unassigned)</SelectItem>
                        <SelectItem value="Assigned">Assigned</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-8">
                <Button 
                  onClick={handleAddLog}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-black rounded-xl shadow-xl shadow-primary/20 uppercase tracking-widest text-xs"
                >
                  Create & Route Ticket
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Queues (Tabs) */}
      <div className="flex overflow-x-auto custom-scrollbar pb-2 gap-2 border-b border-border/60">
         {["All Logs", "Assigned", "Active Work", "Closed Logs", "Escalations"].map((queue) => {
            const isActive = activeQueue === queue;
            const isEscalation = queue === "Escalations";
            return (
              <button
                key={queue}
                onClick={() => setActiveQueue(queue)}
                className={`whitespace-nowrap px-6 py-3 font-bold text-xs uppercase tracking-widest border-b-2 transition-all ${
                  isActive 
                    ? isEscalation ? 'border-rose-500 text-rose-600 bg-rose-50/50 rounded-t-lg' : 'border-primary text-slate-900 bg-slate-50/70 rounded-t-lg' 
                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50/30'
                }`}
              >
                {queue} 
                {queue === "Escalations" && <AlertCircle className="inline-block ml-2 w-3.5 h-3.5 mb-0.5" />}
              </button>
            )
         })}
      </div>

      {/* Glassmorphism Cards Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pt-2">
        {filteredLogs?.length === 0 ? (
          <div className="col-span-full py-32 text-center card-professional bg-white/30 border-dashed space-y-4">
             <AlertTriangle className="w-10 h-10 text-slate-200 mx-auto" />
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-8">No records in the {activeQueue} queue</p>
          </div>
        ) : (
          filteredLogs?.map(log => {
            const statusColorClass = getStatusColor(log.status, log.deadline);
            const overdue = isOverdue(log.deadline) && log.status !== "Completed";
            
            return (
              <div 
                key={log.id} 
                className={`relative backdrop-blur-md bg-white/70 border border-white/50 shadow-xl shadow-slate-200/20 p-6 rounded-2xl flex flex-col gap-5 overflow-hidden transition-all hover:bg-white/90 outline outline-1 outline-offset-[-1px] ${statusColorClass.split(' ').find(c => c.startsWith('outline-')) || 'outline-transparent'}`}
              >
                {/* Visual state indicator on left edge */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusColorClass.split(' ').find(c => c.startsWith('bg-')) || 'bg-slate-200'}`} />

                {/* Card Header: Unit & Badges */}
                <div className="flex justify-between items-start pl-2">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100/50 flex items-center justify-center border border-slate-200 shadow-sm backdrop-blur-sm">
                      {getIcon(log.log_type, log.status)}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Unit {log.rooms?.number}</h3>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 flex items-center gap-2">
                        {log.log_type || 'General'} Issue • <span className={`flex items-center gap-1 ${
                          log.severity === 'High' ? 'text-rose-500' : 
                          log.severity === 'Medium' ? 'text-amber-500' : 'text-emerald-500'
                        }`}>{log.severity} Priority</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={`uppercase text-[9px] font-black border-none px-3 py-1 ${statusColorClass.split(' ').slice(0, 2).join(' ')}`}>
                      {log.status === "Pending" && log.assigned_to ? "Assigned" : log.status}
                    </Badge>
                    {overdue && (
                      <Badge className="bg-rose-600 text-white border-rose-700 animate-pulse uppercase text-[8px] font-black px-2 py-0.5 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Escalated
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Description Body */}
                <div className="pl-2">
                  <p className="text-sm font-semibold text-slate-700 leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100/50 backdrop-blur-sm">
                    "{log.description}"
                  </p>
                </div>

                {/* Assignment & Action Footer */}
                <div className="pl-2 flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-2">
                  <div className="grid grid-cols-2 gap-4 flex-1">
                    {/* Assignment Block */}
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Assigned Staff</p>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <Input 
                          placeholder="Unassigned" 
                          className="h-9 pl-9 text-xs font-bold bg-white/50 border-slate-200"
                          defaultValue={log.assigned_to || ""}
                          onBlur={(e) => {
                            if (e.target.value !== log.assigned_to && e.target.value.trim() !== "") {
                              handleAssignmentUpdate(log.id, e.target.value);
                            }
                          }}
                        />
                      </div>
                    </div>
                    {/* Status Update Block */}
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Queue Routing</p>
                      <Select 
                        value={log.status} 
                        onValueChange={(val: any) => updateMaintenanceStatus.mutate({id: log.id, status: val})}
                      >
                        <SelectTrigger className="h-9 bg-white/50 border-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border shadow-2xl">
                          <SelectItem value="Pending" className="text-[10px] font-bold uppercase">Pending</SelectItem>
                          <SelectItem value="Assigned" className="text-[10px] font-bold uppercase">Assigned</SelectItem>
                          <SelectItem value="In Progress" className="text-[10px] font-bold uppercase">In Progress</SelectItem>
                          <SelectItem value="Completed" className="text-[10px] font-bold uppercase text-emerald-600">Close Ticket</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      {log.deadline ? `Due: ${format(new Date(log.deadline), 'MMM dd, yyyy')}` : 'No Deadline'}
                    </p>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all rounded-lg h-9 w-9 p-0"
                      onClick={() => confirm("Permanently delete this operational log?") && deleteMaintenanceLog.mutate(log.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
