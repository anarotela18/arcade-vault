# 03 — Página "Acerca de" y envío de correo de contacto con Resend

**Estado:** Implementado
**Depende de:** SPEC 01, SPEC 02
**Fecha:** 2026-10-07

**Objetivo:** Implementar la página "Acerca de" en `/acerca-de` según `references/templates/home-about/about.jsx`, con un formulario de contacto que envía el mensaje por correo mediante el endpoint `POST /api/contact`, que llama a Resend desde el servidor.

## Alcance

**Incluye:**

- Nueva ruta `/acerca-de` (`app/acerca-de/page.tsx`) con las secciones del template en orden: hero "ACERCA DE ARCADE VAULT" (misión + 3 `highlight` con icono pixel), divisor animado (`about-divider`) y sección de contacto (`about-contact`) con intro, 3 `tip` y formulario.
- Copy visible idéntico al de `about.jsx`.
- Animación `.reveal` con el hook `useReveal` ya existente en `lib/use-reveal.ts`.
- Los 3 iconos `HEART`, `BROWSER` y `PLANT` como componente `components/about/highlight-icon.tsx`.
- Formulario `components/about/contact-form.tsx` (client component) con los campos NOMBRE, CORREO ELECTRÓNICO y MENSAJE, la animación `shake` ante campos vacíos y la terminal de éxito `VAULT-OS // TERMINAL` con el botón "ENVIAR OTRO MENSAJE", igual que el template.
- Route Handler `POST /api/contact` en `app/api/contact/route.ts` que valida los datos en el servidor y envía el correo con el SDK `resend`. El formulario lo invoca con `fetch`.
- Dependencia nueva: `resend`.
- Variables de entorno reales en `.env` (ignorado por git): `RESEND_API_KEY`, `CONTACT_TO_EMAIL` y `CONTACT_FROM_EMAIL`.
- Archivo `.env.template` versionado en el repositorio, con las mismas 3 variables y valores de ejemplo (sin ningún secreto real), para documentar cómo luce el `.env`.
- Ajuste de `.gitignore`: se mantiene `.env*` y se agrega la excepción `!.env.template`.
- Enlace "Acerca de" en el `Nav` de escritorio y móvil, como en `references/templates/home-about/nav.jsx`, activo en `/acerca-de`.
- Mensaje de error visible en el formulario cuando el envío falla, sin mostrar la terminal de éxito.
- Campo honeypot oculto anti-bots, validado en el servidor.

**No incluye (para specs futuras):**

- Correo de confirmación al visitante: el visitante no recibe copia.
- Dominio propio verificado en Resend y plantillas de correo con HTML: el correo es de texto plano.
- Rate limiting, CAPTCHA o guardado de mensajes en base de datos.
- Cambios de copy o diseño respecto al template.
- Metadata/SEO específica de la página.
- Cualquier cambio en sesión, puntuaciones, reproductor o el Home de las specs 01 y 02.

## Modelo de datos

Esta feature no introduce estructuras persistentes. Solo define el contrato del endpoint.

**`POST /api/contact` (`app/api/contact/route.ts`)**

```ts
// Body JSON de la petición
interface ContactInput {
  name: string;
  email: string;
  message: string;
  website?: string; // honeypot: debe llegar vacío
}

// Respuesta JSON
// 200 -> { ok: true, name: string }
// 400 -> { ok: false, error: string }   (validación)
// 500 -> { ok: false, error: string }   (falta de configuración o fallo de Resend)
```

**Variables de entorno (`.env`, con `.env.template` como plantilla versionada)**

```
RESEND_API_KEY=       # la entrega el usuario después de la spec
CONTACT_TO_EMAIL=     # correo del usuario que recibe los mensajes
CONTACT_FROM_EMAIL=Arcade Vault <onboarding@resend.dev>
```

Convenciones:

- Límites de validación en servidor: `name` ≤ 80, `email` ≤ 120 con formato válido, `message` ≤ 2000 caracteres; todos con `trim()` y no vacíos.
- Si `website` no está vacío, el endpoint responde `200 { ok: true }` sin enviar nada (el bot no recibe pista).
- El correo se envía con `replyTo` = email del visitante, asunto `[Arcade Vault] Mensaje de {name}` y cuerpo en texto plano con nombre, email y mensaje.
- `RESEND_API_KEY` solo se lee en el servidor; nunca con prefijo `NEXT_PUBLIC_`.

