/**
 * @typedef {Object} Urgency
 * @property {'critical'|'warning'|'ok'} level
 * @property {'🔴'|'🟡'|'🟢'} symbol
 * @property {string} message
 */

/**
 * @typedef {Object} Deadline
 * @property {string} id
 * @property {string} label
 * @property {string} date - YYYY-MM-DD
 * @property {number} daysUntil
 * @property {Urgency} urgency
 * @property {'annual'|'quarterly'|'one-off'|'renewal'} type
 */

/**
 * @typedef {Object} QuarterDeadline
 * @property {number} quarter  - 1-4
 * @property {string} periodStart - YYYY-MM-DD
 * @property {string} periodEnd   - YYYY-MM-DD
 * @property {string} dueDate     - YYYY-MM-DD
 * @property {string} label
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format a Date to YYYY-MM-DD using UTC fields. */
function fmt(d) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Compute whole days between now and a date string. Negative = past. */
function computeDaysUntil(dateStr) {
  const now = new Date();
  const target = new Date(dateStr);
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

/** Build a deadline object given an id, label, date string, and type. */
function buildDeadline(id, label, dateStr, type) {
  const daysUntil = computeDaysUntil(dateStr);
  return {
    id,
    label,
    date: dateStr,
    daysUntil,
    urgency: getUrgency(daysUntil),
    type,
  };
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

/**
 * Determine urgency level from days-until integer.
 *
 * @param {number|null|undefined} daysUntil
 * @returns {Urgency}
 */
export function getUrgency(daysUntil) {
  if (daysUntil === null || daysUntil === undefined) {
    return { level: 'ok', symbol: '🟢', message: 'Date not available' };
  }

  if (daysUntil < 7) {
    const message =
      daysUntil < 0
        ? `OVERDUE by ${Math.abs(daysUntil)} day${Math.abs(daysUntil) === 1 ? '' : 's'}`
        : `${daysUntil} day${daysUntil === 1 ? '' : 's'} until deadline`;
    return { level: 'critical', symbol: '🔴', message };
  }

  if (daysUntil < 30) {
    return {
      level: 'warning',
      symbol: '🟡',
      message: `${daysUntil} days until deadline`,
    };
  }

  return {
    level: 'ok',
    symbol: '🟢',
    message: `${daysUntil} days until deadline`,
  };
}

/**
 * Compute all applicable deadlines from an env-like object.
 *
 * @param {Object} env  Object with optional date fields:
 *   PI_INSURANCE_EXPIRY, ICO_REGISTRATION_DATE, COMPANY_INCORPORATION_DATE
 * @returns {Deadline[]} Deadlines sorted by daysUntil ascending.
 */
export function getDeadlines(env) {
  const deadlines = [];

  // Self Assessment — always 31 Jan of the next year
  const now = new Date();
  const nextYear = now.getUTCFullYear() + 1;
  const saDate = `${nextYear}-01-31`;
  deadlines.push(
    buildDeadline(
      'self-assessment',
      'Self Assessment filing deadline',
      saDate,
      'annual',
    ),
  );

  // PI Insurance expiry
  if (env.PI_INSURANCE_EXPIRY) {
    deadlines.push(
      buildDeadline(
        'pi-insurance',
        'PI Insurance renewal',
        env.PI_INSURANCE_EXPIRY,
        'renewal',
      ),
    );
  }

  // ICO renewal — registration date + 1 year
  if (env.ICO_REGISTRATION_DATE) {
    const d = new Date(env.ICO_REGISTRATION_DATE);
    d.setUTCFullYear(d.getUTCFullYear() + 1);
    deadlines.push(
      buildDeadline('ico-renewal', 'ICO Data Protection Fee renewal', fmt(d), 'annual'),
    );
  }

  if (env.COMPANY_INCORPORATION_DATE) {
    const incorp = env.COMPANY_INCORPORATION_DATE;

    // Confirmation Statement — incorporation + 12 months + 14 days
    const cs = new Date(incorp);
    cs.setUTCMonth(cs.getUTCMonth() + 12);
    cs.setUTCDate(cs.getUTCDate() + 14);
    deadlines.push(
      buildDeadline(
        'confirmation-statement',
        'Confirmation Statement due',
        fmt(cs),
        'annual',
      ),
    );

    // Corporation Tax payment — incorporation + 12 months (year end) + 9 months + 1 day
    const ctPay = new Date(incorp);
    ctPay.setUTCMonth(ctPay.getUTCMonth() + 21); // 12 + 9
    ctPay.setUTCDate(ctPay.getUTCDate() + 1);
    deadlines.push(
      buildDeadline(
        'corporation-tax-payment',
        'Corporation Tax payment due',
        fmt(ctPay),
        'annual',
      ),
    );

    // Corporation Tax return — incorporation + 12 months (year end) + 12 months
    const ctRet = new Date(incorp);
    ctRet.setUTCMonth(ctRet.getUTCMonth() + 24);
    deadlines.push(
      buildDeadline(
        'corporation-tax-return',
        'Corporation Tax return due',
        fmt(ctRet),
        'annual',
      ),
    );
  }

  // Sort by daysUntil ascending
  deadlines.sort((a, b) => a.daysUntil - b.daysUntil);

  return deadlines;
}

/**
 * Generate the four standard UK VAT quarter deadlines for a given year.
 *
 * Calendar quarters (not registration-dependent):
 *   Q1 Jan-Mar → due 7 May
 *   Q2 Apr-Jun → due 7 Aug
 *   Q3 Jul-Sep → due 7 Nov
 *   Q4 Oct-Dec → due 7 Feb (following year)
 *
 * @param {number} year
 * @returns {QuarterDeadline[]}
 */
export function getQuarterlyDeadlines(year) {
  const MONTH_ABBR = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  const quarters = [
    { q: 1, sm: 1, em: 3, dd: 7, dm: 5, dueYear: year },
    { q: 2, sm: 4, em: 6, dd: 7, dm: 8, dueYear: year },
    { q: 3, sm: 7, em: 9, dd: 7, dm: 11, dueYear: year },
    { q: 4, sm: 10, em: 12, dd: 7, dm: 2, dueYear: year + 1 },
  ];

  const periodEndDay = { 3: 31, 6: 30, 9: 30, 12: 31 };

  return quarters.map((q) => {
    const pStart = `${year}-${String(q.sm).padStart(2, '0')}-01`;
    const pEnd = `${year}-${String(q.em).padStart(2, '0')}-${periodEndDay[q.em]}`;
    const due = `${q.dueYear}-${String(q.dm).padStart(2, '0')}-${String(q.dd).padStart(2, '0')}`;
    const label = `VAT Q${q.q} (${MONTH_ABBR[q.sm - 1]}-${MONTH_ABBR[q.em - 1]} ${year})`;

    return {
      quarter: q.q,
      periodStart: pStart,
      periodEnd: pEnd,
      dueDate: due,
      label,
    };
  });
}

/**
 * Return the next N upcoming deadlines (including overdue items) sorted
 * by daysUntil ascending.
 *
 * @param {Deadline[]} deadlines
 * @param {number} [count=5]
 * @returns {Deadline[]}
 */
export function getUpcomingDeadlines(deadlines, count = 5) {
  return [...deadlines]
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, count);
}
