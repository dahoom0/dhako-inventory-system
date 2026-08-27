/**
 * API Client Utility for Dhako Inventory System
 * 
 * This utility handles HTTP requests to the deployed backend on Render
 * https://dhako-backend.onrender.com
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Generic fetch wrapper with authentication and error handling
 */
async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('authToken');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}/api/v1${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data: ApiResponse<T> = await response.json();

    if (!response.ok) {
      throw new ApiError(
        response.status,
        data.error || data.message || 'API request failed',
        data
      );
    }

    if (!data.success) {
      throw new ApiError(
        response.status,
        data.error || 'API request was unsuccessful',
        data
      );
    }

    return data.data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (error instanceof Error) {
      throw new ApiError(0, `Network error: ${error.message}`);
    }
    
    throw new ApiError(0, 'Unknown network error');
  }
}

/**
 * Convenience methods for common HTTP methods
 */
export const api = {
  // GET request
  get: <T = any>(endpoint: string) => apiRequest<T>(endpoint, { method: 'GET' }),

  // POST request
  post: <T = any>(endpoint: string, body: any) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // PUT request
  put: <T = any>(endpoint: string, body: any) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  // PATCH request
  patch: <T = any>(endpoint: string, body: any) =>
    apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  // DELETE request
  delete: <T = any>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: 'DELETE' }),
};

/**
 * Authentication API endpoints
 */
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: any }>('/auth/login', { email, password }),

  register: (userData: any) =>
    api.post<{ token: string; user: any }>('/auth/register', userData),

  logout: () => api.post('/auth/logout', {}),

  getCurrentUser: () => api.get<any>('/auth/me'),
};

/**
 * User management API endpoints
 */
export const userApi = {
  getUsers: () => api.get<any[]>('/auth/users'),
  
  getUserLocations: (id: string) => api.get<any>(`/auth/users/${id}/locations`),
  
  createUser: (userData: any) => {
    // Clean data before sending
    const cleanData = { ...userData };
    
    // Remove null/undefined/empty values
    if (!cleanData.locationId) delete cleanData.locationId;
    
    // For INVENTORY_MANAGER, ensure locationIds is sent as array
    if (cleanData.role === "INVENTORY_MANAGER") {
      if (cleanData.locationIds && Array.isArray(cleanData.locationIds) && cleanData.locationIds.length > 0) {
        // Keep locationIds as array
      } else if (cleanData.locationId) {
        // Convert single locationId to locationIds
        cleanData.locationIds = [cleanData.locationId];
        delete cleanData.locationId;
      } else {
        // No location assigned, delete both
        delete cleanData.locationIds;
      }
    }
    
    // For other roles, use locationId
    if (cleanData.role === "BRANCH_MANAGER" && !cleanData.locationId) {
      delete cleanData.locationIds;
    }
    
    console.log("Creating user with data:", cleanData);
    return api.post<any>('/auth/register', cleanData);
  },
  
  updateUser: (id: string, userData: any) => {
    // Clean data before sending
    const cleanData = { ...userData };
    
    // Remove null/undefined/empty values
    if (!cleanData.locationId) delete cleanData.locationId;
    
    // For INVENTORY_MANAGER, ensure locationIds is sent as array
    if (cleanData.role === "INVENTORY_MANAGER") {
      if (cleanData.locationIds && Array.isArray(cleanData.locationIds) && cleanData.locationIds.length > 0) {
        // Keep locationIds as array
      } else if (cleanData.locationId) {
        // Convert single locationId to locationIds
        cleanData.locationIds = [cleanData.locationId];
        delete cleanData.locationId;
      } else {
        // No location assigned, delete both
        delete cleanData.locationIds;
      }
    }
    
    // For other roles, use locationId
    if (cleanData.role === "BRANCH_MANAGER" && !cleanData.locationId) {
      delete cleanData.locationIds;
    }
    
    console.log("Updating user with data:", cleanData);
    return api.put<any>(`/auth/users/${id}`, cleanData);
  },
  
  deleteUser: (id: string) => api.delete(`/auth/users/${id}`),
};

/**
 * Location API endpoints
 */
export const locationApi = {
  getLocations: () => api.get<any[]>('/locations'),
  
  getWarehouses: () => api.get<any[]>('/locations/warehouses'),
  
  getBranches: () => api.get<any[]>('/locations/branches'),
  
  getLocation: (id: string) => api.get<any>(`/locations/${id}`),
};

/**
 * Product API endpoints
 */
export const productApi = {
  getProducts: (params?: { page?: number; limit?: number; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const query = queryParams.toString();
    return api.get<any[]>(`/products${query ? `?${query}` : ''}`);
  },
  
  createProduct: (productData: any) => api.post<any>('/products', productData),
  
  updateProduct: (id: string, productData: any) => api.put<any>(`/products/${id}`, productData),
  
  deleteProduct: (id: string) => api.delete(`/products/${id}`),
  
  getCategories: () => api.get<any[]>('/products/categories'),
};

/**
 * Inventory API endpoints
 */
export const inventoryApi = {
  getInventory: (locationId?: string) => {
    const query = locationId ? `?locationId=${locationId}` : '';
    return api.get<any[]>(`/inventory${query}`);
  },
  
  getInventoryMatrix: () => api.get<any[]>('/inventory/matrix'),
  
  getLowStockAlerts: () => api.get<any[]>('/inventory/low-stock-alerts'),
  
  updateStock: (productId: string, locationId: string, quantity: number) =>
    api.post<any>('/inventory/update-stock', { productId, locationId, quantity }),
};

/**
 * Sales API endpoints
 */
export const salesApi = {
  getSales: (params?: { page?: number; limit?: number; dateFrom?: string; dateTo?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
    
    const query = queryParams.toString();
    return api.get<any[]>(`/sales${query ? `?${query}` : ''}`);
  },
  
  createSale: (saleData: any) => api.post<any>('/sales', saleData),
  
  getSalesReport: (params?: { startDate?: string; endDate?: string; locationId?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.locationId) queryParams.append('locationId', params.locationId);
    
    const query = queryParams.toString();
    return api.get<any[]>(`/analytics/sales-report${query ? `?${query}` : ''}`);
  },
};

/**
 * Analytics API endpoints
 */
export const analyticsApi = {
  getDashboardStats: () => api.get<any>('/analytics/dashboard-stats'),
  
  getSalesAnalytics: (params?: { period?: string; locationId?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);
    if (params?.locationId) queryParams.append('locationId', params.locationId);
    
    const query = queryParams.toString();
    return api.get<any>(`/analytics/sales${query ? `?${query}` : ''}`);
  },
  
  getInventoryAnalytics: () => api.get<any>('/analytics/inventory'),
  
  getFinancialAnalytics: () => api.get<any>('/analytics/financial'),
};

export default api;