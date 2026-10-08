import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Product } from '../types';

export const productService = {
  async fetchProducts(businessId?: string): Promise<Product[]> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase client is not configured.');
    }

    let query = supabase
      .from('products')
      .select('*, product_variants(*)')
      .order('created_at', { ascending: false });

    if (businessId) {
      query = query.eq('business_id', businessId);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    return (data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      code: p.sku,
      barcode: p.barcode || '',
      category: p.category_name || 'General',
      subcategory: p.subcategory || undefined,
      brand: p.brand || undefined,
      description: p.description || undefined,
      image: p.image_url || undefined,
      purchasePrice: Number(p.purchase_price || 0),
      salePrice: Number(p.sale_price || 0),
      wholesalePrice: p.wholesale_price != null ? Number(p.wholesale_price) : undefined,
      minSalePrice: p.min_sale_price != null ? Number(p.min_sale_price) : undefined,
      currentStock: Number(p.current_stock || 0),
      minStockAlert: Number(p.min_stock_alert || 5),
      unit: p.unit || 'pcs',
      businessType: p.business_type,
      hasVariants: Boolean(p.has_variants),
      variants: p.product_variants?.map((v: any) => ({
        id: v.id,
        color: v.color || undefined,
        size: v.size || undefined,
        sku: v.sku,
        stock: Number(v.stock || 0),
        additionalPrice: Number(v.additional_price || 0),
      })),
      model: p.model || undefined,
      serialNumber: p.serial_number || undefined,
      warrantyPeriod: p.warranty_period || undefined,
      expiryDate: p.expiry_date || undefined,
      batchNumber: p.batch_number || undefined,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      isActive: p.is_active !== false,
    }));
  },

  async insertProduct(
    product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
    businessId: string
  ): Promise<Product> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase client is not configured.');
    }

    const payload: any = {
      business_id: businessId,
      name: product.name,
      sku: product.code,
      barcode: product.barcode,
      category_name: product.category,
      brand: product.brand || null,
      description: product.description || null,
      purchase_price: product.purchasePrice,
      sale_price: product.salePrice,
      wholesale_price: product.wholesalePrice ?? null,
      current_stock: product.currentStock,
      min_stock_alert: product.minStockAlert,
      unit: product.unit,
      business_type: product.businessType || 'general',
      has_variants: Boolean(product.hasVariants),
      model: product.model || null,
      warranty_period: product.warrantyPeriod || null,
      expiry_date: product.expiryDate || null,
      batch_number: product.batchNumber || null,
      is_active: product.isActive !== false,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('products')
      .insert(payload)
      .select('*, product_variants(*)')
      .single();

    if (error) {
      throw error;
    }

    // Insert variants if present
    if (product.hasVariants && product.variants && product.variants.length > 0) {
      const variantPayloads = product.variants.map(v => ({
        product_id: data.id,
        business_id: businessId,
        color: v.color || null,
        size: v.size || null,
        sku: v.sku || `${product.code}-${Math.random().toString(36).substring(2, 6)}`,
        stock: v.stock || 0,
        additional_price: v.additionalPrice || 0,
        is_active: true,
      }));

      const { data: insertedVariants, error: variantErr } = await supabase
        .from('product_variants')
        .insert(variantPayloads)
        .select('*');

      if (variantErr) {
        console.warn('Error inserting product variants:', variantErr);
      } else if (insertedVariants) {
        data.product_variants = insertedVariants;
      }
    }

    return {
      id: data.id,
      name: data.name,
      code: data.sku,
      barcode: data.barcode || '',
      category: data.category_name || 'General',
      subcategory: data.subcategory || undefined,
      brand: data.brand || undefined,
      description: data.description || undefined,
      image: data.image_url || undefined,
      purchasePrice: Number(data.purchase_price || 0),
      salePrice: Number(data.sale_price || 0),
      wholesalePrice: data.wholesale_price != null ? Number(data.wholesale_price) : undefined,
      minSalePrice: data.min_sale_price != null ? Number(data.min_sale_price) : undefined,
      currentStock: Number(data.current_stock || 0),
      minStockAlert: Number(data.min_stock_alert || 5),
      unit: data.unit || 'pcs',
      businessType: data.business_type,
      hasVariants: Boolean(data.has_variants),
      variants: data.product_variants?.map((v: any) => ({
        id: v.id,
        color: v.color || undefined,
        size: v.size || undefined,
        sku: v.sku,
        stock: Number(v.stock || 0),
        additionalPrice: Number(v.additional_price || 0),
      })),
      model: data.model || undefined,
      serialNumber: data.serial_number || undefined,
      warrantyPeriod: data.warranty_period || undefined,
      expiryDate: data.expiry_date || undefined,
      batchNumber: data.batch_number || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      isActive: data.is_active !== false,
    };
  },

  async updateProduct(
    id: string,
    productData: Partial<Product>,
    businessId?: string
  ): Promise<Product> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase client is not configured.');
    }

    const payload: any = {
      updated_at: new Date().toISOString(),
    };

    if (productData.name !== undefined) payload.name = productData.name;
    if (productData.code !== undefined) payload.sku = productData.code;
    if (productData.barcode !== undefined) payload.barcode = productData.barcode;
    if (productData.category !== undefined) payload.category_name = productData.category;
    if (productData.brand !== undefined) payload.brand = productData.brand;
    if (productData.description !== undefined) payload.description = productData.description;
    if (productData.purchasePrice !== undefined) payload.purchase_price = productData.purchasePrice;
    if (productData.salePrice !== undefined) payload.sale_price = productData.salePrice;
    if (productData.wholesalePrice !== undefined) payload.wholesale_price = productData.wholesalePrice;
    if (productData.currentStock !== undefined) payload.current_stock = productData.currentStock;
    if (productData.minStockAlert !== undefined) payload.min_stock_alert = productData.minStockAlert;
    if (productData.unit !== undefined) payload.unit = productData.unit;
    if (productData.businessType !== undefined) payload.business_type = productData.businessType;
    if (productData.hasVariants !== undefined) payload.has_variants = productData.hasVariants;
    if (productData.model !== undefined) payload.model = productData.model;
    if (productData.warrantyPeriod !== undefined) payload.warranty_period = productData.warrantyPeriod;
    if (productData.expiryDate !== undefined) payload.expiry_date = productData.expiryDate;
    if (productData.batchNumber !== undefined) payload.batch_number = productData.batchNumber;
    if (productData.isActive !== undefined) payload.is_active = productData.isActive;

    let query = supabase.from('products').update(payload).eq('id', id);
    if (businessId) {
      query = query.eq('business_id', businessId);
    }

    const { data, error } = await query.select('*, product_variants(*)').single();
    if (error) {
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      code: data.sku,
      barcode: data.barcode || '',
      category: data.category_name || 'General',
      subcategory: data.subcategory || undefined,
      brand: data.brand || undefined,
      description: data.description || undefined,
      image: data.image_url || undefined,
      purchasePrice: Number(data.purchase_price || 0),
      salePrice: Number(data.sale_price || 0),
      wholesalePrice: data.wholesale_price != null ? Number(data.wholesale_price) : undefined,
      minSalePrice: data.min_sale_price != null ? Number(data.min_sale_price) : undefined,
      currentStock: Number(data.current_stock || 0),
      minStockAlert: Number(data.min_stock_alert || 5),
      unit: data.unit || 'pcs',
      businessType: data.business_type,
      hasVariants: Boolean(data.has_variants),
      variants: data.product_variants?.map((v: any) => ({
        id: v.id,
        color: v.color || undefined,
        size: v.size || undefined,
        sku: v.sku,
        stock: Number(v.stock || 0),
        additionalPrice: Number(v.additional_price || 0),
      })),
      model: data.model || undefined,
      serialNumber: data.serial_number || undefined,
      warrantyPeriod: data.warranty_period || undefined,
      expiryDate: data.expiry_date || undefined,
      batchNumber: data.batch_number || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      isActive: data.is_active !== false,
    };
  },

  async softDeleteProduct(productId: string, businessId?: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase client is not configured.');
    }

    let query = supabase
      .from('products')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', productId);

    if (businessId) {
      query = query.eq('business_id', businessId);
    }

    const { error } = await query;
    if (error) {
      throw error;
    }
    return true;
  },

  async permanentDeleteProduct(productId: string, businessId?: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase client is not configured.');
    }

    let query = supabase.from('products').delete().eq('id', productId);
    if (businessId) {
      query = query.eq('business_id', businessId);
    }

    const { error } = await query;
    if (error) {
      throw error;
    }
    return true;
  },
};
