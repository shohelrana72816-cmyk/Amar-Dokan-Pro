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

  const isBn = settings.language === 'bn';
  const lang = settings.language;

  const handlePrint = () => {
    window.print();
  };

  const generateWhatsAppMessage = () => {
    const itemsText = sale.items
      .map((item, idx) => `${idx + 1}. ${item.productName}${item.variantDetails ? ` (${item.variantDetails})` : ''} - ${item.quantity} x ৳${item.unitPrice} = ৳${item.total}`)
      .join('%0A');

    const message = `*${encodeURIComponent(settings.shopName)}*%0A` +
      `ইনভয়েস নং: ${sale.invoiceNumber}%0A` +
      `তারিখ: ${formatDate(sale.date, 'bn')}%0A` +
      `গ্রাহক: ${encodeURIComponent(sale.customerName)}%0A` +
      `--------------------------------%0A` +
      `*পণ্যসমূহ:*%0A${itemsText}%0A` +
      `--------------------------------%0A` +
      `সর্বমোট: ৳${sale.total}%0A` +
      `পরিশোধ: ৳${sale.paid}%0A` +
      `বকেয়া: ৳${sale.due}%0A%0A` +
      `আমাদের সাথে কেনাকাটার জন্য ধন্যবাদ!`;

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
              {isBn ? 'বিক্রয় সফল হয়েছে (ইনভয়েস)' : 'Sale Completed (Invoice)'}
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
                {isBn ? 'থার্মাল স্লিপ' : 'Thermal (80mm)'}
              </button>
              <button
                onClick={() => setFormat('a4')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  format === 'a4' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                {isBn ? 'A4 ইনভয়েস' : 'A4 Invoice'}
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
                <p className="text-[10px] text-slate-600 font-sans">মোবাইল: {settings.mobile}</p>
              </div>

              {/* Invoice Meta */}
              <div className="py-2 border-b border-dashed border-slate-300 text-[11px] space-y-0.5">
                <div className="flex justify-between">
                  <span>ইনভয়েস নং:</span>
                  <span className="font-bold">{sale.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>তারিখ ও সময়:</span>
                  <span>{formatDate(sale.date, 'bn')} {formatTime(sale.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span>কাস্টমার:</span>
                  <span className="font-medium truncate max-w-[170px]">{sale.customerName}</span>
                </div>
                {sale.customerMobile && (
                  <div className="flex justify-between">
                    <span>ফোন:</span>
                    <span>{sale.customerMobile}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>বিক্রেতা:</span>
                  <span>{sale.servedBy}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="py-2 border-b border-dashed border-slate-300">
                <div className="flex justify-between font-bold text-[11px] pb-1">
                  <span>পণ্য ও পরিমাণ</span>
                  <span>টাকা</span>
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
                          {toBnNumber(item.quantity)} x {formatCurrency(item.unitPrice, 'bn')}
                          {item.discount > 0 && ` (-৳${item.discount})`}
                        </span>
                        <span className="font-semibold text-slate-900 font-mono-num">
                          {formatCurrency(item.total, 'bn')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bill Calculation */}
              <div className="py-2 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-600">
                  <span>সাবটোটাল:</span>
                  <span className="font-mono-num">{formatCurrency(sale.subtotal, 'bn')}</span>
                </div>
                {sale.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>ছাড় (Discount):</span>
                    <span className="font-mono-num">-{formatCurrency(sale.discount, 'bn')}</span>
                  </div>
                )}
                {sale.vatTaxAmount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>ভ্যাট/ট্যাক্স ({toBnNumber(sale.vatTaxRate)}%):</span>
                    <span className="font-mono-num">+{formatCurrency(sale.vatTaxAmount, 'bn')}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-bold text-slate-900 pt-1 border-t border-slate-200">
                  <span>সর্বমোট বিল:</span>
                  <span className="font-mono-num">{formatCurrency(sale.total, 'bn')}</span>
                </div>
                <div className="flex justify-between text-slate-800 pt-0.5">
                  <span>পরিশোধ ({sale.paymentMethod}):</span>
                  <span className="font-mono-num font-semibold">{formatCurrency(sale.paid, 'bn')}</span>
                </div>
                {sale.due > 0 && (
                  <div className="flex justify-between text-rose-700 font-bold">
                    <span>বকেয়া (Due):</span>
                    <span className="font-mono-num">{formatCurrency(sale.due, 'bn')}</span>
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
                  আমাদের সাথে কেনাকাটা করার জন্য ধন্যবাদ!
                </p>
                <p className="text-[9px] text-slate-400 font-sans">
                  সফটওয়্যার পার্টনার: Amar Dokan Pro
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
                  <p className="text-xs text-slate-500">ফোন: {settings.mobile} | ইমেইল: {settings.email}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                    চালান / INVOICE
                  </span>
                  <p className="text-xs font-mono font-bold text-slate-900 mt-2">{sale.invoiceNumber}</p>
                  <p className="text-[11px] text-slate-500">{formatDate(sale.date, 'bn')}</p>
                </div>
              </div>

              {/* Bill To */}
              <div className="py-4 border-b border-slate-200 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    বিল প্রাপক (CUSTOMER)
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-1">{sale.customerName}</p>
                  {sale.customerMobile && <p className="text-xs text-slate-600">মোবাইল: {sale.customerMobile}</p>}
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    পেমেন্ট স্ট্যাটাস
                  </span>
                  <p className="text-sm font-semibold capitalize mt-1 text-slate-800">
                    {sale.paymentMethod} ({sale.status === 'paid' ? 'পরিশোধিত' : sale.status === 'due' ? 'বকেয়া' : 'আংশিক'})
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div className="py-4">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 text-[11px]">
                      <th className="pb-2">ক্র.</th>
                      <th className="pb-2">বিবরণ (Product)</th>
                      <th className="pb-2 text-center">পরিমাণ</th>
                      <th className="pb-2 text-right">দর</th>
                      <th className="pb-2 text-right">মোট</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sale.items.map((item, idx) => (
                      <tr key={idx} className="text-slate-800">
                        <td className="py-2 text-slate-400">{idx + 1}</td>
                        <td className="py-2">
                          <span className="font-semibold block">{item.productName}</span>
                          {item.variantDetails && (
                            <span className="text-[10px] text-slate-500">ভ্যারিয়েন্ট: {item.variantDetails}</span>
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
                    <span>সাবটোটাল:</span>
                    <span className="font-mono-num">{formatCurrency(sale.subtotal, lang)}</span>
                  </div>
                  {sale.discount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>ছাড় (Discount):</span>
                      <span className="font-mono-num">-{formatCurrency(sale.discount, lang)}</span>
                    </div>
                  )}
                  {sale.vatTaxAmount > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>ভ্যাট/ট্যাক্স ({sale.vatTaxRate}%):</span>
                      <span className="font-mono-num">+{formatCurrency(sale.vatTaxAmount, lang)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
                    <span>সর্বমোট (Total):</span>
                    <span className="font-mono-num">{formatCurrency(sale.total, lang)}</span>
                  </div>
                  <div className="flex justify-between text-slate-800 font-medium">
                    <span>পরিশোধ (Paid):</span>
                    <span className="font-mono-num">{formatCurrency(sale.paid, lang)}</span>
                  </div>
                  {sale.due > 0 && (
                    <div className="flex justify-between text-rose-700 font-bold">
                      <span>বকেয়া (Due):</span>
                      <span className="font-mono-num">{formatCurrency(sale.due, lang)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Signature & Note */}
              <div className="pt-12 flex justify-between items-end text-slate-500 text-[11px]">
                <div>
                  <p>পণ্য ফেরত বা পরিবর্তনের ক্ষেত্রে ৩ দিনের মধ্যে ইনভয়েস সাথে আনুন।</p>
                  <p className="font-semibold text-slate-700 mt-1">ধন্যবাদ!</p>
                </div>
                <div className="text-center border-t border-slate-300 pt-1 w-36">
                  <p>কর্তৃপক্ষের স্বাক্ষর</p>
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
              <span>{isBn ? 'হোয়াটসঅ্যাপে পাঠান' : 'Share WhatsApp'}</span>
            </button>
            <button
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
            >
              <Share2 className="w-4 h-4 text-slate-600" />
              <span>{copied ? (isBn ? 'কপি হয়েছে!' : 'Copied!') : (isBn ? 'টেক্সট কপি' : 'Copy Text')}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs md:text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            >
              {isBn ? 'বন্ধ করুন' : 'Close'}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>{isBn ? 'ইনভয়েস প্রিন্ট' : 'Print Invoice'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
