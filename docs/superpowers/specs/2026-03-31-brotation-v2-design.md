# Brotation v2 — Dad Friendship Tracker

## Overview

Brotation is a personal friendship-building challenge tracker for dads. It helps turn acquaintances — specifically other dads met through kids — into real 1-on-1 friends through consistent intentional effort.

The existing Brotation app (Friend-Connect) will be renamed and repurposed for professional networking. This is a **new app, new codebase** that takes the name "Brotation."

## Problem

The "dad friend" problem: you meet other dads through your kids' activities, but turning that proximity into an actual friendship requires deliberate follow-through. The first step isn't hard — it's the consistency, follow-up, and graduating from "acquaintance who stands near me at soccer practice" to actual friend.

## Target User

One user: the developer. Built for personal use. May be shared for testing later.

## Core Concept

Two interlocking systems drive the app:

1. **Challenge Board** — monthly and quarterly targets for in-person meetups. Horizontal goals push breadth ("hang out with X different guys this month"), vertical goals push depth ("see Jake Y times this quarter"). The app suggests horizontal targets based on active roster size (roster minus one).

2. **Pipeline** — each person sits at a stage (Acquaintance → Building → Bro). Stages advance automatically based on accumulated interaction points. Manual override available to promote or demote.

Logging an interaction feeds both systems — it ticks challenge progress and accumulates toward stage progression.

## Roster Management

### Tiers

- **Active** (3-5 people) — front and center on the dashboard. The guys you're actively investing in.
- **Bench** (~10-15 people) — visible but secondary. People you've met and have context on, but aren't actively pursuing right now.
- **Archive** — out of sight but recoverable. People who've moved away, kids no longer in same circle, etc.

### Actions

- **Icebox** — one tap, Active → Bench. No data loss, keeps stage and history.
- **Promote** — one tap, Bench → Active.
- **Archive** — move to archive, recoverable.
- **Active cap** — hardcoded at 5 for MVP. Promoting a 6th person requires benching someone first.

## Interaction Types & Points

Interactions are categorized by depth of engagement. No modality distinction — these can happen via any channel.

| Type | Points | Description |
|---|---|---|
| Quick Touch | 1 | Text, DM, brief chat at pickup |
| Real Conversation | 5 | 20+ min talk, phone call, real exchange |
| Intentional Hangout | 15 | Made plans, showed up, spent real time |

Logging is fast: tap person → pick type → optional note → done. Under 5 seconds for common case.

When logging via the FAB, the picker shows Active roster first, then Bench below (dimmed but tappable). Logging an interaction with a bench person prompts: "Move [name] to Active?" If yes and at cap, asks who to bench.

## Pipeline Stages & Graduation

| Stage | Threshold | Description |
|---|---|---|
| Acquaintance | 0 pts | You know their name, you've chatted |
| Building | 25 pts | Regular interactions, starting to make plans |
| Bro | 150 pts | Consistent intentional hangouts, friendship has its own momentum |

- Points are cumulative, no decay (MVP).
- Graduation is automatic when threshold is reached.
- Manual override: promote or demote at any time.
- Graduation triggers a celebration moment.

## Challenge Board

### Horizontal (Monthly)

- Goal: "Hang out with X different guys this month"
- X is suggested by the app: active roster size minus one
- Tracks unique people interacted with
- Resets monthly

### Vertical (Quarterly)

- Per-person targets: "See [name] Y times this quarter"
- Default: 2x/quarter for Building, 1x/quarter for Acquaintance, 3x/quarter for Bro
- Resets quarterly

### Streaks

- Track consecutive months where horizontal goal is met
- Displayed on the challenge card

### Missed Goals

- No punishment. Shows last month's results briefly ("3/4 — close!") and starts fresh. No guilt spiraling.

## Notifications

- One push notification per day, max. Configurable time.
- App picks the highest-priority nudge:
  - Someone Active you haven't interacted with in a while
  - Behind on monthly horizontal goal
  - Vertical target at risk of being missed this quarter
- Actionable and specific: "You haven't seen Jake in 3 weeks. Text him?"
- No notification if you're on track.

## UI Structure

### Primary Screen (Dashboard)

Single scrollable screen with three sections:

