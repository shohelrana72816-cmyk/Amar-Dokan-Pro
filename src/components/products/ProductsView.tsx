import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, ProductVariant, BusinessType } from '../../types';
import { formatCurrency, toBnNumber } from '../../utils/formatters';
import {
  Package,
  Plus,
  Search,
  Barcode,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  RotateCcw,
  Check,
  FolderPlus,
  Archive,
} from 'lucide-react';

interface ProductsViewProps {
  isAddModalOpen?: boolean;
  onCloseAddModal?: () => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({ isAddModalOpen: propIsAddModalOpen, onCloseAddModal: propOnCloseAddModal }) => {
  const { products, categories, addCategory, addProduct, updateProduct, deleteProduct, isAdmin, settings } = useApp();
  const isBn = false;
  const lang = settings.language;

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'normal' | 'low' | 'out'>('all');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(propIsAddModalOpen || false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [barcodeModalProduct, setBarcodeModalProduct] = useState<Product | null>(null);
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Sync prop changes
  React.useEffect(() => {
    if (propIsAddModalOpen !== undefined) {
      setIsModalOpen(propIsAddModalOpen);
    }
  }, [propIsAddModalOpen]);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setShowNewCatInput(false);
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
    const defaultCat = categories.length > 0 ? categories[0].name : 'Clothing';
    setCategory(defaultCat);
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
    setShowNewCatInput(false);
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
    setShowNewCatInput(false);
    setIsModalOpen(true);
  };

  // Quick Add Category from form
  const handleCreateCategory = () => {
    if (!newCatName.trim()) return;
    const cat = addCategory({ name: newCatName.trim() });
    setCategory(cat.name);
    setNewCatName('');
    setShowNewCatInput(false);
  };

  // Submit Product
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanCode = code.trim();
    const cleanBarcode = barcode.trim();

    if (!cleanName || purchasePrice === '' || salePrice === '') {
      alert('Name, purchase price, and sale price are required!');
      return;
    }

    if (Number(salePrice) < 0 || Number(purchasePrice) < 0) {
      alert('Prices cannot be negative!');
      return;
    }

    // Duplicate SKU check
    const isSkuTaken = products.some(
      p => p.id !== editingProduct?.id && p.code.toLowerCase() === cleanCode.toLowerCase()
    );
    if (isSkuTaken) {
      alert(`SKU '${cleanCode}' is already taken!`);
      return;
    }

    // Duplicate Barcode check
    const isBarcodeTaken = products.some(
      p => p.id !== editingProduct?.id && p.barcode.toLowerCase() === cleanBarcode.toLowerCase()
    );
    if (isBarcodeTaken) {
      alert(`Barcode '${cleanBarcode}' is already used!`);
      return;
    }

    const calculatedStock = hasVariants
      ? variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
      : Number(currentStock) || 0;

    const productPayload = {
      name: cleanName,
      code: cleanCode || `PRD-${Date.now().toString().slice(-4)}`,
      barcode: cleanBarcode || `${Date.now().toString().slice(-8)}`,
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
      isActive: editingProduct ? editingProduct.isActive !== false : true,
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
        id: `v-${Date.now()}-${prev.length + 1}`,
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

  // Combined Category List
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    categories.forEach(c => c.name && set.add(c.name));
    products.forEach(p => p.category && set.add(p.category));
    return Array.from(set);
  }, [categories, products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Status filter (active, inactive, all)
      if (statusFilter === 'active' && p.isActive === false) return false;
      if (statusFilter === 'inactive' && p.isActive !== false) return false;

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
  }, [products, searchQuery, selectedCategory, stockFilter, statusFilter]);

  return (
    <div className="space-y-4">
      {/* Top Header & Actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600" />
            <span>{'Product Catalog & Inventory'}</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            {`Total: ${products.length} products · Instantly available for POS sales & stock`}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-3.5 py-2 text-xs md:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{'Add New Product'}</span>
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
            placeholder={'Search by product name, code, barcode...'}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/50"
          />
        </div>

        {/* Category Filter */}
        <select
          aria-label={'Filter by category'}
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full sm:w-auto py-1.5 px-3 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-slate-700"
        >
          <option value="all">{'All Categories'}</option>
          {categoriesList.map(c => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Stock Filter */}
        <select
          aria-label={'Filter by stock status'}
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value as any)}
          className="w-full sm:w-auto py-1.5 px-3 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-slate-700"
        >
          <option value="all">{'All Stock'}</option>
          <option value="normal">{'Normal Stock'}</option>
          <option value="low">{'Low Stock'}</option>
          <option value="out">{'Out of Stock'}</option>
        </select>

