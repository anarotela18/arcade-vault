# 05 — Juego Asteroids jugable en la plataforma (`asteroides`)

**Estado:** Implementado
**Depende de:** SPEC 01
**Fecha:** 2026-10-13

**Objetivo:** Portar el juego Asteroids de `references/started-games/02-asteroids/` a TypeScript y montarlo como un juego nuevo del catálogo con id `asteroides` en `/juegos/asteroides/jugar`, viviendo dentro de su `<canvas>` y notificando a React los cambios de estado (puntuación, vidas, nivel y fin de partida), mientras la pausa la controla la aplicación.

## Por qué existe esta spec

La spec 01 dejó el reproductor con valores fijos de ejemplo y sin lógica de juego. Este es el primer juego real de la plataforma. Define el patrón que seguirán los demás: el motor del juego vive en `lib/games/<id>/`, no conoce React, y se comunica con el reproductor mediante una interfaz pequeña (callbacks y comandos). Dejarlo bien definido ahora evita reescribir el reproductor con cada juego.

## Alcance

**Incluye:**

- Nueva entrada `asteroides` en `GAMES` (`lib/data.ts`) para que aparezca en la biblioteca, el detalle (`/juegos/asteroides`) y el salón; sin tocar la entrada `rocas`.
- Portar `game.js` a TypeScript en `lib/games/asteroids/` como un motor sin dependencias de React: clases `Bullet`, `Asteroid`, `PowerUp`, `Ship`, `Particle`, constantes y bucle principal, con la misma jugabilidad (3 vidas, invencibilidad de 3 s al reaparecer, división de asteroides, power-up de disparo triple, niveles que suben `3 + nivel` asteroides).
- Un montador `createAsteroidsGame(canvas, callbacks)` que devuelve un controlador con `start()`, `pause()`, `resume()`, `restart()`, `end()` y `destroy()`.
- Componente cliente `components/games/asteroids-canvas.tsx` que crea el canvas de 800×600, instancia el motor en `useEffect` y lo destruye al desmontar.
- Integración en `app/juegos/[id]/jugar/page.tsx`: cuando `id === "asteroides"` se muestra el juego real dentro de `.crt-screen` (sustituyendo el `game-arena` de ejemplo); los demás juegos conservan el reproductor mock de la spec 01.
- HUD de la plataforma con datos reales para `asteroides`, recibidos por notificación del canvas: `Puntuación`, `Vidas` y `Nivel` actualizados desde el motor, más un indicador del power-up `3x` con su tiempo restante.
- El canvas ya no dibuja HUD ni overlay `GAME OVER`: lo muestra la plataforma.
- La pausa la controla la aplicación (el contenedor del reproductor), no el juego: el motor solo expone `pause()` y `resume()` y no tiene botón ni tecla propios. El botón `PAUSA`/`REANUDAR` del HUD (y la tecla `P`, manejada por la página) llaman a esos métodos y la página muestra el overlay `EN PAUSA` ya existente.
- La página también pausa el juego al perder el foco la ventana (`blur` / `visibilitychange`) y mientras el modal de fin de juego está abierto.
- Botón `FIN`: termina la partida con el puntaje actual y abre el modal.
- Fin de partida al perder la última vida: abre el modal de fin de juego con la puntuación real; "GUARDAR PUNTUACIÓN" persiste en `localStorage["av_scores"]` (mecanismo de la spec 01, `game: "asteroides"`); "JUGAR DE NUEVO" reinicia la partida desde cero.
- Controles de teclado originales: `←` `→` rotar, `↑` propulsar, `Espacio` disparar; se llama a `preventDefault` en esas teclas mientras el juego está activo para que la página no haga scroll.
- Canvas escalado por CSS al contenedor `.crt-screen` (relación 4:3, el canvas conserva su resolución interna 800×600).
- Estética vectorial original (líneas blancas sobre negro), sin adaptar colores.
- En dispositivos táctiles sin teclado (`(pointer: coarse)`), aviso visible "ESTE JUEGO REQUIERE TECLADO" en lugar del canvas.

**No incluye (para specs futuras):**

