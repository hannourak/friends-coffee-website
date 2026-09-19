// ════════════════════════════════════════════════════════════════════════════
//  db.js  —  Connexion PostgreSQL avec Pool
// ════════════════════════════════════════════════════════════════════════════
//
//  Pool = gestionnaire de connexions réutilisables.
//  Au lieu d'ouvrir/fermer une connexion à chaque requête SQL,
//  le Pool garde un groupe de connexions ouvertes en permanence → plus rapide.
// ────────────────────────────────────────────────────────────────────────────

const { Pool } = require("pg");

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

// Test de connexion au démarrage
pool.connect((err, client, release) => {
  if (err) {
    console.error("❌  PostgreSQL — erreur de connexion :", err.message);
  } else {
    console.log("🐘  PostgreSQL connecté avec succès");
    release();
  }
});

module.exports = { pool };
