import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, '../../templates');
const SCRIPTS_DIR = path.resolve(__dirname, '../../scripts');

function loadTemplate(name) {
  const filePath = path.join(TEMPLATES_DIR, name);
  return fs.readFileSync(filePath, 'utf8');
}

describe('Template Integrity', () => {
  const requiredTemplates = ['sow.md', 'privacy-policy.md', 'terms-of-service.md', 'cookie-policy.md'];

  for (const tpl of requiredTemplates) {
    it(`${tpl} exists and contains template variables`, () => {
      const filePath = path.join(TEMPLATES_DIR, tpl);
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).toMatch(/\{\{/);
    });
  }

  it('sow.md contains all critical sections', () => {
    const t = loadTemplate('sow.md');
    const requiredSections = [
      'Statement of Work',
      'Parties',
      'Project Scope',
      'Deliverables',
      'Timeline',
      'Fees',
      'Payment',
      'Late Payment',
      'Intellectual Property',
      'Limitation of Liability',
      'Termination',
      'Confidentiality',
      'Governing Law',
    ];
    for (const section of requiredSections) {
      expect(t).toContain(section);
    }
  });

  it('privacy-policy.md contains all required GDPR sections', () => {
    const t = loadTemplate('privacy-policy.md');
    const requiredSections = [
      'Privacy Policy',
      'Data We Collect',
      'Lawful Basis',
      'How We Use Your Data',
      'Data Retention',
      'Your Rights',
      'UK GDPR',
      'Cookies',
      'Data Security',
      'Third-Party Processors',
      'Complaints',
      'ICO',
    ];
    for (const section of requiredSections) {
      expect(t).toContain(section);
    }
  });

  it('terms-of-service.md contains all required legal sections', () => {
    const t = loadTemplate('terms-of-service.md');
    const requiredSections = [
      'Terms of Service',
      'Service Description',
      'Acceptance of Terms',
      'Client Obligations',
      'Fees',
      'Payment',
      'Intellectual Property',
      'Limitation of Liability',
      'Termination',
      'Governing Law',
    ];
    for (const section of requiredSections) {
      expect(t).toContain(section);
    }
  });

  it('cookie-policy.md contains all required sections', () => {
    const t = loadTemplate('cookie-policy.md');
    const requiredSections = [
      'Cookie Policy',
      'What Are Cookies',
      'How We Use Cookies',
      'Types of Cookies',
      'Strictly Necessary',
      'Analytics',
      'Functional',
      'Marketing',
      'Cookie Consent',
      'Managing Cookies',
      'Third-Party Cookies',
    ];
    for (const section of requiredSections) {
      expect(t).toContain(section);
    }
  });

  it('all templates have valid variable syntax', () => {
    for (const tpl of requiredTemplates) {
      const content = loadTemplate(tpl);
      // All variables should be {{variable_name}} format
      const vars = content.match(/\{\{[^}]+\}\}/g) || [];
      for (const v of vars) {
        // Should not have spaces inside except around the variable name
        expect(v).toMatch(/^\{\{\s*\w+\s*\}\}$/);
      }
    }
  });

  it('no template contains unresolved double-brace artifacts', () => {
    for (const tpl of requiredTemplates) {
      const content = loadTemplate(tpl);
      const unresolved = content.match(/\{\{/g) || [];
      const resolved = content.match(/\}\}/g) || [];
      // Should only be template variables (same count for opening and closing)
      expect(unresolved.length).toBe(resolved.length);
    }
  });
});

describe('Script Integrity', () => {
  const scripts = [
    'setup.js', 'screen-brand.js', 'verify-company.js', 'check-domain.js',
    'generate-contract.js', 'generate-policy.js', 'tax-strategy.js',
    'audit-privacy.js', 'app-store-readiness.js', 'calendar.js',
    'health-check.js', 'verify-setup.js',
  ];

  for (const script of scripts) {
    it(`${script} exists and has shebang`, () => {
      const scriptPath = path.join(SCRIPTS_DIR, script);
      expect(fs.existsSync(scriptPath)).toBe(true);
      const content = fs.readFileSync(scriptPath, 'utf8');
      expect(content).toContain('#!/usr/bin/env node');
    });
  }
});
