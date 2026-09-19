// ════════════════════════════════════════════════════════════════════════════
//  routes/reservations.js  —  Réservations de table
// ════════════════════════════════════════════════════════════════════════════
//
//  POST /api/reservations  → créer + envoyer emails de confirmation
//  GET  /api/reservations  → lister toutes les réservations
// ────────────────────────────────────────────────────────────────────────────

const express  = require("express");
const router   = express.Router();
const { pool } = require("../db");
const {
  mailConfirmationReservation,
  mailAdminNouvelleReservation,
} = require("../services/mailer");


// ── POST /api/reservations ──────────────────────────────────────────────────

router.post("/", async (req, res) => {
  const { nom, email, telephone, occasion, note } = req.body;

  // Accepte "date" ou "date_resa", "heure" ou "heure_resa"
  const dateResa    = req.body.date       || req.body.date_resa;
  const heureResa   = req.body.heure      || req.body.heure_resa;
  const nbPersonnes = req.body.nb_personnes;

  // Validation champs obligatoires
  if (!nom || !email || !telephone || !dateResa || !heureResa || !nbPersonnes) {
    return res.status(400).json({
      ok: false,
      erreur: "Champs obligatoires manquants : nom, email, telephone, date, heure, nb_personnes.",
    });
  }

  // Validation nombre de personnes
  const nb = parseInt(nbPersonnes);
  if (isNaN(nb) || nb < 1 || nb > 20) {
    return res.status(400).json({ ok: false, erreur: "Nombre de personnes invalide (1-20)." });
  }

  // Validation date (pas dans le passé)
  const today = new Date().toISOString().split("T")[0];
  if (dateResa < today) {
    return res.status(400).json({ ok: false, erreur: "La date ne peut pas être dans le passé." });
  }

  try {
    const result = await pool.query(
      `INSERT INTO reservations (nom, email, telephone, date_resa, heure_resa, nb_personnes, occasion, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [nom.trim(), email.trim().toLowerCase(), telephone.trim(), dateResa, heureResa, nb, occasion || null, note || null]
    );

    const reservation = result.rows[0];

    // Envoi des 2 emails en parallèle
    Promise.all([
      mailConfirmationReservation(reservation),  // au client
      mailAdminNouvelleReservation(reservation), // à l'admin
    ]);

    res.status(201).json({ ok: true, reservation });

  } catch (err) {
    console.error("Erreur POST /api/reservations :", err.message);
    res.status(500).json({ ok: false, erreur: "Erreur serveur." });
  }
});


// ── GET /api/reservations ───────────────────────────────────────────────────

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM reservations ORDER BY date_resa ASC, heure_resa ASC"
    );
    res.json({ ok: true, reservations: result.rows });
  } catch (err) {
    console.error("Erreur GET /api/reservations :", err.message);
    res.status(500).json({ ok: false, erreur: "Erreur serveur." });
  }
});


module.exports = router;
