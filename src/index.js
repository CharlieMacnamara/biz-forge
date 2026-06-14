#!/usr/bin/env node
/**
 * bizforge — modular business operations CLI
 *
 * One CLI to replace: lawyers, accountants, formation agents, compliance providers.
 * Powered by free UK government APIs + LLM.
 */

import 'dotenv/config';
import * as logger from './lib/logger.js';

const commands = {
  setup:     { desc: 'Company formation walkthrough',            script: '../scripts/setup.js' },
  screen:    { desc: 'Brand name risk report',                    script: '../scripts/screen-brand.js' },
  verify:    { desc: 'Client company due diligence',              script: '../scripts/verify-company.js' },
  domain:    { desc: 'Domain availability/expiry check',          script: '../scripts/check-domain.js' },
  contract:  { desc: 'Build legally protective SOW',              script: '../scripts/generate-contract.js' },
  policy:    { desc: 'Generate privacy/terms/cookie docs',        script: '../scripts/generate-policy.js' },
  strategy:  { desc: 'Full tax optimisation calculator',          script: '../scripts/tax-strategy.js' },
  audit:     { desc: 'GDPR/PECR compliance scan',                 script: '../scripts/audit-privacy.js' },
  'app-store':     { desc: 'App Store submission readiness',       script: '../scripts/app-store-readiness.js' },
  calendar:  { desc: 'Legal/tax deadline tracker',                script: '../scripts/calendar.js' },
  dashboard: { desc: 'Financial dashboard (salary, CT, VAT, dividends, deadlines)', script: '../scripts/dashboard.js' },
  dividend:  { desc: 'Generate HMRC-compliant dividend voucher',   script: '../scripts/dividend.js' },
  readiness: { desc: 'Business readiness scored checklist',        script: '../scripts/readiness.js' },
  health:    { desc: 'API keys + domain expiry validation',        script: '../scripts/health-check.js' },
  'verify-setup': { desc: 'Bakes integration test of all systems',  script: '../scripts/verify-setup.js' },
  ask:       { desc: 'AI business advisor (LLM)',                 script: '../scripts/ask.js' },
  enhance:   { desc: 'AI legal document review (LLM)',            script: '../scripts/enhance.js' },
  'test-generate': { desc: 'AI test case generation (LLM)',         script: '../scripts/test-generate.js' },
};

const companyName = process.env.COMPANY_NAME || 'bizforge';
const cmd = process.argv[2];
const args = process.argv.slice(3);

if (!cmd || cmd === 'help') {
  logger.header(`${companyName} — bizforge CLI`);
  logger.info('Replaces £5k/yr in professional services with free APIs + LLM.');
  logger.info('Usage: npm run <command> [args]');
  logger.rule();

  const rows = [['Command', 'npm run', 'Purpose']];
  for (const [name, info] of Object.entries(commands)) {
    rows.push([name, `npm run ${name}`, info.desc]);
  }
  logger.table(rows);

  logger.rule();
  logger.info('Business ops:');
  logger.info('  npm run screen -- "Brand Name"        # Check brand + domains');
  logger.info('  npm run verify -- 12345678            # Due diligence on a client company');
  logger.info('  npm run strategy -- 60000             # Tax plan at £60k revenue');
  logger.info('  npm run policy -- privacy             # Generate UK GDPR privacy policy');
  logger.info('  npm run audit -- https://yoursite.com # GDPR compliance check');
  logger.info('');
  logger.info('Finance & readiness:');
  logger.info('  npm run dashboard -- 60000         # Financial overview (CT, VAT, dividends, deadlines)');
  logger.info('  npm run dividend -- 5000            # Generate dividend voucher + board minutes');
  logger.info('  npm run readiness                   # Business readiness scored checklist');
  logger.info('  npm run calendar                    # Deadline tracker with 🔴🟡🟢 urgency');
  logger.info('  npm run strategy -- compare 80k 120k# Compare two revenue scenarios');
  logger.info('');
  logger.info('LLM-powered:');
  logger.info('  npm run ask -- "Is flat rate VAT worth it at £80k?"');
  logger.info('  npm run enhance -- contract           # Review SOW with AI');
  logger.info('  npm run test:generate -- finances     # Generate edge-case tests');
  process.exit(0);
}

const command = commands[cmd];
if (!command) {
  logger.error(`Unknown command: ${cmd}`);
  logger.info(`Run "npm start help" for available commands.`);
  process.exit(1);
}

try {
  const mod = await import(command.script);
  if (typeof mod.default === 'function') {
    await mod.default(args);
  }
} catch (err) {
  logger.error(`Command failed: ${err.message}`);
  process.exit(1);
}
