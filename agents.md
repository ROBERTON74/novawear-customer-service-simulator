# Estado para retomar NOVAWEAR

## Proyecto

Repositorio:

```text
ROBERTON74/novawear-customer-service-simulator
```

Web publica:

```text
https://novawear-customer-service-simulator.vercel.app/training
```

Dashboard privado:

```text
https://novawear-customer-service-simulator.vercel.app/owner-dashboard
```

No guardar claves privadas reales en este archivo ni en GitHub.

## Estructura del proyecto

```text
novawear-customer-service-simulator/
├─ api/
│  └─ progress.js
├─ backend/
│  ├─ package.json
│  └─ src/
│     ├─ db.js
│     ├─ seed.js
│     └─ server.js
├─ frontend/
│  ├─ .env.static
│  ├─ index.html
│  ├─ package.json
│  └─ src/
│     ├─ localApi.js
│     ├─ main.jsx
│     └─ styles.css
├─ supabase/
│  └─ training_progress.sql
├─ agents.md
├─ avance.md
├─ Dockerfile
├─ package.json
├─ README.md
├─ render.yaml
└─ vercel.json
```

### Archivos clave

- `frontend/src/main.jsx`: interfaz principal React, rutas, entrenamiento, CRM, pedidos, dashboard privado y envio de progreso a `/api/progress`.
- `frontend/src/localApi.js`: API estatica para Vercel gratis. Genera datos ficticios y guarda estado local en el navegador.
- `frontend/src/styles.css`: estilos visuales.
- `api/progress.js`: funcion serverless de Vercel. Inserta y lee progreso desde Supabase.
- `supabase/training_progress.sql`: SQL para crear la tabla central `training_progress`.
- `backend/src/server.js`: backend Express para modo local/full stack con SQLite.
- `backend/src/seed.js`: creacion de datos ficticios: clientes, pedidos, transportistas, llamadas y ejemplos.
- `backend/src/db.js`: conexion SQLite.
- `vercel.json`: configuracion de despliegue Vercel.
- `README.md`: instrucciones generales.
- `avance.md`: resumen de configuracion Supabase/Vercel.
- `agents.md`: este archivo de handoff para retomar el trabajo.

### Modos de ejecucion

- Vercel publico usa `frontend` en modo estatico y `api/progress.js` como funcion serverless.
- El simulador de entrenamiento sigue usando datos ficticios en el navegador.
- El avance real de Mari Luz se debe guardar en Supabase cuando finaliza una llamada.
- Backend Express + SQLite queda disponible para local/full stack, pero no es la fuente central de progreso en Vercel.

## Estado funcional de la app

- La app de entrenamiento funciona en Vercel.
- Credenciales de entrenamiento conocidas por el propietario. No guardarlas en GitHub.
- Agente mostrado: `Mari Luz Sanabria`.
- Estados de pedido:
  - `EN TIEMPO`: enviar email al cliente y guardar comentario.
  - `RETRASADO`: enviar email urgente a transportista y guardar comentario.
  - `CANCELADO`: enviar email al cliente, hacer reembolso y guardar comentario.
- Al finalizar llamada, la tarjeta se cierra como si se colgara.
- Hay timbre simulado al crear llamada entrante.
- `NO DPA` ya no se muestra en el entrenamiento ni revela casos.
- En un 23% de clientes, solo el email facilitado en llamada no coincide con el email de ficha.

## Supabase

Proyecto Supabase creado:

```text
Entrenamiento novawear
```

URL del proyecto:

```text
https://lbpbbecppqsudssupkxf.supabase.co
```

Tabla creada correctamente:

```text
training_progress
```

SQL usado:

```text
supabase/training_progress.sql
```

## Vercel

Proyecto Vercel:

```text
novawear-customer-service-simulator
```

Variables que deben existir en `Production`:

```text
OWNER_DASHBOARD_KEY=tu-clave-privada
SUPABASE_URL=https://lbpbbecppqsudssupkxf.supabase.co
SUPABASE_SERVICE_ROLE_KEY=clave-secreta-de-supabase
```

Notas:

- `OWNER_DASHBOARD_KEY` fue acordada en la conversacion, pero no se escribe aqui por seguridad.
- `SUPABASE_SERVICE_ROLE_KEY` debe ser la clave secreta llamada `vercel_service_role`.
- No usar la clave publica de Supabase.
- No pegar claves privadas en archivos del repo.

## Commits importantes

```text
6aab676 Add Supabase progress tracking
78b5f06 Document progress dashboard setup
ec5f558 Force redeploy after Vercel env setup
169b0de Show progress dashboard setup errors
a3cbd1c Update progress setup handoff
```

El commit `169b0de` hace que el dashboard privado muestre errores especificos en vez de un mensaje generico.

## Donde nos quedamos

El dashboard privado seguia mostrando error al introducir la clave. Se subio una mejora para que el error sea especifico.

Al retomar:

1. Esperar a que Vercel termine de desplegar el commit mas reciente.
2. Abrir:

```text
https://novawear-customer-service-simulator.vercel.app/owner-dashboard
```

3. Introducir la clave privada configurada en Vercel.
4. Leer el mensaje exacto.
5. Si dice que falta una variable, corregir esa variable en Vercel `Production`.
6. Si dice `Clave privada incorrecta`, revisar `OWNER_DASHBOARD_KEY` en Vercel.
7. Si dice `Supabase respondio ...`, revisar la tabla o la clave `vercel_service_role`.
8. Tras corregir, hacer redeploy en Vercel.

## Prueba final esperada

1. Entrar en:

```text
https://novawear-customer-service-simulator.vercel.app/training
```

2. Crear una llamada.
3. Aceptar llamada.
4. Finalizar llamada.
5. Entrar en:

```text
https://novawear-customer-service-simulator.vercel.app/owner-dashboard
```

6. Verificar que `Registros tratados` sube a `1`.