- Controles táctiles en pantalla.
- Guardar puntuaciones en Supabase, tablas, RLS o auth real: el guardado sigue siendo `av_scores`.
- Lógica real de los otros siete juegos del catálogo: siguen con el reproductor mock.
- Modificar o reemplazar el juego `rocas`: sigue en el catálogo con el reproductor mock y sin cambios.
- OVNIs: el juego original no los tiene.
- Sonido o música.
- Cambios de reglas, balance o velocidades respecto a `game.js`.
- Hacer que `Mejor global`, `Partidas` o el leaderboard de `/juegos/asteroides` y `/salon` lean `av_scores` (siguen con `seededScores`).
- Pausa persistente entre navegaciones o guardado de la partida en curso.
- Pruebas automatizadas (no hay test runner configurado).

## Modelo de datos

**Entrada nueva en `lib/data.ts`:** un `Game` más en `GAMES` con `id: "asteroides"` (mismo tipo `Game` de la spec 01; no se cambia la interfaz).

Esta feature no introduce persistencia nueva: reutiliza `localStorage["av_scores"]` de la spec 01. Define el contrato entre el motor y el reproductor.

**`lib/games/asteroids/types.ts`**

```ts
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
```

**Archivos nuevos**

```
lib/games/asteroids/types.ts        // interfaces de arriba
lib/games/asteroids/engine.ts       // createAsteroidsGame + bucle, estado y entidades
components/games/asteroids-canvas.tsx
```

Convenciones:

- El motor recibe el `canvas` y dibuja con su `CanvasRenderingContext2D`; no importa `react` ni `next/*` ni accede a `window` al importarse (solo dentro de `createAsteroidsGame`), para que el módulo sea seguro en SSR.
- Constantes del juego iguales a `game.js` (`W = 800`, `H = 600`, `RADII`, `SPEEDS`, `POINTS`, `POWERUP_*`, `TRIPLE_SPREAD`).
- `dt` máximo de 50 ms, como el original.
- Los listeners de teclado se registran en `start()` y se eliminan en `destroy()`; ningún estado global del módulo (todo en el cierre de `createAsteroidsGame`), para soportar montar y desmontar varias veces.
- El motor no guarda puntuaciones: solo notifica `onGameOver`; el guardado lo hace la página con la utilidad `saveScore` existente.
- `onHudChange` se llama cuando cambia `score`, `lives` o `level`, o cada 0,1 s mientras `tripleShot > 0`, para no re-renderizar React a 60 fps.

## Plan de implementación

1. **Guía de Next:** leer en `node_modules/next/dist/docs/` lo relativo a client components y a `useEffect`/carga solo en cliente de esta versión (Next 16.3.5). Sin cambios de código; el sitio no cambia.
2. **Catálogo:** añadir a `GAMES` en `lib/data.ts` la entrada `{ id: "asteroides", title: "ASTEROIDES", cat: "SHOOTER", cover: "cover-rocas", color: "cyan", ... }` con textos `short`/`long` en español, `best` y `plays` de ejemplo. La entrada aparece en la biblioteca y su detalle; el botón JUGAR lleva al reproductor mock hasta el paso 6.
3. **Tipos:** crear `lib/games/asteroids/types.ts` con las tres interfaces. El proyecto compila igual.
4. **Motor — entidades:** crear `lib/games/asteroids/engine.ts` con constantes, utilidades (`wrap`, `dist`, `rand`, `randInt`) y las clases `Bullet`, `Asteroid`, `PowerUp`, `Ship`, `Particle` portadas de `game.js`, recibiendo `ctx` y el mapa de teclas por constructor o parámetro (sin globales). El proyecto compila.
5. **Motor — bucle y estado:** en `engine.ts`, implementar `createAsteroidsGame` con `initGame`, `nextLevel`, `killShip`, `update`, `draw`, teclado (`justPressed`), `start/pause/resume/restart/end/destroy` y las notificaciones `onHudChange`/`onGameOver`. Sin HUD ni overlay `GAME OVER` en el canvas. Manual: montarlo temporalmente en consola o storybook no; se verifica en el paso 7.
6. **Componente canvas:** crear `components/games/asteroids-canvas.tsx` (client) con `<canvas width=800 height=600>` escalado al 100 % del contenedor, `useEffect` que crea y destruye el motor, y props `paused`, `onHudChange`, `onGameOver` y una referencia al controlador para `restart`/`end`. Incluye el aviso `(pointer: coarse)`.
7. **Integración en el reproductor:** en `app/juegos/[id]/jugar/page.tsx`, para `id === "asteroides"` renderizar `AsteroidsCanvas` dentro de `.crt-screen` y alimentar el HUD con estado real; conectar `PAUSA`/`REANUDAR`, la tecla `P`, el `blur`/`visibilitychange`, el botón `FIN`, el modal (puntuación real, guardado en `av_scores`) y `JUGAR DE NUEVO` (llama a `restart`). El resto de juegos mantiene su rama mock sin cambios. Verificación manual con `next dev`.
8. **Pulido de entrada:** `preventDefault` en flechas y Espacio mientras el juego está activo y sin modal abierto, foco automático del área de juego al montar y limpieza total al navegar a otra ruta (sin listeners ni `requestAnimationFrame` huérfanos).

