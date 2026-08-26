// ── Core domain types shared across the backend ──────────────────────────────

export type LocationType = "WAREHOUSE" | "BRANCH";

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  createdAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "ADMIN" | "STORE_MANAGER" | "BRANCH_MANAGER" | "BRANCH_STAFF";
  locationId: string | null; // null = Admin (all locations)
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  qtyPerCtn: number;
  costPerCtn: number;
  sellPerCtn: number;
  minStockCtn: number;
  status: "ACTIVE" | "INACTIVE";
  createdAt: Date;
  updatedAt: Date;
}

// inventory_levels is a derived view — never written directly
export interface InventoryLevel {
  productId: string;
  locationId: string;
  qtyCtn: number;         // cartons
  qtyUnits: number;       // qtyCtn × product.qtyPerCtn
  costValue: number;      // qtyCtn × product.costPerCtn
}

export type MovementType =
  | "STOCK_RECEIVED"
  | "WAREHOUSE_TRANSFER"
  | "BRANCH_TRANSFER"
  | "SALE"
  | "ADJUSTMENT"
  | "RETURN";

// Append-only. Never updated after creation.
export interface StockMovement {
  id: string;
  type: MovementType;
  productId: string;
  fromLocationId: string | null;   // null = Supplier or Customer
  toLocationId: string | null;
  qtyCtn: number;                  // positive = increase at destination
  costPerCtn: number;              // cost at time of movement (historical snapshot)
  referenceId: string | null;      // saleId, transferId, etc.
  reason: string | null;
  notes: string | null;
  createdBy: string;               // userId
  createdAt: Date;
}

export interface Sale {
  id: string;
  locationId: string;              // branch where sale occurred
  customerId: string | null;
  date: Date;
  createdBy: string;
  createdAt: Date;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  qtyCtn: number;
  qtyUnits: number;
  sellPricePerCtn: number;
  costPerCtnAtSale: number;        // historical cost snapshot
  lineRevenue: number;             // qtyCtn × sellPricePerCtn
  lineGrossProfit: number;         // lineRevenue − (qtyCtn × costPerCtnAtSale)
}

export interface Expense {
  id: string;
  locationId: string;
  date: Date;
  category: "TRANSPORT" | "ELECTRICITY" | "RENT" | "STAFF" | "FOOD" | "MAINTENANCE" | "SUPPLIES" | "OTHER";
  description: string;
  amount: number;
  receiptUrl: string | null;
  createdBy: string;
  createdAt: Date;
}

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  locationId: string;
}

export interface Debt {
  id: string;
  customerId: string;
  locationId: string;
  saleId: string | null;
  originalAmount: number;
  paidAmount: number;
  status: "UNPAID" | "PARTIALLY_PAID" | "PAID";
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DebtPayment {
  id: string;
  debtId: string;
  amount: number;
  notes: string | null;
  createdBy: string;
  createdAt: Date;
}

export interface Transfer {
  id: string;
  fromLocationId: string;
  toLocationId: string;
  status: "PENDING" | "APPROVED" | "SENT" | "RECEIVED" | "CANCELLED";
  requestedBy: string;
  approvedBy: string | null;
  sentAt: Date | null;
  receivedAt: Date | null;
  createdAt: Date;
}

export interface TransferItem {
  id: string;
  transferId: string;
  productId: string;
  qtyCtn: number;
}

// ── API response shapes ───────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthTokenPayload {
  userId: string;
  role: User["role"];
  locationId: string | null;
}
