# SlowSpark — Project Context & Handoff

Read this file fully before doing any work on this repo. It records every decision taken so far,
how the owner wants to work, what is done, and what comes next. Keep it updated at the end of
every working session (section 6 and 7 especially).

---

## 1. Owner and how to work with her

- **Owner:** Bharti Rai — Java backend developer (~3 yrs: Java, Spring Boot, Spring Security, JWT,
  Hibernate, Kafka, SQL Server). New to React Native and microservices; wants to understand all code.
- **Language:** she writes in Hinglish (Hindi in Roman script + English). Reply in the same style,
  short and clear.
- **Rules she set (follow exactly):**
  1. **Commits are in her name only:** `git config user.name "Bharti Rai"`,
     `git config user.email "bhartiraivns235@gmail.com"`.
  2. **No AI/assistant attribution anywhere** — no "Co-Authored-By", no "Generated with",
     no mentions in commit messages, PR descriptions, code comments or files.
  3. **Every code change must be documented in `docs/CODE_GUIDE.md`** — which file, what it does, and why.
  4. **Work step by step.** For work that is already agreed (listed in section 7), do it without
     waiting for approval and report when done. For anything new or any change in a decision,
     **ask first and wait for her "haan"**.
  5. Explain in simple terms; she will read and learn the code.

---

## 2. Product decisions (final)

- **Name:** SlowSpark. Tagline: "Pehle jaano, phir milo."
- **Goal:** real launch on Google Play Store (Android first), for **all of India** (all states/UTs).
- **Intent onboarding:** "Aap SlowSpark pe kyun ho?" → SERIOUS_RELATIONSHIP, MARRIAGE,
  CASUAL_DATING, FRIENDSHIP, NOT_SURE. Discover filters by intent (default: same intent as user)
  and shows same-intent first.
- **Discover style:** Hinge-style (full profile scroll; like a specific photo or prompt with an
  optional comment; X to pass) — chosen over Tinder swipe to fit the "slow" concept.
- **Profile fields (like Tinder/Bumble/Hinge):** name, DOB (18+ only), gender, interested in,
  2–6 photos, bio (300), height, job, company, education, college, hometown, religion (with
  "Prefer not to say"), zodiac, drinking, smoking, workout, diet, pets, kids, languages,
  interests (max 5), prompts (max 3). Optional fields can be skipped.
- **Date Ready feature (core idea):**
  - Unlocks after **7 days** of match **and 20+ messages** (configurable in `application.yml`).
  - Both choose YES/NO **privately**; a NO is never shown to the other (round silently expires).
  - If both YES: each writes "usme kya achha laga" + **up to 3 questions** for the other.
  - Each answers the other's questions; any question can be **skipped**.
  - **Mutual reveal:** answers show only when both forms are in and all questions answered/skipped.
  - Answer window **48 hours**; WAITING round expires in 7 days.
  - Then show date place ideas + safety tips (public place, tell a friend, own transport...).
- **Safety (Play Store requirement):** 18+ check, report (always also blocks), block (ends match),
  in-app permanent account delete, privacy policy & terms links in Settings.
- **Design:** "Warm Ember" (chosen from 3 options) — cream `#FBF6EF`, terracotta accent `#C2532B`,
  text `#2A1D17`, Fraunces serif headings + Inter body, flame/spark logo. Light mode only for now.
- Premium/monetisation: later, after launch.

## 3. Tech decisions (final)

- **Architecture:** monolith first, feature-based packages; move to microservices later
  (plan in `CODE_GUIDE.md` section 9).
- **Backend:** Java 21, Spring Boot 4 (parent `4.0.0` — bump to latest 4.x patch if available),
  Spring Security + JWT (jjwt 0.12.6), Spring Data JPA, PostgreSQL, Flyway, STOMP WebSocket,
  Lombok, Firebase Admin SDK.
