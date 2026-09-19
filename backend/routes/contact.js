// ════════════════════════════════════════════════════════════════════════════
//  routes/contact.js  —  Messages envoyés depuis la page Contact
// ════════════════════════════════════════════════════════════════════════════
//
//  POST /api/contact  → enregistre le message + envoie 2 emails automatiques
//  GET  /api/contact  → liste tous les messages
// ────────────────────────────────────────────────────────────────────────────

const express  = require("express");
const router   = express.Router();
const { pool } = require("../db");
const {
  mailConfirmationContact,
  mailAdminNouveauMessage,
} = require("../services/mailer");


// ── POST /api/contact ───────────────────────────────────────────────────────

router.post("/", async (req, res) => {
  const { nom, email, telephone, objet, message } = req.body;

  if (!nom || !email || !message) {
    return res.status(400).json({
      ok: false,
      erreur: "Champs obligatoires manquants : nom, email, message.",
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO contacts (nom, email, telephone, objet, message)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [nom.trim(), email.trim().toLowerCase(), telephone || null, objet || null, message.trim()]
    );

    const contact = result.rows[0];

    // Emails envoyés en parallèle (sans bloquer la réponse HTTP)
    // Promise.all attend les deux emails en même temps → plus rapide
    Promise.all([
      mailConfirmationContact(contact),   // au client : "on a reçu ton message"
      mailAdminNouveauMessage(contact),   // à l'admin : "nouveau message reçu"
    ]);

    res.status(201).json({ ok: true, contact });

  } catch (err) {
    console.error("Erreur POST /api/contact :", err.message);
    res.status(500).json({ ok: false, erreur: "Erreur serveur." });
  }
});


// ── GET /api/contact ────────────────────────────────────────────────────────

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM contacts ORDER BY cree_le DESC");
    res.json({ ok: true, messages: result.rows });
  } catch (err) {
    console.error("Erreur GET /api/contact :", err.message);
    res.status(500).json({ ok: false, erreur: "Erreur serveur." });
  }
});


module.exports = router;
