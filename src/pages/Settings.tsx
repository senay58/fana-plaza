import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Shield, Lock, UserCircle, Gauge } from "lucide-react";
import { toast } from "sonner";
import { useSettings } from "@/hooks/useSettings";
import { useTenants } from "@/hooks/useTenants";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Settings() {
  const { settings, updateSettings } = useSettings();
  const [formData, setFormData] = useState({
    username: "",
    passcode: "",
    grace_period: 7,
    lease_expiry_days: 1, // We use this as the flag: 1 = Once, 2 = Twice, 0 = Disabled
    sms_provider_number: "",
    sms_provider_url: "",
    sms_provider_key: "",
    sms_template_5_days: "",
    sms_template_3_days: "",
    sms_template_deadline: ""
  });
  const { tenants } = useTenants();


  useEffect(() => {
    if (settings.data) {
      setFormData({
        username: settings.data.username,
        passcode: settings.data.passcode,
        grace_period: settings.data.grace_period,
        lease_expiry_days: settings.data.lease_expiry_days || 1,
        sms_provider_number: settings.data.sms_provider_number || "",
        sms_provider_url: settings.data.sms_provider_url || "",
        sms_provider_key: settings.data.sms_provider_key || "",
        sms_template_5_days: settings.data.sms_template_5_days || "Dear {name}, you have {days} days to make your payment. Please ensure timely settlement to avoid penalties.",
        sms_template_3_days: settings.data.sms_template_3_days || "Dear {name}, you have {days} days remaining to make your payment. Please secure your unit immediately.",
        sms_template_deadline: settings.data.sms_template_deadline || "Dear {name}, today is the deadline for your rent payment. Please make your payment today to avoid a late fee."
      });
    }
  }, [settings.data]);

  const handleSave = async (section: string) => {
    try {
      await updateSettings.mutateAsync(formData);
      toast.success(`${section} registry synchronized.`);
    } catch (e) {
      toast.error("Registry update failed.");
    }
  };

  if (settings.isLoading) return <div className="p-20 text-center text-slate-500 font-black uppercase tracking-[0.4em] animate-pulse">Syncing Console Logic...</div>;

  return (
    <div className="space-y-10">
      <div className="grid gap-8 md:grid-cols-2">
        {/* Manager Credentials */}
        <div className="card-professional bg-white">
          <div className="p-8 border-b border-border flex items-center gap-4">
            <div className="p-2.5 bg-slate-900 rounded-xl">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Access Control</h3>
              <p className="text-[10px] font-bold text-slate-500 mt-0.5 uppercase tracking-widest">System administrative privileges</p>
            </div>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-2.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Username</label>
              <div className="relative">
                <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-300" />
                <input 
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full pl-12 pr-4 bg-slate-50 border border-border h-11 rounded-lg font-bold text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
            <div className="space-y-2.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Secure Passcode</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-300" />
                <input 
                  type="password" 
                  value={formData.passcode}
                  onChange={(e) => setFormData(prev => ({ ...prev, passcode: e.target.value }))}
                  placeholder="********" 
                  className="w-full pl-12 pr-4 bg-slate-50 border border-border h-11 rounded-lg font-bold text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all tracking-widest"
                />
              </div>
            </div>
            <Button 
              className="w-full h-11 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-slate-900/10 transition-all active:scale-[0.98] mt-2" 
              onClick={() => handleSave("Credentials")}
              disabled={updateSettings.isPending}
            >
              Update Credentials
            </Button>
          </div>
        </div>

        {/* Building Policies */}
        <div className="card-professional bg-white">
          <div className="p-8 border-b border-border flex items-center gap-4">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Systemic Policies</h3>
              <p className="text-[10px] font-bold text-slate-500 mt-0.5 uppercase tracking-widest">Global building logic parameters</p>
            </div>
          </div>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Gratis Grace (Days)</label>
                <input 
                  value={formData.grace_period}
                  onChange={(e) => setFormData(prev => ({ ...prev, grace_period: Number(e.target.value) }))}
                  type="number" 
                  className="w-full px-4 bg-slate-50 border border-border h-11 rounded-lg font-black text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Lease Expiry Warning</label>
                <Select 
                  value={String(formData.lease_expiry_days)} 
                  onValueChange={(val) => setFormData(prev => ({ ...prev, lease_expiry_days: Number(val) }))}
                >
                  <SelectTrigger className="w-full bg-slate-50 border border-border h-11 rounded-lg font-black text-sm text-slate-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border">
                    <SelectItem value="1">Once (5 Days Out)</SelectItem>
                    <SelectItem value="2">Twice (5 & 3 Days Out)</SelectItem>
                    <SelectItem value="0">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button 
              className="w-full h-11 rounded-lg border border-slate-900 bg-white text-slate-900 hover:bg-slate-50 font-black uppercase tracking-widest text-[10px] transition-all active:scale-[0.98]" 
              variant="outline" 
              onClick={() => handleSave("Policy")}
              disabled={updateSettings.isPending}
            >
              Sync Global Logic
            </Button>
          </div>
        </div>
      </div>


    </div>
  );
}
