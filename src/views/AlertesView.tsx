import React, { useState, useEffect } from 'react';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Phone,
  RefreshCw,
  Mail,
  Clock,
  Sparkles,
  ShieldAlert,
  Send,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { Alerte, JournalSMS } from '../types';

export const AlertesView: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'alertes' | 'sms'>('alertes');
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [smsJournal, setSmsJournal] = useState<JournalSMS[]>([]);
  const [nonLuesUniquement, setNonLuesUniquement] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [aRes, sRes] = await Promise.all([
        api.getAlertes({ non_lues_uniquement: nonLuesUniquement ? 'true' : '' }),
        api.getSMSJournal(),
      ]);
      setAlertes(aRes.alertes);
      setSmsJournal(sRes.journal_sms);
    } catch (e) {
      console.error('Erreur chargement alertes', e);
    }
  };

  useEffect(() => {
    fetchData();
  }, [nonLuesUniquement]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.markAlerteRead(id);
      await fetchData();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllAlertesRead();
      await fetchData();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleTriggerScan = async () => {
    try {
      setScanning(true);
      setScanMessage(null);
      const res = await api.triggerAlertScan();
      setScanMessage(`Scan planifié node-cron exécuté avec succès : ${res.count} nouvelle(s) alerte(s) vérifiée(s).`);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Erreur scan');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Entête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-rose-600" />
            <span>Centre d'Alertes Hospitalières & Journal SMS</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Surveillance continue par planificateur (node-cron) : stock bas, péremptions 30j/90j, retards maintenance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tout marquer comme lu</span>
          </button>

          <button
            onClick={handleTriggerScan}
            disabled={scanning}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#2E74B5] hover:bg-[#256199] text-white rounded-lg text-xs font-semibold shadow-md transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
            <span>Exécuter le scan maintenant</span>
          </button>
        </div>
      </div>

      {scanMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center justify-between">
          <span>{scanMessage}</span>
          <button onClick={() => setScanMessage(null)} className="text-slate-400">×</button>
        </div>
      )}

      {/* Onglets */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('alertes')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'alertes'
                ? 'border-rose-600 text-rose-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Alertes du Système ({alertes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('sms')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'sms'
                ? 'border-[#2E74B5] text-[#1F3864]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Phone className="w-3.5 h-3.5 text-blue-600" />
            <span>Journal des SMS Simulés ({smsJournal.length})</span>
          </button>
        </div>

        {activeTab === 'alertes' && (
          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={nonLuesUniquement}
              onChange={(e) => setNonLuesUniquement(e.target.checked)}
              className="w-3.5 h-3.5 text-[#2E74B5] rounded"
            />
            <span>Afficher uniquement les non lues</span>
          </label>
        )}
      </div>

      {/* TAB 1 : ALERTES SYSTÈME */}
      {activeTab === 'alertes' && (
        <div className="space-y-3">
          {alertes.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
              Aucune alerte active à afficher.
            </div>
          ) : (
            alertes.map((a) => (
              <div
                key={a.id}
                className={`p-4 rounded-xl border transition flex items-start justify-between gap-4 ${
                  !a.est_lu
                    ? 'bg-white border-rose-300 shadow-sm'
                    : 'bg-slate-50/80 border-slate-200 opacity-80'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      a.niveau === 'critique'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{a.titre}</span>
                      <span
                        className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                          a.niveau === 'critique'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {a.niveau.toUpperCase()}
                      </span>
                      {!a.est_lu && (
                        <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 max-w-2xl">{a.message}</p>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2 pt-1">
                      <span>Cible : {a.entite_type.toUpperCase()} #{a.entite_id}</span>
                      <span>•</span>
                      <span>
                        {new Date(a.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'long',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {!a.est_lu && (
                  <button
                    onClick={() => handleMarkAsRead(a.id)}
                    className="shrink-0 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
                  >
                    Marquer lu
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2 : JOURNAL SMS SIMULÉ */}
      {activeTab === 'sms' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs text-slate-600">
            Journal de simulation des SMS envoyés aux cadres d'astreinte hospitalière (Direction, Chefs de Service, Pharmaciens, Ingénieurs Biomed).
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1F3864] text-white font-semibold">
              <tr>
                <th className="py-3 px-4">Destinataire</th>
                <th className="py-3 px-4">Téléphone</th>
                <th className="py-3 px-4">Type Alerte</th>
                <th className="py-3 px-4">Message SMS Transmis</th>
                <th className="py-3 px-4">Statut d'Envoi</th>
                <th className="py-3 px-4">Horodatage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {smsJournal.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">{s.destinataire_nom}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-800">{s.telephone}</td>
                  <td className="py-3 px-4 font-semibold text-[#2E74B5]">{s.type_alerte}</td>
                  <td className="py-3 px-4 max-w-md font-mono text-[11px] text-slate-700">
                    <span className="p-1 rounded bg-slate-100 block">{s.message}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1 w-fit">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>{s.statut_envoi}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[10px] text-slate-400">
                    {new Date(s.date_envoi).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
