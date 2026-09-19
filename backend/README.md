# ☕ Friends Coffee Tozeur — Backend v2.0

API REST complète pour le site web Friends Coffee Tozeur.  
**Stack : Node.js · Express · PostgreSQL · JWT · Nodemailer · Multer**

---

## 📁 Structure complète du projet

```
friends-coffee-backend/
│
├── server.js                  ← Serveur principal Express
├── db.js                      ← Connexion PostgreSQL (Pool)
├── package.json               ← Dépendances npm
├── .env.example               ← Modèle de configuration
├── .gitignore
│
├── routes/
│   ├── contact.js             ← POST /api/contact (+ emails auto)
│   ├── reservations.js        ← POST /api/reservations (+ emails auto)
│   ├── menu.js                ← GET /api/menu (public)
│   ├── galerie.js             ← GET /api/galerie (public)
│   └── admin.js               ← Toutes les routes admin (JWT)
│
├── middleware/
│   ├── auth.js                ← Vérification JWT
│   └── upload.js              ← Upload d'images (Multer)
│
├── services/
│   └── mailer.js              ← Envoi d'emails (Nodemailer)
│
├── uploads/
│   ├── menu/                  ← Images des plats (créé automatiquement)
│   └── galerie/               ← Photos de la galerie (créé automatiquement)
│
└── sql/
    └── schema.sql             ← Création des 4 tables
```

---

## 🚀 Installation en 5 étapes

```bash
# 1. Installer les dépendances
npm install

# 2. Copier et configurer l'environnement
cp .env.example .env
# → Éditer .env avec vos valeurs (DB, email, JWT)

# 3. Créer la base de données
createdb friends_coffee

# 4. Créer les tables (+ données de démo pour le menu)
psql -d friends_coffee -f sql/schema.sql

# 5. Démarrer
npm run dev      # développement (nodemon)
npm start        # production
```

Serveur disponible → **http://localhost:3000**

---

## 🔌 Toutes les routes de l'API

### Public (sans authentification)

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | /api/health | Vérification serveur |
| POST | /api/contact | Envoyer un message |
| POST | /api/reservations | Créer une réservation |
| GET | /api/menu | Menu complet groupé par catégorie |
| GET | /api/menu/:categorie | Items d'une catégorie |
| GET | /api/galerie | Toutes les photos |

### Admin — connexion

| Méthode | URL | Body |
|---------|-----|------|
| POST | /api/admin/login | `{ email, motDePasse }` → retourne `{ token }` |

### Admin — protégé *(Header : `Authorization: Bearer <token>`)*

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | /api/admin/stats | Chiffres du dashboard |
| GET | /api/admin/messages | Messages + stats |
| PATCH | /api/admin/messages/:id | Basculer lu/non lu |
| DELETE | /api/admin/messages/:id | Supprimer |
| GET | /api/admin/reservations | Réservations + stats |
| PATCH | /api/admin/reservations/:id | Changer statut |
| DELETE | /api/admin/reservations/:id | Supprimer |
| GET | /api/admin/menu | Tous les items |
| POST | /api/admin/menu | Ajouter item (multipart) |
| PATCH | /api/admin/menu/:id | Modifier item |
| DELETE | /api/admin/menu/:id | Supprimer item + image |
| GET | /api/admin/galerie | Toutes les photos |
| POST | /api/admin/galerie | Uploader une photo |
| PATCH | /api/admin/galerie/:id | Modifier légende/ordre |
| DELETE | /api/admin/galerie/:id | Supprimer photo + fichier |

---

## 📧 Configuration email (Gmail)

1. Aller sur votre compte Google → **Sécurité**
2. Activer la **validation en 2 étapes**
3. Chercher **"Mots de passe d'application"**
4. Créer un mot de passe pour "Autre application"
5. Copier ce mot de passe dans `.env` → `MAIL_PASS`

---

## 🔑 Comment fonctionne l'authentification JWT

**Avant (v1) :** mot de passe envoyé dans le header à chaque requête → peu sécurisé  
**Maintenant (v2) :** système par token

```
1. POST /api/admin/login  →  envoie email + mot de passe
2. Serveur vérifie → génère un token signé valable 8h
3. Frontend stocke le token (sessionStorage)
4. Toutes les requêtes admin incluent : Authorization: Bearer <token>
5. Serveur vérifie la signature du token → accès accordé
```

**Mise à jour nécessaire dans admin.html :**
```javascript
// Remplacer l'ancien header :
// "x-admin-password": motDePasse

// Par le nouveau :
"Authorization": "Bearer " + sessionStorage.getItem("adminToken")
```

---

## 🗃️ Tables de la base de données

| Table | Description | Colonnes principales |
|-------|-------------|----------------------|
| contacts | Messages contact | nom, email, message, lu |
| reservations | Réservations | date_resa, heure_resa, statut |
| menu | Items du menu | nom, categorie, prix, image_url, disponible |
| galerie | Photos | image_url, legende, ordre |
