import { describe, it, expect } from 'vitest';
import {
  checkPrivacyLabels,
  checkScreenshotReadiness,
  formatPrivacyLabelQuestionnaire,
} from '../../src/lib/app-store.js';

describe('checkPrivacyLabels', () => {
  it('reports all 8 common types missing for empty declaration', () => {
    const result = checkPrivacyLabels({});
    expect(result.totalCommon).toBe(8);
    expect(result.declared).toBe(0);
    expect(result.missing.length).toBe(8);
  });

  it('reports all types covered when fully declared', () => {
    const result = checkPrivacyLabels({
      'Name': true,
      'Email Address': true,
      'User ID': true,
      'Device ID': true,
      'Product Interaction': true,
      'Crash Data': true,
      'Performance Data': true,
      'Purchase History': true,
    });
    expect(result.declared).toBe(8);
    expect(result.missing.length).toBe(0);
  });

  it('reports partial declarations', () => {
    const result = checkPrivacyLabels({
      'Name': true,
      'Email Address': true,
    });
    expect(result.declared).toBe(2);
    expect(result.missing.length).toBe(6);
  });

  it('ignores non-typical-app data types', () => {
    const result = checkPrivacyLabels({
      'Fitness': true,
    });
    // Fitness is not typical_app, so it's ignored
    expect(result.declared).toBe(0);
    expect(result.missing.length).toBe(8);
  });

  it('handles null/undefined declaredDataTypes', () => {
    const result = checkPrivacyLabels(null);
    expect(result.declared).toBe(0);
    expect(result.missing.length).toBe(8);
  });

  it('returns informative note when all covered', () => {
    const result = checkPrivacyLabels({
      'Name': true,
      'Email Address': true,
      'User ID': true,
      'Device ID': true,
      'Product Interaction': true,
      'Crash Data': true,
      'Performance Data': true,
      'Purchase History': true,
    });
    expect(result.note).toContain('All common data types');
  });

  it('returns informative note when missing', () => {
    const result = checkPrivacyLabels({});
    expect(result.note).toContain('need declaration');
  });
});

describe('checkScreenshotReadiness', () => {
  it('reports 3 missing sizes for empty input', () => {
    const result = checkScreenshotReadiness({});
    expect(result.missing.length).toBe(3);
    expect(result.note).toContain('Missing 3');
  });

  it('returns all missing names', () => {
    const result = checkScreenshotReadiness({});
    expect(result.missing[0]).toContain('iPhone 6.7');
    expect(result.missing[1]).toContain('iPhone 6.5');
    expect(result.missing[2]).toContain('iPhone 5.5');
  });

  it('reports all ready when all provided', () => {
    const result = checkScreenshotReadiness({
      'iPhone 6.7"': true,
      'iPhone 6.5"': true,
      'iPhone 5.5"': true,
    });
    expect(result.missing.length).toBe(0);
    expect(result.note).toContain('All required');
  });

  it('reports partial readiness', () => {
    const result = checkScreenshotReadiness({
      'iPhone 6.7"': true,
    });
    expect(result.missing.length).toBe(2);
  });

  it('handles null input', () => {
    const result = checkScreenshotReadiness(null);
    expect(result.missing.length).toBe(3);
  });
});

describe('formatPrivacyLabelQuestionnaire', () => {
  it('returns a string with all data categories', () => {
    const text = formatPrivacyLabelQuestionnaire();
    expect(typeof text).toBe('string');
    expect(text.length).toBeGreaterThan(500);
    expect(text).toContain('Contact Info');
    expect(text).toContain('Health & Fitness');
    expect(text).toContain('Financial Info');
    expect(text).toContain('Location');
    expect(text).toContain('Identifiers');
    expect(text).toContain('Usage Data');
    expect(text).toContain('Diagnostics');
  });

  it('includes checkbox markers', () => {
    const text = formatPrivacyLabelQuestionnaire();
    expect(text).toContain('☐');
  });

  it('includes exemption conditions', () => {
    const text = formatPrivacyLabelQuestionnaire();
    expect(text).toContain('Not used for tracking');
  });
});
