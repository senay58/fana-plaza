import { Header } from "@/components/layout/Header";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center space-y-10">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full animate-pulse" />
        <div className="relative w-32 h-32 bg-card/40 backdrop-blur-xl rounded-[2.5rem] border border-white/10 flex items-center justify-center shadow-2xl">
          <Lock className="w-12 h-12 text-slate-700" />
        </div>
      </div>
      
      <div className="space-y-4 max-w-sm px-6">
        <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Registry Link Broken</h2>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] leading-relaxed">
          The structural path you requested has been moved or purged from the central database.
        </p>
      </div>

      <Button asChild className="bg-primary hover:bg-blue-600 px-10 h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-primary/20 transition-all active:scale-95">
        <Link to="/">Re-Establish Uplink</Link>
      </Button>
    </div>
  );
}
