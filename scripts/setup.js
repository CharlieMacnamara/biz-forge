#!/usr/bin/env node
import 'dotenv/config';
import * as logger from '../src/lib/logger.js';

const companyName = process.env.COMPANY_NAME || '[Your Company Name]';

logger.header(`Company Formation Wizard — ${companyName}`);

const sep = `  ${logger.dim('────────────────────────────────────────────────────')}`;

console.log(sep);
console.log(`  This walkthrough guides you through registering ${companyName}.`);
console.log(`  Follow each step in order. Items marked [MANUAL] require action outside this CLI.`);
console.log(sep);

logger.header('Step 1: Choose Your Company Name');
logger.info('Name must not be identical to an existing company on Companies House.');
logger.info('Run "npm run screen -- \'Your Company Name\'" to check availability.');
logger.info('Avoid sensitive words (e.g., "Royal", "Bank", "Trust") without approval.');
console.log(sep);

logger.header('Step 2: Select SIC Codes');
logger.table([
  ['Code', 'Description', 'Recommended'],
  ['62012', 'Business & domestic software dev', '✓ Primary'],
  ['62090', 'Other IT service activities', '✓ Secondary'],
  ['58290', 'Other software publishing', '✓ For Skillio'],
  ['63110', 'Data processing, hosting etc', ''],
  ['70229', 'Management consultancy', ''],
]);
console.log(sep);

logger.header('Step 3: Registered Office Address');
logger.info('Must be a physical UK address. PO Boxes not accepted.');
logger.info('If working from home, consider a virtual address service (~£10-30/mo):');
logger.table([
  ['Service', 'Cost'],
  ['UK Postbox', '~£10/mo'],
  ['Registered Office Address', '~£30/yr'],
  ['Your home address (free)', 'Appears on public register'],
]);
console.log(sep);

logger.header('Step 4: Directors & PSCs');
logger.info('You will be the sole Director and sole Person with Significant Control (PSC).');
logger.info('Required: name, nationality, date of birth, residential address, service address.');
console.log(sep);

logger.header('Step 5: Shares');
logger.info('Issue 100 ordinary shares at £1 each. You hold 100% as sole shareholder.');
logger.info('This gives you full control and simplifies dividend declarations.');
console.log(sep);

logger.header('Step 6: Memorandum & Articles of Association');
logger.info('Use the standard Model Articles (default when registering online).');
logger.info('No need to customise unless you have specific requirements.');
console.log(sep);

logger.header('Step 7: Register with Companies House');
logger.ok('Go to https://find-and-update.company-information.service.gov.uk/');
logger.ok('Click "Register a company" — you need a GOV.UK One Login account.');
logger.ok('Registration costs £50 online. Approval typically takes 24 hours.');
console.log(sep);

logger.header('Step 8: After Registration — Immediate Actions');

logger.section('1. Corporation Tax', 'Register automatically via HMRC (linked to CH registration)');
logger.section('2. Business bank account', 'Tide/Starling/Monzo — 15 min online, no monthly fee');
logger.section('3. ICO registration', 'ico.org.uk — £40/yr, mandatory for any business collecting personal data');
logger.section('4. PAYE registration', 'Employers: register for PAYE to pay your director salary');
logger.section('5. Self Assessment', 'Register as a director — you must file a personal tax return');
logger.section('6. D-U-N-S Number', 'dnb.com — free, takes 1-5 days, needed for Apple Developer org enrollment');
console.log(sep);

logger.header('Step 9: Domain Names');
  logger.info('Register your domains immediately after company approval:');
  logger.info('  yourcompany.co.uk');
  logger.info('  yourcompany.com');
logger.info('Use Namecheap, Cloudflare Registrar, or similar.');
logger.info('Set up business email (Google Workspace or Fastmail) on your domain.');
console.log(sep);

logger.header('Step 10: Insurance');
logger.info('Get Professional Indemnity Insurance before taking on clients.');
logger.info('Estimates: ~£200-400/yr for a solo developer. Try Hiscox or Simply Business.');
console.log(sep);

logger.header('Summary — What to Do Now');

logger.tick(`Run "npm run screen -- '${process.env.COMPANY_NAME || 'Your Company Name'}'" to check name availability`);
logger.tick('Open companieshouse.gov.uk and register');
logger.tick('After approval, open a business bank account');
logger.tick('Register with ICO (£40)');
logger.tick('Register domains');
logger.tick('Get PI insurance');
logger.tick('Run "npm run contract" to build your first SOW template');
logger.tick('Run "npm run strategy" to plan your tax approach');
logger.tick('Run "npm run app-store" to check Skillio readiness');

console.log(`\n  ${logger.dim('See TODO.md for the full checklist.')}`);
