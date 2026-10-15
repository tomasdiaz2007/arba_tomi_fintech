/**
 * Vercel Serverless Function — API entry point.
 * Uses an in-memory store instead of better-sqlite3 (which requires native
 * binaries that are not available in Vercel's Lambda environment).
 */
const express = require('express');
const { validarCuit, validarMonto, validarIdVenta, round2 } = require('../src/validate');

// ─── In-memory store ────────────────────────────────────────────────────────
const PADRON = [
  { cuit: '30712345678', actividad: 'Comercio minorista',      alicuota: 0.03,  razon_social: 'Comercio Demo Uno' },
  { cuit: '27304567891', actividad: 'Servicios profesionales', alicuota: 0.02,  razon_social: 'Servicios Demo Dos' },
  { cuit: '30556789012', actividad: 'Producción de alimentos', alicuota: 0.015, razon_social: 'Alimentos Demo Tres' },
  { cuit: '20123456789', actividad: 'Librería',                alicuota: 0.03,  razon_social: 'Librería Demo Cuatro' },
  { cuit: '30678901234', actividad: 'Comercio mayorista',      alicuota: 0,     razon_social: 'Mayorista Demo Cinco' },
  { cuit: '20234567890', actividad: 'Comercio minorista',      alicuota: 0.025, razon_social: 'Lopez Maria Victoria' },
  { cuit: '27345678901', actividad: 'Servicios IT',            alicuota: 0.03,  razon_social: 'Fernandez Ana Laura' },
  { cuit: '30456789012', actividad: 'Distribución',            alicuota: 0.02,  razon_social: 'Distribuidora Norte S.R.L.' },
  { cuit: '30567890123', actividad: 'Comercio mayorista',      alicuota: 0.025, razon_social: 'Comercial del Sur S.A.' },
  { cuit: '20678901234', actividad: 'Gastronomía',             alicuota: 0.015, razon_social: 'Martinez Carlos Alberto' },
];

let percepciones = [];
let nextId = 1;

// ─── Express app ─────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());

// Health
app.get('/health', (req, res) => res.status(200).json({ status: 'ok', servicio: 'arba' }));

// GET /arba/padron
app.get('/arba/padron', (req, res) => {
  const page  = parseInt(req.query.page  || '1',  10);
  const limit = parseInt(req.query.limit || '10', 10);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    return res.status(400).json({ error: 'paginacion invalida' });
  }
  const offset = (page - 1) * limit;
  const items  = PADRON.slice(offset, offset + limit).map(({ cuit, actividad, alicuota, razon_social }) => ({
    cuit, actividad, alicuota, razon_social,
  }));
  return res.status(200).json({ page, limit, total: PADRON.length, items });
});

// GET /arba/padron/:cuit
app.get('/arba/padron/:cuit', (req, res) => {
  const { cuit } = req.params;
  if (!validarCuit(cuit)) return res.status(400).json({ error: 'cuit invalido' });
  const row = PADRON.find(r => r.cuit === cuit);
  if (!row) return res.status(404).json({ error: 'cuit no encontrado en padron' });
  return res.status(200).json({ cuit: row.cuit, actividad: row.actividad, alicuota: row.alicuota, razon_social: row.razon_social });
});

// POST /arba/percepciones
app.post('/arba/percepciones', (req, res) => {
  const { id_venta, cuit, monto_venta } = req.body || {};
  if (!validarIdVenta(id_venta))  return res.status(400).json({ error: 'id_venta invalido' });
  if (!validarCuit(cuit))         return res.status(400).json({ error: 'cuit invalido' });
  if (!validarMonto(monto_venta)) return res.status(400).json({ error: 'monto_venta invalido' });

  const existente = percepciones.find(p => p.id_venta === id_venta);
  if (existente) {
    if (existente.cuit !== cuit || Math.abs(existente.monto_venta - round2(monto_venta)) > 0.001) {
      return res.status(409).json({ error: 'id_venta ya existe con otros datos' });
    }
    return res.status(200).json(existente);
  }

  const contribuyente = PADRON.find(r => r.cuit === cuit);
  if (!contribuyente) return res.status(404).json({ error: 'cuit no encontrado en padron' });

  const nueva = {
    id:               String(nextId++),
    id_venta,
    cuit,
    monto_venta:      round2(monto_venta),
    alicuota_aplicada: contribuyente.alicuota,
    monto_percepcion: round2(monto_venta * contribuyente.alicuota),
    fecha:            new Date().toISOString(),
  };
  percepciones.unshift(nueva);
  return res.status(201).json(nueva);
});

// GET /arba/percepciones/:cuit
app.get('/arba/percepciones/:cuit', (req, res) => {
  const { cuit } = req.params;
  if (!validarCuit(cuit)) return res.status(400).json({ error: 'cuit invalido' });
  const filtradas = percepciones.filter(p => p.cuit === cuit);
  return res.status(200).json({ cuit, cantidad: filtradas.length, percepciones: filtradas });
});

// 404 catch-all
app.use((req, res) => res.status(404).json({ error: 'no encontrado' }));

module.exports = app;
