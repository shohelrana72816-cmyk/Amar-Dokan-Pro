import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, ProductVariant, BusinessType } from '../../types';
import { formatCurrency, toBnNumber } from '../../utils/formatters';
import {
  Package,
  Plus,
  Search,
  Filter,
  Barcode,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  Printer,
  Sparkles,
} from 'lucide-react';

interface ProductsViewProps {
  isAddModalOpen?: boolean;
  onCloseAddModal?: () => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({ isAddModalOpen: propIsAddModalOpen, onCloseAddModal: propOnCloseAddModal }) => {
  const { products, addProduct, updateProduct, deleteProduct, settings } = useApp();
  const isBn = settings.language === 'bn';
  const lang = settings.language;

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'normal' | 'low' | 'out'>('all');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(propIsAddModalOpen || false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [barcodeModalProduct, setBarcodeModalProduct] = useState<Product | null>(null);

  // Sync prop changes
  React.useEffect(() => {
    if (propIsAddModalOpen !== undefined) {
      setIsModalOpen(propIsAddModalOpen);
    }
  }, [propIsAddModalOpen]);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    if (propOnCloseAddModal) propOnCloseAddModal();
  };

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('Clothing');
  const [subcategory, setSubcategory] = useState('');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [purchasePrice, setPurchasePrice] = useState<number | ''>('');
  const [salePrice, setSalePrice] = useState<number | ''>('');
  const [wholesalePrice, setWholesalePrice] = useState<number | ''>('');
  const [currentStock, setCurrentStock] = useState<number | ''>('');
  const [minStockAlert, setMinStockAlert] = useState<number>(5);
  const [unit, setUnit] = useState('pcs');
  const [businessType, setBusinessType] = useState<BusinessType>(settings.businessType || 'clothing');

  // Clothing Variants
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<ProductVariant[]>([
    { id: 'v-1', color: 'Black', size: 'M', sku: '', stock: 5 },
    { id: 'v-2', color: 'Black', size: 'L', sku: '', stock: 5 },
  ]);

  // Electronics fields
  const [model, setModel] = useState('');
  const [warrantyPeriod, setWarrantyPeriod] = useState('');

  // Grocery fields
  const [expiryDate, setExpiryDate] = useState('');
  const [batchNumber, setBatchNumber] = useState('');

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setName('');
    const randomCode = `PRD-${Math.floor(100 + Math.random() * 900)}`;
    setCode(randomCode);
    setBarcode(`894${Math.floor(100000 + Math.random() * 900000)}`);
    setCategory(settings.businessType === 'grocery' ? 'Grocery' : (settings.businessType === 'electronics' ? 'Electronics' : 'Clothing'));
    setSubcategory('');
    setBrand('');
    setDescription('');
    setPurchasePrice('');
    setSalePrice('');
    setWholesalePrice('');
    setCurrentStock(10);
    setMinStockAlert(5);
    setUnit(settings.businessType === 'grocery' ? 'kg' : 'pcs');
    setBusinessType(settings.businessType);
    setHasVariants(false);
    setModel('');
    setWarrantyPeriod('');
    setExpiryDate('');
    setBatchNumber('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setCode(p.code);
    setBarcode(p.barcode);
    setCategory(p.category);
    setSubcategory(p.subcategory || '');
    setBrand(p.brand || '');
    setDescription(p.description || '');
    setPurchasePrice(p.purchasePrice);
    setSalePrice(p.salePrice);
    setWholesalePrice(p.wholesalePrice || '');
    setCurrentStock(p.currentStock);
    setMinStockAlert(p.minStockAlert);
    setUnit(p.unit);
    setBusinessType(p.businessType || 'clothing');
    setHasVariants(!!p.hasVariants);
    setVariants(p.variants || []);
    setModel(p.model || '');
    setWarrantyPeriod(p.warrantyPeriod || '');
    setExpiryDate(p.expiryDate || '');
    setBatchNumber(p.batchNumber || '');
    setIsModalOpen(true);
  };

  // Submit Product
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !purchasePrice || !salePrice) {
      alert(isBn ? 'নাম, ক্রয়মূল্য এবং বিক্রয়মূল্য দেওয়া আবশ্যক!' : 'Name, purchase price, and sale price are required!');
      return;
    }

    const calculatedStock = hasVariants
      ? variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
      : Number(currentStock) || 0;

