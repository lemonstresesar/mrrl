import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import {
  User,
  Service,
  Equipement,
  Produit,
  Lot,
  MouvementStock,
  SortieControlee,
  Maintenance,
  Fournisseur,
  Commande,
  CommandeLigne,
  DemandeAllocation,
  Alerte,
  JournalSMS,
  JournalAudit,
  Parametre
} from './types';

// ==============================================================================
// COUCHE D'ACCÈS AUX DONNÉES (ISOLÉE - INTERFACE COMPATIBLE MYSQL / SEQUELIZE)
// ==============================================================================

class DataStore {
  public services: Service[] = [];
  public users: User[] = [];
  public equipements: Equipement[] = [];
  public produits: Produit[] = [];
  public lots: Lot[] = [];
  public mouvements: MouvementStock[] = [];
  public sortiesControlees: SortieControlee[] = [];
  public maintenances: Maintenance[] = [];
  public fournisseurs: Fournisseur[] = [];
  public commandes: Commande[] = [];
  public commandeLignes: CommandeLigne[] = [];
  public demandesAllocation: DemandeAllocation[] = [];
  public alertes: Alerte[] = [];
  public journalSMS: JournalSMS[] = [];
  public journalAudit: JournalAudit[] = [];
  public parametres: Map<string, Parametre> = new Map();

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // 1. SERVICES DE L'HÔPITAL GÉNÉRAL DE DOUALA
    this.services = [
      { id: 1, code: 'URG', nom: 'Service des Urgences & Réanimation', batiment: 'Bâtiment A', etage: 'RDC' },
      { id: 2, code: 'MAT', nom: 'Maternité & Néonatalogie', batiment: 'Bâtiment B', etage: '1er étage' },
      { id: 3, code: 'PED', nom: 'Pédiatrie & Soins Intensifs Enfants', batiment: 'Bâtiment B', etage: '2e étage' },
      { id: 4, code: 'BLOC', nom: 'Bloc Opératoire Central', batiment: 'Bâtiment C', etage: '1er étage' },
      { id: 5, code: 'LAB', nom: 'Laboratoire d’Analyses Médicales', batiment: 'Bâtiment A', etage: '1er étage' },
      { id: 6, code: 'RAD', nom: 'Radiologie & Imagerie Médicale', batiment: 'Bâtiment A', etage: 'Sous-sol' },
      { id: 7, code: 'PHARM', nom: 'Pharmacie Centrale & Dépôt Stérilisation', batiment: 'Bâtiment D', etage: 'RDC' },
    ];

    // 2. UTILISATEURS DE DÉMONSTRATION (BCRYPT SALTED HASH)
    const salt = bcrypt.genSaltSync(10);
    this.users = [
      {
        id: 1,
        email: 'admin@hgd.cm',
        password_hash: bcrypt.hashSync('Admin123!', salt),
        nom: 'Mbassi',
        prenom: 'Samuel',
        role: 'admin',
        service_id: null,
        active: true,
        telephone: '+237 699 10 20 30',
        created_at: '2026-01-10T08:00:00Z',
      },
      {
        id: 2,
        email: 'logistique@hgd.cm',
        password_hash: bcrypt.hashSync('Logistique123!', salt),
        nom: 'Ngo Bisseck',
        prenom: 'Chantal',
        role: 'logistique',
        service_id: 1,
        active: true,
        telephone: '+237 677 22 33 44',
        created_at: '2026-01-10T08:00:00Z',
      },
      {
        id: 3,
        email: 'pharmacie@hgd.cm',
        password_hash: bcrypt.hashSync('Pharmacie123!', salt),
        nom: 'Dr. Eyenga',
        prenom: 'Jean-Marc',
        role: 'pharmacien',
        service_id: 7,
        active: true,
        telephone: '+237 691 45 67 89',
        created_at: '2026-01-10T08:00:00Z',
      },
      {
        id: 4,
        email: 'maintenance@hgd.cm',
        password_hash: bcrypt.hashSync('Maintenance123!', salt),
        nom: 'Tchouassi',
        prenom: 'Gervais',
        role: 'maintenance',
        service_id: null,
        active: true,
        telephone: '+237 670 98 76 54',
        created_at: '2026-01-10T08:00:00Z',
      },
      {
        id: 5,
        email: 'chef.urgences@hgd.cm',
        password_hash: bcrypt.hashSync('Chef123!', salt),
        nom: 'Pr. Kamga',
        prenom: 'Alain',
        role: 'chef_service',
        service_id: 1,
        active: true,
        telephone: '+237 699 55 44 33',
        created_at: '2026-01-10T08:00:00Z',
      },
    ];

