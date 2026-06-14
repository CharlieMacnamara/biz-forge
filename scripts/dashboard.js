#!/usr/bin/env node
import 'dotenv/config';
import { buildDashboard } from '../src/lib/dashboard.js';
import { getDeadlines, getUpcomingDeadlines } from '../src/lib/calendar.js';
import * as logger from '../src/lib/logger.js';
import { checkInsurance } from '../src/lib/readiness.js';

const revenue = parseFloat(process.argv[2]) || null;

if (!revenue) {
  logger.header(`${process.env.COMPANY_NAME || 'Your Company'} — Dashboard`);
  logger.info('Usage: npm run dashboard -- ANNUAL_REVENUE');
  logger.info('Example: npm run dashboard -- 60000');
  logger.info('');
  logger.info('No revenue argument provided. Run `npm run strategy -- REVENUE`');
  logger.info('for a detailed tax strategy comparison instead.');
  process.exit(0);
}

const expenses = 2000;
const dashboard = buildDashboard(revenue, expenses);

// --- Prepare deadlines from env ---
const env = {
  PI_INSURANCE_EXPIRY: process.env.PI_INSURANCE_EXPIRY,
  COMPANY_INCORPORATION_DATE: process.env.COMPANY_INCORPORATION_DATE,
  ICO_REGISTRATION_DATE: process.env.ICO_REGISTRATION_DATE,
};
const allDeadlines = getDeadlines(env);
const upcomingDeadlines = getUpcomingDeadlines(allDeadlines, 5);

// --- Insurance check ---
const insuranceResult = checkInsurance(process.env.PI_INSURANCE_EXPIRY);
const insurancePassed = insuranceResult[0]?.pass ?? false;
const insuranceDetail = insuranceResult[0]?.detail ?? 'Insurance expiry not configured';

// Map calendar urgency level to emoji-free label
function urgencyLabel(level) {
  switch (level) {
    case 'critical': return 'CRITICAL';
    case 'warning':  return 'WARNING';
    default:         return 'OK';
  }
}

// =========================================================================
// SECTION 1 — Scenario
// =========================================================================
logger.header(`Dashboard — £${revenue.toLocaleString()}/yr`);
logger.rule();

logger.header('Scenario');
logger.section('Revenue', `£${dashboard.scenario.revenue.toLocaleString()}`);
logger.section('Expenses', `£${dashboard.scenario.expenses.toLocaleString()}`);

// =========================================================================
// SECTION 2 — Salary
// =========================================================================
logger.header('Salary');
logger.section('Optimal director salary', `£${dashboard.salary.amount.toLocaleString()}/yr`);
logger.section('Employer NI', `£${Math.round(dashboard.salary.employerNI).toLocaleString()}`);
logger.section('Total salary cost', `£${Math.round(dashboard.salary.totalCost).toLocaleString()}`);
logger.info('Salary at Personal Allowance limit — 0% income tax, 0% employee NI');

// =========================================================================
// SECTION 3 — Tax Strategy (No Pension vs With Pension)
// =========================================================================
logger.header('Tax Strategy — No Pension vs With Pension');
logger.rule();

logger.section('No Pension — Corporation Tax', `£${Math.round(dashboard.tax.noPension.corpTax).toLocaleString()}`);
logger.section('No Pension — Available for dividends', `£${Math.round(dashboard.tax.noPension.availableForDividends).toLocaleString()}`);
logger.section('No Pension — Dividend tax', `£${Math.round(dashboard.tax.noPension.dividendTax).toLocaleString()}`);
logger.section('No Pension — Net take-home', `£${Math.round(dashboard.tax.noPension.netTakeHome).toLocaleString()}`);
logger.section('No Pension — Total wealth', `£${Math.round(dashboard.tax.noPension.netTakeHome).toLocaleString()} (take-home only)`);

logger.rule();

