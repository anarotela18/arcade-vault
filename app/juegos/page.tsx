import { createClient } from "@/lib/supabase/server";
import type { GameRow, GameWithBest } from "@/lib/supabase/types";
import GamesLibrary from "./games-library";

export default async function Biblioteca() {
  const supabase = await createClient();

  const [{ data: games }, { data: scores }] = await Promise.all([
    supabase.from("games").select("*").order("created_at").returns<GameRow[]>(),
    supabase
      .from("scores")
      .select("game_id, score")
      .order("score", { ascending: false })
      .returns<{ game_id: string; score: number }[]>(),
  ]);

  // scores viene ordenado por score DESC: el primero de cada juego es su mejor.
  const best = new Map<string, number>();
  for (const s of scores ?? []) {
    if (!best.has(s.game_id)) best.set(s.game_id, s.score);
  }

  const withBest: GameWithBest[] = (games ?? []).map((g) => ({
    ...g,
    best: best.get(g.id) ?? 0,
  }));

  return <GamesLibrary games={withBest} />;
}
