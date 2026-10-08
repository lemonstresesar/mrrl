import { Router, Response } from 'express';
import QRCode from 'qrcode';
import { store } from '../data/store';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { recordAudit } from '../services/auditService';
import { Equipement, LitEtat, EquipementStatut } from '../data/types';

export const equipementsRouter = Router();

// 1. Lister tous les équipements avec filtres
equipementsRouter.get('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { statut, categorie, service_id, etat_lit, est_archive, search } = req.query;

  let list = [...store.equipements];

  if (est_archive === 'true') {
    list = list.filter((e) => e.est_archive);
  } else {
    list = list.filter((e) => !e.est_archive);
  }

  if (statut) {
    list = list.filter((e) => e.statut === statut);
  }

  if (categorie) {
    list = list.filter((e) => e.categorie.toLowerCase().includes(String(categorie).toLowerCase()));
  }

  if (service_id) {
    list = list.filter((e) => e.service_id === Number(service_id));
  }

  if (etat_lit) {
    list = list.filter((e) => e.etat_lit === etat_lit);
  }

  if (search) {
    const s = String(search).toLowerCase();
    list = list.filter(
      (e) =>
        e.nom.toLowerCase().includes(s) ||
        e.code_inventaire.toLowerCase().includes(s) ||
        e.numero_serie.toLowerCase().includes(s) ||
        e.salle.toLowerCase().includes(s)
    );
  }

  // Enrichir avec le libellé du service
  const enriched = list.map((e) => {
    const service = store.services.find((s) => s.id === e.service_id);
    return {
      ...e,
      service_nom: service?.nom || 'Inconnu',
      service_code: service?.code || 'INC',
    };
  });

  res.json({ equipements: enriched });
});

// 2. Recherche par code inventaire ou données QR
equipementsRouter.get('/lookup/:code', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const code = req.params.code.trim();
  const equipement = store.equipements.find(
    (e) => e.code_inventaire.toUpperCase() === code.toUpperCase() || e.qr_code_data === code
  );

  if (!equipement) {
    res.status(404).json({ error: `Aucun équipement médical trouvé avec le code "${code}".` });
    return;
  }

  const service = store.services.find((s) => s.id === equipement.service_id);
  const maintenances = store.maintenances.filter((m) => m.equipement_id === equipement.id);

  res.json({
    equipement: {
      ...equipement,
      service_nom: service?.nom || 'Inconnu',
      service_code: service?.code || 'INC',
    },
    maintenances,
  });
});

// 3. Fiche détaillée d'un équipement
equipementsRouter.get('/:id', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const id = Number(req.params.id);
  const equipement = store.equipements.find((e) => e.id === id);

  if (!equipement) {
    res.status(404).json({ error: 'Équipement non trouvé.' });
    return;
  }

  const service = store.services.find((s) => s.id === equipement.service_id);
  const maintenances = store.maintenances.filter((m) => m.equipement_id === id);
  const auditLogs = store.journalAudit.filter((a) => a.entite === 'Equipement' && a.entite_id === String(equipement.code_inventaire));

  res.json({
    equipement: {
      ...equipement,
      service_nom: service?.nom || 'Inconnu',
      service_code: service?.code || 'INC',
    },
    maintenances,
    auditLogs,
  });
});

// 4. Générer le QR Code (Image Base64 Data URL)
equipementsRouter.get('/:id/qr-code', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  const equipement = store.equipements.find((e) => e.id === id);

  if (!equipement) {
    res.status(404).json({ error: 'Équipement introuvable.' });
    return;
  }

  try {
    // Contenu encodé dans le QR code : code inventaire formaté
    const qrText = equipement.qr_code_data || equipement.code_inventaire;
    const qrDataUrl = await QRCode.toDataURL(qrText, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 320,
      color: {
        dark: '#1F3864', // Bleu marine HGD
        light: '#FFFFFF',
      },
    });

    res.json({
      code_inventaire: equipement.code_inventaire,
      nom: equipement.nom,
      service: store.services.find((s) => s.id === equipement.service_id)?.nom,
      salle: equipement.salle,
      numero_serie: equipement.numero_serie,
      qrDataUrl,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la génération du QR code.' });
  }
});

