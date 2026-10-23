CREATE TABLE public."BeloteMatches" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  target_score integer NOT NULL DEFAULT 1000 CHECK (target_score >= 100),
  team1_player1_id uuid NOT NULL REFERENCES public."Players"(id) ON DELETE RESTRICT,
  team1_player2_id uuid NOT NULL REFERENCES public."Players"(id) ON DELETE RESTRICT,
  team2_player1_id uuid NOT NULL REFERENCES public."Players"(id) ON DELETE RESTRICT,
  team2_player2_id uuid NOT NULL REFERENCES public."Players"(id) ON DELETE RESTRICT,
  CONSTRAINT belote_match_distinct_players CHECK (
    team1_player1_id <> team1_player2_id
    AND team1_player1_id <> team2_player1_id
    AND team1_player1_id <> team2_player2_id
    AND team1_player2_id <> team2_player1_id
    AND team1_player2_id <> team2_player2_id
    AND team2_player1_id <> team2_player2_id
  )
);

CREATE TABLE public."BeloteHands" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public."BeloteMatches"(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  contract_team smallint NOT NULL CHECK (contract_team IN (1, 2)),
  contract_type text NOT NULL CHECK (
    contract_type IN ('♥', '♦', '♣', '♠', 'No Trump', 'All Trumps')
  ),
  team1_points integer NOT NULL CHECK (team1_points BETWEEN 0 AND 162),
  belote_team smallint NULL CHECK (belote_team IN (1, 2))
);

CREATE INDEX belote_matches_created_at_idx ON public."BeloteMatches"(created_at DESC);
CREATE INDEX belote_hands_match_created_at_idx ON public."BeloteHands"(match_id, created_at);
