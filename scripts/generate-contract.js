#!/usr/bin/env node
import 'dotenv/config';
import { createInterface } from 'readline/promises';
import { generateContract, saveDocument } from '../src/lib/legal.js';
import * as logger from '../src/lib/logger.js';

const rl = createInterface({ input: process.stdin, output: process.stdout });

logger.header('Contract Generator — Statement of Work');
logger.info('Press Enter to accept defaults shown in [brackets].');
logger.rule();

const companyName = process.env.COMPANY_NAME || '[Your Company Name]';
const companyNumber = process.env.COMPANY_NUMBER || '';
const companyAddress = process.env.COMPANY_ADDRESS || process.env.COMPANY_REGISTERED_ADDRESS || '';
const companyEmail = process.env.COMPANY_EMAIL || '';
const companyDirector = process.env.COMPANY_DIRECTOR_NAME || '[Director Name]';

const defaultCost = '5000';
const defaultPaymentTerms = '50% upfront, 25% on milestone, 25% on completion';

const vars = {
  company_name: companyName,
  company_number: companyNumber,
  company_address: companyAddress,
  company_email: companyEmail,
  company_director: companyDirector,
  date: new Date().toISOString().split('T')[0],
  client_name: await rl.question('  Client name: '),
  client_company: await rl.question('  Client company: '),
  start_date: await rl.question('  Start date (YYYY-MM-DD): '),
  end_date: await rl.question('  End date (YYYY-MM-DD): '),
  deliverables: await rl.question('  Deliverables (one per line, finish with Enter): ') || 'As agreed in project specification',
  total_cost: await rl.question(`  Total project cost (£) [${defaultCost}]: `) || defaultCost,
  payment_terms: await rl.question(`  Payment terms [${defaultPaymentTerms}]: `) || defaultPaymentTerms,
  governing_law: 'England and Wales',
  late_payment_interest: '8% above Bank of England base rate',
};

rl.close();

logger.rule();
const content = generateContract(vars);

const filename = `SOW-${vars.client_name.replace(/[^a-zA-Z0-9]/g, '-')}-${vars.date}.md`;
const outputDir = 'docs/legal_templates';
const filePath = saveDocument(content, outputDir, filename);

logger.ok(`SOW generated: ${filePath}`);
logger.info('Review and customize before sending to the client.');
logger.info('Key clauses in this template:');
logger.tick('Intellectual Property — vests in client only upon full payment');
logger.tick('Late Payment — statutory interest at 8% + BoE rate + debt recovery costs');
logger.tick('Scope Change — any extra work requires a written Variation Order');
logger.tick('Limitation of Liability — capped at total fees paid');
logger.tick('Termination — 30 days notice, payment for work done');
