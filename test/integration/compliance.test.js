import { describe, it, expect, vi } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('auditUrl (integration with mock fetch)', async () => {
  const { auditUrl, formatAuditReport } = await import('../../src/lib/compliance.js');

  it('detects compliant site', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      headers: { entries: () => [] },
      text: () => Promise.resolve(`<!DOCTYPE html><html lang="en"><head><title>Test</title><meta name="description" content="test"></head><body><footer><a href="/privacy">Privacy Policy</a><a href="/terms">Terms</a></footer><div id="cookie-banner">Accept cookies</div><form><input type="text" name="email"></form><p>Data collection notice</p></body></html>`),
    });

    const result = await auditUrl('https://example.com');
    expect(result.checks.privacyPolicy.pass).toBe(true);
    expect(result.checks.cookieConsent.pass).toBe(true);
    expect(result.checks.termsOfService.pass).toBe(true);
    expect(result.checks.ssl.pass).toBe(true);
    expect(result.checks.accessibility.pass).toBe(true);
    expect(result.checks.seoMeta.pass).toBe(true);
  });

  it('detects missing privacy policy', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      headers: { entries: () => [] },
      text: () => Promise.resolve(`<!DOCTYPE html><html><head><title>No Privacy</title></head><body><p>Welcome</p></body></html>`),
    });

    const result = await auditUrl('https://example.com');
    expect(result.checks.privacyPolicy.pass).toBe(false);
    expect(result.checks.cookieConsent.pass).toBe(false);
    expect(result.checks.termsOfService.pass).toBe(false);
    expect(result.checks.seoMeta.pass).toBe(false);
  });

  it('detects site without HTTPS', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      headers: { entries: () => [] },
      text: () => Promise.resolve('<html><body></body></html>'),
    });

    const result = await auditUrl('http://insecure.com');
    expect(result.checks.ssl.pass).toBe(false);
  });

  it('handles fetch errors gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('ENOTFOUND'));

    const result = await auditUrl('https://unknown.example');
    expect(result.error).toContain('ENOTFOUND');
  });
});
