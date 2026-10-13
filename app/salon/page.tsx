import { createClient } from "@/lib/supabase/server";
import type { GameRow } from "@/lib/supabase/types";
import HallBoard from "./hall-board";

export default async function SalonPage() {
  const supabase = await createClient();
  const { data: games } = await supabase
    .from("games")
    .select("*")
    .order("created_at")
    .returns<GameRow[]>();

  return <HallBoard games={games ?? []} />;
}
