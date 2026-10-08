import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { store } from '../data/store';
import { UserRole } from '../data/types';

export const JWT_SECRET = process.env.JWT_SECRET || 'hgd_medigest_secret_key_2026_super_secure_dut';

export interface AuthUserPayload {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: UserRole;
  service_id: number | null;
}

// Étendre l'objet Request Express
export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}

/**
 * Génère un jeton JWT avec expiration (8 heures)
 */
export function generateToken(payload: AuthUserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}

/**
 * Middleware d'authentification par jeton Bearer
 */
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({ error: 'Accès non autorisé : Jeton d\'authentification manquant.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUserPayload;
    
    // Vérifier si l'utilisateur existe toujours et est actif
    const user = store.users.find((u) => u.id === decoded.id);
    if (!user || !user.active) {
      res.status(403).json({ error: 'Compte utilisateur inactif ou révoqué.' });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Jeton de session invalide ou expiré. Veuillez vous reconnecter.' });
    return;
  }
}

/**
 * Middleware de vérification RBAC des rôles
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Non authentifié.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Accès refusé : Le rôle "${req.user.role}" ne dispose pas des privilèges requis pour cette action. Rôles autorisés : ${allowedRoles.join(', ')}.`,
      });
      return;
    }

    next();
  };
}

// Limitation des tentatives de connexion par IP
interface LoginAttempt {
  attempts: number;
  lockedUntil?: number;
}
const loginAttemptsMap = new Map<string, LoginAttempt>();

export function checkLoginRateLimit(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = loginAttemptsMap.get(ip);

  if (record) {
    if (record.lockedUntil && now < record.lockedUntil) {
      const waitSeconds = Math.ceil((record.lockedUntil - now) / 1000);
      res.status(429).json({
        error: `Trop de tentatives de connexion échouées. Veuillez patienter ${waitSeconds} seconde(s) avant de réessayer.`,
      });
      return;
    }

    if (record.lockedUntil && now >= record.lockedUntil) {
      // Déverrouillage
      loginAttemptsMap.delete(ip);
    }
  }

  next();
}

export function registerFailedLoginAttempt(ip: string): void {
  const record = loginAttemptsMap.get(ip) || { attempts: 0 };
  record.attempts += 1;

  if (record.attempts >= 5) {
    record.lockedUntil = Date.now() + 60 * 1000; // 1 minute de verrouillage après 5 échecs
  }

  loginAttemptsMap.set(ip, record);
}

export function clearLoginAttempts(ip: string): void {
  loginAttemptsMap.delete(ip);
}
