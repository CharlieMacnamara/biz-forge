import { describe, it, expect } from 'vitest';
import { formatAuditReport } from '../../src/lib/compliance.js';
import { HTML_SAMPLES } from '../helpers/fixtures.js';

describe('formatAuditReport', () => {
  it('formats full pass report', () => {
    const results = {
      url: 'https://example.com',
      scanned: '2026-06-14T00:00:00.000Z',
      checks: {
        privacyPolicy: { label: 'Privacy policy link present', pass: true, detail: 'Look for a footer link' },
        cookieConsent: { label: 'Cookie consent mechanism', pass: true, detail: 'Cookie consent banner' },
        ssl: { label: 'SSL certificate valid', pass: true, detail: 'HTTPS check' },
      },
    };
    const report = formatAuditReport(results);
    expect(report).toContain('GDPR');
    expect(report).toContain('Privacy policy link present');
    expect(report).toContain('Cookie consent mechanism');
    expect(report).toContain('3/3 checks passed');
  });

  it('formats mixed pass/fail report', () => {
    const results = {
      url: 'http://insecure.com',
      scanned: '2026-06-14T00:00:00.000Z',
      checks: {
        privacyPolicy: { label: 'Privacy policy link present', pass: true, detail: 'Look for a footer link' },
        ssl: { label: 'SSL certificate valid', pass: false, detail: 'Site should use HTTPS' },
      },
    };
    const report = formatAuditReport(results);
    expect(report).toContain('1/2 checks passed');
    expect(report).toContain('Address failing checks');
  });

  it('formats error report', () => {
    const results = {
      url: 'https://error.com',
      scanned: '2026-06-14T00:00:00.000Z',
      error: 'Could not fetch URL: ENOTFOUND error.com',
    };
    const report = formatAuditReport(results);
    expect(report).toContain('Could not scan site');
    expect(report).toContain('ENOTFOUND');
  });

  it('formats all-pass report as compliant', () => {
    const results = {
      url: 'https://secure.com',
      scanned: '2026-06-14T00:00:00.000Z',
      checks: {
        a: { label: 'Check A', pass: true, detail: 'Detail A' },
        b: { label: 'Check B', pass: true, detail: 'Detail B' },
      },
    };
    const report = formatAuditReport(results);
    expect(report).toContain('GDPR/PECR compliant');
  });

  it('includes URL in output', () => {
    const results = {
      url: 'https://mysite.com',
      scanned: '2026-06-14T00:00:00.000Z',
      checks: {},
    };
    const report = formatAuditReport(results);
    expect(report).toContain('mysite.com');
  });

  it('gracefully handles empty checks object', () => {
    const results = {
      url: 'https://example.com',
      scanned: '2026-06-14T00:00:00.000Z',
      checks: {},
    };
    const report = formatAuditReport(results);
    expect(report).toContain('0/0 checks passed');
  });
});
