// ════════════════════════════════════════════════════════════════════════════
//  routes/admin.js  —  Tableau de bord administrateur (protégé par JWT)
// ════════════════════════════════════════════════════════════════════════════
//
//  POST   /api/admin/login                 → connexion, retourne un JWT
//
//  ── Messages ──
//  GET    /api/admin/messages              → tous les messages + stats
//  PATCH  /api/admin/messages/:id          → basculer lu/non lu
//  DELETE /api/admin/messages/:id          → supprimer
//
//  ── Réservations ──
//  GET    /api/admin/reservations          → toutes + stats
//  PATCH  /api/admin/reservations/:id      → changer statut
//  DELETE /api/admin/reservations/:id      → supprimer
//
//  ── Menu ──
//  GET    /api/admin/menu                  → tous les items du menu
//  POST   /api/admin/menu                  → ajouter un item (avec photo)
//  PATCH  /api/admin/menu/:id              → modifier un item
//  DELETE /api/admin/menu/:id              → supprimer un item
//
//  ── Galerie ──
//  GET    /api/admin/galerie               → toutes les photos
//  POST   /api/admin/galerie               → uploader une photo
//  PATCH  /api/admin/galerie/:id           → modifier légende/ordre
//  DELETE /api/admin/galerie/:id           → supprimer une photo
//
//  ── Stats dashboard ──
//  GET    /api/admin/stats                 → chiffres globaux du dashboard
// ────────────────────────────────────────────────────────────────────────────

const express        = require("express");
const router         = express.Router();
const jwt            = require("jsonwebtoken");
const { pool }       = require("../db");
const { authJWT }    = require("../middleware/auth");
const { uploadMenu, uploadGalerie } = require("../middleware/upload");
const path           = require("path");
const fs             = require("fs");


// ════════════════════════════════════════════════════════════════════════════
//  AUTHENTIFICATION
// ════════════════════════════════════════════════════════════════════════════

// ── POST /api/admin/login ───────────────────────────────────────────────────
//
//  L'admin envoie son email + mot de passe.
//  Si corrects → on génère un JWT signé valable 8h.
//  Le frontend stocke ce token (ex: localStorage) et l'envoie dans chaque requête.
//
//  Body : { "email": "admin@...", "motDePasse": "..." }
//  Réponse : { ok: true, token: "eyJ..." }

router.post("/login", (req, res) => {
  const { email, motDePasse } = req.body;

  const emailOk = email     === process.env.ADMIN_EMAIL;
  const mdpOk   = motDePasse === process.env.ADMIN_PASSWORD;

  if (!emailOk || !mdpOk) {
    return res.status(401).json({ ok: false, erreur: "Email ou mot de passe incorrect." });
  }

  // Génération du JWT
  // jwt.sign(payload, clé_secrète, options)
  // Le payload contient les infos qu'on veut encoder dans le token
  const token = jwt.sign(
    { role: "admin", email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
  );

  res.json({ ok: true, token });
});


// ════════════════════════════════════════════════════════════════════════════
//  STATS DASHBOARD
// ════════════════════════════════════════════════════════════════════════════

// ── GET /api/admin/stats ────────────────────────────────────────────────────
//
//  Retourne tous les chiffres clés pour le tableau de bord admin.
//  Utilise Promise.all pour exécuter toutes les requêtes en parallèle.

router.get("/stats", authJWT, async (req, res) => {
  try {
    const [messages, reservations, menu, galerie] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE lu = false) AS non_lus FROM contacts`),
      pool.query(`SELECT COUNT(*) AS total,
                         COUNT(*) FILTER (WHERE statut = 'en attente') AS en_attente,
                         COUNT(*) FILTER (WHERE statut = 'confirmé')   AS confirmes,
                         COUNT(*) FILTER (WHERE statut = 'annulé')     AS annules
                  FROM reservations`),
      pool.query(`SELECT COUNT(*) AS total FROM menu`),
      pool.query(`SELECT COUNT(*) AS total FROM galerie`),
    ]);

    res.json({
      ok: true,
      stats: {
        messages:     messages.rows[0],
        reservations: reservations.rows[0],
        menu:         menu.rows[0],
        galerie:      galerie.rows[0],
      },
    });
  } catch (err) {
    console.error("Erreur GET /api/admin/stats :", err.message);
    res.status(500).json({ ok: false, erreur: "Erreur serveur." });
  }
});


// ════════════════════════════════════════════════════════════════════════════
//  MESSAGES
// ════════════════════════════════════════════════════════════════════════════

router.get("/messages", authJWT, async (req, res) => {
  try {
    const [messages, stats] = await Promise.all([
      pool.query("SELECT * FROM contacts ORDER BY cree_le DESC"),
      pool.query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE lu = false) AS non_lus FROM contacts`),
    ]);
    res.json({ ok: true, messages: messages.rows, stats: stats.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, erreur: err.message });
  }
});

