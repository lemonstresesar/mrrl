import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Ajoute un en-tête institutionnel professionnel HGD sur le PDF
 */
function addHGDHeader(doc: jsPDF, title: string, subtitle: string = '') {
  // Bannière bleu marine #1F3864
  doc.setFillColor(31, 56, 100);
  doc.rect(0, 0, 210, 24, 'F');

  // Liseré bleu #2E74B5
  doc.setFillColor(46, 116, 181);
  doc.rect(0, 24, 210, 2, 'F');

  // Titres institutionnels
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('HÔPITAL GÉNÉRAL DE DOUALA', 14, 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('RÉPUBLIQUE DU CAMEROUN • SYSTÈME DE GESTION DES RESSOURCES MÉDICALES', 14, 18);

  // Titre du document
  doc.setTextColor(31, 56, 100);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), 14, 35);

  if (subtitle) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(subtitle, 14, 41);
  }

  // Date d'extraction
  const nowStr = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text(`Document officiel généré le : ${nowStr}`, 14, 47);
}

/**
 * Pied de page avec pagination
 */
function addHGDFooter(doc: jsPDF) {
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(
      `HGD MediGest — Quartier Makepe / Beedi, BP 4856 Douala — Page ${i} sur ${pageCount}`,
      105,
      290,
      { align: 'center' }
    );
  }
}

// 1. Export PDF Inventaire des équipements
export function exportEquipementsPDF(equipements: any[]) {
  const doc = new jsPDF('p', 'mm', 'a4');
  addHGDHeader(doc, 'Inventaire Général des Équipements & Lits', 'Ressources biomédicales et parcs matériels par service');

  const tableData = equipements.map((e) => [
    e.code_inventaire,
    e.nom,
    e.categorie,
    e.service_nom || 'Non assigné',
    e.salle,
    e.etat_lit !== 'non_applicable' ? `Lit (${e.etat_lit})` : e.statut.replace('_', ' ').toUpperCase(),
  ]);

  autoTable(doc, {
    startY: 52,
    head: [['Code Inv.', 'Désignation Équipement', 'Catégorie', 'Service', 'Salle', 'Statut']],
    body: tableData,
    headStyles: { fillColor: [31, 56, 100], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 8, cellPadding: 2.5 },
  });

  addHGDFooter(doc);
  doc.save(`HGD_Inventaire_Equipements_${new Date().toISOString().split('T')[0]}.pdf`);
}

// 2. Export PDF État des Stocks & Lots FEFO
export function exportStocksPDF(lots: any[]) {
  const doc = new jsPDF('p', 'mm', 'a4');
  addHGDHeader(doc, 'État des Stocks Pharmacie & Règle FEFO', 'Lots actifs, contrôlés et délais de péremption');

  const tableData = lots.map((l) => [
    l.produit_designation,
    l.numero_lot,
    l.date_peremption,
    `${l.quantite_restante} ${l.unite_mesure || 'unités'}`,
    l.prix_unitaire_cfa ? `${l.prix_unitaire_cfa.toLocaleString('fr-FR')} FCFA` : '-',
    l.alerte_peremption === 'perime'
      ? 'PÉRIMÉ (BLOQUÉ)'
      : l.alerte_peremption === 'critique'
      ? 'URGENT (<30j)'
      : l.alerte_peremption === 'avertissement'
      ? 'PROCHE (<90j)'
      : 'CONFORME',
  ]);

  autoTable(doc, {
    startY: 52,
    head: [['Produit / Médicament', 'N° Lot', 'Date Péremption', 'Stock Restant', 'Prix Unitaire', 'Statut FEFO']],
    body: tableData,
    headStyles: { fillColor: [46, 116, 181], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 8, cellPadding: 2.5 },
  });

  addHGDFooter(doc);
  doc.save(`HGD_Stocks_FEFO_${new Date().toISOString().split('T')[0]}.pdf`);
}

// 3. Export PDF Registre Officiel des Produits Contrôlés (Stupéfiants)
export function exportControlledRegistryPDF(registry: any[]) {
  const doc = new jsPDF('l', 'mm', 'a4'); // Mode paysage pour registre officiel
  // Bannière
  doc.setFillColor(31, 56, 100);
  doc.rect(0, 0, 297, 24, 'F');
  doc.setFillColor(46, 116, 181);
  doc.rect(0, 24, 297, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('HÔPITAL GÉNÉRAL DE DOUALA — REGISTRE OFFICIEL DES PRODUITS CONTRÔLÉS & STUPÉFIANTS', 14, 12);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Document médico-légal obligatoire • Double-validation obligatoire Pharmacien & Logistique', 14, 18);

  const tableData = registry.map((r) => [
    r.registre_numero,
    r.produit_designation,
    `${r.quantite} ${r.unite_mesure}`,
    r.service_demandeur_nom,
    r.patient_ref_anonyme,
    r.medecin_prescripteur,
    r.pharmacien_nom,
    r.logisticien_nom || 'EN ATTENTE',
    r.statut.toUpperCase(),
    r.hash_registre_inviolable ? r.hash_registre_inviolable.substring(0, 10) + '...' : '-',
  ]);

  autoTable(doc, {
    startY: 32,
    head: [[
      'N° Registre',
      'Substance Contrôlée',
      'Qte',
      'Service Demandeur',
      'Réf. Patient',
      'Prescripteur',
      'Initiateur (Pharmacie)',
      'Validateur (Logistique)',
      'Statut',
      'Sceau SHA-256',
    ]],
    body: tableData,
    headStyles: { fillColor: [155, 44, 44], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 7.5, cellPadding: 2 },
  });

  doc.save(`HGD_Registre_Stupefiants_${new Date().toISOString().split('T')[0]}.pdf`);
}

// 4. Export PDF Historique de Maintenance
export function exportMaintenancePDF(maintenances: any[]) {
  const doc = new jsPDF('p', 'mm', 'a4');
  addHGDHeader(doc, 'Historique et Calendrier de Maintenance Biomédicale', 'Interventions préventives, curatives et états de réparation');

  const tableData = maintenances.map((m) => [
    `#${m.id}`,
    m.equipement_nom,
    m.type.toUpperCase(),
    m.priorite.toUpperCase(),
    m.date_planifiee,
    m.technicien_nom || 'Non assigné',
    m.statut.replace('_', ' ').toUpperCase(),
    m.cout_intervention_cfa ? `${m.cout_intervention_cfa.toLocaleString('fr-FR')} CFA` : '0 CFA',
  ]);

  autoTable(doc, {
    startY: 52,
    head: [['ID', 'Équipement', 'Type', 'Priorité', 'Date Prévue', 'Technicien', 'Statut', 'Coût']],
    body: tableData,
    headStyles: { fillColor: [31, 56, 100], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 8, cellPadding: 2.5 },
  });

  addHGDFooter(doc);
  doc.save(`HGD_Maintenance_${new Date().toISOString().split('T')[0]}.pdf`);
}

// 5. Export EXCEL universel
export function exportToExcel(data: any[], fileName: string, sheetName: string = 'Feuille1') {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
}
