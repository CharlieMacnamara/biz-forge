/**
 * Business Readiness Scoring — pure-function check library.
 *
 * All functions take data as parameters (no side effects, no process.env).
 * Each check returns an array of { check, pass, detail, severity } objects.
 */

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Test whether a value is missing entirely. */
function isMissing(val) {
  return val === undefined || val === null || val === '';
}

/** Test whether a value is a bracketed placeholder like `[your-key]`. */
function isPlaceholder(val) {
  if (typeof val !== 'string') return false;
  return /\[.*\]/.test(val);
}

/** Build a single check-result object. */
function result(check, pass, detail, severity = 'warning') {
  return { check, pass, detail, severity };
}

/** Required templates list. */
const REQUIRED_TEMPLATES = [
  'sow.md',
  'privacy-policy.md',
  'terms-of-service.md',
  'cookie-policy.md',
  'dividend-voucher.md',
  'board-minutes.md',
];

/* ------------------------------------------------------------------ */
/*  Exported check functions                                           */
/* ------------------------------------------------------------------ */

/**
 * checkEnv(env)
 * Validate core environment variables for business readiness.
 * @param {object} env  — e.g. { COMPANY_NAME, COMPANY_EMAIL, COMPANY_NUMBER, ... }
 * @returns {Array<{check, pass, detail, severity}>}
 */
export function checkEnv(env) {
  if (!env || typeof env !== 'object') env = {};

  const required = ['COMPANY_NAME', 'COMPANY_EMAIL', 'COMPANY_NUMBER'];
  const optional = ['COMPANY_VAT_NUMBER', 'COMPANY_ADDRESS', 'COMPANY_DIRECTOR_NAME'];

  const checks = [];

  for (const key of required) {
    const val = env[key];
    if (isMissing(val)) {
      checks.push(result(key, false, `${key} is not set`, 'critical'));
    } else if (isPlaceholder(val)) {
      checks.push(result(key, false, `${key} has a placeholder value — update it`, 'critical'));
    } else {
      checks.push(result(key, true, `${key} is set`, 'critical'));
    }
  }

  for (const key of optional) {
    const val = env[key];
    if (isMissing(val)) {
      checks.push(result(key, false, `${key} is not set`, 'warning'));
    } else if (isPlaceholder(val)) {
      checks.push(result(key, false, `${key} has a placeholder value — update it`, 'warning'));
    } else {
      checks.push(result(key, true, `${key} is set`, 'warning'));
    }
  }

  return checks;
}

/**
 * checkTemplates(files)
 * Verify that required legal/business templates exist in the provided list.
 * @param {string[]} files — array of available template file paths/names
 * @returns {Array<{check, pass, detail, severity}>}
 */
export function checkTemplates(files) {
  if (!Array.isArray(files)) files = [];

  const available = new Set(files.map(f => f.replace(/^.*[\\/]/, '')));

  return REQUIRED_TEMPLATES.map(template => {
    if (available.has(template)) {
      return result(template, true, `${template} is present`, 'warning');
    }
    return result(template, false, `${template} is missing`, 'warning');
  });
}

/**
 * checkApiKeys(env)
 * Check that optional API keys are configured.
 * @param {object} env
 * @returns {Array<{check, pass, detail, severity}>}
 */
export function checkApiKeys(env) {
  if (!env || typeof env !== 'object') env = {};

  const checks = [];
  const key = 'COMPANIES_HOUSE_API_KEY';
  const val = env[key];

  if (isMissing(val)) {
    checks.push(result(key, false, `${key} is not set — some features unavailable`, 'warning'));
  } else if (isPlaceholder(val)) {
    checks.push(result(key, false, `${key} has a placeholder value — update it`, 'warning'));
  } else {
    checks.push(result(key, true, `${key} is set`, 'warning'));
  }

  return checks;
}

/**
 * checkInsurance(insuranceExpiry)
 * Validate professional indemnity / liability insurance expiry.
 * @param {string} insuranceExpiry — date string like '2027-06-30'
 * @returns {Array<{check, pass, detail, severity}>}
 */
export function checkInsurance(insuranceExpiry) {
  if (isMissing(insuranceExpiry)) {
    return [result('insurance_expiry', false, 'Insurance expiry date is not set', 'warning')];
  }

  const parsed = new Date(insuranceExpiry);
  if (Number.isNaN(parsed.getTime())) {
    return [result('insurance_expiry', false, `Invalid insurance expiry date: ${insuranceExpiry}`, 'warning')];
  }

  if (parsed > new Date()) {
    return [result('insurance_expiry', true, `Insurance valid until ${insuranceExpiry}`, 'warning')];
  }

  return [result('insurance_expiry', false, `Insurance expired on ${insuranceExpiry}`, 'critical')];
}

