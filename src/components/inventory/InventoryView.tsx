import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StockAdjustment } from '../../types';
import { formatCurrency, formatDate, exportToCSV, toBnNumber } from '../../utils/formatters';
import {
  Boxes,
  AlertTriangle,
  ArrowDownUp,
  Download,
  PlusCircle,
  GitFork,
  X,
  History,
} from 'lucide-react';

export const InventoryView: React.FC = () => {
  const { products, branches, stockMovements, adjustStock, transferStock, settings, activeBranchId } = useApp();
  const isBn = settings.language === 'bn';
  const lang = settings.language;

  const [activeTab, setActiveTab] = useState<'stock' | 'movements'>('stock');
  const [filterType, setFilterType] = useState<'all' | 'low' | 'out'>('all');

  // Modal States
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjProductId, setAdjProductId] = useState(products[0]?.id || '');
  const [adjQty, setAdjQty] = useState<number | ''>('');
  const [adjReason, setAdjReason] = useState<StockAdjustment['reason']>('damaged');
  const [adjNote, setAdjNote] = useState('');

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [tfProductId, setTfProductId] = useState(products[0]?.id || '');
  const [tfQty, setTfQty] = useState<number | ''>('');
  const [fromBranch, setFromBranch] = useState(branches[0]?.id || '');
  const [toBranch, setToBranch] = useState(branches[1]?.id || branches[0]?.id || '');
  const [tfNote, setTfNote] = useState('');

  // Calculations
  const totalStockUnits = products.reduce((sum, p) => sum + p.currentStock, 0);
  const totalCostValuation = products.reduce((sum, p) => sum + (p.currentStock * p.purchasePrice), 0);
  const totalRetailValuation = products.reduce((sum, p) => sum + (p.currentStock * p.salePrice), 0);
  const potentialProfit = totalRetailValuation - totalCostValuation;

  const lowStockItems = products.filter(p => p.currentStock > 0 && p.currentStock <= p.minStockAlert);
  const outOfStockItems = products.filter(p => p.currentStock <= 0);

  const displayedProducts = products.filter(p => {
    if (filterType === 'low') return p.currentStock > 0 && p.currentStock <= p.minStockAlert;
    if (filterType === 'out') return p.currentStock <= 0;
    return true;
  });

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjProductId || adjQty === '' || adjQty === 0) return;
    adjustStock(adjProductId, Number(adjQty), adjReason, adjNote);
    setShowAdjustmentModal(false);
    setAdjQty('');
    setAdjNote('');
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tfProductId || tfQty === '' || Number(tfQty) <= 0 || fromBranch === toBranch) {
      alert(isBn ? 'অনুগ্রহ করে সঠিক শাখা ও পরিমাণ নির্বাচন করুন!' : 'Invalid branch or quantity selected!');
      return;
    }
    transferStock(tfProductId, Number(tfQty), fromBranch, toBranch, tfNote);
    setShowTransferModal(false);
    setTfQty('');
    setTfNote('');
  };

  const handleExportCSV = () => {
    const rows: (string | number)[][] = [
      ['Product Name', 'SKU', 'Category', 'Unit', 'Stock Qty', 'Purchase Price', 'Total Cost Valuation', 'Sale Price', 'Total Retail Value'],
      ...products.map(p => [
        p.name,
        p.code,
        p.category,
        p.unit,
        p.currentStock,
        p.purchasePrice,
        p.currentStock * p.purchasePrice,
        p.salePrice,
        p.currentStock * p.salePrice,
      ]),
    ];
    exportToCSV(`amar-dokan-stock-valuation-${Date.now()}`, rows);
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Valuation Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs text-slate-500 block">{isBn ? 'মোট স্টক আইটেম' : 'Total Stock Units'}</span>
          <span className="text-xl md:text-2xl font-bold font-mono-num text-slate-900 mt-1 block">
            {toBnNumber(totalStockUnits)}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {toBnNumber(products.length)} {isBn ? 'টি অনন্য পণ্য' : 'unique products'}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs text-slate-500 block">{isBn ? 'মোট ক্রয়মূল্য (Cost Value)' : 'Total Cost Value'}</span>
          <span className="text-xl md:text-2xl font-bold font-mono-num text-slate-900 mt-1 block">
            {formatCurrency(totalCostValuation, lang)}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {isBn ? 'দোকানে রক্ষিত মোট মূলধন' : 'Invested inventory capital'}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs text-slate-500 block">{isBn ? 'মোট বিক্রয়মূল্য (Retail Value)' : 'Total Retail Value'}</span>
          <span className="text-xl md:text-2xl font-bold font-mono-num text-emerald-700 mt-1 block">
            {formatCurrency(totalRetailValuation, lang)}
          </span>
          <span className="text-[11px] text-emerald-600 mt-0.5 block">
            {isBn ? 'বিক্রি সম্পন্ন হলে সম্ভাব্য আয়' : 'Potential sales turnover'}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs text-slate-500 block">{isBn ? 'সম্ভাব্য মোট লাভ' : 'Potential Margin'}</span>
          <span className="text-xl md:text-2xl font-bold font-mono-num text-emerald-600 mt-1 block">
            {formatCurrency(potentialProfit, lang)}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {isBn ? 'রিটেল মূল্য - ক্রয়মূল্য' : 'Gross expected margin'}
          </span>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* View Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-0.5 rounded-lg">
            <button
              onClick={() => setActiveTab('stock')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'stock' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              {isBn ? 'স্টক তালিকা' : 'Inventory Table'}
            </button>
            <button
              onClick={() => setActiveTab('movements')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'movements' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              {isBn ? 'স্টক অডিট ও হিস্ট্রি' : 'Stock Movements'}
            </button>
          </div>

          {activeTab === 'stock' && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-md border ${
                  filterType === 'all' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                {isBn ? 'সব' : 'All'}
              </button>
              <button
                onClick={() => setFilterType('low')}
                className={`px-2.5 py-1 rounded-md border flex items-center gap-1 ${
                  filterType === 'low' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-amber-700 border-amber-200'
                }`}
              >
                <span>{isBn ? 'কম স্টক' : 'Low Stock'}</span>
                <span className="font-bold">({toBnNumber(lowStockItems.length)})</span>
              </button>
              <button
                onClick={() => setFilterType('out')}
                className={`px-2.5 py-1 rounded-md border flex items-center gap-1 ${
                  filterType === 'out' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-rose-700 border-rose-200'
                }`}
              >
                <span>{isBn ? 'স্টক শেষ' : 'Out'}</span>
                <span className="font-bold">({toBnNumber(outOfStockItems.length)})</span>
              </button>
            </div>
          )}
        </div>

        {/* Buttons: Adjust, Transfer, Export */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdjustmentModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 font-semibold transition-colors"
          >
            <ArrowDownUp className="w-3.5 h-3.5 text-slate-600" />
            <span>{isBn ? 'স্টক সমন্বয় (Adjustment)' : 'Stock Adjust'}</span>
          </button>
          <button
            onClick={() => setShowTransferModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 font-semibold transition-colors"
          >
            <GitFork className="w-3.5 h-3.5 text-slate-600" />
            <span>{isBn ? 'শাখা ট্রান্সফার' : 'Branch Transfer'}</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>{isBn ? 'CSV ডাউনলোড' : 'Export'}</span>
          </button>
        </div>
      </div>

      {/* Main Stock Table */}
      {activeTab === 'stock' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">{isBn ? 'পণ্য' : 'Product'}</th>
                  <th className="px-4 py-3 font-semibold">{isBn ? 'কোড' : 'Code'}</th>
                  <th className="px-4 py-3 font-semibold text-center">{isBn ? 'বর্তমান স্টক' : 'Current Stock'}</th>
                  <th className="px-4 py-3 font-semibold text-center">{isBn ? 'অ্যালার্ট লিমিট' : 'Min Alert'}</th>
                  <th className="px-4 py-3 font-semibold text-right">{isBn ? 'ক্রয়মূল্য' : 'Cost'}</th>
                  <th className="px-4 py-3 font-semibold text-right">{isBn ? 'মোট ইনভেন্টরি মূল্য' : 'Cost Valuation'}</th>
                  <th className="px-4 py-3 font-semibold">{isBn ? 'অবস্থা' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedProducts.map(p => {
                  const isOut = p.currentStock <= 0;
                  const isLow = p.currentStock > 0 && p.currentStock <= p.minStockAlert;
                  const valuation = p.currentStock * p.purchasePrice;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {p.name}
                        {p.hasVariants && (
                          <div className="text-[10px] text-slate-500 font-normal">
                            {p.variants?.map(v => `${v.color} ${v.size} (${v.stock})`).join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">{p.code}</td>
                      <td className="px-4 py-3 text-center font-mono-num font-bold text-slate-900">
                        {toBnNumber(p.currentStock)} {p.unit}
                      </td>
                      <td className="px-4 py-3 text-center font-mono-num text-slate-500">
                        {toBnNumber(p.minStockAlert)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono-num text-slate-600">
                        {formatCurrency(p.purchasePrice, lang)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono-num font-bold text-slate-900">
                        {formatCurrency(valuation, lang)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                            isOut
                              ? 'bg-rose-50 text-rose-700'
                              : isLow
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {isOut ? (isBn ? 'স্টক শেষ' : 'Out of Stock') : isLow ? (isBn ? 'কম স্টক' : 'Low Stock') : (isBn ? 'স্বাভাবিক' : 'Normal')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Stock Movements Audit Log */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">{isBn ? 'তারিখ' : 'Date'}</th>
                  <th className="px-4 py-3 font-semibold">{isBn ? 'পণ্য' : 'Product'}</th>
                  <th className="px-4 py-3 font-semibold">{isBn ? 'মুভমেন্ট টাইপ' : 'Type'}</th>
                  <th className="px-4 py-3 font-semibold text-center">{isBn ? 'পরিমাণ (+/-)' : 'Quantity'}</th>
                  <th className="px-4 py-3 font-semibold text-center">{isBn ? 'নতুন স্টক' : 'Balance'}</th>
                  <th className="px-4 py-3 font-semibold">{isBn ? 'রেফারেন্স / নোট' : 'Reference & Note'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockMovements.map(sm => (
                  <tr key={sm.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {formatDate(sm.date, lang)}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{sm.productName}</td>
                    <td className="px-4 py-3 capitalize">
                      <span className="font-medium text-slate-700">{sm.type.replace('_', ' ')}</span>
                    </td>
                    <td className="px-4 py-3 text-center font-mono-num font-bold">
                      <span className={sm.quantity >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                        {sm.quantity >= 0 ? `+${toBnNumber(sm.quantity)}` : toBnNumber(sm.quantity)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-mono-num font-semibold text-slate-800">
                      {toBnNumber(sm.newStock)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {sm.reference && <span className="font-mono text-[11px] font-semibold text-slate-800 block">{sm.reference}</span>}
                      <span className="text-[11px]">{sm.note}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form
            onSubmit={handleAdjustSubmit}
            className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ArrowDownUp className="w-4 h-4 text-emerald-600" />
                <span>{isBn ? 'স্টক সমন্বয় (Stock Adjustment)' : 'Stock Adjustment'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAdjustmentModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">{isBn ? 'পণ্য নির্বাচন করুন *' : 'Select Product *'}</label>
                <select
                  aria-label={isBn ? 'পণ্য নির্বাচন করুন' : 'Select Product'}
                  value={adjProductId}
                  onChange={(e) => setAdjProductId(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (বর্তমান স্টক: {p.currentStock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  {isBn ? 'সমন্বয়কৃত পরিমাণ (কমাতে -২, বাড়াতে +২ দিন) *' : 'Adjustment Qty (+ or -) *'}
                </label>
                <input
                  type="number"
                  required
                  value={adjQty}
                  onChange={(e) => setAdjQty(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. -2 বা 5"
                  className="w-full p-2 border border-slate-200 rounded-lg font-mono-num"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">{isBn ? 'সমন্বয়ের কারণ *' : 'Reason *'}</label>
                <select
                  aria-label={isBn ? 'সমন্বয়ের কারণ' : 'Reason'}
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value as any)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white capitalize"
                >
                  <option value="damaged">{isBn ? 'নষ্ট / ড্যামেজ প্রোডাক্ট (Damaged)' : 'Damaged'}</option>
                  <option value="expired">{isBn ? 'মেয়াদোত্তীর্ণ (Expired)' : 'Expired'}</option>
                  <option value="lost">{isBn ? 'হারিয়ে গেছে (Lost)' : 'Lost'}</option>
                  <option value="inventory_correction">{isBn ? 'গণনায় ভুল / হিসেব মেলানো' : 'Inventory Correction'}</option>
                  <option value="sample">{isBn ? 'স্যাম্পল বিতরণ' : 'Sample'}</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">{isBn ? 'নোট / মন্তব্য' : 'Note'}</label>
                <input
                  type="text"
                  value={adjNote}
                  onChange={(e) => setAdjNote(e.target.value)}
                  placeholder="বিস্তারিত কারণ লিখুন"
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowAdjustmentModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
              >
                {isBn ? 'সমন্বয় সম্পন্ন করুন' : 'Confirm Adjustment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stock Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form
            onSubmit={handleTransferSubmit}
            className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <GitFork className="w-4 h-4 text-emerald-600" />
                <span>{isBn ? 'ব্রাঞ্চ স্টক ট্রান্সফার' : 'Branch Stock Transfer'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">{isBn ? 'পণ্য নির্বাচন *' : 'Product *'}</label>
                <select
                  aria-label={isBn ? 'পণ্য নির্বাচন' : 'Product'}
                  value={tfProductId}
                  onChange={(e) => setTfProductId(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (মজুদ: {p.currentStock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">{isBn ? 'প্রেরক শাখা' : 'From Branch'}</label>
                  <select
                    aria-label={isBn ? 'প্রেরক শাখা' : 'From Branch'}
                    value={fromBranch}
                    onChange={(e) => setFromBranch(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">{isBn ? 'প্রাপক শাখা' : 'To Branch'}</label>
                  <select
                    aria-label={isBn ? 'প্রাপক শাখা' : 'To Branch'}
                    value={toBranch}
                    onChange={(e) => setToBranch(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">{isBn ? 'স্থানান্তরের পরিমাণ *' : 'Transfer Qty *'}</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={tfQty}
                  onChange={(e) => setTfQty(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 10"
                  className="w-full p-2 border border-slate-200 rounded-lg font-mono-num"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">{isBn ? 'নোট' : 'Note'}</label>
                <input
                  type="text"
                  value={tfNote}
                  onChange={(e) => setTfNote(e.target.value)}
                  placeholder="শাখা চাহিদামাফিক স্টক পাঠানো হলো"
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
              >
                {isBn ? 'ট্রান্সফার নিশ্চিত করুন' : 'Confirm Transfer'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
