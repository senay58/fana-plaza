import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MainLayout } from "./components/layout/MainLayout";
import { useAuth } from "./hooks/useAuth";
import Dashboard from "./pages/Dashboard";
import Tenants from "./pages/Tenants";
import Units from "./pages/Units";
import Payments from "./pages/Payments";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import BuildingConfiguration from "./pages/BuildingConfiguration";
import Maintenance from "./pages/Maintenance";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

import { AuthProvider, useAuthContext } from "./context/AuthContext";

const queryClient = new QueryClient();

function AppContent() {
  const { isAuthenticated, isLoading } = useAuthContext();

  if (isLoading) {
    return <div className="min-h-screen bg-[#0F172A] flex items-center justify-center text-slate-500 font-black uppercase tracking-[0.4em] animate-pulse">Syncing Executive Registry...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />} />
        
        {/* Protected Management Stack */}
        <Route element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" replace />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tenants" element={<Tenants />} />
          <Route path="/units" element={<Units />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/configuration" element={<BuildingConfiguration />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster position="top-right" richColors />
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
