import React, { useState, useEffect } from 'react';
import { History, Search, ShieldCheck, Filter } from 'lucide-react';
import { api } from '../services/api';
import { JournalAudit } from '../types';

export const AuditView: React.FC = () => {
  const [logs, setLogs] = useState<JournalAudit[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLog({ search });
      setLogs(res.audit_log);
    } catch (e) {
      console.error('Erreur audit', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [search]);

  return (
    <div className="space-y-5">
      {/* Entête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <History className="w-6 h-6 text-[#2E74B5]" />
            <span>Journal d'Audit Inviolable & Traçabilité</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Historique certifié de chaque action sensible effectuée sur les équipements, stocks et sorties contrôlées
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-200 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Intégrité des Données Garantie</span>
        </div>
      </div>

      {/* Recherche */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3 text-xs">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par action, utilisateur, identifiant d'entité ou détail..."
          className="flex-1 focus:outline-hidden"
        />
        <span className="text-slate-400">{logs.length} entrée(s)</span>
      </div>

      {/* Tableau d'audit */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#1F3864] text-white font-semibold">
            <tr>
              <th className="py-3 px-4">Horodatage</th>
              <th className="py-3 px-4">Utilisateur & Rôle</th>
              <th className="py-3 px-4">Action Enregistrée</th>
              <th className="py-3 px-4">Cible</th>
              <th className="py-3 px-4">Détails de l'Opération</th>
              <th className="py-3 px-4">Adresse IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/80 transition font-mono text-[11px]">
                <td className="py-3 px-4 text-slate-500 font-sans">
                  {new Date(log.created_at).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </td>
                <td className="py-3 px-4 font-sans font-bold text-slate-900">
                  {log.utilisateur_nom}
                </td>
                <td className="py-3 px-4 font-bold text-[#1F3864]">
                  <span className="p-1 rounded bg-blue-50 border border-blue-200 inline-block">
                    {log.action}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-600 font-sans">
                  <b>{log.entite}</b> : {log.entite_id}
                </td>
                <td className="py-3 px-4 font-sans text-slate-700 max-w-md">
                  {log.details}
                </td>
                <td className="py-3 px-4 text-slate-400 font-mono text-[10px]">
                  {log.ip_address}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
