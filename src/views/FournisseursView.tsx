import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  ShoppingBag,
  Clock,
  Star,
  CheckCircle2,
  Calendar,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { Fournisseur, Commande } from '../types';
import { Modal } from '../components/Modal';

export const FournisseursView: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'commandes' | 'fournisseurs' | 'comparateur'>('commandes');
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [comparateur, setComparateur] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Nouvelle Commande
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [cmdFournisseurId, setCmdFournisseurId] = useState<number>(1);
  const [cmdDateLivraison, setCmdDateLivraison] = useState('');
  const [cmdCommentaire, setCmdCommentaire] = useState('');
  const [lignes, setLignes] = useState([
    { designation: 'Ringer Lactate Poche 500ml', quantite: 200, prix_unitaire_cfa: 450 },
    { designation: 'Seringues 10ml stériles', quantite: 500, prix_unitaire_cfa: 150 },
  ]);

  // Modal Nouveau Fournisseur
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [suppNom, setSuppNom] = useState('');
  const [suppContact, setSuppContact] = useState('');
  const [suppTel, setSuppTel] = useState('');
  const [suppEmail, setSuppEmail] = useState('');
  const [suppAdresse, setSuppAdresse] = useState('');
  const [suppDelai, setSuppDelai] = useState<number>(7);
  const [suppNote, setSuppNote] = useState<number>(4.5);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cRes, fRes, compRes] = await Promise.all([
        api.getCommandes(),
        api.getFournisseurs(),
        api.getComparateurFournisseurs(),
      ]);
      setCommandes(cRes.commandes);
      setFournisseurs(fRes.fournisseurs);
      setComparateur(compRes.comparateur);
    } catch (e) {
      console.error('Erreur chargement fournisseurs', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCommande({
        fournisseur_id: Number(cmdFournisseurId),
        date_livraison_estimee: cmdDateLivraison,
        commentaires: cmdCommentaire,
        lignes,
      });
      setIsOrderModalOpen(false);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Erreur création bon de commande');
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createFournisseur({
        nom: suppNom,
        contact_nom: suppContact,
        telephone: suppTel,
        email: suppEmail,
        adresse: suppAdresse,
        ville: 'Douala',
        delai_moyen_jours: Number(suppDelai),
        note_fiabilite: Number(suppNote),
      });
      setIsSupplierModalOpen(false);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Erreur création fournisseur');
    }
  };

  const handleUpdateOrderStatus = async (id: number, statut: string) => {
    try {
      await api.updateCommandeStatut(id, statut);
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const canManage = user?.role === 'logistique' || user?.role === 'pharmacien' || user?.role === 'admin';

  return (
    <div className="space-y-5">
      {/* Entête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-[#2E74B5]" />
            <span>Fournisseurs & Commandes Hospitalières</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Approvisionnements de l'Hôpital Général de Douala — Bons de commande, catalogue et comparaison des délais
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSuppNom('');
                setSuppContact('');
                setSuppTel('+237 233 ');
                setSuppEmail('');
                setSuppAdresse('Douala, Cameroun');
                setIsSupplierModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Fournisseur</span>
            </button>

            <button
              onClick={() => {
                setCmdDateLivraison(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
                setIsOrderModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#2E74B5] hover:bg-[#256199] text-white rounded-lg text-xs font-semibold shadow-md transition"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Nouveau Bon de Commande</span>
            </button>
          </div>
        )}
      </div>

      {/* Onglets */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('commandes')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'commandes'
              ? 'border-[#2E74B5] text-[#1F3864]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Bons de Commande ({commandes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('fournisseurs')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'fournisseurs'
              ? 'border-[#2E74B5] text-[#1F3864]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Fiches Fournisseurs ({fournisseurs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('comparateur')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'comparateur'
              ? 'border-[#2E74B5] text-[#1F3864]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Comparateur Délais & Notations</span>
        </button>
      </div>

      {/* TAB 1 : COMMANDES */}
      {activeTab === 'commandes' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1F3864] text-white font-semibold">
              <tr>
                <th className="py-3 px-4">Référence</th>
                <th className="py-3 px-4">Fournisseur Partenaire</th>
                <th className="py-3 px-4">Date Commande</th>
                <th className="py-3 px-4">Livraison Estimée</th>
                <th className="py-3 px-4">Montant Total</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {commandes.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono font-bold text-[#1F3864]">{c.reference}</td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{c.fournisseur_nom}</div>
                    <div className="text-[10px] text-slate-400">{c.fournisseur_telephone}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{c.date_commande}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {c.date_livraison_estimee}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 text-xs">
                    {c.montant_total_cfa.toLocaleString('fr-FR')} FCFA
                  </td>
                  <td className="py-3 px-4">
                    {c.statut === 'livree' ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        LIVRÉE CONFORME
                      </span>
                    ) : c.statut === 'expediee' ? (
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                        EXPÉDIÉE EN ROUTE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                        EN ATTENTE FOURNISSEUR
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {canManage && c.statut !== 'livree' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(c.id, 'livree')}
                        className="px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs transition"
                      >
                        Marquer Livrée
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2 : FOURNISSEURS */}
      {activeTab === 'fournisseurs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fournisseurs.map((f) => (
            <div key={f.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{f.nom}</h4>
                  <div className="text-[11px] text-slate-500 font-medium">{f.contact_nom}</div>
                </div>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold text-xs border border-amber-200">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{f.note_fiabilite} / 5</span>
                </div>
              </div>

              <div className="space-y-1 text-slate-600 text-[11px]">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{f.telephone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{f.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{f.adresse}, {f.ville}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Délai moyen de livraison :</span>
                <span className="font-bold text-slate-900">{f.delai_moyen_jours} jours ouvrés</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3 : COMPARATEUR */}
      {activeTab === 'comparateur' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs text-slate-600">
            Évaluation continue des grossistes et distributeurs médicaux sur la région de Douala.
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1F3864] text-white font-semibold">
              <tr>
                <th className="py-3 px-4">Fournisseur</th>
                <th className="py-3 px-4">Délai Moyen (Jours)</th>
                <th className="py-3 px-4">Note Qualité / Fiabilité</th>
                <th className="py-3 px-4">Commandes Passées</th>
                <th className="py-3 px-4">Taux de Respect Délais</th>
                <th className="py-3 px-4">Volume d'Achat Réalisé</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {comparateur.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">{c.nom}</td>
                  <td className="py-3 px-4 font-semibold">{c.delai_moyen_jours} jours</td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-amber-600">{c.note_fiabilite} ★</span>
                  </td>
                  <td className="py-3 px-4">{c.total_commandes} commande(s)</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      {c.taux_succes_pct}%
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-[#1F3864]">
                    {c.volume_total_cfa?.toLocaleString('fr-FR')} CFA
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Commande */}
      <Modal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        title="Créer un Bon de Commande d'Approvisionnement"
        subtitle="Hôpital Général de Douala — Service Achats & Logistique"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Fournisseur sélectionné *</label>
            <select
              value={cmdFournisseurId}
              onChange={(e) => setCmdFournisseurId(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden bg-white text-xs font-semibold"
            >
              {fournisseurs.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nom} (Délai moyen: {f.delai_moyen_jours}j — Note: {f.note_fiabilite}★)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Date estimée de réception</label>
            <input
              type="date"
              value={cmdDateLivraison}
              onChange={(e) => setCmdDateLivraison(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden text-xs"
            />
          </div>

          <div className="space-y-2">
            <label className="block font-semibold text-slate-700">Articles commandés</label>
            {lignes.map((l, idx) => (
              <div key={idx} className="p-2 border border-slate-200 rounded-lg grid grid-cols-12 gap-2 items-center bg-slate-50 text-[11px]">
                <div className="col-span-6 font-semibold text-slate-800">{l.designation}</div>
                <div className="col-span-3 text-slate-600">Qte: {l.quantite}</div>
                <div className="col-span-3 font-mono font-bold text-right text-slate-900">
                  {(l.quantite * l.prix_unitaire_cfa).toLocaleString('fr-FR')} CFA
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Commentaires / Instructions spéciales</label>
            <textarea
              rows={2}
              value={cmdCommentaire}
              onChange={(e) => setCmdCommentaire(e.target.value)}
              placeholder="ex: Livraison prioritaire au quai de déchargement Pharmacie Bâtiment D"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden text-xs"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsOrderModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#2E74B5] hover:bg-[#256199] text-white rounded-lg text-xs font-semibold shadow-md transition"
            >
              Émettre le bon de commande
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Fournisseur */}
      <Modal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        title="Ajouter une Fiche Fournisseur"
        subtitle="Partenaire distributeur agréé HGD"
        maxWidth="md"
      >
        <form onSubmit={handleCreateSupplier} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Raison sociale / Nom entreprise *</label>
            <input
              type="text"
              required
              value={suppNom}
              onChange={(e) => setSuppNom(e.target.value)}
              placeholder="ex: Laborex Cameroun S.A."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Interlocuteur commercial</label>
              <input
                type="text"
                value={suppContact}
                onChange={(e) => setSuppContact(e.target.value)}
                placeholder="M. Henri Manga"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Téléphone *</label>
              <input
                type="text"
                required
                value={suppTel}
                onChange={(e) => setSuppTel(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email de commande *</label>
            <input
              type="email"
              required
              value={suppEmail}
              onChange={(e) => setSuppEmail(e.target.value)}
              placeholder="commandes@fournisseur.cm"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Délai moyen (Jours)</label>
              <input
                type="number"
                min="1"
                value={suppDelai}
                onChange={(e) => setSuppDelai(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Note initiale (sur 5)</label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                value={suppNote}
                onChange={(e) => setSuppNote(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden text-xs"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsSupplierModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#2E74B5] hover:bg-[#256199] text-white rounded-lg text-xs font-semibold shadow-md transition"
            >
              Enregistrer le fournisseur
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
