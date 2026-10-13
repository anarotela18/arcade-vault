# 04 — Conexión con Supabase: cliente de navegador y cliente de servidor

**Estado:** Implementado
**Depende de:** —
**Fecha:** 2026-10-12

**Objetivo:** Conectar la aplicación Next.js con el proyecto de Supabase ya creado, con un cliente para el navegador (`lib/supabase/client.ts`) y otro para el servidor (`lib/supabase/server.ts`), sin crear tablas ni cambiar ninguna pantalla.

## Por qué existe esta spec

La app es 100 % mock (`av_user` y `av_scores` en `localStorage`). Más adelante se quiere base de datos, autenticación real, realtime y edge functions. Todas necesitan primero una conexión configurada. Esta spec deja solo esa base, para que las siguientes specs (auth, puntuaciones, realtime, edge functions) no mezclen infraestructura con funcionalidad.

## Alcance

**Incluye:**

- Dependencias nuevas: `@supabase/supabase-js` y `@supabase/ssr`.
- `lib/supabase/client.ts`: función `createClient()` para componentes cliente (`"use client"`), basada en `createBrowserClient`.
- `lib/supabase/server.ts`: función asíncrona `createClient()` para Server Components, Route Handlers y Server Actions, basada en `createServerClient` y las cookies de Next.
- Variables de entorno públicas `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`, tanto en `.env` (ignorado por git) como en `.env.template` (versionado, con valores de ejemplo).
- Variable de entorno privada `SUPABASE_SERVICE_ROLE_KEY` como placeholder vacío en `.env` y en `.env.template`: se declara ahora, pero ningún código la lee todavía.
- Quitar `SUPEBASE_DB_PASSWORD` de `.env.template`: tiene un typo y el SDK no usa la contraseña de la base de datos.
- Un error claro y temprano si faltan las variables de entorno, en lugar de un fallo opaco de red.
- Comprobación de que la conexión funciona contra el proyecto real (ver plan, paso 5).

**No incluye (para specs futuras):**

- Tablas, migraciones, políticas RLS o cualquier cambio en el esquema: la base queda con 0 tablas.
- Supabase Auth real: el login mock (`lib/use-user.ts`, `av_user`) y la pantalla `/auth` no se tocan.
- `proxy.ts` para refrescar la sesión en cada petición: solo tiene sentido cuando exista auth real.
- Reemplazar `av_scores` por puntuaciones en base de datos.
- Realtime y edge functions: cada uno en su propia spec.
- Usar `SUPABASE_SERVICE_ROLE_KEY` en código (por ejemplo, un cliente admin): la variable queda vacía y sin consumidores.
- Tipos generados de la base de datos (`generate_typescript_types`): no hay tablas que tipar.
- Guardar los mensajes del formulario de `/acerca-de` (la spec 03 los dejó fuera).

## Modelo de datos

Esta feature no introduce tablas ni estructuras persistentes. Solo define dos módulos y tres variables de entorno.

**`lib/supabase/client.ts`**

```ts
export function createClient(): SupabaseClient; // createBrowserClient(url, anonKey)
```

**`lib/supabase/server.ts`**

```ts
export async function createClient(): Promise<SupabaseClient>; // createServerClient(url, anonKey, { cookies })
```

**Variables de entorno (`.env`, con `.env.template` como plantilla versionada)**

```
NEXT_PUBLIC_SUPABASE_URL=         # https://<ref-del-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # clave anon / publishable del proyecto
SUPABASE_SERVICE_ROLE_KEY=        # placeholder vacío; solo servidor, sin uso por ahora
```

Convenciones:

