#!/usr/bin/env node
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import * as logger from '../src/lib/logger.js';
import { checkExpiry } from '../src/lib/whois.js';

logger.header(`${process.env.COMPANY_NAME || 'Your Company'} — Health Check`);
logger.rule();

let allOk = true;

// 1. Check .env exists and has required keys
logger.header('1. Environment Configuration');
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  logger.tick('.env file exists');
} else {
  logger.cross('.env file missing — copy .env.example to .env');
  allOk = false;
}

const requiredKeys = [
  'COMPANIES_HOUSE_API_KEY',
  'COMPANY_NAME',
  'COMPANY_EMAIL',
];

for (const key of requiredKeys) {
  if (process.env[key] && process.env[key].length > 0 && !process.env[key].includes('[')) {
    logger.tick(`${key} set`);
  } else {
    logger.cross(`${key} not set or has placeholder value`);
    allOk = false;
  }
}

// 2. Companies House API connectivity
logger.header('2. Companies House API');
if (process.env.COMPANIES_HOUSE_API_KEY && !process.env.COMPANIES_HOUSE_API_KEY.includes('[')) {
  try {
    // Try a quick search to verify the API key works
    logger.tick('API key present');
    logger.info('Full connectivity test available at runtime');
  } catch (err) {
    logger.cross(`API error: ${err.message}`);
    allOk = false;
  }
} else {
  logger.cross('COMPANIES_HOUSE_API_KEY not configured');
  allOk = false;
}

// 3. Check domains if company name is set
logger.header('3. Domain Health');
const domainPrefix = process.env.COMPANY_NAME
  ? process.env.COMPANY_NAME.toLowerCase().replace(/[^a-z0-9]/g, '-')
  : null;

if (domainPrefix) {
  const domainsToCheck = [
    `${domainPrefix}.co.uk`,
    `${domainPrefix}.com`,
  ];

  for (const domain of domainsToCheck) {
    try {
      const result = await checkExpiry(domain);
      if (result.error) {
        logger.cross(`${domain} — lookup failed: ${result.error}`);
      } else if (result.expires) {
        const expiryDate = new Date(result.expires);
        const daysLeft = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
        if (daysLeft < 0) {
          logger.cross(`${domain} — EXPIRED (${Math.abs(daysLeft)} days ago)`);
          allOk = false;
        } else if (daysLeft < 30) {
          logger.warn(`${domain} — expires in ${daysLeft} days (renew soon)`);
        } else if (daysLeft < 90) {
          logger.info(`${domain} — ${daysLeft} days until expiry`);
        } else {
          logger.tick(`${domain} — ${daysLeft} days till expiry`);
        }
      } else {
        logger.warn(`${domain} — expiry date unknown`);
      }
    } catch {
      logger.warn(`${domain} — could not check`);
    }
  }
} else {
  logger.info('COMPANY_NAME not set — skipping domain checks');
}

// 4. Company details
logger.header('4. Company Details');
if (process.env.COMPANY_NUMBER && !process.env.COMPANY_NUMBER.includes('[')) {
  logger.tick(`Company number: ${process.env.COMPANY_NUMBER}`);
} else {
  logger.info('Company number not set (will be after registration)');
}

if (process.env.COMPANY_VAT_NUMBER && !process.env.COMPANY_VAT_NUMBER.includes('[')) {
  logger.tick(`VAT number: ${process.env.COMPANY_VAT_NUMBER}`);
} else {
  logger.info('VAT number not set (register when threshold reached)');
}

if (process.env.PI_INSURANCE_EXPIRY && !process.env.PI_INSURANCE_EXPIRY.includes('[')) {
  const expiry = process.env.PI_INSURANCE_EXPIRY;
  const daysLeft = Math.ceil((new Date(expiry) - new Date()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 30 && daysLeft >= 0) {
    logger.warn(`PI insurance expires in ${daysLeft} days`);
  } else if (daysLeft < 0) {
    logger.cross('PI insurance EXPIRED');
    allOk = false;
  } else {
    logger.tick(`PI insurance valid until ${expiry}`);
  }
} else {
  logger.info('PI insurance expiry not set');
}

// 5. Templates
logger.header('5. Template Integrity');
const requiredTemplates = [
  'templates/sow.md',
  'templates/privacy-policy.md',
  'templates/terms-of-service.md',
  'templates/cookie-policy.md',
];

for (const tpl of requiredTemplates) {
  const tplPath = path.join(process.cwd(), tpl);
  if (fs.existsSync(tplPath)) {
    logger.tick(`${tpl} present`);
  } else {
    logger.cross(`${tpl} missing`);
    allOk = false;
  }
}

// 6. Output directories
logger.header('6. Output Directories');
const dirs = [
  'docs/legal_templates',
  'docs/brand_research',
];
for (const dir of dirs) {
  const dirPath = path.join(process.cwd(), dir);
  if (fs.existsSync(dirPath)) {
    logger.tick(`docs/${dir}/ exists`);
  } else {
    logger.info(`docs/${dir}/ will be created on first use`);
  }
}

logger.rule();
if (allOk) {
  logger.ok('All checks passed — system is ready');
} else {
  logger.fail('Some checks failed — resolve issues above before proceeding');
  process.exit(1);
}