## Criterios de aceptación

- [x] `next build` termina sin errores y `npm run lint` no reporta errores nuevos en `app/`, `components/` ni `lib/`.
- [x] `GAMES` contiene la entrada `asteroides` y la biblioteca (`/`) y `/juegos/asteroides` la muestran; la entrada `rocas` sigue igual.
- [x] `/juegos/asteroides/jugar` muestra el canvas del juego dentro de `.crt-screen`, sin estirarse y manteniendo proporción 4:3, sin desbordar horizontalmente a 375 px de ancho (en táctil se ve el aviso).
- [ ] Al entrar, la nave aparece parpadeando en el centro con 4 asteroides grandes a más de 130 px de ella.
- [x] `←` `→` rotan la nave, `↑` la propulsa con inercia y `Espacio` dispara con 0,2 s de enfriamiento; la nave y los disparos atraviesan los bordes y reaparecen por el lado opuesto.
- [x] Mientras se juega, las flechas y Espacio no hacen scroll de la página.
- [x] Destruir un asteroide grande suma 20, uno mediano 50 y uno pequeño 100, y el HUD de la plataforma lo refleja; un asteroide grande se parte en 2 medianos, uno mediano en 2 pequeños y uno pequeño desaparece.
- [x] El HUD de la plataforma muestra jugador, puntuación, vidas (corazones) y nivel con datos reales; el canvas no dibuja HUD propio.
- [ ] Al chocar la nave con un asteroide, pierde una vida, se reduce el contador de corazones y a los 2 s reaparece con 3 s de invencibilidad.
- [ ] Al destruir todos los asteroides sube el nivel y aparecen `3 + nivel` asteroides nuevos.
- [ ] Un power-up `3x` puede aparecer, se recoge al tocarlo, dispara 3 balas abiertas durante 5 s y el HUD muestra el tiempo restante con una cifra decimal.
- [x] El canvas notifica a React los cambios de puntuación, vidas, nivel y power-up, y el fin de partida (vidas = 0 o `end()`), sin que React lea el estado interno del juego.
- [x] El botón `PAUSA` detiene el juego (nada se mueve, el tiempo del power-up no baja) y muestra `EN PAUSA`; `REANUDAR` continúa desde el mismo estado. La tecla `P` hace lo mismo, y el motor no reacciona a ninguna tecla de pausa por sí mismo.
- [ ] El juego se pausa al cambiar de pestaña o perder el foco la ventana.
- [x] Al perder la última vida se abre el modal `FIN DEL JUEGO` con la puntuación real de la partida, y el canvas no muestra overlay `GAME OVER`.
- [x] El botón `FIN` abre el modal con el puntaje actual y detiene la partida.
- [x] "GUARDAR PUNTUACIÓN" añade a `localStorage["av_scores"]` una entrada `{ game: "asteroides", score, name, at }` con el puntaje real.
- [x] "JUGAR DE NUEVO" cierra el modal y empieza una partida con puntuación 0, 3 vidas y nivel 1.
- [x] "VOLVER AL VAULT" y "SALIR" navegan fuera sin dejar el bucle ni los listeners activos (tras salir, las flechas vuelven a hacer scroll).
- [x] Volver a entrar a `/juegos/asteroides/jugar` varias veces seguidas no duplica el bucle: la velocidad del juego es la misma.
- [x] `lib/games/asteroids/engine.ts` no importa `react` ni `next/*`.
- [x] Los demás juegos (`/juegos/caida/jugar`, etc.) siguen mostrando el reproductor mock de la spec 01.
- [x] Las páginas de las specs 01 a 04 (`/`, `/juegos`, `/juegos/[id]`, `/auth`, `/salon`, `/acerca-de`) se ven y funcionan igual que antes.

