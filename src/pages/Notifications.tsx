import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useNotifications } from "@/hooks/useNotifications";
import { useTenants } from "@/hooks/useTenants";
import { Info, AlertTriangle, CheckCircle2, XCircle, Trash2, Check, LayoutGrid } from "lucide-react";
import { toast } from "sonner";

export default function Notifications() {
  const { notifications, markAsRead, deleteNotification } = useNotifications();
  const { tenants } = useTenants();

  const getIcon = (type: string) => {
    switch (type) {
      case "success": return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case "warning": return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case "error": return <XCircle className="w-5 h-5 text-rose-400" />;
      default: return <Info className="w-5 h-5 text-primary" />;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification.mutateAsync(id);
      toast.success("Notification deleted.");
    } catch (error) {
      toast.error("Failed to delete notification.");
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markAsRead.mutateAsync(id);
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  if (notifications.isLoading) return <div className="p-20 text-center text-slate-500 font-black uppercase tracking-[0.4em] animate-pulse">Filtering System Intelligence...</div>;

  const unreadCount = notifications.data?.filter(n => !n.is_read).length || 0;

  return (
    <div className="min-h-screen space-y-10 pb-20">
      <Header 
        title="Intelligence Center" 
        subtitle="Stay updated on leases, payments, and system events" 
        unreadNotifications={unreadCount}
      />

      <div className="max-w-4xl mx-auto space-y-5">
        {notifications.data?.map((notification) => (
          <Card 
            key={notification.id} 
            className={`border-none shadow-2xl transition-all duration-500 group overflow-hidden rounded-[2rem] ${
              !notification.is_read 
                ? "bg-card shadow-primary/10 border-t border-white/10 ring-1 ring-primary/20" 
                : "bg-card/40 opacity-70 border-t border-white/5"
            }`}
          >
            <CardContent className="p-8 flex items-start gap-6">
              <div className={`p-3.5 rounded-2xl ${!notification.is_read ? "bg-primary/10 shadow-inner border border-primary/20" : "bg-white/5 border border-white/5"}`}>
                {getIcon(notification.type)}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className={`text-base font-black tracking-tight uppercase ${!notification.is_read ? "text-white" : "text-slate-400"}`}>
                    {notification.title}
                  </h4>
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
                    {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-500 leading-relaxed max-w-2xl">
                  {notification.message}
                </p>
                <div className="flex items-center gap-4 pt-4">
                  {!notification.is_read && (
                    <button 
                      onClick={() => handleMarkRead(notification.id)}
                      className="text-[10px] font-black text-primary hover:text-white uppercase tracking-widest flex items-center gap-2 bg-primary/10 hover:bg-primary px-4 py-2 rounded-xl transition-all border border-primary/20"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Acknowledge
                    </button>
                  )}
                  {notification.title.includes("Lease Expiration") && (() => {
                     const tenantName = notification.title.split(": ")[1];
                     const tenant = tenants.data?.find(t => t.name === tenantName);
                     if (tenant?.contact_number) {
                       return (
                         <button 
                           onClick={() => window.location.href = `sms:${tenant.contact_number}?body=Hello ${encodeURIComponent(tenant.name)}, your lease is scheduled to expire in the coming days. Please visit the management office to complete renewal protocol.`}
                           className="text-[10px] font-black text-indigo-400 hover:text-indigo-900 uppercase tracking-widest flex items-center gap-2 bg-indigo-500/10 hover:bg-indigo-100 px-4 py-2 rounded-xl transition-all border border-transparent hover:border-indigo-500/20"
                         >
                           Execute SMS
                         </button>
                       );
                     }
                     return null;
                  })()}
                  <button 
                    onClick={() => handleDelete(notification.id)}
                    className="text-[10px] font-black text-slate-500 hover:text-rose-400 uppercase tracking-widest flex items-center gap-2 hover:bg-rose-500/10 px-4 py-2 rounded-xl transition-all border border-transparent hover:border-rose-500/20"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Purge
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {notifications.data?.length === 0 && (
          <div className="py-40 text-center space-y-6 bg-card/20 rounded-[3rem] border border-dashed border-white/10">
            <LayoutGrid className="w-20 h-20 mx-auto text-slate-800 opacity-20" />
            <p className="text-slate-600 font-black uppercase tracking-[0.3em] text-[10px]">Registry is operational and clear.</p>
          </div>
        )}
      </div>
    </div>
  );
}
