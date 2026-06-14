# bizforge — Long-Term Business Security Features

## TL;DR

> **Quick Summary**: Add 5 high-impact CLI features to bizforge for a UK limited company director's peace of mind: dividend voucher generator, financial dashboard, pre-launch readiness scorer, enhanced deadline calendar, and what-if scenario planner. Personal use only — replaces paid tools with a single CLI.
>
> **Deliverables**:
> - `npm run dividend` — Generate HMRC-compliant dividend vouchers + meeting minutes
> - `npm run dashboard` — Single-view financial dashboard (VAT, CT, dividends, payroll, deadlines)
> - `npm run readiness` — Pre-launch readiness checklist with pass/fail scoring
> - Enhanced `npm run calendar` — Real dates from .env with red/amber/green urgency
> - Enhanced `npm run strategy -- compare X Y` — Side-by-side revenue scenario comparison
>
> **Estimated Effort**: Medium
> **Parallel Execution**: YES — 3 waves
> **Critical Path**: Task 2 (readiness lib) → Task 9 (readiness script) → FINAL

---

## Context

### Original Request
The user wants to enhance bizforge with features that give peace of mind when launching and running a UK limited company. Core fear: tax problems, legal issues, missed obligations. Personal use only — no multi-user, no SaaS.

**Strategic Goal**: Eliminate the need for an accountant. Accountants charge £1,000-3,000/yr for deterministic figure-checking: "did you pay the right tax?", "can you legally take this dividend?", "are you approaching a tax threshold?", "is your filing deadline approaching?" These are all programmable checks — bizforge should do them for free.

### What Accountants Do vs. What bizforge Will Do

| Accountant Task | Cost | bizforge Replacement | Status |
|---|---|---|---|
| Check if dividend is legal (distributable reserves) | £300-600/yr | `npm run dividend` — validates against profit, warns if exceeds | **Planned** |
| Calculate optimal salary/dividend split | £200-500/yr | `npm run strategy` — already does this | ✅ Done |
| Track filing deadlines (CT, SA, VAT, CH) | £200-400/yr | `npm run calendar` — enhanced with real dates + urgency | **Planned** |
| Estimate tax bill (CT, dividend tax, SA) | £300-600/yr | `npm run dashboard` — single-view of all obligations | **Planned** |
| VAT registration + flat rate scheme advice | £200-400/yr | `npm run strategy` — compares FRS vs standard | ✅ Done |
| Pre-trading readiness review | £300-500/yr | `npm run readiness` — scored checklist with pass/fail | **Planned** |
| Dividend voucher generation | £100-200/yr | `npm run dividend` — HMRC-compliant vouchers | **Planned** |
| Self Assessment guidance | £200-400/yr | `npm run strategy` + `npm run dashboard` — what to report | ✅ Partial |
| Company formation guidance | £50-300 | `npm run setup` — step-by-step walkthrough | ✅ Done |
| **Total replaced** | **£1,850-3,900/yr** | **All in a single free CLI** | 6/9 complete or planned |

> **Note**: bizforge calculates and advises — it does NOT file anything with HMRC. Filing remains the user's responsibility. This is the same distinction as an accountant who prepares your figures but you sign the return.

### Interview Summary
**Key Discussions**:
- User is a solo founder running a UK limited company
- Already uses bizforge for tax strategy, legal docs, and compliance checks
- Wants a single CLI covering everything needed before/during business operations
- High impact only — skip market research, SEO, landing pages
- Focus: tax compliance, legal obligations, financial visibility, deadline tracking

**Research Findings**:
- **Dividend vouchers**: UK law requires a voucher per payment with: company name, company number, date, shareholder name/address, share class, amount. Must also keep directors' meeting minutes. Failure = potential tax evasion penalties.
- **MTD for VAT**: HMRC REST API exists but requires OAuth 2.0 + Government Gateway + fraud prevention headers. Complex for a personal CLI tool. Out of scope for this iteration but noted for future.
- **HMRC VAT API endpoints**: Available in sandbox at `https://test-api.service.hmrc.gov.uk`. Submit VAT return, retrieve obligations, liabilities, payments, penalties.
- **Pre-launch gaps**: Calendar is static text. No dividend voucher generation. No what-if comparison. No integrated readiness check.

### Metis Review
**Identified Gaps** (addressed):
- Metis confirmed the dividend voucher is highest-impact (legal requirement, easy to forget, no alternative in bizforge)
- Noted that `fullStrategy` already returns comprehensive data — dashboard can reuse it directly
- Flagged that `calendar.js` already has `daysUntil()` logic — enhancement should extend, not rewrite
- Warned against scope creep: MTD API integration is a separate project due to OAuth complexity
- Confirmed: what-if comparison should reuse existing `fullStrategy()` calculations, not duplicate logic

---

## Work Objectives

### Core Objective
Add 5 CLI tools that give a UK limited company director complete visibility over all financial, legal, and compliance obligations — preventing missed deadlines, illegal dividend payments, and tax surprises.

### Concrete Deliverables
- `src/lib/dividend.js` — Dividend voucher generator + meeting minutes
- `src/lib/dashboard.js` — Financial dashboard aggregator
- `src/lib/readiness.js` — Business readiness scoring system
- `test/unit/dividend.test.js` — Tests for voucher generation
- `test/unit/dashboard.test.js` — Tests for dashboard aggregation
- `test/unit/readiness.test.js` — Tests for readiness scoring
- Enhanced `scripts/calendar.js` — Real dates + urgency scoring
- New `scripts/dividend.js` — CLI for dividend vouchers
- New `scripts/dashboard.js` — CLI for financial dashboard
- New `scripts/readiness.js` — CLI for pre-launch readiness
- Register all new commands in `src/index.js`
- Register all new npm scripts in `package.json`
- `templates/dividend-voucher.md` — Template for dividend vouchers
- `templates/board-minutes.md` — Template for directors' meeting minutes

### Definition of Done
- [ ] `npm run dividend -- 5000` generates a valid HMRC-compliant dividend voucher PDF/markdown
- [ ] `npm run dashboard` shows single-view with: VAT status, CT estimate, dividends YTD, payroll, deadlines, insurance
- [ ] `npm run readiness` runs all checks and outputs: X/Y passed with per-category breakdown
- [ ] `npm run calendar` shows real dates from .env with colour-coded urgency
- [ ] `npm run strategy -- compare 80000 120000` shows side-by-side comparison
- [ ] `npm test` passes (188 existing + ~40 new tests)
- [ ] `npm run verify:setup` passes (pass count will increase from 72 → ~80 with new libs/scripts/templates)
- [ ] All new modules have vitest unit tests with ≥90% coverage of public API

### Must Have
- Dividend voucher generator with HMRC-compliant output
- Financial dashboard pulling real data from .env + strategy calculations
- Pre-launch readiness checklist with scoring (not just text)
- Calendar with actual dates and urgency levels
- Side-by-side strategy comparison
- **LEGAL DISCLAIMER on every financial output**: "This is an estimate based on {TAX_YEAR} rates. Tax rules change. Verify thresholds for the current tax year. Consult a qualified accountant before filing. This tool does not submit anything to HMRC."

