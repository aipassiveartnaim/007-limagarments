/**
 * LIMA GARMENTS - Business Data Types & Models
 */

export type CustomerStatus = 'active' | 'inactive';
export type PaymentMethod = 'Cash' | 'bKash' | 'Nagad' | 'Bank' | 'Cheque';
export type ExpenseCategory =
  | 'Shop Expense'
  | 'Factory Expense'
  | 'Gas Cylinder'
  | 'Transport'
  | 'Electricity'
  | 'Salary'
  | 'Rent'
  | 'Packaging'
  | 'Maintenance'
  | 'Other';

export type StockTransactionType = 'STOCK_IN' | 'SALE' | 'ADJUSTMENT' | 'RETURN';
export type CashTransactionType =
  | 'OPENING'
  | 'SALE_PAYMENT'
  | 'CUSTOMER_PAYMENT'
  | 'EXPENSE'
  | 'SUPPLIER_PAYMENT'
  | 'OTHER_IN'
  | 'OTHER_OUT'
  | 'RETURN_REFUND';

export type ClientType = 'wholesale' | 'retail' | 'dealer' | 'market_distribution';

export interface DueFollowUp {
  id: string;
  customerId: string;
  date: string; // YYYY-MM-DD
  contactMethod: 'Phone Call' | 'In Person' | 'WhatsApp' | 'SMS';
  promisedDate?: string; // YYYY-MM-DD
  promisedAmount?: number;
  notes: string;
  status: 'pending' | 'collected' | 'rescheduled';
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  district?: string; // One of Bangladesh's 64 districts
  area?: string;     // Specific area/market/thana (e.g. Chawkbazar, Tanbazar, Islampur)
  clientType?: ClientType;
  marketName?: string;
  deliveryRoute?: string;
  creditLimit?: number;
  followUps?: DueFollowUp[];
  status: CustomerStatus;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  openingPayable?: number; // Initial money owed to this factory / supplier
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  sellingPrice: number;
  costPrice: number;
  minStockLevel: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface MemoItem {
  id: string;
  memoId: string;
  productId: string;
  productName: string;
  supplierId: string;
  supplierName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  unitCost?: number;
}

export interface Memo {
  id: string;
  memoNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerDistrict?: string;
  customerArea?: string;
  date: string; // YYYY-MM-DD
  items: MemoItem[];
  subtotal: number;
  paid: number;
  due: number;
  paymentMethod: PaymentMethod;
  notes: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  customerId: string;
  customerName: string;
  memoId?: string;
  memoNumber?: string;
  date: string; // YYYY-MM-DD
  amount: number;
  previousDue: number;
  newDue: number;
  paymentMethod: PaymentMethod;
  notes: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  name: string;
  amount: number;
  paymentMethod: PaymentMethod;
  description: string;
  createdAt: string;
}

export interface StockTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  supplierId: string;
  supplierName: string;
  productId: string;
  productName: string;
  type: StockTransactionType;
  quantity: number; // positive for addition, or unsigned with type indicator
  unitCost?: number;
  reference: string; // memo number or batch id
  notes: string;
  createdAt: string;
}

export interface CashTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: CashTransactionType;
  reference: string;
  amount: number; // positive = Cash In, negative = Cash Out
  description: string;
  createdAt: string;
}

export interface SalesReturn {
  id: string;
  memoId: string;
  memoNumber: string;
  customerId: string;
  customerName: string;
  productId: string;
  productName: string;
  supplierId: string;
  supplierName: string;
  quantity: number;
  unitPrice: number;
  refundAmount: number;
  refundMethod: 'Adjust_Due' | 'Cash_Refund';
  date: string;
  reason: string;
  createdAt: string;
}

export interface BusinessSettings {
  businessName: string;
  phone: string;
  address: string;
  currency: string;
  memoPrefix: string;
  openingCash: number;
  allowNegativeStock: boolean;
  expenseCategories: string[];
}

export interface SupplierPayment {
  id: string;
  supplierId: string;
  supplierName: string;
  date: string; // YYYY-MM-DD
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string;
  notes: string;
  createdAt: string;
}

export interface SupplierBill {
  id: string;
  supplierId: string;
  supplierName: string;
  billNumber: string;
  date: string; // YYYY-MM-DD
  amount: number;
  notes: string;
  createdAt: string;
}

export interface SupplierLedgerEntry {
  id: string;
  date: string;
  type: 'Bill' | 'Stock_Intake' | 'Payment';
  reference: string;
  description: string;
  billedAmount: number;
  paidAmount: number;
  runningBalance: number;
}

export interface AppState {
  settings: BusinessSettings;
  customers: Customer[];
  suppliers: Supplier[];
  products: Product[];
  memos: Memo[];
  payments: Payment[];
  supplierPayments?: SupplierPayment[];
  supplierBills?: SupplierBill[];
  expenses: Expense[];
  stockTransactions: StockTransaction[];
  cashTransactions: CashTransaction[];
  returns: SalesReturn[];
}

export interface StockOverviewRow {
  supplierId: string;
  supplierName: string;
  productId: string;
  productName: string;
  openingStock: number;
  stockIn: number;
  sold: number;
  currentStock: number;
  minStockLevel: number;
}

export interface CustomerLedgerEntry {
  id: string;
  date: string;
  type: 'Purchase' | 'Payment' | 'Return';
  memoNumber?: string;
  description: string;
  purchase: number;
  payment: number;
  dueCreated: number;
  runningBalance: number;
}
