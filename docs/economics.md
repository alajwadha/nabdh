# Nabdh - Unit Economics and Cost Model

Working economics for the Nabdh subscription. All figures use SAR pegged at 3.75 SAR/USD. An interactive calculator lives at `mockups/finance/model.html` (open it in a browser, every input is editable).

## Headline

- Reference price: **199 SAR/year** (about $53), or a ~25 SAR/month option.
- After Saudi VAT (15%) and Apple (15% Small Business), you net **~$39.23/year** per subscriber.
- Cost to actually serve a customer is **~$0.38/month** (AI + infra + APIs), so the marginal margin is **~88% of proceeds**.
- AI is roughly **3 to 8 percent of revenue**, not the constraint. The only real cost is **customer acquisition (CAC)**, which is cheap in Saudi when driven organically.

---

## 1. The price stack: VAT + Apple

Apple's rules are global and identical for a Saudi developer. Two layers come off every sale:

1. **Saudi VAT 15%** - embedded in the VAT-inclusive sticker price; Apple collects and remits it to the government. It is removed before commission.
2. **Apple commission** - **15%** if enrolled in the Small Business Program (any developer under $1M/year in proceeds qualifies), otherwise 30% in year 1 then 15% after 12 months. Always enroll in SBP.

Proceeds = price − VAT − Apple commission. On a 199 SAR/year sub:

| Line | SAR/yr | USD/yr |
|---|---:|---:|
| Gross sticker (customer pays, VAT-incl) | 199.00 | $53.07 |
| − Saudi VAT 15% | −25.96 | −$6.92 |
| = Net price | 173.04 | $46.15 |
| − Apple commission 15% (SBP) | −25.96 | −$6.92 |
| **= Proceeds (your revenue)** | **147.08** | **$39.23** |

So you keep about **74% of the sticker** before any running cost. To fully pass VAT to the customer you would raise the Saudi price by 15% (a clean tier like 199 or 249 SAR already builds this in). Apple's 15% cannot be passed on; it always comes out of your proceeds.

### Apple account notes
- **Apple Developer Program ($99/year): mandatory** to publish on iOS. Individual enrollment takes ~24 to 48 hours.
- **Small Business Program (15%): optional but free.** Enroll after signing the Paid Apps agreement; the rate starts the 1st of the following month.
- **Organization (legal entity) account: not mandatory.** A wellness/coaching app can launch on an individual account. The legal-entity rule (Apple 5.1.1(ix)) only applies at review for medical-claim apps, which Nabdh is not. Form a company only if a reviewer asks.

---

## 2. Cost to serve one customer (COGS)

Per active customer per month, using a conservative AI floor (Gemini Flash, no caching credit assumed):

| Cost line | $/customer/mo |
|---|---:|
| AI coach (Flash floor) | $0.31 |
| Infra (Cloud Run + Firestore) | $0.05 |
| APIs / push / misc (prayer, nutrition cached, FCM) | $0.02 |
| **Direct total** | **~$0.38** |

Fixed overhead (Apple $99/year + ~$30/month tools) is ~$0.04/customer at 1,000 users and near-zero beyond. Heavy power users push AI toward ~$1.19, capped by per-user rate limits; the average is ~$0.31 or lower with caching (~$0.15).

---

## 3. AI cost model

Token cost per interaction (the building blocks):

| Interaction | input tok | output tok | note |
|---|---:|---:|---|
| Coach message | 2,000 | 350 | system prompt + memory + history |
| Daily insight | 3,000 | 600 | trailing data window |
| Reminder | 800 | 120 | can be templated to $0 |
| Food photo (vision) | 1,500 | 350 | includes image tokens |

Moderately active user: ~0.40M input + 0.10M output tokens/month, so 1,000 users ~ 400M input + 100M output/month. Cost = `400 * input$/1M + 100 * output$/1M`.

| Model | ~$/1M in | ~$/1M out | $/mo · 1000 users | $/user/mo |
|---|---:|---:|---:|---:|
| Amazon Nova Lite | 0.06 | 0.24 | $48 | $0.05 |
| Gemini 2.5 Flash-Lite | 0.10 | 0.40 | $80 | $0.08 |
| GPT-4o mini | 0.15 | 0.60 | $120 | $0.12 |
| DeepSeek-V3 | 0.27 | 1.10 | $218 | $0.22 |
| **Gemini 2.5 Flash (default)** | 0.30 | 2.50 | $370 | $0.37 |
| Amazon Nova Pro | 0.80 | 3.20 | $640 | $0.64 |
| Claude Haiku 4.5 | 1.00 | 5.00 | $900 | $0.90 |
| o4-mini | 1.10 | 4.40 | $880 | $0.88 |
| Gemini 2.5 Pro | 1.25 | 10.00 | $1,500 | $1.50 |
| GPT-4o / GPT-5-class | 2.50 | 10.00 | $2,000 | $2.00 |
| Claude Sonnet 4.x | 3.00 | 15.00 | $2,700 | $2.70 |
| Claude Opus 4.x | 15.00 | 75.00 | $13,500 | $13.50 |

Prices are approximate list prices and should be verified live. AI is pay-as-you-go (per token): inactive users cost ~$0, so the real bill scales with active usage, not headcount.

