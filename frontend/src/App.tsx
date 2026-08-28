import { useState, useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import AdminDashboardWithBranches from "./pages/admin/AdminDashboardWithBranches";
import BranchManagerDashboard from "./pages/BranchManagerDashboard";
import BranchDashboard from "./pages/BranchDashboard";
import Sales from "./pages/Sales";
import Expenses from "./pages/Expenses";
import Debts from "./pages/Debts";
import Warehouses from "./pages/Warehouses";
import Inventory from "./pages/Inventory";
import Receiving from "./pages/Receiving";
import Transfers from "./pages/Transfers";
import BranchTransfers from "./pages/BranchTransfers";
import SalesReport from "./pages/reports/SalesReport";
import BranchReport from "./pages/reports/BranchReport";
import InventoryManagerDashboard from "./pages/admin/InventoryManagerDashboard";
import UserManagement from "./pages/admin/UserManagement";
import CustomerManagement from "./pages/admin/CustomerManagement";
import LocationManagement from "./pages/admin/LocationManagement";
import ProductManagement from "./pages/admin/ProductManagement";
import Login from "./pages/Login";
import Placeholder from "./pages/Placeholder";

const PAGE_TITLES: Record<string, string> = {
  dashboard:          "Dashboard",
  inventory:          "Inventory",
  receiving:          "Receive Stock",
  transfers:          "Stock Transfers",
  "branch-transfers": "Branch Transfers",
  sales:              "Sales",
  expenses:           "Expenses",
  debts:              "Debt Management",
  customers:          "Customers",
  "report-sales":     "Sales Report",
  "report-profit":    "Profit Report",
  "report-expenses":  "Expense Report",
  "report-branches":  "Branch Comparison",
  "report-products":  "Product Performance",
  "user-management":  "User Management",
  "customer-management": "Customer Management",
  "location-management": "Location Management",
  "product-management": "Product Management",
  settings:           "Settings",
};

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export default function App() {
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const [page, setPage] = useState("dashboard");
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["analytics"]));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: "#f0f4ff" }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setPage("dashboard")} />;
  }

  function toggleExpand(key: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function renderPage() {
    // ADMIN: All pages
    if (user?.role === "ADMIN") {
      switch (page) {
        case "dashboard":            return <AdminDashboardWithBranches />;
        case "sales":                return <Sales />;
        case "expenses":             return <Expenses />;
        case "debts":                return <Debts />;
        case "inventory":            return <Inventory />;
        case "receiving":            return <Receiving />;
        case "transfers":            return <Transfers />;
        case "branch-transfers":     return <BranchTransfers />;
        case "report-sales":         return <SalesReport />;
        case "report-branches":      return <BranchReport />;
        case "user-management":      return <UserManagement />;
        case "customer-management":  return <CustomerManagement />;
        case "location-management":  return <LocationManagement />;
        case "product-management":   return <ProductManagement />;
        default:                     return <Placeholder title={PAGE_TITLES[page] || page} />;
      }
    }

    // INVENTORY_MANAGER: Warehouse, Products, Inventory, Transfers only
    if (user?.role === "INVENTORY_MANAGER") {
      switch (page) {
        case "dashboard":            return <InventoryManagerDashboard />;
        case "inventory":            return <Inventory />;
        case "receiving":            return <Receiving />;
        default:                     return <Placeholder title="Access Denied" />;
      }
    }

    // BRANCH_MANAGER: Dashboard only (their branch dashboard)
    if (user?.role === "BRANCH_MANAGER") {
      switch (page) {
        case "dashboard":            return <BranchManagerDashboard />;
        default:                     return <Placeholder title="Access Denied" />;
      }
    }

    // BRANCH_STAFF: Dashboard only
    if (user?.role === "BRANCH_STAFF") {
      switch (page) {
        case "dashboard":            return <Dashboard />;
        default:                     return <Placeholder title="Access Denied" />;
      }
    }

    // Fallback
    return <Placeholder title="Access Denied" />;
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#f0f4ff" }}>
      {/* Desktop sidebar - always visible, uses container queries for responsiveness */}
      <div className="hidden lg:flex flex-shrink-0" style={{ width: "clamp(140px, 15vw, 180px)" }}>
        <Sidebar current={page} onNav={setPage} expanded={expanded} onToggleExpand={toggleExpand} open={true} onClose={() => {}} onLogout={logout} />
      </div>

      {/* Mobile/Tablet sidebar - slide-in overlay */}
      <div className="lg:hidden">
        <Sidebar current={page} onNav={setPage} expanded={expanded} onToggleExpand={toggleExpand} open={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={logout} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ containerType: "size" }}>
        {/* Topbar - fluid spacing */}
        <header className="flex items-center justify-between flex-shrink-0 bg-white gap-[clamp(0.5rem,1.5vw,1rem)] flex-wrap" style={{ borderBottom: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", padding: "clamp(0.5rem, 2vw, 1.25rem) clamp(0.75rem, 2vw, 1.5rem)" }}>
          <div className="flex items-center gap-[clamp(0.5rem,1.5vw,1rem)] min-w-0">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg flex-shrink-0" style={{ color: "#1e3a8a" }}>
              <MenuIcon />
            </button>
            <div className="min-w-0">
              <div className="font-bold" style={{ fontSize: "clamp(0.875rem, 2vw, 1rem)", color: "#1e3a8a" }}>{PAGE_TITLES[page] || page}</div>
              <div style={{ fontSize: "clamp(0.75rem, 1.5vw, 0.875rem)", color: "#94a3b8" }} className="hidden sm:block">Dhako</div>
            </div>
          </div>
          <div className="flex items-center gap-[clamp(0.25rem,1vw,0.75rem)] flex-wrap justify-end">
            <div className="relative hidden sm:block">
              <button className="p-2 rounded-lg" style={{ color: "#64748b" }}><BellIcon /></button>
              <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: "#dc2626" }} />
            </div>
            <div className="hidden lg:block text-xs font-semibold px-2 py-1 rounded-full" style={{ background: "#dbeafe", color: "#1d4ed8", fontSize: "clamp(0.75rem, 1.5vw, 0.875rem)" }}>
              25 Aug
            </div>
            <div className="flex items-center gap-[clamp(0.25rem,1vw,0.75rem)]">
              <div className="text-right hidden sm:block">
                <div style={{ fontSize: "clamp(0.75rem, 1.5vw, 0.875rem)", fontWeight: 600, color: "#1e3a8a" }}>{user?.name}</div>
                <div style={{ fontSize: "clamp(0.75rem, 1.5vw, 0.875rem)", color: "#64748b" }}>{user?.role.replace(/_/g, " ")}</div>
              </div>
              <div className="rounded-full flex items-center justify-center font-bold flex-shrink-0" style={{ background: "#1e3a8a", color: "#fff", width: "clamp(28px, 6vw, 36px)", height: "clamp(28px, 6vw, 36px)", fontSize: "clamp(0.75rem, 1.5vw, 1rem)" }}>{user?.name.charAt(0)}</div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto content-container" style={{ containerType: "inline-size", padding: "var(--spacing-md)" }}>
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
