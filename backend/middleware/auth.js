// ════════════════════════════════════════════════════════════════════════════
//  middleware/auth.js  —  Authentification JWT
// ════════════════════════════════════════════════════════════════════════════
//
//  JWT = JSON Web Token.
//  Principe : au lieu d'envoyer le mot de passe à chaque requête,
//  l'admin se connecte une fois → reçoit un TOKEN signé (valide 8h).
//  Il envoie ce token dans le header "Authorization" à chaque requête.
//
//  Flux complet :
//    1. POST /api/admin/login  → vérification email+mdp → retourne un JWT
//    2. Toutes les autres routes admin → vérifient le JWT avec ce middleware
//
//  Format du header : Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6...
// ────────────────────────────────────────────────────────────────────────────

const jwt = require("jsonwebtoken");

// ── Middleware de vérification du JWT ──────────────────────────────────────
//
//  S'exécute avant chaque route protégée.
//  Extrait le token du header, vérifie sa signature, décode son contenu.

function authJWT(req, res, next) {
  // Lecture du header Authorization
  const authHeader = req.headers["authorization"];

  // Format attendu : "Bearer <token>"
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      ok: false,
      erreur: "Token manquant. Veuillez vous connecter.",
    });
  }

  const token = authHeader.split(" ")[1]; // extrait la partie après "Bearer "

  try {
    // jwt.verify() décrypte ET vérifie la signature avec la clé secrète
    // Si le token est expiré ou falsifié → lève une exception
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // On attache le payload à req pour que les routes puissent l'utiliser
    req.admin = payload; // ex: { role: "admin", iat: ..., exp: ... }
    next(); // ✅ token valide → on passe à la route

  } catch (err) {
    // Token invalide ou expiré
    return res.status(401).json({
      ok: false,
      erreur: "Token invalide ou expiré. Reconnectez-vous.",
    });
  }
}

module.exports = { authJWT };
