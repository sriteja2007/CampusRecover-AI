# CampusRecover AI — Technical API & Services Specification

## Overview
CampusRecover AI architecture is structured around modular TypeScript services providing real-time data persistence in Cloud Firestore, multi-modal Gemini AI integration, CDN storage via Cloudinary, and client-side cryptographic receipt verification.

---

## 1. Matching & AI Engine API

### `MatchingService` (`src/services/matching.service.ts`)
The matching engine evaluates lost and found item pairs using a composite scoring matrix combining visual embeddings, OCR text, semantic overlap, and geo-temporal proximity.

#### Methods
- `triggerBackgroundPairing(itemId: string, itemType: "lost" | "found"): Promise<void>`
  - Enqueues item into `matching_queue` and asynchronously triggers matching against the inverse collection.
- `runMatchingPipeline(candidateId: string, candidateType: "lost" | "found"): Promise<MatchResult[]>`
  - Computes composite similarity scores for candidate against all open opposite items.
  - Generates AI explanation via Gemini when confidence exceeds threshold.
  - Persists matches in `matches` and detailed metadata in `aiResults`.
- `getPendingMatches(): Promise<MatchResult[]>`
  - Fetches matches requiring administrative review or user confirmation.
- `getUserMatches(userId: string): Promise<MatchResult[]>`
  - Returns active pairing results associated with items reported by `userId`.
- `updateMatchStatus(matchId: string, status: "pending" | "confirmed" | "dismissed", notes?: string): Promise<void>`

---

## 2. Secure Item Handover API

### `HandoverService` (`src/services/handover.service.ts`)
Manages the custody transfer state machine, dual-party handshake (OTP and dynamic QR), identity checklist verification, and audit logging.

#### Methods
- `initiateHandoverClaim(matchId: string, claimantId: string, finderId: string, lostItemId: string, foundItemId: string): Promise<Claim>`
  - Provisions a new record in `claims` collection with initial status `"pending"`.
- `generateHandoverOTP(claimId: string): Promise<string>`
  - Generates a 6-digit cryptographic OTP valid for 15 minutes with brute-force rate-limiting.
- `verifyHandoverOTP(claimId: string, inputOtp: string): Promise<{ success: boolean; message: string }>`
  - Validates user-submitted OTP against Firestore record.
- `generateDynamicQRToken(claimId: string): Promise<string>`
  - Creates a time-limited verification token formatted as `CR-VERIFY-<CLAIM_ID>-<HMAC_TIMESTAMP>`.
- `verifyDynamicQRToken(claimId: string, token: string): Promise<{ success: boolean; message: string }>`
  - Validates camera-scanned QR token.
- `completeHandover(claimId: string, verifiedMethods: VerificationMethod[], notes: string, verifierUid: string): Promise<void>`
  - Transitions claim to `"resolved"`.
  - Marks both lost and found items as `"claimed"` / `"resolved"`.
  - Increments finder trust score by $+1.0$.
  - Writes immutable records to `handoverLogs` and `verificationLogs`.
- `getClaimsForUser(userId: string): Promise<Claim[]>`
- `getAllClaims(): Promise<Claim[]>`

---

## 3. Communication & Real-time Messaging API

### `ChatService` (`src/services/firebase/chat.service.ts`)
Provides end-to-end messaging, read receipts, media uploads, audio notes, and safe meeting point sharing.

#### Methods
- `getOrCreateRoom(participantIds: string[], itemId?: string): Promise<string>`
  - Returns or provisions a Firestore document in `chat_rooms`.
- `sendMessage(roomId: string, senderId: string, text: string, options?: MessageOptions): Promise<void>`
  - Dispatches message with optional `mediaUrl`, `audioUrl`, or `location` object.
- `markMessagesAsRead(roomId: string, userId: string): Promise<void>`
  - Updates `readBy` array on unread messages in the room.
- `setTypingStatus(roomId: string, userId: string, isTyping: boolean): Promise<void>`
  - Ephemeral typing indicator state with 3-second auto-expiry.
- `subscribeToMessages(roomId: string, callback: (messages: ChatMessage[]) => void): () => void`

---

## 4. Administrative & Telemetry API

### `AdminService` (`src/services/admin.service.ts`)
High-performance metrics aggregation, physical office management, and campus-wide broadcasting.

#### Methods
- `getLiveMetrics(): Promise<AdminMetrics>`
  - Calculates recovery rate, active claims, pending AI pairs, and total inventory count.
- `getCategoryBreakdown(): Promise<{ category: string; count: number }[]>`
- `createCampusOffice(office: CampusOfficeEntity): Promise<string>`
- `updateCampusOffice(id: string, updates: Partial<CampusOfficeEntity>): Promise<void>`
- `deleteCampusOffice(id: string): Promise<void>`
- `broadcastAnnouncement(title: string, body: string, targetRole: "all" | "faculty" | "security"): Promise<void>`
- `exportAuditLogsCSV(): Promise<string>`
- `exportSystemReportPDF(): Promise<void>`

---

## 5. Security & Rate Limiter API

### `RateLimiter` (`src/services/rateLimiter.service.ts`)
- `RateLimiter.check(key: string, config: { maxRequests: number, windowMs: number }): RateLimitResult`
- `RateLimiter.reset(key: string): void`
- Preconfigured buckets:
  - `STANDARD_LIMITS.OTP_VERIFY`: 5 attempts / 15 mins
  - `STANDARD_LIMITS.REPORT_SUBMIT`: 10 reports / hour
  - `STANDARD_LIMITS.AI_MATCH_RUN`: 20 requests / min
  - `STANDARD_LIMITS.CHAT_MESSAGE`: 40 messages / min
