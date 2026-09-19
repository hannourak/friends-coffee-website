-- ════════════════════════════════════════════════════════════════════════════
--  sql/schema.sql  —  Schéma complet de la base de données
--  Friends Coffee Tozeur v2
-- ════════════════════════════════════════════════════════════════════════════
--
--  Pour créer la base et appliquer ce schéma :
--    createdb friends_coffee
--    psql -d friends_coffee -f sql/schema.sql
-- ────────────────────────────────────────────────────────────────────────────


-- ── TABLE : contacts ────────────────────────────────────────────────────────
--  Messages envoyés depuis la page Contact.

CREATE TABLE IF NOT EXISTS contacts (
  id         SERIAL PRIMARY KEY,
  nom        VARCHAR(120)  NOT NULL,
  email      VARCHAR(255)  NOT NULL,
  telephone  VARCHAR(30),
  objet      VARCHAR(200),
  message    TEXT          NOT NULL,
  lu         BOOLEAN       NOT NULL DEFAULT false,
  cree_le    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);


-- ── TABLE : reservations ────────────────────────────────────────────────────
--  Demandes de réservation de table.

CREATE TABLE IF NOT EXISTS reservations (
  id           SERIAL PRIMARY KEY,
  nom          VARCHAR(120)  NOT NULL,
  email        VARCHAR(255)  NOT NULL,
  telephone    VARCHAR(30)   NOT NULL,
  date_resa    DATE          NOT NULL,
  heure_resa   TIME          NOT NULL,
  nb_personnes SMALLINT      NOT NULL CHECK (nb_personnes BETWEEN 1 AND 20),
  occasion     VARCHAR(100),
  note         TEXT,
  statut       VARCHAR(20)   NOT NULL DEFAULT 'en attente'
                             CHECK (statut IN ('en attente', 'confirmé', 'annulé')),
  cree_le      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);


-- ── TABLE : menu ────────────────────────────────────────────────────────────
--  Items du menu (cafés, boissons, plats, desserts…).
--  Géré depuis l'interface admin, affiché sur menu.html.

CREATE TABLE IF NOT EXISTS menu (
  id          SERIAL PRIMARY KEY,
  nom         VARCHAR(150)   NOT NULL,
  categorie   VARCHAR(80)    NOT NULL,     -- ex: "Cafés", "Cocktails", "Desserts"
  description TEXT,                        -- description optionnelle du plat
  prix        NUMERIC(8,3)   NOT NULL,     -- prix en TND (ex: 7.500)
  image_url   VARCHAR(300),               -- chemin vers /uploads/menu/...
  ordre       SMALLINT       NOT NULL DEFAULT 0,  -- pour trier les items dans une catégorie
  disponible  BOOLEAN        NOT NULL DEFAULT true, -- false = caché du menu public
  cree_le     TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);


-- ── TABLE : galerie ──────────────────────────────────────────────────────────
--  Photos de la galerie, uploadées depuis l'admin.

CREATE TABLE IF NOT EXISTS galerie (
  id        SERIAL PRIMARY KEY,
  image_url VARCHAR(300) NOT NULL,   -- chemin vers /uploads/galerie/...
  legende   VARCHAR(200),            -- texte optionnel sous la photo
  ordre     SMALLINT     NOT NULL DEFAULT 0,
  cree_le   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


-- ── INDEX (performances) ────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_contacts_cree_le      ON contacts     (cree_le DESC);
CREATE INDEX IF NOT EXISTS idx_reservations_date     ON reservations (date_resa ASC, heure_resa ASC);
CREATE INDEX IF NOT EXISTS idx_reservations_statut   ON reservations (statut);
CREATE INDEX IF NOT EXISTS idx_menu_categorie        ON menu         (categorie, ordre);
CREATE INDEX IF NOT EXISTS idx_galerie_ordre         ON galerie      (ordre ASC);


-- ── Données de démonstration pour le menu ───────────────────────────────────
--  Quelques items pour tester l'application dès l'installation.
--  Supprimez ce bloc si vous préférez partir de zéro.

INSERT INTO menu (nom, categorie, prix, ordre) VALUES
  ('Expresso',        'Cafés',     2.500, 1),
  ('Café au lait',    'Cafés',     3.000, 2),
  ('Café Turc',       'Cafés',     2.500, 3),
  ('Nespresso',       'Cafés',     3.500, 4),
  ('Iced Coffee',     'Cafés',     5.000, 5),
  ('Thé à la menthe', 'Thés',     2.500, 1),
  ('Thé vert',        'Thés',     2.500, 2),
  ('Jus d''orange',   'Jus',      5.000, 1),
  ('Jus de citron',   'Jus',      5.000, 2),
  ('Smoothie fruits', 'Jus',      7.000, 3),
  ('Crêpe Nutella',   'Crêpes',   6.000, 1),
  ('Crêpe banane',    'Crêpes',   6.000, 2),
  ('Tiramisu',        'Desserts', 8.000, 1),
  ('Cheesecake',      'Desserts', 8.000, 2)
ON CONFLICT DO NOTHING;


-- ── Message de confirmation ──────────────────────────────────────────────────
DO $$ BEGIN
  RAISE NOTICE '✅  Schéma Friends Coffee v2 créé avec succès (contacts, reservations, menu, galerie).';
END $$;
