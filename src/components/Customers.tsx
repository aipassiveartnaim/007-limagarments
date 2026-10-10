import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  MapPin,
  CreditCard,
  FileSpreadsheet,
  Building,
  Edit2,
  Trash2,
  BellRing,
  CheckCircle,
  X,
  AlertTriangle,
} from 'lucide-react';
import { Customer, AppState, ClientType } from '../types';
import {
  getCustomerStats,
  exportToCSV,
  saveAppState,
  updateCustomer,
  deleteCustomer,
  BANGLADESH_DISTRICTS,
} from '../services/storage';

interface CustomersProps {
  appState: AppState;
  onOpenLedger: (customer: Customer) => void;
  onOpenPayment: (customerId: string) => void;
  onCustomerUpdated: (nextState: AppState) => void;
}

export const Customers: React.FC<CustomersProps> = ({
  appState,
  onOpenLedger,
  onOpenPayment,
  onCustomerUpdated,
}) => {
  const currency = appState.settings.currency || '৳';
  const today = new Date().toISOString().split('T')[0];

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [clientTypeFilter, setClientTypeFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New customer form state
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDistrict, setNewDistrict] = useState('Dhaka');
  const [newArea, setNewArea] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newClientType, setNewClientType] = useState<ClientType>('market_distribution');
  const [newMarketName, setNewMarketName] = useState('');
  const [newDeliveryRoute, setNewDeliveryRoute] = useState('');
  const [newCreditLimit, setNewCreditLimit] = useState<number | ''>('');

  // Edit customer state
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDistrict, setEditDistrict] = useState('Dhaka');
  const [editArea, setEditArea] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editClientType, setEditClientType] = useState<ClientType>('market_distribution');
  const [editMarketName, setEditMarketName] = useState('');
  const [editDeliveryRoute, setEditDeliveryRoute] = useState('');
  const [editCreditLimit, setEditCreditLimit] = useState<number | ''>('');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active');

  // Delete customer modal
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // Toast / feedback message
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Aggregate stats
  const customersWithStats = appState.customers.map((c) => ({
    customer: c,
    stats: getCustomerStats(c, appState),
  }));

  // Filtering by Name, Phone, District, Area, Market, Memo Number, Status, Client Type
  const filtered = customersWithStats.filter(({ customer }) => {
    if (statusFilter !== 'all' && customer.status !== statusFilter) return false;
    if (districtFilter !== 'all' && (customer.district || 'Dhaka') !== districtFilter) return false;
    if (clientTypeFilter !== 'all') {
      const type = customer.clientType || 'market_distribution';
      if (type !== clientTypeFilter) return false;
    }

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();

    const matchesNameOrPhone =
      customer.name.toLowerCase().includes(term) ||
      (customer.phone && customer.phone.toLowerCase().includes(term)) ||
      (customer.district && customer.district.toLowerCase().includes(term)) ||
      (customer.area && customer.area.toLowerCase().includes(term)) ||
      (customer.marketName && customer.marketName.toLowerCase().includes(term)) ||
      (customer.address && customer.address.toLowerCase().includes(term));
    if (matchesNameOrPhone) return true;

    // Search by Memo Number
    const matchesMemo = appState.memos.some(
      (m) => m.customerId === customer.id && m.memoNumber.toLowerCase().includes(term)
    );
    return matchesMemo;
  });

  const totalOutstandingDue = customersWithStats.reduce(
    (sum, c) => sum + c.stats.currentDue,
    0
  );

  const distributionCount = appState.customers.filter(
    (c) => (c.clientType || 'market_distribution') === 'market_distribution'
  ).length;

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      name: newName.trim(),
      phone: newPhone.trim(),
      district: newDistrict,
      area: newArea.trim(),
      address: newAddress.trim(),
      clientType: newClientType,
      marketName: newMarketName.trim() || undefined,
      deliveryRoute: newDeliveryRoute.trim() || undefined,
      creditLimit: newCreditLimit === '' ? undefined : Number(newCreditLimit),
      status: 'active',
      createdAt: today,
    };

    const nextState: AppState = {
      ...appState,
      customers: [newCustomer, ...appState.customers],
    };

    saveAppState(nextState);
    onCustomerUpdated(nextState);

    setFeedbackMessage(`কাস্টমার "${newCustomer.name}" সফলভাবে যুক্ত হয়েছে।`);
    setTimeout(() => setFeedbackMessage(null), 4000);

    setNewName('');
    setNewPhone('');
    setNewDistrict('Dhaka');
    setNewArea('');
    setNewAddress('');
    setNewMarketName('');
    setNewDeliveryRoute('');
    setNewCreditLimit('');
    setShowAddModal(false);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditName(customer.name);
    setEditPhone(customer.phone);
    setEditDistrict(customer.district || 'Dhaka');
    setEditArea(customer.area || '');
    setEditAddress(customer.address || '');
    setEditClientType(customer.clientType || 'market_distribution');
    setEditMarketName(customer.marketName || '');
    setEditDeliveryRoute(customer.deliveryRoute || '');
    setEditCreditLimit(customer.creditLimit || '');
    setEditStatus(customer.status);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    const nextState = updateCustomer(appState, editingCustomer.id, {
      name: editName.trim(),
      phone: editPhone.trim(),
      district: editDistrict,
      area: editArea.trim(),
      address: editAddress.trim(),
      clientType: editClientType,
      marketName: editMarketName.trim() || undefined,
      deliveryRoute: editDeliveryRoute.trim() || undefined,
      creditLimit: editCreditLimit === '' ? undefined : Number(editCreditLimit),
      status: editStatus,
    });

    onCustomerUpdated(nextState);
    setFeedbackMessage(`কাস্টমার "${editName}" সফলভাবে আপডেট হয়েছে।`);
    setTimeout(() => setFeedbackMessage(null), 4000);
    setEditingCustomer(null);
  };

  const handleConfirmDelete = () => {
    if (!customerToDelete) return;

    const nextState = deleteCustomer(appState, customerToDelete.id);
    onCustomerUpdated(nextState);
    setFeedbackMessage(`কাস্টমার "${customerToDelete.name}" সফলভাবে ডিলিট করা হয়েছে।`);
    setTimeout(() => setFeedbackMessage(null), 4000);
    setCustomerToDelete(null);
  };

  const handleExportCSV = () => {
    const headers = [
      'Customer ID',
      'Name',
      'Client Type (ধরন)',
      'Phone',
      'District (জেলা)',
      'Area / Market (লোকেশন)',
      'Market Name',
      'Address',
      'Status',
      'Total Purchase',
      'Total Paid',
      'Current Due',
      'Follow-ups Count',
      'Last Purchase Date',
    ];
    const rows = customersWithStats.map(({ customer, stats }) => [
      customer.id,
      customer.name,
      customer.clientType || 'market_distribution',
      customer.phone,
      customer.district || 'Dhaka',
      customer.area || '',
      customer.marketName || '',
      customer.address,
      customer.status,
      stats.totalPurchase,
      stats.totalPaid,
      stats.currentDue,
      customer.followUps ? customer.followUps.length : 0,
      stats.lastPurchaseDate || '-',
    ]);
    exportToCSV('Customer_Directory_Lima_Garments', headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Customer Management & Ledgers</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              ডিস্ট্রিবিউশন ও রিটেল ক্লায়েন্ট
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time accounts receivable, credit ledgers, 64 districts coverage, and due follow-up (তাগাদা) directory.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-indigo-50 px-3.5 py-1.5 rounded-xl border border-indigo-200 text-right">
            <span className="text-[10px] font-semibold text-indigo-700 uppercase block">
              Market Distribution
            </span>
            <span className="text-base font-black text-indigo-900 font-mono">
              {distributionCount} Clients
            </span>
          </div>

          <div className="bg-amber-50 px-3.5 py-1.5 rounded-xl border border-amber-200 text-right">
            <span className="text-[10px] font-semibold text-amber-800 uppercase block">
              Total Customer Due
            </span>
            <span className="text-base font-black text-amber-700 font-mono tabular-nums">
              {currency} {totalOutstandingDue.toLocaleString()}
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
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, phone, area, memo #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          {/* District Filter Dropdown */}
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
            >
              <option value="all">All Districts (সব জেলা)</option>
              {BANGLADESH_DISTRICTS.map((d) => (
                <option key={d.name} value={d.name}>
                  {d.name} ({d.bnName})
                </option>
              ))}
            </select>
          </div>

          {/* Client Type Filter */}
          <div className="flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={clientTypeFilter}
              onChange={(e) => setClientTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium"
            >
              <option value="all">সব ধরন (All Types)</option>
              <option value="market_distribution">মার্কেট ডিস্ট্রিবিউশন</option>
              <option value="wholesale">হোলসেল / পাইকারি</option>
              <option value="retail">খুচরা (Retail)</option>
              <option value="dealer">ডিলার (Dealer)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200">
            {(['all', 'active', 'inactive'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 text-xs font-semibold rounded-md capitalize transition-colors ${
                  statusFilter === s
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Customer ID / Name</th>
                <th className="py-3 px-4">Type & Market</th>
                <th className="py-3 px-4">District & Area (লোকেশন)</th>
                <th className="py-3 px-4">Phone & Address</th>
                <th className="py-3 px-4 text-center">তাগাদা (Follow-up)</th>
                <th className="py-3 px-4 text-right">Total Purchase</th>
                <th className="py-3 px-4 text-right">Total Paid</th>
                <th className="py-3 px-4 text-right">Current Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No customers found matching your search.
                  </td>
                </tr>
              ) : (
                filtered.map(({ customer, stats }) => {
                  const hasDue = stats.currentDue > 0;
                  const isHighDue = stats.currentDue >= 5000;
                  const distInfo = BANGLADESH_DISTRICTS.find((d) => d.name === customer.district);
                  const followUps = customer.followUps || [];
                  const pendingFollowUps = followUps.filter((f) => f.status === 'pending');

                  return (
                    <tr
                      key={customer.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => onOpenLedger(customer)}
                    >
                      {/* Name & ID */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                          {customer.name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          ID: {customer.id}
                        </div>
                      </td>

                      {/* Type & Market */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            customer.clientType === 'market_distribution' || !customer.clientType
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : customer.clientType === 'wholesale'
                              ? 'bg-blue-100 text-blue-800'
                              : customer.clientType === 'dealer'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {customer.clientType === 'market_distribution' || !customer.clientType
                            ? 'মার্কেট ডিস্ট্রিবিউশন'
                            : customer.clientType === 'wholesale'
                            ? 'হোলসেল'
                            : customer.clientType === 'dealer'
                            ? 'ডিলার'
                            : 'খুচরা'}
                        </span>
                        {customer.marketName && (
                          <div className="text-[11px] text-slate-600 font-medium mt-0.5 flex items-center gap-1">
                            <Building className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{customer.marketName}</span>
                          </div>
                        )}
                      </td>

                      {/* District & Area */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
                          <span>{customer.district || 'Dhaka'}</span>
                          {distInfo && (
                            <span className="text-[11px] text-slate-400">({distInfo.bnName})</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-600 font-medium mt-0.5 truncate max-w-xs">
                          {customer.area ? (
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-800">
                              {customer.area}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">No specific area</span>
                          )}
                        </div>
                      </td>

                      {/* Phone & Address */}
                      <td className="py-3 px-4 text-slate-600">
                        <div className="font-mono text-slate-800">{customer.phone || 'N/A'}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">
                          {customer.address || 'Address unlisted'}
                        </div>
                      </td>

                      {/* Follow-up / তাগাদা Count & Next Date */}
                      <td className="py-3 px-4 text-center">
                        {pendingFollowUps.length > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <BellRing className="w-2.5 h-2.5" />
                            <span>তাগাদা ({pendingFollowUps.length})</span>
                          </span>
                        ) : followUps.length > 0 ? (
                          <span className="text-[10px] text-slate-500">
                            {followUps.length} তাগাদা সম্পন্ন
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">-</span>
                        )}
                      </td>

                      {/* Total Purchase */}
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                        {currency} {stats.totalPurchase.toLocaleString()}
                      </td>

                      {/* Total Paid */}
                      <td className="py-3 px-4 text-right font-mono text-emerald-600">
                        {currency} {stats.totalPaid.toLocaleString()}
                      </td>

                      {/* Current Due with warning badges */}
                      <td className="py-3 px-4 text-right font-mono">
                        <span
                          className={`font-bold ${
                            isHighDue
                              ? 'text-rose-600 font-mono text-sm'
                              : hasDue
                              ? 'text-amber-600 font-mono'
                              : 'text-slate-400'
                          }`}
                        >
                          {currency} {stats.currentDue.toLocaleString()}
                        </span>
                        {isHighDue && (
                          <span className="block text-[9px] uppercase tracking-wide text-rose-700 font-bold">
                            High Due
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            customer.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {customer.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenPayment(customer.id)}
                            className="px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
                            title="Receive Payment"
                          >
                            পেমেন্ট
                          </button>
                          <button
                            onClick={() => onOpenLedger(customer)}
                            className="px-2 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-colors"
                            title="View Ledger & Follow-ups"
                          >
                            লেজার
                          </button>
                          <button
                            onClick={() => handleOpenEdit(customer)}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors"
                            title="Edit Client"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setCustomerToDelete(customer)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                            title="Delete Client"
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

      {/* ---------------- ADD CUSTOMER MODAL ---------------- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-6">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-sm">নতুন কাস্টমার নিবন্ধন (Register New Customer)</span>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer / Business Name (কাস্টমার বা প্রতিষ্ঠানের নাম) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahim Wholesale, মায়ের দোয়া বস্ত্রালয়"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ক্লায়েন্ট ধরন (Client Type) *
                  </label>
                  <select
                    value={newClientType}
                    onChange={(e) => setNewClientType(e.target.value as ClientType)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white font-medium"
                  >
                    <option value="market_distribution">মার্কেট ডিস্ট্রিবিউশন</option>
                    <option value="wholesale">হোলসেল / পাইকারি</option>
                    <option value="retail">খুচরা (Retail)</option>
                    <option value="dealer">ডিলার (Dealer)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    মার্কেটের নাম (Market Name)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. বঙ্গ মার্কেট, ইসলামপুর, তেরীবাজার"
                    value={newMarketName}
                    onChange={(e) => setNewMarketName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* District Selection (All 64 districts) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-indigo-500" /> জেলা (District) *
                  </label>
                  <select
                    value={newDistrict}
                    onChange={(e) => setNewDistrict(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  >
                    {BANGLADESH_DISTRICTS.map((d) => (
                      <option key={d.name} value={d.name}>
                        {d.name} - {d.bnName} ({d.bnDivision})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Specific Area / Market */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    লোকেশন / এরিয়া (Area / Thana)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. চকবাজার, টানবাজার, নিউ মার্কেট"
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number (মোবাইল নম্বর)
                  </label>
                  <input
                    type="text"
                    placeholder="017XX-XXXXXX"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ডেলিভারি রুট (Delivery Route)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. রুট-১ (ঢাকা-নারায়ণগঞ্জ)"
                    value={newDeliveryRoute}
                    onChange={(e) => setNewDeliveryRoute(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Market / Shop Address (দোকানের বিস্তারিত ঠিকানা)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Shop 12, 1st Floor, Chawkbazar, Old Dhaka"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  কাস্টমার সেভ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- EDIT CUSTOMER MODAL ---------------- */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-6">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-sm">কাস্টমার তথ্য এডিট করুন (Edit Customer Profile)</span>
              </div>
              <button
                onClick={() => setEditingCustomer(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer / Business Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ক্লায়েন্ট ধরন (Client Type)
                  </label>
                  <select
                    value={editClientType}
                    onChange={(e) => setEditClientType(e.target.value as ClientType)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-medium"
                  >
                    <option value="market_distribution">মার্কেট ডিস্ট্রিবিউশন</option>
                    <option value="wholesale">হোলসেল / পাইকারি</option>
                    <option value="retail">খুচরা (Retail)</option>
                    <option value="dealer">ডিলার (Dealer)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    মার্কেটের নাম (Market Name)
                  </label>
                  <input
                    type="text"
                    value={editMarketName}
                    onChange={(e) => setEditMarketName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-indigo-500" /> জেলা (District)
                  </label>
                  <select
                    value={editDistrict}
                    onChange={(e) => setEditDistrict(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                  >
                    {BANGLADESH_DISTRICTS.map((d) => (
                      <option key={d.name} value={d.name}>
                        {d.name} - {d.bnName} ({d.bnDivision})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    লোকেশন / এরিয়া (Area)
                  </label>
                  <input
                    type="text"
                    value={editArea}
                    onChange={(e) => setEditArea(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Market / Shop Address
                </label>
                <textarea
                  rows={2}
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  আপডেট সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- DELETE CUSTOMER CONFIRM MODAL ---------------- */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-4 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-200" />
                <span className="font-bold text-sm">কাস্টমার প্রোফাইল ডিলিট নিশ্চিতকরণ</span>
              </div>
              <button
                onClick={() => setCustomerToDelete(null)}
                className="text-rose-200 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-700">
                আপনি কি নিশ্চিত যে আপনি কাস্টমার <strong>"{customerToDelete.name}"</strong> কে ডিলিট করতে চান?
              </p>

              <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-900 space-y-1">
                <span className="font-bold block text-[11px] uppercase tracking-wide">
                  ⚠️ সতর্কতা:
                </span>
                <p className="text-[11px]">
                  এই কাস্টমারের প্রোফাইল এবং তাগাদা রেকর্ড মুছে যাবে। তবে পূর্বে তৈরিকৃত মেমো ও লেনদেনের রেকর্ড অডিট হিস্টোরির জন্য সংরক্ষিত থাকবে।
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCustomerToDelete(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  না, ফিরে যান
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
                >
                  হ্যাঁ, ডিলিট করুন
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
