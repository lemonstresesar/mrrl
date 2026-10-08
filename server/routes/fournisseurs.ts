import { Router, Response } from 'express';
import { store } from '../data/store';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { recordAudit } from '../services/auditService';
import { Fournisseur, Commande, CommandeLigne } from '../data/types';

export const fournisseursRouter = Router();

// 1. Liste des fournisseurs
fournisseursRouter.get('/', authenticateToken, (_req: AuthenticatedRequest, res: Response) => {
  res.json({ fournisseurs: store.fournisseurs });
});

// 2. Créer un fournisseur
fournisseursRouter.post('/', authenticateToken, requireRole(['logistique', 'admin']), (req: AuthenticatedRequest, res: Response): void => {
  const { nom, contact_nom, telephone, email, adresse, ville, delai_moyen_jours, note_fiabilite } = req.body;

  if (!nom || !telephone || !email) {
    res.status(400).json({ error: 'Nom, téléphone et email sont requis.' });
    return;
  }

  const nextId = store.getNextId(store.fournisseurs);
  const newFournisseur: Fournisseur = {
    id: nextId,
    nom,
    contact_nom: contact_nom || '',
    telephone,
    email,
    adresse: adresse || '',
    ville: ville || 'Douala',
    delai_moyen_jours: Number(delai_moyen_jours) || 7,
    note_fiabilite: Number(note_fiabilite) || 4.5,
  };

  store.fournisseurs.push(newFournisseur);

  recordAudit(
    req.user!,
    'CREATION_FOURNISSEUR',
    'Fournisseur',
    String(newFournisseur.id),
    `Ajout du fournisseur médical "${nom}" (${newFournisseur.ville}).`
  );

  res.status(201).json({ fournisseur: newFournisseur });
});

// 3. Comparateur de fournisseurs (délais, notations, catalogue)
fournisseursRouter.get('/comparateur', authenticateToken, (_req: AuthenticatedRequest, res: Response) => {
  const comparison = store.fournisseurs.map((f) => {
    const fCommandes = store.commandes.filter((c) => c.fournisseur_id === f.id);
    const totalCommandes = fCommandes.length;
    const totalLivre = fCommandes.filter((c) => c.statut === 'livree').length;
    const volumeTotalCFA = fCommandes.reduce((sum, c) => sum + c.montant_total_cfa, 0);

    return {
      ...f,
      total_commandes: totalCommandes,
      total_livrees: totalLivre,
      taux_succes_pct: totalCommandes > 0 ? Math.round((totalLivre / totalCommandes) * 100) : 100,
      volume_total_cfa: volumeTotalCFA,
    };
  });

  // Tri par note de fiabilité décroissante
  comparison.sort((a, b) => b.note_fiabilite - a.note_fiabilite);

  res.json({ comparateur: comparison });
});

// 4. Liste des bons de commande
fournisseursRouter.get('/commandes', authenticateToken, (_req: AuthenticatedRequest, res: Response) => {
  const enriched = store.commandes.map((c) => {
    const fournisseur = store.fournisseurs.find((f) => f.id === c.fournisseur_id);
    const createur = store.users.find((u) => u.id === c.cree_par_id);

    return {
      ...c,
      fournisseur_nom: fournisseur?.nom || 'Inconnu',
      fournisseur_telephone: fournisseur?.telephone || '',
      createur_nom: createur ? `${createur.prenom} ${createur.nom}` : 'Utilisateur',
    };
  });

  res.json({ commandes: enriched });
});

// 5. Créer un bon de commande
fournisseursRouter.post('/commandes', authenticateToken, requireRole(['logistique', 'pharmacien', 'admin']), (req: AuthenticatedRequest, res: Response): void => {
  const { fournisseur_id, date_livraison_estimee, commentaires, lignes } = req.body;

  if (!fournisseur_id || !lignes || !Array.isArray(lignes) || lignes.length === 0) {
    res.status(400).json({ error: 'Fournisseur et au moins un article de commande requis.' });
    return;
  }

  const nextId = store.getNextId(store.commandes);
  const ref = `CMD-HGD-${new Date().getFullYear()}-${String(nextId).padStart(3, '0')}`;

  const cmdLignes: CommandeLigne[] = lignes.map((l: any, idx: number) => ({
    id: idx + 1,
    commande_id: nextId,
    designation: String(l.designation),
    quantite: Number(l.quantite),
    prix_unitaire_cfa: Number(l.prix_unitaire_cfa),
  }));

  const total = cmdLignes.reduce((sum, l) => sum + l.quantite * l.prix_unitaire_cfa, 0);

  const newCmd: Commande = {
    id: nextId,
    reference: ref,
    fournisseur_id: Number(fournisseur_id),
    date_commande: new Date().toISOString().split('T')[0],
    date_livraison_estimee: date_livraison_estimee || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    date_reception_reelle: null,
    statut: 'en_attente',
    montant_total_cfa: total,
    cree_par_id: req.user!.id,
    commentaires: commentaires || '',
    lignes: cmdLignes,
  };

  store.commandes.unshift(newCmd);

  recordAudit(
    req.user!,
    'CREATION_COMMANDE',
    'Commande',
    ref,
    `Création du bon de commande ${ref} d'un montant de ${total.toLocaleString('fr-FR')} FCFA.`
  );

  res.status(201).json({ commande: newCmd });
});

// 6. Mettre à jour le statut d'une commande
fournisseursRouter.put('/commandes/:id/statut', authenticateToken, requireRole(['logistique', 'admin', 'pharmacien']), (req: AuthenticatedRequest, res: Response): void => {
  const id = Number(req.params.id);
  const { statut } = req.body;

  const cmd = store.commandes.find((c) => c.id === id);
  if (!cmd) {
    res.status(404).json({ error: 'Bon de commande introuvable.' });
    return;
  }

  const oldStatut = cmd.statut;
  cmd.statut = statut;

  if (statut === 'livree') {
    cmd.date_reception_reelle = new Date().toISOString();
  }

  recordAudit(
    req.user!,
    'CHANGEMENT_STATUT_COMMANDE',
    'Commande',
    cmd.reference,
    `Passage de la commande ${cmd.reference} de "${oldStatut}" à "${statut}".`
  );

  res.json({ commande: cmd });
});
