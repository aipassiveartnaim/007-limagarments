/**
 * LIMA GARMENTS - Storage & Business Logic Engine
 * Persistent local database with ACID-like atomic mutations and strict accounting rules.
 */

import {
  AppState,
  BusinessSettings,
  Customer,
  Supplier,
  Product,
  Memo,
  MemoItem,
  Payment,
  Expense,
  StockTransaction,
  CashTransaction,
  SalesReturn,
  StockOverviewRow,
  CustomerLedgerEntry,
  DueFollowUp,
  ClientType,
  SupplierPayment,
  SupplierBill,
  SupplierLedgerEntry,
  PaymentMethod,
} from '../types';

export interface DistrictInfo {
  name: string;
  bnName: string;
  division: string;
  bnDivision: string;
}

export const BANGLADESH_DIVISIONS = [
  { name: 'Dhaka', bnName: 'ঢাকা' },
  { name: 'Chattogram', bnName: 'চট্টগ্রাম' },
  { name: 'Rajshahi', bnName: 'রাজশাহী' },
  { name: 'Khulna', bnName: 'খুলনা' },
  { name: 'Barishal', bnName: 'বরিশাল' },
  { name: 'Sylhet', bnName: 'সিলেট' },
  { name: 'Rangpur', bnName: 'রংপুর' },
  { name: 'Mymensingh', bnName: 'ময়মনসিংহ' },
];

export const BANGLADESH_DISTRICTS: DistrictInfo[] = [
  // Dhaka Division (13)
  { name: 'Dhaka', bnName: 'ঢাকা', division: 'Dhaka', bnDivision: 'ঢাকা' },
  { name: 'Gazipur', bnName: 'গাজীপুর', division: 'Dhaka', bnDivision: 'ঢাকা' },
  { name: 'Narayanganj', bnName: 'নারায়ণগঞ্জ', division: 'Dhaka', bnDivision: 'ঢাকা' },
  { name: 'Narsingdi', bnName: 'নরসিংদী', division: 'Dhaka', bnDivision: 'ঢাকা' },
  { name: 'Tangail', bnName: 'টাঙ্গাইল', division: 'Dhaka', bnDivision: 'ঢাকা' },
  { name: 'Kishoreganj', bnName: 'কিশোরগঞ্জ', division: 'Dhaka', bnDivision: 'ঢাকা' },
  { name: 'Manikganj', bnName: 'মানিকগঞ্জ', division: 'Dhaka', bnDivision: 'ঢাকা' },
  { name: 'Munshiganj', bnName: 'মুন্সীগঞ্জ', division: 'Dhaka', bnDivision: 'ঢাকা' },
  { name: 'Faridpur', bnName: 'ফরিদপুর', division: 'Dhaka', bnDivision: 'ঢাকা' },
  { name: 'Gopalganj', bnName: 'গোপালগঞ্জ', division: 'Dhaka', bnDivision: 'ঢাকা' },
  { name: 'Madaripur', bnName: 'মাদারীপুর', division: 'Dhaka', bnDivision: 'ঢাকা' },
  { name: 'Rajbari', bnName: 'রাজবাড়ী', division: 'Dhaka', bnDivision: 'ঢাকা' },
  { name: 'Shariatpur', bnName: 'শরীয়তপুর', division: 'Dhaka', bnDivision: 'ঢাকা' },

  // Chattogram Division (11)
  { name: 'Chattogram', bnName: 'চট্টগ্রাম', division: 'Chattogram', bnDivision: 'চট্টগ্রাম' },
  { name: 'Cox\'s Bazar', bnName: 'কক্সবাজার', division: 'Chattogram', bnDivision: 'চট্টগ্রাম' },
  { name: 'Cumilla', bnName: 'কুমিল্লা', division: 'Chattogram', bnDivision: 'চট্টগ্রাম' },
  { name: 'Feni', bnName: 'ফেনী', division: 'Chattogram', bnDivision: 'চট্টগ্রাম' },
  { name: 'Brahmanbaria', bnName: 'ব্রাহ্মণবাড়িয়া', division: 'Chattogram', bnDivision: 'চট্টগ্রাম' },
  { name: 'Noakhali', bnName: 'নোয়াখালী', division: 'Chattogram', bnDivision: 'চট্টগ্রাম' },
  { name: 'Chandpur', bnName: 'চাঁদপুর', division: 'Chattogram', bnDivision: 'চট্টগ্রাম' },
  { name: 'Lakshmipur', bnName: 'লক্ষ্মীপুর', division: 'Chattogram', bnDivision: 'চট্টগ্রাম' },
  { name: 'Rangamati', bnName: 'রাঙ্গামাটি', division: 'Chattogram', bnDivision: 'চট্টগ্রাম' },
  { name: 'Khagrachhari', bnName: 'খাগড়াছড়ি', division: 'Chattogram', bnDivision: 'চট্টগ্রাম' },
  { name: 'Bandarban', bnName: 'বান্দরবান', division: 'Chattogram', bnDivision: 'চট্টগ্রাম' },

  // Rajshahi Division (8)
  { name: 'Rajshahi', bnName: 'রাজশাহী', division: 'Rajshahi', bnDivision: 'রাজশাহী' },
  { name: 'Bogura', bnName: 'বগুড়া', division: 'Rajshahi', bnDivision: 'রাজশাহী' },
  { name: 'Pabna', bnName: 'পাবনা', division: 'Rajshahi', bnDivision: 'রাজশাহী' },
  { name: 'Sirajganj', bnName: 'সিরাজগঞ্জ', division: 'Rajshahi', bnDivision: 'রাজশাহী' },
  { name: 'Naogaon', bnName: 'নওগাঁ', division: 'Rajshahi', bnDivision: 'রাজশাহী' },
  { name: 'Natore', bnName: 'নাটোর', division: 'Rajshahi', bnDivision: 'রাজশাহী' },
  { name: 'Chapainawabganj', bnName: 'চাঁপাইনবাবগঞ্জ', division: 'Rajshahi', bnDivision: 'রাজশাহী' },
  { name: 'Joypurhat', bnName: 'জয়পুরহাট', division: 'Rajshahi', bnDivision: 'রাজশাহী' },

  // Khulna Division (10)
  { name: 'Khulna', bnName: 'খুলনা', division: 'Khulna', bnDivision: 'খুলনা' },
  { name: 'Jashore', bnName: 'যশোর', division: 'Khulna', bnDivision: 'খুলনা' },
  { name: 'Kushtia', bnName: 'কুষ্টিয়া', division: 'Khulna', bnDivision: 'খুলনা' },
  { name: 'Jhenaidah', bnName: 'ঝিনাইদহ', division: 'Khulna', bnDivision: 'খুলনা' },
  { name: 'Satkhira', bnName: 'সাতক্ষীরা', division: 'Khulna', bnDivision: 'খুলনা' },
  { name: 'Bagerhat', bnName: 'বাগেরহাট', division: 'Khulna', bnDivision: 'খুলনা' },
  { name: 'Chuadanga', bnName: 'চুয়াডাঙ্গা', division: 'Khulna', bnDivision: 'খুলনা' },
  { name: 'Meherpur', bnName: 'মেহেরপুর', division: 'Khulna', bnDivision: 'খুলনা' },
  { name: 'Narail', bnName: 'নড়াইল', division: 'Khulna', bnDivision: 'খুলনা' },
  { name: 'Magura', bnName: 'মাগুরা', division: 'Khulna', bnDivision: 'খুলনা' },

  // Barishal Division (6)
  { name: 'Barishal', bnName: 'বরিশাল', division: 'Barishal', bnDivision: 'বরিশাল' },
  { name: 'Bhola', bnName: 'ভোলা', division: 'Barishal', bnDivision: 'বরিশাল' },
  { name: 'Patuakhali', bnName: 'পটুয়াখালী', division: 'Barishal', bnDivision: 'বরিশাল' },
  { name: 'Pirojpur', bnName: 'পিরোজপুর', division: 'Barishal', bnDivision: 'বরিশাল' },
  { name: 'Barguna', bnName: 'বরগুনা', division: 'Barishal', bnDivision: 'বরিশাল' },
  { name: 'Jhalokathi', bnName: 'ঝালকাঠি', division: 'Barishal', bnDivision: 'বরিশাল' },

  // Sylhet Division (4)
  { name: 'Sylhet', bnName: 'সিলেট', division: 'Sylhet', bnDivision: 'সিলেট' },
  { name: 'Moulvibazar', bnName: 'মৌলভীবাজার', division: 'Sylhet', bnDivision: 'সিলেট' },
  { name: 'Habiganj', bnName: 'হবিগঞ্জ', division: 'Sylhet', bnDivision: 'সিলেট' },
  { name: 'Sunamganj', bnName: 'সুনামগঞ্জ', division: 'Sylhet', bnDivision: 'সিলেট' },

  // Rangpur Division (8)
  { name: 'Rangpur', bnName: 'রংপুর', division: 'Rangpur', bnDivision: 'রংপুর' },
  { name: 'Dinajpur', bnName: 'দিনাজপুর', division: 'Rangpur', bnDivision: 'রংপুর' },
  { name: 'Kurigram', bnName: 'কুড়িগ্রাম', division: 'Rangpur', bnDivision: 'রংপুর' },
  { name: 'Gaibandha', bnName: 'গাইবান্ধা', division: 'Rangpur', bnDivision: 'রংপুর' },
  { name: 'Nilphamari', bnName: 'নীলফামারী', division: 'Rangpur', bnDivision: 'রংপুর' },
  { name: 'Panchagarh', bnName: 'পঞ্চগড়', division: 'Rangpur', bnDivision: 'রংপুর' },
  { name: 'Thakurgaon', bnName: 'ঠাকুরগাঁও', division: 'Rangpur', bnDivision: 'রংপুর' },
  { name: 'Lalmonirhat', bnName: 'লালমনিরহাট', division: 'Rangpur', bnDivision: 'রংপুর' },

  // Mymensingh Division (4)
  { name: 'Mymensingh', bnName: 'ময়মনসিংহ', division: 'Mymensingh', bnDivision: 'ময়মনসিংহ' },
  { name: 'Jamalpur', bnName: 'জামালপুর', division: 'Mymensingh', bnDivision: 'ময়মনসিংহ' },
  { name: 'Netrokona', bnName: 'নেত্রকোণা', division: 'Mymensingh', bnDivision: 'ময়মনসিংহ' },
  { name: 'Sherpur', bnName: 'শেরপুর', division: 'Mymensingh', bnDivision: 'ময়মনসিংহ' },
];

