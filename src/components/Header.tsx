import React from 'react';
import { Menu, Search, PlusCircle, CheckCircle2 } from 'lucide-react';
import { NavTab } from './Sidebar';
import { AppState } from '../types';

interface HeaderProps {
  currentTab: NavTab;
  onOpenMobileMenu: () => void;
  onOpenSearch: () => void;
  onOpenTestModal: () => void;
  onNewMemoClick: () => void;
  appState: AppState;
}

const TAB_TITLES: Record<NavTab, { title: string; subtitle: string }> = {
  dashboard: { title: 'Executive Dashboard', subtitle: 'Live sales, cash collection, stock & customer summary' },
  'new-memo': { title: 'New Memo & Billing', subtitle: 'Fast data entry with automatic stock deduction' },
  'factory-007': { title: '007 Factory Distribution', subtitle: '০০৭ ফ্যাক্টরি প্রোডাক্ট ডিস্ট্রিবিউশন ক্লায়েন্ট তালিকা, চালান ও বকেয়া হিসাব' },
  payables: { title: 'আমার কাছে কারা টাকা পাবে (Payables)', subtitle: 'ফ্যাক্টরি, মহাজন ও সাপ্লায়ারদের দেনা-পাওনা ও বিল পরিশোধ রেজিস্টার' },
  customers: { title: 'Customer Management', subtitle: 'Customer profiles, contact directory & outstanding dues' },
  locations: { title: 'Customer Areas & Locations', subtitle: 'কোন কোন এরিয়ার কাস্টমার আছে - বাংলাদেশ জেলা ভিত্তিক বিশ্লেষণ' },
  payments: { title: 'Payment Collection', subtitle: 'Record customer due payments with instant ledger updates' },
  expenses: { title: 'Expense Management', subtitle: 'Track operational costs, salaries, rent & factory expenses' },
  stock: { title: 'Stock & Factory Inventory', subtitle: 'Multi-supplier stock balance & intake management' },
  sales: { title: 'Sales & Memo History', subtitle: 'Searchable sales archive with instant reprints and returns' },
  reports: { title: 'Business Reports & Analytics', subtitle: 'Daily sheets, monthly statements & profit calculations' },
  transactions: { title: 'Unified Audit Trail', subtitle: 'Chronological timeline of all system transactions' },
  settings: { title: 'Settings & Business Configuration', subtitle: 'Store profile, factories, products & data safety' },
};

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenMobileMenu,
  onOpenSearch,
  onOpenTestModal,
  onNewMemoClick,
}) => {
  const meta = TAB_TITLES[currentTab] || { title: 'Business Manager', subtitle: 'Shop System' };
  
  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
      {/* Left: Mobile Toggle + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
            {meta.title}
          </h1>
          <p className="hidden sm:block text-xs text-slate-500 font-medium">
            {meta.subtitle}
          </p>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Global Search trigger */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500 bg-slate-100 hover:bg-slate-200/80 rounded-lg border border-slate-200/80 transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden md:inline">Search customer, memo, product...</span>
          <span className="md:hidden">Search</span>
          <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white rounded border border-slate-300 text-slate-500">
            /
          </kbd>
        </button>

        {/* Date display */}
        <div className="hidden xl:flex items-center text-xs font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <span>{todayFormatted}</span>
        </div>

        {/* Automated Test Runner Trigger */}
        <button
          onClick={onOpenTestModal}
          title="Verify Test Scenarios 1-6"
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors whitespace-nowrap"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden sm:inline">Verify Tests (1-6)</span>
          <span className="sm:hidden">Tests</span>
        </button>

        {/* Fast New Memo CTA */}
        {currentTab !== 'new-memo' && (
          <button
            onClick={onNewMemoClick}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Memo</span>
          </button>
        )}
      </div>
    </header>
  );
};
