"use client";

import {
  useEffect,
  useImperativeHandle,
  useRef,
  useSyncExternalStore,
  type Ref,
} from "react";
import { createAsteroidsGame } from "@/lib/games/asteroids/engine";
import type {
  AsteroidsGame,
  AsteroidsHudState,
} from "@/lib/games/asteroids/types";

export interface AsteroidsHandle {
  restart(): void;
  end(): void;
}

interface AsteroidsCanvasProps {
  paused: boolean;
  onHudChange: (hud: AsteroidsHudState) => void;
  onGameOver: (finalScore: number) => void;
  ref?: Ref<AsteroidsHandle>;
}

const COARSE_QUERY = "(pointer: coarse)";

function subscribeCoarse(onChange: () => void) {
  const mql = window.matchMedia(COARSE_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

const getCoarse = () => window.matchMedia(COARSE_QUERY).matches;
const getServerCoarse = () => false;

export function AsteroidsCanvas({
  paused,
  onHudChange,
  onGameOver,
  ref,
}: AsteroidsCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<AsteroidsGame | null>(null);
  const pausedRef = useRef(paused);
  const onHudChangeRef = useRef(onHudChange);
  const onGameOverRef = useRef(onGameOver);

  const coarse = useSyncExternalStore(
    subscribeCoarse,
    getCoarse,
    getServerCoarse,
  );

  useEffect(() => {
    pausedRef.current = paused;
    onHudChangeRef.current = onHudChange;
    onGameOverRef.current = onGameOver;
  });

  useImperativeHandle(ref, () => ({
    restart: () => gameRef.current?.restart(),
    end: () => gameRef.current?.end(),
  }));

  // El motor se crea una sola vez; los callbacks se leen desde refs.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || coarse) return;

    const game = createAsteroidsGame(canvas, {
      onHudChange: (hud) => onHudChangeRef.current(hud),
      onGameOver: (score) => onGameOverRef.current(score),
    });
    gameRef.current = game;
    game.start();
    if (pausedRef.current) game.pause();

    return () => {
      game.destroy();
      gameRef.current = null;
    };
  }, [coarse]);

  // La pausa la decide la aplicación; el motor solo obedece.
  useEffect(() => {
    if (paused) gameRef.current?.pause();
    else gameRef.current?.resume();
  }, [paused]);

  if (coarse) {
    return (
      <div className="crt-content">
        <div>
          <div className="pixel neon-yellow" style={{ fontSize: 16 }}>
            ESTE JUEGO REQUIERE TECLADO
          </div>
        </div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        display: "block",
      }}
    />
  );
}