const STORAGE_KEY = 'LIMA_GARMENTS_BUSINESS_DB_V3';

export const DEFAULT_SETTINGS: BusinessSettings = {
  businessName: 'LIMA GARMENTS',
  phone: '+880 1712-345678',
  address: 'Shop #42, 2nd Floor, Bango Islamia Super Market, Gulistan, Dhaka',
  currency: '৳',
  memoPrefix: 'MEMO-',
  openingCash: 0,
  allowNegativeStock: false,
  expenseCategories: [
    'Shop Expense',
    'Factory Expense',
    'Gas Cylinder',
    'Transport',
    'Electricity',
    'Salary',
    'Rent',
    'Packaging',
    'Maintenance',
    'Other',
  ],
};

const getTodayString = () => new Date().toISOString().split('T')[0];

export const INITIAL_DATA: AppState = {
  settings: DEFAULT_SETTINGS,
  customers: [],
  suppliers: [
    {
      id: 'sup-1',
      name: '007 Factory',
      phone: '',
      address: '',
      openingPayable: 0,
      status: 'active',
      createdAt: getTodayString(),
    },
  ],
  products: [],
  memos: [],
  payments: [],
  supplierPayments: [],
  supplierBills: [],
  expenses: [],
  stockTransactions: [],
  cashTransactions: [],
  returns: [],
};

// ----------------- Persistent Storage API -----------------

export function loadAppState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      try {
        localStorage.removeItem('LIMA_GARMENTS_BUSINESS_DB_V2');
        localStorage.removeItem('LIMA_GARMENTS_BUSINESS_DB_V1');
      } catch (_) {}
      saveAppState(INITIAL_DATA);
      return INITIAL_DATA;
    }
    const parsed = JSON.parse(raw);

    // Auto-purge all dummy data
    const PURGE_FLAG = 'LIMA_GARMENTS_DUMMY_PURGED_V3';
    const isPurged = localStorage.getItem(PURGE_FLAG);
    if (!isPurged) {
      try {
        localStorage.setItem(PURGE_FLAG, 'true');
      } catch (_) {}

      const dummyCustomerIds = ['cust-1', 'cust-2', 'cust-3', 'cust-4', 'cust-5', 'cust-6'];
      const dummyProductIds = ['prod-1', 'prod-2', 'prod-3', 'prod-4', 'prod-5'];
      const dummySupplierIds = ['sup-2', 'sup-3', 'sup-4', 'sup-5'];
      const dummyStockTxIds = ['st-init-1', 'st-init-2', 'st-init-3'];

      parsed.customers = (parsed.customers || []).filter((c: any) => !dummyCustomerIds.includes(c.id));
      parsed.products = (parsed.products || []).filter((p: any) => !dummyProductIds.includes(p.id));
      parsed.suppliers = (parsed.suppliers || [])
        .filter((s: any) => !dummySupplierIds.includes(s.id))
        .map((s: any) => (s.id === 'sup-1' ? { ...s, openingPayable: 0, phone: '', address: '' } : s));

      if (parsed.suppliers.length === 0) {
        parsed.suppliers = INITIAL_DATA.suppliers;
      }

      parsed.stockTransactions = (parsed.stockTransactions || []).filter(
        (st: any) => !dummyStockTxIds.includes(st.id) && st.type !== 'SALE'
      );
      parsed.cashTransactions = (parsed.cashTransactions || []).filter(
        (ct: any) => ct.id !== 'ct-init-1' && ct.reference !== 'CASH-OPEN-2026'
      );

      parsed.memos = [];
      parsed.expenses = [];
      parsed.payments = [];
      parsed.supplierPayments = [];
      parsed.supplierBills = [];
      parsed.returns = [];
      if (parsed.settings) {
        parsed.settings.openingCash = 0;
      }
    }

    const parsedCustomers = (parsed.customers || []).map((c: any) => ({
      ...c,
      district: c.district || 'Dhaka',
      area: c.area || '',
    }));

    const state: AppState = {
      ...INITIAL_DATA,
      ...parsed,
      customers: parsedCustomers,
      suppliers: parsed.suppliers && parsed.suppliers.length > 0 ? parsed.suppliers : INITIAL_DATA.suppliers,
      products: parsed.products || [],
      memos: parsed.memos || [],
      payments: parsed.payments || [],
      expenses: parsed.expenses || [],
      stockTransactions: parsed.stockTransactions || [],
      cashTransactions: parsed.cashTransactions || [],
      supplierPayments: parsed.supplierPayments || [],
      supplierBills: parsed.supplierBills || [],
      returns: parsed.returns || [],
      settings: {
        ...DEFAULT_SETTINGS,
        ...(parsed.settings || {}),
        openingCash: parsed.settings?.openingCash || 0,
      },
    };

    if (!isPurged) {
      saveAppState(state);
    }

    return state;
  } catch (err) {
    console.error('Failed to parse database from localStorage:', err);
    return INITIAL_DATA;
  }
}

export function saveAppState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save state to localStorage:', err);
  }
}

// ----------------- Business Math & Calculations -----------------

/**
 * Cash in hand calculation:
 * Formula:
 * Opening Cash
 * + Customer Payments (both initial memo down payments AND subsequent customer due payments)
 * + Other Cash In
 * − Expenses
 * − Cash Refunds (if any)
 * − Other Cash Out
 * = Current Cash In Hand
 * NOTE: Sales made on credit must NEVER be counted as cash received!
 */
