import React, { useState } from 'react';
import {
  TrendingUp,
  Receipt,
  Users,
  Boxes,
  FileText,
  AlertTriangle,
  ArrowUpRight,
  Plus,
  CreditCard,
  Printer,
  ChevronRight,
  Info,
  Calendar,
  Truck,
  Banknote,
} from 'lucide-react';
import { AppState, Memo } from '../types';
import {
  calculateCashInHand,
  getCustomerStats,
  getStockDashboardData,
  getAllSupplierPayables,
  get007DistributionData,
} from '../services/storage';

interface DashboardProps {
  appState: AppState;
  onNavigate: (tab: any) => void;
  onViewMemo: (memo: Memo) => void;
  onOpenCustomerProfile: (customerId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  appState,
  onNavigate,
  onViewMemo,
  onOpenCustomerProfile,
}) => {
  const currency = appState.settings.currency || '৳';
  const todayStr = new Date().toISOString().split('T')[0];

  const [timeframe, setTimeframe] = useState<'today' | 'all'>('today');
  const [showFormulaInfo, setShowFormulaInfo] = useState(false);

  // Memos & Transactions filtering
  const relevantMemos =
    timeframe === 'today'
      ? appState.memos.filter((m) => m.date === todayStr)
      : appState.memos;

  const relevantExpenses =
    timeframe === 'today'
      ? appState.expenses.filter((e) => e.date === todayStr)
      : appState.expenses;

  const relevantPayments =
    timeframe === 'today'
      ? appState.payments.filter((p) => p.date === todayStr)
      : appState.payments;

  // Financial calculations
  const totalSales = relevantMemos.reduce((sum, m) => sum + m.subtotal, 0);
  const totalPaidAtMemo = relevantMemos.reduce((sum, m) => sum + m.paid, 0);
  const totalDueCreated = relevantMemos.reduce((sum, m) => sum + m.due, 0);
  
  // Total Collection:
  // For Today: memo paid + subsequent due payments collected today
  const totalSubsequentCollection = relevantPayments
    .filter((p) => !p.notes?.includes('Down payment at Memo #'))
    .reduce((sum, p) => sum + p.amount, 0);
  const totalCollection = totalPaidAtMemo + totalSubsequentCollection;

  const totalExpense = relevantExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Cash in Hand
  const cashDetail = calculateCashInHand(appState, timeframe === 'today' ? todayStr : undefined);

  // Total Stock Quantity across all suppliers
  const stockRows = getStockDashboardData(appState);
  const totalStockQuantity = stockRows.reduce((sum, row) => sum + row.currentStock, 0);

  // 007 Factory Distribution & Supplier Payables
  const dist007 = get007DistributionData(appState);
  const payablesList = getAllSupplierPayables(appState);
  const totalPayableDue = payablesList.reduce((sum, item) => sum + item.currentPayable, 0);
  const suppliersWithDueCount = payablesList.filter((item) => item.currentPayable > 0).length;

  // Low stock products alert
  const lowStockItems = stockRows.filter((r) => r.currentStock <= r.minStockLevel);

  // Recent memos (last 6)
  const recentMemos = [...appState.memos].slice(0, 6);

  // Recent payments
  const recentPayments = [...appState.payments].slice(0, 5);

  // Top customers by balance
  const topCustomerDues = appState.customers
    .map((c) => ({
      ...c,
      stats: getCustomerStats(c, appState),
    }))
    .sort((a, b) => b.stats.currentDue - a.stats.currentDue)
    .slice(0, 5);

  // 7-Day Trend Data for Simple SVG Chart
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateKey = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en-GB', { weekday: 'short' });

    const daySales = appState.memos
      .filter((m) => m.date === dateKey)
      .reduce((s, m) => s + m.subtotal, 0);

    const dayPayments = appState.cashTransactions
      .filter((c) => c.date === dateKey && (c.type === 'SALE_PAYMENT' || c.type === 'CUSTOMER_PAYMENT'))
      .reduce((s, c) => s + c.amount, 0);

    const dayExpense = appState.expenses
      .filter((e) => e.date === dateKey)
      .reduce((s, e) => s + e.amount, 0);

    return { dateKey, dayLabel, daySales, dayPayments, dayExpense };
  });

  const maxChartVal = Math.max(
    ...last7Days.map((d) => Math.max(d.daySales, d.dayPayments, d.dayExpense)),
    5000
  );

  return (
    <div className="space-y-6">
      {/* Top Controls & Timeframe Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-semibold text-slate-800">Summary Scope:</span>
          <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => setTimeframe('today')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                timeframe === 'today'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today ({todayStr})
            </button>
            <button
              onClick={() => setTimeframe('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                timeframe === 'all'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All-Time Aggregate
            </button>
          </div>
        </div>

        {/* Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('new-memo')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Memo
          </button>
          <button
            onClick={() => onNavigate('payments')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
            Receive Payment
          </button>
          <button
            onClick={() => onNavigate('expenses')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
          >
            <Receipt className="w-3.5 h-3.5 text-rose-600" />
            Add Expense
          </button>
        </div>
      </div>

      {/* Large KPI Summary Cards (8 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Sales */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Sales</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
              {currency} {totalSales.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {timeframe === 'today' ? "Today's billed sales" : 'Lifetime sales volume'}
            </div>
          </div>
        </div>

        {/* 2. Total Collection */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Collection</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-emerald-600 font-mono tabular-nums">
              {currency} {totalCollection.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Cash received ({timeframe === 'today' ? 'Today' : 'Total'})
            </div>
          </div>
        </div>

        {/* 3. Customer Due Created / Total Due */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              {timeframe === 'today' ? 'Due Created Today' : 'Total Customer Due'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-amber-600 font-mono tabular-nums">
              {currency} {totalDueCreated.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Outstanding receivable balance
            </div>
          </div>
        </div>

        {/* 4. Total Expense */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Expense</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-rose-600 font-mono tabular-nums">
              {currency} {totalExpense.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {timeframe === 'today' ? "Today's operational costs" : 'Total business expenses'}
            </div>
          </div>
        </div>

        {/* 5. Cash In Hand (With Formula Tooltip) */}
        <div className="bg-white p-5 rounded-xl border-2 border-emerald-500/40 shadow-xs flex flex-col justify-between relative">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Cash In Hand
              </span>
              <button
                onClick={() => setShowFormulaInfo(!showFormulaInfo)}
                className="text-slate-400 hover:text-slate-600"
                title="View Cash In Hand Formula"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
              Formula Verified
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-700 font-mono tabular-nums">
              {currency} {cashDetail.totalCashInHand.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
              <span>Opening: {currency} {cashDetail.openingCash.toLocaleString()}</span>
              <button
                onClick={() => setShowFormulaInfo(!showFormulaInfo)}
                className="text-emerald-700 hover:underline text-[11px] font-medium"
              >
                Formula breakdown
              </button>
            </div>
          </div>

          {/* Formula breakdown popover */}
          {showFormulaInfo && (
            <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-xl z-20 border border-slate-700">
              <div className="font-bold text-emerald-400 mb-1 flex items-center justify-between">
                <span>Strict Cash-in-Hand Formula:</span>
                <button
                  onClick={() => setShowFormulaInfo(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <p className="text-slate-300 mb-2 text-[11px]">
                Sales on credit are NEVER counted as cash in hand until received!
              </p>
              <div className="space-y-1 font-mono text-[11px] bg-slate-950 p-2 rounded-lg">
                <div className="flex justify-between text-slate-300">
                  <span>Opening Cash:</span>
                  <span>+ {currency} {cashDetail.openingCash.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>Customer Payments:</span>
                  <span>+ {currency} {cashDetail.customerPayments.toLocaleString()}</span>
                </div>
                {cashDetail.otherCashIn > 0 && (
                  <div className="flex justify-between text-slate-300">
                    <span>Other Cash In:</span>
                    <span>+ {currency} {cashDetail.otherCashIn.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-rose-400">
                  <span>Expenses:</span>
                  <span>- {currency} {cashDetail.expenses.toLocaleString()}</span>
                </div>
                {cashDetail.cashRefunds > 0 && (
                  <div className="flex justify-between text-rose-400">
                    <span>Cash Refunds:</span>
                    <span>- {currency} {cashDetail.cashRefunds.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t border-slate-800 pt-1 flex justify-between font-bold text-white">
                  <span>Current Cash:</span>
                  <span>= {currency} {cashDetail.totalCashInHand.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 6. Stock Quantity */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Stock</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-blue-700 font-mono tabular-nums">
              {totalStockQuantity.toLocaleString()} <span className="text-sm font-sans font-normal text-slate-500">pcs</span>
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
              <span>Across all factories</span>
              {lowStockItems.length > 0 && (
                <span className="text-rose-600 font-semibold">{lowStockItems.length} Low Stock</span>
              )}
            </div>
          </div>
        </div>

        {/* 7. Number of Memos */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Memos Billed</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-purple-700 font-mono tabular-nums">
              {relevantMemos.length}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {timeframe === 'today' ? "Today's memo count" : 'All memos on record'}
            </div>
          </div>
        </div>

        {/* 8. Number of Customers */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Customers</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-teal-700 font-mono tabular-nums">
              {appState.customers.length}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Registered party accounts
            </div>
          </div>
        </div>
      </div>

      {/* 007 Distribution & Accounts Payable Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 007 Factory Product Distribution Card */}
        <div className="bg-white p-5 rounded-xl border border-indigo-200 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-indigo-400 transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                007
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <span>007 Factory Product Distribution</span>
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    মার্কেট ডিস্ট্রিবিউশন
                  </span>
                </h3>
                <p className="text-xs text-slate-500">০০৭ ফ্যাক্টরি পণ্য মার্কেট সাপ্লাই ও পার্টি তালিকা</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 my-4 pt-3 border-t border-slate-100 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="text-[10px] text-slate-500 block font-semibold uppercase">বর্তমান স্টক</span>
              <span className="font-black text-slate-900 font-mono text-sm">
                {dist007.totalStockInHand.toLocaleString()} <span className="text-[10px] font-normal">pcs</span>
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="text-[10px] text-slate-500 block font-semibold uppercase">ক্লায়েন্ট সংখ্যা</span>
              <span className="font-black text-purple-700 font-mono text-sm">
                {dist007.distributionClients.length} জন
              </span>
            </div>
            <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              <span className="text-[10px] text-amber-800 block font-semibold uppercase">মার্কেট বাকি</span>
              <span className="font-black text-amber-700 font-mono text-sm">
                {currency} {dist007.totalMarketDue.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400">ডেলিভারি রুট ও চালান ম্যানেজমেন্ট</span>
            <button
              onClick={() => onNavigate('factory-007')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
            >
              <span>007 ডিস্ট্রিবিউশন সেকশন দেখুন</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Accounts Payable Card (আমার কাছে কারা টাকা পাবে) */}
        <div className="bg-white p-5 rounded-xl border border-rose-200 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-rose-400 transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                <Banknote className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <span>আমার কাছে কারা টাকা পাবে (Payables)</span>
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    {suppliersWithDueCount} জন পাওনাদার
                  </span>
                </h3>
                <p className="text-xs text-slate-500">ফ্যাক্টরি ও মহাজনদের দেনা এবং বিল পরিশোধ</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 my-4 pt-3 border-t border-slate-100 text-xs">
            <div className="bg-rose-50 p-2.5 rounded-lg border border-rose-200">
              <span className="text-[10px] text-rose-800 block font-semibold uppercase">মোট দেনা / পাওনা</span>
              <span className="font-black text-rose-700 font-mono text-base">
                {currency} {totalPayableDue.toLocaleString()}
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="text-[10px] text-slate-500 block font-semibold uppercase">মোট পরিশোধিত টাকা</span>
              <span className="font-black text-emerald-600 font-mono text-base">
                {currency} {payablesList.reduce((s, p) => s + p.totalPaid, 0).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400">ফ্যাক্টরি খাতা ও বিল পরিশোধ</span>
            <button
              onClick={() => onNavigate('payables')}
              className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
            >
              <span>কারা টাকা পাবে দেখুন / বিল পরিশোধ করুন</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Low Stock Warning Banner if any */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                Low Stock Alert ({lowStockItems.length} Products below minimum threshold)
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                {lowStockItems.slice(0, 3).map((i) => `${i.productName} (${i.currentStock} pcs at ${i.supplierName})`).join(' · ')}
                {lowStockItems.length > 3 && ` and ${lowStockItems.length - 3} more.`}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('stock')}
            className="px-3.5 py-1.5 text-xs font-semibold text-amber-900 bg-amber-200/80 hover:bg-amber-200 rounded-lg transition-colors whitespace-nowrap self-start sm:self-center"
          >
            Review Stock Intake →
          </button>
        </div>
      )}

      {/* Charts & Analytical Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Performance Canvas Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Daily Sales vs Collection (7 Days)</h3>
              <p className="text-xs text-slate-500">Live transaction progression</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
                Sales
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                Collection
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
                Expenses
              </span>
            </div>
          </div>

          {/* Simple High-Density CSS Bar Chart */}
          <div className="h-52 flex items-end justify-between gap-3 pt-6 pb-2 border-b border-slate-100">
            {last7Days.map((day, idx) => {
              const salesHeight = Math.min(100, Math.round((day.daySales / maxChartVal) * 100));
              const collectionHeight = Math.min(100, Math.round((day.dayPayments / maxChartVal) * 100));
              const expenseHeight = Math.min(100, Math.round((day.dayExpense / maxChartVal) * 100));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <div className="w-full flex items-end justify-center gap-1 h-40">
                    {/* Sales Bar */}
                    <div
                      style={{ height: `${Math.max(4, salesHeight)}%` }}
                      className="w-1/3 bg-indigo-600 rounded-t-sm transition-all group-hover:bg-indigo-700 relative"
                      title={`Sales: ${currency} ${day.daySales}`}
                    />
                    {/* Collection Bar */}
                    <div
                      style={{ height: `${Math.max(4, collectionHeight)}%` }}
                      className="w-1/3 bg-emerald-500 rounded-t-sm transition-all group-hover:bg-emerald-600 relative"
                      title={`Collection: ${currency} ${day.dayPayments}`}
                    />
                    {/* Expense Bar */}
                    <div
                      style={{ height: `${Math.max(4, expenseHeight)}%` }}
                      className="w-1/3 bg-rose-400 rounded-t-sm transition-all group-hover:bg-rose-500 relative"
                      title={`Expense: ${currency} ${day.dayExpense}`}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 mt-2">
                    {day.dayLabel}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Peak Day Volume: {currency} {maxChartVal.toLocaleString()}</span>
            <button
              onClick={() => onNavigate('reports')}
              className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
            >
              Full Daily Business Sheet <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Top Customers by Due Balance */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Highest Outstanding Dues</h3>
              <p className="text-xs text-slate-500">Customer ledger balances</p>
            </div>
            <button
              onClick={() => onNavigate('customers')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              View All
            </button>
          </div>

          <div className="space-y-2.5 flex-1">
            {topCustomerDues.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-8">
                No outstanding dues on record.
              </div>
            ) : (
              topCustomerDues.map((cust) => (
                <div
                  key={cust.id}
                  onClick={() => onOpenCustomerProfile(cust.id)}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 border border-slate-100 cursor-pointer transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {cust.name}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono truncate">
                      {cust.phone || 'No phone'} · {cust.district || 'Dhaka'}{cust.area ? ` (${cust.area})` : ''}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-amber-600 font-mono tabular-nums">
                      {currency} {cust.stats.currentDue.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Total: {currency} {cust.stats.totalPurchase.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => onNavigate('payments')}
            className="w-full mt-4 py-2 text-xs font-semibold text-center text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Collect Customer Payment
          </button>
        </div>
      </div>

      {/* Tables Section: Recent Memos & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Memos (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Sales Memos</h3>
              <p className="text-xs text-slate-500">Latest customer orders & billing</p>
            </div>
            <button
              onClick={() => onNavigate('sales')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
            >
              Full Archive <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Memo #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                  <th className="py-2.5 px-3 text-right">Paid</th>
                  <th className="py-2.5 px-3 text-right">Due</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentMemos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No sales memos created yet. Click "New Memo" to bill your first order.
                    </td>
                  </tr>
                ) : (
                  recentMemos.map((memo) => (
                    <tr key={memo.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-600">
                        #{memo.memoNumber}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{memo.date}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        {memo.customerName}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                        {currency} {memo.subtotal.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-600">
                        {currency} {memo.paid.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-amber-600">
                        {currency} {memo.due.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => onViewMemo(memo)}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          title="Print Memo"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Payment Collections (1 col) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recent Collections</h3>
                <p className="text-xs text-slate-500">Customer payments received</p>
              </div>
              <button
                onClick={() => onNavigate('payments')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                All
              </button>
            </div>

            <div className="p-3 space-y-2">
              {recentPayments.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-6">
                  No payment collections recorded.
                </div>
              ) : (
                recentPayments.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">{p.customerName}</div>
                      <div className="text-[11px] text-slate-500">
                        {p.date} · {p.paymentMethod}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-emerald-600 font-mono tabular-nums">
                        + {currency} {p.amount.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        New Due: {currency} {p.newDue.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-3 border-t border-slate-100 bg-slate-50">
            <button
              onClick={() => onNavigate('payments')}
              className="w-full py-2 text-xs font-semibold text-center text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
            >
              + Collect New Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