    // 3. ÉQUIPEMENTS ET LITS
    this.equipements = [
      {
        id: 1,
        code_inventaire: 'EQ-HGD-URG-001',
        nom: 'Respirateur de Réanimation Dräger Evita V300',
        categorie: 'Réanimation & Ventilation',
        numero_serie: 'DRA-EV3-99482',
        date_acquisition: '2024-03-15',
        statut: 'en_service',
        service_id: 1,
        salle: 'Salle Déchoquage 1',
        garantie_expiration: '2027-03-15',
        etat_lit: 'non_applicable',
        qr_code_data: 'EQ-HGD-URG-001',
        documents: 'Manuel utilisateur Dräger V300, Certificat conformité CE',
        est_archive: false,
        created_at: '2024-03-15T09:00:00Z',
        updated_at: '2026-09-01T10:00:00Z',
      },
      {
        id: 2,
        code_inventaire: 'EQ-HGD-URG-002',
        nom: 'Moniteur Multiparamétrique Philips IntelliVue MX450',
        categorie: 'Monitoring Cardiaque',
        numero_serie: 'PHI-MX45-10293',
        date_acquisition: '2023-11-20',
        statut: 'en_service',
        service_id: 1,
        salle: 'Box Soins Intensifs 3',
        garantie_expiration: '2026-11-20',
        etat_lit: 'non_applicable',
        qr_code_data: 'EQ-HGD-URG-002',
        documents: 'Guide technique d\'étalonnage Philips',
        est_archive: false,
        created_at: '2023-11-20T10:00:00Z',
        updated_at: '2026-09-12T14:30:00Z',
      },
      {
        id: 3,
        code_inventaire: 'LIT-HGD-URG-101',
        nom: 'Lit de Réanimation Motorisé Hill-Rom Progressa',
        categorie: 'Lits d\'hospitalisation',
        numero_serie: 'HIL-PRG-88371',
        date_acquisition: '2024-01-10',
        statut: 'en_service',
        service_id: 1,
        salle: 'Salle Déchoquage 1',
        garantie_expiration: '2027-01-10',
        etat_lit: 'occupe',
        qr_code_data: 'LIT-HGD-URG-101',
        documents: 'Schéma électrique vérin motorisé',
        est_archive: false,
        created_at: '2024-01-10T08:00:00Z',
        updated_at: '2026-10-01T09:00:00Z',
      },
      {
        id: 4,
        code_inventaire: 'LIT-HGD-URG-102',
        nom: 'Lit de Réanimation Motorisé Hill-Rom Progressa',
        categorie: 'Lits d\'hospitalisation',
        numero_serie: 'HIL-PRG-88372',
        date_acquisition: '2024-01-10',
        statut: 'en_service',
        service_id: 1,
        salle: 'Box Surveillance Continue',
        garantie_expiration: '2027-01-10',
        etat_lit: 'libre',
        qr_code_data: 'LIT-HGD-URG-102',
        documents: 'Schéma électrique vérin motorisé',
        est_archive: false,
        created_at: '2024-01-10T08:00:00Z',
        updated_at: '2026-10-05T11:00:00Z',
      },
      {
        id: 5,
        code_inventaire: 'EQ-HGD-BLOC-003',
        nom: 'Générateur Électrochirurgical Covidien Valleylab FT10',
        categorie: 'Chirurgie & Bloc',
        numero_serie: 'COV-FT10-55421',
        date_acquisition: '2022-06-15',
        statut: 'en_maintenance',
        service_id: 4,
        salle: 'Salle Opératoire 2',
        garantie_expiration: '2025-06-15',
        etat_lit: 'non_applicable',
        qr_code_data: 'EQ-HGD-BLOC-003',
        documents: 'Protocole de calibrage haute fréquence',
        est_archive: false,
        created_at: '2022-06-15T09:00:00Z',
        updated_at: '2026-10-04T16:00:00Z',
      },
      {
        id: 6,
        code_inventaire: 'EQ-HGD-RAD-004',
        nom: 'Scanner Hélicoïdal Siemens SOMATOM go.Top 128 coupes',
        categorie: 'Imagerie Lourde',
        numero_serie: 'SIE-SMT-44910',
        date_acquisition: '2021-09-01',
        statut: 'en_service',
        service_id: 6,
        salle: 'Salle Scanner 1',
        garantie_expiration: '2026-09-01',
        etat_lit: 'non_applicable',
        qr_code_data: 'EQ-HGD-RAD-004',
        documents: 'Contrat de maintenance Siemens Gold, Rapport radioprotection ANRP',
        est_archive: false,
        created_at: '2021-09-01T08:00:00Z',
        updated_at: '2026-09-20T10:00:00Z',
      },
      {
        id: 7,
        code_inventaire: 'EQ-HGD-MAT-005',
        nom: 'Échographe Doppler Couleur GE Healthcare Voluson E10',
        categorie: 'Gynéco-Obstétrique & Échographie',
        numero_serie: 'GE-VOL-77192',
        date_acquisition: '2023-04-12',
        statut: 'en_service',
        service_id: 2,
        salle: 'Salle Échographie Obstétricale',
        garantie_expiration: '2026-04-12',
        etat_lit: 'non_applicable',
        qr_code_data: 'EQ-HGD-MAT-005',
        documents: 'Manuel sondes volumétriques GE',
        est_archive: false,
        created_at: '2023-04-12T11:00:00Z',
        updated_at: '2026-08-30T10:00:00Z',
      },
      {
        id: 8,
        code_inventaire: 'EQ-HGD-PED-006',
        nom: 'Incubateur Néonatal Hybride Giraffe OmniBed Carestation',
        categorie: 'Néonatalogie',
        numero_serie: 'GIR-OMN-33129',
        date_acquisition: '2022-10-05',
        statut: 'hors_service',
        service_id: 3,
        salle: 'Unité Grands Prématurés',
        garantie_expiration: '2025-10-05',
        etat_lit: 'non_applicable',
        qr_code_data: 'EQ-HGD-PED-006',
        documents: 'Fiche d\'incident technique thermorégulation',
        est_archive: false,
        created_at: '2022-10-05T14:00:00Z',
        updated_at: '2026-10-02T08:30:00Z',
      },
      {
        id: 9,
        code_inventaire: 'EQ-HGD-LAB-007',
        nom: 'Automate d\'Hématologie Sysmex XN-1000',
        categorie: 'Biologie Médicale',
        numero_serie: 'SYS-XN-99812',
        date_acquisition: '2023-08-18',
        statut: 'en_service',
        service_id: 5,
        salle: 'Paillasse Hématologie',
        garantie_expiration: '2026-08-18',
        etat_lit: 'non_applicable',
        qr_code_data: 'EQ-HGD-LAB-007',
        documents: 'Certificat étalonnage contrôles CQSysmex',
        est_archive: false,
        created_at: '2023-08-18T09:00:00Z',
        updated_at: '2026-09-15T16:00:00Z',
      },
      {
        id: 10,
        code_inventaire: 'LIT-HGD-MAT-201',
        nom: 'Lit d\'Accouchement Polyvalent Hill-Rom Affinity 4',
        categorie: 'Lits d\'hospitalisation',
        numero_serie: 'HIL-AFF-66291',
        date_acquisition: '2023-02-14',
        statut: 'en_service',
        service_id: 2,
        salle: 'Salle de Travail 2',
        garantie_expiration: '2026-02-14',
        etat_lit: 'libre',
        qr_code_data: 'LIT-HGD-MAT-201',
        documents: 'Guide technique positions gynécologiques',
        est_archive: false,
        created_at: '2023-02-14T10:00:00Z',
        updated_at: '2026-10-06T07:00:00Z',
      }
    ];

