# 01 — MVP pantallas Arcade Vault

**Estado:** Aprobado
**Depende de:** —
**Fecha:** 2026-09-18

**Objetivo:** Implementar en Next.js (App Router) todas las pantallas visuales de Arcade Vault definidas en `references/templates/` (biblioteca, detalle de juego, reproductor, autenticación y salón de la fama), sin implementar la lógica de ningún juego real.

## Alcance

**Incluye:**

- Migración del layout global (`Nav`, footer) y las 5 pantallas del template a rutas de archivo de Next.js:
  - `/` — Biblioteca (grid de juegos, búsqueda, filtro por categoría).
  - `/juegos/[id]` — Detalle de juego (info, stats, tabla de mejores puntuaciones).
  - `/juegos/[id]/jugar` — Reproductor (HUD + pantalla CRT estáticos, modal de fin de juego funcional).
  - `/auth` — Inicio de sesión / registro / invitado (sin backend, mock).
  - `/salon` — Salón de la Fama (podio + tabla, con tabs por juego).
- Migración de los datos mock de `data.jsx` (`GAMES`, `CATS`, `PLAYERS`, `seededScores`) a un módulo TypeScript en `lib/data.ts`.
- Navegación real con `next/link` / `next/navigation` (reemplaza el router por hash del template).
- Sesión de usuario mock persistida en `localStorage` (`av_user`), igual que el template.
- Guardado de puntuaciones desde el modal de fin de juego, persistido en `localStorage` (`av_scores`).
- Menú móvil (hamburguesa) del `Nav`, replicado tal cual el template.
- Manejo de `id` de juego inexistente con `notFound()` en `/juegos/[id]` y `/juegos/[id]/jugar`.

**No incluye:**

- Ninguna lógica de juego real (ni siquiera simulada): el reproductor no tiene bucle de puntuación automática, vidas reales, colisiones, ni niveles que avancen solos. Los valores del HUD y del CRT son de ejemplo, fijos.
- Backend, API routes o base de datos: todo el "login" y las puntuaciones siguen siendo mock en `localStorage`, sin persistencia real de servidor.
- Validación de formularios (auth) más allá de lo que ya hace el template (ninguna).
- Autenticación real con Google/GitHub: los botones sociales son decorativos, sin acción.
- Sistema de créditos/monedas funcional: el contador "CRÉDITOS · 03" del Nav es un valor estático de ejemplo, no editable.
- Responsive/accesibilidad más allá de lo ya cubierto por `styles.css` (ya migrado a `app/globals.css` en trabajo previo).
- Cualquier feature nueva no presente en los archivos de `references/templates/` (multijugador, perfiles extendidos, etc. quedarían para specs futuras).

## Modelo de datos

Todo el modelo es mock y vive en el cliente (sin backend). Se migra 1:1 desde `references/templates/data.jsx`.

**`lib/data.ts`**

```ts
export interface Game {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
  cover: string; // nombre de clase CSS cover-*
  color: "cyan" | "magenta" | "yellow" | "green";
  best: number;
  plays: string;
}

export const GAMES: Game[];
export const CATS: string[]; // ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"]
export const PLAYERS: string[];

export interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string;
}

export function seededScores(seed: number, count?: number): ScoreRow[];
```

**Persistencia en cliente (sin cambios respecto al template):**

- `localStorage["av_user"]`: `{ name: string } | null`.
- `localStorage["av_scores"]`: array de `{ game: string; score: number; name: string; at: number }`.

## Plan de implementación

