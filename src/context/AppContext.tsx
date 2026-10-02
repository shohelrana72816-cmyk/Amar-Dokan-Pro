import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  Category,
  Customer,
  Supplier,
  Sale,
  SaleReturn,
  Purchase,
  StockMovement,
  StockAdjustment,
  StockTransfer,
  Account,
  AccountTransaction,
  Expense,
  Employee,
  Branch,
  ShopSettings,
  UserRole,
  PaymentMethod,
  CustomerTransaction,
  SupplierTransaction,
  AuditLog,
} from '../types';
import {
  initialSettings,
  initialBranches,
  initialAccounts,
  initialProducts,
  initialCustomers,
  initialSuppliers,
  initialSales,
  initialPurchases,
  initialExpenses,
  initialEmployees,
  initialStockMovements,
  initialCategories,
  initialAuditLogs,
} from '../data/initialData';
import { generateInvoiceNumber } from '../utils/formatters';
import { auditService } from '../services/auditService';

interface AppContextType {
  settings: ShopSettings;
  updateSettings: (newSettings: Partial<ShopSettings>) => void;
  currentUserRole: UserRole;
  setCurrentUserRole: (role: UserRole) => void;
  activeBranchId: string;
  setActiveBranchId: (branchId: string) => void;
  branches: Branch[];
  addBranch: (branch: Omit<Branch, 'id'>) => void;

