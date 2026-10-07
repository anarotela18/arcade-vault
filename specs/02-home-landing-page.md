# 02 — Home (landing page) de Arcade Vault

**Estado:** Aprobado
**Depende de:** SPEC 01
**Fecha:** 2026-10-07

**Objetivo:** Implementar la landing page (Home) de Arcade Vault en `/` según `references/templates/home-about/home.jsx`, moviendo la Biblioteca a `/juegos` y agregando "Inicio" al `Nav`.

## Alcance

**Incluye:**

- Nueva ruta `/` con el Home del template, con estas secciones en orden: hero (siluetas flotantes, título, CTAs, indicador "DESLIZA"), "¿POR QUÉ ARCADE VAULT?" (4 `feature-card`), "JUEGOS DISPONIBLES AHORA" (riel de 6 `mini-card`), stats, "ACTIVIDAD EN VIVO" (últimas puntuaciones + top jugadores), "PRECIOS" (plan único + FAQ) y CTA final.
- Mover la Biblioteca actual de `/` a `/juegos` (`app/juegos/page.tsx`), sin cambios de comportamiento.
- Actualizar todos los enlaces que hoy apuntan a `/` como "biblioteca": `Nav` (logo, enlace y menú móvil), botón "Ver biblioteca" en `/juegos/[id]`, `/salon` y el modal del reproductor.
- Agregar el enlace "Inicio" (`/`) al `Nav` de escritorio y móvil, como en `references/templates/home-about/nav.jsx`. El estado activo de "Biblioteca" pasa a `/juegos` y subrutas.
- Integrar al CSS global las clases nuevas del Home de `references/templates/home-about/styles.css` (ver Decisiones).
- Animación de aparición `.reveal` con `IntersectionObserver` mediante un hook `useReveal`.
- Datos de ejemplo de actividad, top, stats, features y FAQ como constantes estáticas en `lib/home-data.ts`. El riel de juegos usa `GAMES.slice(0, 6)` de `lib/data.ts`.
- Copy visible idéntico al de `home.jsx`.

**No incluye (para specs futuras):**

- Página "Acerca de" y formulario de contacto (`about.jsx`): van en su propia spec.
- Enlace "Acerca de" en el `Nav`: se agrega junto con la spec de About para no enlazar a una ruta inexistente.
- Datos reales o derivados de `av_scores`/`seededScores` en "Actividad en vivo" y "Top jugadores": son estáticos, igual que el template.
- Flujo de pago o planes múltiples: el plan "JUGADOR VAULT $0" es solo contenido.
- Redirecciones desde la URL antigua de la Biblioteca (`/`) o SEO/metadata específica del Home.
- Cualquier cambio en la lógica de sesión, puntuaciones o reproductor de la spec 01.

## Modelo de datos

Esta feature no introduce estructuras persistentes ni cambios en `lib/data.ts`. Solo agrega constantes estáticas de presentación.

**`lib/home-data.ts`**

```ts
export type NeonColor = "cyan" | "magenta" | "yellow" | "green";

export interface Feature { icon: "GAMEPAD" | "FREE" | "TROPHY" | "ROCKET"; title: string; desc: string; color: NeonColor }
export interface ActivityRow { player: string; game: string; score: number; when: string; color: NeonColor }
export interface TopRow { rank: number; player: string; score: number }
export interface Stat { n: string; unit: string; sub: string }
export interface FaqItem { q: string; a: string }

export const FEATURES: Feature[];   // 4 items
export const ACTIVITY: ActivityRow[]; // 7 items
export const TOP_TODAY: TopRow[];   // 5 items
export const STATS: Stat[];         // 3 items
export const PRICING_LIST: string[]; // 6 beneficios
export const FAQ: FaqItem[];        // 3 items
```

Convenciones:

- Los valores y textos se copian 1:1 de `home.jsx`.
- Los números se formatean con `toLocaleString("es-ES")`, igual que el template.

## Plan de implementación

