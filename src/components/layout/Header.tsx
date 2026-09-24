import React from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { Store, ShoppingCart, Globe, Shield, Sparkles, Building2 } from 'lucide-react';

interface HeaderProps {
  onOpenPOS: () => void;
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({ onOpenPOS, activeTab }) => {
  const { settings, updateSettings, currentUserRole, setCurrentUserRole, branches, activeBranchId, setActiveBranchId } = useApp();
  const isBn = settings.language === 'bn';

  const roleLabels: Record<UserRole, { bn: string; en: string }> = {
    owner: { bn: 'মালিক (Owner)', en: 'Owner' },
    admin: { bn: 'অ্যাডমিন (Admin)', en: 'Admin' },
    manager: { bn: 'ম্যানেজার (Manager)', en: 'Manager' },
    salesman: { bn: 'সেলসম্যান (Sales)', en: 'Salesman' },
    storekeeper: { bn: 'স্টোরকিপার (Store)', en: 'Storekeeper' },
    accountant: { bn: 'একাউন্ট্যান্ট (Accounts)', en: 'Accountant' },
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
            {isBn ? 'স্মার্ট বিজনেস ম্যানেজমেন্ট ও পিওএস' : 'Smart Business & POS Engine'}
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation & Contextual Info */}
      <div className="hidden lg:flex items-center gap-4">
        {/* Branch Selector */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200 text-xs text-slate-700">
          <Building2 className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-600">{isBn ? 'শাখা:' : 'Branch:'}</span>
          <select
            aria-label={isBn ? 'শাখা নির্বাচন করুন' : 'Select Branch'}
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
          title={isBn ? 'ইজি মোড / অ্যাডভান্সড মোড পরিবর্তন' : 'Toggle Easy / Advanced mode'}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>{settings.uiMode === 'easy' ? (isBn ? 'ইজি মোড' : 'Easy Mode') : (isBn ? 'অ্যাডভান্সড মোড' : 'Advanced')}</span>
        </button>

        {/* Role Switcher for Fast Demonstration of Access Rules */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-slate-600">{isBn ? 'রোল:' : 'Role:'}</span>
          <select
            aria-label={isBn ? 'ইউজার রোল পরিবর্তন' : 'Select User Role'}
            value={currentUserRole}
            onChange={(e) => setCurrentUserRole(e.target.value as UserRole)}
            className="bg-transparent font-semibold text-slate-900 focus:outline-none cursor-pointer"
          >
            {(Object.keys(roleLabels) as UserRole[]).map(role => (
              <option key={role} value={role}>
                {isBn ? roleLabels[role].bn : roleLabels[role].en}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Zone 3: Primary Action & Controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Language Switcher */}
        <button
          onClick={() => updateSettings({ language: isBn ? 'en' : 'bn' })}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-700 hover:bg-slate-100 transition-colors border border-slate-200"
          title={isBn ? 'Switch to English' : 'বাংলায় পরিবর্তন করুন'}
        >
          <Globe className="w-3.5 h-3.5 text-slate-500" />
          <span>{isBn ? 'English' : 'বাংলা'}</span>
        </button>

        {/* Primary POS Button */}
        <button
          onClick={onOpenPOS}
          className="flex items-center gap-2 px-3.5 py-2 text-xs md:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition-all rounded-lg shadow-sm shadow-emerald-700/20 whitespace-nowrap"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>{isBn ? 'নতুন বিক্রি (POS)' : 'New Sale (POS)'}</span>
        </button>
      </div>
    </header>
  );
};
