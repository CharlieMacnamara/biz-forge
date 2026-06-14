import { readFileSync } from 'fs';
import { join } from 'path';
import { THRESHOLDS, fullStrategy, flatRateVat } from './finances.js';

/**
 * Build a financial dashboard aggregating all UK tax/VAT/dividend data.
 * @param {number} revenue - Annual revenue (negative values are clamped to 0)
 * @param {number} [expenses=2000] - Annual expenses
 * @returns {object} Dashboard with scenario, salary, tax, vat, dividends, compliance, summary
 */
function buildDashboard(revenue, expenses = 2000) {
  const safeRevenue = Math.max(0, revenue);
  const strategy = fullStrategy(safeRevenue, expenses);

  // --- VAT section ---
  let vat = null;
  if (safeRevenue >= THRESHOLDS.vatThreshold) {
    const vd = flatRateVat(safeRevenue);
    vat = {
      annualTurnover: vd.annualTurnover,
      vatCollected: vd.vatCollected,
      vatPayable: vd.vatPayable,
      vatSurplus: vd.vatSurplus,
      isRequired: true,
    };
  }

  // --- Dividends from data file (optional) ---
  let dividendsData = { yearToDate: 0, totalDeclared: 0 };
  try {
    const divPath = join(process.cwd(), 'data', 'dividends.json');
    const raw = readFileSync(divPath, 'utf-8');
    const parsed = JSON.parse(raw);
    dividendsData = {
      yearToDate: parsed.yearToDate ?? 0,
      totalDeclared: parsed.totalDeclared ?? 0,
    };
  } catch {
    // File doesn't exist or is unreadable — use defaults
  }

  const remainingAllowance = Math.max(0, THRESHOLDS.dividendAllowance - dividendsData.yearToDate);

  // --- Compliance ---
  const companyVatRegistered = vat !== null;

  // --- Summary ---
  const cashTakeHome = strategy.withPension.netTakeHome + dividendsData.yearToDate;
  const totalWealthWithPension = strategy.withPension.totalWealth + dividendsData.yearToDate;

  return {
    scenario: { revenue: safeRevenue, expenses },
    salary: strategy.salary,
    tax: {
      noPension: strategy.noPension,
      withPension: strategy.withPension,
    },
    vat,
    dividends: {
      yearToDate: dividendsData.yearToDate,
      remainingAllowance,
      totalDeclared: dividendsData.totalDeclared,
    },
    compliance: {
      insuranceExpiry: null,
      insuranceDaysLeft: null,
      companyVatRegistered,
    },
    summary: {
      cashTakeHome,
      totalWealthWithPension,
    },
  };
}

/**
 * Parse a YYYY-MM-DD string into a Date (treated as UTC midnight).
 * @param {string} str
 * @returns {Date}
 */
function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/**
 * Format a Date as YYYY-MM-DD in UTC.
 * @param {Date} date
 * @returns {string}
 */