logger.section('With Pension — Pension contribution', `£${Math.round(dashboard.tax.withPension.pensionContribution).toLocaleString()}`);
logger.section('With Pension — Corporation Tax', `£${Math.round(dashboard.tax.withPension.corpTax).toLocaleString()}`);
logger.section('With Pension — Available for dividends', `£${Math.round(dashboard.tax.withPension.availableForDividends).toLocaleString()}`);
logger.section('With Pension — Dividend tax', `£${Math.round(dashboard.tax.withPension.dividendTax).toLocaleString()}`);
logger.section('With Pension — Net take-home', `£${Math.round(dashboard.tax.withPension.netTakeHome).toLocaleString()}`);
logger.section('With Pension — Pension growth', `£${Math.round(dashboard.tax.withPension.pensionGrowth).toLocaleString()}`);
logger.section('With Pension — Total wealth', `£${Math.round(dashboard.tax.withPension.totalWealth).toLocaleString()}`);

// =========================================================================
// SECTION 4 — VAT
// =========================================================================
if (dashboard.vat) {
  logger.header('VAT Assessment');
  logger.warn('VAT registration is REQUIRED (revenue exceeds £90,000 threshold)');
  logger.section('Annual turnover (excl VAT)', `£${Math.round(dashboard.vat.annualTurnover).toLocaleString()}`);
  logger.section('VAT collected (20%)', `£${Math.round(dashboard.vat.vatCollected).toLocaleString()}`);
  logger.section('VAT payable (FRS 14.5%)', `£${Math.round(dashboard.vat.vatPayable).toLocaleString()}`);
  logger.section('Flat rate surplus (kept)', `£${Math.round(dashboard.vat.vatSurplus).toLocaleString()}`);
  logger.info('Flat Rate Scheme: charge 20% VAT to clients, pay HMRC at reduced rate, keep the difference.');
} else if (revenue >= 85000) {
  logger.header('VAT Assessment');
  logger.warn(`Revenue of £${revenue.toLocaleString()} approaching £90,000 VAT threshold — consider voluntary registration`);
} else {
  logger.header('VAT Assessment');
  logger.tick(`Revenue below £85,000 buffer — no VAT requirement yet`);
}

// =========================================================================
// SECTION 5 — Dividends
// =========================================================================
logger.header('Dividends YTD');
const divYTD = dashboard.dividends.yearToDate;
if (divYTD > 0) {
  logger.section('Year-to-date dividends declared', `£${divYTD.toLocaleString()}`);
} else {
  logger.info('No dividends declared yet this year');
}
logger.section('Remaining dividend allowance (at £500/yr)', `£${dashboard.dividends.remainingAllowance.toLocaleString()}`);

// =========================================================================
// SECTION 6 — Upcoming Deadlines + Insurance
// =========================================================================
logger.header('Upcoming Deadlines');

if (upcomingDeadlines.length === 0) {
  logger.info('No upcoming deadlines configured. Set COMPANY_INCORPORATION_DATE,');
  logger.info('PI_INSURANCE_EXPIRY, and ICO_REGISTRATION_DATE in your .env file.');
} else {
  for (const dl of upcomingDeadlines) {
    const label = dl.label;
    const date = dl.date;
    const days = dl.daysUntil;
    const urgency = urgencyLabel(dl.urgency.level);

    const desc = days < 0
      ? `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`
      : `${days} day${days === 1 ? '' : 's'}`;

    logger.section(`${label} (${date})`, `${desc} — ${urgency}`);
  }
}

// Insurance health pulse
logger.header('Insurance');
if (insurancePassed) {
  logger.tick(insuranceDetail);
} else {
  logger.cross(insuranceDetail);
}

// =========================================================================
// Summary / exit
// =========================================================================
logger.rule();
logger.ok('Dashboard complete — all figures are estimates based on 2026/27 tax year.');
logger.info('Run `npm run strategy -- REVENUE` for a detailed tax strategy breakdown.');

process.exit(0);
