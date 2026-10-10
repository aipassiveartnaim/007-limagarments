import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Layers,
} from 'lucide-react';
import { AppState } from '../types';
import { exportToCSV } from '../services/storage';

interface TransactionsProps {
  appState: AppState;
}

export interface UnifiedTx {
  id: string;
  date: string;
  type: 'Sale' | 'Payment' | 'Expense' | 'Stock In' | 'Return';
  reference: string;
  party: string;
  amount: number | null;
  quantity: number | null;
  notes: string;
  timestamp: string;
}

export const Transactions: React.FC<TransactionsProps> = ({ appState }) => {
  const currency = appState.settings.currency || '৳';
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Combine transactions from memos, payments, expenses, stock, and returns
  const unifiedList: UnifiedTx[] = [];

  // Memos -> Sales
  appState.memos.forEach((m) => {
    const totalQty = m.items.reduce((s, it) => s + it.quantity, 0);
    unifiedList.push({
      id: `m-${m.id}`,
      date: m.date,
      type: 'Sale',
      reference: `#${m.memoNumber}`,
      party: m.customerName,
      amount: m.subtotal,
      quantity: totalQty,
      notes: `${m.items.length} items sold (Paid: ৳${m.paid}, Due: ৳${m.due})`,
      timestamp: m.createdAt,
    });
  });

  // Payments -> Customer Payments
  appState.payments.forEach((p) => {
    unifiedList.push({
      id: `p-${p.id}`,
      date: p.date,
      type: 'Payment',
      reference: p.memoNumber ? `#${p.memoNumber}` : `PAY-${p.id.slice(-4)}`,
      party: p.customerName,
      amount: p.amount,
      quantity: null,
      notes: `${p.paymentMethod}${p.notes ? ' - ' + p.notes : ''}`,
      timestamp: p.createdAt,
    });
  });

  // Expenses
  appState.expenses.forEach((e) => {
    unifiedList.push({
      id: `e-${e.id}`,
      date: e.date,
      type: 'Expense',
      reference: `EXP-${e.category.slice(0, 4).toUpperCase()}`,
      party: e.name,
      amount: -e.amount,
      quantity: null,
      notes: `${e.category} (${e.paymentMethod})${e.description ? ' - ' + e.description : ''}`,
      timestamp: e.createdAt,
    });
  });

  // Stock In
  appState.stockTransactions
    .filter((s) => s.type === 'STOCK_IN')
    .forEach((s) => {
      unifiedList.push({
        id: `st-${s.id}`,
        date: s.date,
        type: 'Stock In',
        reference: s.reference || `STK-${s.id.slice(-4)}`,
        party: s.supplierName,
        amount: s.unitCost ? s.quantity * s.unitCost : null,
        quantity: s.quantity,
        notes: `${s.productName} intake${s.notes ? ' - ' + s.notes : ''}`,
        timestamp: s.createdAt,
      });
    });

  // Returns
  appState.returns.forEach((r) => {
    unifiedList.push({
      id: `ret-${r.id}`,
      date: r.date,
      type: 'Return',
      reference: `RET-#${r.memoNumber}`,
      party: r.customerName,
      amount: -r.refundAmount,
      quantity: r.quantity,
      notes: `${r.quantity}x ${r.productName} returned (${r.refundMethod.replace('_', ' ')})`,
      timestamp: r.createdAt,
    });
  });

  // Sort descending by date & timestamp
  unifiedList.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return b.timestamp.localeCompare(a.timestamp);
  });

  // Apply filters
  const filtered = unifiedList.filter((tx) => {
    if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
    if (dateFilter && tx.date !== dateFilter) return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();

    return (
      tx.reference.toLowerCase().includes(term) ||
      tx.party.toLowerCase().includes(term) ||
      tx.notes.toLowerCase().includes(term)
    );
  });

  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Reference', 'Party', 'Amount', 'Quantity', 'Notes'];
    const rows = filtered.map((tx) => [
      tx.date,
      tx.type,
      tx.reference,
      tx.party,
      tx.amount !== null ? tx.amount : '-',
      tx.quantity !== null ? tx.quantity : '-',
      tx.notes,
    ]);
    exportToCSV('Audit_Transactions_Lima_Garments', headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Unified Transaction Audit Trail</h2>
          <p className="text-xs text-slate-500">
            Comprehensive chronological timeline of all sales, payments, expenses, stock entries, and returns.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors self-start md:self-auto"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
          <span>Export Audit Log</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search reference, party, notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-[11px] text-slate-400 hover:text-slate-600 underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Transaction Type Filter */}
        <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200 overflow-x-auto">
          {(['all', 'Sale', 'Payment', 'Expense', 'Stock In', 'Return'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${
                typeFilter === t
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t === 'all' ? 'All Types' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Party / Vendor</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Quantity</th>
                <th className="py-3 px-4">Details & Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No transactions match your search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{tx.date}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.type === 'Sale'
                            ? 'bg-indigo-100 text-indigo-800'
                            : tx.type === 'Payment'
                            ? 'bg-emerald-100 text-emerald-800'
                            : tx.type === 'Expense'
                            ? 'bg-rose-100 text-rose-800'
                            : tx.type === 'Stock In'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      {tx.reference}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{tx.party}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      {tx.amount !== null ? (
                        <span
                          className={
                            tx.amount > 0
                              ? 'text-emerald-600'
                              : tx.amount < 0
                              ? 'text-rose-600'
                              : 'text-slate-900'
                          }
                        >
                          {tx.amount > 0 ? '+' : ''}
                          {currency} {tx.amount.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-700">
                      {tx.quantity !== null ? `${tx.quantity} pcs` : '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-sm truncate">
                      {tx.notes}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
