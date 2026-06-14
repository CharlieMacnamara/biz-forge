#!/usr/bin/env node
import 'dotenv/config';
import { fullStrategy, flatRateVat, rdcEstimate, TAX_YEAR, THRESHOLDS } from '../src/lib/finances.js';
import * as logger from '../src/lib/logger.js';

// --- Compare mode: side-by-side scenario comparison ---
if (process.argv[2] === 'compare') {
  const revA = parseFloat(process.argv[3]);
  const revB = parseFloat(process.argv[4]);

  if (!revA || !revB) {
    logger.error('Compare mode requires two revenue values: npm run strategy -- compare 80000 120000');
    process.exit(1);
  }

  const expenses = 2000;
  const strategyA = fullStrategy(revA, expenses);
  const strategyB = fullStrategy(revB, expenses);
  const vatA = revA >= THRESHOLDS.vatThreshold ? flatRateVat(revA) : null;
  const vatB = revB >= THRESHOLDS.vatThreshold ? flatRateVat(revB) : null;

  const fmt = (n) => `\u00A3${Math.round(n).toLocaleString()}`;
  const delta = (a, b) => {
    const diff = b - a;
    if (diff > 0) return `+\u00A3${Math.round(diff).toLocaleString()}`;
    if (diff < 0) return `-\u00A3${Math.abs(Math.round(diff)).toLocaleString()}`;
    return '\u00A30';
  };

  const headerA = `Scenario A (\u00A3${revA.toLocaleString()})`;
  const headerB = `Scenario B (\u00A3${revB.toLocaleString()})`;
  const headerD = 'Difference (\u00A3\u00B1\u0394)';

  const rows = [
    ['Metric', headerA, headerB, headerD],
    ['Revenue', fmt(revA), fmt(revB), delta(revA, revB)],
    ['Salary amount', fmt(strategyA.salary.amount), fmt(strategyB.salary.amount), delta(strategyA.salary.amount, strategyB.salary.amount)],
    ['Employer NI', fmt(strategyA.salary.employerNI), fmt(strategyB.salary.employerNI), delta(strategyA.salary.employerNI, strategyB.salary.employerNI)],
    ['Corp Tax (without pension)', fmt(strategyA.noPension.corpTax), fmt(strategyB.noPension.corpTax), delta(strategyA.noPension.corpTax, strategyB.noPension.corpTax)],
    ['Corp Tax (with pension)', fmt(strategyA.withPension.corpTax), fmt(strategyB.withPension.corpTax), delta(strategyA.withPension.corpTax, strategyB.withPension.corpTax)],
    ['Net take-home (with pension)', fmt(strategyA.withPension.netTakeHome), fmt(strategyB.withPension.netTakeHome), delta(strategyA.withPension.netTakeHome, strategyB.withPension.netTakeHome)],
    ['Pension contribution', fmt(strategyA.withPension.pensionContribution), fmt(strategyB.withPension.pensionContribution), delta(strategyA.withPension.pensionContribution, strategyB.withPension.pensionContribution)],
    ['Total personal wealth', fmt(strategyA.withPension.totalWealth), fmt(strategyB.withPension.totalWealth), delta(strategyA.withPension.totalWealth, strategyB.withPension.totalWealth)],
  ];

  // Add VAT row if either scenario is above the threshold
  if (vatA || vatB) {
    const surplusA = vatA ? vatA.vatSurplus : 0;
    const surplusB = vatB ? vatB.vatSurplus : 0;
    rows.push(['VAT surplus (flat rate)', fmt(surplusA), fmt(surplusB), delta(surplusA, surplusB)]);
  }

  logger.header(`${process.env.COMPANY_NAME || 'Your Company'} \u2014 Tax Strategy Comparison`);
  logger.table(rows);
  logger.rule();
  logger.info('All figures based on salary = \u00A312,570 (Personal Allowance) and expenses = \u00A32,000.');
  logger.info('Pension contributions use the full Annual Allowance (\u00A360,000) where possible.');
  process.exit(0);
}

const revenue = parseFloat(process.argv[2]) || null;

if (!revenue) {
  logger.header(`${process.env.COMPANY_NAME || 'Your Company'} \u2014 Tax Strategy`);
  logger.info('Usage: npm run strategy -- ANNUAL_REVENUE');
  logger.info('Example: npm run strategy -- 60000');
  logger.info('');
  logger.info('No revenue argument? Here is a reference table:');
  logger.rule();

  const scenarios = [30000, 60000, 90000, 120000, 150000];
  for (const rev of scenarios) {
    const s = fullStrategy(rev, 2000);
    const vat = rev >= THRESHOLDS.vatThreshold ? flatRateVat(rev) : null;

    logger.header(`Revenue: \u00A3${rev.toLocaleString()}`);
    logger.section('Salary', `\u00A3${s.salary.amount.toLocaleString()} (0% income tax, 0% employee NI)`);
    logger.section('Employer NI on salary', `\u00A3${Math.round(s.salary.employerNI).toLocaleString()}`);
    logger.section('Pension contribution (recommended)', `\u00A3${Math.round(s.withPension.pensionContribution).toLocaleString()}`);
    logger.section('Corp Tax (with pension)', `\u00A3${Math.round(s.withPension.corpTax).toLocaleString()}`);
    logger.section('Net take-home', `\u00A3${Math.round(s.withPension.netTakeHome).toLocaleString()}`);
    logger.section('Pension growth', `\u00A3${Math.round(s.withPension.pensionGrowth).toLocaleString()}`);
    logger.section('Total personal wealth', `\u00A3${Math.round(s.withPension.totalWealth).toLocaleString()}`);
    if (vat) {
      logger.section('VAT surplus (flat rate scheme)', `\u00A3${Math.round(vat.vatSurplus).toLocaleString()}`);
    }
    logger.rule();
  }
  process.exit(0);
}