### Must NOT Have (Guardrails)
- NO HMRC MTD API integration (OAuth complexity — separate project)
- NO multi-user / authentication / cloud storage
- NO market research or competitive intelligence
- NO SEO audit or landing page generation
- NO bank account integration (Open Banking)
- NO modification to `src/lib/finances.js` thresholds or calculation logic (reuse only)
- NO modification to `src/lib/legal.js` template engine (reuse only)
- NO receipt OCR or expense tracking (FreeAgent does this better)
- NO PDF generation dependency (use markdown output, let user convert externally)

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: YES — vitest, 188 tests, 14 test files
- **Automated tests**: TDD — each task follows RED (failing test) → GREEN (minimal impl) → REFACTOR
- **Framework**: vitest (already configured, `npm test`)
- **Test patterns**: `describe/it/expect` from vitest, follows existing `test/unit/*.test.js` conventions

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.omo/evidence/task-{N}-{scenario-slug}.{ext}`.

- **CLI/TUI**: Use interactive_bash (tmux) — Run command, validate output
- **API/Backend**: Use Bash (node REPL) — Import, call functions, compare output
- **Filesystem**: Use Bash — Check generated files, content assertions

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — lib modules + templates):
├── Task 1: Dividend voucher template + board minutes template [quick]
├── Task 2: Readiness scoring library [quick]
├── Task 3: Financial dashboard library [quick]
├── Task 4: Dividend voucher generator library [quick]
├── Task 5: Enhanced calendar library (date parser + urgency scorer) [quick]

Wave 2 (After Wave 1 — CLI scripts + tests, MAX PARALLEL):
├── Task 6: Dividend CLI script [quick]
├── Task 7: Dashboard CLI script [quick]
├── Task 8: Readiness CLI script [quick]
├── Task 9: Enhanced calendar CLI script [quick]
├── Task 10: Strategy compare CLI enhancement [quick]
├── Task 11: Dividend voucher unit tests [quick]
├── Task 12: Dashboard unit tests [quick]
├── Task 13: Readiness unit tests [quick]

Wave 3 (After Wave 2 — registration + integration):
├── Task 14: Register all commands in src/index.js + package.json [quick]
├── Task 15: Integration test: full readiness → dashboard → dividend workflow [quick]
├── Task 16: Run full test suite + verify:setup [quick]

Wave FINAL (After ALL tasks — 4 parallel reviews, then user okay):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
└── Task F4: Scope fidelity check (deep)
→ Present results → Get explicit user okay

Critical Path: Task 2 (readiness lib) → Task 8 (readiness CLI) → Task 16 (final verify)
Parallel Speedup: ~60% faster than sequential
Max Concurrent: 8 (Wave 2)
```

### Dependency Matrix

- **1**: None — 6, 2
- **2**: None — 8, 13, 2
- **3**: None — 7, 12, 2
- **4**: None — 6, 11, 2
- **5**: None — 9, 2
- **6**: 1, 4 — None, 2
- **7**: 3 — None, 2
- **8**: 2 — 16, 2
- **9**: 5 — None, 2
- **10**: None (enhances existing) — None, 2
- **11**: 4 — None, 2
- **12**: 3 — None, 2
- **13**: 2 — None, 2
- **14**: 6, 7, 8, 9, 10 — 16, 3
- **15**: 14 — None, 3
- **16**: 15 — FINAL, 3

### Agent Dispatch Summary

- **Wave 1**: 5 tasks — T1-T2 → `quick`, T3-T5 → `quick`
- **Wave 2**: 8 tasks — T6-T10 → `quick`, T11-T13 → `quick`
- **Wave 3**: 3 tasks — T14 → `quick`, T15 → `quick`, T16 → `quick`
- **FINAL**: 4 tasks — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [ ] 1. Create dividend voucher + board minutes templates

  **What to do**:
  - Create `templates/dividend-voucher.md` with `{{variable}}` placeholders for: `company_name`, `company_number`, `date`, `shareholder_name`, `shareholder_address`, `share_class`, `dividend_amount`, `director_name`, `dividend_per_share`, `shares_held`
  - Create `templates/board-minutes.md` with placeholders for: `company_name`, `company_number`, `date`, `director_name`, `dividend_amount`, `meeting_location`, `resolution_text`
  - Follow existing template pattern from `templates/sow.md` (same `{{variable}}` syntax)

  **Must NOT do**:
  - Do NOT add PDF generation — markdown output only
  - Do NOT modify `src/lib/legal.js` template engine

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: Template creation is document authoring with variable placeholders
  - **Skills**: []
  - **Skills Evaluated but Omitted**: None needed — pure markdown

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3, 4, 5)
  - **Blocks**: Task 6
  - **Blocked By**: None (can start immediately)

  **References**:
  - Pattern: `templates/sow.md` — Template variable format using `{{variable_name}}`
  - Pattern: `templates/privacy-policy.md` — Multi-section template with company variables
  - Legal reference: GOV.UK dividend voucher requirements — Must include: company name, company number, date, shareholder name/address, share class, amount, authorising signature
  - Legal reference: ACCA dividend voucher template — Standard voucher layout

  **Acceptance Criteria**:
  - [ ] `templates/dividend-voucher.md` exists with all required variables
  - [ ] `templates/board-minutes.md` exists with all required variables
  - [ ] Both templates validate with `src/lib/legal.js:fillTemplate()` when tested with sample vars
  - [ ] `npm run verify:setup` template integrity check passes (templates section)

  **QA Scenarios**:

  ```
  Scenario: Dividend voucher template contains all legal requirements
    Tool: Bash (grep)
    Steps:
      1. grep "{{company_name}}" templates/dividend-voucher.md → found
      2. grep "{{company_number}}" templates/dividend-voucher.md → found
      3. grep "{{shareholder_name}}" templates/dividend-voucher.md → found
      4. grep "{{dividend_amount}}" templates/dividend-voucher.md → found
      5. grep "{{director_name}}" templates/dividend-voucher.md → found
    Expected Result: All 5 required fields present in template
    Evidence: .omo/evidence/task-1-template-fields.txt

  Scenario: Board minutes template has resolution section
    Tool: Bash (grep)
    Steps:
      1. grep "{{resolution_text}}" templates/board-minutes.md → found
      2. grep "{{meeting_location}}" templates/board-minutes.md → found
    Expected Result: Resolution and meeting location variables present
    Evidence: .omo/evidence/task-1-board-minutes.txt
  ```

  **Commit**: YES
  - Message: `feat(templates): add dividend voucher and board minutes templates`
  - Files: `templates/dividend-voucher.md`, `templates/board-minutes.md`

