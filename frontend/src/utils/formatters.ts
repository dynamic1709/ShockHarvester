/**
 * Number, Currency, and Date formatters adhering to Indian Financial Standards (en-IN).
 */

export const formatINR = (val: number | string | null | undefined): string => {
  if (val === null || val === undefined || isNaN(Number(val))) return '₹0.00'
  const num = Number(val)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(num)
}

export const formatNumber = (val: number | string | null | undefined): string => {
  if (val === null || val === undefined || isNaN(Number(val))) return '0'
  const num = Number(val)
  return new Intl.NumberFormat('en-IN').format(num)
}

export const formatPct = (val: number | string | null | undefined): string => {
  if (val === null || val === undefined || isNaN(Number(val))) return '0.00%'
  const num = Number(val)
  const sign = num > 0 ? '+' : ''
  return `${sign}${num.toFixed(2)}%`
}

export const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}
