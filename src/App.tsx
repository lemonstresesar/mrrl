import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './views/DashboardView';
import { EquipementsView } from './views/EquipementsView';
import { QRScannerView } from './views/QRScannerView';
import { StocksView } from './views/StocksView';
import { ControlledSubstancesView } from './views/ControlledSubstancesView';
import { MaintenanceView } from './views/MaintenanceView';
import { FournisseursView } from './views/FournisseursView';
import { AllocationsView } from './views/AllocationsView';
import { AlertesView } from './views/AlertesView';
import { ReportsView } from './views/ReportsView';
import { AuditView } from './views/AuditView';
import { AdminView } from './views/AdminView';
import { api } from './services/api';
import {
  Hospital,
  ShieldCheck,
  Lock,
  Mail,
  UserCheck,
  AlertTriangle,
  ArrowRight,
  Globe,
} from 'lucide-react';
import { UserRole } from './types';

// ==============================================================================
// COMPOSANT ÉCRAN DE CONNEXION (AVEC SÉLECTEUR 1-CLIC DE DÉMONSTRATION DUT)
// ==============================================================================

const LoginScreen: React.FC = () => {
  const { login, demoLogin, demoAccounts } = useAuth();
  const { lang, setLang, t } = useLanguage();

  const [email, setEmail] = useState('admin@hgd.cm');
  const [password, setPassword] = useState('Admin123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await login({ email, password });
    } catch (err: any) {
      setError(err.message || 'Identifiants invalides');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = async (role: UserRole) => {
    try {
      setLoading(true);
      setError(null);
      await demoLogin(role);
    } catch (err: any) {
      setError(err.message || 'Erreur connexion démo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Background radial glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#2E74B5]/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#1F3864]/40 rounded-full blur-3xl pointer-events-none"></div>

      {/* Language toggle on top right */}
      <div className="absolute top-4 right-4 flex items-center gap-1 bg-white/10 p-1 rounded-lg backdrop-blur-xs text-xs text-white">
        <Globe className="w-3.5 h-3.5 ml-1 text-blue-200" />
        <button
          onClick={() => setLang('fr')}
          className={`px-2 py-0.5 rounded font-bold ${lang === 'fr' ? 'bg-[#2E74B5] text-white' : 'text-slate-300'}`}
        >
          FR
        </button>
        <button
          onClick={() => setLang('en')}
          className={`px-2 py-0.5 rounded font-bold ${lang === 'en' ? 'bg-[#2E74B5] text-white' : 'text-slate-300'}`}
        >
          EN
        </button>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-700/50">
        {/* Colonne Gauche : Présentation Hospitalière */}
        <div className="md:col-span-5 bg-[#1F3864] p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#2E74B5] flex items-center justify-center text-white shadow-lg">
              <Hospital className="w-7 h-7" />
            </div>

            <div>
              <span className="text-[10px] tracking-widest uppercase font-bold text-blue-300 block">
                RÉPUBLIQUE DU CAMEROUN
              </span>
              <h1 className="text-xl font-extrabold tracking-tight text-white mt-0.5">
                HÔPITAL GÉNÉRAL DE DOUALA
              </h1>
              <p className="text-xs text-blue-200/90 font-medium">
                Système Intégré de Gestion des Ressources Médicales (MediGest)
              </p>
            </div>

            <div className="pt-4 border-t border-blue-900/60 space-y-2.5 text-xs text-blue-100/80">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Règle FEFO stricte sur les lots de médicaments</span>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Double-validation obligatoire des stupéfiants</span>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Gestion des lits, maintenance et scans QR code</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-blue-900/60 text-[11px] text-blue-300/70">
            Projet Académique DUT Informatique / Médical • Données entièrement fictives
          </div>
        </div>

        {/* Colonne Droite : Formulaire & Comptes Démo 1-Clic */}
        <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between bg-white text-xs">
          <div>
            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                {t('auth_login_title')}
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">
                Authentification sécurisée par jeton JWT & hachage bcrypt
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Formulaire classique */}
            <form onSubmit={handleSubmit} className="space-y-3.5 mb-6">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Adresse email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@hgd.cm"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mot de passe</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-[#1F3864] hover:bg-[#182c4f] text-white font-bold rounded-lg text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Connexion en cours...' : t('auth_btn_login')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Section Rôles de Démonstration 1-Clic (DUT) */}
            <div className="pt-4 border-t border-slate-200">
              <div className="text-[11px] font-bold text-slate-700 mb-2.5 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-[#2E74B5]" />
                <span>Accès Rapide par Rôle (Évaluation en 1 clic) :</span>
              </div>

              <div className="space-y-1.5">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => handleDemoClick(acc.role)}
                    className="w-full p-2 rounded-lg border border-slate-200 hover:border-[#2E74B5] hover:bg-blue-50/50 transition flex items-center justify-between text-left group"
                  >
                    <div>
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span>{acc.nom}</span>
                        <span className="font-normal text-[10px] text-slate-500">({acc.email})</span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-xs">{acc.description}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1F3864] text-white group-hover:bg-[#2E74B5] transition shrink-0">
                      Entrer
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==============================================================================
// APPLICATION PRINCIPALE AUTHENTIFIÉE
// ==============================================================================

const MainApp: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [unopenedAlertsCount, setUnopenedAlertsCount] = useState<number>(0);
  const [pendingControlledCount, setPendingControlledCount] = useState<number>(0);

  const refreshBadges = async () => {
    if (!isAuthenticated) return;
    try {
      const [alertRes, ctrlRes] = await Promise.all([
        api.getAlertes({ non_lues_uniquement: 'true' }),
        api.getControlledPending(),
      ]);
      setUnopenedAlertsCount(alertRes.total_non_lues || 0);
      setPendingControlledCount(ctrlRes.pending?.length || 0);
    } catch (e) {
      // Ignorer silencieusement
    }
  };

  useEffect(() => {
    refreshBadges();
    const interval = setInterval(refreshBadges, 30000); // Rafraîchissement périodique
    return () => clearInterval(interval);
  }, [isAuthenticated, currentView]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs font-semibold">
        Chargement de la session médicale HGD...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans text-slate-800">
      {/* Sidebar gauche en bleu marine HGD #1F3864 */}
      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        unopenedAlertsCount={unopenedAlertsCount}
        pendingControlledCount={pendingControlledCount}
      />

      {/* Zone Principale */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <Header
          onOpenScanner={() => setCurrentView('qr_scanner')}
          onOpenAlerts={() => setCurrentView('alerts')}
          unopenedAlertsCount={unopenedAlertsCount}
        />

        {/* Corps de vue avec défilement */}
        <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {currentView === 'dashboard' && <DashboardView onNavigate={setCurrentView} />}
          {currentView === 'equipements' && <EquipementsView />}
          {currentView === 'qr_scanner' && <QRScannerView />}
          {currentView === 'stocks' && <StocksView />}
          {currentView === 'controlled' && <ControlledSubstancesView />}
          {currentView === 'maintenance' && <MaintenanceView />}
          {currentView === 'suppliers' && <FournisseursView />}
          {currentView === 'allocations' && <AllocationsView />}
          {currentView === 'alerts' && <AlertesView />}
          {currentView === 'reports' && <ReportsView />}
          {currentView === 'audit' && <AuditView />}
          {currentView === 'admin' && <AdminView />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </LanguageProvider>
  );
}
