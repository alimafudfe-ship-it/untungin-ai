export type Product = {
  id: string;
  name: string;
  costPrice: number;
  sellingPrice: number;
  quantitySold: number;
  stockInitial: number;
  stockRemaining: number;
  otherCost: number;
  profit: number;
  margin: number;
  marketplace?: string;
};

export type ProductRow = {
  id: string;
  user_id: string;
  name: string;
  cost_price: number | string | null;
  selling_price: number | string | null;
  quantity_sold: number | string | null;
  stock_initial: number | string | null;
  stock_remaining: number | string | null;
  other_cost: number | string | null;
  profit: number | string | null;
  margin: number | string | null;
  marketplace?: string | null;
  created_at?: string;
};

export type Profile = {
  role?: string | null;
  plan?: string | null;
  pro_until?: string | null;
  email?: string | null;
};

export type Expense = {
  id: string;
  label: string;
  category: string;
  amount: number;
  date: string;
  productId?: string | null;
  notes?: string | null;
};

export type ExpenseRow = {
  id: string;
  user_id: string;
  title?: string | null;
  label?: string | null;
  category: string | null;
  amount: number | string | null;
  expense_date?: string | null;
  date?: string | null;
  product_id?: string | null;
  notes?: string | null;
  created_at?: string;
};

export type Goal = { id: string; label: string; target: number; current: number; period: string };
export type UpgradePlan = "monthly" | "lifetime";
export type TabKey = "overview" | "products" | "cashflow" | "inventory" | "sales" | "ai" | "reports" | "marketplace" | "forecast" | "goals" | "pricing";
export type ProductFilter = "all" | "loss" | "fix" | "scale" | "stock";
export type StockMoveType = "in" | "out" | "adjust";
export type Tone = "success" | "warning" | "danger" | "blue" | "muted" | "neutral";

export type DashboardMetrics = {
  totalProfit: number;
  totalRevenue: number;
  totalUnits: number;
  totalStock: number;
  inventoryValue: number;
  totalExpenses: number;
  netCash: number;
  avgMargin: number;
  riskScore: number;
  dailyLeakEstimate: number;
  lowStockCount: number;
  outOfStockCount: number;
  lossCount: number;
};
