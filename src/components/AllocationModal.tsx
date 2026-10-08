import React, { useState } from 'react';
import { Modal } from './Modal';
import { Service } from '../types';

interface AllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  services: Service[];
  defaultServiceId?: number | null;
}

export const AllocationModal: React.FC<AllocationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  services,
  defaultServiceId,
}) => {
  const [typeRessource, setTypeRessource] = useState<'equipement' | 'lit' | 'produit'>('equipement');
  const [designation, setDesignation] = useState('Respirateur de réanimation mobile SMUR');
  const [quantite, setQuantite] = useState<number>(1);
  const [serviceId, setServiceId] = useState<number>(defaultServiceId || services[0]?.id || 1);
  const [urgence, setUrgence] = useState<'normale' | 'urgente' | 'vitale'>('urgente');
  const [justification, setJustification] = useState('Afflux massif de blessés graves de la route - Tous les postes de ventilation occupés');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!designation.trim() || !justification.trim()) {
      setError('Désignation et justification sont obligatoires.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSave({
        type_ressource: typeRessource,
        designation_ressource: designation,
        quantite: Number(quantite),
        service_demandeur_id: Number(serviceId),
        urgence,
        justification,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la soumission de la demande.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Demande d'Allocation de Ressource Hospitalière"
      subtitle="Procédure de réquisition inter-services HGD"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Type de ressource *</label>
            <select
              value={typeRessource}
              onChange={(e) => setTypeRessource(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden bg-white text-xs font-semibold"
            >
              <option value="equipement">Équipement biomédical</option>
              <option value="lit">Lit d'hospitalisation</option>
              <option value="produit">Médicament / Soluté critique</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Niveau d'urgence *</label>
            <select
              value={urgence}
              onChange={(e) => setUrgence(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden bg-white text-xs font-bold"
            >
              <option value="vitale">🔴 Vitale (Danger immédiat pour le patient)</option>
              <option value="urgente">🟠 Urgente (Intervention dans les 2h)</option>
              <option value="normale">🔵 Normale (Sous 24h)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Ressource souhaitée *</label>
          <input
            type="text"
            required
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            placeholder="ex: Moniteur multiparamétrique ou Lit réanimation"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden text-xs"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Quantité requise *</label>
            <input
              type="number"
              min="1"
              required
              value={quantite}
              onChange={(e) => setQuantite(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden text-xs font-bold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Service demandeur *</label>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden bg-white text-xs"
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nom} ({s.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Justification clinique / médicale *</label>
          <textarea
            required
            rows={3}
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Précisez le contexte clinique nécessitant cette allocation..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden text-xs"
          />
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
            className="px-5 py-2 bg-[#2E74B5] hover:bg-[#256199] text-white rounded-lg text-xs font-semibold shadow-md transition disabled:opacity-50"
          >
            {loading ? 'Soumission...' : 'Envoyer la demande'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
