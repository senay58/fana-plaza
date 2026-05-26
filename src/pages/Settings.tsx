import { Button } from "@/components/ui/button";
import { Shield, Lock, UserCircle, Gauge, Eye, EyeOff, KeyRound } from "lucide-react";
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
    lease_expiry_days: 1,
    sms_provider_number: "",
    sms_provider_url: "",
    sms_provider_key: "",
    sms_template_5_days: "",
    sms_template_3_days: "",
    sms_template_deadline: ""
  });
  const { tenants } = useTenants();

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
        sms_template_5_days: settings.data.sms_template_5_days || "",
        sms_template_3_days: settings.data.sms_template_3_days || "",
        sms_template_deadline: settings.data.sms_template_deadline || ""
      });
    }
  }, [settings.data]);

  const handleSaveUsername = async () => {
    try {
      await updateSettings.mutateAsync({ username: formData.username });
      toast.success("Username updated successfully.");
    } catch (e) {
      toast.error("Failed to update username.");
    }
  };

  const handleChangePassword = async () => {
    // Validate current password
    const storedPasscode = settings.data?.passcode || "1234";
    if (currentPassword !== storedPasscode) {
      toast.error("Current password is incorrect.");
      return;
    }

    if (!newPassword) {
      toast.error("New password cannot be empty.");
      return;
    }

    if (newPassword.length < 4) {
      toast.error("New password must be at least 4 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    if (newPassword === currentPassword) {
      toast.error("New password must be different from current password.");
      return;
    }

    try {
      await updateSettings.mutateAsync({ passcode: newPassword });
      toast.success("Password updated successfully. Use your new password next time you log in.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      toast.error("Failed to update password.");
    }
  };

  const handleSavePolicy = async () => {
    try {
      await updateSettings.mutateAsync({
        grace_period: formData.grace_period,
        lease_expiry_days: formData.lease_expiry_days,
      });
      toast.success("Policy settings synchronized.");
    } catch (e) {
      toast.error("Policy update failed.");
    }
  };

  if (settings.isLoading) return <div className="p-20 text-center text-slate-500 font-black uppercase tracking-[0.4em] animate-pulse">Syncing Console Logic...</div>;

  return (
    <div className="space-y-10">
      <div className="grid gap-8 md:grid-cols-2">
        {/* Manager Username */}
        <div className="card-professional bg-white">
          <div className="p-8 border-b border-border flex items-center gap-4">
            <div className="p-2.5 bg-slate-900 rounded-xl">
              <UserCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Account Identity</h3>
              <p className="text-[10px] font-bold text-slate-500 mt-0.5 uppercase tracking-widest">Manager display name</p>
            </div>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-2.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Username</label>
              <div className="relative">
                <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input 
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full pl-12 pr-4 bg-slate-50 border border-border h-11 rounded-lg font-bold text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
            <Button 
              className="w-full h-11 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-slate-900/10 transition-all active:scale-[0.98] mt-2" 
              onClick={handleSaveUsername}
              disabled={updateSettings.isPending}
            >
              Update Username
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
              onClick={handleSavePolicy}
              disabled={updateSettings.isPending}
            >
              Sync Global Logic
            </Button>
          </div>
        </div>
      </div>

      {/* Password Change - Full Width */}
      <div className="card-professional bg-white">
        <div className="p-8 border-b border-border flex items-center gap-4">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Change Password</h3>
            <p className="text-[10px] font-bold text-slate-500 mt-0.5 uppercase tracking-widest">Update your login passcode</p>
          </div>
        </div>
        <div className="p-8">
          <div className="max-w-lg space-y-6">
            {/* Current Password */}
            <div className="space-y-2.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Current Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input 
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full pl-12 pr-12 bg-slate-50 border border-border h-11 rounded-lg font-bold text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input 
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full pl-12 pr-12 bg-slate-50 border border-border h-11 rounded-lg font-bold text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-2.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input 
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full pl-12 pr-12 bg-slate-50 border border-border h-11 rounded-lg font-bold text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-[10px] font-bold text-rose-500 ml-1">Passwords do not match</p>
              )}
              {confirmPassword && newPassword === confirmPassword && newPassword.length > 0 && (
                <p className="text-[10px] font-bold text-emerald-500 ml-1">Passwords match ✓</p>
              )}
            </div>

            <Button 
              className="w-full h-11 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-600/10 transition-all active:scale-[0.98] mt-2" 
              onClick={handleChangePassword}
              disabled={updateSettings.isPending || !currentPassword || !newPassword || !confirmPassword}
            >
              Update Password
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
