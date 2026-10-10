/**
 * LIMA GARMENTS - Shop Automatic Memo & Business Management System
 * Main React Application Component
 */

import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { NewMemo } from './components/NewMemo';
import { MemoModal } from './components/MemoModal';
import { Customers } from './components/Customers';
import { CustomerAreas } from './components/CustomerAreas';
import { Factory007Distribution } from './components/Factory007Distribution';
import { Payables } from './components/Payables';
import { CustomerLedgerModal } from './components/CustomerLedgerModal';
import { Payments } from './components/Payments';
import { Expenses } from './components/Expenses';
import { Stock } from './components/Stock';
import { Sales } from './components/Sales';
import { ReturnModal } from './components/ReturnModal';
import { Reports } from './components/Reports';
import { Transactions } from './components/Transactions';
import { Settings } from './components/Settings';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { TestVerificationModal } from './components/TestVerificationModal';
import { AppState, Memo, Customer } from './types';
import { loadAppState } from './services/storage';

export default function App() {
  const [appState, setAppState] = useState<AppState>(() => loadAppState());
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Modals
  const [viewingMemo, setViewingMemo] = useState<Memo | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [returningMemo, setReturningMemo] = useState<Memo | null>(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);

  // Pre-selected customer for payments
  const [preSelectedCustomerId, setPreSelectedCustomerId] = useState<string | undefined>(undefined);

  // Keyboard shortcut listener for global search (Slash or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === '/' || (e.ctrlKey && e.key === 'k')) && !searchModalOpen) {
        const activeElem = document.activeElement;
        const isInput =
          activeElem?.tagName === 'INPUT' || activeElem?.tagName === 'TEXTAREA';
        if (!isInput) {
          e.preventDefault();
          setSearchModalOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchModalOpen]);

  // Handlers
  const handleStateUpdated = (nextState: AppState) => {
    setAppState(nextState);
  };

  const handleMemoCreated = (nextState: AppState, createdMemo: Memo) => {
    setAppState(nextState);
    setViewingMemo(createdMemo);
  };

  const handleOpenCustomerProfile = (customerId: string) => {
    const cust = appState.customers.find((c) => c.id === customerId);
    if (cust) {
      setViewingCustomer(cust);
    }
  };

  const handleOpenPaymentForCustomer = (customerId: string) => {
    setPreSelectedCustomerId(customerId);
    setViewingCustomer(null);
    setCurrentTab('payments');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Left Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setPreSelectedCustomerId(undefined);
        }}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        appState={appState}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <Header
          currentTab={currentTab}
          onOpenMobileMenu={() => setMobileSidebarOpen(true)}
          onOpenSearch={() => setSearchModalOpen(true)}
          onOpenTestModal={() => setTestModalOpen(true)}
          onNewMemoClick={() => setCurrentTab('new-memo')}
          appState={appState}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <Dashboard
              appState={appState}
              onNavigate={(tab) => setCurrentTab(tab)}
              onViewMemo={(memo) => setViewingMemo(memo)}
              onOpenCustomerProfile={handleOpenCustomerProfile}
            />
          )}

          {currentTab === 'new-memo' && (
            <NewMemo
              appState={appState}
              onMemoCreated={handleMemoCreated}
              onCancel={() => setCurrentTab('dashboard')}
            />
          )}

          {currentTab === 'factory-007' && (
            <Factory007Distribution
              appState={appState}
              onOpenLedger={(c) => setViewingCustomer(c)}
              onOpenPayment={handleOpenPaymentForCustomer}
              onNewMemoWithSupplier={() => {
                setCurrentTab('new-memo');
              }}
              onViewMemo={(m) => setViewingMemo(m)}
              onCustomerUpdated={handleStateUpdated}
            />
          )}

          {currentTab === 'payables' && (
            <Payables
              appState={appState}
              onPayablesUpdated={handleStateUpdated}
            />
          )}

          {currentTab === 'customers' && (
            <Customers
              appState={appState}
              onOpenLedger={(c) => setViewingCustomer(c)}
              onOpenPayment={handleOpenPaymentForCustomer}
              onCustomerUpdated={handleStateUpdated}
            />
          )}

          {currentTab === 'locations' && (
            <CustomerAreas
              appState={appState}
              onSelectCustomer={(c) => setViewingCustomer(c)}
              onOpenPayment={handleOpenPaymentForCustomer}
              onNavigateToCustomersWithDistrict={(district) => {
                setCurrentTab('customers');
              }}
              onCustomerCreated={handleStateUpdated}
            />
          )}

          {currentTab === 'payments' && (
            <Payments
              appState={appState}
              selectedCustomerId={preSelectedCustomerId}
              onPaymentSaved={handleStateUpdated}
            />
          )}

          {currentTab === 'expenses' && (
            <Expenses appState={appState} onExpenseSaved={handleStateUpdated} />
          )}

          {currentTab === 'stock' && (
            <Stock appState={appState} onStockUpdated={handleStateUpdated} />
          )}

          {currentTab === 'sales' && (
            <Sales
              appState={appState}
              onViewMemo={(m) => setViewingMemo(m)}
              onOpenReturn={(m) => setReturningMemo(m)}
              onNewMemoClick={() => setCurrentTab('new-memo')}
              onSalesUpdated={handleStateUpdated}
            />
          )}

          {currentTab === 'reports' && (
            <Reports
              appState={appState}
              onOpenCustomerProfile={handleOpenCustomerProfile}
            />
          )}

          {currentTab === 'transactions' && <Transactions appState={appState} />}

          {currentTab === 'settings' && (
            <Settings appState={appState} onSettingsUpdated={handleStateUpdated} />
          )}
        </main>
      </div>

      {/* Printable Memo Modal (A4 & 80mm POS Slip) */}
      <MemoModal
        memo={viewingMemo}
        settings={appState.settings}
        onClose={() => setViewingMemo(null)}
      />

      {/* Customer Due Ledger Modal */}
      <CustomerLedgerModal
        customer={viewingCustomer}
        appState={appState}
        onClose={() => setViewingCustomer(null)}
        onOpenPaymentForCustomer={handleOpenPaymentForCustomer}
        onCustomerUpdated={handleStateUpdated}
        onCustomerDeleted={(next) => {
          handleStateUpdated(next);
          setViewingCustomer(null);
        }}
      />

      {/* Sales Return Processing Modal */}
      <ReturnModal
        memo={returningMemo}
        appState={appState}
        onClose={() => setReturningMemo(null)}
        onReturnProcessed={handleStateUpdated}
      />

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        appState={appState}
        onSelectCustomer={(cId) => handleOpenCustomerProfile(cId)}
        onSelectMemo={(m) => setViewingMemo(m)}
        onNavigateToStock={(sId) => {
          setCurrentTab('stock');
        }}
      />

      {/* In-App Automated Test Verification Modal (Tests 1-6) */}
      <TestVerificationModal
        isOpen={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        appState={appState}
        onStateUpdated={handleStateUpdated}
      />
    </div>
  );
}