- `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` son públicas por diseño (llegan al navegador); la seguridad real vive en RLS, que llega con las tablas.
- `SUPABASE_SERVICE_ROLE_KEY` ignora RLS: nunca lleva prefijo `NEXT_PUBLIC_`, nunca se importa desde código de cliente y en `.env.template` queda vacía. Si más adelante se rellena, solo se lee desde código de servidor.
- Los dos clientes usan solo la clave anon; ninguno consume `SUPABASE_SERVICE_ROLE_KEY`.
- Los dos módulos leen las variables desde un único lugar, para que el chequeo de "variable faltante" no se duplique.
- `lib/supabase/server.ts` solo se importa desde código de servidor; `lib/supabase/client.ts` solo desde componentes cliente.
- En el cliente de servidor, `setAll` de las cookies se envuelve en `try/catch`, porque Next lanza error al escribir cookies desde un Server Component.
- La URL y la clave anon se obtienen del proyecto con el MCP de Supabase (`get_project_url` y `get_publishable_keys`), nunca se copian a la spec. La service role no se obtiene: la rellena el usuario si la necesita.

## Plan de implementación

1. **Dependencias y guía de Next:** leer en `node_modules/next/dist/docs/` la guía de `cookies()` y de variables de entorno de esta versión (Next 16.3.5), e instalar `@supabase/supabase-js` y `@supabase/ssr`. El sitio sigue funcional sin cambios visibles.
2. **Entorno:** obtener la URL y la clave anon del proyecto con el MCP de Supabase, añadir las tres variables a `.env` (con `SUPABASE_SERVICE_ROLE_KEY` vacía) y a `.env.template` (solo valores de ejemplo y la service role vacía), y quitar `SUPEBASE_DB_PASSWORD` de `.env.template`.
3. **Cliente de navegador:** crear `lib/supabase/client.ts` con `createClient()` y el error claro si faltan variables.
4. **Cliente de servidor:** crear `lib/supabase/server.ts` con `createClient()` asíncrono, usando `cookies()` de `next/headers`.
5. **Comprobación de conexión:** con `next dev`, ejecutar una llamada puntual desde el servidor con `lib/supabase/server.ts` (una petición HTTP al endpoint REST del proyecto con la URL y la clave anon, sin usar `supabase.auth` ni consultar tablas) y confirmar respuesta correcta; repetir con el cliente de navegador desde la consola. No se deja ninguna ruta ni archivo de prueba en el repo.

## Criterios de aceptación

