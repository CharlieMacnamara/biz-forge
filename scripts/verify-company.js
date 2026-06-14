#!/usr/bin/env node
import 'dotenv/config';
import { getCompany, getOfficers, getFilingHistory } from '../src/lib/companies-house.js';
import * as logger from '../src/lib/logger.js';

const companyNumber = process.argv[2];
if (!companyNumber) {
  logger.error('Usage: npm run verify -- COMPANY_NUMBER');
  process.exit(1);
}

logger.header(`Company Verification: ${companyNumber}`);

try {
  const company = await getCompany(companyNumber);

  const statusIcons = {
    'Active': '✓',
    'Dissolved': '✗',
    'In Liquidation': '⚠',
    'In Administration': '⚠',
    'In Receivership': '⚠',
    'Converted/Closed': '○',
  };

  const icon = statusIcons[company.company_status] || '?';

  logger.header('Company Profile');
  logger.section('Name', company.company_name);
  logger.section('Status', `${icon} ${company.company_status}`);
  logger.section('Incorporated', company.date_of_creation);
  logger.section('Type', company.type);
  logger.section('SIC Codes', (company.sic_codes || []).join(', ') || 'None listed');
  logger.section('Address', company.registered_office_address
    ? `${company.registered_office_address.address_line_1 || ''}, ${company.registered_office_address.locality || ''}, ${company.registered_office_address.postal_code || ''}`
    : 'Not available');
  logger.section('Accounts Due', company.confirmation_statement?.next_due || 'Not available');

  // Officers
  const officers = await getOfficers(companyNumber);
  logger.header('Officers');
  if (officers.length === 0) {
    logger.info('No officers listed');
  } else {
    for (const o of officers) {
      const resigned = o.resigned_on ? ` (resigned ${o.resigned_on})` : '';
      logger.section(o.name, `${o.officer_role}${resigned}`);
    }
  }

  // Filing history (last 3)
  const filings = await getFilingHistory(companyNumber);
  logger.header('Recent Filings');
  const recent = filings.slice(0, 3);
  if (recent.length === 0) {
    logger.info('No filing history available');
  } else {
    for (const f of recent) {
      logger.section(f.date, f.description || f.type);
    }
  }

  logger.rule();
  if (company.company_status !== 'active') {
    logger.fail(`Client risk: Company is ${company.company_status} — do not proceed without caution`);
  } else {
    logger.ok('Company is active — appears to be a legitimate trading entity');
  }

} catch (err) {
  logger.fail(`Verification failed: ${err.message}`);
  process.exit(1);
}