router.patch("/messages/:id", authJWT, async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE contacts SET lu = NOT lu WHERE id = $1 RETURNING id, lu",
      [req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ ok: false, erreur: "Message introuvable." });
    res.json({ ok: true, ...result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, erreur: err.message });
  }
});

router.delete("/messages/:id", authJWT, async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM contacts WHERE id = $1", [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ ok: false, erreur: "Message introuvable." });
    res.json({ ok: true, message: `Message #${req.params.id} supprimé.` });
  } catch (err) {
    res.status(500).json({ ok: false, erreur: err.message });
  }
});


// ════════════════════════════════════════════════════════════════════════════
//  RÉSERVATIONS
// ════════════════════════════════════════════════════════════════════════════

router.get("/reservations", authJWT, async (req, res) => {
  try {
    const [reservations, stats] = await Promise.all([
      pool.query("SELECT * FROM reservations ORDER BY date_resa ASC, heure_resa ASC"),
      pool.query(`SELECT COUNT(*) AS total,
                         COUNT(*) FILTER (WHERE statut = 'en attente') AS en_attente,
                         COUNT(*) FILTER (WHERE statut = 'confirmé')   AS confirmes,
                         COUNT(*) FILTER (WHERE statut = 'annulé')     AS annules
                  FROM reservations`),
    ]);
    res.json({ ok: true, reservations: reservations.rows, stats: stats.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, erreur: err.message });
  }
});

router.patch("/reservations/:id", authJWT, async (req, res) => {
  const { statut } = req.body;
  const VALIDES = ["en attente", "confirmé", "annulé"];
  if (!statut || !VALIDES.includes(statut)) {
    return res.status(400).json({ ok: false, erreur: "Statut invalide." });
  }
  try {
    const result = await pool.query(
      "UPDATE reservations SET statut = $1 WHERE id = $2 RETURNING id, statut",
      [statut, req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ ok: false, erreur: "Réservation introuvable." });
    res.json({ ok: true, ...result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, erreur: err.message });
  }
});

router.delete("/reservations/:id", authJWT, async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM reservations WHERE id = $1", [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ ok: false, erreur: "Réservation introuvable." });
    res.json({ ok: true, message: `Réservation #${req.params.id} supprimée.` });
  } catch (err) {
    res.status(500).json({ ok: false, erreur: err.message });
  }
});


// ════════════════════════════════════════════════════════════════════════════
//  MENU  —  Gestion des plats/boissons depuis l'admin
// ════════════════════════════════════════════════════════════════════════════

// ── GET /api/admin/menu ─────────────────────────────────────────────────────
//  Retourne tous les items du menu, groupés par catégorie.

router.get("/menu", authJWT, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM menu ORDER BY categorie, ordre ASC");
    res.json({ ok: true, menu: result.rows });
  } catch (err) {
    res.status(500).json({ ok: false, erreur: err.message });
  }
});

// ── POST /api/admin/menu ────────────────────────────────────────────────────
//  Ajoute un item avec photo optionnelle.
//  Requête : multipart/form-data (pour pouvoir envoyer une image)
//
//  Champs :
//    nom, categorie, description, prix  ← texte
//    image                              ← fichier image (optionnel)

