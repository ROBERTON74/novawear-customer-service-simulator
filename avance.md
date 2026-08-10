# Avance y configuracion del dashboard privado

## Objetivo

Controlar el avance diario de Mari Luz desde un dashboard privado.

El panel privado esta en:

```text
https://novawear-customer-service-simulator.vercel.app/owner-dashboard
```

Clave privada:

```text
Configurar una clave privada en Vercel. No guardar claves reales en GitHub.
```

## Que debe mostrar el dashboard

- Hora de inicio de cada llamada.
- Hora de fin de cada llamada.
- Tiempo de conexion.
- Registros tratados.
- Ultimos ejercicios finalizados.
- Puntuacion.

## Pendiente en Supabase

Hecho:

- Proyecto Supabase creado: `Entrenamiento novawear`.
- URL del proyecto:

```text
https://lbpbbecppqsudssupkxf.supabase.co
```

- Tabla creada correctamente desde SQL Editor.

SQL usado:

```text
supabase/training_progress.sql
```

Ese archivo crea la tabla:

```text
training_progress
```

## Vercel

Entrar en el proyecto:

```text
novawear-customer-service-simulator
```

Luego ir a:

```text
Settings -> Environment Variables
```

Variables que deben existir en `Production`:

```text
OWNER_DASHBOARD_KEY=tu-clave-privada
SUPABASE_URL=https://lbpbbecppqsudssupkxf.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

Importante:

- `OWNER_DASHBOARD_KEY` ya se acordo en la conversacion, pero no se guarda aqui por seguridad.
- `SUPABASE_SERVICE_ROLE_KEY` debe ser la clave secreta creada en Supabase con nombre `vercel_service_role`.
- No usar la clave publica.
- No pegar claves privadas en GitHub ni en archivos del proyecto.

## Despues de configurar Vercel

Ya se forzaron redeploys desde GitHub:

```text
4cb0038 Redeploy with Supabase environment
ec5f558 Force redeploy after Vercel env setup
169b0de Show progress dashboard setup errors
```

El ultimo commit mejora el mensaje de error del dashboard privado.

Al volver, probar:

```text
https://novawear-customer-service-simulator.vercel.app/owner-dashboard
```

Escribir la clave privada configurada en Vercel.

Si aparece error, ahora deberia decir exactamente una de estas opciones:

```text
Falta OWNER_DASHBOARD_KEY en Vercel
Falta SUPABASE_URL en Vercel
Falta SUPABASE_SERVICE_ROLE_KEY en Vercel
Clave privada incorrecta
Supabase respondio ...
```

## Estado actual

Codigo preparado:

- `api/progress.js` guarda y lee registros desde Supabase.
- Al finalizar llamada, el frontend llama a `/api/progress`.
- `/owner-dashboard` lee los registros con clave privada.
- `NO DPA` ya no se muestra en la app de entrenamiento.

Commit de integracion:

```text
6aab676 Add Supabase progress tracking
```

## Siguiente paso al retomar

1. Esperar a que Vercel termine de desplegar el commit `169b0de`.
2. Abrir:

```text
https://novawear-customer-service-simulator.vercel.app/owner-dashboard
```

3. Introducir la clave privada.
4. Leer el mensaje exacto que aparece.
5. Si carga sin error, hacer una llamada de prueba:
   - Nueva llamada.
   - Aceptar llamada.
   - Finalizar llamada.
6. Volver a `/owner-dashboard` y comprobar que `Registros tratados` sube a 1.
