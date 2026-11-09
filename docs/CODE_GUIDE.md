# SlowSpark — Code Guide

Ye document batata hai ki **kaunsi file mein kya hai aur kyun likha gaya**. Har naye feature ke saath ise update karte rehna.

---

## 1. Poori picture ek nazar mein

```
 Phone (React Native app)
   │  1. Firebase se login (phone OTP / Google) → Firebase ID token
   │  2. POST /api/auth/firebase  → hamara JWT
   │  3. Har API call: Authorization: Bearer <JWT>
   │  4. WebSocket /ws (STOMP) → live messages, matches, Date Ready updates
   ▼
 Spring Boot backend (ek hi app = monolith)
   │  Security (JWT filter) → Controller → Service → Repository
   ▼
 PostgreSQL (tables Flyway SQL files se bante hain)

 Photos: phone → Cloudinary (direct upload) → URL backend mein save
```

**Monolith kyun?** Ek hi app jaldi banta hai, debug aasaan hai, aur ek developer ke liye sahi hai. Code ko *feature ke hisaab se packages* mein rakha hai (`auth`, `profile`, `match`, `chat`, `date`, `safety`), taaki baad mein har package ko alag microservice banana aasaan ho (section 9 dekho).

---

## 2. Folder structure

```
slowspark/
├── backend/                     Spring Boot 4 + Java 21
│   ├── pom.xml                  dependencies
│   └── src/main/
│       ├── java/com/slowspark/
│       │   ├── SlowSparkApplication.java
│       │   ├── common/          errors, distance helper
│       │   ├── config/          Security, WebSocket config
│       │   ├── security/        JWT banana/padhna, filters
│       │   ├── auth/            login (Firebase + dev login)
│       │   ├── user/            users table + enums
│       │   ├── meta/            interests, prompts, states (master lists)
│       │   ├── profile/         profile, photos, prompts, preferences
│       │   ├── match/           discover, like/pass, matches
│       │   ├── chat/            messages + realtime push
│       │   ├── date/            Date Ready feature
│       │   └── safety/          block, report, account delete
│       └── resources/
│           ├── application.yml
│           └── db/migration/    V1 schema, V2 seed data
├── mobile/                      React Native (Expo) app
│   ├── App.tsx                  fonts, providers, navigation
│   └── src/
│       ├── api/                 backend calls + types
│       ├── auth/                login state, Firebase
│       ├── realtime/            WebSocket connection
│       ├── components/          reusable UI
│       ├── navigation/          screens ka map
│       ├── screens/             har screen
│       ├── lib/                 labels, photo upload
│       ├── theme.ts             Warm Ember colors/fonts
│       └── config.ts            .env values
├── docker-compose.yml           local PostgreSQL
└── docs/CODE_GUIDE.md           ye file
```

---

## 3. Database (backend/src/main/resources/db/migration)

| File | Kya | Kyun |
|------|-----|------|
| `V1__init_schema.sql` | Saari tables | Flyway app start pe isse chalata hai. Tables SQL se banti hain, Hibernate se nahi (`ddl-auto: validate`), taaki production DB pe kabhi galti se table na badle. |
| `V2__seed_master_data.sql` | 30 interests, 12 prompts | Profile setup mein yahi list dikhti hai. Nayi prompts add karni ho to **nayi file** `V3__...sql` banao, purani file kabhi mat badlo (Flyway checksum fail ho jayega). |

**Tables**

| Table | Kya rakhta hai |
|-------|----------------|
| `users` | login identity (firebase_uid, phone, email), naam, dob, gender, interested_in, intent, city/state, lat/long, status |
| `user_profile` | "About me": bio, height, job, education, lifestyle (drinking, smoking...) |
| `user_photos` | photo URLs + order (position 0 = main photo) |
| `interests`, `user_interests` | master list + user ne kaunse chune (max 5) |
| `user_languages` | user ki languages |
| `prompts`, `user_prompts` | master questions + user ke jawab (max 3) |
| `user_preferences`, `user_preferred_intents` | Discover filters: age range, distance, intents |
| `swipes` | har like/pass (ek user ek profile pe sirf ek baar — UNIQUE) |
| `matches` | dono ne like kiya. `user1_id < user2_id` hamesha, taaki ek pair ki ek hi row bane |
| `messages` | chat |
| `date_requests` | ek "Date pe chalein?" round: dono ke choices + status |
| `date_feedback` | "usme kya achha laga" (har user ka ek) |
| `date_questions` | sawaal + jawab |
| `blocks`, `reports` | safety |

