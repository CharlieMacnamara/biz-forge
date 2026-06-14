#!/usr/bin/env node
import 'dotenv/config';
import { checkDomains, checkDomain, checkExpiry, DEFAULT_TLDS } from '../src/lib/whois.js';
import * as logger from '../src/lib/logger.js';

const input = process.argv[2];
if (!input) {
  logger.error('Usage: npm run domain -- example.com');
  logger.info('  Check a specific domain, or use a name + optional TLD:');
  logger.info('  npm run domain -- "my-name"');
  logger.info('  npm run domain -- "my-name .com .co.uk"');
  process.exit(1);
}

const parts = input.split(' ');
const name = parts[0];
const tlds = parts.slice(1).length > 0 ? parts.slice(1) : DEFAULT_TLDS;

// Check if it's a full domain or just a name
if (name.includes('.')) {
  logger.header(`WHOIS: ${name}`);
  const result = await checkExpiry(name);
  if (result.error) {
    logger.error(result.error);
  } else {
    logger.section('Domain', result.domain);
    logger.section('Expires', result.expires || 'Unknown');
    logger.section('Registrar', result.registrar || 'Unknown');
    if (result.nameservers) {
      logger.section('Nameservers', Array.isArray(result.nameservers) ? result.nameservers.join(', ') : result.nameservers);
    }
    logger.section('DNSSEC', result.dnssec || 'Not enabled');
    if (result.expires) {
      const expiryDate = new Date(result.expires);
      const daysLeft = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
      if (daysLeft < 30) {
        logger.warn(`⚠ Expires in ${daysLeft} days — renew soon`);
      } else {
        logger.tick(`${daysLeft} days until expiry`);
      }
    }
  }
} else {
  logger.header(`Domain Check: ${name}`);
  logger.info(`Checking TLDs: ${tlds.join(', ')}`);
  logger.rule();

  const results = await checkDomains(name, tlds);
  let available = [];
  let taken = [];

  for (const [domain, info] of Object.entries(results)) {
    if (info.error) {
      logger.error(`${domain} — lookup error: ${info.error}`);
    } else if (info.available) {
      logger.tick(`${domain} — AVAILABLE`);
      available.push(domain);
    } else {
      const expires = info.expires ? ` (expires ${info.expires})` : '';
      logger.cross(`${domain} — UNAVAILABLE${expires}`);
      taken.push(domain);
    }
  }

  logger.rule();
  if (available.length > 0) {
    logger.ok(`Available: ${available.join(', ')}`);
  }
  if (taken.length > 0 && available.length === 0) {
    logger.warn('All checked TLDs are taken. Try alternative names or TLDs.');
  }
}
