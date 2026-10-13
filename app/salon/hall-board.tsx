"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { GameRow, ScoreRow } from "@/lib/supabase/types";

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("es-ES");

export default function HallBoard({ games }: { games: GameRow[] }) {
  const [tab, setTab] = useState(games[0]?.id ?? "");
  const [rows, setRows] = useState<ScoreRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tab) return;
    let cancelled = false;
    setLoading(true);
    createClient()
      .from("scores")
      .select("*")
      .eq("game_id", tab)
      .order("score", { ascending: false })
      .limit(12)
      .returns<ScoreRow[]>()
      .then(({ data }) => {
        if (cancelled) return;
        setRows(data ?? []);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tab]);

  const empty = !loading && rows.length === 0;

  return (
    <div className="av-hall">
      <div className="hall-head">
        <h1>SALÓN DE LA FAMA</h1>
        <p className="pixel" style={{ fontSize: 10 }}>
          LOS NOMBRES QUE NUNCA SE BORRAN DE LA PANTALLA
        </p>
      </div>

      <div className="hall-tabs">
        {games.map((g) => (
          <button
            key={g.id}
            className={"chip" + (tab === g.id ? " active" : "")}
            onClick={() => setTab(g.id)}
          >
            {g.title}
          </button>
        ))}
      </div>

      {empty && (
        <div style={{ textAlign: "center", padding: 80, color: "var(--ink-faint)" }}>
          Sé el primero en entrar al salón de la fama
        </div>
      )}

      {!empty && rows.length > 0 && (
        <>
          <div className="podium">
            {rows[1] && (
              <div className="podium-slot silver">
                <div className="rank-num">02</div>
                <div className="name">{rows[1].player_name}</div>
                <div className="score">{rows[1].score.toLocaleString("es-ES")}</div>
                <div className="date">{fmtDate(rows[1].created_at)}</div>
              </div>
            )}
            <div className="podium-slot gold">
              <div className="pixel" style={{ fontSize: 9, color: "var(--gold)", letterSpacing: "0.18em" }}>
                CAMPEÓN
              </div>
              <div className="rank-num" style={{ fontSize: 36, marginTop: 4 }}>
                01
              </div>
              <div className="name">{rows[0].player_name}</div>
              <div className="score" style={{ fontSize: 20 }}>
                {rows[0].score.toLocaleString("es-ES")}
              </div>
              <div className="date">{fmtDate(rows[0].created_at)}</div>
            </div>
            {rows[2] && (
              <div className="podium-slot bronze">
                <div className="rank-num">03</div>
                <div className="name">{rows[2].player_name}</div>
                <div className="score">{rows[2].score.toLocaleString("es-ES")}</div>
                <div className="date">{fmtDate(rows[2].created_at)}</div>
              </div>
            )}
          </div>

          <div className="hall-table">
            <div className="th">
              <div>RANGO</div>
              <div>JUGADOR</div>
              <div>PUNTUACIÓN</div>
              <div>FECHA</div>
            </div>
            {rows.map((r, i) => (
              <div
                key={r.id}
                className={"tr" + (i === 0 ? " top1" : i === 1 ? " top2" : i === 2 ? " top3" : "")}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="rk">#{String(i + 1).padStart(2, "0")}</div>
                <div className="pl">{r.player_name}</div>
                <div className="sc">{r.score.toLocaleString("es-ES")}</div>
                <div className="dt">{fmtDate(r.created_at)}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ textAlign: "center", marginTop: 32 }}>
        <Link href="/juegos" className="btn lg">
          VOLVER A LA BIBLIOTECA
        </Link>
      </div>
    </div>
  );
}
