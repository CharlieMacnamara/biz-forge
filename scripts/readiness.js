#!/usr/bin/env node
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import * as logger from '../src/lib/logger.js';
import {
  runReadinessCheck,
  checkEnv,
  checkTemplates,
  checkApiKeys,
  checkInsurance,
  checkCompany,
} from '../src/lib/readiness.js';

// ── Collect inputs ──────────────────────────────────────────────────────────

const templatesDir = path.join(process.cwd(), 'templates');
let templateFiles = [];
try {
  templateFiles = fs.readdirSync(templatesDir).filter(f => f.endsWith('.md'));
} catch {
  templateFiles = [];
}

const env = process.env;
const insuranceExpiry = env.PI_INSURANCE_EXPIRY;

// ── Run checks ──────────────────────────────────────────────────────────────

const report = runReadinessCheck({ env, templates: templateFiles, insuranceExpiry });

// ── Display ─────────────────────────────────────────────────────────────────

logger.header('Business Readiness Report');
logger.rule();

// 1. Environment
logger.header('1. Environment');
const envResults = checkEnv(env);
for (const r of envResults) {
  const label = r.check;
  if (r.pass) {
    logger.tick(`${label} — ${r.detail}`);
  } else if (r.severity === 'critical') {
    logger.cross(`${label} — ${r.detail}`);
  } else {
    logger.warn(`${label} — ${r.detail}`);
  }
}

// 2. Templates
logger.header('2. Templates');
const templateResults = checkTemplates(templateFiles);
for (const r of templateResults) {
  if (r.pass) {
    logger.tick(`${r.check}`);
  } else {
    logger.cross(`${r.check} — ${r.detail}`);
  }
}

// 3. API Keys
logger.header('3. API Keys');
const keyResults = checkApiKeys(env);
for (const r of keyResults) {
  if (r.pass) {
    logger.tick(`${r.check} — ${r.detail}`);
  } else {
    logger.cross(`${r.check} — ${r.detail}`);
  }
}

// 4. Insurance
logger.header('4. Insurance');
const insuranceResults = checkInsurance(insuranceExpiry);
for (const r of insuranceResults) {
  if (r.pass) {
    logger.tick(`${r.detail}`);
  } else {
    logger.cross(`${r.detail}`);
  }
}

// 5. Company Details
logger.header('5. Company Details');
const companyResults = checkCompany(env);
for (const r of companyResults) {
  const label = r.check;
  if (r.pass) {
    logger.tick(`${label} — ${r.detail}`);
  } else {
    logger.cross(`${label} — ${r.detail}`);
  }
}

// ── Summary ─────────────────────────────────────────────────────────────────

logger.rule();

const { score, verdict, summary } = report;

// Score bar: █ for filled, ░ for empty
const barLen = 10;
const filled = Math.round((score / 100) * barLen);
const empty = barLen - filled;
const bar = '█'.repeat(filled) + '░'.repeat(empty);

console.log(`\n  Score: ${bar} ${score}%`);
console.log(`  Passed: ${summary.passed}/${summary.total}  ` +
  (summary.failed > 0 ? `Failed: ${summary.failed}  ` : '') +
  (summary.critical > 0 ? `Critical: ${summary.critical}  ` : '') +
  (summary.warnings > 0 ? `Warnings: ${summary.warnings}` : ''));

if (verdict === 'GREEN') {
  logger.ok(`Verdict: ${verdict} — All systems ready`);
  process.exit(0);
} else if (verdict === 'AMBER') {
  logger.warn(`Verdict: ${verdict} — Some items need attention`);
  process.exit(0);
} else {
  logger.fail(`Verdict: ${verdict} — Critical issues must be resolved`);
  process.exit(1);
}