**ON DELETE CASCADE kyun?** Play Store dating apps se maangta hai ki user apna account aur data delete kar sake. `DELETE FROM users WHERE id = ?` chalte hi database khud saari related rows hata deta hai.

---

## 4. Backend — file by file

### Root
| File | Kya | Kyun |
|------|-----|------|
| `SlowSparkApplication.java` | `main()` | `@EnableScheduling` isliye ki Date Ready ke purane rounds har 15 min expire ho sakein |
| `pom.xml` | dependencies | Spring Boot 4 mein web starter ka naam `spring-boot-starter-webmvc` hai aur Flyway ke liye `spring-boot-starter-flyway` alag chahiye. Lombok getters/setters ke liye. |
| `application.yml` | settings | Saari secret values env variables se aati hain (`${JWT_SECRET:...}`), code mein hardcode nahi. `app.date-ready.*` se 7 din / 20 messages jaise rules badal sakte ho bina code chhue. |

### common/
| File | Kya | Kyun |
|------|-----|------|
| `ApiException.java` | apna exception with HTTP status | Service mein `throw ApiException.badRequest("...")` likho, user ko wahi message dikhega |
| `GlobalExceptionHandler.java` | exceptions → `{"error": "..."}` | App ko hamesha ek hi format mein error milta hai. Unknown errors log hote hain, user ko generic message |
| `GeoUtils.java` | do lat/long ke beech km | Profile pe "3 km" dikhane ke liye. Exact location kabhi nahi bhejte |

### security/ aur config/
| File | Kya | Kyun |
|------|-----|------|
| `security/JwtService.java` | JWT banata aur padhta hai | Subject = user id. 30 din valid. Firebase sirf login pe use hota hai, uske baad hamara JWT |
| `security/JwtAuthFilter.java` | har request pe header check | Valid token ho to user id ko "logged in principal" bana deta hai |
| `security/CurrentUser.java` | `CurrentUser.id()` | Controller mein logged-in user ki id nikalne ka ek line ka tareeka |
| `security/StompAuthInterceptor.java` | WebSocket ka security guard | CONNECT pe JWT check karta hai, aur koi kisi aur ki private queue subscribe na kar sake |
| `config/SecurityConfig.java` | kaunse URL public | Public: `/api/auth/**`, `/api/meta/**`, `/actuator/health`, `/ws/**`. Baaki sab JWT maangte hain. Stateless (no session) |
| `config/WebSocketConfig.java` | STOMP setup | App `/ws` pe connect karta hai, `/user/queue/events` sunta hai. Simple in-memory broker (ek server ke liye kaafi) |

### auth/
| File | Kya | Kyun |
|------|-----|------|
| `FirebaseTokenVerifier.java` | Firebase ID token verify karta hai | Isse pakka hota hai ki phone/Google login asli hai. Credentials na hon to Firebase login band (local testing mein dev-login use karo) |
| `AuthService.java` | user dhundho ya banao → JWT | Pehli baar login = naya user row. BANNED user ko login nahi |
| `AuthController.java` | `POST /api/auth/firebase`, `POST /api/auth/dev-login` | Dev login sirf `DEV_LOGIN_ENABLED=true` pe chalta hai, warna 404 |
| `AuthDtos.java` | request/response records | |

### user/
| File | Kya |
|------|-----|
| `User.java` | `users` table ka entity. `getAge()` dob se umar nikalta hai |
| `Gender`, `InterestedIn`, `Intent`, `UserStatus` | enums. `InterestedIn.genders()` aur `acceptingGender()` Discover ka "dono taraf match" logic aasaan banate hain |
| `UserRepository.java` | `deleteUserRow()` plain SQL delete hai taaki DB ka CASCADE chale |

### meta/
| File | Kya |
|------|-----|
| `Interest`, `Prompt` + repositories | master lists |
| `MetaController.java` | `GET /api/meta/interests`, `/prompts`, `/states` (36 states/UTs, poora India) |

