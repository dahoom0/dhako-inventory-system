import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";
import { locationApi } from "@/utils/api";

export interface Location {
  id: string;
  name: string;
  type: "WAREHOUSE" | "BRANCH";
}

interface LocationContextType {
  locations: Location[];
  isLoading: boolean;
  error: string | null;
  addLocation: (location: Location) => void;
  updateLocation: (id: string, name: string) => void;
  deleteLocation: (id: string) => void;
  getLocationName: (id: string) => string;
  getLocation: (id: string) => Location | undefined;
  refetchLocations: () => Promise<void>; // New function to manually refetch
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch locations - can be called manually
  const fetchLocations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("📍 Fetching locations...");
      const data = await locationApi.getLocations();
      console.log("✅ Locations fetched successfully:", data);
      // Transform backend response to match Location interface
      const transformedLocations: Location[] = data.map((loc: any) => ({
        id: loc.id,
        name: loc.name,
        type: loc.type || "WAREHOUSE",
      }));
      console.log("✅ Transformed locations:", transformedLocations);
      setLocations(transformedLocations);
    } catch (err) {
      console.error("❌ Failed to fetch locations:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch locations");
      setLocations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refetch locations whenever the page becomes visible or after user logs in
  useEffect(() => {
    console.log("🔄 LocationContext mounted/updated, attempting to fetch locations");
    const token = localStorage.getItem('authToken');
    if (token) {
      console.log("🔐 Auth token found, fetching locations");
      fetchLocations();
    } else {
      console.log("⏳ No auth token found, locations will be fetched after login");
      setIsLoading(false);
      setLocations([]);
    }

    // Listen for authTokenSet event from AuthContext
    const handleAuthTokenSet = () => {
      console.log("🔐 authTokenSet event fired, refetching locations");
      fetchLocations();
    };

    window.addEventListener('authTokenSet', handleAuthTokenSet);

    // Also refetch when window/tab becomes visible (user switches tabs)
    const handleVisibilityChange = () => {
      if (!document.hidden && localStorage.getItem('authToken')) {
        console.log("👁️ Tab became visible, refetching locations");
        fetchLocations();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('authTokenSet', handleAuthTokenSet);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchLocations]);

  const addLocation = useCallback((location: Location) => {
    setLocations((prev) => [...prev, location]);
  }, []);

  const updateLocation = useCallback((id: string, name: string) => {
    setLocations((prev) =>
      prev.map((loc) => (loc.id === id ? { ...loc, name } : loc))
    );
  }, []);

  const deleteLocation = useCallback((id: string) => {
    setLocations((prev) => prev.filter((loc) => loc.id !== id));
  }, []);

  const getLocationName = useCallback(
    (id: string): string => {
      const location = locations.find((loc) => loc.id === id);
      return location?.name || id;
    },
    [locations]
  );

  const getLocation = useCallback(
    (id: string): Location | undefined => {
      return locations.find((loc) => loc.id === id);
    },
    [locations]
  );

  return (
    <LocationContext.Provider
      value={{
        locations,
        isLoading,
        error,
        addLocation,
        updateLocation,
        deleteLocation,
        getLocationName,
        getLocation,
        refetchLocations: fetchLocations,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocations = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocations must be used within a LocationProvider");
  }
  return context;
};
