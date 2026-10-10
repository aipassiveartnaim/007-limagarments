import React from 'react';
import {
  LayoutDashboard,
  FilePlus,
  Users,
  CreditCard,
  Receipt,
  Boxes,
  ShoppingBag,
  FileBarChart2,
  History,
  Settings,
  Banknote,
  X,
  Store,
  MapPin,
  Truck,
} from 'lucide-react';
import { AppState } from '../types';
import { calculateCashInHand } from '../services/storage';

export type NavTab =
  | 'dashboard'
  | 'new-memo'
  | 'factory-007'
  | 'payables'
  | 'customers'
  | 'locations'
  | 'payments'
  | 'expenses'
  | 'stock'
  | 'sales'
  | 'reports'
  | 'transactions'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  appState: AppState;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
  appState,
}) => {
  const cashInfo = calculateCashInHand(appState);
  const currency = appState.settings.currency || '৳';
  const coveredDistrictsCount = new Set(appState.customers.map((c) => c.district || 'Dhaka')).size;

  const menuItems: Array<{ id: NavTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string | number }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new-memo', label: 'New Memo', icon: FilePlus, badge: 'Fast' },
    { id: 'factory-007', label: '007 Distribution', icon: Truck, badge: '০০৭' },
    { id: 'payables', label: 'কারা টাকা পাবে (Payables)', icon: Banknote },
    { id: 'customers', label: 'Customers', icon: Users, badge: appState.customers.length },
    { id: 'locations', label: 'Customer Areas (লোকেশন)', icon: MapPin, badge: `${coveredDistrictsCount} জেলা` },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'stock', label: 'Stock / Inventory', icon: Boxes },
    { id: 'sales', label: 'Sales & Memos', icon: ShoppingBag, badge: appState.memos.length },
    { id: 'reports', label: 'Business Reports', icon: FileBarChart2 },
    { id: 'transactions', label: 'Transactions', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-xs">
              <Store className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-white uppercase">
                {appState.settings.businessName || 'LIMA GARMENTS'}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Shop Management</span>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Cash Badge in Sidebar */}
        <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-950/20">
          <div className="rounded-lg bg-slate-800/70 p-3 border border-slate-700/50">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-1">
              <span className="flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                Live Cash in Hand
              </span>
            </div>
            <div className="text-lg font-bold text-emerald-400 font-mono tabular-nums">
              {currency} {cashInfo.totalCashInHand.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-indigo-700 text-white'
                        : item.badge === 'Fast'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Footer info */}
        <div className="p-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span>Wholesale & Retail</span>
            <span className="font-mono text-slate-400">v2.4</span>
          </div>
          <div className="text-slate-400 truncate">Bango Islamia Super Market</div>
        </div>
      </aside>
    </>
  );
};
