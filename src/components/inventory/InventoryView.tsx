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
  const isBn = false;
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
  const activeProducts = products.filter(p => p.isActive !== false);
  const totalStockUnits = activeProducts.reduce((sum, p) => sum + p.currentStock, 0);
  const totalCostValuation = activeProducts.reduce((sum, p) => sum + (p.currentStock * p.purchasePrice), 0);
  const totalRetailValuation = activeProducts.reduce((sum, p) => sum + (p.currentStock * p.salePrice), 0);
  const potentialProfit = totalRetailValuation - totalCostValuation;

  const lowStockItems = activeProducts.filter(p => p.currentStock > 0 && p.currentStock <= p.minStockAlert);
  const outOfStockItems = activeProducts.filter(p => p.currentStock <= 0);

  const displayedProducts = activeProducts.filter(p => {
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
      alert('Invalid branch or quantity selected!');
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
          <span className="text-xs text-slate-500 block">{'Total Stock Units'}</span>
          <span className="text-xl md:text-2xl font-bold font-mono-num text-slate-900 mt-1 block">
            {toBnNumber(totalStockUnits)}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {toBnNumber(products.length)} {'unique products'}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs text-slate-500 block">{'Total Cost Value'}</span>
          <span className="text-xl md:text-2xl font-bold font-mono-num text-slate-900 mt-1 block">
            {formatCurrency(totalCostValuation, lang)}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {'Invested inventory capital'}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs text-slate-500 block">{'Total Retail Value'}</span>
          <span className="text-xl md:text-2xl font-bold font-mono-num text-emerald-700 mt-1 block">
            {formatCurrency(totalRetailValuation, lang)}
          </span>
          <span className="text-[11px] text-emerald-600 mt-0.5 block">
            {'Potential sales turnover'}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs text-slate-500 block">{'Potential Margin'}</span>
          <span className="text-xl md:text-2xl font-bold font-mono-num text-emerald-600 mt-1 block">
            {formatCurrency(potentialProfit, lang)}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {'Gross expected margin'}
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
              {'Inventory Table'}
            </button>
            <button
              onClick={() => setActiveTab('movements')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'movements' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              {'Stock Movements'}
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
                {'All'}
              </button>
              <button
                onClick={() => setFilterType('low')}
                className={`px-2.5 py-1 rounded-md border flex items-center gap-1 ${
                  filterType === 'low' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-amber-700 border-amber-200'
                }`}
              >
                <span>{'Low Stock'}</span>
                <span className="font-bold">({toBnNumber(lowStockItems.length)})</span>
              </button>
              <button
                onClick={() => setFilterType('out')}
                className={`px-2.5 py-1 rounded-md border flex items-center gap-1 ${
                  filterType === 'out' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-rose-700 border-rose-200'
                }`}
              >
                <span>{'Out'}</span>
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
            <span>{'Stock Adjust'}</span>
          </button>
          <button
            onClick={() => setShowTransferModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 font-semibold transition-colors"
          >
            <GitFork className="w-3.5 h-3.5 text-slate-600" />
            <span>{'Branch Transfer'}</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>{'Export'}</span>
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
                  <th className="px-4 py-3 font-semibold">{'Product'}</th>
                  <th className="px-4 py-3 font-semibold">{'Code'}</th>
                  <th className="px-4 py-3 font-semibold text-center">{'Current Stock'}</th>
                  <th className="px-4 py-3 font-semibold text-center">{'Min Alert'}</th>
                  <th className="px-4 py-3 font-semibold text-right">{'Cost'}</th>
                  <th className="px-4 py-3 font-semibold text-right">{'Cost Valuation'}</th>
                  <th className="px-4 py-3 font-semibold">{'Status'}</th>
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
                          {isOut ? ('Out of Stock') : isLow ? ('Low Stock') : ('Normal')}
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
                  <th className="px-4 py-3 font-semibold">{'Date'}</th>
                  <th className="px-4 py-3 font-semibold">{'Product'}</th>
                  <th className="px-4 py-3 font-semibold">{'Type'}</th>
                  <th className="px-4 py-3 font-semibold text-center">{'Quantity'}</th>
                  <th className="px-4 py-3 font-semibold text-center">{'Balance'}</th>
                  <th className="px-4 py-3 font-semibold">{'Reference & Note'}</th>
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
                <span>{'Stock Adjustment'}</span>
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
                <label className="block font-medium text-slate-700 mb-1">{'Select Product *'}</label>
                <select
                  aria-label={'Select Product'}
                  value={adjProductId}
                  onChange={(e) => setAdjProductId(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Current Stock: {p.currentStock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  {'Adjustment Qty (+ or -) *'}
                </label>
                <input
                  type="number"
                  required
                  value={adjQty}
                  onChange={(e) => setAdjQty(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. -2 or 5"
                  className="w-full p-2 border border-slate-200 rounded-lg font-mono-num"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">{'Reason *'}</label>
                <select
                  aria-label={'Reason'}
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value as any)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white capitalize"
                >
                  <option value="damaged">{'Damaged'}</option>
                  <option value="expired">{'Expired'}</option>
                  <option value="lost">{'Lost'}</option>
                  <option value="inventory_correction">{'Inventory Correction'}</option>
                  <option value="sample">{'Sample'}</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">{'Note'}</label>
                <input
                  type="text"
                  value={adjNote}
                  onChange={(e) => setAdjNote(e.target.value)}
                  placeholder="Enter reason in detail"
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
                {'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
              >
                {'Confirm Adjustment'}
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
                <span>{'Branch Stock Transfer'}</span>
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
                <label className="block font-medium text-slate-700 mb-1">{'Product *'}</label>
                <select
                  aria-label={'Product'}
                  value={tfProductId}
                  onChange={(e) => setTfProductId(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stock: {p.currentStock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">{'From Branch'}</label>
                  <select
                    aria-label={'From Branch'}
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
                  <label className="block font-medium text-slate-700 mb-1">{'To Branch'}</label>
                  <select
                    aria-label={'To Branch'}
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
                <label className="block font-medium text-slate-700 mb-1">{'Transfer Qty *'}</label>
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
                <label className="block font-medium text-slate-700 mb-1">{'Note'}</label>
                <input
                  type="text"
                  value={tfNote}
                  onChange={(e) => setTfNote(e.target.value)}
                  placeholder="Stock transfer per branch request"
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
                {'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
              >
                {'Confirm Transfer'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
