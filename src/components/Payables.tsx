import React, { useState } from 'react';
import {
  Banknote,
  Plus,
  Search,
  FileSpreadsheet,
  Building,
  Phone,
  CreditCard,
  Receipt,
  AlertTriangle,
  CheckCircle,
  X,
  Calendar,
  ArrowUpRight,
  Printer,
  History,
  FileText,
  Trash2,
} from 'lucide-react';
import { AppState, Supplier, SupplierPayment, SupplierBill, PaymentMethod } from '../types';
import {
  getAllSupplierPayables,
  createSupplierPaymentTransaction,
  createSupplierBillTransaction,
  getSupplierLedger,
  exportToCSV,
  calculateCashInHand,
  deleteSupplier,
  clearSupplierPayables,
  deleteSupplierPayment,
  deleteSupplierBill,
} from '../services/storage';

interface PayablesProps {
  appState: AppState;
  onPayablesUpdated: (nextState: AppState) => void;
}

export const Payables: React.FC<PayablesProps> = ({ appState, onPayablesUpdated }) => {
  const currency = appState.settings.currency || '৳';
  const today = new Date().toISOString().split('T')[0];

  const [activeTab, setActiveTab] = useState<'creditors' | 'payments' | 'bills'>('creditors');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'due' | 'cleared'>('all');

  // Delete Modals State
  const [supplierToDelete, setSupplierToDelete] = useState<{
    supplier: Supplier;
    currentPayable: number;
  } | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<SupplierPayment | null>(null);
  const [billToDelete, setBillToDelete] = useState<SupplierBill | null>(null);

  // Pay Bill Modal State
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(
    appState.suppliers[0]?.id || ''
  );
  const [payDate, setPayDate] = useState(today);
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Cash');
  const [payReference, setPayReference] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // Add Bill Modal State
  const [showAddBillModal, setShowAddBillModal] = useState(false);
  const [billSupplierId, setBillSupplierId] = useState<string>(
    appState.suppliers[0]?.id || ''
  );
  const [billDate, setBillDate] = useState(today);
  const [billNumber, setBillNumber] = useState('');
  const [billAmount, setBillAmount] = useState<number | ''>('');
  const [billNotes, setBillNotes] = useState('');

  // View Supplier Ledger Modal
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);

  // Toast / feedback message
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const cashInfo = calculateCashInHand(appState);
  const payablesList = getAllSupplierPayables(appState);

  // Filter creditors
  const filteredCreditors = payablesList.filter((item) => {
    if (statusFilter === 'due' && item.currentPayable <= 0) return false;
    if (statusFilter === 'cleared' && item.currentPayable > 0) return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();

    return (
      item.supplier.name.toLowerCase().includes(term) ||
      (item.supplier.phone && item.supplier.phone.toLowerCase().includes(term)) ||
      (item.supplier.address && item.supplier.address.toLowerCase().includes(term))
    );
  });

  // Calculate totals
  const totalPayableDue = payablesList.reduce((sum, item) => sum + item.currentPayable, 0);
  const totalBillsAmount = payablesList.reduce((sum, item) => sum + item.totalBills, 0);
  const totalPaidToSuppliers = payablesList.reduce((sum, item) => sum + item.totalPaid, 0);
  const suppliersWithDueCount = payablesList.filter((item) => item.currentPayable > 0).length;

  // Selected supplier stats for payment modal
  const selectedSupplierItem = payablesList.find((p) => p.supplier.id === selectedSupplierId);

  // Handle Pay Submit
  const handlePaySupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const amt = Number(payAmount);
      if (isNaN(amt) || amt <= 0) {
        throw new Error('পরিশোধের পরিমাণ সঠিকভাবে লিখুন (Must be > 0)');
      }

      const nextState = createSupplierPaymentTransaction(appState, {
        supplierId: selectedSupplierId,
        date: payDate,
        amount: amt,
        paymentMethod: payMethod,
        reference: payReference.trim() || undefined,
        notes: payNotes.trim(),
      });

      onPayablesUpdated(nextState);
      setFeedbackMessage(
        `${selectedSupplierItem?.supplier.name || 'ফ্যাক্টরিকে'} ${currency} ${amt.toLocaleString()} পরিশোধ সফল হয়েছে। ক্যাশ সমন্বয় সম্পন্ন!`
      );
      setTimeout(() => setFeedbackMessage(null), 4000);

      setShowPayModal(false);
      setPayAmount('');
      setPayReference('');
      setPayNotes('');
    } catch (err: any) {
      setFeedbackMessage(err.message || 'Error recording payment');
      setTimeout(() => setFeedbackMessage(null), 5000);
    }
  };

  // Handle Add Bill Submit
  const handleAddBillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const amt = Number(billAmount);
      if (isNaN(amt) || amt <= 0) {
        throw new Error('চালান বিলের পরিমাণ সঠিকভাবে লিখুন (Must be > 0)');
      }

      const nextState = createSupplierBillTransaction(appState, {
        supplierId: billSupplierId,
        date: billDate,
        billNumber: billNumber.trim(),
        amount: amt,
        notes: billNotes.trim(),
      });

      onPayablesUpdated(nextState);
      setFeedbackMessage('নতুন চালান/বিল সফলভাবে যুক্ত হয়েছে।');
      setTimeout(() => setFeedbackMessage(null), 4000);

      setShowAddBillModal(false);
      setBillNumber('');
      setBillAmount('');
      setBillNotes('');
    } catch (err: any) {
      setFeedbackMessage(err.message || 'Error recording bill');
      setTimeout(() => setFeedbackMessage(null), 5000);
    }
  };

  // Handle Delete Supplier completely
  const handleConfirmDeleteSupplier = (removeStock: boolean = true) => {
    if (!supplierToDelete) return;
    try {
      const supName = supplierToDelete.supplier.name;
      const nextState = deleteSupplier(appState, supplierToDelete.supplier.id, removeStock);
      onPayablesUpdated(nextState);
      if (viewingSupplier?.id === supplierToDelete.supplier.id) {
        setViewingSupplier(null);
      }
      setFeedbackMessage(`পাওনাদার/ফ্যাক্টরি "${supName}" সফলভাবে মুছে ফেলা হয়েছে।`);
      setTimeout(() => setFeedbackMessage(null), 4000);
      setSupplierToDelete(null);
    } catch (err: any) {
      setFeedbackMessage(err.message || 'Error deleting supplier');
      setTimeout(() => setFeedbackMessage(null), 5000);
    }
  };

  // Handle Clear Supplier Payable to 0
  const handleConfirmClearSupplierPayable = () => {
    if (!supplierToDelete) return;
    try {
      const supName = supplierToDelete.supplier.name;
      const nextState = clearSupplierPayables(appState, supplierToDelete.supplier.id);
      onPayablesUpdated(nextState);
      setFeedbackMessage(`"${supName}" এর প্রদেয় দেনা ০ (শূন্য) করা হয়েছে।`);
      setTimeout(() => setFeedbackMessage(null), 4000);
      setSupplierToDelete(null);
    } catch (err: any) {
      setFeedbackMessage(err.message || 'Error clearing payable');
      setTimeout(() => setFeedbackMessage(null), 5000);
    }
  };

  // Handle Delete Payment
  const handleConfirmDeletePayment = () => {
    if (!paymentToDelete) return;
    try {
      const nextState = deleteSupplierPayment(appState, paymentToDelete.id);
      onPayablesUpdated(nextState);
      setFeedbackMessage(
        `বিল পরিশোধ রেকর্ড (${paymentToDelete.supplierName} - ৳${paymentToDelete.amount.toLocaleString()}) মুছে ফেলা হয়েছে এবং ক্যাশ ব্যালেন্স সমন্বয় সম্পন্ন!`
      );
      setTimeout(() => setFeedbackMessage(null), 4000);
      setPaymentToDelete(null);
    } catch (err: any) {
      setFeedbackMessage(err.message || 'Error deleting payment');
      setTimeout(() => setFeedbackMessage(null), 5000);
    }
  };

  // Handle Delete Bill
  const handleConfirmDeleteBill = () => {
    if (!billToDelete) return;
    try {
      const nextState = deleteSupplierBill(appState, billToDelete.id);
      onPayablesUpdated(nextState);
      setFeedbackMessage(`চালান বিল #${billToDelete.billNumber} সফলভাবে মুছে ফেলা হয়েছে।`);
      setTimeout(() => setFeedbackMessage(null), 4000);
      setBillToDelete(null);
    } catch (err: any) {
      setFeedbackMessage(err.message || 'Error deleting bill');
      setTimeout(() => setFeedbackMessage(null), 5000);
    }
  };

  const handleExportPayablesCSV = () => {
    const headers = [
      'Supplier / Factory',
      'Phone',
      'Address',
      'Opening Payable (৳)',
      'Stock Intake Value (৳)',
      'Total Billed (৳)',
      'Total Paid (৳)',
      'Current Payable Due (৳)',
      'Last Payment Date',
      'Status',
    ];
    const rows = filteredCreditors.map((item) => [
      item.supplier.name,
      item.supplier.phone || '-',
      item.supplier.address || '-',
      item.openingPayable,
      item.stockInBills,
      item.totalBills,
      item.totalPaid,
      item.currentPayable,
      item.lastPaymentDate || '-',
      item.status === 'due' ? 'টাকা পাবে' : 'পরিশোধিত',
    ]);
    exportToCSV('Accounts_Payable_Supplier_Dues', headers, rows);
  };

  const supplierLedgerEntries = viewingSupplier
    ? getSupplierLedger(viewingSupplier.id, appState)
    : [];

  const viewingStats = viewingSupplier
    ? payablesList.find((p) => p.supplier.id === viewingSupplier.id)
    : null;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
              <Banknote className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span>আমার কাছে কারা টাকা পাবে (Accounts Payable)</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  {suppliersWithDueCount} জন পাওনাদার
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                ফ্যাক্টরি, সাপ্লায়ার ও মহাজনদের মোট পাওনা, চালান হিসাব এবং বিল পরিশোধ রেজিস্টার।
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportPayablesCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowAddBillModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Receipt className="w-3.5 h-3.5 text-slate-500" />
            <span>+ নতুন চালান বিল এন্ট্রি</span>
          </button>

          <button
            onClick={() => {
              if (appState.suppliers[0]) {
                setSelectedSupplierId(appState.suppliers[0].id);
              }
              setShowPayModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors"
          >
            <CreditCard className="w-4 h-4" />
            <span>+ বিল পরিশোধ করুন (Pay Supplier)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* 1. Total Payable Due */}
        <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-rose-800 block tracking-wider">
            আমার কাছে মোট পাওনা (Total Due)
          </span>
          <div className="text-2xl font-black text-rose-700 font-mono mt-1">
            {currency} {totalPayableDue.toLocaleString()}
          </div>
          <span className="text-[10px] text-rose-800 font-medium">ফ্যাক্টরি ও পার্টিদের বাকি</span>
        </div>

        {/* 2. Total Creditors Count */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-500 block tracking-wider">
            পাওনাদার সংখ্যা
          </span>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">
            {suppliersWithDueCount} <span className="text-xs font-normal text-slate-500">পার্টি</span>
          </div>
          <span className="text-[10px] text-slate-400">টাকা পাবে এমন সাপ্লায়ার</span>
        </div>

        {/* 3. Total Bills / Stock Intakes */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-500 block tracking-wider">
            মোট চালান ও ক্রয়ের মূল্য
          </span>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">
            {currency} {totalBillsAmount.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400">স্টক ক্রয় ও বিলসমূহ</span>
        </div>

        {/* 4. Total Paid */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-emerald-600 block tracking-wider">
            মোট পরিশোধিত টাকা
          </span>
          <div className="text-2xl font-black text-emerald-600 font-mono mt-1">
            {currency} {totalPaidToSuppliers.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400">সাপ্লায়ারদের দেওয়া হয়েছে</span>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="bg-white border-b border-slate-200 rounded-t-xl px-4 flex items-center gap-3">
        <button
          onClick={() => setActiveTab('creditors')}
          className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'creditors'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>ফ্যাক্টরি ও সাপ্লায়ার তালিকা ({payablesList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'payments'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>পরিশোধ হিস্টোরি ({(appState.supplierPayments || []).length})</span>
        </button>

        <button
          onClick={() => setActiveTab('bills')}
          className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'bills'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>চালান ও বিল তালিকা ({(appState.supplierBills || []).length})</span>
        </button>
      </div>

      {/* Tab 1: Creditors Table */}
      {activeTab === 'creditors' && (
        <div className="space-y-4">
          {/* Search & Filter */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search factory, phone, location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                />
              </div>

              <div className="flex items-center gap-1">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium"
                >
                  <option value="all">সব ফ্যাক্টরি (All)</option>
                  <option value="due">টাকা পাবে শুধু (Due Pending)</option>
                  <option value="cleared">পরিশোধিত (Cleared)</option>
                </select>
              </div>
            </div>

            <div className="text-xs font-semibold text-slate-500">
              দেখানো হচ্ছে: <span className="text-slate-900 font-bold">{filteredCreditors.length}</span> টি ফ্যাক্টরি
            </div>
          </div>

          {/* Creditors Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Factory / Supplier</th>
                    <th className="py-3 px-4">Contact & Location</th>
                    <th className="py-3 px-4 text-right">প্রারম্ভিক পাওনা</th>
                    <th className="py-3 px-4 text-right">স্টক ক্রয় / চালান</th>
                    <th className="py-3 px-4 text-right">মোট বিল</th>
                    <th className="py-3 px-4 text-right">পরিশোধ</th>
                    <th className="py-3 px-4 text-right font-black">আমার কাছে বর্তমান পাওনা</th>
                    <th className="py-3 px-4 text-center">স্ট্যাটাস</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCreditors.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        কোনো সাপ্লায়ার বা ফ্যাক্টরির তথ্য পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    filteredCreditors.map((item) => {
                      const hasDue = item.currentPayable > 0;

                      return (
                        <tr
                          key={item.supplier.id}
                          className="hover:bg-slate-50 transition-colors cursor-pointer"
                          onClick={() => setViewingSupplier(item.supplier)}
                        >
                          <td className="py-3 px-4 font-bold text-slate-900 text-sm">
                            <div>{item.supplier.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono font-normal">
                              ID: {item.supplier.id}
                            </div>
                          </td>

                          <td className="py-3 px-4 text-slate-600">
                            <div className="font-mono text-slate-800 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{item.supplier.phone || 'N/A'}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 truncate max-w-xs">
                              {item.supplier.address || 'Address unlisted'}
                            </div>
                          </td>

                          <td className="py-3 px-4 text-right font-mono text-slate-600">
                            {currency} {item.openingPayable.toLocaleString()}
                          </td>

                          <td className="py-3 px-4 text-right font-mono text-slate-700">
                            {currency} {item.stockInBills.toLocaleString()}
                          </td>

                          <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                            {currency} {item.totalBills.toLocaleString()}
                          </td>

                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                            {currency} {item.totalPaid.toLocaleString()}
                          </td>

                          {/* Current Payable Due */}
                          <td className="py-3 px-4 text-right font-mono">
                            <span
                              className={`font-black text-sm ${
                                hasDue ? 'text-rose-600' : 'text-slate-400'
                              }`}
                            >
                              {currency} {item.currentPayable.toLocaleString()}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                hasDue
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {hasDue ? 'টাকা পাবে' : 'পরিশোধিত'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedSupplierId(item.supplier.id);
                                  setPayAmount(item.currentPayable > 0 ? item.currentPayable : '');
                                  setShowPayModal(true);
                                }}
                                className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors"
                              >
                                বিল পরিশোধ
                              </button>
                              <button
                                onClick={() => setViewingSupplier(item.supplier)}
                                className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md transition-colors"
                              >
                                হিসাব খাতা
                              </button>
                              <button
                                onClick={() =>
                                  setSupplierToDelete({
                                    supplier: item.supplier,
                                    currentPayable: item.currentPayable,
                                  })
                                }
                                title="পাওনাদার মুছুন (Delete Creditor)"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-md transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
        </div>
      )}

      {/* Tab 2: Payments History */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Supplier / Factory</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4">Reference / Memo</th>
                    <th className="py-3 px-4">Notes</th>
                    <th className="py-3 px-4 text-right">Amount Paid</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(!appState.supplierPayments || appState.supplierPayments.length === 0) ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        এখনো কোনো সাপ্লায়ারকে বিল পরিশোধের রেকর্ড নেই।
                      </td>
                    </tr>
                  ) : (
                    appState.supplierPayments.map((pay) => (
                      <tr key={pay.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 text-slate-600">{pay.date}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{pay.supplierName}</td>
                        <td className="py-3 px-4 font-semibold text-indigo-700">{pay.paymentMethod}</td>
                        <td className="py-3 px-4 font-mono text-slate-600">{pay.reference || '-'}</td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{pay.notes || '-'}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                          {currency} {pay.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setPaymentToDelete(pay)}
                            title="পরিশোধ রেকর্ড মুছুন"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* Tab 3: Bills History */}
      {activeTab === 'bills' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Bill #</th>
                    <th className="py-3 px-4">Supplier / Factory</th>
                    <th className="py-3 px-4">Description / Notes</th>
                    <th className="py-3 px-4 text-right">Bill Amount</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(!appState.supplierBills || appState.supplierBills.length === 0) ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        ম্যানুয়াল কোনো চালান বিল এন্ট্রি নেই। (স্টক-ইন চালানসমূহ স্বয়ংক্রিয়ভাবে হিসাব হয়)।
                      </td>
                    </tr>
                  ) : (
                    appState.supplierBills.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 text-slate-600">{b.date}</td>
                        <td className="py-3 px-4 font-mono font-bold text-indigo-600">#{b.billNumber}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{b.supplierName}</td>
                        <td className="py-3 px-4 text-slate-600">{b.notes || '-'}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          {currency} {b.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setBillToDelete(b)}
                            title="চালান বিল মুছুন"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* ---------------- PAY BILL MODAL ---------------- */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden my-6">
            <div className="p-4 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-rose-200" />
                <span className="font-bold text-sm">বিল পরিশোধ করুন (Pay Supplier Bill)</span>
              </div>
              <button
                onClick={() => setShowPayModal(false)}
                className="text-rose-200 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePaySupplierSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ফ্যাক্টরি / মহাজন নির্বাচন করুন *
                </label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => {
                    setSelectedSupplierId(e.target.value);
                    const item = payablesList.find((p) => p.supplier.id === e.target.value);
                    if (item && item.currentPayable > 0) {
                      setPayAmount(item.currentPayable);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-medium"
                >
                  {appState.suppliers.map((s) => {
                    const stats = payablesList.find((p) => p.supplier.id === s.id);
                    return (
                      <option key={s.id} value={s.id}>
                        {s.name} (বাকি: ৳{stats ? stats.currentPayable.toLocaleString() : 0})
                      </option>
                    );
                  })}
                </select>
              </div>

              {selectedSupplierItem && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 block text-[11px]">বর্তমান পাওনা (Current Due)</span>
                    <span className="font-bold text-slate-900">{selectedSupplierItem.supplier.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-rose-700 text-base font-mono">
                      {currency} {selectedSupplierItem.currentPayable.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">পরিশোধের তারিখ *</label>
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">পরিশোধ মাধ্যম *</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="Cash">Cash (নগদ ক্যাশ)</option>
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Bank">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  পরিশোধের পরিমাণ ({currency}) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 5000"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  রেফারেন্স / চেক নম্বর (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cheque #49281, TR-9901"
                  value={payReference}
                  onChange={(e) => setPayReference(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">নোট / বিবরণ</label>
                <textarea
                  rows={2}
                  placeholder="e.g. চালান বিল বাবদ আংশিক/পূর্ণ পরিশোধ"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-[11px]">
                ℹ️ এই টাকা পরিশোধ করলে আপনার <strong>ক্যাশ ইন হ্যান্ড</strong> থেকে স্বয়ংক্রিয়ভাবে বিয়োগ হবে।
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
                >
                  পরিশোধ সেভ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- ADD BILL MODAL ---------------- */}
      {showAddBillModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden my-6">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-sm">নতুন চালান / বিল এন্ট্রি (Record Supplier Bill)</span>
              </div>
              <button
                onClick={() => setShowAddBillModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddBillSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ফ্যাক্টরি নির্বাচন *</label>
                <select
                  value={billSupplierId}
                  onChange={(e) => setBillSupplierId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                >
                  {appState.suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">চালান তারিখ *</label>
                  <input
                    type="date"
                    required
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">বিল নম্বর / চালান #</label>
                  <input
                    type="text"
                    placeholder="e.g. CHALAN-901"
                    value={billNumber}
                    onChange={(e) => setBillNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  বিলের পরিমাণ ({currency}) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 15000"
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">বিবরণ / নোট</label>
                <textarea
                  rows={2}
                  placeholder="e.g. ফেব্রিক্স চালান, প্যাকেজিং বিল ইত্যাদি"
                  value={billNotes}
                  onChange={(e) => setBillNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddBillModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  বিল সেভ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- SUPPLIER LEDGER MODAL ---------------- */}
      {viewingSupplier && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-rose-400" />
                <span className="font-bold text-sm">
                  {viewingSupplier.name} - হিসাব খাতা ও লেনদেন বিবরণী
                </span>
              </div>
              <button
                onClick={() => setViewingSupplier(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Summary Banner */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">মোট বিল</span>
                  <span className="text-base font-black text-slate-900 font-mono">
                    {currency} {viewingStats ? viewingStats.totalBills.toLocaleString() : 0}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">মোট পরিশোধ</span>
                  <span className="text-base font-black text-emerald-600 font-mono">
                    {currency} {viewingStats ? viewingStats.totalPaid.toLocaleString() : 0}
                  </span>
                </div>
                <div className="bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                  <span className="text-rose-700 block text-[10px] uppercase font-bold">বর্তমান পাওনা</span>
                  <span className="text-lg font-black text-rose-700 font-mono">
                    {currency} {viewingStats ? viewingStats.currentPayable.toLocaleString() : 0}
                  </span>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Ref</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-right">Billed (৳)</th>
                      <th className="py-2.5 px-3 text-right">Paid (৳)</th>
                      <th className="py-2.5 px-3 text-right font-black">Balance (৳)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {supplierLedgerEntries.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                          এই ফ্যাক্টরির কোনো লেনদেন রেকর্ড নেই।
                        </td>
                      </tr>
                    ) : (
                      supplierLedgerEntries.map((e) => (
                        <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 text-slate-600 font-sans">{e.date}</td>
                          <td className="py-2.5 px-3 font-sans">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                e.type === 'Payment'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {e.type}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-indigo-600 font-bold">{e.reference}</td>
                          <td className="py-2.5 px-3 text-slate-700 font-sans max-w-xs truncate">
                            {e.description}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                            {e.billedAmount > 0 ? e.billedAmount.toLocaleString() : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                            {e.paidAmount > 0 ? e.paidAmount.toLocaleString() : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-rose-700 bg-slate-50/50">
                            {e.runningBalance.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center gap-2 pt-2 border-t border-slate-200">
                <button
                  onClick={() => {
                    if (viewingStats) {
                      setSupplierToDelete({
                        supplier: viewingSupplier,
                        currentPayable: viewingStats.currentPayable,
                      });
                    }
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>পাওনাদার মুছুন (Delete)</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedSupplierId(viewingSupplier.id);
                      if (viewingStats && viewingStats.currentPayable > 0) {
                        setPayAmount(viewingStats.currentPayable);
                      }
                      setShowPayModal(true);
                    }}
                    className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
                  >
                    বিল পরিশোধ করুন
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- DELETE CREDITOR MODAL ---------------- */}
      {supplierToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-4 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-200" />
                <span className="font-bold text-sm">পাওনাদার / ফ্যাক্টরি মুছুন (Delete Creditor)</span>
              </div>
              <button
                onClick={() => setSupplierToDelete(null)}
                className="text-rose-200 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="font-bold text-sm text-slate-900">
                  {supplierToDelete.supplier.name}
                </div>
                <div className="text-slate-500 flex items-center gap-2">
                  <span>ফোন: {supplierToDelete.supplier.phone || 'N/A'}</span>
                  <span>•</span>
                  <span>ঠিকানা: {supplierToDelete.supplier.address || 'N/A'}</span>
                </div>
                <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between">
                  <span className="font-semibold text-slate-600">বর্তমান প্রদেয় পাওনা:</span>
                  <span className="font-mono font-bold text-rose-600 text-sm">
                    {currency} {supplierToDelete.currentPayable.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">সতর্কতা ও ডিলিট বিকল্প:</p>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    আপনি কি এই পাওনাদারকে স্থায়ীভাবে তালিকা থেকে মুছে ফেলতে চান নাকি শুধুমাত্র তার বর্তমান পাওনা ০ (শূন্য) করে দিতে চান?
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleConfirmDeleteSupplier(true)}
                  className="w-full py-2.5 px-3 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>পাওনাদার সম্পূর্ণ মুছে ফেলুন (Delete Creditor)</span>
                </button>

                {supplierToDelete.currentPayable > 0 && (
                  <button
                    type="button"
                    onClick={handleConfirmClearSupplierPayable}
                    className="w-full py-2.5 px-3 font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>শুধু বর্তমান পাওনা ০ (শূন্য) করুন (Clear Due to 0)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSupplierToDelete(null)}
                  className="w-full py-2 px-3 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  বাতিল করুন (Cancel)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- DELETE PAYMENT MODAL ---------------- */}
      {paymentToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden">
            <div className="p-4 bg-rose-600 text-white flex items-center justify-between">
              <span className="font-bold text-sm">বিল পরিশোধ রেকর্ড মুছবেন?</span>
              <button onClick={() => setPaymentToDelete(null)} className="text-white/80 hover:text-white">✕</button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <p className="text-slate-700">
                আপনি কি নিশ্চিত যে <strong>{paymentToDelete.supplierName}</strong>-কে করা <strong>{currency} {paymentToDelete.amount.toLocaleString()}</strong> পরিশোধের রেকর্ডটি মুছে ফেলতে চান?
              </p>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] text-slate-600">
                <div>তারিখ: {paymentToDelete.date}</div>
                <div>মাধ্যম: {paymentToDelete.paymentMethod}</div>
                <div>রেফারেন্স: {paymentToDelete.reference || '-'}</div>
              </div>
              <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                এটি মুছলে পরিশোধিত অর্থ ক্যাশ ইন হ্যান্ডে পুনরায় যুক্ত হবে এবং পাওনাদারের বাকি সমপরিমাণ বৃদ্ধি পাবে।
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentToDelete(null)}
                  className="px-3.5 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeletePayment}
                  className="px-3.5 py-1.5 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
                >
                  মুছে ফেলুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- DELETE BILL MODAL ---------------- */}
      {billToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden">
            <div className="p-4 bg-rose-600 text-white flex items-center justify-between">
              <span className="font-bold text-sm">চালান বিল মুছবেন?</span>
              <button onClick={() => setBillToDelete(null)} className="text-white/80 hover:text-white">✕</button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <p className="text-slate-700">
                আপনি কি নিশ্চিত যে <strong>#{billToDelete.billNumber}</strong> ({billToDelete.supplierName} - {currency} {billToDelete.amount.toLocaleString()}) চালান বিল এন্ট্রিটি মুছে ফেলতে চান?
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBillToDelete(null)}
                  className="px-3.5 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteBill}
                  className="px-3.5 py-1.5 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
                >
                  মুছে ফেলুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {feedbackMessage && (
        <div className="fixed bottom-4 right-4 z-50 p-4 bg-emerald-600 text-white rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{feedbackMessage}</span>
        </div>
      )}
    </div>
  );
};
