# C2JC Games — v2 (Next.js)

A board game interest tracker for C2JC events. Built with **Next.js 16 (App Router)**, **MUI v7**, and **PostgreSQL** (Supabase-compatible).

---

## Environment Variables

Create a `.env.local` file in the root of this project (`c2jcgames-v2/`) with the following variables:

```env
# ─── Database ────────────────────────────────────────────────────────────────
# Full connection string to your PostgreSQL database.
#
# Supabase example (Transaction Pooler — recommended for serverless):
#   DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
#
# Supabase Session Pooler (if you need prepared statements):
#   DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
#
# Local PostgreSQL:
#   DATABASE_URL=postgresql://c2jc:c2jc@localhost:5432/c2jc
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

> **Note:** `NODE_ENV` is set automatically by Next.js (`development` in dev, `production` in prod). SSL is enabled automatically when `NODE_ENV=production`.

---

## Database Setup (Supabase)

1. Create a new **Supabase** project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** and run the schema below to create all required tables:

```sql
-- Users
CREATE TABLE IF NOT EXISTS users (
  userid     SERIAL PRIMARY KEY,
  firstName  TEXT NOT NULL,
  lastName   TEXT NOT NULL,
  bggAcc     TEXT,
  owned_games JSONB NULL
);

-- Board game metadata (sourced from BGG)
CREATE TABLE IF NOT EXISTS game_details (
  gameid      INTEGER PRIMARY KEY,
  name        TEXT NOT NULL,
  imageurl    TEXT NOT NULL,
  minPlayers  INTEGER,
  maxPlayers  INTEGER,
  playTime    INTEGER,
  description TEXT
);

-- Games owned by users (many-to-one: multiple owners allowed)
CREATE TABLE IF NOT EXISTS games (
  key      SERIAL PRIMARY KEY,
  gameid   INTEGER REFERENCES game_details(gameid),
  ownerid  INTEGER REFERENCES users(userid),
  hideGame BOOLEAN
);

-- Users interested in playing a specific game
CREATE TABLE IF NOT EXISTS game_interested (
  gameid  INTEGER NOT NULL,
  userid  INTEGER NOT NULL,
  PRIMARY KEY (gameid, userid),
  FOREIGN KEY (gameid) REFERENCES game_details(gameid),
  FOREIGN KEY (userid) REFERENCES users(userid)
);
```

3. Copy your **connection string** from **Project Settings → Database → Connection String → URI** (use the **Transaction pooler** URL for Vercel/serverless deployments).

---

## API Routes

All backend logic lives in `app/api/` — no separate Express server needed.

| Method   | Route                                       | Description                          |
|----------|---------------------------------------------|--------------------------------------|
| `POST`   | `/api/db/addGame`                           | Add a game to a user's owned list    |
| `POST`   | `/api/db/addGameDetails`                    | Persist BGG game metadata            |
| `POST`   | `/api/db/interestedGame`                    | Mark a user as interested in a game  |
| `DELETE` | `/api/db/interestedGame`                    | Remove interest for a user           |
| `GET`    | `/api/db/gamesList`                         | Fetch all games with interest data   |
| `GET`    | `/api/db/gamesList/owner/[userId]`          | Fetch game IDs owned by a user       |
| `GET`    | `/api/db/gameDetails/[gameId]`              | Fetch a single game's details        |
| `GET`    | `/api/db/ownedGames/[userId]`               | Fetch a user's BGG game collection   |
| `GET`    | `/api/db/interestedGames/user/[userId]`     | Fetch games a user is interested in  |
| `POST`   | `/api/db/addUser`                           | Create a new user                    |
| `GET`    | `/api/db/getUser`                           | Find a user by name, BGG acc, or ID  |
| `PATCH`  | `/api/db/updateUser`                        | Update a user's BGG game collection  |
| `GET`    | `/api/bgg/user/[username]`                  | Fetch BGG user profile (XML)         |
| `GET`    | `/api/bgg/user/[username]/collection`       | Fetch BGG user game collection       |
| `GET`    | `/api/bgg/boardgame/[gameId]`               | Fetch BGG board game details         |

---

## Local Development

```bash
# Install dependencies
pnpm install

# Add .env.local with DATABASE_URL (see above)
cp .env.local.example .env.local  # then edit it

# Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploying

This app works on any Next.js-compatible host (Vercel, Railway, Render, Fly.io, etc.).

1. Set the `DATABASE_URL` environment variable in your host's dashboard.
2. Run `pnpm build` to verify there are no build errors before deploying.
3. For **Vercel**: connect your repository and add `DATABASE_URL` under **Settings → Environment Variables**.

> If using Supabase, prefer the **Transaction Pooler** connection string for serverless environments to avoid connection exhaustion.

---

## Project Structure

```
c2jcgames-v2/
├── app/                    # Next.js App Router
│   ├── api/
│   │   ├── db/             # Database API routes
│   │   └── bgg/            # BoardGameGeek API proxy routes
│   ├── add/                # Add Game page
│   ├── nametag/            # Sign-in page
│   ├── manage/             # Manage Games page (placeholder)
│   ├── layout.tsx          # Root layout with MUI provider
│   └── page.tsx            # Home / Games List
├── components/             # React UI components
│   ├── AddGame/
│   ├── BottomNav/
│   ├── Common/
│   ├── GamesList/
│   ├── NameTag/
│   └── UserHeader/
├── hooks/
│   └── useUser.ts          # localStorage-based session hook
├── lib/
│   └── db.ts               # PostgreSQL connection pool (pg)
└── services/
    ├── gameService.ts      # Client-side game API calls
    └── userService.ts      # Client-side user/BGG API calls
```