- [ ] 2. Create readiness scoring library

  **What to do**:
  - Create `src/lib/readiness.js` with exported functions:
    - `checkEnv()` — validates all required .env variables are set (not empty, no bracket placeholders)
    - `checkTemplates()` — verifies all 6 required templates exist (sow, privacy, terms, cookies, dividend, minutes)
    - `checkApiKeys()` — checks COMPANIES_HOUSE_API_KEY format
    - `checkInsurance()` — validates PI_INSURANCE_EXPIRY is a future date
    - `checkCompany()` — validates COMPANY_NUMBER, COMPANY_EMAIL, COMPANY_NAME are set
    - `runReadinessCheck()` — orchestrates all checks, returns `{ passed, failed, score, results }` object
  - Each check returns `{ check: string, pass: boolean, detail: string, severity: 'critical'|'warning' }`
  - Score = passed / total * 100. Red (<60%), Amber (60-84%), Green (85%+)
  - Follow `src/lib/compliance.js` pattern (check objects with pass/detail fields)

  **Must NOT do**:
  - Do NOT change .env validation logic in existing health-check.js
  - Do NOT add network calls (purely filesystem + env checks)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Pure logic module — no API calls, no UI, straightforward validation functions
  - **Skills**: []
  - **Skills Evaluated but Omitted**: None needed

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 4, 5)
  - **Blocks**: Task 8, Task 13
  - **Blocked By**: None (can start immediately)

  **References**:
  - Pattern: `src/lib/compliance.js:7-89` — `auditUrl()` returns `{ checks: { key: { label, pass, detail } } }` structure
  - Pattern: `scripts/health-check.js:29-36` — Existing .env validation logic (check for empty + bracket placeholders)
  - Pattern: `src/lib/app-store.js:46-67` — `checkPrivacyLabels()` returns `{ declared, missing, totalCommon }` structure
  - Const: `.env.example` — All valid env keys

  **Acceptance Criteria**:
  - [ ] Test file: `test/unit/readiness.test.js` — TDD: write tests BEFORE implementation
  - [ ] `checkEnv()` returns critical when COMPANY_EMAIL is missing
  - [ ] `checkEnv()` returns warning (not critical) when COMPANY_VAT_NUMBER is missing
  - [ ] `checkInsurance()` returns critical when PI_INSURANCE_EXPIRY is in the past
  - [ ] `runReadinessCheck()` returns `score: 85+` with valid .env.test values
  - [ ] `runReadinessCheck()` returns `score: <60` with empty .env
  - [ ] All functions are pure (no side effects, no fs.read, just consume passed data)

  **QA Scenarios**:

  ```
  Scenario: Full readiness check with valid test env returns green score
    Tool: Bash (node REPL)
    Preconditions: .env.test exists with valid values (COMPANY_NAME, COMPANY_EMAIL, COMPANY_NUMBER set)
    Steps:
      1. node -e "import('./src/lib/readiness.js').then(m => console.log(JSON.stringify(m.runReadinessCheck())))" with DOTENV_CONFIG_PATH=.env.test
      2. Assert score >= 85
      3. Assert result.verdict contains "GREEN" or "READY"
    Expected Result: Score 85-100, verdict green
    Evidence: .omo/evidence/task-2-green-score.txt

  Scenario: Readiness check with empty env returns red score (<60)
    Tool: Bash (node REPL)
    Preconditions: .env with all values empty
    Steps:
      1. Run runReadinessCheck() against empty env
      2. Assert score < 60
      3. Assert at least 3 checks failed
    Expected Result: Score < 60, multiple critical failures reported
    Evidence: .omo/evidence/task-2-red-score.txt
  ```

  **Commit**: YES
  - Message: `feat(readiness): add business readiness scoring library`
  - Files: `src/lib/readiness.js`, `test/unit/readiness.test.js`

- [ ] 3. Create financial dashboard library

  **What to do**:
  - Create `src/lib/dashboard.js` with exported function `buildDashboard()` that:
    - Calls `optimalSalary()` from `finances.js` → salary section
    - Takes `revenue` and `expenses` params, calls `fullStrategy(revenue, expenses)` → tax section
    - Calls `flatRateVat(revenue)` if revenue >= vatThreshold → VAT section
    - Reads dividend history from a local JSON file (`data/dividends.json`) → dividends section
    - Reads .env for PI_INSURANCE_EXPIRY, COMPANY_VAT_NUMBER → compliance section
    - Returns structured dashboard object: `{ salary, tax, vat, dividends, compliance, deadlines, summary }`
  - Also export `calculateDeadlines()` that computes days-until for: Self Assessment (31 Jan), Confirmation Statement (incorporation anniversary + 14 days), CT payment (9m+1d after year-end), ICO renewal (1 year from registration)
  - Reuse `src/lib/finances.js` functions — do NOT reimplement tax calculations

  **Must NOT do**:
  - Do NOT modify `src/lib/finances.js` calculations
  - Do NOT call Companies House API (just use .env dates)
  - Do NOT create data files — read-only until dividend module creates them

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Aggregator module — calls existing functions, formats output
  - **Skills**: []
  - **Skills Evaluated but Omitted**: None needed

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 4, 5)
  - **Blocks**: Task 7, Task 12
  - **Blocked By**: None (can start immediately)

  **References**:
  - API: `src/lib/finances.js:125-183` — `fullStrategy()` returns comprehensive tax/salary/pension object
  - API: `src/lib/finances.js:46-54` — `optimalSalary()` returns salary struct
  - API: `src/lib/finances.js:90-107` — `flatRateVat()` returns VAT calculations
  - API: `src/lib/finances.js:4-31` — `THRESHOLDS` object with all tax year constants
  - Pattern: `src/lib/finances.js:162-174` — How `fullStrategy` structures `withPension` and `noPension` sections

  **Acceptance Criteria**:
  - [ ] Test file: `test/unit/dashboard.test.js` — TDD: write tests BEFORE implementation
  - [ ] `buildDashboard(60000, 2000).salary.amount` returns 12570
  - [ ] `buildDashboard(60000, 2000).tax.corpTax` returns correct CT amount
  - [ ] `buildDashboard(120000, 2000).vat` returns VAT surplus > 0
  - [ ] `buildDashboard(30000, 2000).vat` is null (below threshold)
  - [ ] `calculateDeadlines()` returns array with at least 5 deadline objects, each with `{ label, date, daysUntil, urgency }`
  - [ ] `calculateDeadlines()` assigns `urgency: 'critical'` when < 7 days, `urgency: 'warning'` when < 30 days

  **QA Scenarios**:

  ```
  Scenario: Dashboard at £60k shows correct pension recommendation
    Tool: Bash (node REPL)
    Steps:
      1. node -e "import('./src/lib/dashboard.js').then(m => console.log(JSON.stringify(m.buildDashboard(60000,2000))))"
      2. Assert salary.amount === 12570
      3. Assert tax.withPension.pensionContribution > 0
      4. Assert summary.totalWealth > 50000
    Expected Result: Dashboard JSON with salary=12570, pension>0, total wealth>50k
    Evidence: .omo/evidence/task-3-dashboard-60k.json

  Scenario: Dashboard at £30k has no VAT section
    Tool: Bash (node REPL)
    Steps:
      1. node -e "import('./src/lib/dashboard.js').then(m => console.log(JSON.stringify(m.buildDashboard(30000,2000))))"
      2. Assert dashboard.vat is null or undefined
    Expected Result: VAT section absent for below-threshold revenue
    Evidence: .omo/evidence/task-3-no-vat.json
  ```

  **Commit**: YES
  - Message: `feat(dashboard): add financial dashboard aggregator`
  - Files: `src/lib/dashboard.js`, `test/unit/dashboard.test.js`

