import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Bed,
  AlertTriangle,
  Wrench,
  ShieldAlert,
  ArrowLeftRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  Building2,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

interface DashboardViewProps {
  onNavigate: (view: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardStats();
      setStats(res);
    } catch (e) {
      console.error('Erreur chargement statistiques', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const getRoleWelcome = () => {
    switch (user?.role) {
      case 'admin':
        return 'Espace d\'Administration Générale & Supervision Institutionnelle';
      case 'logistique':
        return 'Espace Responsable Logistique — Gestion des Équipements, Lits & Stocks';
      case 'pharmacien':
        return 'Espace Pharmacie Centrale — Règle FEFO & Sorties Stupéfiants';
      case 'maintenance':
        return 'Espace Ingénierie Biomédicale — Maintenance & Suivi du Parc';
      case 'chef_service':
        return 'Espace Chef de Service — Disponibilité des Lits & Demandes de Ressources';
      default:
        return 'Tableau de bord des ressources médicales';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-linear-to-r from-[#1F3864] to-[#2E74B5] rounded-xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/20 text-blue-100 backdrop-blur-xs uppercase tracking-wider">
              {t('hospital_name')}
            </span>
            <span className="text-xs text-blue-200">• DUT Informatique / Génie Médical</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">
            Bonjour, {user?.prenom} {user?.nom}
          </h2>
          <p className="text-xs md:text-sm text-blue-100/90 mt-1">{getRoleWelcome()}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-xs font-semibold transition backdrop-blur-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Règle FEFO & Sécurité Banner */}
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-3 text-xs text-blue-900 shadow-xs">
        <Sparkles className="w-5 h-5 text-[#2E74B5] shrink-0 mt-0.5" />
        <div className="flex-1">
          <span className="font-bold text-[#1F3864]">Règle FEFO (First Expired, First Out) & Double-Validation Stupéfiants en vigueur :</span>{' '}
          Le système priorise automatiquement les lots avec les dates d'expiration les plus proches et bloque strictement les médicaments périmés. Toute sortie de stupéfiant requiert l'accord conjoint et distinct d'un Pharmacien et d'un Responsable Logistique.
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Taux de disponibilité équipements */}
        <div
          onClick={() => onNavigate('equipements')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-[#2E74B5] transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Disponibilité Équipements
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition">
              <Stethoscope className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {stats?.equipements?.taux_disponibilite_pct ?? '--'}%
            </span>
            <span className="text-xs text-emerald-700 font-medium">
              {stats?.equipements?.en_service ?? 0} en service / {stats?.equipements?.total ?? 0}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{stats?.equipements?.hors_service ?? 0} hors service • {stats?.equipements?.en_maintenance ?? 0} en révision</span>
          </div>
        </div>

        {/* Lits d'hospitalisation */}
        <div
          onClick={() => onNavigate('equipements')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-[#2E74B5] transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Lits d'hospitalisation
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition">
              <Bed className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {stats?.lits?.libres ?? 0} libres
            </span>
            <span className="text-xs text-slate-500 font-medium">
              / {stats?.lits?.total ?? 0} lits totaux
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>Taux d'occupation : {stats?.lits?.taux_occupation_pct ?? 0}%</span>
          </div>
        </div>

        {/* Stocks critiques & FEFO */}
        <div
          onClick={() => onNavigate('stocks')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-[#2E74B5] transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Alertes Stocks & FEFO
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600">
              {stats?.stocks?.produits_critiques_count ?? 0}
            </span>
            <span className="text-xs text-slate-500 font-medium">stocks sous seuil</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>{stats?.stocks?.lots_perimes_bloques ?? 0} lot(s) périmé(s) bloqué(s)</span>
          </div>
        </div>

        {/* Maintenances en retard */}
        <div
          onClick={() => onNavigate('maintenance')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-[#2E74B5] transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Maintenances Biomédicales
            </span>
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600">
              {stats?.maintenance?.en_retard ?? 0}
            </span>
            <span className="text-xs text-rose-700 font-medium">en retard</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{stats?.maintenance?.planifiees ?? 0} préventives programmées</span>
          </div>
        </div>
      </div>

      {/* Role-Specific Quick Actions & Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche : Actions prioritaires selon rôle */}
        <div className="lg:col-span-1 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
            <span>Actions Rapides — {user?.role.toUpperCase()}</span>
            <span className="text-[10px] text-slate-400 font-normal">Accès direct</span>
          </h3>

          <div className="space-y-2">
            {(user?.role === 'pharmacien' || user?.role === 'admin') && (
              <button
                onClick={() => onNavigate('controlled')}
                className="w-full p-3 rounded-lg border border-amber-200 bg-amber-50/60 hover:bg-amber-100/70 text-left transition flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <div>
                    <div className="font-bold text-amber-900">Initier sortie stupéfiant</div>
                    <div className="text-[11px] text-amber-700">Morphine, Fentanyl pour patient</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-600" />
              </button>
            )}

            {(user?.role === 'logistique' || user?.role === 'admin') && (
              <button
                onClick={() => onNavigate('controlled')}
                className="w-full p-3 rounded-lg border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 text-left transition flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="font-bold text-blue-900">Valider sortie stupéfiants</div>
                    <div className="text-[11px] text-blue-700">
                      {stats?.sorties_controlees?.en_attente ?? 0} demande(s) en attente
                    </div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold text-[10px]">
                  {stats?.sorties_controlees?.en_attente ?? 0}
                </span>
              </button>
            )}

            {(user?.role === 'maintenance' || user?.role === 'admin') && (
              <button
                onClick={() => onNavigate('qr_scanner')}
                className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Stethoscope className="w-4 h-4 text-[#2E74B5]" />
                  <div>
                    <div className="font-bold text-slate-800">Scanner QR Code Équipement</div>
                    <div className="text-[11px] text-slate-500">Ouvre directement la fiche machine</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            )}

            {user?.role === 'chef_service' && (
              <button
                onClick={() => onNavigate('allocations')}
                className="w-full p-3 rounded-lg border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100/70 text-left transition flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <ArrowLeftRight className="w-4 h-4 text-indigo-600" />
                  <div>
                    <div className="font-bold text-indigo-900">Demander une ressource</div>
                    <div className="text-[11px] text-indigo-700">Équipement, lit ou produit critique</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-indigo-600" />
              </button>
            )}

            <button
              onClick={() => onNavigate('reports')}
              className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#2E74B5]" />
                <div>
                  <div className="font-bold text-slate-800">Générer rapports officiels</div>
                  <div className="text-[11px] text-slate-500">Exports certifiés PDF & Excel</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Colonne droite : État des services de l'HGD */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#2E74B5]" />
              <span>Répartition par Service Hospitalier (Douala)</span>
            </h3>
            <span className="text-xs text-slate-500">7 Pôles Cliniques</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Service</th>
                  <th className="py-2.5 px-3">Équipements</th>
                  <th className="py-2.5 px-3">En service</th>
                  <th className="py-2.5 px-3">En panne/Maint.</th>
                  <th className="py-2.5 px-3">Lits Disponibles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {stats?.service_stats?.map((s: any) => (
                  <tr key={s.service_id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {s.service_nom}{' '}
                      <span className="text-[10px] text-slate-400 font-mono">({s.service_code})</span>
                    </td>
                    <td className="py-2.5 px-3">{s.total_equipements}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                        {s.en_service}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {s.en_panne > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold">
                          {s.en_panne}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {s.lits_libres > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold">
                          {s.lits_libres} libre(s)
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