logger.header(`Tax Strategy \u2014 \u00A3${revenue.toLocaleString()}/yr (${TAX_YEAR})`);
logger.rule();

const expenses = 2000;
const strategy = fullStrategy(revenue, expenses);

// Salary
logger.header('Compensation Strategy');
logger.section('Director Salary', `\u00A3${strategy.salary.amount.toLocaleString()}/yr`);
logger.section('Employer NI', `\u00A3${Math.round(strategy.salary.employerNI).toLocaleString()}`);
logger.section('Total salary cost', `\u00A3${Math.round(strategy.salary.totalCost).toLocaleString()}`);
logger.info(strategy.salary.amount === THRESHOLDS.personalAllowance
  ? 'At Personal Allowance limit \u2014 no income tax, no employee NI'
  : 'Adjust salary to the Personal Allowance threshold for optimal tax efficiency');

// Scenario comparison
logger.header('Without Pension');
logger.section('Taxable profit', `\u00A3${Math.round(strategy.noPension.taxableProfit).toLocaleString()}`);
logger.section('Corporation Tax', `\u00A3${Math.round(strategy.noPension.corpTax).toLocaleString()}`);
logger.section('Available as dividend', `\u00A3${Math.round(strategy.noPension.availableForDividends).toLocaleString()}`);
logger.section('Dividend tax', `\u00A3${Math.round(strategy.noPension.dividendTax).toLocaleString()}`);
logger.section('Net take-home', `\u00A3${Math.round(strategy.noPension.netTakeHome).toLocaleString()}`);

logger.header('With Pension (Recommended)');
logger.section('Pension contribution', `\u00A3${Math.round(strategy.withPension.pensionContribution).toLocaleString()}`);
logger.section('Taxable profit after pension', `\u00A3${Math.round(strategy.withPension.taxableProfit).toLocaleString()}`);
logger.section('Corporation Tax', `\u00A3${Math.round(strategy.withPension.corpTax).toLocaleString()}`);
logger.section('Available as dividend', `\u00A3${Math.round(strategy.withPension.availableForDividends).toLocaleString()}`);
logger.section('Dividend tax', `\u00A3${Math.round(strategy.withPension.dividendTax).toLocaleString()}`);
logger.section('Cash take-home (salary + dividends)', `\u00A3${Math.round(strategy.withPension.netTakeHome).toLocaleString()}`);
logger.section('Pension', `\u00A3${Math.round(strategy.withPension.pensionGrowth).toLocaleString()}`);
logger.section('Total personal wealth increase', `\u00A3${Math.round(strategy.withPension.totalWealth).toLocaleString()}`);

logger.header('Tax Saved by Pension');
logger.section('Corp Tax saved', `\u00A3${Math.round(strategy.pensionSaving.corpTaxSaved).toLocaleString()}`);
logger.section('Effective cost per \u00A31 contributed', `\u00A3${(strategy.pensionSaving.effectiveCost / strategy.pensionSaving.contribution).toFixed(2)}`);
logger.info(strategy.pensionSaving.note);

// VAT
if (revenue > THRESHOLDS.vatBuffer * 0.8) {
  logger.header('VAT Assessment');
  const shouldRegister = revenue >= THRESHOLDS.vatThreshold;
  const vat = flatRateVat(revenue);

  if (shouldRegister) {
    logger.warn(`Revenue of \u00A3${revenue.toLocaleString()} exceeds the \u00A3${THRESHOLDS.vatThreshold.toLocaleString()} VAT threshold.`);
    logger.info('You are REQUIRED to register for VAT.');
  } else if (revenue >= THRESHOLDS.vatBuffer) {
    logger.warn(`Revenue approaching \u00A3${THRESHOLDS.vatThreshold.toLocaleString()} VAT threshold \u2014 consider voluntary registration.`);
  } else {
    logger.tick(`Revenue below \u00A3${THRESHOLDS.vatBuffer.toLocaleString()} buffer \u2014 no VAT requirement yet.`);
  }

  if (shouldRegister || revenue >= THRESHOLDS.vatBuffer) {
    logger.section('Turnover (excl VAT)', `\u00A3${Math.round(vat.annualTurnover).toLocaleString()}`);
    logger.section('VAT collected (20%)', `\u00A3${Math.round(vat.vatCollected).toLocaleString()}`);
    logger.section('VAT payable (FRS)', `\u00A3${Math.round(vat.vatPayable).toLocaleString()}`);
    logger.section('VAT surplus (kept)', `\u00A3${Math.round(vat.vatSurplus).toLocaleString()}`);
    logger.info(vat.note);

    logger.rule();
    logger.info('Flat Rate Scheme benefit for IT consultancy:');
    logger.info('  Charge 20% VAT to clients, pay HMRC at reduced rate, keep the difference.');
    logger.info(`  At \u00A3${revenue.toLocaleString()} turnover, that's ~\u00A3${Math.round(vat.vatSurplus)}/yr tax-free surplus.`);
  }
}

// R&D
const rnd = 0;
if (rnd > 0) {
  logger.header('R&D Tax Credits');
  const rdc = rdcEstimate(rnd);
  logger.section('Qualifying R&D costs', `\u00A3${Math.round(rdc.qualifyingCosts).toLocaleString()}`);
  logger.section('Gross RDEC credit (20%)', `\u00A3${Math.round(rdc.grossCredit).toLocaleString()}`);
  logger.section('Net benefit after CT', `\u00A3${Math.round(rdc.netCredit).toLocaleString()}`);
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