- [ ] 4. Create dividend voucher generator library

  **What to do**:
  - Create `src/lib/dividend.js` with exported functions:
    - `generateVoucher(vars)` — fills the dividend voucher template using `fillTemplate()` from legal.js, returns filled markdown string
    - `generateBoardMinutes(vars)` — fills the board minutes template, returns filled markdown string
    - `saveDividendRecord(vars, outputDir)` — saves voucher to `docs/legal_templates/` with filename `Dividend-{date}-{amount}.md`, and appends to `data/dividends.json` for dashboard tracking
    - `getDividendHistory()` — reads `data/dividends.json`, returns array of past dividends
    - `calculateDividendTax(dividendAmount, otherIncome)` — wraps `dividendTax()` from finances.js with human-readable output
  - Voucher vars: all from template placeholders + auto-fill from .env (company_name, company_number, director_name)

  **Must NOT do**:
  - Do NOT modify `src/lib/finances.js`
  - Do NOT modify `src/lib/legal.js`
  - Do NOT add PDF generation

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Template filling + JSON file I/O — straightforward composition of existing modules
  - **Skills**: []
  - **Skills Evaluated but Omitted**: None needed

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 5)
  - **Blocks**: Task 6, Task 11
  - **Blocked By**: Task 1 (templates must exist)

  **References**:
  - API: `src/lib/legal.js:22-28` — `fillTemplate(template, vars)` for variable substitution
  - API: `src/lib/legal.js:72-78` — `saveDocument(content, outputDir, filename)` for file output
  - API: `src/lib/finances.js:70-88` — `dividendTax(dividendIncome, otherIncome)` for tax calculation
  - Template: `templates/dividend-voucher.md` (created in Task 1) — Variable placeholders
  - Template: `templates/board-minutes.md` (created in Task 1) — Variable placeholders

  **Acceptance Criteria**:
  - [ ] Test file: `test/unit/dividend.test.js` — TDD: write tests BEFORE implementation
  - [ ] `generateVoucher({...})` returns string containing company name and dividend amount
  - [ ] `generateBoardMinutes({...})` returns string containing "directors' meeting" and resolution text
  - [ ] `saveDividendRecord(vars, './test-output')` creates file at correct path
  - [ ] `saveDividendRecord(vars, './test-output')` appends to `data/dividends.json`
  - [ ] `getDividendHistory()` returns empty array when no dividends recorded
  - [ ] `calculateDividendTax(10000, 12570)` returns tax > 0 (above allowance, above PA)
  - [ ] `calculateDividendTax(400, 0)` returns 0 (below £500 allowance)

  **QA Scenarios**:

  ```
  Scenario: Generate dividend voucher with real values
    Tool: Bash (node REPL)
    Preconditions: .env.test with COMPANY_NAME, COMPANY_NUMBER, COMPANY_DIRECTOR_NAME set
    Steps:
      1. node -e "import('./src/lib/dividend.js').then(m => console.log(m.generateVoucher({shareholder_name:'Charlie Macnamara',shareholder_address:'71-75 Shelton Street, London',dividend_amount:'5000',share_class:'Ordinary',date:'2026-06-14',shares_held:'100'})))"
      2. Assert output contains "Rennet Systems Ltd"
      3. Assert output contains "£5,000"
      4. Assert output contains "Charlie Macnamara"
    Expected Result: Valid voucher markdown with all required fields
    Evidence: .omo/evidence/task-4-voucher.md

  Scenario: Dividend tax calculation at basic rate
    Tool: Bash (node REPL)
    Steps:
      1. node -e "import('./src/lib/dividend.js').then(m => console.log(m.calculateDividendTax(10500,12570)))"
      2. Assert tax is positive (above £500 allowance)
    Expected Result: Tax amount ~£875 (8.75% of £10,000 above allowance)
    Evidence: .omo/evidence/task-4-dividend-tax.txt
  ```

  **Commit**: YES
  - Message: `feat(dividend): add dividend voucher and board minutes generator`
  - Files: `src/lib/dividend.js`, `test/unit/dividend.test.js`

- [ ] 5. Extract calendar date logic into reusable library and enhance

  **What to do**:
  - Create `src/lib/calendar.js` (library) to extract deadline logic from `scripts/calendar.js` (script):
    - `getDeadlines(env)` — returns all deadline objects with computed dates from .env values: PI_INSURANCE_EXPIRY → insurance renewal date, incorporation date (new .env var `COMPANY_INCORPORATION_DATE`) → confirmation statement + CT deadlines, ICO registration date (new .env var `ICO_REGISTRATION_DATE`) → ICO renewal
    - `getUrgency(daysUntil)` — returns `{ level: 'critical'|'warning'|'ok', symbol: '🔴'|'🟡'|'🟢', message: string }` based on days remaining: critical < 7, warning < 30, ok >= 30
    - `getQuarterlyDeadlines(year)` — returns 4 VAT quarters with due dates (1 month + 7 days after quarter end)
    - `getUpcomingDeadlines(deadlines, count)` — returns next N upcoming deadlines sorted by date
  - The script `scripts/calendar.js` will be refactored in Task 9 to USE this library
  - Add 2 new .env variables to `.env.example`: `COMPANY_INCORPORATION_DATE`, `ICO_REGISTRATION_DATE`

  **Must NOT do**:
  - Do NOT duplicate the existing `daysUntil()` function in calendar.js — extract and enhance

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Pure date math + env reading, no external APIs
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 4)
  - **Blocks**: Task 9
  - **Blocked By**: None (can start immediately)

  **References**:
  - Existing: `scripts/calendar.js:9-18` — `daysUntil()` function with colour-coded urgency logic
  - Existing: `scripts/calendar.js:46-49` — Annual deadlines list with date format `YYYY-MM-DD`
  - Pattern: `.env.example` — Current env variable format
  - Pattern: `scripts/health-check.js:109-121` — PI insurance expiry date parsing with days-left calculation

  **Acceptance Criteria**:
  - [ ] Test file: `test/unit/calendar.test.js` — TDD: write tests BEFORE implementation
  - [ ] `getUrgency(3)` returns `{ level: 'critical' }`
  - [ ] `getUrgency(14)` returns `{ level: 'warning' }`
  - [ ] `getUrgency(60)` returns `{ level: 'ok' }`
  - [ ] `getQuarterlyDeadlines(2026)` returns 4 deadline objects with correct due dates
  - [ ] `getUpcomingDeadlines(deadlines, 3)` returns 3 soonest deadlines
  - [ ] `.env.example` has COMPANY_INCORPORATION_DATE and ICO_REGISTRATION_DATE

  **QA Scenarios**:

  ```
  Scenario: Urgency levels correctly categorised
    Tool: Bash (node REPL)
    Steps:
      1. node -e "import('./src/lib/calendar.js').then(m => console.log(JSON.stringify({d1:m.getUrgency(1),d2:m.getUrgency(14),d3:m.getUrgency(60),d4:m.getUrgency(-1)})))"
      2. Assert d1.level === 'critical'
      3. Assert d2.level === 'warning'
      4. Assert d3.level === 'ok'
      5. Assert d4.level === 'critical' (overdue = critical)
    Expected Result: All 4 urgency levels correctly assigned
    Evidence: .omo/evidence/task-5-urgency.json

  Scenario: Quarterly VAT deadlines computed correctly
    Tool: Bash (node REPL)
    Steps:
      1. node -e "import('./src/lib/calendar.js').then(m => console.log(JSON.stringify(m.getQuarterlyDeadlines(2026))))"
      2. Assert Q1 end = 2026-03-31, due = 2026-05-07
    Expected Result: 4 quarters with correct end dates and due dates (1m+7d after end)
    Evidence: .omo/evidence/task-5-quarters.json
  ```

  **Commit**: YES
  - Message: `feat(calendar): extract deadline logic into reusable library with urgency scoring`
  - Files: `src/lib/calendar.js`, `test/unit/calendar.test.js`, `.env.example`