1. **Mover la Biblioteca a `/juegos`:** crear `app/juegos/page.tsx` con el contenido actual de `app/page.tsx`. Actualizar los enlaces "biblioteca" de `Nav`, `/juegos/[id]`, `/salon` y el reproductor a `/juegos`, y `isActive("biblioteca")` a `pathname.startsWith("/juegos")`. Dejar `app/page.tsx` como placeholder mínimo. El sitio queda funcional con la Biblioteca en `/juegos`.
2. **Nav con "Inicio":** agregar el enlace "Inicio" (`/`) en escritorio y menú móvil; el logo apunta a `/`. Activo cuando `pathname === "/"`.
3. **Estilos:** integrar las clases nuevas de `references/templates/home-about/styles.css` en `app/globals.css` (ver Decisiones), sin tocar el encabezado de Tailwind (`@import`, `@theme inline`, fuentes) ni los ajustes locales previos.
4. **Datos:** crear `lib/home-data.ts` con las constantes del modelo de datos, copiadas de `home.jsx`.
5. **Hook `useReveal`:** crear `lib/use-reveal.ts` que observa los elementos `.reveal` y agrega la clase `in` al entrar en viewport (umbral 0.12, `unobserve` tras activarse, `disconnect` al desmontar).
6. **Componentes del Home:** crear `components/home/floating-silhouettes.tsx` (8 SVG decorativos), `components/home/feature-icon.tsx` (4 iconos pixel) y `components/home/mini-card.tsx` (enlace a `/juegos/[id]`).
7. **Página `/`:** reemplazar el placeholder de `app/page.tsx` por el Home completo como client component (usa `useReveal`). CTAs con `next/link`: "EXPLORAR JUEGOS" y "VER TODOS LOS JUEGOS" → `/juegos`; "CREAR CUENTA" y "EMPEZAR GRATIS" → `/auth`; "VER SALÓN" → `/salon`; "INSERTAR MONEDA" → `/juegos`.
8. **Verificación visual:** levantar `next dev`, comparar `/` con `references/templates/home-about/arcade-vault-standalone.html` en escritorio y móvil, y recorrer los enlaces.

## Criterios de aceptación

- [ ] `next build` termina sin errores y `npm run lint` no reporta errores nuevos en `app/`, `components/` ni `lib/` (el único existente es `lib/use-user.ts:32`, de la spec 01).
- [ ] `/` muestra las 6 secciones del Home en el orden del template, con el copy en español idéntico a `home.jsx`.
- [ ] El hero muestra las 8 siluetas flotantes, el título en 3 líneas y los dos CTAs.
- [ ] La sección "JUEGOS DISPONIBLES AHORA" muestra exactamente los 6 primeros juegos de `GAMES`, y cada tarjeta navega a `/juegos/[id]`.
- [ ] "EXPLORAR JUEGOS", "VER TODOS LOS JUEGOS" e "INSERTAR MONEDA" navegan a `/juegos`.
- [ ] "CREAR CUENTA" y "EMPEZAR GRATIS" navegan a `/auth`; "VER SALÓN →" navega a `/salon`.
- [ ] Las secciones con `.reveal` empiezan ocultas y reciben la clase `in` al entrar en viewport, sin errores en consola.
- [ ] "ACTIVIDAD EN VIVO" muestra 7 filas de últimas puntuaciones y 5 de top jugadores, con la fila 1, 2 y 3 con las clases `top1`, `top2` y `top3`.
- [ ] `/juegos` muestra la Biblioteca con búsqueda y filtro por categoría funcionando igual que antes.
- [ ] El `Nav` muestra "Inicio" y "Biblioteca" en escritorio y móvil; "Inicio" está activo solo en `/`, y "Biblioteca" en `/juegos` y `/juegos/[id]*`.
- [ ] El logo del `Nav` navega a `/`.
- [ ] Ningún botón "Ver biblioteca" / "Volver a la biblioteca" de `/juegos/[id]`, `/salon` ni del reproductor apunta a `/`.
- [ ] El `Nav` no contiene el enlace "Acerca de".
- [ ] El Home no desborda horizontalmente en un viewport de 375 px de ancho.
- [ ] Las páginas de la spec 01 (`/juegos/[id]`, `/juegos/[id]/jugar`, `/auth`, `/salon`) se ven igual que antes de integrar los estilos nuevos.

