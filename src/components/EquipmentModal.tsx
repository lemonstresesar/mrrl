import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Equipement, Service, EquipementStatut, LitEtat } from '../types';

interface EquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Equipement>) => Promise<void>;
  services: Service[];
  initialData?: Equipement | null;
}

export const EquipmentModal: React.FC<EquipmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  services,
  initialData,
}) => {
  const [nom, setNom] = useState('');
  const [categorie, setCategorie] = useState('Réanimation & Ventilation');
  const [numeroSerie, setNumeroSerie] = useState('');
  const [serviceId, setServiceId] = useState<number>(1);
  const [salle, setSalle] = useState('');
  const [dateAcquisition, setDateAcquisition] = useState('');
  const [garantieExpiration, setGarantieExpiration] = useState('');
  const [statut, setStatut] = useState<EquipementStatut>('en_service');
  const [etatLit, setEtatLit] = useState<LitEtat>('non_applicable');
  const [documents, setDocuments] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    'Réanimation & Ventilation',
    'Monitoring Cardiaque',
    'Lits d\'hospitalisation',
    'Chirurgie & Bloc',
    'Imagerie Lourde',
    'Gynéco-Obstétrique & Échographie',
    'Néonatalogie',
    'Biologie Médicale',
    'Stérilisation',
    'Autre matériel biomédical',
  ];

  useEffect(() => {
    if (initialData) {
      setNom(initialData.nom);
      setCategorie(initialData.categorie);
      setNumeroSerie(initialData.numero_serie);
      setServiceId(initialData.service_id);
      setSalle(initialData.salle);
      setDateAcquisition(initialData.date_acquisition);
      setGarantieExpiration(initialData.garantie_expiration || '');
      setStatut(initialData.statut);
      setEtatLit(initialData.etat_lit);
      setDocuments(initialData.documents || '');
    } else {
      setNom('');
      setCategorie('Réanimation & Ventilation');
      setNumeroSerie(`SN-${Math.floor(10000 + Math.random() * 90000)}`);
      setServiceId(services[0]?.id || 1);
      setSalle('Salle de soins');
      setDateAcquisition(new Date().toISOString().split('T')[0]);
      setGarantieExpiration(new Date(Date.now() + 365 * 86400000 * 2).toISOString().split('T')[0]);
      setStatut('en_service');
      setEtatLit('non_applicable');
      setDocuments('Manuel technique, certificat conformité CE');
    }
    setError(null);
  }, [initialData, isOpen, services]);

  const isBedCategory = categorie.toLowerCase().includes('lit');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim() || !numeroSerie.trim() || !salle.trim()) {
      setError('Veuillez renseigner tous les champs obligatoires.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSave({
        nom,
        categorie,
        numero_serie: numeroSerie,
        service_id: Number(serviceId),
        salle,
        date_acquisition: dateAcquisition,
        garantie_expiration: garantieExpiration,
        statut,
        etat_lit: isBedCategory ? (etatLit === 'occupe' ? 'occupe' : 'libre') : 'non_applicable',
        documents,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de l\'enregistrement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? `Modifier l'équipement (${initialData.code_inventaire})` : 'Ajouter un équipement médical'}
      subtitle="Fiche biomédicale de traçabilité Hôpital Général de Douala"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Nom de l'équipement */}
          <div className="md:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">
              Nom / Désignation du matériel *
            </label>
            <input
              type="text"
              required
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="ex: Respirateur de Réanimation Dräger Evita V300"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden"
            />
          </div>

          {/* Catégorie */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Catégorie biomédicale *</label>
            <select
              value={categorie}
              onChange={(e) => {
                const newCat = e.target.value;
                setCategorie(newCat);
                if (newCat.toLowerCase().includes('lit')) {
                  setEtatLit('libre');
                } else {
                  setEtatLit('non_applicable');
                }
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden bg-white"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Numéro de série fabricant */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Numéro de série fabricant *</label>
            <input
              type="text"
              required
              value={numeroSerie}
              onChange={(e) => setNumeroSerie(e.target.value)}
              placeholder="ex: DRA-EV3-99482"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden font-mono"
            />
          </div>

          {/* Service d'affectation */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Service hospitalier d'affectation *</label>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden bg-white"
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nom} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Salle / Emplacement précis */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Salle / Emplacement précis *</label>
            <input
              type="text"
              required
              value={salle}
              onChange={(e) => setSalle(e.target.value)}
              placeholder="ex: Salle Déchoquage 1 ou Box 3"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden"
            />
          </div>

          {/* Date d'acquisition */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Date d'acquisition</label>
            <input
              type="date"
              value={dateAcquisition}
              onChange={(e) => setDateAcquisition(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden"
            />
          </div>

          {/* Expiration de garantie */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Fin de garantie fabricant</label>
            <input
              type="date"
              value={garantieExpiration}
              onChange={(e) => setGarantieExpiration(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden"
            />
          </div>

          {/* Statut opérationnel */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Statut opérationnel</label>
            <select
              value={statut}
              onChange={(e) => setStatut(e.target.value as EquipementStatut)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden bg-white"
            >
              <option value="en_service">En service (Opérationnel)</option>
              <option value="en_maintenance">En maintenance</option>
              <option value="hors_service">Hors service (En panne)</option>
              <option value="reforme">Réformé (Mis au rebut)</option>
            </select>
          </div>

          {/* Spécifique aux lits d'hospitalisation */}
          {isBedCategory ? (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">État du lit</label>
              <select
                value={etatLit}
                onChange={(e) => setEtatLit(e.target.value as LitEtat)}
                className="w-full px-3 py-2 border border-amber-300 bg-amber-50/50 text-amber-900 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-semibold"
              >
                <option value="libre">Libre (Disponible pour admission)</option>
                <option value="occupe">Occupé (Patient hospitalisé)</option>
              </select>
            </div>
          ) : (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Documents techniques / Manuels</label>
              <input
                type="text"
                value={documents}
                onChange={(e) => setDocuments(e.target.value)}
                placeholder="ex: Notice d'utilisation Dräger v2.1"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden"
              />
            </div>
          )}
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
            {loading ? 'Enregistrement...' : initialData ? 'Mettre à jour' : 'Créer l\'équipement'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