## Plan de implementación

1. **Dependencia y entorno:** leer en `node_modules/next/dist/docs/` la guía de Route Handlers de esta versión de Next (16.3.5), instalar `resend` y agregar `!.env.template` a `.gitignore`, crear `.env.template` (valores de ejemplo, versionado) y `.env` (ignorado) con las 3 variables, dejando la `RESEND_API_KEY` vacía en `.env` hasta que el usuario la coloque ahí. El sitio sigue funcional sin cambios visibles.
2. **Endpoint:** crear `app/api/contact/route.ts` con `POST`: validación, honeypot, envío con Resend y manejo de errores (falta de variables, error de la API) devolviendo `{ ok: false, error }` con el código HTTP correspondiente, sin lanzar excepciones.
3. **Iconos:** crear `components/about/highlight-icon.tsx` con los SVG `HEART`, `BROWSER` y `PLANT` copiados de `about.jsx`.
4. **Formulario:** crear `components/about/contact-form.tsx` (client) con estado `form`, `sent`, `shake` y `error`, validación de vacíos con `shake` en cliente, `fetch("/api/contact", { method: "POST" })`, estado "enviando" que deshabilita el botón, terminal de éxito y reinicio con "ENVIAR OTRO MENSAJE".
5. **Página `/acerca-de`:** crear `app/acerca-de/page.tsx` como client component que usa `useReveal` y compone hero, divisor, intro de contacto y `ContactForm`, con el copy del template.
6. **Nav:** agregar "Acerca de" (`/acerca-de`) en escritorio y menú móvil de `components/nav.tsx`, activo con `pathname.startsWith("/acerca-de")`.
7. **Verificación visual y de envío:** con `next dev`, comparar `/acerca-de` con `references/templates/home-about/arcade-vault-standalone.html` en escritorio y móvil, y con la API key real enviar un mensaje de prueba y comprobar que llega a `CONTACT_TO_EMAIL`.

## Criterios de aceptación

- [ ] `next build` termina sin errores y `npm run lint` no reporta errores nuevos en `app/`, `components/` ni `lib/`.
- [ ] `/acerca-de` muestra hero, divisor y sección de contacto en el orden del template, con el copy en español idéntico a `about.jsx`.
- [ ] El hero muestra los 3 `highlight` (corazón magenta, navegador cyan, planta verde) y el divisor muestra 24 píxeles animados.
- [ ] La sección de contacto muestra los 3 `tip` ("RESPUESTA EN 24-48H", "SUGERENCIAS BIENVENIDAS", "SIN SPAM, JAMÁS").
- [ ] Las secciones `.reveal` empiezan ocultas y reciben la clase `in` al entrar en viewport, también al navegar a `/acerca-de` desde otra ruta.
- [ ] Enviar el formulario con cualquier campo vacío (o solo espacios) aplica `shake` durante ~400 ms y no hace la petición a `/api/contact`.
- [ ] Con datos válidos y la API key configurada, llega un correo a `CONTACT_TO_EMAIL` con asunto `[Arcade Vault] Mensaje de {name}`, y responder ese correo dirige la respuesta al email del visitante.
- [ ] Tras un envío exitoso se muestra la terminal `VAULT-OS // TERMINAL` con "MENSAJE RECIBIDO… GRACIAS, {NOMBRE EN MAYÚSCULAS}."; "ENVIAR OTRO MENSAJE" vuelve al formulario con los campos vacíos.
- [ ] Mientras se envía, el botón queda deshabilitado y no se puede enviar dos veces el mismo mensaje.
- [ ] Sin `RESEND_API_KEY` o con una key inválida, el formulario muestra un mensaje de error, conserva lo escrito y no muestra la terminal de éxito.
- [ ] `POST /api/contact` rechaza en servidor email con formato inválido, o `name`/`message` que superen los límites, respondiendo 400 con `ok: false`.
- [ ] Si el campo honeypot `website` llega con contenido, no se envía ningún correo.
- [ ] `RESEND_API_KEY` no aparece en el bundle del cliente ni en el HTML servido.
- [ ] `.env` no queda registrado en git (`git status` no lo lista) y `.env.template` sí aparece como archivo versionable.
- [ ] `.env.template` contiene `RESEND_API_KEY`, `CONTACT_TO_EMAIL` y `CONTACT_FROM_EMAIL` solo con valores de ejemplo, sin ninguna clave real.
- [ ] El `Nav` muestra "Acerca de" en escritorio y móvil, activo solo en `/acerca-de`.
- [ ] `/acerca-de` no desborda horizontalmente en un viewport de 375 px de ancho.
- [ ] Las páginas de las specs 01 y 02 (`/`, `/juegos`, `/juegos/[id]`, `/auth`, `/salon`) se ven igual que antes.