- **Login:** Firebase Auth — **phone OTP + Google**. Backend verifies the Firebase ID token and
  issues its own JWT (30 days). `dev-login` endpoint exists for testing only (`DEV_LOGIN_ENABLED`).
- **Mobile:** React Native with **Expo SDK 58**, TypeScript, React Navigation 7 (not Expo Router),
  `@react-native-firebase/*`, Google Sign-In, `@stomp/stompjs`. Needs a development build
  (native modules), not Expo Go. Builds via EAS (`eas.json`).
- **Photos:** uploaded from the phone directly to Cloudinary (unsigned preset for now); backend
  stores URLs only.
- **Repo:** https://github.com/BhartiRai111/slowspark (branch `main`).

## 4. Where things are

- `README.md` — setup, env vars, how to run, Play Store checklist
- `docs/CODE_GUIDE.md` — every file explained, DB tables, full API list, Date Ready state machine
- `backend/` — Spring Boot app; DB schema in `src/main/resources/db/migration/`
- `mobile/` — Expo app; screens in `src/screens/`, theme in `src/theme.ts`

---

## 5. Done so far (as of 2026-11-09)

| Commit | What |
|--------|------|
| Backend setup | pom, application.yml, Flyway V1 schema + V2 seed (30 interests, 12 prompts), Firebase + JWT auth |
| Backend features | profile/onboarding, discover (native SQL), like/pass/matches, likes tab, chat REST + WebSocket, Date Ready, block/report/delete account |
| Mobile app | 17 screens in Warm Ember style (auth, 5-step onboarding, discover, likes, view profile, chats, chat, Date Ready, my profile, filters, settings, report) |
| Docs | README, CODE_GUIDE, safer JPQL (`UserMatch` entity name, enum params) |

**Verification status — important:**
- Mobile: `npx tsc --noEmit` passes and `expo export --platform android` bundles successfully.
- **Backend has NEVER been compiled or run** (Maven Central was not reachable in the earlier
  environment; only a Java syntax check was done). Expect possible compile/runtime fixes,
  especially around Spring Boot 4 / Hibernate 7 specifics.
- Nothing has been tested end-to-end on a phone yet.

## 6. Next immediate step (start here)

1. `cd backend && mvn -q compile` → fix any errors.
2. `docker compose up -d` then `DEV_LOGIN_ENABLED=true mvn spring-boot:run` → fix startup errors
   (Flyway + Hibernate `ddl-auto: validate` must pass).
3. Smoke-test APIs with dev-login (README has curl examples): onboarding → discover with two users
   → like both ways → match → messages → Date Ready (temporarily lower
   `app.date-ready.min-days-after-match` / `min-messages` for testing).
4. Add backend tests (Testcontainers PostgreSQL) for match creation and the Date Ready flow.
5. Update `CODE_GUIDE.md` and this file, commit in Bharti's name.

## 7. Remaining work (priority order)

**A. Make it run** — section 6 above; then Firebase + Cloudinary setup with Bharti, development
build on her phone, full flow test.

**B. Needed before Play Store launch**
- Deploy backend + PostgreSQL (Railway/Render/AWS), HTTPS, real `JWT_SECRET`, dev login off
- Privacy Policy + Terms pages, support email; web page/link for account-deletion requests
- Push notifications when app is closed (new message, new match, Date Ready updates) —
  Expo Notifications + store push tokens on backend
- Admin panel / endpoints to review `reports`, ban users (`UserStatus.BANNED`), moderate photos
  and Date Ready questions
- Real app icon + splash (currently Expo defaults)
- Play Console forms: Data safety, 18+ audience, dating-app declaration; production build (.aab)

**C. Features discussed but not built**
- Photo verification (selfie) → sets `users.is_verified` (badge UI already exists)
- Dark mode for Warm Ember
- Hindi language option

**D. Quality / later**
- Signed Cloudinary uploads instead of unsigned
- Premium plans (advanced filters)
- Microservices split (plan in CODE_GUIDE section 9; Kafka events, shared broker for WebSocket)
