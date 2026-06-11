# Compliance checklist (build from day one)

Condensed from the plan (sections 0 and 7). Full detail in the plan doc.

## Saudi PDPL
- [ ] Treat health data as sensitive: separate, explicit, granular consent for processing.
- [ ] Separate explicit consent for any cross-border transfer to a US AI provider (BYO path), naming the provider.
- [ ] Do not rely on consent alone for cross-border: default model runs in-region (Vertex AI, Doha/Dammam). For BYO, minimize on-device.
- [ ] Saudi SCCs + DPAs with any US vendor; documented Transfer Risk Assessment; vendor zero-retention / no-training.
- [ ] SDAIA National Data Governance Platform registration; RoPA; appoint a DPO; 72-hour breach runbook.
- [ ] Data-subject rights: access, copy, correct, delete, withdraw consent.

## Apple App Review (health)
- [ ] Explicit in-app consent before sharing health data with any third-party AI (Guideline 5.1.2(i)).
- [ ] "Connected to Apple Health" indicator; specific HealthKit purpose strings.
- [ ] No HealthKit data for ads/marketing/data-mining; no PHI in iCloud or notifications.
- [ ] In-app full account deletion (not deactivation).
- [ ] Privacy manifest (PrivacyInfo.xcprivacy) + accurate App Privacy nutrition labels.
- [ ] Submit under a legal entity (company), not an individual.
- [ ] Medical disclaimer on every health screen; no sensor-only medical-measurement claims.

## Always
- [ ] Privacy policy in Arabic + English (in-app and on the store).
- [ ] Estimates (food macros) labeled as estimates and always editable.
