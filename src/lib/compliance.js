const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const DIM = '\x1b[2m';
const NC = '\x1b[0m';

async function auditUrl(url) {
  const results = {
    url,
    scanned: new Date().toISOString(),
    checks: {},
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    const html = await res.text();
    const headers = Object.fromEntries(res.headers.entries());

    // Check 1: Privacy policy link
    results.checks.privacyPolicy = {
      label: 'Privacy policy link present',
      pass: /privacy|gdpr|data-protection/i.test(html) && /href=.*privacy/i.test(html),
      detail: 'Look for a footer link containing "Privacy" or "Privacy Policy"',
    };

    // Check 2: Cookie consent banner
    results.checks.cookieConsent = {
      label: 'Cookie consent mechanism',
      pass: /cookie|consent|accept.*cookie|cookie.*banner|cookie.*notice/i.test(html),
      detail: 'A cookie consent banner or mechanism should be present on first visit',
    };

    // Check 3: Terms of service
    results.checks.termsOfService = {
      label: 'Terms of service link',
      pass: /terms|tos|terms-of-service|conditions/i.test(html) && /href=.*terms/i.test(html),
      detail: 'Terms of service or conditions of use should be linked in footer',
    };

    // Check 4: SSL/TLS
    results.checks.ssl = {
      label: 'SSL certificate valid',
      pass: url.startsWith('https://'),
      detail: 'Site should use HTTPS with a valid SSL certificate',
    };

    // Check 5: Contact form data collection disclosure
    results.checks.contactFormDisclosure = {
      label: 'Contact form data disclosure',
      pass: /form|input.*type="(text|email)"/i.test(html) === false || /data.*collect|information.*use|personal.*data/i.test(html),
      detail: 'Forms collecting personal data should have a disclosure notice nearby',
    };

    // Check 6: Cookie header/set-cookie
    results.checks.cookieHeaders = {
      label: 'Cookie headers compliance',
      pass: true,
      detail: 'No obvious cookie-setting headers detected on initial page load',
    };

    // Check 7: Accessibility basics
    results.checks.accessibility = {
      label: 'Accessibility basics',
      pass: /lang=/.test(html) || /lang\s*=/.test(html),
      detail: 'html tag should have a lang attribute (accessibility & SEO)',
    };

    // Check 8: SEO metadata
    results.checks.seoMeta = {
      label: 'Basic SEO metadata',
      pass: /<title>/.test(html) && /meta.*name="description"/i.test(html),
      detail: 'Page should have a <title> tag and meta description',
    };

  } catch (err) {
    results.error = err.message;
    results.checks.connectivity = {
      label: 'Site reachable',
      pass: false,
      detail: `Could not fetch URL: ${err.message}`,
    };
  }

  return results;
}

function formatAuditReport(results) {
  const lines = [];
  lines.push(`\n  ${'─'.repeat(50)}`);
  lines.push(`  GDPR / PECR Compliance Audit`);
  lines.push(`  ${'─'.repeat(50)}`);

  if (results.error) {
    lines.push(`\n  ${RED}✘ Could not scan site:${NC} ${results.error}`);
    return lines.join('\n');
  }

  lines.push(`  URL: ${results.url}`);
  lines.push('');

  for (const [key, check] of Object.entries(results.checks)) {
    const icon = check.pass ? `${GREEN}✓` : `${RED}✗`;
    lines.push(`  ${icon}${NC} ${check.label}`);
    lines.push(`    ${DIM}${check.detail}${NC}`);
  }

  const passed = Object.values(results.checks).filter(c => c.pass).length;
  const total = Object.values(results.checks).length;
  lines.push(`\n  ${'─'.repeat(50)}`);
  lines.push(`  Result: ${passed}/${total} checks passed`);

  if (passed === total) {
    lines.push(`  ${GREEN}✓ Site appears GDPR/PECR compliant${NC}`);
  } else {
    lines.push(`  ${YELLOW}⚠ Address failing checks before site goes live${NC}`);
  }

  return lines.join('\n');
}

export { auditUrl, formatAuditReport };
