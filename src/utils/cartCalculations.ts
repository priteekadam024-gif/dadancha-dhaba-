import { CartItem, Coupon } from '../types';

/**
 * Extract the unit price for a given cart item taking into account selected variants,
 * unitPrice overrides, and base product price.
 */
export function getCartItemUnitPrice(item: CartItem): number {
  if (item.selectedVariant && Number(item.selectedVariant.price) > 0) {
    return Number(item.selectedVariant.price);
  }
  if (item.unitPrice !== undefined && item.unitPrice !== null && Number(item.unitPrice) > 0) {
    return Number(item.unitPrice);
  }
  return Number(item.product?.price) || 0;
}

/**
 * Extract the line total for a given cart item (unit price * quantity).
 */
export function getCartItemLineTotal(item: CartItem): number {
  const price = getCartItemUnitPrice(item);
  const qty = Math.max(0, Number(item.quantity) || 0);
  return price * qty;
}

export interface OrderTotals {
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  gstAmount: number;
  grandTotal: number;
  gstRatesSummary?: string;
  uniqueGstRates?: number[];
}

export const DEFAULT_PAYMENT_METHODS: string[] = [
  'cod',
  'bhim_upi',
  'google_pay',
  'phonepe',
  'razorpay',
];

export interface AllowedPaymentOptions {
  allowCod: boolean;
  allowUpi: boolean;
  allowRazorpay: boolean;
  isCompatible: boolean;
  activeMethods: string[];
}

/**
 * Format currency amount cleanly (e.g. 425 -> "425", 21.25 -> "21.25", 7.5 -> "7.50")
 */
export function formatAmount(val: number): string {
  const num = Number(val) || 0;
  return Number.isInteger(num) ? String(num) : num.toFixed(2);
}

/**
 * Calculate payment methods allowed across all products in the cart (intersection rule).
 */
export function getAllowedPaymentMethods(cart: CartItem[]): AllowedPaymentOptions {
  if (!cart || cart.length === 0) {
    return {
      allowCod: true,
      allowUpi: true,
      allowRazorpay: true,
      isCompatible: true,
      activeMethods: ['cod', 'bhim_upi', 'google_pay', 'phonepe', 'razorpay'],
    };
  }

  let allowCod = true;
  let allowUpi = true;
  let allowRazorpay = true;

  for (const item of cart) {
    const p = item.product;
    const methods = Array.isArray(p?.paymentMethods) && p.paymentMethods.length > 0
      ? p.paymentMethods
      : DEFAULT_PAYMENT_METHODS;

    const hasCod = methods.includes('cod');
    const hasUpi = methods.some((m) => ['upi', 'bhim_upi', 'google_pay', 'phonepe'].includes(m));
    const hasRazorpay = methods.includes('razorpay');

    if (!hasCod) allowCod = false;
    if (!hasUpi) allowUpi = false;
    if (!hasRazorpay) allowRazorpay = false;
  }

  const isCompatible = allowCod || allowUpi || allowRazorpay;

  return {
    allowCod,
    allowUpi,
    allowRazorpay,
    isCompatible,
    activeMethods: [
      ...(allowCod ? ['cod'] : []),
      ...(allowUpi ? ['upi'] : []),
      ...(allowRazorpay ? ['razorpay'] : []),
    ],
  };
}

/**
 * Unified single source of truth for calculating cart and checkout order totals
 * with support for product-level GST rates and variant prices.
 */
export function calculateOrderTotals(
  cart: CartItem[],
  appliedCoupon?: Coupon | null
): OrderTotals {
  // 1. Calculate subtotal strictly from current cart items using variant/unit prices & quantity
  const subtotal = cart.reduce((acc, item) => {
    return acc + getCartItemLineTotal(item);
  }, 0);

  // 2. Coupon discount calculation
  let discountAmount = 0;
  if (appliedCoupon && subtotal > 0) {
    if (appliedCoupon.discountType === 'percentage') {
      discountAmount = Math.round((subtotal * (Number(appliedCoupon.value) || 0)) / 100);
    } else {
      discountAmount = Number(appliedCoupon.value) || 0;
    }
    discountAmount = Math.min(discountAmount, subtotal);
  }

  // 3. Shipping fee calculation: Free shipping for orders above ₹499 or empty cart, else ₹50
  const shippingFee = subtotal > 499 || cart.length === 0 ? 0 : 50;

  // 4. Product-level GST calculation
  const usedRatesSet = new Set<number>();
  let totalGst = 0;

  for (const item of cart) {
    const lineSubtotal = getCartItemLineTotal(item);
    if (lineSubtotal <= 0) continue;

    const gstEnabled = item.product?.gstEnabled !== undefined ? Boolean(item.product.gstEnabled) : true;
    const rawRate = Number(item.product?.gstRate !== undefined ? item.product.gstRate : 5);
    const effectiveRate = gstEnabled && !isNaN(rawRate) && rawRate >= 0 ? rawRate : 0;
    usedRatesSet.add(effectiveRate);

    // Apply proportional coupon discount if any
    const lineDiscount = subtotal > 0 ? (lineSubtotal / subtotal) * discountAmount : 0;
    const lineTaxableBase = Math.max(0, lineSubtotal - lineDiscount);
    const lineGst = (lineTaxableBase * effectiveRate) / 100;
    totalGst += lineGst;
  }

  // Safe 2 decimal places rounding
  const gstAmount = Math.round((totalGst + Number.EPSILON) * 100) / 100;

  const uniqueRates = Array.from(usedRatesSet).sort((a, b) => a - b);
  const gstRatesSummary = uniqueRates.length > 0
    ? uniqueRates.map((r) => `${r}%`).join(' / ')
    : '5%';

  // 5. Grand total: Subtotal - Discount + Shipping + GST
  const taxableBase = Math.max(0, subtotal - discountAmount);
  const grandTotal = Math.round((Math.max(0, taxableBase + shippingFee + gstAmount) + Number.EPSILON) * 100) / 100;

  return {
    subtotal,
    discountAmount,
    shippingFee,
    gstAmount,
    grandTotal,
    gstRatesSummary,
    uniqueGstRates: uniqueRates,
  };
}