## Decisiones tomadas y descartadas

- **Sí:** juego nuevo con id `asteroides`, separado de `rocas`. Decidido por el usuario: aunque `rocas` se parece, este es otro juego con su propio id. `rocas` queda intacto.
- **Sí:** el juego vive dentro del `<canvas>` y notifica a React cada cambio de estado (puntuación, vidas, nivel, power-up y fin de partida). Decidido por el usuario.
- **Sí:** la pausa la controla la aplicación (contenedor/página), no el juego. Decidido por el usuario; el motor solo ofrece `pause()`/`resume()`.
- **Sí:** la nueva entrada reutiliza la clase de portada `cover-rocas` y no añade CSS. Decisión mía que el usuario no confirmó: evita estilos ad hoc; si se quiere portada propia, se hace aparte.
- **Sí:** portar el juego a un módulo TypeScript con un componente canvas de React. Decidido por el usuario; permite conectar HUD, pausa y fin de juego con la plataforma.
- **No:** embeber el `index.html` original en un `iframe` desde `/public`. Es más rápido, pero HUD, pausa y puntaje no se conectarían y la spec 01 quedaría sin cumplirse para este juego.
- **Sí:** motor separado de React en `lib/games/<id>/`. Es el patrón que se reutilizará con los demás juegos y mantiene el bucle fuera del ciclo de render.
- **Sí:** conservar la estética vectorial blanca sobre negro. Decidido por el usuario; es fiel al original y el CRT ya aporta el aire retro.
- **Sí:** usar solo el HUD de la plataforma y quitar el del canvas. Decidido por el usuario; evita información duplicada.
- **Sí:** el fin de partida abre el modal de la plataforma y se elimina el overlay `GAME OVER` del canvas. Decidido por el usuario; reutiliza el guardado de `av_scores` de la spec 01.
- **Sí:** teclas originales del juego; la página añade `P` para pausar y la pausa automática al perder foco. Decidido por el usuario; evita perder una partida al cambiar de pestaña.
- **No:** controles táctiles. Decidido por el usuario; merecen su propia spec por layout y multitouch.
- **Sí:** puntuaciones en `localStorage["av_scores"]`, sin Supabase. Decidido por el usuario; la persistencia real necesita tablas, RLS y auth, que no existen aún.
- **Sí:** `onHudChange` solo ante cambios, no por fotograma. Decisión mía que el usuario no confirmó: evita re-renders de React a 60 fps.
- **Sí:** el aviso de "requiere teclado" se basa en `(pointer: coarse)`. Decisión mía que el usuario no confirmó: es la señal más simple para detectar móviles y tabletas sin teclado.

## Riesgos identificados

| Riesgo                                                                                                   | Mitigación                                                                                                        |
| -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| React Strict Mode monta y desmonta el efecto dos veces en desarrollo y duplica el bucle o los listeners. | `destroy()` cancela `requestAnimationFrame` y quita todos los listeners; criterio de aceptación sobre remontajes. |
| El canvas accede a `window`/`document` durante el render en servidor.                                    | El motor solo toca el DOM dentro de `createAsteroidsGame`, llamado desde `useEffect`; el componente es cliente.   |
| Re-renderizar React a 60 fps por el HUD degrada el rendimiento.                                          | `onHudChange` solo se llama ante cambios (y a 0,1 s para el power-up).                                            |
| El navegador hace scroll con flechas o Espacio y molesta al jugar.                                       | `preventDefault` solo mientras el juego está activo, sin modal, y se retira en `destroy()`.                       |
| La pausa por pérdida de foco deja `dt` enorme al reanudar.                                               | `resume()` reinicia `lastTime`, y `dt` sigue limitado a 50 ms.                                                    |
| Esta versión de Next (16.3.5) cambia convenciones respecto a lo conocido.                                | El paso 1 exige leer la guía en `node_modules/next/dist/docs/` antes de escribir código.                          |

## Qué **no** entra en esta spec

- Controles táctiles y sonido.
- Puntuaciones en Supabase, auth real y tablas.
- Lógica real de los demás juegos del catálogo.
- Cambios en el juego `rocas`, OVNIs y cambios de reglas o balance respecto a `game.js`.
- Conectar `Mejor global` y los leaderboards con `av_scores`.

Cada uno de esos puntos, si se hace, va en su propia spec.
