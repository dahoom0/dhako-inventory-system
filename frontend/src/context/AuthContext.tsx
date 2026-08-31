import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { authApi, userApi, ApiError } from "../utils/api";

export type UserRole = "ADMIN" | "INVENTORY_MANAGER" | "BRANCH_MANAGER" | "BRANCH_STAFF";

export interface Location {
  id: string;
  name: string;
  type: "WAREHOUSE" | "BRANCH";
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  locationId?: string;  // Primary location (warehouse for INVENTORY_MANAGER, branch for BRANCH_MANAGER)
  accessibleLocations?: string[]; // All locations user can access
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  createUser: (data: CreateUserData) => Promise<void>;
  updateUser: (id: string, data: Partial<CreateUserData>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  getUsers: () => Promise<User[]>;
  error: string | null;
  // Location scoping helpers
  canAccessLocation: (locationId: string) => boolean;
  getAccessibleLocations: () => string[];
  isLocationAccessible: (locationId: string) => boolean;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  locationId?: string;
  locationIds?: string[]; // For INVENTORY_MANAGER with multiple locations
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to determine accessible locations based on role
const getDefaultAccessibleLocations = (role: string): string[] => {
  switch (role) {
    case "ADMIN":
      return ["w1", "w2", "w3", "b1", "b2", "b3"]; // All locations
    case "INVENTORY_MANAGER":
      return ["w1", "w2", "w3", "b1", "b2", "b3"]; // Can manage transfers to all branches
    case "BRANCH_MANAGER":
      return ["b1"]; // Single branch (this should come from backend)
    case "BRANCH_STAFF":
      return ["b1"]; // Single branch (this should come from backend)
    default:
      return [];
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  // Initialize auth state from localStorage and verify token with backend
  useEffect(() => {
    let cancelled = false; // guard against StrictMode double-invocation

    const initializeAuth = async () => {
      const token = localStorage.getItem("authToken");
      const storedUser = localStorage.getItem("user");

      if (!token || !storedUser) {
        // No credentials stored — not logged in
        if (!cancelled) setIsLoading(false);
        return;
      }

      // Restore from localStorage immediately so UI doesn't flash login screen
      try {
        const parsed = JSON.parse(storedUser) as User;
        if (!cancelled) setUser(parsed);
      } catch {
        // Corrupted stored user — clear and bail
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        if (!cancelled) setIsLoading(false);
        return;
      }

      // Then verify token is still valid by calling /auth/me
      try {
        const backendUser = await authApi.getCurrentUser();
        if (cancelled) return; // component unmounted — do nothing

        const freshUser: User = {
          id: backendUser.id,
          name: backendUser.name,
          email: backendUser.email,
          role: backendUser.role as UserRole,
          locationId: backendUser.location_id,
          accessibleLocations: getDefaultAccessibleLocations(backendUser.role),
          createdAt: backendUser.created_at || new Date().toISOString(),
        };

        setUser(freshUser);
        localStorage.setItem("user", JSON.stringify(freshUser));
      } catch (error: any) {
        if (cancelled) return;
        // Only clear credentials if the token is actually invalid/expired (401)
        // Do NOT clear on network errors (status 0) — user might be offline
        const status = error?.status ?? 0;
        if (status === 401) {
          console.warn("Auth token expired or invalid — clearing session");
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");
          setUser(null);
        } else {
          console.warn("Could not verify token (network error?) — keeping stored session", error?.message);
          // Keep the user from localStorage; they'll get a proper error if they try an API call
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      cancelled = true; // cleanup: ignore result if StrictMode remounts
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);

      // Real API call to backend
      const response = await authApi.login(email, password);
      
      // Store auth data from API response
      localStorage.setItem("authToken", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      
      // Convert backend user format to frontend format
      const user: User = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        role: response.user.role as UserRole,
        locationId: response.user.location_id || response.user.locationId,
        accessibleLocations: getDefaultAccessibleLocations(response.user.role),
        createdAt: response.user.created_at || new Date().toISOString(),
      };
      
      setUser(user);
      
      // Refetch locations after login succeeds
      // This ensures locations are loaded after auth token is set
      console.log("✅ Login successful, refetching locations");
      // Note: We can't directly call refetchLocations here as it's in LocationContext
      // Instead, we'll dispatch a custom event that LocationContext listens to
      window.dispatchEvent(new Event('authTokenSet'));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setError(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
  }, []);

  const createUser = useCallback(async (data: CreateUserData) => {
    try {
      setError(null);
      // Real API call to create user
      const newUser = await userApi.createUser(data);
      
      // Convert backend response to frontend format
      const user: User = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role as UserRole,
        locationId: data.locationId,
        createdAt: newUser.created_at || new Date().toISOString(),
      };
      
      setUsers([...users, user]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create user";
      setError(message);
      throw err;
    }
  }, [users]);

  const updateUser = useCallback(
    async (id: string, data: Partial<CreateUserData>) => {
      try {
        setError(null);
        // Real API call to update user
        const updatedUser = await userApi.updateUser(id, data);
        
        // Update local state
        setUsers(
          users.map((u) =>
            u.id === id
              ? {
                  ...u,
                  name: updatedUser.name || u.name,
                  email: updatedUser.email || u.email,
                  role: updatedUser.role as UserRole || u.role,
                  locationId: data.locationId || u.locationId,
                }
              : u
          )
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update user";
        setError(message);
        throw err;
      }
    },
    [users]
  );

  const deleteUser = useCallback(
    async (id: string) => {
      try {
        setError(null);
        // Real API call to delete user
        await userApi.deleteUser(id);
        
        // Update local state
        setUsers(users.filter((u) => u.id !== id));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to delete user";
        setError(message);
        throw err;
      }
    },
    [users]
  );

  const getUsers = useCallback(async () => {
    try {
      setError(null);
      // Real API call to get users
      const backendUsers = await userApi.getUsers();
      
      // Convert backend users to frontend format
      const frontendUsers: User[] = backendUsers.map((backendUser: any) => ({
        id: backendUser.id,
        name: backendUser.name,
        email: backendUser.email,
        role: backendUser.role as UserRole,
        locationId: backendUser.location_id,
        createdAt: backendUser.created_at || new Date().toISOString(),
      }));
      
      setUsers(frontendUsers);
      return frontendUsers;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch users";
      setError(message);
      throw err;
    }
  }, []);

  // Location scoping helpers
  const canAccessLocation = useCallback(
    (locationId: string): boolean => {
      if (!user) return false;
      if (user.role === "ADMIN") return true; // ADMIN can access everything
      return user.accessibleLocations?.includes(locationId) ?? false;
    },
    [user]
  );

  const getAccessibleLocations = useCallback((): string[] => {
    if (!user) return [];
    return user.accessibleLocations || [];
  }, [user]);

  const isLocationAccessible = useCallback(
    (locationId: string): boolean => {
      return canAccessLocation(locationId);
    },
    [canAccessLocation]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        createUser,
        updateUser,
        deleteUser,
        getUsers,
        error,
        canAccessLocation,
        getAccessibleLocations,
        isLocationAccessible,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const useUser = (): User => {
  const { user } = useAuth();
  if (!user) {
    throw new Error("useUser must be used when user is authenticated");
  }
  return user;
};

export const useRequireRole = (allowedRoles: UserRole[]): boolean => {
  const { user } = useAuth();
  return user ? allowedRoles.includes(user.role) : false;
};
