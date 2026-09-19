// ════════════════════════════════════════════════════════════════════════════
//  middleware/upload.js  —  Upload de fichiers avec Multer
// ════════════════════════════════════════════════════════════════════════════
//
//  Multer intercepte les requêtes multipart/form-data (upload de fichiers).
//  On configure deux "destinations" séparées :
//    - uploadMenu    → images des plats du menu   → /uploads/menu/
//    - uploadGalerie → photos de la galerie        → /uploads/galerie/
//
//  Chaque fichier reçoit un nom unique basé sur le timestamp + nom original
//  pour éviter les collisions si deux fichiers ont le même nom.
// ────────────────────────────────────────────────────────────────────────────

const multer = require("multer");
const path   = require("path");
const fs     = require("fs");

// ── Crée les dossiers s'ils n'existent pas ─────────────────────────────────
const UPLOAD_DIRS = {
  menu:    path.join(__dirname, "../uploads/menu"),
  galerie: path.join(__dirname, "../uploads/galerie"),
};

Object.values(UPLOAD_DIRS).forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});


// ── Filtre : accepte uniquement les images ─────────────────────────────────
function filtreImages(req, file, cb) {
  const typesAcceptes = /jpeg|jpg|png|gif|webp/;
  const ext  = typesAcceptes.test(path.extname(file.originalname).toLowerCase());
  const mime = typesAcceptes.test(file.mimetype);

  if (ext && mime) {
    cb(null, true);  // ✅ accepté
  } else {
    cb(new Error("Seuls les fichiers image sont acceptés (jpg, png, gif, webp)."));
  }
}


// ── Fabrique de storage Multer ─────────────────────────────────────────────
//
//  Génère un storage configuré pour un dossier donné.
//  Exemple de nom de fichier généré : "1703001234567-photo-cafe.jpg"

function creerStorage(dossier) {
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIRS[dossier]),
    filename: (req, file, cb) => {
      const nomUnique = `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
      cb(null, nomUnique);
    },
  });
}


// ── Instances Multer ───────────────────────────────────────────────────────

const uploadMenu = multer({
  storage:  creerStorage("menu"),
  fileFilter: filtreImages,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo max
});

const uploadGalerie = multer({
  storage:  creerStorage("galerie"),
  fileFilter: filtreImages,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 Mo max
});


module.exports = { uploadMenu, uploadGalerie };
