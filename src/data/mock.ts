export const WAREHOUSES = ["Warehouse A", "Warehouse B", "Warehouse C"] as const;
export const BRANCHES = ["Branch 1", "Branch 2", "Branch 3"] as const;
export const ALL_LOCATIONS = [...WAREHOUSES, ...BRANCHES] as const;
export type Warehouse = (typeof WAREHOUSES)[number];
export type Branch = (typeof BRANCHES)[number];
export type Location = (typeof ALL_LOCATIONS)[number];

export type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  qtyPerCtn: number;
  costPerCtn: number;
  sellPerCtn: number;
  minStock: number;
  status: "active" | "inactive";
  stock: Record<Location, number>; // in CTN
};

export const PRODUCTS: Product[] = [
  { id: "P001", name: "Coca Cola 330ml", sku: "CC330", category: "Beverages", unit: "can", qtyPerCtn: 24, costPerCtn: 22, sellPerCtn: 30, minStock: 10, status: "active", stock: { "Warehouse A": 50, "Warehouse B": 20, "Warehouse C": 15, "Branch 1": 8, "Branch 2": 15, "Branch 3": 6 } },
  { id: "P002", name: "Mineral Water 600ml", sku: "MW600", category: "Beverages", unit: "bottle", qtyPerCtn: 24, costPerCtn: 12, sellPerCtn: 18, minStock: 15, status: "active", stock: { "Warehouse A": 30, "Warehouse B": 40, "Warehouse C": 0, "Branch 1": 5, "Branch 2": 7, "Branch 3": 12 } },
  { id: "P003", name: "Orange Juice 1L", sku: "OJ1L", category: "Beverages", unit: "carton", qtyPerCtn: 12, costPerCtn: 35, sellPerCtn: 48, minStock: 8, status: "active", stock: { "Warehouse A": 20, "Warehouse B": 0, "Warehouse C": 60, "Branch 1": 12, "Branch 2": 3, "Branch 3": 9 } },
  { id: "P004", name: "Instant Noodles", sku: "IN001", category: "Food", unit: "pack", qtyPerCtn: 40, costPerCtn: 28, sellPerCtn: 38, minStock: 12, status: "active", stock: { "Warehouse A": 80, "Warehouse B": 45, "Warehouse C": 30, "Branch 1": 20, "Branch 2": 15, "Branch 3": 18 } },
  { id: "P005", name: "Biscuits Assorted", sku: "BA001", category: "Snacks", unit: "packet", qtyPerCtn: 20, costPerCtn: 18, sellPerCtn: 26, minStock: 8, status: "active", stock: { "Warehouse A": 35, "Warehouse B": 25, "Warehouse C": 20, "Branch 1": 4, "Branch 2": 10, "Branch 3": 7 } },
  { id: "P006", name: "Cooking Oil 1L", sku: "CO1L", category: "Cooking", unit: "bottle", qtyPerCtn: 12, costPerCtn: 55, sellPerCtn: 72, minStock: 10, status: "active", stock: { "Warehouse A": 28, "Warehouse B": 18, "Warehouse C": 22, "Branch 1": 6, "Branch 2": 2, "Branch 3": 8 } },
  { id: "P007", name: "Sugar 1kg", sku: "SU1K", category: "Cooking", unit: "bag", qtyPerCtn: 10, costPerCtn: 45, sellPerCtn: 58, minStock: 8, status: "active", stock: { "Warehouse A": 40, "Warehouse B": 30, "Warehouse C": 25, "Branch 1": 8, "Branch 2": 11, "Branch 3": 5 } },
  { id: "P008", name: "Detergent Powder 1kg", sku: "DP1K", category: "Household", unit: "box", qtyPerCtn: 6, costPerCtn: 48, sellPerCtn: 65, minStock: 5, status: "active", stock: { "Warehouse A": 22, "Warehouse B": 14, "Warehouse C": 18, "Branch 1": 3, "Branch 2": 5, "Branch 3": 4 } },
  { id: "P009", name: "Sardines 425g", sku: "SA425", category: "Food", unit: "tin", qtyPerCtn: 24, costPerCtn: 60, sellPerCtn: 80, minStock: 8, status: "active", stock: { "Warehouse A": 45, "Warehouse B": 30, "Warehouse C": 35, "Branch 1": 7, "Branch 2": 9, "Branch 3": 6 } },
  { id: "P010", name: "Green Tea 25-bag", sku: "GT25", category: "Beverages", unit: "box", qtyPerCtn: 12, costPerCtn: 30, sellPerCtn: 42, minStock: 6, status: "active", stock: { "Warehouse A": 18, "Warehouse B": 12, "Warehouse C": 0, "Branch 1": 5, "Branch 2": 0, "Branch 3": 8 } },
];

