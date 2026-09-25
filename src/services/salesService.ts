import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Sale } from '../types';

export const salesService = {
  async completeSale(sale: Sale, businessId?: string): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    try {
      // Call PostgreSQL RPC for atomic execution if available
      const { data, error } = await supabase.rpc('complete_sale_transaction', {
        p_sale: {
          business_id: businessId,
          branch_id: sale.branchId,
          invoice_number: sale.invoiceNumber,
          customer_id: sale.customerId,
          customer_name: sale.customerName,
          customer_mobile: sale.customerMobile,
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
          notes: sale.notes,
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
        console.warn('RPC complete_sale_transaction fallback to standard tables:', error);
      }
      return !error;
    } catch (err) {
      console.warn('Supabase completeSale error:', err);
      return false;
    }
  },

  async refundSale(saleId: string, refundData: { amount: number; reason: string }): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    try {
      await supabase
        .from('sales')
        .update({
          status: 'returned',
          notes: refundData.reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', saleId);
      return true;
    } catch (err) {
      console.warn('Supabase refundSale error:', err);
      return false;
    }
  },
};
