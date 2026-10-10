import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  User,
  Calendar,
  Banknote,
  FileText,
  Save,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  Search,
} from 'lucide-react';
import { AppState, Customer, PaymentMethod } from '../types';
import {
  getCustomerStats,
  createPaymentTransaction,
  exportToCSV,
} from '../services/storage';

interface PaymentsProps {
  appState: AppState;
  selectedCustomerId?: string;
  onPaymentSaved: (nextState: AppState) => void;
}

export const Payments: React.FC<PaymentsProps> = ({
  appState,
  selectedCustomerId,
  onPaymentSaved,
}) => {
  const currency = appState.settings.currency || '৳';
  const today = new Date().toISOString().split('T')[0];

  const [customerId, setCustomerId] = useState<string>(selectedCustomerId || '');
  const [date, setDate] = useState<string>(today);
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [notes, setNotes] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync selected customer if prop changes
  useEffect(() => {
    if (selectedCustomerId) {
      setCustomerId(selectedCustomerId);
    } else if (!customerId && appState.customers.length > 0) {
      setCustomerId(appState.customers[0].id);
    }
  }, [selectedCustomerId, appState.customers]);

  const selectedCustomer = appState.customers.find((c) => c.id === customerId);
  const customerStats = selectedCustomer ? getCustomerStats(selectedCustomer, appState) : null;
  const previousDue = customerStats ? customerStats.currentDue : 0;

  const paymentNum = Math.max(0, Number(amount) || 0);
  const newDue = Math.max(0, previousDue - paymentNum);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (!customerId) throw new Error('Please select a customer.');
      if (paymentNum <= 0) throw new Error('Payment amount must be greater than zero.');
      if (!selectedCustomer) throw new Error('Selected customer not found.');

      const nextState = createPaymentTransaction(appState, {
        customerId,
        date,
        amount: paymentNum,
        paymentMethod,
        notes: notes.trim(),
      });

      setSuccessMessage(
        `Payment of ${currency} ${paymentNum.toLocaleString()} recorded for ${selectedCustomer.name}. New Due: ${currency} ${newDue.toLocaleString()}.`
      );
      setAmount('');
      setNotes('');
      onPaymentSaved(nextState);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record payment.');
    }
  };

  // Payment history filtering
  const filteredPayments = appState.payments.filter((p) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.customerName.toLowerCase().includes(term) ||
      p.paymentMethod.toLowerCase().includes(term) ||
      (p.memoNumber && p.memoNumber.toLowerCase().includes(term))
    );
  });

  const handleExportCSV = () => {
    const headers = ['Date', 'Customer', 'Memo Ref', 'Amount', 'Previous Due', 'New Due', 'Method', 'Notes'];
    const rows = appState.payments.map((p) => [
      p.date,
      p.customerName,
      p.memoNumber || '-',
      p.amount,
      p.previousDue,
      p.newDue,
      p.paymentMethod,
      p.notes || '',
    ]);
    exportToCSV('Payment_Collections_Lima_Garments', headers, rows);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Payment Collection Entry</h2>
          <p className="text-xs text-slate-500">
            Record customer due clearance with automatic cash in hand and ledger updates.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
          <span>Export History</span>
        </button>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>{successMessage}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Payment Entry Form (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-3 flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            Receive Customer Payment
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Customer select */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Customer *
              </label>
              <select
                required
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              >
                {appState.customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone || 'No phone'})
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            {/* Previous Due Display */}
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs space-y-1">
              <span className="text-[10px] font-bold uppercase text-amber-800 tracking-wider">
                Current Account Due
              </span>
              <div className="text-xl font-black text-amber-700 font-mono tabular-nums">
                {currency} {previousDue.toLocaleString()}
              </div>
              <p className="text-[10px] text-amber-800/80">
                Outstanding balance prior to this payment entry.
              </p>
            </div>

            {/* Payment Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Amount ({currency}) *
              </label>
              <input
                type="number"
                min="1"
                required
                placeholder="Enter amount paid"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0))
                }
                className="w-full px-3 py-2 text-sm font-mono font-bold rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            {/* Quick full pay button */}
            {previousDue > 0 && (
              <button
                type="button"
                onClick={() => setAmount(previousDue)}
                className="w-full py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
              >
                Clear Full Balance ({currency} {previousDue.toLocaleString()})
              </button>
            )}

            {/* Live New Due Preview */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex justify-between items-center">
              <div>
                <span className="text-slate-500 block">Calculation Formula:</span>
                <span className="font-mono text-slate-700">
                  {previousDue} − {paymentNum} =
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">New Due Remaining:</span>
                <span className="text-base font-black text-slate-900 font-mono tabular-nums">
                  {currency} {newDue.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              >
                <option value="Cash">Cash</option>
                <option value="bKash">bKash</option>
                <option value="Nagad">Nagad</option>
                <option value="Bank">Bank Deposit</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Receipt Notes / Reference
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Cleared via bKash TrxID #8928..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Payment & Update Ledger</span>
            </button>
          </form>
        </div>

        {/* Payment Collections History (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between overflow-hidden">
          <div>
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Payment Collection History</h3>
                <p className="text-xs text-slate-500">
                  {filteredPayments.length} recorded payments in archive
                </p>
              </div>

              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter by customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Method</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-right">New Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        No customer payments recorded yet.
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 text-slate-600">{p.date}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {p.customerName}
                          {p.notes && (
                            <span className="block text-[10px] text-slate-400 font-normal truncate max-w-xs">
                              {p.notes}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{p.paymentMethod}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                          + {currency} {p.amount.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-amber-600">
                          {currency} {p.newDue.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
