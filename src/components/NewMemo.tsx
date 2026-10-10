import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Save,
  Printer,
  AlertCircle,
  CheckCircle,
  Building2,
  Layers,
  Banknote,
  User,
  Phone,
  FileText,
  Calendar,
  MapPin,
} from 'lucide-react';
import { AppState, Memo, PaymentMethod } from '../types';
import {
  createMemoTransaction,
  getSupplierProductStock,
  getCustomerStats,
  BANGLADESH_DISTRICTS,
} from '../services/storage';

interface NewMemoProps {
  appState: AppState;
  onMemoCreated: (nextState: AppState, createdMemo: Memo) => void;
  onCancel?: () => void;
}

interface ItemRow {
  productId: string;
  supplierId: string;
  quantity: number | '';
  unitPrice: number | '';
  availableStock: number;
}

export const NewMemo: React.FC<NewMemoProps> = ({
  appState,
  onMemoCreated,
}) => {
  const currency = appState.settings.currency || '৳';
  const today = new Date().toISOString().split('T')[0];

  // Auto-generate next memo number based on count
  const nextMemoNumber = `${appState.settings.memoPrefix || 'MEMO-'}${1001 + appState.memos.length}`;

  const [memoNumber, setMemoNumber] = useState(nextMemoNumber);
  const [date, setDate] = useState(today);

  // Customer state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerDistrict, setCustomerDistrict] = useState<string>('Dhaka');
  const [customerArea, setCustomerArea] = useState<string>('');
  const [customerAddress, setCustomerAddress] = useState<string>('');
  const [isNewCustomer, setIsNewCustomer] = useState(appState.customers.length === 0);

  // Items in memo (multi-item support)
  const defaultProduct = appState.products[0];
  const defaultSupplier = appState.suppliers[0];

  const initialStock =
    defaultProduct && defaultSupplier
      ? getSupplierProductStock(appState, defaultSupplier.id, defaultProduct.id)
      : 0;

  const [items, setItems] = useState<ItemRow[]>([
    {
      productId: defaultProduct ? defaultProduct.id : '',
      supplierId: defaultSupplier ? defaultSupplier.id : '',
      quantity: 1,
      unitPrice: defaultProduct ? defaultProduct.sellingPrice : 0,
      availableStock: initialStock,
    },
  ]);

  const [paid, setPaid] = useState<number | ''>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // When selecting existing customer
  const handleCustomerSelect = (customerId: string) => {
    if (customerId === 'NEW') {
      setIsNewCustomer(true);
      setSelectedCustomerId('');
      setCustomerName('');
      setCustomerPhone('');
      setCustomerDistrict('Dhaka');
      setCustomerArea('');
      setCustomerAddress('');
    } else {
      setIsNewCustomer(false);
      setSelectedCustomerId(customerId);
      const cust = appState.customers.find((c) => c.id === customerId);
      if (cust) {
        setCustomerName(cust.name);
        setCustomerPhone(cust.phone);
        setCustomerDistrict(cust.district || 'Dhaka');
        setCustomerArea(cust.area || '');
        setCustomerAddress(cust.address);
      }
    }
  };

  // If customer list has records, default to first customer; if empty, new customer
  useEffect(() => {
    if (appState.customers.length > 0 && !selectedCustomerId && !isNewCustomer) {
      handleCustomerSelect(appState.customers[0].id);
    } else if (appState.customers.length === 0) {
      setIsNewCustomer(true);
      setSelectedCustomerId('');
    }
  }, [appState.customers]);

  // Update stock when row's product or supplier changes
  const updateRowStock = (index: number, prodId: string, supId: string) => {
    if (!prodId || !supId) return 0;
    return getSupplierProductStock(appState, supId, prodId);
  };

  const handleRowChange = (index: number, field: keyof ItemRow, val: any) => {
    setItems((prev) => {
      const next = [...prev];
      const row = { ...next[index], [field]: val };

      if (field === 'productId') {
        const prod = appState.products.find((p) => p.id === val);
        if (prod) {
          row.unitPrice = prod.sellingPrice;
        }
        row.availableStock = updateRowStock(index, val, row.supplierId);
      } else if (field === 'supplierId') {
        row.availableStock = updateRowStock(index, row.productId, val);
      }

      next[index] = row;
      return next;
    });
  };

  const handleAddItemRow = () => {
    const firstProd = appState.products[0];
    const firstSup = appState.suppliers[0];
    const avail =
      firstProd && firstSup ? getSupplierProductStock(appState, firstSup.id, firstProd.id) : 0;

    setItems((prev) => [
      ...prev,
      {
        productId: firstProd?.id || '',
        supplierId: firstSup?.id || '',
        quantity: 1,
        unitPrice: firstProd?.sellingPrice || 0,
        availableStock: avail,
      },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Calculations
  const calculatedItems = items.map((it) => {
    const q = Number(it.quantity) || 0;
    const p = Number(it.unitPrice) || 0;
    return {
      ...it,
      lineTotal: q * p,
    };
  });

  const subtotal = calculatedItems.reduce((sum, it) => sum + it.lineTotal, 0);
  const paidNum = Math.max(0, Number(paid) || 0);
  const due = Math.max(0, subtotal - paidNum);

  // Quick payment presets
  const handleSetFullPaid = () => setPaid(subtotal);
  const handleSetHalfPaid = () => setPaid(Math.round(subtotal / 2));
  const handleSetZeroPaid = () => setPaid(0);

  // Existing customer due info
  const selectedCustomerObj = appState.customers.find((c) => c.id === selectedCustomerId);
  const customerStats = selectedCustomerObj ? getCustomerStats(selectedCustomerObj, appState) : null;

  // Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // 1. Validation
      if (!customerName.trim()) {
        throw new Error('Please specify a customer name.');
      }
      if (items.length === 0) {
        throw new Error('Memo must contain at least one product item.');
      }

      // Check rows
      for (let i = 0; i < items.length; i++) {
        const row = items[i];
        const q = Number(row.quantity);
        const p = Number(row.unitPrice);

        if (!row.productId) throw new Error(`Line ${i + 1}: Please select a product.`);
        if (!row.supplierId) throw new Error(`Line ${i + 1}: Please select a factory/supplier.`);
        if (isNaN(q) || q < 0) throw new Error(`Line ${i + 1}: Quantity cannot be negative.`);
        if (isNaN(p) || p < 0) throw new Error(`Line ${i + 1}: Unit price cannot be negative.`);

        // Check stock availability (only if quantity > 0)
        if (!appState.settings.allowNegativeStock && q > 0) {
          const avail = getSupplierProductStock(appState, row.supplierId, row.productId);
          if (avail < q) {
            const prod = appState.products.find((p) => p.id === row.productId);
            const sup = appState.suppliers.find((s) => s.id === row.supplierId);
            throw new Error(
              `Insufficient stock for "${prod?.name || 'Product'}" at factory "${sup?.name || 'Supplier'}". Available: ${avail} pcs, requested: ${q} pcs.`
            );
          }
        }
      }

      if (paidNum > subtotal) {
        throw new Error(`Paid amount (${currency} ${paidNum}) cannot exceed total subtotal (${currency} ${subtotal}).`);
      }

      // Resolve customer ID
      let finalCustomerId = selectedCustomerId;
      if (isNewCustomer || !finalCustomerId) {
        finalCustomerId = `cust-${Date.now()}`;
      }

      // Prepare payload
      const preparedItems = items.map((it) => {
        const prod = appState.products.find((p) => p.id === it.productId);
        const sup = appState.suppliers.find((s) => s.id === it.supplierId);
        const q = Number(it.quantity);
        const p = Number(it.unitPrice);
        return {
          productId: it.productId,
          productName: prod ? prod.name : 'Unknown Product',
          supplierId: it.supplierId,
          supplierName: sup ? sup.name : 'Unknown Supplier',
          quantity: q,
          unitPrice: p,
          total: q * p,
          unitCost: prod?.costPrice,
        };
      });

      const nextState = createMemoTransaction(appState, {
        memoNumber: memoNumber.trim(),
        customerId: finalCustomerId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerDistrict: customerDistrict || 'Dhaka',
        customerArea: customerArea.trim(),
        date,
        items: preparedItems,
        subtotal,
        paid: paidNum,
        due,
        paymentMethod,
        notes: notes.trim(),
      });

      const createdMemo = nextState.memos[0];
      setSuccessMessage(`Memo #${createdMemo.memoNumber} saved successfully!`);
      onMemoCreated(nextState, createdMemo);
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while saving the memo.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-indigo-50 text-indigo-700">
              Billing Terminal
            </span>
            <span className="text-xs text-slate-400 font-mono">Invoice #{memoNumber}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Create Automatic Memo</h2>
          <p className="text-xs text-slate-500">
            Sale will automatically deduct factory stock, update customer ledger & cash in hand.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-right">
            <span className="text-[11px] text-slate-500 font-medium block">Total Payable</span>
            <span className="text-lg font-extrabold text-slate-900 font-mono tabular-nums">
              {currency} {subtotal.toLocaleString()}
            </span>
          </div>
          <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-right">
            <span className="text-[11px] text-amber-700 font-medium block">Due Generated</span>
            <span className="text-lg font-extrabold text-amber-600 font-mono tabular-nums">
              {currency} {due.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Error / Success Notifications */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Validation Warning: </span>
            {errorMessage}
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Success: </span>
            {successMessage}
          </div>
        </div>
      )}

      {/* Main Memo Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Memo Meta & Customer Section */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 flex items-center gap-2">
            <User className="w-4 h-4 text-slate-500" />
            Customer & Invoice Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Memo Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Memo Number *
              </label>
              <input
                type="text"
                required
                value={memoNumber}
                onChange={(e) => setMemoNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
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

            {/* Customer Dropdown */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Customer Account
              </label>
              <div className="flex gap-2">
                <select
                  value={isNewCustomer ? 'NEW' : selectedCustomerId}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                >
                  {appState.customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone || 'No phone'})
                    </option>
                  ))}
                  <option value="NEW">+ Register New Customer...</option>
                </select>
                <button
                  type="button"
                  onClick={() => handleCustomerSelect('NEW')}
                  className="px-2.5 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg whitespace-nowrap"
                >
                  New Customer
                </button>
              </div>
            </div>
          </div>

          {/* Customer Details Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                required
                placeholder="Enter customer name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone Number
              </label>
              <input
                type="text"
                placeholder="017XX-XXXXXX"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            {/* Bangladesh 64 Districts */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-500" /> জেলা (District)
              </label>
              <select
                value={customerDistrict}
                onChange={(e) => setCustomerDistrict(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              >
                {BANGLADESH_DISTRICTS.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name} - {d.bnName} ({d.bnDivision})
                  </option>
                ))}
              </select>
            </div>

            {/* Location / Area Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                লোকেশন / এরিয়া (Area / Market)
              </label>
              <input
                type="text"
                placeholder="e.g. চকবাজার, টানবাজার, তেরীবাজার"
                value={customerArea}
                onChange={(e) => setCustomerArea(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          </div>

          {/* Customer Due Status Banner if existing */}
          {customerStats && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Customer Profile:</span>
                <span className="font-bold text-slate-800">{customerName}</span>
                <span className="text-slate-400 font-mono">
                  ({customerDistrict || 'Dhaka'}{customerArea ? ` · ${customerArea}` : ''})
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-slate-400 mr-1">Lifetime Purchases:</span>
                  <span className="font-mono font-semibold text-slate-700">
                    {currency} {customerStats.totalPurchase.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 mr-1">Previous Outstanding Due:</span>
                  <span className="font-bold text-amber-600 font-mono">
                    {currency} {customerStats.currentDue.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Product Items Table */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-500" />
              Order Items & Factory Stock
            </h3>
            <button
              type="button"
              onClick={handleAddItemRow}
              className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Another Product
            </button>
          </div>

          <div className="space-y-3">
            {items.map((row, index) => {
              const lineTotal = (Number(row.quantity) || 0) * (Number(row.unitPrice) || 0);
              const isInsufficient =
                !appState.settings.allowNegativeStock &&
                Number(row.quantity) > row.availableStock;

              return (
                <div
                  key={index}
                  className={`p-3 rounded-xl border transition-all ${
                    isInsufficient
                      ? 'border-rose-300 bg-rose-50/40'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    {/* Product Selection (4 cols) */}
                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Product Item *
                      </label>
                      <select
                        required
                        value={row.productId}
                        onChange={(e) => handleRowChange(index, 'productId', e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                      >
                        <option value="">
                          {appState.products.length === 0 ? '-- কোনো পণ্য নেই (আগে পণ্য যোগ করুন) --' : '-- পণ্য নির্বাচন করুন --'}
                        </option>
                        {appState.products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (৳{p.sellingPrice})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Supplier / Factory Selection (3 cols) */}
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                        <span>Supplier / Factory *</span>
                        <span
                          className={`font-mono text-[10px] px-1.5 py-0.2 rounded-sm ${
                            row.availableStock > 0
                              ? 'bg-emerald-100 text-emerald-800 font-bold'
                              : 'bg-rose-100 text-rose-800 font-bold'
                          }`}
                        >
                          Stock: {row.availableStock} pcs
                        </span>
                      </label>
                      <select
                        required
                        value={row.supplierId}
                        onChange={(e) => handleRowChange(index, 'supplierId', e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                      >
                        <option value="">
                          {appState.suppliers.length === 0 ? '-- কোনো ফ্যাক্টরি নেই --' : '-- ফ্যাক্টরি নির্বাচন করুন --'}
                        </option>
                        {appState.suppliers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity (2 cols) */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Quantity (pcs) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={row.quantity}
                        onChange={(e) =>
                          handleRowChange(
                            index,
                            'quantity',
                            e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0)
                          )
                        }
                        className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border focus:outline-hidden ${
                          isInsufficient
                            ? 'border-rose-400 bg-rose-50 text-rose-900 focus:ring-rose-500'
                            : 'border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600'
                        }`}
                      />
                    </div>

                    {/* Unit Price (2 cols) */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Unit Price ({currency}) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={row.unitPrice}
                        onChange={(e) =>
                          handleRowChange(
                            index,
                            'unitPrice',
                            e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0)
                          )
                        }
                        className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      />
                    </div>

                    {/* Delete Action (1 col) */}
                    <div className="sm:col-span-1 flex items-center justify-end pb-1">
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(index)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Line Total & Warning */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 text-xs">
                    {isInsufficient ? (
                      <span className="text-rose-600 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Insufficient stock! Available in {appState.suppliers.find((s) => s.id === row.supplierId)?.name}: {row.availableStock} pcs
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">
                        Formula: {row.quantity || 0} pcs × {currency} {row.unitPrice || 0}
                      </span>
                    )}
                    <span className="font-mono font-bold text-slate-900">
                      Line Total: {currency} {lineTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment & Calculation Box */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Banknote className="w-4 h-4 text-slate-500" />
            Payment Terms & Due Allocation
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Calculation summary */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Subtotal (Total Amount):</span>
                <span className="font-mono font-bold text-slate-900">
                  {currency} {subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-xs text-emerald-700 font-semibold">
                <span>Paid Now (Cash Received):</span>
                <span className="font-mono tabular-nums">
                  {currency} {paidNum.toLocaleString()}
                </span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold text-amber-600">
                <span>Due on this Memo:</span>
                <span className="font-mono tabular-nums">
                  {currency} {due.toLocaleString()}
                </span>
              </div>
              {customerStats && (
                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 flex justify-between">
                  <span>Customer Total New Due:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {currency} {(customerStats.currentDue + due).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Paid Input & Presets */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cash Paid Now ({currency}) *
                </label>
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  value={paid}
                  onChange={(e) =>
                    setPaid(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0))
                  }
                  className="w-full px-3 py-2 text-sm font-mono font-bold rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSetFullPaid}
                  className="flex-1 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                >
                  Full Paid
                </button>
                <button
                  type="button"
                  onClick={handleSetHalfPaid}
                  className="flex-1 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
                >
                  50% Paid
                </button>
                <button
                  type="button"
                  onClick={handleSetZeroPaid}
                  className="flex-1 py-1 text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors"
                >
                  Full Due
                </button>
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
            </div>

            {/* Notes & Terms */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" /> Memo Notes / Remarks
              </label>
              <textarea
                rows={4}
                placeholder="e.g. 5 days delivery promised, cloth packaging specifications..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Memo & Generate Receipt</span>
          </button>
        </div>
      </form>
    </div>
  );
};
