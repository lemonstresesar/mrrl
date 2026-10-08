import React from 'react';
import {
  Bell,
  Globe,
  ShieldCheck,
  Building2,
  QrCode,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface HeaderProps {
  onOpenScanner: () => void;
  onOpenAlerts: () => void;
  unopenedAlertsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenScanner,
  onOpenAlerts,
  unopenedAlertsCount = 0,
}) => {
  const { user, service } = useAuth();
  const { lang, setLang } = useLanguage();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-xs shrink-0 select-none">
      {/* Localisation et Service actif */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-slate-700">
          <Building2 className="w-5 h-5 text-[#2E74B5]" />
          <div>
            <div className="text-xs font-bold text-slate-900 tracking-wide flex items-center gap-1.5">
              <span>HÔPITAL GÉNÉRAL DE DOUALA</span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                Makepe / Beedi
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              {service ? `${service.nom} (${service.batiment}, ${service.etage})` : 'Services Médicaux Transversaux'}
            </div>
          </div>
        </div>
      </div>

      {/* Barre d'outils droite */}
      <div className="flex items-center gap-3">
        {/* Badge sécurité JWT & RBAC */}
        <div className="hidden md:flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Session JWT Sécurisée (RBAC Actif)</span>
        </div>

        {/* Bouton rapide Scanner QR Code */}
        <button
          onClick={onOpenScanner}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2E74B5]/10 hover:bg-[#2E74B5]/20 text-[#1F3864] text-xs font-semibold transition"
          title="Scanner un QR code d'équipement"
        >
          <QrCode className="w-4 h-4 text-[#2E74B5]" />
          <span className="hidden sm:inline">Scanner QR</span>
        </button>

        {/* Cloche d'alertes */}
        <button
          onClick={onOpenAlerts}
          className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
          title="Centre d'alertes médicales"
        >
          <Bell className="w-5 h-5" />
          {unopenedAlertsCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
              {unopenedAlertsCount > 9 ? '9+' : unopenedAlertsCount}
            </span>
          )}
        </button>

        {/* Sélecteur de langue bilingue FR / EN */}
        <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50 text-xs">
          <button
            onClick={() => setLang('fr')}
            className={`px-2 py-1 rounded font-semibold transition ${
              lang === 'fr'
                ? 'bg-[#1F3864] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            FR
          </button>
          <button
            onClick={() => setLang('en')}
            className={`px-2 py-1 rounded font-semibold transition ${
              lang === 'en'
                ? 'bg-[#1F3864] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            EN
          </button>
        </div>
      </div>
    </header>
  );
};