/**
 * checkCompany(env)
 * Validate company details are configured.
 * @param {object} env
 * @returns {Array<{check, pass, detail, severity}>}
 */
export function checkCompany(env) {
  if (!env || typeof env !== 'object') env = {};

  const fields = ['COMPANY_NUMBER', 'COMPANY_ADDRESS', 'COMPANY_EMAIL', 'COMPANY_DIRECTOR_NAME'];

  return fields.map(key => {
    const val = env[key];
    if (isMissing(val)) {
      return result(key, false, `${key} is not set`, 'critical');
    }
    if (isPlaceholder(val)) {
      return result(key, false, `${key} has a placeholder value — update it`, 'critical');
    }
    return result(key, true, `${key} is set`, 'critical');
  });
}

/**
 * checkVat(vatNumber)
 * Validate VAT registration number format.
 * @param {string} vatNumber
 * @returns {Array<{check, pass, detail, severity}>}
 */
export function checkVat(vatNumber) {
  if (isMissing(vatNumber)) {
    return [result('vat_number', false, 'VAT number is not set', 'warning')];
  }

  // Basic UK VAT format: GB followed by 9 digits (or 12 for some)
  const validFormat = /^GB\d{9}(\d{3})?$/.test(vatNumber);
  if (validFormat) {
    return [result('vat_number', true, `VAT number ${vatNumber} has a valid format`, 'warning')];
  }

  return [result('vat_number', false, `VAT number ${vatNumber} has an unexpected format`, 'warning')];
}

/**
 * checkEmail(email)
 * Validate an email address format.
 * @param {string} email
 * @returns {Array<{check, pass, detail, severity}>}
 */
export function checkEmail(email) {
  if (isMissing(email)) {
    return [result('email', false, 'Email address is not set', 'warning')];
  }

  const validFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (validFormat) {
    return [result('email', true, `Email ${email} has a valid format`, 'warning')];
  }

  return [result('email', false, `Email ${email} has an invalid format`, 'warning')];
}

/**
 * checkDomain(domain)
 * Validate a domain name is provided and non-empty.
 * @param {string} domain
 * @returns {Array<{check, pass, detail, severity}>}
 */
export function checkDomain(domain) {
  if (isMissing(domain)) {
    return [result('domain', false, 'Domain is not set', 'warning')];
  }

  // Strip protocol if present
  const clean = domain.replace(/^https?:\/\//, '').split('/')[0];
  if (clean.length > 0 && clean.includes('.')) {
    return [result('domain', true, `Domain ${domain} is set`, 'warning')];
  }

  return [result('domain', false, `Domain ${domain} does not appear valid`, 'warning')];
}

/* ------------------------------------------------------------------ */
/*  Orchestrator                                                        */
/* ------------------------------------------------------------------ */

/**
 * getVerdict(score)
 * Map a readiness score (0-100) to a traffic-light verdict.
 * @param {number} score
 * @returns {'GREEN'|'AMBER'|'RED'}
 */
export function getVerdict(score) {
  if (typeof score !== 'number' || score < 0) return 'RED';
  if (score >= 85) return 'GREEN';
  if (score >= 60) return 'AMBER';
  return 'RED';
}

/**
 * runReadinessCheck({ env, templates, insuranceExpiry })
 * Orchestrate all checks and return a scored readiness report.
 *
 * @param {object} options
 * @param {object}  [options.env]
 * @param {string[]} [options.templates]
 * @param {string}  [options.insuranceExpiry]
 * @returns {{ score, verdict, results, summary }}
 */
export function runReadinessCheck({ env, templates, insuranceExpiry } = {}) {
  const results = [
    ...checkEnv(env),
    ...checkTemplates(templates),
    ...checkApiKeys(env),
    ...checkInsurance(insuranceExpiry),
    ...checkCompany(env),
  ];

  const total = results.length;
  const passed = results.filter(r => r.pass).length;
  const failed = total - passed;
  const critical = results.filter(r => r.severity === 'critical' && !r.pass).length;
  const warnings = results.filter(r => r.severity === 'warning' && !r.pass).length;

  const score = total === 0 ? 0 : Math.round((passed / total) * 100);
  const verdict = getVerdict(score);

  return {
    score,
    verdict,
    results,
    summary: { passed, failed, total, critical, warnings },
  };
}
