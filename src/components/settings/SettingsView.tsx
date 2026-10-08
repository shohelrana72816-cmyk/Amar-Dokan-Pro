import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BusinessType } from '../../types';
import {
  Settings,
  Save,
  Download,
  Upload,
  RotateCcw,
  Shield,
  Building,
  CheckCircle2,
  FileCode,
  Database,
  CloudUpload,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, backupData, restoreData, resetToDemoData, user, activeBusinessId, migrateLegacyData, isMigrated } = useApp();
  const isBn = false;

  const [shopName, setShopName] = useState(settings.shopName);
  const [tagline, setTagline] = useState(settings.tagline);
  const [address, setAddress] = useState(settings.address);
  const [mobile, setMobile] = useState(settings.mobile);
  const [email, setEmail] = useState(settings.email);
  const [vatTaxRate, setVatTaxRate] = useState<number>(settings.vatTaxRate);
  const [invoiceFormat, setInvoiceFormat] = useState<'thermal' | 'a4'>(settings.invoiceFormat);
  const [businessType, setBusinessType] = useState<BusinessType>(settings.businessType);

  const [savedNotice, setSavedNotice] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      shopName,
      tagline,
      address,
      mobile,
      email,
      vatTaxRate: Number(vatTaxRate) || 0,
      invoiceFormat,
      businessType,
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleDownloadBackup = () => {
    const jsonStr = backupData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `amar-dokan-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = restoreData(content);
        if (success) {
          alert('Backup restored successfully!');
        } else {
          alert('Invalid backup JSON file!');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-600" />
            <span>{'Shop Settings & System'}</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            {'Configure business details, VAT, invoice type & backups'}
          </p>
        </div>

        {savedNotice && (
          <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
            <CheckCircle2 className="w-4 h-4" />
            <span>{'Settings Saved!'}</span>
          </span>
        )}
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSaveSettings} className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4 text-xs">
        <h3 className="text-sm font-bold text-slate-900 pb-2 border-b">
          {'1. Shop Profile & Invoice Header'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block font-medium text-slate-700 mb-1">{'Shop Name *'}</label>
            <input
              type="text"
              required
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">{'Tagline'}</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">{'Phone *'}</label>
            <input
              type="text"
              required
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg font-mono"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">{'Email'}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-medium text-slate-700 mb-1">{'Address *'}</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg"
            />
          </div>
        </div>

        <h3 className="text-sm font-bold text-slate-900 pt-3 pb-2 border-b">
          {'2. POS & Invoice Configuration'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-medium text-slate-700 mb-1">{'VAT/Tax Rate (%)'}</label>
            <input
              type="number"
              min="0"
              max="100"
              value={vatTaxRate}
              onChange={(e) => setVatTaxRate(Number(e.target.value) || 0)}
              className="w-full p-2 border border-slate-200 rounded-lg font-mono-num"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">{'Invoice Format'}</label>
            <select
              aria-label={'Invoice Format'}
              value={invoiceFormat}
              onChange={(e) => setInvoiceFormat(e.target.value as any)}
              className="w-full p-2 border border-slate-200 rounded-lg bg-white"
            >
              <option value="thermal">{'Thermal Slip (80mm)'}</option>
              <option value="a4">{'A4 Full Invoice'}</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">{'Business Category'}</label>
            <select
              aria-label={'Business Category'}
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value as any)}
              className="w-full p-2 border border-slate-200 rounded-lg bg-white"
            >
              <option value="clothing">{'Clothing'}</option>
              <option value="grocery">{'Grocery'}</option>
              <option value="electronics">{'Electronics'}</option>
              <option value="pharmacy">{'Pharmacy'}</option>
              <option value="general">{'General'}</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-3">
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{'Save Changes'}</span>
          </button>
        </div>
      </form>

      {/* Backup, Restore & Reset Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4 text-xs">
        <h3 className="text-sm font-bold text-slate-900 pb-2 border-b">
          {'3. Data Backup & Recovery'}
        </h3>

        <p className="text-slate-600">
          {'Download an encrypted JSON backup file of all products, stock, sales, and accounts.'}
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={handleDownloadBackup}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold transition-colors shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>{'Download Backup'}</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold transition-colors border border-slate-200 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>{'Restore from JSON'}</span>
            <input
              type="file"
              accept=".json"
              onChange={handleRestoreFile}
              className="hidden"
            />
          </label>

          <button
            onClick={() => {
              if (confirm('Reset to initial demo data?')) {
                resetToDemoData();
                alert('Demo data reset successfully.');
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-semibold transition-colors border border-rose-200 ml-auto"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{'Reset to Demo Data'}</span>
          </button>
        </div>
      </div>

      {/* Cloud Database & Legacy Data Migration Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4 text-xs">
        <h3 className="text-sm font-bold text-slate-900 pb-2 border-b flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-600" />
          <span>{'Cloud Database & Safe Migration'}</span>
        </h3>

        <div className="space-y-2 text-slate-600">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">Account:</span>
            <span>{user ? user.email : 'Local Session'}</span>
          </div>
          {activeBusinessId && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">Business ID:</span>
              <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded">{activeBusinessId}</span>
            </div>
          )}
          <p>
            If you have existing offline store items, you can safely sync them to your cloud business database with zero data loss.
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={() => migrateLegacyData()}
            disabled={isMigrated}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors shadow-xs disabled:opacity-60 cursor-pointer"
          >
            <CloudUpload className="w-4 h-4" />
            <span>{isMigrated ? 'Data Synced with Cloud' : 'Sync Local Store to Cloud Database'}</span>
          </button>
        </div>
      </div>

      {/* Role & Permissions Guide */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3 text-xs">
        <h3 className="text-sm font-bold text-slate-900 pb-2 border-b flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-600" />
          <span>{'4. Role & Permissions Guide'}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 bg-slate-50 rounded-lg border">
            <span className="font-bold text-slate-900 block">👑 Owner / Admin</span>
            <p className="text-slate-600 mt-1">Full access to all modules (Dashboard, Sales, Purchases, Profits, Settings & Backup).</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border">
            <span className="font-bold text-slate-900 block">🧑💻 Salesman</span>
            <p className="text-slate-600 mt-1">Access to POS, Customers, and Invoices. Sensitive financial and report data is hidden.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border">
            <span className="font-bold text-slate-900 block">📦 Storekeeper</span>
            <p className="text-slate-600 mt-1">Manage product catalog, stock adjustments, and inter-branch inventory transfers.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
