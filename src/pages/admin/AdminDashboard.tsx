import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, Card, KPICard } from "@/components/ui";

interface DashboardStats {
  totalUsers: number;
  adminCount: number;
  inventoryManagerCount: number;
  branchManagerCount: number;
  lastLoginTime?: string;
}

const AdminDashboard: React.FC = () => {
  const { user, getUsers } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    adminCount: 0,
    inventoryManagerCount: 0,
    branchManagerCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const users = await getUsers();
      setStats({
        totalUsers: users.length,
        adminCount: users.filter((u) => u.role === "ADMIN").length,
        inventoryManagerCount: users.filter((u) => u.role === "INVENTORY_MANAGER").length,
        branchManagerCount: users.filter((u) => u.role === "BRANCH_MANAGER").length,
        lastLoginTime: new Date().toLocaleTimeString(),
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        subtitle={`Welcome back, ${user?.name}. System overview and management.`}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Users"
          value={stats.totalUsers.toString()}
          variant="primary"
          icon="👥"
        />
        <KPICard
          label="Admins"
          value={stats.adminCount.toString()}
          variant="blue"
          icon="🔐"
        />
        <KPICard
          label="Inventory Managers"
          value={stats.inventoryManagerCount.toString()}
          variant="green"
          icon="📦"
        />
        <KPICard
          label="Branch Managers"
          value={stats.branchManagerCount.toString()}
          variant="orange"
          icon="🏢"
        />
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="#users"
            className="p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
          >
            <div className="text-2xl mb-2">👤</div>
            <h3 className="font-semibold text-gray-800 mb-1">Manage Users</h3>
            <p className="text-sm text-gray-600">Create, edit, or delete users</p>
          </a>
          <div className="p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors cursor-pointer">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="font-semibold text-gray-800 mb-1">System Logs</h3>
            <p className="text-sm text-gray-600">View system activity and logs</p>
          </div>
          <div className="p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer">
            <div className="text-2xl mb-2">⚙️</div>
            <h3 className="font-semibold text-gray-800 mb-1">Settings</h3>
            <p className="text-sm text-gray-600">Configure system settings</p>
          </div>
        </div>
      </Card>

      {/* System Status */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">System Status</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <span className="text-gray-700">API Server</span>
            </div>
            <span className="text-sm font-medium text-green-600">Running</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <span className="text-gray-700">Database</span>
            </div>
            <span className="text-sm font-medium text-green-600">Connected</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
              <span className="text-gray-700">Last Activity</span>
            </div>
            <span className="text-sm font-medium text-blue-600">{stats.lastLoginTime}</span>
          </div>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          <div className="flex items-start p-3 border-l-4 border-blue-500">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">New user created</p>
              <p className="text-xs text-gray-500">2 hours ago</p>
            </div>
          </div>
          <div className="flex items-start p-3 border-l-4 border-green-500">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">System backup completed</p>
              <p className="text-xs text-gray-500">5 hours ago</p>
            </div>
          </div>
          <div className="flex items-start p-3 border-l-4 border-orange-500">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">Inventory sync performed</p>
              <p className="text-xs text-gray-500">1 day ago</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;
