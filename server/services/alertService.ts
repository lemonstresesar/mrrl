import { store } from '../data/store';
import { Alerte, AlerteNiveau, AlerteType, JournalSMS } from '../data/types';

// Configuration dynamique du transporteur Nodemailer
let mailTransporter: any = null;

async function getTransporter() {
  if (mailTransporter) return mailTransporter;
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const nodemailer = await import('nodemailer');
      mailTransporter = nodemailer.default.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } catch (err) {
      console.warn('[MAIL] Erreur d\'initialisation du transporteur SMTP :', err);
    }
  }
  return mailTransporter;
}

/**
 * Envoie un email réel ou journalise si non configuré
 */
export async function sendEmailNotification(to: string, subject: string, text: string, html?: string): Promise<boolean> {
  const transporter = await getTransporter();
  if (!transporter) {
    // Mode démonstration / fallback console
    console.log(`[EMAIL DISPATCH SIMULÉ] Vers: ${to} | Sujet: ${subject}`);
    return true;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'alertes-ressources@hgd-douala.cm',
      to,
      subject,
      text,
      html: html || `<p>${text}</p>`,
    });
    return true;
  } catch (error) {
    console.error('[EMAIL ERROR] Échec d\'envoi email SMTP:', error);
    return false;
  }
}

/**
 * Enregistre un SMS dans le journal des SMS simulés
 */
export function recordSimulatedSMS(destinataireNom: string, telephone: string, typeAlerte: string, message: string): JournalSMS {
  const nextId = store.getNextId(store.journalSMS);
  const sms: JournalSMS = {
    id: nextId,
    destinataire_nom: destinataireNom,
    telephone,
    type_alerte: typeAlerte,
    message,
    statut_envoi: 'SIMULÉ_OK',
    date_envoi: new Date().toISOString(),
  };
  store.journalSMS.unshift(sms);
  return sms;
}

/**
 * Crée ou actualise une alerte dans le système (en évitant les doublons non lus identiques)
 */
function pushAlert(type: AlerteType, niveau: AlerteNiveau, titre: string, message: string, entiteType: string, entiteId: number) {
  const exists = store.alertes.find(
    (a) => a.type === type && a.entite_type === entiteType && a.entite_id === entiteId && !a.est_lu
  );
  if (exists) return; // Déjà signalée et non lue

  const nextId = store.getNextId(store.alertes);
  const alerte: Alerte = {
    id: nextId,
    type,
    niveau,
    titre,
    message,
    entite_type: entiteType,
    entite_id: entiteId,
    est_lu: false,
    created_at: new Date().toISOString(),
  };
  store.alertes.unshift(alerte);
}

/**
 * Scan complet des alertes (Stock bas, péremptions 30j/90j, retards maintenance, hors service)
 */