1. **Header** — "BROTATION" title, current month
2. **Challenge Card** — monthly horizontal progress (e.g. "2/3 guys this month"), streak indicator, quarterly per-person targets as chips below
3. **Active Roster** — 3-5 person cards showing: name, stage badge, last interaction + how long ago, points + progress toward next stage
4. **Bench** — collapsed by default, expandable, shows benched people with "Activate" button

**FAB** — orange "+" in bottom right to log an interaction.

### Person Detail Screen

Accessed by tapping a person card:

- Header: name, stage badge, total points, progress to next stage
- Quick log buttons: three interaction types
- Notes: free text ("kids in same 2nd grade class", "likes IPAs, runs marathons")
- Interaction history: chronological list with dates and notes
- Actions: Icebox / Archive / Override Stage

### Challenge Detail Screen

Accessed by tapping the challenge card:

- Monthly and quarterly breakdowns
- Past months' results

### No tab bar, no hamburger menu.

Everything accessible within 1-2 taps from the dashboard.

## Visual Design

Dark theme, warm orange accent. Reference: Stitch project "Brotation — Dad Friendship Tracker" (project ID: 1610947847887335655) using "The Brotherhood Framework" design system.

- Base: dark charcoal (#131313), with 6-tier surface hierarchy (#0E0E0E → #393939)
- Accent: orange (#F97316), light accent (#FFB690)
- Achievement/Bro: gold (#FFDB3C), with golden glow effect on Bro cards
- Stage colors: Acquaintance (green #22C55E), Building (blue #3B82F6), Bro (gold #FFDB3C with tilted badge)
- Typography: Plus Jakarta Sans 900 weight (headlines/numbers), Inter (body/labels)
- Rounded square avatars (xl radius) with distinct per-person background colors
- Tonal layering instead of borders — no 1px lines
- Progress bars: orange-to-gold gradient (from-primary-container to-secondary-container)
- Quarterly target chips: slightly rotated for "kinetic" energy
- Glassmorphic FAB with shadow glow
- Stitch reference screens saved at `design/stitch-screen-1.html` and `design/stitch-screen-2.html`. Additional mockup at `design/mockup.html`.

## Technical Approach

### Stack

- **Mobile:** Expo, React Native, TypeScript
- **Storage:** AsyncStorage (local-only for MVP)
- **Auth:** None (single user, personal device)
- **Backend:** None for MVP

### Data Access

All storage calls isolated in a single `storage.ts` module. This makes it straightforward to swap AsyncStorage for an API layer later when/if a backend is added.

### Data Model (Local)

```typescript
interface Target {
  id: string;
  name: string;
  notes: string;
  stage: 'acquaintance' | 'building' | 'bro';
  status: 'active' | 'bench' | 'archive';
  totalPoints: number;
  createdAt: Date;
}

interface Interaction {
  id: string;
  targetId: string;
  type: 'quick_touch' | 'real_conversation' | 'intentional_hangout';
  points: number;
  note?: string;
  date: Date;
}

interface Challenge {
  id: string;
  type: 'monthly_horizontal' | 'quarterly_vertical';
  targetCount: number;
  periodStart: Date;
  periodEnd: Date;
}
```

### Future Backend Path

When ready to share with others:
1. Stand up Express + Postgres + Drizzle on Railway
2. Add Apple Sign-In auth
3. Swap `storage.ts` implementation from AsyncStorage to API calls
4. Migrate local data to server

## Contact Import

Pull from the device phonebook via `expo-contacts` to add people to your roster. Uses the same multiselect pattern as the current Brotation app (`ContactPickerScreen`).

- Tap "Add from Contacts" on the dashboard
- Full-screen contact picker with search bar
- Multiselect with checkboxes — tap to toggle, counter shows "X selected"
- Filters out contacts already in your roster (by contact ID and name)
- "Next" button leads to confirmation screen showing selected contacts
- All imported contacts default to Bench status, stage Acquaintance
- Name, phone number, and email carry over from the contact card
- After import, you can promote individuals to Active

## Out of Scope (MVP)

- Backend / API / auth
- Cross-device sync
- Configurable active cap (hardcoded at 5)
- Point decay
- Search (unnecessary with 3-15 people)
- Web client
