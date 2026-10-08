import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Plus,
  Search,
  Filter,
  QrCode,
  Edit2,
  Archive,
  Bed,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Download,
  Eye,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { Equipement, Service, EquipementStatut } from '../types';
import { EquipmentModal } from '../components/EquipmentModal';
import { QRCodeModal } from '../components/QRCodeModal';
import { exportEquipementsPDF, exportToExcel } from '../services/exportService';

export const EquipementsView: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [equipements, setEquipements] = useState<Equipement[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtres
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEquipement, setEditingEquipement] = useState<Equipement | null>(null);

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrData, setQrData] = useState<any>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eqRes, sRes] = await Promise.all([
        api.getEquipements({
          search,
          statut: statutFilter,
          service_id: serviceFilter,
          categorie: categoryFilter,
        }),
        api.getServices(),
      ]);
      setEquipements(eqRes.equipements);
      setServices(sRes.services);
    } catch (e) {
      console.error('Erreur chargement équipements', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, statutFilter, serviceFilter, categoryFilter]);

  const handleSaveEquipment = async (data: Partial<Equipement>) => {
    if (editingEquipement) {
      await api.updateEquipement(editingEquipement.id, data);
    } else {
      await api.createEquipement(data);
    }
    await fetchData();
  };

  const handleToggleBedStatus = async (eq: Equipement) => {
    const newStatus = eq.etat_lit === 'libre' ? 'occupe' : 'libre';
    try {
      await api.updateLitStatus(eq.id, newStatus);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Erreur mise à jour lit');
    }
  };

  const handleShowQR = async (eq: Equipement) => {
    try {
      const res = await api.getQRCode(eq.id);
      setQrData({
        ...res,
        numero_serie: eq.numero_serie,
      });
      setQrModalOpen(true);
    } catch (err: any) {
      alert('Erreur chargement QR Code');
    }
  };

  const handleArchive = async (eq: Equipement) => {
    if (confirm(`Confirmez-vous l'archivage et la mise au rebut de l'équipement ${eq.nom} (${eq.code_inventaire}) ?`)) {
      try {
        await api.archiveEquipement(eq.id);
        await fetchData();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const canEdit = user?.role === 'admin' || user?.role === 'logistique' || user?.role === 'maintenance';
  const canCreate = user?.role === 'admin' || user?.role === 'logistique';

  const getStatusBadge = (statut: EquipementStatut) => {
    switch (statut) {
      case 'en_service':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3 h-3 text-emerald-600" />En service</span>;
      case 'en_maintenance':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200"><Wrench className="w-3 h-3 text-amber-600" />En maintenance</span>;
      case 'hors_service':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200"><AlertCircle className="w-3 h-3 text-rose-600" />Hors service</span>;
      case 'reforme':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">Réformé</span>;
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-[#2E74B5]" />
            <span>Gestion des Équipements & Lits d'Hospitalisation</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Inventaire biomédical complet de l'Hôpital Général de Douala ({equipements.length} ressources actives)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportEquipementsPDF(equipements)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={() => exportToExcel(equipements, 'HGD_Inventaire_Equipements')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          {canCreate && (
            <button
              onClick={() => {
                setEditingEquipement(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#2E74B5] hover:bg-[#256199] text-white rounded-lg text-xs font-semibold shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvel Équipement</span>
            </button>
          )}
        </div>
      </div>

      {/* Barre de filtres et recherche */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center justify-between text-xs">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher équipement, code inventaire, série, salle..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statutFilter}
            onChange={(e) => setStatutFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden text-xs"
          >
            <option value="">Tous les statuts</option>
            <option value="en_service">En service</option>
            <option value="en_maintenance">En maintenance</option>
            <option value="hors_service">Hors service (Panne)</option>
          </select>

          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden text-xs"
          >
            <option value="">Tous les services</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nom} ({s.code})
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden text-xs"
          >
            <option value="">Toutes les catégories</option>
            <option value="lit">Lits uniquement</option>
            <option value="Réanimation">Réanimation & Ventilation</option>
            <option value="Monitoring">Monitoring Cardiaque</option>
            <option value="Chirurgie">Chirurgie & Bloc</option>
            <option value="Imagerie">Imagerie Lourde</option>
          </select>
        </div>
      </div>

      {/* Tableau des équipements */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1F3864] text-white font-semibold">
              <tr>
                <th className="py-3 px-4">Code Inv.</th>
                <th className="py-3 px-4">Équipement & Spécifications</th>
                <th className="py-3 px-4">Catégorie</th>
                <th className="py-3 px-4">Localisation (HGD)</th>
                <th className="py-3 px-4">Statut / État Lit</th>
                <th className="py-3 px-4 text-center">QR Code</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Chargement des équipements hospitaliers...
                  </td>
                </tr>
              ) : equipements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Aucun équipement ne correspond à vos filtres.
                  </td>
                </tr>
              ) : (
                equipements.map((eq) => {
                  const isBed = eq.etat_lit !== 'non_applicable';
                  return (
                    <tr key={eq.id} className="hover:bg-slate-50/80 transition">
                      {/* Code inventaire */}
                      <td className="py-3 px-4 font-mono font-bold text-[#1F3864]">
                        {eq.code_inventaire}
                      </td>

                      {/* Nom & N° Série */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-bold text-slate-900">{eq.nom}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          S/N : {eq.numero_serie} • Acquis le : {eq.date_acquisition}
                        </div>
                      </td>

                      {/* Catégorie */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {eq.categorie}
                        </span>
                      </td>

                      {/* Service & Salle */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{eq.service_nom}</div>
                        <div className="text-[11px] text-slate-500">{eq.salle}</div>
                      </td>

                      {/* Statut & Lit */}
                      <td className="py-3 px-4">
                        {isBed ? (
                          <div className="space-y-1">
                            {getStatusBadge(eq.statut)}
                            <div>
                              <button
                                onClick={() => handleToggleBedStatus(eq)}
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-full transition flex items-center gap-1 ${
                                  eq.etat_lit === 'libre'
                                    ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                    : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                }`}
                                title="Cliquer pour basculer l'état du lit (Libre / Occupé)"
                              >
                                <Bed className="w-3 h-3" />
                                <span>{eq.etat_lit === 'libre' ? 'Lit Libre (Cliquer)' : 'Lit Occupé (Cliquer)'}</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          getStatusBadge(eq.statut)
                        )}
                      </td>

                      {/* QR Code Action */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleShowQR(eq)}
                          className="p-1.5 rounded-lg bg-blue-50 text-[#2E74B5] hover:bg-blue-100 transition shadow-2xs"
                          title="Afficher et imprimer l'étiquette QR"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canEdit && (
                            <button
                              onClick={() => {
                                setEditingEquipement(eq);
                                setIsModalOpen(true);
                              }}
                              className="p-1.5 rounded text-slate-500 hover:text-[#2E74B5] hover:bg-slate-100 transition"
                              title="Modifier la fiche"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {user?.role === 'admin' && (
                            <button
                              onClick={() => handleArchive(eq)}
                              className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Archiver / Réformer"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Création / Modification */}
      <EquipmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEquipment}
        services={services}
        initialData={editingEquipement}
      />

      {/* Modal QR Code */}
      <QRCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        qrData={qrData}
      />
    </div>
  );
};
