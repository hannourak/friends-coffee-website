// ════════════════════════════════════════════════════════════════════════════
//  routes/menu.js  —  Menu public (accessible sans authentification)
// ════════════════════════════════════════════════════════════════════════════
//
//  GET /api/menu             → tous les items disponibles (groupés par catégorie)
//  GET /api/menu/:categorie  → items d'une catégorie précise
// ────────────────────────────────────────────────────────────────────────────

const express  = require("express");
const router   = express.Router();
const { pool } = require("../db");


// ── GET /api/menu ───────────────────────────────────────────────────────────
//
//  Retourne les items disponibles groupés par catégorie.
//  Utilisé par menu.html pour afficher le menu dynamiquement.
//
//  Réponse :
//  {
//    ok: true,
//    categories: ["Cafés", "Cocktails", "Desserts", ...],
//    menu: { "Cafés": [...], "Cocktails": [...] }
//  }

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM menu WHERE disponible = true ORDER BY categorie, ordre ASC"
    );

    // Groupement des items par catégorie
    const grouped = {};
    const categories = [];

    result.rows.forEach((item) => {
      if (!grouped[item.categorie]) {
        grouped[item.categorie] = [];
        categories.push(item.categorie);
      }
      grouped[item.categorie].push(item);
    });

    res.json({ ok: true, categories, menu: grouped });

  } catch (err) {
    console.error("Erreur GET /api/menu :", err.message);
    res.status(500).json({ ok: false, erreur: "Erreur serveur." });
  }
});


// ── GET /api/menu/:categorie ────────────────────────────────────────────────
//
//  Retourne uniquement les items d'une catégorie.
//  Exemple : GET /api/menu/Cafés

router.get("/:categorie", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM menu WHERE categorie = $1 AND disponible = true ORDER BY ordre ASC",
      [req.params.categorie]
    );
    res.json({ ok: true, items: result.rows });
  } catch (err) {
    console.error("Erreur GET /api/menu/:categorie :", err.message);
    res.status(500).json({ ok: false, erreur: "Erreur serveur." });
  }
});


module.exports = router;
