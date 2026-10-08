import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Produit, Service, Lot } from '../types';
import { AlertTriangle, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

interface StockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExit: (data: any) => Promise<void>;
  produits: Produit[];
  lots: Lot[];
  services: Service[];
  defaultProduitId?: number | null;
}

export const StockMovementModal: React.FC<StockMovementModalProps> = ({
  isOpen,
  onClose,
  onConfirmExit,
  produits,
  lots,
  services,
  defaultProduitId,
}) => {
  const [produitId, setProduitId] = useState<number>(defaultProduitId || produits[0]?.id || 1);
  const [quantite, setQuantite] = useState<number>(10);
  const [serviceDestId, setServiceDestId] = useState<number>(1);
  const [motif, setMotif] = useState('Dotation quotidienne pour soins');
  const [forcedLotId, setForcedLotId] = useState<string>('auto');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultProduitId) {
      setProduitId(defaultProduitId);
    } else if (produits.length > 0) {
      setProduitId(produits[0].id);
    }
    setError(null);
  }, [defaultProduitId, produits, isOpen]);

  const selectedProduit = produits.find((p) => p.id === Number(produitId));
  const productLots = lots.filter((l) => l.produit_id === Number(produitId));

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Trier par FEFO
  const sortedLots = [...productLots].sort(
    (a, b) => new Date(a.date_peremption).getTime() - new Date(b.date_peremption).getTime()
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduit) return;

    if (selectedProduit.est_controle) {
      setError(
        'BLOCAGE LÉGAL : Ce produit est classé sous contrôle strict (stupéfiant). Sa sortie ne peut être effectuée qu\'au travers du module spécialisé "Produits Contrôlés" avec double validation Pharmacien/Logistique.'
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onConfirmExit({
        produit_id: selectedProduit.id,
        quantite: Number(quantite),
        service_dest_id: Number(serviceDestId),
        motif,
        lot_id: forcedLotId === 'auto' ? null : Number(forcedLotId),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sortie de stock FEFO.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sortie de Stock — Règle FEFO"
      subtitle="First Expired, First Out : priorité absolue au lot le plus proche de la péremption"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg font-medium flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Sélection du produit */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Médicament ou Consommable médical *</label>
          <select
            value={produitId}
            onChange={(e) => {
              setProduitId(Number(e.target.value));
              setForcedLotId('auto');
            }}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden bg-white text-xs"
          >
            {produits.map((p) => (
              <option key={p.id} value={p.id}>
                {p.designation} {p.est_controle ? '⚠️ [STUPÉFIANT CONTRÔLÉ]' : ''} — Stock disponible: {p.stock_actif || 0} {p.unite_mesure}
              </option>
            ))}
          </select>
        </div>

        {/* Alerte si produit contrôlé */}
        {selectedProduit?.est_controle && (
          <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-lg flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <div className="font-bold text-xs">Attention : Produit Contrôlé (Stupéfiant)</div>
              <p className="text-[11px] mt-0.5 text-amber-800">
                Ce produit ne peut pas être sorti via ce formulaire standard. Utilisez le menu <b>Produits Contrôlés</b> pour soumettre une demande légale signée avec identification patient et prescripteur.
              </p>
            </div>
          </div>
        )}

        {/* Lots disponibles et ordre FEFO */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
          <div className="font-semibold text-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#2E74B5]" />
              <span>Lots référencés pour ce produit (Ordre FEFO)</span>
            </span>
            <span className="text-[11px] text-slate-500 font-normal">
              {sortedLots.length} lot(s)
            </span>
          </div>

          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {sortedLots.map((l, idx) => {
              const isExpired = l.date_peremption < todayStr || l.statut === 'perime';
              return (
                <div
                  key={l.id}
                  className={`p-2 rounded border flex items-center justify-between text-[11px] ${
                    isExpired
                      ? 'bg-rose-50/70 border-rose-200 text-rose-800 opacity-75'
                      : idx === 0
                      ? 'bg-blue-50/80 border-blue-200 text-blue-900 font-semibold'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {idx === 0 && !isExpired && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[9px] font-bold">
                        1er SORTANT FEFO
                      </span>
                    )}
                    <span className="font-mono">{l.numero_lot}</span>
                  </div>
                  <div>
                    Péremption : <b>{l.date_peremption}</b>
                  </div>
                  <div>
                    Reste : <b>{l.quantite_restante}</b> {selectedProduit?.unite_mesure}
                  </div>
                  <div>
                    {isExpired ? (
                      <span className="text-rose-600 font-bold">BLOQUÉ PÉRIMÉ</span>
                    ) : (
                      <span className="text-emerald-700">Conforme</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Quantité demandée */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Quantité à sortir ({selectedProduit?.unite_mesure || 'unités'}) *
            </label>
            <input
              type="number"
              min="1"
              required
              value={quantite}
              onChange={(e) => setQuantite(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden text-xs font-semibold"
            />
          </div>

          {/* Service destinataire */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Service destinataire *</label>
            <select
              value={serviceDestId}
              onChange={(e) => setServiceDestId(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden bg-white text-xs"
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nom} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Choix du lot ou allocation automatique FEFO */}
          <div className="md:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">
              Méthode d'attribution du lot *
            </label>
            <select
              value={forcedLotId}
              onChange={(e) => setForcedLotId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden bg-white text-xs font-medium"
            >
              <option value="auto">
                ⚡ FEFO Automatique Recommandé (Le système prélève automatiquement le lot le plus proche de la péremption)
              </option>
              {sortedLots.map((l) => (
                <option
                  key={l.id}
                  value={l.id}
                  disabled={l.date_peremption < todayStr || l.statut === 'perime'}
                >
                  Lot {l.numero_lot} (Expire le {l.date_peremption} - Reste : {l.quantite_restante}){' '}
                  {l.date_peremption < todayStr ? '[PÉRIMÉ - INTERDIT]' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Motif */}
          <div className="md:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">Motif de la sortie *</label>
            <input
              type="text"
              required
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="ex: Dotation hebdomadaire réanimation ou urgence vitale patient"
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
            disabled={loading || selectedProduit?.est_controle}
            className="px-5 py-2 bg-[#2E74B5] hover:bg-[#256199] text-white rounded-lg text-xs font-semibold shadow-md transition disabled:opacity-50"
          >
            {loading ? 'Traitement FEFO...' : 'Valider la sortie FEFO'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
