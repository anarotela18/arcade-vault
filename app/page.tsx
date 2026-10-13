import { createClient } from "@/lib/supabase/server";
import type { GameRow } from "@/lib/supabase/types";
import HomePage from "./home-page";

export default async function Home() {
  const supabase = await createClient();
  const { data: games } = await supabase
    .from("games")
    .select("*")
    .order("created_at")
    .limit(6)
    .returns<GameRow[]>();

  return <HomePage games={games ?? []} />;
}
