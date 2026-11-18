// ========================================================================================
// TriBloom Farms: Formatters & Calculation Utilities
// ========================================================================================

/**
 * Format currency in Indian Numbering System (e.g. ₹1,25,000.00 or ₹1,25,000)
 */
export function formatINR(amount: number, showDecimals: boolean = false): string {
  if (amount === undefined || amount === null || isNaN(amount)) return "₹0";
  
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  const options: Intl.NumberFormatOptions = {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: showDecimals ? 2 : 0,
    minimumFractionDigits: showDecimals ? 2 : 0,
  };
  
  try {
    const formatted = new Intl.NumberFormat("en-IN", options).format(absAmount);
    return isNegative ? `-${formatted}` : formatted;
  } catch {
    return (isNegative ? "-₹" : "₹") + absAmount.toLocaleString("en-IN");
  }
}

export const formatCurrency = formatINR;

/**
 * Format stem or integer quantity with Indian commas (e.g. 1,45,200)
 */
export function formatNumber(value: number): string {
  if (value === undefined || value === null || isNaN(value)) return "0";
  return new Intl.NumberFormat("en-IN").format(Math.round(value));
}

/**
 * Format Date to readable Indian farm format (e.g. 24 Sep 2026)
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Convert stems count into bunches (Default: 20 stems = 1 bunch)
 */
export function stemsToBunches(stems: number, stemsPerBunch: number = 20): string {
  const bunches = stems / stemsPerBunch;
  return `${bunches % 1 === 0 ? bunches : bunches.toFixed(1)} bunches (${stemsPerBunch} stems/bch)`;
}

/**
 * Capital investment breakdown tooltip description
 */
export const FORMULA_TOOLTIPS = {
  netCapital: "Net Capital = Contributed Cash + Expenses marked as Contribution + (Reimbursable Expenses Paid - Reimbursements Received)",
  outstandingCommitment: "Outstanding Commitment = Total Committed Investment - Total Cash Contributed",
  reimbursementDue: "Reimbursement Due = Reimbursable Farm Expenses Paid by Partner - Total Reimbursements Paid Out",
  costPerStem: "Cost Per Stem = Total Expenses in Period / Total Good Stems Harvested",
  wastagePercent: "Wastage % = Wastage Stems / (Good Stems + Wastage Stems) * 100",
};

/** Today's date as YYYY-MM-DD in the user's local time (India), for date inputs. */
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Current Indian financial year label, e.g. "FY 2026-27" (April to March). */
export function currentFYLabel(): string {
  const d = new Date();
  const start = d.getMonth() + 1 >= 4 ? d.getFullYear() : d.getFullYear() - 1;
  return `FY ${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}
