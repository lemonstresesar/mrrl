export type UserRole = 'admin' | 'logistique' | 'pharmacien' | 'maintenance' | 'chef_service';

export interface User {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: UserRole;
  service_id: number | null;
  telephone?: string;
  active?: boolean;
}

export interface Service {
  id: number;
  code: string;
  nom: string;
  batiment: string;
  etage: string;
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
  service_nom?: string;
  service_code?: string;
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
  stock_actif?: number;
  stock_perime?: number;
  est_en_alerte?: boolean;
  prochain_lot_fefo?: {
    numero_lot: string;
    date_peremption: string;
    quantite: number;
  } | null;
  nb_lots?: number;
  created_at?: string;
}

export interface Lot {
  id: number;
  produit_id: number;
  produit_designation?: string;
  produit_est_controle?: boolean;
  unite_mesure?: string;
  numero_lot: string;
  date_fabrication?: string;
  date_peremption: string;
  quantite_initiale: number;
  quantite_restante: number;
  prix_unitaire_cfa: number;
  statut: 'actif' | 'perime' | 'epuise';
  jours_avant_peremption?: number;
  alerte_peremption?: 'normal' | 'avertissement' | 'critique' | 'perime';
  created_at?: string;
}

export interface MouvementStock {
  id: number;
  type: 'entree' | 'sortie' | 'transfert' | 'ajustement';
  produit_id: number;
  produit_designation?: string;
  produit_est_controle?: boolean;
  lot_id: number;
  numero_lot?: string;
  quantite: number;
  unite_mesure?: string;
  service_source_id?: number | null;
  service_source_nom?: string;
  service_dest_id?: number | null;
  service_dest_nom?: string;
  motif: string;
  utilisateur_id: number;
  utilisateur_nom?: string;
  date_mouvement: string;
}

export interface SortieControlee {
  id: number;
  registre_numero: string;
  produit_id: number;
  produit_designation?: string;
  forme_dosage?: string;
  unite_mesure?: string;
  lot_id: number;
  numero_lot?: string;
  date_peremption_lot?: string;
  quantite: number;
  service_demandeur_id: number;
  service_demandeur_nom?: string;
  patient_ref_anonyme: string;
  medecin_prescripteur: string;
  motif_therapeutique: string;
  pharmacien_initiateur_id: number;
  pharmacien_nom?: string;
  date_initiation: string;
  logisticien_validateur_id: number | null;
  logisticien_nom?: string | null;
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
  equipement_nom?: string;
  equipement_code?: string;
  equipement_statut?: string;
  service_nom?: string;
  salle?: string;
  type: MaintenanceType;
  priorite: MaintenancePriorite;
  description_panne: string;
  date_planifiee: string;
  date_realisation?: string | null;
  technicien_id: number | null;
  technicien_nom?: string;
  statut: MaintenanceStatut;
  pieces_remplacees?: string | null;
  cout_intervention_cfa: number;
  rapport_technique?: string | null;
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
  total_commandes?: number;
  total_livrees?: number;
  taux_succes_pct?: number;
  volume_total_cfa?: number;
}

export interface Commande {
  id: number;
  reference: string;
  fournisseur_id: number;
  fournisseur_nom?: string;
  fournisseur_telephone?: string;
  date_commande: string;
  date_livraison_estimee: string;
  date_reception_reelle?: string | null;
  statut: 'en_attente' | 'expediee' | 'livree' | 'annulee';
  montant_total_cfa: number;
  cree_par_id: number;
  createur_nom?: string;
  commentaires?: string;
  lignes?: Array<{
    id: number;
    designation: string;
    quantite: number;
    prix_unitaire_cfa: number;
  }>;
}

export interface DemandeAllocation {
  id: number;
  service_demandeur_id: number;
  service_demandeur_nom?: string;
  chef_service_id: number;
  chef_service_nom?: string;
  type_ressource: 'equipement' | 'lit' | 'produit';
  designation_ressource: string;
  quantite: number;
  justification: string;
  urgence: 'normale' | 'urgente' | 'vitale';
  statut: 'en_attente' | 'approuvee' | 'rejetee' | 'effectuee';
  traite_par_id: number | null;
  traite_par_nom?: string | null;
  date_traitement: string | null;
  date_demande: string;
  commentaire_reponse?: string | null;
  equipement_transfere_id?: number | null;
  equipement_transfere_nom?: string | null;
}

export interface Alerte {
  id: number;
  type: 'stock_bas' | 'peremption_proche' | 'peremption_atteinte' | 'maintenance_retard' | 'equipement_panne';
  niveau: 'info' | 'avertissement' | 'critique';
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