## Decisiones tomadas y descartadas

- **Sí:** Route Handler `POST /api/contact` para el envío. Es lo que indica el profesor del curso, y la API key queda solo en el servidor.
- **No:** Server Action. Habría menos código, pero se descartó para seguir el curso.
- **Sí:** ruta `/acerca-de`. Mantiene la convención de URLs en español (`/juegos`, `/salon`).
- **Sí:** `.env.template` versionado y `.env` ignorado. Decidido por el usuario. Quien clone el repo ve qué variables necesita sin exponer la API key; para ello `.gitignore` agrega `!.env.template`, porque `.env*` también lo ignoraría.
- **No:** `.env.local`. Se usa `.env` por decisión del usuario.
- **Sí:** destinatario y remitente en variables de entorno (`CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`). Se puede cambiar el correo sin tocar código y el correo personal no queda en el repositorio. El usuario indicó que usará su correo personal.
- **Sí:** remitente `onboarding@resend.dev`. Es el dominio de prueba de Resend y no requiere verificar un dominio. Limitación conocida: solo entrega a la dirección con la que se creó la cuenta de Resend, por lo que `CONTACT_TO_EMAIL` debe ser ese correo.
- **No:** dominio verificado propio. Excede una demo.
- **Sí:** `replyTo` = email del visitante, sin correo de confirmación al visitante. Decidido por el usuario. Permite responder directo y el dominio de prueba no puede enviar a terceros.
- **Sí:** validación en servidor, honeypot y error visible. Es el mínimo razonable para que una acción pública no acepte basura ni oculte fallos; recomendado por el asistente para el caso de demo.
- **No:** rate limiting o CAPTCHA. Requieren almacenamiento o servicios externos que no aportan al objetivo del curso.
- **Sí:** correo en texto plano. Evita plantillas HTML y el riesgo de inyección de HTML con contenido del visitante.
- **Sí:** agregar "Acerca de" al `Nav` ahora. La spec 02 lo había diferido precisamente hasta que la ruta existiera.
- **Sí:** estilos ya presentes en `app/globals.css`. La spec 02 incorporó las clases de About; solo se ajustará lo que falte al comparar con `styles.css`.

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Con `onboarding@resend.dev` Resend rechaza el envío si `CONTACT_TO_EMAIL` no es el correo de la cuenta. | Documentarlo en la spec, mostrar el error de Resend como mensaje genérico en UI y registrar el detalle en el log del servidor. |
| La API key se filtra al repositorio o al cliente. | La clave real solo en `.env` (ignorado por git; `.env.template` lleva solo ejemplos), sin prefijo `NEXT_PUBLIC_` y verificada en los criterios de aceptación. |
| Faltan clases CSS de About en `globals.css` y el diseño no coincide con el template. | Comparar con `styles.css` en el paso 7 y agregar solo las reglas faltantes sin tocar las de las specs 01 y 02. |
| Esta versión de Next (16.3.5) cambia las convenciones de Route Handlers respecto a lo conocido. | El paso 1 exige leer la guía en `node_modules/next/dist/docs/` antes de escribir código. |

## Qué **no** entra en esta spec

- Correo de confirmación al visitante.
- Dominio verificado en Resend y correos con plantilla HTML.
- Rate limiting, CAPTCHA o historial de mensajes en base de datos.
- Cambios de diseño o copy respecto a `about.jsx`.
- Cambios en las pantallas de las specs 01 y 02, salvo el enlace "Acerca de" en el `Nav`.

Cada uno de esos puntos, si se hace, va en su propia spec.
