import { supabase } from '../lib/supabase';
import { Customer, CustomerTransaction, Supplier, SupplierTransaction, Account, AccountTransaction, Expense, Employee, Purchase } from '../types';

export const customerService = {
  async fetchCustomers(businessId?: string): Promise<Customer[]> {
    let query = supabase.from('customers').select('*').order('created_at', { ascending: false });
    if (businessId) query = query.eq('business_id', businessId);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      mobile: c.mobile,
      address: c.address || undefined,
      email: c.email || undefined,
      customerType: c.customer_type || 'retail',
      openingDue: Number(c.opening_due || 0),
      currentDue: Number(c.current_due || 0),
      creditLimit: Number(c.credit_limit || 0),
      totalPurchase: Number(c.total_purchase || 0),
      totalPaid: Number(c.total_paid || 0),
      createdAt: c.created_at,
      notes: c.notes || undefined,
    }));
  },

  async insertCustomer(data: Omit<Customer, 'id' | 'createdAt' | 'currentDue' | 'totalPurchase' | 'totalPaid' | 'openingDue'> & { openingDue?: number }, businessId: string): Promise<Customer> {
    const opDue = data.openingDue || 0;
    const payload = {
      business_id: businessId,
      name: data.name,
      mobile: data.mobile,
      address: data.address || null,
      email: data.email || null,
      customer_type: data.customerType || 'retail',
      opening_due: opDue,
      current_due: opDue,
      credit_limit: data.creditLimit || 0,
      total_purchase: opDue,
      total_paid: 0,
      notes: data.notes || null,
    };
    const { data: res, error } = await supabase.from('customers').insert(payload).select().single();
    if (error) throw error;
    return {
      id: res.id,
      name: res.name,
      mobile: res.mobile,
      address: res.address || undefined,
      email: res.email || undefined,
      customerType: res.customer_type || 'retail',
      openingDue: Number(res.opening_due || 0),
      currentDue: Number(res.current_due || 0),
      creditLimit: Number(res.credit_limit || 0),
      totalPurchase: Number(res.total_purchase || 0),
      totalPaid: Number(res.total_paid || 0),
      createdAt: res.created_at,
      notes: res.notes || undefined,
    };
  },

  async updateCustomer(id: string, data: Partial<Customer>, businessId?: string): Promise<void> {
    const payload: any = { updated_at: new Date().toISOString() };
    if (data.name !== undefined) payload.name = data.name;
    if (data.mobile !== undefined) payload.mobile = data.mobile;
    if (data.address !== undefined) payload.address = data.address;
    if (data.email !== undefined) payload.email = data.email;
    if (data.customerType !== undefined) payload.customer_type = data.customerType;
    if (data.currentDue !== undefined) payload.current_due = data.currentDue;
    if (data.creditLimit !== undefined) payload.credit_limit = data.creditLimit;
    if (data.totalPurchase !== undefined) payload.total_purchase = data.totalPurchase;
    if (data.totalPaid !== undefined) payload.total_paid = data.totalPaid;
    if (data.notes !== undefined) payload.notes = data.notes;

    let query = supabase.from('customers').update(payload).eq('id', id);
    if (businessId) query = query.eq('business_id', businessId);
    const { error } = await query;
    if (error) throw error;
  },

  async deleteCustomer(id: string, businessId?: string): Promise<void> {
    let query = supabase.from('customers').delete().eq('id', id);
    if (businessId) query = query.eq('business_id', businessId);
    const { error } = await query;
    if (error) throw error;
  },
};

export const supplierService = {
  async fetchSuppliers(businessId?: string): Promise<Supplier[]> {
    let query = supabase.from('suppliers').select('*').order('created_at', { ascending: false });
    if (businessId) query = query.eq('business_id', businessId);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      company: s.company,
      mobile: s.mobile,
      address: s.address || undefined,
      email: s.email || undefined,
      openingDue: Number(s.opening_due || 0),
      currentDue: Number(s.current_due || 0),
      totalPurchase: Number(s.total_purchase || 0),
      totalPaid: Number(s.total_paid || 0),
      createdAt: s.created_at,
    }));
  },

  async insertSupplier(data: Omit<Supplier, 'id' | 'createdAt' | 'currentDue' | 'totalPurchase' | 'totalPaid' | 'openingDue'> & { openingDue?: number }, businessId: string): Promise<Supplier> {
    const opDue = data.openingDue || 0;
    const payload = {
      business_id: businessId,
      name: data.name,
      company: data.company,
      mobile: data.mobile,
      address: data.address || null,
      email: data.email || null,
      opening_due: opDue,
      current_due: opDue,
      total_purchase: opDue,
      total_paid: 0,
    };
    const { data: res, error } = await supabase.from('suppliers').insert(payload).select().single();
    if (error) throw error;
    return {
      id: res.id,
      name: res.name,
      company: res.company,
      mobile: res.mobile,
      address: res.address || undefined,
      email: res.email || undefined,
      openingDue: Number(res.opening_due || 0),
      currentDue: Number(res.current_due || 0),
      totalPurchase: Number(res.total_purchase || 0),
      totalPaid: Number(res.total_paid || 0),
      createdAt: res.created_at,
    };
  },

  async updateSupplier(id: string, data: Partial<Supplier>, businessId?: string): Promise<void> {
    const payload: any = { updated_at: new Date().toISOString() };
    if (data.name !== undefined) payload.name = data.name;
    if (data.company !== undefined) payload.company = data.company;
    if (data.mobile !== undefined) payload.mobile = data.mobile;
    if (data.address !== undefined) payload.address = data.address;
    if (data.email !== undefined) payload.email = data.email;
    if (data.currentDue !== undefined) payload.current_due = data.currentDue;
    if (data.totalPurchase !== undefined) payload.total_purchase = data.totalPurchase;
    if (data.totalPaid !== undefined) payload.total_paid = data.totalPaid;

    let query = supabase.from('suppliers').update(payload).eq('id', id);
    if (businessId) query = query.eq('business_id', businessId);
    const { error } = await query;
    if (error) throw error;
  },

  async deleteSupplier(id: string, businessId?: string): Promise<void> {
    let query = supabase.from('suppliers').delete().eq('id', id);
    if (businessId) query = query.eq('business_id', businessId);
    const { error } = await query;
    if (error) throw error;
  },
};

