import { Router, Response } from 'express';
import crypto from 'crypto';
import { store } from '../data/store';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { recordAudit } from '../services/auditService';
import { SortieControlee, MouvementStock } from '../data/types';

export const controlledSubstancesRouter = Router();

// 1. Registre officiel des produits contrôlés (Lecture seule pour tous les utilisateurs authentifiés)
controlledSubstancesRouter.get('/registry', authenticateToken, (_req: AuthenticatedRequest, res: Response) => {
  // Tout le registre trié par date décroissante
  const list = [...store.sortiesControlees].sort(
    (a, b) => new Date(b.date_initiation).getTime() - new Date(a.date_initiation).getTime()
  );

  const enriched = list.map((item) => {
    const produit = store.produits.find((p) => p.id === item.produit_id);
    const lot = store.lots.find((l) => l.id === item.lot_id);
    const service = store.services.find((s) => s.id === item.service_demandeur_id);
    const pharmacien = store.users.find((u) => u.id === item.pharmacien_initiateur_id);
    const logisticien = item.logisticien_validateur_id
      ? store.users.find((u) => u.id === item.logisticien_validateur_id)
      : null;

    return {
      ...item,
      produit_designation: produit?.designation || 'Produit Inconnu',
      forme_dosage: produit?.forme_dosage || '',
      unite_mesure: produit?.unite_mesure || 'ampoules',
      numero_lot: lot?.numero_lot || 'N/A',
      date_peremption_lot: lot?.date_peremption || 'N/A',
      service_demandeur_nom: service?.nom || 'Inconnu',
      pharmacien_nom: pharmacien ? `${pharmacien.prenom} ${pharmacien.nom}` : 'Pharmacien',
      logisticien_nom: logisticien ? `${logisticien.prenom} ${logisticien.nom}` : null,
    };
  });

  res.json({ registry: enriched });
});

// 2. Demandes en attente de double-validation
controlledSubstancesRouter.get('/pending', authenticateToken, (_req: AuthenticatedRequest, res: Response) => {
  const pending = store.sortiesControlees.filter((s) => s.statut === 'en_attente');

  const enriched = pending.map((item) => {
    const produit = store.produits.find((p) => p.id === item.produit_id);
    const lot = store.lots.find((l) => l.id === item.lot_id);
    const service = store.services.find((s) => s.id === item.service_demandeur_id);
    const pharmacien = store.users.find((u) => u.id === item.pharmacien_initiateur_id);

    return {
      ...item,
      produit_designation: produit?.designation || 'Produit Inconnu',
      forme_dosage: produit?.forme_dosage || '',
      unite_mesure: produit?.unite_mesure || 'ampoules',
      numero_lot: lot?.numero_lot || 'N/A',
      date_peremption_lot: lot?.date_peremption || 'N/A',
      quantite_restante_lot: lot?.quantite_restante || 0,
      service_demandeur_nom: service?.nom || 'Inconnu',
      pharmacien_nom: pharmacien ? `${pharmacien.prenom} ${pharmacien.nom}` : 'Pharmacien',
    };
  });

  res.json({ pending: enriched });
});

