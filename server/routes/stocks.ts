import { Router, Response } from 'express';
import { store } from '../data/store';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { executeFefoExit } from '../services/fefoService';
import { recordAudit } from '../services/auditService';
import { Produit, Lot, MouvementStock } from '../data/types';

export const stocksRouter = Router();

// 1. Liste des produits avec calcul du stock actif et statut d'alerte
stocksRouter.get('/produits', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { categorie, alerte_uniquement, est_controle, search } = req.query;
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  let list = [...store.produits];

  if (categorie) {
    list = list.filter((p) => p.categorie.toLowerCase().includes(String(categorie).toLowerCase()));
  }

  if (est_controle !== undefined) {
    const isCtrl = est_controle === 'true';
    list = list.filter((p) => p.est_controle === isCtrl);
  }

  if (search) {
    const s = String(search).toLowerCase();
    list = list.filter(
      (p) =>
        p.designation.toLowerCase().includes(s) ||
        p.code_cis.toLowerCase().includes(s) ||
        p.categorie.toLowerCase().includes(s)
    );
  }

  const result = list.map((produit) => {
    // Calculer le stock actif (non périmé et non épuisé)
    const productLots = store.lots.filter((l) => l.produit_id === produit.id);
    const stockActif = productLots
      .filter((l) => l.statut === 'actif' && l.date_peremption >= todayStr)
      .reduce((sum, l) => sum + l.quantite_restante, 0);

    const stockPerime = productLots
      .filter((l) => l.statut === 'perime' || l.date_peremption < todayStr)
      .reduce((sum, l) => sum + l.quantite_restante, 0);

    // Déterminer le lot le plus proche à expirer (Priorité FEFO)
    const lotsFEFO = [...productLots]
      .filter((l) => l.statut === 'actif' && l.date_peremption >= todayStr && l.quantite_restante > 0)
      .sort((a, b) => new Date(a.date_peremption).getTime() - new Date(b.date_peremption).getTime());

    const prochainLotFEFO = lotsFEFO.length > 0 ? lotsFEFO[0] : null;

    const estEnAlerte = stockActif <= produit.seuil_alerte;

    return {
      ...produit,
      stock_actif: stockActif,
      stock_perime: stockPerime,
      est_en_alerte: estEnAlerte,
      prochain_lot_fefo: prochainLotFEFO
        ? {
            numero_lot: prochainLotFEFO.numero_lot,
            date_peremption: prochainLotFEFO.date_peremption,
            quantite: prochainLotFEFO.quantite_restante,
          }
        : null,
      nb_lots: productLots.length,
    };
  });

  if (alerte_uniquement === 'true') {
    res.json({ produits: result.filter((p) => p.est_en_alerte) });
    return;
  }

  res.json({ produits: result });
});

// 2. Créer un produit (Pharmacien, Logistique, Admin)
stocksRouter.post('/produits', authenticateToken, requireRole(['pharmacien', 'logistique', 'admin']), (req: AuthenticatedRequest, res: Response): void => {
  const {
    designation,
    categorie,
    forme_dosage,
    unite_mesure,
    seuil_alerte,
    est_controle,
    temperature_stockage,
  } = req.body;

  if (!designation || !categorie || !unite_mesure) {
    res.status(400).json({ error: 'La désignation, la catégorie et l\'unité de mesure sont requises.' });
    return;
  }

  const nextId = store.getNextId(store.produits);
  const codeCis = `CIS-${Math.floor(1000000 + Math.random() * 9000000)}`;

  const newProduit: Produit = {
    id: nextId,
    code_cis: codeCis,
    designation,
    categorie,
    forme_dosage: forme_dosage || '',
    unite_mesure,
    seuil_alerte: Number(seuil_alerte) || 10,
    est_controle: Boolean(est_controle),
    temperature_stockage: temperature_stockage || '15-25°C',
    created_at: new Date().toISOString(),
  };

  store.produits.push(newProduit);

  recordAudit(
    req.user!,
    'CREATION_PRODUIT',
    'Produit',
    String(newProduit.id),
    `Enregistrement du produit "${designation}" (${codeCis}) - Contrôlé : ${newProduit.est_controle ? 'OUI' : 'NON'}.`
  );

  res.status(201).json({ produit: newProduit });
});

// 3. Liste des lots
stocksRouter.get('/lots', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { produit_id, statut } = req.query;
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  let list = [...store.lots];

  if (produit_id) {
    list = list.filter((l) => l.produit_id === Number(produit_id));
  }

  if (statut) {
    list = list.filter((l) => l.statut === statut);
  }

  // Tri par défaut par règle FEFO (date de péremption croissante)
  list.sort((a, b) => new Date(a.date_peremption).getTime() - new Date(b.date_peremption).getTime());

  const enriched = list.map((lot) => {
    const produit = store.produits.find((p) => p.id === lot.produit_id);
    const expDate = new Date(lot.date_peremption);
    const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    let alertePeremption = 'normal';
    if (diffDays < 0 || lot.statut === 'perime') {
      alertePeremption = 'perime';
    } else if (diffDays <= 30) {
      alertePeremption = 'critique';
    } else if (diffDays <= 90) {
      alertePeremption = 'avertissement';
    }

    return {
      ...lot,
      produit_designation: produit?.designation || 'Produit Inconnu',
      produit_est_controle: produit?.est_controle || false,
      unite_mesure: produit?.unite_mesure || 'unités',
      jours_avant_peremption: diffDays,
      alerte_peremption: alertePeremption,
    };
  });

  res.json({ lots: enriched });
});