        {/* Status Filter (Active / Inactive) */}
        <select
          aria-label={'Status'}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="w-full sm:w-auto py-1.5 px-3 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-slate-700"
        >
          <option value="active">{'Active Products'}</option>
          <option value="inactive">{'Archived / Inactive'}</option>
          <option value="all">{'All'}</option>
        </select>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">{'Product Info'}</th>
                <th className="px-4 py-3 font-semibold">{'Code / Barcode'}</th>
                <th className="px-4 py-3 font-semibold">{'Category'}</th>
                <th className="px-4 py-3 font-semibold text-right">{'Cost'}</th>
                <th className="px-4 py-3 font-semibold text-right">{'Price'}</th>
                <th className="px-4 py-3 font-semibold text-center">{'Stock'}</th>
                <th className="px-4 py-3 font-semibold text-right">{'Actions'}</th>
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
                  <tr
                    key={product.id}
                    className={`transition-colors ${product.isActive === false ? 'bg-slate-50/60 opacity-60' : 'hover:bg-slate-50/80'}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900 leading-tight">
                          {product.name}
                        </span>
                        {product.isActive === false && (
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-1 py-0.2 rounded font-medium">
                            {'Archived'}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-600 flex items-center gap-2 mt-0.5">
                        {product.brand && <span>Brand: {product.brand}</span>}
                        {product.hasVariants && (
                          <span className="text-blue-700 bg-blue-50 px-1 py-0.2 rounded font-medium">
                            {product.variants?.length} Variants
                          </span>
                        )}
                        {product.model && <span>Model: {product.model}</span>}
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
                        Margin: {margin}%
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
                          {'Out of stock'}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setBarcodeModalProduct(product)}
                          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                          title={'Barcode'}
                        >
                          <Barcode className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(product)}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                          title={'Edit'}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          product.isActive === false ? (
                            <button
                              onClick={() => updateProduct(product.id, { isActive: true })}
                              className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded transition-colors"
                              title={'Reactivate'}
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                if (confirm(`Archive/Delete '${product.name}'?`)) {
                                  deleteProduct(product.id);
                                }
                              }}
                              className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                              title={'Delete/Archive'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    {'No products found.'}
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
                    ? ('Edit Product')
                    : ('Add New Product')}
                </span>
              </h3>
              <button
                type="button"
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
                    {'Business Type Adaptive Mode'}
                  </span>
                  <span className="text-[11px] text-slate-600">
                    {'Form fields adapt to your shop category'}
                  </span>
                </div>
                <select
                  aria-label={'Select Business Type'}
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value as BusinessType)}
                  className="py-1 px-2.5 bg-white border border-emerald-300 rounded-lg text-xs font-semibold text-emerald-900 focus:outline-none"
                >
                  <option value="clothing">{'Clothing / Fashion'}</option>
                  <option value="grocery">{'Grocery / Super Shop'}</option>
                  <option value="electronics">{'Electronics / Mobile'}</option>
                  <option value="pharmacy">{'Pharmacy'}</option>
                  <option value="general">{'General Retail'}</option>
                </select>
              </div>

              {/* Basic Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    {'Product Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Test Product"
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    {'Product Code / SKU *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="TEST-001"
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    {'Barcode *'}
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-medium text-slate-700">
                      {'Category *'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowNewCatInput(prev => !prev)}
                      className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-0.5"
                    >
                      <FolderPlus className="w-3 h-3" />
                      <span>{showNewCatInput ? ('List') : ('+ New Cat')}</span>
                    </button>
                  </div>

                  {showNewCatInput ? (
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder={'New category name...'}
                        className="flex-1 p-2 border border-emerald-300 rounded-lg focus:outline-none text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleCreateCategory}
                        className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold text-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <select
                      aria-label={'Category'}
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
                    >
                      {categoriesList.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    {'Brand'}
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Apex, Samsung, Teer"
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Pricing Section */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="font-bold text-slate-800 block">
                  {'Pricing Details'}
                </span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      {'Purchase Cost *'}
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="100"
                      className="w-full p-2 border border-slate-200 rounded-lg font-mono-num focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      {'Sale Price *'}
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="150"
                      className="w-full p-2 border border-slate-200 rounded-lg font-mono-num font-bold text-emerald-800 focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      {'Wholesale Price'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={wholesalePrice}
                      onChange={(e) => setWholesalePrice(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="130"
                      className="w-full p-2 border border-slate-200 rounded-lg font-mono-num focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      {'Unit'}
                    </label>
                    <select
                      aria-label={'Unit'}
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white"
                    >
                      <option value="pcs">Pcs</option>
                      <option value="kg">Kg</option>
                      <option value="bag">Bag</option>
                      <option value="bottle">Bottle</option>
                      <option value="box">Box</option>
                      <option value="meter">Meter</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Stock Details */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="font-bold text-slate-800 block">
                  {'Stock Management'}
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      {'Opening / Current Stock *'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      disabled={hasVariants}
                      value={hasVariants ? variants.reduce((s, v) => s + (Number(v.stock) || 0), 0) : currentStock}
                      onChange={(e) => setCurrentStock(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="20"
                      className="w-full p-2 border border-slate-200 rounded-lg font-mono-num font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white disabled:bg-slate-100"
                    />
                    {hasVariants && (
                      <span className="text-[10px] text-blue-600 mt-0.5 block">
                        {'Sum of variant stocks'}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      {'Low Stock Alert'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={minStockAlert}
                      onChange={(e) => setMinStockAlert(Number(e.target.value) || 5)}
                      placeholder="5"
                      className="w-full p-2 border border-slate-200 rounded-lg font-mono-num focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white"
                    />
                  </div>
                </div>

                {/* Clothing Variants Toggle */}
                {businessType === 'clothing' && (
                  <div className="pt-2 border-t border-slate-200">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasVariants}
                        onChange={(e) => setHasVariants(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-semibold text-slate-800 text-xs">
                        {'Has Color / Size Variants'}
                      </span>
                    </label>

                    {hasVariants && (
                      <div className="mt-3 space-y-2 bg-white p-3 rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold text-slate-700">
                            {'Variant Rows:'}
                          </span>
                          <button
                            type="button"
                            onClick={addVariantRow}
                            className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>{'Add Variant'}</span>
                          </button>
                        </div>

                        {variants.map((v, idx) => (
                          <div key={v.id || idx} className="grid grid-cols-4 gap-1.5 items-center">
                            <input
                              type="text"
                              placeholder={'Color'}
                              value={v.color}
                              onChange={(e) => {
                                const val = e.target.value;
                                setVariants(prev => prev.map((item, i) => i === idx ? { ...item, color: val } : item));
                              }}
                              className="p-1.5 border border-slate-200 rounded text-xs"
                            />
                            <input
                              type="text"
                              placeholder={'Size'}
                              value={v.size}
                              onChange={(e) => {
                                const val = e.target.value;
                                setVariants(prev => prev.map((item, i) => i === idx ? { ...item, size: val } : item));
                              }}
                              className="p-1.5 border border-slate-200 rounded text-xs"
                            />
                            <input
                              type="number"
                              min="0"
                              placeholder={'Stock'}
                              value={v.stock}
                              onChange={(e) => {
                                const val = Number(e.target.value) || 0;
                                setVariants(prev => prev.map((item, i) => i === idx ? { ...item, stock: val } : item));
                              }}
                              className="p-1.5 border border-slate-200 rounded text-xs font-mono-num"
                            />
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                placeholder="SKU"
                                value={v.sku}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setVariants(prev => prev.map((item, i) => i === idx ? { ...item, sku: val } : item));
                                }}
                                className="w-full p-1.5 border border-slate-200 rounded text-xs font-mono"
                              />
                              {variants.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeVariantRow(idx)}
                                  className="text-rose-500 hover:text-rose-700 p-1"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  {'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                >
                  {editingProduct
                    ? ('Save Changes')
                    : ('Save Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Modal */}
      {barcodeModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm p-5 space-y-4 text-center">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900">{barcodeModalProduct.name}</h3>
              <button
                type="button"
                onClick={() => setBarcodeModalProduct(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center space-y-2">
              <Barcode className="w-24 h-12 text-slate-800" />
              <span className="font-mono text-sm font-bold tracking-widest text-slate-900">
                {barcodeModalProduct.barcode}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                SKU: {barcodeModalProduct.code}
              </span>
              <span className="font-bold text-emerald-700 text-sm font-mono-num">
                {formatCurrency(barcodeModalProduct.salePrice, lang)}
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setBarcodeModalProduct(null)}
                className="w-full py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                {'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
