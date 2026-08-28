export default function Placeholder({ title, description }: { title: string; description?: string }) {
  return (
    <div className="p-6 flex flex-col items-center justify-center" style={{ minHeight: 400 }}>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4" style={{ background: "#dbeafe" }}>📋</div>
      <div className="text-lg font-bold mb-1" style={{ color: "#1e3a8a" }}>{title}</div>
      {description && <div className="text-sm" style={{ color: "#94a3b8" }}>{description}</div>}
      <div className="mt-4 px-4 py-2 rounded-full text-xs font-semibold" style={{ background: "#dbeafe", color: "#1d4ed8" }}>
        Coming soon
      </div>
    </div>
  );
}
