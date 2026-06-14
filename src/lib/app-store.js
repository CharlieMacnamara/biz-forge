import { getCompany, formatCompanySummary } from './companies-house.js';

const REQUIRED_SCREENSHOT_SIZES = [
  { label: 'iPhone 6.7"', width: 1290, height: 2796 },
  { label: 'iPhone 6.5"', width: 1242, height: 2688 },
  { label: 'iPhone 5.5"', width: 1242, height: 2208 },
];

const COMMON_DATA_TYPES = [
  { type: 'Name', category: 'Contact Info', typical_app: true },
  { type: 'Email Address', category: 'Contact Info', typical_app: true },
  { type: 'User ID', category: 'Identifiers', typical_app: true },
  { type: 'Device ID', category: 'Identifiers', typical_app: true },
  { type: 'Product Interaction', category: 'Usage Data', typical_app: true },
  { type: 'Crash Data', category: 'Diagnostics', typical_app: true },
  { type: 'Performance Data', category: 'Diagnostics', typical_app: true },
  { type: 'Purchase History', category: 'Purchases', typical_app: true },
];

async function checkDuns(companyNumber) {
  if (!companyNumber) {
    return {
      status: 'unknown',
      note: 'No company number provided. DUNS number is required for Apple Developer organization enrollment.',
      action: 'Apply for DUNS at https://www.dnb.com/duns-number.html',
    };
  }

  try {
    const company = await getCompany(companyNumber);
    return {
      status: 'company_found',
      companyName: company.company_name,
      note: 'Company exists in Companies House. You still need a D-U-N-S Number from Dun & Bradstreet.',
      action: 'Check if you have a DUNS at https://www.dnb.com/duns-number/lookup.html. If not, apply for one (free, takes 1-5 business days).',
    };
  } catch {
    return {
      status: 'company_not_found',
      note: `Company number ${companyNumber} not found in Companies House.`,
      action: 'Register the company with Companies House first, then apply for a DUNS number.',
    };
  }
}

function checkPrivacyLabels(declaredDataTypes) {
  const declared = declaredDataTypes || {};
  const missing = [];
  const covered = [];

  for (const dt of COMMON_DATA_TYPES) {
    if (!declared[dt.type] && dt.typical_app) {
      missing.push(`${dt.type} (${dt.category})`);
    } else if (declared[dt.type]) {
      covered.push(dt.type);
    }
  }

  return {
    totalCommon: COMMON_DATA_TYPES.filter(d => d.typical_app).length,
    declared: covered.length,
    missing: missing,
    note: missing.length === 0
      ? 'All common data types are declared. Ensure you review all third-party SDKs.'
      : `${missing.length} common data type(s) need declaration in App Store Connect.`,
  };
}

function checkScreenshotReadiness(screenshots) {
  const provided = screenshots || {};
  const missing = [];

  for (const size of REQUIRED_SCREENSHOT_SIZES) {
    if (!provided[size.label]) {
      missing.push(`${size.label} (${size.width}x${size.height})`);
    }
  }

  return {
    missing,
    note: missing.length === 0
      ? 'All required screenshot sizes ready.'
      : `Missing ${missing.length} screenshot size(s).`,
  };
}

function formatReadinessReport(duns, privacyLabels, screenshots) {
  const lines = [];
  lines.push(`\n  ${'─'.repeat(50)}`);
  lines.push(`  App Store Readiness Report`);
  lines.push(`  ${'─'.repeat(50)}`);

  lines.push(`\n  D-U-N-S Number`);
  lines.push(`    Status: ${duns.status}`);
  lines.push(`    ${duns.note}`);
  if (duns.action) lines.push(`    Action: ${duns.action}`);

  lines.push(`\n  Privacy Nutrition Labels`);
  lines.push(`    ${privacyLabels.declared}/${privacyLabels.totalCommon} common data types declared`);
  for (const m of privacyLabels.missing) {
    lines.push(`  ${RED}  ✗ Not declared: ${m}${NC}`);
  }
  if (privacyLabels.missing.length === 0) {
    lines.push(`  ${GREEN}  ✓ All common types covered${NC}`);
  }

  lines.push(`\n  Screenshots`);
  for (const s of screenshots.missing) {
    lines.push(`  ${RED}  ✗ Missing: ${s}${NC}`);
  }
  if (screenshots.missing.length === 0) {
    lines.push(`  ${GREEN}  ✓ All sizes ready${NC}`);
  }

  lines.push(`\n  Export Compliance`);
  lines.push(`    Action: Complete the export compliance questionnaire in App Store Connect`);
  lines.push(`    Most iOS apps use standard encryption (TLS/HTTPS) — select "Yes" for contains encryption, then check exempt.`);

  lines.push(`\n  App Store Small Business Program`);
  lines.push(`    If annual revenue < $1M, apply at https://developer.apple.com/app-store/small-business-program/`);
  lines.push(`    Reduces commission from 30% to 15% — worth ~$X saved per $10,000 in revenue`);

  lines.push(`\n  ${GREEN}→${NC} Run this check before each App Store submission.`);
  return lines.join('\n');
}

function formatPrivacyLabelQuestionnaire() {
  return `
  App Store Privacy Nutrition Labels — Data Types Reference

  Check which of these your app collects and declare in App Store Connect:

  Contact Info:
  ☐ Name                 ☐ Email Address         ☐ Phone Number
  ☐ Physical Address     ☐ Other User Contact Info

  Health & Fitness:
  ☐ Health               ☐ Fitness

  Financial Info:
  ☐ Payment Info         ☐ Credit Info           ☐ Other Financial Info

  Location:
  ☐ Precise Location     ☐ Coarse Location

  Sensitive Info:
  ☐ Sensitive Info (race, orientation, disability, etc.)

  Contacts:
  ☐ Contacts

  User Content:
  ☐ Emails or Text Messages   ☐ Photos or Videos
  ☐ Audio Data                ☐ Gameplay Content
  ☐ Customer Support          ☐ Other User Content

  Browsing History:
  ☐ Browsing History

  Search History:
  ☐ Search History

  Identifiers:
  ☐ User ID                  ☐ Device ID

  Purchases:
  ☐ Purchase History

  Usage Data:
  ☐ Product Interaction      ☐ Advertising Data    ☐ Other Usage Data

  Diagnostics:
  ☐ Crash Data               ☐ Performance Data    ☐ Other Diagnostic Data

  All collected data must be declared unless ALL of these apply:
  1. Not used for tracking
  2. Not used for advertising
  3. Collected infrequently, not part of core functionality
  4. User affirmatively provides each time
`;
}

export { checkDuns, checkPrivacyLabels, checkScreenshotReadiness, formatReadinessReport, formatPrivacyLabelQuestionnaire };
