import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { 
  BarChart3, 
  Building2, 
  Users, 
  Wrench, 
  Bell, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  LayoutGrid, 
  X,
  LogOut,
  Building,
  Wallet
} from "lucide-react";

export function Sidebar({ onMobileClose }: { onMobileClose?: () => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { to: "/", label: "Dashboard", icon: BarChart3 },
    { to: "/units", label: "Properties", icon: Building2 },
    { to: "/tenants", label: "Tenants", icon: Users },
    { to: "/payments", label: "Payments", icon: Wallet },
    { to: "/maintenance", label: "Maintenance", icon: Wrench },
  ];

  const bottomItems = [
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside
      className={`${collapsed ? "w-20" : "w-64"} h-screen transition-all duration-300 bg-white border-r border-border text-slate-900 flex flex-col z-50 shadow-sm relative`}
    >
      {/* Branding */}
      <div className="p-6 mb-4">
        <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
          <button onClick={() => setCollapsed(!collapsed)} className="w-10 h-10 rounded-lg bg-black flex items-center justify-center shrink-0 shadow-sm hover:bg-slate-800 transition-colors">
            <span className="text-white font-black text-lg">FP</span>
          </button>
          {!collapsed && (
            <NavLink to="/" className="flex flex-col min-w-0">
              <h1 className="text-sm font-black text-black tracking-tight truncate">Fana Plaza</h1>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider truncate">Executive Suite</p>
            </NavLink>
          )}
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 px-3 space-y-1">
        {!collapsed && (
          <p className="px-4 mb-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Main Navigation</p>
        )}
        <nav className="space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onMobileClose}
              className={({ isActive }) =>
                `flex items-center ${collapsed ? "justify-center" : "gap-3"} px-4 py-3 rounded-xl transition-all group relative font-bold text-sm ${
                  isActive 
                    ? "bg-slate-900 text-white shadow-md shadow-slate-200" 
                    : "text-slate-500 hover:text-black hover:bg-slate-50"
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{label}</span>}
              {collapsed && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-all whitespace-nowrap z-[100]">
                  {label}
                </div>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="px-3 py-6 mt-auto border-t border-border space-y-1">
        {bottomItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center ${collapsed ? "justify-center" : "gap-3"} px-4 py-3 rounded-xl transition-all group font-bold text-sm ${
                isActive 
                  ? "bg-slate-900 text-white shadow-md" 
                  : "text-slate-500 hover:text-black hover:bg-slate-50"
              }`
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
        
        <button 
          onClick={handleLogout}
          className={`w-full flex items-center ${collapsed ? "justify-center" : "gap-3"} px-4 py-3 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all font-bold text-sm`}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Log out</span>}
        </button>
      </div>
    </aside>
  );
}