### profile/
| File | Kya | Kyun |
|------|-----|------|
| `UserProfile.java` | About me fields + languages + interests | Languages/interests alag tables mein hain par profile ke saath load hote hain (`@ElementCollection`, `@ManyToMany`) |
| `UserPhoto.java`, `UserPrompt.java`, `UserPreferences.java` | baaki profile tables | |
| `ProfileService.java` | onboarding aur edit ka saara logic | `updateBasicInfo` mein **18+ check**. `completeOnboarding` check karta hai ki naam, intent, 2+ photos, location sab hai — tabhi user Discover mein dikhega. `card()` woh `ProfileCard` banata hai jo dusre dekhte hain |
| `ProfileController.java` | `/api/me/...` | GET, PUT basic/intent/profile/photos/location/preferences, POST complete |
| `ProfileDtos.java` | sab request/response | Validation annotations (`@Size`, `@Min`) yahin hain |

### match/
| File | Kya | Kyun |
|------|-----|------|
| `DiscoverService.java` | Discover feed (native SQL) | Rules: active + onboarding complete, gender/interested-in **dono taraf** match, intent filter (default: same intent), age range, distance (haversine formula SQL mein), pehle swipe kiye ya block wale nahi. Order: jinhone aapko pehle like kiya → same intent → recently active |
| `Swipe.java`, `Match.java` | entities | `Match` ka JPQL naam `UserMatch` hai kyunki "match" query keyword se takra sakta hai |
| `MatchService.java` | like, pass, Likes tab, matches list, unmatch | Like karte waqt agar saamne wale ne pehle like kiya hai → match bana do aur unhe live `NEW_MATCH` bhejo. `isDateReadyUnlocked()`: match ko 7 din + 20 messages |
| `MatchController.java` | `/api/discover`, `/api/users/{id}/like|pass`, `/api/users/{id}`, `/api/likes`, `/api/matches`, `/api/matches/{id}/unmatch` | |

### chat/
| File | Kya | Kyun |
|------|-----|------|
| `Message.java`, `MessageRepository.java` | messages | Pagination `beforeId` se (purane messages scroll karne pe) |
| `ChatService.java` | send, history, mark read | Send ke baad dono users ko live `NEW_MESSAGE` |
| `ChatController.java` | REST: `GET/POST /api/matches/{id}/messages`, `POST .../read` | App REST se bhejta hai (simple aur reliable), live updates WebSocket se |
| `ChatSocketController.java` | WebSocket se bhejna (`/app/chat.send`) | Optional second raasta |
| `RealtimeNotifier.java` | kisi user ke phone pe live event | Event types: `NEW_MESSAGE`, `MESSAGES_READ`, `NEW_MATCH`, `UNMATCHED`, `DATE_UPDATE` |

### date/ — Date Ready (SlowSpark ka main feature)

```
 WAITING ──(dono YES)──► QUESTIONS ──(dono ke form + saare jawab)──► REVEALED
    │                         │
    └──(7 din, ya kisi ne NO)─┴──(48 ghante)──► EXPIRED
```

| File | Kya | Kyun |
|------|-----|------|
| `DateRequest.java` | ek round, dono ke choices | |
| `DateFeedback.java` | "kya achha laga" | |
| `DateQuestion.java` | sawaal + jawab/skip | |
| `DateReadyService.java` | poora flow | **NO kabhi dusre ko nahi dikhta** — round chup-chaap expire hota hai, rejection ka awkwardness nahi. Jawab tabhi dikhte hain jab dono ne form bhara aur har sawaal answer/skip hua (mutual reveal). `expireOldRequests()` har 15 min |
| `DateReadyController.java` | `GET /api/matches/{id}/date-ready`, `POST .../choice`, `.../form`, `.../answers` | |
| `DateDtos.java` | `Stage` enum | Backend batata hai app ko kaunsi screen dikhani hai: LOCKED, AVAILABLE, WAITING, FORM, ANSWER, WAITING_FOR_THEM, REVEALED |

### safety/
| File | Kya | Kyun |
|------|-----|------|
| `Block.java` | composite key (blocker, blocked) | |
| `Report.java` | reason + details, status OPEN | Team baad mein review karegi |
| `SafetyService.java` | block, report, delete account | Block = match bhi khatam. Report = automatic block bhi. Delete = DB cascade + Firebase user delete |
| `SafetyController.java` | `POST /api/users/{id}/block`, `/report`, `DELETE /api/me` | |