// 4. Ajouter un nouveau lot (Entrée de stock initiale ou réapprovisionnement)
stocksRouter.post('/lots', authenticateToken, requireRole(['pharmacien', 'logistique', 'admin']), (req: AuthenticatedRequest, res: Response): void => {
  const {
    produit_id,
    numero_lot,
    date_fabrication,
    date_peremption,
    quantite,
    prix_unitaire_cfa,
    motif,
    service_dest_id,
  } = req.body;

  if (!produit_id || !numero_lot || !date_peremption || !quantite || Number(quantite) <= 0) {
    res.status(400).json({ error: 'Produit, numéro de lot, date de péremption et quantité positive sont requis.' });
    return;
  }

  const produit = store.produits.find((p) => p.id === Number(produit_id));
  if (!produit) {
    res.status(404).json({ error: 'Produit introuvable.' });
    return;
  }

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const isExpired = date_peremption < todayStr;

  const nextLotId = store.getNextId(store.lots);
  const qte = Number(quantite);

  const newLot: Lot = {
    id: nextLotId,
    produit_id: Number(produit_id),
    numero_lot: String(numero_lot).trim(),
    date_fabrication: date_fabrication || undefined,
    date_peremption,
    quantite_initiale: qte,
    quantite_restante: qte,
    prix_unitaire_cfa: Number(prix_unitaire_cfa) || 0,
    statut: isExpired ? 'perime' : 'actif',
    created_at: new Date().toISOString(),
  };

  store.lots.push(newLot);

  // Enregistrer le mouvement d'entrée de stock
  const nextMouvId = store.getNextId(store.mouvements);
  const mouvement: MouvementStock = {
    id: nextMouvId,
    type: 'entree',
    produit_id: Number(produit_id),
    lot_id: newLot.id,
    quantite: qte,
    service_source_id: null,
    service_dest_id: Number(service_dest_id) || 7, // Pharmacie par défaut
    motif: motif || `Réception du lot ${numero_lot}`,
    utilisateur_id: req.user!.id,
    utilisateur_nom: `${req.user!.prenom} ${req.user!.nom}`,
    date_mouvement: new Date().toISOString(),
  };
  store.mouvements.unshift(mouvement);

  recordAudit(
    req.user!,
    'ENTREE_STOCK_LOT',
    'Lot',
    String(newLot.id),
    `Création du lot "${newLot.numero_lot}" pour "${produit.designation}" (+${qte} ${produit.unite_mesure}, Exp: ${date_peremption}).`
  );

  res.status(201).json({ lot: newLot, mouvement });
});

// 5. Exécuter un mouvement de sortie de stock selon la règle FEFO
stocksRouter.post('/mouvements/sortie', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const { produit_id, quantite, service_source_id, service_dest_id, motif, lot_id } = req.body;

  if (!produit_id || !quantite || Number(quantite) <= 0) {
    res.status(400).json({ error: 'Produit et quantité valide requis.' });
    return;
  }

  const produit = store.produits.find((p) => p.id === Number(produit_id));
  if (!produit) {
    res.status(404).json({ error: 'Produit introuvable.' });
    return;
  }

  // VÉRIFICATION DE SÉCURITÉ : PRODUIT CONTRÔLÉ (STUPÉFIANT)
  if (produit.est_controle) {
    res.status(403).json({
      error: `RÈGLE DE SÉCURITÉ MÉDICALE : Le produit "${produit.designation}" est classé sous contrôle strict (stupéfiant/substance vénéneuse). Sa sortie ne peut pas être effectuée par un flux standard. Elle doit impérativement être initiée dans le module "Produits Contrôlés" par un pharmacien puis validée par un responsable logistique distinct.`,
    });
    return;
  }

  try {
    const result = executeFefoExit(
      Number(produit_id),
      Number(quantite),
      service_source_id ? Number(service_source_id) : 7,
      service_dest_id ? Number(service_dest_id) : null,
      motif || 'Sortie pour soins infirmiers / dotation de service',
      req.user!,
      lot_id ? Number(lot_id) : null
    );

    res.json({
      message: 'Sortie de stock enregistrée avec succès conformément à la règle FEFO.',
      ...result,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erreur lors de la sortie de stock.' });
  }
});

// 6. Historique des mouvements de stock
stocksRouter.get('/mouvements', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { produit_id, type } = req.query;

  let list = [...store.mouvements];

  if (produit_id) {
    list = list.filter((m) => m.produit_id === Number(produit_id));
  }

  if (type) {
    list = list.filter((m) => m.type === type);
  }

  const enriched = list.map((m) => {
    const produit = store.produits.find((p) => p.id === m.produit_id);
    const lot = store.lots.find((l) => l.id === m.lot_id);
    const sSource = store.services.find((s) => s.id === m.service_source_id);
    const sDest = store.services.find((s) => s.id === m.service_dest_id);

    return {
      ...m,
      produit_designation: produit?.designation || 'Inconnu',
      produit_est_controle: produit?.est_controle || false,
      unite_mesure: produit?.unite_mesure || 'unités',
      numero_lot: lot?.numero_lot || 'N/A',
      date_peremption_lot: lot?.date_peremption || 'N/A',
      service_source_nom: sSource?.nom || 'Dépôt Central',
      service_dest_nom: sDest?.nom || 'Extérieur / Service',
    };
  });

  res.json({ mouvements: enriched });
});
