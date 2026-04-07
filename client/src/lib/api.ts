/**
 * Centralized API service layer for the KIZERE platform
 * This module provides a unified interface for all API interactions
 */

import { queryClient, apiRequest } from "./queryClient";
import { toast } from "@/hooks/use-toast";

interface ApiError {
  status: number;
  message: string;
  details?: any;
}

interface ApiOptions {
  /**
   * When true, automatically show a toast notification on error
   */
  showErrorToast?: boolean;
  /**
   * Use this to abort the request when needed
   */
  signal?: AbortSignal;
  /**
   * Additional fetch options
   */
  fetchOptions?: RequestInit;
}

/**
 * Default API options
 */
const defaultApiOptions: ApiOptions = {
  showErrorToast: true,
};

/**
 * Format error message based on the API response
 */
function formatErrorMessage(error: any): string {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Generic GET request with type safety
 */
export async function apiGet<T>(endpoint: string, options: ApiOptions = defaultApiOptions): Promise<T | null> {
  try {
    return await apiRequest<T>(endpoint);
  } catch (error: any) {
    if (error.name === 'AbortError') {
      // Request was aborted, handle silently
      return null;
    }

    if (options.showErrorToast) {
      toast({
        title: "Request Failed",
        description: formatErrorMessage(error),
        variant: "destructive",
      });
    }
    console.error(`API GET error for ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Generic POST request with type safety
 */
export async function apiPost<T, D = any>(
  endpoint: string, 
  data: D, 
  options: ApiOptions = defaultApiOptions
): Promise<T | null> {
  try {
    return await apiRequest<T>(endpoint, {
      method: 'POST',
      data
    });
  } catch (error: any) {
    if (error.name === 'AbortError') {
      // Request was aborted, handle silently
      return null;
    }

    if (options.showErrorToast) {
      toast({
        title: "Request Failed",
        description: formatErrorMessage(error),
        variant: "destructive",
      });
    }
    console.error(`API POST error for ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Generic PUT request with type safety
 */
export async function apiPut<T, D = any>(
  endpoint: string, 
  data: D, 
  options: ApiOptions = defaultApiOptions
): Promise<T | null> {
  try {
    return await apiRequest<T>(endpoint, {
      method: 'PUT',
      data
    });
  } catch (error: any) {
    if (error.name === 'AbortError') {
      // Request was aborted, handle silently
      return null;
    }

    if (options.showErrorToast) {
      toast({
        title: "Update Failed",
        description: formatErrorMessage(error),
        variant: "destructive",
      });
    }
    console.error(`API PUT error for ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Generic PATCH request with type safety
 */
export async function apiPatch<T, D = any>(
  endpoint: string, 
  data: D, 
  options: ApiOptions = defaultApiOptions
): Promise<T | null> {
  try {
    return await apiRequest<T>(endpoint, {
      method: 'PATCH',
      data
    });
  } catch (error: any) {
    if (error.name === 'AbortError') {
      // Request was aborted, handle silently
      return null;
    }

    if (options.showErrorToast) {
      toast({
        title: "Update Failed",
        description: formatErrorMessage(error),
        variant: "destructive",
      });
    }
    console.error(`API PATCH error for ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Generic DELETE request with type safety
 */
export async function apiDelete<T>(
  endpoint: string, 
  options: ApiOptions = defaultApiOptions
): Promise<T | null> {
  try {
    return await apiRequest<T>(endpoint, {
      method: 'DELETE'
    });
  } catch (error: any) {
    if (error.name === 'AbortError') {
      // Request was aborted, handle silently
      return null;
    }

    if (options.showErrorToast) {
      toast({
        title: "Delete Failed",
        description: formatErrorMessage(error),
        variant: "destructive",
      });
    }
    console.error(`API DELETE error for ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Generic method to invalidate queries
 */
export function invalidateQueries(queryKey: string | string[]): void {
  const key = Array.isArray(queryKey) ? queryKey : [queryKey];
  queryClient.invalidateQueries({ queryKey: key });
}

/**
 * Specialized API functions for different areas of the application
 */

// User-related API calls
export const userApi = {
  getCurrentUser: () => apiGet('/api/user'),
  getUsers: () => apiGet('/api/users'),
  getUserById: (id: number) => apiGet(`/api/users/${id}`),
  updateUser: (id: number, data: any) => apiPut(`/api/users/${id}`, data),
};

// Item-related API calls
export const itemApi = {
  getItems: () => apiGet('/api/items'),
  getItemById: (id: number) => apiGet(`/api/items/${id}`),
  createItem: (data: any) => apiPost('/api/items', data),
  updateItem: (id: number, data: any) => apiPut(`/api/items/${id}`, data),
  deleteItem: (id: number) => apiDelete(`/api/items/${id}`),
};

// Report-related API calls
export const reportApi = {
  getReports: () => apiGet('/api/reports'),
  getReportById: (id: number) => apiGet(`/api/reports/${id}`),
  createReport: (data: any) => apiPost('/api/reports', data),
  updateReport: (id: number, data: any) => apiPut(`/api/reports/${id}`, data),
};

// Payment-related API calls
export const paymentApi = {
  getPayments: () => apiGet('/api/payments'),
  getPaymentById: (id: number) => apiGet(`/api/payments/${id}`),
  initiatePayment: (data: any) => apiPost('/api/payments/initiate', data),
  confirmPayment: (reference: string) => apiPost(`/api/payments/confirm`, { reference }),
};

// Admin-related API calls
export const adminApi = {
  getDashboardStats: () => apiGet('/api/admin/stats'),
  getSystemStatus: () => apiGet('/api/admin/system-status'),
  getActivityLog: () => apiGet('/api/admin/activity-log'),
  
  // Admin report management
  getReportStats: () => apiGet('/api/admin/reports/stats'),
  getReports: (params = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add all params to the query string
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    const queryString = queryParams.toString();
    return apiGet(`/api/admin/reports${queryString ? `?${queryString}` : ''}`);
  },
  getReportById: (id: number) => apiGet(`/api/admin/reports/${id}`),
  updateReportStatus: (id: number, data: { status: string; notes?: string }) => 
    apiPut(`/api/admin/reports/${id}/status`, data),
  exportReportsCsv: () => {
    // Create a link and trigger download
    const link = document.createElement('a');
    link.href = `/api/admin/reports/export/csv`;
    link.setAttribute('download', `reports-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return Promise.resolve(true);
  }
};

// POS-related API calls
export const posApi = {
  checkOrCreateCustomer: (data: {
    nationalId: string;
    fullName: string;
    phone?: string;
    email?: string;
  }) => apiPost<{ isNew: boolean; customer: any }, any>('/api/pos/check-or-create', data),

  getProfile: () =>
    apiGet<{ profile: any }>('/api/pos/my-profile'),

  updateProfile: (data: { name?: string; email?: string; phone?: string; address?: string; walletPhone?: string }) =>
    apiPatch<{ profile: any }, typeof data>('/api/pos/my-profile', data),

  getTransactions: (page: number, limit = 20) =>
    apiGet<{ data: any[]; total: number; totalPages: number; page: number }>(
      `/api/pos/my-transactions?page=${page}&limit=${limit}`
    ),

  getCustomers: (page: number, limit = 50) =>
    apiGet<{ data: any[]; total: number; totalPages: number }>(
      `/api/pos/my-customers?page=${page}&limit=${limit}`
    ),

  getCustomerById: (id: number) =>
    apiGet<{ customer: any }>(`/api/pos/my-customers/${id}`),

  updateCustomerSettings: (id: number, data: { isBlocked?: boolean; internalNotes?: string }) =>
    apiPatch<{ success: boolean }, typeof data>(`/api/pos/my-customers/${id}/settings`, data),
};