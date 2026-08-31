import React from "react";
import { useAuth } from "../context/AuthContext";
import { Card } from "@/components/ui";
import InventoryManager from "./inventory/InventoryManager";

const BranchDashboard: React.FC = () => {
  const { user } = useAuth();

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

  // Use the real location name from the user object (comes from the backend auth/me)
  const branchName = (user as any)?.locationName || "Your Branch";

  return (
    <div>
      <InventoryManager branchName={branchName} />
    </div>
  );
};

export default BranchDashboard;
