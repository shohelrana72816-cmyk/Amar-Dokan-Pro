import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Product } from '../types';

export const productService = {
  async fetchProducts(businessId?: string): Promise<Product[] | null> {
    if (!isSupabaseConfigured) return null;
    try {
      const query = supabase
        .from('products')
        .select('*, product_variants(*)')
        .order('created_at', { ascending: false });
      if (businessId) query.eq('business_id', businessId);
      const { data, error } = await query;
      if (error) throw error;
      return data.map((p: any) => ({
        id: p.id,
        name: p.name,
        code: p.sku,
        barcode: p.barcode || '',
        category: p.category_name || 'General',
        brand: p.brand,
        description: p.description,
        image: p.image_url,
        purchasePrice: Number(p.purchase_price),
        salePrice: Number(p.sale_price),
        wholesalePrice: p.wholesale_price ? Number(p.wholesale_price) : undefined,
        minSalePrice: p.min_sale_price ? Number(p.min_sale_price) : undefined,
        currentStock: Number(p.current_stock),
        minStockAlert: Number(p.min_stock_alert),
        unit: p.unit || 'pcs',
        businessType: p.business_type,
        hasVariants: p.has_variants,
        variants: p.product_variants?.map((v: any) => ({
          id: v.id,
          color: v.color,
          size: v.size,
          sku: v.sku,
          stock: Number(v.stock),
          additionalPrice: Number(v.additional_price || 0),
        })),
        model: p.model,
        serialNumber: p.serial_number,
        warrantyPeriod: p.warranty_period,
        expiryDate: p.expiry_date,
        batchNumber: p.batch_number,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        isActive: p.is_active !== false,
      }));
    } catch (err) {
      console.warn('Supabase fetch products fallback to local state:', err);
      return null;
    }
  },

  async saveProduct(product: Product, businessId?: string): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    try {
      const payload: any = {
        name: product.name,
        sku: product.code,
        barcode: product.barcode,
        category_name: product.category,
        brand: product.brand,
        description: product.description,
        purchase_price: product.purchasePrice,
        sale_price: product.salePrice,
        wholesale_price: product.wholesalePrice,
        current_stock: product.currentStock,
        min_stock_alert: product.minStockAlert,
        unit: product.unit,
        business_type: product.businessType,
        has_variants: product.hasVariants,
        is_active: product.isActive !== false,
        updated_at: new Date().toISOString(),
      };
      if (businessId) payload.business_id = businessId;

      await supabase.from('products').upsert(payload);
      return true;
    } catch (err) {
      console.warn('Supabase saveProduct error:', err);
      return false;
    }
  },

  async softDeleteProduct(productId: string): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    try {
      await supabase
        .from('products')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', productId);
      return true;
    } catch (err) {
      console.warn('Supabase softDeleteProduct error:', err);
      return false;
    }
  },
};
