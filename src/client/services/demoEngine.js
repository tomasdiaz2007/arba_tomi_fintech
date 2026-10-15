import { PADRON_DEMO, INITIAL_PERCEPCIONES_DEMO } from '../data/demoData.js';
import { round2 } from '../utils/formatters';

const STORAGE_KEY = 'arba_demo_percepciones_v1';

function loadStoredPercepciones() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('No se pudo acceder a sessionStorage para demo data', err);
  }
  return [...INITIAL_PERCEPCIONES_DEMO];
}

let percepcionesMemory = loadStoredPercepciones();

function saveToStorage() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(percepcionesMemory));
  } catch (err) {
    console.warn('Error al guardar demo data en sessionStorage', err);
  }
}

export function validarCuit(cuit) {
  return typeof cuit === 'string' && /^\d{11}$/.test(cuit);
}

export function validarMonto(monto) {
  return typeof monto === 'number' && Number.isFinite(monto) && monto > 0;
}

export function validarIdVenta(id) {
  return typeof id === 'string' && id.trim().length > 0 && id.length <= 64;
}

export const demoEngine = {
  async health() {
    return {
      status: 200,
      ok: true,
      data: { status: 'ok', servicio: 'arba' },
      origin: 'Demo',
    };
  },

  async listPadron(page = 1, limit = 10) {
    const p = Number.parseInt(page, 10);
    const l = Number.parseInt(limit, 10);

    if (!Number.isInteger(p) || p < 1 || !Number.isInteger(l) || l < 1 || l > 100) {
      return {
        status: 400,
        ok: false,
        data: { error: 'paginacion invalida' },
        origin: 'Demo',
      };
    }

    const offset = (p - 1) * l;
    const items = PADRON_DEMO.slice(offset, offset + l).map((row) => ({
      cuit: row.cuit,
      actividad: row.actividad,
      alicuota: row.alicuota,
      razon_social: row.razon_social,
    }));

    return {
      status: 200,
      ok: true,
      data: {
        page: p,
        limit: l,
        total: PADRON_DEMO.length,
        items,
      },
      origin: 'Demo',
    };
  },

  async getPadronByCuit(cuit) {
    if (!validarCuit(cuit)) {
      return {
        status: 400,
        ok: false,
        data: { error: 'cuit invalido' },
        origin: 'Demo',
      };
    }

    const row = PADRON_DEMO.find((item) => item.cuit === cuit);
    if (!row) {
      return {
        status: 404,
        ok: false,
        data: { error: 'cuit no encontrado en padron' },
        origin: 'Demo',
      };
    }

    return {
      status: 200,
      ok: true,
      data: {
        cuit: row.cuit,
        actividad: row.actividad,
        alicuota: row.alicuota,
        razon_social: row.razon_social,
      },
      origin: 'Demo',
    };
  },

  async createPercepcion({ id_venta, cuit, monto_venta }) {
    if (!validarIdVenta(id_venta)) {
      return {
        status: 400,
        ok: false,
        data: { error: 'id_venta invalido' },
        origin: 'Demo',
      };
    }
    if (!validarCuit(cuit)) {
      return {
        status: 400,
        ok: false,
        data: { error: 'cuit invalido' },
        origin: 'Demo',
      };
    }
    if (!validarMonto(monto_venta)) {
      return {
        status: 400,
        ok: false,
        data: { error: 'monto_venta invalido' },
        origin: 'Demo',
      };
    }

    // Comprobar idempotencia por id_venta
    const existente = percepcionesMemory.find((p) => p.id_venta === id_venta);
    if (existente) {
      const misma = existente.cuit === cuit && Math.abs(existente.monto_venta - round2(monto_venta)) < 0.0001;
      if (!misma) {
        return {
          status: 409,
          ok: false,
          data: { error: 'id_venta ya existe con otros datos' },
          origin: 'Demo',
        };
      }
      return {
        status: 200,
        ok: true,
        data: { ...existente },
        isIdempotent: true,
        origin: 'Demo',
      };
    }

    const contribuyente = PADRON_DEMO.find((item) => item.cuit === cuit);
    if (!contribuyente) {
      return {
        status: 404,
        ok: false,
        data: { error: 'cuit no encontrado en padron' },
        origin: 'Demo',
      };
    }

    const montoPercepcion = round2(monto_venta * contribuyente.alicuota);
    const nueva = {
      id: String(percepcionesMemory.length + 1),
      id_venta,
      cuit,
      monto_venta: round2(monto_venta),
      alicuota_aplicada: contribuyente.alicuota,
      monto_percepcion: montoPercepcion,
      fecha: new Date().toISOString(),
      origen: 'Demo',
    };

    percepcionesMemory.unshift(nueva);
    saveToStorage();

    return {
      status: 201,
      ok: true,
      data: nueva,
      origin: 'Demo',
    };
  },

  async getPercepcionesByCuit(cuit) {
    if (!validarCuit(cuit)) {
      return {
        status: 400,
        ok: false,
        data: { error: 'cuit invalido' },
        origin: 'Demo',
      };
    }

    const filtradas = percepcionesMemory.filter((p) => p.cuit === cuit);
    return {
      status: 200,
      ok: true,
      data: {
        cuit,
        cantidad: filtradas.length,
        percepciones: filtradas,
      },
      origin: 'Demo',
    };
  },

  getAllPercepciones() {
    return [...percepcionesMemory];
  },

  resetDemoData() {
    percepcionesMemory = [...INITIAL_PERCEPCIONES_DEMO];
    saveToStorage();
    return percepcionesMemory;
  },
};
