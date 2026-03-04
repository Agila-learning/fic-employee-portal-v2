import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AppRole } from '@/types';
import { authService } from '@/api/authService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await authService.getProfile();
          setUser({
            id: userData._id,
            name: userData.name,
            email: userData.email,
            role: userData.role,
          });
        } catch (error) {
          console.error('Auth verification failed:', error);
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const data = await authService.login(email, password);
      localStorage.setItem('token', data.token);
      setUser({
        id: data._id,
        name: data.name,
        email: data.email,
        role: data.role,
      });
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
      setUser({
        id: data._id,
        name: data.name,
        email: data.email,
        role: data.role,
      });
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Signup failed'
      };
    }
  };

  const logout = async () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    // Note: Implementing true password reset requires email service setup in the backend.
    // This is currently a placeholder to maintain interface compatibility.
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