export type StockMovement = {
  id: string;
  date: string;
  product: string;
  type: "STOCK_RECEIVED" | "WAREHOUSE_TRANSFER" | "BRANCH_TRANSFER" | "SALE" | "ADJUSTMENT" | "RETURN";
  from: string;
  to: string;
  ctns: number;
  user: string;
  note?: string;
};

export const MOVEMENTS: StockMovement[] = [
  { id: "TXN001", date: "2026-08-20", product: "Coca Cola 330ml", type: "STOCK_RECEIVED", from: "Supplier", to: "Warehouse A", ctns: 100, user: "Yusuf" },
  { id: "TXN002", date: "2026-08-21", product: "Coca Cola 330ml", type: "WAREHOUSE_TRANSFER", from: "Warehouse A", to: "Warehouse B", ctns: 10, user: "Yusuf" },
  { id: "TXN003", date: "2026-08-22", product: "Coca Cola 330ml", type: "BRANCH_TRANSFER", from: "Warehouse A", to: "Branch 1", ctns: 10, user: "Yusuf" },
  { id: "TXN004", date: "2026-08-23", product: "Mineral Water 600ml", type: "STOCK_RECEIVED", from: "Supplier", to: "Warehouse B", ctns: 50, user: "Yusuf" },
  { id: "TXN005", date: "2026-08-24", product: "Coca Cola 330ml", type: "SALE", from: "Branch 1", to: "Customer", ctns: 2, user: "Ali" },
  { id: "TXN006", date: "2026-08-24", product: "Orange Juice 1L", type: "BRANCH_TRANSFER", from: "Warehouse C", to: "Branch 2", ctns: 15, user: "Yusuf" },
  { id: "TXN007", date: "2026-08-25", product: "Instant Noodles", type: "SALE", from: "Branch 2", to: "Customer", ctns: 3, user: "Hassan" },
  { id: "TXN008", date: "2026-08-25", product: "Cooking Oil 1L", type: "SALE", from: "Branch 3", to: "Customer", ctns: 2, user: "Siti" },
  { id: "TXN009", date: "2026-08-25", product: "Biscuits Assorted", type: "ADJUSTMENT", from: "Branch 1", to: "—", ctns: -1, user: "Ali", note: "Damaged — display carton" },
  { id: "TXN010", date: "2026-08-26", product: "Sugar 1kg", type: "STOCK_RECEIVED", from: "Supplier", to: "Warehouse A", ctns: 30, user: "Yusuf" },
];

export type Sale = {
  id: string;
  date: string;
  branch: Branch;
  product: string;
  productId: string;
  ctns: number;
  unitType: "CTN" | "UNIT";
  sellPrice: number;
  costPrice: number;
  customer: string;
  user: string;
};