  // Categories
  categories: Category[];
  addCategory: (category: { name: string; description?: string }) => Category;
  deleteCategory: (id: string) => void;

  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Product;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string, permanent?: boolean) => void;

  // Sales & POS
  sales: Sale[];
  recordSale: (saleData: Omit<Sale, 'id' | 'invoiceNumber' | 'date' | 'status'>) => Sale;
  recordSaleReturn: (saleId: string, items: { productId: string; quantity: number; unitPrice: number; reason: string }[], refundType: 'cash' | 'adjust_due') => void;
  quickRefundSale: (saleId: string, reason?: string) => boolean;
  voidSale: (saleId: string, reason?: string) => boolean;

  // Purchases
  purchases: Purchase[];
  recordPurchase: (purchaseData: Omit<Purchase, 'id' | 'invoiceNumber' | 'date'>) => Purchase;
  recordPurchaseReturn: (purchaseId: string, items: { productId: string; quantity: number; unitPrice: number; reason: string }[]) => void;

  // Stock
  stockMovements: StockMovement[];
  stockAdjustments: StockAdjustment[];
  stockTransfers: StockTransfer[];
  adjustStock: (productId: string, adjustedQty: number, reason: StockAdjustment['reason'], note?: string) => void;
  transferStock: (productId: string, quantity: number, fromBranchId: string, toBranchId: string, note?: string) => void;

  // Customers & Due
  customers: Customer[];
  customerTransactions: CustomerTransaction[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'currentDue' | 'totalPurchase' | 'totalPaid' | 'openingDue'> & { openingDue?: number }) => Customer;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  collectCustomerDue: (customerId: string, amount: number, paymentMethod: PaymentMethod, accountId: string, note?: string) => void;

  // Suppliers & Due
  suppliers: Supplier[];
  supplierTransactions: SupplierTransaction[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'currentDue' | 'totalPurchase' | 'totalPaid' | 'openingDue'> & { openingDue?: number }) => Supplier;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  paySupplierDue: (supplierId: string, amount: number, paymentMethod: PaymentMethod, accountId: string, note?: string) => void;

  // Accounts & Expenses
  accounts: Account[];
  accountTransactions: AccountTransaction[];
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'date'>) => void;
  transferMoney: (fromAccountId: string, toAccountId: string, amount: number, note?: string) => void;

  // Employees & Payroll
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, employee: Partial<Employee>) => void;
  disburseSalary: (employeeId: string, month: string, accountId: string, amount: number) => void;

  // Audit Logs
  auditLogs: AuditLog[];
  addAuditLog: (action: string, entityType: string, entityId: string, details: string) => void;

  // System Helpers
  isAdmin: boolean;
  deleteSale: (saleId: string) => boolean;
  deletePurchase: (purchaseId: string) => boolean;
  deleteCustomer: (customerId: string) => { success: boolean; message?: string };
  deleteSupplier: (supplierId: string) => { success: boolean; message?: string };
  deleteExpense: (expenseId: string) => boolean;
  deleteEmployee: (employeeId: string) => boolean;
  backupData: () => string;
  restoreData: (jsonStr: string) => boolean;
  resetToDemoData: () => void;
  canAccess: (module: 'dashboard' | 'pos' | 'products' | 'stock' | 'purchases' | 'customers' | 'suppliers' | 'accounts' | 'reports' | 'employees' | 'branches' | 'settings') => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'AMAR_DOKAN_PRO_STORAGE_V1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from localStorage or initialize with seed data
  const [settings, setSettings] = useState<ShopSettings>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_SETTINGS`);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...parsed, language: 'en' };
      }
      return initialSettings;
    } catch {
      return initialSettings;
    }
  });

  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('owner');
  const isAdmin = currentUserRole === 'admin' || currentUserRole === 'owner';
  const activeBranchIdState = useState<string>('branch-1');
  const [activeBranchId, setActiveBranchId] = activeBranchIdState;

  const [branches, setBranches] = useState<Branch[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_BRANCHES`);
      return saved ? JSON.parse(saved) : initialBranches;
    } catch {
      return initialBranches;
    }
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_CATEGORIES`);
      return saved ? JSON.parse(saved) : initialCategories;
    } catch {
      return initialCategories;
    }
  });

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_PRODUCTS`);
      return saved ? JSON.parse(saved) : initialProducts.map(p => ({ ...p, isActive: true }));
    } catch {
      return initialProducts.map(p => ({ ...p, isActive: true }));
    }
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_CUSTOMERS`);
      return saved ? JSON.parse(saved) : initialCustomers;
    } catch {
      return initialCustomers;
    }
  });

  const [customerTransactions, setCustomerTransactions] = useState<CustomerTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_CUST_TXNS`);
      return saved ? JSON.parse(saved) : [
        {
          id: 'ctx-1',
          customerId: 'cust-1',
          customerName: 'তানভীর আহমেদ (Tanvir Ahmed)',
          date: new Date(Date.now() - 2 * 3600000).toISOString(),
          type: 'sale_due',
          amount: 888,
          balanceAfter: 3500,
          referenceId: 'INV-260924-1024',
          note: 'Credit sale invoice'
        }
      ];
    } catch {
      return [];
    }
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_SUPPLIERS`);
      return saved ? JSON.parse(saved) : initialSuppliers;
    } catch {
      return initialSuppliers;
    }
  });

  const [supplierTransactions, setSupplierTransactions] = useState<SupplierTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_SUPP_TXNS`);
      return saved ? JSON.parse(saved) : [
        {
          id: 'stx-1',
          supplierId: 'supp-1',
          supplierName: 'বেক্সিমকো টেক্সটাইল ডিস্ট্রিবিউটর',
          date: new Date(Date.now() - 48 * 3600000).toISOString(),
          type: 'purchase_due',
          amount: 9300,
          balanceAfter: 18500,
          referenceId: 'BILL-BEX-9921',
          note: 'Credit purchase bill'
        }
      ];
    } catch {
      return [];
    }
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_SALES`);
      return saved ? JSON.parse(saved) : initialSales;
    } catch {
      return initialSales;
    }
  });

  const [purchases, setPurchases] = useState<Purchase[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_PURCHASES`);
      return saved ? JSON.parse(saved) : initialPurchases;
    } catch {
      return initialPurchases;
    }
  });

  const [accounts, setAccounts] = useState<Account[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_ACCOUNTS`);
      return saved ? JSON.parse(saved) : initialAccounts;
    } catch {
      return initialAccounts;
    }
  });

  const [accountTransactions, setAccountTransactions] = useState<AccountTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_ACCOUNT_TXNS`);
      return saved ? JSON.parse(saved) : [
        {
          id: 'atx-init-1',
          accountId: 'acc-cash',
          accountName: 'Cash in Hand',
          date: new Date(Date.now() - 24 * 3600000).toISOString(),
          type: 'sale_payment',
          amount: 1500,
          balanceAfter: 42300,
          referenceId: 'INV-INIT-1',
          note: 'Initial sales payment',
        }
      ];
    } catch {
      return [];
    }
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_EXPENSES`);
      return saved ? JSON.parse(saved) : initialExpenses;
    } catch {
      return initialExpenses;
    }
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_EMPLOYEES`);
      return saved ? JSON.parse(saved) : initialEmployees;
    } catch {
      return initialEmployees;
    }
  });

  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_MOVEMENTS`);
      return saved ? JSON.parse(saved) : initialStockMovements;
    } catch {
      return initialStockMovements;
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_AUDIT_LOGS`);
      return saved ? JSON.parse(saved) : initialAuditLogs;
    } catch {
      return initialAuditLogs;
    }
  });

  const [stockAdjustments, setStockAdjustments] = useState<StockAdjustment[]>([]);
  const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>([]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_SETTINGS`, JSON.stringify(settings));
  }, [settings]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_BRANCHES`, JSON.stringify(branches));
  }, [branches]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_CATEGORIES`, JSON.stringify(categories));
  }, [categories]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_PRODUCTS`, JSON.stringify(products));
  }, [products]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_CUSTOMERS`, JSON.stringify(customers));
  }, [customers]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_CUST_TXNS`, JSON.stringify(customerTransactions));
  }, [customerTransactions]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_SUPPLIERS`, JSON.stringify(suppliers));
  }, [suppliers]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_SUPP_TXNS`, JSON.stringify(supplierTransactions));
  }, [supplierTransactions]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_SALES`, JSON.stringify(sales));
  }, [sales]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_PURCHASES`, JSON.stringify(purchases));
  }, [purchases]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_ACCOUNTS`, JSON.stringify(accounts));
  }, [accounts]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_ACCOUNT_TXNS`, JSON.stringify(accountTransactions));
  }, [accountTransactions]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_EXPENSES`, JSON.stringify(expenses));
  }, [expenses]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_EMPLOYEES`, JSON.stringify(employees));
  }, [employees]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_MOVEMENTS`, JSON.stringify(stockMovements));
  }, [stockMovements]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_AUDIT_LOGS`, JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Audit Logger Helper
  const addAuditLog = (action: string, entityType: string, entityId: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      date: new Date().toISOString(),
      userRole: currentUserRole,
      action,
      entityType,
      entityId,
      details,
      branchId: activeBranchId,
    };
    setAuditLogs(prev => [newLog, ...prev]);
    auditService.logAction(newLog);
  };

  // Role Permissions Checker
  const canAccess = (module: 'dashboard' | 'pos' | 'products' | 'stock' | 'purchases' | 'customers' | 'suppliers' | 'accounts' | 'reports' | 'employees' | 'branches' | 'settings'): boolean => {
    if (currentUserRole === 'owner' || currentUserRole === 'admin') return true;
    switch (currentUserRole) {
      case 'manager':
        return ['dashboard', 'pos', 'products', 'stock', 'purchases', 'customers', 'suppliers', 'reports'].includes(module);
      case 'salesman':
        return ['dashboard', 'pos', 'customers'].includes(module);
      case 'storekeeper':
        return ['dashboard', 'products', 'stock', 'purchases'].includes(module);
      case 'accountant':
        return ['dashboard', 'customers', 'suppliers', 'accounts', 'reports'].includes(module);
      default:
        return false;
    }
  };

  const updateSettings = (newSettings: Partial<ShopSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    addAuditLog('SETTINGS_UPDATED', 'settings', 'shop_settings', 'দোকানের সেটিংস পরিবর্তন করা হয়েছে');
  };

  const addBranch = (branchData: Omit<Branch, 'id'>) => {
    const newBranch: Branch = {
      ...branchData,
      id: `branch-${Date.now()}`,
    };
    setBranches(prev => [...prev, newBranch]);
    addAuditLog('BRANCH_CREATED', 'branch', newBranch.id, `নতুন শাখা যোগ করা হয়েছে: ${newBranch.name}`);
  };

  // Categories CRUD
  const addCategory = (catData: { name: string; description?: string }): Category => {
    const trimmed = catData.name.trim();
    const existing = categories.find(c => c.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing;

    const newCat: Category = {
      id: `cat-${Date.now()}-${Math.floor(Math.random() * 100)}`,
      name: trimmed,
      slug: trimmed.toLowerCase().replace(/\s+/g, '-'),
      description: catData.description,
    };
    setCategories(prev => [...prev, newCat]);
    addAuditLog('CATEGORY_CREATED', 'category', newCat.id, `নতুন ক্যাটাগরি তৈরি: ${newCat.name}`);
    return newCat;
  };

  const deleteCategory = (id: string) => {
    const target = categories.find(c => c.id === id);
    if (!target) return;
    setCategories(prev => prev.filter(c => c.id !== id));
    addAuditLog('CATEGORY_DELETED', 'category', id, `ক্যাটাগরি মুছে ফেলা হয়েছে: ${target.name}`);
  };

  // Products CRUD
  const addProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product => {
    const now = new Date().toISOString();

    // Ensure unique code / SKU
    let code = productData.code.trim();
    const isCodeDuplicate = products.some(p => p.code.toLowerCase() === code.toLowerCase());
    if (isCodeDuplicate) {
      code = `${code}-${Math.floor(100 + Math.random() * 900)}`;
    }

    // Ensure unique barcode
    let barcode = productData.barcode?.trim() || `894${Math.floor(100000 + Math.random() * 900000)}`;
    const isBarcodeDuplicate = products.some(p => p.barcode === barcode);
    if (isBarcodeDuplicate) {
      barcode = `${barcode}${Math.floor(10 + Math.random() * 90)}`;
    }

    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      code,
      barcode,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    setProducts(prev => [newProduct, ...prev]);

    // Automatically ensure category exists in category registry
    if (newProduct.category) {
      const catExists = categories.some(c => c.name.toLowerCase() === newProduct.category.toLowerCase());
      if (!catExists) {
        addCategory({ name: newProduct.category });
      }
    }

    if (newProduct.currentStock > 0) {
      const movement: StockMovement = {
        id: `sm-${Date.now()}`,
        productId: newProduct.id,
        productName: newProduct.name,
        date: now,
        type: 'purchase_in',
        quantity: newProduct.currentStock,
        previousStock: 0,
        newStock: newProduct.currentStock,
        reference: 'OPENING-STOCK',
        branchId: activeBranchId,
        note: 'প্রোডাক্টের প্রারম্ভিক স্টক এন্ট্রি',
      };
      setStockMovements(prev => [movement, ...prev]);
    }

    addAuditLog('PRODUCT_CREATED', 'product', newProduct.id, `নতুন পণ্য যুক্ত: ${newProduct.name} (SKU: ${newProduct.code}), প্রারম্ভিক স্টক: ${newProduct.currentStock}`);
    return newProduct;
  };

  const updateProduct = (id: string, productData: Partial<Product>) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === id) {
          const updated = {
            ...p,
            ...productData,
            updatedAt: new Date().toISOString(),
          };
          return updated;
        }
        return p;
      })
    );
    addAuditLog('PRODUCT_UPDATED', 'product', id, `পণ্য আপডেট করা হয়েছে (ID: ${id})`);
  };

  const deleteProduct = (id: string, permanent: boolean = false) => {
    if (!isAdmin) {
      addAuditLog('UNAUTHORIZED_DELETE_ATTEMPT', 'product', id, `অননুমোদিত ডিলিট চেষ্টা: রোল (${currentUserRole}) পণ্য মুছে ফেলতে পারবে না`);
      return;
    }
    const prod = products.find(p => p.id === id);
    if (!prod) return;

    // Check if referenced in sales or purchases
    const hasSales = sales.some(s => s.items.some(item => item.productId === id));
    const hasPurchases = purchases.some(pur => pur.items.some(item => item.productId === id));

    if ((hasSales || hasPurchases) && !permanent) {
      // Soft-delete to preserve transaction history & invoices
      setProducts(prev => prev.map(p => p.id === id ? { ...p, isActive: false, updatedAt: new Date().toISOString() } : p));
      addAuditLog('PRODUCT_DEACTIVATED', 'product', id, `পণ্য আর্কাইভ/নিষ্ক্রিয় করা হয়েছে (হিস্ট্রি সংরক্ষিত): ${prod.name}`);
    } else {
      setProducts(prev => prev.filter(p => p.id !== id));
      addAuditLog('PRODUCT_DELETED', 'product', id, `পণ্য স্থায়ীভাবে মুছে ফেলা হয়েছে: ${prod.name}`);
    }
  };

  // Helper to get matching account for payment method
  const getAccountIdForMethod = (method: PaymentMethod): string => {
    switch (method) {
      case 'cash':
        return 'acc-cash';
      case 'bkash':
        return 'acc-bkash';
      case 'nagad':
        return 'acc-nagad';
      case 'rocket':
        return 'acc-nagad';
      case 'bank':
      case 'card':
        return 'acc-islami';
      default:
        return 'acc-cash';
    }
  };

  // Sales
  const recordSale = (saleData: Omit<Sale, 'id' | 'invoiceNumber' | 'date' | 'status'>): Sale => {
    const now = new Date().toISOString();
    const invoiceNumber = generateInvoiceNumber('INV');
    const status: Sale['status'] = saleData.due <= 0 ? 'paid' : (saleData.paid <= 0 ? 'due' : 'partial');

    const newSale: Sale = {
      ...saleData,
      id: `sale-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      invoiceNumber,
      date: now,
      status,
    };

    // 1. Reduce Product Stock & Record Stock Movement
    setProducts(prev => {
      const updated = [...prev];
      newSale.items.forEach(item => {
        const pIndex = updated.findIndex(p => p.id === item.productId);
        if (pIndex !== -1) {
          const prod = updated[pIndex];
          const prevStock = prod.currentStock;
          const nextStock = Math.max(0, prevStock - item.quantity);

          // Update variants if applicable
          let newVariants = prod.variants;
          if (prod.hasVariants && prod.variants && item.variantId) {
            newVariants = prod.variants.map(v => {
              if (v.id === item.variantId) {
                return { ...v, stock: Math.max(0, v.stock - item.quantity) };
              }
              return v;
            });
          }

          updated[pIndex] = {
            ...prod,
            currentStock: nextStock,
            variants: newVariants,
            updatedAt: now,
          };

          // Record stock movement
          const movement: StockMovement = {
            id: `sm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            productId: prod.id,
            productName: prod.name,
            date: now,
            type: 'sale_out',
            quantity: -item.quantity,
            previousStock: prevStock,
            newStock: nextStock,
            reference: invoiceNumber,
            branchId: newSale.branchId,
            note: `বিক্রি ইনভয়েস ${invoiceNumber}`,
          };
          setStockMovements(prevMoves => [movement, ...prevMoves]);
        }
      });
      return updated;
    });

    // 2. Update Customer Due & Ledger if applicable
    if (newSale.customerId) {
      setCustomers(prev =>
        prev.map(c => {
          if (c.id === newSale.customerId) {
            const nextDue = c.currentDue + newSale.due;
            return {
              ...c,
              totalPurchase: c.totalPurchase + newSale.total,
              totalPaid: c.totalPaid + newSale.paid,
              currentDue: nextDue,
            };
          }
          return c;
        })
      );

      if (newSale.due > 0) {
        const targetCust = customers.find(c => c.id === newSale.customerId);
        const nextDue = (targetCust?.currentDue || 0) + newSale.due;
        const custTxn: CustomerTransaction = {
          id: `ctx-${Date.now()}`,
          customerId: newSale.customerId,
          customerName: newSale.customerName,
          date: now,
          type: 'sale_due',
          amount: newSale.due,
          balanceAfter: nextDue,
          paymentMethod: newSale.paymentMethod,
          referenceId: invoiceNumber,
          note: `বিক্রি বাকি: ইনভয়েস ${invoiceNumber}`,
        };
        setCustomerTransactions(prev => [custTxn, ...prev]);
      }
    }

    // 3. Process Payments to Accounts & Record Account Transactions
    if (newSale.paid > 0) {
      const paymentsToProcess = (newSale.payments && newSale.payments.length > 0)
        ? newSale.payments
        : [{ method: newSale.paymentMethod, amount: newSale.paid }];

      setAccounts(prev => {
        let updatedAccounts = [...prev];
        paymentsToProcess.forEach(payment => {
          if (payment.amount <= 0) return;
          const targetAccId = payment.accountId || getAccountIdForMethod(payment.method);
          const accIndex = updatedAccounts.findIndex(a => a.id === targetAccId);

          if (accIndex !== -1) {
            const acc = updatedAccounts[accIndex];
            const newBalance = acc.balance + payment.amount;
            updatedAccounts[accIndex] = { ...acc, balance: newBalance };

            const accTxn: AccountTransaction = {
              id: `atx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              accountId: acc.id,
              accountName: acc.name,
              date: now,
              type: 'sale_payment',
              amount: payment.amount,
              balanceAfter: newBalance,
              referenceId: invoiceNumber,
              note: `বিক্রি আদায়: ${invoiceNumber} (${payment.method})`,
            };
            setAccountTransactions(txns => [accTxn, ...txns]);
          }
        });
        return updatedAccounts;
      });
    }

    setSales(prev => [newSale, ...prev]);
    addAuditLog('SALE_CREATED', 'sale', newSale.id, `নতুন বিক্রি সম্পন্ন: ${invoiceNumber}, মোট: ৳${newSale.total}, পরিশোধ: ৳${newSale.paid}`);
    return newSale;
  };

  // Quick Refund Sale (Restores all stock, reverses payments, marks returned)
  const quickRefundSale = (saleId: string, reason?: string): boolean => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale || sale.status === 'returned' || sale.status === 'voided') {
      return false;
    }

    const now = new Date().toISOString();
    const refundReason = reason || 'কুইক রিফান্ড (Quick Refund)';

    // 1. Restore Stock for all items
    setProducts(prev => {
      const updated = [...prev];
      sale.items.forEach(item => {
        const pIndex = updated.findIndex(p => p.id === item.productId);
        if (pIndex !== -1) {
          const prod = updated[pIndex];
          const nextStock = prod.currentStock + item.quantity;

          let newVariants = prod.variants;
          if (prod.hasVariants && prod.variants && item.variantId) {
            newVariants = prod.variants.map(v => {
              if (v.id === item.variantId) {
                return { ...v, stock: v.stock + item.quantity };
              }
              return v;
            });
          }

          updated[pIndex] = {
            ...prod,
            currentStock: nextStock,
            variants: newVariants,
            updatedAt: now,
          };

          const movement: StockMovement = {
            id: `sm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            productId: prod.id,
            productName: prod.name,
            date: now,
            type: 'sale_return',
            quantity: item.quantity,
            previousStock: prod.currentStock,
            newStock: nextStock,
            reference: sale.invoiceNumber,
            branchId: sale.branchId,
            note: `কুইক রিফান্ড ফেরত (${refundReason})`,
          };
          setStockMovements(m => [movement, ...m]);
        }
      });
      return updated;
    });

    // 2. Reverse Payments from Accounts
    if (sale.paid > 0) {
      const paymentsToReverse = (sale.payments && sale.payments.length > 0)
        ? sale.payments
        : [{ method: sale.paymentMethod, amount: sale.paid }];

      setAccounts(prev => {
        let updatedAccounts = [...prev];
        paymentsToReverse.forEach(p => {
          if (p.amount <= 0) return;
          const targetAccId = p.accountId || getAccountIdForMethod(p.method);
          const accIndex = updatedAccounts.findIndex(a => a.id === targetAccId);

          if (accIndex !== -1) {
            const acc = updatedAccounts[accIndex];
            const newBal = Math.max(0, acc.balance - p.amount);
            updatedAccounts[accIndex] = { ...acc, balance: newBal };

            const accTxn: AccountTransaction = {
              id: `atx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              accountId: acc.id,
              accountName: acc.name,
              date: now,
              type: 'refund',
              amount: -p.amount,
              balanceAfter: newBal,
              referenceId: sale.invoiceNumber,
              note: `ইনভয়েস ${sale.invoiceNumber} রিফান্ড ফেরত (${p.method})`,
            };
            setAccountTransactions(txns => [accTxn, ...txns]);
          }
        });
        return updatedAccounts;
      });
    }

    // 3. Reverse Customer Due / Purchase
    if (sale.customerId) {
      setCustomers(prev =>
        prev.map(c => {
          if (c.id === sale.customerId) {
            return {
              ...c,
              currentDue: Math.max(0, c.currentDue - sale.due),
              totalPurchase: Math.max(0, c.totalPurchase - sale.total),
              totalPaid: Math.max(0, c.totalPaid - sale.paid),
            };
          }
          return c;
        })
      );

      if (sale.due > 0) {
        const custTxn: CustomerTransaction = {
          id: `ctx-${Date.now()}`,
          customerId: sale.customerId,
          customerName: sale.customerName,
          date: now,
          type: 'return_adjustment',
          amount: sale.due,
          balanceAfter: 0,
          paymentMethod: sale.paymentMethod,
          referenceId: sale.invoiceNumber,
          note: `ইনভয়েস ${sale.invoiceNumber} রিফান্ড বাকি সমন্বয়`,
        };
        setCustomerTransactions(prev => [custTxn, ...prev]);
      }
    }

    // 4. Mark sale as returned
    setSales(prev =>
      prev.map(s => {
        if (s.id === saleId) {
          return {
            ...s,
            status: 'returned',
            refundedAmount: sale.paid,
            refundReason,
            refundedAt: now,
          };
        }
        return s;
      })
    );

    addAuditLog('SALE_QUICK_REFUND', 'sale', sale.id, `ইনভয়েস ${sale.invoiceNumber} এর কুইক রিফান্ড সম্পন্ন হয়েছে। পরিমাণ: ৳${sale.total}`);
    return true;
  };

  // Void Sale (Marks voided and rolls back stock & accounts)
  const voidSale = (saleId: string, reason?: string): boolean => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale || sale.status === 'returned' || sale.status === 'voided') {
      return false;
    }

    const success = quickRefundSale(saleId, reason || 'ভয়েড ট্রানজেকশন (Void Sale)');
    if (success) {
      setSales(prev =>
        prev.map(s => (s.id === saleId ? { ...s, status: 'voided' } : s))
      );
      addAuditLog('SALE_VOIDED', 'sale', sale.id, `ইনভয়েস ${sale.invoiceNumber} বাতিল (Void) করা হয়েছে`);
    }
    return success;
  };

  // Partial or item-based sale return
  const recordSaleReturn = (saleId: string, returnItems: { productId: string; quantity: number; unitPrice: number; reason: string }[], refundType: 'cash' | 'adjust_due') => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;

    const totalRefund = returnItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const now = new Date().toISOString();

    // 1. Restock items
    setProducts(prev => {
      const updated = [...prev];
      returnItems.forEach(item => {
        const pIndex = updated.findIndex(p => p.id === item.productId);
        if (pIndex !== -1) {
          const prod = updated[pIndex];
          const nextStock = prod.currentStock + item.quantity;
          updated[pIndex] = { ...prod, currentStock: nextStock, updatedAt: now };

          const movement: StockMovement = {
            id: `sm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            productId: prod.id,
            productName: prod.name,
            date: now,
            type: 'sale_return',
            quantity: item.quantity,
            previousStock: prod.currentStock,
            newStock: nextStock,
            reference: sale.invoiceNumber,
            branchId: sale.branchId,
            note: `সেলস রিটার্ন (${item.reason})`,
          };
          setStockMovements(m => [movement, ...m]);
        }
      });
      return updated;
    });

    // 2. Adjust customer due or cash
    if (refundType === 'adjust_due' && sale.customerId) {
      setCustomers(prev =>
        prev.map(c => (c.id === sale.customerId ? { ...c, currentDue: Math.max(0, c.currentDue - totalRefund) } : c))
      );
      const custTxn: CustomerTransaction = {
        id: `ctx-${Date.now()}`,
        customerId: sale.customerId,
        customerName: sale.customerName,
        date: now,
        type: 'return_adjustment',
        amount: totalRefund,
        balanceAfter: 0,
        referenceId: sale.invoiceNumber,
        note: `সেলস রিটার্ন সমন্বয় (${sale.invoiceNumber})`,
      };
      setCustomerTransactions(prev => [custTxn, ...prev]);
    } else if (refundType === 'cash') {
      setAccounts(prev =>
        prev.map(a => {
          if (a.id === 'acc-cash') {
            const newBal = Math.max(0, a.balance - totalRefund);
            const accTxn: AccountTransaction = {
              id: `atx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              accountId: a.id,
              accountName: a.name,
              date: now,
              type: 'refund',
              amount: -totalRefund,
              balanceAfter: newBal,
              referenceId: sale.invoiceNumber,
              note: `সেলস রিটার্ন রিফান্ড (${sale.invoiceNumber})`,
            };
            setAccountTransactions(txns => [accTxn, ...txns]);
            return { ...a, balance: newBal };
          }
          return a;
        })
      );
    }

    // Update sale status
    setSales(prev =>
      prev.map(s => (s.id === saleId ? { ...s, status: 'returned' } : s))
    );

    addAuditLog('SALE_RETURN', 'sale', sale.id, `ইনভয়েস ${sale.invoiceNumber} আংশিক পণ্য ফেরত, রিফান্ড: ৳${totalRefund}`);
  };

  // Purchases
  const recordPurchase = (purchaseData: Omit<Purchase, 'id' | 'invoiceNumber' | 'date'>): Purchase => {
    const now = new Date().toISOString();
    const invoiceNumber = generateInvoiceNumber('PUR');

    const newPurchase: Purchase = {
      ...purchaseData,
      id: `pur-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      invoiceNumber,
      date: now,
    };

    // 1. Increase product stocks
    setProducts(prev => {
      const updated = [...prev];
      newPurchase.items.forEach(item => {
        const pIndex = updated.findIndex(p => p.id === item.productId);
        if (pIndex !== -1) {
          const prod = updated[pIndex];
          const prevStock = prod.currentStock;
          const nextStock = prevStock + item.quantity;

          updated[pIndex] = {
            ...prod,
            currentStock: nextStock,
            purchasePrice: item.purchasePrice, // Update latest purchase cost
            updatedAt: now,
          };

          const movement: StockMovement = {
            id: `sm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            productId: prod.id,
            productName: prod.name,
            date: now,
            type: 'purchase_in',
            quantity: item.quantity,
            previousStock: prevStock,
            newStock: nextStock,
            reference: invoiceNumber,
            branchId: newPurchase.branchId,
            note: `ক্রয় চালান ${invoiceNumber} (${newPurchase.supplierName})`,
          };
          setStockMovements(m => [movement, ...m]);
        }
      });
      return updated;
    });

    // 2. Update Supplier Due
    setSuppliers(prev =>
      prev.map(s => {
        if (s.id === newPurchase.supplierId) {
          return {
            ...s,
            totalPurchase: s.totalPurchase + newPurchase.total,
            totalPaid: s.totalPaid + newPurchase.paid,
            currentDue: s.currentDue + newPurchase.due,
          };
        }
        return s;
      })
    );

    if (newPurchase.due > 0) {
      const targetSupplier = suppliers.find(s => s.id === newPurchase.supplierId);
      const nextDue = (targetSupplier?.currentDue || 0) + newPurchase.due;
      const suppTxn: SupplierTransaction = {
        id: `stx-${Date.now()}`,
        supplierId: newPurchase.supplierId,
        supplierName: newPurchase.supplierName,
        date: now,
        type: 'purchase_due',
        amount: newPurchase.due,
        balanceAfter: nextDue,
        paymentMethod: newPurchase.paymentMethod,
        referenceId: invoiceNumber,
        note: `ক্রয় বকেয়া: চালান ${invoiceNumber}`,
      };
      setSupplierTransactions(prev => [suppTxn, ...prev]);
    }

    // 3. Deduct paid amount from account
    if (newPurchase.paid > 0) {
      const targetAccId = getAccountIdForMethod(newPurchase.paymentMethod);
      setAccounts(prev =>
        prev.map(acc => {
          if (acc.id === targetAccId) {
            const newBal = Math.max(0, acc.balance - newPurchase.paid);
            const accTxn: AccountTransaction = {
              id: `atx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              accountId: acc.id,
              accountName: acc.name,
              date: now,
              type: 'purchase_payment',
              amount: -newPurchase.paid,
              balanceAfter: newBal,
              referenceId: invoiceNumber,
              note: `ক্রয় চালান পরিশোধ: ${invoiceNumber} (${newPurchase.supplierName})`,
            };
            setAccountTransactions(txns => [accTxn, ...txns]);
            return { ...acc, balance: newBal };
          }
          return acc;
        })
      );
    }

    setPurchases(prev => [newPurchase, ...prev]);
    addAuditLog('PURCHASE_CREATED', 'purchase', newPurchase.id, `নতুন ক্রয় চালান সম্পন্ন: ${invoiceNumber}, সাপ্লায়ার: ${newPurchase.supplierName}, মোট: ৳${newPurchase.total}`);
    return newPurchase;
  };

  // Purchase Return
  const recordPurchaseReturn = (purchaseId: string, returnItems: { productId: string; quantity: number; unitPrice: number; reason: string }[]) => {
    const purchase = purchases.find(p => p.id === purchaseId);
    if (!purchase) return;

    const totalReturnAmt = returnItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const now = new Date().toISOString();

    // 1. Decrease Stock
    setProducts(prev => {
      const updated = [...prev];
      returnItems.forEach(item => {
        const pIndex = updated.findIndex(p => p.id === item.productId);
        if (pIndex !== -1) {
          const prod = updated[pIndex];
          const nextStock = Math.max(0, prod.currentStock - item.quantity);
          updated[pIndex] = { ...prod, currentStock: nextStock, updatedAt: now };

          const movement: StockMovement = {
            id: `sm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            productId: prod.id,
            productName: prod.name,
            date: now,
            type: 'purchase_return',
            quantity: -item.quantity,
            previousStock: prod.currentStock,
            newStock: nextStock,
            reference: purchase.invoiceNumber,
            branchId: purchase.branchId,
            note: `ক্রয় ফেরত চালান (${item.reason})`,
          };
          setStockMovements(m => [movement, ...m]);
        }
      });
      return updated;
    });

    // 2. Adjust supplier due or receive cash
    setSuppliers(prev =>
      prev.map(s => {
        if (s.id === purchase.supplierId) {
          return {
            ...s,
            currentDue: Math.max(0, s.currentDue - totalReturnAmt),
          };
        }
        return s;
      })
    );

    const suppTxn: SupplierTransaction = {
      id: `stx-${Date.now()}`,
      supplierId: purchase.supplierId,
      supplierName: purchase.supplierName,
      date: now,
      type: 'return_adjustment',
      amount: totalReturnAmt,
      balanceAfter: 0,
      referenceId: purchase.invoiceNumber,
      note: `ক্রয় ফেরত সমন্বয় (${purchase.invoiceNumber})`,
    };
    setSupplierTransactions(prev => [suppTxn, ...prev]);

    addAuditLog('PURCHASE_RETURN', 'purchase', purchase.id, `ক্রয় ফেরত লিপিবদ্ধ করা হয়েছে: ${purchase.invoiceNumber}, পরিমাণ: ৳${totalReturnAmt}`);
  };

  // Stock Adjustment
  const adjustStock = (productId: string, adjustedQty: number, reason: StockAdjustment['reason'], note?: string) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    const now = new Date().toISOString();
    const prevStock = prod.currentStock;
    const nextStock = Math.max(0, prevStock + adjustedQty);

    setProducts(prev =>
      prev.map(p => (p.id === productId ? { ...p, currentStock: nextStock, updatedAt: now } : p))
    );

    const adjustment: StockAdjustment = {
      id: `adj-${Date.now()}`,
      productId,
      productName: prod.name,
      date: now,
      adjustedQty,
      reason,
      note,
      adjustedBy: currentUserRole,
    };
    setStockAdjustments(prev => [adjustment, ...prev]);

    const movement: StockMovement = {
      id: `sm-${Date.now()}`,
      productId,
      productName: prod.name,
      date: now,
      type: 'adjustment',
      quantity: adjustedQty,
      previousStock: prevStock,
      newStock: nextStock,
      branchId: activeBranchId,
      note: `ম্যানুয়াল স্টক সমন্বয়: ${reason} (${note || ''})`,
    };
    setStockMovements(prev => [movement, ...prev]);

    addAuditLog('STOCK_ADJUSTMENT', 'stock', productId, `স্টক সমন্বয়: ${prod.name}, সমন্বয় পরিমাণ: ${adjustedQty > 0 ? '+' : ''}${adjustedQty}, কারণ: ${reason}`);
  };

  // Stock Transfer between branches
  const transferStock = (productId: string, quantity: number, fromBranchId: string, toBranchId: string, note?: string) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    const fromBranch = branches.find(b => b.id === fromBranchId);
    const toBranch = branches.find(b => b.id === toBranchId);
    const now = new Date().toISOString();

    const transfer: StockTransfer = {
      id: `tf-${Date.now()}`,
      date: now,
      productId,
      productName: prod.name,
      quantity,
      fromBranchId,
      fromBranchName: fromBranch?.name || fromBranchId,
      toBranchId,
      toBranchName: toBranch?.name || toBranchId,
      transferredBy: currentUserRole,
      note,
    };

    setStockTransfers(prev => [transfer, ...prev]);

    const movement: StockMovement = {
      id: `sm-${Date.now()}`,
      productId,
      productName: prod.name,
      date: now,
      type: 'transfer',
      quantity: 0,
      previousStock: prod.currentStock,
      newStock: prod.currentStock,
      branchId: toBranchId,
      note: `শাখা ট্রান্সফার: ${fromBranch?.name} -> ${toBranch?.name} (${quantity} ${prod.unit})`,
    };
    setStockMovements(prev => [movement, ...prev]);

    addAuditLog('STOCK_TRANSFER', 'stock', productId, `শাখা স্টক স্থানান্তর: ${prod.name} (${quantity} ${prod.unit}) ${fromBranch?.name} হতে ${toBranch?.name}`);
  };

  // Customers
  const addCustomer = (data: Omit<Customer, 'id' | 'createdAt' | 'currentDue' | 'totalPurchase' | 'totalPaid' | 'openingDue'> & { openingDue?: number }): Customer => {
    const opDue = data.openingDue || 0;
    const newCust: Customer = {
      ...data,
      id: `cust-${Date.now()}`,
      openingDue: opDue,
      currentDue: opDue,
      totalPurchase: opDue,
      totalPaid: 0,
      createdAt: new Date().toISOString(),
    };
    setCustomers(prev => [newCust, ...prev]);
    addAuditLog('CUSTOMER_CREATED', 'customer', newCust.id, `নতুন কাস্টমার যোগ করা হয়েছে: ${newCust.name} (${newCust.mobile})`);
    return newCust;
  };

  const updateCustomer = (id: string, data: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => (c.id === id ? { ...c, ...data } : c)));
    addAuditLog('CUSTOMER_UPDATED', 'customer', id, `কাস্টমার তথ্য আপডেট করা হয়েছে (ID: ${id})`);
  };

  const collectCustomerDue = (customerId: string, amount: number, paymentMethod: PaymentMethod, accountId: string, note?: string) => {
    const target = customers.find(c => c.id === customerId);
    if (!target || amount <= 0) return;

    const now = new Date().toISOString();
    const nextDue = Math.max(0, target.currentDue - amount);

    setCustomers(prev =>
      prev.map(c => {
        if (c.id === customerId) {
          return {
            ...c,
            currentDue: nextDue,
            totalPaid: c.totalPaid + amount,
          };
        }
        return c;
      })
    );

    // Record customer ledger transaction
    const txn: CustomerTransaction = {
      id: `ctx-${Date.now()}`,
      customerId,
      customerName: target.name,
      date: now,
      type: 'due_collection',
      amount,
      balanceAfter: nextDue,
      paymentMethod,
      referenceId: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
      note: note || 'বকেয়া টাকা আদায় (Due Payment Received)',
    };
    setCustomerTransactions(prev => [txn, ...prev]);

    // Increase account balance & record account transaction
    setAccounts(prev =>
      prev.map(acc => {
        if (acc.id === accountId) {
          const newBal = acc.balance + amount;
          const accTxn: AccountTransaction = {
            id: `atx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            accountId: acc.id,
            accountName: acc.name,
            date: now,
            type: 'customer_payment',
            amount,
            balanceAfter: newBal,
            referenceId: txn.referenceId,
            note: `কাস্টমার বকেয়া আদায়: ${target.name} (${paymentMethod})`,
          };
          setAccountTransactions(txns => [accTxn, ...txns]);
          return { ...acc, balance: newBal };
        }
        return acc;
      })
    );

    addAuditLog('CUSTOMER_DUE_COLLECTED', 'customer', customerId, `কাস্টমার বকেয়া আদায়: ${target.name}, আদায়কৃত টাকা: ৳${amount}`);
  };

  // Suppliers
  const addSupplier = (data: Omit<Supplier, 'id' | 'createdAt' | 'currentDue' | 'totalPurchase' | 'totalPaid' | 'openingDue'> & { openingDue?: number }): Supplier => {
    const opDue = data.openingDue || 0;
    const newSupp: Supplier = {
      ...data,
      id: `supp-${Date.now()}`,
      openingDue: opDue,
      currentDue: opDue,
      totalPurchase: opDue,
      totalPaid: 0,
      createdAt: new Date().toISOString(),
    };
    setSuppliers(prev => [newSupp, ...prev]);
    addAuditLog('SUPPLIER_CREATED', 'supplier', newSupp.id, `নতুন সাপ্লায়ার যোগ করা হয়েছে: ${newSupp.name} (${newSupp.company})`);
    return newSupp;
  };

  const updateSupplier = (id: string, data: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(s => (s.id === id ? { ...s, ...data } : s)));
    addAuditLog('SUPPLIER_UPDATED', 'supplier', id, `সাপ্লায়ার তথ্য আপডেট করা হয়েছে (ID: ${id})`);
  };

  const paySupplierDue = (supplierId: string, amount: number, paymentMethod: PaymentMethod, accountId: string, note?: string) => {
    const target = suppliers.find(s => s.id === supplierId);
    if (!target || amount <= 0) return;

    const now = new Date().toISOString();
    const nextDue = Math.max(0, target.currentDue - amount);

    setSuppliers(prev =>
      prev.map(s => {
        if (s.id === supplierId) {
          return {
            ...s,
            currentDue: nextDue,
            totalPaid: s.totalPaid + amount,
          };
        }
        return s;
      })
    );

    // Record supplier transaction
    const txn: SupplierTransaction = {
      id: `stx-${Date.now()}`,
      supplierId,
      supplierName: target.name,
      date: now,
      type: 'due_payment',
      amount,
      balanceAfter: nextDue,
      paymentMethod,
      referenceId: `PAY-${Math.floor(1000 + Math.random() * 9000)}`,
      note: note || 'সাপ্লায়ার বাকি পরিশোধ',
    };
    setSupplierTransactions(prev => [txn, ...prev]);

    // Deduct account balance & record account transaction
    setAccounts(prev =>
      prev.map(acc => {
        if (acc.id === accountId) {
          const newBal = Math.max(0, acc.balance - amount);
          const accTxn: AccountTransaction = {
            id: `atx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            accountId: acc.id,
            accountName: acc.name,
            date: now,
            type: 'supplier_payment',
            amount: -amount,
            balanceAfter: newBal,
            referenceId: txn.referenceId,
            note: `সাপ্লায়ার বকেয়া পরিশোধ: ${target.name} (${paymentMethod})`,
          };
          setAccountTransactions(txns => [accTxn, ...txns]);
          return { ...acc, balance: newBal };
        }
        return acc;
      })
    );

    addAuditLog('SUPPLIER_DUE_PAID', 'supplier', supplierId, `সাপ্লায়ার বাকি পরিশোধ: ${target.name}, পরিশোধকৃত টাকা: ৳${amount}`);
  };

  // Accounts & Expenses
  const addExpense = (expenseData: Omit<Expense, 'id' | 'date'>) => {
    const now = new Date().toISOString();
    const newExp: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
      date: now,
    };

    setExpenses(prev => [newExp, ...prev]);

    // Deduct from account & record account transaction
    setAccounts(prev =>
      prev.map(acc => {
        if (acc.id === expenseData.accountId) {
          const newBal = acc.balance - expenseData.amount;
          const accTxn: AccountTransaction = {
            id: `atx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            accountId: acc.id,
            accountName: acc.name,
            date: now,
            type: 'expense',
            amount: -expenseData.amount,
            balanceAfter: newBal,
            referenceId: newExp.id,
            note: `খরচ: ${newExp.category} (${newExp.note || ''})`,
          };
          setAccountTransactions(txns => [accTxn, ...txns]);
          return { ...acc, balance: newBal };
        }
        return acc;
      })
    );

    addAuditLog('EXPENSE_CREATED', 'expense', newExp.id, `নতুন খরচ এন্ট্রি: ${newExp.category}, পরিমাণ: ৳${newExp.amount}`);
  };

  const transferMoney = (fromAccountId: string, toAccountId: string, amount: number, note?: string) => {
    if (amount <= 0 || fromAccountId === toAccountId) return;
    const now = new Date().toISOString();

    setAccounts(prev => {
      const fromAcc = prev.find(a => a.id === fromAccountId);
      const toAcc = prev.find(a => a.id === toAccountId);
      if (!fromAcc || !toAcc) return prev;

      const newFromBal = fromAcc.balance - amount;
      const newToBal = toAcc.balance + amount;

      const txnOut: AccountTransaction = {
        id: `atx-${Date.now()}-out`,
        accountId: fromAccountId,
        accountName: fromAcc.name,
        date: now,
        type: 'transfer_out',
        amount: -amount,
        balanceAfter: newFromBal,
        note: `ট্রান্সফার প্রেরণ -> ${toAcc.name} (${note || ''})`,
      };
      const txnIn: AccountTransaction = {
        id: `atx-${Date.now()}-in`,
        accountId: toAccountId,
        accountName: toAcc.name,
        date: now,
        type: 'transfer_in',
        amount: amount,
        balanceAfter: newToBal,
        note: `ট্রান্সফার গ্রহণ <- ${fromAcc.name} (${note || ''})`,
      };
      setAccountTransactions(txns => [txnIn, txnOut, ...txns]);

      return prev.map(acc => {
        if (acc.id === fromAccountId) return { ...acc, balance: newFromBal };
        if (acc.id === toAccountId) return { ...acc, balance: newToBal };
        return acc;
      });
    });

    addAuditLog('ACCOUNT_TRANSFER', 'account', `${fromAccountId}->${toAccountId}`, `একাউন্ট ট্রান্সফার: ৳${amount}`);
  };

  // Employees
  const addEmployee = (empData: Omit<Employee, 'id'>) => {
    const newEmp: Employee = {
      ...empData,
      id: `emp-${Date.now()}`,
    };
    setEmployees(prev => [...prev, newEmp]);
    addAuditLog('EMPLOYEE_CREATED', 'employee', newEmp.id, `নতুন কর্মচারী এন্ট্রি: ${newEmp.name} (${newEmp.position})`);
  };

  const updateEmployee = (id: string, empData: Partial<Employee>) => {
    setEmployees(prev => prev.map(e => (e.id === id ? { ...e, ...empData } : e)));
    addAuditLog('EMPLOYEE_UPDATED', 'employee', id, `কর্মচারী তথ্য পরিবর্তন করা হয়েছে (ID: ${id})`);
  };

  const disburseSalary = (employeeId: string, month: string, accountId: string, amount: number) => {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return;

    addExpense({
      category: 'স্টাফ বেতন (Staff Salary)',
      amount,
      paymentMethod: 'cash',
      accountId,
      paidTo: `${emp.name} (${emp.position})`,
      note: `${month} মাসের বেতন প্রদান`,
    });

    addAuditLog('SALARY_DISBURSED', 'employee', employeeId, `বেতন প্রদান: ${emp.name}, Month: ${month}, পরিমাণ: ৳${amount}`);
  };

  // Admin-only Delete Operations
  const deleteSale = (saleId: string): boolean => {
    if (!isAdmin) {
      addAuditLog('UNAUTHORIZED_DELETE_ATTEMPT', 'sale', saleId, `অননুমোদিত ডিলিট চেষ্টা: রোল (${currentUserRole}) ইনভয়েস মুছে ফেলতে পারবে না`);
      return false;
    }

    const sale = sales.find(s => s.id === saleId);
    if (!sale) return false;

    const now = new Date().toISOString();

    // 1. If sale was not already returned or voided, reverse inventory & restore stock
    if (sale.status !== 'returned' && sale.status !== 'voided') {
      setProducts(prev => {
        const updated = [...prev];
        sale.items.forEach(item => {
          const pIndex = updated.findIndex(p => p.id === item.productId);
          if (pIndex !== -1) {
            const prod = updated[pIndex];
            const nextStock = prod.currentStock + item.quantity;
            let newVariants = prod.variants;
            if (prod.hasVariants && prod.variants && item.variantId) {
              newVariants = prod.variants.map(v => {
                if (v.id === item.variantId) {
                  return { ...v, stock: v.stock + item.quantity };
                }
                return v;
              });
            }

            updated[pIndex] = {
              ...prod,
              currentStock: nextStock,
              variants: newVariants,
              updatedAt: now,
            };

            const movement: StockMovement = {
              id: `sm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              productId: prod.id,
              productName: prod.name,
              date: now,
              type: 'sale_return',
              quantity: item.quantity,
              previousStock: prod.currentStock,
              newStock: nextStock,
              reference: sale.invoiceNumber,
              branchId: sale.branchId,
              note: `ইনভয়েস ${sale.invoiceNumber} ডিলিটের কারণে স্টক পুনরুদ্ধার`,
            };
            setStockMovements(m => [movement, ...m]);
          }
        });
        return updated;
      });

      // 2. Reverse payments from account balances
      if (sale.paid > 0) {
        const paymentsToReverse = (sale.payments && sale.payments.length > 0)
          ? sale.payments
          : [{ method: sale.paymentMethod, amount: sale.paid }];

        setAccounts(prev => {
          let updatedAccounts = [...prev];
          paymentsToReverse.forEach(p => {
            if (p.amount <= 0) return;
            const targetAccId = p.accountId || getAccountIdForMethod(p.method);
            const accIndex = updatedAccounts.findIndex(a => a.id === targetAccId);

            if (accIndex !== -1) {
              const acc = updatedAccounts[accIndex];
              const newBal = Math.max(0, acc.balance - p.amount);
              updatedAccounts[accIndex] = { ...acc, balance: newBal };

              const accTxn: AccountTransaction = {
                id: `atx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                accountId: acc.id,
                accountName: acc.name,
                date: now,
                type: 'refund',
                amount: -p.amount,
                balanceAfter: newBal,
                referenceId: sale.invoiceNumber,
                note: `ইনভয়েস ${sale.invoiceNumber} ডিলিট: পেমেন্ট প্রত্যাহার (${p.method})`,
              };
              setAccountTransactions(txns => [accTxn, ...txns]);
            }
          });
          return updatedAccounts;
        });
      }

      // 3. Reverse customer due and totals
      if (sale.customerId) {
        setCustomers(prev =>
          prev.map(c => {
            if (c.id === sale.customerId) {
              return {
                ...c,
                currentDue: Math.max(0, c.currentDue - sale.due),
                totalPurchase: Math.max(0, c.totalPurchase - sale.total),
                totalPaid: Math.max(0, c.totalPaid - sale.paid),
              };
            }
            return c;
          })
        );

        if (sale.due > 0) {
          const custTxn: CustomerTransaction = {
            id: `ctx-${Date.now()}`,
            customerId: sale.customerId,
            customerName: sale.customerName,
            date: now,
            type: 'return_adjustment',
            amount: sale.due,
            balanceAfter: 0,
            referenceId: sale.invoiceNumber,
            note: `Invoice ${sale.invoiceNumber} deleted: due balance reversed`,
          };
          setCustomerTransactions(prev => [custTxn, ...prev]);
        }
      }
    }

    // 4. Remove the sale
    setSales(prev => prev.filter(s => s.id !== saleId));
    addAuditLog('INVOICE_DELETED', 'sale', sale.id, `Invoice ${sale.invoiceNumber} permanently deleted (stock & balance reversed)`);
    return true;
  };

  const deletePurchase = (purchaseId: string): boolean => {
    if (!isAdmin) {
      addAuditLog('UNAUTHORIZED_DELETE_ATTEMPT', 'purchase', purchaseId, `Unauthorized delete attempt: role (${currentUserRole}) cannot delete purchase bill`);
      return false;
    }

    const purchase = purchases.find(p => p.id === purchaseId);
    if (!purchase) return false;

    const now = new Date().toISOString();

    // 1. Deduct stock for all purchase items
    setProducts(prev => {
      const updated = [...prev];
      purchase.items.forEach(item => {
        const pIndex = updated.findIndex(p => p.id === item.productId);
        if (pIndex !== -1) {
          const prod = updated[pIndex];
          const nextStock = Math.max(0, prod.currentStock - item.quantity);
          updated[pIndex] = {
            ...prod,
            currentStock: nextStock,
            updatedAt: now,
          };

          const movement: StockMovement = {
            id: `sm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            productId: prod.id,
            productName: prod.name,
            date: now,
            type: 'purchase_return',
            quantity: -item.quantity,
            previousStock: prod.currentStock,
            newStock: nextStock,
            reference: purchase.invoiceNumber,
            branchId: purchase.branchId,
            note: `ক্রয় চালান ${purchase.invoiceNumber} ডিলিটের কারণে স্টক সমন্বয়`,
          };
          setStockMovements(m => [movement, ...m]);
        }
      });
      return updated;
    });

    // 2. Reverse supplier due and purchases
    if (purchase.supplierId) {
      setSuppliers(prev =>
        prev.map(s => {
          if (s.id === purchase.supplierId) {
            return {
              ...s,
              currentDue: Math.max(0, s.currentDue - purchase.due),
              totalPurchase: Math.max(0, s.totalPurchase - purchase.total),
              totalPaid: Math.max(0, s.totalPaid - purchase.paid),
            };
          }
          return s;
        })
      );

      if (purchase.due > 0) {
        const suppTxn: SupplierTransaction = {
          id: `stx-${Date.now()}`,
          supplierId: purchase.supplierId,
          supplierName: purchase.supplierName,
          date: now,
          type: 'return_adjustment',
          amount: purchase.due,
          balanceAfter: 0,
          referenceId: purchase.invoiceNumber,
          note: `ক্রয় চালান ${purchase.invoiceNumber} ডিলিট: বকেয়া রিভার্স`,
        };
        setSupplierTransactions(prev => [suppTxn, ...prev]);
      }
    }

    // 3. Restore money back into account if purchase had paid amount
    if (purchase.paid > 0) {
      const targetAccId = getAccountIdForMethod(purchase.paymentMethod);
      setAccounts(prev =>
        prev.map(acc => {
          if (acc.id === targetAccId) {
            const newBal = acc.balance + purchase.paid;
            const accTxn: AccountTransaction = {
              id: `atx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              accountId: acc.id,
              accountName: acc.name,
              date: now,
              type: 'adjustment',
              amount: purchase.paid,
              balanceAfter: newBal,
              referenceId: purchase.invoiceNumber,
              note: `Purchase bill ${purchase.invoiceNumber} deleted: paid amount refunded to account`,
            };
            setAccountTransactions(txns => [accTxn, ...txns]);
            return { ...acc, balance: newBal };
          }
          return acc;
        })
      );
    }

    // 4. Remove purchase
    setPurchases(prev => prev.filter(p => p.id !== purchaseId));
    addAuditLog('PURCHASE_DELETED', 'purchase', purchaseId, `Purchase bill ${purchase.invoiceNumber} deleted by Admin (stock & balance reconciled)`);
    return true;
  };

  const deleteCustomer = (customerId: string): { success: boolean; message?: string } => {
    if (!isAdmin) {
      addAuditLog('UNAUTHORIZED_DELETE_ATTEMPT', 'customer', customerId, `Unauthorized delete attempt: role (${currentUserRole}) cannot delete customer`);
      return { success: false, message: 'Only Admin can delete customer records.' };
    }

    const customer = customers.find(c => c.id === customerId);
    if (!customer) return { success: false, message: 'Customer not found' };

    if (customer.currentDue > 0) {
      return {
        success: false,
        message: `Customer has outstanding due (৳${customer.currentDue}). Please clear or adjust balance before deletion.`,
      };
    }

    setCustomers(prev => prev.filter(c => c.id !== customerId));
    addAuditLog('CUSTOMER_DELETED', 'customer', customerId, `Customer deleted: ${customer.name} (${customer.mobile})`);
    return { success: true };
  };

  const deleteSupplier = (supplierId: string): { success: boolean; message?: string } => {
    if (!isAdmin) {
      addAuditLog('UNAUTHORIZED_DELETE_ATTEMPT', 'supplier', supplierId, `Unauthorized delete attempt: role (${currentUserRole}) cannot delete supplier`);
      return { success: false, message: 'Only Admin can delete supplier records.' };
    }

    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) return { success: false, message: 'Supplier not found' };

    if (supplier.currentDue > 0) {
      return {
        success: false,
        message: `Supplier has outstanding balance (৳${supplier.currentDue}). Please settle due before deletion.`,
      };
    }

    setSuppliers(prev => prev.filter(s => s.id !== supplierId));
    addAuditLog('SUPPLIER_DELETED', 'supplier', supplierId, `Supplier deleted: ${supplier.name} (${supplier.company})`);
    return { success: true };
  };

  const deleteExpense = (expenseId: string): boolean => {
    if (!isAdmin) {
      addAuditLog('UNAUTHORIZED_DELETE_ATTEMPT', 'expense', expenseId, `Unauthorized delete attempt: role (${currentUserRole}) cannot delete expense`);
      return false;
    }

    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) return false;

    const now = new Date().toISOString();

    // Restore amount to account
    setAccounts(prev =>
      prev.map(acc => {
        if (acc.id === expense.accountId) {
          const newBal = acc.balance + expense.amount;
          const accTxn: AccountTransaction = {
            id: `atx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            accountId: acc.id,
            accountName: acc.name,
            date: now,
            type: 'adjustment',
            amount: expense.amount,
            balanceAfter: newBal,
            referenceId: expense.id,
            note: `Expense deleted: balance restored to account (${expense.category})`,
          };
          setAccountTransactions(txns => [accTxn, ...txns]);
          return { ...acc, balance: newBal };
        }
        return acc;
      })
    );

    setExpenses(prev => prev.filter(e => e.id !== expenseId));
    addAuditLog('EXPENSE_DELETED', 'expense', expenseId, `Expense record deleted: ${expense.category}, amount: ৳${expense.amount}`);
    return true;
  };

  const deleteEmployee = (employeeId: string): boolean => {
    if (!isAdmin) {
      addAuditLog('UNAUTHORIZED_DELETE_ATTEMPT', 'employee', employeeId, `Unauthorized delete attempt: role (${currentUserRole}) cannot delete employee`);
      return false;
    }

    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return false;

    setEmployees(prev => prev.filter(e => e.id !== employeeId));
    addAuditLog('EMPLOYEE_DELETED', 'employee', employeeId, `Employee record deleted: ${emp.name} (${emp.position})`);
    return true;
  };

  // Backup & Restore
  const backupData = (): string => {
    const data = {
      settings,
      branches,
      categories,
      products,
      customers,
      customerTransactions,
      suppliers,
      supplierTransactions,
      sales,
      purchases,
      accounts,
      accountTransactions,
      expenses,
      employees,
      stockMovements,
      stockAdjustments,
      stockTransfers,
      auditLogs,
      exportDate: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  };

  const restoreData = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.categories) setCategories(parsed.categories);
      if (parsed.products) setProducts(parsed.products);
      if (parsed.customers) setCustomers(parsed.customers);
      if (parsed.suppliers) setSuppliers(parsed.suppliers);
      if (parsed.sales) setSales(parsed.sales);
      if (parsed.purchases) setPurchases(parsed.purchases);
      if (parsed.accounts) setAccounts(parsed.accounts);
      if (parsed.accountTransactions) setAccountTransactions(parsed.accountTransactions);
      if (parsed.expenses) setExpenses(parsed.expenses);
      if (parsed.settings) setSettings(parsed.settings);
      if (parsed.branches) setBranches(parsed.branches);
      if (parsed.employees) setEmployees(parsed.employees);
      if (parsed.stockMovements) setStockMovements(parsed.stockMovements);
      if (parsed.auditLogs) setAuditLogs(parsed.auditLogs);

      addAuditLog('DATA_RESTORED', 'system', 'backup', 'System backup restore completed successfully');
      return true;
    } catch (e) {
      console.error('Failed to restore data:', e);
      return false;
    }
  };

  const resetToDemoData = () => {
    setSettings(initialSettings);
    setBranches(initialBranches);
    setCategories(initialCategories);
    setProducts(initialProducts.map(p => ({ ...p, isActive: true })));
    setCustomers(initialCustomers);
    setSuppliers(initialSuppliers);
    setSales(initialSales);
    setPurchases(initialPurchases);
    setAccounts(initialAccounts);
    setAccountTransactions([]);
    setExpenses(initialExpenses);
    setEmployees(initialEmployees);
    setStockMovements(initialStockMovements);
    setStockAdjustments([]);
    setStockTransfers([]);
    setCustomerTransactions([]);
    setSupplierTransactions([]);
    setAuditLogs(initialAuditLogs);
  };

  return (
    <AppContext.Provider
      value={{
        settings,
        updateSettings,
        currentUserRole,
        setCurrentUserRole,
        activeBranchId,
        setActiveBranchId,
        branches,
        addBranch,
        categories,
        addCategory,
        deleteCategory,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        sales,
        recordSale,
        recordSaleReturn,
        quickRefundSale,
        voidSale,
        purchases,
        recordPurchase,
        recordPurchaseReturn,
        stockMovements,
        stockAdjustments,
        stockTransfers,
        adjustStock,
        transferStock,
        customers,
        customerTransactions,
        addCustomer,
        updateCustomer,
        collectCustomerDue,
        suppliers,
        supplierTransactions,
        addSupplier,
        updateSupplier,
        paySupplierDue,
        accounts,
        accountTransactions,
        expenses,
        addExpense,
        transferMoney,
        employees,
        addEmployee,
        updateEmployee,
        disburseSalary,
        auditLogs,
        addAuditLog,
        isAdmin,
        deleteSale,
        deletePurchase,
        deleteCustomer,
        deleteSupplier,
        deleteExpense,
        deleteEmployee,
        backupData,
        restoreData,
        resetToDemoData,
        canAccess,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
