#!/usr/bin/env node
import 'dotenv/config';
import { auditUrl, formatAuditReport } from '../src/lib/compliance.js';
import * as logger from '../src/lib/logger.js';

const url = process.argv[2];
if (!url) {
  logger.error('Usage: npm run audit -- https://example.com');
  logger.info('Scans a live URL for GDPR/PECR compliance gaps.');
  logger.info('Run this before launching any client site.');
  process.exit(1);
}

logger.header(`Privacy Compliance Scan: ${url}`);
logger.info('Checking GDPR and PECR compliance markers...');

const results = await auditUrl(url);

if (results.error) {
  logger.error(`Could not scan site: ${results.error}`);
  process.exit(1);
}

logger.rule();

for (const check of Object.values(results.checks)) {
  if (check.pass) {
    logger.tick(check.label);
  } else {
    logger.cross(check.label);
    logger.section('  Issue', check.detail);
  }
}

logger.rule();
const passed = Object.values(results.checks).filter(c => c.pass).length;
const total = Object.values(results.checks).length;
logger.section('Result', `${passed}/${total} checks passed`);

if (passed === total) {
  logger.ok('Site appears GDPR/PECR compliant');
} else {
  logger.warn('Address failing checks before site goes live');
}

logger.rule();
logger.info('This is a basic automated scan. For full compliance,');
logger.info('also review: actual cookie behavior (check with browser tools),');
logger.info('data collection forms, third-party scripts, and your privacy policy text.');