// 5. Créer un nouvel équipement (Admin, Logistique)
equipementsRouter.post('/', authenticateToken, requireRole(['admin', 'logistique']), (req: AuthenticatedRequest, res: Response): void => {
  const {
    nom,
    categorie,
    numero_serie,
    date_acquisition,
    statut,
    service_id,
    salle,
    garantie_expiration,
    etat_lit,
    documents,
  } = req.body;

  if (!nom || !categorie || !numero_serie || !service_id || !salle) {
    res.status(400).json({ error: 'Veuillez remplir tous les champs obligatoires (nom, catégorie, numéro de série, service, salle).' });
    return;
  }

  const nextId = store.getNextId(store.equipements);
  const prefix = categorie.toLowerCase().includes('lit') ? 'LIT-HGD' : 'EQ-HGD';
  const service = store.services.find((s) => s.id === Number(service_id));
  const serviceCode = service ? service.code : 'GEN';
  const codeInventaire = `${prefix}-${serviceCode}-${String(nextId).padStart(3, '0')}`;

  const isBed = categorie.toLowerCase().includes('lit');
  const validEtatLit: LitEtat = isBed ? (etat_lit === 'occupe' ? 'occupe' : 'libre') : 'non_applicable';

  const newEquipement: Equipement = {
    id: nextId,
    code_inventaire: codeInventaire,
    nom,
    categorie,
    numero_serie,
    date_acquisition: date_acquisition || new Date().toISOString().split('T')[0],
    statut: (statut as EquipementStatut) || 'en_service',
    service_id: Number(service_id),
    salle,
    garantie_expiration: garantie_expiration || '',
    etat_lit: validEtatLit,
    qr_code_data: codeInventaire,
    documents: documents || '',
    est_archive: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  store.equipements.push(newEquipement);

  recordAudit(
    req.user!,
    'CREATION_EQUIPEMENT',
    'Equipement',
    codeInventaire,
    `Création de la fiche d'équipement "${nom}" (${codeInventaire}) affecté au service ${service?.nom || service_id}.`
  );

  res.status(201).json({ equipement: newEquipement });
});

// 6. Mettre à jour un équipement
equipementsRouter.put('/:id', authenticateToken, requireRole(['admin', 'logistique', 'maintenance']), (req: AuthenticatedRequest, res: Response): void => {
  const id = Number(req.params.id);
  const equipement = store.equipements.find((e) => e.id === id);

  if (!equipement) {
    res.status(404).json({ error: 'Équipement non trouvé.' });
    return;
  }

  const {
    nom,
    categorie,
    numero_serie,
    date_acquisition,
    statut,
    service_id,
    salle,
    garantie_expiration,
    etat_lit,
    documents,
  } = req.body;

  if (nom !== undefined) equipement.nom = nom;
  if (categorie !== undefined) equipement.categorie = categorie;
  if (numero_serie !== undefined) equipement.numero_serie = numero_serie;
  if (date_acquisition !== undefined) equipement.date_acquisition = date_acquisition;
  if (statut !== undefined) equipement.statut = statut;
  if (service_id !== undefined) equipement.service_id = Number(service_id);
  if (salle !== undefined) equipement.salle = salle;
  if (garantie_expiration !== undefined) equipement.garantie_expiration = garantie_expiration;
  if (etat_lit !== undefined) equipement.etat_lit = etat_lit;
  if (documents !== undefined) equipement.documents = documents;

  equipement.updated_at = new Date().toISOString();

  recordAudit(
    req.user!,
    'MODIFICATION_EQUIPEMENT',
    'Equipement',
    equipement.code_inventaire,
    `Mise à jour des informations de l'équipement "${equipement.nom}".`
  );

  res.json({ equipement });
});

// 7. Basculer l'état d'un lit (Libre / Occupé)
equipementsRouter.put('/:id/lit-status', authenticateToken, requireRole(['chef_service', 'logistique', 'admin']), (req: AuthenticatedRequest, res: Response): void => {
  const id = Number(req.params.id);
  const equipement = store.equipements.find((e) => e.id === id);

  if (!equipement) {
    res.status(404).json({ error: 'Équipement introuvable.' });
    return;
  }

  if (equipement.etat_lit === 'non_applicable') {
    res.status(400).json({ error: 'Cet équipement n\'est pas un lit d\'hospitalisation.' });
    return;
  }

  const { etat_lit } = req.body;
  if (etat_lit !== 'libre' && etat_lit !== 'occupe') {
    res.status(400).json({ error: 'L\'état du lit doit être "libre" ou "occupe".' });
    return;
  }

  const ancienEtat = equipement.etat_lit;
  equipement.etat_lit = etat_lit;
  equipement.updated_at = new Date().toISOString();

  recordAudit(
    req.user!,
    'CHANGEMENT_ETAT_LIT',
    'Lit',
    equipement.code_inventaire,
    `Passage du lit ${equipement.code_inventaire} (${equipement.nom}) de "${ancienEtat}" à "${etat_lit}".`
  );

  res.json({ equipement });
});

// 8. Archiver un équipement
equipementsRouter.put('/:id/archiver', authenticateToken, requireRole(['admin', 'logistique']), (req: AuthenticatedRequest, res: Response): void => {
  const id = Number(req.params.id);
  const equipement = store.equipements.find((e) => e.id === id);

  if (!equipement) {
    res.status(404).json({ error: 'Équipement introuvable.' });
    return;
  }

  equipement.est_archive = true;
  equipement.statut = 'reforme';
  equipement.updated_at = new Date().toISOString();

  recordAudit(
    req.user!,
    'ARCHIVAGE_EQUIPEMENT',
    'Equipement',
    equipement.code_inventaire,
    `Archivage définitif et mise au rebut de l'équipement "${equipement.nom}".`
  );

  res.json({ message: 'Équipement archivé avec succès.', equipement });
});
