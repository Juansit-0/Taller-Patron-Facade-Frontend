# Casa Arrayán, frontend

Interfaz web del taller de patrón Facade: sistema de reservas de un hotel boutique ficticio. Hecha con React y Vite, con CSS propio.

## Requisitos

- Node.js 20 o superior
- El backend (`../hotel-backend`) corriendo en `http://localhost:8080`

## Cómo ejecutarlo

```bash
npm install
cp .env.example .env
npm run dev
```

Abre la dirección que muestra la terminal (por defecto `http://localhost:5173`).

Para generar la versión de producción:

```bash
npm run build
npm run preview
```

## Variable de entorno

| Variable | Descripción | Valor por defecto |
| --- | --- | --- |
| `VITE_API_URL` | URL base del backend, sin `/api/hotel` | `http://localhost:8080` |

## Flujo

1. **Reservar:** elige fechas y tipo de habitación, selecciona una habitación disponible y completa los datos del huésped.
2. **Mi reserva:** busca la reserva por su código, agrega servicios (spa, desayuno, traslado), haz el check-in para recibir la llave digital y el check-out para ver e imprimir la factura.
