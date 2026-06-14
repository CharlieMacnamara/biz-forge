# bizforge — Complete Business Rollout Plan

> A phased checklist of everything required to launch and grow your agency.
> Update `COMPANY_NAME` in `.env` with your registered company name.
> Phase 0 MUST be complete before you can trade legally.
> Phase 1 MUST be complete before approaching clients.
> Phases 2-4 are the rollout as your agency grows.

---

## Phase 0 — Foundation (Week 1-2)

**Goal:** Become a legal entity. You cannot trade, invoice, or publish apps without this.

### Week 1: Register the Company

- [ ] **Choose company name** — Run `npm run screen -- "Your Company Name"` to check name conflicts
- [ ] **Register with Companies House** — gov.uk, ~£50 online, processing ~24hrs
  - SIC code: `62012 — Business and domestic software development`
  - SIC code (optional): `58290 — Other software publishing` (for Skillio)
- [ ] **Set registered office address** — Virtual address ~£10-30/mo if you don't want your home address public
- [ ] **Appoint yourself** — Sole Director + Sole Shareholder + PSC (done during registration)
- [ ] **Register for Corporation Tax** — Automatic link from Companies House registration
- [ ] **Register for Self Assessment** — gov.uk — you MUST file a personal tax return as a director
- [ ] **Register for PAYE** — As an employer, needed to pay yourself a salary through payroll

### Week 2: Banking, Insurance & Domains

- [ ] **Open business bank account** — Tide/Starling/Monzo Business — ~30 min online, free tier available
- [ ] **Register with ICO** — ico.org.uk — £40/yr (Tier 1, mandatory for any business collecting personal data)
- [ ] **Get Professional Indemnity Insurance** — Hiscox/Simply Business ~£200-400/yr
  - Required before you take on any client. Most clients will ask for proof.
- [ ] **Register domains:**
  - `rennet-systems.co.uk`
  - `rennet-systems.com`
  - Use Cloudflare Registrar (at-cost) or Namecheap
- [ ] **Set up business email** — Google Workspace (~£5/mo) or Fastmail
- [ ] **Build rennetsystems.com** — Your own agency marketing site (use your Next.js template)
  - Include: Services, Portfolio (quality-kilts + Skillio-web as case studies), Contact, Pricing
  - Must have: Privacy policy, Cookie consent, Terms of service
  - Run `npm run audit -- https://rennetsystems.com` before going live
- [ ] **Create LinkedIn company page** — "[Company Name]"

---

## Phase 1 — Build Portfolio (Week 3-5)

**Goal:** Build 3 template-based sites to use as portfolio proof. You will drastically undercharge for these to secure testimonials + case studies + loyalty. These are loss leaders — the investment in your reputation.

### Your Existing Portfolio

You already have **1 secure template site + 1 marketing site** ready to show:

| Project | Type | Use as proof |
|---------|------|-------------|
| **quality-kilts** (Davison Menswear) | Full brochure + services + booking site | Shows you can build for real businesses |
| **Skillio-web** | App marketing site | Shows you can build modern, premium brand sites |

> You need **2 more** template-based sites to have 3 strong, visually different case studies. Approach local businesses with a template you've already built.

### Why 3 case studies?

- **1 site** looks like luck — doesn't prove repeatability
- **2 sites** looks like a pattern — still not enough variety
- **3 sites** shows you have a reliable system — prospects see consistency

### Pricing Strategy for Initial Deal Clients

| Client # | Price | Purpose |
|----------|-------|---------|
| 1st deal client (using quality-kilts as template) | **£497** (was £3,000) | Build on an existing template. Fast deploy. |
| 2nd deal client (new professional services template) | **£697** (was £3,000) | Second case study from a different industry |
| 3rd deal client (new showcase template) | **£997** (was £3,500) | Third proof point, different visual style |
| Clients 4-6 | **£1,497-£2,497** | Your "early adopter" price. Still below market. |
| Clients 7+ | **£3,000-£6,000** | Full agency pricing. Proven track record. |

> **At £497-£997:** You're making ~£400-£800/hr effective rate (templates take hours, not weeks). The margin covers your overhead. The value is in the case studies, testimonials, and trust you build.

### How to Find Your First Deal Clients

- [ ] **Ask friends & family** — Someone runs a business or knows someone who does
- [ ] **Local Facebook groups** — "[Town Name] Business Networking" — offer discounted website builds
- [ ] **Cold approach local businesses** — Hair salons, cafes, tradesmen, accountants, solicitors
  - "I'm launching my agency and offering 3 websites at 80% off — first come, first served"
- [ ] **Show them what they'll get** — Use quality-kilts as your demo template
- [ ] **Join a local BNI or networking group** — ~£500/yr, but gives you "web designer" slot

### Template Gap to Fill

| You have | You need | Template idea |
|----------|----------|---------------|
| quality-kilts (service/booking site) | Professional services template | For accountants, solicitors, dentists |
| Skillio-web (app marketing site) | Local commerce template | For cafes, restaurants, shops |

---

## Phase 2 — Agency Operations (Month 2)

**Goal:** Systems are running. You can on-board a new client in under 2 hours.

### Setup Your Toolchain

