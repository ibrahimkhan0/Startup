// Formats a number as USD with no decimal places.
// Examples:
//   formatUSD(1200000)  →  "$1,200,000"
//   formatUSD(500)      →  "$500"
//   formatUSD(0)        →  "$0"
//
// Intl.NumberFormat is built into every modern browser and Node.js —
// no extra library needed.
const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export function formatUSD(value) {
  return usdFormatter.format(value)
}