- [x] `next build` termina sin errores y `npm run lint` no reporta errores nuevos en `app/`, `components/` ni `lib/`.
- [x] Existen `lib/supabase/client.ts` y `lib/supabase/server.ts`, cada uno exporta `createClient`.
- [x] `lib/supabase/client.ts` empieza con `"use client"` o solo se importa desde componentes cliente, y no importa `next/headers`.
- [x] `lib/supabase/server.ts` usa `cookies()` de `next/headers` y no se incluye en el bundle del cliente.
- [x] Con las variables configuradas, una llamada desde el cliente de servidor al proyecto responde sin error.
- [x] Con las variables configuradas, una llamada desde el cliente de navegador al proyecto responde sin error.
- [x] Sin `NEXT_PUBLIC_SUPABASE_URL` o sin `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `createClient()` lanza un error que nombra la variable faltante.
- [x] Con `SUPABASE_SERVICE_ROLE_KEY` vacía, la app arranca y `createClient()` funciona igual: ninguna parte del código la lee.
- [x] `.env` no aparece en `git status` y `.env.template` sí es versionable.
- [x] `.env.template` contiene `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` solo con valores de ejemplo (sin la URL ni la clave reales), `SUPABASE_SERVICE_ROLE_KEY` vacía, y ya no contiene `SUPEBASE_DB_PASSWORD`.
- [x] `SUPABASE_SERVICE_ROLE_KEY` no tiene prefijo `NEXT_PUBLIC_`, no se referencia en ningún archivo de `app/`, `components/` ni `lib/`, y ningún valor real de service role aparece en el repositorio ni en el bundle del cliente.
- [x] Las páginas de las specs 01, 02 y 03 (`/`, `/juegos`, `/juegos/[id]`, `/auth`, `/salon`, `/acerca-de`) se ven y funcionan igual que antes, incluido el login mock y las puntuaciones en `localStorage`.
- [x] El proyecto de Supabase sigue sin tablas (`list_tables` devuelve una lista vacía).

## Decisiones tomadas y descartadas

- **Sí:** dos archivos, `lib/supabase/client.ts` y `lib/supabase/server.ts`. Decidido por el usuario: un cliente por contexto de ejecución (navegador y servidor).
- **Sí:** `@supabase/ssr` junto con `supabase-js`. Es lo que crea clientes con cookies para App Router, y la auth real lo necesitará, así que no habrá que rehacer los clientes.
- **No:** un único cliente compartido de `supabase-js`. No maneja cookies en el servidor y habría que reescribirlo al llegar la auth.
- **Sí:** solo conexión, sin tablas. Decidido por el usuario: "no quiero tablas, solo quiero que conectes con Supabase".
- **Sí:** reutilizar el proyecto de Supabase que el usuario ya creó en su organización. No se crea ningún proyecto nuevo.
- **Sí:** `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`, con ese nombre. Decidido por el usuario. Son las dos únicas piezas que necesitan los clientes, y ambas son públicas por diseño.
- **Sí:** declarar `SUPABASE_SERVICE_ROLE_KEY` como placeholder vacío. Decidido por el usuario, para que la variable ya esté documentada cuando llegue una spec que la necesite.
- **No:** usar `SUPABASE_SERVICE_ROLE_KEY` en código ahora (cliente admin). Ignora RLS y hoy no tiene ningún consumidor; se decide en la spec que la requiera. Las edge functions reciben sus propios secretos.
- **No:** conservar la contraseña de la base de datos en `.env.template`. El SDK no la usa. Si más adelante se quiere conexión directa a Postgres, se añade con el nombre corregido `SUPABASE_DB_PASSWORD`.
- **Sí:** comprobar la conexión con una llamada puntual y sin dejar código de prueba. Sin tablas no hay nada real que consultar, y una ruta de health check sería superficie pública nueva. Es una decisión mía que el usuario no confirmó: si prefiere una ruta permanente, se cambia aquí.
- **No:** `proxy.ts` de refresco de sesión. Solo tiene efecto con sesiones de Supabase Auth, que aún no existen.
- **Sí:** el login mock y `av_scores` siguen funcionando. Sustituirlos requiere decisiones propias de auth y de modelo de datos.

## Riesgos identificados

| Riesgo                                                                                                             | Mitigación                                                                                               |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Esta versión de Next (16.3.5) cambia convenciones de `cookies()` y de variables de entorno respecto a lo conocido. | El paso 1 exige leer la guía en `node_modules/next/dist/docs/` antes de escribir código.                 |
| Importar `lib/supabase/server.ts` desde un componente cliente rompe el build por `next/headers`.                   | Criterio de aceptación explícito y convención de importación por contexto.                               |
| Escribir cookies desde un Server Component lanza error en Next.                                                    | `setAll` envuelto en `try/catch` en el cliente de servidor.                                              |
| La service role, cuando se rellene, se cuela en el repositorio o en el bundle del cliente.                         | Sin prefijo `NEXT_PUBLIC_`, vacía en `.env.template`, `.env` ignorado por git y criterio de aceptación.  |
| La API de `@supabase/ssr` cambia entre versiones y el código queda desfasado.                                      | Consultar la documentación vigente con `search_docs` del MCP de Supabase antes de escribir los clientes. |

## Qué **no** entra en esta spec

- Tablas, migraciones, RLS y tipos generados.
- Supabase Auth real y cambios en `/auth` o en `lib/use-user.ts`.
- `proxy.ts` de refresco de sesión.
- Puntuaciones en base de datos, realtime y edge functions.
- Uso de la service role en código (cliente admin) y conexión directa a Postgres.

Cada uno de esos puntos, si se hace, va en su propia spec.