export function calculateCashInHand(state: AppState, asOfDate?: string): {
  openingCash: number;
  customerPayments: number;
  otherCashIn: number;
  expenses: number;
  cashRefunds: number;
  otherCashOut: number;
  totalCashInHand: number;
} {
  const openingCash = Number(state.settings.openingCash) || 0;

  let customerPayments = 0;
  let otherCashIn = 0;
  let expenses = 0;
  let cashRefunds = 0;
  let otherCashOut = 0;

  // Scan cash_transactions for absolute source-of-truth accuracy
  state.cashTransactions.forEach((tx) => {
    if (asOfDate && tx.date > asOfDate) return;

    if (tx.type === 'OPENING') {
      // already counted in openingCash if configured, or captured if different
    } else if (tx.type === 'SALE_PAYMENT' || tx.type === 'CUSTOMER_PAYMENT') {
      customerPayments += Math.max(0, tx.amount);
    } else if (tx.type === 'OTHER_IN') {
      otherCashIn += Math.max(0, tx.amount);
    } else if (tx.type === 'EXPENSE') {
      expenses += Math.abs(tx.amount);
    } else if (tx.type === 'RETURN_REFUND') {
      cashRefunds += Math.abs(tx.amount);
    } else if (tx.type === 'OTHER_OUT' || tx.type === 'SUPPLIER_PAYMENT') {
      otherCashOut += Math.abs(tx.amount);
    }
  });

  const totalCashInHand =
    openingCash + customerPayments + otherCashIn - expenses - cashRefunds - otherCashOut;

  return {
    openingCash,
    customerPayments,
    otherCashIn,
    expenses,
    cashRefunds,
    otherCashOut,
    totalCashInHand,
  };
}

/**
 * Calculates stock for a specific product and supplier
 */
export function getSupplierProductStock(
  state: AppState,
  supplierId: string,
  productId: string
): number {
  let stock = 0;
  state.stockTransactions.forEach((tx) => {
    if (tx.supplierId === supplierId && tx.productId === productId) {
      if (tx.type === 'STOCK_IN' || tx.type === 'RETURN') {
        stock += tx.quantity;
      } else if (tx.type === 'SALE') {
        stock -= tx.quantity;
      } else if (tx.type === 'ADJUSTMENT') {
        stock += tx.quantity; // can be signed
      }
    }
  });
  return stock;
}

/**
 * Calculates total stock for a product across all suppliers
 */
export function getProductTotalStock(state: AppState, productId: string): number {
  let stock = 0;
  state.stockTransactions.forEach((tx) => {
    if (tx.productId === productId) {
      if (tx.type === 'STOCK_IN' || tx.type === 'RETURN') {
        stock += tx.quantity;
      } else if (tx.type === 'SALE') {
        stock -= tx.quantity;
      } else if (tx.type === 'ADJUSTMENT') {
        stock += tx.quantity;
      }
    }
  });
  return stock;
}

/**
 * Generates the multi-supplier stock dashboard rows
 */
export function getStockDashboardData(
  state: AppState,
  supplierFilter?: string,
  productFilter?: string
): StockOverviewRow[] {
  const rows: StockOverviewRow[] = [];

  // Group by (supplierId, productId)
  const map = new Map<
    string,
    {
      supplierId: string;
      supplierName: string;
      productId: string;
      productName: string;
      stockIn: number;
      sold: number;
      returns: number;
      currentStock: number;
    }
  >();

  // Ensure all combinations with stock or in catalogs exist
  state.suppliers.forEach((sup) => {
    state.products.forEach((prod) => {
      const key = `${sup.id}__${prod.id}`;
      map.set(key, {
        supplierId: sup.id,
        supplierName: sup.name,
        productId: prod.id,
        productName: prod.name,
        stockIn: 0,
        sold: 0,
        returns: 0,
        currentStock: 0,
      });
    });
  });

  state.stockTransactions.forEach((tx) => {
    const key = `${tx.supplierId}__${tx.productId}`;
    let item = map.get(key);
    if (!item) {
      item = {
        supplierId: tx.supplierId,
        supplierName: tx.supplierName,
        productId: tx.productId,
        productName: tx.productName,
        stockIn: 0,
        sold: 0,
        returns: 0,
        currentStock: 0,
      };
      map.set(key, item);
    }

    if (tx.type === 'STOCK_IN') {
      item.stockIn += tx.quantity;
      item.currentStock += tx.quantity;
    } else if (tx.type === 'SALE') {
      item.sold += tx.quantity;
      item.currentStock -= tx.quantity;
    } else if (tx.type === 'RETURN') {
      item.returns += tx.quantity;
      item.currentStock += tx.quantity;
    } else if (tx.type === 'ADJUSTMENT') {
      item.currentStock += tx.quantity;
    }
  });

  map.forEach((item) => {
    if (supplierFilter && supplierFilter !== 'all' && item.supplierId !== supplierFilter) return;
    if (productFilter && productFilter !== 'all' && item.productId !== productFilter) return;

    // Only show rows that either have non-zero stock or activity
    if (item.stockIn > 0 || item.sold > 0 || item.currentStock > 0) {
      const prod = state.products.find((p) => p.id === item.productId);
      rows.push({
        supplierId: item.supplierId,
        supplierName: item.supplierName,
        productId: item.productId,
        productName: item.productName,
        openingStock: 0, // Opening base baseline
        stockIn: item.stockIn,
        sold: item.sold,
        currentStock: item.currentStock,
        minStockLevel: prod ? prod.minStockLevel : 20,
      });
    }
  });

  return rows.sort((a, b) => a.supplierName.localeCompare(b.supplierName));
}

/**
 * Customer Due & Financial Summary
 */
export function getCustomerStats(
  customer: Customer,
  state: AppState
): {
  totalPurchase: number;
  totalPaid: number;
  currentDue: number;
  lastPurchaseDate: string | null;
  lastPaymentDate: string | null;
  memoCount: number;
} {
  const customerMemos = state.memos.filter((m) => m.customerId === customer.id);
  const customerPayments = state.payments.filter((p) => p.customerId === customer.id);
  const customerReturns = state.returns.filter(
    (r) => r.customerId === customer.id && r.refundMethod === 'Adjust_Due'
  );

  let totalPurchase = 0;
  let totalPaidAtMemo = 0;
  let lastPurchaseDate: string | null = null;

  customerMemos.forEach((m) => {
    totalPurchase += m.subtotal;
    totalPaidAtMemo += m.paid;
    if (!lastPurchaseDate || m.date > lastPurchaseDate) {
      lastPurchaseDate = m.date;
    }
  });

  // Calculate distinct payments entered via Payment Entry
  // Note: when a memo is saved, if paid > 0, an automatic payment is also logged.
  // To avoid double-counting, we sum actual recorded payments:
  let totalPaid = 0;
  let lastPaymentDate: string | null = null;

  customerPayments.forEach((p) => {
    totalPaid += p.amount;
    if (!lastPaymentDate || p.date > lastPaymentDate) {
      lastPaymentDate = p.date;
    }
  });

  // In case memos exist with paid amount but no separate payment record:
  if (customerPayments.length === 0) {
    totalPaid = totalPaidAtMemo;
  }

  // Deduct returns that adjusted due:
  const dueReducedByReturns = customerReturns.reduce((sum, r) => sum + r.refundAmount, 0);

  const currentDue = Math.max(0, totalPurchase - totalPaid - dueReducedByReturns);

  return {
    totalPurchase,
    totalPaid,
    currentDue,
    lastPurchaseDate,
    lastPaymentDate,
    memoCount: customerMemos.length,
  };
}

/**
 * Generates an unalterable chronological Customer Due Ledger
 */
