import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Equipement, MaintenanceType, MaintenancePriorite } from '../types';

interface MaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  equipements: Equipement[];
  defaultEquipementId?: number | null;
  defaultType?: MaintenanceType;
}

export const MaintenanceModal: React.FC<MaintenanceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  equipements,
  defaultEquipementId,
  defaultType = 'curative',
}) => {
  const [equipementId, setEquipementId] = useState<number>(defaultEquipementId || equipements[0]?.id || 1);
  const [type, setType] = useState<MaintenanceType>(defaultType);
  const [priorite, setPriorite] = useState<MaintenancePriorite>('haute');
  const [descriptionPanne, setDescriptionPanne] = useState('');
  const [datePlanifiee, setDatePlanifiee] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultEquipementId) {
      setEquipementId(defaultEquipementId);
    } else if (equipements.length > 0) {
      setEquipementId(equipements[0].id);
    }
    setType(defaultType);
    if (defaultType === 'curative') {
      setDescriptionPanne('Défaut d\'allumage ou message d\'erreur signalé en cours d\'utilisation');
      setPriorite('urgente');
    } else {
      setDescriptionPanne('Révision préventive programmée, contrôle des filtres et calibration des capteurs');
      setPriorite('moyenne');
    }
    setError(null);
  }, [defaultEquipementId, defaultType, isOpen, equipements]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descriptionPanne.trim() || !datePlanifiee) {
      setError('Veuillez renseigner la description et la date prévue.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSave({
        equipement_id: Number(equipementId),
        type,
        priorite,
        description_panne: descriptionPanne,
        date_planifiee: datePlanifiee,
        technicien_id: 4, // Technicien Gervais par défaut
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'enregistrement de l\'intervention.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={type === 'curative' ? 'Déclarer une panne (Curative)' : 'Planifier une maintenance préventive'}
      subtitle="Service de Génie Biomédical & Maintenance HGD"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg font-medium">
            {error}
          </div>
        )}

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Équipement biomédical concerné *</label>
          <select
            value={equipementId}
            onChange={(e) => setEquipementId(Number(e.target.value))}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden bg-white text-xs"
          >
            {equipements.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.code_inventaire} — {eq.nom} ({eq.service_nom || eq.salle}) [{eq.statut}]
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Type d'intervention *</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as MaintenanceType)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden bg-white text-xs font-semibold"
            >
              <option value="curative">Dépannage Curatif (Panne / Réparation)</option>
              <option value="preventive">Maintenance Préventive (Visite périodique)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Degré de priorité *</label>
            <select
              value={priorite}
              onChange={(e) => setPriorite(e.target.value as MaintenancePriorite)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden bg-white text-xs font-semibold"
            >
              <option value="urgente">🚨 URGENTE (Bloc / Soins Intensifs)</option>
              <option value="haute">Haute (Indisponibilité gênante)</option>
              <option value="moyenne">Moyenne (Normale)</option>
              <option value="basse">Basse (Contrôle secondaire)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Date d'intervention planifiée *</label>
          <input
            type="date"
            required
            value={datePlanifiee}
            onChange={(e) => setDatePlanifiee(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden text-xs"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Description des symptômes ou détails des opérations *
          </label>
          <textarea
            required
            rows={3}
            value={descriptionPanne}
            onChange={(e) => setDescriptionPanne(e.target.value)}
            placeholder="Détaillez le comportement anormal de l'appareil ou les pièces à vérifier..."
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
            {loading ? 'Création...' : 'Créer l\'intervention'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
