import { Router, Response } from 'express';
import { store } from '../data/store';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { runAlertScan } from '../services/alertService';

export const alertesRouter = Router();

// 1. Lister les alertes du système
alertesRouter.get('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { non_lues_uniquement, niveau, type } = req.query;

  let list = [...store.alertes];

  if (non_lues_uniquement === 'true') {
    list = list.filter((a) => !a.est_lu);
  }

  if (niveau) {
    list = list.filter((a) => a.niveau === niveau);
  }

  if (type) {
    list = list.filter((a) => a.type === type);
  }

  // Tri par date décroissante
  list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const nonLuesCount = store.alertes.filter((a) => !a.est_lu).length;

  res.json({
    alertes: list,
    total_non_lues: nonLuesCount,
  });
});

// 2. Marquer une alerte comme lue
alertesRouter.put('/:id/lu', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const id = Number(req.params.id);
  const alerte = store.alertes.find((a) => a.id === id);

  if (!alerte) {
    res.status(404).json({ error: 'Alerte non trouvée.' });
    return;
  }

  alerte.est_lu = true;
  res.json({ alerte });
});

// 3. Marquer toutes les alertes comme lues
alertesRouter.put('/actions/lire-tous', authenticateToken, (_req: AuthenticatedRequest, res: Response) => {
  store.alertes.forEach((a) => {
    a.est_lu = true;
  });

  res.json({ message: 'Toutes les alertes ont été marquées comme lues.' });
});

// 4. Déclencher manuellement un scan complet d'alertes
alertesRouter.post('/actions/scan', authenticateToken, (_req: AuthenticatedRequest, res: Response) => {
  const result = runAlertScan();
  res.json({
    message: 'Scan complet des alertes de l\'hôpital terminé.',
    ...result,
    total_alertes: store.alertes.length,
    non_lues: store.alertes.filter((a) => !a.est_lu).length,
  });
});

// 5. Journal des SMS d'urgence simulés
alertesRouter.get('/sms-journal', authenticateToken, (_req: AuthenticatedRequest, res: Response) => {
  const list = [...store.journalSMS].sort(
    (a, b) => new Date(b.date_envoi).getTime() - new Date(a.date_envoi).getTime()
  );

  res.json({ journal_sms: list });
});