- [ ] **Set up FreeAgent** for invoicing + expenses + payroll (free for first 6 months with Tide)
- [ ] **Connect FreeAgent to your business bank account**
- [ ] **Run `npm run contract`** and generate your SOW template
- [ ] **Run `npm run policy -- privacy`** and customise for your own site
- [ ] **Run `npm run policy -- terms`** and customise
- [ ] **Run `npm run policy -- cookies`** and customise
- [ ] **Run `npm run strategy -- 30000`** to see your tax plan at initial revenue
- [ ] **Set up your Next.js starter template** as a git repo you clone for each client
- [ ] **Create a handover document** — How to update content, renew domain, contact support

### Client Onboarding Flow

```
Discovery call → Send SOW (`npm run contract`) → Client signs → 
Build (clone template → add content → deploy) → 
Check GDPR (`npm run audit -- client-site.com`) → 
Handover → Invoice (via FreeAgent) → 
Domain transfer setup (if applicable)
```

---

## Phase 3 — Scale, App Store & Tax Optimization (Month 3-4)

**Goal:** Skillio published. Tax structure optimised. Revenue growing.

- [ ] **Apply for D-U-N-S Number** — D&B, free, takes 1-5 business days (needed for Apple org enrollment)
- [ ] **Enroll in Apple Developer Program as organization** — $99/yr
- [ ] **Run `npm run app-store`** to check Skillio's readiness
- [ ] **Complete Maestro deterministic integration testing** (in progress — see skillio-app repo)
- [ ] **Resolve all Maestro test failures** before App Store submission
- [ ] **Submit Skillio to App Store**
- [ ] **Apply for App Store Small Business Program** — 15% commission instead of 30% (if revenue < $1M)
- [ ] **Open a SIPP** — Vanguard, AJ Bell, or Hargreaves Lansdown
- [ ] **Set up monthly pension contribution** — Tax-free growth, CT-deductible
- [ ] **Run `npm run strategy -- YOUR_REVENUE`** to calculate optimal salary/dividend/pension mix
- [ ] **Consider flat rate VAT** — Evaluate at ~£50k+ revenue (run `npm run strategy` for comparison)
- [ ] **Declare first dividends** — Issue dividend vouchers each time you withdraw company profit
- [ ] **Hire an accountant** — Recommended: a local firm specialising in IT contractors

---

## Phase 4 — Full Agency Pricing (Month 4+)

**Goal:** You have 3-6 case studies, a consistent pipeline, and can charge premium rates.

### Pricing Progression

| Stage | Revenue | Agency rate (effective/hr) | Monthly target |
|-------|---------|---------------------------|----------------|
| Launch (3 loss leaders) | £500-£1,000 | £400-£800/hr | 1 project every 2 weeks |
| Early growth (3 more) | £1,500-£2,500/site | £500-£1,000/hr | 1-2 projects/month |
| Stable (£50k/yr) | £3,000-£4,000/site | £500-£1,000/hr | 1-2 projects/month |
| Scale (£100k+/yr) | £4,000-£6,000/site | £500-£1,000/hr | 2-3 projects/month |

> Because you're selling pre-built templates with custom branding/content, your delivery time is measured in hours, not weeks. At £4,000 for a 4-hour deployment, your effective rate is £1,000/hr. This is the agency advantage — you're not billing by the hour, you're billing by the value.

### When to Raise Prices

- After your first 3 client sites are live → raise to £1,497-£2,497
- After you have 6 case studies and testimonials → raise to £3,000+  
- After Skillio is published on the App Store (proves you're a real software company) → raise to £4,000+
- After you're turning away work → raise prices again, or consider white-labeling templates to other agencies

---

## Rolling 12-Month Revenue Forecast

```
Month 1:    0          (Company formation, no revenue)
Month 2:   £497        (1st template client)
Month 3:   £697        (2nd template client)
Month 4:   £2,494      (3rd template at £997 + 1 at £1,497)
Month 5:   £3,994      (2 clients at £1,997)
Month 6:   £4,994      (2 clients at £2,497)
Month 7:   £6,000      (2 clients at £3,000)
Month 8:   £8,000      (2 clients at £4,000)
Month 9:   £8,000      (2 clients at £4,000)
Month 10:  £10,000     (2 clients at £5,000)
Month 11:  £10,000     (2 clients at £5,000)
Month 12:  £12,000     (2 clients at £6,000)

Year 1 Total: ~£66,000
```

> Realistic solo operator volumes. Each month you get faster as your templates improve. Domain renewals are the only ongoing cost (negligible). No hosting or maintenance — you hand those off to the client or recommend they use verified hosting providers.

---

## Recurring Calendar (Tracked by `npm run calendar`)

- [ ] Run `npm run screen -- "New Project Name"` before naming any client project
- [ ] Run `npm run verify -- CLIENT_NUMBER` before taking on any client
- [ ] Run `npm run contract` for each new client engagement
- [ ] Run `npm run audit -- client-site.com` before each site handover
- [ ] Run `npm run health` weekly to check API keys + domain expiries
- [ ] File Confirmation Statement (annually, £34 — Companies House)
- [ ] File Company Accounts + Corporation Tax Return (12 months after year-end)
- [ ] Pay Corporation Tax (9 months + 1 day after year-end)
- [ ] File Self Assessment tax return (31 Jan each year)
- [ ] Renew ICO data protection fee (£40/yr)
- [ ] Renew Apple Developer Program ($99/yr)
- [ ] Renew domain names (check expiry with `npm run domain -- rennet-systems.com`)
- [ ] Renew PI insurance (annually)
- [ ] Declare dividends + issue dividend vouchers (each time you withdraw)
