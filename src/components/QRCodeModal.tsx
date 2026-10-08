import React from 'react';
import { Modal } from './Modal';
import { Printer, Hospital, QrCode } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrData: {
    code_inventaire: string;
    nom: string;
    service?: string;
    salle?: string;
    numero_serie?: string;
    qrDataUrl: string;
  } | null;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, qrData }) => {
  if (!qrData) return null;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Étiquette QR - ${qrData.code_inventaire}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
              margin: 0;
            }
            .label-card {
              border: 2px solid #1F3864;
              border-radius: 8px;
              padding: 16px;
              width: 320px;
              text-align: center;
              box-shadow: none;
            }
            .header-bar {
              background-color: #1F3864;
              color: white;
              padding: 6px;
              font-size: 11px;
              font-weight: bold;
              border-radius: 4px;
              margin-bottom: 12px;
              letter-spacing: 0.5px;
            }
            .qr-img {
              width: 180px;
              height: 180px;
              margin: 0 auto 10px auto;
              display: block;
            }
            .inv-code {
              font-family: monospace;
              font-size: 14px;
              font-weight: bold;
              color: #1F3864;
              margin-bottom: 6px;
            }
            .eq-name {
              font-size: 13px;
              font-weight: bold;
              color: #1e293b;
              margin-bottom: 4px;
            }
            .meta {
              font-size: 11px;
              color: #64748b;
              line-height: 1.4;
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="label-card">
            <div class="header-bar">HÔPITAL GÉNÉRAL DE DOUALA</div>
            <img class="qr-img" src="${qrData.qrDataUrl}" alt="QR Code" />
            <div class="inv-code">${qrData.code_inventaire}</div>
            <div class="eq-name">${qrData.nom}</div>
            <div class="meta">
              Service: ${qrData.service || 'N/A'}<br/>
              Salle: ${qrData.salle || 'N/A'}<br/>
              N° Série: ${qrData.numero_serie || 'N/A'}
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Étiquette QR Code Biomédicale"
      subtitle={`Code d'inventaire hospitalier : ${qrData.code_inventaire}`}
      maxWidth="md"
    >
      <div className="flex flex-col items-center">
        {/* Aperçu de l'étiquette d'identification officielle */}
        <div className="w-full max-w-xs border-2 border-[#1F3864] rounded-xl p-5 bg-white shadow-md text-center flex flex-col items-center">
          <div className="w-full bg-[#1F3864] text-white py-1.5 px-3 rounded text-[11px] font-bold tracking-wider mb-4 flex items-center justify-center gap-1.5">
            <Hospital className="w-3.5 h-3.5" />
            <span>HÔPITAL GÉNÉRAL DE DOUALA</span>
          </div>

          <div className="p-2 border border-slate-200 rounded-lg bg-slate-50 mb-3 shadow-inner">
            <img src={qrData.qrDataUrl} alt="QR Code" className="w-48 h-48 block" />
          </div>

          <div className="font-mono font-bold text-sm text-[#1F3864] bg-blue-50 px-3 py-1 rounded-md border border-blue-200 mb-2">
            {qrData.code_inventaire}
          </div>

          <div className="font-semibold text-xs text-slate-800 line-clamp-2 mb-1">
            {qrData.nom}
          </div>

          <div className="text-[11px] text-slate-500 space-y-0.5">
            <div><span className="font-medium text-slate-700">Service :</span> {qrData.service || 'Général'}</div>
            <div><span className="font-medium text-slate-700">Salle :</span> {qrData.salle || 'Non spécifiée'}</div>
            {qrData.numero_serie && (
              <div><span className="font-medium text-slate-700">S/N :</span> {qrData.numero_serie}</div>
            )}
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="mt-6 flex items-center justify-center gap-3 w-full">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            Fermer
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2 bg-[#2E74B5] hover:bg-[#256199] text-white rounded-lg text-xs font-semibold shadow-md transition"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer l'étiquette</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
