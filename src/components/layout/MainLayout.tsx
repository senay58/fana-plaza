import { Link, Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { UserNav } from "./UserNav";
import { Bell, Menu, Search, LayoutGrid } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useAutoNotifications } from "@/hooks/useAutoNotifications";

export function MainLayout() {
  useAutoNotifications(); // 🔔 Auto-generates lease expiration warning notifications
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case "/": return "Executive Dashboard";
      case "/units": return "Property Registry";
      case "/tenants": return "Tenant Management";
      case "/payments": return "Payments Ledger";
      case "/maintenance": return "Maintenance Ledger";
      case "/settings": return "Console Control";
      case "/notifications": return "System Notifications";
      default: return "Fana Plaza Manager";
    }
  };

  return (
    <div className="flex min-h-screen bg-background selection:bg-primary/30 overflow-hidden font-sans">
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[45] lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className={`fixed inset-y-0 left-0 z-50 lg:relative lg:block transition-transform duration-300 transform ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <Sidebar onMobileClose={() => setIsMobileMenuOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Professional Header */}
        <header className="h-16 flex items-center justify-between px-6 md:px-10 bg-white border-b border-border sticky top-0 z-40">
          <div className="flex items-center gap-6 flex-1">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-lg border border-border transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden md:flex items-center gap-3 text-slate-900">
               <LayoutGrid className="w-4 h-4 text-slate-400" />
               <h1 className="text-sm font-black tracking-tight uppercase tracking-[0.1em]">{getPageTitle(location.pathname)}</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden lg:block w-64 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Search..." 
                className="h-9 pl-9 bg-slate-50 border-none rounded-lg text-xs focus-visible:ring-1 focus-visible:ring-primary/20"
              />
            </div>

            <Link to="/notifications" className="relative p-2 text-slate-500 hover:text-primary hover:bg-primary/5 rounded-lg transition-all group">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full border-2 border-white" />
            </Link>
            
            <div className="h-6 w-px bg-border mx-2" />
            
            <UserNav />
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar bg-slate-50/50">
          <div className="max-w-7xl mx-auto pb-12">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
