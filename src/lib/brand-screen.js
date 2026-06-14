import { searchCompany, formatCompanySummary } from './companies-house.js';
import { checkDomains, DEFAULT_TLDS } from './whois.js';

async function screenBrand(name) {
  const results = {
    brand: name,
    scanned: new Date().toISOString(),
    companies: [],
    domains: {},
  };

  try {
    const companies = await searchCompany(name);
    results.companies = companies.map(formatCompanySummary);
  } catch (err) {
    results.companies = { error: err.message };
  }

  try {
    results.domains = await checkDomains(name.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase(), DEFAULT_TLDS);
  } catch (err) {
    results.domains = { error: err.message };
  }

  return results;
}

function formatScreenReport(results) {
  const lines = [];
  const name = results.brand;
  const sep = '─'.repeat(50);

  lines.push(`\n  Brand Screen Report: ${name}`);
  lines.push(`  ${sep}`);

  // Company conflicts
  lines.push(`\n  Companies House — "${name}"`);
  if (Array.isArray(results.companies)) {
    if (results.companies.length === 0) {
      lines.push('  ✓ No matching companies found — name appears clear');
    } else {
      lines.push(`  ⚠ ${results.companies.length} matching company/companies found:`);
      for (const c of results.companies.slice(0, 10)) {
        const statusIcon = c.status === 'Active' ? '⚡' : '○';
        lines.push(`    ${statusIcon} ${c.name} (${c.companyNumber}) — ${c.status}`);
      }
      if (results.companies.length > 10) {
        lines.push(`    ... and ${results.companies.length - 10} more`);
      }
    }
  } else if (results.companies.error) {
    lines.push(`  ✘ API Error: ${results.companies.error}`);
  }

  // Domain availability
  lines.push(`\n  Domain Availability`);
  for (const [domain, info] of Object.entries(results.domains)) {
    if (info.error) {
      lines.push(`  ? ${domain} — lookup failed: ${info.error}`);
    } else if (info.available) {
      lines.push(`  ✓ ${domain} — AVAILABLE`);
    } else {
      const expires = info.expires ? ` (expires ${info.expires})` : '';
      lines.push(`  ✗ ${domain} — TAKEN${expires}`);
    }
  }

  return lines.join('\n');
}

export { screenBrand, formatScreenReport };