---

## 4. Cost optimization (keep quality, cut cost)

Strategy: put premium compute where the user looks, strip it everywhere else.

1. **Prompt caching** - cache the static Saudi-context system prompt; cached reads bill at ~10 to 25% of input. Cuts input cost 50 to 90%.
2. **Model routing** - Flash-Lite for parse/classify/reminders, Flash for chat, a smarter model only for the once-a-day showcase insight.
3. **No LLM when deterministic** - templated reminders; readiness/trends by math; local dish DB and barcode before any vision call.
4. **Trim input** - rolling memory summary instead of full history; retrieve only relevant dishes; minimized health summaries.
5. **Cap output** - concise replies and `max_output_tokens`; output is ~8x the price of input on Flash.
6. **Batch the daily insight** - non-realtime, run via the Batch API for ~50% off.
7. **Confidence-based escalation (food)** - every photo runs on Flash + the local nutrition DB; only low-confidence or user-corrected photos escalate to a stronger vision model. Precision comes from the database, not raw model IQ, so ~80% of photos resolve cheap.

### Per-task model map

| Task | Default | Escalate to | Why |
|---|---|---|---|
| Reminders | template (no LLM) | - | deterministic |
| Intent / classification | Flash-Lite | - | trivial |
| Coach chat | Flash-Lite to Flash | smart model if deep | high volume |
| Food vision | Flash + dish DB | Pro on low confidence | precision from DB |
| Daily showcase insight | Flash (batch) | smart model 1x/day | visible quality moment |

Stacked, these take a flat-Flash $0.31/user toward ~$0.10 to 0.15 while raising perceived quality. The default model stays a server-side flag so routing changes without an app update.

---

## 5. Unit economics at 199 SAR

Per subscriber (AI floor $0.31):

| Line | $/yr | $/mo |
|---|---:|---:|
| Proceeds (after VAT + Apple) | $39.23 | $3.27 |
| − Cost to serve ($0.38/mo) | −$4.56 | −$0.38 |
| **= Marginal profit** | **~$34.67** | **~$2.89** |

- Margin: **~88% of proceeds**, **~65% of the sticker** (after government + Apple + serving).
- Per 1,000 subscribers/year: proceeds **$39,230**, cost to serve **$4,560**, profit **~$34,670**.

---

## 6. Acquisition (CAC) and the real constraint

CAC is the cost to get one paying subscriber. It is the only meaningful cost and the swing factor on whether year 1 is green.

- **CPI vs CAC**: cost-per-install is ~$1 to 3 in Saudi paid social, but only a few percent of installs subscribe, so pure paid-ads CAC runs ~$20 to 40. `CAC = CPI / (install-to-paid rate)`.
- **Saudi organic** (word of mouth, family/majlis sharing, fitness influencers, Ramadan content, referral program, Arabic ASO) drives installs at near-zero cost, collapsing blended CAC toward **~$5**.
- At $5 CAC, year-1 profit per subscriber is ~$29.67 (199 SAR) and year-2+ is the full ~$34.67. LTV:CAC is strongly positive.

The build is no longer a cost question. It is an **acquisition + retention** question.

---

## 7. First-year scenarios

Cash basis (annual subscribers prepay 12 months upfront; monthly bill each month). Three scenarios differ only by new subs/month, at CAC $5, 199 SAR equivalent, 3% monthly churn. Full interactive model: `mockups/finance/model.html`.

| Scenario | New subs/mo | End-of-yr subs | Year-1 cash | Breakeven |
|---|---:|---:|---:|---:|
| Pessimistic | 30 | ~344 | ~+$11K | Month 1 |
| Base | 200 | ~2,292 | ~+$77K | Month 1 |
| Optimistic | 800 | ~9,169 | ~+$311K | Month 1 |

At cheap organic CAC, all scenarios are cash-positive from month 1, and each enters year 2 with a paid-up recurring base on top.

> Note: at a paid-ads CAC of ~$40, year 1 flips to an investment (negative) that is repaid by the recurring base in year 2. The model lets you flex CAC, churn, price, and mix to see this directly.

---

## 8. Interactive calculator

`mockups/finance/model.html` - a self-contained, editable cash model. Inputs: price (annual/monthly), % on annual, Apple cut, CAC, churn, AI and infra per user, fixed costs, and new subs/month for each scenario. Outputs: per-scenario summary cards, a cumulative-cash chart, and a full month-by-month line-item table. Change any input and everything recomputes.

Live link (public repo): `https://raw.githack.com/alajwadha/nabdh/main/mockups/finance/model.html`

---

## 9. Positioning note (why the cost stack stays simple)

Nabdh is a wellness/coaching app: it aggregates the user's own data, the AI helps interpret it, and the user consents. No medical claims. This keeps it out of both Apple's medical-app scrutiny and Saudi SFDA medical-device regulation, and means it can launch on an individual Apple account. The PDPL data layer (in-region processing, consent gates) is handled in the architecture (see `docs/PLAN.md`). Keep the AI in a coaching voice (lifestyle, not diagnosis) and the medical disclaimer on health screens to stay in this lane.
