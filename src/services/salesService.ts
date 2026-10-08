import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Sale } from '../types';

export const salesService = {
  async completeSale(sale: Sale, businessId: string): Promise<{ success: boolean; saleId?: string; invoiceNumber?: string }> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase client is not configured.');
    }

    // Call PostgreSQL RPC for atomic execution
    const { data, error } = await supabase.rpc('complete_sale_transaction', {
      p_sale: {
        business_id: businessId,
        branch_id: sale.branchId,
        invoice_number: sale.invoiceNumber,
        customer_id: sale.customerId || null,
        customer_name: sale.customerName,
        customer_mobile: sale.customerMobile || null,
        subtotal: sale.subtotal,
        discount: sale.discount,
        vat_tax_rate: sale.vatTaxRate,
        vat_tax_amount: sale.vatTaxAmount,
        total: sale.total,
        paid: sale.paid,
        due: sale.due,
        payment_method: sale.paymentMethod,
        status: sale.status,
        served_by: sale.servedBy,
        notes: sale.notes || null,
      },
      p_items: sale.items.map(i => ({
        product_id: i.productId,
        variant_id: i.variantId || null,
        product_name: i.productName,
        sku: i.sku,
        variant_details: i.variantDetails || null,
        quantity: i.quantity,
        unit_price: i.unitPrice,
        purchase_price: i.purchasePrice,
        discount: i.discount,
        total: i.total,
      })),
      p_payments: sale.payments.map(p => ({
        account_id: p.accountId || null,
        payment_method: p.method,
        amount: p.amount,
        trx_id: p.trxId || null,
      })),
    });

    if (error) {
      console.error('RPC complete_sale_transaction error:', error);
      throw error;
    }

    return {
      success: true,
      saleId: data?.sale_id || sale.id,
      invoiceNumber: data?.invoice_number || sale.invoiceNumber,
    };
  },

  async refundSale(saleId: string, refundData: { amount: number; reason: string }, businessId?: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase client is not configured.');
    }

    let query = supabase
      .from('sales')
      .update({
        status: 'returned',
        notes: refundData.reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', saleId);

    if (businessId) {
      query = query.eq('business_id', businessId);
    }

    const { error } = await query;
    if (error) {
      throw error;
    }
    return true;
  },

  async voidSale(saleId: string, reason?: string, businessId?: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase client is not configured.');
    }

    let query = supabase
      .from('sales')
      .update({
        status: 'voided',
        notes: reason || 'Sale voided',
        updated_at: new Date().toISOString(),
      })
      .eq('id', saleId);

    if (businessId) {
      query = query.eq('business_id', businessId);
    }

    const { error } = await query;
    if (error) {
      throw error;
    }
    return true;
  },

  async fetchSales(businessId?: string): Promise<Sale[]> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase client is not configured.');
    }

    let query = supabase
      .from('sales')
      .select('*, sale_items(*), sale_payments(*)')
      .order('created_at', { ascending: false });

    if (businessId) {
      query = query.eq('business_id', businessId);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    return (data || []).map((s: any) => ({
      id: s.id,
      invoiceNumber: s.invoice_number,
      date: s.created_at,
      customerId: s.customer_id,
      customerName: s.customer_name,
      customerMobile: s.customer_mobile,
      items: (s.sale_items || []).map((i: any) => ({
        productId: i.product_id,
        productName: i.product_name,
        sku: i.sku,
        unitPrice: Number(i.unit_price),
        purchasePrice: Number(i.purchase_price),
        quantity: Number(i.quantity),
        discount: Number(i.discount || 0),
        total: Number(i.total),
        variantId: i.variant_id,
        variantDetails: i.variant_details,
      })),
      subtotal: Number(s.subtotal),
      discount: Number(s.discount || 0),
      vatTaxRate: Number(s.vat_tax_rate || 0),
      vatTaxAmount: Number(s.vat_tax_amount || 0),
      total: Number(s.total),
      paid: Number(s.paid),
      due: Number(s.due),
      paymentMethod: s.payment_method,
      payments: (s.sale_payments || []).map((p: any) => ({
        method: p.payment_method,
        amount: Number(p.amount),
        accountId: p.account_id,
        trxId: p.trx_id,
      })),
      servedBy: s.served_by || 'Staff',
      branchId: s.branch_id,
      status: s.status,
      notes: s.notes,
    }));
  },
};
