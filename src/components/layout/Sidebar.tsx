import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Package,
  Boxes,
  Truck,
  Users,
  Building,
  Wallet,
  TrendingUp,
  UserCheck,
  GitFork,
  Settings,
  AlertTriangle,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, setIsOpen }) => {
  const { settings, products, customers, canAccess, currentUserRole } = useApp();
  const isBn = settings.language === 'bn';

  // Count low stock items
  const lowStockCount = products.filter(p => p.currentStock <= p.minStockAlert).length;
  // Count customers with pending due
  const dueCustomerCount = customers.filter(c => c.currentDue > 0).length;

  interface NavItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
    moduleKey: 'dashboard' | 'pos' | 'products' | 'stock' | 'purchases' | 'customers' | 'suppliers' | 'accounts' | 'reports' | 'employees' | 'branches' | 'settings';
  }

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      moduleKey: 'dashboard',
    },
    {
      id: 'pos',
      label: 'POS / New Sale',
      icon: ShoppingCart,
      moduleKey: 'pos',
    },
    {
      id: 'sales',
      label: 'Sales & Invoices',
      icon: Receipt,
      moduleKey: 'pos',
    },
    {
      id: 'products',
      label: 'Products & Variants',
      icon: Package,
      moduleKey: 'products',
    },
    {
      id: 'inventory',
      label: 'Stock & Inventory',
      icon: Boxes,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'bg-rose-500 text-white',
      moduleKey: 'stock',
    },
    {
      id: 'purchases',
      label: 'Purchases',
      icon: Truck,
      moduleKey: 'purchases',
    },
    {
      id: 'customers',
      label: 'Customers & Due Ledger',
      icon: Users,
      badge: dueCustomerCount > 0 ? dueCustomerCount : undefined,
      badgeColor: 'bg-amber-600 text-white',
      moduleKey: 'customers',
    },
    {
      id: 'suppliers',
      label: 'Suppliers & Due',
      icon: Building,
      moduleKey: 'suppliers',
    },
    {
      id: 'accounts',
      label: 'Cash, Bank & Expense',
      icon: Wallet,
      moduleKey: 'accounts',
    },
    {
      id: 'reports',
      label: 'Profit/Loss & Reports',
      icon: TrendingUp,
      moduleKey: 'reports',
    },
    {
      id: 'employees',
      label: 'Employees & Payroll',
      icon: UserCheck,
      moduleKey: 'employees',
    },
    {
      id: 'branches',
      label: 'Branches & Transfer',
      icon: GitFork,
      moduleKey: 'branches',
    },
    {
      id: 'settings',
      label: 'Settings & Backup',
      icon: Settings,
      moduleKey: 'settings',
    },
  ];

  const visibleItems = navItems.filter(item => canAccess(item.moduleKey));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-16 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {visibleItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200/80 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-emerald-700' : 'text-slate-500'
                    }`}
                  />
                  <span className="truncate">
                    {item.label}
                  </span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${item.badgeColor || 'bg-slate-200 text-slate-700'}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Current Role & Shop Info */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
            <span className="truncate font-medium">{settings.shopName}</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-600 flex items-center justify-between">
            <span>Active Role:</span>
            <span className="font-semibold text-slate-800 capitalize">{currentUserRole}</span>
          </div>
        </div>
      </aside>
    </>
  );
};
