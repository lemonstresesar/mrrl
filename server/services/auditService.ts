import { store } from '../data/store';
import { JournalAudit } from '../data/types';

export function recordAudit(
  user: { id?: number; nom?: string; prenom?: string; role?: string } | null,
  action: string,
  entite: string,
  entite_id: string,
  details: string,
  ip_address: string = '127.0.0.1'
): JournalAudit {
  const nextId = store.getNextId(store.journalAudit);
  const auditEntry: JournalAudit = {
    id: nextId,
    utilisateur_id: user?.id ?? null,
    utilisateur_nom: user ? `${user.prenom || ''} ${user.nom || ''} (${user.role || 'user'})`.trim() : 'Système',
    role: user?.role || 'system',
    action,
    entite,
    entite_id: String(entite_id),
    details,
    ip_address,
    created_at: new Date().toISOString(),
  };

  store.journalAudit.unshift(auditEntry);
  return auditEntry;
}
