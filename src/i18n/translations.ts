export type Language = 'fr' | 'en';

export const translations = {
  fr: {
    // Application
    app_title: 'HGD MediGest',
    app_subtitle: 'Hôpital Général de Douala',
    hospital_name: 'Hôpital Général de Douala',
    academic_project: 'Projet Académique DUT',
    
    // Navigation
    nav_dashboard: 'Tableau de Bord',
    nav_equipements: 'Équipements & Lits',
    nav_qr_scanner: 'Scanner QR Code',
    nav_stocks: 'Pharmacie & Stocks',
    nav_controlled: 'Produits Contrôlés',
    nav_maintenance: 'Maintenance Biomédicale',
    nav_suppliers: 'Fournisseurs & Commandes',
    nav_allocations: 'Allocations & Transferts',
    nav_alerts: 'Centre d\'Alertes & SMS',
    nav_reports: 'Rapports & Exports',
    nav_audit: 'Journal d\'Audit',
    nav_admin: 'Administration',
    nav_logout: 'Déconnexion',

    // Rôles
    role_admin: 'Administrateur',
    role_logistique: 'Responsable Logistique',
    role_pharmacien: 'Pharmacien',
    role_maintenance: 'Technicien Maintenance',
    role_chef_service: 'Chef de Service',

    // Statuts Équipements
    statut_en_service: 'En service',
    statut_en_maintenance: 'En maintenance',
    statut_hors_service: 'Hors service',
    statut_reforme: 'Réformé / Archivé',
    lit_libre: 'Lit Libre',
    lit_occupe: 'Lit Occupé',

    // Actions générales
    action_add: 'Ajouter',
    action_edit: 'Modifier',
    action_delete: 'Supprimer',
    action_save: 'Enregistrer',
    action_cancel: 'Annuler',
    action_search: 'Rechercher...',
    action_filter: 'Filtrer',
    action_export_pdf: 'Exporter en PDF',
    action_export_excel: 'Exporter en Excel',
    action_print_qr: 'Imprimer QR Code',
    action_scan: 'Scanner',
    action_validate: 'Valider',
    action_reject: 'Rejeter',
    action_initiate: 'Initier une sortie',
    action_mark_read: 'Marquer comme lu',
    action_mark_all_read: 'Tout marquer comme lu',
    action_refresh: 'Actualiser',

    // Dashboard
    dash_welcome: 'Bienvenue sur la plateforme de gestion des ressources médicales',
    dash_availability_rate: 'Taux de disponibilité des équipements',
    dash_bed_occupancy: 'Taux d\'occupation des lits',
    dash_critical_stocks: 'Stocks en alerte critique',
    dash_overdue_maint: 'Maintenances en retard',
    dash_pending_controlled: 'Sorties stupéfiants en attente',
    dash_pending_allocations: 'Demandes de ressources en attente',
    dash_active_alerts: 'Alertes non lues',
    dash_fefo_warning: 'Attention : Règle FEFO active (Priorité aux lots à péremption proche)',

    // Stocks & FEFO
    stock_fefo_title: 'Gestion des Stocks & Règle FEFO',
    stock_fefo_desc: 'First Expired, First Out : Toute sortie prélève automatiquement le lot non périmé dont l\'expiration est la plus proche. Les lots périmés sont formellement bloqués.',
    stock_exit_fefo: 'Sortie de Stock (FEFO)',
    stock_entry: 'Nouvelle Entrée / Réception',
    stock_alert_threshold: 'Seuil d\'alerte',
    stock_available: 'Stock disponible conforme',
    stock_expired: 'Stock périmé (bloqué)',
    stock_lot_number: 'N° Lot',
    stock_expiry_date: 'Date de péremption',
    stock_is_controlled: 'Produit Contrôlé (Stupéfiant)',

    // Produits Contrôlés
    controlled_title: 'Protocole des Produits Contrôlés & Stupéfiants',
    controlled_desc: 'Double-validation obligatoire : initiation par un pharmacien et approbation par un responsable logistique distinct. Registre inviolable scellé.',
    controlled_registry: 'Registre Officiel Scellé',
    controlled_pending: 'Demandes en Attente de Validation Logistique',
    controlled_patient_ref: 'Réf. Patient Anonymisée',
    controlled_prescriber: 'Médecin Prescripteur',
    controlled_indication: 'Motif Thérapeutique',
    controlled_two_user_rule: 'Règle des deux utilisateurs : Le validateur doit être différent de l\'initiateur.',

    // Maintenance
    maint_title: 'Maintenance Préventive & Curative',
    maint_schedule_preventive: 'Planifier maintenance préventive',
    maint_declare_breakdown: 'Déclarer une panne (Curative)',
    maint_overdue_tag: 'EN RETARD',
    maint_tech_report: 'Rapport technique',

    // Allocation
    alloc_title: 'Allocation et Transfert de Ressources',
    alloc_desc: 'Traitement des demandes des chefs de service et mise à jour automatique de la localisation physique.',
    alloc_new_request: 'Nouvelle Demande de Ressource',
    alloc_urgency_vital: 'Vitale (SMUR/Réa)',
    alloc_urgency_urgent: 'Urgente',
    alloc_urgency_normal: 'Normale',

    // Alertes
    alerts_title: 'Centre d\'Alertes Hospitalières',
    alerts_sms_journal: 'Journal des SMS d\'Urgence (Simulés)',
    alerts_scan_now: 'Exécuter le scan d\'alertes',

    // Authentication
    auth_login_title: 'Connexion au portail médical',
    auth_login_subtitle: 'Accès sécurisé pour le personnel de l\'Hôpital Général de Douala',
    auth_quick_roles: 'Comptes de démonstration (Accès en 1 clic pour l\'évaluation) :',
    auth_email_placeholder: 'ex: admin@hgd.cm',
    auth_password_placeholder: 'Mot de passe sécurisé',
    auth_btn_login: 'Se connecter',
  },
  en: {
    // Application
    app_title: 'HGD MediGest',
    app_subtitle: 'Douala General Hospital',
    hospital_name: 'Douala General Hospital',
    academic_project: 'DUT Academic Project',

    // Navigation
    nav_dashboard: 'Dashboard',
    nav_equipements: 'Equipment & Beds',
    nav_qr_scanner: 'QR Code Scanner',
    nav_stocks: 'Pharmacy & Stocks',
    nav_controlled: 'Controlled Substances',
    nav_maintenance: 'Biomedical Maintenance',
    nav_suppliers: 'Suppliers & Orders',
    nav_allocations: 'Allocations & Transfers',
    nav_alerts: 'Alert Center & SMS',
    nav_reports: 'Reports & Exports',
    nav_audit: 'Audit Log',
    nav_admin: 'Administration',
    nav_logout: 'Logout',

    // Roles
    role_admin: 'Administrator',
    role_logistique: 'Logistics Manager',
    role_pharmacien: 'Pharmacist',
    role_maintenance: 'Maintenance Tech',
    role_chef_service: 'Department Head',

    // Equipment Status
    statut_en_service: 'In Service',
    statut_en_maintenance: 'Under Maintenance',
    statut_hors_service: 'Out of Order',
    statut_reforme: 'Decommissioned / Archived',
    lit_libre: 'Bed Available',
    lit_occupe: 'Bed Occupied',

    // Actions
    action_add: 'Add',
    action_edit: 'Edit',
    action_delete: 'Delete',
    action_save: 'Save',
    action_cancel: 'Cancel',
    action_search: 'Search...',
    action_filter: 'Filter',
    action_export_pdf: 'Export to PDF',
    action_export_excel: 'Export to Excel',
    action_print_qr: 'Print QR Code',
    action_scan: 'Scan',
    action_validate: 'Approve',
    action_reject: 'Reject',
    action_initiate: 'Initiate Dispatch',
    action_mark_read: 'Mark as read',
    action_mark_all_read: 'Mark all as read',
    action_refresh: 'Refresh',

    // Dashboard
    dash_welcome: 'Welcome to the Medical Resource Management System',
    dash_availability_rate: 'Equipment Availability Rate',
    dash_bed_occupancy: 'Bed Occupancy Rate',
    dash_critical_stocks: 'Critical Stock Alerts',
    dash_overdue_maint: 'Overdue Maintenances',
    dash_pending_controlled: 'Pending Controlled Drug Dispatches',
    dash_pending_allocations: 'Pending Resource Requests',
    dash_active_alerts: 'Unread Alerts',
    dash_fefo_warning: 'Caution: FEFO Rule active (Priority to closest expiry batch)',

    // Stocks & FEFO
    stock_fefo_title: 'Stock Management & FEFO Rule',
    stock_fefo_desc: 'First Expired, First Out: Every dispatch automatically draws from the non-expired batch with the nearest expiry date. Expired batches are strictly locked.',
    stock_exit_fefo: 'Stock Dispatch (FEFO)',
    stock_entry: 'New Receipt / Intake',
    stock_alert_threshold: 'Alert Threshold',
    stock_available: 'Usable Compliant Stock',
    stock_expired: 'Expired Stock (Locked)',
    stock_lot_number: 'Batch No.',
    stock_expiry_date: 'Expiry Date',
    stock_is_controlled: 'Controlled Substance (Narcotic)',

    // Controlled Substances
    controlled_title: 'Controlled Substances & Narcotics Protocol',
    controlled_desc: 'Mandatory dual-authorization: initiated by pharmacist, approved by a distinct logistics officer. Sealed tamper-proof register.',
    controlled_registry: 'Official Sealed Register',
    controlled_pending: 'Requests Awaiting Logistics Approval',
    controlled_patient_ref: 'Anonymized Patient Ref',
    controlled_prescriber: 'Prescribing Physician',
    controlled_indication: 'Clinical Indication',
    controlled_two_user_rule: 'Two-user discipline: Approver must be different from initiator.',

    // Maintenance
    maint_title: 'Preventive & Curative Maintenance',
    maint_schedule_preventive: 'Schedule Preventive Maintenance',
    maint_declare_breakdown: 'Report Breakdown (Curative)',
    maint_overdue_tag: 'OVERDUE',
    maint_tech_report: 'Technical Report',

    // Allocation
    alloc_title: 'Resource Allocation & Transfers',
    alloc_desc: 'Department head resource requests and automatic physical location update upon dispatch.',
    alloc_new_request: 'New Resource Request',
    alloc_urgency_vital: 'Vital (ICU / Emergency)',
    alloc_urgency_urgent: 'Urgent',
    alloc_urgency_normal: 'Normal',

    // Alerts
    alerts_title: 'Hospital Alert Center',
    alerts_sms_journal: 'Emergency SMS Dispatch Log (Simulated)',
    alerts_scan_now: 'Run Alert Scan Now',

    // Authentication
    auth_login_title: 'Medical Portal Login',
    auth_login_subtitle: 'Secure access for Douala General Hospital staff',
    auth_quick_roles: 'Demonstration Accounts (1-Click Evaluation Access):',
    auth_email_placeholder: 'e.g. admin@hgd.cm',
    auth_password_placeholder: 'Secure password',
    auth_btn_login: 'Sign In',
  },
};
