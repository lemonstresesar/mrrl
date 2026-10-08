-- ==============================================================================
-- BASE DE DONNÉES RELATIONNELLE : HÔPITAL GÉNÉRAL DE DOUALA (HGD)
-- Système de Gestion des Ressources Médicales (HGD MediGest)
-- Projet Académique de DUT - Schéma compatible MySQL 8.0+ / MariaDB / Sequelize
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `hgd_medigest` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `hgd_medigest`;

-- ------------------------------------------------------------------------------
-- 1. TABLE DES SERVICES HOSPITALIERS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `services` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(20) NOT NULL UNIQUE,
  `nom` VARCHAR(100) NOT NULL,
  `batiment` VARCHAR(50) NOT NULL,
  `etage` VARCHAR(20) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 2. TABLE DES UTILISATEURS ET COMPTES (AVEC RÔLES RBAC)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `nom` VARCHAR(100) NOT NULL,
  `prenom` VARCHAR(100) NOT NULL,
  `role` ENUM('admin', 'logistique', 'pharmacien', 'maintenance', 'chef_service') NOT NULL,
  `service_id` INT NULL,
  `active` BOOLEAN DEFAULT TRUE,
  `telephone` VARCHAR(30) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_users_service` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 3. TABLE DES ÉQUIPEMENTS ET LITS D'HOSPITALISATION
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `equipements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code_inventaire` VARCHAR(50) NOT NULL UNIQUE,
  `nom` VARCHAR(150) NOT NULL,
  `categorie` VARCHAR(80) NOT NULL,
  `numero_serie` VARCHAR(100) NOT NULL,
  `date_acquisition` DATE NOT NULL,
  `statut` ENUM('en_service', 'en_maintenance', 'hors_service', 'reforme') NOT NULL DEFAULT 'en_service',
  `service_id` INT NOT NULL,
  `salle` VARCHAR(50) NOT NULL,
  `garantie_expiration` DATE NULL,
  `etat_lit` ENUM('libre', 'occupe', 'non_applicable') NOT NULL DEFAULT 'non_applicable',
  `qr_code_data` TEXT NULL,
  `documents` TEXT NULL, -- URLs ou JSON décrivant manuels, certificats
  `est_archive` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_equipements_service` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX `idx_equipements_statut` ON `equipements` (`statut`);
CREATE INDEX `idx_equipements_categorie` ON `equipements` (`categorie`);

-- ------------------------------------------------------------------------------
-- 4. TABLE DES PRODUITS DE SANTÉ (MÉDICAMENTS & CONSOMMABLES)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `produits` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code_cis` VARCHAR(30) NOT NULL UNIQUE,
  `designation` VARCHAR(200) NOT NULL,
  `categorie` VARCHAR(80) NOT NULL,
  `forme_dosage` VARCHAR(100) NULL,
  `unite_mesure` VARCHAR(30) NOT NULL DEFAULT 'boîte',
  `seuil_alerte` INT NOT NULL DEFAULT 10,
  `est_controle` BOOLEAN DEFAULT FALSE, -- Flag stupéfiant / produit sous contrôle strict
  `temperature_stockage` VARCHAR(50) DEFAULT '15-25°C',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 5. TABLE DES LOTS DE PRODUITS (POUR GESTION FEFO)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `lots` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `produit_id` INT NOT NULL,
  `numero_lot` VARCHAR(50) NOT NULL,
  `date_fabrication` DATE NULL,
  `date_peremption` DATE NOT NULL,
  `quantite_initiale` INT NOT NULL,
  `quantite_restante` INT NOT NULL,
  `prix_unitaire_cfa` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `statut` ENUM('actif', 'perime', 'epuise') NOT NULL DEFAULT 'actif',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_lots_produit` FOREIGN KEY (`produit_id`) REFERENCES `produits`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX `idx_lots_peremption` ON `lots` (`date_peremption`);
CREATE INDEX `idx_lots_produit` ON `lots` (`produit_id`);

