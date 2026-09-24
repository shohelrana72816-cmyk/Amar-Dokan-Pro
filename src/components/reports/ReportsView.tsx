import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate, exportToCSV, toBnNumber } from '../../utils/formatters';
import {
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  PieChart,
  Boxes,
  Users,
  Building,
  Printer,
  FileSpreadsheet,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { sales, purchases, expenses, products, customers, suppliers, settings } = useApp();
  const isBn = settings.language === 'bn';
  const lang = settings.language;

  const [dateRange, setDateRange] = useState<'today' | '7days' | 'month' | 'year' | 'all'>('month');
  const [reportTab, setReportTab] = useState<'pnl' | 'sales' | 'products' | 'expenses' | 'dues'>('pnl');

  // Filter by Date Range
  const now = new Date();
  const getFilterDate = () => {
    if (dateRange === 'today') {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (dateRange === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return d;
    } else if (dateRange === 'month') {
      return new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (dateRange === 'year') {
      return new Date(now.getFullYear(), 0, 1);
    }
    return new Date(2000, 0, 1); // all
  };

  const filterDate = getFilterDate();

  const filteredSales = useMemo(() => {
    return sales.filter(s => new Date(s.date) >= filterDate);
  }, [sales, filterDate]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => new Date(p.date) >= filterDate);
  }, [purchases, filterDate]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => new Date(e.date) >= filterDate);
  }, [expenses, filterDate]);

  // Financial Metrics
  const totalSalesRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);

  // Cost of Goods Sold (COGS)
  const totalCOGS = filteredSales.reduce((sum, s) => {
    const saleCost = s.items.reduce((itemSum, item) => itemSum + (item.purchasePrice * item.quantity), 0);
    return sum + saleCost;
  }, 0);

  const grossProfit = Math.max(0, totalSalesRevenue - totalCOGS);
  const totalExpensesAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossProfit - totalExpensesAmount;

  // Stock Valuation
  const stockCostValue = products.reduce((sum, p) => sum + (p.currentStock * p.purchasePrice), 0);
  const stockSaleValue = products.reduce((sum, p) => sum + (p.currentStock * p.salePrice), 0);

  // Customer & Supplier Dues
  const totalCustomerDue = customers.reduce((sum, c) => sum + c.currentDue, 0);
  const totalSupplierDue = suppliers.reduce((sum, s) => sum + s.currentDue, 0);

  // Product-wise sales breakdown
  const productSalesMap = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number; profit: number }>();
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const existing = map.get(item.productId) || { name: item.productName, qty: 0, revenue: 0, profit: 0 };
        const itemProfit = item.total - (item.purchasePrice * item.quantity);
        map.set(item.productId, {
          name: item.productName,
          qty: existing.qty + item.quantity,
          revenue: existing.revenue + item.total,
          profit: existing.profit + itemProfit,
        });
      });
    });
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [filteredSales]);

  // Category-wise Expense breakdown
  const categoryExpenseMap = useMemo(() => {
    const map = new Map<string, number>();
    filteredExpenses.forEach(e => {
      map.set(e.category, (map.get(e.category) || 0) + e.amount);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [filteredExpenses]);

  // Export handler
  const handleExportCSV = () => {
    if (reportTab === 'pnl') {
      const rows = [
        ['Financial Profit & Loss Statement'],
        ['Generated Date', new Date().toLocaleString()],
        ['Period', dateRange],
        [''],
        ['Metric', 'Amount (BDT)'],
        ['Total Sales Revenue', totalSalesRevenue],
        ['Cost of Goods Sold (COGS)', totalCOGS],
        ['Gross Profit', grossProfit],
        ['Total Operating Expenses', totalExpensesAmount],
        ['Net Profit', netProfit],
        [''],
        ['Total Customer Due Outstanding', totalCustomerDue],
        ['Total Supplier Due Payable', totalSupplierDue],
        ['Inventory Cost Valuation', stockCostValue],
        ['Inventory Retail Valuation', stockSaleValue],
      ];
      exportToCSV(`amar-dokan-pnl-${Date.now()}`, rows);
    } else if (reportTab === 'products') {
      const rows = [
        ['Product-wise Sales & Profit Report'],
        ['Product Name', 'Sold Quantity', 'Revenue Generated', 'Net Profit Margin'],
        ...productSalesMap.map(p => [p.name, p.qty, p.revenue, p.profit]),
      ];
      exportToCSV(`amar-dokan-product-sales-${Date.now()}`, rows);
    } else if (reportTab === 'expenses') {
      const rows = [
        ['Expense Category Breakdown'],
        ['Category', 'Total Spent'],
        ...categoryExpenseMap.map(([cat, amt]) => [cat, amt]),
      ];
      exportToCSV(`amar-dokan-expenses-${Date.now()}`, rows);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Range Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <span>{isBn ? 'ব্যবসায়িক লাভ-ক্ষতি ও সার্বিক রিপোর্ট' : 'Profit/Loss & Financial Reports'}</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            {isBn ? 'স্বয়ংক্রিয় প্রফিট ক্যালকুলেশন, বিক্রয় ও খরচের রিপোর্ট' : 'Automated P&L accounting, sales & inventory analytics'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Date Range Selector */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg">
            <button
              onClick={() => setDateRange('today')}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                dateRange === 'today' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              {isBn ? 'আজ' : 'Today'}
            </button>
            <button
              onClick={() => setDateRange('7days')}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                dateRange === '7days' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              {isBn ? '৭ দিন' : '7 Days'}
            </button>
            <button
              onClick={() => setDateRange('month')}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                dateRange === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              {isBn ? 'চলতি মাস' : 'This Month'}
            </button>
            <button
              onClick={() => setDateRange('year')}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                dateRange === 'year' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              {isBn ? 'চলতি বছর' : 'This Year'}
            </button>
            <button
              onClick={() => setDateRange('all')}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                dateRange === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              {isBn ? 'সব সময়' : 'All Time'}
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>{isBn ? 'CSV ডাউনলোড' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* P&L Key Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs text-slate-500 block">{isBn ? 'মোট বিক্রয় রাজস্ব' : 'Total Revenue'}</span>
          <span className="text-xl md:text-2xl font-bold font-mono-num text-slate-900 mt-1 block">
            {formatCurrency(totalSalesRevenue, lang)}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {toBnNumber(filteredSales.length)} {isBn ? 'টি বিক্রয় ইনভয়েস' : 'orders'}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs text-slate-500 block">{isBn ? 'পণ্য ক্রয়মূল্য (COGS)' : 'Cost of Goods Sold'}</span>
          <span className="text-xl md:text-2xl font-bold font-mono-num text-slate-700 mt-1 block">
            {formatCurrency(totalCOGS, lang)}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {isBn ? 'বিক্রিত পণ্যের আসল ক্রয় খরচ' : 'Cost of sold items'}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs text-slate-500 block">{isBn ? 'মোট খরচ (Operating Expense)' : 'Total Expenses'}</span>
          <span className="text-xl md:text-2xl font-bold font-mono-num text-rose-700 mt-1 block">
            {formatCurrency(totalExpensesAmount, lang)}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {toBnNumber(filteredExpenses.length)} {isBn ? 'টি খরচ এন্ট্রি' : 'expense entries'}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-xs">
          <span className="text-xs text-emerald-800 font-semibold block">
            {isBn ? 'খাঁটি নিট লাভ (Net Profit)' : 'Net Profit'}
          </span>
          <span className={`text-xl md:text-2xl font-bold font-mono-num mt-1 block ${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {formatCurrency(netProfit, lang)}
          </span>
          <span className="text-[11px] text-emerald-600 mt-0.5 block">
            {isBn ? 'গ্রস লাভ - মোট খরচ' : 'Gross Margin - Operating Costs'}
          </span>
        </div>
      </div>

      {/* Sub Tab Navigation */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 text-xs font-semibold">
        <button
          onClick={() => setReportTab('pnl')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            reportTab === 'pnl' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {isBn ? 'লাভ-ক্ষতির বিস্তারিত বিবরণী' : 'P&L Statement'}
        </button>
        <button
          onClick={() => setReportTab('products')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            reportTab === 'products' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {isBn ? 'পণ্যভিত্তিক বিক্রি ও লাভ' : 'Product-wise Sales'}
        </button>
        <button
          onClick={() => setReportTab('expenses')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            reportTab === 'expenses' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {isBn ? 'খরচের খাতভিত্তিক বিশ্লেষণ' : 'Expense Breakdown'}
        </button>
        <button
          onClick={() => setReportTab('dues')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            reportTab === 'dues' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {isBn ? 'বকেয়া ও পাওনা স্থিতি' : 'Due & Balance Sheet'}
        </button>
      </div>

      {/* Report Tab Contents */}
      {reportTab === 'pnl' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 max-w-2xl mx-auto space-y-4 text-xs">
          <div className="text-center pb-3 border-b border-slate-200">
            <h3 className="text-base font-bold text-slate-900">{settings.shopName}</h3>
            <p className="text-slate-500">{isBn ? 'লাভ-ক্ষতি ও আর্থিক খতিয়ান (Profit & Loss Statement)' : 'Income Statement'}</p>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              {isBn ? 'মেয়াদ:' : 'Period:'} {dateRange.toUpperCase()} · {formatDate(now.toISOString(), lang)}
            </p>
          </div>

          <div className="divide-y divide-slate-100 space-y-2">
            {/* Revenue */}
            <div className="pt-2">
              <div className="flex justify-between font-bold text-slate-900 text-sm py-1">
                <span>১. মোট বিক্রয় রাজস্ব (Sales Revenue):</span>
                <span className="font-mono-num">{formatCurrency(totalSalesRevenue, lang)}</span>
              </div>
            </div>

            {/* Cost of Goods Sold */}
            <div className="pt-2">
              <div className="flex justify-between text-slate-700 py-1">
                <span>২. বাদ: বিক্রিত পণ্যের ক্রয়মূল্য (Cost of Goods Sold - COGS):</span>
                <span className="font-mono-num font-semibold text-rose-700">-{formatCurrency(totalCOGS, lang)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 py-1.5 bg-slate-50 px-2 rounded">
                <span>মোট গ্রস লাভ (Gross Profit):</span>
                <span className="font-mono-num text-emerald-800 text-sm">{formatCurrency(grossProfit, lang)}</span>
              </div>
            </div>

            {/* Operating Expenses */}
            <div className="pt-2 space-y-1">
              <span className="font-semibold text-slate-800 block">৩. পরিচালন ব্যয়সমূহ (Operating Expenses):</span>
              {categoryExpenseMap.map(([cat, amt]) => (
                <div key={cat} className="flex justify-between text-slate-600 pl-4 py-0.5">
                  <span>{cat}</span>
                  <span className="font-mono-num">-{formatCurrency(amt, lang)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-slate-800 pt-1 border-t border-slate-200">
                <span>মোট খরচ (Total Operating Expenses):</span>
                <span className="font-mono-num text-rose-700">-{formatCurrency(totalExpensesAmount, lang)}</span>
              </div>
            </div>

            {/* Net Profit */}
            <div className="pt-3">
              <div className="flex justify-between font-bold text-base text-slate-900 bg-emerald-50/80 p-3 rounded-xl border border-emerald-200">
                <span>সর্বমোট নিট লাভ (Net Profit):</span>
                <span className={`font-mono-num ${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {formatCurrency(netProfit, lang)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {reportTab === 'products' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">{isBn ? 'পণ্যের নাম' : 'Product'}</th>
                <th className="px-4 py-3 font-semibold text-center">{isBn ? 'বিক্রিত পরিমাণ' : 'Sold Qty'}</th>
                <th className="px-4 py-3 font-semibold text-right">{isBn ? 'মোট বিক্রয় আয়' : 'Revenue'}</th>
                <th className="px-4 py-3 font-semibold text-right">{isBn ? 'মোট অর্জিত লাভ' : 'Net Margin'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productSalesMap.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900">{p.name}</td>
                  <td className="px-4 py-3 text-center font-mono-num font-bold text-slate-800">{toBnNumber(p.qty)}</td>
                  <td className="px-4 py-3 text-right font-mono-num text-slate-900 font-semibold">{formatCurrency(p.revenue, lang)}</td>
                  <td className="px-4 py-3 text-right font-mono-num font-bold text-emerald-700">{formatCurrency(p.profit, lang)}</td>
                </tr>
              ))}
              {productSalesMap.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400 text-xs">
                    {isBn ? 'নির্বাচিত মেয়াদে কোনো বিক্রয় তথ্য পাওয়া যায়নি।' : 'No sales records in selected range.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {reportTab === 'expenses' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">{isBn ? 'খরচের খাত / ক্যাটাগরি' : 'Category'}</th>
                <th className="px-4 py-3 font-semibold text-right">{isBn ? 'খরচের পরিমাণ (টাকা)' : 'Total Spent'}</th>
                <th className="px-4 py-3 font-semibold text-right">{isBn ? 'শতকরা অনুপাত' : 'Percentage'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categoryExpenseMap.map(([cat, amt], idx) => {
                const pct = totalExpensesAmount > 0 ? Math.round((amt / totalExpensesAmount) * 100) : 0;
                return (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">{cat}</td>
                    <td className="px-4 py-3 text-right font-mono-num font-bold text-rose-700">{formatCurrency(amt, lang)}</td>
                    <td className="px-4 py-3 text-right font-mono-num text-slate-600">{toBnNumber(pct)}%</td>
                  </tr>
                );
              })}
              {categoryExpenseMap.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-slate-400 text-xs">
                    {isBn ? 'নির্বাচিত মেয়াদে কোনো খরচ এন্ট্রি নেই।' : 'No expenses in selected range.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {reportTab === 'dues' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="font-bold text-slate-900 text-xs">{isBn ? 'কাস্টমার বকেয়া (Receivable Due)' : 'Customer Due'}</span>
              <span className="font-bold font-mono-num text-amber-800 text-sm">{formatCurrency(totalCustomerDue, lang)}</span>
            </div>
            <div className="divide-y max-h-60 overflow-y-auto text-xs">
              {customers.filter(c => c.currentDue > 0).map(c => (
                <div key={c.id} className="py-2 flex justify-between">
                  <span className="text-slate-800 font-medium">{c.name}</span>
                  <span className="font-mono-num font-bold text-amber-800">{formatCurrency(c.currentDue, lang)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="font-bold text-slate-900 text-xs">{isBn ? 'সাপ্লায়ার পাওনা (Payable Due)' : 'Supplier Due'}</span>
              <span className="font-bold font-mono-num text-rose-800 text-sm">{formatCurrency(totalSupplierDue, lang)}</span>
            </div>
            <div className="divide-y max-h-60 overflow-y-auto text-xs">
              {suppliers.filter(s => s.currentDue > 0).map(s => (
                <div key={s.id} className="py-2 flex justify-between">
                  <span className="text-slate-800 font-medium">{s.company}</span>
                  <span className="font-mono-num font-bold text-rose-800">{formatCurrency(s.currentDue, lang)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
