// ════════════════════════════════════════════════════════════════════════════
//  routes/galerie.js  —  Galerie publique (sans authentification)
// ════════════════════════════════════════════════════════════════════════════
//
//  GET /api/galerie  → toutes les photos de la galerie (pour galerie.html)
// ────────────────────────────────────────────────────────────────────────────

const express  = require("express");
const router   = express.Router();
const { pool } = require("../db");


// ── GET /api/galerie ────────────────────────────────────────────────────────

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, image_url, legende FROM galerie ORDER BY ordre ASC, cree_le DESC"
    );
    res.json({ ok: true, photos: result.rows });
  } catch (err) {
    console.error("Erreur GET /api/galerie :", err.message);
    res.status(500).json({ ok: false, erreur: "Erreur serveur." });
  }
});


module.exports = router;