---

## 5. API list (sab ek jagah)

| Method | URL | Kaam |
|--------|-----|------|
| POST | `/api/auth/firebase` | Firebase token → JWT |
| POST | `/api/auth/dev-login` | testing login |
| GET | `/api/meta/interests` · `/prompts` · `/states` | master lists |
| GET | `/api/me` | meri profile |
| PUT | `/api/me/basic` · `/intent` · `/profile` · `/photos` · `/location` · `/preferences` | onboarding/edit |
| POST | `/api/me/complete` | onboarding khatam |
| DELETE | `/api/me` | account delete |
| GET | `/api/discover` | feed (20 profiles) |
| POST | `/api/users/{id}/like` · `/pass` | swipe |
| GET | `/api/users/{id}` | kisi ki profile |
| GET | `/api/likes` | jinhone mujhe like kiya |
| GET | `/api/matches` | chats list |
| POST | `/api/matches/{id}/unmatch` | |
| GET/POST | `/api/matches/{id}/messages` | chat |
| POST | `/api/matches/{id}/messages/read` | read receipt |
| GET | `/api/matches/{id}/date-ready` | current stage |
| POST | `/api/matches/{id}/date-ready/choice` · `/form` · `/answers` | Date Ready steps |
| POST | `/api/users/{id}/block` · `/report` | safety |
| WS | `/ws` → subscribe `/user/queue/events` | live events |

---

## 6. Mobile app — file by file

### Base
| File | Kya | Kyun |
|------|-----|------|
| `App.tsx` | fonts load, providers, navigation | Fraunces (headings) + Inter (text) load hone tak splash screen |
| `app.json` | app name, package `com.slowspark.app`, permissions, plugins | Firebase/Google ke native plugins yahin. `google-services.json` git mein nahi jaata (secret) |
| `eas.json` | cloud build profiles | development (APK), preview, production (Play Store) |
| `.env.example` | config template | API URL, Google client id, Cloudinary, privacy URLs |
| `src/config.ts` | `.env` values padhta hai | Expo sirf `EXPO_PUBLIC_` wale vars app ko deta hai |
| `src/theme.ts` | **Warm Ember** design tokens | cream `#FBF6EF`, terracotta `#C2532B`, text `#2A1D17`. Har color yahin se, taaki theme ek jagah badle |

### api/
| File | Kya |
|------|-----|
| `client.ts` | `api()` fetch wrapper: JWT lagata hai, error message nikalta hai, 401 pe logout. Token `expo-secure-store` mein (encrypted) |
| `endpoints.ts` | har backend API ka ek function |
| `types.ts` | backend DTOs ke TypeScript types |

### auth/ aur realtime/
| File | Kya | Kyun |
|------|-----|------|
| `auth/firebaseAuth.ts` | phone OTP + Google login → Firebase ID token | Native modules hain isliye Expo Go mein nahi, development build mein chalte hain |
| `auth/AuthContext.tsx` | login status: loading / signedOut / onboarding / ready | Isi status se `RootNavigator` decide karta hai kaunsi screens dikhani hain |
| `realtime/RealtimeContext.tsx` | ek STOMP connection | Screens `useRealtime(e => ...)` se live events sunti hain. RN ke liye `forceBinaryWSFrames` aur `appendMissingNULLonIncoming` zaroori hain |

### navigation/
| File | Kya |
|------|-----|
| `types.ts` | har screen ke params (TypeScript check karta hai) |
| `RootNavigator.tsx` | status ke hisaab se 3 alag stacks + 4 bottom tabs (Discover, Likes, Chats, Profile) |

### components/
| File | Kya |
|------|-----|
| `ui.tsx` | Screen, Title, Button, TextField, Chip, ChipSelect, MultiChipSelect, IconButton, Loading, EmptyState — sab Warm Ember style mein |
| `ProfileView.tsx` | Hinge-style profile: photo, prompt, photo, prompt... har photo/prompt pe alag like button |
| `LikeModal.tsx` | like ke saath optional comment |

