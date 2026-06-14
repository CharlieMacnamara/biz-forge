#!/usr/bin/env node
import 'dotenv/config';
import { saveDividendRecord, calculateDividendTax } from '../src/lib/dividend.js';
import * as logger from '../src/lib/logger.js';

const dividendAmount = parseFloat(process.argv[2]);

if (!dividendAmount || isNaN(dividendAmount) || dividendAmount <= 0) {
  logger.error('Usage: npm run dividend -- AMOUNT');
  logger.info('Example: npm run dividend -- 5000');
  process.exit(1);
}

const companyName = process.env.COMPANY_NAME || 'Your Company';
const date = new Date().toISOString().split('T')[0];

const directorName = process.env.COMPANY_DIRECTOR_NAME || 'Director';
const companyAddress = process.env.COMPANY_ADDRESS || process.env.COMPANY_REGISTERED_ADDRESS || '';

const vars = {
  company_name: companyName,
  company_number: process.env.COMPANY_NUMBER || '',
  date,
  director_name: directorName,
  shareholder_name: directorName,
  shareholder_address: companyAddress,
  share_class: 'Ordinary',
  dividend_amount: dividendAmount,
  dividend_per_share: dividendAmount,
  shares_held: 1,
};

logger.header(`Dividend Voucher Generator — ${companyName}`);
logger.rule();

try {
  const outputDir = 'docs/legal_templates';
  const { voucherPath, minutesPath } = saveDividendRecord(vars, outputDir);

  logger.tick(`Dividend voucher saved: ${voucherPath}`);
  logger.tick(`Board minutes saved: ${minutesPath}`);
  logger.rule();

  const otherIncome = parseFloat(process.env.DIRECTOR_SALARY) || 12570;
  const tax = calculateDividendTax(dividendAmount, otherIncome);

  logger.header('Dividend Tax Estimate');
  logger.section('Dividend income', `£${tax.dividendIncome.toLocaleString()}`);
  logger.section('Other income (salary)', `£${tax.otherIncome.toLocaleString()}`);
  logger.section('Estimated dividend tax', `£${tax.taxAmount} (${tax.taxRate})`);

  const higherRateThreshold = 50270;
  if (tax.totalIncome > higherRateThreshold) {
    logger.warn(
      `Total income £${tax.totalIncome.toLocaleString()} exceeds higher rate threshold ` +
      `(£${higherRateThreshold.toLocaleString()}). Dividend tax may be higher ` +
      `than estimated if salary is higher.`
    );
  }

  logger.rule();
  logger.info('This is an estimate based on 2026/27 rates. Consult a qualified accountant before filing.');

  logger.ok('Dividend documents generated successfully');
  process.exit(0);
} catch (err) {
  logger.fail(`Failed to generate dividend documents: ${err.message}`);
  process.exit(1);
}
