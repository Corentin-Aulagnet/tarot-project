-- RLS was enabled on these tables without any policies, so every insert from the app
-- was rejected. Match the Games and Players tables, which have RLS disabled.
ALTER TABLE public."BeloteGames" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."CoincheGames" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."BeloteHands" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."BeloteMatches" DISABLE ROW LEVEL SECURITY;
