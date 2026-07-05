# Product Requirements Document: Clan Fitness

**Version:** 1.0 (Draft)
**Owner:** Yugesh
**Status:** Pre-development
**Platform:** Web app (responsive; mobile-native considered post-MVP)

---

## 1. Overview

### 1.1 Problem Statement
Most fitness tracking apps are solitary tools — you log data, you see charts, motivation fades within weeks. The missing ingredient for most people isn't data, it's **social accountability**: knowing that a small group of people you actually know can see whether you showed up today.

### 1.2 Product Vision
Clan Fitness is a lightweight, social-first fitness tracker where users join small groups ("Clans") to track gym attendance, steps, and food intake together. The core value isn't the tracking itself — it's the visibility and light social pressure that comes from a clan feed showing who's putting in the work.

### 1.3 Goals
- Give users a dead-simple way to log daily fitness activity (gym, steps, food).
- Make that activity visible to a small trusted group (the Clan) to drive accountability.
- Build habit loops via streaks, reactions, and gentle nudges — not shame.
- Ship a usable MVP fast, validate the core loop with a real group of users, then expand.

### 1.4 Non-Goals (for v1)
- Not a full macro/calorie-counting app with a food database (v1 food logging is lightweight).
- Not a native mobile app (web-first; PWA-friendly is a bonus, not a requirement).
- Not a wearable-integrated step tracker in v1 (manual entry first; Health API integration later).
- Not a public social network — Clans are private, invite-only groups.

---

## 2. Target Users & Personas

**Primary persona: "The Accountability Seeker"**
Someone who has tried tracking fitness solo (Notes app, spreadsheets, other apps) and drops off after 2-3 weeks. Motivated more by not wanting to let friends down than by personal data.

**Secondary persona: "The Clan Leader"**
Creates a clan for their friend group / gym buddies / coworkers, sets the tone, invites others, often the most consistent logger.

---

## 3. Core Concepts & Terminology

| Term | Definition |
|---|---|
| **Clan** | A private group of users (recommended cap: 15 members) who can see each other's check-ins and feed. |
| **Check-in** | A single logged unit of activity: gym session, step count, or food entry. |
| **Feed** | Chronological (or digest) view of a clan's check-ins. |
| **Streak** | Consecutive days a user has hit their personal goal. |
| **Goal** | A per-user, per-metric target (e.g., "gym 4x/week", "8,000 steps/day"). |

---

## 4. Feature Requirements

Features are grouped by phase. Each includes user stories and acceptance criteria.

### PHASE 1 — Core Loop (MVP)

#### 4.1 Authentication & Onboarding
**User stories:**
- As a new user, I can sign up with email or a social login (Google) so I can start quickly.
- As a user, I can set up a basic profile (name, avatar, optional bio).
- As a new user, I'm prompted to either create a clan or join one via invite code/link during onboarding.

**Acceptance criteria:**
- Auth handled via a third-party provider (Clerk/Supabase Auth/Auth0) — not custom-rolled.
- User cannot access the feed/dashboard without being in at least one clan.
- Onboarding flow: Sign up → Profile setup → Create/Join Clan → Set initial goals → Dashboard.

#### 4.2 Clans
**User stories:**
- As a user, I can create a clan with a name and optional description/image.
- As a clan creator, I get a shareable invite link or code.
- As a user, I can join a clan via invite link/code.
- As a user, I can be a member of multiple clans and switch between them.
- As a clan admin, I can remove members or rename the clan.
- As a user, I can leave a clan.

**Acceptance criteria:**
- Clan has a max size (default 15, configurable later) — enforce at invite-accept time.
- Invite links expire or are regenerable by the admin (prevent stale link abuse).
- Clan switcher UI accessible from the main nav if user belongs to >1 clan.

#### 4.3 Check-ins (Gym Days)
**User stories:**
- As a user, I can log "I worked out today" with one tap.
- As a user, I can optionally add a note, duration, or photo to a gym check-in.
- As a user, I can set a weekly gym target (e.g., 4 days/week) and see progress toward it.
- As a user, I can see my current streak.

**Acceptance criteria:**
- Check-in creation is ≤2 taps from dashboard (low friction is critical).
- Check-in is timestamped and tied to the user's active clan(s) — a check-in is visible to all clans the user is in, unless the user marks it private.
- Weekly target progress shown as a simple ring/bar (e.g., "3/4 this week").
- Streak logic: defined clearly (e.g., streak breaks if a full calendar day passes with no check-in, not tied to weekly target).

#### 4.4 Clan Feed
**User stories:**
- As a clan member, I can see a chronological feed of check-ins from everyone in my clan.
- As a clan member, I can react to a check-in (e.g., emoji reaction — 🔥, 👏).
- As a clan member, I can comment on a check-in.
- As a clan member, I can see a leaderboard/summary of who's on track this week.

**Acceptance criteria:**
- Feed paginated (infinite scroll or "load more"), most recent first.
- Reactions are lightweight (no full comment thread required for MVP reactions).
- Weekly summary view: simple table — member name, target, progress, streak.
- Feed refresh on load/pull-to-refresh; live/websocket updates NOT required for MVP.

#### 4.5 Basic Steps Tracking (Manual)
**User stories:**
- As a user, I can manually log my step count for the day.
- As a user, I can set a daily step goal and see progress.

**Acceptance criteria:**
- Simple numeric input, one entry per day (editable same-day).
- Step check-ins appear in feed the same way gym check-ins do, visually distinguished by type/icon.

#### 4.6 Basic Food Intake Logging (Lightweight)
**User stories:**
- As a user, I can log a simple daily food check-in: "Did you hit your nutrition goal today?" (yes/no/partial) rather than full macro tracking.
- As a user, I can optionally add a note or photo (e.g., "meal prepped today").

