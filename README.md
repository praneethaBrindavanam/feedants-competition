# feedants-competition

An Expo React Native competition screen backed by an Express API and MongoDB.
Competition content is seeded once into MongoDB and then loaded from the API.
Registration, capacity, lifecycle, and the device's participation state are
calculated from persisted data.

## Requirements

- Node.js 20 or newer
- MongoDB running locally, or a MongoDB connection string
- Expo Go or an iOS/Android simulator

## Run locally

1. Copy `server/.env.example` to `server/.env` and set `MONGODB_URI` if your
   MongoDB is not available at the example local address.
2. Install dependencies from the project root and the two app folders:

   ```sh
   npm install
   npm --prefix server install
   npm --prefix mobile install
   ```

3. Start MongoDB, then run `npm run dev`.
4. Open the Expo QR code with Expo Go. For an Android emulator or a physical
   device, set `EXPO_PUBLIC_API_URL` to an API host reachable from that device
   (for example, `http://10.0.2.2:4000/api` for the Android emulator).

The API listens on port 4000 by default. Expo web is available with
`npm --prefix mobile run web`.

## API

- `GET /api/competitions/:slug?userId=...` — competition details and state
- `POST /api/competitions/:slug/registration` with `{ "userId": "..." }` —
  reserve a spot
- `DELETE /api/competitions/:slug/registration` with `{ "userId": "..." }` —
  cancel before the competition starts
- `GET /api/health` — API health check

Registration capacity is protected by a conditional atomic MongoDB update;
the participant is only added if a spot remains and registration is still open.
The app persists a device-scoped user ID so its participation state survives
restarts. This lightweight identity is for the assignment demo, not a substitute
for production authentication.

## Tests

Run backend business-rule tests with `npm test`.
