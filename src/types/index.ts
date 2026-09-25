export type UserRole = 'owner' | 'admin' | 'manager' | 'salesman' | 'storekeeper' | 'accountant';

export type BusinessType = 'clothing' | 'grocery' | 'electronics' | 'pharmacy' | 'restaurant' | 'general';

export type PaymentMethod = 'cash' | 'bkash' | 'nagad' | 'rocket' | 'bank' | 'card' | 'due' | 'mixed';

export interface ProductVariant {
  id: string;
  color?: string;
  size?: string;
  sku: string;
  stock: number;
  additionalPrice?: number;
}

export interface Product {
  id: string;
  name: string;
  code: string; // SKU or barcode
  barcode: string;
  category: string;
  subcategory?: string;
  brand?: string;
  description?: string;
  image?: string;
  purchasePrice: number;
  salePrice: number;
  wholesalePrice?: number;
  minSalePrice?: number;
  currentStock: number;
  minStockAlert: number;
  unit: string; // pcs, kg, box, meter, ltr
  businessType?: BusinessType;
  // Adaptive fields
  color?: string;
  size?: string;
  hasVariants?: boolean;
  variants?: ProductVariant[];
  model?: string;
  serialNumber?: string;
  warrantyPeriod?: string;
  expiryDate?: string;
  batchNumber?: string;
  createdAt: string;
  updatedAt: string;
  isActive?: boolean; // For soft delete protection
}

export interface Category {
  id: string;
  name: string;
  slug?: string;
  description?: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  sku: string;
  unitPrice: number;
  purchasePrice: number; // for COGS and profit calculation
  quantity: number;
  discount: number; // in BDT
  total: number;
  variantId?: string;
  variantDetails?: string; // e.g., "Black - L"
}

export interface SalePayment {
  method: PaymentMethod;
  amount: number;
  accountId?: string;
  accountName?: string;
  trxId?: string;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  date: string; // ISO format
  customerId?: string;
  customerName: string;
  customerMobile?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  vatTaxRate: number; // percentage
  vatTaxAmount: number;
  total: number;
  paid: number;
  due: number;
  paymentMethod: PaymentMethod;
  payments: SalePayment[];
  servedBy: string;
  branchId: string;
  status: 'paid' | 'due' | 'partial' | 'returned' | 'voided';
  notes?: string;
  refundedAmount?: number;
  refundReason?: string;
  refundedAt?: string;
}

export interface SaleReturn {
  id: string;
  saleId: string;
  invoiceNumber: string;
  date: string;
  customerId?: string;
  customerName: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalRefund: number;
    reason: string;
  }[];
  totalRefundAmount: number;
  refundType: 'cash' | 'adjust_due';
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  purchasePrice: number;
  total: number;
}

export interface Purchase {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  supplierName: string;
  date: string;
  items: PurchaseItem[];
  subtotal: number;
  discount: number;
  transportCost: number;
  otherCost: number;
  total: number;
  paid: number;
  due: number;
  paymentMethod: PaymentMethod;
  branchId: string;
  notes?: string;
}

export interface PurchaseReturn {
  id: string;
  purchaseId: string;
  supplierId: string;
  supplierName: string;
  date: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  reason: string;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  address?: string;
  email?: string;
  customerType: 'retail' | 'wholesale';
  openingDue: number;
  currentDue: number;
  creditLimit: number;
  totalPurchase: number;
  totalPaid: number;
  createdAt: string;
  notes?: string;
}

export interface CustomerTransaction {
  id: string;
  customerId: string;
  customerName: string;
  date: string;
  type: 'sale_due' | 'due_collection' | 'return_adjustment' | 'opening';
  amount: number;
  balanceAfter: number;
  paymentMethod?: PaymentMethod;
  referenceId?: string; // invoice number or receipt
  note?: string;
}

export interface Supplier {
  id: string;
  name: string;
  company: string;
  mobile: string;
  address?: string;
  email?: string;
  openingDue: number;
  currentDue: number;
  totalPurchase: number;
  totalPaid: number;
  createdAt: string;
}

export interface SupplierTransaction {
  id: string;
  supplierId: string;
  supplierName: string;
  date: string;
  type: 'purchase_due' | 'due_payment' | 'return_adjustment' | 'opening';
  amount: number;
  balanceAfter: number;
  paymentMethod?: PaymentMethod;
  referenceId?: string;
  note?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  date: string;
  type: 'purchase_in' | 'sale_out' | 'purchase_return' | 'sale_return' | 'adjustment' | 'transfer';
  quantity: number; // positive or negative
  previousStock: number;
  newStock: number;
  reference?: string;
  branchId: string;
  note?: string;
}

export interface StockAdjustment {
  id: string;
  productId: string;
  productName: string;
  date: string;
  adjustedQty: number; // + or -
  reason: 'damaged' | 'expired' | 'lost' | 'inventory_correction' | 'sample';
  note?: string;
  adjustedBy: string;
}

export interface StockTransfer {
  id: string;
  date: string;
  productId: string;
  productName: string;
  quantity: number;
  fromBranchId: string;
  fromBranchName: string;
  toBranchId: string;
  toBranchName: string;
  transferredBy: string;
  note?: string;
}

export interface Account {
  id: string;
  name: string;
  accountType: 'cash' | 'bank' | 'mobile_bank';
  accountNumber?: string;
  balance: number;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  paymentMethod: PaymentMethod;
  accountId: string;
  paidTo?: string;
  note?: string;
}

export interface Employee {
  id: string;
  name: string;
  mobile: string;
  position: string;
  role: UserRole;
  salary: number;
  joiningDate: string;
  branchId: string;
  status: 'active' | 'inactive';
}

export interface Branch {
  id: string;
  name: string;
  location: string;
  mobile: string;
  isMain: boolean;
}

export interface ShopSettings {
  shopName: string;
  tagline: string;
  address: string;
  mobile: string;
  email: string;
  currency: string;
  vatTaxRate: number; // e.g. 5%
  invoiceFormat: 'thermal' | 'a4';
  businessType: BusinessType;
  language: 'bn' | 'en';
  uiMode: 'easy' | 'advanced';
}

export interface AuditLog {
  id: string;
  date: string;
  userRole: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  branchId?: string;
}

export interface AccountTransaction {
  id: string;
  accountId: string;
  accountName: string;
  date: string;
  type: 'sale_payment' | 'purchase_payment' | 'customer_payment' | 'supplier_payment' | 'expense' | 'salary' | 'transfer_in' | 'transfer_out' | 'refund' | 'adjustment';
  amount: number;
  balanceAfter: number;
  referenceId?: string;
  note?: string;
}
