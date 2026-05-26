import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Building2, Lock, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [passcode, setPasscode] = useState("");
  const [showPasscode, setShowPasscode] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    const success = await login(passcode);
    setIsAuthenticating(false);
    if (success) {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 selection:bg-primary/30 p-6 overflow-hidden relative font-sans">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[30%] -right-[20%] w-[70%] h-[70%] bg-primary/[0.04] blur-[100px] rounded-full" />
        <div className="absolute -bottom-[30%] -left-[20%] w-[70%] h-[70%] bg-indigo-400/[0.04] blur-[100px] rounded-full" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Branding */}
        <div className="text-center mb-10 space-y-5">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 shadow-xl shadow-slate-900/20">
            <span className="text-white font-black text-xl">FP</span>
          </div>
          <div className="space-y-1.5">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Fana Plaza</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">Management Console</p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl border border-border shadow-xl shadow-slate-200/50 p-8">
          <div className="mb-6">
            <h2 className="text-sm font-bold text-slate-900">Welcome back</h2>
            <p className="text-xs text-slate-500 mt-1">Enter your passcode to access the dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-0.5">
                Passcode
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type={showPasscode ? "text" : "password"}
                  autoFocus
                  placeholder="Enter your passcode"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full bg-slate-50 border border-border h-12 rounded-xl pl-10 pr-12 font-semibold text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                >
                  {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isAuthenticating || !passcode}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
            >
              {isAuthenticating ? (
                <div className="flex items-center gap-2.5">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
             System Online • Authorized Access Only
          </p>
        </div>
      </div>
    </div>
  );
}
