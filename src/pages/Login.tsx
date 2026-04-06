import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Shield, Lock, ArrowRight, Loader2, Sparkles } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [passcode, setPasscode] = useState("");
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
    <div className="min-h-screen flex items-center justify-center bg-[#020617] selection:bg-primary/30 p-6 overflow-hidden relative font-sans">
      {/* Cinematic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-blue-600/10 blur-[140px] rounded-full animate-pulse opacity-60" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[140px] rounded-full animate-pulse-slow opacity-60" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,transparent_70%)]" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        {/* Top Branding Section */}
        <div className="text-center mb-10 space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2.5rem] bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 shadow-2xl relative group overflow-hidden">
            <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Shield className="w-9 h-9 text-blue-400 relative z-10 drop-shadow-[0_0_15px_rgba(96,165,250,0.5)]" />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase sm:text-5xl">Fana Plaza</h1>
            <div className="flex items-center justify-center gap-2">
              <span className="h-px w-8 bg-slate-800" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] text-center">Executive Management Console</p>
              <span className="h-px w-8 bg-slate-800" />
            </div>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] relative overflow-hidden group hover:border-white/10 transition-all duration-500">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
          
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Lock className="w-3 h-3" /> Secure Passcode
                </label>
                <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              </div>
              
              <div className="relative group/input">
                <input 
                  type="password" 
                  autoFocus
                  placeholder="••••"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full bg-slate-900/40 border border-white/5 h-16 rounded-2xl font-black text-2xl text-white text-center tracking-[0.6em] placeholder:text-slate-800 placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all focus:bg-slate-900/60 focus:border-blue-500/40"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isAuthenticating || !passcode}
              className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl shadow-xl shadow-blue-600/10 transition-all active:scale-[0.98] relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              {isAuthenticating ? (
                <div className="flex items-center gap-3 relative z-10">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Syncing Registry...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 relative z-10">
                  <span className="drop-shadow-sm">Establish Uplink</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1.5" />
                </div>
              )}
            </Button>
          </form>
        </div>

        {/* Footer Metrics */}
        <div className="mt-12 text-center space-y-6">
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] flex items-center justify-center gap-4">
             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
             Uplink Active • Authorized Access Only
          </p>
          <div className="text-[10px] font-black text-slate-800 uppercase tracking-[0.6em] opacity-40">
            v3.4 Midnight Suite 
          </div>
        </div>
      </div>
    </div>
  );
}