    // 4. PRODUITS DE SANTÉ (MÉDICAMENTS, CONSOMMABLES & PRODUITS CONTRÔLÉS)
    this.produits = [
      {
        id: 1,
        code_cis: 'CIS-6029101',
        designation: 'Morphine Chlorhydrate 10mg/1ml Solution Injectable',
        categorie: 'Antalgiques Majeurs (Stupéfiants)',
        forme_dosage: 'Ampoule 1ml',
        unite_mesure: 'ampoules',
        seuil_alerte: 40,
        est_controle: true, // PRODUIT CONTRÔLÉ STRICT (DOUBLE VALIDATION)
        temperature_stockage: '15-25°C (Coffre sécurisé)',
        created_at: '2025-01-01T00:00:00Z',
      },
      {
        id: 2,
        code_cis: 'CIS-6029102',
        designation: 'Fentanyl Citrate 0.05mg/ml (50mcg/ml) Ampoules 2ml',
        categorie: 'Anesthésiques Stupéfiants',
        forme_dosage: 'Ampoule 2ml',
        unite_mesure: 'ampoules',
        seuil_alerte: 25,
        est_controle: true, // PRODUIT CONTRÔLÉ STRICT
        temperature_stockage: '15-25°C (Coffre sécurisé)',
        created_at: '2025-01-01T00:00:00Z',
      },
      {
        id: 3,
        code_cis: 'CIS-6104402',
        designation: 'Paracétamol Injectable 10mg/ml Poche 100ml (Perfalgan)',
        categorie: 'Antalgiques & Antipyrétiques',
        forme_dosage: 'Poche IV 100ml',
        unite_mesure: 'poches',
        seuil_alerte: 100,
        est_controle: false,
        temperature_stockage: '15-25°C',
        created_at: '2025-01-01T00:00:00Z',
      },
      {
        id: 4,
        code_cis: 'CIS-6238804',
        designation: 'Amoxicilline + Acide Clavulanique 1g/200mg Poudre Injectable',
        categorie: 'Antibiotiques',
        forme_dosage: 'Flacon poudre IV',
        unite_mesure: 'flacons',
        seuil_alerte: 60,
        est_controle: false,
        temperature_stockage: 'Moins de 25°C',
        created_at: '2025-01-01T00:00:00Z',
      },
      {
        id: 5,
        code_cis: 'CIS-6391001',
        designation: 'Ringer Lactate Soluté de Perfusion 500ml',
        categorie: 'Solutés Massifs & Remplissage',
        forme_dosage: 'Poche 500ml avec tubulure',
        unite_mesure: 'poches',
        seuil_alerte: 80,
        est_controle: false,
        temperature_stockage: '15-25°C',
        created_at: '2025-01-01T00:00:00Z',
      },
      {
        id: 6,
        code_cis: 'CIS-7011928',
        designation: 'Gants d\'Examen Médical Nitrile Non Poudrés - Taille M',
        categorie: 'Dispositifs Médicaux & Protection',
        forme_dosage: 'Boîte de 100 unités',
        unite_mesure: 'boîtes',
        seuil_alerte: 50,
        est_controle: false,
        temperature_stockage: 'Température ambiante',
        created_at: '2025-01-01T00:00:00Z',
      },
      {
        id: 7,
        code_cis: 'CIS-7011935',
        designation: 'Cathéter Intraveineux Sécurisé 20G Rose avec valve',
        categorie: 'Matériel de Perfusion',
        forme_dosage: 'Boîte de 50 unités',
        unite_mesure: 'unités',
        seuil_alerte: 75,
        est_controle: false,
        temperature_stockage: 'Température ambiante',
        created_at: '2025-01-01T00:00:00Z',
      }
    ];

