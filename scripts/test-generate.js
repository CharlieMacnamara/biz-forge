#!/usr/bin/env node
import 'dotenv/config';
import { generateTestCases } from '../src/lib/llm.js';
import * as logger from '../src/lib/logger.js';
import fs from 'fs';
import path from 'path';

const moduleArg = process.argv[2];

if (!moduleArg) {
  logger.header(`${process.env.COMPANY_NAME || 'bizforge'} — Test Case Generator`);
  logger.info('Uses LLM to analyse source code and generate edge-case test scenarios.');
  logger.rule();
  logger.info('Usage: npm run test:generate -- <module-name>');
  logger.info('Modules:');
  const libDir = path.join(process.cwd(), 'src', 'lib');
  const modules = fs.readdirSync(libDir).filter(f => f.endsWith('.js')).map(f => f.replace('.js', ''));
  for (const m of modules) {
    logger.info(`  ${m}`);
  }
  process.exit(0);
}

const modulePath = path.join(process.cwd(), 'src', 'lib', `${moduleArg}.js`);
if (!fs.existsSync(modulePath)) {
  logger.fail(`Module not found: src/lib/${moduleArg}.js`);
  process.exit(1);
}

const sourceCode = fs.readFileSync(modulePath, 'utf8');

logger.header(`Generating test cases for ${moduleArg}.js`);
logger.info(`Source: ${sourceCode.split('\n').length} lines`);
logger.rule();

try {
  const testCases = await generateTestCases(sourceCode, moduleArg);
  logger.rule();
  logger.header('Generated Test Scenarios');
  console.log(`\n${testCases}\n`);
  logger.rule();
  logger.info(`Add these as test blocks to test/unit/${moduleArg}.test.js`);
} catch (err) {
  logger.fail(`Test generation failed: ${err.message}`);
  process.exit(1);
}