export const SALES: Sale[] = [
  { id: "S001", date: "2026-08-01", branch: "Branch 1", product: "Coca Cola 330ml", productId: "P001", ctns: 5, unitType: "CTN", sellPrice: 30, costPrice: 22, customer: "Ahmad Trading", user: "Ali" },
  { id: "S002", date: "2026-08-02", branch: "Branch 3", product: "Mineral Water 600ml", productId: "P002", ctns: 8, unitType: "CTN", sellPrice: 18, costPrice: 12, customer: "Sara Resto", user: "Siti" },
  { id: "S003", date: "2026-08-03", branch: "Branch 2", product: "Instant Noodles", productId: "P004", ctns: 10, unitType: "CTN", sellPrice: 38, costPrice: 28, customer: "Lee Bros", user: "Hassan" },
  { id: "S004", date: "2026-08-05", branch: "Branch 1", product: "Cooking Oil 1L", productId: "P006", ctns: 6, unitType: "CTN", sellPrice: 72, costPrice: 55, customer: "Walk-in", user: "Ali" },
  { id: "S005", date: "2026-08-06", branch: "Branch 3", product: "Coca Cola 330ml", productId: "P001", ctns: 12, unitType: "CTN", sellPrice: 30, costPrice: 22, customer: "Uni Canteen", user: "Siti" },
  { id: "S006", date: "2026-08-08", branch: "Branch 2", product: "Orange Juice 1L", productId: "P003", ctns: 4, unitType: "CTN", sellPrice: 48, costPrice: 35, customer: "Hotel Maju", user: "Hassan" },
  { id: "S007", date: "2026-08-10", branch: "Branch 1", product: "Biscuits Assorted", productId: "P005", ctns: 6, unitType: "CTN", sellPrice: 26, costPrice: 18, customer: "Walk-in", user: "Ali" },
  { id: "S008", date: "2026-08-12", branch: "Branch 3", product: "Sardines 425g", productId: "P009", ctns: 8, unitType: "CTN", sellPrice: 80, costPrice: 60, customer: "Restoran Baru", user: "Siti" },
  { id: "S009", date: "2026-08-14", branch: "Branch 2", product: "Sugar 1kg", productId: "P007", ctns: 5, unitType: "CTN", sellPrice: 58, costPrice: 45, customer: "Warung Pak Ali", user: "Hassan" },
  { id: "S010", date: "2026-08-15", branch: "Branch 1", product: "Coca Cola 330ml", productId: "P001", ctns: 15, unitType: "CTN", sellPrice: 30, costPrice: 22, customer: "Setia Alam Club", user: "Ali" },
  { id: "S011", date: "2026-08-17", branch: "Branch 3", product: "Detergent Powder 1kg", productId: "P008", ctns: 4, unitType: "CTN", sellPrice: 65, costPrice: 48, customer: "Homestay Indah", user: "Siti" },
  { id: "S012", date: "2026-08-18", branch: "Branch 2", product: "Mineral Water 600ml", productId: "P002", ctns: 10, unitType: "CTN", sellPrice: 18, costPrice: 12, customer: "Walk-in", user: "Hassan" },
  { id: "S013", date: "2026-08-20", branch: "Branch 1", product: "Instant Noodles", productId: "P004", ctns: 8, unitType: "CTN", sellPrice: 38, costPrice: 28, customer: "PJ Residence", user: "Ali" },
  { id: "S014", date: "2026-08-22", branch: "Branch 3", product: "Green Tea 25-bag", productId: "P010", ctns: 5, unitType: "CTN", sellPrice: 42, costPrice: 30, customer: "Dato Rizal", user: "Siti" },
  { id: "S015", date: "2026-08-23", branch: "Branch 2", product: "Cooking Oil 1L", productId: "P006", ctns: 7, unitType: "CTN", sellPrice: 72, costPrice: 55, customer: "Hospital Pakar", user: "Hassan" },
  { id: "S016", date: "2026-08-24", branch: "Branch 1", product: "Sardines 425g", productId: "P009", ctns: 6, unitType: "CTN", sellPrice: 80, costPrice: 60, customer: "Walk-in", user: "Ali" },
  { id: "S017", date: "2026-08-25", branch: "Branch 2", product: "Coca Cola 330ml", productId: "P001", ctns: 4, unitType: "CTN", sellPrice: 30, costPrice: 22, customer: "Seri Alam Market", user: "Hassan" },
  { id: "S018", date: "2026-08-25", branch: "Branch 1", product: "Orange Juice 1L", productId: "P003", ctns: 3, unitType: "CTN", sellPrice: 48, costPrice: 35, customer: "Walk-in", user: "Ali" },
];

export type Expense = {
  id: string;
  date: string;
  branch: Branch;
  category: "Transport" | "Electricity" | "Rent" | "Staff" | "Food" | "Maintenance" | "Supplies" | "Other";
  description: string;
  amount: number;
  user: string;
};

export const EXPENSES: Expense[] = [
  { id: "E001", date: "2026-08-01", branch: "Branch 1", category: "Rent", description: "Monthly rent Aug 2026", amount: 2500, user: "Ali" },
  { id: "E002", date: "2026-08-05", branch: "Branch 1", category: "Electricity", description: "TNB bill July–Aug", amount: 320, user: "Ali" },
  { id: "E003", date: "2026-08-01", branch: "Branch 2", category: "Rent", description: "Monthly rent Aug 2026", amount: 2200, user: "Hassan" },
  { id: "E004", date: "2026-08-07", branch: "Branch 2", category: "Transport", description: "Delivery van fuel", amount: 180, user: "Hassan" },
  { id: "E005", date: "2026-08-01", branch: "Branch 3", category: "Rent", description: "Monthly rent Aug 2026", amount: 3000, user: "Siti" },
  { id: "E006", date: "2026-08-10", branch: "Branch 3", category: "Staff", description: "Part-time staff wages", amount: 800, user: "Siti" },
  { id: "E007", date: "2026-08-15", branch: "Branch 1", category: "Maintenance", description: "Refrigerator repair", amount: 150, user: "Ali" },
  { id: "E008", date: "2026-08-18", branch: "Branch 2", category: "Supplies", description: "Bags and packaging", amount: 90, user: "Hassan" },
  { id: "E009", date: "2026-08-20", branch: "Branch 3", category: "Electricity", description: "TNB bill July–Aug", amount: 410, user: "Siti" },
  { id: "E010", date: "2026-08-22", branch: "Branch 1", category: "Transport", description: "Delivery petrol", amount: 120, user: "Ali" },
  { id: "E011", date: "2026-08-24", branch: "Branch 2", category: "Other", description: "Miscellaneous", amount: 60, user: "Hassan" },
  { id: "E012", date: "2026-08-25", branch: "Branch 3", category: "Maintenance", description: "AC servicing", amount: 200, user: "Siti" },
];