    // 5. LOTS (POUR RÈGLE FEFO STRICTE & CAS DE TEST PÉREMPTION)
    // Date courante: octobre 2026.
    // Lot périmé: 2026-08-20
    // Lot péremption proche (< 30j): 2026-10-28
    // Lot péremption modérée (< 90j): 2026-12-15
    // Lots standards: 2027 / 2028
    this.lots = [
      // Morphine 10mg: 2 lots
      {
        id: 1,
        produit_id: 1,
        numero_lot: 'MOR-2026-A12',
        date_fabrication: '2025-01-10',
        date_peremption: '2026-11-20', // Expire dans ~43 jours (alerte < 90j)
        quantite_initiale: 80,
        quantite_restante: 32,
        prix_unitaire_cfa: 1250,
        statut: 'actif',
        created_at: '2025-01-15T08:00:00Z',
      },
      {
        id: 2,
        produit_id: 1,
        numero_lot: 'MOR-2027-B04',
        date_fabrication: '2025-09-01',
        date_peremption: '2027-08-30', // Expire plus tard
        quantite_initiale: 100,
        quantite_restante: 95,
        prix_unitaire_cfa: 1250,
        statut: 'actif',
        created_at: '2025-09-10T10:00:00Z',
      },

      // Fentanyl: 1 lot
      {
        id: 3,
        produit_id: 2,
        numero_lot: 'FEN-2027-F01',
        date_fabrication: '2025-06-15',
        date_peremption: '2027-05-31',
        quantite_initiale: 50,
        quantite_restante: 38,
        prix_unitaire_cfa: 2400,
        statut: 'actif',
        created_at: '2025-06-20T09:00:00Z',
      },

      // Paracétamol IV: 3 lots
      // LOT PÉRIMÉ pour démontrer le blocage FEFO !
      {
        id: 4,
        produit_id: 3,
        numero_lot: 'PCM-PER-2026-X09',
        date_fabrication: '2024-08-01',
        date_peremption: '2026-08-15', // DÉJÀ PÉRIMÉ !
        quantite_initiale: 60,
        quantite_restante: 25,
        prix_unitaire_cfa: 650,
        statut: 'perime',
        created_at: '2024-08-10T08:00:00Z',
      },
      // LOT PÉREMPTION PROCHE (< 30 jours !)
      {
        id: 5,
        produit_id: 3,
        numero_lot: 'PCM-URG-2026-C01',
        date_fabrication: '2024-11-01',
        date_peremption: '2026-10-25', // Expire dans ~17 jours !
        quantite_initiale: 150,
        quantite_restante: 18, // Stock très bas sur ce lot prioritaire FEFO
        prix_unitaire_cfa: 650,
        statut: 'actif',
        created_at: '2024-11-05T09:00:00Z',
      },
      // Lot normal Paracétamol
      {
        id: 6,
        produit_id: 3,
        numero_lot: 'PCM-SEC-2027-D11',
        date_fabrication: '2025-10-01',
        date_peremption: '2027-10-01',
        quantite_initiale: 300,
        quantite_restante: 280,
        prix_unitaire_cfa: 650,
        statut: 'actif',
        created_at: '2025-10-05T09:00:00Z',
      },

      // Amoxicilline: 2 lots
      {
        id: 7,
        produit_id: 4,
        numero_lot: 'AMX-2026-L08',
        date_fabrication: '2025-02-10',
        date_peremption: '2026-12-05', // Expire dans ~58 jours (< 90j)
        quantite_initiale: 120,
        quantite_restante: 30, // Proche du seuil d'alerte (60)
        prix_unitaire_cfa: 1100,
        statut: 'actif',
        created_at: '2025-02-15T11:00:00Z',
      },
      {
        id: 8,
        produit_id: 4,
        numero_lot: 'AMX-2028-M02',
        date_fabrication: '2026-02-01',
        date_peremption: '2028-02-01',
        quantite_initiale: 200,
        quantite_restante: 195,
        prix_unitaire_cfa: 1100,
        statut: 'actif',
        created_at: '2026-02-10T14:00:00Z',
      },

      // Ringer Lactate
      {
        id: 9,
        produit_id: 5,
        numero_lot: 'RIN-2027-R50',
        date_fabrication: '2025-05-10',
        date_peremption: '2027-05-10',
        quantite_initiale: 250,
        quantite_restante: 65, // Stock total inférieur au seuil (80) -> ALERTE STOCK BAS
        prix_unitaire_cfa: 450,
        statut: 'actif',
        created_at: '2025-05-15T09:00:00Z',
      },

      // Gants d'examen (Taille M)
      {
        id: 10,
        produit_id: 6,
        numero_lot: 'GNT-2028-G10',
        date_fabrication: '2025-01-05',
        date_peremption: '2028-12-31',
        quantite_initiale: 300,
        quantite_restante: 220,
        prix_unitaire_cfa: 3500,
        statut: 'actif',
        created_at: '2025-01-10T10:00:00Z',
      },

      // Cathéters
      {
        id: 11,
        produit_id: 7,
        numero_lot: 'CAT-2027-C20',
        date_fabrication: '2025-03-01',
        date_peremption: '2027-09-30',
        quantite_initiale: 200,
        quantite_restante: 40, // Stock total inférieur au seuil (75) -> ALERTE STOCK BAS
        prix_unitaire_cfa: 350,
        statut: 'actif',
        created_at: '2025-03-05T08:00:00Z',
      }
    ];

