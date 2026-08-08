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

1. Crear un proyecto en Supabase.
2. Entrar en el SQL Editor.
3. Ejecutar el archivo:

```text
supabase/training_progress.sql
```

Ese archivo crea la tabla:

```text
training_progress
```

## Pendiente en Vercel

Entrar en el proyecto:

```text
novawear-customer-service-simulator
```

Luego ir a:

```text
Settings -> Environment Variables
```

Crear estas 3 variables:

```text
OWNER_DASHBOARD_KEY=tu-clave-privada
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

Importante:

- `SUPABASE_URL` sale del proyecto de Supabase.
- `SUPABASE_SERVICE_ROLE_KEY` no es la anon key.
- Tiene que ser la clave `service_role`.

## Despues de configurar Vercel

1. Ir a `Deployments`.
2. Abrir los tres puntos del ultimo deployment.
3. Pulsar `Redeploy`.
4. Esperar a que termine.
5. Entrar en:

```text
https://novawear-customer-service-simulator.vercel.app/owner-dashboard
```

6. Escribir la clave privada configurada en Vercel:

```text
tu-clave-privada
```

## Estado actual

El codigo ya esta preparado para enviar a Supabase cada llamada finalizada.

Commit de integracion:

```text
6aab676 Add Supabase progress tracking
```