1. **Datos:** crear `lib/data.ts` con `GAMES`, `CATS`, `PLAYERS` y `seededScores`, tipado en TypeScript, migrado desde `references/templates/data.jsx`.
2. **Layout y Nav:** crear `components/nav.tsx` (client component) migrando `nav.jsx`, incluyendo menú móvil. Integrarlo en `app/layout.tsx` junto con el footer (`© 2026 ARCADE VAULT · HECHO CON PIXELES Y NEÓN · v2.6.0`), reemplazando el hero de prueba actual en `app/page.tsx`.
3. **Sesión de usuario (cliente):** crear un hook/utilidad `lib/use-user.ts` (o contexto simple) que lea/escriba `av_user` en `localStorage` y exponga `user`, `login`, `signOut`, para que `Nav` y `/auth` lo compartan sin backend.
4. **Biblioteca (`/`):** migrar `biblioteca.jsx` a `app/page.tsx` como client component (usa estado de búsqueda/filtro), con `GameCard` en `components/game-card.tsx`. Navegación con `next/link` hacia `/juegos/[id]`.
5. **Detalle de juego (`/juegos/[id]`):** crear `app/juegos/[id]/page.tsx`. Busca el juego en `GAMES`; si no existe, llama a `notFound()`. Genera el leaderboard con `seededScores`. Botón "JUGAR AHORA" enlaza a `/juegos/[id]/jugar`.
6. **Reproductor (`/juegos/[id]/jugar`):** crear `app/juegos/[id]/jugar/page.tsx` como client component. HUD y pantalla CRT con valores de ejemplo fijos (sin `setInterval` de puntuación ni progresión de nivel). Botón "PAUSA" alterna un estado visual de overlay "EN PAUSA" (sin lógica de juego real). Botón "FIN" abre el modal de fin de juego con puntaje fijo de ejemplo; el modal permite ingresar iniciales y guardar (persistido en `av_scores` vía la misma utilidad de `localStorage`), reiniciar la vista (mismos valores fijos) o volver a la biblioteca. Botón "SALIR" navega a `/juegos/[id]`. Si el `id` no existe, `notFound()`.
7. **Autenticación (`/auth`):** crear `app/auth/page.tsx` migrando `auth.jsx`. Envío del formulario (cualquier valor, sin validación) crea la sesión mock vía el hook de `av_user` y redirige a `/`. "Jugar como invitado" limpia la sesión y redirige a `/`. Botones sociales decorativos sin acción.
8. **Salón de la Fama (`/salon`):** crear `app/salon/page.tsx` migrando `salon.jsx`, con tabs por juego (estado local), podio top-3 y tabla completa generada con `seededScores`. Si hay usuario logueado, muestra la fila "tu mejor marca" igual que el template.
9. **Limpieza:** eliminar el hero de prueba temporal de `app/page.tsx` (creado en el trabajo previo de estilos) reemplazándolo por la Biblioteca real del paso 4.
10. **Verificación visual:** levantar `next dev`, navegar las 5 rutas y confirmar que cada una refleja fielmente su contraparte en `references/templates/*.jsx` (mismas clases CSS, mismo copy en español, mismos estados).

## Criterios de aceptación