- [ ] 6. Create dividend CLI script

  **What to do**:
  - Create `scripts/dividend.js` that:
    - Reads .env for auto-fill (COMPANY_NAME, COMPANY_NUMBER, COMPANY_DIRECTOR_NAME, COMPANY_ADDRESS)
    - Takes amount as CLI arg: `npm run dividend -- 5000`
    - If no amount: shows interactive prompts (shareholder name, amount, date — or press Enter for today)
    - Generates voucher + board minutes using `src/lib/dividend.js`
    - Saves files to `docs/legal_templates/`
    - Also logs to `data/dividends.json` for dashboard tracking
    - Shows dividend tax estimate using `calculateDividendTax()`
    - Warns if total dividends + salary exceeds higher rate threshold
  - Follow pattern from `scripts/generate-contract.js` but FIX the top-level await issue — use a `main()` async function wrapper
  - Register as `dividend` in `src/index.js` and `package.json` (Task 14 batch)

  **Must NOT do**:
  - Do NOT use top-level await (contract script has this bug — fix the pattern)
  - Do NOT require interactivity — support CLI arg as primary input

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: CLI script composing existing library functions
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 7, 8, 9, 10)
  - **Blocks**: None
  - **Blocked By**: Tasks 1, 4

  **References**:
  - Pattern: `scripts/generate-contract.js:1-56` — Interactive CLI using readline/promises — but use `main()` wrapper
  - API: `src/lib/dividend.js` (Task 4) — `generateVoucher()`, `generateBoardMinutes()`, `saveDividendRecord()`, `calculateDividendTax()`
  - Pattern: `scripts/generate-policy.js` — Non-interactive CLI that takes arg directly
  - Logger: `src/lib/logger.js` — `logger.header()`, `logger.tick()`, `logger.ok()`, `logger.warn()`

  **Acceptance Criteria**:
  - [ ] `npm run dividend -- 5000` generates voucher + minutes files without interaction
  - [ ] `npm run dividend` (no args) shows usage instructions
  - [ ] Generated voucher saves to `docs/legal_templates/Dividend-{date}-5000.md`
  - [ ] Generated minutes save to `docs/legal_templates/Board-Minutes-{date}.md`
  - [ ] Script exits 0 on success, 1 on error

  **QA Scenarios**:

  ```
  Scenario: Generate dividend voucher via CLI with amount arg
    Tool: interactive_bash (tmux)
    Preconditions: .env.test with real values
    Steps:
      1. Run: npm run dividend -- 5000
      2. Wait for exit code
      3. Assert exit code = 0
      4. Check file exists: ls docs/legal_templates/Dividend-*.md
    Expected Result: Exit code 0, two files generated (voucher + minutes), voucher contains "£5,000"
    Evidence: .omo/evidence/task-6-dividend-cli.txt

  Scenario: Dividend CLI without args shows help
    Tool: interactive_bash (tmux)
    Steps:
      1. Run: npm run dividend
      2. Assert output contains "Usage" or "npm run dividend -- AMOUNT"
    Expected Result: Help text shown, exit code 1
    Evidence: .omo/evidence/task-6-dividend-help.txt
  ```

  **Commit**: YES
  - Message: `feat(dividend): add dividend voucher CLI script`
  - Files: `scripts/dividend.js`

- [ ] 7. Create financial dashboard CLI script

  **What to do**:
  - Create `scripts/dashboard.js` that:
    - Takes optional revenue arg: `npm run dashboard -- 60000`
    - If no arg: reads previous year revenue from .env or `data/finances.json`
    - Calls `buildDashboard()` from `src/lib/dashboard.js`
    - Displays formatted dashboard with sections:
      1. **Salary** — optimal salary, employer NI, take-home
      2. **Tax** — corp tax (no pension vs with pension), dividend tax estimate
      3. **VAT** — flat rate vs standard comparison, surplus, registration status
      4. **Dividends** — YTD from `data/dividends.json`, remaining allowance
      5. **Deadlines** — next 5 upcoming with urgency indicators
      6. **Insurance** — PI insurance status, days until expiry
    - Uses `logger.header()`, `logger.section()`, `logger.tick()` / `logger.cross()` / `logger.warn()` for colour output
  - Register as `dashboard` in `src/index.js` and `package.json` (Task 14 batch)

  **Must NOT do**:
  - Do NOT make API calls — all data from .env + local calculations
  - Do NOT duplicate strategy output format — dashboard is a summary view

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Display script formatting existing library data
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 8, 9, 10)
  - **Blocks**: None
  - **Blocked By**: Task 3

  **References**:
  - API: `src/lib/dashboard.js` (Task 3) — `buildDashboard()`, `calculateDeadlines()`
  - Pattern: `scripts/tax-strategy.js` — Multi-section output with `logger.header()`, `logger.section()`, `logger.rule()`
  - Logger: `src/lib/logger.js` — All available formatting functions

  **Acceptance Criteria**:
  - [ ] `npm run dashboard -- 60000` displays all 6 sections
  - [ ] Output includes "Optimal Salary: £12,570"
  - [ ] Output includes urgency indicators (🔴/🟡/🟢) for deadlines
  - [ ] Output includes dividend YTD section (empty if no dividends)
  - [ ] Exit code 0

  **QA Scenarios**:

  ```
  Scenario: Dashboard at £60k shows complete financial picture
    Tool: interactive_bash (tmux)
    Preconditions: .env.test with valid values, no dividend history
    Steps:
      1. Run: npm run dashboard -- 60000
      2. Assert output contains "Salary" section
      3. Assert output contains "Corporation Tax" section
      4. Assert output contains "VAT" section
      5. Assert output contains "Deadlines" section
      6. Assert output contains "Insurance" section
    Expected Result: All 6 sections present, exit code 0
    Evidence: .omo/evidence/task-7-dashboard.txt

  Scenario: Dashboard without revenue arg shows usage
    Tool: interactive_bash (tmux)
    Steps:
      1. Run: npm run dashboard
      2. Assert output contains "Usage" or shows help
    Expected Result: Clear guidance on required arg
    Evidence: .omo/evidence/task-7-dashboard-help.txt
  ```

  **Commit**: YES
  - Message: `feat(dashboard): add financial dashboard CLI`
  - Files: `scripts/dashboard.js`

- [ ] 8. Create readiness CLI script

  **What to do**:
  - Create `scripts/readiness.js` that:
    - Calls `runReadinessCheck()` from `src/lib/readiness.js`
    - Displays formatted output with categories:
      - **Environment** (COMPANY_NAME, COMPANY_EMAIL, etc.)
      - **Templates** (all 6 templates present)
      - **API Keys** (Companies House key present)
      - **Insurance** (PI insurance valid)
      - **Company Details** (number, address, director set)
    - Shows overall score with colour: Red (<60%), Amber (60-84%), Green (85%+)
    - Shows per-category pass/warn/fail with details
    - Exits 0 if green, 1 if red, 0 if amber (warning only)
  - Follow `scripts/verify-setup.js` output style (checkmarks, crosses, section headers)
  - Register as `readiness` in `src/index.js` and `package.json` (Task 14 batch)

  **Must NOT do**:
  - Do NOT duplicate health-check functionality — readiness is broader (business readiness ≠ system health)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Display script calling existing library
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 7, 9, 10)
  - **Blocks**: Task 15
  - **Blocked By**: Task 2

  **References**:
  - API: `src/lib/readiness.js` (Task 2) — `runReadinessCheck()`
  - Pattern: `scripts/verify-setup.js` — Test-runner style output with PASS/FAIL and sections
  - Pattern: `scripts/health-check.js` — Multi-section check with colour output
  - Logger: `src/lib/logger.js` — All available formatting functions

  **Acceptance Criteria**:
  - [ ] `npm run readiness` runs all checks and displays score
  - [ ] Output shows per-category breakdown with pass/fail icons
  - [ ] Score is a percentage of checks passed
  - [ ] Exit code 0 for green, 1 for red
  - [ ] All 5 categories displayed (Environment, Templates, API Keys, Insurance, Company)

  **QA Scenarios**:

  ```
  Scenario: Readiness with valid .env.test returns green
    Tool: interactive_bash (tmux)
    Preconditions: .env.test with all critical values set
    Steps:
      1. Run: npm run readiness
      2. Assert exit code = 0
      3. Assert output contains score percentage
      4. Assert output contains green indicator or "READY"
    Expected Result: Score >= 85%, exit 0
    Evidence: .omo/evidence/task-8-readiness-green.txt

  Scenario: Readiness with missing env values returns red
    Tool: interactive_bash (tmux)
    Preconditions: .env with COMPANY_EMAIL and COMPANY_NUMBER empty
    Steps:
      1. Run: npm run readiness
      2. Assert exit code = 1
      3. Assert output shows missing COMPANY_EMAIL
    Expected Result: Score < 60%, exit 1, specific failures listed
    Evidence: .omo/evidence/task-8-readiness-red.txt
  ```

  **Commit**: YES
  - Message: `feat(readiness): add pre-launch readiness CLI`
  - Files: `scripts/readiness.js`

