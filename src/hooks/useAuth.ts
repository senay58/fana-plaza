import { useAuthContext } from "@/context/AuthContext";

/**
 * useAuth hook (Global Consumer)
 * 
 * This hook now consumes the global AuthContext instead of 
 * maintaining local state, ensuring session synchronization 
 * across all components and navigation guards.
 */
export function useAuth() {
  const context = useAuthContext();
  return {
    isAuthenticated: context.isAuthenticated,
    isLoading: context.isLoading,
    login: context.login,
    logout: context.logout
  };
}
