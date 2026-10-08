import { Router, Response } from 'express';
import { store } from '../data/store';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';

export const auditRouter = Router();

// 1. Consulter le journal d'audit inviolable (Accessible à l'admin et superviseurs)
auditRouter.get('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { entite, action, utilisateur_id, search } = req.query;

  let list = [...store.journalAudit];

  if (entite) {
    list = list.filter((a) => a.entite.toLowerCase() === String(entite).toLowerCase());
  }

  if (action) {
    list = list.filter((a) => a.action.toLowerCase().includes(String(action).toLowerCase()));
  }

  if (utilisateur_id) {
    list = list.filter((a) => a.utilisateur_id === Number(utilisateur_id));
  }

  if (search) {
    const s = String(search).toLowerCase();
    list = list.filter(
      (a) =>
        a.action.toLowerCase().includes(s) ||
        a.details.toLowerCase().includes(s) ||
        a.utilisateur_nom.toLowerCase().includes(s) ||
        a.entite_id.toLowerCase().includes(s)
    );
  }

  res.json({ audit_log: list });
});
