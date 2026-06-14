# App Store Publishing Guide — Skillio

## Prerequisites

1. **Company registered** with Companies House
2. **D-U-N-S Number** from Dun & Bradstreet (free, 1-5 business days)
3. **Apple Developer Program** enrollment as organization ($99/yr)
4. **Company website** with a functional domain matching your organization name

## Enrollment Steps

1. Get DUNS number: https://www.dnb.com/duns-number.html
2. Enroll as organization: https://developer.apple.com/programs/enroll/
3. You'll need: DUNS number, legal entity name, work email on your domain, company website
4. Apple verifies your identity and business — takes 1-14 days
5. Pay $99/year and agree to Apple Developer Program License Agreement

## App Store Requirements

### Privacy Nutrition Labels
Required for all new apps and app updates. Declare ALL data your app (and third-party SDKs) collects.

Run `npm run app-store` for a checklist. Common data types for most apps:
- Contact Info (Name, Email)
- Identifiers (User ID, Device ID)
- Usage Data (Product Interaction)
- Diagnostics (Crash Data, Performance Data)

### Screenshots Required
- iPhone 6.7" (1290x2796)
- iPhone 6.5" (1242x2688)
- iPhone 5.5" (1242x2208)

### Additional Requirements
- App description, keywords, and support URL
- Privacy policy URL (use your generated privacy policy)
- Export compliance questionnaire (standard: contains encryption, exempt)
- App review guidelines compliance

### Commission
- Standard: 30% on all sales
- Small Business Program: 15% if annual revenue < $1M
- Apply at: https://developer.apple.com/app-store/small-business-program/

## Pre-Submission Checklist

- [ ] Company registered at Companies House
- [ ] D-U-N-S Number obtained
- [ ] Apple Developer Program enrolled (organization)
- [ ] Run `npm run app-store` to check readiness
- [ ] Privacy nutrition labels completed in App Store Connect
- [ ] Screenshots prepared at all required sizes
- [ ] Privacy policy URL live on your website
- [ ] Export compliance documented
- [ ] App description + keywords written
- [ ] TestFlight build submitted and tested
