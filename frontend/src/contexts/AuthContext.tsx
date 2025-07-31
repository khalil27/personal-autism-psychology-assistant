import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType, RegisterData } from '../types';
import { authAPI } from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth token on app load
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
      }
    }
    setLoading(false);
  }, []);

const login = async (email: string, password: string): Promise<void> => {
  try {
    const res = await authAPI.login(email, password);
    const userData = res.user;
    const token = res.token;

    setUser(userData);
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_data', JSON.stringify(userData));
  } catch (err) {
    throw err;
  }
};


const register = async (userData: RegisterData) => {
  setLoading(true);
  try {
    const res = await authAPI.register(userData); // res: { user, token }
    const user = res.user;
    const token = res.token;

    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_data', JSON.stringify(user));
    setUser(user);
  } catch (error) {
    throw error;
  } finally {
    setLoading(false);
  }
};



  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};