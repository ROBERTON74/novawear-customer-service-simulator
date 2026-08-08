# NOVAWEAR Customer Service Simulator

Aplicación local para entrenar agentes de Atención al Cliente de una tienda online ficticia de ropa. Incluye CRM, gestión de pedidos, logística, emails simulados, reembolsos ficticios, llamadas de entrenamiento y puntuación.

## Requisitos

- Node.js 24 o superior.
- npm.

## Instalación

Desde `novawear-customer-service-simulator/backend`:

```bash
npm install
npm run seed
npm run dev
```

Desde `novawear-customer-service-simulator/frontend`:

```bash
npm install
npm run dev
```

En PowerShell de Windows puede ser necesario usar `npm.cmd`:

```powershell
npm.cmd install
npm.cmd run dev
```

## Puertos

- Backend API: `http://localhost:4000`
- Frontend: normalmente `http://localhost:5173`
- Producción en un solo servidor: el backend sirve frontend y API en el mismo dominio.

## Usuario de prueba

- Usuario: `agente`
- Contraseña: `novawear123`

## Uso en dos monitores

1. Entra en `/training`.
2. Pulsa `Abrir CRM` para abrir `/crm` en una ventana independiente.
3. Pulsa `Abrir pedidos` para abrir `/orders` en otra ventana independiente.
4. Coloca CRM en el monitor 1 y Pedidos / Logística en el monitor 2.

Todas las ventanas consultan el backend y la base de datos SQLite central. No se depende exclusivamente de `localStorage`.

## Cómo iniciar un ejercicio

1. Ve a `Entrenamiento`.
2. Pulsa `Nueva llamada`.
3. Pulsa `Aceptar llamada`.
4. Busca el cliente en CRM usando el número de pedido, nombre, email, teléfono, DNI o ID cliente.
5. Verifica nombre, email, dirección y código postal.
6. Busca el pedido en Pedidos / Logística.
7. Aplica la acción correcta:
   - `EN TIEMPO`: informar al cliente.
   - `RETRASADO`: contactar transportista con email simulado.
   - `CANCELADO`: procesar reembolso ficticio.
8. Escribe y guarda una nota CRM.
9. Finaliza la llamada para ver la puntuación.

## Datos ficticios

La base de datos se crea en `database/novawear.sqlite` e incluye:

- 100 clientes ficticios.
- 250 pedidos.
- Más de 300 líneas de pedido.
- 5 transportistas ficticios.
- Pedidos en tiempo, retrasados y cancelados.
- Historial, emails simulados y reembolsos de ejemplo.

No se envían emails reales, no se realizan pagos reales y no se conecta con bancos, Stripe, PayPal, transportistas ni APIs externas.

## Despliegue web

La aplicación está preparada para publicarse como un único servicio Node:

- Build command: `npm run deploy:build`
- Start command: `npm start`
- Node: `24` o superior
- Puerto: usar la variable `PORT` que dé el proveedor
- Base de datos persistente: configurar `DB_PATH` apuntando a un disco persistente, por ejemplo `/data/novawear.sqlite`

Para que Luz pueda entrenar cuando quiera, usa un proveedor que permita Node.js con disco persistente o volumen. Si se usa un contenedor Docker, el proyecto incluye `Dockerfile` y espera un volumen montado en `/data`.

Variables recomendadas:

```bash
NODE_ENV=production
DB_PATH=/data/novawear.sqlite
```

Después de publicar, se entra con:

- Usuario: `agente`
- Contraseña: `novawear123`
- Agente mostrado: `Mari Luz Sanabria`

## Vercel gratis

También está preparada una versión compatible con Vercel Hobby gratuito.

En Vercel:

- Framework preset: `Vite`
- Build command: `npm run vercel-build`
- Output directory: `frontend/dist`
- Environment variable: `VITE_STATIC_MODE=true`

Importante: esta versión gratuita guarda llamadas, notas, emails simulados y reembolsos en el navegador de quien entrena mediante `localStorage`. Es perfecta para que Luz practique desde una URL pública, pero no es una base de datos central compartida entre varios dispositivos.

## Seguimiento central con Supabase

Para controlar el avance de Mari Luz desde cualquier ordenador:

1. Crea un proyecto en Supabase.
2. Abre el SQL Editor de Supabase.
3. Ejecuta el contenido de `supabase/training_progress.sql`.
4. En Vercel, añade estas variables de entorno:

```bash
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
OWNER_DASHBOARD_KEY=una-clave-privada-que-solo-sepas-tu
```

5. Redeploy en Vercel.
6. Entra al panel oculto:

```text
https://novawear-customer-service-simulator.vercel.app/owner-dashboard
```

Ese panel pide `OWNER_DASHBOARD_KEY` y muestra horas de inicio, horas de fin, tiempo de conexión y registros tratados.
