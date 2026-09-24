import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  Customer,
  Supplier,
  Sale,
  SaleReturn,
  Purchase,
  StockMovement,
  StockAdjustment,
  StockTransfer,
  Account,
  Expense,
  Employee,
  Branch,
  ShopSettings,
  UserRole,
  PaymentMethod,
  CustomerTransaction,
  SupplierTransaction,
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
} from '../data/initialData';
import { generateInvoiceNumber } from '../utils/formatters';

interface AppContextType {
  settings: ShopSettings;
  updateSettings: (newSettings: Partial<ShopSettings>) => void;
  currentUserRole: UserRole;
  setCurrentUserRole: (role: UserRole) => void;
  activeBranchId: string;
  setActiveBranchId: (branchId: string) => void;
  branches: Branch[];
  addBranch: (branch: Omit<Branch, 'id'>) => void;

  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Product;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // Sales & POS
  sales: Sale[];
  recordSale: (saleData: Omit<Sale, 'id' | 'invoiceNumber' | 'date' | 'status'>) => Sale;
  recordSaleReturn: (saleId: string, items: { productId: string; quantity: number; unitPrice: number; reason: string }[], refundType: 'cash' | 'adjust_due') => void;

  // Purchases
  purchases: Purchase[];
  recordPurchase: (purchaseData: Omit<Purchase, 'id' | 'invoiceNumber' | 'date'>) => Purchase;

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
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'date'>) => void;
  transferMoney: (fromAccountId: string, toAccountId: string, amount: number, note?: string) => void;

  // Employees & Payroll
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, employee: Partial<Employee>) => void;
  disburseSalary: (employeeId: string, month: string, accountId: string, amount: number) => void;

  // System Helpers
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
      return saved ? JSON.parse(saved) : initialSettings;
    } catch {
      return initialSettings;
    }
  });

  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('owner');
  const [activeBranchId, setActiveBranchId] = useState<string>('branch-1');

  const [branches, setBranches] = useState<Branch[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_BRANCHES`);
      return saved ? JSON.parse(saved) : initialBranches;
    } catch {
      return initialBranches;
    }
  });

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_PRODUCTS`);
      return saved ? JSON.parse(saved) : initialProducts;
    } catch {
      return initialProducts;
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
          note: 'বাকি সেল'
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
          note: 'বাকি ক্রয়'
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
    localStorage.setItem(`${STORAGE_KEY}_EXPENSES`, JSON.stringify(expenses));
  }, [expenses]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_EMPLOYEES`, JSON.stringify(employees));
  }, [employees]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_MOVEMENTS`, JSON.stringify(stockMovements));
  }, [stockMovements]);

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
  };

  const addBranch = (branchData: Omit<Branch, 'id'>) => {
    const newBranch: Branch = {
      ...branchData,
      id: `branch-${Date.now()}`,
    };
    setBranches(prev => [...prev, newBranch]);
  };

  // Products CRUD
  const addProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product => {
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };

    setProducts(prev => [newProduct, ...prev]);

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

    return newProduct;
  };

  const updateProduct = (id: string, productData: Partial<Product>) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === id) {
          return {
            ...p,
            ...productData,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  // Sales
  const recordSale = (saleData: Omit<Sale, 'id' | 'invoiceNumber' | 'date' | 'status'>): Sale => {
    const now = new Date().toISOString();
    const invoiceNumber = generateInvoiceNumber('INV');
    const status: Sale['status'] = saleData.due <= 0 ? 'paid' : (saleData.paid <= 0 ? 'due' : 'partial');

    const newSale: Sale = {
      ...saleData,
      id: `sale-${Date.now()}`,
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
            id: `sm-${Date.now()}-${Math.random()}`,
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

    // 3. Add Received Payment to Account Balance
    if (newSale.paid > 0) {
      setAccounts(prev =>
        prev.map(acc => {
          // Add to Cash drawer if cash, bKash if bKash, etc.
          let matched = false;
          if (newSale.paymentMethod === 'cash' && acc.id === 'acc-cash') matched = true;
          else if (newSale.paymentMethod === 'bkash' && acc.id === 'acc-bkash') matched = true;
          else if (newSale.paymentMethod === 'nagad' && acc.id === 'acc-nagad') matched = true;
          else if (newSale.paymentMethod === 'bank' && acc.id === 'acc-islami') matched = true;
          else if (newSale.paymentMethod === 'card' && acc.id === 'acc-islami') matched = true;
          else if (newSale.paymentMethod === 'mixed' && acc.id === 'acc-cash') matched = true;

          if (matched) {
            return { ...acc, balance: acc.balance + newSale.paid };
          }
          return acc;
        })
      );
    }

    setSales(prev => [newSale, ...prev]);
    return newSale;
  };

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
            id: `sm-${Date.now()}-${Math.random()}`,
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
    } else if (refundType === 'cash') {
      setAccounts(prev =>
        prev.map(a => (a.id === 'acc-cash' ? { ...a, balance: Math.max(0, a.balance - totalRefund) } : a))
      );
    }

    // Update sale status
    setSales(prev =>
      prev.map(s => (s.id === saleId ? { ...s, status: 'returned' } : s))
    );
  };

  // Purchases
  const recordPurchase = (purchaseData: Omit<Purchase, 'id' | 'invoiceNumber' | 'date'>): Purchase => {
    const now = new Date().toISOString();
    const invoiceNumber = generateInvoiceNumber('PUR');

    const newPurchase: Purchase = {
      ...purchaseData,
      id: `pur-${Date.now()}`,
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
            id: `sm-${Date.now()}-${Math.random()}`,
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
      setAccounts(prev =>
        prev.map(acc => {
          let matched = false;
          if (newPurchase.paymentMethod === 'cash' && acc.id === 'acc-cash') matched = true;
          else if (newPurchase.paymentMethod === 'bank' && acc.id === 'acc-islami') matched = true;
          else if (newPurchase.paymentMethod === 'bkash' && acc.id === 'acc-bkash') matched = true;

          if (matched) {
            return { ...acc, balance: acc.balance - newPurchase.paid };
          }
          return acc;
        })
      );
    }

    setPurchases(prev => [newPurchase, ...prev]);
    return newPurchase;
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
    return newCust;
  };

  const updateCustomer = (id: string, data: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => (c.id === id ? { ...c, ...data } : c)));
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

    // Increase account balance
    setAccounts(prev =>
      prev.map(acc => (acc.id === accountId ? { ...acc, balance: acc.balance + amount } : acc))
    );
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
    return newSupp;
  };

  const updateSupplier = (id: string, data: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(s => (s.id === id ? { ...s, ...data } : s)));
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

    // Deduct account balance
    setAccounts(prev =>
      prev.map(acc => (acc.id === accountId ? { ...acc, balance: Math.max(0, acc.balance - amount) } : acc))
    );
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

    // Deduct from account
    setAccounts(prev =>
      prev.map(acc => (acc.id === expenseData.accountId ? { ...acc, balance: acc.balance - expenseData.amount } : acc))
    );
  };

  const transferMoney = (fromAccountId: string, toAccountId: string, amount: number, note?: string) => {
    if (amount <= 0 || fromAccountId === toAccountId) return;
    setAccounts(prev =>
      prev.map(acc => {
        if (acc.id === fromAccountId) {
          return { ...acc, balance: acc.balance - amount };
        }
        if (acc.id === toAccountId) {
          return { ...acc, balance: acc.balance + amount };
        }
        return acc;
      })
    );
  };

  // Employees
  const addEmployee = (empData: Omit<Employee, 'id'>) => {
    const newEmp: Employee = {
      ...empData,
      id: `emp-${Date.now()}`,
    };
    setEmployees(prev => [...prev, newEmp]);
  };

  const updateEmployee = (id: string, empData: Partial<Employee>) => {
    setEmployees(prev => prev.map(e => (e.id === id ? { ...e, ...empData } : e)));
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
  };

  // Backup & Restore
  const backupData = (): string => {
    const data = {
      settings,
      branches,
      products,
      customers,
      customerTransactions,
      suppliers,
      supplierTransactions,
      sales,
      purchases,
      accounts,
      expenses,
      employees,
      stockMovements,
      stockAdjustments,
      stockTransfers,
      exportDate: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  };

  const restoreData = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.products) setProducts(parsed.products);
      if (parsed.customers) setCustomers(parsed.customers);
      if (parsed.suppliers) setSuppliers(parsed.suppliers);
      if (parsed.sales) setSales(parsed.sales);
      if (parsed.purchases) setPurchases(parsed.purchases);
      if (parsed.accounts) setAccounts(parsed.accounts);
      if (parsed.expenses) setExpenses(parsed.expenses);
      if (parsed.settings) setSettings(parsed.settings);
      if (parsed.branches) setBranches(parsed.branches);
      if (parsed.employees) setEmployees(parsed.employees);
      if (parsed.stockMovements) setStockMovements(parsed.stockMovements);
      return true;
    } catch (e) {
      console.error('Failed to restore data:', e);
      return false;
    }
  };

  const resetToDemoData = () => {
    setSettings(initialSettings);
    setBranches(initialBranches);
    setProducts(initialProducts);
    setCustomers(initialCustomers);
    setSuppliers(initialSuppliers);
    setSales(initialSales);
    setPurchases(initialPurchases);
    setAccounts(initialAccounts);
    setExpenses(initialExpenses);
    setEmployees(initialEmployees);
    setStockMovements(initialStockMovements);
    setStockAdjustments([]);
    setStockTransfers([]);
    setCustomerTransactions([]);
    setSupplierTransactions([]);
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
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        sales,
        recordSale,
        recordSaleReturn,
        purchases,
        recordPurchase,
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
        expenses,
        addExpense,
        transferMoney,
        employees,
        addEmployee,
        updateEmployee,
        disburseSalary,
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
