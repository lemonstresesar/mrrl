import { Router, Response } from 'express';
import { store } from '../data/store';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { recordAudit } from '../services/auditService';
import { DemandeAllocation } from '../data/types';

export const allocationsRouter = Router();

// 1. Lister toutes les demandes d'allocation
allocationsRouter.get('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { statut, service_id } = req.query;

  let list = [...store.demandesAllocation];

  if (statut) list = list.filter((d) => d.statut === statut);
  if (service_id) list = list.filter((d) => d.service_demandeur_id === Number(service_id));

  // Tri par urgence puis par date
  list.sort((a, b) => new Date(b.date_demande).getTime() - new Date(a.date_demande).getTime());

  const enriched = list.map((d) => {
    const service = store.services.find((s) => s.id === d.service_demandeur_id);
    const chef = store.users.find((u) => u.id === d.chef_service_id);
    const logisticien = d.traite_par_id ? store.users.find((u) => u.id === d.traite_par_id) : null;
    const eqTransfere = d.equipement_transfere_id
      ? store.equipements.find((e) => e.id === d.equipement_transfere_id)
      : null;

    return {
      ...d,
      service_demandeur_nom: service?.nom || 'Inconnu',
      chef_service_nom: chef ? `${chef.prenom} ${chef.nom}` : 'Chef de service',
      traite_par_nom: logisticien ? `${logisticien.prenom} ${logisticien.nom}` : null,
      equipement_transfere_nom: eqTransfere ? `${eqTransfere.nom} (${eqTransfere.code_inventaire})` : null,
    };
  });

  res.json({ allocations: enriched });
});

// 2. Créer une nouvelle demande d'allocation (Chef de service, Admin)
allocationsRouter.post('/', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const {
    service_demandeur_id,
    type_ressource,
    designation_ressource,
    quantite,
    justification,
    urgence,
  } = req.body;

  if (!designation_ressource || !justification || !type_ressource) {
    res.status(400).json({ error: 'Type de ressource, désignation et justification sont requis.' });
    return;
  }

  const sId = service_demandeur_id ? Number(service_demandeur_id) : (req.user?.service_id || 1);
  const nextId = store.getNextId(store.demandesAllocation);

  const newDemande: DemandeAllocation = {
    id: nextId,
    service_demandeur_id: sId,
    chef_service_id: req.user!.id,
    type_ressource,
    designation_ressource,
    quantite: Number(quantite) || 1,
    justification,
    urgence: urgence || 'normale',
    statut: 'en_attente',
    traite_par_id: null,
    date_traitement: null,
    date_demande: new Date().toISOString(),
    commentaire_reponse: null,
  };

  store.demandesAllocation.unshift(newDemande);

  const service = store.services.find((s) => s.id === sId);

  recordAudit(
    req.user!,
    'DEMANDE_ALLOCATION',
    'DemandeAllocation',
    String(newDemande.id),
    `Nouvelle demande de ${newDemande.quantite} "${designation_ressource}" formulée par le service ${service?.nom} (Urgence : ${newDemande.urgence}).`
  );

  res.status(201).json({ demande: newDemande });
});

// 3. Traiter une demande d'allocation et exécuter le transfert avec mise à jour de la localisation
allocationsRouter.put('/:id/traiter', authenticateToken, requireRole(['logistique', 'admin']), (req: AuthenticatedRequest, res: Response): void => {
  const id = Number(req.params.id);
  const { decision, commentaire_reponse, equipement_id, nouvelle_salle } = req.body;

  const demande = store.demandesAllocation.find((d) => d.id === id);
  if (!demande) {
    res.status(404).json({ error: 'Demande d\'allocation introuvable.' });
    return;
  }

  if (demande.statut !== 'en_attente') {
    res.status(400).json({ error: `Cette demande a déjà été traitée (Statut: ${demande.statut}).` });
    return;
  }

  demande.statut = decision === 'approuvee' ? 'effectuee' : 'rejetee';
  demande.traite_par_id = req.user!.id;
  demande.date_traitement = new Date().toISOString();
  demande.commentaire_reponse = commentaire_reponse || '';

  let equipementModifie = null;

  // Si approbation avec transfert d'équipement, mettre à jour la localisation de l'équipement
  if (decision === 'approuvee' && equipement_id) {
    const equipement = store.equipements.find((e) => e.id === Number(equipement_id));
    if (equipement) {
      const ancientService = store.services.find((s) => s.id === equipement.service_id);
      const nouveauService = store.services.find((s) => s.id === demande.service_demandeur_id);

      equipement.service_id = demande.service_demandeur_id;
      if (nouvelle_salle) {
        equipement.salle = nouvelle_salle;
      }
      equipement.updated_at = new Date().toISOString();
      demande.equipement_transfere_id = equipement.id;
      equipementModifie = equipement;

      recordAudit(
        req.user!,
        'TRANSFERT_EQUIPEMENT_SERVICE',
        'Equipement',
        equipement.code_inventaire,
        `Transfert effectif de "${equipement.nom}" du service ${ancientService?.nom} vers ${nouveauService?.nom} (${equipement.salle}).`
      );
    }
  }

  recordAudit(
    req.user!,
    'TRAITEMENT_ALLOCATION',
    'DemandeAllocation',
    String(demande.id),
    `Demande d'allocation #${demande.id} ${demande.statut} par ${req.user!.prenom} ${req.user!.nom}.`
  );

  res.json({
    message: `Demande ${demande.statut === 'effectuee' ? 'approuvée et exécutée' : 'rejetée'}.`,
    demande,
    equipementModifie,
  });
});
