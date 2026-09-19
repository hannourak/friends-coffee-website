// ════════════════════════════════════════════════════════════════════════════
//  server.js  —  Point d'entrée principal — Friends Coffee Tozeur v2
// ════════════════════════════════════════════════════════════════════════════
//
//  Ce fichier :
//    1. Charge les variables d'environnement (.env)
//    2. Configure Express avec les middlewares nécessaires
//    3. Sert les fichiers statiques (frontend HTML/CSS/JS/images)
//    4. Sert les images uploadées (menu et galerie)
//    5. Branche toutes les routes API
//    6. Démarre le serveur sur le port configuré
//
//  Architecture des routes :
//    /api/contact        → messages du formulaire contact
//    /api/reservations   → réservations de table
//    /api/menu           → menu public (sans auth)
//    /api/galerie        → galerie publique (sans auth)
//    /api/admin/*        → toutes les routes admin (protégées JWT)
// ────────────────────────────────────────────────────────────────────────────

require("dotenv").config(); // ← doit être en premier pour charger le .env

const express = require("express");
const cors    = require("cors");
const path    = require("path");

const app = express();


// ── 1. MIDDLEWARES GLOBAUX ──────────────────────────────────────────────────

// CORS : autorise le frontend (autre port en dev) à appeler l'API
app.use(cors({
  origin:  process.env.FRONTEND_URL || "*",
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"], // Authorization pour JWT
}));

// Lecture du body JSON (requêtes POST/PATCH)
app.use(express.json());

// Lecture des formulaires HTML classiques (urlencoded)
app.use(express.urlencoded({ extended: true }));


// ── 2. FICHIERS STATIQUES ───────────────────────────────────────────────────

// Sert les fichiers du frontend (HTML, CSS, JS, images du code source)
// Placez vos fichiers .html dans le dossier "public/"
app.use(express.static(path.join(__dirname, "public")));

// Sert les images uploadées par l'admin (menu et galerie)
// Ex: http://localhost:3000/uploads/menu/photo.jpg
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// ── 3. ROUTES API ───────────────────────────────────────────────────────────

app.use("/api/contact",      require("./routes/contact"));
app.use("/api/reservations", require("./routes/reservations"));
app.use("/api/menu",         require("./routes/menu"));
app.use("/api/galerie",      require("./routes/galerie"));
app.use("/api/admin",        require("./routes/admin"));


// ── 4. ROUTE DE SANTÉ ───────────────────────────────────────────────────────
//  Permet de vérifier rapidement que le serveur tourne.
//  Utile aussi pour les présentations de soutenance :)

app.get("/api/health", (req, res) => {
  res.json({
    ok:       true,
    service:  "Friends Coffee API",
    version:  "2.0.0",
    heure:    new Date().toLocaleString("fr-FR"),
  });
});


// ── 5. GESTION DES ERREURS 404 ──────────────────────────────────────────────
//  Si aucune route ne correspond, on retourne une erreur 404 propre.

app.use((req, res) => {
  res.status(404).json({ ok: false, erreur: `Route "${req.method} ${req.path}" introuvable.` });
});


// ── 6. DÉMARRAGE ────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("");
  console.log("  ☕  Friends Coffee Tozeur — Backend v2.0");
  console.log(`  ✅  Serveur démarré → http://localhost:${PORT}`);
  console.log(`  🔑  Admin          → POST http://localhost:${PORT}/api/admin/login`);
  console.log(`  💚  Santé          → http://localhost:${PORT}/api/health`);
  console.log("");
});