-- ------------------------------------------------------------------------------
-- 6. TABLE DES MOUVEMENTS DE STOCK
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `mouvements_stock` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `type` ENUM('entree', 'sortie', 'transfert', 'ajustement') NOT NULL,
  `produit_id` INT NOT NULL,
  `lot_id` INT NOT NULL,
  `quantite` INT NOT NULL,
  `service_source_id` INT NULL,
  `service_dest_id` INT NULL,
  `motif` VARCHAR(255) NOT NULL,
  `utilisateur_id` INT NOT NULL,
  `date_mouvement` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_mouvements_produit` FOREIGN KEY (`produit_id`) REFERENCES `produits`(`id`),
  CONSTRAINT `fk_mouvements_lot` FOREIGN KEY (`lot_id`) REFERENCES `lots`(`id`),
  CONSTRAINT `fk_mouvements_utilisateur` FOREIGN KEY (`utilisateur_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 7. TABLE DES SORTIES DE PRODUITS CONTRÔLÉS (DOUBLE VALIDATION PHARMACIEN/LOGISTIQUE)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sorties_controlees` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `registre_numero` VARCHAR(50) NOT NULL UNIQUE,
  `produit_id` INT NOT NULL,
  `lot_id` INT NOT NULL,
  `quantite` INT NOT NULL,
  `service_demandeur_id` INT NOT NULL,
  `patient_ref_anonyme` VARCHAR(100) NOT NULL,
  `medecin_prescripteur` VARCHAR(100) NOT NULL,
  `motif_therapeutique` TEXT NOT NULL,
  `pharmacien_initiateur_id` INT NOT NULL,
  `date_initiation` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `logisticien_validateur_id` INT NULL,
  `date_validation` TIMESTAMP NULL,
  `statut` ENUM('en_attente', 'approuve', 'rejete') NOT NULL DEFAULT 'en_attente',
  `motif_rejet` TEXT NULL,
  `hash_registre_inviolable` VARCHAR(64) NULL, -- SHA-256 seal pour garantie d'intégrité
  CONSTRAINT `fk_sc_produit` FOREIGN KEY (`produit_id`) REFERENCES `produits`(`id`),
  CONSTRAINT `fk_sc_lot` FOREIGN KEY (`lot_id`) REFERENCES `lots`(`id`),
  CONSTRAINT `fk_sc_service` FOREIGN KEY (`service_demandeur_id`) REFERENCES `services`(`id`),
  CONSTRAINT `fk_sc_pharmacien` FOREIGN KEY (`pharmacien_initiateur_id`) REFERENCES `users`(`id`),
  CONSTRAINT `fk_sc_logisticien` FOREIGN KEY (`logisticien_validateur_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 8. TABLE DES INTERVENTIONS ET CALENDRIER DE MAINTENANCE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `maintenances` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `equipement_id` INT NOT NULL,
  `type` ENUM('preventive', 'curative') NOT NULL,
  `priorite` ENUM('basse', 'moyenne', 'haute', 'urgente') NOT NULL DEFAULT 'moyenne',
  `description_panne` TEXT NOT NULL,
  `date_planifiee` DATE NOT NULL,
  `date_realisation` TIMESTAMP NULL,
  `technicien_id` INT NULL,
  `statut` ENUM('planifiee', 'en_cours', 'terminee', 'en_retard', 'annulee') NOT NULL DEFAULT 'planifiee',
  `pieces_remplacees` TEXT NULL,
  `cout_intervention_cfa` DECIMAL(12,2) DEFAULT 0.00,
  `rapport_technique` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_maint_equipement` FOREIGN KEY (`equipement_id`) REFERENCES `equipements`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_maint_technicien` FOREIGN KEY (`technicien_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 9. TABLE DES FOURNISSEURS ET BONS DE COMMANDE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `fournisseurs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nom` VARCHAR(150) NOT NULL,
  `contact_nom` VARCHAR(100) NOT NULL,
  `telephone` VARCHAR(40) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `adresse` VARCHAR(255) NOT NULL,
  `ville` VARCHAR(100) DEFAULT 'Douala',
  `delai_moyen_jours` INT NOT NULL DEFAULT 7,
  `note_fiabilite` DECIMAL(3,2) DEFAULT 4.50,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `commandes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `reference` VARCHAR(50) NOT NULL UNIQUE,
  `fournisseur_id` INT NOT NULL,
  `date_commande` DATE NOT NULL,
  `date_livraison_estimee` DATE NOT NULL,
  `date_reception_reelle` DATE NULL,
  `statut` ENUM('en_attente', 'expediee', 'livree', 'annulee') NOT NULL DEFAULT 'en_attente',
  `montant_total_cfa` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `cree_par_id` INT NOT NULL,
  `commentaires` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_cmd_fournisseur` FOREIGN KEY (`fournisseur_id`) REFERENCES `fournisseurs`(`id`),
  CONSTRAINT `fk_cmd_user` FOREIGN KEY (`cree_par_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `commande_lignes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `commande_id` INT NOT NULL,
  `designation` VARCHAR(200) NOT NULL,
  `quantite` INT NOT NULL,
  `prix_unitaire_cfa` DECIMAL(10,2) NOT NULL,
  CONSTRAINT `fk_cmd_ligne` FOREIGN KEY (`commande_id`) REFERENCES `commandes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 10. TABLE DES DEMANDES D'ALLOCATION DE RESSOURCES ENTRE SERVICES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `demandes_allocation` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `service_demandeur_id` INT NOT NULL,
  `chef_service_id` INT NOT NULL,
  `type_ressource` ENUM('equipement', 'lit', 'produit') NOT NULL,
  `designation_ressource` VARCHAR(150) NOT NULL,
  `quantite` INT NOT NULL DEFAULT 1,
  `justification` TEXT NOT NULL,
  `urgence` ENUM('normale', 'urgente', 'vitale') NOT NULL DEFAULT 'normale',
  `statut` ENUM('en_attente', 'approuvee', 'rejetee', 'effectuee') NOT NULL DEFAULT 'en_attente',
  `traite_par_id` INT NULL,
  `date_traitement` TIMESTAMP NULL,
  `date_demande` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `commentaire_reponse` TEXT NULL,
  CONSTRAINT `fk_alloc_service` FOREIGN KEY (`service_demandeur_id`) REFERENCES `services`(`id`),
  CONSTRAINT `fk_alloc_chef` FOREIGN KEY (`chef_service_id`) REFERENCES `users`(`id`),
  CONSTRAINT `fk_alloc_traite_par` FOREIGN KEY (`traite_par_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 11. TABLE DES ALERTES SYSTÈME ET DU JOURNAL SMS SIMULÉ
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `alertes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `type` ENUM('stock_bas', 'peremption_proche', 'peremption_atteinte', 'maintenance_retard', 'equipement_panne') NOT NULL,
  `niveau` ENUM('info', 'avertissement', 'critique') NOT NULL,
  `titre` VARCHAR(150) NOT NULL,
  `message` TEXT NOT NULL,
  `entite_type` VARCHAR(50) NOT NULL,
  `entite_id` INT NOT NULL,
  `est_lu` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `journal_sms` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `destinataire_nom` VARCHAR(100) NOT NULL,
  `telephone` VARCHAR(40) NOT NULL,
  `type_alerte` VARCHAR(50) NOT NULL,
  `message` TEXT NOT NULL,
  `statut_envoi` VARCHAR(20) DEFAULT 'SIMULÉ_OK',
  `date_envoi` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 12. TABLE DU JOURNAL D'AUDIT INVIOLABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `journal_audit` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `utilisateur_id` INT NULL,
  `utilisateur_nom` VARCHAR(150) NOT NULL,
  `role` VARCHAR(50) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `entite` VARCHAR(50) NOT NULL,
  `entite_id` VARCHAR(50) NOT NULL,
  `details` TEXT NOT NULL,
  `ip_address` VARCHAR(50) DEFAULT '127.0.0.1',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 13. TABLE DES PARAMÈTRES DE L'HÔPITAL
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `parametres` (
  `cle` VARCHAR(50) PRIMARY KEY,
  `valeur` VARCHAR(255) NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
