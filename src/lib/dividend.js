import fs from 'fs';
import path from 'path';
import { fillTemplate, saveDocument, loadTemplate } from '../lib/legal.js';
import { dividendTax } from '../lib/finances.js';

/**
 * Load env-var defaults for company info.
 * Keys are only populated when the environment variable is actually set.
 * @returns {{ company_name?: string, company_number?: string, director_name?: string }}
 */
function loadEnvDefaults() {
  const defaults = {};
  if (process.env.COMPANY_NAME) defaults.company_name = process.env.COMPANY_NAME;
  if (process.env.COMPANY_NUMBER) defaults.company_number = process.env.COMPANY_NUMBER;
  if (process.env.DIRECTOR_NAME) defaults.director_name = process.env.DIRECTOR_NAME;
  return defaults;
}

/**
 * Load dividend history from file, or return [] if file is missing/empty.
 * @param {string} historyPath
 * @returns {Array}
 */
function loadHistory(historyPath) {
  if (!fs.existsSync(historyPath)) {
    return [];
  }
  const content = fs.readFileSync(historyPath, 'utf8');
  if (!content.trim()) {
    return [];
  }
  return JSON.parse(content);
}

/**
 * Generate an HMRC-compliant dividend voucher markdown string.
 * Auto-fills company_name / company_number / director_name from
 * environment variables when not supplied in vars.
 *
 * @param {Object} vars
 * @param {string} [vars.company_name]       — overrides env.COMPANY_NAME
 * @param {string} [vars.company_number]      — overrides env.COMPANY_NUMBER
 * @param {string} [vars.date]                — defaults to today
 * @param {string} vars.shareholder_name
 * @param {string} vars.shareholder_address
 * @param {string} vars.share_class
 * @param {string|number} vars.dividend_amount
 * @param {string|number} vars.dividend_per_share
 * @param {string|number} vars.shares_held
 * @param {string} [vars.director_name]       — overrides env.DIRECTOR_NAME
 * @returns {string} filled markdown
 */
export function generateVoucher(vars) {
  const defaults = loadEnvDefaults();
  const merged = { ...defaults, ...vars };

  if (!merged.date) {
    merged.date = new Date().toISOString().split('T')[0];
  }

  const template = loadTemplate('dividend-voucher.md');
  return fillTemplate(template, merged);
}

/**
 * Generate board minutes markdown for a dividend declaration.
 *
 * @param {Object} vars
 * @param {string} vars.company_name
 * @param {string} vars.company_number
 * @param {string} [vars.date]              — defaults to today (via generateVoucher)
 * @param {string} vars.director_name
 * @param {string|number} vars.dividend_amount
 * @param {string} [vars.meeting_location]  — defaults to "Registered Office"
 * @param {string} [vars.resolution_text]   — auto-generated from dividend_amount
 * @returns {string} filled markdown
 */
export function generateBoardMinutes(vars) {
  const merged = { ...vars };

  if (!merged.meeting_location) {
    merged.meeting_location = 'Registered Office';
  }

  if (!merged.resolution_text) {
    merged.resolution_text = `That a dividend of £${merged.dividend_amount} be declared payable to the shareholders.`;
  }

  const template = loadTemplate('board-minutes.md');
  return fillTemplate(template, merged);
}

/**
 * Save a dividend voucher and board minutes to files, and record the
 * dividend in the dividend history JSON file.
 *
 * @param {Object}  vars       — same shape as generateVoucher / generateBoardMinutes
 * @param {string}  [outputDir] — directory for the markdown files (default:
 *                                'docs/legal_templates')
 * @returns {{ voucherPath: string, minutesPath: string }}
 */
export function saveDividendRecord(vars, outputDir = 'docs/legal_templates') {
  const date = vars.date || new Date().toISOString().split('T')[0];

  // Generate document content
  const voucher = generateVoucher(vars);
  const minutes = generateBoardMinutes(vars);

  // Write voucher
  const voucherFilename = `Dividend-${date}-${String(vars.dividend_amount).replace(/,/g, '')}.md`;
  const voucherPath = saveDocument(voucher, outputDir, voucherFilename);

  // Write minutes
  const minutesFilename = `Board-Minutes-${date}.md`;
  const minutesPath = saveDocument(minutes, outputDir, minutesFilename);

  // Append to dividend history
  const historyPath = path.resolve(process.cwd(), 'data', 'dividends.json');
  const history = loadHistory(historyPath);

  history.push({
    date,
    amount: vars.dividend_amount,
    shareholderName: vars.shareholder_name,
    createdAt: new Date().toISOString(),
  });

  const dataDir = path.dirname(historyPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));

  return { voucherPath, minutesPath };
}

/**
 * Read all recorded dividends, sorted by date (most recent first).
 *
 * @returns {Array<{ date: string, amount: string, shareholderName: string, createdAt: string }>}
 */
export function getDividendHistory() {
  const historyPath = path.resolve(process.cwd(), 'data', 'dividends.json');
  const history = loadHistory(historyPath);
  return history.sort((a, b) => new Date(b.date) - new Date(a.date));
}

/**
 * Calculate dividend tax for a given level of dividend and other income.
 * Wraps dividendTax() from src/lib/finances.js with presentational fields.
 *
 * @param {number} dividendIncome
 * @param {number} [otherIncome=0]
 * @returns {{
 *   dividendIncome: number,
 *   otherIncome: number,
 *   totalIncome: number,
 *   dividendAllowance: number,
 *   taxableDividend: number,
 *   taxRate: string,
 *   taxAmount: number,
 *   effectiveRate: string,
 * }}
 */
export function calculateDividendTax(dividendIncome, otherIncome = 0) {
  const totalIncome = dividendIncome + otherIncome;
  const taxAmount = dividendTax(dividendIncome, otherIncome);
  const taxableDividend = Math.max(0, dividendIncome - 500);

  return {
    dividendIncome,
    otherIncome,
    totalIncome,
    dividendAllowance: 500,
    taxableDividend,
    taxRate: taxableDividend > 0 ? '£500 allowance used' : 'Within £500 allowance',
    taxAmount,
    effectiveRate: dividendIncome > 0
      ? (taxAmount / dividendIncome * 100).toFixed(1) + '%'
      : '0%',
  };
}
