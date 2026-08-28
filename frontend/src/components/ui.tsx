// Shared UI primitives for Dhako blue/white theme

export function Card({ children, className = "", style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`rounded-xl bg-white shadow-sm ${className}`} style={{ border: "1px solid #e2e8f0", ...style }}>
      {children}
    </div>
  );
}

export function KPICard({ label, value, sub, color = "#1e3a8a", icon, variant = "primary" }: { label: string; value: string; sub?: string; color?: string; icon?: string; variant?: "primary" | "blue" | "green" | "orange" }) {
  const colors: Record<string, string> = {
    primary: "#1e3a8a",
    blue: "#2563eb",
    green: "#16a34a",
    orange: "#ea580c",
  };
  
  const displayColor = color || colors[variant] || colors.primary;
  
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#94a3b8" }}>{label}</div>
          <div className="text-2xl font-bold" style={{ color: displayColor, fontVariantNumeric: "tabular-nums" }}>{value}</div>
          {sub && <div className="text-xs mt-1" style={{ color: "#94a3b8" }}>{sub}</div>}
        </div>
        {icon && <div className="text-2xl opacity-20">{icon}</div>}
      </div>
    </Card>
  );
}

export function StatusBadge({ status }: { status: "ok" | "low" | "out" }) {
  if (status === "out") return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: "#fee2e2", color: "#dc2626" }}>Out of Stock</span>;
  if (status === "low") return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: "#fef9c3", color: "#ca8a04" }}>Low Stock</span>;
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: "#dcfce7", color: "#16a34a" }}>In Stock</span>;
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#1e3a8a" }}>{title}</h1>
        {subtitle && <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Btn({ children, onClick, type = "button", variant = "primary", disabled = false, small = false }: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  small?: boolean;
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: "#1e3a8a", color: "#fff" },
    secondary: { background: "#f1f5f9", color: "#374151", border: "1px solid #e2e8f0" },
    danger: { background: "#dc2626", color: "#fff" },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg font-semibold transition-opacity hover:opacity-85 disabled:opacity-40 ${small ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"}`}
      style={styles[variant]}
    >
      {children}
    </button>
  );
}

const TYPE_META: Record<string, { bg: string; text: string; label: string }> = {
  STOCK_RECEIVED:     { bg: "#dcfce7", text: "#16a34a", label: "Received" },
  WAREHOUSE_TRANSFER: { bg: "#dbeafe", text: "#1d4ed8", label: "WH Transfer" },
  BRANCH_TRANSFER:    { bg: "#ede9fe", text: "#7c3aed", label: "To Branch" },
  SALE:               { bg: "#e0f2fe", text: "#0369a1", label: "Sale" },
  ADJUSTMENT:         { bg: "#fee2e2", text: "#dc2626", label: "Adjustment" },
  RETURN:             { bg: "#fef9c3", text: "#ca8a04", label: "Return" },
};

export function MovTypeBadge({ type }: { type: string }) {
  const m = TYPE_META[type] || { bg: "#f1f5f9", text: "#64748b", label: type };
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: m.bg, color: m.text }}>
      {m.label}
    </span>
  );
}

export function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: "#64748b", background: "#f8fafc" }}>
      {children}
    </th>
  );
}

export function Td({ children, mono = false, right = false, className = "" }: { children: React.ReactNode; mono?: boolean; right?: boolean; className?: string }) {
  return (
    <td className={`px-4 py-3 text-sm ${mono ? "font-mono" : ""} ${right ? "text-right" : ""} ${className}`} style={{ color: "#374151" }}>
      {children}
    </td>
  );
}
