# SlowSpark

**Pehle jaano, phir milo.** A dating app for India where people get to know each other before meeting.

What makes it different:
- **Intent onboarding** — "Aap SlowSpark pe kyun ho?" (serious, shaadi, casual, dosti, not sure). Discover shows people with the same intent first.
- **Hinge-style profiles** — like a specific photo or prompt, with an optional comment.
- **Date Ready** — after 7 days and enough chatting, both privately choose "Date pe chalein?". Only if both say yes, each writes what they liked about the other and asks up to 3 questions. Answers are revealed to both at the same time.

| Part | Tech |
|------|------|
| Backend | Java 21, Spring Boot 4, Spring Security + JWT, Spring Data JPA, PostgreSQL, Flyway, WebSocket (STOMP) |
| Login | Firebase Auth (phone OTP + Google) |
| Mobile | React Native (Expo SDK 58), TypeScript, React Navigation |
| Photos | Cloudinary (uploaded straight from the phone) |

Code walkthrough (which file does what, and why): **[docs/CODE_GUIDE.md](docs/CODE_GUIDE.md)**

---

## 1. Run the backend locally

Needs: Java 21, Maven, Docker (for PostgreSQL).

```bash
# 1. Start PostgreSQL
docker compose up -d

# 2. Run the backend (dev login on, Firebase off)
cd backend
DEV_LOGIN_ENABLED=true mvn spring-boot:run
```

Check it: open http://localhost:8080/actuator/health → `{"status":"UP"}`

Tables are created automatically by Flyway from `backend/src/main/resources/db/migration/`.

### Environment variables

| Variable | Default | What |
|----------|---------|------|
| `DB_URL` | `jdbc:postgresql://localhost:5432/slowspark` | Database |
| `DB_USER` / `DB_PASSWORD` | `slowspark` | Database login |
| `JWT_SECRET` | dev value | **Set a long random value in production** (32+ chars) |
| `FIREBASE_CREDENTIALS` | empty | Path to Firebase service-account JSON. Empty = Firebase login disabled |
| `DEV_LOGIN_ENABLED` | `false` | `true` allows login with just a phone number (testing only) |
| `CORS_ORIGINS` | `*` | Allowed web origins |

### Quick API test (dev login)

```bash
TOKEN=$(curl -s -X POST localhost:8080/api/auth/dev-login \
  -H 'Content-Type: application/json' -d '{"phone":"+919999999999"}' | jq -r .accessToken)

curl -s localhost:8080/api/me -H "Authorization: Bearer $TOKEN"
```

## 2. Run the mobile app

Firebase login and Google sign-in are native modules, so the app runs in a **development build**, not Expo Go.

```bash
cd mobile
npm install
cp .env.example .env        # then fill in the values
```

1. **Firebase**: create a project → add an Android app with package `com.slowspark.app` → download `google-services.json` into `mobile/`. Enable **Phone** and **Google** sign-in. Add your debug SHA-1 for phone auth.
2. **Backend for Firebase**: Firebase console → Project settings → Service accounts → Generate new private key. Run the backend with `FIREBASE_CREDENTIALS=/path/to/that.json`.
3. **Cloudinary**: free account → Settings → Upload → add an *unsigned* upload preset → put cloud name + preset in `.env`.
4. Build and run on your phone (Android):

```bash
npx eas-cli@latest build --profile development --platform android   # installable APK, built in the cloud
# or, with Android Studio installed:
npx expo run:android

npm start    # starts the dev server; open the app on the phone
```

`EXPO_PUBLIC_API_URL` must be your laptop's Wi-Fi IP (e.g. `http://192.168.1.5:8080`), not `localhost`, when testing on a real phone.

Typecheck: `npm run typecheck`

## 3. Before launching on Play Store

- [ ] Deploy backend + PostgreSQL (e.g. Railway, Render, AWS) with a real `JWT_SECRET`, `DEV_LOGIN_ENABLED=false`, HTTPS
- [ ] Set `EXPO_PUBLIC_DEV_LOGIN=false`
- [ ] Publish a Privacy Policy and Terms page; put the URLs and a support email in `.env`
- [ ] Play Console: Google Play Developer account, app content forms (Data safety, target audience 18+, dating app declaration)
- [ ] Account deletion: in-app (Settings → Account delete karo) is done; Play also asks for a web link to request deletion
- [ ] Moderation plan for reports (`reports` table) and photos
- [ ] `npx eas-cli@latest build --profile production --platform android` → upload the .aab
- [ ] Check the latest Google Play policy for dating apps before submitting