    // 6. MOUVEMENTS DE STOCK HISTORIQUES
    this.mouvements = [
      {
        id: 1,
        type: 'entree',
        produit_id: 3,
        lot_id: 5,
        quantite: 150,
        service_dest_id: 7,
        motif: 'Livraison commande fournisseur Laborex CAM-2026-089',
        utilisateur_id: 2,
        utilisateur_nom: 'Chantal Ngo Bisseck (Logistique)',
        date_mouvement: '2026-09-01T09:15:00Z',
      },
      {
        id: 2,
        type: 'sortie',
        produit_id: 3,
        lot_id: 5,
        quantite: 30,
        service_source_id: 7,
        service_dest_id: 1,
        motif: 'Dotation hebdomadaire Service des Urgences (Règle FEFO)',
        utilisateur_id: 3,
        utilisateur_nom: 'Dr. Jean-Marc Eyenga (Pharmacie)',
        date_mouvement: '2026-09-10T11:00:00Z',
      },
      {
        id: 3,
        type: 'sortie',
        produit_id: 1,
        lot_id: 1,
        quantite: 10,
        service_source_id: 7,
        service_dest_id: 4,
        motif: 'Sortie contrôlée approuvée registre REG-2026-001 (Bloc Opératoire)',
        utilisateur_id: 2,
        utilisateur_nom: 'Chantal Ngo Bisseck (Logistique)',
        date_mouvement: '2026-09-25T14:40:00Z',
      }
    ];

    // 7. SORTIES DE PRODUITS CONTRÔLÉS (DOUBLE VALIDATION PHARMACIEN / LOGISTIQUE)
    const hashSignature1 = crypto.createHash('sha256').update('REG-2026-001|1|1|10|4|PAT-HGD-9021|Dr. Kamga|VALIDATED').digest('hex');
    this.sortiesControlees = [
      {
        id: 1,
        registre_numero: 'REG-2026-001',
        produit_id: 1,
        lot_id: 1,
        quantite: 10,
        service_demandeur_id: 4, // Bloc Central
        patient_ref_anonyme: 'PAT-HGD-9021',
        medecin_prescripteur: 'Dr. Mbarga (Anesthésiste)',
        motif_therapeutique: 'Protocole analgésie majeure per-opératoire et réveil polytraumatisé',
        pharmacien_initiateur_id: 3, // Dr. Eyenga
        date_initiation: '2026-09-25T10:15:00Z',
        logisticien_validateur_id: 2, // Chantal Ngo Bisseck
        date_validation: '2026-09-25T14:30:00Z',
        statut: 'approuve',
        motif_rejet: null,
        hash_registre_inviolable: hashSignature1,
      },
      {
        id: 2,
        registre_numero: 'REG-2026-002',
        produit_id: 1,
        lot_id: 1,
        quantite: 5,
        service_demandeur_id: 1, // Urgences
        patient_ref_anonyme: 'PAT-HGD-9104',
        medecin_prescripteur: 'Pr. Alain Kamga',
        motif_therapeutique: 'Prise en charge douleur aiguë infarctus du myocarde étendu',
        pharmacien_initiateur_id: 3, // Dr. Eyenga
        date_initiation: '2026-10-07T11:20:00Z',
        logisticien_validateur_id: null,
        date_validation: null,
        statut: 'en_attente', // EN ATTENTE DE LA VALIDATION DU LOGISTICIEN !
        motif_rejet: null,
        hash_registre_inviolable: null,
      }
    ];

