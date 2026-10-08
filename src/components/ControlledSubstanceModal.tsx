import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Produit, Service, Lot } from '../types';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

interface ControlledSubstanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInitiate: (data: any) => Promise<void>;
  produitsControles: Produit[];
  lots: Lot[];
  services: Service[];
}

export const ControlledSubstanceModal: React.FC<ControlledSubstanceModalProps> = ({
  isOpen,
  onClose,
  onInitiate,
  produitsControles,
  lots,
  services,
}) => {
  const [produitId, setProduitId] = useState<number>(produitsControles[0]?.id || 1);
  const [quantite, setQuantite] = useState<number>(5);
  const [serviceDemandeurId, setServiceDemandeurId] = useState<number>(1);
  const [patientRef, setPatientRef] = useState('');
  const [prescripteur, setPrescripteur] = useState('');
  const [indication, setIndication] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (produitsControles.length > 0) {
      setProduitId(produitsControles[0].id);
    }
    setPatientRef(`PAT-HGD-${Math.floor(1000 + Math.random() * 9000)}`);
    setPrescripteur('Dr. Mbarga (Médecin Réanimateur)');
    setIndication('Analgésie majeure post-opératoire polytraumatisé sévère');
    setError(null);
  }, [isOpen, produitsControles]);

  const selectedProduit = produitsControles.find((p) => p.id === Number(produitId));
  const productLots = lots.filter((l) => l.produit_id === Number(produitId) && l.statut === 'actif');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientRef.trim() || !prescripteur.trim() || !indication.trim()) {
      setError('Veuillez renseigner toutes les mentions médico-légales obligatoires.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onInitiate({
        produit_id: Number(produitId),
        quantite: Number(quantite),
        service_demandeur_id: Number(serviceDemandeurId),
        patient_ref_anonyme: patientRef,
        medecin_prescripteur: prescripteur,
        motif_therapeutique: indication,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'initiation de la sortie de produit contrôlé.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Initiation de Sortie — Stupéfiant / Produit Contrôlé"
      subtitle="Étape 1/2 : Saisie réglementaire par le Pharmacien Hospitalier"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg font-medium flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 flex items-start gap-2.5">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-xs">Protocole des Deux Utilisateurs Distincts</div>
            <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
              Cette initiation par le <b>Pharmacien</b> n'effectue aucun déstockage immédiat. Elle sera soumise au <b>Responsable Logistique</b> pour vérification et signature officielle conjointe avec sceau d'intégrité SHA-256.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Substance stupéfiante */}
          <div className="md:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">
              Substance contrôlée / Stupéfiant *
            </label>
            <select
              value={produitId}
              onChange={(e) => setProduitId(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden bg-white text-xs font-semibold"
            >
              {produitsControles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.designation} ({p.forme_dosage}) — Disponible: {p.stock_actif || 0} {p.unite_mesure}
                </option>
              ))}
            </select>
          </div>

          {/* Quantité demandée */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Quantité demandée ({selectedProduit?.unite_mesure || 'ampoules'}) *
            </label>
            <input
              type="number"
              min="1"
              required
              value={quantite}
              onChange={(e) => setQuantite(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden text-xs font-bold"
            />
          </div>

          {/* Service demandeur */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Service demandeur *</label>
            <select
              value={serviceDemandeurId}
              onChange={(e) => setServiceDemandeurId(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden bg-white text-xs"
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nom} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Réf. Patient anonymisée */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Référence patient anonymisée (RGPD/Secret médical) *
            </label>
            <input
              type="text"
              required
              value={patientRef}
              onChange={(e) => setPatientRef(e.target.value)}
              placeholder="ex: PAT-HGD-9021"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden font-mono text-xs"
            />
          </div>

          {/* Médecin Prescripteur */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Médecin prescripteur titulaire de l'ordonnance *
            </label>
            <input
              type="text"
              required
              value={prescripteur}
              onChange={(e) => setPrescripteur(e.target.value)}
              placeholder="ex: Dr. Mbarga (Anesthésiste-Réanimateur)"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden text-xs"
            />
          </div>

          {/* Indication / Motif thérapeutique */}
          <div className="md:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">
              Motif thérapeutique / Protocole clinique *
            </label>
            <textarea
              required
              rows={2}
              value={indication}
              onChange={(e) => setIndication(e.target.value)}
              placeholder="ex: Douleurs intenses non calmées par morphiniques de palier II suite polytraumatisme crânio-facial"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden text-xs"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{loading ? 'Soumission...' : 'Initier la demande légale'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
