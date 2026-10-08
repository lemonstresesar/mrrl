import React, { useState, useEffect } from 'react';
import {
  ArrowLeftRight,
  Plus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { DemandeAllocation, Service, Equipement } from '../types';
import { AllocationModal } from '../components/AllocationModal';
import { Modal } from '../components/Modal';

export const AllocationsView: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [allocations, setAllocations] = useState<DemandeAllocation[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [equipements, setEquipements] = useState<Equipement[]>([]);
  const [loading, setLoading] = useState(true);

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Modal Traitement d'allocation (Logistique)
  const [selectedAlloc, setSelectedAlloc] = useState<DemandeAllocation | null>(null);
  const [decision, setDecision] = useState<'approuvee' | 'rejetee'>('approuvee');
  const [commentaire, setCommentaire] = useState('');
  const [selectedEqId, setSelectedEqId] = useState<number | null>(null);
  const [nouvelleSalle, setNouvelleSalle] = useState('Box Déchoquage 2');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [aRes, sRes, eqRes] = await Promise.all([
        api.getAllocations(),
        api.getServices(),
        api.getEquipements({ statut: 'en_service' }),
      ]);
      setAllocations(aRes.allocations);
      setServices(sRes.services);
      setEquipements(eqRes.equipements);
    } catch (e) {
      console.error('Erreur allocations', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (data: any) => {
    await api.createAllocation(data);
    await fetchData();
  };

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlloc) return;
    try {
      await api.traiterAllocation(selectedAlloc.id, {
        decision,
        commentaire_reponse: commentaire,
        equipement_id: decision === 'approuvee' && selectedEqId ? Number(selectedEqId) : undefined,
        nouvelle_salle: decision === 'approuvee' ? nouvelleSalle : undefined,
      });
      setSelectedAlloc(null);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Erreur traitement de la demande');
    }
  };

  const openProcessModal = (alloc: DemandeAllocation) => {
    setSelectedAlloc(alloc);
    setDecision('approuvee');
    setCommentaire(`Mise à disposition immédiate pour le service ${alloc.service_demandeur_nom}.`);
    const matchEq = equipements.find((e) => e.service_id !== alloc.service_demandeur_id);
    setSelectedEqId(matchEq?.id || equipements[0]?.id || null);
    setNouvelleSalle('Salle de soins continus 1');
  };

  const canProcess = user?.role === 'logistique' || user?.role === 'admin';

  return (
    <div className="space-y-5">
      {/* Entête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-[#2E74B5]" />
            <span>Demandes d'Allocations & Transferts Inter-Services</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Réquisitions de matériel par les chefs de service et mise à jour de la localisation physique à l'hôpital
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#2E74B5] hover:bg-[#256199] text-white rounded-lg text-xs font-semibold shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Demande de Ressource</span>
        </button>
      </div>

      {/* Cartes d'allocations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allocations.map((a) => (
          <div
            key={a.id}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs"
          >
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div>
                <span className="font-mono text-[11px] font-bold text-slate-400">DEMANDE #{a.id}</span>
                <h4 className="font-bold text-sm text-slate-900 mt-0.5">{a.designation_ressource}</h4>
                <div className="text-[11px] text-slate-500">
                  Quantité : <b className="text-slate-800">{a.quantite}</b> • Type :{' '}
                  <span className="capitalize">{a.type_ressource}</span>
                </div>
              </div>
              <div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    a.urgence === 'vitale'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : a.urgence === 'urgente'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-blue-50 text-blue-800 border border-blue-200'
                  }`}
                >
                  URGENCE : {a.urgence.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-slate-600 text-[11px]">
              <div>
                <span className="text-slate-400">Service demandeur :</span>{' '}
                <b className="text-slate-800">{a.service_demandeur_nom}</b> (Initié par {a.chef_service_nom})
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-100 italic text-slate-700">
                "{a.justification}"
              </div>
              {a.equipement_transfere_nom && (
                <div className="p-2 bg-emerald-50 rounded border border-emerald-200 text-emerald-900 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Matériel transféré : {a.equipement_transfere_nom}</span>
                </div>
              )}
              {a.commentaire_reponse && (
                <div className="text-slate-500 text-[10px]">
                  Décision logistique : {a.commentaire_reponse}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                {a.statut === 'effectuee' || a.statut === 'approuvee' ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    EFFECTUÉE (TRANSFERT LOCALISÉ)
                  </span>
                ) : a.statut === 'rejetee' ? (
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                    REJETÉE
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                    EN ATTENTE LOGISTIQUE
                  </span>
                )}
              </div>

              {canProcess && a.statut === 'en_attente' && (
                <button
                  onClick={() => openProcessModal(a)}
                  className="px-3 py-1.5 bg-[#1F3864] hover:bg-[#162a4d] text-white rounded-lg text-xs font-semibold shadow-xs transition"
                >
                  Traiter / Transférer
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Demande */}
      <AllocationModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSave={handleCreate}
        services={services}
        defaultServiceId={user?.service_id}
      />

      {/* Modal Traitement par la Logistique */}
      <Modal
        isOpen={!!selectedAlloc}
        onClose={() => setSelectedAlloc(null)}
        title="Traitement de la Demande d'Allocation"
        subtitle={`Ressource : ${selectedAlloc?.designation_ressource}`}
        maxWidth="md"
      >
        <form onSubmit={handleProcess} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Décision logistique *</label>
            <select
              value={decision}
              onChange={(e) => setDecision(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden bg-white text-xs font-semibold"
            >
              <option value="approuvee">Approuver et transférer la ressource</option>
              <option value="rejetee">Rejeter la demande (Ressource indisponible)</option>
            </select>
          </div>

          {decision === 'approuvee' && selectedAlloc?.type_ressource === 'equipement' && (
            <>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Sélectionner l'équipement en service à transférer *
                </label>
                <select
                  value={selectedEqId || ''}
                  onChange={(e) => setSelectedEqId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden bg-white text-xs"
                >
                  {equipements.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.code_inventaire} — {eq.nom} (Actuellement au service {eq.service_nom})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nouvelle salle d'affectation dans le service demandeur *
                </label>
                <input
                  type="text"
                  required
                  value={nouvelleSalle}
                  onChange={(e) => setNouvelleSalle(e.target.value)}
                  placeholder="ex: Box Déchoquage 2"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden text-xs"
                />
              </div>
            </>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Motif / Commentaire de réponse</label>
            <textarea
              rows={2}
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden text-xs"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setSelectedAlloc(null)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#2E74B5] hover:bg-[#256199] text-white rounded-lg text-xs font-semibold shadow-md transition"
            >
              Confirmer le traitement
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
