import { useBuilding } from "@/hooks/useBuilding";
import { useTenants } from "@/hooks/useTenants";
import { useAutoNotifications } from "@/hooks/useAutoNotifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Users, 
  BarChart3, 
  Activity, 
  Wrench, 
  Clock, 
  FileWarning, 
  CheckCircle2, 
  AlertOctagon,
  ArrowRight
} from "lucide-react";
import { format, isBefore, addDays } from "date-fns";
import { useMaintenance } from "@/hooks/useMaintenance";
import { Link } from "react-router-dom";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function Dashboard() {
  useAutoNotifications();
  const { floors, rooms } = useBuilding();
  const { tenants } = useTenants();
  const { maintenanceLogs } = useMaintenance();
  const [isUnitMapExpanded, setIsUnitMapExpanded] = useState(false);

  const totalUnits = rooms.data?.length || 0;

  // Activity & Expirations
  const activeTenants = tenants.data?.filter(t => t.status !== 'archived') || [];
  const recentTenants = activeTenants.slice(0, 5);
  const upcomingExpirations = activeTenants.filter(t => t.lease_end && isBefore(new Date(t.lease_end), addDays(new Date(), 30)));
  const activeMaintenance = maintenanceLogs.data?.filter(l => l.status !== "Completed") || [];
  const airbnbCount = activeTenants.filter(t => t.source === 'airbnb').length;

  const getUnitNumber = (tenantId: string) => {
    const tenant = tenants.data?.find(t => t.id === tenantId);
    if (!tenant?.room_id) return "N/A";
    const room = rooms.data?.find(r => r.id === tenant.room_id);
    return room ? room.number : "N/A";
  };

  if (floors.isLoading || rooms.isLoading) return <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-[0.2em] animate-pulse">Synchronizing Data...</div>;

  return (
    <div className="space-y-10">
      {/* Top Level Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card-professional p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Units</p>
            <h2 className="text-2xl font-bold text-slate-900">{totalUnits}</h2>
            <p className="text-[10px] font-bold text-emerald-600 uppercase">+{rooms.data?.filter(r => r.status === 'vacant').length} Available</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-primary border border-blue-100">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="card-professional p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Occupancy Rate</p>
            <h2 className="text-2xl font-bold text-slate-900">{totalUnits > 0 ? Math.round((rooms.data?.filter(r => r.status === 'occupied').length || 0) / totalUnits * 100) : 0}%</h2>
            <p className="text-[10px] font-bold text-indigo-600 uppercase">Incl. {airbnbCount} Airbnb Guests</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="card-professional p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Open Requests</p>
            <h2 className="text-2xl font-bold text-slate-900">{activeMaintenance.length}</h2>
            <p className="text-[10px] font-bold text-rose-500 uppercase">{activeMaintenance.filter(l => l.severity === 'High').length} Urgent</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
            <Wrench className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Insights */}
        <div className="lg:col-span-8 space-y-8">
          {/* Unit Management Map Widget */}
          <div className="bg-slate-900 rounded-xl text-white shadow-lg overflow-hidden transition-all">
            <div 
              className="flex items-center justify-between gap-4 p-6 cursor-pointer hover:bg-slate-800 transition-colors"
              onClick={() => setIsUnitMapExpanded(!isUnitMapExpanded)}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider">Unit Management</h3>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Access the full property registry map</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="outline" className="bg-transparent border-white/20 text-white hover:bg-white/10 font-bold uppercase text-[10px] tracking-widest h-10 rounded-lg" asChild onClick={(e) => e.stopPropagation()}>
                  <Link to="/units">Go to Registry <ArrowRight className="ml-2 w-3 h-3" /></Link>
                </Button>
                {isUnitMapExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </div>
            </div>
            {isUnitMapExpanded && (
              <div className="p-6 bg-slate-800/50 border-t border-white/10">
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-green-500 rounded-sm shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div><span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Occupied (Green)</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-red-500 rounded-sm shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div><span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Vacant (Red)</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-yellow-400 rounded-sm shadow-[0_0_8px_rgba(250,204,21,0.5)]"></div><span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Maintenance</span></div>
                </div>
                <div className="space-y-6">
                  {floors.data?.map(floor => {
                    const floorRooms = rooms.data?.filter(r => !r.is_manager_office && r.floor_id === floor.id).sort((a,b) => a.number.localeCompare(b.number));
                    if (!floorRooms || floorRooms.length === 0) return null;
                    return (
                      <div key={floor.id} className="space-y-3">
                        <h4 className="text-[10px] font-bold text-slate-500 border-b border-white/10 pb-1.5 uppercase tracking-widest">{floor.name}</h4>
                        <div className="flex flex-wrap gap-3">
                          {floorRooms.map(room => {
                            let bgColor = 'bg-slate-600';
                            if (room.status === 'vacant') bgColor = 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)] border-red-400';
                            if (room.status === 'occupied') bgColor = 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)] border-green-400';
                            if (room.status === 'maintenance') bgColor = 'bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.3)] border-yellow-300';
        
                            return (
                              <div 
                                key={room.id} 
                                title={`Unit ${room.number} (${room.status})`}
                                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${bgColor} border relative group cursor-help transition-transform hover:scale-110 shrink-0`}
                              >
                                 <span className="text-[10px] sm:text-xs font-black text-white/90 drop-shadow-md group-hover:opacity-0 transition-opacity">{room.number}</span>
                                 <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-black backdrop-blur bg-black/40 rounded-xl">{room.status.charAt(0).toUpperCase()}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <section className="card-professional">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Recent Activity</h3>
              <Activity className="w-4 h-4 text-slate-400" />
            </div>
            <div className="p-6 space-y-6">
              {recentTenants.map((tenant, idx) => (
                <div key={tenant.id} className="flex gap-4 group">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${idx % 2 === 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                    {idx % 2 === 0 ? <CheckCircle2 className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{tenant.name} — Registered Unit {getUnitNumber(tenant.id)}</p>
                    <p className="text-[10px] font-medium text-slate-500 uppercase">Applied {format(new Date(), 'h')}h ago</p>
                  </div>
                </div>
              ))}
            </div>
          </section>


        </div>

        {/* Sidebar Insights */}
        <div className="lg:col-span-4 space-y-8">
          {/* Upcoming Expirations */}
          <section className="card-professional">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Upcoming Expirations</h3>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>
            <div className="p-6 space-y-6">
              {upcomingExpirations.length > 0 ? upcomingExpirations.map(tenant => (
                <div key={tenant.id} className="flex items-center justify-between">
                  <div className="min-w-0 pr-4">
                    <p className="text-sm font-bold text-slate-800 truncate">{tenant.name}</p>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase">Unit {getUnitNumber(tenant.id)}</p>
                  </div>
                  <Badge variant="destructive" className="text-[9px] font-bold uppercase rounded-md px-2 py-0.5">
                    {format(new Date(tenant.lease_end!), 'MMM dd')}
                  </Badge>
                </div>
              )) : (
                <p className="text-xs font-medium text-slate-400 italic text-center py-4">No proximate expirations</p>
              )}
            </div>
          </section>

          {/* Maintenance Module Quick Link */}
          <section className="bg-slate-900 rounded-xl p-8 text-white space-y-6 shadow-xl">
             <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center border border-white/10"><Wrench className="w-6 h-6" /></div>
             <div className="space-y-2">
               <h4 className="text-lg font-bold tracking-tight">Maintenance Suite</h4>
               <p className="text-xs font-medium text-slate-400 leading-relaxed uppercase tracking-wider">There are {activeMaintenance.length} pending service tickets requiring attention.</p>
             </div>
             <Button variant="outline" className="w-full bg-transparent border-white/20 text-white hover:bg-white/10 font-bold uppercase text-[10px] tracking-widest h-11" asChild>
               <Link to="/maintenance">Open Registry</Link>
             </Button>
          </section>

          {/* System Health */}
          <div className="card-professional p-6 flex items-center gap-4">
             <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                <CheckCircle2 className="w-5 h-5" />
             </div>
             <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">System Status</p>
                <div className="flex items-center gap-2">
                   <p className="text-xs font-bold text-slate-800 uppercase">Operational</p>
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
