import {
  Equipement,
  Produit,
  Lot,
  MouvementStock,
  SortieControlee,
  Maintenance,
  Fournisseur,
  Commande,
  DemandeAllocation,
  Alerte,
  JournalSMS,
  JournalAudit,
  User,
  Service
} from '../types';
import { clientMockStore } from './mockFallback';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('hgd_jwt_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Gestionnaire de secours pour déploiement Netlify statique sans Serverless Function
function handleStaticFallback<T>(endpoint: string, options: RequestInit = {}): T {
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body as string) : {};

  // Auth
  if (endpoint.includes('/auth/demo-accounts')) {
    return {
      accounts: [
        { role: 'admin', roleLibelle: 'Administrateur Général', email: 'admin@hgd.cm', password: 'Admin123!', nom: 'Samuel Mbassi', description: 'Comptes utilisateurs, paramètres et journal d\'audit.' },
        { role: 'logistique', roleLibelle: 'Responsable Logistique', email: 'logistique@hgd.cm', password: 'Logistique123!', nom: 'Chantal Ngo Bisseck', description: 'Inventaire matériel, lits et validation stupéfiants.' },
        { role: 'pharmacien', roleLibelle: 'Pharmacien Hospitalier', email: 'pharmacie@hgd.cm', password: 'Pharmacie123!', nom: 'Dr. Jean-Marc Eyenga', description: 'Gestion des médicaments FEFO et stupéfiants.' },
        { role: 'maintenance', roleLibelle: 'Technicien Biomed', email: 'maintenance@hgd.cm', password: 'Maintenance123!', nom: 'Gervais Tchouassi', description: 'Maintenance préventive, curative et scan QR.' },
        { role: 'chef_service', roleLibelle: 'Chef de Service (Urgences)', email: 'chef.urgences@hgd.cm', password: 'Chef123!', nom: 'Pr. Alain Kamga', description: 'Disponibilité des lits et demandes de ressources.' },
      ]
    } as T;
  }

  if (endpoint.includes('/auth/demo-login') || endpoint.includes('/auth/login')) {
    const role = body.role || 'admin';
    const foundUser = clientMockStore.users.find(u => u.role === role) || clientMockStore.users[0];
    const token = `fake-jwt-token-netlify-${Date.now()}`;
    return {
      token,
      user: foundUser,
      service: clientMockStore.services.find(s => s.id === foundUser.service_id) || null
    } as T;
  }

  if (endpoint.includes('/auth/me')) {
    return {
      user: clientMockStore.users[0],
      service: clientMockStore.services[0]
    } as T;
  }

  // Équipements
  if (endpoint.startsWith('/equipements')) {
    if (endpoint.includes('/qr-code')) {
      return {
        code_inventaire: 'EQ-HGD-URG-001',
        nom: 'Respirateur Dräger Evita V300',
        service: 'Urgences',
        salle: 'Déchoquage 1',
        qrDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      } as T;
    }
    const enriched = clientMockStore.equipements.map(e => ({
      ...e,
      service_nom: clientMockStore.services.find(s => s.id === e.service_id)?.nom || 'Urgences',
      service_code: clientMockStore.services.find(s => s.id === e.service_id)?.code || 'URG',
    }));
    return { equipements: enriched } as T;
  }

  // Stocks
  if (endpoint.startsWith('/stocks/produits')) {
    const enriched = clientMockStore.produits.map(p => ({
      ...p,
      stock_actif: 120,
      stock_perime: p.id === 3 ? 25 : 0,
      est_en_alerte: p.id === 5,
      prochain_lot_fefo: { numero_lot: 'LOT-2026-A1', date_peremption: '2026-10-25', quantite: 18 },
      nb_lots: 2,
    }));
    return { produits: enriched } as T;
  }

  if (endpoint.startsWith('/stocks/lots')) {
    const enriched = clientMockStore.lots.map(l => ({
      ...l,
      produit_designation: clientMockStore.produits.find(p => p.id === l.produit_id)?.designation || 'Produit',
      unite_mesure: 'unités',
      alerte_peremption: l.statut === 'perime' ? 'perime' : 'normal',
    }));
    return { lots: enriched } as T;
  }

  // Stupéfiants
  if (endpoint.includes('/controlled-substances/registry')) {
    const enriched = clientMockStore.sortiesControlees.map(s => ({
      ...s,
      produit_designation: 'Morphine Chlorhydrate 10mg/1ml',
      unite_mesure: 'ampoules',
      numero_lot: 'MOR-2026-A12',
      service_demandeur_nom: 'Bloc Opératoire Central',
      pharmacien_nom: 'Dr. Jean-Marc Eyenga',
      logisticien_nom: 'Chantal Ngo Bisseck',
    }));
    return { registry: enriched } as T;
  }

  if (endpoint.includes('/controlled-substances/pending')) {
    const enriched = clientMockStore.sortiesControlees.filter(s => s.statut === 'en_attente').map(s => ({
      ...s,
      produit_designation: 'Morphine Chlorhydrate 10mg/1ml',
      unite_mesure: 'ampoules',
      numero_lot: 'MOR-2026-A12',
      service_demandeur_nom: 'Urgences & Réanimation',
      pharmacien_nom: 'Dr. Jean-Marc Eyenga',
    }));
    return { pending: enriched } as T;
  }

  // Maintenance
  if (endpoint.startsWith('/maintenance')) {
    const enriched = clientMockStore.maintenances.map(m => ({
      ...m,
      equipement_nom: clientMockStore.equipements.find(e => e.id === m.equipement_id)?.nom || 'Équipement',
      equipement_code: clientMockStore.equipements.find(e => e.id === m.equipement_id)?.code_inventaire || 'EQ',
      service_nom: 'Urgences',
      salle: 'Salle Déchoquage 1',
      technicien_nom: 'Gervais Tchouassi',
    }));
    return { maintenances: enriched } as T;
  }

  // Alertes
  if (endpoint.startsWith('/alertes/sms-journal')) {
    return { journal_sms: [] } as T;
  }

  if (endpoint.startsWith('/alertes')) {
    return { alertes: clientMockStore.alertes, total_non_lues: clientMockStore.alertes.length } as T;
  }

  // Stats
  if (endpoint.includes('/reports/dashboard-stats')) {
    return {
      equipements: { total: 7, en_service: 5, en_maintenance: 1, hors_service: 1, taux_disponibilite_pct: 71 },
      lits: { total: 2, libres: 1, occupes: 1, taux_occupation_pct: 50 },
      stocks: { total_produits: 5, produits_critiques_count: 1, lots_perimes_bloques: 1 },
      maintenance: { total: 2, en_retard: 1, planifiees: 1 },
      sorties_controlees: { en_attente: 1, total_validees: 1 },
      service_stats: clientMockStore.services.map(s => ({
        service_id: s.id, service_nom: s.nom, service_code: s.code, total_equipements: 2, en_service: 2, en_panne: 0, lits_libres: 1
      }))
    } as T;
  }

  return {} as T;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    // Si le serveur backend Express ou la fonction Netlify répond
    if (res.status !== 404) {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Erreur requête (${res.status})`);
      }
      return data;
    }
  } catch (err: any) {
    // Si c'est une vraie erreur de validation du backend (ex: FEFO bloqué), propager l'erreur
    if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('404')) {
      throw err;
    }
  }

  // Fallback si l'API est absente (ex: Netlify hébergement statique pur sans Serverless Functions)
  return handleStaticFallback<T>(endpoint, options);
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<{ token: string; user: User; service: Service | null }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  demoLogin: (role: string) =>
    request<{ token: string; user: User; service: Service | null }>('/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role }),
    }),

  getDemoAccounts: () =>
    request<{ accounts: any[] }>('/auth/demo-accounts'),

  getMe: () =>
    request<{ user: User; service: Service | null }>('/auth/me'),

  // Equipements
  getEquipements: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ equipements: Equipement[] }>(`/equipements${query}`);
  },

  getEquipement: (id: number) =>
    request<{ equipement: Equipement; maintenances: Maintenance[]; auditLogs: JournalAudit[] }>(`/equipements/${id}`),

  lookupEquipement: (code: string) =>
    request<{ equipement: Equipement; maintenances: Maintenance[] }>(`/equipements/lookup/${encodeURIComponent(code)}`),

  createEquipement: (data: Partial<Equipement>) =>
    request<{ equipement: Equipement }>('/equipements', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateEquipement: (id: number, data: Partial<Equipement>) =>
    request<{ equipement: Equipement }>(`/equipements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  updateLitStatus: (id: number, etat_lit: 'libre' | 'occupe') =>
    request<{ equipement: Equipement }>(`/equipements/${id}/lit-status`, {
      method: 'PUT',
      body: JSON.stringify({ etat_lit }),
    }),

  archiveEquipement: (id: number) =>
    request<{ equipement: Equipement }>(`/equipements/${id}/archiver`, {
      method: 'PUT',
    }),

  getQRCode: (id: number) =>
    request<{ code_inventaire: string; nom: string; service?: string; salle?: string; qrDataUrl: string }>(`/equipements/${id}/qr-code`),

  // Stocks & Lots
  getProduits: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ produits: Produit[] }>(`/stocks/produits${query}`);
  },

  createProduit: (data: Partial<Produit>) =>
    request<{ produit: Produit }>('/stocks/produits', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getLots: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ lots: Lot[] }>(`/stocks/lots${query}`);
  },

  createLot: (data: any) =>
    request<{ lot: Lot; mouvement: MouvementStock }>('/stocks/lots', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  executeFefoExit: (data: {
    produit_id: number;
    quantite: number;
    service_source_id?: number | null;
    service_dest_id?: number | null;
    motif: string;
    lot_id?: number | null;
  }) =>
    request<{ message: string; allocations: any[]; mouvements: MouvementStock[] }>('/stocks/mouvements/sortie', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMouvements: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ mouvements: MouvementStock[] }>(`/stocks/mouvements${query}`);
  },

  // Produits Contrôlés (Stupéfiants)
  getControlledRegistry: () =>
    request<{ registry: SortieControlee[] }>('/controlled-substances/registry'),

  getControlledPending: () =>
    request<{ pending: SortieControlee[] }>('/controlled-substances/pending'),

  initiateControlledExit: (data: {
    produit_id: number;
    lot_id?: number;
    quantite: number;
    service_demandeur_id: number;
    patient_ref_anonyme: string;
    medecin_prescripteur: string;
    motif_therapeutique: string;
  }) =>
    request<{ message: string; demande: SortieControlee }>('/controlled-substances/initiate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  approveControlledExit: (id: number) =>
    request<{ message: string; demande: SortieControlee; mouvement: MouvementStock }>(`/controlled-substances/${id}/approve`, {
      method: 'POST',
    }),

  rejectControlledExit: (id: number, motif_rejet: string) =>
    request<{ message: string; demande: SortieControlee }>(`/controlled-substances/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ motif_rejet }),
    }),

  // Maintenance
  getMaintenances: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ maintenances: Maintenance[] }>(`/maintenance${query}`);
  },

  createMaintenance: (data: Partial<Maintenance>) =>
    request<{ maintenance: Maintenance; equipement: Equipement }>('/maintenance', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateMaintenance: (id: number, data: Partial<Maintenance> & { remettre_en_service?: boolean }) =>
    request<{ maintenance: Maintenance }>(`/maintenance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Fournisseurs & Commandes
  getFournisseurs: () =>
    request<{ fournisseurs: Fournisseur[] }>('/fournisseurs'),

  createFournisseur: (data: Partial<Fournisseur>) =>
    request<{ fournisseur: Fournisseur }>('/fournisseurs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getComparateurFournisseurs: () =>
    request<{ comparateur: any[] }>('/fournisseurs/comparateur'),

  getCommandes: () =>
    request<{ commandes: Commande[] }>('/fournisseurs/commandes'),

  createCommande: (data: any) =>
    request<{ commande: Commande }>('/fournisseurs/commandes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCommandeStatut: (id: number, statut: string) =>
    request<{ commande: Commande }>(`/fournisseurs/commandes/${id}/statut`, {
      method: 'PUT',
      body: JSON.stringify({ statut }),
    }),

  // Allocations & Transferts
  getAllocations: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ allocations: DemandeAllocation[] }>(`/allocations${query}`);
  },

  createAllocation: (data: Partial<DemandeAllocation>) =>
    request<{ demande: DemandeAllocation }>('/allocations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  traiterAllocation: (id: number, data: { decision: 'approuvee' | 'rejetee'; commentaire_reponse?: string; equipement_id?: number; nouvelle_salle?: string }) =>
    request<{ message: string; demande: DemandeAllocation; equipementModifie?: Equipement }>(`/allocations/${id}/traiter`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Alertes & SMS
  getAlertes: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ alertes: Alerte[]; total_non_lues: number }>(`/alertes${query}`);
  },

  markAlerteRead: (id: number) =>
    request<{ alerte: Alerte }>(`/alertes/${id}/lu`, {
      method: 'PUT',
    }),

  markAllAlertesRead: () =>
    request<{ message: string }>('/alertes/actions/lire-tous', {
      method: 'PUT',
    }),

  triggerAlertScan: () =>
    request<{ message: string; count: number; scannedAt: string; total_alertes: number; non_lues: number }>('/alertes/actions/scan', {
      method: 'POST',
    }),

  getSMSJournal: () =>
    request<{ journal_sms: JournalSMS[] }>('/alertes/sms-journal'),

  // Rapports & Stats
  getDashboardStats: () =>
    request<any>('/reports/dashboard-stats'),

  // Audit
  getAuditLog: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ audit_log: JournalAudit[] }>(`/audit-log${query}`);
  },

  // Admin
  getUsers: () =>
    request<{ users: User[] }>('/admin/users'),

  createUser: (data: any) =>
    request<{ user: User }>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  toggleUserStatus: (id: number, active: boolean) =>
    request<{ user: User }>(`/admin/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ active }),
    }),

  getServices: () =>
    request<{ services: Service[] }>('/admin/services'),

  getSettings: () =>
    request<{ settings: Record<string, any> }>('/admin/settings'),

  updateSetting: (cle: string, valeur: string) =>
    request<{ setting: any }>('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify({ cle, valeur }),
    }),
};
