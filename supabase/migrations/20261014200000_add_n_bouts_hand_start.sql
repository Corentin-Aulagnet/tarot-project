ALTER TABLE public."Games"
ADD COLUMN n_bouts_hand_start integer
CHECK (n_bouts_hand_start IS NULL OR n_bouts_hand_start BETWEEN 0 AND 3);
