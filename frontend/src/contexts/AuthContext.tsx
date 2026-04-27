import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { User, AppRole } from '@/types';
import { authService } from '@/api/authService';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Poll interval: check session every 5 seconds for immediate lockout
const SESSION_POLL_MS = 5_000;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Core logout — clears state and token
  const clearSession = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    // Stop polling when session is cleared
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Load user from profile API
  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const userData = await authService.getProfile();
      const mapped: User = {
        id: userData._id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        department: userData.department,
      };
      setUser(mapped);
      return mapped;
    } catch {
      clearSession();
      return null;
    }
  }, [clearSession]);

  // Start periodic session polling (only when a user is logged in)
  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    pollIntervalRef.current = setInterval(async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        clearSession();
        return;
      }
      try {
        await authService.getProfile();
      } catch {
        // getProfile 401 → apiClient fires auth:session-expired → handled below
      }
    }, SESSION_POLL_MS);
  }, [clearSession]);

  // Initial auth check on mount
  useEffect(() => {
    const checkAuth = async () => {
      const u = await loadUser();
      if (u) startPolling();
      setIsLoading(false);
    };
    checkAuth();

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // Listen for the global session-expired event fired by apiClient on 401
  useEffect(() => {
    const handleSessionExpired = (e: Event) => {
      const code = (e as CustomEvent).detail?.code;
      clearSession();
      if (code === 'ACCOUNT_DEACTIVATED') {
        toast.error('Your account has been deactivated. Please contact your administrator.', {
          duration: 6000,
        });
      } else {
        toast.error('Session expired. Please log in again.');
      }
      // Redirect to login
      window.location.href = '/login';
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired);
  }, [clearSession]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const data = await authService.login(email, password);
      localStorage.setItem('token', data.token);
      const mapped: User = {
        id: data._id,
        name: data.name,
        email: data.email,
        role: data.role,
        department: data.department,
      };
      setUser(mapped);
      startPolling();
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const signup = async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const data = await authService.register({ email, password, name });
      localStorage.setItem('token', data.token);
      const mapped: User = {
        id: data._id,
        name: data.name,
        email: data.email,
        role: data.role,
        department: data.department,
      };
      setUser(mapped);
      startPolling();
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Signup failed'
      };
    }
  };

  const logout = async () => {
    clearSession();
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    console.warn('Password reset requested via API (not yet implemented on server)');
    return { success: true };
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
