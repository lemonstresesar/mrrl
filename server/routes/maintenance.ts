import { Router, Response } from 'express';
import { store } from '../data/store';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { recordAudit } from '../services/auditService';
import { Maintenance, MaintenanceStatut, MaintenanceType, MaintenancePriorite } from '../data/types';

export const maintenanceRouter = Router();

// 1. Liste des interventions de maintenance
maintenanceRouter.get('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { type, statut, equipement_id, priorite } = req.query;

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  let list = [...store.maintenances];

  // Mettre à jour dynamiquement l'état "en_retard" si date dépassée
  list.forEach((m) => {
    if (m.statut !== 'terminee' && m.statut !== 'annulee' && m.date_planifiee < todayStr) {
      m.statut = 'en_retard';
    }
  });

  if (type) list = list.filter((m) => m.type === type);
  if (statut) list = list.filter((m) => m.statut === statut);
  if (equipement_id) list = list.filter((m) => m.equipement_id === Number(equipement_id));
  if (priorite) list = list.filter((m) => m.priorite === priorite);

  // Tri par date de planification
  list.sort((a, b) => new Date(a.date_planifiee).getTime() - new Date(b.date_planifiee).getTime());

  const enriched = list.map((m) => {
    const equipement = store.equipements.find((e) => e.id === m.equipement_id);
    const service = equipement ? store.services.find((s) => s.id === equipement.service_id) : null;
    const tech = m.technicien_id ? store.users.find((u) => u.id === m.technicien_id) : null;

    return {
      ...m,
      equipement_nom: equipement?.nom || 'Équipement Inconnu',
      equipement_code: equipement?.code_inventaire || 'INC',
      equipement_statut: equipement?.statut || 'inconnu',
      service_nom: service?.nom || 'Inconnu',
      salle: equipement?.salle || 'N/A',
      technicien_nom: tech ? `${tech.prenom} ${tech.nom}` : 'Non assigné',
    };
  });

  res.json({ maintenances: enriched });
});

// 2. Créer une nouvelle intervention (Préventive programmée ou Curative signalée)
maintenanceRouter.post('/', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const {
    equipement_id,
    type,
    priorite,
    description_panne,
    date_planifiee,
    technicien_id,
  } = req.body;

  if (!equipement_id || !type || !description_panne || !date_planifiee) {
    res.status(400).json({ error: 'Équipement, type (preventive/curative), description et date planifiée obligatoires.' });
    return;
  }

  const equipement = store.equipements.find((e) => e.id === Number(equipement_id));
  if (!equipement) {
    res.status(404).json({ error: 'Équipement non trouvé.' });
    return;
  }

  const nextId = store.getNextId(store.maintenances);
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const isRetard = date_planifiee < todayStr;

  const newMaint: Maintenance = {
    id: nextId,
    equipement_id: equipement.id,
    type: type as MaintenanceType,
    priorite: (priorite as MaintenancePriorite) || 'moyenne',
    description_panne,
    date_planifiee,
    date_realisation: null,
    technicien_id: technicien_id ? Number(technicien_id) : null,
    statut: isRetard ? 'en_retard' : 'planifiee',
    pieces_remplacees: null,
    cout_intervention_cfa: 0,
    rapport_technique: null,
    created_at: new Date().toISOString(),
  };

  store.maintenances.push(newMaint);

  // Si c'est une intervention curative d'urgence, basculer l'équipement en "en_maintenance"
  if (type === 'curative' && equipement.statut === 'en_service') {
    equipement.statut = 'en_maintenance';
    equipement.updated_at = new Date().toISOString();
  }

  recordAudit(
    req.user!,
    'CREATION_MAINTENANCE',
    'Maintenance',
    String(newMaint.id),
    `Nouvelle intervention ${type} (${newMaint.priorite}) sur "${equipement.nom}" (${equipement.code_inventaire}).`
  );

  res.status(201).json({ maintenance: newMaint, equipement });
});

// 3. Mettre à jour une intervention (Clôture, rapport technique, pièces changées)
maintenanceRouter.put('/:id', authenticateToken, requireRole(['maintenance', 'logistique', 'admin']), (req: AuthenticatedRequest, res: Response): void => {
  const id = Number(req.params.id);
  const maint = store.maintenances.find((m) => m.id === id);

  if (!maint) {
    res.status(404).json({ error: 'Intervention introuvable.' });
    return;
  }

  const {
    statut,
    technicien_id,
    pieces_remplacees,
    cout_intervention_cfa,
    rapport_technique,
    remettre_en_service,
  } = req.body;

  if (statut) maint.statut = statut as MaintenanceStatut;
  if (technicien_id !== undefined) maint.technicien_id = technicien_id ? Number(technicien_id) : null;
  if (pieces_remplacees !== undefined) maint.pieces_remplacees = pieces_remplacees;
  if (cout_intervention_cfa !== undefined) maint.cout_intervention_cfa = Number(cout_intervention_cfa);
  if (rapport_technique !== undefined) maint.rapport_technique = rapport_technique;

  // Si intervention terminée
  if (statut === 'terminee') {
    maint.date_realisation = new Date().toISOString();

    const equipement = store.equipements.find((e) => e.id === maint.equipement_id);
    if (equipement && remettre_en_service) {
      equipement.statut = 'en_service';
      equipement.updated_at = new Date().toISOString();
    }
  }

  recordAudit(
    req.user!,
    'MAJ_MAINTENANCE',
    'Maintenance',
    String(maint.id),
    `Mise à jour intervention #${maint.id} -> Statut : ${maint.statut}.`
  );

  res.json({ maintenance: maint });
});
