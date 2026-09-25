import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Expense, PaymentMethod } from '../../types';
import { formatCurrency, formatDate, toBnNumber } from '../../utils/formatters';
import {
  Wallet,
  Plus,
  ArrowDownUp,
  CreditCard,
  Building,
  Smartphone,
  X,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
} from 'lucide-react';

interface AccountsViewProps {
  isExpenseModalOpen?: boolean;
  onCloseExpenseModal?: () => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({ isExpenseModalOpen: propIsExpenseModalOpen, onCloseExpenseModal: propOnCloseExpenseModal }) => {
  const { accounts, expenses, addExpense, deleteExpense, isAdmin, transferMoney, settings } = useApp();
  const isBn = settings.language === 'bn';
  const lang = settings.language;

  // Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(propIsExpenseModalOpen || false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isDeletingExpense, setIsDeletingExpense] = useState(false);

  React.useEffect(() => {
    if (propIsExpenseModalOpen !== undefined) {
      setIsExpenseModalOpen(propIsExpenseModalOpen);
    }
  }, [propIsExpenseModalOpen]);

  const closeExpenseModal = () => {
    setIsExpenseModalOpen(false);
    if (propOnCloseExpenseModal) propOnCloseExpenseModal();
  };

  // Expense Form
  const [expCategory, setExpCategory] = useState('দোকান ভাড়া (Shop Rent)');
  const [expAmount, setExpAmount] = useState<number | ''>('');
  const [expAccountId, setExpAccountId] = useState(accounts[0]?.id || '');
  const [expMethod, setExpMethod] = useState<PaymentMethod>('cash');
  const [expPaidTo, setExpPaidTo] = useState('');
  const [expNote, setExpNote] = useState('');

  // Transfer Form
  const [fromAccId, setFromAccId] = useState(accounts[0]?.id || '');
  const [toAccId, setToAccId] = useState(accounts[1]?.id || accounts[0]?.id || '');
  const [tfAmount, setTfAmount] = useState<number | ''>('');
  const [tfNote, setTfNote] = useState('');

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const expenseCategories = [
    'দোকান ভাড়া (Shop Rent)',
    'বিদ্যুৎ বিল (Electricity)',
    'ইন্টারনেট ও ডিশ বিল (Internet)',
    'স্টাফ বেতন (Staff Salary)',
    'চা-নাস্তা ও খাবার (Food & Refreshment)',
    'পরিবহন ও কুরিয়ার (Transport / Courier)',
    'দোকান মেরামত (Maintenance)',
    'প্যাকেজিং ও শপিং ব্যাগ (Packaging Bags)',
    'বিজ্ঞাপন ও প্রচার (Marketing)',
    'অন্যান্য বিবিধ খরচ (Other)',
  ];

  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expAmount || Number(expAmount) <= 0) return;

    addExpense({
      category: expCategory,
      amount: Number(expAmount),
      paymentMethod: expMethod,
      accountId: expAccountId,
      paidTo: expPaidTo.trim() || undefined,
      note: expNote.trim() || undefined,
    });

