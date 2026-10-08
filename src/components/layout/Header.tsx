import React from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { Store, ShoppingCart, Globe, Shield, Sparkles, Building2, LogOut } from 'lucide-react';

interface HeaderProps {
  onOpenPOS: () => void;
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({ onOpenPOS, activeTab }) => {
  const { settings, updateSettings, currentUserRole, setCurrentUserRole, branches, activeBranchId, setActiveBranchId, user, signOut } = useApp();
  const isBn = settings.language === 'bn';

  const roleLabels: Record<UserRole, string> = {
    owner: 'Owner',
    admin: 'Admin',
    manager: 'Manager',
    salesman: 'Salesman',
    storekeeper: 'Storekeeper',
    accountant: 'Accountant',
  };

  const currentBranch = branches.find(b => b.id === activeBranchId) || branches[0];

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-700/20 shrink-0">
          <Store className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-base md:text-lg font-bold tracking-tight text-slate-900 leading-tight">
            Amar Dokan Pro
          </span>
          <span className="text-[11px] text-slate-600 hidden sm:inline">
            Smart Business & POS Engine
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation & Contextual Info */}
      <div className="hidden lg:flex items-center gap-4">
        {/* Branch Selector */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200 text-xs text-slate-700">
          <Building2 className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-600">Branch:</span>
          <select
            aria-label="Select Branch"
            value={activeBranchId}
            onChange={(e) => setActiveBranchId(e.target.value)}
            className="bg-transparent font-medium text-slate-900 focus:outline-none cursor-pointer"
          >
            {branches.map(b => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Easy vs Advanced Mode */}
        <button
          onClick={() => updateSettings({ uiMode: settings.uiMode === 'easy' ? 'advanced' : 'easy' })}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
            settings.uiMode === 'easy'
              ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
          title="Toggle Easy / Advanced mode"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>{settings.uiMode === 'easy' ? 'Easy Mode' : 'Advanced'}</span>
        </button>

        {/* Role Switcher for Fast Demonstration of Access Rules */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-slate-600">Role:</span>
          <select
            aria-label="Select User Role"
            value={currentUserRole}
            onChange={(e) => setCurrentUserRole(e.target.value as UserRole)}
            className="bg-transparent font-semibold text-slate-900 focus:outline-none cursor-pointer"
          >
            {(Object.keys(roleLabels) as UserRole[]).map(role => (
              <option key={role} value={role}>
                {roleLabels[role]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Zone 3: Primary Action & Controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Language Badge */}
        <div className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-700 bg-slate-50 border border-slate-200">
          <Globe className="w-3.5 h-3.5 text-emerald-600" />
          <span>English</span>
        </div>

        {/* Primary POS Button */}
        <button
          onClick={onOpenPOS}
          className="flex items-center gap-2 px-3.5 py-2 text-xs md:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition-all rounded-lg shadow-sm shadow-emerald-700/20 whitespace-nowrap"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>New Sale (POS)</span>
        </button>

        {/* User Sign Out */}
        {user && (
          <button
            onClick={() => signOut()}
            title={`Signed in as ${user.email}. Click to Sign Out`}
            className="flex items-center gap-1.5 p-2 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden xl:inline">Logout</span>
          </button>
        )}
      </div>
    </header>
  );
};