- [ ] 9. Refactor calendar CLI to use new library with real dates

  **What to do**:
  - Refactor `scripts/calendar.js` to import and use `src/lib/calendar.js` (Task 5):
    - Replace inline `daysUntil()` with `getUrgency()` from library
    - Replace hardcoded date strings with `getDeadlines(env)` computed dates
    - Add urgency indicators (🔴 critical, 🟡 warning, 🟢 ok) next to each deadline
    - Keep all existing static content (Phase 0 steps, annual reminders) — enhance, don't replace
    - Add "Next 5 Deadlines" summary at the top with urgency levels
    - Read COMPANY_INCORPORATION_DATE and ICO_REGISTRATION_DATE from .env for real computed dates
  - The existing calendar is 81 lines of static text — extend to ~120 lines with real computed dates

  **Must NOT do**:
  - Do NOT remove existing static content (formation steps, ongoing reminders)
  - Do NOT change the calendar command name

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Script refactoring to use new library
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 7, 8, 10)
  - **Blocks**: None
  - **Blocked By**: Task 5

  **References**:
  - API: `src/lib/calendar.js` (Task 5) — `getDeadlines()`, `getUrgency()`, `getQuarterlyDeadlines()`, `getUpcomingDeadlines()`
  - Existing: `scripts/calendar.js` — Full script to refactor (81 lines)
  - Logger: `src/lib/logger.js` — Formatting functions

  **Acceptance Criteria**:
  - [ ] `npm run calendar` shows deadlines with 🔴/🟡/🟢 urgency indicators
  - [ ] "Next 5 Deadlines" section appears at top with soonest first
  - [ ] All original static content preserved (formation steps, quarterly reminders, ongoing)
  - [ ] If COMPANY_INCORPORATION_DATE is set in .env, shows computed CT + confirmation statement dates
  - [ ] If ICO_REGISTRATION_DATE is set in .env, shows computed ICO renewal date
  - [ ] Exit code 0 always (informational command)

  **QA Scenarios**:

  ```
  Scenario: Calendar shows urgency indicators with real dates
    Tool: interactive_bash (tmux)
    Preconditions: .env.test with PI_INSURANCE_EXPIRY=2027-06-30, COMPANY_INCORPORATION_DATE=2026-01-15, ICO_REGISTRATION_DATE=2026-02-01
    Steps:
      1. Run: npm run calendar
      2. Assert output contains "Next 5 Deadlines" section
      3. Assert output contains urgency indicators (🔴 or 🟡 or 🟢)
      4. Assert output contains "Self Assessment filing deadline"
    Expected Result: Calendar with sorted deadlines, urgency levels, original content intact
    Evidence: .omo/evidence/task-9-calendar.txt

  Scenario: Calendar works without incorporation date set
    Tool: interactive_bash (tmux)
    Preconditions: .env without COMPANY_INCORPORATION_DATE
    Steps:
      1. Run: npm run calendar
      2. Assert no crash/error
      3. Assert output contains static content
    Expected Result: Graceful fallback — shows static deadlines, no error for missing dates
    Evidence: .omo/evidence/task-9-calendar-no-dates.txt
  ```

  **Commit**: YES
  - Message: `refactor(calendar): use calendar library with real dates and urgency scoring`
  - Files: `scripts/calendar.js`

- [ ] 10. Add strategy comparison mode

  **What to do**:
  - Enhance `scripts/tax-strategy.js` to support `compare` sub-command:
    - `npm run strategy -- compare 80000 120000` — compares two revenue scenarios side-by-side
    - Uses existing `fullStrategy()` from finances.js — no new calculations
    - Displays comparison table: revenue, salary, employer NI, corp tax (no pension), corp tax (with pension), net take-home, total wealth, VAT surplus
    - Highlights differences with +/- delta column
    - If no revenue args given, keeps existing behaviour (reference table for 5 scenarios)
  - Add flag detection: if first arg is "compare", parse the next two as revenue values

  **Must NOT do**:
  - Do NOT modify `src/lib/finances.js`
  - Do NOT break existing `npm run strategy -- 60000` behaviour

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: CLI enhancement adding a comparison sub-mode
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 7, 8, 9)
  - **Blocks**: None
  - **Blocked By**: None (uses existing finances.js)

  **References**:
  - API: `src/lib/finances.js:125-183` — `fullStrategy(revenue, expenses)` returns complete tax plan
  - Existing: `scripts/tax-strategy.js:6-35` — Current arg parsing and fallback to reference table
  - Logger: `src/lib/logger.js` — `logger.table()` for comparison table output

  **Acceptance Criteria**:
  - [ ] `npm run strategy -- compare 80000 120000` shows side-by-side comparison
  - [ ] Comparison includes at least 8 rows (revenue, salary, NI, CT-no-pension, CT-with-pension, take-home, wealth, VAT)
  - [ ] Delta column shows £ differences between scenarios
  - [ ] `npm run strategy -- 60000` still works as before (no regression)
  - [ ] `npm run strategy` (no args) still shows reference table (no regression)

  **QA Scenarios**:

  ```
  Scenario: Strategy comparison shows meaningful differences
    Tool: interactive_bash (tmux)
    Steps:
      1. Run: npm run strategy -- compare 80000 120000
      2. Assert output contains "£80,000" and "£120,000"
      3. Assert output contains "VAT surplus" for £120k (above threshold)
      4. Assert delta column shows difference in total wealth
    Expected Result: Side-by-side table with at least 8 metrics and delta column
    Evidence: .omo/evidence/task-10-compare.txt

  Scenario: Existing single-revenue mode still works
    Tool: interactive_bash (tmux)
    Steps:
      1. Run: npm run strategy -- 60000
      2. Assert output contains "Tax Strategy — £60,000/yr"
      3. Assert output contains "Corporation Tax"
    Expected Result: Original behaviour unchanged
    Evidence: .omo/evidence/task-10-no-regression.txt
  ```

  **Commit**: YES
  - Message: `feat(strategy): add compare mode for side-by-side revenue scenarios`
  - Files: `scripts/tax-strategy.js`

- [ ] 11. Write dividend voucher unit tests (TDD)

  **What to do**:
  - Create `test/unit/dividend.test.js` following existing vitest patterns:
    - Use `describe/it/expect` from vitest
    - Mock `fs` operations using `vi.mock('fs')` or temp directory approach
    - Test all exported functions from `src/lib/dividend.js`
  - Test cases:
    - `generateVoucher()` with all vars → output contains all required fields
    - `generateVoucher()` with missing optional vars → graceful fallback
    - `generateBoardMinutes()` → output contains meeting date and resolution
    - `saveDividendRecord()` → creates file at correct path with correct content
    - `saveDividendRecord()` → appends to dividends.json (create if not exists)
    - `getDividendHistory()` on empty state → returns []
    - `getDividendHistory()` after save → returns array with saved record
    - `calculateDividendTax(10000, 12570)` → returns correct amount
    - `calculateDividendTax(400, 0)` → returns 0 (below allowance)
    - `calculateDividendTax(50000, 12570)` → higher rate applies

  **Must NOT do**:
  - Do NOT test template files directly (that's contract test territory)
  - Do NOT modify source files — test-only

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Standard unit test writing following existing patterns
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 7, 8, 9, 10, 12, 13)
  - **Blocks**: None
  - **Blocked By**: Task 4 (dividend lib must exist first)

  **References**:
  - Pattern: `test/unit/finances.test.js` — Vitest describe/it/expect pattern
  - Pattern: `test/unit/legal.test.js:1-14` — Import pattern for ES modules
  - API: `src/lib/dividend.js` (Task 4) — Functions to test
  - Vitest docs: `vi.mock()` for filesystem mocking

  **Acceptance Criteria**:
  - [ ] Test file exists: `test/unit/dividend.test.js`
  - [ ] At least 10 test cases covering all public functions
  - [ ] `npm test` — all tests pass (188 existing + ~12 new = ~200)
  - [ ] Tests are pure unit tests (mock fs, no real file I/O)

  **QA Scenarios**: *(Tests are themselves QA — verify via `npm test`)*

  ```
  Scenario: All dividend unit tests pass
    Tool: Bash
    Steps:
      1. Run: npm test -- test/unit/dividend.test.js
      2. Assert exit code 0
      3. Assert "Tests  N passed" with N >= 10
    Expected Result: All dividend tests pass
    Evidence: .omo/evidence/task-11-dividend-tests.txt
  ```

  **Commit**: YES (groups with Task 4 — amend or same commit)
  - Message: `test(dividend): add unit tests for dividend voucher generator`
  - Files: `test/unit/dividend.test.js`

