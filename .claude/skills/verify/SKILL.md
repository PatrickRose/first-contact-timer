---
name: verify
description: Build, launch and drive this app locally to verify a change end-to-end.
---

# Verifying first-contact-timer changes locally

Next.js App Router app backed by MongoDB, admin area behind iron-session login.

## Launch recipe

1. **Database** — the app needs Mongo. Disposable local one:
    ```bash
    docker run -d --rm --name fct-verify-mongo \
      -e MONGO_INITDB_ROOT_USERNAME=root -e MONGO_INITDB_ROOT_PASSWORD=verifypass \
      -p 27019:27017 mongo:7
    ```
2. **Gotcha**: `src/server/mongo.ts` hardcodes the `mongodb+srv://` scheme,
   which only works with DNS SRV hosts (Atlas). To point at a local Mongo,
   temporarily patch the `connStr` line to honour `MONGO_PROTOCOL` /
   `MONGO_OPTIONS` (as `.env.example` implies) — **revert before committing**.
3. **Env** — write `.env.local` (never commit):
    ```
    MONGO_URL=localhost:27019
    MONGO_USERNAME=root
    MONGO_PASSWORD=verifypass
    MONGO_DB=fct-verify
    MONGO_PROTOCOL=mongodb
    MONGO_OPTIONS=authSource=admin
    SECRET_COOKIE_PASSWORD=<any 32+ char string>
    ```
4. **Admin user** — `echo "admin" | npx tsx src/bin/create-user.ts` creates
   user `admin` with the default password from
   `src/server/repository/user/consts.ts` (`DEFAULT_PASSWORD`).
5. **Run** — `PORT=3111 npm run dev` (turbopack; ready in a few seconds).

## Flows worth driving

- Admin: `/admin/login` (redirects there from any `/admin` page), then
  `/admin/game/create` to create games.
- Player view: `/game/<id>` — sidebar cycles through the game's components
  every few seconds, so snapshot more than once if a component seems missing.
- Facilitator view: `/game/<id>/control` — per-component control panels;
  state changes persist to Mongo (verify with
  `docker exec fct-verify-mongo mongosh -u root -p verifypass --authenticationDatabase admin --quiet fct-verify --eval '...'`).

## Known noise

- The game pages log one pre-existing React "useEffect must not return
  anything besides a function" console error (sidebar/TabSwitcher area).
  Not caused by your change if you didn't touch it.