router.post("/menu", authJWT, uploadMenu.single("image"), async (req, res) => {
  const { nom, categorie, description, prix, ordre, disponible } = req.body;

  if (!nom || !categorie || !prix) {
    return res.status(400).json({ ok: false, erreur: "nom, categorie et prix sont obligatoires." });
  }

  // Si une image a été uploadée, on construit son URL publique
  const imageUrl = req.file ? `/uploads/menu/${req.file.filename}` : null;

  try {
    const result = await pool.query(
      `INSERT INTO menu (nom, categorie, description, prix, image_url, ordre, disponible)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [nom.trim(), categorie.trim(), description || null, parseFloat(prix), imageUrl, ordre || 0, disponible !== "false"]
    );
    res.status(201).json({ ok: true, item: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, erreur: err.message });
  }
});

// ── PATCH /api/admin/menu/:id ───────────────────────────────────────────────
//  Modifie un item du menu (avec possibilité de changer la photo).

router.patch("/menu/:id", authJWT, uploadMenu.single("image"), async (req, res) => {
  const { nom, categorie, description, prix, ordre, disponible } = req.body;
  const imageUrl = req.file ? `/uploads/menu/${req.file.filename}` : undefined;

  try {
    // Construction dynamique de la requête UPDATE selon les champs fournis
    const champs = [];
    const valeurs = [];
    let i = 1;

    if (nom)         { champs.push(`nom = $${i++}`);         valeurs.push(nom.trim()); }
    if (categorie)   { champs.push(`categorie = $${i++}`);   valeurs.push(categorie.trim()); }
    if (description !== undefined) { champs.push(`description = $${i++}`); valeurs.push(description || null); }
    if (prix)        { champs.push(`prix = $${i++}`);        valeurs.push(parseFloat(prix)); }
    if (ordre !== undefined) { champs.push(`ordre = $${i++}`); valeurs.push(parseInt(ordre)); }
    if (disponible !== undefined) { champs.push(`disponible = $${i++}`); valeurs.push(disponible !== "false"); }
    if (imageUrl)    { champs.push(`image_url = $${i++}`);   valeurs.push(imageUrl); }

    if (champs.length === 0) {
      return res.status(400).json({ ok: false, erreur: "Aucun champ à modifier." });
    }

    valeurs.push(req.params.id);
    const result = await pool.query(
      `UPDATE menu SET ${champs.join(", ")} WHERE id = $${i} RETURNING *`,
      valeurs
    );

    if (result.rowCount === 0) return res.status(404).json({ ok: false, erreur: "Item introuvable." });
    res.json({ ok: true, item: result.rows[0] });

  } catch (err) {
    res.status(500).json({ ok: false, erreur: err.message });
  }
});

// ── DELETE /api/admin/menu/:id ──────────────────────────────────────────────
//  Supprime un item du menu ET son image associée du disque.

router.delete("/menu/:id", authJWT, async (req, res) => {
  try {
    // Récupère l'image avant suppression pour pouvoir l'effacer du disque
    const existing = await pool.query("SELECT image_url FROM menu WHERE id = $1", [req.params.id]);
    if (existing.rowCount === 0) return res.status(404).json({ ok: false, erreur: "Item introuvable." });

    await pool.query("DELETE FROM menu WHERE id = $1", [req.params.id]);

    // Suppression du fichier image sur le disque
    if (existing.rows[0].image_url) {
      const filePath = path.join(__dirname, "..", existing.rows[0].image_url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    res.json({ ok: true, message: `Item #${req.params.id} supprimé.` });
  } catch (err) {
    res.status(500).json({ ok: false, erreur: err.message });
  }
});


// ════════════════════════════════════════════════════════════════════════════
//  GALERIE  —  Gestion des photos depuis l'admin
// ════════════════════════════════════════════════════════════════════════════

// ── GET /api/admin/galerie ──────────────────────────────────────────────────
router.get("/galerie", authJWT, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM galerie ORDER BY ordre ASC, cree_le DESC");
    res.json({ ok: true, photos: result.rows });
  } catch (err) {
    res.status(500).json({ ok: false, erreur: err.message });
  }
});

// ── POST /api/admin/galerie ─────────────────────────────────────────────────
//  Upload une photo + légende optionnelle.

router.post("/galerie", authJWT, uploadGalerie.single("photo"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ ok: false, erreur: "Aucune photo reçue." });
  }

  const { legende, ordre } = req.body;
  const imageUrl = `/uploads/galerie/${req.file.filename}`;

  try {
    const result = await pool.query(
      `INSERT INTO galerie (image_url, legende, ordre)
       VALUES ($1, $2, $3) RETURNING *`,
      [imageUrl, legende || null, ordre || 0]
    );
    res.status(201).json({ ok: true, photo: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, erreur: err.message });
  }
});

// ── PATCH /api/admin/galerie/:id ────────────────────────────────────────────
//  Modifie la légende ou l'ordre d'une photo.

router.patch("/galerie/:id", authJWT, async (req, res) => {
  const { legende, ordre } = req.body;
  try {
    const result = await pool.query(
      `UPDATE galerie SET
         legende = COALESCE($1, legende),
         ordre   = COALESCE($2, ordre)
       WHERE id = $3 RETURNING *`,
      [legende || null, ordre !== undefined ? parseInt(ordre) : null, req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ ok: false, erreur: "Photo introuvable." });
    res.json({ ok: true, photo: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, erreur: err.message });
  }
});

// ── DELETE /api/admin/galerie/:id ───────────────────────────────────────────
//  Supprime une photo en base ET le fichier sur le disque.

router.delete("/galerie/:id", authJWT, async (req, res) => {
  try {
    const existing = await pool.query("SELECT image_url FROM galerie WHERE id = $1", [req.params.id]);
    if (existing.rowCount === 0) return res.status(404).json({ ok: false, erreur: "Photo introuvable." });

    await pool.query("DELETE FROM galerie WHERE id = $1", [req.params.id]);

    // Suppression du fichier physique
    const filePath = path.join(__dirname, "..", existing.rows[0].image_url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json({ ok: true, message: `Photo #${req.params.id} supprimée.` });
  } catch (err) {
    res.status(500).json({ ok: false, erreur: err.message });
  }
});


module.exports = router;
