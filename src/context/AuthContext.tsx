import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Service, UserRole } from '../types';
import { api } from '../services/api';

interface DemoAccount {
  role: UserRole;
  roleLibelle: string;
  email: string;
  password: string;
  nom: string;
  description: string;
}

interface AuthContextType {
  user: User | null;
  service: Service | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  demoAccounts: DemoAccount[];
  login: (credentials: { email: string; password: string }) => Promise<void>;
  demoLogin: (role: UserRole) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const INITIAL_DEMO_ACCOUNTS: DemoAccount[] = [
  { role: 'admin', roleLibelle: 'Administrateur Général', email: 'admin@hgd.cm', password: 'Admin123!', nom: 'Samuel Mbassi', description: 'Supervision globale, gestion des utilisateurs, paramètres & audit.' },
  { role: 'logistique', roleLibelle: 'Responsable Logistique', email: 'logistique@hgd.cm', password: 'Logistique123!', nom: 'Chantal Ngo Bisseck', description: 'Gestion des équipements, disponibilité des lits & double validation.' },
  { role: 'pharmacien', roleLibelle: 'Pharmacien Hospitalier', email: 'pharmacie@hgd.cm', password: 'Pharmacie123!', nom: 'Dr. Jean-Marc Eyenga', description: 'Gestion des stocks de médicaments selon la règle FEFO & stupéfiants.' },
  { role: 'maintenance', roleLibelle: 'Technicien Biomédical', email: 'maintenance@hgd.cm', password: 'Maintenance123!', nom: 'Gervais Tchouassi', description: 'Maintenance préventive/curative & scans des codes QR équipements.' },
  { role: 'chef_service', roleLibelle: 'Chef de Service (Urgences)', email: 'chef.urgences@hgd.cm', password: 'Chef123!', nom: 'Pr. Alain Kamga', description: 'Vue lits du service, demandes de matériel & alertes d\'urgence.' },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('hgd_jwt_token'));
  const [loading, setLoading] = useState<boolean>(true);
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>(INITIAL_DEMO_ACCOUNTS);

  useEffect(() => {
    // Charger les informations sur les comptes de démonstration
    api.getDemoAccounts()
      .then((res) => {
        if (res.accounts) setDemoAccounts(res.accounts);
      })
      .catch((err) => console.warn('Erreur chargement demo accounts', err));

    // Si un jeton est stocké, vérifier la session
    const storedToken = localStorage.getItem('hgd_jwt_token');
    if (storedToken) {
      api.getMe()
        .then((res) => {
          setUser(res.user);
          setService(res.service);
        })
        .catch(() => {
          localStorage.removeItem('hgd_jwt_token');
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    const res = await api.login(credentials);
    localStorage.setItem('hgd_jwt_token', res.token);
    setToken(res.token);
    setUser(res.user);
    setService(res.service);
  };

  const demoLogin = async (role: UserRole) => {
    const res = await api.demoLogin(role);
    localStorage.setItem('hgd_jwt_token', res.token);
    setToken(res.token);
    setUser(res.user);
    setService(res.service);
  };

  const logout = () => {
    localStorage.removeItem('hgd_jwt_token');
    setToken(null);
    setUser(null);
    setService(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      setUser(res.user);
      setService(res.service);
    } catch (e) {
      console.warn('Erreur rafraîchissement profil', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        service,
        token,
        isAuthenticated: !!user,
        loading,
        demoAccounts,
        login,
        demoLogin,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
