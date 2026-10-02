import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, ProductVariant, SaleItem, PaymentMethod, Sale, SalePayment } from '../../types';
import { formatCurrency, toBnNumber } from '../../utils/formatters';
import { InvoiceModal } from './InvoiceModal';
import {
  Search,
  Barcode,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  UserPlus,
  CreditCard,
  X,
  Layers,
  Banknote,
  Smartphone,
  Landmark,
} from 'lucide-react';

export const POSView: React.FC = () => {
  const { products, categories: appCategories, customers, addCustomer, recordSale, settings, activeBranchId, currentUserRole } = useApp();
  const isBn = false;
  const lang = settings.language;

  // Active products only (excluding soft-deleted)
  const activeProducts = useMemo(() => {
    return products.filter(p => p.isActive !== false);
  }, [products]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [barcodeInput, setBarcodeInput] = useState('');

  // Cart
  const [cart, setCart] = useState<SaleItem[]>([]);

  // Customer
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustMobile, setNewCustMobile] = useState('');

  // Bill & Payment
  const [orderDiscount, setOrderDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [tenderedAmount, setTenderedAmount] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);

  // Mixed Payment Split Inputs
  const [mixedCash, setMixedCash] = useState<number | ''>('');
  const [mixedBkash, setMixedBkash] = useState<number | ''>('');
  const [mixedNagad, setMixedNagad] = useState<number | ''>('');
  const [mixedBank, setMixedBank] = useState<number | ''>('');

  // Variant Modal
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);

  // Completed Invoice Modal
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Categories extraction (unified from appCategories and active products)
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    appCategories.forEach(c => c.name && set.add(c.name));
    activeProducts.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [appCategories, activeProducts]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return activeProducts.filter(p => {
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.variants && p.variants.some(v => v.sku.toLowerCase().includes(q)));

      const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;

      return matchSearch && matchCategory;
    });
  }, [activeProducts, searchQuery, selectedCategory]);

  // Handle Barcode Scan & SKU direct search
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = barcodeInput.trim();
    if (!query) return;

    // 1. Direct match on product barcode or SKU
    const matchedProduct = activeProducts.find(
      p => p.barcode === query || p.code.toLowerCase() === query.toLowerCase()
    );

    if (matchedProduct) {
      if (matchedProduct.hasVariants && matchedProduct.variants && matchedProduct.variants.length > 0) {
        setVariantProduct(matchedProduct);
      } else {
        addToCart(matchedProduct);
      }
      setBarcodeInput('');
      return;
    }

    // 2. Direct match on variant SKU or barcode
    for (const prod of activeProducts) {
      if (prod.hasVariants && prod.variants) {
        const matchedVariant = prod.variants.find(
          v => v.sku.toLowerCase() === query.toLowerCase() || (v as any).barcode === query
        );
        if (matchedVariant) {
          addToCart(prod, matchedVariant);
          setBarcodeInput('');
          return;
        }
      }
    }

    alert(
      `No active product found with barcode or SKU '${query}'`
    );
  };

  // Add Product to Cart
  const addToCart = (product: Product, variant?: ProductVariant) => {
    const availableStock = variant ? variant.stock : product.currentStock;
    if (availableStock <= 0) {
      alert('This product is currently out of stock!');
      return;
    }

    setCart(prev => {
      const existingIndex = prev.findIndex(item =>
        item.productId === product.id && (variant ? item.variantId === variant.id : !item.variantId)
      );

      if (existingIndex > -1) {
        const item = prev[existingIndex];
        if (item.quantity >= availableStock) {
          alert(`Only ${availableStock} available in stock!`);
          return prev;
        }
        const updated = [...prev];
        const newQty = item.quantity + 1;
        updated[existingIndex] = {
          ...item,
          quantity: newQty,
          total: (newQty * item.unitPrice) - item.discount,
        };
        return updated;
      }

      const unitPrice = variant?.additionalPrice ? product.salePrice + variant.additionalPrice : product.salePrice;
      const newItem: SaleItem = {
        productId: product.id,
        productName: product.name,
        sku: variant ? variant.sku : product.code,
        unitPrice,
        purchasePrice: product.purchasePrice,
        quantity: 1,
        discount: 0,
        total: unitPrice,
        variantId: variant?.id,
        variantDetails: variant ? `${variant.color || ''} ${variant.size || ''}`.trim() : undefined,
      };

      return [...prev, newItem];
    });

    setVariantProduct(null);
  };

  // Update Cart Item Quantity
  const updateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }

    setCart(prev => {
      const updated = [...prev];
      const item = updated[index];
      const prod = activeProducts.find(p => p.id === item.productId);
      const maxStock = item.variantId && prod?.variants
        ? (prod.variants.find(v => v.id === item.variantId)?.stock || 0)
        : (prod?.currentStock || 0);

      if (newQty > maxStock) {
        alert(`Only ${maxStock} items available in stock!`);
        return prev;
      }

      updated[index] = {
        ...item,
        quantity: newQty,
        total: (newQty * item.unitPrice) - item.discount,
      };
      return updated;
    });
  };

  // Remove Item
  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  // Clear Cart
  const clearCart = () => {
    if (cart.length === 0) return;
    if (confirm('Clear shopping cart?')) {
      setCart([]);
      setOrderDiscount(0);
      setTenderedAmount('');
      setMixedCash('');
      setMixedBkash('');
      setMixedNagad('');
      setMixedBank('');
    }
  };

  // Bill Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const itemsDiscount = cart.reduce((sum, item) => sum + item.discount, 0);
  const totalDiscount = itemsDiscount + (orderDiscount || 0);
  const taxableAmount = Math.max(0, subtotal - totalDiscount);
  const vatTaxRate = settings.vatTaxRate || 0;
  const vatTaxAmount = Math.round((taxableAmount * vatTaxRate) / 100);
  const grandTotal = Math.max(0, taxableAmount + vatTaxAmount);

  // Mixed Payment Total
  const mixedTotal = (Number(mixedCash) || 0) + (Number(mixedBkash) || 0) + (Number(mixedNagad) || 0) + (Number(mixedBank) || 0);

  // Paid & Due amounts
  let effectivePaid = 0;
  if (paymentMethod === 'due') {
    effectivePaid = 0;
  } else if (paymentMethod === 'mixed') {
    effectivePaid = mixedTotal;
  } else {
    effectivePaid = tenderedAmount === '' ? grandTotal : Number(tenderedAmount);
  }

  const changeReturn = effectivePaid > grandTotal ? effectivePaid - grandTotal : 0;
  const dueAmount = effectivePaid < grandTotal ? grandTotal - effectivePaid : 0;

  // Selected Customer details
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  // Complete Sale
  const handleCompleteSale = () => {
    if (isSubmittingSale) return;
    if (cart.length === 0) {
      alert('Cart is empty!');
      return;
    }

    if (dueAmount > 0 && !selectedCustomerId) {
      alert('Customer selection required for due/credit sales!');
      return;
    }

    setIsSubmittingSale(true);

    try {
      // Build Payments array
      const payments: SalePayment[] = [];
      const actualPaid = Math.min(effectivePaid, grandTotal);

      if (paymentMethod === 'mixed') {
        const cashAmt = Number(mixedCash) || 0;
        const bkashAmt = Number(mixedBkash) || 0;
        const nagadAmt = Number(mixedNagad) || 0;
        const bankAmt = Number(mixedBank) || 0;

        if (cashAmt > 0) payments.push({ method: 'cash', amount: cashAmt, accountId: 'acc-cash', accountName: 'Cash in Hand' });
        if (bkashAmt > 0) payments.push({ method: 'bkash', amount: bkashAmt, accountId: 'acc-bkash', accountName: 'bKash Merchant' });
        if (nagadAmt > 0) payments.push({ method: 'nagad', amount: nagadAmt, accountId: 'acc-nagad', accountName: 'Nagad Account' });
        if (bankAmt > 0) payments.push({ method: 'bank', amount: bankAmt, accountId: 'acc-islami', accountName: 'Bank Account' });
      } else if (paymentMethod !== 'due') {
        payments.push({
          method: paymentMethod,
          amount: actualPaid,
        });
      }

      const saleRecord = recordSale({
        customerId: selectedCustomer?.id,
        customerName: selectedCustomer ? selectedCustomer.name : ('Walk-in Customer'),
        customerMobile: selectedCustomer?.mobile || '',
        items: cart,
        subtotal,
        discount: totalDiscount,
        vatTaxRate,
        vatTaxAmount,
        total: grandTotal,
        paid: actualPaid,
        due: dueAmount,
        paymentMethod,
        payments,
        servedBy: currentUserRole,
        branchId: activeBranchId,
        notes,
      });

      // Reset Form
      setCart([]);
      setOrderDiscount(0);
      setTenderedAmount('');
      setMixedCash('');
      setMixedBkash('');
      setMixedNagad('');
      setMixedBank('');
      setSelectedCustomerId('');
      setNotes('');

      // Open Invoice
      setCompletedSale(saleRecord);
    } finally {
      setIsSubmittingSale(false);
    }
  };

  // Quick Customer Creation
  const handleQuickAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    const created = addCustomer({
      name: newCustName.trim(),
      mobile: newCustMobile.trim(),
      customerType: 'retail',
      creditLimit: 10000,
    });

    setSelectedCustomerId(created.id);
    setNewCustName('');
    setNewCustMobile('');
    setShowAddCustomerModal(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-5.5rem)]">
      {/* Left Column: Product Search, Category Filters, & Product Grid (7 cols) */}
      <div className="lg:col-span-7 flex flex-col bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Search & Barcode Header */}
        <div className="p-3 border-b border-slate-200 bg-slate-50/70 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Product Name Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={'Search by name, SKU or brand...'}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Direct Barcode Scanner Input */}
            <form onSubmit={handleBarcodeSubmit} className="relative flex">
              <Barcode className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder={'Scan / enter barcode...'}
                className="w-full pl-9 pr-14 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
              />
              <button
                type="submit"
                className="absolute right-1 top-1 bottom-1 px-2.5 bg-slate-800 text-white text-[10px] font-semibold rounded-md hover:bg-slate-900 transition-colors"
              >
                {'Enter'}
              </button>
            </form>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-md whitespace-nowrap transition-colors font-medium ${
                selectedCategory === 'all'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {'All Items'}
            </button>
            {allCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-md whitespace-nowrap transition-colors font-medium ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 content-start">
          {filteredProducts.map(product => {
            const isOutOfStock = product.currentStock <= 0;
            const isLowStock = product.currentStock > 0 && product.currentStock <= product.minStockAlert;

            return (
              <div
                key={product.id}
                onClick={() => {
                  if (isOutOfStock) return;
                  if (product.hasVariants && product.variants && product.variants.length > 0) {
                    setVariantProduct(product);
                  } else {
                    addToCart(product);
                  }
                }}
                className={`flex flex-col justify-between p-3 rounded-xl border text-left transition-all ${
                  isOutOfStock
                    ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                    : 'bg-white border-slate-200 hover:border-emerald-500 hover:shadow-xs cursor-pointer active:scale-[0.98]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className="text-[10px] text-slate-600 font-mono truncate">
                      {product.code}
                    </span>
                    {product.hasVariants && (
                      <span className="text-[9px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-sm">
                        {'Variants'}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-semibold text-slate-900 line-clamp-2 leading-tight">
                    {product.name}
                  </h4>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 flex items-end justify-between">
                  <div>
                    <span className="text-xs font-bold text-emerald-700 font-mono-num block">
                      {formatCurrency(product.salePrice, lang)}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                      isOutOfStock
                        ? 'bg-rose-100 text-rose-800'
                        : isLowStock
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {isOutOfStock
                      ? ('Out')
                      : `${'Stock:'} ${toBnNumber(product.currentStock)}`}
                  </span>
                </div>
              </div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 text-xs">
              {'No products match your search.'}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Active Cart, Customer Selection & Checkout Summary (5 cols) */}
      <div className="lg:col-span-5 flex flex-col bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Cart Header & Customer Selector */}
        <div className="p-3 border-b border-slate-200 bg-slate-50/70 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                {'Active Cart'} ({toBnNumber(cart.length)})
              </h3>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[11px] font-medium text-rose-600 hover:text-rose-700 transition-colors"
              >
                {'Clear'}
              </button>
            )}
          </div>

          {/* Customer Selection Row */}
          <div className="flex items-center gap-1.5">
            <div className="flex-1 relative">
              <select
                aria-label={'Select Customer'}
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full text-xs py-1.5 px-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-slate-800"
              >
                <option value="">{'Walk-in Customer (Cash)'}</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.currentDue > 0 ? `(Due: ৳${c.currentDue})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowAddCustomerModal(true)}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition-colors"
              title={'Add new customer'}
            >
              <UserPlus className="w-4 h-4" />
            </button>
          </div>

          {/* Customer Due Alert if customer has past due */}
          {selectedCustomer && selectedCustomer.currentDue > 0 && (
            <div className="text-[11px] bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1 text-amber-800 flex items-center justify-between">
              <span>{'Previous Due:'}</span>
              <span className="font-bold font-mono-num">{formatCurrency(selectedCustomer.currentDue, lang)}</span>
            </div>
          )}
        </div>

        {/* Cart Item Table */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {cart.map((item, idx) => (
            <div
              key={`${item.productId}-${item.variantId || 'base'}-${idx}`}
              className="p-2 bg-slate-50/70 border border-slate-200 rounded-lg text-xs flex items-center justify-between gap-2"
            >
              <div className="flex-1 min-w-0">
                <h5 className="font-semibold text-slate-900 truncate leading-tight">
                  {item.productName}
                </h5>
                <div className="text-[10px] text-slate-600 flex items-center gap-2 mt-0.5">
                  {item.variantDetails && (
                    <span className="text-blue-700 font-medium">{item.variantDetails}</span>
                  )}
                  <span>@{formatCurrency(item.unitPrice, lang)}</span>
                  {item.discount > 0 && (
                    <span className="text-emerald-600">Discount: -৳{item.discount}</span>
                  )}
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => updateQuantity(idx, item.quantity - 1)}
                  className="w-5 h-5 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-6 text-center font-bold font-mono-num text-xs">
                  {toBnNumber(item.quantity)}
                </span>
                <button
                  onClick={() => updateQuantity(idx, item.quantity + 1)}
                  className="w-5 h-5 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Line Total & Remove */}
              <div className="text-right pl-2">
                <span className="font-bold font-mono-num text-slate-900 block">
                  {formatCurrency(item.total, lang)}
                </span>
                <button
                  onClick={() => removeFromCart(idx)}
                  className="text-rose-500 hover:text-rose-700 p-0.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {cart.length === 0 && (
            <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
              <ShoppingCart className="w-8 h-8 text-slate-300" />
              <span>{'Cart is empty. Select products.'}</span>
            </div>
          )}
        </div>

        {/* Bill Summary & Payment Section */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 space-y-2 text-xs">
          {/* Subtotal, Discount & Tax */}
          <div className="space-y-1 text-slate-600 pb-2 border-b border-slate-200">
            <div className="flex justify-between">
              <span>{'Subtotal'}:</span>
              <span className="font-mono-num font-semibold text-slate-800">{formatCurrency(subtotal, lang)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span>{'Discount (৳)'}:</span>
              <input
                type="number"
                min="0"
                value={orderDiscount || ''}
                onChange={(e) => setOrderDiscount(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-20 text-right py-0.5 px-1.5 border border-slate-200 rounded bg-white font-mono-num text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {vatTaxRate > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>{`VAT/Tax (${vatTaxRate}%)`}:</span>
                <span className="font-mono-num">+{formatCurrency(vatTaxAmount, lang)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
              <span>{'Grand Total'}:</span>
              <span className="font-mono-num text-emerald-700 text-base">{formatCurrency(grandTotal, lang)}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <span className="text-[11px] font-semibold text-slate-700 block mb-1">
              {'Payment Method'}
            </span>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1">
              {(['cash', 'bkash', 'nagad', 'bank', 'due', 'mixed'] as PaymentMethod[]).map(method => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`py-1 text-[11px] font-medium rounded-md border capitalize transition-colors ${
                    paymentMethod === method
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {method === 'due'
                    ? ('Due')
                    : method === 'mixed'
                    ? ('Mixed')
                    : method}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Inputs for Single vs Mixed */}
          {paymentMethod === 'mixed' ? (
            /* Mixed Split Payment Inputs */
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-2.5 space-y-2 text-xs">
              <span className="text-[11px] font-bold text-emerald-900 block">
                {'Split / Mixed Payment Breakdown:'}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-600 font-medium block">
                    {'Cash (৳)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={mixedCash}
                    onChange={(e) => setMixedCash(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full py-1 px-2 border border-slate-200 rounded bg-white font-mono-num font-semibold text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 font-medium block">
                    {'bKash (৳)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={mixedBkash}
                    onChange={(e) => setMixedBkash(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full py-1 px-2 border border-slate-200 rounded bg-white font-mono-num font-semibold text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 font-medium block">
                    {'Nagad (৳)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={mixedNagad}
                    onChange={(e) => setMixedNagad(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full py-1 px-2 border border-slate-200 rounded bg-white font-mono-num font-semibold text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 font-medium block">
                    {'Bank / Card (৳)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={mixedBank}
                    onChange={(e) => setMixedBank(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full py-1 px-2 border border-slate-200 rounded bg-white font-mono-num font-semibold text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-between font-bold pt-1 border-t border-emerald-200 text-xs">
                <span>{'Total Received:'}</span>
                <span className="font-mono-num text-emerald-800">{formatCurrency(mixedTotal, lang)}</span>
              </div>
            </div>
          ) : paymentMethod !== 'due' ? (
            /* Single Tendered Input & Quick Cash Buttons */
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-slate-700">
                  {'Tendered'}:
                </span>
                <input
                  type="number"
                  value={tenderedAmount}
                  onChange={(e) => setTenderedAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder={grandTotal.toString()}
                  className="w-28 text-right py-1 px-2 border border-slate-200 rounded-md bg-white font-mono-num font-bold text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Quick Cash Buttons */}
              <div className="flex items-center gap-1 justify-end">
                {[500, 1000, 2000, 5000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTenderedAmount(amt)}
                    className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded text-[10px] font-mono-num font-medium transition-colors"
                  >
                    ৳{amt}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* Change & Due Display */}
          {changeReturn > 0 && (
            <div className="flex justify-between text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded">
              <span>{'Change Return:'}</span>
              <span className="font-mono-num">{formatCurrency(changeReturn, lang)}</span>
            </div>
          )}
          {dueAmount > 0 && (
            <div className="flex justify-between text-xs font-bold text-rose-700 bg-rose-50 px-2 py-1 rounded">
              <span>{'Pending Due:'}</span>
              <span className="font-mono-num">{formatCurrency(dueAmount, lang)}</span>
            </div>
          )}

          {/* Checkout Button with Double-Submission Prevention */}
          <button
            onClick={handleCompleteSale}
            disabled={cart.length === 0 || isSubmittingSale}
            className={`w-full py-2.5 rounded-lg text-xs md:text-sm font-bold text-white shadow-xs transition-all flex items-center justify-center gap-2 ${
              cart.length === 0 || isSubmittingSale
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99]'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>
              {isSubmittingSale
                ? ('Processing...')
                : 'Complete Sale & Print'}
              {grandTotal > 0 && ` (${formatCurrency(grandTotal, lang)})`}
            </span>
          </button>
        </div>
      </div>

      {/* Clothing Variant Selector Modal */}
      {variantProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="font-bold text-sm text-slate-900">{variantProduct.name}</h3>
                <span className="text-xs text-slate-500">{'Select Variant'}</span>
              </div>
              <button
                type="button"
                onClick={() => setVariantProduct(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {variantProduct.variants?.map(v => {
                const isOut = v.stock <= 0;
                return (
                  <button
                    key={v.id}
                    disabled={isOut}
                    onClick={() => addToCart(variantProduct, v)}
                    className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between text-xs transition-colors ${
                      isOut
                        ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                        : 'hover:border-emerald-500 hover:bg-emerald-50/50 border-slate-200'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-slate-800">
                        {v.color} - {v.size}
                      </span>
                      <span className="text-[10px] text-slate-500 block font-mono">{v.sku}</span>
                    </div>

                    <div className="text-right">
                      <span className="font-semibold text-emerald-700 block font-mono-num">
                        {formatCurrency(variantProduct.salePrice + (v.additionalPrice || 0), lang)}
                      </span>
                      <span className={`text-[10px] ${isOut ? 'text-rose-500' : 'text-slate-500'}`}>
                        {isOut ? ('Out') : `${'Stock:'} ${toBnNumber(v.stock)}`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <form
            onSubmit={handleQuickAddCustomer}
            className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900">
                {'Quick Add Customer'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCustomerModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">{'Name *'}</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. John Doe / Customer Name"
                  className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">{'Mobile'}</label>
                <input
                  type="text"
                  value={newCustMobile}
                  onChange={(e) => setNewCustMobile(e.target.value)}
                  placeholder="017xxxxxxxx"
                  className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowAddCustomerModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                {'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
              >
                {'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Completed Invoice Modal */}
      {completedSale && (
        <InvoiceModal
          sale={completedSale}
          onClose={() => setCompletedSale(null)}
          settings={settings}
        />
      )}
    </div>
  );
};
