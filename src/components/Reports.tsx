import React, { useState } from 'react';
import {
  FileBarChart2,
  Calendar,
  Printer,
  FileSpreadsheet,
  TrendingUp,
  CreditCard,
  Receipt,
  Boxes,
  Banknote,
  DollarSign,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { AppState } from '../types';
import {
  calculateCashInHand,
  getCustomerStats,
  getStockDashboardData,
  exportToCSV,
} from '../services/storage';

interface ReportsProps {
  appState: AppState;
  onOpenCustomerProfile?: (customerId: string) => void;
}

export const Reports: React.FC<ReportsProps> = ({ appState, onOpenCustomerProfile }) => {
  const currency = appState.settings.currency || '৳';
  const today = new Date().toISOString().split('T')[0];

  const [activeReportTab, setActiveReportTab] = useState<'daily' | 'monthly' | 'profit' | 'due'>(
    'daily'
  );

  // Daily sheet state
  const [dailyDate, setDailyDate] = useState(today);

  // Monthly report state
  const currentMonth = today.slice(0, 7); // YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // Profit report timeframe
  const [profitTimeframe, setProfitTimeframe] = useState<'all' | 'month' | 'day'>('month');

  const handlePrint = () => {
    window.print();
  };

  // ================= 1. DAILY BUSINESS SHEET CALCULATIONS =================
  const dayMemos = appState.memos.filter((m) => m.date === dailyDate);
  const dayExpenses = appState.expenses.filter((e) => e.date === dailyDate);
  const dayStockTx = appState.stockTransactions.filter((s) => s.date === dailyDate);
  const dayCashTx = appState.cashTransactions.filter((c) => c.date === dailyDate);

  const dayTotalSales = dayMemos.reduce((sum, m) => sum + m.subtotal, 0);
  const dayQuantitySold = dayMemos.reduce(
    (sum, m) => sum + m.items.reduce((s, it) => s + it.quantity, 0),
    0
  );
  const dayMemoCount = dayMemos.length;

  const dayCashCollection = dayMemos.reduce((sum, m) => sum + m.paid, 0);
  const dayDueCollection = appState.payments
    .filter((p) => p.date === dailyDate && !p.notes?.includes('Down payment at Memo #'))
    .reduce((sum, p) => sum + p.amount, 0);
  const dayTotalCollection = dayCashCollection + dayDueCollection;

  const dayTotalExpense = dayExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Day Cash Flow
  const dayCashIn = dayCashTx
    .filter((c) => c.amount > 0 && c.type !== 'OPENING')
    .reduce((sum, c) => sum + c.amount, 0);
  const dayCashOut = dayCashTx
    .filter((c) => c.amount < 0)
    .reduce((sum, c) => sum + Math.abs(c.amount), 0);

  // Cumulative cash at end of this day
  const cashAtDay = calculateCashInHand(appState, dailyDate);

  const dayStockIn = dayStockTx
    .filter((s) => s.type === 'STOCK_IN')
    .reduce((sum, s) => sum + s.quantity, 0);
  const dayStockSold = dayStockTx
    .filter((s) => s.type === 'SALE')
    .reduce((sum, s) => sum + s.quantity, 0);
  const currentStockTotal = getStockDashboardData(appState).reduce(
    (sum, r) => sum + r.currentStock,
    0
  );

  // ================= 2. MONTHLY REPORT CALCULATIONS =================
  const monthMemos = appState.memos.filter((m) => m.date.startsWith(selectedMonth));
  const monthExpenses = appState.expenses.filter((e) => e.date.startsWith(selectedMonth));
  const monthStockTx = appState.stockTransactions.filter((s) => s.date.startsWith(selectedMonth));

  const monthSales = monthMemos.reduce((sum, m) => sum + m.subtotal, 0);
  const monthPaidAtMemo = monthMemos.reduce((sum, m) => sum + m.paid, 0);
  const monthDueCreated = monthMemos.reduce((sum, m) => sum + m.due, 0);
  const monthSubsequentPaid = appState.payments
    .filter((p) => p.date.startsWith(selectedMonth) && !p.notes?.includes('Down payment at Memo #'))
    .reduce((sum, p) => sum + p.amount, 0);
  const monthCollection = monthPaidAtMemo + monthSubsequentPaid;
  const monthExpense = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

  const monthQtySold = monthMemos.reduce(
    (sum, m) => sum + m.items.reduce((s, it) => s + it.quantity, 0),
    0
  );
  const monthStockIn = monthStockTx
    .filter((s) => s.type === 'STOCK_IN')
    .reduce((sum, s) => sum + s.quantity, 0);
  const monthStockOut = monthStockTx
    .filter((s) => s.type === 'SALE')
    .reduce((sum, s) => sum + s.quantity, 0);

  // Group by date for daily breakdown table
  const daysMap = new Map<string, { sales: number; collection: number; expense: number }>();
  for (let d = 1; d <= 31; d++) {
    const dayStr = `${selectedMonth}-${String(d).padStart(2, '0')}`;
    const dMemos = monthMemos.filter((m) => m.date === dayStr);
    const dExpenses = monthExpenses.filter((e) => e.date === dayStr);
    const dPays = appState.cashTransactions.filter(
      (c) =>
        c.date === dayStr && (c.type === 'SALE_PAYMENT' || c.type === 'CUSTOMER_PAYMENT')
    );

    if (dMemos.length > 0 || dExpenses.length > 0 || dPays.length > 0) {
      daysMap.set(dayStr, {
        sales: dMemos.reduce((sum, m) => sum + m.subtotal, 0),
        collection: dPays.reduce((sum, c) => sum + c.amount, 0),
        expense: dExpenses.reduce((sum, e) => sum + e.amount, 0),
      });
    }
  }

  // ================= 3. PROFIT REPORT CALCULATIONS =================
  // Product wise profit
  const relevantProfitMemos = appState.memos.filter((m) => {
    if (profitTimeframe === 'day') return m.date === dailyDate;
    if (profitTimeframe === 'month') return m.date.startsWith(selectedMonth);
    return true;
  });

  const productProfitMap = new Map<
    string,
    {
      productId: string;
      productName: string;
      category: string;
      sellingPrice: number;
      costPrice: number;
      qtySold: number;
      totalRevenue: number;
      totalCost: number;
      totalProfit: number;
    }
  >();

  appState.products.forEach((p) => {
    productProfitMap.set(p.id, {
      productId: p.id,
      productName: p.name,
      category: p.category,
      sellingPrice: p.sellingPrice,
      costPrice: p.costPrice,
      qtySold: 0,
      totalRevenue: 0,
      totalCost: 0,
      totalProfit: 0,
    });
  });

  relevantProfitMemos.forEach((memo) => {
    memo.items.forEach((item) => {
      let rec = productProfitMap.get(item.productId);
      if (!rec) {
        rec = {
          productId: item.productId,
          productName: item.productName,
          category: 'Clothing',
          sellingPrice: item.unitPrice,
          costPrice: item.unitCost || 0,
          qtySold: 0,
          totalRevenue: 0,
          totalCost: 0,
          totalProfit: 0,
        };
        productProfitMap.set(item.productId, rec);
      }

      rec.qtySold += item.quantity;
      rec.totalRevenue += item.total;
      const unitCost = item.unitCost !== undefined ? item.unitCost : rec.costPrice;
      const lineCost = item.quantity * unitCost;
      rec.totalCost += lineCost;
      rec.totalProfit += item.total - lineCost;
    });
  });

  const productProfitRows = Array.from(productProfitMap.values()).filter(
    (r) => r.qtySold > 0 || profitTimeframe === 'all'
  );
  const totalNetProfit = productProfitRows.reduce((sum, r) => sum + r.totalProfit, 0);

  // ================= 4. CUSTOMER DUE SUMMARY =================
  const customerDues = appState.customers
    .map((c) => ({
      customer: c,
      stats: getCustomerStats(c, appState),
    }))
    .sort((a, b) => b.stats.currentDue - a.stats.currentDue);

  const totalOutstandingAllDue = customerDues.reduce((sum, c) => sum + c.stats.currentDue, 0);

  // Export handlers
  const handleExportDailyCSV = () => {
    const headers = ['Metric', 'Amount / Value'];
    const rows = [
      ['Date', dailyDate],
      ['Total Sales', dayTotalSales],
      ['Total Qty Sold', dayQuantitySold],
      ['Number of Memos', dayMemoCount],
      ['Cash Collection', dayCashCollection],
      ['Due Collection', dayDueCollection],
      ['Total Collection', dayTotalCollection],
      ['Total Expense', dayTotalExpense],
      ['Day Cash In', dayCashIn],
      ['Day Cash Out', dayCashOut],
      ['Closing Cash In Hand', cashAtDay.totalCashInHand],
    ];
    exportToCSV(`Daily_Report_${dailyDate}`, headers, rows);
  };

  const handleExportMonthlyCSV = () => {
    const headers = ['Date', 'Sales', 'Collection', 'Expense', 'Net Cash'];
    const rows: (string | number)[][] = [];
    daysMap.forEach((val, dateKey) => {
      rows.push([dateKey, val.sales, val.collection, val.expense, val.collection - val.expense]);
    });
    exportToCSV(`Monthly_Report_${selectedMonth}`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Tab Switcher */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Financial Reports & Statements</h2>
          <p className="text-xs text-slate-500">
            Real-time daily business sheets, monthly turnover, gross profit, and accounts receivable.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Current Statement</span>
          </button>
        </div>
      </div>

      {/* Report Category Navigation Tabs */}
      <div className="border-b border-slate-200 flex overflow-x-auto gap-4 text-xs font-semibold">
        {[
          { id: 'daily', label: '1. Daily Business Sheet' },
          { id: 'monthly', label: '2. Monthly Report' },
          { id: 'profit', label: '3. Profit Analysis' },
          { id: 'due', label: '4. Customer Due Summary' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReportTab(tab.id as any)}
            className={`py-3 px-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeReportTab === tab.id
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ============================================================== */}
      {/* 1. DAILY BUSINESS SHEET */}
      {/* ============================================================== */}
      {activeReportTab === 'daily' && (
        <div className="space-y-6 print-container">
          {/* Controls Bar */}
          <div className="no-print bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-semibold text-slate-700">Select Business Date:</span>
              <input
                type="date"
                value={dailyDate}
                onChange={(e) => setDailyDate(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
              />
            </div>

            <button
              onClick={handleExportDailyCSV}
              className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-indigo-600 self-start sm:self-auto"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          {/* Letterhead for Print */}
          <div className="text-center pb-4 border-b border-slate-200">
            <h1 className="text-xl font-black uppercase text-slate-900">
              {appState.settings.businessName}
            </h1>
            <p className="text-xs text-slate-500">
              Daily Business Statement · {dailyDate}
            </p>
          </div>

          {/* 4 Pillars of Daily Operations */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. SALES */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Daily Sales
                </span>
                <TrendingUp className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Sales Value:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {currency} {dayTotalSales.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Quantity Sold:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {dayQuantitySold} pcs
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Memos Billed:</span>
                  <span className="font-mono">{dayMemoCount}</span>
                </div>
              </div>
            </div>

            {/* 2. COLLECTION */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                  Daily Collection
                </span>
                <CreditCard className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Cash Collection (Memos):</span>
                  <span className="font-mono text-emerald-600">
                    {currency} {dayCashCollection.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Due Collection (Later):</span>
                  <span className="font-mono text-emerald-600">
                    {currency} {dayDueCollection.toLocaleString()}
                  </span>
                </div>
                <div className="border-t border-slate-100 pt-1 flex justify-between font-bold">
                  <span className="text-slate-800">Total Collection:</span>
                  <span className="font-mono text-emerald-700 text-sm">
                    {currency} {dayTotalCollection.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. EXPENSES */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
                  Daily Expenses
                </span>
                <Receipt className="w-4 h-4 text-rose-600" />
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Expense:</span>
                  <span className="font-mono font-bold text-rose-600 text-sm">
                    {currency} {dayTotalExpense.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Expense Entries:</span>
                  <span className="font-mono">{dayExpenses.length}</span>
                </div>
                <div className="text-[11px] text-slate-400 truncate pt-1 border-t border-slate-100">
                  {dayExpenses.map((e) => e.name).join(', ') || 'No expenses today'}
                </div>
              </div>
            </div>

            {/* 4. CASH IN HAND & STOCK */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
                  Cash Flow & Stock
                </span>
                <Banknote className="w-4 h-4 text-teal-600" />
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Day Cash In:</span>
                  <span className="font-mono text-emerald-600">+{currency} {dayCashIn.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Day Cash Out:</span>
                  <span className="font-mono text-rose-600">-{currency} {dayCashOut.toLocaleString()}</span>
                </div>
                <div className="border-t border-slate-100 pt-1 flex justify-between font-bold">
                  <span className="text-slate-900">Closing Cash:</span>
                  <span className="font-mono text-teal-700 text-sm">
                    {currency} {cashAtDay.totalCashInHand.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                  <span>Stock: +{dayStockIn} in, -{dayStockSold} sold</span>
                </div>
              </div>
            </div>
          </div>

          {/* Day Memo Detail Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Sales Memos Billed on {dailyDate} ({dayMemos.length} Orders)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Memo #</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Items Sold</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                    <th className="py-2.5 px-3 text-right">Paid</th>
                    <th className="py-2.5 px-3 text-right">Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dayMemos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No memos billed on {dailyDate}.
                      </td>
                    </tr>
                  ) : (
                    dayMemos.map((m) => (
                      <tr key={m.id}>
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-600">
                          #{m.memoNumber}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-900">{m.customerName}</td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {m.items.map((i) => `${i.productName} (${i.quantity}x)`).join(', ')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                          {currency} {m.subtotal.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-600">
                          {currency} {m.paid.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-amber-600">
                          {currency} {m.due.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. MONTHLY REPORT */}
      {/* ============================================================== */}
      {activeReportTab === 'monthly' && (
        <div className="space-y-6 print-container">
          {/* Controls Bar */}
          <div className="no-print bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-semibold text-slate-700">Select Month:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
              />
            </div>

            <button
              onClick={handleExportMonthlyCSV}
              className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-indigo-600 self-start sm:self-auto"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Monthly CSV</span>
            </button>
          </div>

          {/* Letterhead */}
          <div className="text-center pb-4 border-b border-slate-200">
            <h1 className="text-xl font-black uppercase text-slate-900">
              {appState.settings.businessName}
            </h1>
            <p className="text-xs text-slate-500">
              Monthly Financial & Inventory Summary · {selectedMonth}
            </p>
          </div>

          {/* Monthly KPI Overview Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-500 block">Total Sales</span>
              <span className="text-xl font-bold font-mono text-slate-900">
                {currency} {monthSales.toLocaleString()}
              </span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-500 block">Total Collection</span>
              <span className="text-xl font-bold font-mono text-emerald-600">
                {currency} {monthCollection.toLocaleString()}
              </span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-500 block">Due Created</span>
              <span className="text-xl font-bold font-mono text-amber-600">
                {currency} {monthDueCreated.toLocaleString()}
              </span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-500 block">Total Expenses</span>
              <span className="text-xl font-bold font-mono text-rose-600">
                {currency} {monthExpense.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Daily Breakdown Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Day-by-Day Financial Breakdown ({selectedMonth})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4 text-right">Sales Volume</th>
                    <th className="py-2.5 px-4 text-right">Cash Collection</th>
                    <th className="py-2.5 px-4 text-right">Expenses</th>
                    <th className="py-2.5 px-4 text-right">Net Cash Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {daysMap.size === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400">
                        No transactions recorded for the month of {selectedMonth}.
                      </td>
                    </tr>
                  ) : (
                    Array.from(daysMap.entries()).map(([dateStr, row]) => (
                      <tr key={dateStr} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-medium text-slate-800">{dateStr}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900">
                          {currency} {row.sales.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-emerald-600">
                          {currency} {row.collection.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-rose-600">
                          {currency} {row.expense.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                          {currency} {(row.collection - row.expense).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. PROFIT REPORT */}
      {/* ============================================================== */}
      {activeReportTab === 'profit' && (
        <div className="space-y-6 print-container">
          <div className="no-print bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">Profit Scope:</span>
              <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200">
                {(['all', 'month', 'day'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setProfitTimeframe(t)}
                    className={`px-3 py-1 text-xs font-semibold rounded-md capitalize transition-colors ${
                      profitTimeframe === t
                        ? 'bg-white text-indigo-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t === 'all' ? 'All Time' : t === 'month' ? `This Month (${selectedMonth})` : `Today (${today})`}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-500">
              Formula: Selling Price − Cost Price = Profit Per Piece
            </div>
          </div>

          {/* Gross Profit KPI Banner */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-800">
                Gross Product Profit ({profitTimeframe.toUpperCase()})
              </span>
              <div className="text-3xl font-black text-indigo-700 font-mono tabular-nums mt-1">
                {currency} {totalNetProfit.toLocaleString()}
              </div>
              <p className="text-xs text-indigo-800/80 mt-1">
                Calculated strictly from sold goods margin (Selling Price − Cost Price × Quantity). Kept separate from cash flow.
              </p>
            </div>
          </div>

          {/* Product Profit Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4 text-right">Selling Price</th>
                    <th className="py-3 px-4 text-right">Cost Price</th>
                    <th className="py-3 px-4 text-right">Profit / Piece</th>
                    <th className="py-3 px-4 text-center">Qty Sold</th>
                    <th className="py-3 px-4 text-right">Total Revenue</th>
                    <th className="py-3 px-4 text-right font-black text-slate-900">Total Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {productProfitRows.map((p) => {
                    const profitPerPiece = p.sellingPrice - p.costPrice;

                    return (
                      <tr key={p.productId} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{p.productName}</td>
                        <td className="py-3 px-4 text-right font-mono">
                          {currency} {p.sellingPrice.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-500">
                          {currency} {p.costPrice.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-600">
                          {currency} {profitPerPiece.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                          {p.qtySold} pcs
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-800">
                          {currency} {p.totalRevenue.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-extrabold text-indigo-600 text-sm">
                          {currency} {p.totalProfit.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. CUSTOMER DUE SUMMARY */}
      {/* ============================================================== */}
      {activeReportTab === 'due' && (
        <div className="space-y-6 print-container">
          {/* Header Card */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Total Outstanding Customer Accounts Receivable
              </span>
              <div className="text-3xl font-black text-amber-700 font-mono tabular-nums mt-1">
                {currency} {totalOutstandingAllDue.toLocaleString()}
              </div>
              <p className="text-xs text-amber-800/80 mt-1">
                Across {customerDues.filter((c) => c.stats.currentDue > 0).length} parties with pending balances.
              </p>
            </div>

            <button
              onClick={() => {
                const headers = ['Customer', 'Phone', 'Total Purchase', 'Total Paid', 'Due Balance', 'Last Payment'];
                const rows = customerDues.map((c) => [
                  c.customer.name,
                  c.customer.phone,
                  c.stats.totalPurchase,
                  c.stats.totalPaid,
                  c.stats.currentDue,
                  c.stats.lastPaymentDate || '-',
                ]);
                exportToCSV('Customer_Due_Summary', headers, rows);
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors self-start sm:self-auto"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Due List CSV</span>
            </button>
          </div>

          {/* Customer Due List Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Customer Name</th>
                    <th className="py-3 px-4">Phone Number</th>
                    <th className="py-3 px-4 text-right">Total Purchases</th>
                    <th className="py-3 px-4 text-right">Total Paid</th>
                    <th className="py-3 px-4 text-right font-black">Outstanding Due</th>
                    <th className="py-3 px-4 text-center">Last Payment Date</th>
                    <th className="py-3 px-4 text-center">Risk Indicator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customerDues.map(({ customer, stats }) => {
                    const isHighDue = stats.currentDue >= 5000;
                    const hasDue = stats.currentDue > 0;

                    return (
                      <tr
                        key={customer.id}
                        onClick={() => onOpenCustomerProfile && onOpenCustomerProfile(customer.id)}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4 font-bold text-slate-900">{customer.name}</td>
                        <td className="py-3 px-4 text-slate-600 font-mono">{customer.phone || 'N/A'}</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700">
                          {currency} {stats.totalPurchase.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-600">
                          {currency} {stats.totalPaid.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-extrabold text-sm">
                          <span className={isHighDue ? 'text-rose-600' : hasDue ? 'text-amber-600' : 'text-slate-400'}>
                            {currency} {stats.currentDue.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-slate-600">
                          {stats.lastPaymentDate || 'Never'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isHighDue ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              Critical Alert
                            </span>
                          ) : hasDue ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              Moderate Due
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Cleared
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
