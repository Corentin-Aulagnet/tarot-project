ALTER TABLE public."BeloteHands"
  ALTER COLUMN contract_type DROP NOT NULL,
  ADD COLUMN game_type text NOT NULL DEFAULT 'Belote'
    CHECK (game_type IN ('Belote', 'Coinche')),
  ADD COLUMN contract_points integer NULL
    CHECK (contract_points IS NULL OR contract_points BETWEEN 80 AND 160),
  ADD COLUMN coinched boolean NOT NULL DEFAULT false,
  ADD COLUMN surcoinched boolean NOT NULL DEFAULT false,
  ADD COLUMN capot_announced boolean NOT NULL DEFAULT false;