**Acceptance criteria:**
- No calorie/macro database in v1 — this is intentionally lightweight to avoid scope blowup.
- Food check-ins are private by default (configurable to share), since food is more sensitive than gym attendance.

---

### PHASE 2 — Depth & Retention

#### 4.7 Notifications & Nudges
- Daily reminder if user hasn't checked in by a set time.
- "Your clan is waiting" nudge if user is the only one who hasn't logged today.
- Weekly clan digest email/notification (who hit their targets).

#### 4.8 Richer Steps Integration
- Google Fit / Apple Health / Fitbit OAuth integration to auto-pull step data (removes manual entry friction).
- Fallback to manual entry if no integration connected.

#### 4.9 Enhanced Food Tracking
- Optional calorie/macro logging for users who want more detail (opt-in, not default).
- Possibly integrate a food database API (e.g., Open Food Facts) if there's demand.

#### 4.10 Clan Enhancements
- Clan challenges (e.g., "30-day gym streak challenge" with a shared leaderboard).
- Clan roles (admin, member) with basic moderation (remove a post, mute a member).
- Multiple clans dashboard view — aggregate progress across all clans.

---

### PHASE 3 — Growth & Polish

- PWA support (installable, offline-friendly check-in queuing).
- Public/shareable progress cards (opt-in, for social sharing outside the app).
- Data export (CSV of your own history).
- Achievements/badges system.

---

## 5. Data Model (Draft)

```
User
- id
- name
- email
- avatar_url
- created_at

Clan
- id
- name
- description
- image_url
- invite_code
- max_size (default 15)
- created_by (User.id)
- created_at

ClanMembership
- id
- user_id
- clan_id
- role (admin | member)
- joined_at

Goal
- id
- user_id
- type (gym | steps | food)
- target_value        // e.g., 4 (days/week), 8000 (steps/day)
- period (daily | weekly)

CheckIn
- id
- user_id
- clan_id (nullable if private-only; or array if multi-clan visible)
- type (gym | steps | food)
- value (jsonb: duration/note/photo_url for gym; count for steps; status/note for food)
- visibility (public_to_clan | private)
- created_at

Reaction
- id
- check_in_id
- user_id
- emoji
- created_at

Comment
- id
- check_in_id
- user_id
- text
- created_at

Streak (can be computed or cached)
- user_id
- type
- current_streak
- longest_streak
- last_check_in_date
```

---

## 6. Non-Functional Requirements

- **Performance:** Feed should load in <1s for a clan of 15 members with a season's worth of history (use pagination, avoid N+1 queries).
- **Privacy:** Food check-ins default private. Users must explicitly opt in to share sensitive data. Clan admins cannot see private check-ins.
- **Scalability:** Design feed queries assuming a user could eventually be in multiple clans — index on `(clan_id, created_at)`.
- **Security:** Invite codes should be unguessable (not sequential IDs); rate-limit invite-code join attempts.
- **Accessibility:** Basic a11y compliance (labels, contrast, keyboard nav) since this is a daily-use app.

---

## 7. Tech Stack (Recommended)

MVP is scoped to validate the core loop with a small group of friends — optimize for one deployment target and minimal moving parts. Standalone Express backend is deferred post-MVP (see §4, Non-Goals).

- **Frontend + API:** Next.js (React + Tailwind) on Vercel — Server Actions/Route Handlers cover MVP CRUD directly; no separate backend service for now.
- **Database:** PostgreSQL (Railway-hosted, or Vercel Postgres/Supabase — TBD).
- **Auth:** Clerk or Supabase Auth (avoid rolling custom auth).
- **File/image storage:** Cloudinary or S3-compatible bucket for check-in photos/avatars.
- **Realtime (Phase 2+):** Consider Pusher/Ably or Postgres LISTEN/NOTIFY if live feed updates become a priority; not needed for MVP.
- **Backend (post-MVP):** Introduce a standalone Node.js/Express service on Railway once background jobs (Phase 2 notifications/digests, streak recalculation) or a native mobile client need a dedicated API boundary.

---

## 8. Success Metrics

- **Activation:** % of signups who join/create a clan within 24 hours.
- **Engagement:** Daily check-in rate per active user; % of users with a streak ≥7 days.
- **Retention:** Week-4 retention of users who joined a clan (vs. those who didn't — this validates the core hypothesis).
- **Social proof:** Average reactions/comments per check-in (signals the feed is actually being used, not just posted to).

---

## 9. Open Questions

- What's the ideal clan size cap — is 15 right, or should smaller clans (5-8) be encouraged for tighter accountability?
- Should streaks break on missed weekly target, or only on a fully skipped day? Needs a clear, motivating (not punishing) definition.
- Is a "digest" feed (once/day summary) better than a live firehose for reducing noise, especially for food check-ins?
- Should food logging remain permanently lightweight, or is there real demand for full macro tracking later?
- Multi-clan membership: should a single check-in be visible to all of a user's clans, or should users pick which clan(s) to share to at check-in time?

---

## 10. Suggested Build Order (Sprint-Level)

1. Auth + profile setup
2. Clan model + create/join/invite flow
3. Gym check-in (create/view) — no feed yet, just personal log
4. Clan feed (read-only, shows all members' gym check-ins)
5. Reactions on feed items
6. Weekly goal setting + progress ring
7. Streak calculation
8. Steps manual logging (reuse check-in infra)
9. Food lightweight logging (reuse check-in infra, private-by-default)
10. Notifications/nudges
11. Phase 2 features as prioritized post-launch feedback
