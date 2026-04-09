# Tarot Card Game Score Tracker

A real-time game scoring and analytics platform for Tarot card games. Track scores across multiple players, visualize trends, and manage game history.

**Built with**: Next.js 16, React 19, TypeScript, Tailwind CSS, Supabase (PostgreSQL)

## 🎴 What This Does

- **Create & Manage Games**: Record Tarot game sessions with players, contracts, and all special plays
- **Automatic Scoring**: Calculates scores based on complex Tarot game rules (points, bouts, bonuses, penalties)
- **Real-time Leaderboard**: View cumulative player totals and game history with color-coded scores
- **Score Progression Chart**: Visualize how player scores evolve across games
- **Player Management**: Add and manage registered players

**For Game Designers**: This app enforces Tarot scoring rules—understand contract multipliers, petit au bout bonuses, poignée (hand bonuses), chelem (slam) scoring, and misère penalties.

**For Developers**: Clean architecture with centralized scoring logic, strong TypeScript types, and clear separation between server data fetching and client interactivity.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+**
- **npm** or **yarn**

### Setup

```bash
# 1. Clone & install
git clone <repository-url>
cd tarot-project
npm install

# 2. Start Supabase (database)
npx supabase start

# 3. Create .env.local with Supabase credentials
# (Copy values from supabase start output)
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-key>
EOF

# 4. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📖 Documentation

**New to the project?** Start here:

- **[CONTRIBUTING.md](CONTRIBUTING.md)** ← Read this first!
  - Setup instructions
  - Tarot game rules overview (essential context)
  - Architecture diagram and data flow
  - Common tasks (create game, modify scoring, etc.)
  - Code style standards

**For developers**:
- See [lib/scoreUtils.ts](lib/scoreUtils.ts) for scoring logic (heavily commented)
- See [CONTRIBUTING.md > Project Structure](CONTRIBUTING.md#project-structure) for file organization

---

## 🎮 Key Features Explained

### Core Concepts

| Concept | Purpose |
|---------|---------|
| **Contract** | Bid level; determines point multiplier (Petite=1x, Garde=2x, Garde-Sans=4x, Garde-Contre=6x) |
| **Bouts** | Count of special cards (1, 21, Jack of Trumps) in tricks won; affects points needed to make contract |
| **Taker** | Player attacking; receives 2× multiplier on score |
| **Caller** | Second attacker; receives 1× multiplier (can be same player as taker) |
| **Defenders** | Remaining players; all receive equal negative score if attack succeeds |
| **Petit au Bout** | Bonus if Fool is won in final trick |
| **Poignée** | Hand bonus for holding many trump cards |
| **Chelem** | Bonus for winning all tricks |

### Example: How Scores are Calculated

```
Game: 3 players (Alice, Bob, Carol)
├─ Taker: Alice | Caller: Bob | Defenders: Carol
├─ Contract: Garde (2x multiplier)
├─ Bouts: 1 (threshold = 51 points)
├─ Attack Points: 62
├─ Contract Success: 62 ≥ 51 ✓
├─ Base Score: (|62 - 51| + 25) × 2 = 72
├─ Petit au Bout Bonus: +20 (Alice has it; ✓)
│
├─ Alice (Taker): (72 + 20) × 2 = 184
├─ Bob (Caller):  (72 + 20) × 1 = 92
└─ Carol (Defense): −(72 + 20) × 1 = −92
   
   Total: 184 + 92 − 92 = 0 ✓ (game is zero-sum)
```

---

## 🏗️ Project Structure

```
app/                  # Next.js pages & API routes
├── page.tsx          # Home: leaderboard & chart
├── games/
│   ├── new/          # Create game form
│   └── [gid]/        # View & edit single game
└── api/
    ├── insert/       # POST: create game
    ├── update/       # POST: modify game
    └── delete/       # POST: remove game

lib/
└── scoreUtils.ts     # ⭐ Tarot scoring rules (heavily commented)

components/
├── GameTable.tsx     # Displays all games with scores
└── IterativeTotalLineChart.tsx  # Score progression chart

utils/supabase/
└── supabase.ts       # Auto-generated database types
```

**Most Important File**: [lib/scoreUtils.ts](lib/scoreUtils.ts)  
→ Contains all Tarot game rule implementations; read comments to understand scoring logic.

---

## 📦 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **UI Framework** | Next.js 16 (App Router) | Server + Client components |
| **State & Rendering** | React 19 | Components, hooks |
| **Language** | TypeScript 5 | Type safety |
| **Styling** | Tailwind CSS 4 | Utility-first CSS |
| **Chart Library** | Recharts 3.8 | Interactive leaderboard visualization |
| **Database** | Supabase (PostgreSQL) | Backend data store |
| **UI Components** | Headless UI, Heroicons | Accessible form elements |
| **Linting** | ESLint 9 | Code quality |

---

## 🔧 Common Commands

```bash
# Development
npm run dev          # Start dev server (http://localhost:3000)

# Production
npm run build        # Build for production
npm start            # Start production server

# Linting
npm run lint         # Check code quality

# Database
supabase start       # Start local Supabase
supabase stop        # Stop local Supabase
supabase migration new <name>  # Create database migration
supabase db push     # Apply migrations locally
```

---

## 🐛 Troubleshooting

**Database won't connect?**
```bash
supabase start  # Ensure Supabase emulator is running
```

**Scores don't match expected values?**
- Check [lib/scoreUtils.ts](lib/scoreUtils.ts) for scoring calculations
- Verify contract multiplier, bouts count, and bonus/penalty logic
- See [CONTRIBUTING.md > Tarot Rules](CONTRIBUTING.md#what-is-tarot-game-rules-overview) for rule reference

**TypeScript errors after schema changes?**
```bash
supabase gen types typescript --local
# Regenerates utils/supabase/supabase.ts with latest schema types
```

---

## 📝 Notes for Collaborators

- **Game rules are centralized** in [lib/scoreUtils.ts](lib/scoreUtils.ts)—all point calculations, multipliers, and bonuses are there
- **Database schema** is strongly typed; see [utils/supabase/supabase.ts](utils/supabase/supabase.ts) for enum definitions
- **New feature?** Read [CONTRIBUTING.md](CONTRIBUTING.md) for guidance on adding fields, modifying rules, or changing scoring logic

---

## 📄 License

This project is private. Contributions welcome!

---

**Questions?** See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed setup, architecture overview, and common tasks.