// 3. Initier une sortie de produit contrôlé (STRICTEMENT réservé au Pharmacien)
controlledSubstancesRouter.post('/initiate', authenticateToken, requireRole(['pharmacien', 'admin']), (req: AuthenticatedRequest, res: Response): void => {
  const {
    produit_id,
    lot_id,
    quantite,
    service_demandeur_id,
    patient_ref_anonyme,
    medecin_prescripteur,
    motif_therapeutique,
  } = req.body;

  if (
    !produit_id ||
    !quantite ||
    !service_demandeur_id ||
    !patient_ref_anonyme ||
    !medecin_prescripteur ||
    !motif_therapeutique
  ) {
    res.status(400).json({
      error: 'Tous les champs légaux sont obligatoires : produit, lot, quantité, service demandeur, référence patient anonymisée, médecin prescripteur, motif thérapeutique.',
    });
    return;
  }

  const produit = store.produits.find((p) => p.id === Number(produit_id));
  if (!produit || !produit.est_controle) {
    res.status(400).json({ error: 'Le produit sélectionné n\'est pas répertorié dans les produits contrôlés/stupéfiants.' });
    return;
  }

  // Vérifier le lot
  let selectedLot = store.lots.find((l) => l.id === Number(lot_id) && l.produit_id === produit.id);

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Si aucun lot spécifié, trouver automatiquement le premier lot conforme selon FEFO
  if (!selectedLot) {
    const validLots = store.lots
      .filter((l) => l.produit_id === produit.id && l.statut === 'actif' && l.date_peremption >= todayStr && l.quantite_restante >= Number(quantite))
      .sort((a, b) => new Date(a.date_peremption).getTime() - new Date(b.date_peremption).getTime());

    if (validLots.length === 0) {
      res.status(400).json({ error: 'Aucun lot conforme non périmé avec stock suffisant disponible pour cette demande.' });
      return;
    }
    selectedLot = validLots[0];
  }

  if (selectedLot.statut === 'perime' || selectedLot.date_peremption < todayStr) {
    res.status(400).json({ error: `RÈGLE FEFO : Le lot ${selectedLot.numero_lot} est périmé. Impossible d'initier une sortie.` });
    return;
  }

  if (selectedLot.quantite_restante < Number(quantite)) {
    res.status(400).json({
      error: `Stock insuffisant sur le lot ${selectedLot.numero_lot} (restant: ${selectedLot.quantite_restante}, demandé: ${quantite}).`,
    });
    return;
  }

  const nextId = store.getNextId(store.sortiesControlees);
  const currentYear = new Date().getFullYear();
  const registreNumero = `REG-${currentYear}-${String(nextId).padStart(3, '0')}`;

  const nouvelleDemande: SortieControlee = {
    id: nextId,
    registre_numero: registreNumero,
    produit_id: produit.id,
    lot_id: selectedLot.id,
    quantite: Number(quantite),
    service_demandeur_id: Number(service_demandeur_id),
    patient_ref_anonyme: String(patient_ref_anonyme).trim(),
    medecin_prescripteur: String(medecin_prescripteur).trim(),
    motif_therapeutique: String(motif_therapeutique).trim(),
    pharmacien_initiateur_id: req.user!.id,
    date_initiation: new Date().toISOString(),
    logisticien_validateur_id: null,
    date_validation: null,
    statut: 'en_attente',
    motif_rejet: null,
    hash_registre_inviolable: null,
  };

  store.sortiesControlees.unshift(nouvelleDemande);

  recordAudit(
    req.user!,
    'INITIATION_SORTIE_CONTROLEE',
    'SortieControlee',
    registreNumero,
    `Initiation de sortie de ${quantite} ${produit.unite_mesure} de "${produit.designation}" pour le patient ${patient_ref_anonyme}. En attente de validation par la logistique.`
  );

  res.status(201).json({
    message: 'Demande de sortie contrôlée enregistrée. Elle est désormais en attente de la validation obligatoire du Responsable Logistique.',
    demande: nouvelleDemande,
  });
});

