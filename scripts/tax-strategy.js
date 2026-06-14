#!/usr/bin/env node
import 'dotenv/config';
import { fullStrategy, flatRateVat, rdcEstimate, TAX_YEAR, THRESHOLDS } from '../src/lib/finances.js';
import * as logger from '../src/lib/logger.js';

const revenue = parseFloat(process.argv[2]) || null;

if (!revenue) {
  logger.header(`${process.env.COMPANY_NAME || 'Your Company'} — Tax Strategy`);
  logger.info('Usage: npm run strategy -- ANNUAL_REVENUE');
  logger.info('Example: npm run strategy -- 60000');
  logger.info('');
  logger.info('No revenue argument? Here is a reference table:');
  logger.rule();

  const scenarios = [30000, 60000, 90000, 120000, 150000];
  for (const rev of scenarios) {
    const s = fullStrategy(rev, 2000);
    const vat = rev >= THRESHOLDS.vatThreshold ? flatRateVat(rev) : null;

    logger.header(`Revenue: £${rev.toLocaleString()}`);
    logger.section('Salary', `£${s.salary.amount.toLocaleString()} (0% income tax, 0% employee NI)`);
    logger.section('Employer NI on salary', `£${Math.round(s.salary.employerNI).toLocaleString()}`);
    logger.section('Pension contribution (recommended)', `£${Math.round(s.withPension.pensionContribution).toLocaleString()}`);
    logger.section('Corp Tax (with pension)', `£${Math.round(s.withPension.corpTax).toLocaleString()}`);
    logger.section('Net take-home', `£${Math.round(s.withPension.netTakeHome).toLocaleString()}`);
    logger.section('Pension growth', `£${Math.round(s.withPension.pensionGrowth).toLocaleString()}`);
    logger.section('Total personal wealth', `£${Math.round(s.withPension.totalWealth).toLocaleString()}`);
    if (vat) {
      logger.section('VAT surplus (flat rate scheme)', `£${Math.round(vat.vatSurplus).toLocaleString()}`);
    }
    logger.rule();
  }
  process.exit(0);
}

logger.header(`Tax Strategy — £${revenue.toLocaleString()}/yr (${TAX_YEAR})`);
logger.rule();

const expenses = 2000;
const strategy = fullStrategy(revenue, expenses);

// Salary
logger.header('Compensation Strategy');
logger.section('Director Salary', `£${strategy.salary.amount.toLocaleString()}/yr`);
logger.section('Employer NI', `£${Math.round(strategy.salary.employerNI).toLocaleString()}`);
logger.section('Total salary cost', `£${Math.round(strategy.salary.totalCost).toLocaleString()}`);
logger.info(strategy.salary.amount === THRESHOLDS.personalAllowance
  ? 'At Personal Allowance limit — no income tax, no employee NI'
  : 'Adjust salary to the Personal Allowance threshold for optimal tax efficiency');

// Scenario comparison
logger.header('Without Pension');
logger.section('Taxable profit', `£${Math.round(strategy.noPension.taxableProfit).toLocaleString()}`);
logger.section('Corporation Tax', `£${Math.round(strategy.noPension.corpTax).toLocaleString()}`);
logger.section('Available as dividend', `£${Math.round(strategy.noPension.availableForDividends).toLocaleString()}`);
logger.section('Dividend tax', `£${Math.round(strategy.noPension.dividendTax).toLocaleString()}`);
logger.section('Net take-home', `£${Math.round(strategy.noPension.netTakeHome).toLocaleString()}`);

logger.header('With Pension (Recommended)');
logger.section('Pension contribution', `£${Math.round(strategy.withPension.pensionContribution).toLocaleString()}`);
logger.section('Taxable profit after pension', `£${Math.round(strategy.withPension.taxableProfit).toLocaleString()}`);
logger.section('Corporation Tax', `£${Math.round(strategy.withPension.corpTax).toLocaleString()}`);
logger.section('Available as dividend', `£${Math.round(strategy.withPension.availableForDividends).toLocaleString()}`);
logger.section('Dividend tax', `£${Math.round(strategy.withPension.dividendTax).toLocaleString()}`);
logger.section('Cash take-home (salary + dividends)', `£${Math.round(strategy.withPension.netTakeHome).toLocaleString()}`);
logger.section('Pension', `£${Math.round(strategy.withPension.pensionGrowth).toLocaleString()}`);
logger.section('Total personal wealth increase', `£${Math.round(strategy.withPension.totalWealth).toLocaleString()}`);

logger.header('Tax Saved by Pension');
logger.section('Corp Tax saved', `£${Math.round(strategy.pensionSaving.corpTaxSaved).toLocaleString()}`);
logger.section('Effective cost per £1 contributed', `£${(strategy.pensionSaving.effectiveCost / strategy.pensionSaving.contribution).toFixed(2)}`);
logger.info(strategy.pensionSaving.note);

// VAT
if (revenue > THRESHOLDS.vatBuffer * 0.8) {
  logger.header('VAT Assessment');
  const shouldRegister = revenue >= THRESHOLDS.vatThreshold;
  const vat = flatRateVat(revenue);

  if (shouldRegister) {
    logger.warn(`Revenue of £${revenue.toLocaleString()} exceeds the £${THRESHOLDS.vatThreshold.toLocaleString()} VAT threshold.`);
    logger.info('You are REQUIRED to register for VAT.');
  } else if (revenue >= THRESHOLDS.vatBuffer) {
    logger.warn(`Revenue approaching £${THRESHOLDS.vatThreshold.toLocaleString()} VAT threshold — consider voluntary registration.`);
  } else {
    logger.tick(`Revenue below £${THRESHOLDS.vatBuffer.toLocaleString()} buffer — no VAT requirement yet.`);
  }

  if (shouldRegister || revenue >= THRESHOLDS.vatBuffer) {
    logger.section('Turnover (excl VAT)', `£${Math.round(vat.annualTurnover).toLocaleString()}`);
    logger.section('VAT collected (20%)', `£${Math.round(vat.vatCollected).toLocaleString()}`);
    logger.section('VAT payable (FRS)', `£${Math.round(vat.vatPayable).toLocaleString()}`);
    logger.section('VAT surplus (kept)', `£${Math.round(vat.vatSurplus).toLocaleString()}`);
    logger.info(vat.note);

    logger.rule();
    logger.info('Flat Rate Scheme benefit for IT consultancy:');
    logger.info('  Charge 20% VAT to clients, pay HMRC at reduced rate, keep the difference.');
    logger.info(`  At £${revenue.toLocaleString()} turnover, that's ~£${Math.round(vat.vatSurplus)}/yr tax-free surplus.`);
  }
}

// R&D
const rnd = 0;
if (rnd > 0) {
  logger.header('R&D Tax Credits');
  const rdc = rdcEstimate(rnd);
  logger.section('Qualifying R&D costs', `£${Math.round(rdc.qualifyingCosts).toLocaleString()}`);
  logger.section('Gross RDEC credit (20%)', `£${Math.round(rdc.grossCredit).toLocaleString()}`);
  logger.section('Net benefit after CT', `£${Math.round(rdc.netCredit).toLocaleString()}`);
  logger.info(rdc.note);
}

// Notes
logger.header('Notes');
logger.info(strategy.notes.pension);
logger.info(strategy.notes.dividend);
logger.info(strategy.notes.employmentAllowance);

logger.rule();
logger.ok('Run this command again after each project to keep your tax plan current.');
logger.info('Recommended: open a SIPP before making company pension contributions.');
