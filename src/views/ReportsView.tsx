import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Download,
  Stethoscope,
  Pill,
  ShieldAlert,
  Wrench,
  ShoppingBag,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../services/api';
import {
  exportEquipementsPDF,
  exportStocksPDF,
  exportControlledRegistryPDF,
  exportMaintenancePDF,
  exportToExcel,
} from '../services/exportService';

export const ReportsView: React.FC = () => {
  const [equipements, setEquipements] = useState<any[]>([]);
  const [lots, setLots] = useState<any[]>([]);
  const [registry, setRegistry] = useState<any[]>([]);
  const [maintenances, setMaintenances] = useState<any[]>([]);
  const [commandes, setCommandes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getEquipements(),
      api.getLots(),
      api.getControlledRegistry(),
      api.getMaintenances(),
      api.getCommandes(),
    ]).then(([e, l, r, m, c]) => {
      setEquipements(e.equipements);
      setLots(l.lots);
      setRegistry(r.registry);
      setMaintenances(m.maintenances);
      setCommandes(c.commandes);
      setLoading(false);
    });
  }, []);

  const reportItems = [
    {
      title: 'Inventaire Général des Équipements & Lits',
      desc: 'Parc biomédical complet, numéros de série, dates d\'acquisition, état des lits et affectation par service.',
      icon: Stethoscope,
      count: `${equipements.length} équipements`,
      onPdf: () => exportEquipementsPDF(equipements),
      onExcel: () => exportToExcel(equipements, 'HGD_Inventaire_Equipements'),
    },
    {
      title: 'État des Stocks Pharmacie & Fiches FEFO',
      desc: 'Tous les lots actifs avec dates de péremption, quantités restantes, prix unitaires et statut de conformité.',
      icon: Pill,
      count: `${lots.length} lots référencés`,
      onPdf: () => exportStocksPDF(lots),
      onExcel: () => exportToExcel(lots, 'HGD_Stocks_FEFO'),
    },
    {
      title: 'Registre Officiel des Produits Contrôlés (Stupéfiants)',
      desc: 'Document médico-légal officiel de traçabilité des stupéfiants avec double validation et sceaux cryptographiques SHA-256.',
      icon: ShieldAlert,
      count: `${registry.length} inscriptions scellées`,
      onPdf: () => exportControlledRegistryPDF(registry),
      onExcel: () => exportToExcel(registry, 'HGD_Registre_Stupefiants'),
    },
    {
      title: 'Historique & Calendrier de Maintenance Biomédicale',
      desc: 'Visites préventives périodiques, réparations curatives d\'urgence, coûts d\'intervention et techniciens assignés.',
      icon: Wrench,
      count: `${maintenances.length} interventions`,
      onPdf: () => exportMaintenancePDF(maintenances),
      onExcel: () => exportToExcel(maintenances, 'HGD_Rapport_Maintenance'),
    },
    {
      title: 'Bons de Commande & Approvisionnements Fournisseurs',
      desc: 'État des commandes passées aux grossistes de Douala, montants engagés et dates de livraison estimées.',
      icon: ShoppingBag,
      count: `${commandes.length} bons de commande`,
      onPdf: () => exportToExcel(commandes, 'HGD_Commandes_Fournisseurs'),
      onExcel: () => exportToExcel(commandes, 'HGD_Commandes_Fournisseurs'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Entête */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-[#2E74B5]" />
          <span>Centre de Rapports & Exports Institutionnels</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Générez en un clic des rapports officiels certifiés pour la direction hospitalière, le ministère et les audits internes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportItems.map((r, idx) => {
          const Icon = r.icon;
          return (
            <div
              key={idx}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-[#2E74B5] transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#2E74B5] flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {r.count}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900">{r.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{r.desc}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={r.onPdf}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#1F3864] hover:bg-[#162a4d] text-white font-semibold text-xs transition shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exporter PDF</span>
                </button>

                <button
                  onClick={r.onExcel}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition shadow-xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Exporter Excel</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