    closeExpenseModal();
    setExpAmount('');
    setExpPaidTo('');
    setExpNote('');
  };

  const handleSubmitTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tfAmount || Number(tfAmount) <= 0 || fromAccId === toAccId) {
      alert(isBn ? 'সঠিক অ্যাকাউন্ট ও টাকার পরিমাণ নির্বাচন করুন!' : 'Invalid accounts or transfer amount!');
      return;
    }

    const fromAcc = accounts.find(a => a.id === fromAccId);
    if (fromAcc && fromAcc.balance < Number(tfAmount)) {
      alert(isBn ? 'নির্বাচিত অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই!' : 'Insufficient balance in source account!');
      return;
    }

    transferMoney(fromAccId, toAccId, Number(tfAmount), tfNote);
    setIsTransferModalOpen(false);
    setTfAmount('');
    setTfNote('');
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Accounts List */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-600" />
            <span>{isBn ? 'হিসাবের খাতা ও ক্যাশ/ব্যাংক' : 'Cash & Bank Accounts'}</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            {isBn ? 'দোকানের ক্যাশ ড্রয়ার, ব্যাংক ও মোবাইল ব্যাংকিং হিসাব' : 'Manage cash drawer, mobile banking & bank balances'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs md:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
          >
            <ArrowDownUp className="w-4 h-4 text-slate-600" />
            <span>{isBn ? 'টাকা স্থানান্তর (Transfer)' : 'Transfer Money'}</span>
          </button>
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs md:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{isBn ? 'নতুন খরচ (Add Expense)' : 'Add Expense'}</span>
          </button>
        </div>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {accounts.map(acc => (
          <div key={acc.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 truncate">{acc.name}</span>
              {acc.accountType === 'cash' ? (
                <Wallet className="w-4 h-4 text-emerald-600" />
              ) : acc.accountType === 'mobile_bank' ? (
                <Smartphone className="w-4 h-4 text-pink-600" />
              ) : (
                <Building className="w-4 h-4 text-blue-600" />
              )}
            </div>
            <div className="mt-2 text-xl font-bold font-mono-num text-slate-900">
              {formatCurrency(acc.balance, lang)}
            </div>
            <div className="mt-1 text-[11px] text-slate-600 font-mono">
              {acc.accountNumber || (isBn ? 'নগদ ড্রয়ার' : 'Cash Drawer')}
            </div>
          </div>
        ))}
      </div>

      {/* Expense Management Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-rose-600" />
            <h3 className="text-sm font-semibold text-slate-900">
              {isBn ? 'দোকানের খরচের তালিকা' : 'Expense Records'}
            </h3>
          </div>
          <span className="text-xs font-semibold text-rose-700">
            {isBn ? 'সর্বমোট খরচ:' : 'Total:'} {formatCurrency(totalExpenses, lang)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">{isBn ? 'তারিখ' : 'Date'}</th>
                <th className="px-4 py-3 font-semibold">{isBn ? 'খরচের খাত / ক্যাটাগরি' : 'Category'}</th>
                <th className="px-4 py-3 font-semibold">{isBn ? 'গ্রহীতা (Paid To)' : 'Paid To'}</th>
                <th className="px-4 py-3 font-semibold">{isBn ? 'যে ফান্ড থেকে কর্তন' : 'Account'}</th>
                <th className="px-4 py-3 font-semibold">{isBn ? 'নোট / বিবরণ' : 'Note'}</th>
                <th className="px-4 py-3 font-semibold text-right">{isBn ? 'টাকার পরিমাণ' : 'Amount'}</th>
                {isAdmin && <th className="px-4 py-3 font-semibold text-right">{isBn ? 'অ্যাকশন' : 'Actions'}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map(exp => {
                const acc = accounts.find(a => a.id === exp.accountId);
                return (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {formatDate(exp.date, lang)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {exp.category}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {exp.paidTo || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {acc?.name || exp.paymentMethod}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {exp.note || '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono-num font-bold text-rose-700 text-sm">
                      {formatCurrency(exp.amount, lang)}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => setExpenseToDelete(exp)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                          title={isBn ? 'খরচ মুছে ফেলুন (অ্যাডমিন অনলি)' : 'Delete Expense (Admin Only)'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}

              {expenses.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="py-12 text-center text-slate-400 text-xs">
                    {isBn ? 'কোনো খরচের রেকর্ড পাওয়া যায়নি।' : 'No expenses recorded.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form
            onSubmit={handleSubmitExpense}
            className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-rose-600" />
                <span>{isBn ? 'নতুন খরচ এন্ট্রি' : 'Add Expense'}</span>
              </h3>
              <button
                type="button"
                onClick={closeExpenseModal}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">{isBn ? 'খরচের খাত *' : 'Category *'}</label>
                <select
                  aria-label={isBn ? 'খরচের খাত' : 'Category'}
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                >
                  {expenseCategories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">{isBn ? 'খরচের পরিমাণ (টাকা) *' : 'Amount *'}</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 500"
                  className="w-full p-2 border border-slate-200 rounded-lg font-mono-num font-bold text-base text-rose-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">{isBn ? 'পেমেন্ট মাধ্যম' : 'Method'}</label>
                  <select
                    aria-label={isBn ? 'পেমেন্ট মাধ্যম' : 'Method'}
                    value={expMethod}
                    onChange={(e) => setExpMethod(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white capitalize"
                  >
                    <option value="cash">Cash (ক্যাশ)</option>
                    <option value="bkash">bKash (বিকাশ)</option>
                    <option value="bank">Bank (ব্যাংক)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">{isBn ? 'যে ফান্ড থেকে কর্তন' : 'Paid From'}</label>
                  <select
                    aria-label={isBn ? 'যে ফান্ড থেকে কর্তন হবে' : 'Paid From Account'}
                    value={expAccountId}
                    onChange={(e) => setExpAccountId(e.target.value)}
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
                <label className="block font-medium text-slate-700 mb-1">{isBn ? 'গ্রহীতার নাম (Paid To)' : 'Paid To'}</label>
                <input
                  type="text"
                  value={expPaidTo}
                  onChange={(e) => setExpPaidTo(e.target.value)}
                  placeholder="e.g. বাড়িওয়ালা / বিদ্যুৎ অফিস"
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">{isBn ? 'নোট' : 'Note'}</label>
                <input
                  type="text"
                  value={expNote}
                  onChange={(e) => setExpNote(e.target.value)}
                  placeholder="খরচের বিবরণ লিখুন"
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={closeExpenseModal}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
              >
                {isBn ? 'খরচ সংরক্ষণ করুন' : 'Save Expense'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form
            onSubmit={handleSubmitTransfer}
            className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ArrowDownUp className="w-4 h-4 text-emerald-600" />
                <span>{isBn ? 'অ্যাকাউন্ট ব্যালেন্স স্থানান্তর' : 'Transfer Balance'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">{isBn ? 'প্রেরক অ্যাকাউন্ট' : 'From'}</label>
                  <select
                    aria-label={isBn ? 'প্রেরক অ্যাকাউন্ট' : 'From Account'}
                    value={fromAccId}
                    onChange={(e) => setFromAccId(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} (৳{a.balance})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">{isBn ? 'প্রাপক অ্যাকাউন্ট' : 'To'}</label>
                  <select
                    aria-label={isBn ? 'প্রাপক অ্যাকাউন্ট' : 'To Account'}
                    value={toAccId}
                    onChange={(e) => setToAccId(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} (৳{a.balance})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">{isBn ? 'স্থানান্তরের পরিমাণ (টাকা) *' : 'Amount *'}</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={tfAmount}
                  onChange={(e) => setTfAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 10000"
                  className="w-full p-2 border border-slate-200 rounded-lg font-mono-num font-bold text-base"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">{isBn ? 'নোট' : 'Note'}</label>
                <input
                  type="text"
                  value={tfNote}
                  onChange={(e) => setTfNote(e.target.value)}
                  placeholder="e.g. ক্যাশ ড্রয়ার থেকে ব্যাংকে জমা"
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
              >
                {isBn ? 'স্থানান্তর করুন' : 'Confirm Transfer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Expense Confirmation Modal */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-rose-200 w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {isBn ? 'Delete Expense? (খরচ মুছে ফেলবেন?)' : 'Delete Expense?'}
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {expenseToDelete.category}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExpenseToDelete(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-700">
              <p className="font-medium text-slate-800">
                {isBn
                  ? 'Are you sure you want to delete this expense record? Related account balance will be restored.'
                  : 'Are you sure you want to delete this expense record? Related account balance will be restored.'}
              </p>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1 text-rose-900 text-xs">
                <div className="flex justify-between font-semibold">
                  <span>{isBn ? 'খরচের পরিমাণ' : 'Expense Amount'}:</span>
                  <span className="font-mono-num font-bold">{formatCurrency(expenseToDelete.amount, lang)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>{isBn ? 'গ্রহীতা' : 'Paid To'}:</span>
                  <span>{expenseToDelete.paidTo || '—'}</span>
                </div>
                <p className="pt-1 text-rose-700 text-[11px]">
                  {isBn
                    ? '⚠ এই খরচটি মুছে ফেলার সাথে সাথে খরচ বাবদ কর্তনকৃত টাকা সংশ্লিষ্ট অ্যাকাউন্টে ফিরিয়ে দেওয়া হবে।'
                    : '⚠ Deleting this expense will restore the spent amount back to the source account.'}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                disabled={isDeletingExpense}
                onClick={() => setExpenseToDelete(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                {isBn ? 'Cancel (বাতিল)' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isDeletingExpense}
                onClick={() => {
                  setIsDeletingExpense(true);
                  try {
                    deleteExpense(expenseToDelete.id);
                    setExpenseToDelete(null);
                  } finally {
                    setIsDeletingExpense(false);
                  }
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingExpense ? (isBn ? 'মুছে ফেলা হচ্ছে...' : 'Deleting...') : (isBn ? 'Delete Expense (মুছে ফেলুন)' : 'Delete Expense')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
