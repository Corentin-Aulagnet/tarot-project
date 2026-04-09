# Contributing to Tarot Project

Welcome! This is a Tarot card game score tracker built with Next.js and Supabase. This guide helps new collaborators get up to speed, whether you're a game designer or a developer.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [What is Tarot? (Game Rules Overview)](#what-is-tarot-game-rules-overview)
3. [Project Architecture](#project-architecture)
4. [Key Concepts](#key-concepts)
5. [Project Structure](#project-structure)
6. [Common Tasks](#common-tasks)
7. [Code Style & Standards](#code-style--standards)

---

## Quick Start

### Prerequisites

- **Node.js** 18+ ([download](https://nodejs.org/))
- **npm** package manager
- **Git** for version control

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tarot-project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase (Database)**
   - Install Supabase CLI: `npm install -g supabase`
   - Initialize local Supabase: `supabase start`
   - This starts a local PostgreSQL database at `http://localhost:54321`
   - Configuration is in `supabase/config.toml`

4. **Environment Variables**
   - Create a `.env.local` file in the project root
   - Add your Supabase credentials:
     ```
     NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
     NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
     ```

5. **Run the development server**
   ```bash
   npm run dev
   ```
   - Open http://localhost:3000 in your browser
   - Hot reload enabled—changes appear instantly

6. **Build for production**
   ```bash
   npm run build
   npm start
   ```

---

## What is Tarot? (Game Rules Overview)

Tarot is a classic European trick-taking card game for 3–4-5 players.

### Basic Gameplay

- **Objective**: The taker (highest bidder) attempts to reach a point threshold against 2–3 defenders
- **Deck**: 78 cards (unique to Tarot) with special trump suit
- **Bouts**: The three cards 1 (Fool/Excuse), 21 (World/XXI), and Jack of Trumps are called "bouts"—critical for scoring thresholds

### Contracts

Players bid one of four contracts, each with a different difficulty multiplier:

| Contract | Multiplier | Description |
|----------|-----------|-------------|
| **Petite** | 1× | Basic contract; taker's score must reach 56 points if 0 bouts, 51 if 1 bout, 41 if 2 bouts, or 36 if 3 bouts |
| **Garde** | 2× | Medium contract; same threshold as Petite |
| **Garde-Sans (Hand Alone)** | 4× | Taker plays without showing their hand |
| **Garde-Contre (Guarder Against)** | 6× | Highest multiplier; extra challenge |

### Scoring Calculation

1. **Points**: Cards are scored by pip value (0–10 depending on card rank). Each trick's winner scores that card's value.
2. **Point Threshold**: Determines if attack succeeded
   - **0 bouts** → threshold is 56
   - **1 bout** → threshold is 51
   - **2 bouts** → threshold is 41
   - **3 bouts** → threshold is 36
3. **Base Score**: `(|points_att - threshold| + 25) × contract_multiplier`
4. **Bonuses** (applied *if contract succeeds*):
   - **Petit au Bout** (Fool at End): +10 × multiplier
   - **Poignée** (Hand Bonus):
     - Simple (8+ trump cards in starting hand): +20
     - Double (10+ trumps): +30
     - Triple (13+ trumps): +40
   - **Chelem** (All tricks won):
     - Announced & succeeded: +400
     - Announced & failed: −200
     - Unannounced & succeeded: +200
5. **Penalties** (applied *if contract fails*):
   - All bonuses become negative
6. **Special Penalties**:
   - **Misère** (Tête/Atout): −10 (or +40 for declarer)

### Team Composition

- **Attack Team**: Taker + 1 caller (optional; if caller = taker, doubles multiplier)
- **Defense Team**: Remaining players (all receive equal score)

### Example

```
Game: 3 players (Alice, Bob, Carol)
- Taker: Alice
- Caller: Bob
- Defense: Carol
- Contract: Garde (2× multiplier)
- Points Attack: 62 (Alice + Bob combined)
- Points to Make (0 bouts): 56
- Success: 62 ≥ 56 ✓
- Base Score: (|62 - 56| + 25) × 2 = 62
- Alice (taker): 62 × 2 = 124 points
- Bob (caller): 62 points
- Carol (defense): −62 points
```

---

## Project Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser (Client)                       │
│  React Components (use client) + Next.js App Router         │
│  - GameTable (display scores)                               │
│  - IterativeTotalLineChart (visualize trends)               │
│  - Forms (new game, edit game)                              │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP Requests
┌────────────────────▼────────────────────────────────────────┐
│              Next.js API Routes (Server)                    │
│  /api/insert  → Create game record                          │
│  /api/update  → Modify game record                          │
│  /api/delete  → Remove game record                          │
│  /api/players → Player management endpoints                 │
└────────────────────┬────────────────────────────────────────┘
                     │ SQL Queries
┌────────────────────▼────────────────────────────────────────┐
│           Supabase PostgreSQL Database                      │
│  Tables: Games, Players                                     │
│  Enums: Contract, Poignee, Chelem, Misere, Petit_au_bout   │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow: Creating a New Game

1. **User fills form** (`/games/new/page.tsx`)
   - Selects players, contract, points, bonuses, penalties
   - Validates: n_bouts ∈ [0,3], points ≤ 91

2. **Form submission to API** (`POST /api/insert`)
   - Client sends game object to server

3. **Database insert** (`Supabase.Games insert`)
   - Supabase validates foreign keys and enum types
   - Game record stored with UUID

4. **Return to home** (`/app/page.tsx`)
   - Server fetches all games + players
   - Calls `scoreUtils.ts` functions:
     - `buildGamePlayerTotals()` → per-game scores
     - `aggregateTotalScores()` → cumulative totals
     - `aggregateIterativeScores()` → chart data

5. **Render UI**
   - GameTable displays all games with per-player scores
   - IterativeTotalLineChart shows score progression

### Data Flow: Viewing Game Detail

1. User clicks game in table → navigates to `/games/[gid]`
2. Server component fetches single game from database
3. Client component renders game details + edit/delete buttons
4. User can modify game or view breakdown

---

## Key Concepts

### Scoring Logic Location

All Tarot scoring rules are centralized in **`lib/scoreUtils.ts`**. This is the single source of truth for:
- Points-to-make threshold calculation
- Contract multipliers
- Petit au bout bonuses
- Poignée (hand bonus) calculations
- Chelem (slam) bonuses
- Per-player score distribution (taker 2×, caller 1×, defense 1×)

**Why?** Scoring is complex and domain-specific. Centralizing it prevents bugs and makes rule changes easy.

### Player Types in a Game

- **Taker** (`taker_id`): Attacks against defenders; score multiplied by 2
- **Caller** (`call_id`): Second attacker; typically receives normal points; can be same as taker (doubles multiplier)
- **Defenders**: All other players; share negative score equally

### Enums vs. Constants

- **Database Enums** (`supabase.ts`): Used for schema validation; auto-generated from Supabase
  - Examples: `Contract`, `Poignee`, `Chelem`, `Misere`, `Petit_au_bout`
- **Application Enums** (`scoreUtils.ts`): Used in business logic before API calls
  - Ensure values match database enums before inserting

### Server vs. Client Components

- **Server Components** (default): Fetch data securely, render HTML on server
  - Use in `app/` pages for initial data loading
  - Example: `app/page.tsx` loads all games

- **Client Components** (`"use client"` directive): Interactive, real-time updates
  - Use for forms, charts, event handlers
  - Example: `components/GameTable.tsx` has click handlers

**Best Practice**: Fetch data on server, pass to client components as props.

---

## Project Structure

```
tarot-project/
├── app/                           # Next.js App Router (all pages & API routes)
│   ├── page.tsx                   # HOME: Dashboard with leaderboard & chart
│   ├── layout.tsx                 # Navigation layout (NavBar)
│   ├── globals.css                # Global Tailwind styles
│   ├── api/
│   │   ├── insert/route.ts        # POST: Create new game
│   │   ├── update/route.ts        # POST: Update existing game
│   │   ├── delete/route.ts        # POST: Delete game
│   │   └── players/               # Reserved for player CRUD endpoints
│   ├── games/
│   │   ├── new/page.tsx           # Form: Create new game
│   │   ├── [gid]/page.tsx         # Single game detail (server component)
│   │   └── [gid]/posts.tsx        # Single game detail (client component for interactivity)
│   ├── players/
│   │   └── new/page.tsx           # Form: Add new player
│   └── charts/
│       └── iterative/page.tsx     # Full-page score progression chart
│
├── components/                    # Reusable React components
│   ├── NavBar.tsx                 # Navigation header
│   ├── GameTable/
│   │   └── GameTable.tsx          # Table displaying all games & scores
│   └── IterativeTotalLineChart.tsx # Recharts line chart for score trends
│
├── lib/                           # Business logic & utilities
│   ├── scoreUtils.ts              # ⭐ CORE: Tarot scoring implementation
│   └── getPlayers.ts              # Fetch all players from database
│
├── utils/
│   └── supabase/
│       ├── supabase.ts            # Auto-generated types from Supabase schema
│       ├── client.ts              # Browser Supabase client instance
│       ├── server.ts              # Server Supabase client instance
│       └── middleware.ts          # Request/response middleware
│
├── public/                        # Static assets (favicon, images)
├── supabase/
│   └── config.toml                # Local Supabase configuration
│
├── package.json                   # Dependencies & scripts
├── tsconfig.json                  # TypeScript configuration
├── next.config.ts                 # Next.js build configuration
├── tailwind.config.ts             # Tailwind CSS configuration
├── eslint.config.mjs              # Linting rules
├── postcss.config.mjs             # PostCSS (Tailwind processor)
├── README.md                      # Project overview
└── CONTRIBUTING.md                # This file

```

---

## Common Tasks

### Add a New Player

1. Navigate to `/players/new` on the website
2. Enter player name and submit
3. Player added to database; appears in game creation form

### Create a New Game

1. Click "Start New Game" on homepage
2. Fill form:
   - **Players**: Select all players in this game (2+ required)
   - **Taker**: Who led the attack?
   - **Caller**: Who sided with taker? (optional; can be same as taker)
   - **Contract**: Choose Petite, Garde, Garde-Sans, or Garde-Contre
   - **Bouts**: How many of [1, 21, Jack of Trumps] in tricks won by taker? (0–3)
   - **Attack Points**: Total pip points scored by attack team (0–91)
   - **Bonuses**: Select petit au bout winner, poignée type/player, chelem result, misère type/player
3. Submit → game saved to database, scores calculated

### Edit an Existing Game

1. Click game in table → view game detail page
2. Modify any field and click "Update"
3. Scores recalculated; leaderboard updates

### Delete a Game

1. View game detail page
2. Click "Delete" button
3. Game removed from database

### Modify Scoring Rules

1. Open `lib/scoreUtils.ts`
2. Find the relevant function: `getPointsForGame()`, `buildGamePlayerTotals()`, etc.
3. Read the extensive comments explaining Tarot rules
4. Modify the calculation
5. Test by creating a game with known outcome and verifying scores

**Example**: If you want to change petit au bout bonus from 10 to 15:
```typescript
const prime_petit_au_bout = game.petit_au_bout_player_id ? 15*mult: 0;  // Changed from 10
```

### Add a New Schema Field

1. **Update Supabase schema**:
   ```bash
   supabase migration new add_new_field
   # Edit the SQL file in supabase/migrations/
   supabase db push
   ```

2. **Regenerate types**:
   ```bash
   supabase gen types typescript --local
   # Overwrites utils/supabase/supabase.ts with new types
   ```

3. **Update `scoreUtils.ts`** if the new field affects scoring

4. **Update API routes** (`/api/insert`, `/api/update`) if needed

5. **Update form pages** (`/games/new/page.tsx`, `/games/[gid]/posts.tsx`) if user needs to set the field

---

## Code Style & Standards

### TypeScript

- **Always** use TypeScript types for function parameters and return values
- Import types from `utils/supabase/supabase.ts` (auto-generated from database schema)
- Use `Record<Key, Value>` for object maps, never bare `object` or `{[key]: any}`

Example:
```typescript
function getPointsForGame(game: Games, players: Players[]): Record<Players['id'], number> {
  const result: Record<Players['id'], number> = {};
  // ...
  return result;
}
```

### React Components

- Prefer **Server Components** (`page.tsx`, default) for data fetching
- Use `"use client"` only for interactive features (forms, charts, event handlers)
- Pass data down as props; avoid prop drilling with context when possible

Example good:
```typescript
// app/page.tsx (Server Component)
const games = await getGamesFromDatabase();
return <GameTable games={games} />;

// components/GameTable.tsx ("use client" only for interactivity)
"use client";
export function GameTable({ games }: { games: Games[] }) {
  const [sortBy, setSortBy] = useState('date');
  // ...
}
```

### Naming Conventions

- **Files**: `kebab-case.ts` or `PascalCase.tsx` (React components)
- **Variables/Functions**: `camelCase`
- **Types/Interfaces**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE` for globals
- **Database Fields**: `snake_case` (enforced by Supabase schema)

### Comments

- **File-level**: Explain module purpose and main exports
- **Function-level**: Document parameters, return value, and complex logic
- **Inline**: Explain *why*, not *what* (code is self-explanatory; comments explain intent)
- **Scoring Rules**: Always document Tarot semantics (e.g., "Petit au bout bonus if...")

Example:
```typescript
/**
 * Calculates total points for all players in a game based on Tarot scoring rules.
 * @param game - The game record from database
 * @param players - All players involved in the game
 * @returns Object mapping player IDs to their final score
 *
 * Tarot Scoring Rules:
 * - Points to make: determined by n_bouts (if 0 bouts: 56 points needed)
 * - Contract multiplier applied: Petite=1x, Garde=2x, etc.
 * - Taker receives 2x multiplier; caller receives 1x; defenders receive 1x
 * - Bonuses apply only if contract succeeds, penalties if it fails
 */
export function getPointsForGame(game: Games, players: Players[]): Record<Players['id'], number> {
```

### Testing

- Manually test new scoring logic with known Tarot game outcomes
- Use browser DevTools to inspect calculated scores
- Before committing, verify total points sum to zero (game is zero-sum)

---

## Support

- **Questions?** Check the relevant function's comments in `lib/scoreUtils.ts`
- **Bug in scoring?** Look at `getPointsForGame()` first; it's the most complex function
- **Schema issues?** Check `utils/supabase/supabase.ts` for type definitions

Welcome aboard! 🎴