export function getCustomerLedger(customerId: string, state: AppState): CustomerLedgerEntry[] {
  interface RawEntry {
    date: string;
    createdAt: string;
    type: 'Purchase' | 'Payment' | 'Return';
    memoNumber?: string;
    description: string;
    purchase: number;
    payment: number;
    dueCreated: number;
  }

  const entries: RawEntry[] = [];

  // Memos
  state.memos
    .filter((m) => m.customerId === customerId)
    .forEach((m) => {
      entries.push({
        date: m.date,
        createdAt: m.createdAt,
        type: 'Purchase',
        memoNumber: m.memoNumber,
        description: `Sale Memo #${m.memoNumber} (${m.items.length} items)`,
        purchase: m.subtotal,
        payment: 0,
        dueCreated: m.subtotal,
      });

      // If initial payment was made with memo, add payment entry
      if (m.paid > 0) {
        entries.push({
          date: m.date,
          createdAt: m.createdAt + '-pay',
          type: 'Payment',
          memoNumber: m.memoNumber,
          description: `Down payment at Memo #${m.memoNumber} (${m.paymentMethod})`,
          purchase: 0,
          payment: m.paid,
          dueCreated: 0,
        });
      }
    });

  // Separate Payments
  state.payments
    .filter((p) => p.customerId === customerId)
    .forEach((p) => {
      // Don't duplicate initial memo down-payments if they share reference
      const isMemoDownPayment =
        p.notes && p.notes.includes('Memo sale') && entries.some((e) => e.createdAt === p.createdAt);
      if (!isMemoDownPayment && !p.notes?.includes('Down payment at Memo #')) {
        entries.push({
          date: p.date,
          createdAt: p.createdAt,
          type: 'Payment',
          memoNumber: p.memoNumber,
          description: `Payment received (${p.paymentMethod})${p.notes ? ' - ' + p.notes : ''}`,
          purchase: 0,
          payment: p.amount,
          dueCreated: 0,
        });
      }
    });

  // Returns
  state.returns
    .filter((r) => r.customerId === customerId)
    .forEach((r) => {
      if (r.refundMethod === 'Adjust_Due') {
        entries.push({
          date: r.date,
          createdAt: r.createdAt,
          type: 'Return',
          memoNumber: r.memoNumber,
          description: `Return for Memo #${r.memoNumber}: ${r.quantity}x ${r.productName} (Due reduced)`,
          purchase: -r.refundAmount,
          payment: 0,
          dueCreated: -r.refundAmount,
        });
      }
    });

  // Sort chronologically
  entries.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.createdAt.localeCompare(b.createdAt);
  });

  // Calculate Running Balance
  let runningBalance = 0;
  return entries.map((entry, index) => {
    runningBalance += entry.purchase - entry.payment;
    return {
      id: `led-${index + 1}`,
      date: entry.date,
      type: entry.type,
      memoNumber: entry.memoNumber,
      description: entry.description,
      purchase: entry.purchase,
      payment: entry.payment,
      dueCreated: entry.dueCreated,
      runningBalance: Math.max(0, runningBalance),
    };
  });
}

// ----------------- Customer Area / District Analytics -----------------

export interface DistrictSummary {
  district: string;
  bnDistrict: string;
  division: string;
  bnDivision: string;
  customerCount: number;
  totalPurchase: number;
  totalPaid: number;
  totalDue: number;
  areas: string[];
  customers: Customer[];
}

export interface AreaSummary {
  area: string;
  district: string;
  customerCount: number;
  totalPurchase: number;
  totalPaid: number;
  totalDue: number;
  customers: Customer[];
}

export function getCustomerAreaStats(state: AppState): {
  totalCoveredDistricts: number;
  totalCoveredAreas: number;
  districtSummaries: DistrictSummary[];
  areaSummaries: AreaSummary[];
  topDistrictByCustomers: DistrictSummary | null;
  topDistrictBySales: DistrictSummary | null;
  topDistrictByDue: DistrictSummary | null;
} {
  const districtMap = new Map<string, DistrictSummary>();
  const areaMap = new Map<string, AreaSummary>();

  state.customers.forEach((cust) => {
    const distName = cust.district || 'Dhaka';
    const distInfo = BANGLADESH_DISTRICTS.find((d) => d.name === distName) || {
      name: distName,
      bnName: distName,
      division: 'Dhaka',
      bnDivision: 'ঢাকা',
    };

    const stats = getCustomerStats(cust, state);

    // District accumulation
    let dSummary = districtMap.get(distName);
    if (!dSummary) {
      dSummary = {
        district: distInfo.name,
        bnDistrict: distInfo.bnName,
        division: distInfo.division,
        bnDivision: distInfo.bnDivision,
        customerCount: 0,
        totalPurchase: 0,
        totalPaid: 0,
        totalDue: 0,
        areas: [],
        customers: [],
      };
      districtMap.set(distName, dSummary);
    }

    dSummary.customerCount += 1;
    dSummary.totalPurchase += stats.totalPurchase;
    dSummary.totalPaid += stats.totalPaid;
    dSummary.totalDue += stats.currentDue;
    dSummary.customers.push(cust);
    if (cust.area && !dSummary.areas.includes(cust.area)) {
      dSummary.areas.push(cust.area);
    }

    // Area accumulation
    const areaName = cust.area || 'General';
    const areaKey = `${distName}__${areaName}`;
    let aSummary = areaMap.get(areaKey);
    if (!aSummary) {
      aSummary = {
        area: areaName,
        district: distName,
        customerCount: 0,
        totalPurchase: 0,
        totalPaid: 0,
        totalDue: 0,
        customers: [],
      };
      areaMap.set(areaKey, aSummary);
    }
    aSummary.customerCount += 1;
    aSummary.totalPurchase += stats.totalPurchase;
    aSummary.totalPaid += stats.totalPaid;
    aSummary.totalDue += stats.currentDue;
    aSummary.customers.push(cust);
  });

  const districtSummaries = Array.from(districtMap.values()).sort(
    (a, b) => b.customerCount - a.customerCount
  );
  const areaSummaries = Array.from(areaMap.values()).sort(
    (a, b) => b.customerCount - a.customerCount
  );

  const topDistrictByCustomers = districtSummaries.length > 0 ? districtSummaries[0] : null;
  const topDistrictBySales =
    [...districtSummaries].sort((a, b) => b.totalPurchase - a.totalPurchase)[0] || null;
  const topDistrictByDue =
    [...districtSummaries].sort((a, b) => b.totalDue - a.totalDue)[0] || null;

  return {
    totalCoveredDistricts: districtSummaries.length,
    totalCoveredAreas: areaSummaries.length,
    districtSummaries,
    areaSummaries,
    topDistrictByCustomers,
    topDistrictBySales,
    topDistrictByDue,
  };
}

// ----------------- Atomic Mutation Actions -----------------

export interface CreateMemoInput {
  memoNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerDistrict?: string;
  customerArea?: string;
  date: string;
  items: Array<{
    productId: string;
    productName: string;
    supplierId: string;
    supplierName: string;
    quantity: number;
    unitPrice: number;
    total: number;
    unitCost?: number;
  }>;
  subtotal: number;
  paid: number;
  due: number;
  paymentMethod: BusinessSettings extends any ? any : string;
  notes: string;
}

