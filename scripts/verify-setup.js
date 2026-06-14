#!/usr/bin/env node
/**
 * verify-setup.js — Integration smoke test for bizforge CLI system.
 *
 * This script runs basic checks using test data to verify that every
 * core module and script is wired up correctly. Run this after:
 *   1. npm install
 *   2. Setting up .env with a real COMPANIES_HOUSE_API_KEY
 *
 * Tests that don't require network:
 *   - Logger output
 *   - Template loading + variable substitution
 *   - Finance calculations (tax, pension, dividend)
 *   - App Store readiness (mock mode)
 *
 * Tests that require network + API key:
 *   - Companies House search (uses a well-known test company)
 *   - Domain WHOIS lookup
 *   - Live URL audit
 *
 * Usage: npm run verify-setup
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import * as logger from '../src/lib/logger.js';
import { corpTax, optimalSalary, dividendTax, flatRateVat, pensionSaving, rdcEstimate, fullStrategy, employerNI } from '../src/lib/finances.js';
import { loadTemplate, fillTemplate, generateContract, generatePolicy } from '../src/lib/legal.js';
import { checkDuns, checkPrivacyLabels, checkScreenshotReadiness } from '../src/lib/app-store.js';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const BOLD = '\x1b[1m';
const NC = '\x1b[0m';

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  process.stdout.write(`  ${name} ... `);
  try {
    fn();
    console.log(`${GREEN}PASS${NC}`);
    passed++;
  } catch (err) {
    console.log(`${RED}FAIL${NC}`);
    console.log(`    ${RED}${err.message}${NC}`);
    failed++;
    failures.push({ name, error: err.message });
  }
}

async function testAsync(name, fn) {
  process.stdout.write(`  ${name} ... `);
  try {
    await fn();
    console.log(`${GREEN}PASS${NC}`);
    passed++;
  } catch (err) {
    console.log(`${RED}FAIL${NC}`);
    console.log(`    ${RED}${err.message}${NC}`);
    failed++;
    failures.push({ name, error: err.message });
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg);
}

// ── Start Tests ──────────────────────────────────────────────────────────

logger.header(`${process.env.COMPANY_NAME || 'Your Company'} — Verification Suite`);
logger.info('Testing core modules, scripts, and integration points.\n');

// ======== 1. Logger ========
logger.header('1. Logger');
test('logger writes tick', () => {
  const orig = console.log;
  let output = '';
  console.log = (s) => { output += s; };
  logger.tick('test');
  console.log = orig;
  assert(output.includes('✓'), 'Tick should show checkmark');
});

test('logger fail sets exit code', () => {
  const origExitCode = process.exitCode;
  process.exitCode = 0;
  logger.fail('deliberate');
  assert(process.exitCode === 1, 'fail() should set exitCode to 1');
  process.exitCode = origExitCode;
});

test('logger dim wraps in ANSI dim codes', () => {
  const d = logger.dim('dimmed');
  assert(d.includes('\x1b[2m'), 'Should start dim ANSI');
  assert(d.includes('\x1b[0m'), 'Should reset ANSI');
  assert(d.includes('dimmed'), 'Should include text');
});

// ======== 2. Finances ========
logger.header('2. Finance Calculations');

test('corpTax — profit under £50k', () => {
  const tax = corpTax(30000);
  assert(Math.abs(tax - 5700) < 0.01, `Expected 5700, got ${tax}`);
});

test('corpTax — profit over £250k', () => {
  const tax = corpTax(300000);
  assert(Math.abs(tax - 75000) < 0.01, `Expected 75000, got ${tax}`);
});

test('corpTax — profit in marginal band', () => {
  const tax = corpTax(100000);
  assert(tax > 19000 && tax < 25000, `Tax ${tax} should be between 19k and 25k`);
});

test('optimalSalary — returns correct amount', () => {
  const s = optimalSalary();
  assert(s.salary === 12570, `Expected salary 12570, got ${s.salary}`);
  assert(s.employeeNI === 0, 'Employee NI should be 0 at personal allowance');
});

test('dividendTax — under allowance', () => {
  const tax = dividendTax(400, 20000);
  assert(tax === 0, `Expected 0 dividend tax, got ${tax}`);
});

test('dividendTax — over allowance at basic rate', () => {
  const tax = dividendTax(10500, 12570);
  assert(tax > 0, 'Dividend tax should be positive above allowance');
});

test('dividendTax — higher rate bracket', () => {
  const tax = dividendTax(100000, 12570);
  assert(tax > dividendTax(10500, 12570), 'Higher dividends should incur more tax');
});

test('flatRateVat — calculates correctly', () => {
  // At £60k turnover, flat rate should show a surplus
  const vat = flatRateVat(60000);
  assert(vat.vatSurplus > 0, 'Flat rate VAT should produce a surplus');
  assert(vat.vatCollected > vat.vatPayable, 'Collected VAT > payable FRS');
});

test('pensionSaving — CT saved on contribution', () => {
  const p = pensionSaving(10000);
  assert(p.corpTaxSaved > 0, 'Pension contribution should save Corp Tax');
  assert(p.effectiveCost < 10000, 'Effective cost should be less than contribution');
});

test('rdcEstimate — R&D credit calculation', () => {
  const rdc = rdcEstimate(10000);
  assert(rdc.grossCredit === 2000, `Expected 2000 RDEC, got ${rdc.grossCredit}`);
  assert(rdc.netCredit > 0, 'Net credit should be positive');
});

test('fullStrategy — produces complete plan', () => {
  const s = fullStrategy(60000, 2000);
  assert(s.salary.amount === 12570, 'Salary should be optimal');
  assert(s.withPension.pensionContribution > 0, 'Pension contribution should exist');
  assert(s.withPension.totalWealth > s.noPension.netTakeHome, 'Pension should increase total wealth');
});

test('fullStrategy — zero revenue produces zero pension', () => {
  const s = fullStrategy(0, 0);
  assert(s.withPension.pensionContribution === 0, 'No pension with no profit');
});

test('fullStrategy — caps pension at annual allowance', () => {
  const s = fullStrategy(500000, 2000);
  assert(s.withPension.pensionContribution <= 60000, 'Pension should be capped at £60k');
});

test('fullStrategy — includes R&D section when rndCosts provided', () => {
  const s = fullStrategy(60000, 2000, 10000);
  assert(s.rdc !== null, 'R&D section should exist');
  assert(s.rdc.qualifyingCosts === 10000, 'R&D qualifying costs should match');
});

test('dividendTax — zero with no other income and within PA', () => {
  assert(dividendTax(10000, 0) === 0, 'Dividends within PA should be 0 tax');
  assert(dividendTax(500, 0) === 0, 'Dividend allowance should make £500 tax-free');
});

test('dividendTax — higher rate bracket calculation', () => {
  const tax = dividendTax(50000, 12570);
  assert(tax > dividendTax(10500, 12570), 'Higher dividends should incur more tax');
  assert(tax > 8000, 'Expected ~£8,271 in dividend tax at higher rate');
});

test('corpTax — marginal rate between 50k and 250k', () => {
  const at50k = corpTax(50000);
  const at100k = corpTax(100000);
  const at250k = corpTax(250000);
  assert(at50k === 9500, '£50k profit: 19% = £9,500');
  assert(at250k === 62500, '£250k profit: 25% = £62,500');
  assert(at100k > 19000 && at100k < 25000, '£100k profit: blended rate between 19-25%');
});

test('employerNI — zero below threshold', () => {
  assert(employerNI(5000) === 0, 'Salary at £5k threshold should have 0 NI');
  assert(employerNI(0) === 0, 'Zero salary should have 0 NI');
});

test('employerNI — 15% above threshold', () => {
  const ni = employerNI(10000);
  assert(ni > 0, 'NI should be positive above threshold');
});

test('pensionSaving — CT deductible', () => {
  const p = pensionSaving(10000);
  assert(p.corpTaxSaved === 1900, 'CT saved should be 19% of contribution');
  assert(p.effectiveCost === 8100, 'Effective cost should be contribution minus CT saved');
});

test('rdcEstimate — calculates 20% credit', () => {
  const rdc = rdcEstimate(50000);
  assert(rdc.grossCredit === 10000, 'RDEC at 20% = £10,000 on £50k');
  assert(rdc.netCredit > 0, 'Net credit should be positive');
});

test('flatRateVat — generates surplus', () => {
  const vat = flatRateVat(60000);
  assert(vat.vatSurplus > 0, 'FRS should produce surplus at £60k');
  assert(vat.vatCollected > vat.vatPayable, 'Collected VAT > payable');
});

// ======== 3. Templates ========
logger.header('3. Template System');

test('loadTemplate — sow.md loads', () => {
  const t = loadTemplate('sow.md');
  assert(t.includes('{{company_name}}'), 'SOW template should have company_name variable');
});

test('loadTemplate — privacy-policy.md loads', () => {
  const t = loadTemplate('privacy-policy.md');
  assert(t.includes('{{date}}'), 'Privacy template should have date variable');
});

test('fillTemplate — variable substitution works', () => {
  const result = fillTemplate('Hello {{name}}', { name: 'Rennet' });
  assert(result === 'Hello Rennet', `Expected "Hello Rennet", got "${result}"`);
});

test('fillTemplate — handles whitespace around variable name', () => {
  const result = fillTemplate('Hello {{  name  }}', { name: 'World' });
  assert(result === 'Hello World', `Expected "Hello World", got "${result}"`);
});

test('fillTemplate — handles special regex chars in values', () => {
  const result = fillTemplate('Cost: {{amount}}', { amount: '$100 (20% tax)' });
  assert(result === 'Cost: $100 (20% tax)', 'Should preserve special regex chars');
});

test('fillTemplate — leaves missing vars intact', () => {
  const result = fillTemplate('{{a}} and {{b}}', { a: 'x' });
  assert(result === 'x and {{b}}', 'Unprovided vars should stay as {{b}}');
});

test('generateContract — produces filled SOW', () => {
  const defaultName = process.env.COMPANY_NAME || 'Test Company Ltd';
  const vars = {
    company_name: defaultName,
    company_number: '12345678',
    company_address: 'London',
    company_email: 'hello@test.com',
    company_director: 'Director',
    date: '2026-01-01',
    client_name: 'Test Client',
    client_company: 'Test Ltd',
    start_date: '2026-01-15',
    end_date: '2026-02-15',
    deliverables: 'Build a website',
    total_cost: '3000',
    payment_terms: '50% upfront',
    late_payment_interest: '8% + BoE',
    governing_law: 'England',
  };
  const doc = generateContract(vars);
  assert(doc.includes(defaultName), 'SOW should include company name');
  assert(doc.includes('Test Client'), 'SOW should include client name');
  assert(doc.includes('Late Payment'), 'SOW should include late payment clause');
});

test('generatePolicy — privacy policy generated', () => {
  const defaultName = process.env.COMPANY_NAME || 'Test Company Ltd';
  const vars = {
    company_name: defaultName,
    company_number: '12345678',
    company_address: 'London',
    company_email: 'hello@rennet.com',
    company_website: 'https://rennet-systems.com',
    company_director: 'Charlie',
    date: '2026-01-01',
    data_types: 'Name, Email',
    cookie_policy_url: 'https://rennet-systems.com/cookies',
    ico_registration_number: 'C123456',
  };
  const doc = generatePolicy('privacy', vars);
  assert(doc.includes(defaultName), 'Policy should include company name');
  assert(doc.includes('UK GDPR'), 'Policy should reference UK GDPR');
});

// ======== 4. App Store ========
logger.header('4. App Store Module');

test('checkPrivacyLabels — reports missing types', () => {
  const result = checkPrivacyLabels({});
  assert(result.missing.length > 0, 'Should report missing data types for empty declaration');
  assert(result.declared === 0, 'Should have 0 declared');
});

test('checkPrivacyLabels — reports all covered', () => {
  const declared = {
    'Name': true,
    'Email Address': true,
    'User ID': true,
    'Device ID': true,
    'Product Interaction': true,
    'Crash Data': true,
    'Performance Data': true,
    'Purchase History': true,
    'Fitness': false,
  };
  const result = checkPrivacyLabels(declared);
  assert(result.missing.length === 0, 'Should have no missing types');
  assert(result.declared === 8, `Expected 8 declared, got ${result.declared}`);
});

test('checkScreenshotReadiness — reports missing sizes', () => {
  const result = checkScreenshotReadiness({});
  assert(result.missing.length === 3, 'Should report 3 missing screenshot sizes');
});

test('checkScreenshotReadiness — reports all ready', () => {
  const result = checkScreenshotReadiness({
    'iPhone 6.7"': true,
    'iPhone 6.5"': true,
    'iPhone 5.5"': true,
  });
  assert(result.missing.length === 0, 'Should have no missing sizes');
});

await testAsync('checkDuns — returns expected shape without company number', async () => {
  const result = await checkDuns(null);
  assert(result.status === 'unknown', `Expected 'unknown', got '${result.status}'`);
});

test('checkPrivacyLabels — detects missing data types', () => {
  const r = checkPrivacyLabels({});
  assert(r.missing.length > 0, 'Empty declaration should have missing types');
  assert(r.declared === 0, 'Should have 0 declared');
  assert(r.totalCommon === 8, 'Should check 8 common data types');
});

test('checkPrivacyLabels — all declared passes', () => {
  const r = checkPrivacyLabels({
    'Name': true, 'Email Address': true, 'User ID': true,
    'Device ID': true, 'Product Interaction': true,
    'Crash Data': true, 'Performance Data': true, 'Purchase History': true,
  });
  assert(r.missing.length === 0, 'All common types declared');
  assert(r.declared === 8, 'Should have 8 declared');
});

test('checkScreenshotReadiness — detects 3 missing at empty', () => {
  const r = checkScreenshotReadiness({});
  assert(r.missing.length === 3, 'Should report 3 missing sizes');
});

test('checkScreenshotReadiness — all ready', () => {
  const r = checkScreenshotReadiness({
    'iPhone 6.7"': true, 'iPhone 6.5"': true, 'iPhone 5.5"': true,
  });
  assert(r.missing.length === 0, 'All sizes ready');
});

// ======== 5. Network-dependent (skipped if no API key) ========
if (process.env.COMPANIES_HOUSE_API_KEY && !process.env.COMPANIES_HOUSE_API_KEY.includes('[')) {
  logger.header('5. Network Tests (Companies House)');

  await testAsync('Companies House — search by name', async () => {
    const { searchCompany } = await import('../src/lib/companies-house.js');
    const results = await searchCompany('BBC');
    assert(Array.isArray(results), 'Should return an array');
    assert(results.length > 0, 'Should find at least one result');
  });

  await testAsync('Companies House — get company profile', async () => {
    const { getCompany } = await import('../src/lib/companies-house.js');
    const company = await getCompany('00002065');
    assert(company.company_name, 'Should return company name');
    assert(company.company_status, 'Should return company status');
  });
} else {
  logger.header('5. Network Tests');
  logger.info('  Skipping network tests — set COMPANIES_HOUSE_API_KEY in .env');
}

// ======== 6. WHOIS tests ========
logger.header('6. WHOIS Module');
await testAsync('whois — check domain exists', async () => {
  const { checkExpiry } = await import('../src/lib/whois.js');
  const result = await checkExpiry('google.com');
  assert(result.domain === 'google.com', 'Should return the queried domain');
});

await testAsync('whois — check domains multi-TLD', async () => {
  const { checkDomains } = await import('../src/lib/whois.js');
  const results = await checkDomains('example-test-000', ['.com']);
  const entry = Object.values(results)[0];
  assert(entry !== undefined, 'Should have at least one result');
});

// ======== 7. Script integrity ========
logger.header('7. Script Integrity');

const scripts = [
  'setup.js', 'screen-brand.js', 'verify-company.js', 'check-domain.js',
  'generate-contract.js', 'generate-policy.js', 'tax-strategy.js',
  'audit-privacy.js', 'app-store-readiness.js', 'calendar.js',
  'health-check.js', 'verify-setup.js',
];

for (const script of scripts) {
  test(`Script exists: ${script}`, () => {
    const scriptPath = path.join(process.cwd(), 'scripts', script);
    assert(fs.existsSync(scriptPath), `${script} not found`);
    const content = fs.readFileSync(scriptPath, 'utf8');
    assert(content.includes('#!/usr/bin/env node'), 'Should have shebang');
  });
}

// ======== 8. Lib module imports ========
logger.header('8. Lib Module Imports');

const libs = [
  'logger.js', 'companies-house.js', 'whois.js', 'brand-screen.js',
  'legal.js', 'finances.js', 'compliance.js', 'app-store.js',
];

for (const lib of libs) {
  test(`Lib exists: ${lib}`, () => {
    const libPath = path.join(process.cwd(), 'src', 'lib', lib);
    assert(fs.existsSync(libPath), `${lib} not found`);
  });
}

// ======== 9. Template integrity ========
logger.header('9. Template Integrity');

const reqTemplates = ['sow.md', 'privacy-policy.md', 'terms-of-service.md', 'cookie-policy.md'];
for (const tpl of reqTemplates) {
  test(`Template exists: ${tpl}`, () => {
    const tplPath = path.join(process.cwd(), 'templates', tpl);
    assert(fs.existsSync(tplPath), `${tpl} not found`);
    const content = fs.readFileSync(tplPath, 'utf8');
    assert(content.includes('{{'), 'Should contain template variables');
  });
}

// ======== 10. Business docs exist ========
logger.header('10. Documentation');

const docFiles = ['TODO.md', 'AGENTS.md', 'docs/README.md', '.env.example'];
for (const doc of docFiles) {
  test(`Doc exists: ${doc}`, () => {
    const docPath = path.join(process.cwd(), doc);
    assert(fs.existsSync(docPath), `${doc} not found`);
  });
}

// ======== Results ========
logger.rule();
console.log(`\n  ${BOLD}Results:${NC}`);
console.log(`  ${GREEN}${passed} passed${NC}`);
if (failed > 0) {
  console.log(`  ${RED}${failed} failed${NC}`);
  console.log('');
  for (const f of failures) {
    console.log(`  ${RED}✗${NC} ${f.name}: ${f.error}`);
  }
  logger.fail(`${failed} test(s) failed — resolve before proceeding`);
  process.exit(1);
} else {
  logger.ok('All systems operational. Ready to launch.');
}
