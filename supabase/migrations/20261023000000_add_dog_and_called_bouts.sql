ALTER TABLE public."Games"
ADD COLUMN n_bouts_dog integer
  CHECK (n_bouts_dog IS NULL OR n_bouts_dog BETWEEN 0 AND 3),
ADD COLUMN n_bouts_called integer
  CHECK (n_bouts_called IS NULL OR n_bouts_called BETWEEN 0 AND 3);