    // 8. INTERVENTIONS ET CALENDRIER DE MAINTENANCE
    this.maintenances = [
      {
        id: 1,
        equipement_id: 1, // Respirateur Dräger
        type: 'preventive',
        priorite: 'haute',
        description_panne: 'Contrôle annuel des capteurs O2, valve expiratoire et calibration débitmétrique',
        date_planifiee: '2026-10-20',
        date_realisation: null,
        technicien_id: 4,
        statut: 'planifiee',
        pieces_remplacees: null,
        cout_intervention_cfa: 150000,
        rapport_technique: null,
        created_at: '2026-09-01T08:00:00Z',
      },
      {
        id: 2,
        equipement_id: 5, // Bistouri Covidien
        type: 'curative',
        priorite: 'urgente',
        description_panne: 'Message d\'erreur E-14 (défaut de contact plaque neutre) pendant intervention',
        date_planifiee: '2026-10-03', // EN RETARD ! (Planifiée le 3 oct, date courante 8 oct)
        date_realisation: null,
        technicien_id: 4,
        statut: 'en_retard',
        pieces_remplacees: null,
        cout_intervention_cfa: 85000,
        rapport_technique: 'Diagnostic préliminaire: câble adaptateur de retour patient endommagé.',
        created_at: '2026-10-03T09:00:00Z',
      },
      {
        id: 3,
        equipement_id: 8, // Incubateur Néonatal
        type: 'curative',
        priorite: 'haute',
        description_panne: 'Alarme sonore continue et dérive de la sonde cutanée 1 (> +1.8°C)',
        date_planifiee: '2026-10-01',
        date_realisation: null,
        technicien_id: 4,
        statut: 'en_retard',
        pieces_remplacees: null,
        cout_intervention_cfa: 120000,
        rapport_technique: 'Carte régulateur thermique à remplacer. Devis fournisseur en attente.',
        created_at: '2026-10-01T08:00:00Z',
      },
      {
        id: 4,
        equipement_id: 6, // Scanner Siemens
        type: 'preventive',
        priorite: 'moyenne',
        description_panne: 'Maintenance trimestrielle contractuelle Siemens Healthineers: graissage gantry et test détecteurs',
        date_planifiee: '2026-09-15',
        date_realisation: '2026-09-15T15:00:00Z',
        technicien_id: 4,
        statut: 'terminee',
        pieces_remplacees: 'Filtres poussières d\'armoire électronique',
        cout_intervention_cfa: 450000,
        rapport_technique: 'Intervention certifiée conforme par l\'ingénieur Siemens. Qualité image 100%.',
        created_at: '2026-09-01T08:00:00Z',
      }
    ];

    // 9. FOURNISSEURS & BONS DE COMMANDE
    this.fournisseurs = [
      {
        id: 1,
        nom: 'Laborex Cameroun S.A.',
        contact_nom: 'M. Henri Manga',
        telephone: '+237 233 42 15 80',
        email: 'commandes@laborex-cameroun.com',
        adresse: 'Zone Industrielle de Bassa, Douala',
        ville: 'Douala',
        delai_moyen_jours: 3,
        note_fiabilite: 4.8,
      },
      {
        id: 2,
        nom: 'UCIPHARM Cameroun',
        contact_nom: 'Mme Sandrine Ngo',
        telephone: '+237 233 40 88 12',
        email: 'ventes@ucipharm.cm',
        adresse: 'Rue Ivy, Akwa, Douala',
        ville: 'Douala',
        delai_moyen_jours: 5,
        note_fiabilite: 4.4,
      },
      {
        id: 3,
        nom: 'CAMEDIC Médical Sarl',
        contact_nom: 'Ing. Patrice Eboumbou',
        telephone: '+237 699 80 44 22',
        email: 'support@camedic-biomed.cm',
        adresse: 'Boulevard de la Liberté, Akwa, Douala',
        ville: 'Douala',
        delai_moyen_jours: 10,
        note_fiabilite: 4.6,
      },
      {
        id: 4,
        nom: 'Siemens Healthineers Central Africa',
        contact_nom: 'Dr. Frank Essomba',
        telephone: '+237 233 43 90 00',
        email: 'central-africa@siemens-healthineers.com',
        adresse: 'Immeuble Krystal Palace, Bonanjo, Douala',
        ville: 'Douala',
        delai_moyen_jours: 14,
        note_fiabilite: 4.9,
      }
    ];

    this.commandes = [
      {
        id: 1,
        reference: 'CMD-HGD-2026-091',
        fournisseur_id: 1,
        date_commande: '2026-09-28',
        date_livraison_estimee: '2026-10-02',
        date_reception_reelle: '2026-10-03T10:00:00Z',
        statut: 'livree',
        montant_total_cfa: 875000,
        cree_par_id: 2,
        commentaires: 'Livraison conforme des solutés Ringer Lactate et Paracétamol IV.',
        lignes: [
          { id: 1, commande_id: 1, designation: 'Ringer Lactate Soluté 500ml', quantite: 500, prix_unitaire_cfa: 450 },
          { id: 2, commande_id: 1, designation: 'Paracétamol Injectable 100ml', quantite: 1000, prix_unitaire_cfa: 650 }
        ]
      },
      {
        id: 2,
        reference: 'CMD-HGD-2026-104',
        fournisseur_id: 3,
        date_commande: '2026-10-04',
        date_livraison_estimee: '2026-10-14',
        date_reception_reelle: null,
        statut: 'en_attente',
        montant_total_cfa: 2350000,
        cree_par_id: 2,
        commentaires: 'Commande urgente de pièces détachées pour respirateurs et sondes thermiques pédiatriques.',
        lignes: [
          { id: 3, commande_id: 2, designation: 'Capteurs O2 médicaux Dräger V300', quantite: 4, prix_unitaire_cfa: 220000 },
          { id: 4, commande_id: 2, designation: 'Sondes cutanées régulation OmniBed Giraffe', quantite: 5, prix_unitaire_cfa: 150000 },
          { id: 5, commande_id: 2, designation: 'Câble plaque neutre Valleylab Covidien', quantite: 2, prix_unitaire_cfa: 360000 }
        ]
      }
    ];

