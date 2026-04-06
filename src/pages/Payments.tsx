import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePayments, Payment } from "@/hooks/usePayments";
import { useSettings } from "@/hooks/useSettings";
import { useTenants } from "@/hooks/useTenants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  Wallet, Search, CheckCircle2, Clock, ArrowUpRight, HelpCircle, 
  BarChart3, Users, Receipt, AlertTriangle, Building, FileText, ArrowRight,
  PlusCircle, RefreshCw, Printer, Download, X as CloseIcon, Check, Trash2
} from "lucide-react";
import { toast } from "sonner";
import { format, isBefore, addDays, differenceInDays, startOfDay } from "date-fns";

export default function Payments() {
  const { payments, updatePaymentStatus, generateMonthlyPayments, deletePayment } = usePayments();
  const { tenants, renewLease } = useTenants();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [recentlyAuthorized, setRecentlyAuthorized] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);

  const handleGenerateInvoices = async () => {
    try {
      const result = await generateMonthlyPayments.mutateAsync();
      toast.success(result.message);
    } catch (e: any) {
      console.error(e);
      toast.error(`Error: ${e?.message || "Failed to generate invoices."}`);
    }
  };

  const handleStatusToggle = async (payment: Payment, newStatus: "paid" | "pending") => {
    try {
      await updatePaymentStatus.mutateAsync({ 
        id: payment.id, 
        status: newStatus,
        method: newStatus === 'paid' ? 'Bank Transfer' : undefined,
        staff: newStatus === 'paid' ? 'System' : undefined
      });
      
      if (newStatus === 'paid') {
        setRecentlyAuthorized(payment.id);
        toast.success(`Settlement Authorized.`, {
          description: "Would you like to extend the resident's lease now?",
          duration: 6000
        });
      } else {
        setRecentlyAuthorized(null);
        toast.success(`Invoice reverted to pending.`);
      }
    } catch (error: any) {
      console.error("Payment Update Error:", error);
      toast.error(`Database Error: ${error?.message || "Unknown error occurred"}`, {
        duration: 10000
      });
    }
  };

  const handleQuickRenew = async (tenantId: string, duration: 'days' | 'weeks' | 'months', unit: number) => {
    try {
      await renewLease.mutateAsync({ id: tenantId, duration, unit });
      toast.success(`Lease extended by ${unit} ${duration}.`);
      setRecentlyAuthorized(null);
    } catch (e) {
      toast.error("Renewal failed.");
    }
  };

  const { settings } = useSettings();
  const gracePeriod = settings.data?.grace_period || 0;

  const getPenaltyMultiplier = (dateStr: string) => {
    const daysPastDue = differenceInDays(new Date(), new Date(dateStr));
    if (daysPastDue <= gracePeriod) return 1;
    if (daysPastDue <= gracePeriod + 7) return 1.05;
    return 1.20;
  };

  const getPenaltyLabel = (dateStr: string) => {
    const mult = getPenaltyMultiplier(dateStr);
    if (mult === 1.05) return "5% Late Fee";
    if (mult === 1.20) return "20% Late Fee";
    return "";
  };

  // Financial Calculation Engine
  const totalRevenue = payments.data?.filter(p => p.status === "paid").reduce((acc, p) => acc + p.amount, 0) || 0;
  const pendingRevenue = payments.data?.filter(p => p.status === "pending").reduce((acc, p) => acc + (p.amount * getPenaltyMultiplier(p.due_date)), 0) || 0;
  const collectedPercent = payments.data?.length ? Math.round((payments.data.filter(p => p.status === "paid").length / payments.data.length) * 100) : 0;

  const filteredPayments = payments.data?.filter(p => 
    p.tenants?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isOverdue = (dateStr: string) => {
    const d = startOfDay(new Date(dateStr));
    return !isBefore(startOfDay(new Date()), d);
  };

  const today = startOfDay(new Date());
  
  // Unified Alert Engine: Combine Payments and Lease Expirations
  const paymentAlerts = (payments.data?.filter(p => p.status === "pending") || []).map(p => ({
    id: p.id,
    type: "payment",
    name: p.tenants?.name || "Unknown Tenant",
    date: p.due_date,
    amount: p.amount,
    overdue: !isBefore(today, startOfDay(new Date(p.due_date))),
    original: p
  }));

  const leaseAlerts = (tenants.data || []).filter(t => t.lease_end).map(t => {
    const end = startOfDay(new Date(t.lease_end!));
    const isPast = !isBefore(today, end);
    const isNear = isBefore(end, addDays(today, 7));
    
    if (isPast || isNear) {
      return {
        id: `lease-${t.id}`,
        type: "lease",
        name: t.name,
        date: t.lease_end!,
        amount: 0,
        overdue: isPast,
        original: t
      };
    }
    return null;
  }).filter(Boolean) as any[];

  const combinedAlerts = [...paymentAlerts, ...leaseAlerts];
  const overdueList = combinedAlerts.filter(a => a.overdue);
  const upcomingList = combinedAlerts.filter(a => !a.overdue && isBefore(new Date(a.date), addDays(today, 8)));

  if (payments.isLoading || tenants.isLoading) return <div className="p-20 text-center text-slate-500 font-black uppercase tracking-[0.4em] animate-pulse">Syncing Financial Ledger...</div>;

  const menuItems = [
    { id: "overview", label: "Financial Overview", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "invoices", label: "Monthly Invoices", icon: <Receipt className="w-4 h-4" /> },
    { id: "registry", label: "Tenant History", icon: <Users className="w-4 h-4" /> },
    { id: "alerts", label: "Overdue & Alerts", icon: <AlertTriangle className="w-4 h-4" /> }
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Structural Sidebar */}
      <div className="w-full lg:w-64 shrink-0 space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 px-1">Finances</h2>
          <p className="text-xs text-slate-500 px-1 mt-1">Plaza payment registry</p>
        </div>
        
        <div className="flex flex-col gap-1">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
                activeTab === item.id 
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {item.icon}
              {item.label}
              {item.id === 'alerts' && overdueList.length > 0 && (
                <span className="ml-auto bg-rose-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[8px]">{overdueList.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Mini stats block on sidebar */}
        <div className="p-5 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Efficiency</p>
           <div className="flex items-end gap-2">
             <h4 className="text-2xl font-black text-slate-900 leading-none">{collectedPercent}%</h4>
           </div>
           <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
             <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${collectedPercent}%` }} />
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="card-professional p-8 bg-white border-b-4 border-emerald-500">
                <div className="space-y-1">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Total Collected</p>
                   <h2 className="text-4xl font-black tracking-tighter text-slate-900 mt-1">ETB {totalRevenue.toLocaleString()}</h2>
                </div>
                <div className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 w-fit px-3 py-1.5 rounded-lg border border-emerald-100">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Optimal Collection</span>
                </div>
              </div>

              <div className="card-professional p-8 bg-white border-b-4 border-rose-500">
                <div className="space-y-1">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Outstanding Rent</p>
                   <h2 className="text-4xl font-black tracking-tighter text-slate-900 mt-1">ETB {pendingRevenue.toLocaleString()}</h2>
                </div>
                <div className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 w-fit px-3 py-1.5 rounded-lg border border-rose-100">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{paymentAlerts.length} Pending items</span>
                </div>
              </div>
            </div>

            {/* Quick Action */}
            <div className="bg-slate-900 text-white rounded-2xl p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
               <div className="space-y-2 max-w-md">
                 <h3 className="text-lg font-black uppercase tracking-widest text-emerald-400">Systemic Billing</h3>
                 <p className="text-xs text-slate-400 font-semibold leading-relaxed">Execute the auto-generation function to distribute monthly invoices across all active tenant profiles based on unit rent rates.</p>
               </div>
               <Button 
                onClick={handleGenerateInvoices} 
                disabled={generateMonthlyPayments.isPending}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-[0.15em] text-xs h-12 rounded-xl px-8 shadow-lg shadow-emerald-500/20"
              >
                {generateMonthlyPayments.isPending ? "Spooling..." : "Generate Monthlies"}
              </Button>
            </div>
          </div>
        )}

        {/* INVOICES TAB */}
        {activeTab === "invoices" && (
          <div className="card-professional bg-white overflow-hidden animate-in fade-in slide-in-from-bottom-2">
            <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl">
                  <Receipt className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Active Invoices</h3>
                  <p className="text-[10px] font-bold text-slate-500 mt-0.5 uppercase tracking-widest">Process tenant settlements</p>
                </div>
              </div>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  placeholder="Search tenant..." 
                  className="w-full pl-10 pr-4 bg-slate-50 border border-slate-200 h-10 rounded-lg font-bold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Tenant</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Maturity</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredPayments?.map((payment) => {
                    const overdue = payment.status === "pending" && isOverdue(payment.due_date);
                    return (
                      <tr key={payment.id} className="group hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4">
                           <span className="font-bold text-slate-900 text-xs">{payment.tenants?.name}</span>
                        </td>
                        <td className="px-6 py-4">
                           <div className="font-black text-slate-900 text-xs">ETB {(payment.amount * (overdue ? getPenaltyMultiplier(payment.due_date) : 1)).toLocaleString()}</div>
                           {overdue && getPenaltyMultiplier(payment.due_date) > 1 && (
                             <span className="text-[9px] font-bold text-rose-500 uppercase tracking-widest bg-rose-50 px-1 inline-block rounded">{getPenaltyLabel(payment.due_date)}</span>
                           )}
                        </td>
                        <td className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                          {format(new Date(payment.due_date), "MMM dd, yyyy")}
                        </td>
                        <td className="px-6 py-4">
                          {payment.status === "paid" ? (
                            <div className="flex flex-col gap-1">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-[9px] font-black uppercase tracking-tight w-fit">
                                <CheckCircle2 className="w-3 h-3" /> Settled
                              </div>
                              <button 
                                onClick={() => setSelectedReceipt(payment)}
                                className="text-[8px] font-bold text-indigo-500 hover:text-indigo-700 uppercase tracking-widest text-left ml-1 flex items-center gap-1"
                              >
                                <Printer className="w-2.5 h-2.5" /> View Receipt
                              </button>
                            </div>
                          ) : overdue ? (
                            <div className="flex flex-col gap-1">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-[9px] font-black uppercase tracking-tight w-fit">
                                <AlertTriangle className="w-3 h-3" /> Overdue
                              </div>
                              {format(new Date(payment.due_date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && (
                                <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest ml-1">Due Today</span>
                              )}
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[9px] font-black uppercase tracking-tight">
                              <Clock className="w-3 h-3" /> Pending
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-col items-end gap-2">
                            {recentlyAuthorized === payment.id ? (
                              <div className="flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-300">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mr-2 flex items-center gap-1">
                                  <RefreshCw className="w-2.5 h-2.5 animate-spin-slow" /> Quick Renew:
                                </span>
                                <Button 
                                  size="sm" 
                                  className="h-7 text-[8px] font-black uppercase bg-emerald-500 hover:bg-emerald-600 text-white px-2 rounded-md"
                                  onClick={() => handleQuickRenew(payment.tenant_id, 'days', 1)}
                                >+1D</Button>
                                <Button 
                                  size="sm" 
                                  className="h-7 text-[8px] font-black uppercase bg-indigo-500 hover:bg-indigo-600 text-white px-2 rounded-md"
                                  onClick={() => handleQuickRenew(payment.tenant_id, 'weeks', 1)}
                                >+1W</Button>
                                <Button 
                                  size="sm" 
                                  className="h-7 text-[8px] font-black uppercase bg-slate-900 hover:bg-slate-800 text-white px-2 rounded-md"
                                  onClick={() => handleQuickRenew(payment.tenant_id, 'months', 1)}
                                >+1M</Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 w-7 p-0 text-slate-400"
                                  onClick={() => setRecentlyAuthorized(null)}
                                >×</Button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className={`font-black uppercase text-[9px] tracking-widest px-4 h-8 rounded-lg border transition-all ${
                                    payment.status === "paid" 
                                      ? "text-slate-400 hover:text-slate-600 border-border bg-slate-50" 
                                      : "text-emerald-700 hover:bg-emerald-50 border-emerald-200 bg-white shadow-sm"
                                  }`}
                                  onClick={() => handleStatusToggle(payment, payment.status === "paid" ? "pending" : "paid")}
                                >
                                  {payment.status === "paid" ? "Audit Revert" : "Authorize"}
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-slate-300 hover:text-rose-600 transition-all rounded-lg"
                                  title="Nuclear Option: Delete Invoice"
                                  onClick={async () => {
                                     if (confirm(`Are you sure you want to permanently destroy this invoice for ${payment.tenants?.name}?`)) {
                                        try {
                                          await deletePayment.mutateAsync(payment.id);
                                          toast.success("Invoice destroyed.");
                                        } catch (e) {
                                          toast.error("Deletion failed.");
                                        }
                                     }
                                  }}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredPayments?.length === 0 && (
                <div className="py-24 text-center text-slate-300 font-black uppercase tracking-widest text-[10px]">No invoices found</div>
              )}
            </div>
          </div>
        )}

        {/* ALERTS TAB */}
        {activeTab === "alerts" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
             <div className="card-professional bg-white overflow-hidden border-rose-100 shadow-xl shadow-rose-500/5">
               <div className="p-6 bg-rose-50/50 border-b border-rose-100 flex items-center gap-4">
                 <div className="p-2 bg-rose-600 rounded-lg text-white">
                    <AlertTriangle className="w-5 h-5" />
                 </div>
                 <div>
                   <h3 className="text-sm font-black text-rose-900 uppercase tracking-tight">Overdue Escalations</h3>
                   <p className="text-[10px] font-bold text-rose-600/70 mt-0.5 uppercase tracking-widest">Requires immediate contact</p>
                 </div>
               </div>
               <div className="divide-y divide-rose-50">
                 {overdueList.length > 0 ? overdueList.map(alert => (
                   <div key={alert.id} className="p-6 flex items-center justify-between hover:bg-rose-50/30 transition-colors">
                     <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-white border border-rose-100 shadow-sm flex items-center justify-center">
                          {alert.type === 'payment' ? <Wallet className="w-4 h-4 text-rose-500" /> : <Building className="w-4 h-4 text-rose-500" />}
                       </div>
                       <div>
                         <div className="flex items-center gap-2">
                           <p className="text-sm font-bold text-slate-900">{alert.name}</p>
                           <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${alert.type === 'payment' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-rose-50 text-rose-700 border-rose-100'} uppercase tracking-widest`}>
                              {alert.type === 'payment' ? 'Rent Overdue' : 'Lease Expired'}
                           </span>
                         </div>
                         <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mt-1 flex items-center gap-1.5">
                            <Clock className="w-3 h-3"/> 
                            {alert.type === 'payment' ? 'Due' : 'Expiry'}: {format(new Date(alert.date), 'MMM dd, yyyy')}
                            {format(new Date(alert.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && (
                              <span className="ml-1 px-1.5 bg-amber-100 text-amber-700 rounded-sm font-black animate-pulse">! Today</span>
                            )}
                         </p>
                       </div>
                     </div>
                     <div className="text-right flex items-center gap-2">
                       {alert.type === 'payment' ? (
                         <>
                           <div className="text-right">
                             <p className="text-lg font-black text-rose-700">ETB {(alert.amount * getPenaltyMultiplier(alert.date)).toLocaleString()}</p>
                             <span className="text-[9px] inline-block mt-1 font-bold text-rose-500 uppercase tracking-widest bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded shadow-sm">
                               {getPenaltyLabel(alert.date) || "Approaching Penalty"}
                             </span>
                           </div>
                         </>
                       ) : (
                         <Button 
                           variant="outline" 
                           size="sm" 
                           onClick={() => navigate("/tenants")}
                           className="h-8 text-[9px] font-black uppercase tracking-widest border-rose-100 text-rose-600 hover:bg-rose-50"
                         >Review Profile</Button>
                       )}
                       <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-300 hover:text-rose-600 transition-all rounded-lg mt-1"
                          title="Destroy Record"
                          onClick={async () => {
                             if (confirm(`Nuclear Option: Permanently destroy this alert/invoice record?`)) {
                                try {
                                  if (alert.type === 'payment') {
                                    await deletePayment.mutateAsync(alert.original.id);
                                    toast.success("Alert destroyed.");
                                  } else {
                                    toast.error("Lease expirations cannot be deleted here, only settled via profile.");
                                  }
                                } catch (e) {
                                  toast.error("Action failed.");
                                }
                             }
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                     </div>
                   </div>
                 )) : (
                   <div className="p-12 text-center text-emerald-500 font-bold text-xs uppercase tracking-widest">No overdue items</div>
                 )}
               </div>
             </div>

             <div className="card-professional bg-white overflow-hidden border-amber-100 shadow-xl shadow-amber-500/5">
               <div className="p-6 bg-amber-50/50 border-b border-amber-100 flex items-center gap-4">
                 <div className="p-2 bg-amber-600 rounded-lg text-white">
                    <Clock className="w-5 h-5 transition-transform group-hover:scale-110" />
                 </div>
                 <div>
                   <h3 className="text-sm font-black text-amber-900 uppercase tracking-tight">Upcoming Maturities</h3>
                   <p className="text-[10px] font-bold text-amber-700/70 mt-0.5 uppercase tracking-widest">Due within 7 days</p>
                 </div>
               </div>
               <div className="divide-y divide-amber-50">
                 {upcomingList.length > 0 ? upcomingList.map(alert => (
                   <div key={alert.id} className="p-6 flex items-center justify-between hover:bg-amber-50/20 transition-colors">
                     <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-white border border-amber-100 shadow-sm flex items-center justify-center">
                          {alert.type === 'payment' ? <Wallet className="w-4 h-4 text-amber-600" /> : <Building className="w-4 h-4 text-amber-600" />}
                       </div>
                       <div>
                         <div className="flex items-center gap-2">
                           <p className="text-sm font-bold text-slate-900">{alert.name}</p>
                           <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${alert.type === 'payment' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-rose-50 text-rose-700 border-rose-100'} uppercase tracking-widest`}>
                              {alert.type === 'payment' ? 'Payment Due' : 'Contract Ending'}
                           </span>
                         </div>
                         <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mt-1">Deadline: {format(new Date(alert.date), 'MMM dd, yyyy')}</p>
                       </div>
                     </div>
                     <div className="text-right">
                        {alert.type === 'payment' ? (
                          <p className="text-sm font-black text-slate-900">ETB {alert.amount.toLocaleString()}</p>
                        ) : (
                          <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-1 rounded">Action Required</span>
                        )}
                     </div>
                   </div>
                 )) : (
                   <div className="p-12 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">No upcoming deadlines</div>
                 )}
               </div>
             </div>
          </div>
        )}

        {/* REGISTRY / HISTORY TAB */}
        {activeTab === "registry" && (
          <div className="card-professional bg-white animate-in fade-in slide-in-from-bottom-2">
            <div className="p-6 border-b border-border flex items-center gap-4">
              <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-xl">
                <FileText className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Comprehensive History</h3>
                <p className="text-[10px] font-bold text-slate-500 mt-0.5 uppercase tracking-widest">Full audit trail of all transactions</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
               {payments.data?.map(payment => (
                 <div key={payment.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 gap-4 group">
                   <div className="flex items-center gap-4">
                     <div className={`w-2 h-10 rounded-full ${payment.status === 'paid' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                     <div>
                       <div className="flex items-center gap-2">
                         <p className="text-sm font-bold text-slate-900">{payment.tenants?.name}</p>
                         {payment.status === 'paid' && (
                           <button 
                             onClick={() => setSelectedReceipt(payment)}
                             className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-indigo-600 transition-colors"
                           >
                             <Printer className="w-3.5 h-3.5" />
                           </button>
                         )}
                       </div>
                       <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">{format(new Date(payment.due_date), "MMM yyyy")} Billing Cycle</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-8 sm:text-right">
                     <div>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Audit Info</p>
                       <p className="text-xs font-bold text-slate-800 mt-0.5">{payment.payment_method || 'System Transfer'}</p>
                     </div>
                     <div className="w-24">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Amount</p>
                       <p className="text-xs font-black text-slate-900 mt-0.5 bg-white border px-2 py-1 rounded inline-block shadow-sm">ETB {payment.amount.toLocaleString()}</p>
                     </div>
                   </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* Receipt Modal Overlay */}
        {selectedReceipt && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedReceipt(null)} />
            <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
               {/* Digital Header */}
               <div className="p-8 bg-slate-900 text-white text-center space-y-2">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl mx-auto flex items-center justify-center border border-white/10 mb-4">
                     <Check className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-widest">Official Receipt</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Fana Plaza Executive Suite</p>
               </div>

               {/* Receipt Body */}
               <div className="p-8 space-y-6">
                 <div className="space-y-4">
                    <div className="flex justify-between border-b border-dashed border-slate-200 pb-3">
                       <span className="text-[10px] font-black text-slate-400 uppercase">Tenant</span>
                       <span className="text-xs font-bold text-slate-900">{selectedReceipt.tenants?.name}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-200 pb-3">
                       <span className="text-[10px] font-black text-slate-400 uppercase">Billing Period</span>
                       <span className="text-xs font-bold text-slate-900">{format(new Date(selectedReceipt.due_date), "MMMM yyyy")}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-200 pb-3">
                       <span className="text-[10px] font-black text-slate-400 uppercase">Settlement Date</span>
                       <span className="text-xs font-bold text-slate-900">{selectedReceipt.paid_at ? format(new Date(selectedReceipt.paid_at), "MMM dd, yyyy") : 'Authorized'}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-200 pb-3">
                       <span className="text-[10px] font-black text-slate-400 uppercase">Payment Method</span>
                       <span className="text-xs font-bold text-slate-900">{selectedReceipt.payment_method || 'Authorized Transfer'}</span>
                    </div>
                 </div>

                 <div className="bg-slate-50 rounded-2xl p-6 text-center border-2 border-dashed border-slate-200">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Amount Settled</p>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter">ETB {selectedReceipt.amount.toLocaleString()}</h2>
                 </div>

                 {/* Actions */}
                 <div className="grid grid-cols-2 gap-3 no-print">
                    <Button 
                      className="rounded-xl h-12 bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest"
                      onClick={() => window.print()}
                    >
                       <Printer className="w-3.5 h-3.5 mr-2" /> Print
                    </Button>
                    <Button 
                      variant="outline"
                      className="rounded-xl h-12 border-slate-200 font-bold text-[10px] uppercase tracking-widest"
                      onClick={() => setSelectedReceipt(null)}
                    >
                       Close
                    </Button>
                 </div>

                 <p className="text-center text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] pt-4">
                    Thank you for your timely settlement.
                 </p>
               </div>

               {/* Print Only Styles */}
               <style dangerouslySetInnerHTML={{ __html: `
                 @media print {
                   body * { visibility: hidden; }
                   .no-print { display: none !important; }
                   .fixed.inset-0 { position: absolute; top: 0; left: 0; visibility: visible; }
                   .fixed.inset-0 * { visibility: visible; }
                   .absolute.inset-0 { display: none; }
                 }
               `}} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
