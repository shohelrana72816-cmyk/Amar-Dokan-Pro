import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sale } from '../../types';
import { formatCurrency, formatDate, toBnNumber } from '../../utils/formatters';
import { InvoiceModal } from '../pos/InvoiceModal';
import {
  Receipt,
  Search,
  RotateCcw,
  Printer,
  X,
  FileText,
  Undo2,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  History,
  ShieldCheck,
  Trash2,
} from 'lucide-react';

export const SalesHistoryView: React.FC = () => {
  const { sales, recordSaleReturn, quickRefundSale, voidSale, deleteSale, isAdmin, auditLogs, settings } = useApp();
  const isBn = false;
  const lang = settings.language;

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'due' | 'partial' | 'returned' | 'voided'>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Sale | null>(null);

  // Delete Invoice Modal State
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
  const [isDeletingSale, setIsDeletingSale] = useState(false);

  // Toggle to show/hide voided and returned transactions
  const [showVoided, setShowVoided] = useState<boolean>(true);

  // Quick Refund Modal State
  const [quickRefundTarget, setQuickRefundTarget] = useState<Sale | null>(null);
  const [quickRefundReason, setQuickRefundReason] = useState('Full Customer Refund');
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);

  // Partial Sales Return Modal State
  const [returnSale, setReturnSale] = useState<Sale | null>(null);
  const [returnItemIdx, setReturnItemIdx] = useState<number>(0);
  const [returnQty, setReturnQty] = useState<number>(1);
  const [returnReason, setReturnReason] = useState('Product Exchange / Defective');
  const [refundType, setRefundType] = useState<'cash' | 'adjust_due'>('cash');

  // Audit Logs Modal
  const [showAuditLogsModal, setShowAuditLogsModal] = useState(false);

  // Count voided / returned
  const voidedCount = sales.filter(s => s.status === 'returned' || s.status === 'voided').length;

  const filteredSales = sales.filter(s => {
    // If showVoided is false, hide returned & voided transactions
    if (!showVoided && (s.status === 'returned' || s.status === 'voided')) {
      return false;
    }

    const matchSearch =
      s.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.customerMobile && s.customerMobile.includes(searchQuery));

    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleOpenQuickRefund = (sale: Sale) => {
    setQuickRefundTarget(sale);
    setQuickRefundReason('Customer returned items and requested full refund');
  };

  const handleConfirmQuickRefund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickRefundTarget || isProcessingRefund) return;

    setIsProcessingRefund(true);
    try {
      const success = quickRefundSale(quickRefundTarget.id, quickRefundReason);
      if (success) {
        setQuickRefundTarget(null);
      } else {
        alert('Could not complete refund. Already returned or voided.');
      }
    } finally {
      setIsProcessingRefund(false);
    }
  };

  const handleOpenReturnModal = (sale: Sale) => {
    setReturnSale(sale);
    setReturnItemIdx(0);
    setReturnQty(1);
    setRefundType(sale.due > 0 ? 'adjust_due' : 'cash');
  };

  const handleSubmitReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnSale || returnQty <= 0) return;

    const item = returnSale.items[returnItemIdx];
    if (returnQty > item.quantity) {
      alert('Cannot return more than purchased qty!');
      return;
    }

    recordSaleReturn(
      returnSale.id,
      [
        {
          productId: item.productId,
          quantity: Number(returnQty),
          unitPrice: item.unitPrice,
          reason: returnReason,
        },
      ],
      refundType
    );

    setReturnSale(null);
  };

  // Recent sales audit logs
  const salesAuditLogs = auditLogs.filter(l => l.entityType === 'sale');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            <span>{'Sales Records & Invoices'}</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            {`${sales.length} total sales invoices recorded · Quick Refund restores stock & accounts instantly`}
          </p>
        </div>

        {/* Audit Logs button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAuditLogsModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
          >
            <History className="w-4 h-4 text-slate-600" />
            <span>{'Audit Logs'} ({toBnNumber(salesAuditLogs.length)})</span>
          </button>
        </div>
      </div>

      {/* Filter Bar with Voided Transactions Toggle */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto flex-1">
          {/* Search */}
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={'Search invoice # or customer...'}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/50"
            />
          </div>

          {/* Status Filter */}
          <select
            aria-label={'Filter by status'}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full sm:w-auto py-1.5 px-3 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-slate-700"
          >
            <option value="all">{'All Status'}</option>
            <option value="paid">{'Paid'}</option>
            <option value="partial">{'Partial'}</option>
            <option value="due">{'Full Due'}</option>
            <option value="returned">{'Returned'}</option>
            <option value="voided">{'Voided'}</option>
          </select>
        </div>

        {/* Toggle to show/hide voided/returned transactions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0">
          <button
            type="button"
            onClick={() => setShowVoided(prev => !prev)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-medium transition-all ${
              showVoided
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
            }`}
            title={'Show or hide voided/refunded transactions'}
          >
            {showVoided ? (
              <Eye className="w-4 h-4 text-emerald-600" />
            ) : (
              <EyeOff className="w-4 h-4 text-slate-500" />
            )}
            <span>
              {showVoided ? 'Showing Voided & Returned' : 'Hiding Voided & Returned'}
            </span>
            {voidedCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${showVoided ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-300 text-slate-700'}`}>
                {toBnNumber(voidedCount)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Sales Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">{'Invoice #'}</th>
                <th className="px-4 py-3 font-semibold">{'Date'}</th>
                <th className="px-4 py-3 font-semibold">{'Customer'}</th>
                <th className="px-4 py-3 font-semibold text-right">{'Total'}</th>
                <th className="px-4 py-3 font-semibold text-right">{'Paid'}</th>
                <th className="px-4 py-3 font-semibold text-right">{'Due'}</th>
                <th className="px-4 py-3 font-semibold">{'Method'}</th>
                <th className="px-4 py-3 font-semibold">{'Status'}</th>
                <th className="px-4 py-3 font-semibold text-right">{'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.map(sale => {
                const isReturnedOrVoid = sale.status === 'returned' || sale.status === 'voided';

                return (
                  <tr
                    key={sale.id}
                    className={`transition-colors ${
                      isReturnedOrVoid
                        ? 'bg-rose-50/40 opacity-80 hover:bg-rose-50/60'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <span className={isReturnedOrVoid ? 'line-through text-slate-500' : ''}>
                          {sale.invoiceNumber}
                        </span>
                        {isReturnedOrVoid && (
                          <span className="text-[10px] bg-rose-100 text-rose-800 font-semibold px-1 rounded">
                            {sale.status === 'voided' ? ('Void') : ('Refund')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {formatDate(sale.date, lang)}
                    </td>
                    <td className="px-4 py-3 text-slate-800">
                      <span className="font-semibold block">{sale.customerName}</span>
                      {sale.customerMobile && (
                        <span className="text-[10px] text-slate-500 font-mono">{sale.customerMobile}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono-num font-bold text-slate-900">
                      <span className={isReturnedOrVoid ? 'line-through text-slate-400' : ''}>
                        {formatCurrency(sale.total, lang)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono-num text-emerald-700 font-semibold">
                      {formatCurrency(sale.paid, lang)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono-num font-bold">
                      <span className={sale.due > 0 ? 'text-rose-700' : 'text-slate-400'}>
                        {sale.due > 0 ? formatCurrency(sale.due, lang) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-700">
                      {sale.paymentMethod}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                          sale.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700'
                            : sale.status === 'due'
                            ? 'bg-rose-50 text-rose-700'
                            : sale.status === 'partial'
                            ? 'bg-amber-50 text-amber-700'
                            : sale.status === 'voided'
                            ? 'bg-slate-200 text-slate-700 line-through'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {sale.status === 'paid'
                          ? ('Paid')
                          : sale.status === 'due'
                          ? ('Due')
                          : sale.status === 'partial'
                          ? ('Partial')
                          : sale.status === 'voided'
                          ? ('Voided')
                          : ('Returned')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Invoice */}
                        <button
                          onClick={() => setSelectedInvoice(sale)}
                          className="flex items-center gap-1 px-2 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded font-medium transition-colors"
                          title={'View Invoice'}
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>{'View'}</span>
                        </button>

                        {/* Quick Refund Button */}
                        {!isReturnedOrVoid && (
                          <button
                            onClick={() => handleOpenQuickRefund(sale)}
                            className="flex items-center gap-1 px-2 py-1 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded font-semibold transition-colors"
                            title={'Quick Refund Transaction'}
                          >
                            <Undo2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>{'Refund'}</span>
                          </button>
                        )}

                        {/* Partial Return Button */}
                        {!isReturnedOrVoid && (
                          <button
                            onClick={() => handleOpenReturnModal(sale)}
                            className="p-1 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded transition-colors"
                            title={'Item Return'}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Admin-only Delete Button */}
                        {isAdmin && (
                          <button
                            onClick={() => setSaleToDelete(sale)}
                            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                            title={'Delete Invoice (Admin Only)'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    {'No sales records found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Modal */}
      {selectedInvoice && (
        <InvoiceModal
          sale={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          settings={settings}
        />
      )}

      {/* Quick Refund Confirmation Modal */}
      {quickRefundTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form
            onSubmit={handleConfirmQuickRefund}
            className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                  <Undo2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {'Quick Refund Confirmation'}
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {quickRefundTarget.invoiceNumber} · {quickRefundTarget.customerName}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickRefundTarget(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Refund Overview Breakdown */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 text-xs">
              <div className="flex justify-between text-slate-700">
                <span>{'Sale Total'}:</span>
                <span className="font-bold font-mono-num">{formatCurrency(quickRefundTarget.total, lang)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>{'Cash/Bank to Refund'}:</span>
                <span className="font-bold font-mono-num">{formatCurrency(quickRefundTarget.paid, lang)}</span>
              </div>
              {quickRefundTarget.due > 0 && (
                <div className="flex justify-between text-rose-700 font-medium">
                  <span>{'Customer Due Adjusted'}:</span>
                  <span className="font-bold font-mono-num">-{formatCurrency(quickRefundTarget.due, lang)}</span>
                </div>
              )}
              <div className="border-t pt-2 text-[11px] text-slate-600">
                <span className="font-semibold block mb-1">{'Items to Restock:'}</span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                  {quickRefundTarget.items.map((it, idx) => (
                    <li key={idx}>
                      {it.productName} — <strong className="font-mono-num">{toBnNumber(it.quantity)}</strong> pcs
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="block font-medium text-slate-700">
                {'Refund Reason *'}
              </label>
              <input
                type="text"
                required
                value={quickRefundReason}
                onChange={(e) => setQuickRefundReason(e.target.value)}
                placeholder="Enter reason for refund..."
                className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>
                {'This action will instantly restore product stocks, adjust account balances, and update the audit log.'}
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                disabled={isProcessingRefund}
                onClick={() => setQuickRefundTarget(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                {'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isProcessingRefund}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>{isProcessingRefund ? ('Processing...') : ('Confirm Quick Refund')}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Partial Sales Return Modal */}
      {returnSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form
            onSubmit={handleSubmitReturn}
            className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-amber-600" />
                  <span>{'Item Return'}</span>
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">
                  {returnSale.invoiceNumber} · {returnSale.customerName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setReturnSale(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  {'Select Item *'}
                </label>
                <select
                  aria-label={'Select Item'}
                  value={returnItemIdx}
                  onChange={(e) => setReturnItemIdx(Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                >
                  {returnSale.items.map((item, idx) => (
                    <option key={idx} value={idx}>
                      {item.productName} ({item.quantity} pcs @ ৳{item.unitPrice})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  {'Return Quantity *'}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={returnSale.items[returnItemIdx]?.quantity || 1}
                  value={returnQty}
                  onChange={(e) => setReturnQty(Number(e.target.value) || 1)}
                  className="w-full p-2 border border-slate-200 rounded-lg font-mono-num"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  {'Refund Type *'}
                </label>
                <select
                  aria-label={'Refund Type'}
                  value={refundType}
                  onChange={(e) => setRefundType(e.target.value as any)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="cash">{'Cash Refund'}</option>
                  <option value="adjust_due">{'Adjust Customer Due'}</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  {'Reason'}
                </label>
                <input
                  type="text"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="e.g. Size change or defective item"
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px]">
                {'Confirming return will restore product stock, update accounts, and log in audit trail.'}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setReturnSale(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                {'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg"
              >
                {'Confirm Return'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Audit Logs Modal */}
      {showAuditLogsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl p-5 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  {'Sales & Refund Audit Logs'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAuditLogsModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {salesAuditLogs.map(log => (
                <div key={log.id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 text-xs flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.action.includes('REFUND') || log.action.includes('VOID')
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {log.action}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {formatDate(log.date, lang)}
                      </span>
                    </div>
                    <p className="text-slate-800 font-medium">{log.details}</p>
                  </div>
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono uppercase">
                    {log.userRole}
                  </span>
                </div>
              ))}

              {salesAuditLogs.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs">
                  {'No sales audit logs recorded yet.'}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowAuditLogsModal(false)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                {'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Invoice Confirmation Modal */}
      {saleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-rose-200 w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {'Delete Invoice?'}
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {saleToDelete.invoiceNumber} · {saleToDelete.customerName}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSaleToDelete(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-700">
              <p className="font-medium text-slate-800">
                {'Are you sure you want to delete this invoice? This action may affect stock, customer due, payments and reports.'}
              </p>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1 text-rose-900 text-[11px]">
                <div className="flex justify-between font-semibold">
                  <span>{'Total Amount'}:</span>
                  <span className="font-mono-num">{formatCurrency(saleToDelete.total, lang)}</span>
                </div>
                <div className="flex justify-between text-emerald-800">
                  <span>{'Paid amount to reverse'}:</span>
                  <span className="font-mono-num">{formatCurrency(saleToDelete.paid, lang)}</span>
                </div>
                {saleToDelete.due > 0 && (
                  <div className="flex justify-between text-rose-800">
                    <span>{'Due to reverse'}:</span>
                    <span className="font-mono-num">{formatCurrency(saleToDelete.due, lang)}</span>
                  </div>
                )}
                <p className="pt-1 text-rose-700 text-[10px]">
                  {'⚠ Sold items will be restocked to inventory and account balances reversed.'}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                disabled={isDeletingSale}
                onClick={() => setSaleToDelete(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                {'Cancel'}
              </button>
              <button
                type="button"
                disabled={isDeletingSale}
                onClick={() => {
                  setIsDeletingSale(true);
                  try {
                    deleteSale(saleToDelete.id);
                    setSaleToDelete(null);
                  } finally {
                    setIsDeletingSale(false);
                  }
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingSale ? ('Deleting...') : ('Delete Invoice')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
