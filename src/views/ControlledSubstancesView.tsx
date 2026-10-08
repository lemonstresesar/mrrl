import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  AlertTriangle,
  UserCheck,
  Hash,
  Sparkles,
  FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { SortieControlee, Produit, Lot, Service } from '../types';
import { ControlledSubstanceModal } from '../components/ControlledSubstanceModal';
import { exportControlledRegistryPDF } from '../services/exportService';

export const ControlledSubstancesView: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'pending' | 'registry'>('pending');
  const [registry, setRegistry] = useState<SortieControlee[]>([]);
  const [pending, setPending] = useState<SortieControlee[]>([]);
  const [produitsControles, setProduitsControles] = useState<Produit[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [regRes, penRes, pRes, lRes, sRes] = await Promise.all([
        api.getControlledRegistry(),
        api.getControlledPending(),
        api.getProduits({ est_controle: 'true' }),
        api.getLots(),
        api.getServices(),
      ]);
      setRegistry(regRes.registry);
      setPending(penRes.pending);
      setProduitsControles(pRes.produits);
      setLots(lRes.lots);
      setServices(sRes.services);
    } catch (e) {
      console.error('Erreur chargement stupéfiants', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInitiate = async (data: any) => {
    setActionError(null);
    setActionSuccess(null);
    const res = await api.initiateControlledExit(data);
    setActionSuccess(res.message);
    await fetchData();
    setActiveTab('pending');
  };

  const handleApprove = async (item: SortieControlee) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await api.approveControlledExit(item.id);
      setActionSuccess(res.message);
      await fetchData();
      setActiveTab('registry');
    } catch (err: any) {
      setActionError(err.message || 'Erreur lors de la validation.');
    }
  };

  const handleReject = async (item: SortieControlee) => {
    const motif = prompt('Veuillez spécifier le motif légal du rejet de cette sortie :');
    if (!motif) return;
    try {
      setActionError(null);
      setActionSuccess(null);
      const res = await api.rejectControlledExit(item.id, motif);
      setActionSuccess(res.message);
      await fetchData();
    } catch (err: any) {
      setActionError(err.message || 'Erreur lors du rejet.');
    }
  };

  const isPharmacist = user?.role === 'pharmacien' || user?.role === 'admin';
  const isLogisticien = user?.role === 'logistique' || user?.role === 'admin';

  return (
    <div className="space-y-5">
      {/* Entête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-amber-600" />
            <span>Registre Médico-Légal des Produits Contrôlés & Stupéfiants</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Procédure hospitalière de haute sécurité sous double-validation obligatoire (Pharmacien + Responsable Logistique)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportControlledRegistryPDF(registry)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Registre PDF</span>
          </button>

          {isPharmacist && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Initier une Sortie (Pharmacien)</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages de retour */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-slate-400 hover:text-slate-600">×</button>
        </div>
      )}

      {actionError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-slate-400 hover:text-slate-600">×</button>
        </div>
      )}

      {/* Bannière explicative règle des 2 utilisateurs */}
      <div className="p-4 bg-amber-50/80 border border-amber-300 rounded-xl text-xs text-amber-950 space-y-2">
        <div className="flex items-center gap-2 font-bold text-amber-900">
          <UserCheck className="w-4 h-4 text-amber-700" />
          <span>Principe des Deux Utilisateurs Distincts (Séparation des Pouvoirs)</span>
        </div>
        <p className="text-[11px] text-amber-800 leading-relaxed">
          Pour prévenir toute déviation de substances vénéneuses (Morphine, Fentanyl, stupéfiants Tableau A), la loi hospitalière et le système HGD imposent que <b>le Pharmacien qui initie l'ordonnance et le Responsable Logistique qui valide le déstockage effectif soient deux personnes différentes</b>. Chaque validation est scellée par une signature cryptographique SHA-256 dans un registre infalsifiable en lecture seule pour tous.
        </p>
      </div>

      {/* Onglets */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'pending'
              ? 'border-amber-600 text-amber-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>En Attente de Validation Logistique ({pending.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('registry')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'registry'
              ? 'border-amber-600 text-amber-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Registre Officiel Scellé ({registry.length})</span>
        </button>
      </div>

      {/* TAB 1 : EN ATTENTE */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pending.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
              Aucune demande de sortie de produit contrôlé en attente de validation.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pending.map((item) => {
                const isInitiator = item.pharmacien_initiateur_id === user?.id;
                return (
                  <div
                    key={item.id}
                    className="bg-white p-5 rounded-xl border-2 border-amber-200 shadow-xs space-y-3 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                      <div>
                        <span className="font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded text-[11px]">
                          {item.registre_numero}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 mt-1">
                          {item.produit_designation}
                        </h4>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                        EN ATTENTE LOGISTIQUE
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px]">
                      <div>
                        <span className="text-slate-400 block">Quantité :</span>
                        <span className="font-bold text-slate-900 text-xs">
                          {item.quantite} {item.unite_mesure}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Lot attribué :</span>
                        <span className="font-mono font-semibold">{item.numero_lot}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Service demandeur :</span>
                        <span className="font-semibold text-slate-800">{item.service_demandeur_nom}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Réf. Patient :</span>
                        <span className="font-mono font-semibold text-slate-800">{item.patient_ref_anonyme}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 block">Prescripteur :</span>
                        <span className="font-semibold text-slate-800">{item.medecin_prescripteur}</span>
                      </div>
                      <div className="col-span-2 p-2 bg-slate-50 rounded border border-slate-100 italic">
                        "{item.motif_therapeutique}"
                      </div>
                      <div className="col-span-2 text-slate-400 text-[10px]">
                        Initié par : <b className="text-slate-700">{item.pharmacien_nom}</b> le{' '}
                        {new Date(item.date_initiation).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'long',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>

                    {/* Actions de validation logistique */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      {isInitiator && (
                        <span className="text-[10px] text-amber-700 italic">
                          (Vous avez initié cette demande — validation réservée à un autre collègue)
                        </span>
                      )}

                      <div className="flex items-center gap-2 ml-auto">
                        {isLogisticien && (
                          <>
                            <button
                              onClick={() => handleReject(item)}
                              className="px-3 py-1.5 border border-rose-300 hover:bg-rose-50 text-rose-700 rounded-lg font-semibold text-xs transition"
                            >
                              Rejeter
                            </button>
                            <button
                              disabled={isInitiator}
                              onClick={() => handleApprove(item)}
                              title={
                                isInitiator
                                  ? 'Vous ne pouvez pas valider votre propre demande (règle des 2 utilisateurs)'
                                  : 'Valider et signer la sortie'
                              }
                              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg font-semibold text-xs shadow-md transition flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Valider & Déstocker</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2 : REGISTRE SCELLÉ OFFICIEL */}
      {activeTab === 'registry' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[750px]">
            <thead className="bg-[#1F3864] text-white font-semibold">
              <tr>
                <th className="py-3 px-4">N° Registre</th>
                <th className="py-3 px-4">Substance & Quantité</th>
                <th className="py-3 px-4">Patient & Prescripteur</th>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4">Acteurs (Double Accord)</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4">Sceau SHA-256</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {registry.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono font-bold text-[#1F3864]">
                    {r.registre_numero}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{r.produit_designation}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {r.quantite} {r.unite_mesure} • Lot: {r.numero_lot}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800">{r.patient_ref_anonyme}</div>
                    <div className="text-[10px] text-slate-500">{r.medecin_prescripteur}</div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {r.service_demandeur_nom}
                  </td>
                  <td className="py-3 px-4 text-[11px]">
                    <div>
                      <span className="text-slate-400">Initié :</span> {r.pharmacien_nom}
                    </div>
                    <div>
                      <span className="text-slate-400">Validé :</span>{' '}
                      {r.logisticien_nom ? (
                        <b className="text-emerald-700">{r.logisticien_nom}</b>
                      ) : (
                        <span className="text-amber-600 font-semibold">En attente</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {r.statut === 'approuve' ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        APPROUVÉ & DÉSTOCKÉ
                      </span>
                    ) : r.statut === 'rejete' ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                        REJETÉ
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                        EN ATTENTE
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-[10px] text-slate-500">
                    {r.hash_registre_inviolable ? (
                      <span
                        className="p-1 rounded bg-slate-100 text-slate-700 font-mono"
                        title={r.hash_registre_inviolable}
                      >
                        {r.hash_registre_inviolable.substring(0, 12)}...
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Modal Initiation Stupéfiants */}
      <ControlledSubstanceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onInitiate={handleInitiate}
        produitsControles={produitsControles}
        lots={lots}
        services={services}
      />
    </div>
  );
};
