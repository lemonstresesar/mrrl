import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { store } from '../data/store';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { recordAudit } from '../services/auditService';
import { User, UserRole } from '../data/types';

export const adminRouter = Router();

// 1. Liste des utilisateurs
adminRouter.get('/users', authenticateToken, requireRole(['admin']), (_req: AuthenticatedRequest, res: Response) => {
  const users = store.users.map((u) => {
    const service = u.service_id ? store.services.find((s) => s.id === u.service_id) : null;
    return {
      id: u.id,
      email: u.email,
      nom: u.nom,
      prenom: u.prenom,
      role: u.role,
      service_id: u.service_id,
      service_nom: service?.nom || 'Non assigné',
      active: u.active,
      telephone: u.telephone,
      created_at: u.created_at,
    };
  });

  res.json({ users });
});

// 2. Créer un nouvel utilisateur
adminRouter.post('/users', authenticateToken, requireRole(['admin']), (req: AuthenticatedRequest, res: Response): void => {
  const { email, password, nom, prenom, role, service_id, telephone } = req.body;

  if (!email || !password || !nom || !prenom || !role) {
    res.status(400).json({ error: 'Email, mot de passe, nom, prénom et rôle sont obligatoires.' });
    return;
  }

  const existing = store.users.find((u) => u.email.toLowerCase() === String(email).trim().toLowerCase());
  if (existing) {
    res.status(400).json({ error: 'Un compte avec cette adresse email existe déjà.' });
    return;
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);
  const nextId = store.getNextId(store.users);

  const newUser: User = {
    id: nextId,
    email: String(email).trim().toLowerCase(),
    password_hash: passwordHash,
    nom,
    prenom,
    role: role as UserRole,
    service_id: service_id ? Number(service_id) : null,
    active: true,
    telephone: telephone || '',
    created_at: new Date().toISOString(),
  };

  store.users.push(newUser);

  recordAudit(
    req.user!,
    'CREATION_UTILISATEUR',
    'User',
    String(newUser.id),
    `Création du compte utilisateur "${prenom} ${nom}" avec le rôle "${role}".`
  );

  res.status(201).json({
    user: {
      id: newUser.id,
      email: newUser.email,
      nom: newUser.nom,
      prenom: newUser.prenom,
      role: newUser.role,
      service_id: newUser.service_id,
      active: newUser.active,
    },
  });
});

// 3. Activer / Désactiver un compte utilisateur
adminRouter.put('/users/:id/status', authenticateToken, requireRole(['admin']), (req: AuthenticatedRequest, res: Response): void => {
  const id = Number(req.params.id);
  const { active } = req.body;

  const user = store.users.find((u) => u.id === id);
  if (!user) {
    res.status(404).json({ error: 'Utilisateur non trouvé.' });
    return;
  }

  if (user.id === req.user!.id) {
    res.status(400).json({ error: 'Vous ne pouvez pas désactiver votre propre compte administrateur.' });
    return;
  }

  user.active = Boolean(active);

  recordAudit(
    req.user!,
    'STATUT_UTILISATEUR',
    'User',
    String(user.id),
    `Compte "${user.email}" ${user.active ? 'activé' : 'désactivé'}.`
  );

  res.json({ message: `Utilisateur ${user.active ? 'activé' : 'désactivé'}`, user });
});

// 4. Liste des services hospitaliers
adminRouter.get('/services', authenticateToken, (_req: AuthenticatedRequest, res: Response) => {
  res.json({ services: store.services });
});

// 5. Paramètres du système
adminRouter.get('/settings', authenticateToken, (_req: AuthenticatedRequest, res: Response) => {
  const settingsObj: Record<string, any> = {};
  store.parametres.forEach((param, key) => {
    settingsObj[key] = param;
  });
  res.json({ settings: settingsObj });
});

// 6. Mettre à jour un paramètre
adminRouter.put('/settings', authenticateToken, requireRole(['admin']), (req: AuthenticatedRequest, res: Response): void => {
  const { cle, valeur } = req.body;

  if (!cle || valeur === undefined) {
    res.status(400).json({ error: 'Clé et valeur requis.' });
    return;
  }

  const existing = store.parametres.get(cle);
  if (!existing) {
    res.status(404).json({ error: `Paramètre "${cle}" introuvable.` });
    return;
  }

  existing.valeur = String(valeur);
  store.parametres.set(cle, existing);

  recordAudit(
    req.user!,
    'MODIFICATION_PARAMETRE',
    'Parametre',
    cle,
    `Mise à jour du paramètre "${cle}" -> nouvelle valeur: ${valeur}`
  );

  res.json({ setting: existing });
});
