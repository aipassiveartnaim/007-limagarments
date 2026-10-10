import React, { useState } from 'react';
import {
  X,
  Printer,
  CreditCard,
  Phone,
  MapPin,
  Calendar,
  FileSpreadsheet,
  AlertTriangle,
  Receipt,
  User,
  ShoppingBag,
  BellRing,
  MessageSquare,
  Copy,
  Check,
  Edit2,
  Trash2,
  Plus,
  Building,
  CheckCircle,
} from 'lucide-react';
import { Customer, AppState, DueFollowUp, ClientType } from '../types';
import {
  getCustomerStats,
  getCustomerLedger,
  exportToCSV,
  updateCustomer,
  deleteCustomer,
  addDueFollowUp,
  updateDueFollowUp,
  deleteDueFollowUp,
  BANGLADESH_DISTRICTS,
} from '../services/storage';

interface CustomerLedgerModalProps {
  customer: Customer | null;
  appState: AppState;
  onClose: () => void;
  onOpenPaymentForCustomer: (customerId: string) => void;
  onCustomerUpdated?: (nextState: AppState) => void;
  onCustomerDeleted?: (nextState: AppState) => void;
}

export const CustomerLedgerModal: React.FC<CustomerLedgerModalProps> = ({
  customer,
  appState,
  onClose,
  onOpenPaymentForCustomer,
  onCustomerUpdated,
  onCustomerDeleted,
}) => {
  if (!customer) return null;

  // Re-fetch latest customer from appState in case updated
  const currentCustomer = appState.customers.find((c) => c.id === customer.id) || customer;
  const stats = getCustomerStats(currentCustomer, appState);
  const ledgerEntries = getCustomerLedger(currentCustomer.id, appState);
  const currency = appState.settings.currency || '৳';

  const [activeTab, setActiveTab] = useState<'ledger' | 'followups'>('ledger');
  const [copiedReminder, setCopiedReminder] = useState(false);

  // Edit Customer Modal State
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
  const [editName, setEditName] = useState(currentCustomer.name);
  const [editPhone, setEditPhone] = useState(currentCustomer.phone);
  const [editDistrict, setEditDistrict] = useState(currentCustomer.district || 'Dhaka');
  const [editArea, setEditArea] = useState(currentCustomer.area || '');
  const [editAddress, setEditAddress] = useState(currentCustomer.address || '');
  const [editClientType, setEditClientType] = useState<ClientType>(currentCustomer.clientType || 'market_distribution');
  const [editMarketName, setEditMarketName] = useState(currentCustomer.marketName || '');
  const [editDeliveryRoute, setEditDeliveryRoute] = useState(currentCustomer.deliveryRoute || '');
  const [editCreditLimit, setEditCreditLimit] = useState<number | ''>(currentCustomer.creditLimit || '');
  const [editStatus, setEditStatus] = useState(currentCustomer.status);

  // Delete Customer Modal State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Follow-up / তাগাদা Modal State
  const [showAddFollowUpModal, setShowAddFollowUpModal] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState<DueFollowUp | null>(null);
  const [followUpDate, setFollowUpDate] = useState(new Date().toISOString().split('T')[0]);
  const [followUpMethod, setFollowUpMethod] = useState<'Phone Call' | 'In Person' | 'WhatsApp' | 'SMS'>('Phone Call');
  const [followUpPromisedDate, setFollowUpPromisedDate] = useState('');
  const [followUpPromisedAmount, setFollowUpPromisedAmount] = useState<number | ''>(stats.currentDue);
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [followUpStatus, setFollowUpStatus] = useState<'pending' | 'collected' | 'rescheduled'>('pending');

  const followUps = currentCustomer.followUps || [];

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Reference/Memo', 'Purchase', 'Payment', 'Due Created', 'Running Balance', 'Description'];
    const rows = ledgerEntries.map((e) => [
      e.date,
      e.type,
      e.memoNumber || '-',
      e.purchase,
      e.payment,
      e.dueCreated,
      e.runningBalance,
      e.description,
    ]);
    exportToCSV(`Ledger_${currentCustomer.name.replace(/\s+/g, '_')}`, headers, rows);
  };

  // WhatsApp / SMS Reminder Copy
  const reminderMessage = `আসসালামু আলাইকুম ${currentCustomer.name},\nলিমা গার্মেন্টস থেকে আপনার বর্তমান মোট বাকি ${currency} ${stats.currentDue.toLocaleString()}। অনুগ্রহ করে হিসাব মিলিয়ে নেওয়ার জন্য যোগাযোগ করার অনুরোধ জানানো হচ্ছে।\nধন্যবাদ - লিমা গার্মেন্টস (${appState.settings.phone})`;

  const handleCopyReminder = () => {
    navigator.clipboard.writeText(reminderMessage);
    setCopiedReminder(true);
    setTimeout(() => setCopiedReminder(false), 3000);
  };

  const cleanPhone = (currentCustomer.phone || '').replace(/[^0-9]/g, '');
  const formattedPhone = cleanPhone.startsWith('0') ? '88' + cleanPhone : cleanPhone;
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(reminderMessage)}`;

  // Save Customer Profile Changes
  const handleSaveCustomerProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const nextState = updateCustomer(appState, currentCustomer.id, {
      name: editName.trim(),
      phone: editPhone.trim(),
      district: editDistrict,
      area: editArea.trim(),
      address: editAddress.trim(),
      clientType: editClientType,
      marketName: editMarketName.trim(),
      deliveryRoute: editDeliveryRoute.trim(),
      creditLimit: editCreditLimit === '' ? undefined : Number(editCreditLimit),
      status: editStatus,
    });

    if (onCustomerUpdated) onCustomerUpdated(nextState);
    setShowEditCustomerModal(false);
  };

  // Delete Customer Confirmation
  const handleConfirmDeleteCustomer = () => {
    const nextState = deleteCustomer(appState, currentCustomer.id);
    if (onCustomerDeleted) onCustomerDeleted(nextState);
    setShowDeleteConfirm(false);
    onClose();
  };

  // Add Follow-Up Submit
  const handleAddFollowUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextState = addDueFollowUp(appState, currentCustomer.id, {
      date: followUpDate,
      contactMethod: followUpMethod,
      promisedDate: followUpPromisedDate || undefined,
      promisedAmount: followUpPromisedAmount === '' ? undefined : Number(followUpPromisedAmount),
      notes: followUpNotes.trim(),
      status: followUpStatus,
    });

    if (onCustomerUpdated) onCustomerUpdated(nextState);
    setShowAddFollowUpModal(false);
    setFollowUpNotes('');
  };

  // Edit Follow-Up Submit
  const handleEditFollowUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFollowUp) return;

    const nextState = updateDueFollowUp(appState, currentCustomer.id, editingFollowUp.id, {
      date: editingFollowUp.date,
      contactMethod: editingFollowUp.contactMethod,
      promisedDate: editingFollowUp.promisedDate,
      promisedAmount: editingFollowUp.promisedAmount,
      notes: editingFollowUp.notes,
      status: editingFollowUp.status,
    });

    if (onCustomerUpdated) onCustomerUpdated(nextState);
    setEditingFollowUp(null);
  };

  // Delete Follow-Up Submit
  const handleDeleteFollowUp = (fuId: string) => {
    const nextState = deleteDueFollowUp(appState, currentCustomer.id, fuId);
    if (onCustomerUpdated) onCustomerUpdated(nextState);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Top Header Actions (hidden on print) */}
        <div className="no-print p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-400" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm block">{currentCustomer.name}</span>
                <span className="px-2 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
                  {currentCustomer.id}
                </span>
                {currentCustomer.clientType && (
                  <span className="px-2 py-0.2 rounded-full text-[10px] bg-indigo-900/60 text-indigo-300 font-medium">
                    {currentCustomer.clientType === 'market_distribution'
                      ? 'মার্কেট ডিস্ট্রিবিউশন'
                      : currentCustomer.clientType}
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400">
                {currentCustomer.district || 'Dhaka'} {currentCustomer.area ? `· ${currentCustomer.area}` : ''}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenPaymentForCustomer(currentCustomer.id)}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Receive Payment</span>
            </button>

            <button
              onClick={() => {
                setEditName(currentCustomer.name);
                setEditPhone(currentCustomer.phone);
                setEditDistrict(currentCustomer.district || 'Dhaka');
                setEditArea(currentCustomer.area || '');
                setEditAddress(currentCustomer.address || '');
                setEditClientType(currentCustomer.clientType || 'market_distribution');
                setEditMarketName(currentCustomer.marketName || '');
                setEditDeliveryRoute(currentCustomer.deliveryRoute || '');
                setEditCreditLimit(currentCustomer.creditLimit || '');
                setEditStatus(currentCustomer.status);
                setShowEditCustomerModal(true);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
              title="Edit Client Profile"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>এডিট</span>
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
              title="Delete Customer Profile"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={handleExportCSV}
              title="Export CSV"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Statement</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation (hidden on print) */}
        <div className="no-print flex border-b border-slate-200 bg-slate-50 px-6 gap-2 text-xs">
          <button
            onClick={() => setActiveTab('ledger')}
            className={`py-3 px-4 font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'ledger'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>হিসাব খাতা ও লেজার (Customer Due Ledger)</span>
          </button>

          <button
            onClick={() => setActiveTab('followups')}
            className={`py-3 px-4 font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'followups'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BellRing className="w-4 h-4" />
            <span>মার্কেট ডিস্ট্রিবিউশন ও তাগাদা রেজিস্টার ({followUps.length})</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-white print-container space-y-6">
          {/* Printable Business Letterhead */}
          <div className="border-b-2 border-slate-900 pb-4 text-center">
            <h2 className="text-xl font-black uppercase text-slate-900">
              {appState.settings.businessName}
            </h2>
            <p className="text-xs text-slate-500">
              {appState.settings.address} · Mob: {appState.settings.phone}
            </p>
            <div className="inline-block mt-2 px-3 py-0.5 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded-xs">
              Official Customer Account Ledger Statement
            </div>
          </div>

          {/* Customer Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Contact details */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                Party Information
              </span>
              <div className="font-bold text-sm text-slate-900">{currentCustomer.name}</div>
              <div className="flex items-center gap-1 text-slate-600 font-mono">
                <Phone className="w-3 h-3 text-slate-400" /> {currentCustomer.phone || 'N/A'}
              </div>
              <div className="flex items-center gap-1 text-slate-700 font-medium">
                <MapPin className="w-3 h-3 text-indigo-500" />
                <span>জেলা: {currentCustomer.district || 'Dhaka'}</span>
                {currentCustomer.area && <span className="text-slate-500">· এরিয়া: {currentCustomer.area}</span>}
              </div>
              {currentCustomer.marketName && (
                <div className="flex items-center gap-1 text-slate-600">
                  <Building className="w-3 h-3 text-slate-400" /> মার্কেট: {currentCustomer.marketName}
                </div>
              )}
              {currentCustomer.deliveryRoute && (
                <div className="text-[11px] text-slate-500">
                  রুট: {currentCustomer.deliveryRoute}
                </div>
              )}
              {currentCustomer.address && (
                <div className="text-[11px] text-slate-500 pt-0.5">
                  {currentCustomer.address}
                </div>
              )}
              <div className="text-[11px] text-slate-500 pt-1">
                Account Status:{' '}
                <span
                  className={`font-semibold capitalize ${
                    currentCustomer.status === 'active' ? 'text-emerald-600' : 'text-slate-500'
                  }`}
                >
                  {currentCustomer.status}
                </span>
              </div>
            </div>

            {/* Total purchase & paid */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                Transaction Totals
              </span>
              <div className="flex justify-between">
                <span className="text-slate-600">Total Purchase:</span>
                <span className="font-mono font-bold text-slate-900">
                  {currency} {stats.totalPurchase.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Total Paid:</span>
                <span className="font-mono font-bold text-emerald-600">
                  {currency} {stats.totalPaid.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Memos Issued:</span>
                <span className="font-mono font-bold text-slate-900">{stats.memoCount}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px] pt-1 border-t border-slate-200">
                <span>Last Activity:</span>
                <span>{stats.lastPurchaseDate || '-'}</span>
              </div>
            </div>

            {/* Outstanding Due Highlight */}
            <div
              className={`p-4 rounded-xl border flex flex-col justify-between ${
                stats.currentDue > 0
                  ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                  : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              }`}
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider block mb-1">
                  Current Outstanding Due
                </span>
                <div className="text-2xl font-black font-mono">
                  {currency} {stats.currentDue.toLocaleString()}
                </div>
              </div>
              <div className="text-xs pt-2">
                {stats.currentDue > 0 ? (
                  <span className="font-semibold text-amber-800 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Due payment pending
                  </span>
                ) : (
                  <span className="font-semibold text-emerald-800">
                    All accounts cleared ✓
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* TAB 1: Ledger Table */}
          {activeTab === 'ledger' && (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Memo / Ref</th>
                      <th className="py-2.5 px-3 text-right">Purchase</th>
                      <th className="py-2.5 px-3 text-right">Payment</th>
                      <th className="py-2.5 px-3 text-right">Due Created</th>
                      <th className="py-2.5 px-3 text-right font-black">Running Balance</th>
                      <th className="py-2.5 px-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {ledgerEntries.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400 font-sans">
                          No transactions recorded for this customer yet.
                        </td>
                      </tr>
                    ) : (
                      ledgerEntries.map((entry) => {
                        return (
                          <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-3 text-slate-600 font-sans whitespace-nowrap">
                              {entry.date}
                            </td>
                            <td className="py-2.5 px-3 font-sans">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  entry.type === 'Purchase'
                                    ? 'bg-blue-100 text-blue-800'
                                    : entry.type === 'Payment'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {entry.type}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-bold text-indigo-600">
                              {entry.memoNumber ? `#${entry.memoNumber}` : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                              {entry.purchase > 0 ? `${currency} ${entry.purchase.toLocaleString()}` : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                              {entry.payment > 0 ? `${currency} ${entry.payment.toLocaleString()}` : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-amber-600">
                              {entry.dueCreated > 0 ? `${currency} ${entry.dueCreated.toLocaleString()}` : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-black text-slate-900 bg-slate-50/60">
                              {currency} {entry.runningBalance.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 font-sans truncate max-w-xs">
                              {entry.description}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {ledgerEntries.length > 0 && (
                    <tfoot className="bg-slate-100 font-bold border-t border-slate-200">
                      <tr>
                        <td colSpan={3} className="py-2.5 px-3 uppercase text-slate-700 font-sans">
                          Closing Balance
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-900">
                          {currency} {stats.totalPurchase.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-600">
                          {currency} {stats.totalPaid.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-amber-600">
                          {currency} {stats.totalPurchase.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 bg-slate-200/60">
                          {currency} {stats.currentDue.toLocaleString()}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: Market Distribution & Due Follow-Ups (তাগাদা রেজিস্টার) */}
          {activeTab === 'followups' && (
            <div className="space-y-6">
              {/* Reminder Box & WhatsApp Quick Trigger */}
              <div className="bg-gradient-to-r from-indigo-50 to-emerald-50 p-4 rounded-xl border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <BellRing className="w-4 h-4 text-indigo-600" />
                    <h4 className="font-bold text-sm text-slate-900">
                      তাগাদা মেসেজ ও রিমাইন্ডার (Payment Follow-Up)
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    কাস্টমারকে বাকি পরিশোধের জন্য এসএমএস বা হোয়াটসঅ্যাপে তাগাদা পাঠানোর প্রস্তুত বার্তা।
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyReminder}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                  >
                    {copiedReminder ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedReminder ? 'মেসেজ কপি হয়েছে!' : 'কপি মেসেজ'}</span>
                  </button>

                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp তাগাদা</span>
                  </a>

                  <button
                    onClick={() => {
                      setFollowUpPromisedAmount(stats.currentDue);
                      setShowAddFollowUpModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ নতুন তাগাদা এন্ট্রি</span>
                  </button>
                </div>
              </div>

              {/* Follow-up Timeline & Records Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">তাগাদার তারিখ</th>
                      <th className="py-2.5 px-3">যোগাযোগ মাধ্যম</th>
                      <th className="py-2.5 px-3">ওয়াদার তারিখ (Promised Date)</th>
                      <th className="py-2.5 px-3 text-right">ওয়াদার পরিমাণ</th>
                      <th className="py-2.5 px-3">নোট ও মন্তব্য</th>
                      <th className="py-2.5 px-3 text-center">স্ট্যাটাস</th>
                      <th className="py-2.5 px-3 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {followUps.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-slate-400">
                          এখনো কোনো তাগাদা বা ফলো-আপ রেকর্ড করা হয়নি। "+ নতুন তাগাদা এন্ট্রি" বাটনে ক্লিক করে যোগ করুন।
                        </td>
                      </tr>
                    ) : (
                      followUps.map((fu) => (
                        <tr key={fu.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 font-medium text-slate-800 whitespace-nowrap">
                            {fu.date}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {fu.contactMethod}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-indigo-700">
                            {fu.promisedDate || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-600">
                            {fu.promisedAmount ? `${currency} ${fu.promisedAmount.toLocaleString()}` : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                            {fu.notes || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                                fu.status === 'collected'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : fu.status === 'rescheduled'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {fu.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setEditingFollowUp(fu)}
                                className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                                title="Edit Follow-up"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteFollowUp(fu.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                title="Delete Follow-up"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Signatures */}
          <div className="pt-12 grid grid-cols-2 gap-12 text-xs">
            <div className="text-center">
              <div className="border-t border-slate-300 pt-2 text-slate-500">
                Customer Signature & Verification
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-slate-300 pt-2 text-slate-500">
                Authorized Signature (Lima Garments)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- MODALS ---------------- */}

      {/* 1. Edit Customer Profile Modal */}
      {showEditCustomerModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-sm">কাস্টমার তথ্য এডিট করুন (Edit Customer Profile)</span>
              <button onClick={() => setShowEditCustomerModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveCustomerProfile} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer / Party Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 font-mono rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Client Type (ধরন)</label>
                  <select
                    value={editClientType}
                    onChange={(e) => setEditClientType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="market_distribution">মার্কেট ডিস্ট্রিবিউশন</option>
                    <option value="wholesale">হোলসেল (Wholesale)</option>
                    <option value="retail">রিটেল (Retail)</option>
                    <option value="dealer">ডিলার (Dealer)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">জেলা (District)</label>
                  <select
                    value={editDistrict}
                    onChange={(e) => setEditDistrict(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    {BANGLADESH_DISTRICTS.map((d) => (
                      <option key={d.name} value={d.name}>
                        {d.name} - {d.bnName} ({d.bnDivision})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">লোকেশন / এরিয়া (Area)</label>
                  <input
                    type="text"
                    placeholder="e.g. চকবাজার, বাবুবাজার"
                    value={editArea}
                    onChange={(e) => setEditArea(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">মার্কেটের নাম (Market Name)</label>
                  <input
                    type="text"
                    placeholder="e.g. বঙ্গ মার্কেট, ইসলামিয়া মার্কেট"
                    value={editMarketName}
                    onChange={(e) => setEditMarketName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ডিস্ট্রিবিউশন রুট (Route)</label>
                  <input
                    type="text"
                    placeholder="e.g. সদরঘাট রুট, নারায়ণগঞ্জ রুট"
                    value={editDeliveryRoute}
                    onChange={(e) => setEditDeliveryRoute(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">দোকানের ঠিকানা (Address)</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ক্রেডিট লিমিট (Credit Limit)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 50000"
                    value={editCreditLimit}
                    onChange={(e) => setEditCreditLimit(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">স্ট্যাটাস (Status)</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditCustomerModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  আপডেট সেভ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Delete Customer Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden">
            <div className="p-4 bg-rose-600 text-white flex items-center justify-between">
              <span className="font-bold text-sm">কাস্টমার ডিলিট করুন (Delete Customer)</span>
              <button onClick={() => setShowDeleteConfirm(false)} className="text-rose-200 hover:text-white">✕</button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-700">
                আপনি কি নিশ্চিত যে <strong>"{currentCustomer.name}"</strong> কাস্টমার প্রোফাইলটি মুছে ফেলতে চান?
              </p>
              {stats.currentDue > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 font-semibold">
                  ⚠️ এই কাস্টমারের <strong>{currency} {stats.currentDue.toLocaleString()}</strong> বকেয়া রয়েছে।
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteCustomer}
                  className="px-3 py-1.5 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
                >
                  হ্যাঁ, ডিলিট করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Add Follow-Up / তাগাদা Modal */}
      {showAddFollowUpModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-4 bg-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-sm">নতুন তাগাদা এন্ট্রি (Log Due Follow-Up)</span>
              </div>
              <button onClick={() => setShowAddFollowUpModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddFollowUpSubmit} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">তাগাদার তারিখ *</label>
                  <input
                    type="date"
                    required
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">যোগাযোগ মাধ্যম *</label>
                  <select
                    value={followUpMethod}
                    onChange={(e) => setFollowUpMethod(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="Phone Call">ফোন কল (Phone Call)</option>
                    <option value="In Person">সরাসরি দেখা (In Person)</option>
                    <option value="WhatsApp">হোয়াটসঅ্যাপ (WhatsApp)</option>
                    <option value="SMS">এসএমএস (SMS)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ওয়াদার তারিখ (Promised Date)</label>
                  <input
                    type="date"
                    value={followUpPromisedDate}
                    onChange={(e) => setFollowUpPromisedDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ওয়াদার পরিমাণ ({currency})</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 5000"
                    value={followUpPromisedAmount}
                    onChange={(e) => setFollowUpPromisedAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-1.5 font-mono rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">নোট ও মন্তব্য (Follow-up Notes)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. আগামী মঙ্গলবার বিকেলে ৫,০০০ টাকা পরিশোধ করবে বলেছেন..."
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">স্ট্যাটাস</label>
                <select
                  value={followUpStatus}
                  onChange={(e) => setFollowUpStatus(e.target.value as any)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="pending">Pending (অপেক্ষমাণ)</option>
                  <option value="collected">Collected (আদায় সম্পন্ন)</option>
                  <option value="rescheduled">Rescheduled (তারিখ পরিবর্তন)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddFollowUpModal(false)}
                  className="px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  তাগাদা সেভ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Edit Follow-Up Modal */}
      {editingFollowUp && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-sm">তাগাদা এডিট করুন (Edit Follow-Up)</span>
              <button onClick={() => setEditingFollowUp(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleEditFollowUpSubmit} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">তারিখ</label>
                  <input
                    type="date"
                    required
                    value={editingFollowUp.date}
                    onChange={(e) => setEditingFollowUp({ ...editingFollowUp, date: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">মাধ্যম</label>
                  <select
                    value={editingFollowUp.contactMethod}
                    onChange={(e) => setEditingFollowUp({ ...editingFollowUp, contactMethod: e.target.value as any })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="Phone Call">Phone Call</option>
                    <option value="In Person">In Person</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="SMS">SMS</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ওয়াদার তারিখ</label>
                  <input
                    type="date"
                    value={editingFollowUp.promisedDate || ''}
                    onChange={(e) => setEditingFollowUp({ ...editingFollowUp, promisedDate: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ওয়াদার পরিমাণ</label>
                  <input
                    type="number"
                    value={editingFollowUp.promisedAmount || ''}
                    onChange={(e) => setEditingFollowUp({ ...editingFollowUp, promisedAmount: e.target.value === '' ? undefined : Number(e.target.value) })}
                    className="w-full px-3 py-1.5 font-mono rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">নোট ও মন্তব্য</label>
                <textarea
                  rows={2}
                  value={editingFollowUp.notes}
                  onChange={(e) => setEditingFollowUp({ ...editingFollowUp, notes: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">স্ট্যাটাস</label>
                <select
                  value={editingFollowUp.status}
                  onChange={(e) => setEditingFollowUp({ ...editingFollowUp, status: e.target.value as any })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="pending">Pending</option>
                  <option value="collected">Collected (আদায় সম্পন্ন)</option>
                  <option value="rescheduled">Rescheduled</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingFollowUp(null)}
                  className="px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  আপডেট করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
