import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { store } from '../data/store';
import {
  generateToken,
  authenticateToken,
  checkLoginRateLimit,
  registerFailedLoginAttempt,
  clearLoginAttempts,
  getClientIp,
  AuthenticatedRequest,
} from '../middleware/auth';
import { recordAudit } from '../services/auditService';

export const authRouter = Router();

// Informations publiques sur les comptes de démonstration pour les évaluateurs DUT
authRouter.get('/demo-accounts', (_req: Request, res: Response) => {
  const accounts = [
    {
      role: 'admin',
      roleLibelle: 'Administrateur Général',
      email: 'admin@hgd.cm',
      password: 'Admin123!',
      nom: 'Samuel Mbassi',
      description: 'Gestion des utilisateurs, configuration système, journal d\'audit complet et supervision.',
    },
    {
      role: 'logistique',
      roleLibelle: 'Responsable Logistique',
      email: 'logistique@hgd.cm',
      password: 'Logistique123!',
      nom: 'Chantal Ngo Bisseck',
      description: 'Inventaire des équipements, gestion des lits, validation des sorties de produits contrôlés, commandes fournisseurs.',
    },
    {
      role: 'pharmacien',
      roleLibelle: 'Pharmacien Hospitalier',
      email: 'pharmacie@hgd.cm',
      password: 'Pharmacie123!',
      nom: 'Dr. Jean-Marc Eyenga',
      description: 'Gestion des médicaments et consommables, règles FEFO, initiation des sorties de produits contrôlés/stupéfiants.',
    },
    {
      role: 'maintenance',
      roleLibelle: 'Technicien de Maintenance Biomédicale',
      email: 'maintenance@hgd.cm',
      password: 'Maintenance123!',
      nom: 'Gervais Tchouassi',
      description: 'Calendrier préventif, dépannage curatif, scan QR code sur équipement, saisie des rapports d\'intervention.',
    },
    {
      role: 'chef_service',
      roleLibelle: 'Chef de Service (Urgences & Réanimation)',
      email: 'chef.urgences@hgd.cm',
      password: 'Chef123!',
      nom: 'Pr. Alain Kamga',
      description: 'Demandes d\'allocation de ressources, disponibilité des lits et équipements du service, rapports de service.',
    },
  ];

  res.json({ accounts });
});

// Connexion standard par email et mot de passe
authRouter.post('/login', checkLoginRateLimit, (req: Request, res: Response): void => {
  const { email, password } = req.body;
  const ip = getClientIp(req);

  if (!email || !password) {
    res.status(400).json({ error: 'L\'email et le mot de passe sont obligatoires.' });
    return;
  }

  const user = store.users.find((u) => u.email.toLowerCase() === String(email).trim().toLowerCase());

  if (!user || !user.active) {
    registerFailedLoginAttempt(ip);
    res.status(401).json({ error: 'Identifiants invalides ou compte inactif.' });
    return;
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
  if (!isPasswordValid) {
    registerFailedLoginAttempt(ip);
    res.status(401).json({ error: 'Identifiants invalides.' });
    return;
  }

  // Succès de connexion
  clearLoginAttempts(ip);

  const payload = {
    id: user.id,
    email: user.email,
    nom: user.nom,
    prenom: user.prenom,
    role: user.role,
    service_id: user.service_id,
  };

  const token = generateToken(payload);

  recordAudit(
    { id: user.id, nom: user.nom, prenom: user.prenom, role: user.role },
    'CONNEXION_UTILISATEUR',
    'User',
    String(user.id),
    `Connexion réussie au système HGD MediGest (${user.role}).`,
    ip
  );

  res.json({
    token,
    user: payload,
    service: user.service_id ? store.services.find((s) => s.id === user.service_id) : null,
  });
});

// Connexion rapide pour le mode démonstration
authRouter.post('/demo-login', (req: Request, res: Response): void => {
  const { role } = req.body;
  const user = store.users.find((u) => u.role === role && u.active);

  if (!user) {
    res.status(404).json({ error: `Aucun compte actif trouvé pour le rôle "${role}".` });
    return;
  }

  const payload = {
    id: user.id,
    email: user.email,
    nom: user.nom,
    prenom: user.prenom,
    role: user.role,
    service_id: user.service_id,
  };

  const token = generateToken(payload);

  recordAudit(
    { id: user.id, nom: user.nom, prenom: user.prenom, role: user.role },
    'CONNEXION_DEMO',
    'User',
    String(user.id),
    `Connexion rapide démonstration sélectionnée (${user.role}).`
  );

  res.json({
    token,
    user: payload,
    service: user.service_id ? store.services.find((s) => s.id === user.service_id) : null,
  });
});

// Vérification de la session en cours
authRouter.get('/me', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Non authentifié' });
    return;
  }

  const user = store.users.find((u) => u.id === req.user!.id);
  if (!user) {
    res.status(404).json({ error: 'Utilisateur introuvable' });
    return;
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role,
      service_id: user.service_id,
      telephone: user.telephone,
    },
    service: user.service_id ? store.services.find((s) => s.id === user.service_id) : null,
  });
});