    // 10. DEMANDES D'ALLOCATION ENTRE SERVICES
    this.demandesAllocation = [
      {
        id: 1,
        service_demandeur_id: 1, // Urgences
        chef_service_id: 5, // Pr. Alain Kamga
        type_ressource: 'equipement',
        designation_ressource: 'Respirateur de transport pour évacuation SMUR',
        quantite: 1,
        justification: 'Hausse brutale des arrivées traumatismes crâniens graves suite accident axe lourd Douala-Yaoundé',
        urgence: 'vitale',
        statut: 'approuvee',
        traite_par_id: 2,
        date_traitement: '2026-10-06T14:00:00Z',
        date_demande: '2026-10-06T11:30:00Z',
        commentaire_reponse: 'Mise à disposition immédiate du respirateur de réserve du Bloc Opératoire.',
        equipement_transfere_id: 1
      },
      {
        id: 2,
        service_demandeur_id: 2, // Maternité
        chef_service_id: 5, // Représentant chef de pôle
        type_ressource: 'lit',
        designation_ressource: 'Lit d\'hospitalisation avec surveillance cardiotocographique',
        quantite: 2,
        justification: 'Surcharge temporaire du service obstétrique après afflux de grossesses gémellaires à risque',
        urgence: 'urgente',
        statut: 'en_attente',
        traite_par_id: null,
        date_traitement: null,
        date_demande: '2026-10-07T16:45:00Z',
        commentaire_reponse: null,
      }
    ];

    // 11. ALERTES DU SYSTÈME (GÉNÉRÉES)
    this.alertes = [
      {
        id: 1,
        type: 'peremption_atteinte',
        niveau: 'critique',
        titre: 'Lot de médicament périmé détecté',
        message: 'Le lot PCM-PER-2026-X09 (Paracétamol Injectable 100ml) est périmé depuis le 15/08/2026. Toute sortie est strictement bloquée par l\'algorithme FEFO.',
        entite_type: 'lot',
        entite_id: 4,
        est_lu: false,
        created_at: '2026-10-01T08:00:00Z',
      },
      {
        id: 2,
        type: 'peremption_proche',
        niveau: 'avertissement',
        titre: 'Péremption imminente (< 30 jours)',
        message: 'Le lot PCM-URG-2026-C01 (Paracétamol Injectable) expire le 25/10/2026 (dans 17 jours). Quantité restante : 18 poches.',
        entite_type: 'lot',
        entite_id: 5,
        est_lu: false,
        created_at: '2026-10-05T08:00:00Z',
      },
      {
        id: 3,
        type: 'stock_bas',
        niveau: 'critique',
        titre: 'Stock critique : Ringer Lactate 500ml',
        message: 'Stock disponible (65 poches) inférieur au seuil d\'alerte minimal fixé à 80 poches. Risque de rupture au bloc opératoire.',
        entite_type: 'produit',
        entite_id: 5,
        est_lu: false,
        created_at: '2026-10-06T08:00:00Z',
      },
      {
        id: 4,
        type: 'maintenance_retard',
        niveau: 'critique',
        titre: 'Maintenance en retard : Bistouri Covidien Valleylab FT10',
        message: 'L\'intervention curative #2 planifiée pour le 03/10/2026 n\'a pas été achevée. L\'équipement est indisponible au Bloc Central.',
        entite_type: 'maintenance',
        entite_id: 2,
        est_lu: false,
        created_at: '2026-10-04T08:00:00Z',
      },
      {
        id: 5,
        type: 'equipement_panne',
        niveau: 'critique',
        titre: 'Équipement hors service : Incubateur Néonatal Hybride',
        message: 'L\'incubateur EQ-HGD-PED-006 en Pédiatrie a été déclaré hors service suite à une alarme de surchauffe.',
        entite_type: 'equipement',
        entite_id: 8,
        est_lu: true,
        created_at: '2026-10-02T09:00:00Z',
      }
    ];