## Decisiones tomadas y descartadas

- **Sí:** Biblioteca en `/juegos` y Home en `/`. Decidido por el usuario. Es coherente con `/juegos/[id]` y deja la landing como puerta de entrada.
- **No:** Biblioteca en `/biblioteca` o Home en `/inicio`. Se descartó para mantener las URLs en la misma convención en español que las rutas existentes.
- **Sí:** solo el Home en esta spec; About va aparte. Decidido por el usuario. About tiene formulario con validación y estado propio, y mezclarlo agranda la spec.
- **Sí:** omitir "Acerca de" del `Nav` hasta la spec de About. Evita un enlace roto.
- **Sí:** integrar los estilos nuevos en `app/globals.css`. El usuario eligió reemplazar el archivo por `styles.css`, pero el `globals.css` actual contiene adaptaciones a Tailwind v4 que el template no tiene (`@import "tailwindcss"`, `@theme inline`, variables de fuentes de `next/font`, regla de `h1–h6` en `@layer base`, `.av-main` y otros ajustes). Reemplazarlo literalmente las perdería, así que se mantiene el archivo actual y se incorporan las ~800 líneas nuevas del template (home, about y relacionadas). Se incluyen también las de About porque viven en el mismo `styles.css`, aunque su página no se implemente aquí.
- **Sí:** datos del Home estáticos en `lib/home-data.ts`. Decidido por el usuario. Es consistente con la spec 01 (todo mock) y evita lógica nueva.
- **No:** derivar la actividad y el top de `av_scores`/`seededScores`. Se descartó por introducir lógica que el template no tiene.
- **Sí:** `useReveal` como hook propio con `IntersectionObserver`. Es fiel al template y no requiere librerías.
- **Sí:** excluir `references/**` de ESLint (`eslint.config.mjs`) y pedir "sin errores nuevos" en el criterio de lint. Los `.jsx` de `references/` son plantillas de diseño, no código de la app, y generaban errores ajenos a esta spec. El error de `lib/use-user.ts:32` es de la spec 01 y corregirlo toca la lógica de sesión, así que queda fuera de alcance.
- **Sí:** reducir los espacios del `Nav` en móvil (`gap: 8px`, `auth-btn` sin `margin-left`) para cumplir "sin desborde a 375 px". El desborde ya existía, también en el template. Como cambio relacionado, se ajustaron las columnas de la tabla de `/salon` en `max-width: 720px`, que desbordaba 11 px.

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Al fusionar `styles.css` en `globals.css` se pisan reglas de las páginas de la spec 01 (HUD, footer, etc.). | Hacer `diff` antes de integrar, solo agregar reglas nuevas o cambios explícitos, y revisar visualmente las 4 rutas de la spec 01 (criterio de aceptación). |
| `.reveal` deja secciones invisibles si el `IntersectionObserver` no corre (por ejemplo, tras navegación cliente). | `useReveal` se ejecuta al montar el Home y se verifica navegando a `/` desde otra ruta, no solo con carga directa. |
| Enlaces antiguos a `/` como biblioteca quedan sin actualizar. | Buscar con `grep` toda referencia a `"/"` en `app/` y `components/` y cubrirlo en los criterios de aceptación. |

## Qué **no** entra en esta spec

- Página "Acerca de" y formulario de contacto.
- Enlace "Acerca de" en el `Nav`.
- Datos reales o dinámicos de actividad, ranking o stats.
- Planes de precios, pagos o cuentas reales.
- Cambios en reproductor, sesión mock o puntuaciones de la spec 01.

Cada uno de esos puntos, si se hace, va en su propia spec.
