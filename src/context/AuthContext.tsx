import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);

      // Mock login with location assignment based on role
      let mockUser: User | null = null;

      if (email === "admin@dhako.com" && password === "admin123") {
        // ADMIN can see all locations
        mockUser = {
          id: "1",
          name: "Admin User",
          email: "admin@dhako.com",
          role: "ADMIN",
          accessibleLocations: ["w1", "w2", "w3", "b1", "b2", "b3"], // All warehouses and branches
          createdAt: new Date().toISOString(),
        };
      } else if (email === "inventory@dhako.com" && password === "inventory123") {
        // INVENTORY_MANAGER assigned to warehouses
        mockUser = {
          id: "2",
          name: "Inventory Manager",
          email: "inventory@dhako.com",
          role: "INVENTORY_MANAGER",
          locationId: "w1", // Primary warehouse
          accessibleLocations: ["w1", "w2", "w3", "b1", "b2", "b3"], // Can manage transfers to all branches
          createdAt: new Date().toISOString(),
        };
      } else if (email === "branch@dhako.com" && password === "branch123") {
        // BRANCH_MANAGER assigned to single branch
        mockUser = {
          id: "3",
          name: "Branch Manager - Mogadishu",
          email: "branch@dhako.com",
          role: "BRANCH_MANAGER",
          locationId: "b1", // Assigned branch
          accessibleLocations: ["b1"], // Can only see this branch
          createdAt: new Date().toISOString(),
        };
      }

      if (!mockUser) {
        throw new Error("Invalid credentials");
      }

      // Store auth data
      localStorage.setItem("authToken", "mock-token-" + Date.now());
      localStorage.setItem("user", JSON.stringify(mockUser));
      setUser(mockUser);
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
      // Mock implementation - in production, call backend API
      const newUser: User = {
        id: Date.now().toString(),
        name: data.name,
        email: data.email,
        role: data.role,
        locationId: data.locationId,
        createdAt: new Date().toISOString(),
      };
      setUsers([...users, newUser]);
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
        // Mock implementation
        setUsers(
          users.map((u) =>
            u.id === id
              ? {
                  ...u,
                  name: data.name || u.name,
                  email: data.email || u.email,
                  role: data.role || u.role,
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
        // Mock implementation
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
      // Mock implementation - return sample users with location assignments
      if (users.length === 0) {
        const sampleUsers: User[] = [
          {
            id: "1",
            name: "Admin User",
            email: "admin@dhako.com",
            role: "ADMIN",
            accessibleLocations: ["w1", "w2", "w3", "b1", "b2", "b3"],
            createdAt: new Date().toISOString(),
          },
          {
            id: "2",
            name: "Inventory Manager",
            email: "inventory@dhako.com",
            role: "INVENTORY_MANAGER",
            locationId: "w1",
            accessibleLocations: ["w1", "w2", "w3", "b1", "b2", "b3"],
            createdAt: new Date().toISOString(),
          },
          {
            id: "3",
            name: "Branch Manager - Mogadishu",
            email: "branch@dhako.com",
            role: "BRANCH_MANAGER",
            locationId: "b1",
            accessibleLocations: ["b1"],
            createdAt: new Date().toISOString(),
          },
          {
            id: "4",
            name: "Branch Manager - Hargeisa",
            email: "branch2@dhako.com",
            role: "BRANCH_MANAGER",
            locationId: "b2",
            accessibleLocations: ["b2"],
            createdAt: new Date().toISOString(),
          },
          {
            id: "5",
            name: "Branch Manager - Kismayo",
            email: "branch3@dhako.com",
            role: "BRANCH_MANAGER",
            locationId: "b3",
            accessibleLocations: ["b3"],
            createdAt: new Date().toISOString(),
          },
        ];
        setUsers(sampleUsers);
        return sampleUsers;
      }
      return users;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch users";
      setError(message);
      throw err;
    }
  }, [users]);

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
