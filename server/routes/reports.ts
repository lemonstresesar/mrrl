import { Router, Response } from 'express';
import { store } from '../data/store';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

export const reportsRouter = Router();

// 1. Indicateurs clés pour le tableau de bord selon le rôle
reportsRouter.get('/dashboard-stats', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Statistiques Équipements
  const nonArchives = store.equipements.filter((e) => !e.est_archive);
  const totalEquipements = nonArchives.length;
  const enService = nonArchives.filter((e) => e.statut === 'en_service').length;
  const enMaintenance = nonArchives.filter((e) => e.statut === 'en_maintenance').length;
  const horsService = nonArchives.filter((e) => e.statut === 'hors_service').length;
  const reformes = store.equipements.filter((e) => e.statut === 'reforme' || e.est_archive).length;

  const tauxDisponibilitePct = totalEquipements > 0 ? Math.round((enService / totalEquipements) * 100) : 100;

  // Statistiques Lits
  const lits = nonArchives.filter((e) => e.categorie.toLowerCase().includes('lit') || e.etat_lit !== 'non_applicable');
  const litsTotal = lits.length;
  const litsLibres = lits.filter((l) => l.etat_lit === 'libre').length;
  const litsOccupes = lits.filter((l) => l.etat_lit === 'occupe').length;
  const tauxOccupationLitsPct = litsTotal > 0 ? Math.round((litsOccupes / litsTotal) * 100) : 0;

  // Statistiques Stocks & FEFO
  const seuilLoinJours = Number(store.parametres.get('seuil_peremption_lointaine_jours')?.valeur) || 90;
  const seuilUrgentJours = Number(store.parametres.get('seuil_peremption_urgente_jours')?.valeur) || 30;

  let stocksCritiquesCount = 0;
  store.produits.forEach((p) => {
    const stockActif = store.lots
      .filter((l) => l.produit_id === p.id && l.statut === 'actif' && l.date_peremption >= todayStr)
      .reduce((sum, l) => sum + l.quantite_restante, 0);

    if (stockActif <= p.seuil_alerte) {
      stocksCritiquesCount++;
    }
  });

  const msInDay = 1000 * 60 * 60 * 24;
  let lotsPerimesCount = 0;
  let lotsPeremptionUrgenteCount = 0; // < 30 jours
  let lotsPeremptionProcheCount = 0; // < 90 jours

  store.lots.forEach((lot) => {
    if (lot.quantite_restante <= 0) return;
    const diff = Math.ceil((new Date(lot.date_peremption).getTime() - now.getTime()) / msInDay);
    if (diff < 0 || lot.statut === 'perime') {
      lotsPerimesCount++;
    } else if (diff <= seuilUrgentJours) {
      lotsPeremptionUrgenteCount++;
    } else if (diff <= seuilLoinJours) {
      lotsPeremptionProcheCount++;
    }
  });

  // Statistiques Maintenance
  const totalMaint = store.maintenances.length;
  const maintPlanifiees = store.maintenances.filter((m) => m.statut === 'planifiee').length;
  const maintEnRetard = store.maintenances.filter((m) => m.statut === 'en_retard' || (m.statut !== 'terminee' && m.statut !== 'annulee' && m.date_planifiee < todayStr)).length;
  const maintTerminees = store.maintenances.filter((m) => m.statut === 'terminee').length;

  // Statistiques Produits Contrôlés & Demandes
  const sortiesControleesEnAttente = store.sortiesControlees.filter((s) => s.statut === 'en_attente').length;
  const demandesAllocationEnAttente = store.demandesAllocation.filter((d) => d.statut === 'en_attente').length;

  // Alertes non lues
  const alertesNonLues = store.alertes.filter((a) => !a.est_lu).length;

  // Répartition par service pour le chef de service ou superviseur
  const serviceStats = store.services.map((s) => {
    const eqService = nonArchives.filter((e) => e.service_id === s.id);
    const litsService = eqService.filter((e) => e.etat_lit !== 'non_applicable');
    return {
      service_id: s.id,
      service_nom: s.nom,
      service_code: s.code,
      total_equipements: eqService.length,
      en_service: eqService.filter((e) => e.statut === 'en_service').length,
      en_panne: eqService.filter((e) => e.statut === 'hors_service' || e.statut === 'en_maintenance').length,
      lits_libres: litsService.filter((l) => l.etat_lit === 'libre').length,
      lits_occupes: litsService.filter((l) => l.etat_lit === 'occupe').length,
    };
  });

  res.json({
    equipements: {
      total: totalEquipements,
      en_service: enService,
      en_maintenance: enMaintenance,
      hors_service: horsService,
      reformes: reformes,
      taux_disponibilite_pct: tauxDisponibilitePct,
    },
    lits: {
      total: litsTotal,
      libres: litsLibres,
      occupes: litsOccupes,
      taux_occupation_pct: tauxOccupationLitsPct,
    },
    stocks: {
      total_produits: store.produits.length,
      produits_critiques_count: stocksCritiquesCount,
      lots_perimes_bloques: lotsPerimesCount,
      lots_peremption_urgente: lotsPeremptionUrgenteCount,
      lots_peremption_proche: lotsPeremptionProcheCount,
    },
    maintenance: {
      total: totalMaint,
      planifiees: maintPlanifiees,
      en_retard: maintEnRetard,
      terminees: maintTerminees,
    },
    sorties_controlees: {
      en_attente: sortiesControleesEnAttente,
      total_validees: store.sortiesControlees.filter((s) => s.statut === 'approuve').length,
    },
    allocations: {
      en_attente: demandesAllocationEnAttente,
    },
    alertes: {
      non_lues: alertesNonLues,
    },
    service_stats: serviceStats,
  });
});
