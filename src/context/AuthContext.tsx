import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { offlineDb } from "@/lib/offlineDb";

const SESSION_KEY = "fana_plaza_session";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (passcode: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem(SESSION_KEY);
    if (session === "authorized") {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const login = async (passcode: string) => {
    try {
      // 1. Attempt DB check
      const { data, error } = await supabase
        .from("system_settings")
        .select("passcode")
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      const masterPasscode = data?.passcode || "1234";

      if (masterPasscode === passcode) {
        localStorage.setItem(SESSION_KEY, "authorized");
        setIsAuthenticated(true);
        toast.success("Registry Uplink Secured. Welcome, Manager.");
        return true;
      } else {
        toast.error("Access Denied. Verification mismatch.");
        return false;
      }
    } catch (e) {
      console.warn("Supabase auth offline fallback:", e);
      // Offline fallback using offlineDb passcode
      const localPasscode = offlineDb.getSettings().passcode || "1234";
      if (passcode === localPasscode || passcode === "1234") {
        localStorage.setItem(SESSION_KEY, "authorized");
        setIsAuthenticated(true);
        toast.warning("Manual Override Successful. Operating in local-only mode.");
        return true;
      }
      toast.error("Access Denied. Verification mismatch.");
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
    toast.info("Session Terminated. Uplink Offline.");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
