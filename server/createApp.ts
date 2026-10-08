import express, { Express, Router } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { authRouter } from './routes/auth';
import { equipementsRouter } from './routes/equipements';
import { stocksRouter } from './routes/stocks';
import { controlledSubstancesRouter } from './routes/controlledSubstances';
import { maintenanceRouter } from './routes/maintenance';
import { fournisseursRouter } from './routes/fournisseurs';
import { allocationsRouter } from './routes/allocations';
import { alertesRouter } from './routes/alertes';
import { reportsRouter } from './routes/reports';
import { auditRouter } from './routes/audit';
import { adminRouter } from './routes/admin';

export function createApp(): Express {
  const app = express();

  // En-têtes de sécurité
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Router API partagé
  const apiRouter = Router();

  apiRouter.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      institution: 'Hôpital Général de Douala',
      app: 'HGD MediGest',
      env: 'Netlify / Serverless Ready',
      timestamp: new Date().toISOString(),
    });
  });

  apiRouter.use('/auth', authRouter);
  apiRouter.use('/equipements', equipementsRouter);
  apiRouter.use('/stocks', stocksRouter);
  apiRouter.use('/controlled-substances', controlledSubstancesRouter);
  apiRouter.use('/maintenance', maintenanceRouter);
  apiRouter.use('/fournisseurs', fournisseursRouter);
  apiRouter.use('/allocations', allocationsRouter);
  apiRouter.use('/alertes', alertesRouter);
  apiRouter.use('/reports', reportsRouter);
  apiRouter.use('/audit-log', auditRouter);
  apiRouter.use('/admin', adminRouter);

  // Monter sous /.netlify/functions/api, /api et à la racine pour compatibilité totale Netlify
  app.use('/.netlify/functions/api', apiRouter);
  app.use('/api', apiRouter);
  app.use('/', apiRouter);

  return app;
}
