const express = require('express');
const { validarCuit } = require('../validate');
const { publicPadron } = require('../db');

const router = express.Router();

// GET /arba/padron?page=1&limit=10
router.get('/', (req, res) => {
  const page = Number.parseInt(req.query.page || '1', 10);
  const limit = Number.parseInt(req.query.limit || '10', 10);

  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    return res.status(400).json({ error: 'paginacion invalida' });
  }

  const db = req.app.locals.db;
  const total = db.prepare('SELECT COUNT(*) AS total FROM padron').get().total;
  const rows = db.prepare(
    'SELECT cuit, actividad, alicuota FROM padron ORDER BY cuit LIMIT ? OFFSET ?'
  ).all(limit, (page - 1) * limit);

  return res.status(200).json({
    page,
    limit,
    total,
    items: rows.map(publicPadron)
  });
});

// GET /arba/padron/{cuit}
router.get('/:cuit', (req, res) => {
  const { cuit } = req.params;
  if (!validarCuit(cuit)) return res.status(400).json({ error: 'cuit invalido' });

  const row = req.app.locals.db
    .prepare('SELECT cuit, actividad, alicuota FROM padron WHERE cuit = ?')
    .get(cuit);

  if (!row) return res.status(404).json({ error: 'cuit no encontrado en padron' });
  return res.status(200).json(publicPadron(row));
});

module.exports = router;
