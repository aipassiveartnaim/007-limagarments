import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Store,
  Boxes,
  Plus,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Save,
  Users,
  Edit2,
  X,
} from 'lucide-react';
import { AppState, BusinessSettings, Product, Supplier } from '../types';
import {
  saveAppState,
  exportStateToJson,
  importStateFromJson,
  resetToDemoData,
  resetMemosAndExpensesToZero,
  clearDatabase,
  updateSupplier,
  deleteSupplier,
  updateProduct,
  deleteProduct,
} from '../services/storage';

interface SettingsProps {
  appState: AppState;
  onSettingsUpdated: (nextState: AppState) => void;
}

export const Settings: React.FC<SettingsProps> = ({ appState, onSettingsUpdated }) => {
  const [settings, setSettings] = useState<BusinessSettings>(appState.settings);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Confirmation modal state
  const [confirmAction, setConfirmAction] = useState<{
    type: 'reset-memos-expenses' | 'reset-demo' | 'clear-all';
    title: string;
    description: string;
    confirmText: string;
    danger?: boolean;
  } | null>(null);

  // Supplier modal
  const [newSupName, setNewSupName] = useState('');
  const [newSupPhone, setNewSupPhone] = useState('');
  const [newSupAddress, setNewSupAddress] = useState('');

  // Product modal
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Clothing');
  const [newProdSellingPrice, setNewProdSellingPrice] = useState<number | ''>(500);
  const [newProdCostPrice, setNewProdCostPrice] = useState<number | ''>(380);
  const [newProdMinStock, setNewProdMinStock] = useState<number | ''>(20);

  const [editingSup, setEditingSup] = useState<Supplier | null>(null);
  const [supToDelete, setSupToDelete] = useState<Supplier | null>(null);
  const [editingProd, setEditingProd] = useState<Product | null>(null);
  const [prodToDelete, setProdToDelete] = useState<Product | null>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const nextState: AppState = {
      ...appState,
      settings: {
        ...settings,
        openingCash: Number(settings.openingCash) || 0,
      },
    };
    saveAppState(nextState);
    onSettingsUpdated(nextState);
    setSuccessMessage('Business configuration updated successfully!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupName.trim()) return;

    const newSup: Supplier = {
      id: `sup-${Date.now()}`,
      name: newSupName.trim(),
      phone: newSupPhone.trim(),
      address: newSupAddress.trim(),
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
    };

    const nextState: AppState = {
      ...appState,
      suppliers: [...appState.suppliers, newSup],
    };

    saveAppState(nextState);
    onSettingsUpdated(nextState);
    setNewSupName('');
    setNewSupPhone('');
    setNewSupAddress('');
    setSuccessMessage(`Supplier "${newSup.name}" added successfully.`);
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;

    const sp = Number(newProdSellingPrice) || 0;
    const cp = Number(newProdCostPrice) || 0;
    const minS = Number(newProdMinStock) || 10;

    const newProd: Product = {
      id: `prod-${Date.now()}`,
      name: newProdName.trim(),
      category: newProdCategory.trim() || 'General',
      sellingPrice: sp,
      costPrice: cp,
      minStockLevel: minS,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
    };

    const nextState: AppState = {
      ...appState,
      products: [...appState.products, newProd],
    };

    saveAppState(nextState);
    onSettingsUpdated(nextState);
    setNewProdName('');
    setNewProdSellingPrice(500);
    setNewProdCostPrice(380);
    setNewProdMinStock(20);
    setSuccessMessage(`Product "${newProd.name}" added to catalog.`);
  };

  // Backup JSON Download
  const handleDownloadBackup = () => {
    const jsonStr = exportStateToJson(appState);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LIMA_GARMENTS_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Restore JSON File
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const restored = importStateFromJson(content);
        onSettingsUpdated(restored);
        setSuccessMessage('Database restored successfully from backup file!');
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to restore file.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetMemosAndExpenses = () => {
    setConfirmAction({
      type: 'reset-memos-expenses',
      title: 'সব মেমো ও খরচের হিসাব ০ (শূন্য) করবেন?',
      description:
        'এই অপশনটি চালু করলে সমস্ত বিক্রয় মেমো, গ্রাহকদের বকেয়া আদায় এবং দোকানের যাবতীয় খরচ ০ (শূন্য) হয়ে যাবে। আপনার সংরক্ষিত কাস্টমার, প্রোডাক্ট ক্যাটালগ এবং ফ্যাক্টরি অপরিবর্তিত থাকবে।',
      confirmText: 'হ্যাঁ, মেমো ও খরচ ০ করুন',
      danger: true,
    });
  };

  const handleResetDemo = () => {
    setConfirmAction({
      type: 'reset-demo',
      title: 'Reload Demo Seed Database?',
      description:
        'This will reset your database to default demo setup (standard suppliers, products, and initial factory stock).',
      confirmText: 'Reload Demo Data',
      danger: false,
    });
  };

  const handleClearAll = () => {
    setConfirmAction({
      type: 'clear-all',
      title: 'Clear Entire Transactional Database?',
      description:
        'WARNING: This will clear all memos, payments, expenses, and inventory transactions. Are you sure?',
      confirmText: 'Clear All Data',
      danger: true,
    });
  };

  const handleExecuteConfirmedAction = () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'reset-memos-expenses') {
      const next = resetMemosAndExpensesToZero(appState);
      onSettingsUpdated(next);
      setSuccessMessage('সব মেমো ও খরচের হিসাব সফলভাবে ০ (শূন্য) করা হয়েছে!');
    } else if (confirmAction.type === 'reset-demo') {
      const resetState = resetToDemoData();
      onSettingsUpdated(resetState);
      setSettings(resetState.settings);
      setSuccessMessage('Restored to default Lima Garments demo database.');
    } else if (confirmAction.type === 'clear-all') {
      const blank = clearDatabase();
      onSettingsUpdated(blank);
      setSuccessMessage('All transactional data has been cleared.');
    }
    setConfirmAction(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">System & Business Configuration</h2>
          <p className="text-xs text-slate-500">
            Store profile, suppliers, product pricing, stock rules, and persistent data safety.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadBackup}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Download Backup</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 1. Store Profile & Accounting Parameters */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-3 flex items-center gap-2 mb-4">
          <Store className="w-4 h-4 text-indigo-600" />
          Shop Profile & Accounting Parameters
        </h3>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Business Name *
              </label>
              <input
                type="text"
                required
                value={settings.businessName}
                onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Shop Contact Phone
              </label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Currency Symbol
              </label>
              <input
                type="text"
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Physical Shop / Market Address
              </label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Invoice / Memo Prefix
              </label>
              <input
                type="text"
                value={settings.memoPrefix}
                onChange={(e) => setSettings({ ...settings, memoPrefix: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Opening Cash Balance (৳)
              </label>
              <input
                type="number"
                min="0"
                value={settings.openingCash}
                onChange={(e) => setSettings({ ...settings, openingCash: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div className="sm:col-span-2 flex items-center pt-5">
              <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.allowNegativeStock}
                  onChange={(e) =>
                    setSettings({ ...settings, allowNegativeStock: e.target.checked })
                  }
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Allow Negative Stock on Sales (Admin Override)</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Configuration</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Multi-Factory / Supplier Management */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            Registered Factories & Suppliers ({appState.suppliers.length})
          </h3>
          <span className="text-[11px] text-slate-400">Unlimited factories supported</span>
        </div>

        {/* Existing Suppliers Pills/List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {appState.suppliers.map((sup) => (
            <div
              key={sup.id}
              className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-bold text-slate-900 block">{sup.name}</span>
                <span className="text-[11px] text-slate-500 font-mono">{sup.phone || 'No phone'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setEditingSup(sup)}
                  className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                  title="Edit Factory"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSupToDelete(sup)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded"
                  title="Remove Factory"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Supplier Form */}
        <form onSubmit={handleAddSupplier} className="pt-2 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-800 block mb-2">Add Another Factory</span>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Factory / Supplier Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Apex Textiles, Noman Group"
                value={newSupName}
                onChange={(e) => setNewSupName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Phone
              </label>
              <input
                type="text"
                placeholder="017XX-XXXXXX"
                value={newSupPhone}
                onChange={(e) => setNewSupPhone(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <button
                type="submit"
                className="w-full py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
              >
                + Add Factory
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 3. Product Catalog Management */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Boxes className="w-4 h-4 text-purple-600" />
            Product Catalog & Pricing Models ({appState.products.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Product Name</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">Selling Price</th>
                <th className="py-2.5 px-3 text-right">Cost Price</th>
                <th className="py-2.5 px-3 text-right">Profit / pc</th>
                <th className="py-2.5 px-3 text-center">Min Stock Alert</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appState.products.map((prod) => (
                <tr key={prod.id}>
                  <td className="py-2 px-3 font-bold text-slate-900">{prod.name}</td>
                  <td className="py-2 px-3 text-slate-500">{prod.category}</td>
                  <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">
                    ৳{prod.sellingPrice}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-slate-500">
                    ৳{prod.costPrice}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-emerald-600 font-bold">
                    ৳{prod.sellingPrice - prod.costPrice}
                  </td>
                  <td className="py-2 px-3 text-center font-mono">{prod.minStockLevel} pcs</td>
                  <td className="py-2 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingProd(prod)}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                        title="Edit Item"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setProdToDelete(prod)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Delete Item"
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

        {/* Add Product Form */}
        <form onSubmit={handleAddProduct} className="pt-3 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-800 block mb-2">Add New Product</span>
          <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 items-end">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Product Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Oxford Twill Shirt"
                value={newProdName}
                onChange={(e) => setNewProdName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Selling Price (৳) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={newProdSellingPrice}
                onChange={(e) =>
                  setNewProdSellingPrice(
                    e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0)
                  )
                }
                className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Cost Price (৳) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={newProdCostPrice}
                onChange={(e) =>
                  setNewProdCostPrice(
                    e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0)
                  )
                }
                className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Min Stock Alert
              </label>
              <input
                type="number"
                min="1"
                required
                value={newProdMinStock}
                onChange={(e) =>
                  setNewProdMinStock(
                    e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 0)
                  )
                }
                className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <button
                type="submit"
                className="w-full py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs"
              >
                + Add Product
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 4. Data Safety, Backup & Restore */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Data Safety, Backup & Persistence
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Download JSON */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
            <div>
              <span className="font-bold text-xs text-slate-900 block mb-1">
                Database Backup (JSON)
              </span>
              <p className="text-[11px] text-slate-500">
                Download a complete snapshot of all customers, memos, stock, and transactions.
              </p>
            </div>
            <button
              onClick={handleDownloadBackup}
              className="mt-4 w-full py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON Backup</span>
            </button>
          </div>

          {/* Restore JSON */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
            <div>
              <span className="font-bold text-xs text-slate-900 block mb-1">
                Restore Database
              </span>
              <p className="text-[11px] text-slate-500">
                Upload a previously exported backup file to restore records instantly.
              </p>
            </div>
            <label className="mt-4 w-full py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Backup File</span>
              <input type="file" accept=".json" onChange={handleRestoreFile} className="hidden" />
            </label>
          </div>

          {/* Reset Demo Data */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
            <div>
              <span className="font-bold text-xs text-slate-900 block mb-1">
                রিসেট ফ্রেশ ডাটাবেজ (Reset Database)
              </span>
              <p className="text-[11px] text-slate-500">
                সকল ডামি ডাটা মুছে সম্পূর্ণ পরিষ্কার ফ্রেশ সিস্টেমে রিসেট করুন।
              </p>
            </div>
            <button
              onClick={handleResetDemo}
              className="mt-4 w-full py-2 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-300 hover:bg-amber-100 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ফ্রেশ সিস্টেমে রিসেট করুন</span>
            </button>
          </div>

          {/* Zero Memos & Expenses */}
          <div className="p-4 rounded-xl border-2 border-rose-300 bg-rose-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="font-bold text-xs text-rose-900 block">
                  মেমো ও খরচ ০ (শূন্য) করুন
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-200 text-rose-800">
                  জিরো রিসেট
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                সমস্ত বিক্রয় মেমো ও দোকানের খরচ মুছে ০ করুন। কাস্টমার তালিকা ও স্টক অক্ষত থাকবে।
              </p>
            </div>
            <button
              onClick={handleResetMemosAndExpenses}
              className="mt-4 w-full py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>মেমো ও খরচ ০ করুন</span>
            </button>
          </div>
        </div>
      </div>

      {/* Edit Supplier Modal */}
      {editingSup && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-sm">Edit Factory / Supplier</span>
              <button onClick={() => setEditingSup(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const next = updateSupplier(appState, editingSup.id, {
                  name: editingSup.name.trim(),
                  phone: editingSup.phone.trim(),
                  address: editingSup.address.trim(),
                  status: editingSup.status,
                });
                onSettingsUpdated(next);
                setSuccessMessage(`Factory "${editingSup.name}" updated.`);
                setEditingSup(null);
              }}
              className="p-5 space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Factory Name *</label>
                <input
                  type="text"
                  required
                  value={editingSup.name}
                  onChange={(e) => setEditingSup({ ...editingSup, name: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={editingSup.phone}
                  onChange={(e) => setEditingSup({ ...editingSup, phone: e.target.value })}
                  className="w-full px-3 py-1.5 font-mono rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  value={editingSup.address}
                  onChange={(e) => setEditingSup({ ...editingSup, address: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={editingSup.status}
                  onChange={(e) => setEditingSup({ ...editingSup, status: e.target.value as any })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingSup(null)} className="px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="px-3 py-1.5 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Supplier Modal */}
      {supToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden">
            <div className="p-4 bg-rose-600 text-white flex items-center justify-between">
              <span className="font-bold text-sm">Delete Factory</span>
              <button onClick={() => setSupToDelete(null)} className="text-rose-200 hover:text-white">✕</button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-700">
                Are you sure you want to remove <strong>"{supToDelete.name}"</strong>?
              </p>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setSupToDelete(null)} className="px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = deleteSupplier(appState, supToDelete.id, true);
                    onSettingsUpdated(next);
                    setSuccessMessage(`Factory "${supToDelete.name}" deleted.`);
                    setSupToDelete(null);
                  }}
                  className="px-3 py-1.5 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProd && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-sm">Edit Product Item</span>
              <button onClick={() => setEditingProd(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const next = updateProduct(appState, editingProd.id, {
                  name: editingProd.name.trim(),
                  category: editingProd.category.trim(),
                  sellingPrice: Number(editingProd.sellingPrice) || 0,
                  costPrice: Number(editingProd.costPrice) || 0,
                  minStockLevel: Number(editingProd.minStockLevel) || 10,
                  status: editingProd.status,
                });
                onSettingsUpdated(next);
                setSuccessMessage(`Product "${editingProd.name}" updated.`);
                setEditingProd(null);
              }}
              className="p-5 space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Item Title *</label>
                <input
                  type="text"
                  required
                  value={editingProd.name}
                  onChange={(e) => setEditingProd({ ...editingProd, name: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <input
                  type="text"
                  value={editingProd.category}
                  onChange={(e) => setEditingProd({ ...editingProd, category: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Selling Price (৳)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingProd.sellingPrice}
                    onChange={(e) => setEditingProd({ ...editingProd, sellingPrice: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 font-mono font-bold rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cost Price (৳)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingProd.costPrice}
                    onChange={(e) => setEditingProd({ ...editingProd, costPrice: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 font-mono rounded-lg border border-slate-200"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Alert Stock (pcs)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingProd.minStockLevel}
                    onChange={(e) => setEditingProd({ ...editingProd, minStockLevel: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 font-mono rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={editingProd.status}
                    onChange={(e) => setEditingProd({ ...editingProd, status: e.target.value as any })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingProd(null)} className="px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="px-3 py-1.5 font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Product Modal */}
      {prodToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden">
            <div className="p-4 bg-rose-600 text-white flex items-center justify-between">
              <span className="font-bold text-sm">Delete Product</span>
              <button onClick={() => setProdToDelete(null)} className="text-rose-200 hover:text-white">✕</button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-700">
                Are you sure you want to remove <strong>"{prodToDelete.name}"</strong> from catalog?
              </p>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setProdToDelete(null)} className="px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = deleteProduct(appState, prodToDelete.id, true);
                    onSettingsUpdated(next);
                    setSuccessMessage(`Product "${prodToDelete.name}" deleted.`);
                    setProdToDelete(null);
                  }}
                  className="px-3 py-1.5 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Action Modal (Safe Confirmation without window.confirm) */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div
              className={`p-4 text-white flex items-center justify-between ${
                confirmAction.danger ? 'bg-rose-600' : 'bg-slate-900'
              }`}
            >
              <span className="font-bold text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {confirmAction.title}
              </span>
              <button
                onClick={() => setConfirmAction(null)}
                className="text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-700 leading-relaxed font-medium">
                {confirmAction.description}
              </p>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setConfirmAction(null)}
                  className="px-3.5 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  বাতিল করুন (Cancel)
                </button>
                <button
                  type="button"
                  onClick={handleExecuteConfirmedAction}
                  className={`px-4 py-2 font-bold text-white rounded-lg shadow-xs transition-colors ${
                    confirmAction.danger
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {confirmAction.confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
