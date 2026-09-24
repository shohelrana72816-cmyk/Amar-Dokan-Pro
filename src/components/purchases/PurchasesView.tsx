import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Purchase, PurchaseItem, PaymentMethod } from '../../types';
import { formatCurrency, formatDate, toBnNumber } from '../../utils/formatters';
import {
  Truck,
  Plus,
  Search,
  PlusCircle,
  Trash2,
  X,
  Building,
  CheckCircle,
} from 'lucide-react';

interface PurchasesViewProps {
  isAddModalOpen?: boolean;
  onCloseAddModal?: () => void;
}

export const PurchasesView: React.FC<PurchasesViewProps> = ({ isAddModalOpen: propIsAddModalOpen, onCloseAddModal: propOnCloseAddModal }) => {
  const { purchases, suppliers, products, recordPurchase, settings, activeBranchId } = useApp();
  const isBn = settings.language === 'bn';
  const lang = settings.language;

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(propIsAddModalOpen || false);

  React.useEffect(() => {
    if (propIsAddModalOpen !== undefined) {
      setIsModalOpen(propIsAddModalOpen);
    }
  }, [propIsAddModalOpen]);

  const closeModal = () => {
    setIsModalOpen(false);
    if (propOnCloseAddModal) propOnCloseAddModal();
  };

  // Purchase Form State
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [items, setItems] = useState<PurchaseItem[]>([
    {
      productId: products[0]?.id || '',
      productName: products[0]?.name || '',
      quantity: 10,
      purchasePrice: products[0]?.purchasePrice || 500,
      total: (products[0]?.purchasePrice || 500) * 10,
    },
  ]);
  const [discount, setDiscount] = useState<number>(0);
  const [transportCost, setTransportCost] = useState<number>(0);
  const [otherCost, setOtherCost] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const total = Math.max(0, subtotal - (discount || 0) + (transportCost || 0) + (otherCost || 0));
  const effectivePaid = paidAmount === '' ? total : Number(paidAmount);
  const due = Math.max(0, total - effectivePaid);

  const handleOpenAdd = () => {
    setSupplierId(suppliers[0]?.id || '');
    setInvoiceNumber(`BILL-${Math.floor(1000 + Math.random() * 9000)}`);
    if (products.length > 0) {
      setItems([
        {
          productId: products[0].id,
          productName: products[0].name,
          quantity: 10,
          purchasePrice: products[0].purchasePrice,
          total: products[0].purchasePrice * 10,
        },
      ]);
    }
    setDiscount(0);
    setTransportCost(0);
    setOtherCost(0);
    setPaidAmount('');
    setIsModalOpen(true);
  };

  const handleItemChange = (index: number, field: 'productId' | 'quantity' | 'purchasePrice', value: any) => {
    setItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index] };

      if (field === 'productId') {
        const prod = products.find(p => p.id === value);
        if (prod) {
          item.productId = prod.id;
          item.productName = prod.name;
          item.purchasePrice = prod.purchasePrice;
          item.total = prod.purchasePrice * item.quantity;
        }
      } else if (field === 'quantity') {
        item.quantity = Number(value) || 0;
        item.total = item.quantity * item.purchasePrice;
      } else if (field === 'purchasePrice') {
        item.purchasePrice = Number(value) || 0;
        item.total = item.quantity * item.purchasePrice;
      }

      updated[index] = item;
      return updated;
    });
  };

  const addItemRow = () => {
    if (products.length === 0) return;
    setItems(prev => [
      ...prev,
      {
        productId: products[0].id,
        productName: products[0].name,
        quantity: 5,
        purchasePrice: products[0].purchasePrice,
        total: products[0].purchasePrice * 5,
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmitPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || items.length === 0) return;

    const supp = suppliers.find(s => s.id === supplierId);
    if (!supp) return;

    recordPurchase({
      supplierId: supp.id,
      supplierName: supp.company || supp.name,
      items,
      subtotal,
      discount: discount || 0,
      transportCost: transportCost || 0,
      otherCost: otherCost || 0,
      total,
      paid: effectivePaid,
      due,
      paymentMethod,
      branchId: activeBranchId,
      notes,
    });

    closeModal();
  };

  const filteredPurchases = purchases.filter(p =>
    p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.supplierName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-600" />
            <span>{isBn ? 'কেনাকাটা ও ক্রয় চালান (Purchase)' : 'Purchase Invoices'}</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            {isBn
              ? 'সাপ্লায়ার থেকে নতুন চালান রিসিভ করলে স্বয়ংক্রিয়ভাবে স্টক বৃদ্ধি ও বকেয়া হিসাব যুক্ত হয়'
              : 'Receiving purchases automatically increments stock & logs supplier dues'}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-3.5 py-2 text-xs md:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{isBn ? 'নতুন ক্রয় এন্ট্রি (New Purchase)' : 'New Purchase'}</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex items-center gap-2 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isBn ? 'চালান নম্বর বা সাপ্লায়ার দিয়ে খুঁজুন...' : 'Search invoice or supplier...'}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/50"
          />
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">{isBn ? 'চালান নং' : 'Invoice #'}</th>
                <th className="px-4 py-3 font-semibold">{isBn ? 'তারিখ' : 'Date'}</th>
                <th className="px-4 py-3 font-semibold">{isBn ? 'সাপ্লায়ার / মহাজন' : 'Supplier'}</th>
                <th className="px-4 py-3 font-semibold text-center">{isBn ? 'আইটেম সংখ্যা' : 'Items'}</th>
                <th className="px-4 py-3 font-semibold text-right">{isBn ? 'মোট মূল্য' : 'Total'}</th>
                <th className="px-4 py-3 font-semibold text-right">{isBn ? 'পরিশোধ' : 'Paid'}</th>
                <th className="px-4 py-3 font-semibold text-right">{isBn ? 'বকেয়া' : 'Due'}</th>
                <th className="px-4 py-3 font-semibold">{isBn ? 'পেমেন্ট মাধ্যম' : 'Method'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPurchases.map(purchase => (
                <tr key={purchase.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">
                    {purchase.invoiceNumber}
                  </td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    {formatDate(purchase.date, lang)}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {purchase.supplierName}
                  </td>
                  <td className="px-4 py-3 text-center font-mono-num text-slate-700">
                    {toBnNumber(purchase.items.length)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono-num font-bold text-slate-900">
                    {formatCurrency(purchase.total, lang)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono-num text-emerald-700 font-semibold">
                    {formatCurrency(purchase.paid, lang)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono-num font-bold">
                    <span className={purchase.due > 0 ? 'text-rose-700' : 'text-slate-400'}>
                      {purchase.due > 0 ? formatCurrency(purchase.due, lang) : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-700">
                    {purchase.paymentMethod}
                  </td>
                </tr>
              ))}

              {filteredPurchases.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    {isBn ? 'কোনো ক্রয় চালান পাওয়া যায়নি।' : 'No purchase records found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Purchase Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden my-6">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-sm md:text-base text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-600" />
                <span>{isBn ? 'নতুন ক্রয় চালান এন্ট্রি (New Purchase)' : 'New Purchase Order'}</span>
              </h3>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPurchase} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">{isBn ? 'সাপ্লায়ার / মহাজন নির্বাচন *' : 'Supplier *'}</label>
                  <select
                    aria-label={isBn ? 'সাপ্লায়ার নির্বাচন করুন' : 'Select Supplier'}
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.company || s.name} (বকেয়া: ৳{s.currentDue})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">{isBn ? 'চালান নম্বর (Invoice #)' : 'Bill / Invoice #'}</label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="BILL-001"
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between pb-1 border-b">
                  <span className="font-bold text-slate-800">{isBn ? 'ক্রয়কৃত পণ্যের বিবরণ' : 'Purchase Items'}</span>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isBn ? '+ পণ্য যোগ' : '+ Add Item'}</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg border border-slate-200">
                      <div className="col-span-5">
                        <select
                          aria-label={isBn ? 'পণ্য নির্বাচন' : 'Select Product'}
                          value={item.productId}
                          onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                          className="w-full p-1.5 border border-slate-200 rounded text-xs"
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-full p-1.5 border border-slate-200 rounded text-xs font-mono-num text-center"
                        />
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          min="0"
                          placeholder="Rate"
                          value={item.purchasePrice}
                          onChange={(e) => handleItemChange(idx, 'purchasePrice', e.target.value)}
                          className="w-full p-1.5 border border-slate-200 rounded text-xs font-mono-num text-right"
                        />
                      </div>

                      <div className="col-span-2 text-right font-mono-num font-bold text-slate-900">
                        {formatCurrency(item.total, lang)}
                      </div>

                      <div className="col-span-1 text-center">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItemRow(idx)}
                            className="text-rose-500 hover:text-rose-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Extra Costs & Discount */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">{isBn ? 'ছাড় (Discount ৳)' : 'Discount (৳)'}</label>
                  <input
                    type="number"
                    min="0"
                    value={discount || ''}
                    onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                    className="w-full p-1.5 border border-slate-200 rounded font-mono-num text-right"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">{isBn ? 'পরিবহন খরচ (Transport)' : 'Transport Cost'}</label>
                  <input
                    type="number"
                    min="0"
                    value={transportCost || ''}
                    onChange={(e) => setTransportCost(Number(e.target.value) || 0)}
                    className="w-full p-1.5 border border-slate-200 rounded font-mono-num text-right"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">{isBn ? 'অন্যান্য খরচ' : 'Other Cost'}</label>
                  <input
                    type="number"
                    min="0"
                    value={otherCost || ''}
                    onChange={(e) => setOtherCost(Number(e.target.value) || 0)}
                    className="w-full p-1.5 border border-slate-200 rounded font-mono-num text-right"
                  />
                </div>
              </div>

              {/* Payment Row */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-sm font-bold text-slate-900">
                  <span>{isBn ? 'সর্বমোট ক্রয়মূল্য:' : 'Total Payable:'}</span>
                  <span className="font-mono-num text-emerald-800 text-base">{formatCurrency(total, lang)}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">{isBn ? 'পরিশোধিত টাকা (Paid) *' : 'Paid Amount *'}</label>
                    <input
                      type="number"
                      min="0"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder={total.toString()}
                      className="w-full p-2 border border-slate-200 rounded-lg font-mono-num font-bold bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">{isBn ? 'পেমেন্ট মাধ্যম' : 'Payment Method'}</label>
                    <select
                      aria-label={isBn ? 'পেমেন্ট মাধ্যম নির্বাচন' : 'Payment Method'}
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-white capitalize"
                    >
                      <option value="cash">Cash (ক্যাশ)</option>
                      <option value="bank">Bank (ব্যাংক)</option>
                      <option value="bkash">bKash (বিকাশ)</option>
                    </select>
                  </div>
                </div>

                {due > 0 && (
                  <div className="flex justify-between text-xs font-bold text-rose-700 bg-rose-50 p-2 rounded-lg">
                    <span>{isBn ? 'সাপ্লায়ার বাকি থাকবে (Supplier Due):' : 'Pending Due:'}</span>
                    <span className="font-mono-num">{formatCurrency(due, lang)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                >
                  {isBn ? 'চালান গ্রহণ ও স্টক বৃদ্ধি করুন' : 'Confirm Purchase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
