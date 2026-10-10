import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Search,
  FileSpreadsheet,
  Building,
  MapPin,
  Phone,
  CreditCard,
  Receipt,
  Boxes,
  BellRing,
  AlertTriangle,
  Users,
  CheckCircle,
  X,
  TrendingUp,
  FileText,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { AppState, Customer, Memo } from '../types';
import {
  get007DistributionData,
  exportToCSV,
  BANGLADESH_DISTRICTS,
  saveAppState,
} from '../services/storage';

interface Factory007DistributionProps {
  appState: AppState;
  onOpenLedger: (customer: Customer) => void;
  onOpenPayment: (customerId: string) => void;
  onNewMemoWithSupplier?: (supplierId: string, customerId?: string) => void;
  onViewMemo: (memo: Memo) => void;
  onCustomerUpdated: (nextState: AppState) => void;
}

export const Factory007Distribution: React.FC<Factory007DistributionProps> = ({
  appState,
  onOpenLedger,
  onOpenPayment,
  onNewMemoWithSupplier,
  onViewMemo,
  onCustomerUpdated,
}) => {
  const currency = appState.settings.currency || '৳';
  const today = new Date().toISOString().split('T')[0];

  const [activeTab, setActiveTab] = useState<'clients' | 'deliveries' | 'inventory'>('clients');
  const [searchTerm, setSearchTerm] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [dueFilter, setDueFilter] = useState<'all' | 'due' | 'cleared'>('all');

  // Quick Add Client Modal
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientDistrict, setNewClientDistrict] = useState('Dhaka');
  const [newClientArea, setNewClientArea] = useState('');
  const [newClientMarket, setNewClientMarket] = useState('');
  const [newClientRoute, setNewClientRoute] = useState('ঢাকা-মার্কেট রুট');
  const [newClientAddress, setNewClientAddress] = useState('');

  // Toast / feedback message
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const distData = get007DistributionData(appState);
  const { supplier } = distData;

  // Filter clients
  const filteredClients = distData.distributionClients.filter((item) => {
    const cust = item.customer;
    if (districtFilter !== 'all' && (cust.district || 'Dhaka') !== districtFilter) return false;
    if (dueFilter === 'due' && item.currentDue <= 0) return false;
    if (dueFilter === 'cleared' && item.currentDue > 0) return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();

    return (
      cust.name.toLowerCase().includes(term) ||
      (cust.phone && cust.phone.toLowerCase().includes(term)) ||
      (cust.area && cust.area.toLowerCase().includes(term)) ||
      (cust.marketName && cust.marketName.toLowerCase().includes(term)) ||
      (cust.district && cust.district.toLowerCase().includes(term)) ||
      (cust.deliveryRoute && cust.deliveryRoute.toLowerCase().includes(term)) ||
      item.itemsBreakdown.some((b) => b.productName.toLowerCase().includes(term))
    );
  });

  // Filter 007 memos
  const filteredMemos = distData.memosWith007.filter((m) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      m.memoNumber.toLowerCase().includes(term) ||
      m.customerName.toLowerCase().includes(term) ||
      (m.customerPhone && m.customerPhone.toLowerCase().includes(term)) ||
      m.items.some((it) => it.productName.toLowerCase().includes(term))
    );
  });

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    const newCustomer: Customer = {
      id: `cust-007-${Date.now()}`,
      name: newClientName.trim(),
      phone: newClientPhone.trim(),
      district: newClientDistrict,
      area: newClientArea.trim(),
      marketName: newClientMarket.trim() || undefined,
      deliveryRoute: newClientRoute.trim() || undefined,
      address: newClientAddress.trim(),
      clientType: 'market_distribution',
      status: 'active',
      createdAt: today,
    };

    const nextState: AppState = {
      ...appState,
      customers: [newCustomer, ...appState.customers],
    };

    saveAppState(nextState);
    onCustomerUpdated(nextState);

    setFeedbackMessage(`০০৭ ডিস্ট্রিবিউশন ক্লায়েন্ট "${newCustomer.name}" সফলভাবে যুক্ত হয়েছে।`);
    setTimeout(() => setFeedbackMessage(null), 4000);

    setNewClientName('');
    setNewClientPhone('');
    setNewClientArea('');
    setNewClientMarket('');
    setNewClientAddress('');
    setShowAddClientModal(false);
  };

  const handleExportClientsCSV = () => {
    const headers = [
      'Client ID',
      'Client Name',
      'Market / Area',
      'District (জেলা)',
      'Phone',
      'Delivery Route',
      'Total 007 Qty (pcs)',
      'Total Bill (৳)',
      'Total Paid (৳)',
      'Current Due (৳)',
      'Memos Count',
      'Last Delivery Date',
    ];
    const rows = filteredClients.map((c) => [
      c.customer.id,
      c.customer.name,
      c.customer.marketName || c.customer.area || '-',
      c.customer.district || 'Dhaka',
      c.customer.phone || '-',
      c.customer.deliveryRoute || '-',
      c.totalQuantity,
      c.totalBill,
      c.totalPaid,
      c.currentDue,
      c.memoCount,
      c.lastDeliveryDate || '-',
    ]);
    exportToCSV('007_Factory_Product_Distribution_Clients', headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
              007
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span>007 Factory Product Distribution</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                  {supplier?.name || '007 Factory'}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                ০০৭ ফ্যাক্টরি পণ্য মার্কেট ডিস্ট্রিবিউশন, ডেলিভারি ক্লায়েন্ট তালিকা, চালান ও বকেয়া রেজিস্টার।
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportClientsCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowAddClientModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
          >
            <Users className="w-3.5 h-3.5" />
            <span>+ নতুন ডিস্ট্রিবিউশন ক্লায়েন্ট</span>
          </button>

          <button
            onClick={() => {
              if (onNewMemoWithSupplier && supplier) {
                onNewMemoWithSupplier(supplier.id);
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ নতুন ০০৭ চালান / মেমো</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Live Warehouse Stock */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-500 block tracking-wider">
            ০০৭ বর্তমান স্টক
          </span>
          <div className="text-lg font-black text-slate-900 font-mono mt-1">
            {distData.totalStockInHand.toLocaleString()} <span className="text-xs font-normal text-slate-500">pcs</span>
          </div>
          <span className="text-[10px] text-slate-400">ওয়্যারহাউসে মজুদ</span>
        </div>

        {/* 2. Total Distributed Quantity */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-blue-600 block tracking-wider">
            মোট সরবরাহ / বিক্রি
          </span>
          <div className="text-lg font-black text-blue-700 font-mono mt-1">
            {distData.totalDistributedQty.toLocaleString()} <span className="text-xs font-normal text-slate-500">pcs</span>
          </div>
          <span className="text-[10px] text-slate-400">মার্কেটে ডেলিভারি</span>
        </div>

        {/* 3. Total Distribution Sales Volume */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-500 block tracking-wider">
            মোট ডিস্ট্রিবিউশন সেল
          </span>
          <div className="text-lg font-black text-slate-900 font-mono mt-1">
            {currency} {distData.totalDistributedSales.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400">চালানের মোট মূল্য</span>
        </div>

        {/* 4. Total Cash Collected */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-emerald-600 block tracking-wider">
            মোট নগদ জমা
          </span>
          <div className="text-lg font-black text-emerald-600 font-mono mt-1">
            {currency} {distData.totalCollected.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400">কালেকশন প্রাপ্ত</span>
        </div>

        {/* 5. Total Market Due Pending */}
        <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-amber-800 block tracking-wider">
            মার্কেট বাকি (বকেয়া)
          </span>
          <div className="text-lg font-black text-amber-700 font-mono mt-1">
            {currency} {distData.totalMarketDue.toLocaleString()}
          </div>
          <span className="text-[10px] text-amber-800 font-medium">তাগাদা যোগ্য বাকি</span>
        </div>

        {/* 6. Active Distribution Clients */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-purple-600 block tracking-wider">
            ডিস্ট্রিবিউশন ক্লায়েন্ট
          </span>
          <div className="text-lg font-black text-purple-700 font-mono mt-1">
            {distData.distributionClients.length} <span className="text-xs font-normal text-slate-500">পার্টি</span>
          </div>
          <span className="text-[10px] text-slate-400">সক্রিয় পার্টি</span>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="bg-white border-b border-slate-200 rounded-t-xl px-4 flex items-center gap-3">
        <button
          onClick={() => setActiveTab('clients')}
          className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'clients'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>ডিস্ট্রিবিউশন ক্লায়েন্ট তালিকা ({distData.distributionClients.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('deliveries')}
          className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'deliveries'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>০০৭ চালান ও ডেলিভারি হিস্টোরি ({distData.memosWith007.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'inventory'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>০০৭ ওয়্যারহাউস লাইভ স্টক ({distData.stockRows007.length})</span>
        </button>
      </div>

      {/* Tab 1: Distribution Clients List */}
      {activeTab === 'clients' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search client, phone, market, route..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              {/* District Filter */}
              <div className="flex items-center gap-1">
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

              {/* Due Filter */}
              <div className="flex items-center gap-1">
                <select
                  value={dueFilter}
                  onChange={(e) => setDueFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium"
                >
                  <option value="all">সব ক্লায়েন্ট (All)</option>
                  <option value="due">বাকি আছে শুধু (With Dues)</option>
                  <option value="cleared">পরিশোধিত (Cleared)</option>
                </select>
              </div>
            </div>

            <div className="text-xs font-semibold text-slate-500">
              দেখানো হচ্ছে: <span className="text-slate-900 font-bold">{filteredClients.length}</span> জন ক্লায়েন্ট
            </div>
          </div>

          {/* Client Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Client / Party</th>
                    <th className="py-3 px-4">Market & Location (মার্কেট / এরিয়া)</th>
                    <th className="py-3 px-4">Route & Contact</th>
                    <th className="py-3 px-4">সরবরাহকৃত ০০৭ পণ্য</th>
                    <th className="py-3 px-4 text-center">মোট পিস</th>
                    <th className="py-3 px-4 text-right">মোট বিল</th>
                    <th className="py-3 px-4 text-right">জমা</th>
                    <th className="py-3 px-4 text-right">বর্তমান বাকি</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        ০০৭ ফ্যাক্টরি প্রোডাক্টের জন্য কোনো ডিস্ট্রিবিউশন ক্লায়েন্ট পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map((item) => {
                      const cust = item.customer;
                      const hasDue = item.currentDue > 0;

                      return (
                        <tr
                          key={cust.id}
                          onClick={() => onOpenLedger(cust)}
                          className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                        >
                          {/* Client Name & ID */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                              {cust.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              ID: {cust.id}
                            </div>
                          </td>

                          {/* Market & Location */}
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-800 flex items-center gap-1">
                              <Building className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{cust.marketName || 'Local Market'}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
                              <span>{cust.district || 'Dhaka'}</span>
                              {cust.area && <span className="text-slate-400">· {cust.area}</span>}
                            </div>
                          </td>

                          {/* Route & Contact */}
                          <td className="py-3 px-4">
                            <div className="font-mono text-slate-800 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{cust.phone || 'N/A'}</span>
                            </div>
                            {cust.deliveryRoute && (
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                রুট: <span className="font-medium text-slate-700">{cust.deliveryRoute}</span>
                              </div>
                            )}
                          </td>

                          {/* 007 Items Taken */}
                          <td className="py-3 px-4">
                            {item.itemsBreakdown.length === 0 ? (
                              <span className="text-slate-400 italic">নতুন ক্লায়েন্ট (মেমো অপেক্ষমাণ)</span>
                            ) : (
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {item.itemsBreakdown.map((b, i) => (
                                  <span
                                    key={i}
                                    className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-medium border border-indigo-100"
                                  >
                                    {b.productName}: {b.quantity} pcs
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>

                          {/* Total 007 Qty */}
                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                            {item.totalQuantity > 0 ? `${item.totalQuantity} pcs` : '০'}
                          </td>

                          {/* Total Bill */}
                          <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                            {currency} {item.totalBill.toLocaleString()}
                          </td>

                          {/* Total Paid */}
                          <td className="py-3 px-4 text-right font-mono text-emerald-600">
                            {currency} {item.totalPaid.toLocaleString()}
                          </td>

                          {/* Current Due */}
                          <td className="py-3 px-4 text-right font-mono">
                            <span
                              className={`font-black ${
                                hasDue ? 'text-amber-600 font-mono text-sm' : 'text-slate-400'
                              }`}
                            >
                              {currency} {item.currentDue.toLocaleString()}
                            </span>
                            {hasDue && (
                              <span className="block text-[9px] uppercase tracking-wide text-amber-700 font-bold">
                                মার্কেট বকেয়া
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => onOpenPayment(cust.id)}
                                className="px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
                                title="Receive Payment"
                              >
                                পেমেন্ট
                              </button>
                              <button
                                onClick={() => onOpenLedger(cust)}
                                className="px-2 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-colors"
                                title="View Customer Ledger & Tagada"
                              >
                                হিসাব / তাগাদা
                              </button>
                              <button
                                onClick={() => {
                                  if (onNewMemoWithSupplier && supplier) {
                                    onNewMemoWithSupplier(supplier.id, cust.id);
                                  }
                                }}
                                className="p-1 text-slate-500 hover:text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors"
                                title="Create 007 Memo for this client"
                              >
                                <Receipt className="w-3.5 h-3.5" />
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

      {/* Tab 2: 007 Memos History */}
      {activeTab === 'deliveries' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Memo #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Client Name</th>
                    <th className="py-3 px-4">007 Products & Qty</th>
                    <th className="py-3 px-4 text-right">Total Bill</th>
                    <th className="py-3 px-4 text-right">Paid</th>
                    <th className="py-3 px-4 text-right">Due</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMemos.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        ০০৭ ফ্যাক্টরি প্রোডাক্টের জন্য কোনো চালান মেমো পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    filteredMemos.map((memo) => {
                      const items007 = memo.items.filter(
                        (it) => it.supplierId === (supplier?.id || 'sup-1')
                      );

                      return (
                        <tr
                          key={memo.id}
                          className="hover:bg-slate-50 transition-colors cursor-pointer"
                          onClick={() => onViewMemo(memo)}
                        >
                          <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                            #{memo.memoNumber}
                          </td>
                          <td className="py-3 px-4 text-slate-600">{memo.date}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {memo.customerName}
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-0.5">
                              {items007.map((it, idx) => (
                                <div key={idx} className="text-[11px] text-slate-700">
                                  {it.productName} × {it.quantity} pcs @ {currency}{it.unitPrice}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                            {currency} {memo.subtotal.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                            {currency} {memo.paid.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold">
                            <span className={memo.due > 0 ? 'text-amber-600' : 'text-slate-400'}>
                              {currency} {memo.due.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => onViewMemo(memo)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                            >
                              ভিউ চালান
                            </button>
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

      {/* Tab 3: 007 Warehouse Live Stock */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">007 Factory Item</th>
                    <th className="py-3 px-4 text-center">Opening Consignment</th>
                    <th className="py-3 px-4 text-center">Total Stock In</th>
                    <th className="py-3 px-4 text-center">Distributed / Sold</th>
                    <th className="py-3 px-4 text-right font-bold text-slate-900">Current Stock in Hand</th>
                    <th className="py-3 px-4 text-center">Stock Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {distData.stockRows007.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        ০০৭ ফ্যাক্টরির কোনো স্টক আইটেম পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    distData.stockRows007.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {row.productName}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-500">
                          {row.openingStock} pcs
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-semibold text-blue-600">
                          +{row.stockIn} pcs
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-semibold text-rose-600">
                          -{row.sold} pcs
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-sm text-slate-900">
                          {row.currentStock.toLocaleString()} pcs
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              row.currentStock <= 0
                                ? 'bg-rose-100 text-rose-800'
                                : row.currentStock <= row.minStockLevel
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {row.currentStock <= 0
                              ? 'স্টক শেষ'
                              : row.currentStock <= row.minStockLevel
                              ? 'স্বল্প স্টক'
                              : 'স্টকে আছে'}
                          </span>
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

      {/* ---------------- ADD CLIENT MODAL ---------------- */}
      {showAddClientModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-6">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-sm">নতুন ০০৭ ডিস্ট্রিবিউশন ক্লায়েন্ট নিবন্ধন</span>
              </div>
              <button
                onClick={() => setShowAddClientModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ক্লায়েন্ট / প্রতিষ্ঠানের নাম *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahim Cloth Store, মায়ের দোয়া বস্ত্রালয়"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    মোবাইল নম্বর
                  </label>
                  <input
                    type="text"
                    placeholder="017XX-XXXXXX"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    মার্কেটের নাম (Market Name)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. চকবাজার মার্কেট, ইসলামপুর"
                    value={newClientMarket}
                    onChange={(e) => setNewClientMarket(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-indigo-500" /> জেলা (District)
                  </label>
                  <select
                    value={newClientDistrict}
                    onChange={(e) => setNewClientDistrict(e.target.value)}
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
                    placeholder="e.g. চকবাজার, টানবাজার"
                    value={newClientArea}
                    onChange={(e) => setNewClientArea(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ডেলিভারি রুট (Delivery Route)
                </label>
                <input
                  type="text"
                  placeholder="e.g. রুট-১ (ঢাকা-চকবাজার-সদরঘাট)"
                  value={newClientRoute}
                  onChange={(e) => setNewClientRoute(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  বিস্তারিত ঠিকানা
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Shop #14, 2nd Floor, Chawkbazar Super Market"
                  value={newClientAddress}
                  onChange={(e) => setNewClientAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddClientModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  ক্লায়েন্ট সেভ করুন
                </button>
              </div>
            </form>
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
