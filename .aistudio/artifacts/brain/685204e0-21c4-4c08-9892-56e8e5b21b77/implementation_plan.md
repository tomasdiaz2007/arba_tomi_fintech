# ARBA · Percepción de IIBB — Dashboard Educativo y Visualizador (Revisión v2)

Dashboard interactivo y consola fintech de alta densidad para la visualización, simulación y auditoría del módulo de percepción de Ingresos Brutos (IIBB) de ARBA en el ecosistema fintech simulado, con estricta separación de frontend y backend, modos explícitos sin fallback silencioso, y fidelidad absoluta al contrato REST.

## User Review & Critical Decisions

> [!IMPORTANT]
> Se han incorporado las 12 precisiones acordadas:
>
> 1. **Separación de Puertos y Procesos**:
>    - **Frontend (Vite + React)**: Escucha en `0.0.0.0:3000` (puerto accesible en AI Studio).
>    - **Backend ARBA (Node + Express + SQLite)**: Mantiene su puerto original `3003` sin alterar sus archivos existentes ni rutas.
>    - **Consumo**: El frontend consume la API a través del proxy de Vite (`/api/arba/... → http://localhost:3003/arba/...` y `/api/health → http://localhost:3003/health`) o mediante la variable de entorno `VITE_API_BASE_URL` configurable directamente desde la interfaz.
> 2. **Cero Fallback Silencioso**: El usuario selecciona explícitamente entre `Modo API` y `Modo Demo`. Si la API falla mientras el modo API está activo, la interfaz muestra el error y el estado `API desconectada`, sin inventar datos ni cambiar de modo automáticamente.
> 3. **Definición de Métricas Acumuladas**: El total acumulado se rotula con precisión como *“Total acumulado de los registros cargados”*, sumando exclusivamente las percepciones obtenidas de los historiales consultados por CUIT (en modo API) o registradas en la sesión (en modo Demo). No se asume ni se inventa un endpoint de percepciones global.
> 4. **Búsqueda del Padrón**: Búsqueda por CUIT o Actividad resuelta 100% en el cliente sobre los registros cargados (paginados desde el backend mediante `GET /arba/padron?page=1&limit=...`), respetando que el backend no posee parámetros de búsqueda libre. Consulta directa por CUIT exacto disponible vía `GET /arba/padron/{cuit}`.
> 5. **Simulación y Previsualización**: El cálculo previo `monto_venta × alicuota` se etiqueta claramente como *“Estimación visual previa”*; el resultado oficial y vinculante es siempre el devuelto por `POST /arba/percepciones`.
> 6. **Modo Demo Totalmente Funcional**: En memoria reproduce exactamente las reglas del backend: consulta de `PADRON_DEMO`, cálculo con redondeo a 2 decimales, respuesta `201`, reintento idéntico `200` (idempotencia), conflicto de `id_venta` con otros datos `409`, CUIT no encontrado `404`, datos inválidos `400` e historial auditado por CUIT.
> 7. **Estructura Segura**: El código frontend reside en `src/client/`, la configuración en `vite.config.js` y `index.html` en la raíz. Los archivos del backend (`src/server.js`, `src/app.js`, `src/db.js`, `src/routes/`, `src/validate.js`, `test/`) y la base SQLite permanecen intactos.

---

## 1. Overview & Core Concept

- **Qué hace**: Proporciona una interfaz web profesional y educativa para explorar el padrón ficticio de contribuyentes, simular cálculos de percepción de IIBB enviados por terminales de punto de venta (TPV), verificar reglas de idempotencia y conflicto (`200` vs `409`), y auditar el historial de operaciones por CUIT.
- **Audiencia objetivo**: Estudiantes, docentes y desarrolladores del ecosistema fintech simulado.
- **Leyenda institucional permanente**:
  *“Datos ficticios para uso académico — no son valores fiscales reales ni representan conexión oficial con ARBA”*.
- **Frontera de responsabilidades visualizada**: ARBA calcula y registra percepciones; no cobra dinero ni emite facturas (esa tarea corresponde al TPV y a ARCA).

---

## 2. User Experience & Visual Design

