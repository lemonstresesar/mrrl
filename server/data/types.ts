export type UserRole = 'admin' | 'logistique' | 'pharmacien' | 'maintenance' | 'chef_service';

export interface Service {
  id: number;
  code: string;
  nom: string;
  batiment: string;
  etage: string;
}

export interface User {
  id: number;
  email: string;
  password_hash: string;
  nom: string;
  prenom: string;
  role: UserRole;
  service_id: number | null;
  active: boolean;
  telephone?: string;
  created_at: string;
}

export type EquipementStatut = 'en_service' | 'en_maintenance' | 'hors_service' | 'reforme';
export type LitEtat = 'libre' | 'occupe' | 'non_applicable';

export interface Equipement {
  id: number;
  code_inventaire: string;
  nom: string;
  categorie: string;
  numero_serie: string;
  date_acquisition: string;
  statut: EquipementStatut;
  service_id: number;
  salle: string;
  garantie_expiration: string;
  etat_lit: LitEtat;
  qr_code_data?: string;
  documents?: string;
  est_archive: boolean;
  created_at: string;
  updated_at: string;
}

export interface Produit {
  id: number;
  code_cis: string;
  designation: string;
  categorie: string;
  forme_dosage?: string;
  unite_mesure: string;
  seuil_alerte: number;
  est_controle: boolean;
  temperature_stockage: string;
  created_at: string;
}

export interface Lot {
  id: number;
  produit_id: number;
  numero_lot: string;
  date_fabrication?: string;
  date_peremption: string;
  quantite_initiale: number;
  quantite_restante: number;
  prix_unitaire_cfa: number;
  statut: 'actif' | 'perime' | 'epuise';
  created_at: string;
}

export type MouvementType = 'entree' | 'sortie' | 'transfert' | 'ajustement';

export interface MouvementStock {
  id: number;
  type: MouvementType;
  produit_id: number;
  lot_id: number;
  quantite: number;
  service_source_id?: number | null;
  service_dest_id?: number | null;
  motif: string;
  utilisateur_id: number;
  utilisateur_nom?: string;
  date_mouvement: string;
}

export interface SortieControlee {
  id: number;
  registre_numero: string;
  produit_id: number;
  lot_id: number;
  quantite: number;
  service_demandeur_id: number;
  patient_ref_anonyme: string;
  medecin_prescripteur: string;
  motif_therapeutique: string;
  pharmacien_initiateur_id: number;
  date_initiation: string;
  logisticien_validateur_id: number | null;
  date_validation: string | null;
  statut: 'en_attente' | 'approuve' | 'rejete';
  motif_rejet?: string | null;
  hash_registre_inviolable?: string | null;
}

export type MaintenanceType = 'preventive' | 'curative';
export type MaintenancePriorite = 'basse' | 'moyenne' | 'haute' | 'urgente';
export type MaintenanceStatut = 'planifiee' | 'en_cours' | 'terminee' | 'en_retard' | 'annulee';

export interface Maintenance {
  id: number;
  equipement_id: number;
  type: MaintenanceType;
  priorite: MaintenancePriorite;
  description_panne: string;
  date_planifiee: string;
  date_realisation?: string | null;
  technicien_id: number | null;
  statut: MaintenanceStatut;
  pieces_remplacees?: string | null;
  cout_intervention_cfa: number;
  rapport_technique?: string | null;
  created_at: string;
}

export interface Fournisseur {
  id: number;
  nom: string;
  contact_nom: string;
  telephone: string;
  email: string;
  adresse: string;
  ville: string;
  delai_moyen_jours: number;
  note_fiabilite: number;
}

export interface CommandeLigne {
  id: number;
  commande_id: number;
  designation: string;
  quantite: number;
  prix_unitaire_cfa: number;
}

export interface Commande {
  id: number;
  reference: string;
  fournisseur_id: number;
  date_commande: string;
  date_livraison_estimee: string;
  date_reception_reelle?: string | null;
  statut: 'en_attente' | 'expediee' | 'livree' | 'annulee';
  montant_total_cfa: number;
  cree_par_id: number;
  commentaires?: string;
  lignes?: CommandeLigne[];
}

export interface DemandeAllocation {
  id: number;
  service_demandeur_id: number;
  chef_service_id: number;
  type_ressource: 'equipement' | 'lit' | 'produit';
  designation_ressource: string;
  quantite: number;
  justification: string;
  urgence: 'normale' | 'urgente' | 'vitale';
  statut: 'en_attente' | 'approuvee' | 'rejetee' | 'effectuee';
  traite_par_id: number | null;
  date_traitement: string | null;
  date_demande: string;
  commentaire_reponse?: string | null;
  // If equipement transfer, id of transferred equipement
  equipement_transfere_id?: number | null;
}

export type AlerteType = 'stock_bas' | 'peremption_proche' | 'peremption_atteinte' | 'maintenance_retard' | 'equipement_panne';
export type AlerteNiveau = 'info' | 'avertissement' | 'critique';

export interface Alerte {
  id: number;
  type: AlerteType;
  niveau: AlerteNiveau;
  titre: string;
  message: string;
  entite_type: string;
  entite_id: number;
  est_lu: boolean;
  created_at: string;
}

export interface JournalSMS {
  id: number;
  destinataire_nom: string;
  telephone: string;
  type_alerte: string;
  message: string;
  statut_envoi: string;
  date_envoi: string;
}

export interface JournalAudit {
  id: number;
  utilisateur_id: number | null;
  utilisateur_nom: string;
  role: string;
  action: string;
  entite: string;
  entite_id: string;
  details: string;
  ip_address: string;
  created_at: string;
}

export interface Parametre {
  cle: string;
  valeur: string;
  description: string;
}
