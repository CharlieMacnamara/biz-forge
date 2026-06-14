# bizforge

**Modular business operations CLI** — replace £3k-5k/yr in professional services
with free UK government APIs + LLM.

```
npm run strategy -- 60000      # Tax plan
npm run screen -- "Brand"      # Brand + domain screening
npm run contract               # Generate SOW
npm run audit -- example.com   # GDPR scan
npm run ask -- "VAT rules?"    # AI business advisor
```

---

## Quickstart

```bash
cp .env.example .env                    # Create config
# Edit .env: set COMPANY_NAME, COMPANY_EMAIL, COMPANIES_HOUSE_API_KEY
npm run setup                           # Formation walkthrough
npm run readiness                       # Check everything is configured (aim for GREEN)
npm run health                          # Verify API keys + domains + insurance
npm run policy -- privacy               # Generate UK GDPR privacy policy
npm run strategy -- 60000               # See your tax plan
npm run calendar                        # See your deadlines with 🔴🟡🟢 urgency
```

See [Usage Workflow](#usage-workflow) for the full daily/monthly/quarterly routine.

---

## Commands

### Business Operations

| Command | What it does | Needs API Key? |
|---------|-------------|:--------------:|
| `npm run screen -- "Brand"` | Companies House + domain conflict check | ✅ `COMPANIES_HOUSE_API_KEY` |
| `npm run verify -- 12345678` | Client company due diligence (profile, officers, filings) | ✅ `COMPANIES_HOUSE_API_KEY` |
| `npm run domain -- "name .com"` | Domain availability/expiry check via WHOIS | ❌ Free |
| `npm run contract` | Generate SOW for a client (interactive) | ❌ Free |
| `npm run policy -- privacy\|terms\|cookies` | Generate UK GDPR policies | ❌ Free |
| `npm run audit -- https://site.com` | GDPR/PECR compliance scan (8 checks) | ❌ Free |

### Finance & Tax (Accountant Replacement)

| Command | What it does | Needs API Key? |
|---------|-------------|:--------------:|
| `npm run strategy -- 60000` | Tax plan: salary/dividend/pension/CT/VAT/R&D | ❌ Free |
| `npm run strategy -- compare 80k 120k` | Side-by-side scenario comparison with delta | ❌ Free |
| `npm run dashboard -- 60000` | Financial dashboard: salary, CT, VAT, dividends, deadlines, insurance | ❌ Free |
| `npm run dividend -- 5000` | HMRC-compliant dividend voucher + board minutes + tax estimate | ❌ Free |
| `npm run calendar` | Deadline tracker with 🔴🟡🟢 urgency (real dates from .env) | ❌ Free |

### Readiness & Health

| Command | What it does | Needs API Key? |
|---------|-------------|:--------------:|
| `npm run readiness` | Business readiness scored checklist (GREEN/AMBER/RED) | ❌ Free |
| `npm run health` | API keys, domain expiry, insurance, template integrity check | ❌ Free |
| `npm run setup` | Company formation walkthrough guide | ❌ Free |
| `npm run verify:setup` | Integration smoke test (72 checks) | ❌ Free |
| `npm run app-store` | App Store submission readiness (DUNS, privacy labels, screenshots) | ❌ Free |

### LLM-Powered

| Command | What it does |
|---------|-------------|
| `npm run ask -- "question?"` | AI business advisor (tax, legal, compliance) |
| `npm run enhance -- contract` | AI legal document review |
| `npm run test:generate -- finances` | AI edge-case test generation |

LLM works out of the box using your OpenCode Go credentials from `~/.local/share/opencode/auth.json` — no setup needed.

---

## Usage Workflow

### Weekly (30 seconds)

```bash
npm run health      # Quick check: API keys, domains, insurance
npm run calendar    # Any 🔴 critical deadlines this week?
```

### Monthly (5 minutes)

```bash
npm run dashboard -- YOUR_REVENUE    # Complete financial picture
npm run calendar                     # Full deadline overview
npm run strategy -- 60000            # Re-optimise tax plan
npm run strategy -- compare 60k 90k  # What if you earn more?
```

### When You Pay Yourself

```bash
npm run dividend -- 5000
```

Generates `docs/legal_templates/Dividend-{date}-5000.md` + `Board-Minutes-{date}.md`, records in `data/dividends.json`, shows tax estimate.

**Keep the voucher for 6 years. This is a legal requirement.**

### When Taking On a New Client

```bash
npm run screen -- "Client Brand"    # Check name conflicts
npm run verify -- COMPANY_NUMBER    # Due diligence
npm run contract                    # Generate SOW
```

### Before Launching a Website

```bash
npm run screen -- "Product Name"       # Brand check
npm run audit -- https://yoursite.com  # GDPR scan — aim for 7+/8
```

### Year-End (Before Jan 31)

```bash
npm run dashboard -- YOUR_REVENUE  # Get your annual numbers for Self Assessment
npm run dividend -- 0              # Check dividend history
```

### When Things Change

| Event | Run This |
|-------|----------|
| Revenue ↗ or ↘ | `npm run strategy -- NEW_REVENUE` or `-- compare OLD NEW` |
| Register for VAT | Add `COMPANY_VAT_NUMBER` to `.env` |
| PI insurance renews | Update `PI_INSURANCE_EXPIRY` in `.env` |
| New API key | `npm run health` to confirm connectivity |
| New tax year > April | Check `TAX_YEAR` in `src/lib/finances.js` |

---

## Environment Variables

### Required
| Variable | Used By | Purpose |
|----------|---------|---------|
| `COMPANIES_HOUSE_API_KEY` | screen, verify | Company lookups, brand screening |
| `COMPANY_NAME` | All templates | Company name in documents |
| `COMPANY_EMAIL` | health, templates | Template auto-fill |

### Calendar & Deadlines
| Variable | Used By | Purpose |
|----------|---------|---------|
| `COMPANY_NUMBER` | dividend, dashboard, health | Company registration number |
| `COMPANY_INCORPORATION_DATE` | calendar, dashboard | Computes CT, Confirmation Statement deadlines |
| `PI_INSURANCE_EXPIRY` | health, readiness, dashboard, calendar | Insurance expiry tracking |
| `ICO_REGISTRATION_DATE` | calendar | Computes ICO renewal date |
| `COMPANY_DIRECTOR_NAME` | dividend, contract, policy | Director signature |
| `COMPANY_ADDRESS` | dividend, contract, policy | Registered office |

### Optional
| Variable | Purpose |
|----------|---------|
| `COMPANY_VAT_NUMBER` | VAT registration indicator |
| `COMPANY_WEBSITE` | Legal document URLs |
| `COMPANY_SIC_CODE` | Companies House reference |
| `DIRECTOR_SALARY` | Dividend tax estimate (defaults to £12,570) |

---

## Cost Savings

**If you'd paid for alternatives, Year 1 costs £3,496. With bizforge it costs £102.**

### What bizforge replaces

| What You'd Pay For | Paid Product | Annual Cost |
|---|---|---|
| Accountant (tax planning + compliance) | Local firm (basic compliance package) | **£1,200** |
| Accounting software | FreeAgent (limited company @ £33/mo) | **£396** |
| Privacy policy + terms | Solicitor (one-off) | **£800*** |
| GDPR compliance tool | Cookiebot or similar (£49/mo) | **£600** |
| Business readiness review | Accountant review | **£400** |
| Client due diligence | Credit check service | **£150** |
| **Year 1 total with paid services** | | **£3,546** |
| **Year 2+ ongoing** | | **£2,196** |

\* One-off cost

### 3-Year Picture

```
Year 1:  £3,496 paid  →  £102 bizforge  →  save £3,394
Year 2:  £2,196 paid  →   £52 bizforge  →  save £2,144
Year 3:  £2,196 paid  →   £52 bizforge  →  save £2,144
─────────────────────────────────────────────────────────
3-year:  £7,888 paid  →  £206 bizforge  →  save £7,682
```

### What bizforge doesn't replace

| Item | Cost | Why |
|------|:----:|-----|
| Companies House registration fee | £50 (rising to £100 Feb 2026) | Statutory fee |
| ICO data protection fee | £52/yr | Legal requirement for data processors |
| Apple Developer Program | $99/yr | Required for App Store publishing |
| Domain names | £5-15/yr | Registration fee |

---

## Testing

```bash
npm test                    # 312 pass, 6 skipped without LLM key
npm run test:unit           # Pure function tests
npm run test:integration    # Mocked + full business workflow tests
npm run test:coverage       # Coverage (target 80%+)
```

### Determinism
All pure computation tests use **deterministic fixture data** — same input always produces same output. No test depends on external API availability. The 6 skipped tests in `opencode-go.test.js` require a live LLM API key and are skipped cleanly when unavailable.

### Test File Layout
```
test/
├── unit/                      # Pure function tests
│   ├── finances.test.js       # Tax calculations (45 tests)
│   ├── legal.test.js          # Template engine (27 tests)
│   ├── compliance.test.js     # GDPR scan logic (6 tests)
│   ├── whois.test.js          # WHOIS parsing (23 tests)
│   ├── companies-house.test.js# Company profile formatting (7 tests)
│   ├── brand-screen.test.js   # Brand screening (7 tests)
│   ├── app-store.test.js      # App Store checks (15 tests)
│   ├── logger.test.js         # Logger output (14 tests)
│   ├── llm.test.js            # LLM integration (2 tests)
│   ├── readiness.test.js      # Readiness scoring (40 tests)
│   ├── dashboard.test.js      # Dashboard aggregation (27 tests)
│   ├── calendar.test.js       # Deadline calculation (36 tests)
│   └── dividend.test.js       # Dividend voucher gen (17 tests)
├── integration/
│   ├── app-store.test.js      # App Store integration (3 tests)
│   ├── compliance.test.js     # Compliance integration (4 tests)
│   ├── brand-screen.test.js   # Brand screen integration (6 tests)
│   ├── opencode-go.test.js    # LLM API test (6 skipped w/o key)
│   └── business-security.test.js # Full workflow (10 tests)
├── contract/
│   └── templates.test.js      # Template structural integrity (22 tests)
└── helpers/
    └── fixtures.js            # Shared test data (111 lines)
```

---

## Tech Stack

Node.js (ES Modules) — pure JavaScript CLI. Vitest for testing.
Dependencies: `@companieshouse/api-sdk-node`, `whoiser`, `dotenv`.

## License

ISC
