# Módulo ARBA — percepción de IIBB

Servicio del Ecosistema Fintech simulado. Escucha en el puerto `3003`, mantiene
un padrón local y calcula la percepción de IIBB de cada venta.

Las alícuotas incluidas son **ficticias, deterministas y configurables para la
actividad**. No representan valores fiscales reales. La alícuota se expresa
como fracción decimal: `0.03` equivale a 3%.

## Stack y configuración

- Node.js 18+ y Express.
- SQLite mediante `better-sqlite3`.
- Base propia en `arba.db`.

| Variable | Default | Descripción |
|---|---|---|
| `PORT` | `3003` | Puerto HTTP |
| `DB_PATH` | `./arba.db` | Ruta de SQLite; usar `:memory:` en pruebas |
| `PADRON_SEED_JSON` | seed incluido | JSON opcional para reemplazar el padrón ficticio |

Ejemplo de seed configurable:

```json
[{"cuit":"30712345678","actividad":"Comercio minorista","alicuota":0.03}]
```

## Ejecución

```bash
npm install
npm start
```

## API

Todas las respuestas son JSON y los errores tienen la forma:

```json
{"error":"mensaje"}
```

### `GET /health`

```json
{"status":"ok","servicio":"arba"}
```

### `GET /arba/padron/{cuit}`

Ejemplo:

```json
{
  "cuit": "30712345678",
  "actividad": "Comercio minorista",
  "alicuota": 0.03
}
```

Responde `400` para CUIT inválido y `404` si no existe.

### `GET /arba/padron?page=1&limit=10`

```json
{
  "page": 1,
  "limit": 10,
  "total": 5,
  "items": [
    {"cuit":"20123456789","actividad":"Librería","alicuota":0.03}
  ]
}
```

`limit` acepta valores entre 1 y 100.

### `POST /arba/percepciones`

Request:

```json
{
  "id_venta": "venta-1",
  "cuit": "30712345678",
  "monto_venta": 10200.00
}
```

Response `201`:

```json
{
  "id": 1,
  "id_venta": "venta-1",
  "cuit": "30712345678",
  "monto_venta": 10200,
  "alicuota_aplicada": 0.03,
  "monto_percepcion": 306,
  "fecha": "2026-10-06T12:00:00.000Z"
}
```

Los importes se redondean a dos decimales. La operación es idempotente por
`id_venta`:

- misma clave y mismos datos: `200`, devuelve el registro original;
- misma clave con otro CUIT o monto: `409`;
- CUIT inexistente: `404`;
- `id_venta`, CUIT o monto inválidos: `400`.

### `GET /arba/percepciones/{cuit}`

Endpoint adicional de auditoría que devuelve el historial registrado para un
CUIT.

## Seed ficticio

El padrón inicial contiene cinco contribuyentes de prueba. Las alícuotas son
ejemplos de la actividad y no datos oficiales:

| CUIT | Actividad | Alícuota de ejemplo |
|---|---|---:|
| `30712345678` | Comercio minorista | `0.03` |
| `27304567891` | Servicios profesionales | `0.02` |
| `30556789012` | Producción de alimentos | `0.015` |
| `20123456789` | Librería | `0.03` |
| `30678901234` | Comercio mayorista | `0` |

## Docker

```bash
docker build -t arba .
docker run -p 3003:3003 -v arba-data:/data arba
```

El contenedor utiliza `/data/arba.db` para persistencia.

## Pruebas

Las pruebas cubren salud, padrón conocido/no encontrado, paginación, CUIT
inválido, cálculo, redondeo, repetición idempotente y conflicto `409`.

```bash
npm test
```
