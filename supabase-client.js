// Public, read-only Supabase client for the storefront.
// Uses the ANON key — safe to expose in browser JS because RLS policies
// (see sql/schema.sql) only allow public SELECT on categories/products/product_images.
// Never put the service_role key here.

const SUPABASE_URL = "https://pzgvfrtrxwuhjilzhdax.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6Z3ZmcnRyeHd1aGppbHpoZGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MTE2NjEsImV4cCI6MjA5NjM4NzY2MX0.8ZDIhIhXGy9YeDyrzV3jykdJozreKc5WCpRgIXKe6ao";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Fetch active products for a category slug, with images, ordered by sort_order.
 * @param {string} categorySlug e.g. 'blinds'
 */
export async function getProductsByCategory(categorySlug) {
  const { data, error } = await supabase
    .from("products")
    .select(`
      id, slug, name, description, fulfillment_type, price, deposit_amount, unit, stock_qty,
      product_images ( url, sort_order ),
      categories!inner ( slug )
    `)
    .eq("categories.slug", categorySlug)
    .eq("is_active", true);

  if (error) {
    console.error("getProductsByCategory error:", error);
    return [];
  }

  // sort images client-side by sort_order
  return (data || []).map(p => ({
    ...p,
    product_images: (p.product_images || []).sort((a, b) => a.sort_order - b.sort_order)
  }));
}

/**
 * Fetch a single product by slug.
 */
export async function getProductBySlug(slug) {
  const { data, error } = await supabase
    .from("products")
    .select(`
      id, slug, name, description, fulfillment_type, price, deposit_amount, unit, stock_qty,
      product_images ( url, sort_order )
    `)
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error) {
    console.error("getProductBySlug error:", error);
    return null;
  }
  return data;
}
