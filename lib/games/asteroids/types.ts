export interface AsteroidsHudState {
  score: number;
  lives: number;
  level: number;
  tripleShot: number; // segundos restantes del power-up, 0 si no está activo
}

export interface AsteroidsCallbacks {
  onHudChange: (hud: AsteroidsHudState) => void; // solo cuando algún valor cambia (tripleShot a 0,1 s)
  onGameOver: (finalScore: number) => void; // vidas = 0 o end()
}

export interface AsteroidsGame {
  start(): void;
  pause(): void;
  resume(): void;
  restart(): void;
  end(): void; // dispara onGameOver con el puntaje actual
  destroy(): void; // cancela requestAnimationFrame y quita listeners
}