export const financeService = {
  async fetchAccounts(businessId?: string): Promise<Account[]> {
    let query = supabase.from('accounts').select('*').order('created_at', { ascending: true });
    if (businessId) query = query.eq('business_id', businessId);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((a: any) => ({
      id: a.id,
      name: a.name,
      accountType: a.account_type,
      accountNumber: a.account_number || undefined,
      balance: Number(a.balance || 0),
    }));
  },

  async fetchExpenses(businessId?: string): Promise<Expense[]> {
    let query = supabase.from('expenses').select('*').order('created_at', { ascending: false });
    if (businessId) query = query.eq('business_id', businessId);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((e: any) => ({
      id: e.id,
      date: e.date || e.created_at,
      category: e.category,
      amount: Number(e.amount || 0),
      paymentMethod: e.payment_method,
      accountId: e.account_id,
      paidTo: e.paid_to || undefined,
      note: e.note || undefined,
    }));
  },

  async insertExpense(expense: Omit<Expense, 'id' | 'date'>, businessId: string, branchId?: string): Promise<Expense> {
    const payload = {
      business_id: businessId,
      branch_id: branchId || null,
      account_id: expense.accountId,
      category: expense.category,
      amount: expense.amount,
      payment_method: expense.paymentMethod,
      paid_to: expense.paidTo || null,
      note: expense.note || null,
      date: new Date().toISOString(),
    };
    const { data, error } = await supabase.from('expenses').insert(payload).select().single();
    if (error) throw error;

    // Deduct from account in Supabase
    const { data: acc } = await supabase.from('accounts').select('balance').eq('id', expense.accountId).single();
    if (acc) {
      const newBal = Number(acc.balance || 0) - expense.amount;
      await supabase.from('accounts').update({ balance: newBal, updated_at: new Date().toISOString() }).eq('id', expense.accountId);
      await supabase.from('account_transactions').insert({
        business_id: businessId,
        account_id: expense.accountId,
        transaction_type: 'expense',
        amount: -expense.amount,
        balance_after: newBal,
        reference_id: data.id,
        note: `Expense: ${expense.category}`,
      });
    }

    return {
      id: data.id,
      date: data.date,
      category: data.category,
      amount: Number(data.amount),
      paymentMethod: data.payment_method,
      accountId: data.account_id,
      paidTo: data.paid_to || undefined,
      note: data.note || undefined,
    };
  },
};

export const purchaseService = {
  async fetchPurchases(businessId?: string): Promise<Purchase[]> {
    let query = supabase.from('purchases').select('*, purchase_items(*)').order('created_at', { ascending: false });
    if (businessId) query = query.eq('business_id', businessId);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((p: any) => ({
      id: p.id,
      invoiceNumber: p.invoice_number,
      supplierId: p.supplier_id,
      supplierName: p.supplier_name,
      date: p.created_at,
      items: (p.purchase_items || []).map((i: any) => ({
        productId: i.product_id,
        productName: i.product_name,
        quantity: Number(i.quantity),
        purchasePrice: Number(i.purchase_price),
        salePrice: Number(i.sale_price || 0),
        total: Number(i.total),
      })),
      subtotal: Number(p.subtotal),
      transportCost: Number(p.transport_cost || 0),
      otherCost: Number(p.other_cost || 0),
      total: Number(p.total),
      paid: Number(p.paid),
      due: Number(p.due),
      paymentMethod: p.payment_method,
      status: p.status,
      branchId: p.branch_id,
      notes: p.notes || undefined,
    }));
  },
};
