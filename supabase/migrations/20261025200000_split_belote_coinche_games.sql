CREATE TABLE IF NOT EXISTS public."BeloteGames" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  team1_player1_id uuid NOT NULL REFERENCES public."Players"(id) ON DELETE RESTRICT,
  team1_player2_id uuid NOT NULL REFERENCES public."Players"(id) ON DELETE RESTRICT,
  team2_player1_id uuid NOT NULL REFERENCES public."Players"(id) ON DELETE RESTRICT,
  team2_player2_id uuid NOT NULL REFERENCES public."Players"(id) ON DELETE RESTRICT,
  contract_team smallint NOT NULL CHECK (contract_team IN (1, 2)),
  contract_type text NULL CHECK (
    contract_type IS NULL OR contract_type IN ('♥', '♦', '♣', '♠', 'No Trump', 'All Trumps')
  ),
  team1_points integer NOT NULL CHECK (team1_points BETWEEN 0 AND 162),
  belote_team smallint NULL CHECK (belote_team IN (1, 2)),
  CONSTRAINT belote_game_distinct_players CHECK (
    team1_player1_id <> team1_player2_id
    AND team1_player1_id <> team2_player1_id
    AND team1_player1_id <> team2_player2_id
    AND team1_player2_id <> team2_player1_id
    AND team1_player2_id <> team2_player2_id
    AND team2_player1_id <> team2_player2_id
  )
);

CREATE TABLE IF NOT EXISTS public."CoincheGames" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  team1_player1_id uuid NOT NULL REFERENCES public."Players"(id) ON DELETE RESTRICT,
  team1_player2_id uuid NOT NULL REFERENCES public."Players"(id) ON DELETE RESTRICT,
  team2_player1_id uuid NOT NULL REFERENCES public."Players"(id) ON DELETE RESTRICT,
  team2_player2_id uuid NOT NULL REFERENCES public."Players"(id) ON DELETE RESTRICT,
  contract_team smallint NOT NULL CHECK (contract_team IN (1, 2)),
  contract_type text NULL CHECK (
    contract_type IS NULL OR contract_type IN ('♥', '♦', '♣', '♠', 'No Trump', 'All Trumps')
  ),
  contract_points integer NULL CHECK (
    contract_points IS NULL OR (contract_points BETWEEN 80 AND 160 AND contract_points % 10 = 0)
  ),
  team1_points integer NOT NULL CHECK (team1_points BETWEEN 0 AND 162),
  belote_team smallint NULL CHECK (belote_team IN (1, 2)),
  coinched boolean NOT NULL DEFAULT false,
  surcoinched boolean NOT NULL DEFAULT false,
  capot_announced boolean NOT NULL DEFAULT false,
  CONSTRAINT coinche_game_distinct_players CHECK (
    team1_player1_id <> team1_player2_id
    AND team1_player1_id <> team2_player1_id
    AND team1_player1_id <> team2_player2_id
    AND team1_player2_id <> team2_player1_id
    AND team1_player2_id <> team2_player2_id
    AND team2_player1_id <> team2_player2_id
  ),
  CONSTRAINT coinche_game_surcoinche_requires_coinche CHECK (
    NOT surcoinched OR coinched
  )
);

CREATE INDEX IF NOT EXISTS belote_games_created_at_idx
  ON public."BeloteGames"(created_at DESC);
CREATE INDEX IF NOT EXISTS coinche_games_created_at_idx
  ON public."CoincheGames"(created_at DESC);

INSERT INTO public."BeloteGames" (
  id, created_at,
  team1_player1_id, team1_player2_id, team2_player1_id, team2_player2_id,
  contract_team, contract_type, team1_points, belote_team
)
SELECT
  h.id, h.created_at,
  m.team1_player1_id, m.team1_player2_id, m.team2_player1_id, m.team2_player2_id,
  h.contract_team, h.contract_type, h.team1_points, h.belote_team
FROM public."BeloteHands" h
JOIN public."BeloteMatches" m ON m.id = h.match_id
WHERE h.game_type = 'Belote'
ON CONFLICT (id) DO NOTHING;

INSERT INTO public."CoincheGames" (
  id, created_at,
  team1_player1_id, team1_player2_id, team2_player1_id, team2_player2_id,
  contract_team, contract_type, contract_points, team1_points, belote_team,
  coinched, surcoinched, capot_announced
)
SELECT
  h.id, h.created_at,
  m.team1_player1_id, m.team1_player2_id, m.team2_player1_id, m.team2_player2_id,
  h.contract_team, h.contract_type, h.contract_points, h.team1_points, h.belote_team,
  h.coinched, h.surcoinched, h.capot_announced
FROM public."BeloteHands" h
JOIN public."BeloteMatches" m ON m.id = h.match_id
WHERE h.game_type = 'Coinche'
ON CONFLICT (id) DO NOTHING;
