/**
 * csvExport.js — Utilería de exportación CSV para Declara Pro
 * Genera archivos .csv con BOM UTF-8 (compatible con Excel en español).
 */

function escapeCsvCell(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

export function downloadCsv(filename, headers, rows) {
  const BOM = '\uFEFF';
  const sep = ',';
  const headerLine = headers.map(escapeCsvCell).join(sep);
  const dataLines = rows.map(row => row.map(escapeCsvCell).join(sep));
  const csvContent = BOM + [headerLine, ...dataLines].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─── Exportaciones específicas por sección ────────────────────────────────────

export function exportEgresos(items, year, label = 'Anual') {
  const headers = [
    'Fecha',
    'Proveedor / Emisor',
    'RFC Emisor',
    'Uso CFDI',
    'Método Pago',
    'Forma Pago',
    'Subtotal Base (MXN)',
    'IVA Acreditable (MXN)',
    'Total Pagado (MXN)',
    'Descripción Concepto(s)',
    'Clave SAT',
    'UUID / Folio Fiscal',
  ];

  const rows = items.map(item => {
    const conceptosDesc = (item.conceptos || []).map(c => c.desc || '').join(' | ');
    const clavesSat = (item.conceptos || []).map(c => c.clave || '').filter(Boolean).join(' | ');
    return [
      item.fecha || '',
      item.emisor || '',
      item.raw_cfdi?.emisor_rfc || '',
      item.uso_cfdi || '',
      item.metodo || '',
      item.forma_pago || '',
      (item.subtotal || 0).toFixed(2),
      (item.iva || 0).toFixed(2),
      (item.total || 0).toFixed(2),
      conceptosDesc,
      clavesSat,
      item.uuid || '',
    ];
  });

  downloadCsv(`Declara_Egresos_${label.replace(/\s/g, '_')}_${year}`, headers, rows);
}

export function exportHonorarios(items, year) {
  const headers = [
    'Fecha',
    'Cliente / Receptor',
    'RFC Receptor',
    'Método Pago',
    'Subtotal Base (MXN)',
    'IVA Trasladado (MXN)',
    'ISR Retenido (MXN)',
    'IVA Retenido (MXN)',
    'Total Neto Cobrado (MXN)',
    'Descripción Concepto(s)',
    'UUID / Folio Fiscal',
  ];

  const rows = items.map(item => {
    const conceptosDesc = (item.conceptos || []).map(c => c.desc || '').join(' | ');
    return [
      item.fecha || '',
      item.cliente || '',
      item.rfc || '',
      item.metodo || '',
      (item.subtotal || 0).toFixed(2),
      (item.iva || 0).toFixed(2),
      (item.isr_ret || 0).toFixed(2),
      (item.iva_ret || 0).toFixed(2),
      (item.total || 0).toFixed(2),
      conceptosDesc,
      item.uuid || '',
    ];
  });

  downloadCsv(`Declara_Honorarios_AEyP_${year}`, headers, rows);
}

export function exportNomina(empleadores, year) {
  const headers = [
    'Empleador',
    'Fecha Pago',
    'Período Inicial',
    'Período Final',
    'Días Pagados',
    'Total Bruto (MXN)',
    'ISR Retenido (MXN)',
    'Deducciones (MXN)',
    'Vales Despensa (MXN)',
    'Neto Percibido (MXN)',
    'UUID',
  ];

  const rows = [];
  (empleadores || []).forEach(emp => {
    (emp.recibos || []).forEach(r => {
      rows.push([
        emp.nombre || emp.nombre_display || '',
        r.fecha || '',
        r.fecha_inicial || '',
        r.fecha_final || '',
        (r.dias_pagados || 0).toFixed(1),
        (r.total_bruto || 0).toFixed(2),
        (r.isr_retenido || 0).toFixed(2),
        (r.total_deducciones || 0).toFixed(2),
        (r.vales || 0).toFixed(2),
        (r.neto || 0).toFixed(2),
        r.uuid || '',
      ]);
    });
  });

  rows.sort((a, b) => (a[1] || '').localeCompare(b[1] || ''));
  downloadCsv(`Declara_Nomina_${year}`, headers, rows);
}

export function exportDeduccionesPersonales(items, year) {
  const headers = [
    'Fecha',
    'Emisor / Proveedor',
    'Uso CFDI (Categoría)',
    'Monto Deducible (MXN)',
    'UUID / Folio Fiscal',
  ];

  const rows = (items || []).map(item => [
    item.fecha || '',
    item.emisor || '',
    item.uso_cfdi || '',
    (item.monto || 0).toFixed(2),
    item.uuid || '',
  ]);

  downloadCsv(`Declara_Deducciones_Personales_${year}`, headers, rows);
}

/**
 * Exporta el resumen consolidado de ingresos por mes (nómina + honorarios).
 * @param {Object[]} mensualData  - Array [{name, Nómina, Honorarios, Total}, ...]
 * @param {Object[]} nominaDetalle - data.detalle de sueldos (para recibos individuales)
 * @param {Object[]} aeypDetalle   - data.detalle de honorarios (facturas emitidas)
 * @param {string}   year
 */
export function exportIngresos(mensualData, nominaDetalle, aeypDetalle, year) {
  // ── Hoja 1: Resumen mensual consolidado ──────────────────────────────────
  const headersMensual = [
    'Mes',
    'Nómina Neto (MXN)',
    'Honorarios Bruto (MXN)',
    'Total Ingreso (MXN)',
  ];
  const rowsMensual = mensualData
    .filter(m => m.Total > 0)
    .map(m => [
      m.name,
      (m['Nómina'] || 0).toFixed(2),
      (m['Honorarios'] || 0).toFixed(2),
      (m['Total'] || 0).toFixed(2),
    ]);

  downloadCsv(`Declara_Ingresos_Resumen_${year}`, headersMensual, rowsMensual);

  // ── Hoja 2: Detalle de recibos de nómina ─────────────────────────────────
  if (nominaDetalle && nominaDetalle.length > 0) {
    const headersNom = [
      'Empleador',
      'Fecha Pago',
      'Período Inicial',
      'Período Final',
      'Días Pagados',
      'Total Percepciones (MXN)',
      'ISR Retenido (MXN)',
      'Otras Deducciones (MXN)',
      'Vales Despensa (MXN)',
      'Neto Depositado (MXN)',
      'UUID',
    ];
    const rowsNom = [];
    nominaDetalle.forEach(emp => {
      (emp.recibos || []).forEach(r => {
        const totalPerc = (r.percepciones || []).reduce((s, p) => s + (p.total || 0), 0);
        const vales = (r.percepciones || []).reduce((s, p) => s + (p.tipo === '029' ? (p.total || 0) : 0), 0);
        const totalDed = (r.deducciones || []).reduce((s, d) => s + (d.importe || 0), 0);
        const neto = totalPerc - totalDed - vales;
        rowsNom.push([
          emp.nombre || '',
          r.fecha || '',
          r.fecha_inicial || '',
          r.fecha_final || '',
          (r.dias_pagados || 0).toFixed(1),
          totalPerc.toFixed(2),
          (r.isr_retenido || 0).toFixed(2),
          totalDed.toFixed(2),
          vales.toFixed(2),
          neto.toFixed(2),
          r.uuid || '',
        ]);
      });
    });
    rowsNom.sort((a, b) => (a[1] || '').localeCompare(b[1] || ''));
    downloadCsv(`Declara_Ingresos_Nomina_${year}`, headersNom, rowsNom);
  }

  // ── Hoja 3: Detalle de facturas emitidas AEyP ────────────────────────────
  if (aeypDetalle && aeypDetalle.length > 0) {
    const headersAeyp = [
      'Fecha',
      'Cliente / Receptor',
      'RFC Receptor',
      'Método Pago',
      'Subtotal Base (MXN)',
      'IVA Trasladado (MXN)',
      'ISR Retenido (MXN)',
      'IVA Retenido (MXN)',
      'Total Neto Cobrado (MXN)',
      'Descripción Concepto(s)',
      'UUID',
    ];
    const rowsAeyp = aeypDetalle.map(item => {
      const conceptosDesc = (item.conceptos || []).map(c => c.desc || '').join(' | ');
      const totalNeto = (item.subtotal || 0) + (item.iva || 0) - (item.isr_ret || 0) - (item.iva_ret || 0);
      return [
        item.fecha || '',
        item.cliente || '',
        item.rfc || '',
        item.metodo || '',
        (item.subtotal || 0).toFixed(2),
        (item.iva || 0).toFixed(2),
        (item.isr_ret || 0).toFixed(2),
        (item.iva_ret || 0).toFixed(2),
        totalNeto.toFixed(2),
        conceptosDesc,
        item.uuid || '',
      ];
    });
    downloadCsv(`Declara_Ingresos_AEyP_${year}`, headersAeyp, rowsAeyp);
  }
}