    const productPayload = {
      name: name.trim(),
      code: code.trim() || `PRD-${Date.now().toString().slice(-4)}`,
      barcode: barcode.trim() || `${Date.now().toString().slice(-8)}`,
      category,
      subcategory: subcategory.trim() || undefined,
      brand: brand.trim() || undefined,
      description: description.trim() || undefined,
      purchasePrice: Number(purchasePrice),
      salePrice: Number(salePrice),
      wholesalePrice: wholesalePrice ? Number(wholesalePrice) : undefined,
      currentStock: calculatedStock,
      minStockAlert: Number(minStockAlert) || 5,
      unit,
      businessType,
      hasVariants,
      variants: hasVariants ? variants : undefined,
      model: model.trim() || undefined,
      warrantyPeriod: warrantyPeriod.trim() || undefined,
      expiryDate: expiryDate || undefined,
      batchNumber: batchNumber.trim() || undefined,
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, productPayload);
    } else {
      addProduct(productPayload);
    }

    closeModal();
  };

  // Variant helper
  const addVariantRow = () => {
    setVariants(prev => [
      ...prev,
      {
        id: `v-${Date.now()}`,
        color: '',
        size: '',
        sku: `${code}-${prev.length + 1}`,
        stock: 5,
      },
    ]);
  };

  const removeVariantRow = (idx: number) => {
    setVariants(prev => prev.filter((_, i) => i !== idx));
  };

  // Filter products
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => p.category && set.add(p.category));
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode.includes(searchQuery) ||
        (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;

      let matchesStock = true;
      if (stockFilter === 'low') matchesStock = p.currentStock > 0 && p.currentStock <= p.minStockAlert;
      else if (stockFilter === 'out') matchesStock = p.currentStock <= 0;
      else if (stockFilter === 'normal') matchesStock = p.currentStock > p.minStockAlert;

      return matchesSearch && matchesCat && matchesStock;
    });
  }, [products, searchQuery, selectedCategory, stockFilter]);

  return (
    <div className="space-y-4">
      {/* Top Header & Actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600" />
            <span>{isBn ? 'পণ্য তালিকা ও ইনভেন্টরি' : 'Product Catalog & Inventory'}</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            {isBn
              ? `মোট পণ্য: ${toBnNumber(products.length)} টি · নতুন পণ্য যোগ করলে সাথে সাথে POS ও স্টক তালিকায় দেখা যাবে`
              : `Total: ${products.length} products · Instantly available for POS sales & stock`}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-3.5 py-2 text-xs md:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{isBn ? 'নতুন পণ্য যোগ করুন' : 'Add New Product'}</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex flex-col sm:flex-row items-center gap-2 text-xs">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isBn ? 'পণ্য নাম, কোড, বা বারকোড দিয়ে খুঁজুন...' : 'Search by product name, code, barcode...'}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/50"
          />
        </div>

        {/* Category Filter */}
        <select
          aria-label={isBn ? 'ক্যাটাগরি অনুযায়ী ফিল্টার করুন' : 'Filter by category'}
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full sm:w-auto py-1.5 px-3 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-slate-700"
        >
          <option value="all">{isBn ? 'সকল ক্যাটাগরি' : 'All Categories'}</option>
          {categoriesList.map(c => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Stock Filter */}
        <select
          aria-label={isBn ? 'স্টক অবস্থা অনুযায়ী ফিল্টার করুন' : 'Filter by stock status'}
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value as any)}
          className="w-full sm:w-auto py-1.5 px-3 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-slate-700"
        >
          <option value="all">{isBn ? 'সকল স্টক স্ট্যাটাস' : 'All Stock'}</option>
          <option value="normal">{isBn ? 'পর্যাপ্ত স্টক' : 'Normal Stock'}</option>
          <option value="low">{isBn ? 'কম স্টক (Low Stock)' : 'Low Stock'}</option>
          <option value="out">{isBn ? 'আউট অব স্টক' : 'Out of Stock'}</option>
        </select>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">{isBn ? 'পণ্যের বিবরণ' : 'Product Info'}</th>
                <th className="px-4 py-3 font-semibold">{isBn ? 'কোড / বারকোড' : 'Code / Barcode'}</th>
                <th className="px-4 py-3 font-semibold">{isBn ? 'ক্যাটাগরি' : 'Category'}</th>
                <th className="px-4 py-3 font-semibold text-right">{isBn ? 'ক্রয়মূল্য' : 'Cost'}</th>
                <th className="px-4 py-3 font-semibold text-right">{isBn ? 'বিক্রয়মূল্য' : 'Price'}</th>
                <th className="px-4 py-3 font-semibold text-center">{isBn ? 'স্টক পরিমাণ' : 'Stock'}</th>
                <th className="px-4 py-3 font-semibold text-right">{isBn ? 'অ্যাকশন' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map(product => {
                const isOutOfStock = product.currentStock <= 0;
                const isLowStock = product.currentStock > 0 && product.currentStock <= product.minStockAlert;
                const margin = product.salePrice > 0
                  ? Math.round(((product.salePrice - product.purchasePrice) / product.salePrice) * 100)
                  : 0;

                return (
                  <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 leading-tight">
                        {product.name}
                      </div>
                      <div className="text-[11px] text-slate-600 flex items-center gap-2 mt-0.5">
                        {product.brand && <span>ব্র্যান্ড: {product.brand}</span>}
                        {product.hasVariants && (
                          <span className="text-blue-700 bg-blue-50 px-1 py-0.2 rounded font-medium">
                            {product.variants?.length} টি ভ্যারিয়েন্ট
                          </span>
                        )}
                        {product.model && <span>মডেল: {product.model}</span>}
                      </div>
                    </td>

                    <td className="px-4 py-3 font-mono">
                      <span className="font-medium text-slate-800 block">{product.code}</span>
                      <span className="text-[10px] text-slate-600 block">{product.barcode}</span>
                    </td>

                    <td className="px-4 py-3 text-slate-700">
                      <span>{product.category}</span>
                      {product.subcategory && (
                        <span className="text-[10px] text-slate-600 block">{product.subcategory}</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right font-mono-num text-slate-700">
                      {formatCurrency(product.purchasePrice, lang)}
                    </td>

                    <td className="px-4 py-3 text-right font-mono-num font-bold text-slate-900">
                      {formatCurrency(product.salePrice, lang)}
                      <span className="text-[10px] text-emerald-600 block font-normal">
                        লাভ: {toBnNumber(margin)}%
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 font-mono-num font-bold text-xs px-2 py-0.5 rounded-md ${
                          isOutOfStock
                            ? 'bg-rose-50 text-rose-700'
                            : isLowStock
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {isLowStock && <AlertTriangle className="w-3 h-3" />}
                        {toBnNumber(product.currentStock)} {product.unit}
                      </span>
                      {isOutOfStock && (
                        <span className="block text-[9px] text-rose-600 font-medium mt-0.5">
                          {isBn ? 'স্টক শূন্য' : 'Out of stock'}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setBarcodeModalProduct(product)}
                          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                          title={isBn ? 'বারকোড প্রিন্ট করুন' : 'Print Barcode'}
                        >
                          <Barcode className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(product)}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                          title={isBn ? 'এডিট' : 'Edit'}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(isBn ? `আপনি কি '${product.name}' মুছে ফেলতে চান?` : `Delete product '${product.name}'?`)) {
                              deleteProduct(product.id);
                            }
                          }}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                          title={isBn ? 'মুছুন' : 'Delete'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    {isBn ? 'কোনো পণ্য পাওয়া যায়নি।' : 'No products found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden my-6">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-sm md:text-base text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" />
                <span>
                  {editingProduct
                    ? (isBn ? 'পণ্য সংশোধন (Edit Product)' : 'Edit Product')
                    : (isBn ? 'নতুন পণ্য এন্ট্রি (Add Product)' : 'Add New Product')}
                </span>
              </h3>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Business Type Selector for Adaptive Fields */}
              <div className="p-3 bg-emerald-50/50 border border-emerald-200/80 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">
                    {isBn ? 'ব্যবসার ধরন (Adaptive Form)' : 'Business Type Adaptive Mode'}
                  </span>
                  <span className="text-[11px] text-slate-600">
                    {isBn ? 'নির্বাচিত ধরন অনুযায়ী ফিল্ড স্বয়ংক্রিয়ভাবে পরিবর্তিত হবে' : 'Form fields adapt to your shop category'}
                  </span>
                </div>
                <select
                  aria-label={isBn ? 'ব্যবসার ধরন নির্বাচন করুন' : 'Select Business Type'}
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value as BusinessType)}
                  className="py-1 px-2.5 bg-white border border-emerald-300 rounded-lg text-xs font-semibold text-emerald-900 focus:outline-none"
                >
                  <option value="clothing">{isBn ? 'গার্মেন্টস / ক্লথিং' : 'Clothing / Fashion'}</option>
                  <option value="grocery">{isBn ? 'মুদি / সুপার শপ' : 'Grocery / Super Shop'}</option>
                  <option value="electronics">{isBn ? 'ইলেকট্রনিক্স / মোবাইল' : 'Electronics / Mobile'}</option>
                  <option value="pharmacy">{isBn ? 'ফার্মেসি' : 'Pharmacy'}</option>
                  <option value="general">{isBn ? 'সাধারণ খুচরা ব্যবসা' : 'General Retail'}</option>
                </select>
              </div>

              {/* Basic Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isBn ? 'পণ্যের নাম *' : 'Product Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. মেনস প্রিমিয়াম কটন শার্ট"
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    {isBn ? 'প্রোডাক্ট কোড / SKU *' : 'Product Code / SKU *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="SHIRT-001"
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    {isBn ? 'বারকোড (Barcode) *' : 'Barcode *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="894101001"
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    {isBn ? 'ক্যাটাগরি' : 'Category'}
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Clothing, Grocery, etc."
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    {isBn ? 'ব্র্যান্ড' : 'Brand'}
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Aarong, Samsung, Teer"
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Pricing Section */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="font-bold text-slate-800 block">
                  {isBn ? 'মূল্য নির্ধারণ (Pricing)' : 'Pricing Details'}
                </span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      {isBn ? 'ক্রয়মূল্য (৳) *' : 'Purchase Cost *'}
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="500"
                      className="w-full p-2 border border-slate-200 rounded-lg font-mono-num focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      {isBn ? 'বিক্রয়মূল্য (৳) *' : 'Sale Price *'}
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="850"
                      className="w-full p-2 border border-slate-200 rounded-lg font-mono-num font-bold text-emerald-800 focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      {isBn ? 'পাইকারি মূল্য (৳)' : 'Wholesale Price'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={wholesalePrice}
                      onChange={(e) => setWholesalePrice(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="750"
                      className="w-full p-2 border border-slate-200 rounded-lg font-mono-num focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      {isBn ? 'পরিমাপক একক (Unit)' : 'Unit'}
                    </label>
                    <select
                      aria-label={isBn ? 'পরিমাপক একক' : 'Unit'}
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white"
                    >
                      <option value="pcs">Pcs (পিস)</option>
                      <option value="kg">Kg (কেজি)</option>
                      <option value="bag">Bag (বস্তা)</option>
                      <option value="bottle">Bottle (বোতল)</option>
                      <option value="box">Box (বক্স)</option>
                      <option value="meter">Meter (মিটার)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Stock Section */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    {isBn ? 'প্রারম্ভিক স্টক (Opening Stock)' : 'Opening Stock'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={hasVariants}
                    value={hasVariants ? variants.reduce((s, v) => s + (Number(v.stock) || 0), 0) : currentStock}
                    onChange={(e) => setCurrentStock(e.target.value === '' ? '' : Number(e.target.value))}
                    className={`w-full p-2 border border-slate-200 rounded-lg font-mono-num focus:ring-1 focus:ring-emerald-500 focus:outline-none ${
                      hasVariants ? 'bg-slate-100 text-slate-500' : 'bg-white'
                    }`}
                  />
                  {hasVariants && (
                    <span className="text-[10px] text-blue-600 mt-0.5 block">
                      ভ্যারিয়েন্টগুলোর স্টক থেকে স্বয়ংক্রিয় হিসাব করা হবে
                    </span>
                  )}
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    {isBn ? 'ন্যূনতম অ্যালার্ট স্টক (Min Alert)' : 'Low Stock Alert Limit'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(Number(e.target.value) || 5)}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono-num focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white"
                  />
                </div>
              </div>

              {/* Clothing Adaptive: Color & Size Variants */}
              {businessType === 'clothing' && (
                <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 block">
                        {isBn ? 'পোশাকের কালার ও সাইজ ভ্যারিয়েন্ট' : 'Clothing Variants (Color & Size)'}
                      </span>
                      <span className="text-[11px] text-slate-600">
                        {isBn ? 'একটি শার্টের অধীনে Black-M, Black-L, White-M ইত্যাদি রাখতে সক্রিয় করুন' : 'Enable multiple sizes/colors per item'}
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasVariants}
                        onChange={(e) => setHasVariants(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {hasVariants && (
                    <div className="space-y-2 pt-2 border-t border-blue-200">
                      {variants.map((v, idx) => (
                        <div key={v.id || idx} className="grid grid-cols-4 gap-2 items-center">
                          <input
                            type="text"
                            placeholder="রঙ (Color e.g. Black)"
                            value={v.color}
                            onChange={(e) => {
                              const updated = [...variants];
                              updated[idx].color = e.target.value;
                              setVariants(updated);
                            }}
                            className="p-1.5 border border-slate-200 rounded bg-white text-xs"
                          />
                          <input
                            type="text"
                            placeholder="সাইজ (Size e.g. M, L, 32)"
                            value={v.size}
                            onChange={(e) => {
                              const updated = [...variants];
                              updated[idx].size = e.target.value;
                              setVariants(updated);
                            }}
                            className="p-1.5 border border-slate-200 rounded bg-white text-xs"
                          />
                          <input
                            type="number"
                            placeholder="স্টক (Stock)"
                            value={v.stock}
                            onChange={(e) => {
                              const updated = [...variants];
                              updated[idx].stock = Number(e.target.value) || 0;
                              setVariants(updated);
                            }}
                            className="p-1.5 border border-slate-200 rounded bg-white text-xs font-mono-num"
                          />
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              placeholder="SKU"
                              value={v.sku}
                              onChange={(e) => {
                                const updated = [...variants];
                                updated[idx].sku = e.target.value;
                                setVariants(updated);
                              }}
                              className="p-1.5 border border-slate-200 rounded bg-white text-xs font-mono flex-1 min-w-0"
                            />
                            {variants.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeVariantRow(idx)}
                                className="p-1 text-rose-500 hover:text-rose-700"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={addVariantRow}
                        className="text-xs font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1 pt-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{isBn ? '+ আরও ভ্যারিয়েন্ট যোগ করুন' : '+ Add Another Variant'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Electronics Adaptive Fields */}
              {businessType === 'electronics' && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      {isBn ? 'মডেল নম্বর' : 'Model'}
                    </label>
                    <input
                      type="text"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="e.g. SM-A155F"
                      className="w-full p-2 border border-slate-200 rounded bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      {isBn ? 'ওয়ারেন্টি পলিসি' : 'Warranty'}
                    </label>
                    <input
                      type="text"
                      value={warrantyPeriod}
                      onChange={(e) => setWarrantyPeriod(e.target.value)}
                      placeholder="e.g. ১ বছর অফিসিয়াল ওয়ারেন্টি"
                      className="w-full p-2 border border-slate-200 rounded bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Grocery Adaptive Fields */}
              {businessType === 'grocery' && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      {isBn ? 'মেয়াদোত্তীর্ণের তারিখ (Expiry Date)' : 'Expiry Date'}
                    </label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      {isBn ? 'ব্যাচ নম্বর (Batch #)' : 'Batch Number'}
                    </label>
                    <input
                      type="text"
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                      placeholder="B-2026-09"
                      className="w-full p-2 border border-slate-200 rounded bg-white font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Form Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
                >
                  {isBn ? 'সংরক্ষণ করুন' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Label Print Modal */}
      {barcodeModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900">
                {isBn ? 'বারকোড লেবেল প্রিভিউ' : 'Barcode Label Preview'}
              </h3>
              <button
                onClick={() => setBarcodeModalProduct(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Label View */}
            <div className="p-4 bg-white border border-dashed border-slate-300 rounded-xl text-center space-y-1 font-mono">
              <p className="font-bold text-xs text-slate-900 font-sans">{settings.shopName}</p>
              <p className="text-[11px] text-slate-800 font-sans truncate max-w-[200px] mx-auto font-medium">
                {barcodeModalProduct.name}
              </p>
              <div className="py-2">
                {/* Barcode representation */}
                <div className="text-xl font-bold tracking-widest text-slate-900">
                  ||| | | ||||| | |||
                </div>
                <span className="text-xs text-slate-600 tracking-wider">
                  {barcodeModalProduct.barcode}
                </span>
              </div>
              <p className="text-sm font-bold text-slate-900 font-mono-num">
                MRP: {formatCurrency(barcodeModalProduct.salePrice, lang)}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setBarcodeModalProduct(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200"
              >
                {isBn ? 'বন্ধ করুন' : 'Close'}
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{isBn ? 'প্রিন্ট' : 'Print'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
