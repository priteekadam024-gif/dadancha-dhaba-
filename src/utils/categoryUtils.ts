import { Category, Product } from '../types';

/**
 * Normalizes text for comparison by trimming, lowercasing, and removing extra whitespace
 */
function normalizeCategoryKey(val: string | null | undefined): string {
  if (!val) return '';
  return String(val).trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Checks whether a given product belongs to a category.
 * Supports category object, category ID, slug, category name (English & Marathi),
 * and handles trailing spaces, case-insensitivity, and legacy feature flags.
 */
export function isProductInCategory(
  product: Product | null | undefined,
  category: Category | string | null | undefined
): boolean {
  if (!product || !category) return false;

  const pCatId = normalizeCategoryKey(product.categoryId);
  const pCatName = normalizeCategoryKey(product.categoryName);

  if (typeof category === 'string') {
    const targetKey = normalizeCategoryKey(category);
    if (!targetKey || targetKey === 'all') return true;

    // Direct ID or name match
    if (pCatId === targetKey || pCatName === targetKey) return true;

    // Special Masale flag match
    if (product.isSpecialMasala && (targetKey.includes('special masala') || targetKey.includes('special masale'))) {
      return true;
    }

    // Kitchen Appliance flag match
    if (product.isKitchenAppliance && (targetKey.includes('appliance') || targetKey.includes('kitchen appliance'))) {
      return true;
    }

    return false;
  }

  // Category is a Category object
  const catId = normalizeCategoryKey(category.id);
  const catSlug = normalizeCategoryKey(category.slug);
  const catNameEn = normalizeCategoryKey(category.nameEn);
  const catNameMr = normalizeCategoryKey(category.nameMr);

  // Check product.categoryId against all category keys
  if (
    (pCatId && (pCatId === catId || pCatId === catSlug || pCatId === catNameEn || pCatId === catNameMr)) ||
    (pCatName && (pCatName === catId || pCatName === catSlug || pCatName === catNameEn || pCatName === catNameMr))
  ) {
    return true;
  }

  // Legacy feature flags fallback
  if (
    product.isSpecialMasala &&
    (catId.includes('special') || catSlug.includes('special') || catNameEn.includes('special'))
  ) {
    return true;
  }

  if (
    product.isKitchenAppliance &&
    (catId.includes('appliance') || catSlug.includes('appliance') || catNameEn.includes('appliance'))
  ) {
    return true;
  }

  return false;
}

/**
 * Returns all products belonging to a given category.
 */
export function getCategoryProducts(
  category: Category | string,
  products: Product[]
): Product[] {
  if (!Array.isArray(products)) return [];
  return products.filter((p) => isProductInCategory(p, category));
}

/**
 * Returns the exact live count of products in a category.
 */
export function getCategoryProductCount(
  category: Category | string,
  products: Product[]
): number {
  return getCategoryProducts(category, products).length;
}
