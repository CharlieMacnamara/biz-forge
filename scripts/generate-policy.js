#!/usr/bin/env node
import 'dotenv/config';
import { generatePolicy, saveDocument, variableHelp } from '../src/lib/legal.js';
import * as logger from '../src/lib/logger.js';

const validTypes = ['privacy', 'terms', 'cookies'];
const type = process.argv[2];

if (!type || !validTypes.includes(type)) {
  logger.error(`Usage: npm run policy -- <type>`);
  logger.info(`Types: ${validTypes.join(', ')}`);
  logger.info(`Examples:`);
  logger.info(`  npm run policy -- privacy    # Privacy Policy (UK GDPR)`);
  logger.info(`  npm run policy -- terms      # Terms of Service`);
  logger.info(`  npm run policy -- cookies    # Cookie Policy (PECR)`);
  process.exit(1);
}

logger.header(`Generating ${type} policy...`);

const vars = {
  company_name: process.env.COMPANY_NAME || '[Your Company Name]',
  company_number: process.env.COMPANY_NUMBER || '[Company Number]',
  company_address: process.env.COMPANY_ADDRESS || process.env.COMPANY_REGISTERED_ADDRESS || '[Registered Address]',
  company_email: process.env.COMPANY_EMAIL || '[hello@example.com]',
  company_website: process.env.COMPANY_WEBSITE || '[https://example.com]',
  company_director: process.env.COMPANY_DIRECTOR_NAME || '[Director Name]',
  date: new Date().toISOString().split('T')[0],
};

// Add type-specific defaults
if (type === 'privacy') {
  vars.data_types = 'Name, email address, IP address, browser info, usage data, payment info';
  vars.cookie_policy_url = `${process.env.COMPANY_WEBSITE || '[website]'}/cookie-policy`;
  vars.ico_registration_number = process.env.ICO_REGISTRATION_NUMBER || '[ICO Registration Number]';
} else if (type === 'terms') {
  vars.service_description = `${process.env.COMPANY_NAME || '[Company Name]'} provides website design, development, and software consultancy services to business clients.`;
  vars.liability_limit = 'Total fees paid';
  vars.governing_law = 'England and Wales';
} else if (type === 'cookies') {
  vars.cookie_types = 'Strictly necessary, Analytics, Functional, Marketing';
  vars.analytics_providers = 'Cloudflare Web Analytics';
  vars.consent_mechanism = 'Cookie consent banner with accept/reject/customise options';
}

try {
  const content = generatePolicy(type, vars);

  const filenames = {
    privacy: `Privacy-Policy-${vars.date}.md`,
    terms: `Terms-of-Service-${vars.date}.md`,
    cookies: `Cookie-Policy-${vars.date}.md`,
  };

  const filename = filenames[type];
  const outputDir = 'docs/legal_templates';
  const filePath = saveDocument(content, outputDir, filename);

  logger.ok(`Generated: ${filePath}`);
  logger.rule();

  const summary = {
    privacy: `UK GDPR-compliant policy covering: collected data types, lawful bases, retention, data subject rights, cookie disclosure, ICO complaints.`,
    terms: `Service terms covering: fees, payment, late payment interest, IP, liability cap, termination, governing law.`,
    cookies: `PECR-compliant policy covering: cookie types, consent mechanism, browser controls, third-party disclosure.`,
  };
  logger.info(summary[type]);

  if (vars.ico_registration_number && vars.ico_registration_number.includes('[')) {
    logger.warn('ICO Registration Number not set in .env — update before publishing.');
  }
  logger.info('Review and verify all placeholder text before deploying live.');

} catch (err) {
  logger.fail(`Failed to generate policy: ${err.message}`);
  process.exit(1);
}