export function createMemoTransaction(state: AppState, input: CreateMemoInput): AppState {
  // 1. Check stock for each line item if negative stock is disallowed
  if (!state.settings.allowNegativeStock) {
    for (const item of input.items) {
      if (item.quantity <= 0) continue;
      const currentStock = getSupplierProductStock(state, item.supplierId, item.productId);
      if (currentStock < item.quantity) {
        throw new Error(
          `Insufficient stock for "${item.productName}" from factory "${item.supplierName}". Available: ${currentStock} pcs, Requested: ${item.quantity} pcs.`
        );
      }
    }
  }

  // 2. Prepare Memo Record
  const now = new Date().toISOString();
  const memoId = `memo-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const memoItems: MemoItem[] = input.items.map((it, idx) => ({
    id: `mitem-${memoId}-${idx + 1}`,
    memoId,
    productId: it.productId,
    productName: it.productName,
    supplierId: it.supplierId,
    supplierName: it.supplierName,
    quantity: it.quantity,
    unitPrice: it.unitPrice,
    total: it.total,
    unitCost: it.unitCost,
  }));

  const newMemo: Memo = {
    id: memoId,
    memoNumber: input.memoNumber,
    customerId: input.customerId,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerDistrict: input.customerDistrict || 'Dhaka',
    customerArea: input.customerArea || '',
    date: input.date,
    items: memoItems,
    subtotal: input.subtotal,
    paid: input.paid,
    due: input.due,
    paymentMethod: input.paymentMethod,
    notes: input.notes,
    createdAt: now,
  };

  // 3. Stock Out Transactions (reduce stock automatically for items with qty > 0)
  const newStockTransactions: StockTransaction[] = input.items
    .filter((it) => it.quantity > 0)
    .map((it, idx) => ({
    id: `st-sale-${memoId}-${idx + 1}`,
    date: input.date,
    supplierId: it.supplierId,
    supplierName: it.supplierName,
    productId: it.productId,
    productName: it.productName,
    type: 'SALE',
    quantity: it.quantity,
    unitCost: it.unitCost,
    reference: input.memoNumber,
    notes: `Sale to ${input.customerName} via Memo #${input.memoNumber}`,
    createdAt: now,
  }));

  // 4. Cash Transaction (if paid > 0)
  const newCashTransactions: CashTransaction[] = [];
  const newPayments: Payment[] = [];

  if (input.paid > 0) {
    newCashTransactions.push({
      id: `ct-sale-${memoId}`,
      date: input.date,
      type: 'SALE_PAYMENT',
      reference: input.memoNumber,
      amount: input.paid,
      description: `Collection from Memo #${input.memoNumber} (${input.customerName})`,
      createdAt: now,
    });

    // Also add to payments table so history is 100% unified
    newPayments.push({
      id: `pay-memo-${memoId}`,
      customerId: input.customerId,
      customerName: input.customerName,
      memoId,
      memoNumber: input.memoNumber,
      date: input.date,
      amount: input.paid,
      previousDue: input.subtotal,
      newDue: input.due,
      paymentMethod: input.paymentMethod,
      notes: `Down payment at Memo #${input.memoNumber}`,
      createdAt: now,
    });
  }

  // 5. Ensure customer exists or update
  let updatedCustomers = [...state.customers];
  const existingCustIndex = updatedCustomers.findIndex((c) => c.id === input.customerId);
  if (existingCustIndex < 0) {
    updatedCustomers.push({
      id: input.customerId,
      name: input.customerName,
      phone: input.customerPhone,
      district: input.customerDistrict || 'Dhaka',
      area: input.customerArea || '',
      address: '',
      status: 'active',
      createdAt: input.date,
    });
  } else {
    updatedCustomers[existingCustIndex] = {
      ...updatedCustomers[existingCustIndex],
      phone: input.customerPhone || updatedCustomers[existingCustIndex].phone,
      district: input.customerDistrict || updatedCustomers[existingCustIndex].district || 'Dhaka',
      area: input.customerArea !== undefined && input.customerArea !== '' ? input.customerArea : updatedCustomers[existingCustIndex].area,
    };
  }

  const nextState: AppState = {
    ...state,
    customers: updatedCustomers,
    memos: [newMemo, ...state.memos],
    stockTransactions: [...state.stockTransactions, ...newStockTransactions],
    cashTransactions: [...state.cashTransactions, ...newCashTransactions],
    payments: [...state.payments, ...newPayments],
  };

  saveAppState(nextState);
  return nextState;
}

export function createPaymentTransaction(
  state: AppState,
  input: {
    customerId: string;
    date: string;
    amount: number;
    paymentMethod: BusinessSettings extends any ? any : string;
    notes: string;
  }
): AppState {
  const customer = state.customers.find((c) => c.id === input.customerId);
  if (!customer) throw new Error('Customer not found');

  const stats = getCustomerStats(customer, state);
  const previousDue = stats.currentDue;
  const newDue = Math.max(0, previousDue - input.amount);

  const now = new Date().toISOString();
  const paymentId = `pay-${Date.now()}`;

  const newPayment: Payment = {
    id: paymentId,
    customerId: customer.id,
    customerName: customer.name,
    date: input.date,
    amount: input.amount,
    previousDue,
    newDue,
    paymentMethod: input.paymentMethod,
    notes: input.notes,
    createdAt: now,
  };

  const newCashTransaction: CashTransaction = {
    id: `ct-pay-${paymentId}`,
    date: input.date,
    type: 'CUSTOMER_PAYMENT',
    reference: `PAY-${customer.name.substring(0, 3).toUpperCase()}`,
    amount: input.amount,
    description: `Due payment received from ${customer.name}`,
    createdAt: now,
  };

  const nextState: AppState = {
    ...state,
    payments: [newPayment, ...state.payments],
    cashTransactions: [...state.cashTransactions, newCashTransaction],
  };

  saveAppState(nextState);
  return nextState;
}

export function createExpenseTransaction(
  state: AppState,
  input: {
    date: string;
    category: BusinessSettings extends any ? any : string;
    name: string;
    amount: number;
    paymentMethod: BusinessSettings extends any ? any : string;
    description: string;
  }
): AppState {
  const now = new Date().toISOString();
  const expenseId = `exp-${Date.now()}`;

  const newExpense: Expense = {
    id: expenseId,
    date: input.date,
    category: input.category,
    name: input.name,
    amount: input.amount,
    paymentMethod: input.paymentMethod,
    description: input.description,
    createdAt: now,
  };

  const newCashTransaction: CashTransaction = {
    id: `ct-exp-${expenseId}`,
    date: input.date,
    type: 'EXPENSE',
    reference: `EXP-${input.category.substring(0, 4).toUpperCase()}`,
    amount: -input.amount, // negative cash flow
    description: `Expense: ${input.name} (${input.category})`,
    createdAt: now,
  };

  const nextState: AppState = {
    ...state,
    expenses: [newExpense, ...state.expenses],
    cashTransactions: [...state.cashTransactions, newCashTransaction],
  };

  saveAppState(nextState);
  return nextState;
}

export function createStockInTransaction(
  state: AppState,
  input: {
    date: string;
    supplierId: string;
    productId: string;
    quantity: number;
    unitCost: number;
    notes: string;
  }
): AppState {
  const supplier = state.suppliers.find((s) => s.id === input.supplierId);
  const product = state.products.find((p) => p.id === input.productId);
  if (!supplier || !product) throw new Error('Supplier or Product not found');

  const now = new Date().toISOString();
  const newStockTx: StockTransaction = {
    id: `st-in-${Date.now()}`,
    date: input.date,
    supplierId: supplier.id,
    supplierName: supplier.name,
    productId: product.id,
    productName: product.name,
    type: 'STOCK_IN',
    quantity: input.quantity,
    unitCost: input.unitCost,
    reference: `STOCK-IN-${Date.now().toString().slice(-4)}`,
    notes: input.notes,
    createdAt: now,
  };

  const nextState: AppState = {
    ...state,
    stockTransactions: [...state.stockTransactions, newStockTx],
  };

  saveAppState(nextState);
  return nextState;
}

export function createReturnTransaction(
  state: AppState,
  input: {
    memoId: string;
    productId: string;
    supplierId: string;
    quantity: number;
    refundAmount: number;
    refundMethod: 'Adjust_Due' | 'Cash_Refund';
    date: string;
    reason: string;
  }
): AppState {
  const memo = state.memos.find((m) => m.id === input.memoId);
  if (!memo) throw new Error('Original memo not found');

  const product = state.products.find((p) => p.id === input.productId);
  const supplier = state.suppliers.find((s) => s.id === input.supplierId);
  if (!product || !supplier) throw new Error('Product or supplier not found');

  const now = new Date().toISOString();
  const returnId = `ret-${Date.now()}`;

  const newReturn: SalesReturn = {
    id: returnId,
    memoId: memo.id,
    memoNumber: memo.memoNumber,
    customerId: memo.customerId,
    customerName: memo.customerName,
    productId: product.id,
    productName: product.name,
    supplierId: supplier.id,
    supplierName: supplier.name,
    quantity: input.quantity,
    unitPrice: input.refundAmount / input.quantity,
    refundAmount: input.refundAmount,
    refundMethod: input.refundMethod,
    date: input.date,
    reason: input.reason,
    createdAt: now,
  };

  // Stock returns back to supplier/factory stock
  const newStockTx: StockTransaction = {
    id: `st-ret-${returnId}`,
    date: input.date,
    supplierId: supplier.id,
    supplierName: supplier.name,
    productId: product.id,
    productName: product.name,
    type: 'RETURN',
    quantity: input.quantity,
    reference: `RET-${memo.memoNumber}`,
    notes: `Customer Return from Memo #${memo.memoNumber}: ${input.reason}`,
    createdAt: now,
  };

  const newCashTransactions: CashTransaction[] = [];
  if (input.refundMethod === 'Cash_Refund') {
    newCashTransactions.push({
      id: `ct-ret-${returnId}`,
      date: input.date,
      type: 'RETURN_REFUND',
      reference: `REFUND-${memo.memoNumber}`,
      amount: -input.refundAmount, // cash paid out
      description: `Cash refund to ${memo.customerName} for Return on Memo #${memo.memoNumber}`,
      createdAt: now,
    });
  }

  const nextState: AppState = {
    ...state,
    returns: [newReturn, ...state.returns],
    stockTransactions: [...state.stockTransactions, newStockTx],
    cashTransactions: [...state.cashTransactions, ...newCashTransactions],
  };

  saveAppState(nextState);
  return nextState;
}

