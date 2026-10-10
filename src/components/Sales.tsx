import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  Printer,
  RotateCcw,
  FileSpreadsheet,
  Calendar,
  Filter,
  Plus,
  Trash2,
  AlertTriangle,
  X,
  CheckCircle,
} from 'lucide-react';
import { AppState, Memo } from '../types';
import { exportToCSV, deleteMemoTransaction } from '../services/storage';

interface SalesProps {
  appState: AppState;
  onViewMemo: (memo: Memo) => void;
  onOpenReturn: (memo: Memo) => void;
  onNewMemoClick: () => void;
  onSalesUpdated?: (nextState: AppState) => void;
}

export const Sales: React.FC<SalesProps> = ({
  appState,
  onViewMemo,
  onOpenReturn,
  onNewMemoClick,
  onSalesUpdated,
}) => {
  const currency = appState.settings.currency || '৳';
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'due'>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [memoToDelete, setMemoToDelete] = useState<Memo | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const filteredMemos = appState.memos.filter((memo) => {
    if (statusFilter === 'paid' && memo.due > 0) return false;
    if (statusFilter === 'due' && memo.due === 0) return false;
    if (dateFilter && memo.date !== dateFilter) return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();

    return (
      memo.memoNumber.toLowerCase().includes(term) ||
      memo.customerName.toLowerCase().includes(term) ||
      (memo.customerPhone && memo.customerPhone.toLowerCase().includes(term)) ||
      memo.items.some((it) => it.productName.toLowerCase().includes(term))
    );
  });

  const totalFilteredSales = filteredMemos.reduce((sum, m) => sum + m.subtotal, 0);
  const totalFilteredPaid = filteredMemos.reduce((sum, m) => sum + m.paid, 0);
  const totalFilteredDue = filteredMemos.reduce((sum, m) => sum + m.due, 0);

  const handleExportCSV = () => {
    const headers = [
      'Memo No',
      'Date',
      'Customer',
      'Phone',
      'Items Count',
      'Total Amount',
      'Paid Amount',
      'Due Amount',
      'Payment Method',
    ];
    const rows = filteredMemos.map((m) => [
      m.memoNumber,
      m.date,
      m.customerName,
      m.customerPhone || '-',
      m.items.length,
      m.subtotal,
      m.paid,
      m.due,
      m.paymentMethod,
    ]);
    exportToCSV('Sales_Memos_Archive_Lima_Garments', headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Sales Archive & Memos</h2>
          <p className="text-xs text-slate-500">
            Searchable sales memos archive with instant reprints and returns.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-50 px-3.5 py-1.5 rounded-lg border border-slate-200 text-right">
            <span className="text-[10px] font-semibold text-slate-500 uppercase block">
              Filtered Volume
            </span>
            <span className="text-base font-black text-slate-900 font-mono">
              {currency} {totalFilteredSales.toLocaleString()}
            </span>
          </div>

          <div className="bg-amber-50 px-3.5 py-1.5 rounded-lg border border-amber-200 text-right">
            <span className="text-[10px] font-semibold text-amber-800 uppercase block">
              Filtered Due
            </span>
            <span className="text-base font-black text-amber-700 font-mono">
              {currency} {totalFilteredDue.toLocaleString()}
            </span>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onNewMemoClick}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Memo</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search memo #, customer, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden"
            />
          </div>

          {/* Date Filter */}
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

        {/* Status segmented buttons */}
        <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200">
          {(['all', 'paid', 'due'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 text-xs font-semibold rounded-md capitalize transition-colors ${
                statusFilter === s
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {s === 'all' ? 'All Memos' : s === 'paid' ? 'Full Paid' : 'With Due'}
            </button>
          ))}
        </div>
      </div>

      {/* Memos Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Memo #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Products / Factory</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Due</th>
                <th className="py-3 px-4 text-center">Payment Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMemos.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No sales memos found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredMemos.map((memo) => {
                  const isFullPaid = memo.due === 0;

                  return (
                    <tr key={memo.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                        #{memo.memoNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {memo.date}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{memo.customerName}</div>
                        {memo.customerPhone && (
                          <div className="text-[11px] text-slate-400 font-mono">
                            {memo.customerPhone}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {memo.items.map((i) => `${i.productName} (${i.quantity}x)`).join(', ')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {currency} {memo.subtotal.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-600">
                        {currency} {memo.paid.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-600">
                        {currency} {memo.due.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isFullPaid
                              ? 'bg-emerald-100 text-emerald-800'
                              : memo.paid > 0
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isFullPaid ? 'Full Paid' : memo.paid > 0 ? 'Partial Due' : 'Unpaid Due'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onViewMemo(memo)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="View / Print Memo"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenReturn(memo)}
                            className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Process Item Return"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setMemoToDelete(memo)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete / Cancel Memo (মেমো ডিলিট করুন)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Memo Delete Confirmation Modal */}
      {memoToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-4 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-100" />
                <span className="font-bold text-sm">মেমো মুছে ফেলুন (Delete / Void Memo)</span>
              </div>
              <button
                onClick={() => setMemoToDelete(null)}
                className="text-rose-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Memo Number:</span>
                  <span className="font-bold font-mono text-slate-900">#{memoToDelete.memoNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-bold text-slate-900">{memoToDelete.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date:</span>
                  <span className="text-slate-700">{memoToDelete.date}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500">Sale Total:</span>
                  <span className="font-bold text-slate-900 font-mono">{currency} {memoToDelete.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Paid Amount:</span>
                  <span className="font-bold text-emerald-600 font-mono">{currency} {memoToDelete.paid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Due Created:</span>
                  <span className="font-bold text-amber-600 font-mono">{currency} {memoToDelete.due.toLocaleString()}</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 space-y-1">
                <span className="font-bold block text-[11px] uppercase tracking-wide">
                  ⚠️ মেমোটি ডিলিট করলে যা ঘটবে:
                </span>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                  <li>বিক্রয়টি সম্পূর্ণ বাতিল হবে এবং কাস্টমারের হিসাব থেকে ডিউ সমন্বয় হবে।</li>
                  {memoToDelete.paid > 0 && (
                    <li>জমা নেওয়া <strong>{currency} {memoToDelete.paid.toLocaleString()}</strong> ক্যাশ ইন হ্যান্ড থেকে বিয়োগ/সমন্বয় হবে।</li>
                  )}
                  <li>
                    মেমোর সব আইটেমের স্টক ({memoToDelete.items.reduce((sum, i) => sum + i.quantity, 0)} pcs) স্বয়ংক্রিয়ভাবে সংশ্লিষ্ট ফ্যাক্টরি/সাপ্লায়ার স্টকে ফেরত যোগ হবে।
                  </li>
                </ul>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMemoToDelete(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  না, বাতিল করুন
                </button>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      const next = deleteMemoTransaction(appState, memoToDelete.id);
                      if (onSalesUpdated) onSalesUpdated(next);
                      setFeedbackMessage(`Memo #${memoToDelete.memoNumber} সফলভাবে ডিলিট ও স্টক ফেরত দেওয়া হয়েছে।`);
                      setTimeout(() => setFeedbackMessage(null), 4000);
                      setMemoToDelete(null);
                    } catch (err: any) {
                      setFeedbackMessage(err.message || 'Error deleting memo');
                      setTimeout(() => setFeedbackMessage(null), 5000);
                    }
                  }}
                  className="px-4 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
                >
                  হ্যাঁ, মেমোটি ডিলিট করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback banner */}
      {feedbackMessage && (
        <div className="fixed bottom-4 right-4 z-50 p-4 bg-emerald-600 text-white rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{feedbackMessage}</span>
        </div>
      )}
    </div>
  );
};
