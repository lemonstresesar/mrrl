import React, { useState, useEffect } from 'react';
import {
  Pill,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Sparkles,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { Produit, Lot, MouvementStock, Service } from '../types';
import { StockMovementModal } from '../components/StockMovementModal';
import { Modal } from '../components/Modal';
import { exportStocksPDF, exportToExcel } from '../services/exportService';

export const StocksView: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'produits' | 'lots' | 'mouvements'>('produits');
  const [produits, setProduits] = useState<Produit[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [mouvements, setMouvements] = useState<MouvementStock[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Recherche & filtres
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [controlledOnly, setControlledOnly] = useState(false);

  // Modal Sortie FEFO
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [selectedProduitForExit, setSelectedProduitForExit] = useState<number | null>(null);

  // Modal Entrée / Nouveau Lot
  const [isNewLotModalOpen, setIsNewLotModalOpen] = useState(false);
  const [lotProduitId, setLotProduitId] = useState<number>(1);
  const [lotNumero, setLotNumero] = useState('');
  const [lotDatePeremption, setLotDatePeremption] = useState('');
  const [lotQuantite, setLotQuantite] = useState<number>(100);
  const [lotPrix, setLotPrix] = useState<number>(1000);
  const [lotMotif, setLotMotif] = useState('Réception commande centrale');
  const [newLotError, setNewLotError] = useState<string | null>(null);

  // Modal Nouveau Produit
  const [isNewProdModalOpen, setIsNewProdModalOpen] = useState(false);
  const [prodDesignation, setProdDesignation] = useState('');
  const [prodCategorie, setProdCategorie] = useState('Antalgiques & Antipyrétiques');
  const [prodForme, setProdForme] = useState('Flacon injectable');
  const [prodUnite, setProdUnite] = useState('flacons');
  const [prodSeuil, setProdSeuil] = useState<number>(50);
  const [prodIsControle, setProdIsControle] = useState(false);
  const [newProdError, setNewProdError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pRes, lRes, mRes, sRes] = await Promise.all([
        api.getProduits({ search, categorie: categoryFilter }),
        api.getLots(),
        api.getMouvements(),
        api.getServices(),
      ]);
      setProduits(pRes.produits);
      setLots(lRes.lots);
      setMouvements(mRes.mouvements);
      setServices(sRes.services);
    } catch (e) {
      console.error('Erreur chargement stocks', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, categoryFilter]);

  const handleConfirmExit = async (data: any) => {
    await api.executeFefoExit(data);
    await fetchData();
  };

  const handleCreateLot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lotNumero.trim() || !lotDatePeremption || lotQuantite <= 0) {
      setNewLotError('Numéro de lot, date de péremption et quantité positive obligatoires.');
      return;
    }
    try {
      setNewLotError(null);
      await api.createLot({
        produit_id: Number(lotProduitId),
        numero_lot: lotNumero,
        date_peremption: lotDatePeremption,
        quantite: Number(lotQuantite),
        prix_unitaire_cfa: Number(lotPrix),
        motif: lotMotif,
      });
      setIsNewLotModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setNewLotError(err.message || 'Erreur enregistrement du lot');
    }
  };

  const handleCreateProduit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodDesignation.trim()) {
      setNewProdError('La désignation est obligatoire.');
      return;
    }
    try {
      setNewProdError(null);
      await api.createProduit({
        designation: prodDesignation,
        categorie: prodCategorie,
        forme_dosage: prodForme,
        unite_mesure: prodUnite,
        seuil_alerte: Number(prodSeuil),
        est_controle: prodIsControle,
      });
      setIsNewProdModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setNewProdError(err.message || 'Erreur création produit');
    }
  };

  const canManage = user?.role === 'pharmacien' || user?.role === 'logistique' || user?.role === 'admin';

  return (
    <div className="space-y-5">
      {/* Entête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Pill className="w-6 h-6 text-[#2E74B5]" />
            <span>Pharmacie & Gestion des Stocks (Règle FEFO)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dépôt central de l'Hôpital Général de Douala — Algorithme First Expired, First Out certifié
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportStocksPDF(lots)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={() => exportToExcel(lots, 'HGD_Lots_FEFO')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          {canManage && (
            <button
              onClick={() => {
                setLotNumero(`LOT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
                setLotDatePeremption(new Date(Date.now() + 365 * 86400000 * 2).toISOString().split('T')[0]);
                setIsNewLotModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition shadow-xs"
            >
              <ArrowDownRight className="w-4 h-4 text-emerald-400" />
              <span>Entrée / Réception Lot</span>
            </button>
          )}

          <button
            onClick={() => {
              setSelectedProduitForExit(produits[0]?.id || null);
              setIsExitModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#2E74B5] hover:bg-[#256199] text-white rounded-lg text-xs font-semibold shadow-md transition"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Sortie FEFO</span>
          </button>
        </div>
      </div>

      {/* Bannière d'explication FEFO */}
      <div className="p-3 bg-linear-to-r from-blue-900 to-[#1F3864] text-white rounded-xl shadow-xs text-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-200">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold tracking-wide">
              Moteur FEFO Actif : Prélèvement automatique par date d'expiration
            </div>
            <p className="text-[11px] text-blue-200/90">
              Chaque sortie décrémente en priorité absolue le lot le plus proche de sa date de péremption. Tout lot périmé est automatiquement bloqué.
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1 text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Conforme
          </span>
          <span className="flex items-center gap-1 text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span> Expiration &lt;90j
          </span>
          <span className="flex items-center gap-1 text-rose-300">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span> Expiration &lt;30j
          </span>
          <span className="flex items-center gap-1 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-slate-500"></span> Périmé (Bloqué)
          </span>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('produits')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'produits'
              ? 'border-[#2E74B5] text-[#1F3864]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Pill className="w-3.5 h-3.5" />
          <span>Produits & Disponibilités ({produits.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('lots')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'lots'
              ? 'border-[#2E74B5] text-[#1F3864]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Lots & Péremptions FEFO ({lots.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('mouvements')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'mouvements'
              ? 'border-[#2E74B5] text-[#1F3864]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Historique des Mouvements ({mouvements.length})</span>
        </button>
      </div>

      {/* TAB 1 : PRODUITS */}
      {activeTab === 'produits' && (
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap gap-3 items-center justify-between text-xs">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher désignation, code CIS, classe..."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              {canManage && (
                <button
                  onClick={() => setIsNewProdModalOpen(true)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition"
                >
                  + Nouveau Produit
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-[#1F3864] text-white font-semibold">
                <tr>
                  <th className="py-3 px-4">Code CIS</th>
                  <th className="py-3 px-4">Désignation du Médicament / Article</th>
                  <th className="py-3 px-4">Catégorie Thérapeutique</th>
                  <th className="py-3 px-4">Stock Conforme</th>
                  <th className="py-3 px-4">Prochain Lot FEFO</th>
                  <th className="py-3 px-4">Statut / Type</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {produits.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-[#1F3864]">{p.code_cis}</td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-bold text-slate-900">{p.designation}</div>
                      <div className="text-[11px] text-slate-500">
                        {p.forme_dosage} • Seuil alerte : {p.seuil_alerte} {p.unite_mesure}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {p.categorie}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {p.stock_actif ?? 0}
                        </span>
                        <span className="text-[11px] text-slate-500">{p.unite_mesure}</span>
                        {p.est_en_alerte && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">
                            SOUS SEUIL
                          </span>
                        )}
                      </div>
                      {p.stock_perime && p.stock_perime > 0 ? (
                        <div className="text-[10px] text-rose-600 font-semibold">
                          ({p.stock_perime} {p.unite_mesure} périmé/bloqué)
                        </div>
                      ) : null}
                    </td>
                    <td className="py-3 px-4">
                      {p.prochain_lot_fefo ? (
                        <div className="p-1 rounded bg-blue-50/80 border border-blue-200 text-[11px]">
                          <div className="font-mono font-bold text-[#1F3864]">
                            {p.prochain_lot_fefo.numero_lot}
                          </div>
                          <div className="text-[10px] text-slate-600">
                            Expire le {p.prochain_lot_fefo.date_peremption}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Aucun lot actif</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {p.est_controle ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-300 flex items-center gap-1 w-fit">
                          <ShieldAlert className="w-3 h-3 text-amber-600" />
                          <span>STUPÉFIANT CONTRÔLÉ</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                          Standard
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {!p.est_controle ? (
                        <button
                          onClick={() => {
                            setSelectedProduitForExit(p.id);
                            setIsExitModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-[#2E74B5] font-bold text-xs transition"
                        >
                          Sortie FEFO
                        </button>
                      ) : (
                        <span className="text-[11px] text-amber-700 italic font-medium">
                          Voir Stupéfiants
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2 : LOTS AVEC RÈGLE FEFO */}
      {activeTab === 'lots' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-[#1F3864] text-white font-semibold">
              <tr>
                <th className="py-3 px-4">N° de Lot</th>
                <th className="py-3 px-4">Produit Médical</th>
                <th className="py-3 px-4">Date de Péremption</th>
                <th className="py-3 px-4">Quantité Restante</th>
                <th className="py-3 px-4">Prix Unitaire</th>
                <th className="py-3 px-4">Statut FEFO / Péremption</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {lots.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono font-bold text-[#1F3864]">{l.numero_lot}</td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{l.produit_designation}</div>
                    {l.produit_est_controle && (
                      <span className="text-[10px] text-amber-700 font-semibold">
                        [Produit Contrôlé]
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{l.date_peremption}</td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900">{l.quantite_restante}</span>{' '}
                    <span className="text-[11px] text-slate-500">{l.unite_mesure}</span>
                  </td>
                  <td className="py-3 px-4">
                    {l.prix_unitaire_cfa ? `${l.prix_unitaire_cfa.toLocaleString('fr-FR')} CFA` : '-'}
                  </td>
                  <td className="py-3 px-4">
                    {l.alerte_peremption === 'perime' ? (
                      <span className="px-2.5 py-1 rounded-full bg-slate-900 text-white text-[10px] font-bold border border-rose-500">
                        PÉRIMÉ (SORTIE BLOQUÉE)
                      </span>
                    ) : l.alerte_peremption === 'critique' ? (
                      <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-300">
                        EXPIRATION IMMINENTE (&lt;30j)
                      </span>
                    ) : l.alerte_peremption === 'avertissement' ? (
                      <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300">
                        EXPIRATION PROCHE (&lt;90j)
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                        Conforme FEFO
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* TAB 3 : MOUVEMENTS */}
      {activeTab === 'mouvements' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-[#1F3864] text-white font-semibold">
              <tr>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Produit & Lot</th>
                <th className="py-3 px-4">Quantité</th>
                <th className="py-3 px-4">Service Source &gt; Dest.</th>
                <th className="py-3 px-4">Motif & Traçabilité</th>
                <th className="py-3 px-4">Opérateur & Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {mouvements.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4">
                    {m.type === 'entree' ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1 w-fit">
                        <ArrowDownRight className="w-3 h-3" /> Entrée
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px] flex items-center gap-1 w-fit">
                        <ArrowUpRight className="w-3 h-3" /> Sortie
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{m.produit_designation}</div>
                    <div className="text-[10px] font-mono text-slate-500">Lot : {m.numero_lot}</div>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {m.type === 'entree' ? `+${m.quantite}` : `-${m.quantite}`} {m.unite_mesure}
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-slate-700 font-medium">{m.service_source_nom}</div>
                    <div className="text-[10px] text-slate-400">vers {m.service_dest_nom}</div>
                  </td>
                  <td className="py-3 px-4 max-w-xs text-slate-600 text-[11px]">{m.motif}</td>
                  <td className="py-3 px-4 text-[11px]">
                    <div className="font-semibold text-slate-800">{m.utilisateur_nom}</div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(m.date_mouvement).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Modal Sortie Stock FEFO */}
      <StockMovementModal
        isOpen={isExitModalOpen}
        onClose={() => setIsExitModalOpen(false)}
        onConfirmExit={handleConfirmExit}
        produits={produits}
        lots={lots}
        services={services}
        defaultProduitId={selectedProduitForExit}
      />

      {/* Modal Entrée de nouveau lot */}
      <Modal
        isOpen={isNewLotModalOpen}
        onClose={() => setIsNewLotModalOpen(false)}
        title="Réception de Stock — Nouveau Lot"
        subtitle="Enregistrement d'un lot et intégration dans la file FEFO"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateLot} className="space-y-4 text-xs">
          {newLotError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg font-medium">
              {newLotError}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Produit de santé *</label>
            <select
              value={lotProduitId}
              onChange={(e) => setLotProduitId(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden bg-white text-xs"
            >
              {produits.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.designation} ({p.forme_dosage}) [{p.unite_mesure}]
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Numéro de lot fabricant *</label>
              <input
                type="text"
                required
                value={lotNumero}
                onChange={(e) => setLotNumero(e.target.value)}
                placeholder="ex: LOT-2026-X88"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden font-mono text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date de péremption *</label>
              <input
                type="date"
                required
                value={lotDatePeremption}
                onChange={(e) => setLotDatePeremption(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Quantité reçue *</label>
              <input
                type="number"
                min="1"
                required
                value={lotQuantite}
                onChange={(e) => setLotQuantite(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden text-xs font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Prix unitaire (FCFA)</label>
              <input
                type="number"
                min="0"
                value={lotPrix}
                onChange={(e) => setLotPrix(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Motif / Réf. Bon de livraison</label>
            <input
              type="text"
              value={lotMotif}
              onChange={(e) => setLotMotif(e.target.value)}
              placeholder="ex: Réception BL Laborex BL-99201"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden text-xs"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsNewLotModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#2E74B5] hover:bg-[#256199] text-white rounded-lg text-xs font-semibold shadow-md transition"
            >
              Enregistrer l'entrée
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Nouveau Produit */}
      <Modal
        isOpen={isNewProdModalOpen}
        onClose={() => setIsNewProdModalOpen(false)}
        title="Créer un nouveau produit de santé"
        subtitle="Référentiel pharmaceutique de l'Hôpital Général de Douala"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateProduit} className="space-y-4 text-xs">
          {newProdError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg font-medium">
              {newProdError}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Désignation complète *</label>
            <input
              type="text"
              required
              value={prodDesignation}
              onChange={(e) => setProdDesignation(e.target.value)}
              placeholder="ex: Ceftriaxone 1g Poudre Injectable"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Catégorie *</label>
              <input
                type="text"
                required
                value={prodCategorie}
                onChange={(e) => setProdCategorie(e.target.value)}
                placeholder="ex: Antibiotiques"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Forme et Dosage</label>
              <input
                type="text"
                value={prodForme}
                onChange={(e) => setProdForme(e.target.value)}
                placeholder="ex: Flacon 1g avec solvant"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Unité de mesure *</label>
              <input
                type="text"
                required
                value={prodUnite}
                onChange={(e) => setProdUnite(e.target.value)}
                placeholder="ex: flacons, boîtes, poches"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Seuil d'alerte critique *</label>
              <input
                type="number"
                min="1"
                required
                value={prodSeuil}
                onChange={(e) => setProdSeuil(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden text-xs font-bold"
              />
            </div>
          </div>

          <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/70 flex items-center gap-3">
            <input
              type="checkbox"
              id="is_ctrl"
              checked={prodIsControle}
              onChange={(e) => setProdIsControle(e.target.checked)}
              className="w-4 h-4 text-amber-600 rounded"
            />
            <label htmlFor="is_ctrl" className="text-xs font-semibold text-amber-900 cursor-pointer">
              Ce produit est un stupéfiant / produit sous contrôle réglementaire strict (Tableau A)
            </label>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsNewProdModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#2E74B5] hover:bg-[#256199] text-white rounded-lg text-xs font-semibold shadow-md transition"
            >
              Créer le produit
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
