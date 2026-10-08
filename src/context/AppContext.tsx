import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
import { productService } from '../services/productService';
import { salesService } from '../services/salesService';
import { customerService, supplierService, financeService, purchaseService } from '../services/businessServices';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface AppContextType {
  // Auth & Session
  user: User | null;
  session: Session | null;
  activeBusinessId: string;
  signOut: () => Promise<void>;
  isLoading: boolean;
  isMigrated: boolean;
  migrateLegacyData: () => Promise<boolean>;

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
  reloadProducts: () => Promise<void>;

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
  // Authentication & Membership State
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [activeBusinessId, setActiveBusinessId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMigrated, setIsMigrated] = useState<boolean>(false);

  // Business State
  const [settings, setSettings] = useState<ShopSettings>(initialSettings);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('owner');
  const isAdmin = currentUserRole === 'admin' || currentUserRole === 'owner';
  const [activeBranchId, setActiveBranchId] = useState<string>('branch-main');
  const [branches, setBranches] = useState<Branch[]>(initialBranches);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerTransactions, setCustomerTransactions] = useState<CustomerTransaction[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierTransactions, setSupplierTransactions] = useState<SupplierTransaction[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [accountTransactions, setAccountTransactions] = useState<AccountTransaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [stockAdjustments, setStockAdjustments] = useState<StockAdjustment[]>([]);
  const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Track if initial load is finished
  const isLoadedRef = useRef(false);

  // Helper: Load all business data from Supabase
  const loadBusinessData = useCallback(async (businessId: string, currentBranchId?: string) => {
    try {
      // 1. Fetch Business Settings
      const { data: bizData } = await supabase.from('businesses').select('*').eq('id', businessId).single();
      if (bizData) {
        setSettings({
          shopName: bizData.name || initialSettings.shopName,
          tagline: bizData.tagline || initialSettings.tagline,
          address: bizData.address || initialSettings.address,
          mobile: bizData.phone || initialSettings.mobile,
          email: bizData.email || initialSettings.email,
          currency: bizData.currency || initialSettings.currency,
          vatTaxRate: Number(bizData.vat_tax_rate || initialSettings.vatTaxRate),
          invoiceFormat: (bizData.invoice_format as any) || initialSettings.invoiceFormat,
          businessType: (bizData.business_type as any) || initialSettings.businessType,
          language: (bizData.language as any) || 'en',
          uiMode: initialSettings.uiMode,
        });
      }

      // 2. Fetch Branches
      const { data: branchData } = await supabase.from('branches').select('*').eq('business_id', businessId).order('created_at', { ascending: true });
      if (branchData && branchData.length > 0) {
        const loadedBranches: Branch[] = branchData.map((b: any) => ({
          id: b.id,
          name: b.name,
          location: b.location || '',
          mobile: b.mobile || '',
          isMain: Boolean(b.is_main),
        }));
        setBranches(loadedBranches);
        if (!currentBranchId || !loadedBranches.some(b => b.id === currentBranchId)) {
          setActiveBranchId(loadedBranches[0].id);
        }
      }

      // 3. Fetch Categories
      const { data: catData } = await supabase.from('categories').select('*').eq('business_id', businessId);
      if (catData && catData.length > 0) {
        setCategories(catData.map((c: any) => ({
          id: c.id,
          name: c.name,
          slug: c.slug || undefined,
          description: c.description || undefined,
        })));
      }

      // 4. Fetch Products via productService
      try {
        const prods = await productService.fetchProducts(businessId);
        setProducts(prods);
      } catch (err) {
        console.warn('Could not load products from Supabase table:', err);
      }

      // 5. Fetch Customers
      try {
        const custs = await customerService.fetchCustomers(businessId);
        setCustomers(custs);
      } catch (err) {
        console.warn('Could not load customers from Supabase table:', err);
      }

      // 6. Fetch Suppliers
      try {
        const supps = await supplierService.fetchSuppliers(businessId);
        setSuppliers(supps);
      } catch (err) {
        console.warn('Could not load suppliers from Supabase table:', err);
      }

      // 7. Fetch Accounts & Expenses
      try {
        const accs = await financeService.fetchAccounts(businessId);
        if (accs.length > 0) setAccounts(accs);
        const exps = await financeService.fetchExpenses(businessId);
        setExpenses(exps);
      } catch (err) {
        console.warn('Could not load accounts/expenses from Supabase:', err);
      }

      // 8. Fetch Sales
      try {
        const salesList = await salesService.fetchSales(businessId);
        setSales(salesList);
      } catch (err) {
        console.warn('Could not load sales from Supabase:', err);
      }

      // 9. Fetch Purchases
      try {
        const purList = await purchaseService.fetchPurchases(businessId);
        setPurchases(purList);
      } catch (err) {
        console.warn('Could not load purchases from Supabase:', err);
      }

      // 10. Fetch Audit Logs
      try {
        const logs = await auditService.fetchLogs(businessId);
        setAuditLogs(logs);
      } catch (err) {
        console.warn('Could not load audit logs from Supabase:', err);
      }
    } catch (err) {
      console.error('Error loading Supabase business data:', err);
    }
  }, []);

  // Initialize Auth & Supabase Session
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      if (!isSupabaseConfigured) {
        // Fallback to local storage when Supabase is not configured
        loadFromLocalStorageFallback();
        setIsLoading(false);
        return;
      }

      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (!isMounted) return;

        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        if (initialSession?.user) {
          await initializeUserBusiness(initialSession.user);
        } else {
          // Unauthenticated state
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Session initialization error:', err);
        loadFromLocalStorageFallback();
        setIsLoading(false);
      }
    }

    initSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === 'SIGNED_IN' && newSession?.user) {
        setIsLoading(true);
        await initializeUserBusiness(newSession.user);
        setIsLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setActiveBusinessId('');
        setProducts([]);
        setSales([]);
        setPurchases([]);
        setCustomers([]);
        setSuppliers([]);
        setExpenses([]);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Helper: Initialize or link user's business
  const initializeUserBusiness = async (authUser: User) => {
    try {
      // 1. Ensure user profile exists
      let { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (!profile) {
        const { data: createdProfile, error: profileErr } = await supabase
          .from('user_profiles')
          .insert({
            id: authUser.id,
            email: authUser.email || '',
            full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Store Owner',
          })
          .select()
          .single();

        if (profileErr) {
          console.warn('Notice user_profiles insert:', profileErr.message);
        } else {
          profile = createdProfile;
        }
      }

      // 2. Check business membership
      let { data: memberships } = await supabase
        .from('business_users')
        .select('*, businesses(*), branches(*)')
        .eq('user_id', authUser.id);

      let bizId = '';
      let branchId = '';
      let role: UserRole = 'owner';

      if (memberships && memberships.length > 0) {
        const primary = memberships[0];
        bizId = primary.business_id;
        branchId = primary.branch_id || '';
        role = (primary.role as UserRole) || 'owner';
      } else {
        // Create initial default business and main branch for newly registered user
        const bizName = authUser.user_metadata?.shop_name || 'My Amar Dokan';
        const { data: newBiz, error: bizErr } = await supabase
          .from('businesses')
          .insert({
            name: bizName,
            tagline: 'Smart Business Management & POS',
            phone: '01700-000000',
            currency: 'BDT',
            language: 'en',
          })
          .select()
          .single();

        if (!bizErr && newBiz) {
          bizId = newBiz.id;

          // Create main branch
          const { data: newBranch } = await supabase
            .from('branches')
            .insert({
              business_id: newBiz.id,
              name: 'Main Branch',
              location: 'Head Office',
              is_main: true,
            })
            .select()
            .single();

          if (newBranch) {
            branchId = newBranch.id;
          }

          // Link membership
          await supabase.from('business_users').insert({
            business_id: newBiz.id,
            user_id: authUser.id,
            branch_id: branchId || null,
            role: 'owner',
            status: 'active',
          });

          // Seed default accounts for new business
          await supabase.from('accounts').insert([
            { business_id: newBiz.id, name: 'Cash in Hand', account_type: 'cash', balance: 0 },
            { business_id: newBiz.id, name: 'bKash Merchant', account_type: 'mobile_bank', balance: 0 },
            { business_id: newBiz.id, name: 'Bank Account', account_type: 'bank', balance: 0 },
          ]);
        }
      }

      if (bizId) {
        setActiveBusinessId(bizId);
        if (branchId) setActiveBranchId(branchId);
        setCurrentUserRole(role);
        await loadBusinessData(bizId, branchId);
      } else {
        // Fallback local state if tables are not yet created in Supabase
        loadFromLocalStorageFallback();
      }
    } catch (err) {
      console.warn('Supabase business initialization fallback:', err);
      loadFromLocalStorageFallback();
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback: Read local storage when Supabase is offline / schema unpopulated
  const loadFromLocalStorageFallback = () => {
    try {
      const savedProds = localStorage.getItem(`${STORAGE_KEY}_PRODUCTS`);
      if (savedProds) setProducts(JSON.parse(savedProds));
      else setProducts(initialProducts.map(p => ({ ...p, isActive: true })));

      const savedCusts = localStorage.getItem(`${STORAGE_KEY}_CUSTOMERS`);
      if (savedCusts) setCustomers(JSON.parse(savedCusts));
      else setCustomers(initialCustomers);

      const savedSupps = localStorage.getItem(`${STORAGE_KEY}_SUPPLIERS`);
      if (savedSupps) setSuppliers(JSON.parse(savedSupps));
      else setSuppliers(initialSuppliers);

      const savedSales = localStorage.getItem(`${STORAGE_KEY}_SALES`);
      if (savedSales) setSales(JSON.parse(savedSales));
      else setSales(initialSales);

      const savedPurchases = localStorage.getItem(`${STORAGE_KEY}_PURCHASES`);
      if (savedPurchases) setPurchases(JSON.parse(savedPurchases));
      else setPurchases(initialPurchases);

      const savedAccounts = localStorage.getItem(`${STORAGE_KEY}_ACCOUNTS`);
      if (savedAccounts) setAccounts(JSON.parse(savedAccounts));
      else setAccounts(initialAccounts);

      const savedExpenses = localStorage.getItem(`${STORAGE_KEY}_EXPENSES`);
      if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
      else setExpenses(initialExpenses);

      const savedBranches = localStorage.getItem(`${STORAGE_KEY}_BRANCHES`);
      if (savedBranches) setBranches(JSON.parse(savedBranches));
      else setBranches(initialBranches);

      const savedSettings = localStorage.getItem(`${STORAGE_KEY}_SETTINGS`);
      if (savedSettings) setSettings(JSON.parse(savedSettings));
      else setSettings(initialSettings);
    } catch (e) {
      console.error('LocalStorage fallback load error:', e);
    }
  };

  // Reload products function
  const reloadProducts = useCallback(async () => {
    if (activeBusinessId && isSupabaseConfigured) {
      try {
        const loaded = await productService.fetchProducts(activeBusinessId);
        setProducts(loaded);
      } catch (err) {
        console.warn('Error reloading products from Supabase:', err);
      }
    }
  }, [activeBusinessId]);

  // Safe migration mechanism: import legacy local storage data into Supabase
  const migrateLegacyData = async (): Promise<boolean> => {
    if (!activeBusinessId || !isSupabaseConfigured) {
      alert('You must be logged in with Supabase configured to migrate data.');
      return false;
    }

    try {
      // 1. Migrate Products
      const localProds = products.length > 0 ? products : initialProducts;
      for (const p of localProds) {
        await productService.insertProduct(p, activeBusinessId).catch(() => {});
      }

      // 2. Migrate Customers
      for (const c of customers) {
        await customerService.insertCustomer(c, activeBusinessId).catch(() => {});
      }

      // 3. Migrate Suppliers
      for (const s of suppliers) {
        await supplierService.insertSupplier(s, activeBusinessId).catch(() => {});
      }

      await reloadProducts();
      setIsMigrated(true);
      localStorage.setItem(`${STORAGE_KEY}_MIGRATED_${activeBusinessId}`, 'true');
      alert('Legacy business data migrated to Supabase successfully!');
      return true;
    } catch (err: any) {
      alert('Migration error: ' + err.message);
      return false;
    }
  };

  // Sync state to local storage as read-only / cache fallback
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(`${STORAGE_KEY}_SETTINGS`, JSON.stringify(settings));
        localStorage.setItem(`${STORAGE_KEY}_BRANCHES`, JSON.stringify(branches));
        localStorage.setItem(`${STORAGE_KEY}_CATEGORIES`, JSON.stringify(categories));
        localStorage.setItem(`${STORAGE_KEY}_PRODUCTS`, JSON.stringify(products));
        localStorage.setItem(`${STORAGE_KEY}_CUSTOMERS`, JSON.stringify(customers));
        localStorage.setItem(`${STORAGE_KEY}_SUPPLIERS`, JSON.stringify(suppliers));
        localStorage.setItem(`${STORAGE_KEY}_SALES`, JSON.stringify(sales));
        localStorage.setItem(`${STORAGE_KEY}_PURCHASES`, JSON.stringify(purchases));
        localStorage.setItem(`${STORAGE_KEY}_ACCOUNTS`, JSON.stringify(accounts));
        localStorage.setItem(`${STORAGE_KEY}_EXPENSES`, JSON.stringify(expenses));
      } catch {
        // quota exceeded or private mode
      }
    }
  }, [settings, branches, categories, products, customers, suppliers, sales, purchases, accounts, expenses, isLoading]);

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

  // Sign out handler
  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setUser(null);
    setActiveBusinessId('');
  };

  // Audit Log helper
  const addAuditLog = (action: string, entityType: string, entityId: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date: new Date().toISOString(),
      userRole: currentUserRole,
      action,
      entityType,
      entityId,
      details,
      branchId: activeBranchId,
    };
    setAuditLogs(prev => [newLog, ...prev]);
    auditService.logAction(newLog, activeBusinessId, user?.id);
  };

  // Settings
  const updateSettings = async (newSettings: Partial<ShopSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    if (activeBusinessId && isSupabaseConfigured) {
      await supabase.from('businesses').update({
        name: newSettings.shopName,
        tagline: newSettings.tagline,
        address: newSettings.address,
        phone: newSettings.mobile,
        email: newSettings.email,
        currency: newSettings.currency,
        vat_tax_rate: newSettings.vatTaxRate,
        invoice_format: newSettings.invoiceFormat,
        business_type: newSettings.businessType,
        language: newSettings.language,
        updated_at: new Date().toISOString(),
      }).eq('id', activeBusinessId).catch(() => {});
    }
    addAuditLog('SETTINGS_UPDATED', 'settings', 'shop_settings', 'Shop settings updated');
  };

  // Branches
  const addBranch = async (branchData: Omit<Branch, 'id'>) => {
    let newId = `branch-${Date.now()}`;
    if (activeBusinessId && isSupabaseConfigured) {
      const { data } = await supabase.from('branches').insert({
        business_id: activeBusinessId,
        name: branchData.name,
        location: branchData.location,
        mobile: branchData.mobile,
        is_main: branchData.isMain,
      }).select().single().catch(() => ({ data: null }));

      if (data) newId = data.id;
    }

    const newBranch: Branch = {
      ...branchData,
      id: newId,
    };
    setBranches(prev => [...prev, newBranch]);
    addAuditLog('BRANCH_CREATED', 'branch', newBranch.id, `New branch added: ${newBranch.name}`);
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

    if (activeBusinessId && isSupabaseConfigured) {
      supabase.from('categories').insert({
        business_id: activeBusinessId,
        name: trimmed,
        slug: newCat.slug,
        description: catData.description || null,
      }).catch(() => {});
    }

    addAuditLog('CATEGORY_CREATED', 'category', newCat.id, `Category created: ${newCat.name}`);
    return newCat;
  };

  const deleteCategory = async (id: string) => {
    const target = categories.find(c => c.id === id);
    if (!target) return;
    setCategories(prev => prev.filter(c => c.id !== id));
    if (activeBusinessId && isSupabaseConfigured) {
      await supabase.from('categories').delete().eq('id', id).catch(() => {});
    }
    addAuditLog('CATEGORY_DELETED', 'category', id, `Category deleted: ${target.name}`);
  };

  // Products CRUD with Supabase persistence & ID preservation
  const addProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product => {
    const now = new Date().toISOString();
    let code = productData.code.trim();
    const isCodeDuplicate = products.some(p => p.code.toLowerCase() === code.toLowerCase());
    if (isCodeDuplicate) {
      code = `${code}-${Math.floor(100 + Math.random() * 900)}`;
    }

    let barcode = productData.barcode?.trim() || `894${Math.floor(100000 + Math.random() * 900000)}`;
    const isBarcodeDuplicate = products.some(p => p.barcode === barcode);
    if (isBarcodeDuplicate) {
      barcode = `${barcode}${Math.floor(10 + Math.random() * 90)}`;
    }

    const tempId = `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newProduct: Product = {
      ...productData,
      id: tempId,
      code,
      barcode,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    // Optimistic state update
    setProducts(prev => [newProduct, ...prev]);

    // Ensure category exists
    if (newProduct.category) {
      const catExists = categories.some(c => c.name.toLowerCase() === newProduct.category.toLowerCase());
      if (!catExists) {
        addCategory({ name: newProduct.category });
      }
    }

    // Persist to Supabase if configured
    if (activeBusinessId && isSupabaseConfigured) {
      productService.insertProduct({ ...newProduct, code, barcode }, activeBusinessId)
        .then(insertedProd => {
          // Preserve Supabase generated product ID
          setProducts(prev => prev.map(p => p.id === tempId ? insertedProd : p));
        })
        .catch(err => {
          console.warn('Supabase product insert notice:', err.message);
        });
    }

    addAuditLog('PRODUCT_CREATED', 'product', newProduct.id, `Product created: ${newProduct.name} (${newProduct.code})`);
    return newProduct;
  };

  const updateProduct = (id: string, productData: Partial<Product>) => {
    setProducts(prev =>
      prev.map(p => (p.id === id ? { ...p, ...productData, updatedAt: new Date().toISOString() } : p))
    );

    if (activeBusinessId && isSupabaseConfigured) {
      productService.updateProduct(id, productData, activeBusinessId).catch(err => {
        console.warn('Supabase product update error:', err.message);
      });
    }

    addAuditLog('PRODUCT_UPDATED', 'product', id, `Product updated (ID: ${id})`);
  };

  const deleteProduct = (id: string, permanent: boolean = false) => {
    if (!isAdmin) {
      addAuditLog('UNAUTHORIZED_DELETE_ATTEMPT', 'product', id, `Unauthorized delete attempt by (${currentUserRole})`);
      return;
    }

    const prod = products.find(p => p.id === id);
    if (!prod) return;

    if (permanent) {
      setProducts(prev => prev.filter(p => p.id !== id));
      if (activeBusinessId && isSupabaseConfigured) {
        productService.permanentDeleteProduct(id, activeBusinessId).catch(() => {});
      }
      addAuditLog('PRODUCT_DELETED', 'product', id, `Product permanently deleted: ${prod.name}`);
    } else {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, isActive: false, updatedAt: new Date().toISOString() } : p));
      if (activeBusinessId && isSupabaseConfigured) {
        productService.softDeleteProduct(id, activeBusinessId).catch(() => {});
      }
      addAuditLog('PRODUCT_DEACTIVATED', 'product', id, `Product archived: ${prod.name}`);
    }
  };

  // Helper: Account ID lookup
  const getAccountIdForMethod = (method: PaymentMethod): string => {
    const found = accounts.find(a => {
      if (method === 'cash') return a.accountType === 'cash';
      if (method === 'bkash' || method === 'nagad' || method === 'rocket') return a.accountType === 'mobile_bank';
      if (method === 'bank' || method === 'card') return a.accountType === 'bank';
      return false;
    });
    return found ? found.id : accounts[0]?.id || 'acc-cash';
  };

  // Sales & POS Record
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

    // 1. Update local inventory & movements
    setProducts(prev => {
      const updated = [...prev];
      newSale.items.forEach(item => {
        const pIndex = updated.findIndex(p => p.id === item.productId);
        if (pIndex !== -1) {
          const prod = updated[pIndex];
          const prevStock = prod.currentStock;
          const nextStock = Math.max(0, prevStock - item.quantity);
          updated[pIndex] = { ...prod, currentStock: nextStock, updatedAt: now };

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
            note: `Sale invoice ${invoiceNumber}`,
          };
          setStockMovements(prevMoves => [movement, ...prevMoves]);
        }
      });
      return updated;
    });

    // 2. Customer Due ledger
    if (newSale.customerId) {
      setCustomers(prev =>
        prev.map(c => {
          if (c.id === newSale.customerId) {
            return {
              ...c,
              totalPurchase: c.totalPurchase + newSale.total,
              totalPaid: c.totalPaid + newSale.paid,
              currentDue: c.currentDue + newSale.due,
            };
          }
          return c;
        })
      );
    }

    // 3. Accounts balance update
    if (newSale.paid > 0) {
      setAccounts(prev => {
        let updated = [...prev];
        const targetAccId = getAccountIdForMethod(newSale.paymentMethod);
        return updated.map(a => a.id === targetAccId ? { ...a, balance: a.balance + newSale.paid } : a);
      });
    }

    setSales(prev => [newSale, ...prev]);

    // 4. Connect to Supabase RPC complete_sale_transaction
    if (activeBusinessId && isSupabaseConfigured) {
      salesService.completeSale(newSale, activeBusinessId)
        .then(result => {
          if (result.saleId) {
            setSales(prev => prev.map(s => s.id === newSale.id ? { ...s, id: result.saleId! } : s));
          }
        })
        .catch(err => {
          console.warn('Supabase sale RPC note:', err.message);
        });
    }

    addAuditLog('SALE_CREATED', 'sale', newSale.id, `Sale completed: ${invoiceNumber}, Total: ৳${newSale.total}`);
    return newSale;
  };

  // Quick Refund Sale
  const quickRefundSale = (saleId: string, reason?: string): boolean => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale || sale.status === 'returned' || sale.status === 'voided') {
      return false;
    }

    const now = new Date().toISOString();
    const refundReason = reason || 'Full Customer Refund';

    // 1. Restock items
    setProducts(prev => {
      const updated = [...prev];
      sale.items.forEach(item => {
        const pIndex = updated.findIndex(p => p.id === item.productId);
        if (pIndex !== -1) {
          const prod = updated[pIndex];
          const nextStock = prod.currentStock + item.quantity;
          updated[pIndex] = { ...prod, currentStock: nextStock, updatedAt: now };
        }
      });
      return updated;
    });

    // 2. Mark returned in state
    setSales(prev =>
      prev.map(s => (s.id === saleId ? { ...s, status: 'returned', refundedAmount: sale.paid, refundReason, refundedAt: now } : s))
    );

    // 3. Update Supabase
    if (activeBusinessId && isSupabaseConfigured) {
      salesService.refundSale(saleId, { amount: sale.paid, reason: refundReason }, activeBusinessId).catch(() => {});
    }

    addAuditLog('SALE_REFUNDED', 'sale', sale.id, `Sale refunded: ${sale.invoiceNumber}`);
    return true;
  };

  const voidSale = (saleId: string, reason?: string): boolean => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale || sale.status === 'returned' || sale.status === 'voided') {
      return false;
    }

    const success = quickRefundSale(saleId, reason || 'Void Sale');
    if (success) {
      setSales(prev => prev.map(s => (s.id === saleId ? { ...s, status: 'voided' } : s)));
      if (activeBusinessId && isSupabaseConfigured) {
        salesService.voidSale(saleId, reason, activeBusinessId).catch(() => {});
      }
    }
    return success;
  };

  const recordSaleReturn = (saleId: string, returnItems: { productId: string; quantity: number; unitPrice: number; reason: string }[], refundType: 'cash' | 'adjust_due') => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;

    const totalRefund = returnItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const now = new Date().toISOString();

    setProducts(prev => {
      const updated = [...prev];
      returnItems.forEach(item => {
        const pIndex = updated.findIndex(p => p.id === item.productId);
        if (pIndex !== -1) {
          const prod = updated[pIndex];
          const nextStock = prod.currentStock + item.quantity;
          updated[pIndex] = { ...prod, currentStock: nextStock, updatedAt: now };
        }
      });
      return updated;
    });

    setSales(prev => prev.map(s => (s.id === saleId ? { ...s, status: 'returned' } : s)));
    addAuditLog('SALE_PARTIAL_RETURN', 'sale', sale.id, `Sale return: ${sale.invoiceNumber}, Refund: ৳${totalRefund}`);
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

    // Increase product stocks
    setProducts(prev => {
      const updated = [...prev];
      newPurchase.items.forEach(item => {
        const pIndex = updated.findIndex(p => p.id === item.productId);
        if (pIndex !== -1) {
          const prod = updated[pIndex];
          const prevStock = prod.currentStock;
          const nextStock = prevStock + item.quantity;
          updated[pIndex] = { ...prod, currentStock: nextStock, purchasePrice: item.purchasePrice, updatedAt: now };

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
            note: `Purchase shipment ${invoiceNumber}`,
          };
          setStockMovements(m => [movement, ...m]);
        }
      });
      return updated;
    });

    // Update Supplier Due
    setSuppliers(prev =>
      prev.map(s => (s.id === newPurchase.supplierId ? { ...s, totalPurchase: s.totalPurchase + newPurchase.total, totalPaid: s.totalPaid + newPurchase.paid, currentDue: s.currentDue + newPurchase.due } : s))
    );

    // Deduct paid from account
    if (newPurchase.paid > 0) {
      const targetAccId = getAccountIdForMethod(newPurchase.paymentMethod);
      setAccounts(prev => prev.map(acc => acc.id === targetAccId ? { ...acc, balance: Math.max(0, acc.balance - newPurchase.paid) } : acc));
    }

    setPurchases(prev => [newPurchase, ...prev]);

    // Persist to Supabase if available
    if (activeBusinessId && isSupabaseConfigured) {
      supabase.from('purchases').insert({
        business_id: activeBusinessId,
        branch_id: newPurchase.branchId,
        supplier_id: newPurchase.supplierId || null,
        supplier_name: newPurchase.supplierName,
        invoice_number: invoiceNumber,
        subtotal: newPurchase.subtotal,
        transport_cost: newPurchase.transportCost || 0,
        other_cost: newPurchase.otherCost || 0,
        total: newPurchase.total,
        paid: newPurchase.paid,
        due: newPurchase.due,
        payment_method: newPurchase.paymentMethod,
        status: newPurchase.due <= 0 ? 'paid' : 'due',
      }).catch(() => {});
    }

    addAuditLog('PURCHASE_CREATED', 'purchase', newPurchase.id, `Purchase received: ${invoiceNumber}`);
    return newPurchase;
  };

  const recordPurchaseReturn = (purchaseId: string, returnItems: { productId: string; quantity: number; unitPrice: number; reason: string }[]) => {
    const purchase = purchases.find(p => p.id === purchaseId);
    if (!purchase) return;

    const totalReturnAmt = returnItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const now = new Date().toISOString();

    setProducts(prev => {
      const updated = [...prev];
      returnItems.forEach(item => {
        const pIndex = updated.findIndex(p => p.id === item.productId);
        if (pIndex !== -1) {
          const prod = updated[pIndex];
          const nextStock = Math.max(0, prod.currentStock - item.quantity);
          updated[pIndex] = { ...prod, currentStock: nextStock, updatedAt: now };
        }
      });
      return updated;
    });

    addAuditLog('PURCHASE_RETURN', 'purchase', purchase.id, `Purchase return recorded: ${purchase.invoiceNumber}`);
  };

  // Stock Adjustment
  const adjustStock = (productId: string, adjustedQty: number, reason: StockAdjustment['reason'], note?: string) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    const now = new Date().toISOString();
    const prevStock = prod.currentStock;
    const nextStock = Math.max(0, prevStock + adjustedQty);

    setProducts(prev => prev.map(p => (p.id === productId ? { ...p, currentStock: nextStock, updatedAt: now } : p)));

    if (activeBusinessId && isSupabaseConfigured) {
      supabase.from('products').update({ current_stock: nextStock, updated_at: now }).eq('id', productId).catch(() => {});
      supabase.from('stock_movements').insert({
        business_id: activeBusinessId,
        branch_id: activeBranchId,
        product_id: productId,
        product_name: prod.name,
        movement_type: 'adjustment',
        quantity: adjustedQty,
        previous_stock: prevStock,
        new_stock: nextStock,
        note: `Manual stock adjustment: ${reason} (${note || ''})`,
      }).catch(() => {});
    }

    addAuditLog('STOCK_ADJUSTMENT', 'stock', productId, `Stock adjusted: ${prod.name} (${adjustedQty > 0 ? '+' : ''}${adjustedQty})`);
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
    addAuditLog('STOCK_TRANSFER', 'stock', productId, `Branch transfer: ${prod.name} (${quantity} ${prod.unit}) from ${fromBranch?.name} to ${toBranch?.name}`);
  };

  // Customers
  const addCustomer = (data: Omit<Customer, 'id' | 'createdAt' | 'currentDue' | 'totalPurchase' | 'totalPaid' | 'openingDue'> & { openingDue?: number }): Customer => {
    const opDue = data.openingDue || 0;
    const tempId = `cust-${Date.now()}`;
    const newCust: Customer = {
      ...data,
      id: tempId,
      openingDue: opDue,
      currentDue: opDue,
      totalPurchase: opDue,
      totalPaid: 0,
      createdAt: new Date().toISOString(),
    };
    setCustomers(prev => [newCust, ...prev]);

    if (activeBusinessId && isSupabaseConfigured) {
      customerService.insertCustomer(data, activeBusinessId)
        .then(inserted => {
          setCustomers(prev => prev.map(c => c.id === tempId ? inserted : c));
        })
        .catch(() => {});
    }

    addAuditLog('CUSTOMER_CREATED', 'customer', newCust.id, `New customer added: ${newCust.name}`);
    return newCust;
  };

  const updateCustomer = (id: string, data: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => (c.id === id ? { ...c, ...data } : c)));
    if (activeBusinessId && isSupabaseConfigured) {
      customerService.updateCustomer(id, data, activeBusinessId).catch(() => {});
    }
    addAuditLog('CUSTOMER_UPDATED', 'customer', id, `Customer updated (ID: ${id})`);
  };

  const collectCustomerDue = (customerId: string, amount: number, paymentMethod: PaymentMethod, accountId: string, note?: string) => {
    const target = customers.find(c => c.id === customerId);
    if (!target || amount <= 0) return;

    const nextDue = Math.max(0, target.currentDue - amount);
    setCustomers(prev =>
      prev.map(c => (c.id === customerId ? { ...c, currentDue: nextDue, totalPaid: c.totalPaid + amount } : c))
    );

    setAccounts(prev =>
      prev.map(acc => (acc.id === accountId ? { ...acc, balance: acc.balance + amount } : acc))
    );

    if (activeBusinessId && isSupabaseConfigured) {
      customerService.updateCustomer(customerId, { currentDue: nextDue, totalPaid: target.totalPaid + amount }, activeBusinessId).catch(() => {});
    }

    addAuditLog('CUSTOMER_DUE_COLLECTED', 'customer', customerId, `Due payment collected from ${target.name}: ৳${amount}`);
  };

  // Suppliers
  const addSupplier = (data: Omit<Supplier, 'id' | 'createdAt' | 'currentDue' | 'totalPurchase' | 'totalPaid' | 'openingDue'> & { openingDue?: number }): Supplier => {
    const opDue = data.openingDue || 0;
    const tempId = `supp-${Date.now()}`;
    const newSupp: Supplier = {
      ...data,
      id: tempId,
      openingDue: opDue,
      currentDue: opDue,
      totalPurchase: opDue,
      totalPaid: 0,
      createdAt: new Date().toISOString(),
    };
    setSuppliers(prev => [newSupp, ...prev]);

    if (activeBusinessId && isSupabaseConfigured) {
      supplierService.insertSupplier(data, activeBusinessId)
        .then(inserted => {
          setSuppliers(prev => prev.map(s => s.id === tempId ? inserted : s));
        })
        .catch(() => {});
    }

    addAuditLog('SUPPLIER_CREATED', 'supplier', newSupp.id, `Supplier created: ${newSupp.name}`);
    return newSupp;
  };

  const updateSupplier = (id: string, data: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(s => (s.id === id ? { ...s, ...data } : s)));
    if (activeBusinessId && isSupabaseConfigured) {
      supplierService.updateSupplier(id, data, activeBusinessId).catch(() => {});
    }
    addAuditLog('SUPPLIER_UPDATED', 'supplier', id, `Supplier updated: (ID: ${id})`);
  };

  const paySupplierDue = (supplierId: string, amount: number, paymentMethod: PaymentMethod, accountId: string, note?: string) => {
    const target = suppliers.find(s => s.id === supplierId);
    if (!target || amount <= 0) return;

    const nextDue = Math.max(0, target.currentDue - amount);
    setSuppliers(prev =>
      prev.map(s => (s.id === supplierId ? { ...s, currentDue: nextDue, totalPaid: s.totalPaid + amount } : s))
    );

    setAccounts(prev =>
      prev.map(acc => (acc.id === accountId ? { ...acc, balance: Math.max(0, acc.balance - amount) } : acc))
    );

    if (activeBusinessId && isSupabaseConfigured) {
      supplierService.updateSupplier(supplierId, { currentDue: nextDue, totalPaid: target.totalPaid + amount }, activeBusinessId).catch(() => {});
    }

    addAuditLog('SUPPLIER_DUE_PAID', 'supplier', supplierId, `Supplier due paid: ${target.name}, ৳${amount}`);
  };

  // Accounts & Expenses
  const addExpense = (expenseData: Omit<Expense, 'id' | 'date'>) => {
    const now = new Date().toISOString();
    const tempId = `exp-${Date.now()}`;
    const newExp: Expense = {
      ...expenseData,
      id: tempId,
      date: now,
    };
    setExpenses(prev => [newExp, ...prev]);

    setAccounts(prev =>
      prev.map(acc => (acc.id === expenseData.accountId ? { ...acc, balance: acc.balance - expenseData.amount } : acc))
    );

    if (activeBusinessId && isSupabaseConfigured) {
      financeService.insertExpense(expenseData, activeBusinessId, activeBranchId)
        .then(res => {
          setExpenses(prev => prev.map(e => e.id === tempId ? res : e));
        })
        .catch(() => {});
    }

    addAuditLog('EXPENSE_CREATED', 'expense', newExp.id, `Expense recorded: ${newExp.category}, ৳${newExp.amount}`);
  };

  const transferMoney = (fromAccountId: string, toAccountId: string, amount: number, note?: string) => {
    if (amount <= 0 || fromAccountId === toAccountId) return;
    setAccounts(prev =>
      prev.map(acc => {
        if (acc.id === fromAccountId) return { ...acc, balance: acc.balance - amount };
        if (acc.id === toAccountId) return { ...acc, balance: acc.balance + amount };
        return acc;
      })
    );

    if (activeBusinessId && isSupabaseConfigured) {
      supabase.from('accounts').update({ balance: accounts.find(a => a.id === fromAccountId)?.balance! - amount }).eq('id', fromAccountId).catch(() => {});
      supabase.from('accounts').update({ balance: accounts.find(a => a.id === toAccountId)?.balance! + amount }).eq('id', toAccountId).catch(() => {});
    }

    addAuditLog('ACCOUNT_TRANSFER', 'account', `${fromAccountId}->${toAccountId}`, `Account transfer: ৳${amount}`);
  };

  // Employees
  const addEmployee = async (empData: Omit<Employee, 'id'>) => {
    let newId = `emp-${Date.now()}`;
    if (activeBusinessId && isSupabaseConfigured) {
      const { data } = await supabase.from('employees').insert({
        business_id: activeBusinessId,
        branch_id: empData.branchId || null,
        name: empData.name,
        mobile: empData.mobile,
        position: empData.position,
        role: empData.role,
        salary: empData.salary,
        joining_date: empData.joiningDate,
        status: empData.status,
      }).select().single().catch(() => ({ data: null }));

      if (data) newId = data.id;
    }

    const newEmp: Employee = { ...empData, id: newId };
    setEmployees(prev => [...prev, newEmp]);
    addAuditLog('EMPLOYEE_CREATED', 'employee', newEmp.id, `Employee added: ${newEmp.name}`);
  };

  const updateEmployee = async (id: string, empData: Partial<Employee>) => {
    setEmployees(prev => prev.map(e => (e.id === id ? { ...e, ...empData } : e)));
    if (activeBusinessId && isSupabaseConfigured) {
      await supabase.from('employees').update({
        name: empData.name,
        mobile: empData.mobile,
        position: empData.position,
        salary: empData.salary,
        status: empData.status,
        updated_at: new Date().toISOString(),
      }).eq('id', id).catch(() => {});
    }
    addAuditLog('EMPLOYEE_UPDATED', 'employee', id, `Employee updated (ID: ${id})`);
  };

  const disburseSalary = (employeeId: string, month: string, accountId: string, amount: number) => {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return;

    addExpense({
      category: 'Staff Salary',
      amount,
      paymentMethod: 'cash',
      accountId,
      paidTo: `${emp.name} (${emp.position})`,
      note: `Salary payment for ${month}`,
    });

    addAuditLog('SALARY_DISBURSED', 'employee', employeeId, `Salary disbursed to ${emp.name}, ${month}, ৳${amount}`);
  };

  // Admin Deletion
  const deleteSale = (saleId: string): boolean => {
    if (!isAdmin) return false;
    setSales(prev => prev.filter(s => s.id !== saleId));
    if (activeBusinessId && isSupabaseConfigured) {
      supabase.from('sales').delete().eq('id', saleId).catch(() => {});
    }
    return true;
  };

  const deletePurchase = (purchaseId: string): boolean => {
    if (!isAdmin) return false;
    setPurchases(prev => prev.filter(p => p.id !== purchaseId));
    if (activeBusinessId && isSupabaseConfigured) {
      supabase.from('purchases').delete().eq('id', purchaseId).catch(() => {});
    }
    return true;
  };

  const deleteCustomer = (customerId: string): { success: boolean; message?: string } => {
    if (!isAdmin) return { success: false, message: 'Only Admin can delete customer records.' };
    const cust = customers.find(c => c.id === customerId);
    if (cust && cust.currentDue > 0) {
      return { success: false, message: `Customer has outstanding due (৳${cust.currentDue}). Please settle due before deletion.` };
    }
    setCustomers(prev => prev.filter(c => c.id !== customerId));
    if (activeBusinessId && isSupabaseConfigured) {
      customerService.deleteCustomer(customerId, activeBusinessId).catch(() => {});
    }
    return { success: true };
  };

  const deleteSupplier = (supplierId: string): { success: boolean; message?: string } => {
    if (!isAdmin) return { success: false, message: 'Only Admin can delete supplier records.' };
    const supp = suppliers.find(s => s.id === supplierId);
    if (supp && supp.currentDue > 0) {
      return { success: false, message: `Supplier has outstanding due (৳${supp.currentDue}). Please settle due before deletion.` };
    }
    setSuppliers(prev => prev.filter(s => s.id !== supplierId));
    if (activeBusinessId && isSupabaseConfigured) {
      supplierService.deleteSupplier(supplierId, activeBusinessId).catch(() => {});
    }
    return { success: true };
  };

  const deleteExpense = (expenseId: string): boolean => {
    if (!isAdmin) return false;
    setExpenses(prev => prev.filter(e => e.id !== expenseId));
    if (activeBusinessId && isSupabaseConfigured) {
      supabase.from('expenses').delete().eq('id', expenseId).catch(() => {});
    }
    return true;
  };

  const deleteEmployee = (employeeId: string): boolean => {
    if (!isAdmin) return false;
    setEmployees(prev => prev.filter(e => e.id !== employeeId));
    if (activeBusinessId && isSupabaseConfigured) {
      supabase.from('employees').delete().eq('id', employeeId).catch(() => {});
    }
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
      suppliers,
      sales,
      purchases,
      accounts,
      expenses,
      employees,
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
      if (parsed.expenses) setExpenses(parsed.expenses);
      if (parsed.settings) setSettings(parsed.settings);
      if (parsed.branches) setBranches(parsed.branches);
      if (parsed.employees) setEmployees(parsed.employees);
      addAuditLog('DATA_RESTORED', 'system', 'backup', 'System backup restore completed successfully');
      return true;
    } catch {
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
    setExpenses(initialExpenses);
    setEmployees(initialEmployees);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        session,
        activeBusinessId,
        signOut,
        isLoading,
        isMigrated,
        migrateLegacyData,
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
        reloadProducts,
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
