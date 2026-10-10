import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  User,
  FileText,
  Boxes,
  Building2,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { AppState, Memo, Customer, Product, Supplier } from '../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  appState: AppState;
  onSelectCustomer: (customerId: string) => void;
  onSelectMemo: (memo: Memo) => void;
  onNavigateToStock: (supplierId?: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  appState,
  onSelectCustomer,
  onSelectMemo,
  onNavigateToStock,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const matchingCustomers = q
    ? appState.customers.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q) ||
          c.address?.toLowerCase().includes(q) ||
          c.district?.toLowerCase().includes(q) ||
          c.area?.toLowerCase().includes(q)
      )
    : [];

  const matchingMemos = q
    ? appState.memos.filter(
        (m) =>
          m.memoNumber.toLowerCase().includes(q) ||
          m.customerName.toLowerCase().includes(q) ||
          m.customerPhone?.toLowerCase().includes(q) ||
          m.items.some((it) => it.productName.toLowerCase().includes(q))
      )
    : [];

  const matchingProducts = q
    ? appState.products.filter(
        (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
      )
    : [];

  const matchingSuppliers = q
    ? appState.suppliers.filter((s) => s.name.toLowerCase().includes(q))
    : [];

  const totalResults =
    matchingCustomers.length +
    matchingMemos.length +
    matchingProducts.length +
    matchingSuppliers.length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 pt-16 sm:pt-24">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50">
          <Search className="w-5 h-5 text-indigo-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search customer, memo #, phone, product, factory..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm font-medium text-slate-900 focus:outline-hidden"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!q ? (
            <div className="text-center py-8 text-xs text-slate-400 space-y-1">
              <p>Type to search across all shop records.</p>
              <p className="text-[11px] text-slate-400">
                Try searching "Rahim", "Old Money", "007", or a memo number like "1001".
              </p>
            </div>
          ) : totalResults === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No matching records found for "{query}".
            </div>
          ) : (
            <>
              {/* Customers */}
              {matchingCustomers.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-2">
                    Customers ({matchingCustomers.length})
                  </span>
                  {matchingCustomers.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        onSelectCustomer(c.id);
                        onClose();
                      }}
                      className="p-2.5 rounded-lg hover:bg-indigo-50/60 cursor-pointer transition-colors flex items-center justify-between border border-transparent hover:border-indigo-100"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{c.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {c.phone || 'No phone'} · {c.district || 'Dhaka'}{c.area ? ` (${c.area})` : ''}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  ))}
                </div>
              )}

              {/* Memos */}
              {matchingMemos.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-2">
                    Sales Memos ({matchingMemos.length})
                  </span>
                  {matchingMemos.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => {
                        onSelectMemo(m);
                        onClose();
                      }}
                      className="p-2.5 rounded-lg hover:bg-indigo-50/60 cursor-pointer transition-colors flex items-center justify-between border border-transparent hover:border-indigo-100"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">
                            Memo #{m.memoNumber} · {m.customerName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {m.date} · ৳{m.subtotal.toLocaleString()} (Due: ৳{m.due.toLocaleString()})
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-indigo-600">
                        View Receipt →
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Products */}
              {matchingProducts.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-2">
                    Products ({matchingProducts.length})
                  </span>
                  {matchingProducts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        onNavigateToStock();
                        onClose();
                      }}
                      className="p-2.5 rounded-lg hover:bg-indigo-50/60 cursor-pointer transition-colors flex items-center justify-between border border-transparent hover:border-indigo-100"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center">
                          <Boxes className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{p.name}</div>
                          <div className="text-[11px] text-slate-500">
                            Selling Price: ৳{p.sellingPrice} · Cost: ৳{p.costPrice}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-blue-600 font-semibold">Stock Table →</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Suppliers / Factories */}
              {matchingSuppliers.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-2">
                    Factories / Suppliers ({matchingSuppliers.length})
                  </span>
                  {matchingSuppliers.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        onNavigateToStock(s.id);
                        onClose();
                      }}
                      className="p-2.5 rounded-lg hover:bg-indigo-50/60 cursor-pointer transition-colors flex items-center justify-between border border-transparent hover:border-indigo-100"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <Building2 className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{s.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {s.phone || 'Factory registered'}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-emerald-600 font-semibold">View Factory →</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
