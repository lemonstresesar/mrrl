import React from 'react';
import {
  LayoutDashboard,
  Stethoscope,
  QrCode,
  Pill,
  ShieldAlert,
  Wrench,
  Truck,
  ArrowLeftRight,
  Bell,
  FileSpreadsheet,
  History,
  Settings,
  LogOut,
  Hospital,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { UserRole } from '../types';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  unopenedAlertsCount?: number;
  pendingControlledCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  unopenedAlertsCount = 0,
  pendingControlledCount = 0,
}) => {
  const { user, logout, demoLogin } = useAuth();
  const { t } = useLanguage();

  const navItems = [
    { id: 'dashboard', label: t('nav_dashboard'), icon: LayoutDashboard, roles: ['admin', 'logistique', 'pharmacien', 'maintenance', 'chef_service'] },
    { id: 'equipements', label: t('nav_equipements'), icon: Stethoscope, roles: ['admin', 'logistique', 'pharmacien', 'maintenance', 'chef_service'] },
    { id: 'qr_scanner', label: t('nav_qr_scanner'), icon: QrCode, roles: ['admin', 'logistique', 'maintenance', 'chef_service', 'pharmacien'] },
    { id: 'stocks', label: t('nav_stocks'), icon: Pill, roles: ['admin', 'logistique', 'pharmacien', 'chef_service'] },
    {
      id: 'controlled',
      label: t('nav_controlled'),
      icon: ShieldAlert,
      roles: ['admin', 'logistique', 'pharmacien', 'chef_service'],
      badge: pendingControlledCount > 0 ? pendingControlledCount : undefined,
      badgeColor: 'bg-amber-500',
    },
    { id: 'maintenance', label: t('nav_maintenance'), icon: Wrench, roles: ['admin', 'logistique', 'maintenance', 'chef_service'] },
    { id: 'suppliers', label: t('nav_suppliers'), icon: Truck, roles: ['admin', 'logistique', 'pharmacien', 'admin'] },
    { id: 'allocations', label: t('nav_allocations'), icon: ArrowLeftRight, roles: ['admin', 'logistique', 'chef_service'] },
    {
      id: 'alerts',
      label: t('nav_alerts'),
      icon: Bell,
      roles: ['admin', 'logistique', 'pharmacien', 'maintenance', 'chef_service'],
      badge: unopenedAlertsCount > 0 ? unopenedAlertsCount : undefined,
      badgeColor: 'bg-rose-500',
    },
    { id: 'reports', label: t('nav_reports'), icon: FileSpreadsheet, roles: ['admin', 'logistique', 'pharmacien', 'maintenance', 'chef_service'] },
    { id: 'audit', label: t('nav_audit'), icon: History, roles: ['admin', 'logistique'] },
    { id: 'admin', label: t('nav_admin'), icon: Settings, roles: ['admin'] },
  ];

  // Filtrer les éléments visibles par rôle
  const visibleNav = navItems.filter((item) => user && item.roles.includes(user.role));

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return { label: 'Admin Système', bg: 'bg-purple-600' };
      case 'logistique':
        return { label: 'Resp. Logistique', bg: 'bg-blue-600' };
      case 'pharmacien':
        return { label: 'Pharmacien', bg: 'bg-emerald-600' };
      case 'maintenance':
        return { label: 'Technicien Biomed', bg: 'bg-amber-600' };
      case 'chef_service':
        return { label: 'Chef de Service', bg: 'bg-indigo-600' };
      default:
        return { label: role, bg: 'bg-slate-600' };
    }
  };

  const roleInfo = getRoleBadge(user?.role || '');

  return (
    <aside className="w-64 bg-[#1F3864] text-white flex flex-col h-screen shrink-0 border-r border-[#162a4d] shadow-xl select-none">
      {/* Brand & Hospital Banner */}
      <div className="p-4 border-b border-[#2d4d82] flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#2E74B5] flex items-center justify-center text-white shadow-md">
          <Hospital className="w-6 h-6" />
        </div>
        <div className="overflow-hidden">
          <h1 className="font-bold text-base tracking-wide text-white flex items-center gap-1.5 truncate">
            HGD MediGest
          </h1>
          <p className="text-[11px] text-blue-200/80 truncate">Hôpital Général de Douala</p>
        </div>
      </div>

      {/* Profil utilisateur connecté & rôle */}
      <div className="p-3 mx-2 my-2 rounded-lg bg-[#162a4d]/80 border border-[#2d4d82]/60 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-full bg-[#2E74B5] flex items-center justify-center font-bold text-xs uppercase shadow text-white">
          {user ? `${user.prenom[0]}${user.nom[0]}` : 'U'}
        </div>
        <div className="overflow-hidden flex-1 min-w-0">
          <div className="text-xs font-semibold text-white truncate">
            {user?.prenom} {user?.nom}
          </div>
          <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded text-white font-medium ${roleInfo.bg}`}>
            {roleInfo.label}
          </span>
        </div>
      </div>

      {/* Menu de navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-1 space-y-1 text-sm custom-scrollbar">
        {visibleNav.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all text-left font-medium ${
                isActive
                  ? 'bg-[#2E74B5] text-white shadow-md'
                  : 'text-blue-100/85 hover:bg-[#28497d] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-blue-300'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full text-white shrink-0 ${item.badgeColor || 'bg-rose-500'}`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sélecteur rapide de rôle (Mode évaluation DUT) */}
      <div className="p-2 border-t border-[#2d4d82] bg-[#162a4d]/50 text-[11px]">
        <div className="text-blue-200/80 font-semibold mb-1 flex items-center gap-1">
          <UserCheck className="w-3.5 h-3.5 text-blue-300" />
          <span>Basculer de rôle (DUT) :</span>
        </div>
        <div className="grid grid-cols-2 gap-1 text-[10px]">
          <button
            onClick={() => demoLogin('admin')}
            className={`px-1.5 py-1 rounded text-center truncate ${user?.role === 'admin' ? 'bg-purple-600 text-white font-bold' : 'bg-[#213b69] hover:bg-[#2c4e8a] text-blue-100'}`}
          >
            Admin
          </button>
          <button
            onClick={() => demoLogin('logistique')}
            className={`px-1.5 py-1 rounded text-center truncate ${user?.role === 'logistique' ? 'bg-blue-600 text-white font-bold' : 'bg-[#213b69] hover:bg-[#2c4e8a] text-blue-100'}`}
          >
            Logistique
          </button>
          <button
            onClick={() => demoLogin('pharmacien')}
            className={`px-1.5 py-1 rounded text-center truncate ${user?.role === 'pharmacien' ? 'bg-emerald-600 text-white font-bold' : 'bg-[#213b69] hover:bg-[#2c4e8a] text-blue-100'}`}
          >
            Pharmacie
          </button>
          <button
            onClick={() => demoLogin('maintenance')}
            className={`px-1.5 py-1 rounded text-center truncate ${user?.role === 'maintenance' ? 'bg-amber-600 text-white font-bold' : 'bg-[#213b69] hover:bg-[#2c4e8a] text-blue-100'}`}
          >
            Maintenance
          </button>
          <button
            onClick={() => demoLogin('chef_service')}
            className={`col-span-2 px-1.5 py-1 rounded text-center truncate ${user?.role === 'chef_service' ? 'bg-indigo-600 text-white font-bold' : 'bg-[#213b69] hover:bg-[#2c4e8a] text-blue-100'}`}
          >
            Chef Urgences
          </button>
        </div>
      </div>

      {/* Déconnexion */}
      <div className="p-2 border-t border-[#2d4d82]">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-200 hover:bg-rose-950/40 hover:text-rose-100 transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{t('nav_logout')}</span>
        </button>
      </div>
    </aside>
  );
};
