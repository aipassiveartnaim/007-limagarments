import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Calendar,
  Banknote,
  FileSpreadsheet,
  Trash2,
  CheckCircle,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { AppState, ExpenseCategory, PaymentMethod, Expense } from '../types';
import {
  createExpenseTransaction,
  exportToCSV,
  saveAppState,
} from '../services/storage';

interface ExpensesProps {
  appState: AppState;
  onExpenseSaved: (nextState: AppState) => void;
}

export const Expenses: React.FC<ExpensesProps> = ({ appState, onExpenseSaved }) => {
  const currency = appState.settings.currency || '৳';
  const today = new Date().toISOString().split('T')[0];

  const categories = appState.settings.expenseCategories as ExpenseCategory[];

  const [date, setDate] = useState(today);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>(categories[0] || 'Shop Expense');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [description, setDescription] = useState('');

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const expAmount = Number(amount);
      if (!name.trim()) throw new Error('Please enter an expense title/name.');
      if (isNaN(expAmount) || expAmount <= 0) throw new Error('Expense amount must be greater than zero.');

      const nextState = createExpenseTransaction(appState, {
        date,
        category,
        name: name.trim(),
        amount: expAmount,
        paymentMethod,
        description: description.trim(),
      });

      setSuccessMessage(
        `Expense "${name}" of ${currency} ${expAmount.toLocaleString()} recorded. Cash in hand reduced by ${currency} ${expAmount.toLocaleString()}.`
      );
      setName('');
      setAmount('');
      setDescription('');
      onExpenseSaved(nextState);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save expense.');
    }
  };

  // Filtered expenses
  const filteredExpenses = appState.expenses.filter((exp) => {
    if (selectedCategoryFilter !== 'all' && exp.category !== selectedCategoryFilter) {
      return false;
    }
    return true;
  });

  const totalExpenseSum = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleExportCSV = () => {
    const headers = ['Date', 'Expense Name', 'Category', 'Amount', 'Payment Method', 'Description'];
    const rows = appState.expenses.map((e) => [
      e.date,
      e.name,
      e.category,
      e.amount,
      e.paymentMethod,
      e.description,
    ]);
    exportToCSV('Expenses_Lima_Garments', headers, rows);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Expense Management</h2>
          <p className="text-xs text-slate-500">
            Track overhead costs, factory logistics, gas cylinders, salaries, and shop rent.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-rose-50 px-4 py-2 rounded-xl border border-rose-200 text-right">
            <span className="text-[11px] font-semibold text-rose-800 uppercase block">
              Filtered Total Expense
            </span>
            <span className="text-lg font-black text-rose-600 font-mono tabular-nums">
              {currency} {totalExpenseSum.toLocaleString()}
            </span>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
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
        {/* Expense Form (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-3 flex items-center gap-2 mb-4">
            <Receipt className="w-4 h-4 text-rose-600" />
            Record Operational Expense
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Expense Name / Item *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Gas Cylinder, Factory Cargo, Shop Tea"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount ({currency}) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="1000"
                  value={amount}
                  onChange={(e) =>
                    setAmount(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0))
                  }
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

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
                  <option value="Bank">Bank</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description / Memo / Receipt Ref
              </label>
              <textarea
                rows={2}
                placeholder="e.g. 12kg Omera gas cylinder for shop generator..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record Expense & Deduct Cash</span>
            </button>
          </form>
        </div>

        {/* Expenses Table (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between overflow-hidden">
          <div>
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Expense Log Archive</h3>
                <p className="text-xs text-slate-500">
                  {filteredExpenses.length} expenditures recorded
                </p>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Expense Item</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        No expenses logged for this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 text-slate-600">{exp.date}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {exp.name}
                          {exp.description && (
                            <span className="block text-[10px] text-slate-400 font-normal truncate max-w-xs">
                              {exp.description}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                          - {currency} {exp.amount.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{exp.paymentMethod}</td>
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
