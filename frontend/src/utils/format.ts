/**
 * Format number to Vietnamese Dong currency
 * @param value - Number or string to format
 * @param options - Optional configuration
 * @returns Formatted VND string (e.g., "1.000.000đ")
 */
export const formatVND = (
  value: number | string | null | undefined,
  options?: {
    showCurrency?: boolean // Show "đ" symbol (default: true)
    returnZero?: boolean // Return "0đ" if value is 0 (default: true)
  }
): string => {
  const { showCurrency = true, returnZero = true } = options || {}

  // Handle null/undefined
  if (value === null || value === undefined) {
    return showCurrency ? '0đ' : '0'
  }

  // Convert to number
  const numValue = typeof value === 'string' ? parseFloat(value) : value

  // Handle invalid numbers
  if (isNaN(numValue)) {
    return showCurrency ? '0đ' : '0'
  }

  // Handle zero
  if (numValue === 0 && !returnZero) {
    return ''
  }

  // Format number with thousand separators
  const formatted = Math.round(numValue).toLocaleString('vi-VN')

  return showCurrency ? `${formatted}đ` : formatted
}

/**
 * Format price range
 * @param min - Minimum price
 * @param max - Maximum price
 * @returns Formatted price range (e.g., "100.000đ - 500.000đ")
 */
export const formatPriceRange = (
  min: number | string,
  max: number | string
): string => {
  return `${formatVND(min)} - ${formatVND(max)}`
}

/**
 * Format price with "Từ" prefix
 * @param value - Price value
 * @returns Formatted price with prefix (e.g., "Từ 200.000đ")
 */
export const formatPriceFrom = (value: number | string): string => {
  return `Từ ${formatVND(value)}`
}

/**
 * Calculate and format discount percentage
 * @param originalPrice - Original price before discount
 * @param discountedPrice - Price after discount
 * @returns Formatted discount percentage (e.g., "-25%")
 */
export const formatDiscountPercentage = (
  originalPrice: number | string,
  discountedPrice: number | string
): string => {
  const original = typeof originalPrice === 'string' ? parseFloat(originalPrice) : originalPrice
  const discounted = typeof discountedPrice === 'string' ? parseFloat(discountedPrice) : discountedPrice

  if (isNaN(original) || isNaN(discounted) || original <= 0) {
    return '0%'
  }

  const percentage = Math.round((1 - discounted / original) * 100)
  return percentage > 0 ? `-${percentage}%` : '0%'
}

/**
 * Calculate and format savings amount
 * @param originalPrice - Original price before discount
 * @param discountedPrice - Price after discount
 * @returns Formatted savings (e.g., "Tiết kiệm 100.000đ")
 */
export const formatSavings = (
  originalPrice: number | string,
  discountedPrice: number | string
): string => {
  const original = typeof originalPrice === 'string' ? parseFloat(originalPrice) : originalPrice
  const discounted = typeof discountedPrice === 'string' ? parseFloat(discountedPrice) : discountedPrice

  if (isNaN(original) || isNaN(discounted) || original <= discounted) {
    return ''
  }

  const savings = original - discounted
  return `Tiết kiệm ${formatVND(savings)}`
}