// ----------------- Memo Management & Deletion -----------------

/**
 * Permanently deletes/voids a memo, rolling back stock deductions,
 * down payments, and cash-in-hand transactions.
 */
export function deleteMemoTransaction(state: AppState, memoId: string): AppState {
  const memo = state.memos.find((m) => m.id === memoId);
  if (!memo) throw new Error('Memo not found');

  // 1. Filter out the memo
  const updatedMemos = state.memos.filter((m) => m.id !== memoId);

  // 2. Remove stock transactions generated by this memo (restores factory stock!)
  const updatedStockTx = state.stockTransactions.filter((st) => {
    return !(
      (st.reference === memo.memoNumber && st.type === 'SALE') ||
      st.id.startsWith(`st-sale-${memo.id}`)
    );
  });

  // 3. Remove down-payment cash collection for this memo (restores cash in hand)
  const updatedCashTx = state.cashTransactions.filter((ct) => {
    return !(
      (ct.reference === memo.memoNumber && ct.type === 'SALE_PAYMENT') ||
      ct.id === `ct-sale-${memo.id}`
    );
  });

  // 4. Remove payments record for this memo down-payment
  const updatedPayments = state.payments.filter((p) => {
    return !(
      p.memoId === memo.id ||
      p.id === `pay-memo-${memo.id}` ||
      (p.memoNumber === memo.memoNumber && p.notes.includes('Down payment'))
    );
  });

  // 5. Clean up any returns attached to this memo
  const updatedReturns = state.returns.filter((r) => r.memoId !== memo.id);

  const nextState: AppState = {
    ...state,
    memos: updatedMemos,
    stockTransactions: updatedStockTx,
    cashTransactions: updatedCashTx,
    payments: updatedPayments,
    returns: updatedReturns,
  };

  saveAppState(nextState);
  return nextState;
}

// ----------------- Stock & Factory Management -----------------

export function deleteStockTransaction(state: AppState, txId: string): AppState {
  const updated = state.stockTransactions.filter((st) => st.id !== txId);
  const nextState = { ...state, stockTransactions: updated };
  saveAppState(nextState);
  return nextState;
}

/**
 * Adjusts or clears stock for a specific supplier and product.
 * Sets the exact target quantity (e.g. 0 to clear stock).
 */