### Estética y Dirección Visual (Modern Fintech Dark Console)
- **Fondo dominante (60%)**: Slate ultra-oscuro `#0B0F19` con superficies estructuradas en `#111827` y divisores sutiles `rgba(255, 255, 255, 0.08)`.
- **Estructura y contenedores (30%)**: Tarjetas planas con borde milimétrico (`border border-slate-800`), sin anidamiento superfluo (*cards within cards*) y sin bordes izquierdos gruesos.
- **Acentos funcionales (10%)**: Verde ARBA esmeralda (`#10B981` / `#059669`) para acciones primarias y alícuotas; azul técnico (`#38BDF8`) para rutas y contratos; ámbar cálido (`#F59E0B`) para advertencias de datos demo; rojo carmesí (`#EF4444`) para errores y código 409.
- **Tipografía resiliente con fallback offline**:
  - Sans-serif: `"Plus Jakarta Sans", system-ui, -apple-system, sans-serif`
  - Monospace: `"JetBrains Mono", Consolas, Menlo, monospace` con `tabular-nums` obligatorio para CUIT, importes en pesos, alícuotas y JSON.
- **Disciplina Zero-Pill**: Metadatos limpios con separadores tipográficos (`·`, `/`). Botones segmentados para alternar vistas y modos.

### Secciones de la Interfaz
1. **Encabezado**:
   - Nombre: `ARBA · Percepción de IIBB`
   - Etiqueta: `Módulo 3003 · Ecosistema Fintech simulado`
   - Selector interactivo de modo: Segmented control `Modo API` | `Modo Demo`
   - Indicador de estado: `API conectada` (verde), `Modo demo activo` (ámbar), `API desconectada` (rojo)
   - Input colapsable de configuración para `API_BASE_URL` (con botón de verificación de `/health`)
   - Banner visible de advertencia académica permanente.
2. **Resumen de Métricas (Summary Cards)**:
   - Estado del servicio (`Salud: OK / Desconectado / Demo activo`)
   - Cantidad de contribuyentes en padrón (con etiqueta de origen: `API` o `Demo`)
   - Cantidad de percepciones cargadas en la sesión actual
   - Total acumulado de los registros cargados ($ ARS con 2 decimales)
3. **Diagrama de Flujo Interactivo (TPV → ARBA → ARCA)**:
   - Representación visual del ciclo de vida de la transacción:
     `TPV → envía CUIT y monto → ARBA consulta padrón → aplica alícuota decimal → registra percepción → devuelve resultado al TPV → ARCA factura`.
   - Bloque informativo sobre la separación de responsabilidades.
4. **Consulta y Búsqueda del Padrón**:
   - Tabla responsiva con CUIT, Razón Social / Actividad, Alícuota decimal (`0.03`) y Porcentaje formateado (`3,00%`).
   - Búsqueda instantánea en cliente por CUIT o Actividad sobre las filas cargadas.
   - Paginación dinámica y selector de límite (1 a 100).
   - Botón “Ver detalle” que abre un modal con el contribuyente, desglose de su alícuota ficticia y acción directa "Usar en simulador".
5. **Simulador de Percepción**:
   - Formulario con campos: `id_venta`, `cuit` (con selector rápido de contribuyentes conocidos + entrada libre) y `monto_venta`.
   - Panel de **Previsualización (Estimación visual previa)**:
     - Monto venta: `$10.200,00`
     - Alícuota aplicada: `3,00% (0,03)`
     - Percepción estimada: `$306,00`
   - Botón `Calcular percepción` con estado de carga (spinner / disabled).
   - Panel de respuesta oficial post-envío:
     - Código HTTP (`201`, `200`, `400`, `404`, `409`)
     - Insignia contextual: "Nueva percepción registrada" (`201`), "Reintento idempotente" (`200`), "Conflicto de id_venta" (`409`), "CUIT no encontrado" (`404`), "Entrada inválida" (`400`).
     - Visor formateado del JSON devuelto.
6. **Historial de Auditoría**:
   - Tabla cronológica de percepciones con filtro por CUIT.
   - Columnas: Fecha, ID percepción, ID venta, CUIT, Monto venta, Alícuota, Monto percepción, Origen (`API` o `Demo`).
   - Modal/Panel deslizante para inspeccionar el JSON íntegro de la auditoría.
7. **Panel Técnico: Contrato del Servicio**:
   - Sección colapsable con base URL, tabla de endpoints, payload de request/response, tabla de códigos HTTP y reglas de negocio (redondeo a 2 decimales, fracción decimal de alícuotas, idempotencia por `id_venta`).