- [ ] `next build` compila sin errores de tipos ni de build.
- [ ] `/` muestra el grid de juegos de `GAMES`, con buscador por texto y filtro por categoría (`CATS`) funcionando en cliente.
- [ ] Cada tarjeta de juego navega a `/juegos/[id]` correspondiente.
- [ ] `/juegos/[id]` muestra portada, tags, descripción larga, stats (partidas, mejor global, dificultad) y una tabla de mejores puntuaciones generada con `seededScores`.
- [ ] `/juegos/[id]` con un `id` inexistente devuelve la página 404 de Next.js (`notFound()`).
- [ ] `/juegos/[id]/jugar` muestra el HUD (jugador, puntuación, vidas, nivel) y la pantalla CRT con valores de ejemplo fijos, sin que el puntaje cambie solo con el tiempo.
- [ ] En `/juegos/[id]/jugar`, el botón "PAUSA" muestra/oculta el overlay "EN PAUSA" sobre la pantalla CRT.
- [ ] En `/juegos/[id]/jugar`, el botón "FIN" abre el modal de fin de juego con un puntaje fijo, permite ingresar iniciales, guardar el resultado (persistido en `localStorage["av_scores"]`) y luego reiniciar o volver a la biblioteca.
- [ ] `/juegos/[id]/jugar` con un `id` inexistente devuelve 404.
- [ ] `/auth` permite enviar el formulario de inicio de sesión o creación de cuenta (sin validación) y redirige a `/` con una sesión mock guardada en `localStorage["av_user"]`.
- [ ] `/auth` permite continuar como invitado, limpiando cualquier sesión previa y redirigiendo a `/`.
- [ ] El `Nav` muestra "Iniciar Sesión" cuando no hay usuario y el nombre del usuario (con opción de cerrar sesión) cuando sí lo hay, en todas las páginas.
- [ ] El menú móvil (hamburguesa) del `Nav` se abre y cierra correctamente en viewport angosto.
- [ ] `/salon` muestra tabs por juego, un podio con los 3 primeros puestos y una tabla completa de posiciones generados con `seededScores`; si hay sesión activa, se agrega la fila de "tu mejor marca".
- [ ] Todas las pantallas usan las clases CSS ya definidas en `app/globals.css` (proveniente de `styles.css`) sin introducir estilos nuevos ad hoc.
- [ ] El copy visible (textos en español, labels, mensajes) coincide con el de los archivos `.jsx` de referencia.

## Decisiones tomadas y descartadas

- **Ruteo con archivos de Next.js en vez de router por hash:** se descarta replicar el router manual de `app.jsx` (`location.hash` + `route.name`) porque no es idiomático en App Router y no aporta valor en este MVP; se usan rutas de archivo reales (`/`, `/juegos/[id]`, `/juegos/[id]/jugar`, `/auth`, `/salon`) con `next/link`.
- **Reproductor sin simulación de juego:** se descarta conservar el `setInterval` que incrementa el puntaje automáticamente (presente en `reproductor.jsx`) porque el pedido explícito es "solamente la parte visual, no implementar ningún juego". El HUD y el CRT quedan con datos de ejemplo fijos; solo el modal de fin de juego (pausa/fin/guardar puntuación) queda interactivo porque es UI, no lógica de juego.
- **Datos mock en TypeScript (`lib/data.ts`) en vez de JSON:** se prefiere un módulo `.ts` porque `data.jsx` ya incluye una función (`seededScores`) además de datos planos; separarlos en JSON + función aparte agregaría fricción sin beneficio para un MVP.
- **Persistencia con `localStorage`, sin backend:** se mantiene fiel al template (`av_user`, `av_scores`) porque no hay spec de backend/autenticación real; migrar a un backend queda fuera de este MVP y ameritaría su propio spec.
- **Sin validación de formularios en `/auth`:** se replica el comportamiento del template (cualquier envío crea sesión) para no introducir alcance no solicitado; una spec futura podría agregar validación real si se conecta a un backend.
- **`notFound()` de Next.js para IDs inexistentes:** se prefiere sobre un redirect silencioso a la biblioteca porque comunica mejor el error y es el patrón estándar de App Router.

## Riesgos identificados

- **Inconsistencia visual entre reproductor mockeado y detalle:** al quitar la simulación de puntuación, el HUD mostrará siempre los mismos valores de ejemplo; si en el futuro se agrega lógica de juego real, habrá que revisar esta pantalla completa (no es un riesgo de esta spec, pero condiciona la siguiente).
- **`localStorage` no disponible en SSR:** los componentes que leen/escriben `av_user`/`av_scores` deben ser client components y acceder a `localStorage` solo tras el montaje, para evitar errores de hidratación en Next.js.
- **Datos de `seededScores` no deterministas entre servidor y cliente:** si algún componente que usa `seededScores` se renderiza en servidor, el resultado debe ser determinista (la función ya usa un PRNG con semilla fija, por lo que es segura), pero hay que asegurarse de no mezclarla con `Math.random()` sin semilla en ningún punto nuevo.