export type Debt = {
  id: string;
  date: string;
  branch: Branch;
  customer: string;
  reference: string;
  original: number;
  paid: number;
  status: "Unpaid" | "Partially Paid" | "Paid";
  user: string;
};

export const DEBTS: Debt[] = [
  { id: "D001", date: "2026-08-10", branch: "Branch 1", customer: "Ahmad Trading", reference: "Coca Cola 15 CTN", original: 450, paid: 0, status: "Unpaid", user: "Ali" },
  { id: "D002", date: "2026-08-12", branch: "Branch 2", customer: "Lee Bros", reference: "Instant Noodles 10 CTN", original: 380, paid: 200, status: "Partially Paid", user: "Hassan" },
  { id: "D003", date: "2026-08-14", branch: "Branch 3", customer: "Restoran Baru", reference: "Sardines 8 CTN", original: 640, paid: 640, status: "Paid", user: "Siti" },
  { id: "D004", date: "2026-08-18", branch: "Branch 1", customer: "PJ Residence", reference: "Mixed goods", original: 300, paid: 100, status: "Partially Paid", user: "Ali" },
  { id: "D005", date: "2026-08-22", branch: "Branch 2", customer: "Hospital Pakar", reference: "Cooking Oil 7 CTN", original: 504, paid: 0, status: "Unpaid", user: "Hassan" },
  { id: "D006", date: "2026-08-24", branch: "Branch 3", customer: "Dato Rizal", reference: "Green Tea + Water", original: 354, paid: 354, status: "Paid", user: "Siti" },
];

export const SALES_TREND = [
  { month: "Mar", revenue: 5800, profit: 1600 },
  { month: "Apr", revenue: 7200, profit: 2050 },
  { month: "May", revenue: 6400, profit: 1780 },
  { month: "Jun", revenue: 8900, profit: 2440 },
  { month: "Jul", revenue: 8200, profit: 2150 },
  { month: "Aug", revenue: 10600, profit: 2900 },
];

export const BRANCH_PERF = [
  { branch: "Branch 1", sales: 42600, cogs: 31200, expenses: 3090, orders: 28 },
  { branch: "Branch 2", sales: 38900, cogs: 27800, expenses: 2530, orders: 24 },
  { branch: "Branch 3", sales: 51200, cogs: 37100, expenses: 4410, orders: 32 },
];

// helpers
export function totalStockCtn(p: Product): number {
  return Object.values(p.stock).reduce((a, b) => a + b, 0);
}
export function warehouseStock(p: Product): number {
  return WAREHOUSES.reduce((s, w) => s + p.stock[w], 0);
}
export function branchStock(p: Product): number {
  return BRANCHES.reduce((s, b) => s + p.stock[b], 0);
}
export function stockStatus(ctns: number, min: number): "ok" | "low" | "out" {
  if (ctns === 0) return "out";
  if (ctns <= min) return "low";
  return "ok";
}
export function inventoryValue(products: Product[]): number {
  return products.reduce((s, p) => s + totalStockCtn(p) * p.costPerCtn, 0);
}
export function saleRevenue(s: Sale): number { return s.ctns * s.sellPrice; }
export function saleProfit(s: Sale): number { return s.ctns * (s.sellPrice - s.costPrice); }
export function fmt(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export type Transfer = {
  id: string;
  date: string;
  product: string;
  from: Location;
  to: Location;
  qty: number;
  status: "Pending" | "Approved" | "Sent" | "Received" | "Cancelled";
  requestedBy: string;
};

export const TRANSFERS: Transfer[] = [
  { id: "T001", date: "2026-08-20", product: "Coca Cola 330ml", from: "Warehouse A", to: "Branch 1", qty: 10, status: "Received", requestedBy: "Yusuf" },
  { id: "T002", date: "2026-08-21", product: "Orange Juice 1L", from: "Warehouse C", to: "Branch 2", qty: 15, status: "Received", requestedBy: "Yusuf" },
  { id: "T003", date: "2026-08-23", product: "Mineral Water 600ml", from: "Warehouse B", to: "Branch 3", qty: 8, status: "Sent", requestedBy: "Yusuf" },
  { id: "T004", date: "2026-08-24", product: "Instant Noodles", from: "Warehouse A", to: "Branch 1", qty: 12, status: "Approved", requestedBy: "Ali" },
  { id: "T005", date: "2026-08-25", product: "Coca Cola 330ml", from: "Warehouse A", to: "Branch 3", qty: 6, status: "Pending", requestedBy: "Siti" },
  { id: "T006", date: "2026-08-25", product: "Cooking Oil 1L", from: "Warehouse B", to: "Branch 2", qty: 4, status: "Pending", requestedBy: "Hassan" },
];
