import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { PageHeader, Card, Btn, Th, Td } from "@/components/ui";
import InventoryManager from "./inventory/InventoryManager";

const BranchDashboard: React.FC = () => {
  const { user, getAccessibleLocations } = useAuth();
  const [branchName, setBranchName] = useState("Your Branch");

  useEffect(() => {
    // Get branch name based on user's assigned branch
    if (user?.role === "BRANCH_MANAGER" && user?.locationId) {
      const branchLocations: Record<string, string> = {
        "b1": "Branch Mogadishu",
        "b2": "Branch Hargeisa",
        "b3": "Branch Kismayo",
      };
      setBranchName(branchLocations[user.locationId] || "Your Branch");
    }
  }, [user]);

  // Only BRANCH_MANAGER can access this dashboard
  if (user?.role !== "BRANCH_MANAGER") {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <div style={{ color: "#dc2626", fontSize: "18px", fontWeight: "bold", marginBottom: "8px" }}>
            Access Denied
          </div>
          <div style={{ color: "#64748b" }}>Only branch managers can access this dashboard.</div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <InventoryManager branchName={branchName} />
    </div>
  );
};

export default BranchDashboard;
