import React, { useState } from 'react';
import {
  MapPin,
  Building,
  Users,
  Search,
  Filter,
  FileSpreadsheet,
  TrendingUp,
  CreditCard,
  Plus,
  Store,
  X,
  CheckCircle,
} from 'lucide-react';
import { AppState, Customer } from '../types';
import {
  getCustomerAreaStats,
  getCustomerStats,
  BANGLADESH_DIVISIONS,
  BANGLADESH_DISTRICTS,
  exportToCSV,
  saveAppState,
} from '../services/storage';

interface CustomerAreasProps {
  appState: AppState;
  onSelectCustomer: (customer: Customer) => void;
  onOpenPayment: (customerId: string) => void;
  onNavigateToCustomersWithDistrict?: (district: string) => void;
  onCustomerCreated?: (nextState: AppState) => void;
}

export const CustomerAreas: React.FC<CustomerAreasProps> = ({
  appState,
  onSelectCustomer,
  onOpenPayment,
  onCustomerCreated,
}) => {
  const currency = appState.settings.currency || '৳';
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Add Customer Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDistrict, setNewDistrict] = useState('Dhaka');
  const [newArea, setNewArea] = useState('');
  const [newAddress, setNewAddress] = useState('');

  const areaStats = getCustomerAreaStats(appState);

  // Filter district summaries based on division and search
  const filteredDistricts = areaStats.districtSummaries.filter((d) => {
    if (selectedDivision !== 'all' && d.division !== selectedDivision) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      d.district.toLowerCase().includes(term) ||
      d.bnDistrict.includes(term) ||
      d.division.toLowerCase().includes(term) ||
      d.bnDivision.includes(term) ||
      d.areas.some((a) => a.toLowerCase().includes(term)) ||
      d.customers.some(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          (c.area && c.area.toLowerCase().includes(term)) ||
          (c.phone && c.phone.toLowerCase().includes(term))
      )
    );
  });

  // Filter customers based on selected district, division, and search
  const filteredCustomers = appState.customers.filter((c) => {
    const cDist = c.district || 'Dhaka';
    const distInfo = BANGLADESH_DISTRICTS.find((d) => d.name === cDist);

    if (selectedDistrict !== 'all' && cDist !== selectedDistrict) return false;
    if (selectedDivision !== 'all' && distInfo && distInfo.division !== selectedDivision) return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      (c.phone && c.phone.toLowerCase().includes(term)) ||
      (c.area && c.area.toLowerCase().includes(term)) ||
      cDist.toLowerCase().includes(term) ||
      (c.address && c.address.toLowerCase().includes(term))
    );
  });

  const handleExportAreaCSV = () => {
    const headers = [
      'District (জেলা)',
      'Division (বিভাগ)',
      'Customer Count',
      'Areas / Markets (লোকেশনসমূহ)',
      'Total Purchases',
      'Total Paid',
      'Current Due',
    ];
    const rows = filteredDistricts.map((d) => [
      `${d.district} (${d.bnDistrict})`,
      `${d.division} (${d.bnDivision})`,
      d.customerCount,
      d.areas.join('; '),
      d.totalPurchase,
      d.totalPaid,
      d.totalDue,
    ]);
    exportToCSV('Customer_Areas_Lima_Garments', headers, rows);
  };

  const handleOpenAddModal = (districtDefault?: string) => {
    setNewDistrict(districtDefault || (selectedDistrict !== 'all' ? selectedDistrict : 'Dhaka'));
    setNewName('');
    setNewPhone('');
    setNewArea('');
    setNewAddress('');
    setShowAddModal(true);
  };

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
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
    };

    const nextState: AppState = {
      ...appState,
      customers: [newCustomer, ...appState.customers],
    };

    saveAppState(nextState);
    if (onCustomerCreated) {
      onCustomerCreated(nextState);
    }
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-emerald-50 text-emerald-700">
              Customer Geography
            </span>
            <span className="text-xs text-slate-500 font-medium">
              বাংলাদেশ ব্যাপী ক্লায়েন্ট লোকেশন
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            কোন কোন এরিয়ার কাস্টমার আছে (Client Locations & Districts)
          </h2>
          <p className="text-xs text-slate-500">
            Geographic distribution of clothing wholesale & retail clients across Bangladesh districts and markets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportAreaCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Area CSV</span>
          </button>

          <button
            onClick={() => handleOpenAddModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ নতুন কাস্টমার যুক্ত করুন</span>
          </button>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Covered Districts */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Covered Districts</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
              {areaStats.totalCoveredDistricts} <span className="text-xs font-normal text-slate-500 font-sans">/ 64 জেলা</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Active client districts across Bangladesh
            </div>
          </div>
        </div>

        {/* Total Covered Areas / Markets */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Markets & Locations</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-emerald-600 font-mono tabular-nums">
              {areaStats.totalCoveredAreas} <span className="text-xs font-normal text-slate-500 font-sans">লোকেশন ও বাজার</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Registered cloth markets, thanas & areas
            </div>
          </div>
        </div>

        {/* Top District by Clients */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Top Client Hub</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-700 truncate">
              {areaStats.topDistrictByCustomers
                ? `${areaStats.topDistrictByCustomers.district} (${areaStats.topDistrictByCustomers.bnDistrict})`
                : 'N/A'}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {areaStats.topDistrictByCustomers
                ? `${areaStats.topDistrictByCustomers.customerCount} Active Clients`
                : '-'}
            </div>
          </div>
        </div>

        {/* Top District by Sales Volume */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Top Sales Territory</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg font-bold text-purple-700 truncate">
              {areaStats.topDistrictBySales
                ? `${areaStats.topDistrictBySales.district} (${areaStats.topDistrictBySales.bnDistrict})`
                : 'N/A'}
            </div>
            <div className="text-xs font-mono text-purple-600 font-bold mt-1">
              {currency} {areaStats.topDistrictBySales ? areaStats.topDistrictBySales.totalPurchase.toLocaleString() : '0'}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search district (জেলা), market/area, or client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          {/* District Selector (All 64 districts) */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Filter District:</span>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white w-full sm:w-56"
            >
              <option value="all">All Districts (বাংলাদেশের সব ৬৪ জেলা)</option>
              {BANGLADESH_DISTRICTS.map((d) => (
                <option key={d.name} value={d.name}>
                  {d.name} - {d.bnName} ({d.bnDivision})
                </option>
              ))}
            </select>
            {selectedDistrict !== 'all' && (
              <button
                onClick={() => setSelectedDistrict('all')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline whitespace-nowrap"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Division Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-500 font-medium text-[11px] mr-1 shrink-0">বিভাগ:</span>
          <button
            onClick={() => setSelectedDivision('all')}
            className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedDivision === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            সকল বিভাগ (All)
          </button>
          {BANGLADESH_DIVISIONS.map((div) => (
            <button
              key={div.name}
              onClick={() => setSelectedDivision(div.name)}
              className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedDivision === div.name
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {div.bnName} ({div.name})
            </button>
          ))}
        </div>
      </div>

      {/* District Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Building className="w-4 h-4 text-indigo-600" />
            জেলা ও মার্কেট ভিত্তিক কাস্টমার ওভারভিউ (District Distribution Cards)
          </h3>
          <span className="text-xs text-slate-400">
            {filteredDistricts.length} active districts
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDistricts.length === 0 ? (
            <div className="col-span-full py-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
              No customer records found matching this area/division filter.
            </div>
          ) : (
            filteredDistricts.map((d) => {
              const isSelected = selectedDistrict === d.district;

              return (
                <div
                  key={d.district}
                  className={`bg-white p-4 rounded-xl border transition-all hover:shadow-md cursor-pointer ${
                    isSelected
                      ? 'border-indigo-600 ring-2 ring-indigo-500/15 bg-indigo-50/20'
                      : 'border-slate-200 hover:border-indigo-200'
                  }`}
                  onClick={() => setSelectedDistrict(isSelected ? 'all' : d.district)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                        {d.district} ({d.bnDistrict})
                      </h4>
                      <span className="text-[11px] text-slate-500">
                        {d.bnDivision} বিভাগ ({d.division})
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                      {d.customerCount} {d.customerCount === 1 ? 'Client' : 'Clients'}
                    </span>
                  </div>

                  {/* Specific Areas / Markets */}
                  <div className="mt-2 pt-2 border-t border-slate-100 text-xs">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      Markets & Locations (এরিয়া / বাজার):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {d.areas.length > 0 ? (
                        d.areas.map((area, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-800 font-medium"
                          >
                            {area}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">General District Center</span>
                      )}
                    </div>
                  </div>

                  {/* Financial Totals for this District */}
                  <div className="mt-3 pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Total Sales:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {currency} {d.totalPurchase.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Outstanding Due:</span>
                      <span className="font-mono font-bold text-amber-600">
                        {currency} {d.totalDue.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenAddModal(d.district);
                      }}
                      className="text-[11px] font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add to {d.district}
                    </button>

                    <span className="text-[11px] text-indigo-600 font-semibold inline-flex items-center gap-1">
                      {isSelected ? 'Filtering Active ✓' : 'View Clients →'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Customer List in Selected Area */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-0">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {selectedDistrict !== 'all'
                ? `${selectedDistrict} জেলার কাস্টমার তালিকা (${filteredCustomers.length})`
                : `সকল এরিয়ার কাস্টমার তালিকা (${filteredCustomers.length})`}
            </h3>
            <p className="text-xs text-slate-500">
              Click any client row to open their full transaction ledger and profile.
            </p>
          </div>

          {selectedDistrict !== 'all' && (
            <button
              onClick={() => setSelectedDistrict('all')}
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              Show All Districts
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Client / Party Name</th>
                <th className="py-3 px-4">District (জেলা)</th>
                <th className="py-3 px-4">Area / Market (লোকেশন)</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4 text-right">Total Purchase</th>
                <th className="py-3 px-4 text-right">Outstanding Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No customers found in this selected district/area.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const distInfo = BANGLADESH_DISTRICTS.find((d) => d.name === cust.district);
                  const cStats = getCustomerStats(cust, appState);

                  return (
                    <tr
                      key={cust.id}
                      onClick={() => onSelectCustomer(cust)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        <div>{cust.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono font-normal">
                          ID: {cust.id}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">
                          {cust.district || 'Dhaka'}
                        </span>
                        {distInfo && (
                          <span className="text-slate-400 ml-1 text-[11px]">
                            ({distInfo.bnName})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {cust.area ? (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                            {cust.area}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Unspecified</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {cust.phone || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                        {currency} {cStats.totalPurchase.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span className={cStats.currentDue > 0 ? 'text-amber-600' : 'text-slate-400'}>
                          {currency} {cStats.currentDue.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            cust.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {cust.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenPayment(cust.id)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
                          >
                            Payment
                          </button>
                          <button
                            onClick={() => onSelectCustomer(cust)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-colors"
                          >
                            Ledger →
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

      {/* Add Customer Modal with 64 Bangladesh Districts & Area Selection */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-sm">নতুন কাস্টমার নিবন্ধন (Register Client with Location)</span>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
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
                    লোকেশন / এরিয়া / মার্কেট (Area / Market)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. চকবাজার, টানবাজার, তেরীবাজার"
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

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
    </div>
  );
};
