#!/usr/bin/env node
import 'dotenv/config';
import { screenBrand, formatScreenReport } from '../src/lib/brand-screen.js';
import * as logger from '../src/lib/logger.js';

const brandName = process.argv[2];
if (!brandName) {
  logger.error('Usage: npm run screen -- "Brand Name"');
  process.exit(1);
}

logger.header(`Brand Screen: ${brandName}`);
logger.info('Checking Companies House and domain registrations...');

const results = await screenBrand(brandName);

// Company conflicts
logger.header('Companies House');
if (Array.isArray(results.companies)) {
  if (results.companies.length === 0) {
    logger.tick('No matching companies found — name appears clear');
  } else {
    logger.warn(`${results.companies.length} matching company/companies found:`);
    for (const c of results.companies.slice(0, 10)) {
      const icon = c.status === 'Active' ? '⚡' : '○';
      const color = c.status === 'Active' ? logger.dim : logger.dim;
      logger.section(`  ${icon}`, `${c.name} (${c.companyNumber}) — ${c.status}`);
    }
    if (results.companies.length > 10) {
      logger.info(`... and ${results.companies.length - 10} more`);
    }
  }
}

// Domain availability
logger.header('Domain Availability');
let anyAvailable = false;
for (const [domain, info] of Object.entries(results.domains)) {
  if (info.error) {
    logger.error(`${domain} — lookup failed: ${info.error}`);
  } else if (info.available) {
    logger.tick(`${domain} — AVAILABLE`);
    anyAvailable = true;
  } else {
    const expires = info.expires ? ` (expires ${info.expires})` : '';
    logger.cross(`${domain} — TAKEN${expires}`);
    if (info.registrar) logger.section('  Registrar', info.registrar);
  }
}

logger.rule();
if (anyAvailable) {
  const available = Object.entries(results.domains).filter(([, i]) => i.available).map(([d]) => d);
  logger.ok(`Available domains: ${available.join(', ')}`);
} else {
  logger.warn('No desirable domains available — consider alternative TLDs or name variations.');
}

if (results.companies.length > 0) {
  logger.warn(`Consider an alternative name — ${results.companies.length} Companies House conflict(s) found.`);
}
