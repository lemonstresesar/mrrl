import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Download,
  Filter,
  FileText,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { Maintenance, Equipement, MaintenanceStatut } from '../types';
import { MaintenanceModal } from '../components/MaintenanceModal';
import { Modal } from '../components/Modal';
import { exportMaintenancePDF } from '../services/exportService';

export const MaintenanceView: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [equipements, setEquipements] = useState<Equipement[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtres
  const [typeFilter, setTypeFilter] = useState('');
  const [statutFilter, setStatutFilter] = useState('');

  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createType, setCreateType] = useState<'preventive' | 'curative'>('curative');

  // Modal mise à jour / clôture d'intervention
  const [selectedMaint, setSelectedMaint] = useState<Maintenance | null>(null);
  const [updateStatut, setUpdateStatut] = useState<MaintenanceStatut>('terminee');
  const [rapportTech, setRapportTech] = useState('');
  const [piecesRemplacees, setPiecesRemplacees] = useState('');
  const [coutCFA, setCoutCFA] = useState<number>(0);
  const [remettreEnService, setRemettreEnService] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mRes, eqRes] = await Promise.all([
        api.getMaintenances({ type: typeFilter, statut: statutFilter }),
        api.getEquipements(),
      ]);
      setMaintenances(mRes.maintenances);
      setEquipements(eqRes.equipements);
    } catch (e) {
      console.error('Erreur chargement maintenance', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [typeFilter, statutFilter]);

  const handleCreate = async (data: any) => {
    await api.createMaintenance(data);
    await fetchData();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaint) return;
    try {
      await api.updateMaintenance(selectedMaint.id, {
        statut: updateStatut,
        rapport_technique: rapportTech,
        pieces_remplacees: piecesRemplacees,
        cout_intervention_cfa: coutCFA,
        remettre_en_service: remettreEnService,
      });
      setSelectedMaint(null);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Erreur mise à jour');
    }
  };

  const openCloseModal = (m: Maintenance) => {
    setSelectedMaint(m);
    setUpdateStatut('terminee');
    setRapportTech(m.rapport_technique || 'Remplacement des pièces défectueuses et vérification de la conformité aux normes CE.');
    setPiecesRemplacees(m.pieces_remplacees || 'Fusibles de sécurité, joints étanches');
    setCoutCFA(m.cout_intervention_cfa || 50000);
    setRemettreEnService(true);
  };

  const canEdit = user?.role === 'maintenance' || user?.role === 'logistique' || user?.role === 'admin';

  return (
    <div className="space-y-5">
      {/* Entête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-[#2E74B5]" />
            <span>Génie Biomédical & Maintenance des Équipements</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Suivi des pannes curatives, calendrier des visites préventives et détection automatique des retards
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportMaintenancePDF(maintenances)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={() => {
              setCreateType('preventive');
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition shadow-xs"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Planifier Préventive</span>
          </button>

          <button
            onClick={() => {
              setCreateType('curative');
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-md transition"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Déclarer une Panne (Curative)</span>
          </button>
        </div>
      </div>

      {/* Barre de filtres */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-700">Filtrer par :</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-hidden text-xs"
          >
            <option value="">Tous les types</option>
            <option value="curative">Curative (Panne)</option>
            <option value="preventive">Préventive (Visite périodique)</option>
          </select>

          <select
            value={statutFilter}
            onChange={(e) => setStatutFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-hidden text-xs"
          >
            <option value="">Tous les statuts</option>
            <option value="en_retard">🚨 En retard</option>
            <option value="planifiee">Planifiée</option>
            <option value="en_cours">En cours</option>
            <option value="terminee">Terminée</option>
          </select>
        </div>

        <div className="text-slate-500 font-medium">
          {maintenances.length} intervention(s) répertoriée(s)
        </div>
      </div>

      {/* Tableau des interventions */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#1F3864] text-white font-semibold">
            <tr>
              <th className="py-3 px-4">ID</th>
              <th className="py-3 px-4">Équipement & Localisation</th>
              <th className="py-3 px-4">Type & Priorité</th>
              <th className="py-3 px-4">Description Panne / Visite</th>
              <th className="py-3 px-4">Date Planifiée</th>
              <th className="py-3 px-4">Statut</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {maintenances.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50/80 transition">
                <td className="py-3 px-4 font-mono font-bold text-[#1F3864]">#{m.id}</td>
                <td className="py-3 px-4 max-w-xs">
                  <div className="font-bold text-slate-900">{m.equipement_nom}</div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {m.equipement_code} • {m.service_nom} ({m.salle})
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="font-semibold text-slate-800 uppercase">
                    {m.type === 'curative' ? 'Curative (Dépannage)' : 'Préventive'}
                  </div>
                  <span
                    className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      m.priorite === 'urgente'
                        ? 'bg-rose-100 text-rose-800'
                        : m.priorite === 'haute'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    Priorité : {m.priorite}
                  </span>
                </td>
                <td className="py-3 px-4 max-w-xs text-slate-600 text-[11px]">
                  <div>{m.description_panne}</div>
                  {m.rapport_technique && (
                    <div className="mt-1 p-1 rounded bg-emerald-50 text-emerald-800 font-mono text-[10px]">
                      Rapport : {m.rapport_technique}
                    </div>
                  )}
                </td>
                <td className="py-3 px-4 font-semibold text-slate-800">
                  {m.date_planifiee}
                  {m.technicien_nom && (
                    <div className="text-[10px] text-slate-400 font-normal">
                      {m.technicien_nom}
                    </div>
                  )}
                </td>
                <td className="py-3 px-4">
                  {m.statut === 'en_retard' ? (
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-300 animate-pulse">
                      🚨 EN RETARD
                    </span>
                  ) : m.statut === 'terminee' ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      TERMINÉE
                    </span>
                  ) : m.statut === 'en_cours' ? (
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                      EN COURS
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                      Planifiée
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  {canEdit && m.statut !== 'terminee' && (
                    <button
                      onClick={() => openCloseModal(m)}
                      className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-[#2E74B5] font-bold text-xs transition"
                    >
                      Mettre à jour / Clôturer
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Création Intervention */}
      <MaintenanceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreate}
        equipements={equipements}
        defaultType={createType}
      />

      {/* Modal Clôture / Mise à jour Intervention */}
      <Modal
        isOpen={!!selectedMaint}
        onClose={() => setSelectedMaint(null)}
        title={`Rapport Technique & Clôture (#${selectedMaint?.id})`}
        subtitle={`Équipement : ${selectedMaint?.equipement_nom}`}
        maxWidth="md"
      >
        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nouveau statut</label>
            <select
              value={updateStatut}
              onChange={(e) => setUpdateStatut(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden bg-white text-xs font-semibold"
            >
              <option value="terminee">Terminée (Réparation effectuée avec succès)</option>
              <option value="en_cours">En cours de traitement</option>
              <option value="planifiee">Replanifiée</option>
              <option value="annulee">Annulée</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Pièces détachées remplacées</label>
            <input
              type="text"
              value={piecesRemplacees}
              onChange={(e) => setPiecesRemplacees(e.target.value)}
              placeholder="ex: Valve expiratoire, capteur O2 Dräger"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Coût d'intervention (FCFA)</label>
            <input
              type="number"
              min="0"
              value={coutCFA}
              onChange={(e) => setCoutCFA(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden text-xs font-bold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Rapport technique de conformité *</label>
            <textarea
              required
              rows={3}
              value={rapportTech}
              onChange={(e) => setRapportTech(e.target.value)}
              placeholder="Décrivez les tests d'étalonnage et la sécurité électrique effectuée..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden text-xs"
            />
          </div>

          {updateStatut === 'terminee' && (
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center gap-2">
              <input
                type="checkbox"
                id="remettre"
                checked={remettreEnService}
                onChange={(e) => setRemettreEnService(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <label htmlFor="remettre" className="text-emerald-900 font-semibold cursor-pointer">
                Remettre automatiquement l'équipement au statut "En service" (Opérationnel)
              </label>
            </div>
          )}

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setSelectedMaint(null)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#2E74B5] hover:bg-[#256199] text-white rounded-lg text-xs font-semibold shadow-md transition"
            >
              Enregistrer le rapport
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
