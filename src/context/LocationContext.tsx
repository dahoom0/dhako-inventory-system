import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";

export interface Location {
  id: string;
  name: string;
  type: "WAREHOUSE" | "BRANCH";
}

interface LocationContextType {
  locations: Location[];
  addLocation: (location: Location) => void;
  updateLocation: (id: string, name: string) => void;
  deleteLocation: (id: string) => void;
  getLocationName: (id: string) => string;
  getLocation: (id: string) => Location | undefined;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

// Mock locations - can be fetched from backend later
const INITIAL_LOCATIONS: Location[] = [
  { id: "w1", name: "Warehouse A", type: "WAREHOUSE" },
  { id: "w2", name: "Warehouse B", type: "WAREHOUSE" },
  { id: "w3", name: "Warehouse C", type: "WAREHOUSE" },
  { id: "b1", name: "Branch Mogadishu", type: "BRANCH" },
  { id: "b2", name: "Branch Hargeisa", type: "BRANCH" },
  { id: "b3", name: "Branch Kismayo", type: "BRANCH" },
];

export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [locations, setLocations] = useState<Location[]>(INITIAL_LOCATIONS);

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
        addLocation,
        updateLocation,
        deleteLocation,
        getLocationName,
        getLocation,
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
