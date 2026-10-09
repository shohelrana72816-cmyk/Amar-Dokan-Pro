
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
import { isSupabaseConfigured } from './lib/supabase';
import { Menu, X, Loader2, Store } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { canAccess, currentUserRole, user, isLoading } = useApp();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isNewPurchaseOpen, setIsNewPurchaseOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

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

  // Show loading screen while the app checks the saved session.
  if (isLoading) {
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
          <span>Checking login session...</span>
        </div>
      </div>
    );
  }

  // Do not allow access to the dashboard if Supabase is not configured.
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white">
        <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center mb-4">
          <Store className="w-8 h-8 text-white" />
        </div>

        <h1 className="text-xl font-bold mb-3">
          Amar Dokan Pro
        </h1>

        <p className="text-center text-slate-300 mb-3">
          Supabase configuration is missing or invalid.
        </p>

        <p className="max-w-lg text-center text-sm text-slate-400">
          Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
          in your environment variables. Then rebuild and redeploy
          the application.
        </p>
      </div>
    );
  }

  // Require authentication before showing any application module.
  if (!user) {
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
      <Header
        onOpenPOS={() => setActiveTab('pos')}
        activeTab={activeTab}
      />

      <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
          aria-label={isSidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          {isSidebarOpen ? (
            <X className="w-4 h-4" />
          ) : (
            <Menu className="w-4 h-4" />
          )}

          <span>Menu & Navigation</span>
        </button>

        <span className="text-xs font-semibold text-slate-800 capitalize">
          {activeTab}
        </span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
        />

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
