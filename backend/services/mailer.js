// ════════════════════════════════════════════════════════════════════════════
//  services/mailer.js  —  Emails simulés (mode démonstration)
// ════════════════════════════════════════════════════════════════════════════
//
//  En production, remplacer par la vraie implémentation Nodemailer.
//  Pour la démo, les emails sont simulés dans le terminal.
// ────────────────────────────────────────────────────────────────────────────

async function mailConfirmationReservation(r) {
  console.log(`📧  Email → ${r.email} : Confirmation réservation du ${r.date_resa} à ${r.heure_resa}`);
}

async function mailAdminNouvelleReservation(r) {
  console.log(`🔔  Admin : Nouvelle réservation de ${r.nom} (${r.nb_personnes} pers.) le ${r.date_resa}`);
}

async function mailConfirmationContact(c) {
  console.log(`📧  Email → ${c.email} : Confirmation réception message`);
}

async function mailAdminNouveauMessage(c) {
  console.log(`🔔  Admin : Nouveau message de ${c.nom} — ${c.objet || "sans objet"}`);
}

module.exports = {
  mailConfirmationReservation,
  mailAdminNouvelleReservation,
  mailConfirmationContact,
  mailAdminNouveauMessage,
};