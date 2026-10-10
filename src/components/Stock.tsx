import React, { useState } from 'react';
import {
  Boxes,
  Plus,
  Filter,
  AlertTriangle,
  FileSpreadsheet,
  Calendar,
  Building2,
  Package,
  Layers,
  CheckCircle,
  AlertCircle,
  Edit2,
  Trash2,
  RotateCcw,
  SlidersHorizontal,
  X,
  PlusCircle,
  Search,
} from 'lucide-react';
import { AppState, Supplier, Product, StockTransaction } from '../types';
import {
  getStockDashboardData,
  createStockInTransaction,
  clearStockForSupplierProduct,
  updateSupplier,
  deleteSupplier,
  updateProduct,
  deleteProduct,
  deleteStockTransaction,
  exportToCSV,
  saveAppState,
} from '../services/storage';

interface StockProps {
  appState: AppState;
  onStockUpdated: (nextState: AppState) => void;
}

type StockTab = 'inventory' | 'factories' | 'products' | 'transactions';

export const Stock: React.FC<StockProps> = ({ appState, onStockUpdated }) => {
  const currency = appState.settings.currency || '৳';
  const today = new Date().toISOString().split('T')[0];

  const [activeTab, setActiveTab] = useState<StockTab>('inventory');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Stock In Modal
  const [showStockInModal, setShowStockInModal] = useState(false);
  const [stockInDate, setStockInDate] = useState(today);
  const [stockInSupplierId, setStockInSupplierId] = useState(appState.suppliers[0]?.id || '');
  const [stockInProductId, setStockInProductId] = useState(appState.products[0]?.id || '');
  const [stockInQuantity, setStockInQuantity] = useState<number | ''>(100);
  const [stockInUnitCost, setStockInUnitCost] = useState<number | ''>(
    appState.products[0]?.costPrice || 350
  );
  const [stockInNotes, setStockInNotes] = useState('');

  // Reset / Clear Stock Modal
  const [stockToReset, setStockToReset] = useState<{
    supplierId: string;
    supplierName: string;
    productId: string;
    productName: string;
    currentStock: number;
  } | null>(null);
  const [targetStockQty, setTargetStockQty] = useState<number | ''>(0);
  const [resetReason, setResetReason] = useState('Stock clearance / manual reset');

  // Supplier Management Modals
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [newSupName, setNewSupName] = useState('');
  const [newSupPhone, setNewSupPhone] = useState('');
  const [newSupAddress, setNewSupAddress] = useState('');

  // Product Management Modals
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Clothing');
  const [newProdSellingPrice, setNewProdSellingPrice] = useState<number | ''>(500);
  const [newProdCostPrice, setNewProdCostPrice] = useState<number | ''>(380);
  const [newProdMinStock, setNewProdMinStock] = useState<number | ''>(20);

  // Stock Intake Deletion
  const [txToDelete, setTxToDelete] = useState<StockTransaction | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Stock Data Rows
  const stockRows = getStockDashboardData(appState, supplierFilter, productFilter);
  const filteredRows = stockRows.filter((r) => {
    if (lowStockOnly && r.currentStock > r.minStockLevel) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      return (
        r.supplierName.toLowerCase().includes(term) ||
        r.productName.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const totalStockSum = filteredRows.reduce((sum, r) => sum + r.currentStock, 0);
  const totalStockInSum = filteredRows.reduce((sum, r) => sum + r.stockIn, 0);
  const totalSoldSum = filteredRows.reduce((sum, r) => sum + r.sold, 0);

  // Stock In submission
  const handleStockInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const q = Number(stockInQuantity);
      const c = Number(stockInUnitCost);

      if (!stockInSupplierId) throw new Error('Please select a supplier/factory.');
      if (!stockInProductId) throw new Error('Please select a product.');
      if (isNaN(q) || q < 0) throw new Error('Quantity cannot be negative.');
      if (isNaN(c) || c < 0) throw new Error('Unit cost cannot be negative.');

      const nextState = createStockInTransaction(appState, {
        date: stockInDate,
        supplierId: stockInSupplierId,
        productId: stockInProductId,
        quantity: q,
        unitCost: c,
        notes: stockInNotes.trim(),
      });

      const sup = appState.suppliers.find((s) => s.id === stockInSupplierId);
      const prod = appState.products.find((p) => p.id === stockInProductId);

      setSuccessMessage(
        `Added +${q} pcs stock for "${prod?.name}" from "${sup?.name}". Factory inventory updated!`
      );
      setShowStockInModal(false);
      setStockInNotes('');
      onStockUpdated(nextState);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error adding stock');
    }
  };

  // Stock Reset / Clear submission
  const handleResetStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockToReset) return;

    try {
      const target = Number(targetStockQty);
      if (isNaN(target) || target < 0) {
        throw new Error('Stock quantity cannot be negative.');
      }

      const nextState = clearStockForSupplierProduct(
        appState,
        stockToReset.supplierId,
        stockToReset.productId,
        target,
        resetReason.trim()
      );

      setSuccessMessage(
        `"${stockToReset.productName}" stock at "${stockToReset.supplierName}" has been reset to ${target} pcs.`
      );
      setStockToReset(null);
      onStockUpdated(nextState);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error updating stock');
    }
  };

  // Supplier Add
  const handleAddSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupName.trim()) return;

    const newSup: Supplier = {
      id: `sup-${Date.now()}`,
      name: newSupName.trim(),
      phone: newSupPhone.trim(),
      address: newSupAddress.trim(),
      status: 'active',
      createdAt: today,
    };

    const nextState: AppState = {
      ...appState,
      suppliers: [...appState.suppliers, newSup],
    };

    saveAppState(nextState);
    onStockUpdated(nextState);
    setNewSupName('');
    setNewSupPhone('');
    setNewSupAddress('');
    setShowAddSupplierModal(false);
    setSuccessMessage(`Factory/Supplier "${newSup.name}" added successfully.`);
  };

  // Supplier Edit
  const handleEditSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier) return;

    const nextState = updateSupplier(appState, editingSupplier.id, {
      name: editingSupplier.name.trim(),
      phone: editingSupplier.phone.trim(),
      address: editingSupplier.address.trim(),
      status: editingSupplier.status,
    });

    onStockUpdated(nextState);
    setSuccessMessage(`Factory "${editingSupplier.name}" details updated.`);
    setEditingSupplier(null);
  };

  // Supplier Delete
  const handleConfirmDeleteSupplier = (removeStock: boolean) => {
    if (!supplierToDelete) return;

    const nextState = deleteSupplier(appState, supplierToDelete.id, removeStock);
    onStockUpdated(nextState);
    setSuccessMessage(`Factory "${supplierToDelete.name}" removed successfully.`);
    setSupplierToDelete(null);
  };

  // Product Add
  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;

    const newProd: Product = {
      id: `prod-${Date.now()}`,
      name: newProdName.trim(),
      category: newProdCategory.trim() || 'General',
      sellingPrice: Number(newProdSellingPrice) || 0,
      costPrice: Number(newProdCostPrice) || 0,
      minStockLevel: Number(newProdMinStock) || 10,
      status: 'active',
      createdAt: today,
    };

    const nextState: AppState = {
      ...appState,
      products: [...appState.products, newProd],
    };

    saveAppState(nextState);
    onStockUpdated(nextState);
    setNewProdName('');
    setNewProdSellingPrice(500);
    setNewProdCostPrice(380);
    setShowAddProductModal(false);
    setSuccessMessage(`Product "${newProd.name}" added to catalog.`);
  };

  // Product Edit
  const handleEditProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const nextState = updateProduct(appState, editingProduct.id, {
      name: editingProduct.name.trim(),
      category: editingProduct.category.trim(),
      sellingPrice: Number(editingProduct.sellingPrice) || 0,
      costPrice: Number(editingProduct.costPrice) || 0,
      minStockLevel: Number(editingProduct.minStockLevel) || 10,
      status: editingProduct.status,
    });

    onStockUpdated(nextState);
    setSuccessMessage(`Product "${editingProduct.name}" updated successfully.`);
    setEditingProduct(null);
  };

  // Product Delete
  const handleConfirmDeleteProduct = (removeStock: boolean) => {
    if (!productToDelete) return;

    const nextState = deleteProduct(appState, productToDelete.id, removeStock);
    onStockUpdated(nextState);
    setSuccessMessage(`Product "${productToDelete.name}" removed from catalog.`);
    setProductToDelete(null);
  };

  // Delete stock intake transaction
  const handleConfirmDeleteTx = () => {
    if (!txToDelete) return;

    const nextState = deleteStockTransaction(appState, txToDelete.id);
    onStockUpdated(nextState);
    setSuccessMessage(`Stock entry (${txToDelete.reference}) removed.`);
    setTxToDelete(null);
  };

  const handleExportCSV = () => {
    const headers = [
      'Factory/Supplier',
      'Product Name',
      'Opening Stock',
      'Stock In',
      'Sold',
      'Current Stock',
      'Min Stock Level',
      'Stock Status',
    ];
    const rows = filteredRows.map((r) => [
      r.supplierName,
      r.productName,
      r.openingStock,
      r.stockIn,
      r.sold,
      r.currentStock,
      r.minStockLevel,
      r.currentStock <= 0 ? 'Out of Stock' : r.currentStock <= r.minStockLevel ? 'Low Stock' : 'In Stock',
    ]);
    exportToCSV('Lima_Garments_Factory_Stock_Report', headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Stock & Multi-Factory Management</h2>
          <p className="text-xs text-slate-500">
            Real-time multi-factory inventory, automatic deduction on memos, stock clearance & items management.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Stock CSV</span>
          </button>

          <button
            onClick={() => setShowStockInModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Stock In (স্টক ইন)</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700">✕</button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700">✕</button>
        </div>
      )}

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Total Warehouse Stock
          </span>
          <div className="text-2xl font-black text-slate-900 font-mono tabular-nums">
            {totalStockSum.toLocaleString()} <span className="text-xs font-normal text-slate-500 font-sans">pcs</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Across all factories</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Total Stock Received
          </span>
          <div className="text-2xl font-black text-blue-600 font-mono tabular-nums">
            +{totalStockInSum.toLocaleString()} <span className="text-xs font-normal text-slate-500 font-sans">pcs</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Lifetime batch intake</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Total Sold on Memos
          </span>
          <div className="text-2xl font-black text-rose-600 font-mono tabular-nums">
            -{totalSoldSum.toLocaleString()} <span className="text-xs font-normal text-slate-500 font-sans">pcs</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Deducted from sales</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Suppliers & Items
          </span>
          <div className="text-2xl font-black text-purple-600 font-mono tabular-nums">
            {appState.suppliers.length} <span className="text-xs font-normal text-slate-500 font-sans">factories</span> / {appState.products.length} <span className="text-xs font-normal text-slate-500 font-sans">items</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Active catalog</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-t-xl gap-2 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`py-3 px-4 font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'inventory'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>মজুদ স্টক (Stock Inventory)</span>
        </button>

        <button
          onClick={() => setActiveTab('factories')}
          className={`py-3 px-4 font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'factories'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>ফ্যাক্টরি ও সাপ্লায়ার তালিকা ({appState.suppliers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`py-3 px-4 font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'products'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>আইটেম ও প্রোডাক্ট ক্যাটালগ ({appState.products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`py-3 px-4 font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'transactions'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>স্টক ইন লেনদেন হিস্ট্রি ({appState.stockTransactions.filter((s) => s.type === 'STOCK_IN').length})</span>
        </button>
      </div>

      {/* TAB 1: Stock Inventory Overview */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-60">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search factory or item..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              {/* Factory Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-medium">Factory:</span>
                <select
                  value={supplierFilter}
                  onChange={(e) => setSupplierFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                >
                  <option value="all">All Factories ({appState.suppliers.length})</option>
                  {appState.suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-medium">Item:</span>
                <select
                  value={productFilter}
                  onChange={(e) => setProductFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                >
                  <option value="all">All Items ({appState.products.length})</option>
                  {appState.products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Low Stock Checkbox */}
            <label className="flex items-center gap-2 text-xs font-semibold text-amber-900 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 cursor-pointer">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
                className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Show Low Stock Only
              </span>
            </label>
          </div>

          {/* Stock Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Supplier / Factory</th>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4 text-center">Opening Base</th>
                    <th className="py-3 px-4 text-center">Stock In</th>
                    <th className="py-3 px-4 text-center">Sold</th>
                    <th className="py-3 px-4 text-right font-bold text-slate-800">Current Stock</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No stock inventory found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row, idx) => {
                      const isLow = row.currentStock <= row.minStockLevel;
                      const isZero = row.currentStock <= 0;

                      return (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {row.supplierName}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-800">
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
                          <td className="py-3 px-4 text-right font-mono font-extrabold text-sm">
                            <span
                              className={
                                isZero
                                  ? 'text-rose-600'
                                  : isLow
                                  ? 'text-amber-600'
                                  : 'text-slate-900'
                              }
                            >
                              {row.currentStock.toLocaleString()} pcs
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isZero
                                  ? 'bg-rose-100 text-rose-800'
                                  : isLow
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {isZero ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setStockToReset({
                                  supplierId: row.supplierId,
                                  supplierName: row.supplierName,
                                  productId: row.productId,
                                  productName: row.productName,
                                  currentStock: row.currentStock,
                                });
                                setTargetStockQty(0);
                                setResetReason('Manual Stock Clearance / Reset');
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md transition-colors"
                              title="Reset or adjust stock"
                            >
                              রিসেট / সমন্বয়
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {filteredRows.length > 0 && (
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                    <tr>
                      <td colSpan={2} className="py-3 px-4 uppercase text-slate-600">
                        Total Summary
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-500">
                        {filteredRows.reduce((sum, r) => sum + r.openingStock, 0)} pcs
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-blue-600">
                        +{totalStockInSum.toLocaleString()} pcs
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-rose-600">
                        -{totalSoldSum.toLocaleString()} pcs
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-indigo-700 text-sm">
                        {totalStockSum.toLocaleString()} pcs
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Manage Factories & Suppliers */}
      {activeTab === 'factories' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                ফ্যাক্টরি ও সাপ্লায়ার তালিকা (Manage Factories & Suppliers)
              </h3>
              <p className="text-xs text-slate-500">
                ফ্যাক্টরি এডিট বা সম্পূর্ণ রিমুভ করার অপশন (Edit & Remove Factories)
              </p>
            </div>
            <button
              onClick={() => setShowAddSupplierModal(true)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ নতুন ফ্যাক্টরি যুক্ত করুন</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {appState.suppliers.map((sup) => {
              const factoryItems = stockRows.filter((r) => r.supplierId === sup.id);
              const factoryTotalStock = factoryItems.reduce((sum, r) => sum + r.currentStock, 0);

              return (
                <div
                  key={sup.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{sup.name}</h4>
                      <span className="text-[11px] text-slate-500 font-mono">{sup.phone || 'No phone listed'}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        sup.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {sup.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Address:</span>
                      <span className="font-medium truncate max-w-[150px]">{sup.address || 'Not listed'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Current Stock:</span>
                      <span className="font-bold font-mono text-slate-800">{factoryTotalStock} pcs</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200">
                    <button
                      onClick={() => setEditingSupplier(sup)}
                      className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>এডিট</span>
                    </button>
                    <button
                      onClick={() => setSupplierToDelete(sup)}
                      className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-md transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>রিমুভ</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Manage Products & Items */}
      {activeTab === 'products' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                আইটেম ও প্রোডাক্ট ক্যাটালগ (Manage Products & Catalog)
              </h3>
              <p className="text-xs text-slate-500">
                পোশাকের আইটেম এডিট ও ক্যাটালগ থেকে রিমুভ করার অপশন (Edit & Delete Items)
              </p>
            </div>
            <button
              onClick={() => setShowAddProductModal(true)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ নতুন আইটেম যুক্ত করুন</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Item Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Selling Price</th>
                  <th className="py-3 px-4 text-right">Cost Price</th>
                  <th className="py-3 px-4 text-right">Estimated Profit</th>
                  <th className="py-3 px-4 text-center">Alert Stock</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appState.products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{prod.name}</td>
                    <td className="py-3 px-4 text-slate-500">{prod.category}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {currency} {prod.sellingPrice}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">
                      {currency} {prod.costPrice}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-600 font-bold">
                      +{currency} {prod.sellingPrice - prod.costPrice}
                    </td>
                    <td className="py-3 px-4 text-center font-mono">{prod.minStockLevel} pcs</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          prod.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {prod.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditingProduct(prod)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          title="Edit Item Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setProductToDelete(prod)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="Remove Item from Catalog"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Stock Transactions History */}
      {activeTab === 'transactions' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900">
              স্টক ইন লেনদেন হিস্ট্রি (Stock Intake Records)
            </h3>
            <p className="text-xs text-slate-500">
              ভুল এন্ট্রি হলে এখান থেকে স্টক ইনটেক মুছে ফেলার সুযোগ রয়েছে।
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Batch / Ref</th>
                  <th className="py-3 px-4">Supplier / Factory</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4 text-center">Type</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appState.stockTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No stock transactions recorded.
                    </td>
                  </tr>
                ) : (
                  [...appState.stockTransactions]
                    .reverse()
                    .slice(0, 50)
                    .map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap text-slate-600">{tx.date}</td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-700">{tx.reference}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{tx.supplierName}</td>
                        <td className="py-3 px-4 text-slate-800">{tx.productName}</td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              tx.type === 'STOCK_IN'
                                ? 'bg-blue-100 text-blue-800'
                                : tx.type === 'SALE'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          <span
                            className={
                              tx.type === 'STOCK_IN' || tx.quantity > 0
                                ? 'text-blue-600'
                                : 'text-rose-600'
                            }
                          >
                            {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity} pcs
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 truncate max-w-xs">{tx.notes}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setTxToDelete(tx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title="Delete Stock Record"
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
      )}

      {/* ---------------- MODALS ---------------- */}

      {/* 1. Stock In Modal */}
      {showStockInModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-sm">নতুন স্টক ইনটেক (Stock In Entry)</span>
              <button onClick={() => setShowStockInModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleStockInSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={stockInDate}
                  onChange={(e) => setStockInDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Factory / Supplier *</label>
                <select
                  value={stockInSupplierId}
                  onChange={(e) => setStockInSupplierId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                >
                  {appState.suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Product Item *</label>
                <select
                  value={stockInProductId}
                  onChange={(e) => {
                    setStockInProductId(e.target.value);
                    const p = appState.products.find((prod) => prod.id === e.target.value);
                    if (p) setStockInUnitCost(p.costPrice);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                >
                  {appState.products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({currency} {p.costPrice} cost)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity (pcs) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stockInQuantity}
                    onChange={(e) => setStockInQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Cost ({currency})</label>
                  <input
                    type="number"
                    min="0"
                    value={stockInUnitCost}
                    onChange={(e) => setStockInUnitCost(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Batch Ref</label>
                <input
                  type="text"
                  placeholder="e.g. Lot #12 fresh delivery"
                  value={stockInNotes}
                  onChange={(e) => setStockInNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStockInModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  Save Stock In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Stock Reset / Clear Modal */}
      {stockToReset && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-4 bg-amber-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-amber-100" />
                <span className="font-bold text-sm">স্টক রিসেট বা সমন্বয় (Reset / Clear Stock)</span>
              </div>
              <button onClick={() => setStockToReset(null)} className="text-amber-200 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleResetStockSubmit} className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Factory:</span>
                  <span className="font-bold text-slate-900">{stockToReset.supplierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Product:</span>
                  <span className="font-bold text-slate-900">{stockToReset.productName}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1">
                  <span className="text-slate-500">Current Stock:</span>
                  <span className="font-extrabold font-mono text-base text-slate-900">{stockToReset.currentStock} pcs</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  নতুন টার্গেট স্টক পরিমাণ (Set Target Stock Quantity) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    required
                    value={targetStockQty}
                    onChange={(e) => setTargetStockQty(e.target.value === '' ? '' : Number(e.target.value))}
                    className="flex-1 px-3 py-2 text-sm font-mono font-bold rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                  <button
                    type="button"
                    onClick={() => setTargetStockQty(0)}
                    className="px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg whitespace-nowrap"
                  >
                    স্টক ০ (শূন্য) করুন
                  </button>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  ০ লিখলে এই আইটেমটির স্টক শূন্য হয়ে যাবে।
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">রিসেট করার কারণ (Reason / Notes)</label>
                <input
                  type="text"
                  value={resetReason}
                  onChange={(e) => setResetReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStockToReset(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs"
                >
                  স্টক আপডেট করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Add Supplier Modal */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-sm">নতুন ফ্যাক্টরি যুক্ত করুন (Add Factory)</span>
              <button onClick={() => setShowAddSupplierModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddSupplierSubmit} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Factory Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Textiles, Fabel, Milaz"
                  value={newSupName}
                  onChange={(e) => setNewSupName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  placeholder="017XX-XXXXXX"
                  value={newSupPhone}
                  onChange={(e) => setNewSupPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Factory Address</label>
                <input
                  type="text"
                  placeholder="e.g. Tongi, Gazipur"
                  value={newSupAddress}
                  onChange={(e) => setNewSupAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  সেভ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Edit Supplier Modal */}
      {editingSupplier && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-sm">ফ্যাক্টরি তথ্য এডিট করুন (Edit Factory)</span>
              <button onClick={() => setEditingSupplier(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleEditSupplierSubmit} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Factory Name *</label>
                <input
                  type="text"
                  required
                  value={editingSupplier.name}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={editingSupplier.phone}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  value={editingSupplier.address}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={editingSupplier.status}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, status: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSupplier(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  আপডেট করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Delete Supplier Confirmation Modal */}
      {supplierToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden">
            <div className="p-4 bg-rose-600 text-white flex items-center justify-between">
              <span className="font-bold text-sm">ফ্যাক্টরি ডিলিট করুন (Delete Factory)</span>
              <button onClick={() => setSupplierToDelete(null)} className="text-rose-200 hover:text-white">✕</button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-700">
                আপনি কি নিশ্চিত যে <strong>"{supplierToDelete.name}"</strong> ফ্যাক্টরিটি তালিকা থেকে মুছে ফেলতে চান?
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSupplierToDelete(null)}
                  className="px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmDeleteSupplier(true)}
                  className="px-3 py-1.5 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
                >
                  হ্যাঁ, ডিলিট করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-sm">নতুন পোশাক আইটেম যুক্ত করুন (Add Product)</span>
              <button onClick={() => setShowAddProductModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddProductSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Item Title / Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Oxford Twill Shirt"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <input
                  type="text"
                  placeholder="e.g. Denim, Knitwear, Formal"
                  value={newProdCategory}
                  onChange={(e) => setNewProdCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Selling Price ({currency}) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newProdSellingPrice}
                    onChange={(e) => setNewProdSellingPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cost Price ({currency}) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newProdCostPrice}
                    onChange={(e) => setNewProdCostPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Min Stock Alert Level (pcs)</label>
                <input
                  type="number"
                  min="0"
                  value={newProdMinStock}
                  onChange={(e) => setNewProdMinStock(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs"
                >
                  আইটেম সেভ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-sm">আইটেম তথ্য এডিট করুন (Edit Product)</span>
              <button onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleEditProductSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Item Title *</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <input
                  type="text"
                  value={editingProduct.category}
                  onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Selling Price ({currency})</label>
                  <input
                    type="number"
                    min="0"
                    value={editingProduct.sellingPrice}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sellingPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cost Price ({currency})</label>
                  <input
                    type="number"
                    min="0"
                    value={editingProduct.costPrice}
                    onChange={(e) => setEditingProduct({ ...editingProduct, costPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Min Stock Alert</label>
                  <input
                    type="number"
                    min="0"
                    value={editingProduct.minStockLevel}
                    onChange={(e) => setEditingProduct({ ...editingProduct, minStockLevel: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={editingProduct.status}
                    onChange={(e) => setEditingProduct({ ...editingProduct, status: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  আপডেট সেভ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Delete Product Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden">
            <div className="p-4 bg-rose-600 text-white flex items-center justify-between">
              <span className="font-bold text-sm">আইটেম ডিলিট করুন (Delete Product)</span>
              <button onClick={() => setProductToDelete(null)} className="text-rose-200 hover:text-white">✕</button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-700">
                আপনি কি নিশ্চিত যে <strong>"{productToDelete.name}"</strong> আইটেমটি ক্যাটালগ থেকে মুছে ফেলতে চান?
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setProductToDelete(null)}
                  className="px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmDeleteProduct(true)}
                  className="px-3 py-1.5 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
                >
                  হ্যাঁ, ডিলিট করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. Delete Stock Transaction Confirmation Modal */}
      {txToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden">
            <div className="p-4 bg-rose-600 text-white flex items-center justify-between">
              <span className="font-bold text-sm">স্টক লেনদেন মুছে ফেলুন (Delete Entry)</span>
              <button onClick={() => setTxToDelete(null)} className="text-rose-200 hover:text-white">✕</button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-700">
                আপনি কি <strong>{txToDelete.reference}</strong> ({txToDelete.productName} - {txToDelete.quantity} pcs) স্টক এন্ট্রিটি মুছে ফেলতে চান?
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTxToDelete(null)}
                  className="px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteTx}
                  className="px-3 py-1.5 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
                >
                  হ্যাঁ, মুছে ফেলুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
