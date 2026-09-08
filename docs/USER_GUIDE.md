# CampusRecover AI — Enterprise User Guide

## Introduction
CampusRecover AI provides a safe, verified, and automated lost-and-found recovery process for students, faculty, and campus security staff.

---

## 1. User Roles & Access

| Role | Permissions & Primary Views |
|---|---|
| **Student** | Report lost & found items, view AI pairings, direct messaging, execute OTP & QR handover, track recovery score. |
| **Faculty** | All student capabilities plus department item intake registry and student claim verification. |
| **Security Officer** | Campus inventory intake, dynamic QR token scanner, OTP generation desk, custody release sign-off. |
| **Campus Admin** | SaaS command center, user role elevation/suspension, fraud monitoring, campus offices CRUD, CSV/PDF exports. |

---

## 2. Reporting Items

### Reporting a Lost Item
1. Navigate to **Report Lost** from the sidebar or dashboard.
2. Upload clear photos of your item (the multimodal AI will automatically attempt to read serial numbers, student IDs, and distinctive marks).
3. Enter title, category, building/campus location where lost, and date.
4. Submit the report. The background matching engine immediately scans the found registry for prospective matches.

### Reporting a Found Item
1. Navigate to **Report Found**.
2. Select drop-off custody: `"I have this item with me"` or `"Handed in to Campus Security Desk"`.
3. Fill in details and upload photos.
4. The item is added to the campus registry, and automated matching commences instantly.

---

## 3. The Secure Handover Process

To prevent false claims and protect students, CampusRecover AI enforces a multi-factor custody transfer protocol:

```
[ AI Match ] ➔ [ Chat Coordination ] ➔ [ OTP / QR Verification ] ➔ [ Handover Sign-off ] ➔ [ Verified Receipt ]
```

1. **AI Match Confirmation**: Both claimant and finder review the AI confidence score and similarity explanation, then confirm the pairing.
2. **Safe Meeting Coordination**: Use in-app messaging to select a designated campus safe meeting spot (Campus Police Desk, Student Center, or Main Library Desk).
3. **Dual Verification**:
   - **Method A (OTP)**: Finder presents a 6-digit one-time passcode. Claimant enters the passcode into their app.
   - **Method B (Dynamic QR)**: Claimant displays their dynamic QR token. Finder scans the code using their device camera.
4. **Physical Inspection**: Check student ID, device serial numbers, or purchase receipts.
5. **Sign-off**: Both parties confirm custody. The finder receives a $+1.0$ Trust Score bonus, and a cryptographically sealed claim certificate is generated.

---

## 4. Progressive Web App (PWA) & Offline Usage

- **Installation**: Tap **Add to Home Screen** on Safari (iOS) or the install prompt on Chrome/Edge (Android & Desktop) to install CampusRecover AI as a native desktop/mobile application.
- **Offline Mode**: When disconnected from campus Wi-Fi, cached records remain readable. Submissions are queued locally and automatically synchronize upon reconnecting.
