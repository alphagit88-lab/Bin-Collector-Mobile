import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';

// Update this to match your backend URL
// For Android emulator, use 10.0.2.2 instead of localhost
// For physical device, use your computer's IP address
const BASE_URL = `http://192.168.8.120:5000`;
const API_URL = `${BASE_URL}/api`;
//http://192.168.8.120:5000
//https://api.taskerbuddy.com

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  debugInfo?: any;
  [key: string]: any;
}

class ApiClient {
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('token');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = await this.getAuthToken();

    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> | undefined),
    };

    // Only set application/json if not FormData
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          DeviceEventEmitter.emit('auth_error');
        }
        return {
          success: false,
          message: data.message || `Request failed with status ${response.status}`,
          debugInfo: { status: response.status, url }
        };
      }

      return data;
    } catch (error) {
      console.error('[API Error]', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network error',
        debugInfo: { error, endpoint }
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, {
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: isFormData ? body : JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
export { API_URL, BASE_URL };
