import { store } from '../data/store';
import { Lot, MouvementStock } from '../data/types';
import { recordAudit } from './auditService';

export interface FefoAllocation {
  lot: Lot;
  quantitePrelevee: number;
}

export interface FefoResult {
  allocations: FefoAllocation[];
  mouvements: MouvementStock[];
}

/**
 * Applique strictement la règle FEFO (First Expired, First Out)
 * 1. Filtre uniquement les lots non périmés (date_peremption >= date_du_jour et statut === 'actif')
 * 2. Trie par date_peremption croissante (les lots expirant le plus tôt sont sortis en priorité)
 * 3. Interdit formellement toute sortie sur un lot périmé
 */
export function executeFefoExit(
  produitId: number,
  quantiteDemandee: number,
  serviceSourceId: number | null,
  serviceDestId: number | null,
  motif: string,
  user: { id: number; nom: string; prenom: string; role: string },
  forcedLotId?: number | null
): FefoResult {
  if (quantiteDemandee <= 0) {
    throw new Error('La quantité demandée doit être un entier supérieur à zéro.');
  }

  const produit = store.produits.find((p) => p.id === produitId);
  if (!produit) {
    throw new Error('Produit introuvable.');
  }

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Si un lot spécifique est demandé, vérifier qu'il est valide et NON périmé
  if (forcedLotId) {
    const lot = store.lots.find((l) => l.id === forcedLotId && l.produit_id === produitId);
    if (!lot) {
      throw new Error(`Lot #${forcedLotId} introuvable pour ce produit.`);
    }

    if (lot.statut === 'perime' || lot.date_peremption < todayStr) {
      throw new Error(`BLOCAGE FEFO STRICT : Le lot "${lot.numero_lot}" est périmé depuis le ${lot.date_peremption}. Conformément aux protocoles hospitaliers, aucun lot périmé ne peut être distribué.`);
    }

    if (lot.quantite_restante < quantiteDemandee) {
      throw new Error(`Quantité insuffisante dans le lot ${lot.numero_lot} (disponible: ${lot.quantite_restante}, demandé: ${quantiteDemandee}).`);
    }

    // Décrémenter le lot
    lot.quantite_restante -= quantiteDemandee;
    if (lot.quantite_restante === 0) {
      lot.statut = 'epuise';
    }

    const mouvId = store.getNextId(store.mouvements);
    const mouvement: MouvementStock = {
      id: mouvId,
      type: 'sortie',
      produit_id: produitId,
      lot_id: lot.id,
      quantite: quantiteDemandee,
      service_source_id: serviceSourceId,
      service_dest_id: serviceDestId,
      motif: `${motif} [Lot ${lot.numero_lot} - Exp: ${lot.date_peremption}]`,
      utilisateur_id: user.id,
      utilisateur_nom: `${user.prenom} ${user.nom}`,
      date_mouvement: new Date().toISOString(),
    };
    store.mouvements.unshift(mouvement);

    recordAudit(
      user,
      'SORTIE_STOCK_FEFO',
      'Lot',
      String(lot.id),
      `Sortie de ${quantiteDemandee} ${produit.unite_mesure} du produit "${produit.designation}" sur le lot ${lot.numero_lot} (Pér: ${lot.date_peremption}).`
    );

    return {
      allocations: [{ lot, quantitePrelevee: quantiteDemandee }],
      mouvements: [mouvement],
    };
  }

  // ALGORITHME FEFO AUTOMATIQUE
  // Récupérer tous les lots actifs non épuisés pour ce produit
  const activeLots = store.lots
    .filter((l) => l.produit_id === produitId && l.statut === 'actif' && l.quantite_restante > 0)
    .sort((a, b) => new Date(a.date_peremption).getTime() - new Date(b.date_peremption).getTime());

  // Vérifier qu'il y a des lots valides
  const validNonExpiredLots = activeLots.filter((l) => l.date_peremption >= todayStr);

  const totalDisponibleNonPerime = validNonExpiredLots.reduce((sum, l) => sum + l.quantite_restante, 0);

  if (totalDisponibleNonPerime < quantiteDemandee) {
    throw new Error(
      `Stock non périmé insuffisant pour "${produit.designation}". Disponible conforme: ${totalDisponibleNonPerime} ${produit.unite_mesure}, Demandé: ${quantiteDemandee}.`
    );
  }

  let remainingToTake = quantiteDemandee;
  const allocations: FefoAllocation[] = [];
  const mouvements: MouvementStock[] = [];

  for (const lot of validNonExpiredLots) {
    if (remainingToTake <= 0) break;

    const takeFromThisLot = Math.min(lot.quantite_restante, remainingToTake);
    lot.quantite_restante -= takeFromThisLot;
    if (lot.quantite_restante === 0) {
      lot.statut = 'epuise';
    }

    remainingToTake -= takeFromThisLot;
    allocations.push({ lot, quantitePrelevee: takeFromThisLot });

    const mouvId = store.getNextId(store.mouvements);
    const mouvement: MouvementStock = {
      id: mouvId,
      type: 'sortie',
      produit_id: produitId,
      lot_id: lot.id,
      quantite: takeFromThisLot,
      service_source_id: serviceSourceId,
      service_dest_id: serviceDestId,
      motif: `${motif} [FEFO: Lot ${lot.numero_lot} - Exp: ${lot.date_peremption}]`,
      utilisateur_id: user.id,
      utilisateur_nom: `${user.prenom} ${user.nom}`,
      date_mouvement: new Date().toISOString(),
    };
    store.mouvements.unshift(mouvement);
    mouvements.push(mouvement);

    recordAudit(
      user,
      'SORTIE_STOCK_FEFO_AUTO',
      'Lot',
      String(lot.id),
      `Prélèvement FEFO de ${takeFromThisLot} ${produit.unite_mesure} du lot ${lot.numero_lot} (expire le ${lot.date_peremption}).`
    );
  }

  return { allocations, mouvements };
}