- [ ] 12. Write dashboard unit tests (TDD)

  **What to do**:
  - Create `test/unit/dashboard.test.js` following existing vitest patterns:
    - Test `buildDashboard()` at multiple revenue levels: 0, 30000, 60000, 90000, 120000, 150000
    - Test `calculateDeadlines()` with mock dates and mock .env values
  - Test cases:
    - Dashboard at £60k → salary = 12570, corpTax > 0, totalWealth > 50000
    - Dashboard at £30k → vat section absent, corpTax at 19%
    - Dashboard at £0 → no errors, all values 0 or null
    - Dashboard at £120k → vat surplus > 0, VAT required warning
    - `calculateDeadlines()` → returns array with correct urgency levels
    - `calculateDeadlines()` → PI insurance 5 days away = critical urgency
    - `calculateDeadlines()` → Self Assessment due 31 Jan = correct days calculation
    - Edge case: negative revenue → handled gracefully

  **Must NOT do**:
  - Do NOT modify `src/lib/finances.js`

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Standard unit tests for pure computation module
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 7, 8, 9, 10, 11, 13)
  - **Blocks**: None
  - **Blocked By**: Task 3 (dashboard lib must exist first)

  **References**:
  - Pattern: `test/unit/finances.test.js:15-50` — Testing tax functions at boundary values
  - Pattern: `test/unit/compliance.test.js` — Testing structured check objects
  - API: `src/lib/dashboard.js` (Task 3) — Functions to test

  **Acceptance Criteria**:
  - [ ] Test file exists: `test/unit/dashboard.test.js`
  - [ ] At least 8 test cases covering buildDashboard at multiple revenue levels
  - [ ] At least 4 test cases for calculateDeadlines
  - [ ] `npm test` — all tests pass (~200 total)

  **QA Scenarios**: *(Tests are themselves QA — verify via `npm test`)*

  ```
  Scenario: All dashboard unit tests pass
    Tool: Bash
    Steps:
      1. Run: npm test -- test/unit/dashboard.test.js
      2. Assert exit code 0
      3. Assert tests >= 12
    Expected Result: All dashboard tests pass
    Evidence: .omo/evidence/task-12-dashboard-tests.txt
  ```

  **Commit**: YES (groups with Task 3)
  - Message: `test(dashboard): add unit tests for financial dashboard`
  - Files: `test/unit/dashboard.test.js`

- [ ] 13. Write readiness unit tests (TDD)

  **What to do**:
  - Create `test/unit/readiness.test.js` following existing vitest patterns:
    - Test each check function individually with controlled env objects
    - Test `runReadinessCheck()` with valid and invalid env configurations
  - Test cases:
    - `checkEnv()` → all required set → all pass
    - `checkEnv()` → COMPANY_EMAIL missing → critical failure
    - `checkEnv()` → values with `[bracket]` placeholders → fail
    - `checkInsurance()` → future date → pass
    - `checkInsurance()` → past date → critical failure
    - `checkInsurance()` → not set → warning (not critical, optional)
    - `checkCompany()` → COMPANY_NUMBER set → pass
    - `checkCompany()` → COMPANY_NUMBER missing → critical
    - `runReadinessCheck()` → all checks pass → score 100
    - `runReadinessCheck()` → 2 failures → score ~75-80%
    - `runReadinessCheck()` → all failures → score 0-20%

  **Must NOT do**:
  - Do NOT require real .env file — pass env objects to functions

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Standard unit tests for validation module
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6-12)
  - **Blocks**: None
  - **Blocked By**: Task 2 (readiness lib must exist first)

  **References**:
  - Pattern: `test/unit/app-store.test.js` — Testing check functions with controlled inputs
  - Pattern: `test/unit/compliance.test.js` — Testing structured check results
  - API: `src/lib/readiness.js` (Task 2) — Functions to test

  **Acceptance Criteria**:
  - [ ] Test file exists: `test/unit/readiness.test.js`
  - [ ] At least 11 test cases covering all check functions
  - [ ] Tests pass with controlled env objects (no real .env dependency)
  - [ ] `npm test` — all tests pass (~200 total)

  **QA Scenarios**: *(Tests are themselves QA — verify via `npm test`)*

  ```
  Scenario: All readiness unit tests pass
    Tool: Bash
    Steps:
      1. Run: npm test -- test/unit/readiness.test.js
      2. Assert exit code 0
      3. Assert tests >= 11
    Expected Result: All readiness tests pass
    Evidence: .omo/evidence/task-13-readiness-tests.txt
  ```

  **Commit**: YES (groups with Task 2)
  - Message: `test(readiness): add unit tests for business readiness scoring`
  - Files: `test/unit/readiness.test.js`

- [ ] 14. Register all new commands in CLI router and package.json

  **What to do**:
  - Update `src/index.js`:
    - Add `dividend` command pointing to `../scripts/dividend.js`
    - Add `dashboard` command pointing to `../scripts/dashboard.js`
    - Add `readiness` command pointing to `../scripts/readiness.js`
    - Update help text to show new commands
  - Update `package.json`:
    - Add `"dividend": "node scripts/dividend.js"` to scripts
    - Add `"dashboard": "node scripts/dashboard.js"` to scripts
    - Add `"readiness": "node scripts/readiness.js"` to scripts
  - Update `TODO.md` to reference new commands

  **Must NOT do**:
  - Do NOT remove or rename existing commands
  - Do NOT change command API for existing tools

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple config file edits
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO — depends on all CLI scripts
  - **Parallel Group**: Wave 3 (before Task 15)
  - **Blocks**: Task 15
  - **Blocked By**: Tasks 6, 7, 8, 9, 10

  **References**:
  - File: `src/index.js:12-28` — Current commands map format
  - File: `package.json:7-29` — Current npm scripts
  - File: `TODO.md` — Current checklist referencing old commands

  **Acceptance Criteria**:
  - [ ] `npm start help` shows dividend, dashboard, readiness in command list
  - [ ] `npm run dividend -- 5000` works as registered npm script
  - [ ] `npm run dashboard -- 60000` works as registered npm script
  - [ ] `npm run readiness` works as registered npm script
  - [ ] `npm start dividend -- 5000` works via CLI router

  **QA Scenarios**:

  ```
  Scenario: Help command lists all new commands
    Tool: Bash
    Steps:
      1. Run: npm start help
      2. Assert output contains "dividend"
      3. Assert output contains "dashboard"
      4. Assert output contains "readiness"
    Expected Result: All 3 new commands visible in help output
    Evidence: .omo/evidence/task-14-help.txt

  Scenario: New commands registered in package.json
    Tool: Bash (grep)
    Steps:
      1. Run: node -e "const p=require('./package.json'); console.log(Object.keys(p.scripts).filter(k=>['dividend','dashboard','readiness'].includes(k)))"
      2. Assert output contains all 3 command names
    Expected Result: All 3 npm scripts registered
    Evidence: .omo/evidence/task-14-scripts.txt
  ```

  **Commit**: YES
  - Message: `feat(cli): register dividend, dashboard, readiness commands`
  - Files: `src/index.js`, `package.json`, `TODO.md`