export function runAlertScan(): { count: number; scannedAt: string } {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const seuilLoinJours = Number(store.parametres.get('seuil_peremption_lointaine_jours')?.valeur) || 90;
  const seuilUrgentJours = Number(store.parametres.get('seuil_peremption_urgente_jours')?.valeur) || 30;

  const msInDay = 1000 * 60 * 60 * 24;

  let newAlertCount = 0;

  // 1. SCAN DES STOCKS BAS
  for (const produit of store.produits) {
    const totalDispo = store.lots
      .filter((l) => l.produit_id === produit.id && l.statut === 'actif' && l.date_peremption >= todayStr)
      .reduce((sum, l) => sum + l.quantite_restante, 0);

    if (totalDispo < produit.seuil_alerte) {
      pushAlert(
        'stock_bas',
        'critique',
        `Stock critique : ${produit.designation}`,
        `Le stock utilisable actuel est de ${totalDispo} ${produit.unite_mesure} (seuil d'alerte configuré à ${produit.seuil_alerte}). Risque immédiat de rupture.`,
        'produit',
        produit.id
      );
      recordSimulatedSMS(
        'Direction Logistique & Pharmacie HGD',
        '+237 677 22 33 44',
        'STOCK_CRITIQUE',
        `[HGD ALERT] Stock critique pour ${produit.designation}: ${totalDispo} restants (seuil ${produit.seuil_alerte}). Réapprovisionnement requis.`
      );
      newAlertCount++;
    }
  }

  // 2. SCAN DES PÉREMPTIONS DE LOTS
  for (const lot of store.lots) {
    if (lot.quantite_restante <= 0) continue;

    const expiryDate = new Date(lot.date_peremption);
    const diffDays = Math.ceil((expiryDate.getTime() - now.getTime()) / msInDay);
    const produit = store.produits.find((p) => p.id === lot.produit_id);
    const prodName = produit ? produit.designation : `Produit #${lot.produit_id}`;

    if (diffDays < 0 || lot.statut === 'perime') {
      lot.statut = 'perime';
      pushAlert(
        'peremption_atteinte',
        'critique',
        `Lot périmé : ${prodName}`,
        `Le lot ${lot.numero_lot} de ${prodName} est périmé depuis le ${lot.date_peremption} (${lot.quantite_restante} unités). Ce lot est automatiquement bloqué pour toute sortie.`,
        'lot',
        lot.id
      );
      newAlertCount++;
    } else if (diffDays <= seuilUrgentJours) {
      pushAlert(
        'peremption_proche',
        'critique',
        `Péremption imminente (< ${seuilUrgentJours}j) : ${prodName}`,
        `Le lot ${lot.numero_lot} expire dans ${diffDays} jour(s) le ${lot.date_peremption}. Quantité restante : ${lot.quantite_restante}. Priorité de sortie FEFO absolue.`,
        'lot',
        lot.id
      );
      recordSimulatedSMS(
        'Pharmacie Centrale HGD',
        '+237 691 45 67 89',
        'PEREMPTION_IMMINENTE',
        `[HGD FEFO] Lot ${lot.numero_lot} (${prodName}) expire le ${lot.date_peremption} (${diffDays}j restants).`
      );
      newAlertCount++;
    } else if (diffDays <= seuilLoinJours) {
      pushAlert(
        'peremption_proche',
        'avertissement',
        `Péremption précoce (< ${seuilLoinJours}j) : ${prodName}`,
        `Le lot ${lot.numero_lot} expire dans ${diffDays} jours (${lot.date_peremption}). À surveiller.`,
        'lot',
        lot.id
      );
      newAlertCount++;
    }
  }

  // 3. SCAN DES RETARDS DE MAINTENANCE
  for (const maint of store.maintenances) {
    if (maint.statut !== 'terminee' && maint.statut !== 'annulee') {
      if (maint.date_planifiee < todayStr) {
        maint.statut = 'en_retard';
        const equipement = store.equipements.find((e) => e.id === maint.equipement_id);
        const eqNom = equipement ? equipement.nom : `Équipement #${maint.equipement_id}`;

        pushAlert(
          'maintenance_retard',
          'critique',
          `Maintenance en retard : ${eqNom}`,
          `L'intervention ${maint.type} #${maint.id} prévue le ${maint.date_planifiee} pour "${eqNom}" est en retard. Priorité : ${maint.priorite}.`,
          'maintenance',
          maint.id
        );
        recordSimulatedSMS(
          'Service Biomédical & Maintenance HGD',
          '+237 670 98 76 54',
          'RETARD_MAINTENANCE',
          `[HGD BIOMED] Retard intervention sur ${eqNom} (prévue le ${maint.date_planifiee}).`
        );
        newAlertCount++;
      }
    }
  }

  // 4. SCAN DES ÉQUIPEMENTS HORS SERVICE
  for (const eq of store.equipements) {
    if (eq.statut === 'hors_service') {
      pushAlert(
        'equipement_panne',
        'critique',
        `Équipement hors service : ${eq.nom}`,
        `L'équipement ${eq.code_inventaire} (${eq.nom}) dans la salle "${eq.salle}" est indisponible suite à une panne.`,
        'equipement',
        eq.id
      );
      newAlertCount++;
    }
  }

  return { count: newAlertCount, scannedAt: new Date().toISOString() };
}

/**
 * Démarre le planificateur automatique node-cron
 */
export async function initAlertScheduler() {
  // Lancer un premier scan au démarrage
  runAlertScan();

  // En environnement serverless (Netlify, AWS Lambda), pas de tâche de fond cron persistante
  if (process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return;
  }

  try {
    const cron = await import('node-cron');
    cron.default.schedule('*/15 * * * *', () => {
      try {
        console.log('[NODE-CRON] Exécution de la vérification planifiée des alertes HGD...');
        runAlertScan();
      } catch (err) {
        console.error('[NODE-CRON] Erreur lors du scan d\'alertes :', err);
      }
    });

    console.log('[NODE-CRON] Planificateur d\'alertes médicales HGD initialisé avec succès.');
  } catch (err) {
    console.warn('[NODE-CRON] Exécution du planificateur ignorée en environnement serverless.');
  }
}
