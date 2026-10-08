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
  LayoutDashboard,
  Stethoscope,
  QrCode,
  Pill,
  Menu,
} from 'lucide-react';
import { UserRole } from './types';

// ==============================================================================
// COMPOSANT ÉCRAN DE CONNEXION AÉRÉ & MODERNE (SANS ÉTOUFFEMENT)
// ==============================================================================

const LoginScreen: React.FC = () => {
  const { login, demoLogin, demoAccounts } = useAuth();
  const { lang, setLang, t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'quick' | 'form'>('quick');
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
      const msg = String(err?.message || '');
      if (msg.includes('502') || msg.includes('503') || msg.includes('504') || msg.includes('Failed to fetch') || msg.includes('Erreur requête')) {
        setError("Le serveur distant est momentanément inaccessible. Cliquez sur « Entrer en mode Démo » pour continuer immédiatement avec toutes les fonctionnalités.");
      } else if (msg.includes('401') || msg.includes('Identifiants invalides')) {
        setError("Identifiants non reconnus. Vérifiez votre adresse email et votre mot de passe, ou sélectionnez l'un des accès rapides ci-dessous.");
      } else {
        setError(msg || "Impossible de se connecter pour le moment.");
      }
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
      console.warn("Erreur démo:", err);
      // Fallback gracieux automatique
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePresetSelect = (acc: typeof demoAccounts[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-blue-50/40 text-slate-800 flex flex-col justify-between p-4 sm:p-6 lg:p-10 relative selection:bg-blue-100 selection:text-blue-900">
      {/* Halo lumineux doux en arrière-plan */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-100/40 via-sky-100/20 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Barre supérieure aérée */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-700/20">
            <Hospital className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-blue-900 block">
              Hôpital Général de Douala
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Plateforme MediGest • Cameroun
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Système Opérationnel</span>
          </div>

          {/* Sélecteur de langue bilingue */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-xs text-xs font-semibold">
            <button
              onClick={() => setLang('fr')}
              className={`px-2.5 py-1 rounded-md transition ${lang === 'fr' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              FR
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 rounded-md transition ${lang === 'en' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              EN
            </button>
          </div>
        </div>
      </header>

      {/* Carte centrale principale ultra-aérée & responsive */}
      <main className="max-w-6xl mx-auto w-full my-auto py-2 sm:py-4">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/70 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* Colonne Gauche : Présentation institutionnelle noble et aérée */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#1F3864] to-[#2E74B5] p-6 sm:p-8 lg:p-12 text-white flex flex-col justify-between relative overflow-hidden">
            {/* Lueur subtile en arrière-plan */}
            <div className="absolute -top-24 -left-24 w-72 h-72 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-blue-900/40 rounded-full blur-2xl pointer-events-none" />

            <div className="relative space-y-4 sm:space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-medium backdrop-blur-xs text-blue-100">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>Portail Hospitalier Sécurisé</span>
              </div>

              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white leading-tight">
                  Gestion Intégrée des Ressources Médicales
                </h1>
                <p className="text-xs sm:text-sm text-blue-100/90 font-normal mt-2 sm:mt-3 leading-relaxed">
                  Pilotage centralisé du parc d'équipements biomédicaux, des lits d'hospitalisation, des stocks selon la règle FEFO et de la double-validation des stupéfiants.
                </p>
              </div>

              <div className="pt-2 sm:pt-4 space-y-3 sm:space-y-4 text-xs sm:text-sm text-blue-100/90">
                <div className="flex items-start gap-2.5 sm:gap-3">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-emerald-300 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-white block">Priorité FEFO & Périmés</span>
                    <span className="text-xs text-blue-200/80 hidden sm:block">Sortie stricte des lots à péremption la plus proche pour zéro gaspillage.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 sm:gap-3">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-emerald-300 mt-0.5">
                    <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-white block">Double Validation Stupéfiants</span>
                    <span className="text-xs text-blue-200/80 hidden sm:block">Circuit de dispensation contrôlé (Morphine, Fentanyl) conforme à la réglementation.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 sm:gap-3">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-emerald-300 mt-0.5">
                    <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-white block">Traçabilité & Codes QR</span>
                    <span className="text-xs text-blue-200/80 hidden sm:block">Identification immédiate des lits et équipements par scanner mobile.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative pt-4 sm:pt-8 mt-4 sm:mt-6 border-t border-white/15 text-xs text-blue-200/70 flex items-center justify-between">
              <span>Hôpital Général de Douala</span>
              <span className="text-[11px] font-mono opacity-80">DUT Médical</span>
            </div>
          </div>

          {/* Colonne Droite : Espace de Connexion & Accès Rapide par Rôle */}
          <div className="lg:col-span-7 p-4 sm:p-8 lg:p-12 flex flex-col justify-between bg-white">
            <div>
              {/* En-tête avec titre clair */}
              <div className="mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Bienvenue sur MediGest
                </h2>
                <p className="text-slate-500 text-xs sm:text-sm mt-1">
                  Choisissez votre méthode d'accès pour démarrer votre session :
                </p>
              </div>

              {/* Sélecteur d'onglets ergonomique et moderne */}
              <div className="flex p-1 bg-slate-100 rounded-xl mb-4 sm:mb-6">
                <button
                  type="button"
                  onClick={() => setActiveTab('quick')}
                  className={`flex-1 py-2 sm:py-2.5 px-2 sm:px-3 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
                    activeTab === 'quick'
                      ? 'bg-white text-blue-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-blue-700 shrink-0" />
                  <span className="truncate">Accès Rapide (1 Clic)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('form')}
                  className={`flex-1 py-2 sm:py-2.5 px-2 sm:px-3 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
                    activeTab === 'form'
                      ? 'bg-white text-blue-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Mail className="w-4 h-4 text-blue-700 shrink-0" />
                  <span className="truncate">Identifiants</span>
                </button>
              </div>

              {/* Message d'information / erreur convivial et rassurant */}
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-950">Avis de connexion</p>
                      <p className="text-amber-800 text-xs mt-0.5 leading-relaxed">{error}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDemoClick('admin')}
                    className="shrink-0 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                  >
                    Entrer en mode Démo
                  </button>
                </div>
              )}

              {/* ONGLET 1 : ACCÈS RAPIDE PAR RÔLE (DUT) */}
              {activeTab === 'quick' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 mb-2">
                    Cliquez sur un profil pour entrer instantanément dans son espace sans mot de passe :
                  </p>

                  <div className="space-y-2.5">
                    {demoAccounts.map((acc) => {
                      const getRoleBadgeStyle = (role: string) => {
                        switch (role) {
                          case 'admin':
                            return { bg: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-600' };
                          case 'logistique':
                            return { bg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-600' };
                          case 'pharmacien':
                            return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-600' };
                          case 'maintenance':
                            return { bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-600' };
                          case 'chef_service':
                            return { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-600' };
                          default:
                            return { bg: 'bg-slate-50 text-slate-700 border-slate-200', dot: 'bg-slate-600' };
                        }
                      };

                      const style = getRoleBadgeStyle(acc.role);

                      return (
                        <button
                          key={acc.role}
                          type="button"
                          disabled={loading}
                          onClick={() => handleDemoClick(acc.role)}
                          className="w-full p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 transition-all flex items-center justify-between text-left group shadow-xs hover:shadow-md"
                        >
                          <div className="flex items-center gap-3.5 min-w-0 pr-2">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center font-bold text-xs uppercase text-slate-700 group-hover:text-blue-800 transition shrink-0">
                              {acc.nom.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-900 text-xs sm:text-sm">
                                  {acc.nom}
                                </span>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${style.bg}`}>
                                  {acc.roleLibelle}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 truncate mt-0.5">
                                {acc.description}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 group-hover:bg-blue-700 text-slate-700 group-hover:text-white text-xs font-semibold transition">
                            <span>Entrer</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ONGLET 2 : FORMULAIRE CLASSIQUE IDENTIFIANTS */}
              {activeTab === 'form' && (
                <div className="space-y-5">
                  {/* Pré-remplissage rapide en 1 clic */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <span className="text-slate-600 font-medium">Pré-remplir avec un compte :</span>
                    <div className="flex flex-wrap gap-1">
                      {demoAccounts.map((acc) => (
                        <button
                          key={acc.role}
                          type="button"
                          onClick={() => handlePresetSelect(acc)}
                          className="px-2 py-1 bg-white hover:bg-slate-200 border border-slate-200 rounded text-[11px] font-medium text-slate-700 transition"
                        >
                          {acc.roleLibelle.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Adresse email professionnelle
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="admin@hgd.cm"
                          className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden transition bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Mot de passe
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden transition bg-white"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 px-4 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-sm shadow-md shadow-blue-700/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>{loading ? 'Connexion en cours...' : 'Se connecter à l\'espace'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Note de bas de carte */}
            <div className="mt-8 pt-4 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
              <span>Authentification chiffrée JWT & bcrypt</span>
              <span>HGD Cameroun © 2026</span>
            </div>
          </div>

        </div>
      </main>

      {/* Pied de page aéré */}
      <footer className="max-w-6xl mx-auto w-full text-center text-xs text-slate-400 pt-4">
        Hôpital Général de Douala • Système Intégré de Gestion des Ressources Médicales (MediGest) • Projet DUT Informatique
      </footer>
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

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
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans text-slate-800 relative">
      {/* Overlay Backdrop sombre sur Mobile/Tablette */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar gauche en bleu marine HGD #1F3864 (Tiroir coulissant sur mobile) */}
      <Sidebar
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          setMobileMenuOpen(false);
        }}
        unopenedAlertsCount={unopenedAlertsCount}
        pendingControlledCount={pendingControlledCount}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Zone Principale */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Top Header avec bouton toggle menu sur mobile */}
        <Header
          onOpenScanner={() => setCurrentView('qr_scanner')}
          onOpenAlerts={() => setCurrentView('alerts')}
          unopenedAlertsCount={unopenedAlertsCount}
          onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
        />

        {/* Corps de vue avec défilement fluide et marge basse pour barre mobile */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 pb-20 lg:pb-6 custom-scrollbar">
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

        {/* Barre de navigation inférieure sur Smartphone (Mobile Bottom Navigation) */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-xl px-2 py-1.5 flex items-center justify-around safe-area-bottom">
          <button
            onClick={() => {
              setCurrentView('dashboard');
              setMobileMenuOpen(false);
            }}
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] font-semibold transition ${
              currentView === 'dashboard'
                ? 'text-[#2E74B5]'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Accueil</span>
          </button>

          <button
            onClick={() => {
              setCurrentView('equipements');
              setMobileMenuOpen(false);
            }}
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] font-semibold transition ${
              currentView === 'equipements'
                ? 'text-[#2E74B5]'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="w-5 h-5" />
            <span>Matériel</span>
          </button>

          <button
            onClick={() => {
              setCurrentView('qr_scanner');
              setMobileMenuOpen(false);
            }}
            className="flex flex-col items-center justify-center -mt-5 bg-[#2E74B5] hover:bg-[#256199] text-white w-12 h-12 rounded-full shadow-lg shadow-blue-900/20 active:scale-95 transition"
            title="Scanner QR Code"
          >
            <QrCode className="w-5 h-5" />
          </button>

          <button
            onClick={() => {
              setCurrentView('stocks');
              setMobileMenuOpen(false);
            }}
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] font-semibold transition ${
              currentView === 'stocks'
                ? 'text-[#2E74B5]'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Pill className="w-5 h-5" />
            <span>Stocks</span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] font-semibold text-slate-500 hover:text-slate-900 transition relative"
          >
            <div className="relative">
              <Menu className="w-5 h-5" />
              {unopenedAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-600 rounded-full animate-pulse" />
              )}
            </div>
            <span>Menu</span>
          </button>
        </nav>
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