---

## 3. Estados de Interfaz Requeridos

La aplicación implementa estados explícitos para cada componente:
- **Carga inicial**: Skeletons oscuros sin layout shift.
- **Carga de padrón**: Indicador de progreso mientras se obtienen registros vía API.
- **Envío de percepción**: Botón deshabilitado con estado `Calculando...`.
- **Tabla vacía**: Mensaje explicativo y botón para cargar datos.
- **CUIT no encontrado**: Estado de advertencia con explicación de que el CUIT no existe en el padrón provincial.
- **API desconectada**: Banner de error cuando el backend no responde, indicando la URL configurada y botón "Reintentar conexión" o "Cambiar a Modo Demo".
- **Modo Demo activo**: Indicadores visibles de que las operaciones se ejecutan en memoria local con datos ficticios.
- **Respuesta 200 Idempotente**: Distintivo azul/verde con nota "Operación idéntica previa detectada. Sin duplicación en base de datos".
- **Conflicto 409**: Distintivo ámbar/rojo con nota "El id_venta ya fue utilizado con otro CUIT o monto".
- **Error de red o JSON**: Captura amigable sin romper la aplicación.
- **Datos parciales**: Manejo tolerante si faltan campos opcionales como `razon_social`.

---

## 4. Technical Architecture & File Structure

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ARBA FRONTEND (React + Vite)                    │
│                        Puerto: 3000 (0.0.0.0)                          │
│                                                                        │
│  ┌──────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────┐ │
│  │ Header & Mode│  │ Summary Cards │  │ Flow Diagram  │  │ Api Docs  │ │
│  └──────┬───────┘  └───────┬───────┘  └───────┬───────┘  └─────┬─────┘ │
│         │                  │                  │                │       │
│  ┌──────┴──────────────────┴──────────────────┴────────────────┴─────┐ │
│  │               PadronTable · Simulador · AuditHistory              │ │
│  └─────────────────────────────────┬─────────────────────────────────┘ │
│                                    │                                   │
│                        ┌───────────▼───────────┐                       │
│                        │     arbaApi Service   │                       │
│                        │ (API vs Demo Engine)  │                       │
│                        └─────┬───────────┬─────┘                       │
└──────────────────────────────┼───────────┼─────────────────────────────┘
                               │           │
                    [Modo Demo]│           │[Modo API]
                               │           │
                 ┌─────────────▼──┐        │
                 │ In-Memory Demo │        │ (Vite Proxy /api/arba o directo)
                 │ Engine         │        │
                 │ - PADRON_DEMO  │        │
                 │ - Local Storage│        │
                 │   / Memory Log │        │
                 └────────────────┘        │
                                           │
                                  ┌────────▼─────────────────────────────┐
                                  │ Backend Express ARBA                 │
                                  │ Puerto: 3003 (src/server.js)         │
                                  │ - GET  /health                       │
                                  │ - GET  /arba/padron/:cuit            │
                                  │ - GET  /arba/padron?page=1&limit=10  │
                                  │ - POST /arba/percepciones            │
                                  │ - GET  /arba/percepciones/:cuit      │
                                  │ - SQLite: arba.db                    │
                                  └──────────────────────────────────────┘
