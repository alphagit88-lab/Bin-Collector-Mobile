import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../config/api';
import { ENDPOINTS } from '../config/endpoints';
import { requestUserPermission, getFcmToken, updatePushToken, registerAppWithFCM } from '../utils/fcmNotifications';

export interface User {
  id: number;
  name: string;
  phone: string;
  email: string;
  role: 'customer' | 'supplier' | 'admin' | 'driver';
  supplierType?: string;
  supplierId?: number;
}

export interface SignupData {
  name: string;
  phone: string;
  email?: string;
  password: string;
  role: 'customer' | 'supplier';
  supplierType?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (phone: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; message?: string }>;
  signup: (data: SignupData) => Promise<{ success: boolean; message?: string }>;
  updateProfile: (email: string) => Promise<{ success: boolean; message?: string }>;
  changePassword: (newPassword: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  rememberedPhone: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [rememberedPhone, setRememberedPhone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  // Sync FCM Push Token whenever user is authenticated
  useEffect(() => {
    const syncPushToken = async () => {
      if (user?.id && token) {
        console.log('Auth: User authenticated, syncing FCM token...');
        const hasPermission = await requestUserPermission();
        if (hasPermission) {
          await registerAppWithFCM();
          const fcmToken = await getFcmToken();
          if (fcmToken) {
            await updatePushToken(fcmToken);
          }
        }
      }
    };

    syncPushToken();
  }, [user?.id, token]);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      const storedPhone = await AsyncStorage.getItem('rememberedPhone');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
      if (storedPhone) {
        setRememberedPhone(storedPhone);
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (phone: string, password: string, rememberMe: boolean = false) => {
    try {
      const response = await api.post<{ user: User; token: string }>(ENDPOINTS.AUTH.LOGIN, {
        phone,
        password,
      });

      if (response.success && response.data) {
        const { user, token } = response.data;
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify(user));

        if (rememberMe) {
          await AsyncStorage.setItem('rememberedPhone', phone);
          setRememberedPhone(phone);
        } else {
          await AsyncStorage.removeItem('rememberedPhone');
          setRememberedPhone(null);
        }

        setToken(token);
        setUser(user);

        return { success: true };
      } else {
        return { success: false, message: response.message || 'Login failed' };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Login failed',
      };
    }
  };

  const signup = async (data: SignupData) => {
    try {
      const response = await api.post<{ user: User; token: string }>(ENDPOINTS.AUTH.SIGNUP, data);

      if (response.success && response.data) {
        const { user, token } = response.data;
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        setToken(token);
        setUser(user);

        return { success: true };
      } else {
        return { success: false, message: response.message || 'Signup failed' };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Signup failed',
      };
    }
  };

  const updateProfile = async (email: string) => {
    try {
      const response = await api.put<{ user: User }>(ENDPOINTS.AUTH.UPDATE_PROFILE, { email });

      if (response.success && response.data) {
        const { user: updatedUser } = response.data;
        const newUser = { ...user, ...updatedUser };
        await AsyncStorage.setItem('user', JSON.stringify(newUser));
        setUser(newUser as User);
        return { success: true };
      } else {
        return { success: false, message: response.message || 'Update failed' };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Update failed',
      };
    }
  };

  const changePassword = async (newPassword: string) => {
    try {
      const response = await api.put(ENDPOINTS.AUTH.UPDATE_PASSWORD, { newPassword });

      if (response.success) {
        return { success: true };
      } else {
        return { success: false, message: response.message || 'Change password failed' };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Change password failed',
      };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        signup,
        updateProfile,
        changePassword,
        logout,
        isAuthenticated: !!token && !!user,
        rememberedPhone,
      }}
    >
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
