import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Customer, PaymentMethod } from '../../types';
import { formatCurrency, formatDate, toBnNumber } from '../../utils/formatters';
import {
  Users,
  Plus,
  Search,
  Wallet,
  MessageSquare,
  FileText,
  X,
  CreditCard,
  History,
  Phone,
  MapPin,
  Edit,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

interface CustomersViewProps {
  isAddModalOpen?: boolean;
  onCloseAddModal?: () => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({ isAddModalOpen: propIsAddModalOpen, onCloseAddModal: propOnCloseAddModal }) => {
  const { customers, customerTransactions, addCustomer, updateCustomer, deleteCustomer, isAdmin, collectCustomerDue, accounts, settings } = useApp();
  const isBn = false;
  const lang = settings.language;

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'due'>('all');

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(propIsAddModalOpen || false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Delete Customer State
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [deleteCustomerError, setDeleteCustomerError] = useState<string | null>(null);

  // Due Collection Modal
  const [collectingCustomer, setCollectingCustomer] = useState<Customer | null>(null);
  const [collectAmount, setCollectAmount] = useState<number | ''>('');
  const [collectMethod, setCollectMethod] = useState<PaymentMethod>('cash');
  const [collectAccountId, setCollectAccountId] = useState(accounts[0]?.id || '');
  const [collectNote, setCollectNote] = useState('');

  // Customer Ledger Modal
  const [ledgerCustomer, setLedgerCustomer] = useState<Customer | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [customerType, setCustomerType] = useState<'retail' | 'wholesale'>('retail');
  const [openingDue, setOpeningDue] = useState<number | ''>('');
  const [creditLimit, setCreditLimit] = useState<number>(10000);

  React.useEffect(() => {
    if (propIsAddModalOpen !== undefined) {
      setIsModalOpen(propIsAddModalOpen);
    }
  }, [propIsAddModalOpen]);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
    if (propOnCloseAddModal) propOnCloseAddModal();
  };

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setName('');
    setMobile('');
    setAddress('');
    setEmail('');
    setCustomerType('retail');
    setOpeningDue('');
    setCreditLimit(10000);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setMobile(c.mobile);
    setAddress(c.address || '');
    setEmail(c.email || '');
    setCustomerType(c.customerType);
    setOpeningDue('');
    setCreditLimit(c.creditLimit);
    setIsModalOpen(true);
  };

  const handleSubmitCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim()) return;

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, {
        name: name.trim(),
        mobile: mobile.trim(),
        address: address.trim() || undefined,
        email: email.trim() || undefined,
        customerType,
        creditLimit: Number(creditLimit) || 10000,
      });
    } else {
      addCustomer({
        name: name.trim(),
        mobile: mobile.trim(),
        address: address.trim() || undefined,
        email: email.trim() || undefined,
        customerType,
        openingDue: Number(openingDue) || 0,
        creditLimit: Number(creditLimit) || 10000,
      });
    }

    closeModal();
  };

  const handleOpenCollectDue = (c: Customer) => {
    setCollectingCustomer(c);
    setCollectAmount(c.currentDue);
    setCollectMethod('cash');
    setCollectAccountId(accounts[0]?.id || '');
    setCollectNote('Due payment collection');
  };

  const handleSubmitCollect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectingCustomer || !collectAmount || Number(collectAmount) <= 0) return;

    collectCustomerDue(
      collectingCustomer.id,
      Number(collectAmount),
      collectMethod,
      collectAccountId,
      collectNote
    );

    setCollectingCustomer(null);
  };

  const sendWhatsAppReminder = (c: Customer) => {
    const text = `Dear ${c.name},%0A%0AYour outstanding balance at ${encodeURIComponent(settings.shopName)} is ৳${c.currentDue}. Please arrange payment at your earliest convenience.%0A%0AFor any queries, please call: ${settings.mobile}. Thank you!`;
    const cleanPhone = c.mobile.replace(/[^0-9]/g, '');
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${text}`, '_blank');
  };

  const totalDueAmount = customers.reduce((sum, c) => sum + c.currentDue, 0);
  const dueCustomersCount = customers.filter(c => c.currentDue > 0).length;

  const filteredCustomers = customers.filter(c => {
    const matchSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.mobile.includes(searchQuery) ||
      (c.address && c.address.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchFilter = filterType === 'all' || (filterType === 'due' && c.currentDue > 0);
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-4">
      {/* Top Banner & Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs text-slate-500 block">{'Total Customers'}</span>
          <span className="text-xl md:text-2xl font-bold font-mono-num text-slate-900 mt-1 block">
            {toBnNumber(customers.length)}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {toBnNumber(dueCustomersCount)} {'have pending due'}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-amber-200 bg-amber-50/40 p-4 shadow-xs">
          <span className="text-xs text-amber-800 font-semibold block">
            {'Total Due Outstanding'}
          </span>
          <span className="text-xl md:text-2xl font-bold font-mono-num text-amber-900 mt-1 block">
            {formatCurrency(totalDueAmount, lang)}
          </span>
          <span className="text-[11px] text-amber-700 mt-0.5 block">
            {'Receivable credit balance'}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 block">{'Quick Actions'}</span>
            <span className="text-xs text-slate-700 mt-1 block font-medium">
              {'Register retail/wholesale'}
            </span>
          </div>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{'Add'}</span>
          </button>
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
            placeholder={'Search by name, phone, address...'}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-1 w-full sm:w-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg border font-medium ${
              filterType === 'all' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            {'All Customers'}
          </button>
          <button
            onClick={() => setFilterType('due')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg border font-semibold flex items-center justify-center gap-1 ${
              filterType === 'due' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-amber-700 border-amber-200'
            }`}
          >
            <span>{'Due Customers'}</span>
            <span>({toBnNumber(dueCustomersCount)})</span>
          </button>
        </div>
      </div>

      {/* Customers List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">{'Customer Name'}</th>
                <th className="px-4 py-3 font-semibold">{'Phone'}</th>
                <th className="px-4 py-3 font-semibold">{'Address'}</th>
                <th className="px-4 py-3 font-semibold text-right">{'Purchases'}</th>
                <th className="px-4 py-3 font-semibold text-right">{'Paid'}</th>
                <th className="px-4 py-3 font-semibold text-right">{'Due'}</th>
                <th className="px-4 py-3 font-semibold text-right">{'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map(customer => (
                <tr key={customer.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{customer.name}</div>
                    <span className="text-[10px] text-slate-500 capitalize">{customer.customerType}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-700">
                    {customer.mobile}
                  </td>
                  <td className="px-4 py-3 text-slate-600 truncate max-w-[160px]">
                    {customer.address || '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono-num text-slate-700">
                    {formatCurrency(customer.totalPurchase, lang)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono-num text-emerald-700 font-semibold">
                    {formatCurrency(customer.totalPaid, lang)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono-num font-bold">
                    <span className={customer.currentDue > 0 ? 'text-amber-800 text-sm' : 'text-slate-400'}>
                      {customer.currentDue > 0 ? formatCurrency(customer.currentDue, lang) : '0'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {customer.currentDue > 0 && (
                        <>
                          <button
                            onClick={() => handleOpenCollectDue(customer)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded font-semibold transition-colors"
                            title={'Collect Due'}
                          >
                            <CreditCard className="w-3.5 h-3.5 text-amber-700" />
                            <span>{'Collect'}</span>
                          </button>
                          <button
                            onClick={() => sendWhatsAppReminder(customer)}
                            className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded transition-colors"
                            title={'WhatsApp Due Reminder'}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setLedgerCustomer(customer)}
                        className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                        title={'View Ledger'}
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(customer)}
                        className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                        title={'Edit Customer'}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => {
                            setCustomerToDelete(customer);
                            setDeleteCustomerError(null);
                          }}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                          title={'Delete Customer (Admin Only)'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    {'No customers found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Due Collection Modal */}
      {collectingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form
            onSubmit={handleSubmitCollect}
            className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>{'Collect Due Payment'}</span>
                </h3>
                <span className="text-[11px] text-slate-500">
                  {collectingCustomer.name} (Due: ৳{collectingCustomer.currentDue})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCollectingCustomer(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">{'Amount *'}</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={collectingCustomer.currentDue}
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder={collectingCustomer.currentDue.toString()}
                  className="w-full p-2 border border-slate-200 rounded-lg font-mono-num font-bold text-base text-emerald-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">{'Method'}</label>
                  <select
                    aria-label={'Method'}
                    value={collectMethod}
                    onChange={(e) => setCollectMethod(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white capitalize"
                  >
                    <option value="cash">Cash</option>
                    <option value="bkash">bKash</option>
                    <option value="nagad">Nagad</option>
                    <option value="bank">Bank</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">{'Deposit To Account'}</label>
                  <select
                    aria-label={'Deposit To Account'}
                    value={collectAccountId}
                    onChange={(e) => setCollectAccountId(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">{'Note'}</label>
                <input
                  type="text"
                  value={collectNote}
                  onChange={(e) => setCollectNote(e.target.value)}
                  placeholder="Due payment received and deposited"
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[11px]">
                {`Remaining due balance will be: ৳${Math.max(0, collectingCustomer.currentDue - (Number(collectAmount) || 0))}`}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setCollectingCustomer(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                {'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
              >
                {'Confirm Collection'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Customer Ledger Modal */}
      {ledgerCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl p-5 space-y-4 my-6">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="font-bold text-base text-slate-900">{ledgerCustomer.name}</h3>
                <p className="text-xs text-slate-500">{ledgerCustomer.mobile} · {ledgerCustomer.address}</p>
              </div>
              <button
                onClick={() => setLedgerCustomer(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Balance */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border text-center text-xs">
              <div>
                <span className="text-slate-500 block">Total Purchases</span>
                <span className="font-bold text-slate-900 font-mono-num">{formatCurrency(ledgerCustomer.totalPurchase, lang)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Total Paid</span>
                <span className="font-bold text-emerald-700 font-mono-num">{formatCurrency(ledgerCustomer.totalPaid, lang)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Current Due</span>
                <span className="font-bold text-amber-800 font-mono-num">{formatCurrency(ledgerCustomer.currentDue, lang)}</span>
              </div>
            </div>

            {/* Transactions History Table */}
            <div className="space-y-2">
              <span className="font-bold text-xs text-slate-800 block">Transaction History</span>
              <div className="max-h-60 overflow-y-auto border rounded-xl divide-y text-xs">
                {customerTransactions.filter(t => t.customerId === ledgerCustomer.id).map(t => (
                  <div key={t.id} className="p-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-slate-800 block">
                        {t.type === 'due_collection' ? 'Due Payment' : 'Due Sale'}
                        {t.referenceId && ` (${t.referenceId})`}
                      </span>
                      <span className="text-[10px] text-slate-500">{formatDate(t.date, lang)} · {t.note}</span>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold font-mono-num ${t.type === 'due_collection' ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {t.type === 'due_collection' ? `-${formatCurrency(t.amount, lang)}` : `+${formatCurrency(t.amount, lang)}`}
                      </span>
                      <span className="text-[10px] text-slate-500 block">Balance: ৳{t.balanceAfter}</span>
                    </div>
                  </div>
                ))}
                {customerTransactions.filter(t => t.customerId === ledgerCustomer.id).length === 0 && (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No previous transaction records found.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border"
              >
                Print Statement
              </button>
              <button
                onClick={() => setLedgerCustomer(null)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form
            onSubmit={handleSubmitCustomer}
            className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>{editingCustomer ? ('Edit Customer') : ('Add Customer')}</span>
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">{'Full Name *'}</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tanvir Ahmed"
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
                  placeholder="01715-112233"
                  className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">{'Type'}</label>
                  <select
                    aria-label={'Type'}
                    value={customerType}
                    onChange={(e) => setCustomerType(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="retail">Retail</option>
                    <option value="wholesale">Wholesale</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">{'Credit Limit'}</label>
                  <input
                    type="number"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(Number(e.target.value) || 10000)}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono-num"
                  />
                </div>
              </div>

              {!editingCustomer && (
                <div>
                  <label className="block font-medium text-slate-700 mb-1">{'Opening Due'}</label>
                  <input
                    type="number"
                    min="0"
                    value={openingDue}
                    onChange={(e) => setOpeningDue(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono-num"
                  />
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-700 mb-1">{'Address'}</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House, Road, Area"
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={closeModal}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                {'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
              >
                {'Save Customer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Customer Confirmation Modal */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-rose-200 w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {'Delete Customer?'}
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {customerToDelete.name} ({customerToDelete.mobile})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-700">
              <p className="font-medium text-slate-800">
                {'Are you sure you want to permanently delete this customer record?'}
              </p>

              {customerToDelete.currentDue > 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-amber-900 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{'Warning: Outstanding Due Balance!'}</span>
                  </div>
                  <p>
                    {`This customer has an outstanding due balance of ৳${customerToDelete.currentDue}. Please clear or adjust the due balance before deletion.`}
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-slate-700 text-xs">
                  <div className="flex justify-between">
                    <span>{'Total Purchases'}:</span>
                    <span className="font-mono-num font-bold">{formatCurrency(customerToDelete.totalPurchase, lang)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>{'Current Due'}:</span>
                    <span className="font-mono-num font-bold">0 (Paid)</span>
                  </div>
                  <p className="pt-1 text-[11px] text-slate-500">
                    {'This action will be recorded in the audit logs.'}
                  </p>
                </div>
              )}

              {deleteCustomerError && (
                <div className="p-2 bg-rose-50 text-rose-700 rounded-lg text-xs font-semibold">
                  {deleteCustomerError}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                {'Cancel'}
              </button>
              <button
                type="button"
                disabled={customerToDelete.currentDue > 0}
                onClick={() => {
                  const res = deleteCustomer(customerToDelete.id);
                  if (res.success) {
                    setCustomerToDelete(null);
                  } else {
                    setDeleteCustomerError(res.message || 'Error deleting customer');
                  }
                }}
                className={`px-4 py-1.5 text-xs font-bold text-white rounded-lg flex items-center gap-1.5 shadow-xs transition-colors ${
                  customerToDelete.currentDue > 0
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{'Delete Customer'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
