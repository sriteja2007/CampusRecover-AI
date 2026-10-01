# CampusRecover AI — Complete Product & Technical Specification

> **Document type:** Product design + technical blueprint (design only, no source code)
> **Status:** Final blueprint, build-ready
> **Audience:** Developers / AI coding agents who will implement the system
> **Principle:** A secure, AI-powered college Lost & Found where items move only between the legitimate Lost User, Found User, and authorized Admin — never to a third party.

---

## Table of Contents

1. [Project Vision & Core Principle](#1-project-vision)
2. [Critical Analysis of the Original Idea](#2-critical-analysis)
3. [User Roles](#3-user-roles)
4. [Core System Principle — 3-Party Recovery Model](#4-3-party-recovery-model)
5. [End-to-End Workflow](#5-end-to-end-workflow)
6. [AI Auto-Fill System](#6-ai-auto-fill-system)
7. [Found Item Workflow](#7-found-item-workflow)
8. [AI Matching Engine](#8-ai-matching-engine)
9. [False Claim Prevention](#9-false-claim-prevention)
10. [Adaptive Verification Questions](#10-adaptive-verification-questions)
11. [AI Fraud Detection](#11-fraud-detection)
12. [Image Privacy System](#12-image-privacy-system)
13. [AI Chatbot](#13-ai-chatbot)
14. [Smart Lost Item Reporting](#14-smart-lost-reporting)
15. [Smart Found Item Reporting](#15-smart-found-reporting)
16. [Item Status Lifecycle](#16-item-status-lifecycle)
17. [Secure Handover System](#17-secure-handover)
18. [Location Privacy](#18-location-privacy)
19. [Notification System](#19-notifications)
20. [Lost User Dashboard](#20-lost-user-dashboard)
21. [Found User Dashboard](#21-found-user-dashboard)
22. [Admin Dashboard](#22-admin-dashboard)
23. [Admin Verification Workflow](#23-admin-verification-workflow)
24. [Dispute Resolution](#24-dispute-resolution)
25. [High-Value Item Workflow](#25-high-value-items)
26. [Special Cases by Category](#26-special-cases)
27. [Category-Specific AI Verification](#27-category-specific-verification)
28. [Authentication](#28-authentication)
29. [College-Only Access](#29-college-only-access)
30. [Privacy & Security Architecture](#30-security-architecture)
31. [Database Design](#31-database-design)
32. [System Architecture](#32-system-architecture)
33. [AI Architecture](#33-ai-architecture)
34. [AI + Rule Engine Hybrid](#34-ai-rule-hybrid)
35. [Search Experience](#35-search)
36. [Real-Time Features](#36-real-time)
37. [Chat / Communication System](#37-chat)
38. [Trust System](#38-trust)
39. [Analytics](#39-analytics)
40. [Accessibility](#40-accessibility)
41. [Sitemap / Information Architecture](#41-sitemap)
42. [Screen Specifications](#42-screen-specs)
43. [UI/UX Design System](#43-design-system)
44. [AI Visual Language](#44-ai-visual-language)
45. [3D / Animation Design](#45-animation)
46. [Landing Page](#46-landing-page)
47. [Onboarding](#47-onboarding)
48. [Empty States](#48-empty-states)
49. [Error States](#49-error-states)
50. [Mobile-First Experience](#50-mobile)
51. [Admin UX](#51-admin-ux)
52. [Security Threat Model](#52-threat-model)
53. [Edge Cases](#53-edge-cases)
54. [Complete Recovery Journey](#54-recovery-journey)
55. [Implementation Roadmap](#55-roadmap)
56. [MVP vs Advanced Features](#56-mvp-scoping)
57. [Free / Low-Cost Technology Strategy](#57-tech-strategy)
58. [Testing Strategy](#58-testing)
59. [Demo / Hackathon Flow](#59-demo)
60. [Project Differentiators](#60-differentiators)
61. [Final Product Blueprint](#61-final-blueprint)
62. [Design Principles](#62-design-principles)
63. [Architecture Consistency Check](#63-consistency-check)

---

## 1. Project Vision

CampusRecover AI is a secure, AI-powered Lost & Found platform built specifically for college campuses. It solves a problem every campus has — items go missing constantly — but does so in a way that protects against the failure modes normal Lost & Found systems ignore: fake claims, fraud, impersonation, photo-scraping, and third-party interference.

### The Central Principle

> **An item must only ever move between three parties: the legitimate Lost User, the legitimate Found User, and an authorized Admin. No unrelated third party should be able to see sensitive details, claim the item, or interfere with the recovery.**

To enforce this, the platform layers six mechanisms on top of a normal reporting/matching flow:

1. **Privacy-preserving images** — found-item photos are blurred/redacted by default; full images are gated behind verification.
2. **Hidden-attribute verification** — claimants are quizzed on details that were never made public (the scratch on the back, what was inside the bag).
3. **AI similarity matching** — lost and found reports are compared across visual, textual, and contextual dimensions.
4. **Hybrid AI + rule engine** — AI proposes, rules decide. No LLM ever makes a final ownership decision alone.
5. **Secure handover** — QR/OTP one-time tokens confirm physical return, logged in an audit trail.
6. **Fraud detection + human review** — suspicious patterns escalate to an admin; nobody is auto-banned by AI.

### Why this matters

A normal Lost & Found board publishes a photo of the found watch. Student C sees it, recognizes the model, and claims it. Done — the watch is gone, the real owner never gets it back. CampusRecover AI makes that attack expensive: Student C cannot see the identifying marks, cannot answer the private questions, and gets flagged by fraud detection if they try to guess. The finder and admin stay in control until evidence is overwhelming.

---

## 2. Critical Analysis of the Original Idea

Before designing the system, an honest critique of the concept as stated.

### 2.1 What is good

| Strength | Why it matters |
|---|---|
| Three-party recovery model | Sharply limits who can touch a case; this is the right trust boundary. |
| Hidden-attribute verification | The single strongest anti-fraud mechanism; cheap and effective. |
| Blurred/protected images | Closes the "screenshot and claim" attack vector. |
| College-only access | Narrows the threat model to a semi-trusted population with verifiable emails. |
| AI auto-fill from images | Massively reduces friction at the reporting step, which is where most systems lose users. |
| Admin as final authority | Keeps an accountable human in the loop for irreversible decisions. |

### 2.2 Problems with the idea as stated

1. **The principle is stated absolutely but verification is probabilistic.** "Only the legitimate owner" is a goal, not something a software system can guarantee. The design must acknowledge that ownership verification produces a *confidence level*, and the system decides how much evidence is enough. We make this explicit with the **Evidence Threshold Model** (§9).
2. **"AI matches lost and found" risks false positives at scale.** Two identical black Dell laptops exist on every campus. AI matching alone will confidently match the wrong pair. The matching engine must combine visual similarity with *private* attributes only the real owner knows, and treat high visual similarity as a *candidate signal*, not proof.
3. **Admin workload is unbounded in the original idea.** If every medium-confidence case goes to admin, one busy campus generates hundreds of reviews/week. The system must resolve most cases through automated verification and only escalate the genuinely ambiguous ones. Target: **<10% of cases require admin review**.
4. **"Never expose sensitive information" conflicts with the finder needing to return the item.** The finder needs *something* to coordinate handover. The design must expose a *minimal coordination channel* (platform-mediated chat, approximate pickup zone) without leaking identity or exact location.
5. **Image blurring alone is insufficient.** A blurred photo of a distinctive backpack is still recognizable. Blurring must be combined with **cropping to non-identifying regions**, **removing unique marks**, and **showing only a generic category placeholder** when the item is too distinctive to safely show.
6. **The chatbot scope is too broad.** "Help with everything" makes the bot a liability — it could leak info or be social-engineered. We restrict it to navigation, FAQ, and status — never to revealing attributes, approving claims, or identifying users.
7. **No mention of what happens when items are *never* matched.** Realistically most lost items are never found. The system needs expiration, archival, and a graceful "still searching" state so dashboards don't fill with stale hope.
8. **"Multiple accounts" is hard to detect on a college email system.** One student has one college email, but can register with a personal email if we allow it. We must decide: **college email mandatory**, which makes multi-accounting far harder.
9. **QR handover assumes both parties meet in person.** On large campuses this is often impractical. We need a **two-tier handover**: direct (QR + admin) or **via a designated drop point / security desk** with a claim code.
10. **The original idea treats "found item" and "lost item" as symmetric.** They are not. The finder holds the physical object and therefore holds the power; the lost user is desperate and will over-claim. The verification system must be **asymmetric**: it's harder to *claim* than to *report found*, because claiming is where the fraud happens.

### 2.3 Security risks identified

- **Screenshot/side-channel claiming:** attacker photographs the public blurred image with another phone and claims from a third account. → Mitigated by hidden-attribute questions + fraud detection.
- **Verification brute force:** claimant guesses answers to private questions. → Mitigated by strict attempt limits, lockout, and escalating question difficulty.
- **Reused photos / fake evidence:** claimant uploads a Google image as "proof of ownership." → Mitigated by reverse-image search + EXIF stripping + AI image-manipulation detection.
- **Account takeover:** attacker compromises a legitimate account and claims from it. → Mitigated by 2FA on high-value claims + anomalous-login detection.
- **Admin impersonation:** someone messages a user claiming to be admin. → Mitigated by platform-only admin channels with a verified badge that can't be spoofed in user-to-user chat.
- **Data leakage via API:** scraping the found-items endpoint to enumerate all items. → Mitigated by rate limiting, blurred-only public API, and per-user query budgets.

### 2.4 Privacy risks

- **Location re-identification:** "Found in Library 2nd floor near the south window at 3pm" can identify the finder. → Use coarse location (building-level) and time rounded to the nearest hour in public views.
- **Image metadata:** photos carry EXIF GPS. → Strip on upload, server-side.
- **Identity exposure through chat:** users share phone numbers. → Platform-mediated chat with a PII filter that blocks phone/email patterns.
- **Audit log abuse:** admins reading chat transcripts. → Admins see metadata + flags, not full chat, unless a case is formally escalated.

### 2.5 Fake claim scenarios (attack patterns)

| Scenario | How it plays out | Primary defense |
|---|---|---|
| Public-photo claimant | Sees blurred photo, guesses | Hidden questions + attempt lockout |
| Coordinated pair | Two accounts, one found one claimed | Fraud detection: same-device fingerprint, timing |
| Stolen-evidence claimant | Has a real photo of a similar item they own | Reverse image search + private-attribute questions |
| Social engineer | Convinces admin/founder verbally | Platform-mediated handover only; admin logs |
| Account-takeover claimant | Hacks real owner's account | 2FA on high-value claims + login anomaly detection |

### 2.6 Loopholes

- **"I found it" fraud:** someone reports an item *found* that they actually stole, to legitimize possession. → The found report doesn't grant ownership; handover still requires the lost user to pass verification. The finder never gets to keep the item just by reporting it.
- **Claim-then-extort:** claimant passes verification, then demands a reward from the real owner. → Platform policy: rewards are optional and platform-mediated; no direct payment channel; extortion is a bannable offense with admin review.
- **Finder ghosting:** finder reports, gets matches, then disappears with the item. → The found report is a commitment; ghosting after a confirmed match lowers trust and can flag for admin follow-up. Real-world recovery ultimately needs campus security — the system escalates to a **security desk handover** when direct contact fails.

### 2.7 UX problems in the original idea

- A "huge boring form" for reporting → replaced with a **progressive, AI-assisted flow** (§14).
- Too many notifications → **notification budgeting** (only meaningful state changes notify; daily digest for low-priority).
- Admin interface identical to student interface → **separate, dense admin console** (§51).

### 2.8 AI limitations acknowledged

- Vision models misidentify brands/models constantly. → AI output is always a **suggestion the user confirms**, never an authoritative field.
- LLMs hallucinate attributes. → Never store LLM-generated attributes as ground truth; store them as *suggestions* with `source: ai` vs `source: user`.
- Embedding similarity on two photos of the *same* object from different angles is noisy. → Use embeddings for *candidate generation only*, then rule-based + private-attribute verification for confirmation.
- AI cannot prove ownership. → Ownership is established by *evidence accumulation*, not by AI verdict.

### 2.9 Edge cases not originally considered

- Two people lost identical phones in the same building on the same day.
- Item found months later, after the lost report expired.
- Finder is the legitimate owner of a *different* identical item.
- User reports lost, then finds it themselves under the desk.
- Item is illegal/contraband (e.g., a vape) — what does the finder/admin do?
- Cash: no identifying marks possible — special policy (§26).
- Item damaged *after* being found — finder liability question.
- Graduate leaves campus mid-case — account handoff/transfer.

---

## 3. User Roles

### 3.1 Roles that should exist

| Role | Exists? | Rationale |
|---|---|---|
| **Lost User** | ✅ Yes | Core participant; reports loss, proves ownership, receives item. |
| **Found User** | ✅ Yes | Core participant; reports find, cooperates with verification, hands over. |
| **Admin / Recovery Officer** | ✅ Yes | Final authority on disputes, suspicious claims, and high-value handovers. Accountable human in the loop. |
| **Security Staff** | ✅ Yes (limited) | Acts as a physical handover intermediary at a designated desk. *Not* a decision-maker on ownership — just a verified drop-off/pickup point with scan authority. |
| **Super Admin** | ✅ Yes (1–2 people) | Manages admin accounts, system settings, and audit integrity. Needed for separation of duties: admins can't edit audit logs, super admin can't be deleted by admins. |
| **College Management (read-only)** | ⚠️ Optional V2 | Analytics-only view of recovery rates and trends. No case access. Useful for buy-in, not operationally necessary for MVP. |
| **Moderator** | ❌ No | Adds a layer between admin and users with unclear authority. In a college population, Admin + Security covers it. Adds complexity without value. |
| **Department Coordinator** | ❌ No | Same problem — fragments accountability. Items cross departments constantly. |
| **Anonymous / Public visitor** | ✅ Yes (non-authenticated) | Can view blurred found-item gallery and report a find via a lightweight flow, but cannot claim or chat. |

### 3.2 Role summary

```
Public Visitor  ──register──►  User (Lost or Found, can be both)
                                   │
                                   ├── can become ──► Security Staff (assigned by Admin)
                                   │
Admin ──managed by──► Super Admin
```

A single user can be **both** a Lost User and a Found User over time (loses a bottle, finds a wallet). Roles are *capabilities on a case*, not separate accounts. One account, contextual roles.

---

## 4. Core System Principle — 3-Party Recovery Model

```
        ┌─────────────────────┐
        │      Admin          │
        │  (verifies,         │
        │   arbitrates,       │
        │   logs)             │
        └─────────┬───────────┘
                  │
         ┌────────┴────────┐
         │                 │
   ┌─────▼─────┐     ┌─────▼─────┐
   │ Lost User │◄───►│ Found User│
   │ (proves   │     │ (holds    │
   │  ownership)│     │  object)  │
   └───────────┘     └───────────┘
```

### 4.1 Information exposure rules

| Information | Lost User | Found User | Admin | Public | Matched potential owner |
|---|---|---|---|---|---|
| Own lost-item full image | Full | — | Full | No | — |
| Found-item public image | — | Full (own) | Full | Blurred/cropped | Limited preview |
| Found-item full image | No | Full (own) | Full | No | Only after passing verification |
| Hidden attributes (private) | Own only | No | Full | No | No (only asked about, never shown) |
| Exact location | Own only | Own only | Full | Building-level | Building-level |
| Other party's identity | No | No | Full | No | No |
| Other party's contact | No (platform chat) | No (platform chat) | Full | No | No |

### 4.2 The key invariant

At every state in the lifecycle, ask: **"If an attacker obtained everything visible to role X right now, could they falsely claim the item?"** If yes, the exposure is wrong. The hidden-attribute set is the cryptographic equivalent of a shared secret — it is never shown to anyone, only queried.

---

## 5. End-to-End Workflow

### Stage 1 — Item Lost (Lost User)

1. Create account (college email, §28).
2. Complete minimal profile (name, department, notification prefs).
3. Click **"Report Lost item"**.
4. Upload one or more images of the item (a reference photo the user already has).
5. AI auto-extracts candidate attributes (§6) — user confirms or corrects.
6. Select category (auto-suggested, user confirms).
7. Provide approximate lost location (building selector + optional room/area).
8. Provide date/time of loss.
9. Provide a public description (visible to others browsing).
10. Provide **private ownership evidence** — hidden attributes only the owner knows. This is the verification substrate.
11. Optional: purchase info, receipts, serial numbers (held privately, admin-visible only).
12. Review and submit.

### Stage 2 — AI processing on lost report

- Vision model tags attributes → stored as `ai_suggestions` + `user_confirmed`.
- Embedding generated for the image → stored in vector index.
- Report enters `Searching` state.
- System begins passive matching against existing found items.

---

## 6. AI Auto-Fill System

When the user uploads an image (lost or found), the AI runs a **multi-pass extraction** and *suggests* fields. Nothing AI-generated is committed as ground truth without user confirmation.

### 6.1 What AI attempts to extract

| Field | Source | Confidence typical | Notes |
|---|---|---|---|
| Object category | Vision classifier | High | 80+ common campus categories. |
| Brand | Vision + logo detection | Medium | Often wrong; user must confirm. |
| Model | Vision + OCR | Low–Medium | Treat as hint only. |
| Dominant color(s) | Vision | High | Up to 3 colors. |
| Material | Vision | Medium | Leather/plastic/metal/fabric. |
| Shape | Vision | High | For categorization. |
| Approximate size | Depth/reference | Low | Ask user explicitly. |
| Visible text | OCR | Medium | Serial numbers, engravings. |
| Logos | Object detection | Medium | |
| Patterns | Vision | Medium | |
| Accessories | Vision | Low | "Has a strap", "has a keychain." |
| Damage / scratches | Vision | Low | **Critical: never auto-fill as public.** Stored as private attribute *suggestion*; user confirms it's private. |
| Stickers / unique marks | Vision | Low | Same — private by default. |

### 6.2 The confirmation mechanism

Every AI-suggested field has three states:

```
[ AI suggested: "Black" ]   [ ✓ Confirm ]   [ ✏ Edit ]   [ ✗ Wrong – remove ]
```

- **Confirmed** → stored with `source: user`.
- **Edited** → stored with `source: user`, AI suggestion archived for analytics.
- **Rejected** → field left empty; AI suggestion archived.

Fields are partitioned into **Public** (color, category, brand, approximate location) and **Private** (scratches, engravings, contents, serial). The UI clearly labels which is which, and AI never writes to private fields without an explicit user action — it only *suggests* in a private sidebar.

### 6.3 Rule: AI never auto-publishes

Even after user confirmation, the report stays in `Draft` until the user clicks **Submit**. AI can reduce friction but cannot create a public record on its own.

---

## 7. Found Item Workflow

1. Found user logs in (or starts as public visitor, prompted to register before submit).
2. Uploads found-item image(s).
3. AI analyzes image (same multi-pass as §6).
4. System creates a **secure found-item record**.
5. **Image becomes protected:** a blurred/cropped public version is generated server-side; the original is stored privately.
6. AI searches the lost-items vector index for candidates.
7. Matching engine computes similarity (§8).
8. Potential matches generate **targeted notifications** to the matched lost users only (not the public).
9. Each potential match enters `Verification Pending`; the lost user is asked the private questions.
10. Verification proceeds (§10). Admin review only if uncertainty remains.

### 7.1 Asymmetry rule

Reporting a found item is **low-friction** (we want finders to report). Claiming a found item is **high-friction** (we want fake claims to fail). This asymmetry is intentional.

---

## 8. AI Matching Engine

Matching compares a lost report and a found report across three dimensions and produces **not a single percentage**, but a structured *Match Profile* with sub-scores.

### 8.1 Dimensions

```
┌─────────────────────────────────────────────────────────┐
│                   MATCH PROFILE                          │
│                                                          │
│  Visual Similarity    ──►  v_score   (0–1)              │
│  Textual Similarity   ──►  t_score   (0–1)              │
│  Contextual Fit       ──►  c_score   (0–1)              │
│  Category Match       ──►  boolean / weighted           │
│                                                          │
│  Combined confidence  ──►  C  (0–1, weighted, explained)│
└─────────────────────────────────────────────────────────┘
```

**Visual (v_score):** image embedding cosine similarity + attribute overlap (color, shape, brand, pattern). Two angles of the same object typically score 0.6–0.8; similar-but-different objects 0.3–0.5.

**Textual (t_score):** semantic similarity of descriptions (LLM-embedding of descriptions, not raw keyword match) + structured attribute match (brand == brand, color in color set).

**Contextual (c_score):** location proximity (building match = 1.0, adjacent building = 0.7, same campus zone = 0.4), time delta (found within 24h of loss = 1.0, within a week = 0.6, over a month = 0.2), category/category.

### 8.2 Weighting

Weights are category-dependent and tunable by admin:

| Category | v | t | c |
|---|---|---|---|
| Generic items (clothing, bottles) | 0.3 | 0.4 | 0.3 |
| Distinctive items (custom bags, engraved items) | 0.5 | 0.3 | 0.2 |
| Electronics (phones, laptops) | 0.2 | 0.4 | 0.4 |
| Documents/IDs | 0.1 | 0.6 | 0.3 |

Electronics weight context + text higher because *visual* similarity is near-useless for two identical black phones. Documents weight text highest (names, ID numbers).

### 8.3 Thresholds

| Combined confidence C | Action |
|---|---|
| C ≥ 0.85 | **Auto-suggest match** → notify lost user, start verification. |
| 0.55 ≤ C < 0.85 | **Candidate match** → notify lost user as "possible match," start verification; case flagged for admin if verification is inconclusive. |
| 0.30 ≤ C < 0.55 | **Weak candidate** → shown in lost user's "possible matches" feed without push notification; user can opt in. |
| C < 0.30 | **Rejected** → not surfaced. Logged for analytics. |

### 8.4 False positives

- High visual similarity alone is never enough to auto-approve. The system requires **private-attribute verification** on top of any match confidence.
- Two near-identical items: the system surfaces *both* lost reports to the finder and lets private-attribute answers disambiguate. The finder is never told which answer was right.
- Every auto-suggested match is logged with the sub-scores so admins can audit the engine.

### 8.5 Communicating uncertainty to users

Users never see a raw percentage. They see:

- **"Strong possible match"** (C ≥ 0.85)
- **"Possible match — needs your verification"** (0.55–0.85)
- **"Item you might want to look at"** (0.30–0.55)

And always: *why* the system thinks so, in plain language — "Found in the same building, around the same time, looks similar." Never "87% match."

---

## 9. False Claim Prevention

### 9.1 The Evidence Threshold Model

Ownership is established by accumulating evidence points (EP). Each piece of evidence has a weight. The claim passes when total EP ≥ threshold T.

| Evidence | Weight (EP) | Notes |
|---|---|---|
| Correct hidden-attribute answer (hard) | 30 | "What's engraved on the back?" |
| Correct hidden-attribute answer (soft) | 15 | "Roughly what condition?" |
| Correct private photo match | 40 | User uploads a photo that vision-matches the found item from a private angle. |
| Correct purchase/serial evidence | 35 | Receipt or serial, verified by admin. |
| Correct contextual detail (where/when) | 10 | Not enough alone — many people know roughly where/when. |
| Account trust (verified, prior returns) | 5 | Minor tie-breaker. |

| Threshold T | Required | Result |
|---|---|---|
| T ≥ 70 | Pass | Claim approved; handover initiated. |
| 40 ≤ EP < 70 | Ambiguous | Admin review. |
| EP < 40 | Fail | Claim rejected; lockout after N wrong answers. |

### 9.2 Why this stops Student C

Student C sees the public blurred photo of a watch. They cannot answer "what's scratched on the clasp" (30 EP), cannot upload a private-angle photo (40 EP), cannot produce a receipt (35 EP). Their best case is contextual guessing (10 EP) → fails. Multiple wrong answers lock them out and raise a fraud flag.

The real owner (Student A) answers the scratch correctly, uploads a photo they have of the back of the watch, optionally provides a receipt → passes.

### 9.3 The hidden-attribute set is the secret

The set of hidden attributes the lost user provided at reporting time is the system's "password." It is:
- Never shown to anyone, including the lost user after submission (to prevent screen-share leaking).
- Only *queried* via adaptive questions (§10).
- Stored encrypted at rest, access-logged.

---

## 10. Adaptive Verification Questions

### 10.1 Generation

Questions are generated from the lost user's private attributes by an LLM with strict constraints:

- The question **must not reveal the answer**.
- The question **must not be answerable from the public photo**.
- The question must be **open enough** that the real owner can answer but a guesser cannot.

Bad: "What color is the sticker?" (reveals a sticker exists; narrows guessing).
Good: "Describe any distinctive marking, sticker, or engraving on the item, and where it is."

### 10.2 Difficulty levels

| Level | Example | Target |
|---|---|---|
| Easy (soft) | "Approximately what condition is it in?" | Real owner answers easily; guesser has some chance. |
| Medium | "Describe any distinctive marks or damage." | Real owner knows; guesser likely doesn't. |
| Hard | "What is engraved/written on the [specific part], verbatim?" | Real owner only. |

### 10.3 Number of questions

- Start with **2 easy + 1 medium**. If passed with margin, stop.
- If borderline, escalate to **1 hard**.
- Never ask all attributes — keep reserve for admin-led verification.

### 10.4 Answer matching

- **Exact/verbatim** fields (serial, engraving) → normalized string comparison (case-insensitive, whitespace-trimmed) + fuzzy match tolerance for typos.
- **Descriptive** fields → LLM judge compares claimant's answer to the stored private attribute and returns `{match: yes|partial|no, reason}`. The LLM never sees the *question* the user was asked; it sees the stored attribute and the claimant's free-text answer, and decides if the answer is consistent.
- **Partial correctness** → partial EP (e.g., soft answer worth 15 EP, partial gives 8).

### 10.5 Wrong-answer handling

| Event | Consequence |
|---|---|
| First wrong answer | No penalty; question replaced with a different one. |
| Second wrong answer | Warning shown; fraud risk +1. |
| Third wrong answer | Verification locked for this claim for 24h; fraud alert raised. |
| Repeated 24h lockouts | Account-level restriction; admin review. |

### 10.6 Suspicious-answer detection

- Answers that are **too generic** ("it's black, like the photo") → flagged, no EP.
- Answers that **copy the public description** → flagged, no EP, fraud +1.
- Answers that **contradict each other** across questions → flagged.
- Answers arriving **too fast** (< 3s after question shown) → flagged as possible automation.

### 10.7 Admin escalation

If verification is inconclusive after the full question set, the case is routed to admin review with: the match profile, the verification Q&A (answers + LLM judgments), fraud signals, and recommended action. Admin can ask additional private questions not in the auto-set.

---

## 11. AI Fraud Detection

### 11.1 Signals

| Signal | Weight | Detection method |
|---|---|---|
| Multiple claims on one item | High | Count of active claims per found item. |
| Repeated failed verification | High | Wrong-answer count per user. |
| Copy-pasted descriptions | Medium | Similarity of user's text to other reports / web sources. |
| Reused photographs | High | Perceptual hash match across reports + reverse image search against public web. |
| Multiple accounts (same human) | High | Device fingerprint, IP subnet, college email pattern, timing. |
| Unusual claim frequency | Medium | User claims N items in a short window. |
| Suspicious login behavior | Medium | New device + new geo + immediate claim. |
| Contradictory information | Medium | Answers conflict across questions. |
| Manipulated images | Medium | C2PA / metadata analysis, splice detection. |
| AI-generated fake evidence | Medium | Image-gen artifact detection; too-perfect photos of "damage." |
| Verification answer guessing | High | Fast answers, generic answers, repeated tries. |
| Coordinated activity | High | Two accounts interact only with each other; same login window. |

### 11.2 What happens on suspicion

Fraud signals feed a **risk score** (0–100). The score is **advisory**, never auto-banning.

| Risk | Action |
|---|---|
| 0–25 | None. |
| 26–50 | Soft flag; case proceeds but admin sees the flag. |
| 51–75 | **Mandatory admin review** before any handover. |
| 76–100 | Case frozen; account temporarily restricted from new claims; admin must clear. |

### 11.3 Human review mechanism

- Every risk ≥ 51 creates a **FraudAlert** record (§31) linked to the case and user.
- Admin sees: signals, evidence, user history, trust score, prior alerts.
- Admin actions: **Clear** (false positive), **Warn** (user notified, no ban), **Restrict** (temporary claim ban), **Ban** (permanent, super-admin co-sign required).
- No AI action ever bans a user. Banning requires two human approvals for a college-account ban (admin + super admin), because a ban effectively locks a student out of a campus service.

---

## 12. Image Privacy System

### 12.1 Image lifecycle

```
Upload ──► Server-side processing ──► Three derivatives:
                                    1. Original (private, encrypted at rest)
                                    2. Public blurred/cropped (public gallery)
                                    3. Limited preview (matched user, semi-visible)
```

### 12.2 Derivatives per role

| Image type | Public | Matched potential owner | Verified claimant | Admin | Owner/finder |
|---|---|---|---|---|---|
| Lost item (owner's reference) | Hidden | Hidden | Hidden | Full | Full (owner) |
| Found item — public derivative | Blurred + cropped | Blurred + cropped | Limited preview | Full | Full (finder) |
| Found item — original | Hidden | Hidden | Full (after pass) | Full | Full (finder) |

### 12.3 Processing

- **Blur:** Gaussian blur strong enough that text/scratches are unreadable, but silhouette and color are recognizable.
- **Crop:** if the item is distinctive, crop to a non-identifying region (e.g., show only the corner of a bag). If nothing safe can be shown, show a **category placeholder** ("A backpack was found in the Library") instead of any photo.
- **Watermark:** subtle platform watermark on all public derivatives to deter reuse; includes a per-item token so leaked images trace back to the viewer (forensic watermarking in V2).
- **Metadata strip:** EXIF/GPS removed on upload, server-side, before any derivative is created.
- **Signed URLs:** all image access is via short-lived signed URLs bound to a user + role + derivative. No public CDN URLs.
- **Expiration:** signed URLs expire in 10 minutes; re-fetch requires re-authorization.
- **Access control:** every image fetch is logged with user, item, derivative, timestamp, IP.

### 12.4 Anti-screenshot note

No technical measure stops a determined screenshot. The system's defense is **not** the blur — it's that the blurred image carries **no identifying information**, so a screenshot is useless for claiming. The blur is the *first* layer; hidden-attribute verification is the real defense.

---

## 13. AI Chatbot

### 13.1 Scope (what it does)

- Guide users through reporting (lost/found) step by step.
- Explain verification, handover, and status in plain language.
- Answer FAQ: "How do I prove an item is mine?", "How long until a match?", "What if I lost my phone?"
- Surface the user's own active cases and statuses.
- Escalate to admin (create a support ticket), but never act as admin.

### 13.2 Hard boundaries (what it never does)

| Never | Why |
|---|---|
| Reveals hidden attributes | That's the verification secret. |
| Reveals another user's identity or contact | Privacy. |
| Shows protected images | Privacy. |
| Approves or rejects claims | Ownership decisions are rule + admin, never an LLM. |
| Overrides admin decisions | Admin is the final authority. |
| Accepts evidence or "proof" in chat | Evidence goes through the formal upload flow. |
| Answers questions *about a specific found item's details* | Would leak info. Bot can only say "a [category] was found in [building]." |

### 13.3 Implementation

- RAG over a fixed knowledge base (FAQ + policy docs). The bot retrieves, it doesn't reason freely.
- Intent classifier routes to: `report_flow`, `status_query`, `faq`, `escalate`. Anything off-scope → "I can't help with that — I'll connect you to an admin."
- Every chatbot response is logged (for audit) but treated as non-authoritative.
- The bot is **stateless across cases** — it can't pull another user's case context.

---

## 14. Smart Lost Item Reporting

A progressive flow, not a wall of fields.

### 14.1 Steps

```
[1] Upload image
     │  (drag-drop or camera; multiple allowed)
     ▼
[2] AI analyzing… (animated, ~2s)
     │  shows: "Detected: backpack, black, leather, possible brand…"
     ▼
[3] Confirm attributes
     │  Public fields: category, color, brand, material  [✓][✏][✗]
     ▼
[4] Private ownership details  ← the verification substrate
     │  "What would only YOU know about this item?"
     │  - distinctive marks / damage
     │  - engravings / stickers
     │  - contents (for bags/wallets)
     │  - serial / IMEI (optional, admin-only)
     │  - a private-angle photo (optional but high-EP)
     ▼
[5] Where & when
     │  Building picker → optional area/room
     │  Date/time picker (defaults to today)
     ▼
[6] Public description
     │  One short paragraph; AI suggests based on confirmed attrs.
     ▼
[7] Additional evidence (optional)
     │  Receipt, purchase screenshot, prior photo
     ▼
[8] Review
     │  Card preview of how the report will look publicly
     │  Clear labeling: [PUBLIC] vs [PRIVATE — only you & admin]
     ▼
[9] Submit → "Searching for matches…"
```

### 14.2 UX principles

- Each step is one screen, one decision. No long forms.
- Back button always works; draft auto-saved.
- The private-attributes step is framed as "your proof of ownership" so users understand *why* they're providing it.
- Estimated time: 90 seconds for a typical report.

---

## 15. Smart Found Item Reporting

### 15.1 Steps

```
[1] Upload image(s) of the found item
[2] AI analyzing…
[3] Confirm attributes (public)
[4] Where & when found (building + area, date/time)
[5] Condition of item (intact / damaged / locked)
[6] Custody status
     - "I'm holding it" → direct handover path
     - "I handed it to security desk" → security-handover path
     - "I left it where I found it" → advise finder to secure it; flag for admin
[7] Optional: finder note to potential owner (platform-mediated, PII-filtered)
[8] Review → Submit
```

### 15.2 Differences from lost reporting

- No private-attribute step (finder doesn't know them — and shouldn't).
- **Custody status** drives the handover path (§17).
- The public description is auto-generated from confirmed attributes; finder can edit.

---

## 16. Item Status Lifecycle

### 16.1 States (revised)

```
Draft → Reported → AI_Processing → Searching → Candidate_Match →
Verification_Pending → Verification_In_Progress → Admin_Review →
Match_Approved → Handover_Pending → Handover_Scheduled →
Handover_Completed → Returned → Archived

Side states: Rejected, Disputed, Escalated, Expired
```

### 16.2 Transitions

| From | To | Trigger |
|---|---|---|
| Draft | Reported | User submits. |
| Reported | AI_Processing | Server pipeline starts. |
| AI_Processing | Searching | Attributes + embedding stored. |
| Searching | Candidate_Match | Match engine finds C ≥ 0.30. |
| Candidate_Match | Verification_Pending | Lost user notified; questions prepared. |
| Verification_Pending | Verification_In_Progress | Lost user starts answering. |
| Verification_In_Progress | Match_Approved | EP ≥ 70. |
| Verification_In_Progress | Admin_Review | 40 ≤ EP < 70, or risk ≥ 51, or dispute. |
| Verification_In_Progress | Rejected | EP < 40 after full set, or lockout. |
| Admin_Review | Match_Approved | Admin approves. |
| Admin_Review | Rejected | Admin rejects. |
| Admin_Review | Disputed | Admin sees conflicting claims. |
| Match_Approved | Handover_Pending | Handover initiated. |
| Handover_Pending | Handover_Scheduled | Both parties agree on slot. |
| Handover_Scheduled | Handover_Completed | QR/OTP confirmed. |
| Handover_Completed | Returned | Both parties confirm; case closed. |
| Any active | Expired | No activity for N days (category-dependent). |
| Returned / Rejected / Expired | Archived | After retention period. |
| Any | Escalated | Manual admin escalation. |

### 16.3 Expiration policy

| Category | Expire after no activity |
|---|---|
| Perishable/low-value (bottles, clothing) | 14 days |
| Standard | 30 days |
| High-value (phones, laptops, wallets) | 90 days |
| Documents/IDs | 60 days, then transferred to admin/security desk |

Expired ≠ deleted. Expired reports stay searchable by admin and can be revived if a match appears.

---

## 17. Secure Handover System

### 17.1 Two-tier handover

**Tier 1 — Direct (finder + owner meet):**
1. After `Match_Approved`, system generates a **one-time handover token** (random 6-digit OTP + signed QR).
2. Token delivered to the **lost user** only (in-app + email).
3. Lost user and found user coordinate via platform chat to pick a time/place (building-level, not exact).
4. At handover: lost user shows QR; found user scans (or enters OTP) in-app.
5. Both users tap **Confirm**. System records `Handover_Completed` with timestamp, location, both user IDs, token (hashed).

**Tier 2 — Via security desk (finder can't meet / high-value):**
1. Finder drops item at designated security desk; security scans a **drop token**.
2. System records custody transfer to security.
3. Lost user receives a **pickup token**; visits desk; security scans it.
4. Security confirms; system records handover with security staff ID.

### 17.2 Token properties

- 6-digit OTP + QR encoding the same underlying token.
- Single-use; expires in 24h (configurable).
- Bound to the specific case + both user IDs; can't be reused on another case.
- Hashed at rest; only the holder sees the plaintext.
- Regeneratable by admin if lost/expired (audit-logged).

### 17.3 Identity confirmation at handover

- Both parties must be logged in (session active).
- Optional photo of the handover (both parties consent; stored privately, admin-visible).
- Optional signature (V2).
- If either party can't confirm (no show), the case returns to `Handover_Pending` and after a timeout escalates to admin.

### 17.4 Audit

Every handover records: case ID, both user IDs, security staff ID (if Tier 2), token hash, timestamp, approximate location, confirmation method, optional photo ref. Immutable audit log entry.

---

## 18. Location Privacy

### 18.1 Granularity

| Field | Public | Matched user | Admin | Owner/finder |
|---|---|---|---|---|
| Building | Yes | Yes | Yes | Yes |
| Floor / area | No | Yes (after match) | Yes | Yes |
| Room / exact spot | No | No | Yes | Yes (own only) |
| GPS coordinates | Never stored | — | — | — |

**GPS is never collected.** Location is selected from a campus building/area taxonomy, not captured from the device. This eliminates a whole class of privacy risk.

### 18.2 Map

A campus map shows **building-level markers** for lost and found items. No pins inside buildings; no user-location tracking. The map is a *categorical overlay*, not a live tracker.

### 18.3 Time privacy

Public time is rounded to the nearest hour. Exact time is admin-visible only.

---

## 19. Notification System

### 19.1 Events and channels

| Event | In-app | Email | Push |
|---|---|---|---|
| New potential match (C ≥ 0.55) | ✅ | ✅ | ✅ (opt-in) |
| Weak candidate (0.30–0.55) | ✅ (digest) | ❌ | ❌ |
| Verification request | ✅ | ✅ | ✅ (opt-in) |
| Verification response received | ✅ | ❌ | ❌ |
| Admin review needed (admin side) | ✅ | ✅ | ❌ |
| Claim approved | ✅ | ✅ | ✅ |
| Claim rejected | ✅ | ✅ | ❌ |
| Handover ready | ✅ | ✅ | ✅ |
| Handover scheduled | ✅ | ✅ | ✅ |
| Handover completed | ✅ | ✅ | ❌ |
| Dispute opened | ✅ | ✅ | ❌ |
| Suspicious activity (user notified) | ✅ | ✅ | ❌ |
| Item expiring soon | ✅ | ✅ | ❌ |

### 19.2 Budgeting

- Max 1 push per user per hour.
- Low-priority in-app notifications batch into a daily digest.
- Every notification has a one-tap mute for its category.

---

## 20. Lost User Dashboard

### 20.1 Information architecture

```
[Header: avatar, notifications bell, messages, settings]
[Tabs: Active Lost | Matches | History | Profile]

Active Lost
├── Card per report: thumbnail (own), category, location, status badge,
│   "X potential matches", last update, [View] [Edit] [Withdraw]
├── Progress bar: Reported → Searching → Matched → Verifying → Handover → Returned

Matches (per report, expandable)
├── Potential match card: blurred thumbnail, "Found in [building] on [date]",
│   confidence label, [Start Verification] [Not Mine]
└── In-progress verification: questions answered X/Y, EP so far, next step

History
├── Returned (with date, finder anon, feedback prompt)
├── Expired (with option to reactivate)

Profile
├── Name, college email, department, verified badge
├── Trust indicators (internal, not a public score)
├── Notification preferences
├── Security: sessions, 2FA, password
```

### 20.2 Empty / loading / error states per §48–49.

---

## 21. Found User Dashboard

### 21.1 Information architecture

```
[Header: avatar, notifications, messages, settings]
[Tabs: My Found Items | Active Cases | History | Profile]

My Found Items
├── Card per found report: blurred thumbnail (public version), category,
│   location, custody status (holding / at security desk), status badge,
│   [View] [Edit] [Mark Handed to Security]
├── For each: list of potential matches with verification progress

Active Cases (where a match is in progress)
├── Case card: matched lost report (anon), verification status,
│   [Platform Chat] [Confirm Handover]
└── Action queue: "Awaiting owner's verification", "Ready for handover"

History
├── Returned (with date, feedback prompt)
├── Expired / released

Profile
├── Same as lost user, plus custody preferences (willing to hold / prefers security desk)
```

---

## 22. Admin Dashboard

### 22.1 Overview panel

| Metric | Display |
|---|---|
| Active lost items | count + 7-day trend |
| Active found items | count + 7-day trend |
| Active matches | count by confidence band |
| Successful recoveries (30d) | count + recovery rate |
| Pending verification | count + oldest age |
| Open disputes | count |
| Suspicious cases (risk ≥ 51) | count, red highlight |
| Admin workload | queue depth, avg review time |

### 22.2 Match Management

- Table: case, lost report (anon), found report (anon), v/t/c sub-scores, combined C, EP so far, risk, status.
- Filters: confidence band, category, age, risk.
- Actions: **Approve**, **Reject**, **Escalate**, **Request more info from user**, **Override** (with mandatory reason).
- Every action audit-logged.

### 22.3 User Management

- Search by email/name/department.
- Per-user: account status (active/restricted/banned), verification status, trust indicators, prior cases, fraud alerts, login history.
- Actions: **Warn**, **Restrict claims**, **Ban** (super-admin co-sign), **Clear flag**.

### 22.4 Item Management

- Lost items, found items, archived — searchable, filterable by category/status/age/value.
- High-value items pinned to top with special policy indicator.

### 22.5 Fraud Center

- Queue of FraudAlerts sorted by risk.
- Per alert: signals, evidence (matched photos, answer logs), user history, recommended action.
- Workflow: investigate → clear / warn / restrict / ban, with mandatory note.

### 22.6 Analytics

- Recovery rate over time.
- Average time-to-recovery by category.
- Popular lost-item categories (bar).
- Campus heatmap of loss locations.
- AI matching performance: precision/recall against admin-labeled outcomes, false-positive and false-negative review queue.
- Admin workload: cases reviewed per admin, avg time.

---

## 23. Admin Verification Workflow

When AI is uncertain (40 ≤ EP < 70, or risk ≥ 51, or dispute):

```
1. Case routed to Admin_Review queue.
2. Admin sees: match profile, full images (both sides), hidden attributes,
   verification Q&A + LLM judgments, fraud signals, user histories.
3. Admin may:
   a. Ask additional private questions (not in the auto-set) via platform chat.
   b. Request further evidence (receipt, private-angle photo).
   c. Interview both parties via platform chat (PII-filtered).
4. Admin decision: Approve / Reject / Escalate to Super Admin (high-value/ban).
5. Decision recorded with: admin ID, reasoning note, evidence reviewed, timestamp.
6. Users notified; case proceeds to handover or closes.
```

### 23.1 Improvement over the original

The original flow sent *every* medium-confidence case to admin. Here, **only inconclusive verifications** reach admin — the verification engine resolves most cases, and admin review is reserved for genuine ambiguity. Target: <10% of cases.

---

## 24. Dispute Resolution

### 24.1 Dispute triggers

- Two users claim the same item.
- Lost user says verification was wrong (they failed and believe they should have passed).
- Found user disputes the claimant ("this isn't the right person").
- AI matched two objects that are actually different.
- Users give conflicting information.
- Item can't be confidently identified.

### 24.2 Workflow

```
Dispute opened (by user or auto-detection)
  │
  ▼
Case → Disputed state; both parties notified.
  │
  ▼
Admin assigned (auto by load, or manual).
  │
  ▼
Admin reviews full evidence + can request more.
  │
  ├── If two claimants: each gets a *different* private question set
  │   (so they can't copy each other). Highest EP wins; both must pass.
  │
  ├── If found user disputes: admin may ask found user to confirm a
  │   detail only someone who physically held the item would know.
  │
  ├── If AI mis-match: admin can break the match and return both
  │   reports to Searching.
  │
  ▼
Decision: Approve one / Reject both / Re-match.
  │
  ▼
All parties notified; audit logged; appeal window (48h) for rejected party.
```

### 24.3 Two-claimant disambiguation

The key technique: **non-overlapping question sets.** Claimant 1 gets questions from attributes A, B; Claimant 2 gets questions from C, D. They cannot learn from each other's answers because the questions differ. The real owner passes both their set and the other's; the fake fails at least one.

---

## 25. High-Value Item Workflow

### 25.1 Categories flagged high-value

Smartphones, laptops, tablets, wallets (with cards/cash), expensive watches, jewelry, cash, IDs/passports, important documents.

### 25.2 Special policies

| Policy | Requirement |
|---|---|
| Mandatory admin review | Even if EP ≥ 70, a high-value handover requires admin co-sign. |
| 2FA on claim | Claimant must complete 2FA before claiming a high-value item. |
| Longer expiration | 90 days (vs 30). |
| Tier-2 handover preferred | Routed through security desk where possible. |
| Serial/IMEI capture | Lost user can enter; stored admin-only; matched privately (never shown to public or other party). |
| Police/liaison escalation | For stolen-suspected items, admin can flag for campus security liaison. |

---

## 26. Special Cases by Category

| Category | Adaptation |
|---|---|
| Mobile phone | Model + case + lock-screen wallpaper (private) + damage + IMEI (admin-only). If locked, finder can't verify ownership via screen — rely on IMEI + private photo. |
| Laptop | Model + stickers + lock-screen + serial (admin-only). |
| Wallet | Color + brand + **contents** (cards, IDs, cash amount — private) + unique markings. Contents are the strongest private signal. |
| Student ID card | Name + ID number (admin-only) + photo. Return is near-certain if the name matches; handover via security desk. |
| Keys | Number of keys, keychain, any label/fob. Hard to verify — rely on keychain description + location. |
| Earbuds | Model + case + serial (admin-only). Often indistinguishable — disambiguation via private pairing detail. |
| Bags | Brand + contents + patches/keychains + damage. Contents are private verification. |
| Books | Title + author + any notes/inscriptions inside (private) + condition. |
| Clothing | Color + brand + size + any distinctive mark. Low-value; standard flow. |
| Documents | Title + name on document (admin-only) + page count. Routed to admin/security. |
| Cash | Amount + denomination breakdown + container (envelope/wallet). **No identifying marks possible** → mandatory admin + security desk handover; claimant must specify amount exactly. |
| Unknown object | AI can't categorize → "Unknown" category; admin reviews; finder describes in free text. |

---

## 27. Category-Specific AI Verification

### 27.1 Phone

| Attribute | Public/Private | EP if correct |
|---|---|---|
| Model | Public | — |
| Case (color/style) | Public (color) / Private (specific case detail) | 15 |
| Lock-screen wallpaper | Private | 30 |
| Damage location | Private | 20 |
| Accessory (charger, earbuds) | Private | 15 |
| IMEI / serial | Private (admin-only) | 35 |

### 27.2 Wallet

| Attribute | Public/Private | EP |
|---|---|---|
| Color | Public | — |
| Brand | Public | — |
| Internal contents (cards listed) | Private | 30 |
| Cash amount | Private | 25 |
| Unique marking inside | Private | 30 |

### 27.3 Bag

| Attribute | Public/Private | EP |
|---|---|---|
| Brand | Public | — |
| Color | Public | — |
| Contents | Private | 30 |
| Patches / keychains | Private | 20 |
| Damage | Private | 20 |

The pattern: **public attributes narrow the candidate pool; private attributes prove ownership.**

---

## 28. Authentication

### 28.1 Recommended model

**College email (preferred) + optional Google OAuth + 2FA for high-value actions.**

| Method | Use | Rationale |
|---|---|---|
| College email + password | Primary | Verifiable affiliation (§29); free; simple. |
| Google OAuth | Optional | Convenience for users who already use Google for their college email. |
| 2FA (TOTP) | Required for high-value claims, optional otherwise | Protects account-takeover attacks on high-value cases. |
| Magic link (email) | Passwordless fallback | For users who forget passwords; college email is the trust anchor. |

### 28.2 Flows

- **Registration:** college email → verification link → set password → profile → onboarding (§47).
- **Login:** email + password (or OAuth) → optional 2FA prompt → session.
- **Password reset:** email link, time-limited 15 min, single-use.
- **Account recovery:** college email is the anchor; if email is lost (graduated?), admin-assisted recovery with ID proof.
- **Session management:** refresh tokens, device list, remote logout.
- **Suspicious login detection:** new device + new geo + immediate sensitive action → step-up auth.

---

## 29. College-Only Access

### 29.1 Decision: college email mandatory for the core trust model

Registration requires a college email from an allowlisted domain (e.g., `*.edu`, `@university.edu`). This is the single most effective anti-outsider control and makes multi-accounting far harder (one student, one email).

### 29.2 Allowlist

Admin-configured list of accepted email domains. Public email providers (gmail, yahoo) rejected unless they're the official college Google Workspace domain.

### 29.3 Exceptions

- **Visiting students / conference attendees:** admin-issued temporary accounts (time-limited).
- **Public found-item reporting:** a public visitor can *submit* a found item report but must register with a college email before the report is published; this lets a good Samaritan report without a pre-existing account while keeping the trust boundary intact.

### 29.4 Preventing outsiders

- Email domain allowlist at registration.
- Optional: student ID verification (upload ID, admin-approved) for elevated trust — not required for basic use, but grants a "verified" indicator.
- No anonymous claims. Ever.

---

## 30. Privacy & Security Architecture

### 30.1 Conceptual controls

| Area | Control |
|---|---|
| Authentication | College email + bcrypt/argon2 password hashing; OAuth; 2FA TOTP. |
| Authorization | RBAC + object-level permissions (case-level: only participants + admin see a case). |
| Database security | Encryption at rest; row-level access policies; parameterized queries (no string-concat SQL); least-privilege service accounts. |
| Image security | Encrypted storage; signed short-lived URLs; derivative-only public access; metadata stripped. |
| API security | Authenticated endpoints; per-user rate limits; signed URLs for media; CSRF tokens for state-changing requests; CORS allowlist. |
| Input validation | Server-side validation on all inputs; strict schemas; file upload type/size limits; image re-encoding to strip payloads. |
| XSS | Output encoding; CSP; no raw HTML rendering of user content. |
| Injection | ORM/parameterized queries; no raw SQL; input allowlists for enums. |
| Sessions | HttpOnly + Secure + SameSite cookies; short-lived access token + refresh token; server-side session revocation. |
| Audit logging | Every sensitive action (claim, verification attempt, admin decision, image access, handover) logged with user, action, target, timestamp, IP. Immutable, append-only. |
| Encryption | TLS 1.2+ in transit; AES-256 at rest for DB and image storage; envelope encryption for the most sensitive fields (hidden attributes). |
| Secrets management | Env vars / secret manager (e.g., Supabase Vault, AWS Secrets Manager); never in code; rotated. |
| Rate limiting | Per-user and per-IP limits on auth, claim, verification, and search endpoints. |

### 30.2 Layered defense

The system assumes any single layer can fail. Image blur can be bypassed → hidden questions defend. Questions can be guessed → attempt lockout defends. Account can be stolen → 2FA defends. 2FA can be bypassed → anomaly detection defends. No single point of trust.

---

## 31. Database Design

Conceptual entities. No SQL. Field lists are indicative, not exhaustive.

### 31.1 Entities

```
Users ──< Profiles
Users ──< LostItems
Users ──< FoundItems
LostItems ──< Matches ──< FoundItems
Matches ──< Claims ──< VerificationAnswers
LostItems ──< HiddenAttributes (private)
Matches ──< Conversations ──< Messages
Users ──< Notifications
Matches ──< HandoverRecords
Matches ──< AdminReviews
Users ──< FraudAlerts
Matches ──< Disputes
Users ──< AuditLogs
Categories (lookup)
Locations (lookup, campus taxonomy)
```

### 31.2 Key entities

**Users**
- Purpose: identity + auth.
- Fields: id, email, password_hash, role_flags (is_admin, is_security, is_super_admin), status (active/restricted/banned), 2fa_secret, created_at, last_login, trust_score (internal), verified (bool).
- Ownership: self. Access: self + admin (admin sees limited).

**Profiles**
- Fields: user_id, display_name, department, notification_prefs, custody_pref, avatar_url.
- Ownership: self.

**LostItems**
- Fields: id, user_id, category_id, public_description, public_attributes (jsonb: color, brand, material...), location_id, lost_at (datetime, rounded), status, image_refs, embedding_id, created_at, expires_at, value_tier (standard/high).
- Private sub-record `HiddenAttributes`: id, lost_item_id, attributes (jsonb, encrypted), photo_refs (private-angle).
- Ownership: lost user. Access: owner + admin. Public sees only public_attributes + blurred image.

**FoundItems**
- Fields: id, user_id, category_id, public_description, public_attributes, location_id, found_at, custody_status (holding/security_desk/left), status, image_refs (original + public derivative), embedding_id, created_at.
- Ownership: found user. Access: found user + admin + (matched potential owner sees limited preview).

**Matches**
- Fields: id, lost_item_id, found_item_id, v_score, t_score, c_score, combined_c, confidence_label, status, created_at, decided_at.
- Ownership: system. Access: both parties (limited) + admin (full).

**Claims**
- Fields: id, match_id, claimant_user_id, ep_total, status (pending/in_progress/approved/rejected/locked), attempt_count, locked_until, created_at.
- Ownership: claimant. Access: claimant + admin.

**VerificationQuestions / VerificationAnswers**
- Questions: id, match_id (or claim_id), attribute_ref, difficulty, question_text, created_at.
- Answers: id, question_id, answer_text, llm_judgment (match/partial/no + reason), ep_awarded, answered_at, time_to_answer_ms.
- Access: claimant (their own answers) + admin. Never the other party.

**Conversations / Messages**
- Conversations: id, match_id, participant_user_ids[], created_at, status.
- Messages: id, conversation_id, sender_id, body (PII-filtered), created_at, read_at.
- Access: participants + admin (metadata only unless escalated).

**Notifications**
- Fields: id, user_id, type, payload (jsonb), channel, read_at, created_at.

**HandoverRecords**
- Fields: id, match_id, tier (direct/security), token_hash, issued_at, expires_at, confirmed_at, confirmer_user_ids[], security_staff_id (nullable), location_id, photo_ref (nullable), method (qr/otp).
- Immutable after confirmed_at.

**AdminReviews**
- Fields: id, match_id, admin_id, decision (approve/reject/escalate), reasoning, evidence_refs, created_at.

**FraudAlerts**
- Fields: id, user_id, match_id (nullable), risk_score, signals (jsonb), status (open/cleared/warned/restricted/banned), admin_id, resolution_note, created_at, resolved_at.

**Disputes**
- Fields: id, match_id, opened_by (user/admin), reason, status, admin_id, decision, created_at, resolved_at.

**AuditLogs**
- Fields: id, actor_user_id, action, target_type, target_id, metadata (jsonb), ip, created_at. Append-only.

**Categories / Locations**
- Lookup tables. Locations: id, name, type (building/area/zone), parent_id.

### 31.3 Access permission matrix (object-level)

| Object | Owner | Other party | Admin | Public |
|---|---|---|---|---|
| LostItem | Full | No | Full | Public attrs only |
| HiddenAttributes | Full | No | Full | No |
| FoundItem (original img) | Full | No | Full | No |
| FoundItem (public derivative) | — | — | Full | Yes (blurred) |
| Match | Limited | Limited | Full | No |
| Claim + Answers | Own | No | Full | No |
| Conversation | Own messages | Own messages | Metadata | No |
| HandoverRecord | Own view | Own view | Full | No |
| AuditLog | — | — | Full (super admin) | No |

---

## 32. System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Frontend (Web PWA — React/Next.js)                           │
│  - Public pages, dashboards, admin console, chatbot widget    │
└────────────────────────┬─────────────────────────────────────┘
                           │ HTTPS / REST + WS
┌────────────────────────▼─────────────────────────────────────┐
│  API Gateway / Auth                                           │
│  - Auth (email/OAuth/2FA), session, rate limiting, CSRF       │
└────────────────────────┬─────────────────────────────────────┘
                           │
┌────────────────────────▼─────────────────────────────────────┐
│  Backend API (Node/Next.js route handlers or FastAPI)         │
│  - Business logic, rule engine, RBAC, object-level perms     │
└───┬──────────┬──────────┬──────────┬───────────┬─────────────┘
    │          │          │          │           │
    ▼          ▼          ▼          ▼           ▼
┌───────┐ ┌────────┐ ┌─────────┐ ┌────────┐ ┌──────────┐
│ DB    │ │ Image  │ │ AI      │ │ Match  │ │ Notify   │
│(Postgres│ │Storage │ │ Services │ │ Engine │ │ Service  │
│+pgvector)│ │(S3/R2) │ │(vision, │ │(vector │ │(email,   │
│       │ │        │ │ OCR,LLM)│ │ search)│ │ push)    │
└───────┘ └────────┘ └─────────┘ └────────┘ └──────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ Admin Portal │
                    └─────────────┘
```

### 32.1 Component responsibilities

- **Frontend:** UI, progressive forms, dashboards, chatbot widget, QR scan/OTP entry, admin console. PWA for mobile installability.
- **API Gateway / Auth:** authentication, session, rate limiting, request validation, CSRF.
- **Backend API:** all business logic, rule engine, RBAC + object-level permissions, orchestrates AI services, enforces verification thresholds, audit logging.
- **Database (Postgres + pgvector):** relational data + vector embeddings in one store. Row-level security for object-level access.
- **Image storage (S3-compatible / Cloudflare R2):** originals + derivatives, signed URLs.
- **AI services:** vision/OCR/embedding (hosted or API), LLM (for question generation + answer judging), fraud scoring. Invoked by backend, never directly by frontend.
- **Matching engine:** candidate generation via vector search + scoring; runs as a backend service or scheduled job.
- **Notification service:** in-app, email, push; budgeted.
- **Admin portal:** same frontend, different role view; dense, case-management oriented.

---

## 33. AI Architecture

### 33.1 Separation of AI responsibilities

| AI component | Task | Type | Makes final decisions? |
|---|---|---|---|
| Vision classifier | Category, color, brand, attributes | Deterministic model | No — suggestions only. |
| OCR | Visible text, serials | Deterministic | No. |
| Embedding model | Visual similarity vector | Deterministic | No — candidate gen only. |
| Matching engine | Candidate scoring | Deterministic + weighted rules | No — proposes matches. |
| LLM (question gen) | Generate verification questions | Generative | No — output reviewed by rule engine for leakage. |
| LLM (answer judge) | Judge answer vs stored attribute | Generative | No — produces a judgment; rule engine converts to EP. |
| Fraud scoring | Risk score from signals | Deterministic + ML | No — advisory only. |
| Chatbot | Navigation, FAQ, status | Generative (RAG) | No — bounded scope. |

### 33.2 Deterministic vs AI

- **Deterministic (rules):** access control, EP thresholds, attempt limits, expiration, handover token issuance, audit logging, notification routing. These are *never* delegated to AI because they must be predictable and auditable.
- **AI (probabilistic):** attribute extraction, candidate matching, question generation, answer judging, fraud signals. These *propose*; rules *decide*.

### 33.3 The non-negotiable rule

> **No LLM ever makes a final ownership decision.** The LLM judges whether an answer matches a stored attribute; the rule engine sums EP and applies thresholds; the admin handles the ambiguous band. Ownership is established by accumulated evidence + human oversight, never by a model's verdict.

---

## 34. AI + Rule Engine Hybrid

### 34.1 Why hybrid is safer

| Concern | Pure AI risk | Hybrid mitigation |
|---|---|---|
| Hallucination | LLM "decides" owner is correct | LLM judges answer; rules sum EP; threshold is fixed. |
| Bias / drift | Model favors certain users | Rules are auditable and fixed; AI output is one input. |
| Unpredictability | Same case → different decision | Rules are deterministic; AI only contributes signals. |
| Gaming | Prompt-injection via answer text | LLM sees stored attribute + answer, not the question; output is structured (match/partial/no); rules ignore unstructured output. |
| Accountability | "The AI did it" | Every decision has a rule trace + optional human. |

### 34.2 Data flow

```
AI signals (v_score, t_score, c_score, attribute suggestions,
            answer judgments, fraud signals)
            │
            ▼
   Rule Engine (deterministic)
   - threshold checks
   - attempt limits
   - permission checks
   - expiration
   - escalation triggers
            │
            ├── auto-decision (clear pass / clear fail)
            └── human decision (ambiguous band → admin)
```

---

## 35. Search Experience

### 35.1 What each role can search

| Role | Can search | Sees |
|---|---|---|
| Anonymous | Found items only | Blurred derivative, category, building, date (rounded). |
| Logged-in user | Found items + own lost items | Same + "Report similar lost" prompt. |
| Matched potential owner | The matched found item | Limited preview + start verification. |
| Admin | Everything | Full records, all filters. |

### 35.2 Filters

Category, date range, campus area, color, brand, status. Search never returns hidden attributes or full images. Search results are paginated and rate-limited (per-user query budget) to prevent scraping.

### 35.3 Search vs match

- **Search** = user-initiated browsing of the public found-item gallery.
- **Match** = system-initiated candidate generation (proactive). Both end at the same verification gate.

---

## 36. Real-Time Features

Only where it earns its place:

| Feature | Real-time? | Why |
|---|---|---|
| Notifications | ✅ Push/in-app | User needs to act on matches quickly. |
| Match updates | ❌ Polling/digest is fine | Matches aren't sub-second urgent. |
| Verification status | ❌ | User is actively in the flow; refresh on action is enough. |
| Chat (user↔user, user↔admin) | ✅ WebSocket | Conversation needs liveness. |
| Admin queue updates | ✅ | Admins benefit from live queue. |
| Handover status | ❌ | One-shot confirmation; no live stream needed. |

Real-time is via WebSocket (e.g., Supabase Realtime or a small WS gateway). Not used for search or browsing.

---

## 37. Chat / Communication System

### 37.1 Platform-mediated only

No direct contact details are exchanged. All communication goes through platform chat with a **PII filter** that detects and blocks phone numbers, email addresses, and URLs before the message is stored.

### 37.2 Channels

- **User ↔ User (within a match):** only after a match is established; both participants are the case parties. No third party can join.
- **User ↔ Admin:** initiated by user (support) or admin (investigation). Admin channel shows a verified "Admin" badge that cannot be spoofed in user-to-user chat.

### 37.3 Protections

- Messages stored; PII-filtered on send.
- Edit/delete disabled (for audit integrity); users can redact by request to admin.
- Admins see metadata (participants, timestamps) by default; full message body only when a case is escalated.
- No file sharing in chat (evidence goes through the formal upload flow).

### 37.4 Why not expose contact

Once phone numbers are exchanged, the platform's protections end. The handover leaves the audited channel. Platform mediation keeps the recovery inside the trust boundary until the QR/OTP-confirmed handover.

---

## 38. Trust System

### 38.1 Internal signals (not a public score)

- Verified college identity (email domain + optional ID verification).
- Successful prior returns.
- Prior disputes (as victim or as claimant).
- Prior fraud alerts (cleared or not).
- Account age.

### 38.2 How it's used

- As a **minor tie-breaker** in ambiguous verifications (+5 EP max).
- To set **default scrutiny** for new accounts on high-value claims (new account + high-value → mandatory admin review).
- To prioritize admin queue (low-trust cases reviewed first).

### 38.3 What it is NOT

- Not a public reputation score. Users cannot see each other's trust. A public score creates incentives to game it and can unfairly penalize legitimate users who had one bad case. Trust is an internal risk signal, not a leaderboard.

---

## 39. Analytics

### 39.1 User analytics

- Items reported (lost/found), recovery progress, successful recoveries, average time-to-recovery for their items.

### 39.2 Admin analytics

- Recovery rate (returned / reported) over time.
- Average time-to-recovery by category.
- Category trends (most-lost item types).
- Location trends (buildings with most losses — informs campus operations).
- Match accuracy: precision/recall against admin-labeled outcomes; false-positive and false-negative review queue to tune the engine.
- Fraud attempts over time.
- Verification failure rate.
- Admin workload (cases/admin, avg review time).

### 39.3 Privacy

Analytics are aggregated and anonymized. No individual user behavior is exposed in analytics views.

---

## 40. Accessibility

- **Responsive:** mobile-first, tablet, desktop; 16px side gutters on mobile; no horizontal scroll.
- **Keyboard navigation:** all interactive elements reachable; visible focus rings; logical tab order.
- **Screen readers:** semantic HTML, ARIA labels on icon buttons, live regions for status updates, alt text on meaningful images.
- **Contrast:** WCAG AA minimum (4.5:1 text); aim for AAA on body text.
- **Clear errors:** plain-language messages, no codes; actionable guidance ("Your password must be at least 12 characters" not "ERR_PWD_LEN").
- **Simple language:** the chatbot and UI copy target a non-technical reading level.
- **Motion:** respect `prefers-reduced-motion`; decorative animations disabled or simplified.
- **Forms:** labels associated with inputs; error messages linked via `aria-describedby`; no color-only signaling.

---

## 41. Sitemap / Information Architecture

```
PUBLIC
├── /                       Landing
├── /about                   About
├── /how-it-works            How It Works
├── /safety                  Safety & Privacy
├── /faq                     FAQ
├── /found                   Public found-item gallery (blurred)
├── /login
└── /register

AUTHENTICATED (User)
├── /dashboard               Unified dashboard (tabs: Lost / Found / Matches / Messages)
├── /report-lost             Progressive lost reporting flow
├── /report-found            Progressive found reporting flow
├── /items/lost/:id          Lost item detail (own)
├── /items/found/:id         Found item detail (own or matched preview)
├── /matches/:id             Match detail + verification
├── /verify/:matchId         Verification question flow
├── /handover/:matchId       Handover QR/OTP
├── /messages                Conversations list
├── /messages/:id            Conversation
├── /notifications
├── /profile
├── /settings                Security, notifications, sessions
└── /help                    Chatbot + support

ADMIN
├── /admin                    Overview
├── /admin/matches            Match management
├── /admin/verification       Verification queue
├── /admin/users              User management
├── /admin/items              Item management
├── /admin/fraud              Fraud center
├── /admin/disputes           Disputes
├── /admin/handovers          Handover management
├── /admin/analytics          Analytics
├── /admin/categories        Category/location taxonomy
├── /admin/settings           System settings
├── /admin/audit              Audit logs (super admin)
└── /admin/staff              Admin/security staff management (super admin)
```

---

## 42. Screen Specifications

Each screen: name, purpose, role, layout, key content, states, security notes. (Full wireframe-level detail for every screen would double this doc; the most important screens are specified in depth, the rest by pattern.)

### 42.1 Landing (`/`)

- **Purpose:** convert visitors to registered users; communicate trust.
- **Role:** public.
- **Layout:** hero, social proof, how-it-works, AI section, privacy section, FAQ, footer (see §46).
- **States:** default; loading skeletons for any async stats.
- **Security:** no sensitive data; public only.

### 42.2 Register (`/register`)

- **Purpose:** college-email signup.
- **Fields:** college email, password, confirm; then email-verification link.
- **Validation:** email domain allowlist; password policy (≥12 chars); client + server validation.
- **States:** empty, validating, email-sent, email-verified→onboarding, error (domain not allowed, email exists).
- **Security:** rate-limited (5 attempts/IP/15min); honeypot field; CSRF.

### 42.3 Login (`/login`)

- **Fields:** email, password, "remember me", 2FA when required.
- **States:** empty, submitting, 2FA-required, success→dashboard, error (invalid, locked).
- **Security:** generic error ("invalid email or password"); lockout after 10 fails/15min; anomaly detection.

### 42.4 Dashboard (`/dashboard`)

- **Purpose:** at-a-glance active work for the user.
- **Role:** authenticated.
- **Layout:** top tabs (Lost / Found / Matches / Messages); summary cards; notification preview.
- **Empty state:** friendly prompt to report or browse found items.
- **Loading:** skeleton cards.
- **Security:** only own data; server enforces.

### 42.5 Report Lost (`/report-lost`)

- **Purpose:** progressive lost reporting (§14).
- **Layout:** single-step wizard; progress indicator; AI analysis animation between steps.
- **AI components:** image analysis overlay, attribute suggestion chips, private-attribute helper.
- **States:** per-step validation; draft autosave; submit→"Searching" animation.
- **Security:** private fields clearly labeled; draft not publicly visible.

### 42.6 Report Found (`/report-found`)

- **Purpose:** progressive found reporting (§15).
- **Layout:** similar wizard; custody-status selector is the key branch.
- **AI components:** image analysis; auto public description.
- **Security:** original image never leaves private storage; only derivative published.

### 42.7 Found Item Detail (`/items/found/:id`)

- **Purpose:** view a found item (public, matched, or own).
- **Role-dependent content:**
  - Public: blurred image, category, building, date (rounded). CTA: "Is this yours? Register to verify."
  - Matched potential owner: limited preview + "Start verification."
  - Finder (own): full image, custody controls, match list.
  - Admin: full image + all metadata + hidden attributes (if linked to a match).
- **Security:** derivative-only for public; signed URLs; no hidden attributes ever public.

### 42.8 Match Detail + Verification (`/matches/:id`, `/verify/:matchId`)

- **Purpose:** show a potential match and run verification.
- **Layout:** match summary (why matched, in plain language); verification question card; EP progress bar (user sees "evidence collected" not raw EP); submit answer.
- **AI components:** question card; answer-judgment pending state.
- **States:** question shown, answering, judging, correct/partial/wrong, locked (after 3 fails), admin-review, approved→handover.
- **Security:** questions never reveal answers; attempt limits enforced server-side; timing logged.

### 42.9 Handover (`/handover/:matchId`)

- **Purpose:** confirm physical return.
- **Layout:** QR display (lost user) / scan + OTP entry (found user) / confirm buttons; Tier-2 security-desk variant.
- **States:** token issued, awaiting scan, scanned-awaiting-confirm, confirmed, expired, no-show.
- **Security:** single-use token; 24h expiry; both parties must confirm; audit logged.

### 42.10 Messages (`/messages/:id`)

- **Purpose:** platform-mediated chat.
- **Layout:** thread view; input box; PII-block notice.
- **States:** typing, sent, delivered, read; PII-blocked message preview with reason.
- **Security:** PII filter on send; no file transfer; admin badge non-spoofable.

### 42.11 Profile & Settings

- **Profile:** name, department, avatar, verified badge, custody prefs.
- **Settings:** notifications, security (2FA, sessions, password), data export, account deletion.
- **Security:** 2FA enrollment; session list with remote logout; deletion is soft + audit-logged.

### 42.12 Admin — Overview (`/admin`)

- **Purpose:** control center (§22).
- **Layout:** KPI grid, trend charts, alert feed, queue summary.
- **Density:** high; designed for desktop-first admin use.
- **Security:** admin role required; every view audit-logged.

### 42.13 Admin — Match Management

- **Layout:** filterable table; row → detail drawer with full evidence.
- **Actions:** approve, reject, escalate, request info, override (reason required).
- **Security:** all actions audit-logged; override requires note.

### 42.14 Admin — Fraud Center

- **Layout:** alert queue by risk; per-alert evidence panel; resolution actions.
- **Security:** ban requires super-admin co-sign.

### 42.15 Admin — User Management

- **Layout:** searchable user table; per-user drawer with status, history, alerts.
- **Actions:** warn, restrict, ban (co-sign), clear flag.

### 42.16 Admin — Analytics

- **Layout:** charts (recovery rate, time-to-recovery, categories, locations, match accuracy, workload).
- **Security:** aggregated/anonymized only.

### 42.17 Shared states

Every screen specifies: empty, loading (skeleton), error (with retry), success, and mobile behavior (stacked, bottom-sheet modals, large tap targets). See §48–50.

---

## 43. UI/UX Design System

### 43.1 Direction

Modern, trustworthy, premium, AI-powered, college-friendly, secure. Calm, not flashy. Trust signals over decoration.

### 43.2 Color system (tokens on `:root`)

| Token | Light | Dark | Use |
|---|---|---|---|
| `--primary` | Indigo `#4F46E5` | `#818CF8` | Primary actions, brand. |
| `--secondary` | Slate `#475569` | `#94A3B8` | Secondary actions. |
| `--accent` | Teal `#14B8A6` | `#2DD4BF` | AI accents, highlights. |
| `--success` | Emerald `#10B981` | `#34D399` | Approved, returned. |
| `--warning` | Amber `#F59E0B` | `#FBBF24` | Caution, ambiguous. |
| `--danger` | Red `#EF4444` | `#F87171` | Rejected, fraud, errors. |
| `--bg` | `#F8FAFC` | `#0B1120` | Page background. |
| `--surface` | `#FFFFFF` | `#111827` | Cards, panels. |
| `--text` | `#0F172A` | `#E5E7EB` | Body text. |
| `--text-muted` | `#64748B` | `#94A3B8` | Captions. |
| `--border` | `#E2E8F0` | `#1F2937` | Dividers. |

Dark mode via `@media (prefers-color-scheme: dark)` guarded by `:root:not([data-theme="light"])` and `:root[data-theme="dark"]`.

### 43.3 Typography

| Role | Font | Size/weight |
|---|---|---|
| Heading | Inter / system-ui | 600–700, 1.5–2.5rem |
| Body | Inter / system-ui | 400, 1rem, 1.5 line-height |
| Caption | Inter | 400, 0.875rem, muted |
| Button | Inter | 600, 0.95rem |

Use system font stack as fallback. Load Inter from Google Fonts only.

### 43.4 Components

- **Buttons:** primary (filled), secondary (outline), ghost (text), danger; sizes sm/md/lg; loading state with spinner; disabled.
- **Cards:** surface bg, subtle border, 12px radius, soft shadow; used for items, matches, cases.
- **Forms:** labeled inputs, helper text, error text (red + icon), focus ring (primary).
- **Dialogs:** centered modal, backdrop blur, esc-to-close, focus trap.
- **Tables:** sticky header, sortable, row hover, dense variant for admin.
- **Badges:** status pills (color + label): Searching, Matched, Verifying, Approved, Returned, Disputed, Expired.
- **Tabs:** underline indicator; keyboard accessible.
- **Progress:** linear (verification progress), circular (AI processing), stepped (wizard).
- **Toasts:** bottom-right; auto-dismiss; severity variants.
- **Dropdowns:** keyboard navigable; outside-click close.
- **Tooltips:** on hover/focus; concise.
- **Navigation:** top bar (user) + sidebar (admin); responsive collapse to bottom tab bar on mobile.

### 43.5 AI components

See §44.

---

## 44. AI Visual Language

Subtle, not "AI glowing everywhere."

| Element | Treatment |
|---|---|
| AI analysis indicator | Small accent-colored pulse + "Analyzing…" label; 2–3s typical. |
| Match confidence | Label ("Strong / Possible / Worth a look"), not a percentage; small accent dot. |
| Processing animation | Linear progress or gentle spinner; never blocks >3s without a status message. |
| Verification progress | Stepper with check/partial/wrong icons; EP shown as "evidence collected" bar. |
| Smart suggestions | Chip with a subtle accent border + "AI suggested" tag; confirm/edit/remove actions. |
| AI-generated question | Small "AI-generated" caption; no fanfare. |

Principle: AI is a quiet assistant. The product's visual emphasis is on *trust* (calm colors, clear status) not on *technology* (glowing gradients).

---

## 45. 3D / Animation Design

For hackathon impressiveness without sacrificing usability.

| Animation | Type | Purpose |
|---|---|---|
| Hero | Lottie/3D lost-item floating | Decorative; landing only. |
| AI scanning | Overlay sweep on uploaded image | Communicates "AI is working." |
| Match found | Subtle card highlight + pulse | Communicates a new match. |
| Verification progress | Stepper fill | Communicates evidence accumulation. |
| Handover success | Confetti + checkmark | Celebrates recovery. |
| Page transitions | Fade/slide (200ms) | Polish. |
| Micro-interactions | Button hover, card lift | Polish. |

Rules:
- Decorative animations respect `prefers-reduced-motion`.
- Status-communicating animations are kept (they convey meaning) but simplified under reduced-motion.
- No animation blocks interaction or hides content.
- Performance: CSS/Lottie over heavy 3D; lazy-load on landing.

---

## 46. Landing Page

### 46.1 Hero

- **Headline:** "Lost something on campus?"
- **Subhead:** "CampusRecover AI matches lost and found items — and makes sure the item gets back to its real owner, not a stranger."
- **Primary CTA:** "Report a lost item"
- **Secondary CTA:** "I found something"
- **Visual:** animated floating lost-item illustration.

### 46.2 Sections

1. **How it works** — 3 steps: Report → AI matches → Secure handover.
2. **AI matching** — "We compare photos, descriptions, and context to find likely matches."
3. **Secure verification** — "We ask questions only the real owner can answer."
4. **Privacy protection** — "Photos are blurred. Details are hidden. Your identity stays yours."
5. **Recovery process** — timeline graphic.
6. **Statistics** — "X items recovered this semester" (real when available; placeholder otherwise).
7. **Safety** — link to /safety.
8. **FAQ** — accordion of top 5.
9. **Final CTA** — "Get your item back. Report now."
10. **Footer** — links, college affiliation, contact.

### 46.3 Copy tone

Clear, reassuring, concrete. No buzzwords. "We ask questions only the real owner can answer" beats "AI-powered ownership verification."

---

## 47. Onboarding

Short (≤60s):

1. **Welcome** — one line.
2. **College verification** — confirm email (already verified at register; show badge).
3. **Profile** — name, department (prefilled from email if possible).
4. **Role context** — "You can report lost items, found items, or both." (No role pick — one account does both.)
5. **Notification preferences** — defaults sensible; user can change.
6. **Safety intro** — 3 bullet points: how verification works, how to stay safe, how to reach admin.

Skip on re-login. Resumable.

---

## 48. Empty States

Every list view has a meaningful empty state.

| Screen | Empty state |
|---|---|
| Active lost | "No lost items reported yet. Hope it stays that way! [Report a lost item]" |
| Matches | "No potential matches yet. We'll notify you the moment something looks like yours." |
| Verification requests | "No verification requests right now." |
| Found items | "No found items reported. [Report a found item]" |
| Messages | "No messages yet. When you have a match, you can chat here." |
| Admin queues | "Queue is clear. Nice." |

Each empty state has: an illustration, one line of context, and a next action.

---

## 49. Error States

| Error | Message | Recovery |
|---|---|---|
| Image upload failed | "That image didn't upload. Check the size (max 10MB) and try again." | Retry button. |
| AI processing failed | "We couldn't analyze that image. You can fill in the details manually." | Manual entry fallback. |
| Match unavailable | "This match is no longer available." | Back to dashboard. |
| Verification failed | "We couldn't confirm this is yours. You can try again in 24h or contact support." | Link to support. |
| Session expired | "Your session expired. Please log in again." | Redirect to login. |
| Unauthorized | "You don't have access to this." | Redirect to dashboard. |
| Item already claimed | "This item is already being claimed by another user. We'll let you know if that changes." | Back to matches. |
| Rate limited | "Too many attempts. Please wait a minute." | Countdown timer. |
| Network error | "Connection lost. We'll retry when you're back." | Auto-retry. |

Errors are plain-language, actionable, never just "Error 500."

---

## 50. Mobile-First Experience

- **Installable PWA** — add to home screen; offline shell.
- **Camera-first reporting** — upload directly from camera; AI analysis on-device preview where possible.
- **Quick report** — 3-tap path to start a lost/found report from the home screen icon.
- **Notifications** — push (opt-in); in-app notification center.
- **Verification** — single-question-per-screen flow; large tap targets.
- **QR scan** — in-app camera scanner for handover.
- **Chat** — full-screen thread; keyboard-aware.
- **Tracking** — simplified progress timeline.
- **Bottom tab bar** — Home / Report / Messages / Profile.
- **Touch targets** ≥ 44px; forms avoid hover-only interactions.

---

## 51. Admin UX

Distinct from the student interface.

- **Information density** — compact tables, multi-column layouts, keyboard shortcuts (j/k to navigate rows, a to approve, r to reject).
- **Case management** — every case is a workspace with tabs: Match, Verification, Fraud, Users, Handover, Audit.
- **Search & filters** — global search (user, item, case), saved filters, bulk actions.
- **Evidence** — side-by-side image comparison; answer log with LLM judgments; fraud signal timeline.
- **Audit history** — every action visible in the case timeline.
- **Alerts** — banner for high-risk cases; red highlight in queues.
- **Decisions** — mandatory reasoning note on any override or ban.
- **Desktop-first** — admin work is desktop work; mobile admin view is read-only.

---

## 52. Security Threat Model

For each: attack, method, vulnerability, prevention, detection, recovery.

### 52.1 Fake claimant (public photo)

- **Attack:** Claimant sees blurred photo, guesses attributes.
- **Vulnerability:** If blur reveals identifying marks.
- **Prevention:** Crop/placeholder when item is distinctive; hidden questions on non-public attributes.
- **Detection:** Wrong answers, fast answers, generic answers.
- **Recovery:** Lockout after 3 fails; fraud alert; case continues with real owner.

### 52.2 Account takeover

- **Attack:** Attacker steals/brute-forces owner's credentials.
- **Vulnerability:** Weak password, no 2FA.
- **Prevention:** Strong password policy; 2FA on high-value claims; anomaly detection (new device + immediate claim).
- **Detection:** Login anomaly; claim from new device.
- **Recovery:** Step-up auth; suspend claim; notify real owner; admin review.

### 52.3 Image scraping

- **Attack:** Scripted download of public found-item gallery.
- **Vulnerability:** Public CDN URLs.
- **Prevention:** Signed short-lived URLs; blurred derivatives only; rate limits; per-user query budget.
- **Detection:** High request rate from one IP/user.
- **Recovery:** Block source; rotate signing keys if needed.

### 52.4 Screenshot-based claiming

- **Attack:** Claimant screenshots the limited preview, claims from another account.
- **Vulnerability:** Limited preview reveals too much.
- **Prevention:** Limited preview shows less than the full image; hidden questions still gate the claim.
- **Detection:** Multiple accounts claiming the same item; perceptual hash of uploaded "proof" matches the public derivative.
- **Recovery:** Fraud alert; accounts linked; admin review.

### 52.5 Multiple accounts (sybil)

- **Attack:** One human runs several accounts.
- **Vulnerability:** If registration allows arbitrary emails.
- **Prevention:** College-email-only registration (one email per student).
- **Detection:** Device fingerprint, IP subnet, timing correlation.
- **Recovery:** Link accounts; restrict; admin review.

### 52.6 Verification brute force

- **Attack:** Guess answers repeatedly.
- **Vulnerability:** No attempt limit.
- **Prevention:** 3-strike lockout per 24h; escalating difficulty.
- **Detection:** Repeated wrong answers.
- **Recovery:** Lockout; fraud alert; admin can reset if false positive.

### 52.7 API abuse

- **Attack:** Direct API calls to enumerate or claim.
- **Vulnerability:** Unauthenticated or under-limited endpoints.
- **Prevention:** Auth on all sensitive endpoints; rate limits; CSRF on state changes; object-level perms.
- **Detection:** Rate anomalies; auth failures.
- **Recovery:** Throttle/block; audit.

### 52.8 Admin impersonation

- **Attack:** User messages another user claiming to be admin.
- **Vulnerability:** If admin identity is spoofable in chat.
- **Prevention:** Admin badge is system-issued, not user-set; admin channel is separate from user-to-user.
- **Detection:** User reports impersonation.
- **Recovery:** Ban impersonator; notify users.

### 52.9 Data leakage

- **Attack:** Insider or bug exposes hidden attributes or images.
- **Vulnerability:** Over-permissive access; logging of secrets.
- **Prevention:** Object-level perms; encrypted sensitive fields; audit logging of access; admin sees metadata not full chat by default.
- **Detection:** Audit log review; anomaly detection.
- **Recovery:** Revoke access; rotate keys; notify affected users.

### 52.10 Malicious uploads

- **Attack:** Upload malware/HTML-disguised-as-image or steganographic payloads.
- **Vulnerability:** Naive file handling.
- **Prevention:** Type/size limits; re-encode images server-side; strip metadata; scan with AV.
- **Detection:** Upload validation failures.
- **Recovery:** Reject; log; flag user if repeated.

### 52.11 Fake AI evidence

- **Attack:** Claimant uploads AI-generated image as "proof of ownership."
- **Vulnerability:** If the system trusts any uploaded proof.
- **Prevention:** AI-gen artifact detection; reverse image search; private-angle photo requirement (hard to fake a specific angle); proof is weighted, not decisive.
- **Detection:** Too-perfect images; perceptual hash match to public sources.
- **Recovery:** Reduce EP to zero for that evidence; fraud alert.

### 52.12 Social engineering

- **Attack:** Attacker convinces finder or admin verbally/externally.
- **Vulnerability:** Handover outside the platform.
- **Prevention:** Platform-mediated handover only; admin decisions logged; both parties confirm in-app.
- **Detection:** Reports of off-platform contact; missing confirmation.
- **Recovery:** Admin re-investigates; ban on extortion attempts.

---

## 53. Edge Cases

30+ realistic edge cases and expected behavior.

| # | Edge case | Expected behavior |
|---|---|---|
| 1 | Two people lost identical phones, same building, same day | Both lost reports match the same found item; both claimants get *different* private question sets; the one whose private attributes (IMEI, lock-screen, case detail) match wins; the other is rejected without being told why. |
| 2 | Multiple people claim the same item | Dispute workflow (§24); non-overlapping question sets; highest EP wins; others locked. |
| 3 | Finder deletes account mid-case | Found item record persists (anonymized); custody transfers to security desk; admin handles. |
| 4 | Lost user changes phone number | Phone was never collected (platform-mediated chat); no impact. |
| 5 | Item found months later, after lost report expired | Expired reports are searchable by admin; a new match revives the report; user re-notified. |
| 6 | AI cannot identify item | "Unknown" category; admin reviews; finder free-text description; standard flow proceeds with lower confidence. |
| 7 | User uploads wrong image | User can edit own report; AI re-analyzes; previous embedding replaced. |
| 8 | Duplicate reports (same user, same item) | Duplicate detection on perceptual hash + attributes within a short window; user prompted to consolidate. |
| 9 | Found item already returned | Found item status is `Returned`; new matches blocked; user notified "this item has been returned." |
| 10 | User gives wrong verification answer (honest mistake) | First wrong answer: no penalty, new question. Distinguish honest mistake from guessing via pattern (got others right, this one slightly off → partial EP). |
| 11 | Admin unavailable | Queue SLA; super-admin can act; high-value cases can wait; non-high-value auto-resolve if EP ≥ 70. |
| 12 | Internet lost during handover | QR/OTP valid for 24h; handover resumable; offline confirmation stored and synced when back. |
| 13 | User reports lost, then finds it themselves | User marks own lost report "Found by me"; report closes; no handover; logged. |
| 14 | Item is contraband (vape, etc.) | Finder reports; admin reviews; item not returned to claimant; handed to campus security per policy. |
| 15 | Cash found | No identifying marks; mandatory admin + security desk; claimant must specify amount + denomination exactly; disambiguation via amount. |
| 16 | Item damaged after being found | Finder notes condition at report time; damage after is finder liability question → admin reviews; logged. |
| 17 | Graduate leaves campus mid-case | Account can't be deleted mid-case; admin can transfer/extend; email forwarding set up by user. |
| 18 | Finder is the owner of a different identical item | Their claim fails private-attribute verification; their own lost report continues searching separately. |
| 19 | Claimant passes verification but is not the owner (collusion/theft) | Rare; admin co-sign on high-value; trust signals + fraud detection add scrutiny; not perfectly preventable — acknowledged in threat model. |
| 20 | AI matches two different objects confidently | Admin can break the match; both reports return to Searching; match engine tuned using the false-positive. |
| 21 | User uploads a Google image as "proof" | Reverse image search flags; EP zero for that evidence; fraud alert. |
| 22 | Verification question leaks the answer | LLM output reviewed by rule engine for leakage; question rejected and regenerated if it reveals. |
| 23 | Two accounts, same device, claiming different items | Sybil detection flags; accounts linked; admin reviews. |
| 24 | Handover token expires before use | User requests new token; old token invalidated; audit logged. |
| 25 | User reports found but never had the item (false found report) | Found report doesn't grant ownership; no handover without verification; ghosting lowers trust; admin can investigate. |
| 26 | Item is an ID/document with someone else's name | Routed to admin/security; name on document is the verification; handover via security desk only. |
| 27 | Claimant answers too fast (automation) | Timing logged; fast + correct → still passes but flagged; fast + wrong → lockout. |
| 28 | Public visitor tries to claim | Must register with college email first; claim gated behind auth. |
| 29 | User forgets private attributes they set | Admin-assisted recovery: user provides other evidence (receipt, etc.); admin judges. |
| 30 | Match engine goes down | New reports queue; matching resumes when back; no data loss; users see "searching" state. |
| 31 | Image storage outage | Public gallery degrades gracefully; reports still accepted; matching on attributes/text continues. |
| 32 | Admin makes a wrong decision | Appeal window (48h); super-admin can overturn; audit log shows the reversal. |
| 33 | LLM is unavailable | Question generation falls back to a template-based set from stored attributes; answer judging falls back to fuzzy string match; reduced accuracy but functional. |

---

## 54. Complete Recovery Journey

```
LOST
  │
  ▼
REPORT (progressive, AI-assisted) ── user provides PUBLIC + PRIVATE attributes
  │
  ▼
AI ANALYSIS ── vision/OCR/embeddings; suggestions, user confirms
  │
  ▼
SEARCH ── embedding + attributes indexed; passive matching begins
  │
  ▼
[Meanwhile: someone FINDS the item → FOUND REPORT → AI ANALYSIS →
   protected image → active matching]
  │
  ▼
POTENTIAL MATCH ── v/t/c scored; thresholds decide notification level
  │
  ▼
NOTIFICATION ── to lost user only (targeted, not public)
  │
  ▼
PRIVATE VERIFICATION ── adaptive questions from hidden attributes
  │
  ▼
AI + RULE ENGINE ── LLM judges answers; rules sum EP; thresholds decide
  │
  ├── EP ≥ 70 → MATCH APPROVED (high-value: admin co-sign)
  ├── 40–70 → ADMIN REVIEW
  └── < 40 → REJECTED (+ lockout if repeated)
  │
  ▼
ADMIN REVIEW (if required) ── full evidence; decision logged
  │
  ▼
MATCH APPROVED
  │
  ▼
SECURE HANDOVER ── Tier 1 (direct QR/OTP) or Tier 2 (security desk)
  │
  ▼
QR/OTP CONFIRMATION ── both parties confirm; single-use token
  │
  ▼
RECOVERY COMPLETED ── status Returned
  │
  ▼
AUDIT LOG ── immutable record of the whole journey
  │
  ▼
FEEDBACK ── optional rating; improves trust signals + analytics
```

---

## 55. Implementation Roadmap

Phases ordered by dependency. Each phase is shippable.

### Phase 0 — Foundation (Week 1–2)
- Repo, CI, env setup, DB (Postgres + pgvector), auth scaffold, project skeleton.
- Design system + component library (§43).

### Phase 1 — Authentication & Access (Week 2–3)
- College-email registration, login, email verification, 2FA, sessions.
- RBAC + object-level permissions scaffold.
- Onboarding (§47).

### Phase 2 — Reporting (Week 3–5)
- Progressive lost reporting (§14).
- Progressive found reporting (§15).
- Image upload + server-side processing (metadata strip, derivatives).
- Categories + locations taxonomy.
- Item status lifecycle (§16) — basic states.

### Phase 3 — Image Privacy (Week 5–6)
- Blurred/cropped derivative generation.
- Signed short-lived URLs.
- Access control on image fetch + audit logging.

### Phase 4 — AI Services (Week 6–8)
- Vision/OCR integration for attribute extraction.
- Embedding generation + pgvector indexing.
- AI suggestion + confirmation UI.
- LLM question generation + answer judging (with rule-engine guardrails).

### Phase 5 — Matching Engine (Week 8–9)
- v/t/c scoring; weighted combine; thresholds.
- Candidate generation + notifications.
- Match detail UI.

### Phase 6 — Verification System (Week 9–11)
- Adaptive questions, EP accumulation, attempt limits, lockout.
- Verification flow UI.
- Admin review queue (basic).

### Phase 7 — Communication (Week 11–12)
- Platform-mediated chat with PII filter.
- User↔user (within match) and user↔admin channels.
- WebSocket for real-time chat.

### Phase 8 — Admin Portal (Week 12–14)
- Overview, match management, user management, item management.
- Audit log viewer.
- Dense, desktop-first admin UX.

### Phase 9 — Fraud Detection (Week 14–15)
- Signal collection; risk score; FraudAlert workflow.
- Admin fraud center.

### Phase 10 — Handover (Week 15–16)
- QR/OTP token generation; Tier 1 + Tier 2.
- Confirmation flow; audit record.

### Phase 11 — Notifications & Polish (Week 16–17)
- Notification service (in-app, email, push opt-in); budgeting.
- Empty/error states; accessibility pass; mobile PWA.

### Phase 12 — Security Hardening (Week 17–18)
- Rate limiting, CSRF, CSP, input validation sweep.
- Pen-test of auth, claim, verification, image access.
- Audit log integrity.

### Phase 13 — Testing & Demo (Week 18–19)
- Test strategy execution (§58).
- Demo flow rehearsal (§59).
- Analytics dashboards.

### Phase 14 — Deployment (Week 19–20)
- Production hosting (§57); secrets; monitoring; on-call basics.

Dependencies: 1→2→3 (parallel with 2); 4 needs 2; 5 needs 4; 6 needs 5; 7 needs 2; 8 needs 6; 9 needs 6; 10 needs 6; 11 parallel; 12 needs all; 13 needs all; 14 needs 13.

---

## 56. MVP vs Advanced Features

### 56.1 MVP (Phase 0–6, 10, 11 essentials)

Must-have for a working, demonstrable system:

- College-email auth + 2FA on high-value.
- Progressive lost/found reporting with AI auto-fill (suggestions + confirm).
- Image upload + blurred public derivative + signed URLs.
- AI attribute extraction + embedding + basic matching (v/t/c + thresholds).
- Adaptive verification questions + EP + attempt lockout.
- Basic admin review queue (approve/reject + note).
- Platform-mediated chat (PII filter).
- QR/OTP handover (Tier 1 direct).
- Notifications (in-app + email).
- Item status lifecycle.
- Audit logging.
- Dashboards (user + basic admin).
- Landing page + onboarding.

### 56.2 Version 2 (Phase 8–9, 11 advanced)

- Full admin portal (fraud center, analytics, user management, disputes).
- Fraud detection with risk scoring.
- Tier 2 security-desk handover.
- Dispute workflow with non-overlapping question sets.
- Push notifications.
- Trust signals.
- High-value item special policies (admin co-sign, 2FA).
- Forensic watermarking.
- Reverse image search for fake-evidence detection.

### 56.3 Advanced / Future

- On-device AI for privacy-preserving attribute extraction.
- Multi-campus federation.
- Campus security liaison integration (real-world escalation).
- LLM fine-tuning on anonymized case data for better question generation.
- Predictive "likely lost location" from movement patterns (opt-in).
- Voice-based reporting.

---

## 57. Free / Low-Cost Technology Strategy

Student-budget-friendly. Each choice justified.

| Layer | Choice | Why |
|---|---|---|
| Frontend | **Next.js (React) + Tailwind CSS** | Free, huge ecosystem, PWA support, SSR for landing SEO, easy deploy on Vercel free tier. Tailwind for fast design-system implementation. |
| Backend | **Next.js API routes (or FastAPI if Python preferred)** | One deploy unit; less ops. If AI work is heavy in Python, FastAPI as a separate service. |
| Database | **PostgreSQL + pgvector** (Supabase free tier) | Relational + vector in one store; row-level security; Supabase gives auth, storage, realtime, and a free tier generous enough for a campus. |
| Auth | **Supabase Auth** (or NextAuth + email provider) | College-email handling, OAuth, 2FA via TOTP; free tier. |
| Image storage | **Cloudflare R2** (or Supabase Storage) | R2 has no egress fees on free tier; S3-compatible; signed URLs. Supabase Storage is simpler if already on Supabase. |
| Vision/OCR | **Google Cloud Vision** (free tier 1k req/month) or **OpenAI vision** (gpt-4o-mini, cheap) | For attribute extraction. OpenAI vision is simplest to integrate and cheap at low volume. |
| Embeddings | **OpenAI embeddings** (text-embedding-3-small) or **open-source (CLIP)** via Hugging Face | CLIP is free if self-hosted; OpenAI is cheap. pgvector stores them. |
| LLM | **Claude Haiku 4.5** or **OpenAI gpt-4o-mini** | Question generation + answer judging; cheap, fast, capable. |
| Maps | **Leaflet + OpenStreetMap** | Free, no API key; building-level markers only. |
| Notifications (email) | **Resend** (free tier) or **Supabase Auth email** | Transactional email. |
| Notifications (push) | **Web Push API** (free, browser-native) | No third-party needed for PWA push. |
| Hosting | **Vercel** (frontend + API) + **Supabase** (DB/auth/storage) | Both have generous free tiers; zero ops. |
| Analytics | **PostHog** (open-source, free tier) or self-built from audit logs | Privacy-friendly; no GA. |
| Monitoring | **Sentry** (free tier) | Error tracking. |
| Secrets | **Supabase Vault** or **Vercel env vars** | No extra cost. |

### 57.1 Cost estimate (MVP, small campus)

- Vercel: $0 (free tier).
- Supabase: $0 (free tier, up to 500MB DB / 1GB storage — fine for MVP).
- Cloudflare R2: $0 (free tier).
- AI APIs: ~$5–20/month at campus scale (low volume).
- Resend: $0 (free tier).
- **Total: ~$5–20/month.** Suitable for a student/hackathon project.

### 57.2 Scaling notes

If the campus is large or usage grows, the first paid tier is Supabase Pro ($25/mo) which removes row limits and adds more storage. AI cost scales linearly with image uploads; caching AI results on identical images (perceptual hash) keeps it bounded.

---

## 58. Testing Strategy

### 58.1 Functional testing
- Per-feature test cases: report lost, report found, match, verify, handover. Each with happy path + boundary cases.

### 58.2 UI testing
- Component tests (React Testing Library); E2E flows (Playwright): full recovery journey, admin review, dispute.

### 58.3 Authentication testing
- Registration (valid/invalid domain), login (success/fail/lockout), 2FA, password reset, session expiry, concurrent sessions.

### 58.4 Authorization testing
- Role matrix tests: public vs user vs admin access to each endpoint and screen; object-level perms (user A cannot see user B's case).

### 58.5 AI testing
- Attribute extraction precision on a labeled set of campus item images.
- Question leakage: automated check that no generated question reveals its answer.
- Answer judge: labeled set of (attribute, answer) → expected judgment; precision/recall.

### 58.6 Match accuracy testing
- Labeled lost/found pairs (match/no-match); measure precision, recall, F1 at each threshold; tune weights.

### 58.7 Fraud testing
- Simulated attack scenarios (§52): fake claimant, sybil, brute force, fake evidence; verify detection + lockout + no auto-ban.

### 58.8 Security testing
- OWASP top 10 sweep; auth bypass; IDOR (object-level perms); rate-limit checks; upload validation; XSS/CSRF; dependency scan.

### 58.9 Mobile testing
- PWA install; camera upload; QR scan; responsive layouts at phone widths; touch targets.

### 58.10 Performance testing
- Page load < 2s; AI processing feedback < 3s; match query < 500ms at 10k items; chat latency < 200ms.

### 58.11 Accessibility testing
- axe-core automated + manual keyboard nav + screen reader (NVDA/VoiceOver); contrast audit.

### 58.12 User acceptance testing
- 5–10 student testers; task: report, verify, handover; SUS questionnaire; iterate.

### 58.13 Realistic test scenarios
- "Backpack left in library, found by another student, owner verifies contents." / "Phone lost, finder hands to security, Tier 2 handover." / "Wallet claimed by wrong person, fraud detected." / "Two identical laptops, disambiguation via private attributes."

---

## 59. Demo / Hackathon Flow

5–10 minute demo, visually impressive but realistic.

1. **(0:00)** Landing page — hero animation; "Lost something on campus?"
2. **(0:30)** Student A registers (college email), reports lost item (a distinctive backpack). Uploads photo; AI extracts "black leather backpack, brand X"; A confirms. Adds private attributes: "red keychain with a cat, a calculus textbook inside, scratch near the top zipper." Submits → "Searching."
3. **(2:00)** Student A logs out.
4. **(2:10)** Student B logs in, reports found backpack in Library. AI analyzes; protected (blurred) public image created. AI finds a potential match (same building, similar attributes). Student A gets a notification (show the notification).
5. **(3:30)** Student A logs back in, sees the match, starts verification. Questions: "Describe any distinctive marks or keychains." A answers "red cat keychain." LLM judges: match. "What was inside?" A: "a calculus textbook." Match. EP climbs past 70.
6. **(5:00)** Match approved. Handover token generated; QR shown to A. B scans; both confirm. Confetti animation. Status: Returned.
7. **(6:00)** Admin view — show the audit log of the whole journey; analytics dashboard with "1 recovery today."
8. **(7:00)** Optional: show a *failed* fake claim (Student C tries, gets questions wrong, locked out, fraud alert) — to demonstrate the security story.
9. **(8:00)** Close — differentiators + "built on a student budget."

---

## 60. Project Differentiators

What makes CampusRecover AI different from a normal Lost & Found.

1. **Hidden-attribute verification** — questions only the real owner can answer; the single strongest anti-fraud mechanism.
2. **Privacy-preserving images** — blurred/cropped/placeholder public derivatives; full images gated behind verification.
3. **AI-assisted progressive reporting** — 90-second reports instead of a wall of fields; AI suggests, user confirms.
4. **Multi-dimensional matching** — visual + textual + contextual scoring with category-dependent weighting, not a single percentage.
5. **Evidence-threshold ownership model** — ownership is accumulated evidence, not an AI verdict; no LLM decides alone.
6. **Hybrid AI + rule engine** — AI proposes, deterministic rules decide; auditable and predictable.
7. **Adaptive, non-leaking question generation** — questions that don't reveal their answers; difficulty escalation.
8. **Fraud detection with human review** — risk signals, no auto-ban; admin + super-admin co-sign for bans.
9. **Platform-mediated communication** — no contact details exchanged; PII filter; conversations stay in the trust boundary.
10. **Secure QR/OTP handover with audit** — single-use tokens, both-party confirmation, immutable log.
11. **Two-tier handover** — direct or via security desk, for when parties can't meet.
12. **College-only ecosystem** — college-email allowlist; one student, one account; narrows the threat model.
13. **Asymmetric friction** — easy to report found, hard to falsely claim.
14. **Dispute disambiguation via non-overlapping questions** — two claimants can't copy each other.
15. **Category-specific verification policies** — phones, wallets, cash, IDs each get tailored evidence and handover rules.

---

## 61. Final Product Blueprint

### Product Vision
A secure, AI-powered college Lost & Found where items move only between the legitimate Lost User, Found User, and authorized Admin — minimizing fake claims, fraud, impersonation, and third-party interference.

### Target Users
College students, faculty, and campus security staff on a single campus (MVP), extensible to multi-campus (future).

### User Roles
- User (Lost and/or Found, contextual)
- Admin / Recovery Officer
- Super Admin
- Security Staff (handover intermediary)
- Public Visitor (browse + report-found prompt only)

### Core Features
College-email auth + 2FA; progressive lost/found reporting with AI auto-fill; privacy-preserving image derivatives; AI matching (v/t/c); adaptive verification; EP-based ownership; platform-mediated chat; QR/OTP handover; notifications; dashboards; audit logging.

### Advanced Features
Fraud detection + risk scoring; dispute workflow with non-overlapping questions; Tier 2 security-desk handover; high-value item policies; trust signals; analytics; forensic watermarking; reverse image search for fake evidence.

### AI Features
Vision attribute extraction; OCR; embedding similarity; LLM question generation (leakage-checked); LLM answer judging; fraud signal scoring; RAG chatbot.

### Security Features
RBAC + object-level perms; encrypted sensitive fields; signed short-lived image URLs; rate limiting; CSRF/CSP; audit logging; 2FA; anomaly detection; admin + super-admin co-sign for bans.

### Privacy Model
GPS never collected; building-level public location; time rounded; hidden attributes encrypted and never displayed; images blurred/cropped; platform-mediated chat with PII filter; analytics aggregated.

### Complete User Journey
See §54.

### Admin Journey
See §22–24, §51.

### Database Entities
Users, Profiles, LostItems, HiddenAttributes, FoundItems, Matches, Claims, VerificationQuestions, VerificationAnswers, Conversations, Messages, Notifications, HandoverRecords, AdminReviews, FraudAlerts, Disputes, AuditLogs, Categories, Locations. See §31.

### System Architecture
See §32.

### Sitemap
See §41.

### Screen List
See §42.

### UI Design System
See §43–44.

### AI Architecture
See §33–34.

### Verification Architecture
See §9–10, §27.

### Fraud Detection
See §11, §52.

### Notification Architecture
See §19.

### Handover Architecture
See §17.

### Development Roadmap
See §55.

### MVP Scope
See §56.1.

### Future Scope
See §56.2–56.3.

### Testing Strategy
See §58.

### Deployment Strategy
Vercel + Supabase + R2; secrets in env/Vault; Sentry monitoring; PostHog analytics; zero-ops free-tier for MVP, Supabase Pro at scale. See §57.

---

## 62. Design Principles

1. **Security before convenience.** Friction is added where fraud happens (claiming), removed where it doesn't (reporting).
2. **Privacy before visibility.** Default to showing less; reveal only on verified need.
3. **AI assists humans; AI does not make irreversible ownership decisions alone.** No LLM verdict decides ownership; rules + evidence + human do.
4. **Never expose sensitive item information unnecessarily.** Hidden attributes are the secret.
5. **Never reveal hidden verification answers.** Questions query; they never display.
6. **No third-party user can interfere with a case.** Only the three parties participate.
7. **Every important action is auditable.** Immutable, append-only audit log.
8. **High-value items require stronger verification.** Admin co-sign, 2FA, longer expiry.
9. **Suspicious cases escalate to humans.** AI flags; humans decide on bans.
10. **The UI stays simple even if the backend is sophisticated.** Users see "evidence collected," not EP scores.
11. **The system works well on mobile.** PWA, camera-first, QR scan, large targets.
12. **Every major workflow has loading, success, failure, and edge-case states.** See §48–49, §53.
13. **The design is realistic enough to implement.** Student budget, free tiers, known tech.
14. **No unnecessary features.** Roles rejected (moderator, department coordinator) were rejected with reasons.

---

## 63. Architecture Consistency Check

Final pass for contradictions, gaps, and fixes.

### 63.1 Contradictions found and resolved

1. **"Never expose sensitive info" vs. finder needs to coordinate.** Resolved: platform-mediated chat + building-level location provide a minimal coordination channel without exposing identity or exact location. (§4.2, §17, §37)
2. **"AI matches" vs. "AI can't prove ownership."** Resolved: matching generates candidates; ownership is established by EP from hidden-attribute verification, not by match confidence. (§8, §9)
3. **"Admin reviews every medium case" vs. "admin workload unbounded."** Resolved: only inconclusive verifications (40–70 EP) or risk ≥ 51 reach admin; target <10% of cases. (§23)
4. **"Blurred images are safe" vs. "screenshots exist."** Resolved: blur is the first layer; hidden questions are the real defense; the system doesn't rely on blur alone. (§12.4, §9)
5. **"Trust score" vs. "no public reputation."** Resolved: trust is internal, never shown between users, minor tie-breaker only. (§38)

### 63.2 Missing workflows identified and added

- **Item never matched / expiration** → added expiration policy + revival on late match. (§16.3, §53 #5)
- **Finder ghosting** → custody transfer to security desk; admin follow-up. (§17.1, §53 #3)
- **Off-platform handover** → not allowed; both parties must confirm in-app. (§17, §52.12)
- **LLM unavailable** → fallback to template questions + fuzzy match judging. (§53 #33)
- **Cash (no marks)** → mandatory admin + security desk + exact-amount verification. (§26, §53 #15)
- **Contraband** → admin + security, not returned to claimant. (§53 #14)

### 63.3 Security gaps identified and closed

- **Prompt injection via answer text** → LLM sees stored attribute + answer, not the question; output is structured; rules ignore unstructured output. (§34)
- **Image metadata** → stripped server-side before derivatives. (§12.3)
- **Signed URL leakage** → short-lived (10 min), user+role+derivative bound. (§12.3)
- **Admin reading chat** → metadata by default; full body only on escalation. (§37)
- **Ban without oversight** → admin + super-admin co-sign. (§11.3)
- **Scraping** → rate limits + per-user query budget + signed URLs. (§35, §52.3)

### 63.4 Features that should change (recommendations)

1. **Drop "Moderator" and "Department Coordinator" roles** — they fragment accountability without adding value on a single campus. (§3)
2. **Drop GPS collection entirely** — building taxonomy is enough and removes a privacy class. (§18)
3. **Don't show match confidence as a percentage to users** — labels ("Strong / Possible / Worth a look") are clearer and don't imply false precision. (§8.5)
4. **Don't auto-ban on AI fraud flags** — advisory only; two-human co-sign for bans. (§11.3)
5. **Make college email mandatory** — optional personal email breaks the one-student-one-account invariant. (§29)
6. **Prefer Tier 2 (security desk) handover for high-value items** — reduces direct-contact risk. (§17, §25)
7. **Keep the chatbot bounded** — navigation + FAQ + status only; never attribute disclosure or claim approval. (§13)

### 63.5 Final verdict

The architecture is internally consistent. The core invariant — items move only between Lost User, Found User, and Admin — is enforced at every layer: image derivatives, hidden-attribute verification, EP thresholds, platform-mediated chat, QR/OTP handover, and audit logging. The hybrid AI + rule engine keeps decisions auditable while AI does the probabilistic work. The MVP scope is achievable on a student budget with free-tier infrastructure. The system is ready to hand to a developer with this specification.

---

*End of specification. This document is design-only and contains no source code. A developer/AI coding agent can implement CampusRecover AI directly from this blueprint.*