function fmtDate(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Compute days between two YYYY-MM-DD date strings (as UTC midnights).
 * @param {string} a - Target date
 * @param {string} b - Reference date
 * @returns {number}
 */
function daysBetween(a, b) {
  return Math.round((parseDate(a) - parseDate(b)) / (1000 * 60 * 60 * 24));
}

/**
 * Compute urgency label from daysUntil.
 * @param {number} daysUntil
 * @returns {'critical'|'warning'|'ok'}
 */
function urgency(daysUntil) {
  if (daysUntil < 7) return 'critical';
  if (daysUntil < 30) return 'warning';
  return 'ok';
}

/**
 * Calculate key compliance/business deadlines with urgency scoring.
 * @param {object} env - Environment/configuration object with date strings
 * @param {string} [env.COMPANY_INCORPORATION_DATE] - YYYY-MM-DD
 * @param {string} [env.PI_INSURANCE_EXPIRY] - YYYY-MM-DD
 * @param {string} [env.ICO_RENEWAL_DATE] - YYYY-MM-DD
 * @param {string} [env.CURRENT_DATE] - YYYY-MM-DD (defaults to today)
 * @returns {Array<{label: string, date: string, daysUntil: number, urgency: string}>}
 */
function calculateDeadlines(env) {
  const now = env.CURRENT_DATE || fmtDate(new Date());
  const nowParts = now.split('-').map(Number);
  const nowYear = nowParts[0];
  const nowMonth = nowParts[1]; // 1-based
  const nowDay = nowParts[2];

  const deadlines = [];

  // --- Self Assessment filing deadline: 31 January ---
  // If before (or on) Jan 31, deadline is this year's Jan 31; otherwise next year's
  let saYear = nowYear;
  if (nowMonth > 1 || (nowMonth === 1 && nowDay > 31)) {
    saYear = nowYear + 1;
  }
  const saDate = `${saYear}-01-31`;
  deadlines.push({
    label: 'Self Assessment filing deadline',
    date: saDate,
    daysUntil: daysBetween(saDate, now),
    urgency: null, // filled below
  });

  // --- Confirmation Statement + CT payment from incorporation date ---
  if (env.COMPANY_INCORPORATION_DATE) {
    const incParts = env.COMPANY_INCORPORATION_DATE.split('-').map(Number);

    // Next Confirmation Statement: anniversary of incorporation + 14 days
    let csYear = nowYear;
    const csThisYear = `${csYear}-${String(incParts[1]).padStart(2, '0')}-${String(incParts[2]).padStart(2, '0')}`;
    if (daysBetween(csThisYear, now) < 0) {
      csYear = nowYear + 1;
    }
    const csAnniversary = new Date(Date.UTC(csYear, incParts[1] - 1, incParts[2]));
    csAnniversary.setUTCDate(csAnniversary.getUTCDate() + 14);
    const csDate = fmtDate(csAnniversary);
    deadlines.push({
      label: 'Confirmation Statement deadline',
      date: csDate,
      daysUntil: daysBetween(csDate, now),
      urgency: null,
    });

    // CT payment: year-end + 9 months + 1 day
    // Year-end = the next anniversary of incorporation
    let ctYear = nowYear;
    const yearEndThisYear = `${ctYear}-${String(incParts[1]).padStart(2, '0')}-${String(incParts[2]).padStart(2, '0')}`;
    if (daysBetween(yearEndThisYear, now) < 0) {
      ctYear = nowYear + 1;
    }
    const ctDateObj = new Date(Date.UTC(ctYear, incParts[1] - 1, incParts[2]));
    ctDateObj.setUTCMonth(ctDateObj.getUTCMonth() + 9);
    ctDateObj.setUTCDate(ctDateObj.getUTCDate() + 1);
    const ctDate = fmtDate(ctDateObj);
    deadlines.push({
      label: 'Corporation Tax payment deadline',
      date: ctDate,
      daysUntil: daysBetween(ctDate, now),
      urgency: null,
    });
  }

  // --- PI Insurance expiry ---
  if (env.PI_INSURANCE_EXPIRY) {
    deadlines.push({
      label: 'PI Insurance expiry',
      date: env.PI_INSURANCE_EXPIRY,
      daysUntil: daysBetween(env.PI_INSURANCE_EXPIRY, now),
      urgency: null,
    });
  }

  // --- ICO renewal ---
  if (env.ICO_RENEWAL_DATE) {
    deadlines.push({
      label: 'ICO renewal deadline',
      date: env.ICO_RENEWAL_DATE,
      daysUntil: daysBetween(env.ICO_RENEWAL_DATE, now),
      urgency: null,
    });
  }

  // Compute urgency for each
  for (const d of deadlines) {
    d.urgency = urgency(d.daysUntil);
  }

  // Sort by date ascending
  deadlines.sort((a, b) => parseDate(a.date) - parseDate(b.date));

  return deadlines;
}

/**
 * Get UK VAT quarterly return deadlines for a given year.
 * @param {number} year - Calendar year (e.g., 2026)
 * @returns {Array<{label: string, periodStart: string, periodEnd: string, dueDate: string}>}
 */
function getQuarterlyDeadlines(year) {
  const quarterDefs = [
    { label: 'Q1', startMonth: 1, startDay: 1, endMonth: 3, endDay: 31 },
    { label: 'Q2', startMonth: 4, startDay: 1, endMonth: 6, endDay: 30 },
    { label: 'Q3', startMonth: 7, startDay: 1, endMonth: 9, endDay: 30 },
    { label: 'Q4', startMonth: 10, startDay: 1, endMonth: 12, endDay: 31 },
  ];

  return quarterDefs.map((q) => {
    const periodStart = `${year}-${String(q.startMonth).padStart(2, '0')}-${String(q.startDay).padStart(2, '0')}`;
    const periodEnd = `${year}-${String(q.endMonth).padStart(2, '0')}-${String(q.endDay).padStart(2, '0')}`;

    // Due date = 7 days after quarter end + 1 month
    // Add days first to avoid month-length overflow issues (e.g. March 31 + 1 month)
    const dueDateObj = new Date(Date.UTC(year, q.endMonth - 1, q.endDay + 7));
    dueDateObj.setUTCMonth(dueDateObj.getUTCMonth() + 1);
    const dueDate = fmtDate(dueDateObj);

    return {
      label: `${q.label} VAT quarter`,
      periodStart,
      periodEnd,
      dueDate,
    };
  });
}

export { buildDashboard, calculateDeadlines, getQuarterlyDeadlines };
