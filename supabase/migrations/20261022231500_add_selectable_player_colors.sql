ALTER TABLE public."Players"
ADD COLUMN IF NOT EXISTS preferred_color_selected boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.set_player_preferred_color(
  p_player_id uuid,
  p_color text
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  current_color text;
  color_owner_id uuid;
  replacement_color text;
  available_colors text[] := ARRAY[
    '#f08070', '#f4a261', '#e9c46a', '#b5c96b', '#82b879', '#55b7a7',
    '#55c7c2', '#69bde8', '#78a9e8', '#969be8', '#ad91dc', '#c18bd6',
    '#d785c0', '#e98bab', '#ed8291', '#ec987f', '#e9ae7b', '#83c5a2',
    '#70c5d4', '#b39cdb', '#d39ab0', '#c9ad80', '#90c7b0', '#8ab7d1',
    'hsl(0, 70%, 70%)', 'hsl(137, 70%, 70%)', 'hsl(274, 70%, 70%)',
    'hsl(51, 70%, 70%)', 'hsl(188, 70%, 70%)', 'hsl(325, 70%, 70%)',
    'hsl(102, 70%, 70%)', '#f2b880', '#e8d47a', '#aaca82', '#72b99a',
    '#64c0bd', '#82c5df', '#86a8dc', '#aaa0e2', '#bd9bdb', '#d58ccf',
    '#e995b5', '#ec8d83', '#e9a45f', '#c3cf71', '#76c9ae', '#91cce0',
    '#779ad1', '#a99ac8'
  ];
BEGIN
  IF NOT (p_color = ANY(available_colors)) THEN
    RAISE EXCEPTION 'The requested color is not available.'
      USING ERRCODE = '22023';
  END IF;

  SELECT preferred_color
  INTO current_color
  FROM public."Players"
  WHERE id = p_player_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Player not found.' USING ERRCODE = 'P0002';
  END IF;

  SELECT id
  INTO color_owner_id
  FROM public."Players"
  WHERE preferred_color = p_color
    AND id <> p_player_id
  FOR UPDATE;

  IF color_owner_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM public."Players"
      WHERE id = color_owner_id
        AND preferred_color_selected
    ) THEN
      RAISE EXCEPTION 'That color has already been selected by another player.'
        USING ERRCODE = '23505';
    END IF;

    UPDATE public."Players"
    SET preferred_color = NULL
    WHERE id = p_player_id;

    IF current_color IS NOT NULL THEN
      replacement_color := current_color;
    ELSE
      SELECT color
      INTO replacement_color
      FROM unnest(available_colors) AS palette(color)
      WHERE NOT EXISTS (
        SELECT 1
        FROM public."Players"
        WHERE preferred_color = color
      )
      LIMIT 1;
    END IF;

    IF replacement_color IS NULL THEN
      RAISE EXCEPTION 'No replacement default color is available.'
        USING ERRCODE = '22023';
    END IF;

    UPDATE public."Players"
    SET preferred_color = replacement_color,
        preferred_color_selected = false
    WHERE id = color_owner_id;
  END IF;

  UPDATE public."Players"
  SET preferred_color = p_color,
      preferred_color_selected = true
  WHERE id = p_player_id;
END;
$$;
