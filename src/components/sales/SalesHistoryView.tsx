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
} from 'lucide-react';

export const SalesHistoryView: React.FC = () => {
  const { sales, recordSaleReturn, settings } = useApp();
  const isBn = settings.language === 'bn';
  const lang = settings.language;

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'due' | 'partial' | 'returned'>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Sale | null>(null);

  // Sales Return Modal State
  const [returnSale, setReturnSale] = useState<Sale | null>(null);
  const [returnItemIdx, setReturnItemIdx] = useState<number>(0);
  const [returnQty, setReturnQty] = useState<number>(1);
  const [returnReason, setReturnReason] = useState('পণ্য পরিবর্তন / ডিফেক্টিভ');
  const [refundType, setRefundType] = useState<'cash' | 'adjust_due'>('cash');

  const filteredSales = sales.filter(s => {
    const matchSearch =
      s.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.customerMobile && s.customerMobile.includes(searchQuery));

    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

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
      alert(isBn ? 'ইনভয়েসের বিক্রিত পরিমাণের চেয়ে বেশি ফেরত নেওয়া যাবে না!' : 'Cannot return more than purchased qty!');
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            <span>{isBn ? 'বিক্রির খাতা ও ইনভয়েস হিস্ট্রি' : 'Sales Records & Invoices'}</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            {isBn ? `মোট ${toBnNumber(sales.length)} টি বিক্রয় চালান লিপিবদ্ধ আছে` : `${sales.length} total sales invoices recorded`}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex flex-col sm:flex-row items-center gap-2 text-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isBn ? 'ইনভয়েস নম্বর বা কাস্টমার দিয়ে খুঁজুন...' : 'Search invoice # or customer...'}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/50"
          />
        </div>

        <select
          aria-label={isBn ? 'স্ট্যাটাস অনুযায়ী ফিল্টার' : 'Filter by status'}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="w-full sm:w-auto py-1.5 px-3 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-slate-700"
        >
          <option value="all">{isBn ? 'সকল স্ট্যাটাস' : 'All Status'}</option>
          <option value="paid">{isBn ? 'পরিশোধিত (Paid)' : 'Paid'}</option>
          <option value="partial">{isBn ? 'আংশিক বাকি (Partial)' : 'Partial'}</option>
          <option value="due">{isBn ? 'সম্পূর্ণ বাকি (Due)' : 'Full Due'}</option>
          <option value="returned">{isBn ? 'ফেরতকৃত (Returned)' : 'Returned'}</option>
        </select>
      </div>

      {/* Sales Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">{isBn ? 'ইনভয়েস নং' : 'Invoice #'}</th>
                <th className="px-4 py-3 font-semibold">{isBn ? 'তারিখ' : 'Date'}</th>
                <th className="px-4 py-3 font-semibold">{isBn ? 'কাস্টমার' : 'Customer'}</th>
                <th className="px-4 py-3 font-semibold text-right">{isBn ? 'মোট বিল' : 'Total'}</th>
                <th className="px-4 py-3 font-semibold text-right">{isBn ? 'পরিশোধ' : 'Paid'}</th>
                <th className="px-4 py-3 font-semibold text-right">{isBn ? 'বকেয়া' : 'Due'}</th>
                <th className="px-4 py-3 font-semibold">{isBn ? 'পেমেন্ট' : 'Method'}</th>
                <th className="px-4 py-3 font-semibold">{isBn ? 'অবস্থা' : 'Status'}</th>
                <th className="px-4 py-3 font-semibold text-right">{isBn ? 'অ্যাকশন' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.map(sale => (
                <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">
                    {sale.invoiceNumber}
                  </td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    {formatDate(sale.date, lang)}
                  </td>
                  <td className="px-4 py-3 text-slate-800">
                    <span className="font-semibold block">{sale.customerName}</span>
                    {sale.customerMobile && <span className="text-[10px] text-slate-500 font-mono">{sale.customerMobile}</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-mono-num font-bold text-slate-900">
                    {formatCurrency(sale.total, lang)}
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
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {sale.status === 'paid'
                        ? (isBn ? 'পরিশোধিত' : 'Paid')
                        : sale.status === 'due'
                        ? (isBn ? 'বকেয়া' : 'Due')
                        : sale.status === 'partial'
                        ? (isBn ? 'আংশিক' : 'Partial')
                        : (isBn ? 'ফেরতকৃত' : 'Returned')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedInvoice(sale)}
                        className="flex items-center gap-1 px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded font-medium transition-colors"
                        title={isBn ? 'চালান দেখুন' : 'View Invoice'}
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>{isBn ? 'ইনভয়েস' : 'View'}</span>
                      </button>
                      {sale.status !== 'returned' && (
                        <button
                          onClick={() => handleOpenReturnModal(sale)}
                          className="p-1 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded transition-colors"
                          title={isBn ? 'পণ্য ফেরত (Sales Return)' : 'Sales Return'}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    {isBn ? 'কোনো বিক্রয় রেকর্ড পাওয়া যায়নি।' : 'No sales records found.'}
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

      {/* Sales Return Modal */}
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
                  <span>{isBn ? 'পণ্য ফেরত (Sales Return)' : 'Sales Return'}</span>
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
                  {isBn ? 'ফেরতযোগ্য পণ্য নির্বাচন *' : 'Select Item *'}
                </label>
                <select
                  aria-label={isBn ? 'ফেরতযোগ্য পণ্য নির্বাচন' : 'Select Item'}
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
                  {isBn ? 'ফেরতের পরিমাণ (Quantity) *' : 'Return Quantity *'}
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
                  {isBn ? 'ফেরতের ধরন (Refund Mode) *' : 'Refund Type *'}
                </label>
                <select
                  aria-label={isBn ? 'ফেরতের ধরন' : 'Refund Type'}
                  value={refundType}
                  onChange={(e) => setRefundType(e.target.value as any)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="cash">{isBn ? 'ক্যাশ ফেরত প্রদান (Cash Refund)' : 'Cash Refund'}</option>
                  <option value="adjust_due">{isBn ? 'কাস্টমারের বকেয়া থেকে কর্তন (Adjust Due)' : 'Adjust Customer Due'}</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  {isBn ? 'ফেরতের কারণ' : 'Reason'}
                </label>
                <input
                  type="text"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="সাইজ পরিবর্তন বা সমস্যা"
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px]">
                {isBn
                  ? 'পণ্য ফেরত সম্পন্ন হলে স্টক স্বয়ংক্রিয়ভাবে বৃদ্ধি পাবে এবং হিসাব সমন্বয় হবে।'
                  : 'Confirming return will restore product stock and update cash/due accounts.'}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setReturnSale(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg"
              >
                {isBn ? 'ফেরত নিশ্চিত করুন' : 'Confirm Return'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