export function clearStockForSupplierProduct(
  state: AppState,
  supplierId: string,
  productId: string,
  targetQuantity = 0,
  reason = 'Stock Adjustment / Reset'
): AppState {
  const currentStock = getSupplierProductStock(state, supplierId, productId);
  const diff = targetQuantity - currentStock;
  if (diff === 0) return state;

  const supplier = state.suppliers.find((s) => s.id === supplierId);
  const product = state.products.find((p) => p.id === productId);

  const now = new Date().toISOString();
  const adjTx: StockTransaction = {
    id: `st-adj-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    supplierId,
    supplierName: supplier?.name || 'Factory',
    productId,
    productName: product?.name || 'Product',
    type: 'ADJUSTMENT',
    quantity: diff,
    reference: 'STOCK-CLEAR',
    notes: `${reason}: Set stock to ${targetQuantity} pcs (${diff > 0 ? '+' : ''}${diff} pcs)`,
    createdAt: now,
  };

  const nextState: AppState = {
    ...state,
    stockTransactions: [...state.stockTransactions, adjTx],
  };
  saveAppState(nextState);
  return nextState;
}

export function updateSupplier(
  state: AppState,
  supplierId: string,
  updates: Partial<Supplier>
): AppState {
  const updatedSuppliers = state.suppliers.map((s) =>
    s.id === supplierId ? { ...s, ...updates } : s
  );
  const nextState = { ...state, suppliers: updatedSuppliers };
  saveAppState(nextState);
  return nextState;
}

export function deleteSupplier(
  state: AppState,
  supplierId: string,
  removeStock = true
): AppState {
  const updatedSuppliers = state.suppliers.filter((s) => s.id !== supplierId);
  let updatedStockTx = state.stockTransactions;
  if (removeStock) {
    updatedStockTx = state.stockTransactions.filter((st) => st.supplierId !== supplierId);
  }
  const nextState = {
    ...state,
    suppliers: updatedSuppliers,
    stockTransactions: updatedStockTx,
    supplierPayments: (state.supplierPayments || []).filter((sp) => sp.supplierId !== supplierId),
    supplierBills: (state.supplierBills || []).filter((sb) => sb.supplierId !== supplierId),
  };
  saveAppState(nextState);
  return nextState;
}

export function clearSupplierPayables(state: AppState, supplierId: string): AppState {
  const updatedSuppliers = state.suppliers.map((s) =>
    s.id === supplierId ? { ...s, openingPayable: 0 } : s
  );
  const nextState: AppState = {
    ...state,
    suppliers: updatedSuppliers,
    supplierBills: (state.supplierBills || []).filter((b) => b.supplierId !== supplierId),
  };
  saveAppState(nextState);
  return nextState;
}

export function deleteSupplierPayment(state: AppState, paymentId: string): AppState {
  const nextState: AppState = {
    ...state,
    supplierPayments: (state.supplierPayments || []).filter((p) => p.id !== paymentId),
    cashTransactions: state.cashTransactions.filter((ct) => ct.id !== `ct-spay-${paymentId}`),
  };
  saveAppState(nextState);
  return nextState;
}

export function deleteSupplierBill(state: AppState, billId: string): AppState {
  const nextState: AppState = {
    ...state,
    supplierBills: (state.supplierBills || []).filter((b) => b.id !== billId),
  };
  saveAppState(nextState);
  return nextState;
}

// ----------------- Product / Item Management -----------------

export function updateProduct(
  state: AppState,
  productId: string,
  updates: Partial<Product>
): AppState {
  const updatedProducts = state.products.map((p) =>
    p.id === productId ? { ...p, ...updates } : p
  );
  const nextState = { ...state, products: updatedProducts };
  saveAppState(nextState);
  return nextState;
}

export function deleteProduct(
  state: AppState,
  productId: string,
  removeStock = true
): AppState {
  const updatedProducts = state.products.filter((p) => p.id !== productId);
  let updatedStockTx = state.stockTransactions;
  if (removeStock) {
    updatedStockTx = state.stockTransactions.filter((st) => st.productId !== productId);
  }
  const nextState = {
    ...state,
    products: updatedProducts,
    stockTransactions: updatedStockTx,
  };
  saveAppState(nextState);
  return nextState;
}

// ----------------- Customer Profile & Due Follow-Up (তাগাদা) -----------------

export function updateCustomer(
  state: AppState,
  customerId: string,
  updates: Partial<Customer>
): AppState {
  const updatedCustomers = state.customers.map((c) =>
    c.id === customerId ? { ...c, ...updates } : c
  );
  const nextState = { ...state, customers: updatedCustomers };
  saveAppState(nextState);
  return nextState;
}

export function deleteCustomer(state: AppState, customerId: string): AppState {
  const updatedCustomers = state.customers.filter((c) => c.id !== customerId);
  const nextState = { ...state, customers: updatedCustomers };
  saveAppState(nextState);
  return nextState;
}

export function addDueFollowUp(
  state: AppState,
  customerId: string,
  followUp: Omit<DueFollowUp, 'id' | 'customerId' | 'createdAt'>
): AppState {
  const now = new Date().toISOString();
  const newFollowUp: DueFollowUp = {
    ...followUp,
    id: `fu-${Date.now()}`,
    customerId,
    createdAt: now,
  };

  const updatedCustomers = state.customers.map((c) => {
    if (c.id === customerId) {
      return {
        ...c,
        followUps: [newFollowUp, ...(c.followUps || [])],
      };
    }
    return c;
  });

  const nextState = { ...state, customers: updatedCustomers };
  saveAppState(nextState);
  return nextState;
}

export function updateDueFollowUp(
  state: AppState,
  customerId: string,
  followUpId: string,
  updates: Partial<DueFollowUp>
): AppState {
  const updatedCustomers = state.customers.map((c) => {
    if (c.id === customerId && c.followUps) {
      return {
        ...c,
        followUps: c.followUps.map((fu) =>
          fu.id === followUpId ? { ...fu, ...updates } : fu
        ),
      };
    }
    return c;
  });

  const nextState = { ...state, customers: updatedCustomers };
  saveAppState(nextState);
  return nextState;
}

export function deleteDueFollowUp(
  state: AppState,
  customerId: string,
  followUpId: string
): AppState {
  const updatedCustomers = state.customers.map((c) => {
    if (c.id === customerId && c.followUps) {
      return {
        ...c,
        followUps: c.followUps.filter((fu) => fu.id !== followUpId),
      };
    }
    return c;
  });

  const nextState = { ...state, customers: updatedCustomers };
  saveAppState(nextState);
  return nextState;
}

export function exportStateToJson(state: AppState): string {
  return JSON.stringify(state, null, 2);
}

export function importStateFromJson(jsonString: string): AppState {
  const parsed = JSON.parse(jsonString);
  if (!parsed.settings || !parsed.customers || !parsed.products) {
    throw new Error('Invalid database format. Missing critical tables.');
  }
  const merged: AppState = {
    ...INITIAL_DATA,
    ...parsed,
  };
  saveAppState(merged);
  return merged;
}

export function resetMemosAndExpensesToZero(state: AppState): AppState {
  const nextState: AppState = {
    ...state,
    memos: [],
    expenses: [],
    payments: [],
    returns: [],
    stockTransactions: state.stockTransactions.filter((st) => st.type !== 'SALE'),
    cashTransactions: state.cashTransactions.filter((ct) => ct.type === 'OPENING'),
  };
  saveAppState(nextState);
  return nextState;
}

export function resetToDemoData(): AppState {
  saveAppState(INITIAL_DATA);
  return INITIAL_DATA;
}

export function clearDatabase(): AppState {
  const blank: AppState = {
    ...INITIAL_DATA,
    customers: [],
    products: [],
    suppliers: INITIAL_DATA.suppliers,
    memos: [],
    payments: [],
    expenses: [],
    stockTransactions: [],
    cashTransactions: [],
    supplierBills: [],
    supplierPayments: [],
    returns: [],
  };
  saveAppState(blank);
  return blank;
}

export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ----------------- Clear Memos & Expenses (০ মেমো ও খরচ) -----------------

/**
 * Resets all memos, sales, down payments, and expenses to 0,
 * restoring warehouse stock and setting a clean slate for transactions.
 */
export function clearMemosAndExpenses(state: AppState): AppState {
  // 1. Remove sales deductions from stock (restores stock)
  const cleanStockTx = state.stockTransactions.filter((st) => st.type !== 'SALE');

  // 2. Remove memo-related collections and expenses from cash flow
  const cleanCashTx = state.cashTransactions.filter(
    (ct) =>
      ct.type === 'OPENING' ||
      ct.type === 'OTHER_IN' ||
      ct.type === 'OTHER_OUT' ||
      ct.type === 'SUPPLIER_PAYMENT'
  );

  const cleanState: AppState = {
    ...state,
    memos: [],
    payments: [],
    expenses: [],
    returns: [],
    stockTransactions: cleanStockTx,
    cashTransactions: cleanCashTx,
  };

  saveAppState(cleanState);
  return cleanState;
}

// ----------------- Accounts Payable / Supplier Dues (আমার কাছে কারা টাকা পাবে) -----------------

export interface SupplierPayableItem {
  supplier: Supplier;
  openingPayable: number;
  stockInBills: number;
  manualBills: number;
  totalBills: number;
  totalPaid: number;
  currentPayable: number;
  lastPaymentDate?: string;
  status: 'due' | 'cleared';
}

export function getSupplierPayableStats(state: AppState, supplierId: string): SupplierPayableItem {
  const supplier = state.suppliers.find((s) => s.id === supplierId) || {
    id: supplierId,
    name: 'Unknown Supplier',
    phone: '',
    address: '',
    status: 'active' as const,
    createdAt: '',
  };

  const openingPayable = Number(supplier.openingPayable) || 0;

  // Calculate total stock purchased/received from this supplier
  const stockIntakes = state.stockTransactions.filter(
    (st) => st.supplierId === supplier.id && st.type === 'STOCK_IN'
  );
  const stockInBills = stockIntakes.reduce(
    (sum, st) => sum + st.quantity * (Number(st.unitCost) || 0),
    0
  );

  // Manual supplier consignment / credit bills
  const manualBills = (state.supplierBills || [])
    .filter((b) => b.supplierId === supplier.id)
    .reduce((sum, b) => sum + b.amount, 0);

  const totalBills = openingPayable + stockInBills + manualBills;

  // Total payments made to this supplier
  const supplierPayments = (state.supplierPayments || []).filter(
    (p) => p.supplierId === supplier.id
  );
  const totalPaid = supplierPayments.reduce((sum, p) => sum + p.amount, 0);

  const currentPayable = Math.max(0, totalBills - totalPaid);

  const lastPayment = [...supplierPayments].sort((a, b) => b.date.localeCompare(a.date))[0];

  return {
    supplier,
    openingPayable,
    stockInBills,
    manualBills,
    totalBills,
    totalPaid,
    currentPayable,
    lastPaymentDate: lastPayment?.date,
    status: currentPayable > 0 ? 'due' : 'cleared',
  };
}

export function getAllSupplierPayables(state: AppState): SupplierPayableItem[] {
  return state.suppliers.map((s) => getSupplierPayableStats(state, s.id));
}

export function createSupplierPaymentTransaction(
  state: AppState,
  input: {
    supplierId: string;
    date: string;
    amount: number;
    paymentMethod: PaymentMethod;
    reference?: string;
    notes: string;
  }
): AppState {
  const supplier = state.suppliers.find((s) => s.id === input.supplierId);
  if (!supplier) throw new Error('Supplier/Factory not found.');
  if (input.amount <= 0) throw new Error('Payment amount must be greater than zero.');

  const now = new Date().toISOString();
  const paymentId = `spay-${Date.now()}`;

  const newSupplierPayment: SupplierPayment = {
    id: paymentId,
    supplierId: supplier.id,
    supplierName: supplier.name,
    date: input.date,
    amount: input.amount,
    paymentMethod: input.paymentMethod,
    reference: input.reference || `PAY-${supplier.name.substring(0, 3).toUpperCase()}`,
    notes: input.notes,
    createdAt: now,
  };

  const newCashTransaction: CashTransaction = {
    id: `ct-spay-${paymentId}`,
    date: input.date,
    type: 'SUPPLIER_PAYMENT',
    reference: newSupplierPayment.reference || `SUP-${paymentId}`,
    amount: -input.amount, // Paid out from Cash in Hand!
    description: `Supplier payment to ${supplier.name} (${input.paymentMethod})`,
    createdAt: now,
  };

  const nextState: AppState = {
    ...state,
    supplierPayments: [newSupplierPayment, ...(state.supplierPayments || [])],
    cashTransactions: [...state.cashTransactions, newCashTransaction],
  };

  saveAppState(nextState);
  return nextState;
}

export function createSupplierBillTransaction(
  state: AppState,
  input: {
    supplierId: string;
    date: string;
    billNumber: string;
    amount: number;
    notes: string;
  }
): AppState {
  const supplier = state.suppliers.find((s) => s.id === input.supplierId);
  if (!supplier) throw new Error('Supplier/Factory not found.');
  if (input.amount <= 0) throw new Error('Bill amount must be greater than zero.');

  const now = new Date().toISOString();
  const newBill: SupplierBill = {
    id: `sbill-${Date.now()}`,
    supplierId: supplier.id,
    supplierName: supplier.name,
    billNumber: input.billNumber || `BILL-${Date.now().toString().slice(-4)}`,
    date: input.date,
    amount: input.amount,
    notes: input.notes,
    createdAt: now,
  };

  const nextState: AppState = {
    ...state,
    supplierBills: [newBill, ...(state.supplierBills || [])],
  };

  saveAppState(nextState);
  return nextState;
}

export function getSupplierLedger(supplierId: string, state: AppState): SupplierLedgerEntry[] {
  const supplier = state.suppliers.find((s) => s.id === supplierId);
  if (!supplier) return [];

  const rawEntries: Array<{
    date: string;
    type: 'Bill' | 'Stock_Intake' | 'Payment';
    reference: string;
    description: string;
    billedAmount: number;
    paidAmount: number;
    createdAt: string;
  }> = [];

  // Opening payable
  if (supplier.openingPayable && supplier.openingPayable > 0) {
    rawEntries.push({
      date: supplier.createdAt || '2026-01-01',
      type: 'Bill',
      reference: 'OPENING-PAYABLE',
      description: 'Opening payable balance brought forward',
      billedAmount: supplier.openingPayable,
      paidAmount: 0,
      createdAt: supplier.createdAt || '2026-01-01T00:00:00Z',
    });
  }

  // Stock In bills
  state.stockTransactions
    .filter((st) => st.supplierId === supplier.id && st.type === 'STOCK_IN')
    .forEach((st) => {
      const val = st.quantity * (Number(st.unitCost) || 0);
      rawEntries.push({
        date: st.date,
        type: 'Stock_Intake',
        reference: st.reference || 'STOCK-IN',
        description: `Goods Received: ${st.quantity} pcs of ${st.productName} @ ৳${st.unitCost || 0}`,
        billedAmount: val,
        paidAmount: 0,
        createdAt: st.createdAt,
      });
    });

  // Manual supplier bills
  (state.supplierBills || [])
    .filter((b) => b.supplierId === supplier.id)
    .forEach((b) => {
      rawEntries.push({
        date: b.date,
        type: 'Bill',
        reference: b.billNumber,
        description: b.notes || 'Consignment / Factory Bill',
        billedAmount: b.amount,
        paidAmount: 0,
        createdAt: b.createdAt,
      });
    });

  // Supplier payments
  (state.supplierPayments || [])
    .filter((p) => p.supplierId === supplier.id)
    .forEach((p) => {
      rawEntries.push({
        date: p.date,
        type: 'Payment',
        reference: p.reference || 'PAYMENT',
        description: `Payment via ${p.paymentMethod}${p.notes ? `: ${p.notes}` : ''}`,
        billedAmount: 0,
        paidAmount: p.amount,
        createdAt: p.createdAt,
      });
    });

  rawEntries.sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));

  let runningBalance = 0;
  return rawEntries.map((e, idx) => {
    runningBalance += e.billedAmount - e.paidAmount;
    return {
      id: `sled-${idx + 1}`,
      date: e.date,
      type: e.type,
      reference: e.reference,
      description: e.description,
      billedAmount: e.billedAmount,
      paidAmount: e.paidAmount,
      runningBalance: Math.max(0, runningBalance),
    };
  });
}

// ----------------- 007 Factory Distribution Analytics -----------------

export interface Client007DistributionItem {
  customer: Customer;
  totalQuantity: number;
  itemsBreakdown: { productName: string; quantity: number; amount: number }[];
  totalBill: number;
  totalPaid: number;
  currentDue: number;
  memoCount: number;
  lastDeliveryDate?: string;
}

export function get007DistributionData(state: AppState) {
  // 1. Identify 007 Factory supplier
  const supplier007: Supplier =
    state.suppliers.find(
      (s) => s.name.toLowerCase().includes('007') || s.id === 'sup-1'
    ) ||
    state.suppliers[0] || {
      id: 'sup-1',
      name: '007 Factory',
      phone: '',
      address: '',
      openingPayable: 0,
      status: 'active',
      createdAt: '',
    };

  const sup007Id = supplier007?.id || 'sup-1';

  // 2. Identify all memos that include products from 007 Factory
  const memosWith007 = state.memos.filter((m) =>
    m.items.some((it) => it.supplierId === sup007Id)
  );

  // 3. Products in 007 stock
  const stockRows007 = getStockDashboardData(state, sup007Id, 'all');
  const totalStockInHand = stockRows007.reduce((sum, r) => sum + r.currentStock, 0);

  // 4. Client aggregation for 007 products
  const clientMap = new Map<string, Client007DistributionItem>();

  // Initialize with customers who are either marked as market_distribution OR have bought 007 products
  state.customers.forEach((c) => {
    const isDistClient = (c.clientType || 'market_distribution') === 'market_distribution';
    if (isDistClient) {
      clientMap.set(c.id, {
        customer: c,
        totalQuantity: 0,
        itemsBreakdown: [],
        totalBill: 0,
        totalPaid: 0,
        currentDue: 0,
        memoCount: 0,
      });
    }
  });

  // Calculate per-client 007 distribution totals
  memosWith007.forEach((memo) => {
    let clientEntry = clientMap.get(memo.customerId);
    if (!clientEntry) {
      const cust = state.customers.find((c) => c.id === memo.customerId) || {
        id: memo.customerId,
        name: memo.customerName,
        phone: memo.customerPhone,
        address: '',
        district: memo.customerDistrict || 'Dhaka',
        area: memo.customerArea || '',
        status: 'active' as const,
        createdAt: memo.date,
      };
      clientEntry = {
        customer: cust,
        totalQuantity: 0,
        itemsBreakdown: [],
        totalBill: 0,
        totalPaid: 0,
        currentDue: 0,
        memoCount: 0,
      };
      clientMap.set(memo.customerId, clientEntry);
    }

    clientEntry.memoCount += 1;
    if (!clientEntry.lastDeliveryDate || memo.date > clientEntry.lastDeliveryDate) {
      clientEntry.lastDeliveryDate = memo.date;
    }

    memo.items.forEach((it) => {
      if (it.supplierId === sup007Id) {
        clientEntry!.totalQuantity += it.quantity;
        clientEntry!.totalBill += it.total;

        const existingItem = clientEntry!.itemsBreakdown.find(
          (b) => b.productName === it.productName
        );
        if (existingItem) {
          existingItem.quantity += it.quantity;
          existingItem.amount += it.total;
        } else {
          clientEntry!.itemsBreakdown.push({
            productName: it.productName,
            quantity: it.quantity,
            amount: it.total,
          });
        }
      }
    });
  });

  // Calculate actual dues for these clients
  const distributionClients: Client007DistributionItem[] = Array.from(clientMap.values()).map(
    (item) => {
      const cStats = getCustomerStats(item.customer, state);
      return {
        ...item,
        totalPaid: cStats.totalPaid,
        currentDue: cStats.currentDue,
      };
    }
  );

  const totalDistributedQty = distributionClients.reduce((sum, c) => sum + c.totalQuantity, 0);
  const totalDistributedSales = distributionClients.reduce((sum, c) => sum + c.totalBill, 0);
  const totalMarketDue = distributionClients.reduce((sum, c) => sum + c.currentDue, 0);
  const totalCollected = distributionClients.reduce((sum, c) => sum + c.totalPaid, 0);

  return {
    supplier: supplier007,
    distributionClients,
    memosWith007,
    stockRows007,
    totalStockInHand,
    totalDistributedQty,
    totalDistributedSales,
    totalMarketDue,
    totalCollected,
  };
}
