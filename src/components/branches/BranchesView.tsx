import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Branch } from '../../types';
import { toBnNumber } from '../../utils/formatters';
import {
  GitFork,
  Plus,
  Building2,
  MapPin,
  Phone,
  CheckCircle2,
  X,
} from 'lucide-react';

export const BranchesView: React.FC = () => {
  const { branches, addBranch, activeBranchId, setActiveBranchId, settings } = useApp();
  const isBn = settings.language === 'bn';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [mobile, setMobile] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !location.trim()) return;

    addBranch({
      name: name.trim(),
      location: location.trim(),
      mobile: mobile.trim() || settings.mobile,
      isMain: false,
    });

    setIsModalOpen(false);
    setName('');
    setLocation('');
    setMobile('');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <span>{isBn ? 'মাল্টি-ব্রাঞ্চ ও ওয়্যারহাউস পরিচালনা' : 'Multi-Branch & Warehouse Management'}</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            {isBn ? 'একই একাউন্ট থেকে একাধিক শোরুম ও গুদামের স্টক নিয়ন্ত্রণ করুন' : 'Centralized multi-outlet & warehouse management'}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 text-xs md:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{isBn ? 'নতুন ব্রাঞ্চ খুলুন' : 'Add New Branch'}</span>
        </button>
      </div>

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {branches.map(branch => {
          const isActive = branch.id === activeBranchId;
          return (
            <div
              key={branch.id}
              className={`p-5 rounded-2xl border transition-all ${
                isActive
                  ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-400'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <span>{branch.name}</span>
                    {branch.isMain && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-medium">
                        {isBn ? 'প্রধান শাখা' : 'Main'}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{branch.location}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 font-mono">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{branch.mobile}</span>
                  </p>
                </div>

                {isActive && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {isActive ? (isBn ? 'বর্তমানে সক্রিয় শাখা' : 'Active Outlet') : (isBn ? 'নিষ্ক্রিয়' : 'Inactive')}
                </span>

                {!isActive && (
                  <button
                    onClick={() => setActiveBranchId(branch.id)}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    {isBn ? 'এই শাখায় পরিবর্তন' : 'Switch Branch'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Branch Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900">
                {isBn ? 'নতুন শাখা বা ওয়্যারহাউস যোগ' : 'Add New Branch / Outlet'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">{isBn ? 'শাখার নাম *' : 'Branch Name *'}</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. উত্তরা আউটলেট (Branch 03)"
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">{isBn ? 'ঠিকানা ও অবস্থান *' : 'Location *'}</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. সেক্টর-৭, উত্তরা, ঢাকা"
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">{isBn ? 'শাখা ম্যানেজারের মোবাইল' : 'Contact Mobile'}</label>
                <input
                  type="text"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="017xxxxxxxx"
                  className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
              >
                {isBn ? 'শাখা যোগ করুন' : 'Create Branch'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
