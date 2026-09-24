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
import { Menu, X } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { canAccess, currentUserRole } = useApp();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Quick Action Modal Triggers
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isNewPurchaseOpen, setIsNewPurchaseOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  // Validate active tab with current user role
  useEffect(() => {
    const tabToModuleMap: Record<string, any> = {
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
        return <DashboardView onNavigate={setActiveTab} onOpenPOS={() => setActiveTab('pos')} onOpenAddProduct={() => {}} onOpenAddCustomer={() => {}} onOpenNewPurchase={() => {}} onOpenAddExpense={() => {}} />;
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
          {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          <span>মেনু ও ন্যাভিগেশন</span>
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