    // 12. JOURNAL DES SMS SIMULÉS
    this.journalSMS = [
      {
        id: 1,
        destinataire_nom: 'Chantal Ngo Bisseck (Logistique)',
        telephone: '+237 677 22 33 44',
        type_alerte: 'STOCK_CRITIQUE',
        message: '[HGD ALERTE] Stock critique: Ringer Lactate 500ml disponible: 65 (seuil: 80). Veuillez lancer réapprovisionnement.',
        statut_envoi: 'SIMULÉ_OK',
        date_envoi: '2026-10-06T08:01:00Z',
      },
      {
        id: 2,
        destinataire_nom: 'Gervais Tchouassi (Maintenance)',
        telephone: '+237 670 98 76 54',
        type_alerte: 'MAINTENANCE_RETARD',
        message: '[HGD BIOMED] Retard intervention #2: Bistouri Covidien Bloc 2. Urgence signalée par chef de bloc.',
        statut_envoi: 'SIMULÉ_OK',
        date_envoi: '2026-10-04T08:05:00Z',
      },
      {
        id: 3,
        destinataire_nom: 'Dr. Eyenga (Pharmacie)',
        telephone: '+237 691 45 67 89',
        type_alerte: 'PEREMPTION_PROCHE',
        message: '[HGD PHARMACIE] Lot PCM-URG-2026-C01 Paracétamol expire le 25/10/2026 (<30j). Priorité de distribution FEFO requise.',
        statut_envoi: 'SIMULÉ_OK',
        date_envoi: '2026-10-05T08:02:00Z',
      }
    ];

    // 13. JOURNAL D'AUDIT INVIOLABLE
    this.journalAudit = [
      {
        id: 1,
        utilisateur_id: 1,
        utilisateur_nom: 'Samuel Mbassi (Admin)',
        role: 'admin',
        action: 'INITIALISATION_SYSTEME',
        entite: 'System',
        entite_id: 'GLOBAL',
        details: 'Initialisation de l\'inventaire et des paramètres institutionnels de l\'Hôpital Général de Douala.',
        ip_address: '192.168.1.10',
        created_at: '2026-09-01T08:00:00Z',
      },
      {
        id: 2,
        utilisateur_id: 3,
        utilisateur_nom: 'Dr. Jean-Marc Eyenga (Pharmacien)',
        role: 'pharmacien',
        action: 'INITIATION_SORTIE_CONTROLEE',
        entite: 'SortieControlee',
        entite_id: 'REG-2026-001',
        details: 'Initiation demande de 10 ampoules Morphine 10mg pour le Bloc Central (Patient PAT-HGD-9021).',
        ip_address: '192.168.1.45',
        created_at: '2026-09-25T10:15:00Z',
      },
      {
        id: 3,
        utilisateur_id: 2,
        utilisateur_nom: 'Chantal Ngo Bisseck (Logistique)',
        role: 'logistique',
        action: 'APPROBATION_SORTIE_CONTROLEE',
        entite: 'SortieControlee',
        entite_id: 'REG-2026-001',
        details: 'Validation et déstockage officiel avec signature cryptographique sha256.',
        ip_address: '192.168.1.30',
        created_at: '2026-09-25T14:30:00Z',
      },
      {
        id: 4,
        utilisateur_id: 4,
        utilisateur_nom: 'Gervais Tchouassi (Maintenance)',
        role: 'maintenance',
        action: 'DECLARATION_PANNE_EQUIPEMENT',
        entite: 'Equipement',
        entite_id: 'EQ-HGD-PED-006',
        details: 'Passage du statut à "hors_service" suite à un défaut critique du capteur de chauffe néonatal.',
        ip_address: '192.168.1.80',
        created_at: '2026-10-02T08:30:00Z',
      }
    ];

    // 14. PARAMÈTRES INSTITUTIONNELS
    this.parametres.set('seuil_peremption_lointaine_jours', {
      cle: 'seuil_peremption_lointaine_jours',
      valeur: '90',
      description: 'Délai d\'alerte précoce de péremption de lot (jours)',
    });
    this.parametres.set('seuil_peremption_urgente_jours', {
      cle: 'seuil_peremption_urgente_jours',
      valeur: '30',
      description: 'Délai d\'alerte critique de péremption de lot (jours)',
    });
    this.parametres.set('sms_simulation_actif', {
      cle: 'sms_simulation_actif',
      valeur: 'true',
      description: 'Activation du journal des SMS d\'urgence simulés',
    });
    this.parametres.set('institution_nom', {
      cle: 'institution_nom',
      valeur: 'Hôpital Général de Douala',
      description: 'Nom de l\'établissement hospitalier',
    });
    this.parametres.set('institution_ville', {
      cle: 'institution_ville',
      valeur: 'Douala, Cameroun',
      description: 'Localisation de l\'établissement',
    });
  }

  // --- Helpers de requêtage pour Sequelize / DB Layer substitution ---

  public getProduitTotalStock(produitId: number): number {
    return this.lots
      .filter((l) => l.produit_id === produitId && l.statut === 'actif')
      .reduce((acc, curr) => acc + curr.quantite_restante, 0);
  }

  public getNextId<T extends { id: number }>(items: T[]): number {
    if (items.length === 0) return 1;
    return Math.max(...items.map((i) => i.id)) + 1;
  }
}

export const store = new DataStore();
