import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { POSView } from './components/pos/POSView';
import { SalesHistoryView } from './components/sales/SalesHistoryView';
import { ProductsView } from './components/products/ProductsView';
import { InventoryView } from './components/inventory/InventoryView';
import { PurchasesView } from './components/purchases/PurchasesView';
import { CustomersView } from './components/customers/CustomersView';
import { SuppliersView } from './components/suppliers/SuppliersView';
import { AccountsView } from './components/accounts/AccountsView';
import { ReportsView } from './components/reports/ReportsView';
import { EmployeesView } from './components/employees/EmployeesView';
import { BranchesView } from './components/branches/BranchesView';
import { SettingsView } from './components/settings/SettingsView';
import { AuthModal } from './components/auth/AuthModal';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { Menu, X, Loader2, Store } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { canAccess, currentUserRole, user, isLoading } = useApp();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Password recovery state.
  // Check the recovery URL as well, in case the auth event fires
  // before this component subscribes to Supabase auth events.
  const [isRecovery, setIsRecovery] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;

    const hashParams = new URLSearchParams(
      window.location.hash.replace(/^#/, '')
    );

    const queryParams = new URLSearchParams(window.location.search);

    return (
      hashParams.get('type') === 'recovery' ||
      queryParams.get('type') === 'recovery'
    );
  });

  // Quick Action Modal Triggers
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isNewPurchaseOpen, setIsNewPurchaseOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  // Listen for Supabase password recovery events.
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Validate active tab with current user role.
  useEffect(() => {
    const tabToModuleMap: Record<string, string> = {
      dashboard: 'dashboard',
      pos: 'pos',
      sales: 'pos',
      products: 'products',
      inventory: 'stock',
      purchases: 'purchases',
      customers: 'customers',
      suppliers: 'suppliers',
      accounts: 'accounts',
      reports: 'reports',
      employees: 'employees',
      branches: 'branches',
      settings: 'settings',
    };

    const targetModule = tabToModuleMap[activeTab] || 'dashboard';

    if (!canAccess(targetModule)) {
      setActiveTab('dashboard');
    }
  }, [currentUserRole, activeTab, canAccess]);

  // Loading screen while the session and initial data are loading.
  if (isLoading && !isRecovery) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
          <Store className="w-8 h-8 text-white animate-pulse" />
        </div>

        <h1 className="text-xl font-bold tracking-tight mb-2">
          Amar Dokan Pro
        </h1>

        <div className="flex items-center gap-2 text-sm text-emerald-400 font-medium">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Connecting to Supabase...</span>
        </div>
      </div>
    );
  }

  // Show the password form when the user opens a recovery link.
  // Recovery must take priority over the authenticated dashboard.
  if (isSupabaseConfigured && isRecovery) {
    return (
      <AuthModal
        key="password-recovery"
        initialMode="recovery"
        onSuccess={() => {}}
        onRecoveryComplete={() => {
          setIsRecovery(false);
        }}
      />
    );
  }

  // If Supabase is configured and the user is not authenticated,
  // show the login/signup screen.
  if (isSupabaseConfigured && !user) {
    return <AuthModal onSuccess={() => {}} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            onNavigate={setActiveTab}
            onOpenPOS={() => setActiveTab('pos')}
            onOpenAddProduct={() => {
              setActiveTab('products');
              setIsAddProductOpen(true);
            }}
            onOpenAddCustomer={() => {
              setActiveTab('customers');
              setIsAddCustomerOpen(true);
            }}
            onOpenNewPurchase={() => {
              setActiveTab('purchases');
              setIsNewPurchaseOpen(true);
            }}
            onOpenAddExpense={() => {
              setActiveTab('accounts');
              setIsAddExpenseOpen(true);
            }}
          />
        );

      case 'pos':
        return <POSView />;

      case 'sales':
        return <SalesHistoryView />;

      case 'products':
        return (
          <ProductsView
            isAddModalOpen={isAddProductOpen}
            onCloseAddModal={() => setIsAddProductOpen(false)}
          />
        );

      case 'inventory':
        return <InventoryView />;

      case 'purchases':
        return (
          <PurchasesView
            isAddModalOpen={isNewPurchaseOpen}
            onCloseAddModal={() => setIsNewPurchaseOpen(false)}
          />
        );

      case 'customers':
        return (
          <CustomersView
            isAddModalOpen={isAddCustomerOpen}
            onCloseAddModal={() => setIsAddCustomerOpen(false)}
          />
        );

      case 'suppliers':
        return <SuppliersView />;

      case 'accounts':
        return (
          <AccountsView
            isExpenseModalOpen={isAddExpenseOpen}
            onCloseExpenseModal={() => setIsAddExpenseOpen(false)}
          />
        );

      case 'reports':
        return <ReportsView />;

      case 'employees':
        return <EmployeesView />;

      case 'branches':
        return <BranchesView />;

      case 'settings':
        return <SettingsView />;

      default:
        return (
          <DashboardView
            onNavigate={setActiveTab}
            onOpenPOS={() => setActiveTab('pos')}
            onOpenAddProduct={() => {}}
            onOpenAddCustomer={() => {}}
            onOpenNewPurchase={() => {}}
            onOpenAddExpense={() => {}}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Header */}
      <Header
        onOpenPOS={() => setActiveTab('pos')}
        activeTab={activeTab}
      />

      {/* Mobile Sidebar Toggle Button */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          {isSidebarOpen ? (
            <X className="w-4 h-4" />
          ) : (
            <Menu className="w-4 h-4" />
          )}
          <span>Menu &amp; Navigation</span>
        </button>

        <span className="text-xs font-semibold text-slate-800 capitalize">
          {activeTab}
        </span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-[1600px] mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
