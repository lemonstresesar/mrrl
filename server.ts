import express from 'express';
import path from 'path';
import { createApp } from './server/createApp';
import { initAlertScheduler } from './server/services/alertService';

async function bootstrap() {
  const app = createApp();
  const PORT = Number(process.env.PORT) || 3000;

  // Initialisation du planificateur d'alertes node-cron
  initAlertScheduler();

  // Mode Dev avec Vite middlewares ou Production avec fichiers statiques
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[HGD MEDIGEST] Serveur opérationnel sur http://0.0.0.0:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('[HGD MEDIGEST] Échec de démarrage du serveur :', err);
});