// 4. Valider une sortie de produit contrôlé (STRICTEMENT réservé au Responsable Logistique / Admin)
// RÈGLE CRUCIALE : L'initiateur (pharmacien) et le validateur (logistique) DOIVENT ÊTRE DEUX UTILISATEURS DISTINCTS !
controlledSubstancesRouter.post('/:id/approve', authenticateToken, requireRole(['logistique', 'admin']), (req: AuthenticatedRequest, res: Response): void => {
  const id = Number(req.params.id);
  const demande = store.sortiesControlees.find((d) => d.id === id);

  if (!demande) {
    res.status(404).json({ error: 'Demande de sortie introuvable.' });
    return;
  }

  if (demande.statut !== 'en_attente') {
    res.status(400).json({ error: `Cette demande a déjà été traitée (Statut actuel: ${demande.statut}).` });
    return;
  }

  // RÈGLE DES DEUX YEUX / UTILISATEURS DISTINCTS
  if (demande.pharmacien_initiateur_id === req.user!.id) {
    res.status(403).json({
      error: 'CONTRÔLE RÉGLEMENTAIRE STRICT : La personne qui valide la sortie de produit contrôlé ne peut pas être la même que celle qui l\'a initiée (principe de séparation des pouvoirs et des deux utilisateurs distincts).',
    });
    return;
  }

  const lot = store.lots.find((l) => l.id === demande.lot_id);
  const produit = store.produits.find((p) => p.id === demande.produit_id);

  if (!lot || !produit) {
    res.status(400).json({ error: 'Données de lot ou de produit associées corrompues.' });
    return;
  }

  if (lot.quantite_restante < demande.quantite) {
    res.status(400).json({
      error: `Impossible de valider : Le stock restant sur le lot ${lot.numero_lot} (${lot.quantite_restante}) est devenu insuffisant pour cette sortie (${demande.quantite}).`,
    });
    return;
  }

  // Décrémenter le stock effectif
  lot.quantite_restante -= demande.quantite;
  if (lot.quantite_restante === 0) {
    lot.statut = 'epuise';
  }

  // Mettre à jour la demande dans le registre avec signature scellée SHA-256
  demande.statut = 'approuve';
  demande.logisticien_validateur_id = req.user!.id;
  demande.date_validation = new Date().toISOString();

  const sealData = `${demande.registre_numero}|${demande.produit_id}|${demande.lot_id}|${demande.quantite}|${demande.service_demandeur_id}|${demande.patient_ref_anonyme}|${demande.pharmacien_initiateur_id}|${demande.logisticien_validateur_id}|${demande.date_validation}`;
  demande.hash_registre_inviolable = crypto.createHash('sha256').update(sealData).digest('hex');

  // Enregistrer le mouvement de stock effectif
  const nextMouvId = store.getNextId(store.mouvements);
  const mouvement: MouvementStock = {
    id: nextMouvId,
    type: 'sortie',
    produit_id: produit.id,
    lot_id: lot.id,
    quantite: demande.quantite,
    service_source_id: 7, // Pharmacie Centrale
    service_dest_id: demande.service_demandeur_id,
    motif: `Sortie contrôlée validée [${demande.registre_numero}] - Prescripteur: ${demande.medecin_prescripteur}`,
    utilisateur_id: req.user!.id,
    utilisateur_nom: `${req.user!.prenom} ${req.user!.nom} (Validateur Logistique)`,
    date_mouvement: new Date().toISOString(),
  };
  store.mouvements.unshift(mouvement);

  recordAudit(
    req.user!,
    'APPROBATION_SORTIE_CONTROLEE',
    'SortieControlee',
    demande.registre_numero,
    `Validation finale de la sortie contrôlée ${demande.registre_numero}. Sceau SHA-256: ${demande.hash_registre_inviolable.substring(0, 12)}...`
  );

  res.json({
    message: 'Sortie de produit contrôlé validée avec succès et inscrite définitivement au registre scellé.',
    demande,
    mouvement,
  });
});

// 5. Rejeter une sortie de produit contrôlé
controlledSubstancesRouter.post('/:id/reject', authenticateToken, requireRole(['logistique', 'admin']), (req: AuthenticatedRequest, res: Response): void => {
  const id = Number(req.params.id);
  const { motif_rejet } = req.body;
  const demande = store.sortiesControlees.find((d) => d.id === id);

  if (!demande) {
    res.status(404).json({ error: 'Demande introuvable.' });
    return;
  }

  if (demande.statut !== 'en_attente') {
    res.status(400).json({ error: `La demande est déjà au statut "${demande.statut}".` });
    return;
  }

  demande.statut = 'rejete';
  demande.logisticien_validateur_id = req.user!.id;
  demande.date_validation = new Date().toISOString();
  demande.motif_rejet = motif_rejet || 'Refus motivé par la direction logistique.';

  recordAudit(
    req.user!,
    'REJET_SORTIE_CONTROLEE',
    'SortieControlee',
    demande.registre_numero,
    `Rejet de la demande ${demande.registre_numero}. Motif : ${demande.motif_rejet}`
  );

  res.json({ message: 'Demande rejetée.', demande });
});