### screens/
| Screen | Kya |
|--------|-----|
| `auth/WelcomeScreen` | "Pehle jaano, phir milo." + 18+ note |
| `auth/LoginScreen` | +91 phone → OTP, Google, aur dev login (sirf testing) |
| `onboarding/BasicInfoScreen` | naam, DOB (18 se kam pe aage nahi), gender, kisse milna hai |
| `onboarding/IntentScreen` | 5 intent cards |
| `onboarding/AboutMeScreen` | bio, 3 prompts, height, job, lifestyle chips, languages, 5 interests. Sab optional |
| `onboarding/PhotosScreen` | 2–6 photos, Cloudinary upload |
| `onboarding/LocationScreen` | location + city/state auto (reverse geocode), phir onboarding complete |
| `discover/DiscoverScreen` | ek poori profile, like (photo/prompt pe) ya pass (X). Match pe "It's a spark!" |
| `discover/LikesScreen` | jinhone like kiya + unka comment |
| `discover/ViewProfileScreen` | full profile; Likes se aaye to "Like back / Pass" |
| `chat/ChatsScreen` | naye matches (upar, gol photos) + conversations, unread count |
| `chat/ChatScreen` | messages (live), Date Ready banner, menu: profile / report / unmatch |
| `date/DateReadyScreen` | ek hi screen, backend ke `stage` ke hisaab se: choose → form → answer → wait → reveal + date ideas + safety tips |
| `profile/MyProfileScreen` | edit links + "doosron ko aap aise dikhte ho" preview |
| `profile/PreferencesScreen` | age, distance, intents |
| `profile/SettingsScreen` | privacy/terms/support, logout, account delete |
| `profile/ReportScreen` | reason + details (report = block bhi), ya sirf block |

### lib/
| File | Kya |
|------|-----|
| `labels.ts` | enum → text ("SERIOUS_RELATIONSHIP" → "Serious relationship"), chip options, height format |
| `upload.ts` | gallery se photo → Cloudinary → https URL |

---

## 7. Ek request ka safar (example: like)

1. User Discover pe prompt ka heart dabata hai → `LikeModal` khulta hai
2. `discoverApi.like(id, comment)` → `POST /api/users/{id}/like` with JWT
3. `JwtAuthFilter` token se user id nikalta hai
4. `MatchController.like` → `MatchService.like`
5. Checks: khud ko like nahi, profile active hai, block nahi, pehle swipe nahi
6. `swipes` mein row. Agar saamne wale ka LIKE pehle se hai → `matches` mein row + `RealtimeNotifier` unhe `NEW_MATCH` bhejta hai
7. Response `{matched: true, matchId}` → app "It's a spark!" dikhata hai

---

## 8. Jaan-boojh kar liye gaye decisions

- **Firebase sirf login ke liye, baaki apna JWT** — OTP/SMS ka jhanjhat Firebase sambhalta hai, par data aur rules hamare backend mein rehte hain.
- **Photos direct Cloudinary pe** — backend pe image upload ka load nahi aata. Production mein *signed* uploads pe shift karna better hai.
- **Discover SQL mein** — filtering database mein hoti hai, Java mein nahi, taaki users badhne pe bhi fast rahe. Users bahut badhein to PostGIS + index.
- **Hinge-style, Tinder-style nahi** — "slow" concept: log profile padh ke like karein.
- **Date Ready mein NO chupa rehta hai** — rejection ka dard kam.

**Abhi pending / aage ke kaam**
- Photo verification (selfie) → `is_verified`
- Push notifications (Expo Notifications) jab app band ho
- Report review ke liye admin panel, aur sawaal/photos ki moderation
- Premium features (advanced filters)
- Backend tests (Testcontainers ke saath)

---

## 9. Baad mein microservices kaise banenge

Har package already ek boundary hai:

| Service | Packages | Database tables |
|---------|----------|-----------------|
| auth-service | `auth`, `security` | users (identity part) |
| profile-service | `profile`, `meta`, `user` | user_profile, photos, prompts, preferences |
| match-service | `match` | swipes, matches |
| chat-service | `chat` | messages |
| date-service | `date` | date_* |
| safety-service | `safety` | blocks, reports |

Badlav: services ek dusre ko direct call ki jagah **Kafka events** bhejengi (`MatchCreated`, `UserBlocked`, `MessageSent`), WebSocket ke liye RabbitMQ/Redis broker, aur aage ek API Gateway.
