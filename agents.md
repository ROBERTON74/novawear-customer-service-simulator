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
- `No pasa DPA` debe existir como accion durante la llamada activa.
- Al pulsarlo abre un cuadro de comentario obligatorio para apuntar que dato no coincide.
- No debe revelar previamente que clientes fallan DPA.
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

## Estado actualizado final - 10/08/2026

### URLs finales

App de entrenamiento para Mari Luz:

```text
https://novawear-customer-service-simulator.vercel.app/training
```

Dashboard privado del propietario:

```text
https://novawear-customer-service-simulator.vercel.app/owner-dashboard
```

Repositorio GitHub:

```text
https://github.com/ROBERTON74/novawear-customer-service-simulator
```

### Acceso de agente

- Usuario visible en login: `Mari Luz Sanabria`.
- La contrasena es la misma clave de entrenamiento ya acordada con el propietario.
- La contrasena no debe escribirse en GitHub, README, `agents.md` ni `avance.md`.
- La pantalla de login ya no deja la contrasena pre-rellenada.
- Se mantiene compatibilidad temporal con el usuario antiguo `agente`, por si se escribe por costumbre.

### Acceso del dashboard privado

- El dashboard privado usa `OWNER_DASHBOARD_KEY` configurada en Vercel.
- La clave privada no se guarda en archivos del repositorio.
- Las variables de entorno de Vercel ya fueron configuradas en `Production`:
  - `OWNER_DASHBOARD_KEY`
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Tras configurar variables se hizo redeploy.

### Supabase y progreso

- Proyecto Supabase conectado: `Entrenamiento novawear`.
- URL Supabase:

```text
https://lbpbbecppqsudssupkxf.supabase.co
```

- Tabla central: `training_progress`.
- El SQL de creacion/grants esta en `supabase/training_progress.sql`.
- El dashboard privado lee desde Supabase mediante `/api/progress`.
- Al finalizar llamadas se insertan registros de avance.
- La fila de prueba `TEST-SETUP` queda filtrada del dashboard.

### Logica de entrenamiento

Estados de pedido:

- `EN TIEMPO`: se envia email simulado al cliente informando que el pedido esta en plazo y se guarda comentario.
- `RETRASADO`: se envia email simulado al transportista para entrega urgente y se guarda comentario.
- `CANCELADO`: se envia email simulado al cliente, se hace reembolso simulado y se guarda comentario.

DPA:

- El boton `No pasa DPA` existe durante la llamada activa.
- Al pulsarlo abre un cuadro obligatorio para apuntar que dato no coincide.
- Los clientes que no pasan DPA no se muestran previamente como aviso, para que el entrenamiento sea realista.
- Aproximadamente el 23% de los registros tienen una discrepancia DPA.
- Por ahora la discrepancia configurada es solo en el email facilitado durante la llamada; nombre, telefono, direccion y codigo postal coinciden.

Llamadas:

- `Nueva llamada` crea una llamada entrante.
- Hay sonido simulado de timbre.
- `Finalizar llamada` cuelga/cierra la llamada y registra el resultado.

### Datos visibles en llamada

La tarjeta de llamada debe mostrar:

- Nombre del cliente.
- Numero de pedido facilitado.
- Telefono completo.
- Email facilitado.
- Direccion.
- Codigo postal.
- Icono de copiar al lado de cada dato relevante.

La ficha del cliente debe permitir cotejar:

- ID cliente.
- Nombre.
- DNI.
- Email.
- Telefono.
- Direccion.
- Codigo postal.

### Commits recientes importantes

```text
76f7850 Use agent name for login
38abeb0 Add DPA failure action
e17e3fa Hide setup test progress row
d505c64 Fix Supabase progress insert response
b634f80 Document project structure in handoff
```

### Verificaciones hechas

- `npm.cmd run vercel-build` paso correctamente tras el cambio de login.
- El repositorio local quedo limpio despues del push.
- GitHub contiene el ultimo commit `76f7850`.
- Vercel debe redesplegar automaticamente desde `main`.

### Pendiente solo de comprobacion manual

1. Abrir la URL de entrenamiento.
2. Entrar con usuario `Mari Luz Sanabria` y la clave de entrenamiento.
3. Crear una llamada y finalizarla.
4. Abrir el dashboard privado.
5. Confirmar que el contador de registros tratados sube.

Nota de seguridad: no pegar en este archivo claves secretas de Supabase, claves privadas de Vercel ni contrasenas reales.
