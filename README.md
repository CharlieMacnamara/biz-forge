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

## Quickstart

```bash
git clone <this-repo> && cd bizforge && npm install
cp .env.example .env
# Set COMPANIES_HOUSE_API_KEY
npm run verify:setup && npm test
```

LLM works out of the box using your OpenCode Go credentials from
`~/.local/share/opencode/auth.json` — no additional setup.

## Modules

| Module | Status | What it does |
|---|---|---|
| Companies House | ✅ Active | Search, profile, officers, filings |
| WHOIS | ✅ Active | Domain availability + expiry |
| Legal Templates | ✅ Active | SOW, privacy, terms, cookie policies |
| Finances | ✅ Active | Corp/div/VAT tax, pension, R&D credits |
| GDPR Audit | ✅ Active | URL scanning for compliance |
| App Store | ✅ Active | Apple Developer readiness |
| LLM (any OpenAI-compat) | ✅ Active | Advisor, doc review, test gen |
| Trademark, Sanctions, Land Registry, Banking, Invoicing | 🚧 Planned | modules/MANIFEST.md |

## What Users Say

> "This one CLI replaces my lawyer, accountant, compliance officer, and
> formation agent — for the cost of a $10/mo API key."

## License

ISC
