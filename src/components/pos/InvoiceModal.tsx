import React, { useState } from 'react';
import { Sale, ShopSettings } from '../../types';
import { formatCurrency, formatDate, formatTime, toBnNumber } from '../../utils/formatters';
import { Printer, Share2, X, FileText, CheckCircle2, MessageSquare, Download } from 'lucide-react';

interface InvoiceModalProps {
  sale: Sale | null;
  onClose: () => void;
  settings: ShopSettings;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ sale, onClose, settings }) => {
  const [format, setFormat] = useState<'thermal' | 'a4'>(settings.invoiceFormat || 'thermal');
  const [copied, setCopied] = useState(false);

  if (!sale) return null;

  const isBn = false;
  const lang = settings.language;

  const handlePrint = () => {
    window.print();
  };

  const generateWhatsAppMessage = () => {
    const itemsText = sale.items
      .map((item, idx) => `${idx + 1}. ${item.productName}${item.variantDetails ? ` (${item.variantDetails})` : ''} - ${item.quantity} x ৳${item.unitPrice} = ৳${item.total}`)
      .join('%0A');

    const message = `*${encodeURIComponent(settings.shopName)}*%0A` +
      `Invoice No: ${sale.invoiceNumber}%0A` +
      `Date: ${formatDate(sale.date, 'en')}%0A` +
      `Customer: ${encodeURIComponent(sale.customerName)}%0A` +
      `--------------------------------%0A` +
      `*Items:*%0A${itemsText}%0A` +
      `--------------------------------%0A` +
      `Total: ৳${sale.total}%0A` +
      `Paid: ৳${sale.paid}%0A` +
      `Due: ৳${sale.due}%0A%0A` +
      `Thank you for shopping with us!`;

    const mobileClean = sale.customerMobile?.replace(/[^0-9]/g, '') || '';
    const phoneParam = mobileClean ? `phone=${mobileClean}&` : '';
    window.open(`https://api.whatsapp.com/send?${phoneParam}text=${message}`, '_blank');
  };

  const handleCopySummary = () => {
    const text = `${settings.shopName} | Invoice: ${sale.invoiceNumber}\nTotal: ৳${sale.total} | Paid: ৳${sale.paid} | Due: ৳${sale.due}\nThank you for shopping with us!`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden my-auto border border-slate-200">
        {/* Header with format switcher & close */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">
              {'Sale Completed (Invoice)'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Format Toggle */}
            <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs font-medium">
              <button
                onClick={() => setFormat('thermal')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  format === 'thermal' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                {'Thermal (80mm)'}
              </button>
              <button
                onClick={() => setFormat('a4')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  format === 'a4' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                {'A4 Invoice'}
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-6 max-h-[70vh] overflow-y-auto bg-slate-100/50 flex justify-center">
          {format === 'thermal' ? (
            /* Thermal POS Receipt Format (80mm standard) */
            <div
              id="printable-receipt"
              className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 w-full max-w-[340px] text-slate-900 text-xs font-mono"
            >
              {/* Shop Info */}
              <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
                <h2 className="text-sm font-bold tracking-tight text-slate-900 font-sans">
                  {settings.shopName}
                </h2>
                <p className="text-[10px] text-slate-600">{settings.tagline}</p>
                <p className="text-[10px] text-slate-600">{settings.address}</p>
                <p className="text-[10px] text-slate-600 font-sans">Mobile: {settings.mobile}</p>
              </div>

              {/* Invoice Meta */}
              <div className="py-2 border-b border-dashed border-slate-300 text-[11px] space-y-0.5">
                <div className="flex justify-between">
                  <span>Invoice No:</span>
                  <span className="font-bold">{sale.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date & Time:</span>
                  <span>{formatDate(sale.date, 'en')} {formatTime(sale.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span className="font-medium truncate max-w-[170px]">{sale.customerName}</span>
                </div>
                {sale.customerMobile && (
                  <div className="flex justify-between">
                    <span>Phone:</span>
                    <span>{sale.customerMobile}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Served By:</span>
                  <span>{sale.servedBy}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="py-2 border-b border-dashed border-slate-300">
                <div className="flex justify-between font-bold text-[11px] pb-1">
                  <span>Item & Qty</span>
                  <span>Amount</span>
                </div>
                <div className="space-y-1.5 pt-1">
                  {sale.items.map((item, idx) => (
                    <div key={idx} className="text-[11px]">
                      <div className="font-sans font-medium text-slate-800 leading-tight">
                        {item.productName}
                      </div>
                      <div className="flex justify-between text-slate-600 text-[10px] pt-0.5">
                        <span>
                          {item.variantDetails && `${item.variantDetails} · `}
                          {item.quantity} x {formatCurrency(item.unitPrice, 'en')}
                          {item.discount > 0 && ` (-৳${item.discount})`}
                        </span>
                        <span className="font-semibold text-slate-900 font-mono-num">
                          {formatCurrency(item.total, 'en')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bill Calculation */}
              <div className="py-2 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono-num">{formatCurrency(sale.subtotal, 'en')}</span>
                </div>
                {sale.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span className="font-mono-num">-{formatCurrency(sale.discount, 'en')}</span>
                  </div>
                )}
                {sale.vatTaxAmount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>VAT/Tax ({sale.vatTaxRate}%):</span>
                    <span className="font-mono-num">+{formatCurrency(sale.vatTaxAmount, 'en')}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-bold text-slate-900 pt-1 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span className="font-mono-num">{formatCurrency(sale.total, 'en')}</span>
                </div>
                <div className="flex justify-between text-slate-800 pt-0.5">
                  <span>Paid ({sale.paymentMethod}):</span>
                  <span className="font-mono-num font-semibold">{formatCurrency(sale.paid, 'en')}</span>
                </div>
                {sale.due > 0 && (
                  <div className="flex justify-between text-rose-700 font-bold">
                    <span>Due:</span>
                    <span className="font-mono-num">{formatCurrency(sale.due, 'en')}</span>
                  </div>
                )}
              </div>

              {/* Barcode & Footer */}
              <div className="pt-3 text-center space-y-1.5">
                {/* Barcode simulation */}
                <div className="flex justify-center items-center py-1">
                  <div className="font-mono tracking-widest text-base font-bold bg-slate-100 px-3 py-1 rounded border border-slate-300">
                    |||| | | ||||| || | ||| {sale.invoiceNumber.slice(-5)}
                  </div>
                </div>
                <p className="text-[10px] text-slate-600 font-sans font-medium">
                  Thank you for shopping with us!
                </p>
                <p className="text-[9px] text-slate-400 font-sans">
                  Software Partner: Amar Dokan Pro
                </p>
              </div>
            </div>
          ) : (
            /* Standard A4 Corporate Invoice */
            <div
              id="printable-receipt"
              className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 w-full max-w-xl text-slate-900 text-xs"
            >
              {/* Header */}
              <div className="flex justify-between items-start pb-6 border-b border-slate-200">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">{settings.shopName}</h1>
                  <p className="text-xs text-slate-500 mt-1">{settings.tagline}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{settings.address}</p>
                  <p className="text-xs text-slate-500">Phone: {settings.mobile} | Email: {settings.email}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                    INVOICE
                  </span>
                  <p className="text-xs font-mono font-bold text-slate-900 mt-2">{sale.invoiceNumber}</p>
                  <p className="text-[11px] text-slate-500">{formatDate(sale.date, 'en')}</p>
                </div>
              </div>

              {/* Bill To */}
              <div className="py-4 border-b border-slate-200 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    BILL TO (CUSTOMER)
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-1">{sale.customerName}</p>
                  {sale.customerMobile && <p className="text-xs text-slate-600">Mobile: {sale.customerMobile}</p>}
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Payment Status
                  </span>
                  <p className="text-sm font-semibold capitalize mt-1 text-slate-800">
                    {sale.paymentMethod} ({sale.status === 'paid' ? 'Paid' : sale.status === 'due' ? 'Due' : 'Partial'})
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div className="py-4">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 text-[11px]">
                      <th className="pb-2">SL</th>
                      <th className="pb-2">Product Description</th>
                      <th className="pb-2 text-center">Qty</th>
                      <th className="pb-2 text-right">Unit Price</th>
                      <th className="pb-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sale.items.map((item, idx) => (
                      <tr key={idx} className="text-slate-800">
                        <td className="py-2 text-slate-400">{idx + 1}</td>
                        <td className="py-2">
                          <span className="font-semibold block">{item.productName}</span>
                          {item.variantDetails && (
                            <span className="text-[10px] text-slate-500">Variant: {item.variantDetails}</span>
                          )}
                        </td>
                        <td className="py-2 text-center font-mono-num">{item.quantity}</td>
                        <td className="py-2 text-right font-mono-num">{formatCurrency(item.unitPrice, lang)}</td>
                        <td className="py-2 text-right font-mono-num font-semibold">{formatCurrency(item.total, lang)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Summary */}
              <div className="pt-3 border-t border-slate-200 flex justify-end">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono-num">{formatCurrency(sale.subtotal, lang)}</span>
                  </div>
                  {sale.discount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount:</span>
                      <span className="font-mono-num">-{formatCurrency(sale.discount, lang)}</span>
                    </div>
                  )}
                  {sale.vatTaxAmount > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>VAT/Tax ({sale.vatTaxRate}%):</span>
                      <span className="font-mono-num">+{formatCurrency(sale.vatTaxAmount, lang)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
                    <span>Total:</span>
                    <span className="font-mono-num">{formatCurrency(sale.total, lang)}</span>
                  </div>
                  <div className="flex justify-between text-slate-800 font-medium">
                    <span>Paid:</span>
                    <span className="font-mono-num">{formatCurrency(sale.paid, lang)}</span>
                  </div>
                  {sale.due > 0 && (
                    <div className="flex justify-between text-rose-700 font-bold">
                      <span>Due:</span>
                      <span className="font-mono-num">{formatCurrency(sale.due, lang)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Signature & Note */}
              <div className="pt-12 flex justify-between items-end text-slate-500 text-[11px]">
                <div>
                  <p>For exchange or return, please bring this invoice within 3 days.</p>
                  <p className="font-semibold text-slate-700 mt-1">Thank you!</p>
                </div>
                <div className="text-center border-t border-slate-300 pt-1 w-36">
                  <p>Authorized Signature</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2">
            <button
              onClick={generateWhatsAppMessage}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>{'Share WhatsApp'}</span>
            </button>
            <button
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
            >
              <Share2 className="w-4 h-4 text-slate-600" />
              <span>{copied ? ('Copied!') : ('Copy Text')}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs md:text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            >
              {'Close'}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>{'Print Invoice'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