```

### Plan de Archivos
- **Frontend**:
  - `index.html`: Punto de entrada HTML en la raíz con fuentes, títulos y metadatos.
  - `vite.config.js`: Configuración de Vite con puerto `3000`, host `0.0.0.0` y proxy a `http://localhost:3003`.
  - `src/client/main.jsx`: Montaje de la aplicación React.
  - `src/client/App.jsx`: Orquestador principal de estado (modo actual, conexión, registros cargados, selección).
  - `src/client/styles/index.css`: Tailwind CSS + reglas tipográficas y utilidades de consola fiscal.
  - `src/client/components/`:
    - `Header.jsx`: Título, subtítulo, switch de modo, estado de API y configuración de URL.
    - `SummaryCards.jsx`: Tarjetas de estado, contribuyentes, percepciones cargadas y acumulado.
    - `FlowDiagram.jsx`: Diagrama visual del flujo TPV → ARBA → ARCA.
    - `PadronTable.jsx`: Tabla responsiva con buscador local, paginación y botón de detalle.
    - `PadronDetailModal.jsx`: Modal de detalle con alícuota y acceso rápido al simulador.
    - `PercepcionForm.jsx`: Formulario con validación en vivo y previsualización calculada.
    - `PercepcionResult.jsx`: Panel de resultado oficial con estado HTTP, badges de idempotencia y JSON.
    - `AuditHistory.jsx`: Historial con filtro por CUIT y visor de auditoría.
    - `ApiContract.jsx`: Panel colapsable de documentación y ejemplos de contratos.
  - `src/client/services/arbaApi.js`: Capa de transporte HTTP que diferencia errores de red, respuestas HTTP y delega a `demoEngine.js` cuando el usuario activa Modo Demo.
  - `src/client/services/demoEngine.js`: Motor en memoria que implementa con exactitud las reglas de negocio, validaciones, códigos `200`, `201`, `400`, `404`, `409` y persistencia en sesión.
  - `src/client/data/demoData.js`: Datos deterministas `PADRON_DEMO` y percepciones iniciales.
  - `src/client/utils/formatters.js`: Formateo de moneda ARS (`$10.200,00`), alícuotas (`3,00%`), CUIT (`XX-XXXXXXXX-X`) y fechas ISO.
- **Backend (Sin modificaciones a su lógica)**:
  - Mantener `src/server.js`, `src/app.js`, `src/db.js`, `src/routes/`, `src/validate.js` intactos.
  - Actualizar `package.json` para agregar scripts de desarrollo (`"dev": "vite"`, `"build": "vite build"`, `"start:backend": "node src/server.js"`, `"test": "node --test"`).
  - Instalar dependencias frontend: `react`, `react-dom`, `@types/react`, `@types/react-dom`, `vite`, `@vitejs/plugin-react`, `tailwindcss`, `@tailwindcss/vite`, `lucide-react`.

---

## 5. Matriz de Pruebas y Verificación

1. **Pruebas Automatizadas del Backend**:
   - Ejecutar `npm test` para asegurar que los 10 tests de `padron.test.js` y `percepciones.test.js` pasen al 100%.
2. **Pruebas de Conexión y Modos**:
   - `/health` con API conectada: Estado verde "API conectada (200 OK)".
   - `/health` con API caída: Estado rojo "API desconectada (Sin conexión a http://localhost:3003)".
   - Cambio manual de API a Demo: La interfaz pasa a ámbar "Modo Demo activo", sin pérdida de interacción.
   - Cambio manual de Demo a API: La interfaz vuelve a consultar la API real inmediatamente.
   - Refresco de la página en Modo Demo: Conservación de percepciones creadas en la sesión mediante `sessionStorage`.
3. **Pruebas de Padrón**:
   - Padrón conocido: Consulta de CUIT `30712345678` devolviendo alícuota `0.03` (3,00%).
   - CUIT inexistente: Consulta de `11111111111` devolviendo `404` con error `{ "error": "cuit no encontrado en padron" }`.
   - CUIT con guiones o formato inválido (`30-71234567-8`): Devolución de error `400` `{ "error": "cuit invalido" }`.
   - Paginación con límite inválido (`limit=0` o `limit=101`): Respuesta de error `400`.
4. **Pruebas del Simulador de Percepciones**:
   - Cálculo nuevo: Registro con `id_venta: "venta-auto-1"`, `cuit: "30712345678"`, `monto_venta: 10200` devolviendo `201 Created` y monto percepción `$306,00`.
   - Repetición idéntica: Reenvío con los mismos datos devolviendo `200 OK` con badge "Reintento idempotente".
   - Conflicto modificando solo el monto: Mismo `id_venta` con monto `9999` devolviendo `409 Conflict`.
   - Conflicto modificando solo el CUIT: Mismo `id_venta` con otro CUIT devolviendo `409 Conflict`.
   - `id_venta` vacío: Validación previa y respuesta `400` si se envía.
   - Monto cero o negativo: Respuesta `400` `{ "error": "monto_venta invalido" }`.
   - Monto enviado como string no numérico: Respuesta `400`.
5. **Documentación Entregable**:
   - `README.md` actualizado con instrucciones para ejecutar frontend, backend, configurar `VITE_API_BASE_URL`, alternar modos y ejecutar pruebas.
