import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate, toBnNumber } from '../../utils/formatters';
import {
  TrendingUp,
  ShoppingBag,
  CreditCard,
  AlertTriangle,
  Users,
  Building,
  Wallet,
  Boxes,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  ShoppingCart,
  Receipt,
  Sparkles,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
  onOpenPOS: () => void;
  onOpenAddProduct: () => void;
  onOpenAddCustomer: () => void;
  onOpenNewPurchase: () => void;
  onOpenAddExpense: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenPOS,
  onOpenAddProduct,
  onOpenAddCustomer,
  onOpenNewPurchase,
  onOpenAddExpense,
}) => {
  const { settings, products, sales, purchases, expenses, customers, suppliers, accounts, currentUserRole } = useApp();
  const isBn = settings.language === 'bn';
  const lang = settings.language;

  // Filter Today's records (excluding voided and returned sales)
  const todayStr = new Date().toISOString().slice(0, 10);
  const todaySales = sales.filter(s => s.date.slice(0, 10) === todayStr && s.status !== 'voided' && s.status !== 'returned');
  const todayPurchases = purchases.filter(p => p.date.slice(0, 10) === todayStr);
  const todayExpenses = expenses.filter(e => e.date.slice(0, 10) === todayStr);

  const todaySalesTotal = todaySales.reduce((sum, s) => sum + s.total, 0);
  const todayPurchasesTotal = todayPurchases.reduce((sum, p) => sum + p.total, 0);
  const todayExpenseTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Calculate COGS (Cost of Goods Sold) for today's sales
  const todayCOGS = todaySales.reduce((sum, sale) => {
    const saleCost = sale.items.reduce((itemSum, item) => itemSum + (item.purchasePrice * item.quantity), 0);
    return sum + saleCost;
  }, 0);

  const todayGrossProfit = Math.max(0, todaySalesTotal - todayCOGS);
  const todayNetProfit = todayGrossProfit - todayExpenseTotal;

  // All time totals
  const totalCustomerDue = customers.reduce((sum, c) => sum + c.currentDue, 0);
  const totalSupplierDue = suppliers.reduce((sum, s) => sum + s.currentDue, 0);
  const totalStockValue = products.reduce((sum, p) => sum + (p.currentStock * p.purchasePrice), 0);
  const totalRetailStockValue = products.reduce((sum, p) => sum + (p.currentStock * p.salePrice), 0);

  // Total Liquid Cash / Bank Balance
  const totalAccountBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  // Alerts
  const lowStockProducts = products.filter(p => p.currentStock > 0 && p.currentStock <= p.minStockAlert);
  const outOfStockProducts = products.filter(p => p.currentStock <= 0);
  const dueCustomers = customers.filter(c => c.currentDue > 0);

  const isEasyMode = settings.uiMode === 'easy';

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              {isBn ? `শুভ দিন, ${settings.shopName}` : `Welcome, ${settings.shopName}`}
            </h1>
            {isEasyMode && (
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                {isBn ? 'ইজি মোড' : 'Easy Mode'}
              </span>
            )}
          </div>
          <p className="text-xs md:text-sm text-slate-600 mt-1">
            {isBn
              ? `আজকের তারিখ: ${formatDate(new Date().toISOString(), 'bn')} · ব্যবসায়িক সংক্ষিপ্ত চিত্র`
              : `Today: ${formatDate(new Date().toISOString(), 'en')} · Business Overview`}
          </p>
        </div>

        {/* Quick Action Shortcut Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenPOS}
            className="flex items-center gap-1.5 px-3 py-2 text-xs md:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{isBn ? 'নতুন বিক্রি' : 'New Sale'}</span>
          </button>
          <button
            onClick={onOpenNewPurchase}
            className="flex items-center gap-1.5 px-3 py-2 text-xs md:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
          >
            <ShoppingBag className="w-4 h-4 text-slate-600" />
            <span>{isBn ? 'নতুন ক্রয়' : 'Purchase'}</span>
          </button>
          <button
            onClick={onOpenAddProduct}
            className="flex items-center gap-1.5 px-3 py-2 text-xs md:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
          >
            <Boxes className="w-4 h-4 text-slate-600" />
            <span>{isBn ? 'পণ্য যোগ' : 'Add Product'}</span>
          </button>
          <button
            onClick={onOpenAddCustomer}
            className="flex items-center gap-1.5 px-3 py-2 text-xs md:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
          >
            <Users className="w-4 h-4 text-slate-600" />
            <span>{isBn ? 'কাস্টমার' : 'Customer'}</span>
          </button>
          <button
            onClick={onOpenAddExpense}
            className="flex items-center gap-1.5 px-3 py-2 text-xs md:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
          >
            <Wallet className="w-4 h-4 text-slate-600" />
            <span>{isBn ? 'খরচ' : 'Expense'}</span>
          </button>
        </div>
      </div>

      {/* Today's Key Performance Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Today's Sales */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>{isBn ? 'আজকের বিক্রি' : "Today's Sales"}</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-lg md:text-2xl font-bold text-slate-900 font-mono-num">
            {formatCurrency(todaySalesTotal, lang)}
          </div>
          <div className="mt-1 text-[11px] text-slate-600 flex items-center gap-1">
            <span>{isBn ? `${toBnNumber(todaySales.length)} টি অর্ডার সম্পন্ন` : `${todaySales.length} orders completed`}</span>
          </div>
        </div>

        {/* Today's Purchases */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>{isBn ? 'আজকের ক্রয় (Purchase)' : "Today's Purchases"}</span>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <ShoppingBag className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-lg md:text-2xl font-bold text-slate-900 font-mono-num">
            {formatCurrency(todayPurchasesTotal, lang)}
          </div>
          <div className="mt-1 text-[11px] text-slate-600">
            {isBn ? `${toBnNumber(todayPurchases.length)} টি চালান` : `${todayPurchases.length} invoices`}
          </div>
        </div>

        {/* Today's Expense */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>{isBn ? 'আজকের খরচ' : "Today's Expenses"}</span>
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <ArrowDownRight className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-lg md:text-2xl font-bold text-slate-900 font-mono-num">
            {formatCurrency(todayExpenseTotal, lang)}
          </div>
          <div className="mt-1 text-[11px] text-slate-600">
            {isBn ? `${toBnNumber(todayExpenses.length)} টি এন্ট্রি` : `${todayExpenses.length} entries`}
          </div>
        </div>

        {/* Today's Profit (Hidden for Salesman role) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>{isBn ? 'আজকের আনুমানিক লাভ' : "Today's Net Profit"}</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-lg md:text-2xl font-bold text-emerald-600 font-mono-num">
            {currentUserRole === 'salesman' ? '•••' : formatCurrency(todayNetProfit, lang)}
          </div>
          <div className="mt-1 text-[11px] text-slate-600">
            {isBn ? 'বিক্রি - ক্রয়মূল্য - খরচ' : 'Revenue - COGS - Expenses'}
          </div>
        </div>
      </div>

      {/* Financial Health & Balances (Due, Cash, Stock) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {/* Customer Due */}
        <div
          onClick={() => onNavigate('customers')}
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>{isBn ? 'কাস্টমার বকেয়া (Due)' : 'Customer Due'}</span>
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-base md:text-xl font-bold text-amber-700 font-mono-num">
            {formatCurrency(totalCustomerDue, lang)}
          </div>
          <div className="mt-1 text-[11px] text-amber-600">
            {isBn ? `${toBnNumber(dueCustomers.length)} জনের কাছে বাকি` : `${dueCustomers.length} customers due`}
          </div>
        </div>

        {/* Supplier Due */}
        <div
          onClick={() => onNavigate('suppliers')}
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>{isBn ? 'মহাজন/সাপ্লায়ার পাওনা' : 'Supplier Due'}</span>
            <Building className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 text-base md:text-xl font-bold text-rose-700 font-mono-num">
            {formatCurrency(totalSupplierDue, lang)}
          </div>
          <div className="mt-1 text-[11px] text-slate-600">
            {isBn ? 'পরিশোধযোগ্য বকেয়া' : 'Payable liability'}
          </div>
        </div>

        {/* Stock Value */}
        <div
          onClick={() => onNavigate('inventory')}
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>{isBn ? 'বর্তমান স্টক মূল্য' : 'Stock Value'}</span>
            <Boxes className="w-4 h-4 text-slate-600" />
          </div>
          <div className="mt-2 text-base md:text-xl font-bold text-slate-900 font-mono-num">
            {formatCurrency(totalStockValue, lang)}
          </div>
          <div className="mt-1 text-[11px] text-slate-600">
            {isBn ? `বিক্রয়মূল্য: ${formatCurrency(totalRetailStockValue, lang)}` : `Retail: ${formatCurrency(totalRetailStockValue, lang)}`}
          </div>
        </div>

        {/* Cash & Bank Balance */}
        <div
          onClick={() => onNavigate('accounts')}
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>{isBn ? 'ক্যাশ ও ব্যাংক জমা' : 'Liquid Funds'}</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-base md:text-xl font-bold text-emerald-700 font-mono-num">
            {formatCurrency(totalAccountBalance, lang)}
          </div>
          <div className="mt-1 text-[11px] text-slate-600">
            {isBn ? 'ক্যাশ ড্রয়ার + বিকাশ + ব্যাংক' : 'Drawer + Mobile + Bank'}
          </div>
        </div>
      </div>

      {/* Critical Operational Alerts */}
      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-amber-900">
                {isBn ? 'স্টক সতর্কবার্তা (Stock Alert)' : 'Inventory Stock Alert'}
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                {isBn
                  ? `${toBnNumber(lowStockProducts.length)} টি পণ্যের স্টক কম এবং ${toBnNumber(outOfStockProducts.length)} টি পণ্য আউট অব স্টক রয়েছে। সময়মতো নতুন চালান রিসিভ করুন।`
                  : `${lowStockProducts.length} items low in stock and ${outOfStockProducts.length} items out of stock.`}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('inventory')}
            className="px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg border border-amber-300 self-start md:self-auto transition-colors whitespace-nowrap"
          >
            {isBn ? 'স্টক দেখুন' : 'View Stock'}
          </button>
        </div>
      )}

      {/* Recent Sales & Quick Ledger Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sales List (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                {isBn ? 'সাম্প্রতিক বিক্রয় ইনভয়েস' : 'Recent Invoices'}
              </h3>
            </div>
            <button
              onClick={() => onNavigate('sales')}
              className="text-xs font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              {isBn ? 'সব দেখুন →' : 'View All →'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-4 py-2.5 font-medium">{isBn ? 'ইনভয়েস নং' : 'Invoice #'}</th>
                  <th className="px-4 py-2.5 font-medium">{isBn ? 'কাস্টমার' : 'Customer'}</th>
                  <th className="px-4 py-2.5 font-medium">{isBn ? 'পেমেন্ট' : 'Payment'}</th>
                  <th className="px-4 py-2.5 font-medium text-right">{isBn ? 'মোট টাকা' : 'Total'}</th>
                  <th className="px-4 py-2.5 font-medium text-right">{isBn ? 'বাকি' : 'Due'}</th>
                  <th className="px-4 py-2.5 font-medium">{isBn ? 'অবস্থা' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.slice(0, 5).map(sale => (
                  <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-slate-900 whitespace-nowrap">
                      {sale.invoiceNumber}
                    </td>
                    <td className="px-4 py-3 text-slate-700 truncate max-w-[140px]">
                      {sale.customerName}
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-600">
                      {sale.paymentMethod}
                    </td>
                    <td className="px-4 py-3 text-right font-mono-num font-semibold text-slate-900">
                      {formatCurrency(sale.total, lang)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono-num text-amber-700">
                      {sale.due > 0 ? formatCurrency(sale.due, lang) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
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
                          ? (isBn ? 'সম্পূর্ণ বাকি' : 'Due')
                          : sale.status === 'partial'
                          ? (isBn ? 'আংশিক' : 'Partial')
                          : (isBn ? 'ফেরত' : 'Returned')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cash & Bank Balances Details (1 col) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  {isBn ? 'অ্যাকাউন্ট ব্যালেন্স' : 'Account Balances'}
                </h3>
              </div>
              <button
                onClick={() => onNavigate('accounts')}
                className="text-xs font-medium text-emerald-700 hover:underline"
              >
                {isBn ? 'বিস্তারিত' : 'Details'}
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {accounts.map(acc => (
                <div key={acc.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-medium text-slate-800 block truncate max-w-[150px]">
                      {acc.name}
                    </span>
                    {acc.accountNumber && (
                      <span className="text-[10px] text-slate-600 font-mono block">
                        {acc.accountNumber}
                      </span>
                    )}
                  </div>
                  <span className="font-mono-num font-semibold text-slate-900 text-sm">
                    {formatCurrency(acc.balance, lang)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
              <span>{isBn ? 'সর্বমোট নগদ স্থিতি:' : 'Total Liquid Balance:'}</span>
              <span className="font-mono-num text-emerald-700 text-base">
                {formatCurrency(totalAccountBalance, lang)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
