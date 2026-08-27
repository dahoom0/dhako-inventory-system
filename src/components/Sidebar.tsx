// Force refresh: Sidebar updated - removed Branches, Analytics, Receive Stock
import dhakoLogo from "@/imports/WhatsApp_Image_2026-07-14_at_5.18.17_PM.jpeg";
import { useAuth, UserRole } from "@/context/AuthContext";

type Child = { label: string; page: string };
type NavItem = { icon: string; label: string; page: string; children?: Child[]; roles?: UserRole[] };

const getNavItems = (role?: UserRole): NavItem[] => {
  // ADMIN: Cleaned menu - NO Branches, Analytics, Receive Stock
  if (role === "ADMIN") {
    return [
      { icon: "⬡", label: "Dashboard", page: "dashboard", roles: ["ADMIN"] },
      { icon: "🏭", label: "Warehouses", page: "location-management", roles: ["ADMIN"] },
      { icon: "📦", label: "Products", page: "product-management", roles: ["ADMIN"] },
      { icon: "🚛", label: "Inventory", page: "inventory", roles: ["ADMIN"] },
      { icon: "🧾", label: "Sales", page: "sales", roles: ["ADMIN"] },
      { icon: "💸", label: "Expenses", page: "expenses", roles: ["ADMIN"] },
      { icon: "📋", label: "Debts", page: "debts", roles: ["ADMIN"] },
      { icon: "👤", label: "Users", page: "user-management", roles: ["ADMIN"] },
      { icon: "⚙️", label: "Settings", page: "settings", roles: ["ADMIN"] },
    ];
  }

  // INVENTORY_MANAGER: Warehouse & product management + transfers
  if (role === "INVENTORY_MANAGER") {
    return [
      { icon: "⬡", label: "Dashboard", page: "dashboard", roles: ["INVENTORY_MANAGER"] },
      { icon: "📦", label: "Inventory", page: "inventory", roles: ["INVENTORY_MANAGER"] },
    ];
  }

  // BRANCH_MANAGER: Dashboard only
  if (role === "BRANCH_MANAGER") {
    return [
      { icon: "⬡", label: "Dashboard", page: "dashboard", roles: ["BRANCH_MANAGER"] },
    ];
  }

  // Default fallback (BRANCH_STAFF or unknown)
  return [
    { icon: "⬡", label: "Dashboard", page: "dashboard", roles: ["BRANCH_STAFF"] },
  ];
};

type Props = {
  current: string;
  onNav: (page: string) => void;
  expanded: Set<string>;
  onToggleExpand: (page: string) => void;
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
};

export default function Sidebar({ current, onNav, expanded, onToggleExpand, open, onClose, onLogout }: Props) {
  const { user } = useAuth();
  const NAV = getNavItems(user?.role);
  
  const isActive = (item: NavItem) =>
    current === item.page || item.children?.some(c => c.page === current);

  function handleNav(page: string) {
    onNav(page);
    if (window.innerWidth < 768) onClose();
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-20 md:hidden" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose} />
      )}
      <aside
        className="fixed md:static inset-y-0 left-0 z-30 flex flex-col transition-transform duration-200 overflow-y-auto"
        style={{ 
          width: "min(280px, 80vw)",
          background: "#1e3a8a", 
          flexShrink: 0,
          transform: open ? "translateX(0)" : "translateX(-100%)",
          WebkitTransform: open ? "translateX(0)" : "translateX(-100%)",
          maxHeight: "100vh"
        }}
      >
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="md:hidden absolute top-4 right-4 p-2 text-white z-40"
          style={{ background: "rgba(255,255,255,0.2)", borderRadius: "0.375rem" }}
        >
          ✕
        </button>

        {/* Logo */}
        <div className="flex flex-col items-center py-4 px-3 gap-2 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
          <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0" style={{ border: "2px solid rgba(255,255,255,0.3)" }}>
            <img src={dhakoLogo} alt="Dhako Logo" className="w-full h-full object-cover" />
          </div>
          <div className="text-center">
            <div className="font-bold text-xs tracking-widest text-white">DHAKO</div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.45)", letterSpacing: "0.08em" }}>people's choice</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {NAV.map(item => {
            const active = isActive(item);
            const exp = expanded.has(item.page);
            const hasChildren = !!item.children;
            return (
              <div key={item.page}>
                <button
                  onClick={() => hasChildren ? onToggleExpand(item.page) : handleNav(item.page)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left transition-all text-sm"
                  style={{
                    color: active ? "#fff" : "rgba(255,255,255,0.6)",
                    background: active && !hasChildren ? "rgba(255,255,255,0.15)" : "transparent",
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  <span className="text-base w-5 text-center flex-shrink-0">{item.icon}</span>
                  <span className="flex-1 truncate">{item.label}</span>
                  {hasChildren && (
                    <span style={{ opacity: 0.5, fontSize: 9, transition: "transform 0.15s", transform: exp ? "rotate(0)" : "rotate(-90deg)", display: "inline-block", flexShrink: 0 }}>▼</span>
                  )}
                </button>
                {hasChildren && exp && (
                  <div className="ml-6 mr-2 mb-1 pl-2 text-xs" style={{ borderLeft: "1px solid rgba(255,255,255,0.2)" }}>
                    {item.children!.map(child => (
                      <button key={child.page} onClick={() => handleNav(child.page)}
                        className="w-full text-left px-2 py-1.5 rounded text-xs transition-all truncate"
                        style={{
                          color: current === child.page ? "#fff" : "rgba(255,255,255,0.5)",
                          background: current === child.page ? "rgba(255,255,255,0.15)" : "transparent",
                          fontWeight: current === child.page ? 600 : 400,
                        }}>
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-3 py-3 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.25)", color: "#fff" }}>{user?.name.charAt(0) || "U"}</div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate">{user?.name || "User"}</div>
              <div className="text-xs truncate" style={{ color: "rgba(255,255,255,0.6)" }}>{user?.role.replace(/_/g, " ") || "Guest"}</div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full px-2 py-2 text-xs font-semibold text-white rounded-lg transition-all hover:opacity-90"
            style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", cursor: "pointer" }}
          >
            🚪 Logout
          </button>
        </div>
      </aside>
    </>
  );
}
