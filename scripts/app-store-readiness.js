#!/usr/bin/env node
import 'dotenv/config';
import { checkDuns, checkPrivacyLabels, checkScreenshotReadiness, formatReadinessReport, formatPrivacyLabelQuestionnaire } from '../src/lib/app-store.js';
import * as logger from '../src/lib/logger.js';

const companyName = process.env.COMPANY_NAME || '[Company Name]';
logger.header('App Store Readiness Check — Skillio');
logger.info(`Checking prerequisites for publishing Skillio under ${companyName}`);
logger.rule();

// DUNS check
const companyNumber = process.env.COMPANY_NUMBER || null;
const duns = await checkDuns(companyNumber);

logger.header('1. D-U-N-S Number');
logger.section('Status', duns.status);
logger.info(duns.note);
if (duns.action) logger.section('Action', duns.action);

if (duns.status === 'company_found') {
  logger.tick('Company found. Next: get DUNS from Dun & Bradstreet.');
}

// Privacy labels
logger.header('2. Privacy Nutrition Labels');
const declared = {
  'Name': true,
  'Email Address': true,
  'User ID': true,
  'Device ID': true,
  'Product Interaction': true,
  'Crash Data': true,
  'Performance Data': true,
  'Purchase History': false,
};
const privacyLabels = checkPrivacyLabels(declared);

for (const m of privacyLabels.missing) {
  logger.cross(`Not declared: ${m}`);
}
if (privacyLabels.missing.length === 0) {
  logger.tick('All common data types covered.');
} else {
  logger.warn(`${privacyLabels.missing.length} data type(s) need declaration in App Store Connect`);
}

// Screenshots
logger.header('3. Screenshots');
const provided = {};
const screenshots = checkScreenshotReadiness(provided);
for (const s of screenshots.missing) {
  logger.cross(`Missing: ${s}`);
}
if (screenshots.missing.length === 0) {
  logger.tick('All screenshot sizes ready');
} else {
  logger.info('Required sizes: 6.7" (1290x2796), 6.5" (1242x2688), 5.5" (1242x2208)');
}

// Export compliance
logger.header('4. Export Compliance');
logger.info('Answer in App Store Connect:');
logger.info('  Does your app use encryption? → Yes (uses TLS/HTTPS)');
logger.info('  Is it exempt from reporting? → Yes (standard encryption for data in transit)');

// Commission
logger.header('5. App Store Commission');
logger.info('Standard: 30% of all sales');
logger.info('Small Business Program: 15% if revenue < $1M/year');
logger.info('Apply at: https://developer.apple.com/app-store/small-business-program/');

logger.rule();
logger.info('Publishing as an organization:');
  logger.info(`  Seller name on App Store → "${companyName}"`);
logger.info('  $99/year membership');
logger.info('  Requires: DUNS number + Companies House registration + company website + work email');

// Full questionnaire reference
logger.header('Privacy Labels — Data Type Checklist');
logger.info(formatPrivacyLabelQuestionnaire());
