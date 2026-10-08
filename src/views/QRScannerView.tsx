import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  QrCode,
  Camera,
  Search,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Stethoscope,
  Building2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { Equipement, Maintenance } from '../types';

export const QRScannerView: React.FC = () => {
  const [scannedCode, setScannedCode] = useState<string>('');
  const [manualCode, setManualCode] = useState<string>('');
  const [foundEquipement, setFoundEquipement] = useState<Equipement | null>(null);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [scannerActive, setScannerActive] = useState<boolean>(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // Équipements de démonstration rapides pour tester sans caméra
  const demoCodes = [
    { code: 'EQ-HGD-URG-001', label: 'Respirateur Réanimation Dräger (Urgences)' },
    { code: 'EQ-HGD-URG-002', label: 'Moniteur Multiparamétrique Philips (Urgences)' },
    { code: 'EQ-HGD-BLOC-003', label: 'Bistouri Valleylab Covidien (Bloc 2 - En révision)' },
    { code: 'EQ-HGD-RAD-004', label: 'Scanner Siemens SOMATOM (Radiologie)' },
    { code: 'EQ-HGD-PED-006', label: 'Incubateur Néonatal Giraffe (Pédiatrie - Hors service)' },
    { code: 'LIT-HGD-URG-101', label: 'Lit de Réanimation Motorisé (Déchoquage 1)' },
  ];

  const handleLookup = async (code: string) => {
    if (!code.trim()) return;
    try {
      setLoading(true);
      setScannerError(null);
      const res = await api.lookupEquipement(code.trim());
      setFoundEquipement(res.equipement);
      setMaintenances(res.maintenances || []);
      setScannedCode(code.trim());
    } catch (err: any) {
      setScannerError(err.message || 'Équipement introuvable pour ce QR Code.');
      setFoundEquipement(null);
      setMaintenances([]);
    } finally {
      setLoading(false);
    }
  };

  const startScanner = async () => {
    try {
      setScannerError(null);
      const qrReaderElement = document.getElementById('qr-reader');
      if (!qrReaderElement) return;

      const html5QrCode = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          stopScanner();
          handleLookup(decodedText);
        },
        () => {
          // Frame scanner silencieux
        }
      );
      setScannerActive(true);
    } catch (err: any) {
      setScannerError(
        'Accès caméra non autorisé ou caméra non détectée dans cet environnement. Utilisez le sélecteur rapide de test ci-dessous ou la saisie manuelle.'
      );
      setScannerActive(false);
    }
  };

  const stopScanner = () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      html5QrCodeRef.current
        .stop()
        .then(() => {
          html5QrCodeRef.current?.clear();
          setScannerActive(false);
        })
        .catch((e) => console.warn('Erreur arrêt scanner', e));
    } else {
      setScannerActive(false);
    }
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <QrCode className="w-6 h-6 text-[#2E74B5]" />
          <span>Scanner de QR Codes Biomédicaux</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Scannez l'étiquette QR collée sur l'appareil pour ouvrir instantanément sa fiche technique et son historique de maintenance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Colonne Gauche : Zone de scan / Caméra */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#2E74B5]" />
              <span>Capture Vidéo (Caméra Smartphone / Webcam)</span>
            </h3>
            {scannerActive ? (
              <button
                onClick={stopScanner}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition"
              >
                Arrêter Caméra
              </button>
            ) : (
              <button
                onClick={startScanner}
                className="px-3 py-1 bg-[#2E74B5] hover:bg-[#256199] text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Activer Caméra</span>
              </button>
            )}
          </div>

          {/* Conteneur lecteur caméra html5-qrcode */}
          <div className="relative min-h-[260px] bg-slate-900 rounded-xl overflow-hidden flex flex-col items-center justify-center border-2 border-dashed border-slate-300">
            <div id="qr-reader" className="w-full max-w-sm"></div>

            {!scannerActive && (
              <div className="p-6 text-center text-slate-400 space-y-2">
                <QrCode className="w-12 h-12 mx-auto text-slate-500 opacity-60" />
                <p className="text-xs">
                  Cliquez sur <b>Activer Caméra</b> pour scanner en temps réel avec la caméra du téléphone ou de l'ordinateur.
                </p>
              </div>
            )}
          </div>

          {scannerError && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Info caméra : </span>
                <span>{scannerError}</span>
              </div>
            </div>
          )}

          {/* Saisie manuelle directe */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Ou saisir directement le code d'inventaire hospitalier :
            </label>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLookup(manualCode);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="ex: EQ-HGD-URG-001"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#2E74B5] focus:outline-hidden font-mono"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-[#1F3864] hover:bg-[#182c4f] text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Rechercher</span>
              </button>
            </form>
          </div>

          {/* Boutons de test direct (très pratique pour évaluation sans caméra) */}
          <div className="pt-2">
            <div className="text-[11px] font-semibold text-slate-500 mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#2E74B5]" />
              <span>Simuler un scan instantané (Échantillons HGD) :</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {demoCodes.map((d) => (
                <button
                  key={d.code}
                  onClick={() => {
                    setManualCode(d.code);
                    handleLookup(d.code);
                  }}
                  className="p-2 text-left bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg transition text-[11px]"
                >
                  <div className="font-mono font-bold text-[#1F3864]">{d.code}</div>
                  <div className="text-slate-500 truncate text-[10px]">{d.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Colonne Droite : Fiche Équipement Scanné */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-[#2E74B5]" />
              <span>Fiche Technique de l'Appareil Identifié</span>
            </span>
            {foundEquipement && (
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                Code Valide
              </span>
            )}
          </h3>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Chargement des caractéristiques biomédicales...
            </div>
          ) : !foundEquipement ? (
            <div className="py-12 text-center text-slate-400 text-xs space-y-2">
              <QrCode className="w-10 h-10 mx-auto text-slate-300" />
              <p>Aucun équipement scanné pour le moment.</p>
              <p className="text-[11px] text-slate-500">
                Scannez un QR code ou cliquez sur l'un des échantillons à gauche.
              </p>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-150 text-xs">
              {/* Entête Équipement */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-[#1F3864] text-white">
                      {foundEquipement.code_inventaire}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 mt-1.5">
                      {foundEquipement.nom}
                    </h4>
                    <p className="text-[11px] text-slate-600">Catégorie : {foundEquipement.categorie}</p>
                  </div>
                  <div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        foundEquipement.statut === 'en_service'
                          ? 'bg-emerald-100 text-emerald-800'
                          : foundEquipement.statut === 'en_maintenance'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {foundEquipement.statut.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Détails techniques */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-700">
                <div>
                  <span className="text-slate-400 text-[10px] block">N° de Série Fabricant</span>
                  <span className="font-mono font-bold">{foundEquipement.numero_serie}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Date d'Acquisition</span>
                  <span className="font-semibold">{foundEquipement.date_acquisition}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Service Hospitalier</span>
                  <span className="font-semibold text-slate-900">{foundEquipement.service_nom}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Salle / Box</span>
                  <span className="font-semibold text-slate-900">{foundEquipement.salle}</span>
                </div>
                {foundEquipement.etat_lit !== 'non_applicable' && (
                  <div className="col-span-2">
                    <span className="text-slate-400 text-[10px] block">État du Lit d'Hospitalisation</span>
                    <span
                      className={`inline-block font-bold px-2 py-0.5 rounded text-[11px] ${
                        foundEquipement.etat_lit === 'libre'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {foundEquipement.etat_lit === 'libre' ? 'Lit Libre (Disponible)' : 'Lit Occupé (Patient affecté)'}
                    </span>
                  </div>
                )}
                {foundEquipement.garantie_expiration && (
                  <div className="col-span-2">
                    <span className="text-slate-400 text-[10px] block">Garantie Fabricant</span>
                    <span>Jusqu'au {foundEquipement.garantie_expiration}</span>
                  </div>
                )}
                {foundEquipement.documents && (
                  <div className="col-span-2">
                    <span className="text-slate-400 text-[10px] block">Documentation / Manuels</span>
                    <span className="italic">{foundEquipement.documents}</span>
                  </div>
                )}
              </div>

              {/* Historique des interventions biomédicales */}
              <div className="space-y-2">
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-[#2E74B5]" />
                    <span>Historique des Maintenances ({maintenances.length})</span>
                  </span>
                </div>

                {maintenances.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic p-3 bg-slate-50 rounded-lg">
                    Aucune intervention enregistrée pour cet appareil.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {maintenances.map((m) => (
                      <div
                        key={m.id}
                        className="p-2.5 rounded-lg border border-slate-200 bg-white text-[11px] space-y-1"
                      >
                        <div className="flex items-center justify-between font-semibold">
                          <span className="text-[#1F3864]">
                            Intervention #{m.id} — {m.type.toUpperCase()} ({m.priorite})
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              m.statut === 'terminee'
                                ? 'bg-emerald-100 text-emerald-800'
                                : m.statut === 'en_retard'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {m.statut.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <p className="text-slate-600">{m.description_panne}</p>
                        <div className="text-[10px] text-slate-400 flex justify-between">
                          <span>Prévue le : {m.date_planifiee}</span>
                          {m.technicien_nom && <span>Technicien : {m.technicien_nom}</span>}
                        </div>
                        {m.rapport_technique && (
                          <div className="text-[10px] text-emerald-800 bg-emerald-50/70 p-1 rounded font-mono">
                            Rapport : {m.rapport_technique}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
