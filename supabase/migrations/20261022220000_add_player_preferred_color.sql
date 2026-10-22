ALTER TABLE public."Players"
ADD COLUMN preferred_color text;

WITH ranked_players AS (
  SELECT
    id,
    row_number() OVER (ORDER BY "Name", id) AS player_number
  FROM public."Players"
),
color_palette AS (
  SELECT ARRAY[
    '#f08070', '#f4a261', '#e9c46a', '#b5c96b', '#82b879', '#55b7a7',
    '#55c7c2', '#69bde8', '#78a9e8', '#969be8', '#ad91dc', '#c18bd6',
    '#d785c0', '#e98bab', '#ed8291', '#ec987f', '#e9ae7b', '#83c5a2',
    '#70c5d4', '#b39cdb', '#d39ab0', '#c9ad80', '#90c7b0', '#8ab7d1'
  ]::text[] AS colors
)
UPDATE public."Players" AS players
SET preferred_color = CASE
  WHEN ranked_players.player_number <= array_length(color_palette.colors, 1)
    THEN color_palette.colors[ranked_players.player_number]
  ELSE format(
    'hsl(%s, 70%%, 70%%)',
    ((ranked_players.player_number - array_length(color_palette.colors, 1) - 1) * 137) % 360
  )
END
FROM ranked_players
CROSS JOIN color_palette
WHERE players.id = ranked_players.id;

CREATE UNIQUE INDEX players_preferred_color_unique
ON public."Players" (preferred_color)
WHERE preferred_color IS NOT NULL;
