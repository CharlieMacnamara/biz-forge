#!/usr/bin/env node
import 'dotenv/config';
import { ask } from '../src/lib/llm.js';
import * as logger from '../src/lib/logger.js';
import fs from 'fs';

const question = process.argv.slice(2).join(' ');

if (!question) {
  logger.header(`${process.env.COMPANY_NAME || 'bizforge'} — AI Advisor`);
  logger.info('Ask any UK business, tax, legal, or technical question.');
  logger.rule();
  logger.info('Examples:');
  logger.info('  npm run ask -- "Is flat rate VAT worth it at £80k revenue?"');
  logger.info('  npm run ask -- "What SIC code should I use for software development?"');
  logger.info('  npm run ask -- "Do I need to register with ICO as a solo developer?"');
  logger.info('  npm run ask -- "What expenses can I claim as a limited company director?"');
  logger.info('  npm run ask -- "Explain the dividend allowance rules for 2026/27"');
  process.exit(0);
}

logger.header(`AI Advisor: ${question}`);

// Load optional business context from env
const context = [
  process.env.COMPANY_NAME ? `Company: ${process.env.COMPANY_NAME}` : null,
  process.env.COMPANY_NUMBER ? `Company number: ${process.env.COMPANY_NUMBER}` : null,
  process.env.COMPANY_SIC_CODE ? `SIC code: ${process.env.COMPANY_SIC_CODE}` : null,
].filter(Boolean).join('\n');

try {
  logger.info('Consulting LLM...');
  const answer = await ask(question, context);
  logger.rule();
  console.log(`\n${answer}\n`);
  logger.rule();
} catch (err) {
  logger.fail(`Advisor error: ${err.message}`);
  process.exit(1);
}
