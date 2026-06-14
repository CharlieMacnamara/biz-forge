#!/usr/bin/env node
import 'dotenv/config';
import { enhanceDocument } from '../src/lib/llm.js';
import { generateContract, generatePolicy, loadTemplate, POLICY_TYPES } from '../src/lib/legal.js';
import * as logger from '../src/lib/logger.js';

const docType = process.argv[2];
const validTypes = ['contract', 'privacy', 'terms', 'cookies'];

if (!docType || !validTypes.includes(docType)) {
  logger.header(`${process.env.COMPANY_NAME || 'bizforge'} — Document Enhancer`);
  logger.info('Uses LLM to review and improve generated legal documents.');
  logger.rule();
  logger.info('Usage: npm run enhance -- <doc-type>');
  logger.info('Types: contract, privacy, terms, cookies');
  logger.info('Examples:');
  logger.info('  npm run enhance -- contract  # Review SOW for completeness');
  logger.info('  npm run enhance -- privacy   # Review privacy policy');
  process.exit(0);
}

logger.header(`Enhancing ${docType} document...`);

const vars = {
  company_name: process.env.COMPANY_NAME || '[Your Company Name]',
  company_number: process.env.COMPANY_NUMBER || '',
  company_address: process.env.COMPANY_ADDRESS || '',
  company_email: process.env.COMPANY_EMAIL || '',
  company_website: process.env.COMPANY_WEBSITE || '',
  company_director: process.env.COMPANY_DIRECTOR_NAME || '',
  date: new Date().toISOString().split('T')[0],
};

try {
  let document;
  let typeLabel;

  if (docType === 'contract') {
    document = generateContract({
      ...vars,
      client_name: '[Client Name]',
      client_company: '[Client Company]',
      start_date: '[Start Date]',
      end_date: '[End Date]',
      deliverables: '[Project Deliverables]',
      total_cost: '[Total Cost]',
      payment_terms: '[Payment Terms]',
      late_payment_interest: '8% above Bank of England base rate',
      governing_law: 'England and Wales',
    });
    typeLabel = 'Statement of Work';
  } else {
    const typeKey = docType === 'privacy' ? 'privacy' : docType === 'terms' ? 'terms' : 'cookies';
    document = generatePolicy(typeKey, {
      ...vars,
      data_types: 'Name, email, IP address, usage data, payment info',
      cookie_policy_url: `${vars.company_website}/cookie-policy`,
      ico_registration_number: process.env.ICO_REGISTRATION_NUMBER || '',
      service_description: 'Web development and software consultancy services',
      liability_limit: 'Total fees paid',
      governing_law: 'England and Wales',
      cookie_types: 'Strictly necessary, Analytics, Functional, Marketing',
      analytics_providers: 'Cloudflare Web Analytics',
      consent_mechanism: 'Cookie consent banner with accept/reject/customise',
    });
    typeLabel = docType.charAt(0).toUpperCase() + docType.slice(1) + ' Policy';
  }

  logger.info('Sending to LLM for review...');
  const improvements = await enhanceDocument(document, vars, typeLabel);
  logger.rule();
  logger.header('Improvement Suggestions');
  console.log(`\n${improvements}\n`);
  logger.rule();

  logger.info('Apply these suggestions manually to your template or add them to AGENTS.md.');
} catch (err) {
  logger.fail(`Enhancement failed: ${err.message}`);
  process.exit(1);
}
