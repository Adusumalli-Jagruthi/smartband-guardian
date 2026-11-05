# SmartBand API (Express + MongoDB)

REST backend for the SmartBand frontend (`src/lib/api/services.ts`). Hardware: ESP32-C3 Mini, NEO-6M GPS, pulse heart-rate sensor, MPU6050, SOS button, buzzer, LiPo battery. **No SpO2 or temperature** — the ingest endpoint rejects those fields.

## 1. Setup
```sh
cd server
npm install
cp .env.example .env   # then fill it in
npm run dev            # auto-restarts on change (Node ≥ 18.17)
npm start              # production
```
Frontend: set `VITE_API_BASE_URL=http://localhost:5000/api` in the project root `.env` and add the frontend origin to `CORS_ORIGIN`.

## 2. MongoDB Atlas
1. Create a free cluster at cloud.mongodb.com.
2. Database Access → add a user with a strong password.
3. Network Access → allow your IP (and your host's outbound IPs in production).
4. Connect → Drivers → copy the `mongodb+srv://…` string into `MONGODB_URI` (add `/smartband` as the database name).

## 3. Secrets
- `JWT_SECRET`: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
- `ENCRYPTION_KEY` (64 hex chars, AES-256-GCM for stored integration credentials): `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Changing it makes saved integration keys unreadable — re-enter them.
- `NVIDIA_API_KEY` / `GROQ_API_KEY`: default AI keys. A guardian's saved AI integration overrides them.

## 4. API (all under `/api`, JSON, `Authorization: Bearer <jwt>` unless noted)
| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login` (role must match account), `GET /auth/me`, `POST /auth/logout` (revokes all tokens) |
| Users | `GET /users/:id` (self or linked guardian), `PUT /users/:id` (self) |
| Devices | `GET /devices`, `GET /devices/:id`, `POST /devices` → returns `deviceKey` **once**, `DELETE /devices/:id`, `POST /devices/:id/buzzer` |
| Ingest (ESP32) | `POST /ingest` with headers `X-Device-Id`, `X-Device-Key`; body `{heartRate, steps, activity, battery, lat, lng, accuracy, sos, firmware}`; response `{ok, buzzer}` |
| Sensors | `GET /sensors/:userId/latest`, `GET /sensors/:userId/history?range=day\|week` |
| GPS | `GET /gps/:userId/latest`, `GET /gps/:userId/history?date=YYYY-MM-DD` |
| Medicines (elderly, guardian) | `GET /medicines/:userId`, `GET /medicines/:userId/history`, `POST /medicines/:userId`, `PUT /medicines/:id`, `POST /medicines/:id/confirm` `{status?: "taken"\|"missed"}`, `DELETE /medicines/:id` |
| Alerts | `GET /alerts?userId=`, `POST /alerts/sos` `{userId?, lat?, lng?}`, `POST /alerts/:id/acknowledge` |
| Guardian | `GET /guardian/linked-users`, `POST /guardian/link` `{code}`, `DELETE /guardian/link/:userId` |
| AI | `POST /ai/chat` `{message, language, history}` → `{reply, language}` |
| Integrations | `GET/PUT /integrations` (alert toggles); guardian only: `GET/PUT/DELETE /integrations/:name/config`, `POST /integrations/:name/test` (`thingspeak`, `telegram`, `ai`) |
| Health | `GET /health` (no auth) |

Behaviour notes:
- Alerts are raised for SOS, falls (`activity: "fall"`), heart rate outside `HR_MIN–HR_MAX`, low battery (≤10%) and missed medicines (checked every 5 min after `MED_MISSED_GRACE_MINUTES`). Each alert is forwarded to the Telegram chat of every linked guardian who enabled it.
- Readings are mirrored to ThingSpeak (field1 BPM, field2 steps, field3 battery, field4 lat, field5 lng) when enabled.
- Integration secrets are encrypted at rest and only ever returned masked (`••••a1b2`). Tests make real provider calls; nothing is simulated.
- AI supports English, Telugu, Tamil, Hindi, Malayalam, Bengali, Marathi, Gujarati (and Kannada). The system prompt forbids diagnosis/prescriptions and directs emergencies to SOS / 112. Provider order: chosen/`AI_PRIMARY`, then the other as fallback.
- Rate limits: auth 20/15 min, AI 20/min, ingest 240/min, overall 600/15 min per IP.

## 5. ESP32 example
```cpp
http.begin("https://your-api.example.com/api/ingest");
http.addHeader("Content-Type", "application/json");
http.addHeader("X-Device-Id", DEVICE_ID);
http.addHeader("X-Device-Key", DEVICE_KEY);
http.POST("{\"heartRate\":78,\"steps\":1200,\"activity\":\"walking\",\"battery\":84,\"lat\":17.385,\"lng\":78.4867}");
// if response contains "buzzer":true → beep
```

## 6. Deploy (Render / Railway / Fly / VPS)
- Root directory `server`, build `npm install`, start `npm start`.
- Set every variable from `.env.example`; `NODE_ENV=production`; `CORS_ORIGIN` = your published frontend URL.
- Allow the host's IPs in Atlas Network Access. Serve over HTTPS.
- Run a single instance (the missed-medicine job runs in-process) or move it to a scheduled worker if you scale out.

## ThingSpeak live dashboard
`GET /api/thingspeak/:userId/feeds?results=100` (JWT; self or an approved linked guardian only) reads fields 1–8:
1 Temperature °F · 2 Heart rate BPM · 3 SpO₂ % (experimental) · 4 MPU6050 X · 5 MPU6050 Y · 6 Panic (0/1) · 7 Latitude · 8 Longitude.
Credentials: a guardian saves Channel ID + Read API Key in the app under Integrations (stored encrypted). Telegram (`TELEGRAM_*`) and Groq/NVIDIA keys stay in `server/.env` or the encrypted integration store — never in the browser. Blank fields are returned as `null` and shown as "--"; 0,0 GPS is treated as no fix.
