#!/usr/bin/env node
import 'dotenv/config';
import * as logger from '../src/lib/logger.js';
import { getDeadlines, getUrgency, getUpcomingDeadlines } from '../src/lib/calendar.js';

const env = process.env;

logger.header(`${env.COMPANY_NAME || 'Your Company'} — Deadline Calendar`);
logger.info('All recurring legal, tax, and business deadlines.');
logger.rule();

// Compute deadlines from environment
const deadlines = getDeadlines(env);
const upcoming = getUpcomingDeadlines(deadlines, 5);

// --- Next 5 Deadlines ---
logger.header('Next 5 Deadlines');
if (upcoming.length === 0) {
  logger.info('No upcoming deadlines configured. Set COMPANY_INCORPORATION_DATE, ICO_REGISTRATION_DATE, or PI_INSURANCE_EXPIRY in .env');
} else {
  for (const d of upcoming) {
    const daysText = d.daysUntil < 0
      ? `${Math.abs(d.daysUntil)} days overdue`
      : `${d.daysUntil} days until deadline`;
    logger.section(`${d.urgency.symbol}  ${d.label}`, daysText);
  }
}

// Original daysUntil function (preserved for static sections)
function daysUntil(dateStr) {
  const now = new Date();
  const target = new Date(dateStr);
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `${logger.dim('Past due')}`;
  if (diff === 0) return `${logger.dim('Today')}`;
  if (diff <= 7) return `⚠ ${diff} days`;
  if (diff <= 30) return `→ ${diff} days`;
  if (diff <= 90) return `  ${diff} days`;
  return `  ${diff} days`;
}

function section(title, items) {
  logger.header(title);
  for (const item of items) {
    const [label, date, notes] = item;
    const due = date ? daysUntil(date) : '';
    logger.section(`${due}  ${label}`, notes || '');
  }
}

// Helper to find a computed deadline by id
function getComputed(id) {
  return deadlines.find(d => d.id === id);
}

// Company formation (one-time, no dates yet)
logger.header('Phase 0 — Company Formation (before first invoice)');
logger.tick('Register company with Companies House — £50, ~24hrs');
logger.tick('Open business bank account (Tide/Starling/Monzo — ~30min)');
logger.tick('Register with ICO — £40/yr');
logger.tick('Get Professional Indemnity Insurance — ~£200-400/yr');
logger.tick('Register domains (yourcompany.co.uk, .com)');
logger.tick('Apply for D-U-N-S Number (Apple requires it) — D&B, free, 1-5 days');

// Annual
const now = new Date();
const year = now.getFullYear();
const jan31 = `${year + 1}-01-31`;

// Pull computed deadlines if available
const computedCS = getComputed('confirmation-statement');
const computedICO = getComputed('ico-renewal');
const computedPI = getComputed('pi-insurance');
const computedCTPay = getComputed('corporation-tax-payment');
const computedCTRet = getComputed('corporation-tax-return');

section('Annual — Fixed Dates', [
  ['Self Assessment filing deadline', jan31, 'Online filing for previous tax year'],
  ['Self Assessment payment deadline', jan31, 'Any tax due for previous year'],
  ['Confirmation Statement due', computedCS ? computedCS.date : null, 'Within 14 days of incorporation anniversary'],
  ['ICO Data Protection Fee renewal', computedICO ? computedICO.date : null, 'Annually from registration date'],
  ['Apple Developer Program renewal', null, 'Annually from enrollment date ($99/yr)'],
  ['PI Insurance renewal', computedPI ? computedPI.date : null, computedPI ? `Expires ${computedPI.date}` : 'Check your policy expiry date'],
]);

// Post-year-end (depends on accounting date)
section('Annual — Accounting Period Dependent (set after first year-end)', [
  ['Corporation Tax return due', computedCTRet ? computedCTRet.date : null, '12 months after accounting period end'],
  ['Corporation Tax payment due', computedCTPay ? computedCTPay.date : null, '9 months + 1 day after accounting period end'],
  ['Company accounts filing due', null, '9 months after accounting period end'],
  ['VAT return due', null, '1 month + 7 days after quarter end (if registered)'],
]);

// Quarterly
section('Quarterly — If VAT Registered', [
  ['VAT return filing (Mar-May)', null, 'Due 1 month + 7 days after quarter end'],
  ['VAT return filing (Jun-Aug)', null, 'Due 1 month + 7 days after quarter end'],
  ['VAT return filing (Sep-Nov)', null, 'Due 1 month + 7 days after quarter end'],
  ['VAT return filing (Dec-Feb)', null, 'Due 1 month + 7 days after quarter end'],
]);

// Ongoing
section('Ongoing (check with npm run health)', [
  ['Domain renewals', null, 'Run "npm run domain -- rennet-systems.com" to check'],
  ['Dividend declarations', null, 'Each time you withdraw profit — issue a dividend voucher'],
  ['Director payroll run', null, 'Monthly if paying salary (FreeAgent handles this)'],
  ['Client contract reviews', null, 'Verify each project SOW is signed before work starts'],
]);

logger.rule();
logger.info('Use npm run dividend for dividend vouchers, npm run dashboard for financial overview');
logger.info('The calendar script only reminds you — actual filing is done through the respective portals.');
