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
 * UUID validation and debugging utilities
 */
export const uuidUtils = {
  // Validate UUID format
  isValidUUID: (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  },
  
  // Validate array of UUIDs
  areValidUUIDs: (uuids: string[]): { valid: boolean; invalidUUIDs: string[] } => {
    const invalidUUIDs = uuids.filter(uuid => !uuidUtils.isValidUUID(uuid));
    return {
      valid: invalidUUIDs.length === 0,
      invalidUUIDs
    };
  },
  
  // Debug location data
  debugLocationData: (locations: any[], selectedIds: string[]) => {
    console.log('🔍 UUID Validation Debug:');
    console.log('📍 Available locations:', locations.map(loc => ({
      id: loc.id,
      name: loc.name,
      isValidUUID: uuidUtils.isValidUUID(loc.id)
    })));
    
    const validation = uuidUtils.areValidUUIDs(selectedIds);
    console.log('✅ Selected location IDs:', selectedIds);
    console.log('🎯 UUID Validation:', validation);
    
    if (!validation.valid) {
      console.error('❌ Invalid UUIDs detected:', validation.invalidUUIDs);
    }
    
    return validation;
  }
};

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
    console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
    if (options.body) {
      console.log('📤 Request Body:', JSON.parse(options.body as string));
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Guard: reject non-JSON responses immediately with a clear error
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const preview = await response.text();
      console.error("🚨 Non-JSON response from API:", {
        url,
        status: response.status,
        contentType,
        preview: preview.slice(0, 300),
      });
      throw new ApiError(
        response.status,
        `Server returned ${contentType || "unknown content-type"} instead of JSON. ` +
          `This usually means the API route does not exist (404) or the server crashed (500).`,
        { url, contentType, preview: preview.slice(0, 300) }
      );
    }

    const data: ApiResponse<T> = await response.json();
    
    console.log(`📥 API Response (${response.status}):`, data);

    if (!response.ok) {
      // Enhanced error logging for validation errors
      if (response.status === 400 && data.details) {
        console.error('🚨 Validation Error Details:', data.details);
        console.error('🔍 Request that caused error:', {
          url,
          method: options.method,
          body: options.body ? JSON.parse(options.body as string) : null
        });
      }
      
      // data.error may be an object { code, message } or a plain string
      const errorMsg =
        typeof data.error === "object" && data.error !== null
          ? (data.error as any).message || JSON.stringify(data.error)
          : data.error || data.message || "API request failed";

      throw new ApiError(response.status, errorMsg, data);
    }

    if (!data.success) {
      const errorMsg =
        typeof data.error === "object" && data.error !== null
          ? (data.error as any).message || JSON.stringify(data.error)
          : data.error || "API request was unsuccessful";

      throw new ApiError(response.status, errorMsg, data);
    }

    return data.data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (error instanceof Error) {
      console.error('🔥 Network Error:', error.message);
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
    console.log("🚀 === USER CREATION DIAGNOSTIC START ===");
    
    // Step 1: Log original data
    console.log("📋 Original user data:", userData);
    
    // Step 2: Validate input data structure
    const requiredFields = ['name', 'email', 'password', 'role'];
    const missingFields = requiredFields.filter(field => !userData[field]);
    if (missingFields.length > 0) {
      console.error("❌ Missing required fields:", missingFields);
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    // Step 3: Clean and validate data
    const cleanData = { ...userData };
    
    // Remove null/undefined/empty values
    if (!cleanData.locationId) delete cleanData.locationId;
    
    // Step 4: Role-based location validation
    if (cleanData.role === "INVENTORY_MANAGER") {
      console.log("🏭 Processing INVENTORY_MANAGER location assignment...");
      
      if (cleanData.locationIds && Array.isArray(cleanData.locationIds) && cleanData.locationIds.length > 0) {
        // Validate UUIDs in locationIds
        const validation = uuidUtils.areValidUUIDs(cleanData.locationIds);
        console.log("🔍 LocationIds UUID validation:", validation);
        
        if (!validation.valid) {
          console.error("❌ Invalid UUIDs in locationIds:", validation.invalidUUIDs);
          throw new Error(`Invalid location UUIDs: ${validation.invalidUUIDs.join(', ')}`);
        }
        
        console.log("✅ Using locationIds array:", cleanData.locationIds);
      } else if (cleanData.locationId) {
        // Convert single locationId to locationIds
        if (!uuidUtils.isValidUUID(cleanData.locationId)) {
          console.error("❌ Invalid UUID in locationId:", cleanData.locationId);
          throw new Error(`Invalid location UUID: ${cleanData.locationId}`);
        }
        
        cleanData.locationIds = [cleanData.locationId];
        delete cleanData.locationId;
        console.log("🔄 Converted locationId to locationIds:", cleanData.locationIds);
      } else {
        // No location assigned
        delete cleanData.locationIds;
        console.log("⚠️ No locations assigned for INVENTORY_MANAGER");
      }
    } else if (cleanData.role === "BRANCH_MANAGER") {
      console.log("🏪 Processing BRANCH_MANAGER location assignment...");
      
      if (cleanData.locationId && !uuidUtils.isValidUUID(cleanData.locationId)) {
        console.error("❌ Invalid UUID in locationId:", cleanData.locationId);
        throw new Error(`Invalid location UUID: ${cleanData.locationId}`);
      }
      
      // Remove locationIds for branch manager
      if (cleanData.locationIds) {
        delete cleanData.locationIds;
        console.log("🗑️ Removed locationIds for BRANCH_MANAGER");
      }
    } else {
      console.log("👑 Processing ADMIN - no location restrictions");
      // For ADMIN, remove location fields
      delete cleanData.locationId;
      delete cleanData.locationIds;
    }
    
    // Step 5: Final validation and logging
    console.log("📋 Final clean data:", cleanData);
    console.log("🎯 Final data validation:");
    Object.keys(cleanData).forEach(key => {
      const value = cleanData[key];
      console.log(`  ${key}: ${typeof value} = ${JSON.stringify(value)}`);
    });
    
    console.log("🚀 === USER CREATION DIAGNOSTIC END ===");
    
    // Step 6: Make API call
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
  
  getLocationStats: (id: string) => api.get<any>(`/locations/${id}/stats`),
  
  createLocation: (name: string, type: 'WAREHOUSE' | 'BRANCH') =>
    api.post<any>('/locations', { name, type }),
  
  updateLocation: (id: string, name: string) =>
    api.patch<any>(`/locations/${id}`, { name }),
  
  deactivateLocation: (id: string) =>
    api.patch<any>(`/locations/${id}/deactivate`, {}),
  
  deleteLocation: (id: string) =>
    api.delete<any>(`/locations/${id}`),
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
  
  // Receive stock for existing product
  receiveStock: (stockData: { productId: string; warehouseId: string; qtyCtn: number; costPerCtn: number; supplier?: string; notes?: string }) =>
    api.post<any>('/receiving', stockData),
};

/**
 * Category API endpoints (full CRUD)
 */
export const categoryApi = {
  getCategories: () => api.get<any[]>('/categories'),
  
  getCategory: (id: string) => api.get<any>(`/categories/${id}`),
  
  createCategory: (name: string) => api.post<any>('/categories', { name }),
  
  updateCategory: (id: string, name: string) => api.patch<any>(`/categories/${id}`, { name }),
  
  deleteCategory: (id: string) => api.delete<any>(`/categories/${id}`),
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
  
  getLowStockAlerts: (params?: { locationType?: string; locationId?: string; severity?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.locationType) queryParams.append('locationType', params.locationType);
    if (params?.locationId) queryParams.append('locationId', params.locationId);
    if (params?.severity) queryParams.append('severity', params.severity);
    
    const query = queryParams.toString();
    return api.get<any[]>(`/inventory/alerts${query ? `?${query}` : ''}`);
  },
  
  getInventoryMovements: (params?: { page?: number; limit?: number; type?: string; productId?: string; locationId?: string; startDate?: string; endDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.productId) queryParams.append('productId', params.productId);
    if (params?.locationId) queryParams.append('locationId', params.locationId);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    const query = queryParams.toString();
    return api.get<any[]>(`/inventory/movements${query ? `?${query}` : ''}`);
  },
  
  updateStock: (productId: string, locationId: string, quantity: number) =>
    api.post<any>('/inventory/update-stock', { productId, locationId, quantity }),
  
  receiveStock: (stockData: any) =>
    api.post<any>('/inventory/receive-stock', stockData),
};

/**
 * Sales API endpoints
 */
export const salesApi = {
  getSales: (params?: { page?: number; limit?: number; dateFrom?: string; dateTo?: string; locationId?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
    if (params?.locationId) queryParams.append('locationId', params.locationId);
    
    const query = queryParams.toString();
    return api.get<any[]>(`/sales${query ? `?${query}` : ''}`);
  },
  
  createSale: (saleData: any) => api.post<any>('/sales', saleData),
  
  voidSale: (saleId: string) => api.delete<any>(`/sales/${saleId}`),

  updateSale: (saleId: string, data: { paymentMethod?: string; paymentNote?: string; items?: { productId: string; sellPricePerCtn: number }[] }) =>
    api.patch<any>(`/sales/${saleId}`, data),
  
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
  getDashboardStats: (params?: { locationId?: string; dateFrom?: string; dateTo?: string }) => {
    const q = new URLSearchParams();
    if (params?.locationId) q.append("locationId", params.locationId);
    if (params?.dateFrom)   q.append("dateFrom",   params.dateFrom);
    if (params?.dateTo)     q.append("dateTo",     params.dateTo);
    const qs = q.toString();
    return api.get<any>(`/analytics/dashboard-stats${qs ? `?${qs}` : ""}`);
  },
  
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

/**
 * Customers API endpoints
 */
export const customerApi = {
  getCustomers: (params?: { page?: number; limit?: number; locationId?: string; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.locationId) queryParams.append('locationId', params.locationId);
    if (params?.search) queryParams.append('search', params.search);
    
    const query = queryParams.toString();
    return api.get<any>(`/customers${query ? `?${query}` : ''}`);
  },
  
  getCustomer: (id: string) => api.get<any>(`/customers/${id}`),
  
  createCustomer: (customerData: any) => api.post<any>('/customers', customerData),
  
  updateCustomer: (id: string, customerData: any) => api.patch<any>(`/customers/${id}`, customerData),
  
  deleteCustomer: (id: string) => api.delete<any>(`/customers/${id}`),
};

/**
 * Expenses API endpoints
 */
export const expensesApi = {
  getExpenses: (params?: { page?: number; limit?: number; locationId?: string; category?: string; dateFrom?: string; dateTo?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.locationId) queryParams.append('locationId', params.locationId);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
    
    const query = queryParams.toString();
    return api.get<any>(`/expenses${query ? `?${query}` : ''}`);
  },
  
  createExpense: (expenseData: any) => api.post<any>('/expenses', expenseData),
};

/**
 * Debts API endpoints
 */
export const debtsApi = {
  getDebts: (params?: { page?: number; limit?: number; locationId?: string; status?: string; customerId?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.locationId) queryParams.append('locationId', params.locationId);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.customerId) queryParams.append('customerId', params.customerId);
    
    const query = queryParams.toString();
    return api.get<any>(`/debts${query ? `?${query}` : ''}`);
  },
  
  createDebt: (debtData: any) => api.post<any>('/debts', debtData),
  
  recordPayment: (debtId: string, paymentData: any) => api.post<any>(`/debts/${debtId}/payment`, paymentData),
};

/**
 * Inventory Adjustments API endpoints
 */
export const adjustmentsApi = {
  getAdjustments: (params?: { page?: number; limit?: number; locationId?: string; reason?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.locationId) queryParams.append('locationId', params.locationId);
    if (params?.reason) queryParams.append('reason', params.reason);
    
    const query = queryParams.toString();
    return api.get<any>(`/adjustments${query ? `?${query}` : ''}`);
  },
  
  createAdjustment: (adjustmentData: any) => api.post<any>('/adjustments', adjustmentData),
};

export default api;