- [ ] 15. Integration test: full readiness → dashboard → dividend workflow

  **What to do**:
  - Create `test/integration/business-security.test.js`:
    - Test complete workflow: run readiness check → generate dashboard → create dividend voucher → verify calendar
    - Uses temp .env and temp output directory
    - Verifies files created, JSON records updated, exit codes correct
  - Test cases:
    - Full workflow with valid .env — all steps succeed
    - Readiness reports green after all checks configured
    - Dashboard shows zero dividends when no history
    - After dividend generated, dashboard shows YTD dividend
    - Calendar shows deadlines after env dates set
  - Clean up temp files after tests (afterEach/afterAll hooks)

  **Must NOT do**:
  - Do NOT use real .env — create temp .env in test
  - Do NOT leave generated files on disk

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Integration test composing existing modules
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO — runs after all implementation
  - **Parallel Group**: Wave 3 (final Validation)
  - **Blocks**: None
  - **Blocked By**: Task 14

  **References**:
  - Pattern: `test/integration/app-store.test.js` — Integration test with module imports
  - Pattern: `test/integration/compliance.test.js` — Integration test with setup/teardown
  - All lib modules: `src/lib/readiness.js`, `src/lib/dividend.js`, `src/lib/dashboard.js`, `src/lib/calendar.js`

  **Acceptance Criteria**:
  - [ ] Test file exists: `test/integration/business-security.test.js`
  - [ ] Full workflow test passes (readiness → dashboard → dividend → calendar)
  - [ ] Temp files cleaned up after test
  - [ ] `npm test` — all tests pass (~205 total)

  **QA Scenarios**: *(Tests are themselves QA — verify via `npm test`)*

  ```
  Scenario: Integration workflow test passes
    Tool: Bash
    Steps:
      1. Run: npm test -- test/integration/business-security.test.js
      2. Assert exit code 0
      3. Assert all workflow steps pass
    Expected Result: End-to-end workflow verified
    Evidence: .omo/evidence/task-15-integration.txt
  ```

  **Commit**: YES
  - Message: `test(integration): add business security workflow integration test`
  - Files: `test/integration/business-security.test.js`

- [ ] 16. Run full test suite and verify:setup

  **What to do**:
  - Run `npm test` — verify all existing + new tests pass
  - Run `npm run verify:setup` — verify template count, script integrity, module imports updated
  - Run all new CLI commands end-to-end:
    - `npm run readiness` → green score
    - `npm run dashboard -- 60000` → complete output
    - `npm run dividend -- 1000` → file generated
    - `npm run calendar` → urgency indicators
    - `npm run strategy -- compare 80000 120000` → comparison table
  - Fix any issues found
  - Clean up test-generated files

  **Must NOT do**:
  - Do NOT commit test-generated files to repo

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Verification and cleanup
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO — final verification
  - **Parallel Group**: Wave 3 (after all implementation)
  - **Blocks**: FINAL wave
  - **Blocked By**: Task 15

  **References**:
  - Command: `npm test` — Full vitest suite
  - Command: `npm run verify:setup` — Integration smoke test
  - All new scripts: `dividend.js`, `dashboard.js`, `readiness.js`

  **Acceptance Criteria**:
  - [ ] `npm test` — 200+ tests pass, 0 failures
  - [ ] `npm run verify:setup` — all 72 checks pass
  - [ ] `npm run readiness` — green score
  - [ ] `npm run dashboard -- 60000` — exit 0, correct output
  - [ ] `npm run dividend -- 1000` — exit 0, file created
  - [ ] `npm run calendar` — exit 0, urgency indicators present
  - [ ] `npm run strategy -- compare 80000 120000` — exit 0, comparison shown

  **QA Scenarios**:

  ```
  Scenario: Full test suite passes
    Tool: Bash
    Steps:
      1. Run: npm test
      2. Assert exit code 0
      3. Assert "Tests  N passed" with N >= 200
    Expected Result: All tests green, no failures
    Evidence: .omo/evidence/task-16-test-suite.txt

  Scenario: Verify setup passes with new modules
    Tool: Bash
    Steps:
      1. Run: npm run verify:setup
      2. Assert exit code 0
      3. Assert output contains "All systems operational"
    Expected Result: 72 checks pass including new libs and scripts
    Evidence: .omo/evidence/task-16-verify-setup.txt
  ```

  **Commit**: NO (verification only)

---

## Final Verification Wave

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in `.omo/evidence/`. Compare deliverables against plan.
  Output: `Must Have [5/5] | Must NOT Have [9/9] | Tasks [16/16] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `npm test` (verify 200+ tests pass). Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in lib code, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp). Verify no top-level await in new scripts.
  Output: `Build [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high`
  Start from clean state (.env.example → .env with test values). Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration: readiness → dashboard → dividend → calendar workflow. Test edge cases: zero revenue dashboard, huge dividend amount, missing env vars.
  Save to `.omo/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination: Task N touching Task M's files. Flag unaccounted changes.
  Output: `Tasks [16/16 compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **1**: `feat(templates): add dividend voucher and board minutes templates` — templates/dividend-voucher.md, templates/board-minutes.md
- **2**: `feat(readiness): add business readiness scoring library` — src/lib/readiness.js, test/unit/readiness.test.js
- **3**: `feat(dashboard): add financial dashboard aggregator` — src/lib/dashboard.js, test/unit/dashboard.test.js
- **4**: `feat(dividend): add dividend voucher generator library` — src/lib/dividend.js, test/unit/dividend.test.js
- **5**: `feat(calendar): extract deadline logic into reusable library` — src/lib/calendar.js, test/unit/calendar.test.js, .env.example
- **6**: `feat(dividend): add dividend voucher CLI script` — scripts/dividend.js
- **7**: `feat(dashboard): add financial dashboard CLI` — scripts/dashboard.js
- **8**: `feat(readiness): add pre-launch readiness CLI` — scripts/readiness.js
- **9**: `refactor(calendar): use calendar library with real dates` — scripts/calendar.js
- **10**: `feat(strategy): add compare mode for revenue scenarios` — scripts/tax-strategy.js
- **11**: (groups with 4) `test(dividend): add unit tests`
- **12**: (groups with 3) `test(dashboard): add unit tests`
- **13**: (groups with 2) `test(readiness): add unit tests`
- **14**: `feat(cli): register new commands` — src/index.js, package.json, TODO.md
- **15**: `test(integration): add business security workflow test` — test/integration/business-security.test.js

---

## Success Criteria

### Verification Commands
```bash
npm test                                    # Expected: 200+ tests pass, 0 failures
npm run verify:setup                        # Expected: 72 passes, "All systems operational"
npm run readiness                           # Expected: green score, exit 0
npm run dashboard -- 60000                  # Expected: all 6 sections, exit 0
npm run dividend -- 5000                    # Expected: voucher + minutes generated, exit 0
npm run calendar                            # Expected: urgency indicators, exit 0
npm run strategy -- compare 80000 120000    # Expected: comparison table, exit 0
npm run strategy -- 60000                   # Expected: unchanged behaviour, exit 0
npm start help                              # Expected: all new commands listed
```

### Final Checklist
- [ ] All 5 "Must Have" features implemented and working
- [ ] All 9 "Must NOT Have" guardrails respected
- [ ] 200+ tests pass (188 existing + 15-20 new)
- [ ] verify:setup unchanged at 72 passes
- [ ] No top-level await in new scripts
- [ ] No production dependencies added
- [ ] All templates in `templates/` directory
- [ ] All generated files go to `docs/legal_templates/`
- [ ] Dividend history tracked in `data/dividends.json`
