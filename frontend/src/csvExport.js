/**
 * csvExport.js — Utilería de exportación CSV para Declara Pro
 * Genera archivos .csv con BOM UTF-8 (compatible con Microsoft Excel y Google Sheets en español).
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

// ─── 1. Exportación de Compras y Gastos (Egresos) ─────────────────────────────
export function exportEgresos(items, year, label = 'Anual') {
  const headers = [
    'Fecha',
    'Proveedor / Emisor',
    'RFC Emisor',
    'Uso CFDI',
    'Método Pago',
    'Forma Pago',
    'Es Deducible Fiscal',
    'Subtotal (MXN)',
    'IVA Acreditable (MXN)',
    'Total Pagado (MXN)',
    'Conceptos Principales',
    'UUID / Folio Fiscal'
  ];

  const rows = (items || []).map(item => {
    const conceptosDesc = (item.conceptos || []).map(c => c.desc || '').join(' | ');
    return [
      item.fecha || '',
      item.emisor || '',
      item.raw_cfdi?.emisor_rfc || '',
      item.uso_cfdi || '',
      item.metodo || '',
      item.forma_pago || '',
      item.es_deducible_fiscal !== false ? 'SÍ' : 'NO',
      (Number(item.subtotal) || 0).toFixed(2),
      (Number(item.iva) || 0).toFixed(2),
      (Number(item.total) || 0).toFixed(2),
      conceptosDesc,
      item.uuid || ''
    ];
  });

  downloadCsv(`Tributacos_Gastos_Compras_${year}_${label.replace(/\s/g, '_')}`, headers, rows);
}

// ─── 2. Exportación de Facturas Emitidas / Honorarios ──────────────────────────
export function exportHonorarios(items, year) {
  const headers = [
    'Fecha',
    'Cliente / Receptor',
    'RFC Receptor',
    'Uso CFDI',
    'Método Pago',
    'Subtotal (MXN)',
    'IVA Trasladado (MXN)',
    'ISR Retenido (MXN)',
    'IVA Retenido (MXN)',
    'Neto Cobrado (MXN)',
    'Conceptos Billed',
    'UUID / Folio Fiscal'
  ];

  const rows = (items || []).map(item => {
    const conceptosDesc = (item.conceptos || []).map(c => c.desc || '').join(' | ');
    const sub = Number(item.subtotal) || 0;
    const iva = Number(item.iva) || 0;
    const isrRet = Number(item.ret_isr ?? item.isr_ret) || 0;
    const ivaRet = Number(item.ret_iva ?? item.iva_ret) || 0;
    const neto = sub + iva - isrRet - ivaRet;

    return [
      item.fecha || '',
      item.cliente || item.receptor || '',
      item.rfc || '',
      item.uso_cfdi || '',
      item.metodo || '',
      sub.toFixed(2),
      iva.toFixed(2),
      isrRet.toFixed(2),
      ivaRet.toFixed(2),
      neto.toFixed(2),
      conceptosDesc,
      item.uuid || ''
    ];
  });

  downloadCsv(`Tributacos_Honorarios_Clientes_${year}`, headers, rows);
}

// ─── 3. Exportación de Recibos de Nómina ───────────────────────────────────────
export function exportNomina(empleadores, year) {
  const headers = [
    'Empleador',
    'RFC Empleador',
    'Fecha Pago',
    'Período Inicial',
    'Período Final',
    'Días Pagados',
    'Sueldo Bruto (MXN)',
    'ISR Retenido (MXN)',
    'Otras Deducciones (MXN)',
    'Vales Despensa (MXN)',
    'Neto en Cuenta (MXN)',
    'UUID'
  ];

  const rows = [];
  (empleadores || []).forEach(emp => {
    (emp.recibos || []).forEach(r => {
      rows.push([
        emp.nombre || emp.nombre_display || '',
        emp.rfc || '',
        r.fecha || '',
        r.fecha_inicial || '',
        r.fecha_final || '',
        (Number(r.dias_pagados) || 0).toFixed(1),
        (Number(r.total_bruto) || 0).toFixed(2),
        (Number(r.isr_retenido) || 0).toFixed(2),
        (Number(r.total_deducciones) || 0).toFixed(2),
        (Number(r.vales) || 0).toFixed(2),
        (Number(r.neto) || 0).toFixed(2),
        r.uuid || ''
      ]);
    });
  });

  rows.sort((a, b) => (a[2] || '').localeCompare(b[2] || ''));
  downloadCsv(`Tributacos_Nomina_Recibos_${year}`, headers, rows);
}

// ─── 4. Exportación de Deducciones Personales (Art. 151) ──────────────────────
export function exportDeduccionesPersonales(items, year) {
  const headers = [
    'Fecha',
    'Proveedor / Institución',
    'RFC Emisor',
    'Clave SAT',
    'Tipo de Deducción',
    'Forma Pago',
    'Monto Deducible (MXN)',
    'UUID / Folio Fiscal'
  ];

  const rows = (items || []).map(item => [
    item.fecha || '',
    item.emisor || '',
    item.rfc_emisor || item.raw_cfdi?.emisor_rfc || '',
    item.uso_cfdi || '',
    item.categoria_nombre || item.uso_cfdi || '',
    item.forma_pago || '',
    (Number(item.monto || item.total) || 0).toFixed(2),
    item.uuid || ''
  ]);

  downloadCsv(`Tributacos_Deducciones_Personales_${year}`, headers, rows);
}

// ─── 5. Exportación de Papel de Trabajo Anual (Pre-Declaración) ───────────────
export function exportPapelTrabajoAnual(data, year) {
  const sim = data?.simulacion_anual || {};
  const sueldosSec = data?.sections?.sueldos || {};
  const honorariosSec = data?.sections?.honorarios || {};

  const headers = ['Concepto Fiscal', 'Monto (MXN)', 'Notas / Fundamento Legal'];
  const rows = [
    ['--- DETERMINACIÓN ANUAL DE ISR ---', '', `Ejercicio Fiscal ${year}`],
    ['1. Ingresos Acumulables Totales', (sim.ingresos_acumulables_totales || 0).toFixed(2), 'Art. 152 LISR (Sueldos + Utilidad Honorarios + Intereses)'],
    ['   • Sueldos y Salarios (Gravado)', (sim.ingresos_sueldos_gravados || 0).toFixed(2), `${(sueldosSec.detalle || []).length} empleador(es)`],
    ['   • Honorarios / Actividad (Utilidad)', (sim.ingresos_honorarios_utilidad || 0).toFixed(2), `Facturado: ${(honorariosSec.ingresos || 0).toFixed(2)} - Gastos: ${(honorariosSec.deducciones_autorizadas || 0).toFixed(2)}`],
    ['   • Intereses Financieros (Reales)', (sim.ingresos_intereses_reales || 0).toFixed(2), 'Interés real bancario acumulable'],
    ['2. Deducciones Personales Aplicadas', (-1 * (sim.deducciones_personales_aplicadas || 0)).toFixed(2), `Art. 151 LISR (Tope Legal: ${(sim.tope_legal_deducciones || 0).toFixed(2)})`],
    ['3. Base Gravable del Ejercicio', (sim.base_gravable_anual || 0).toFixed(2), 'Base para aplicación de Tarifa Anual'],
    ['4. ISR Anual Causado', (sim.isr_anual_causado || 0).toFixed(2), 'Tarifa Anual Art. 152 LISR'],
    ['5. Pagos Provisionales Realizados', (-1 * (sim.pagos_provisionales_acreditables || 0)).toFixed(2), 'Pagos mensuales efectuados al SAT'],
    ['6. Retenciones Totales Acreditables', (-1 * (sim.retenciones_totales_acreditables || 0)).toFixed(2), `Patrones Nómina: ${(sueldosSec.isr_retenido || 0).toFixed(2)} + Clientes: ${(honorariosSec.isr_retenido || 0).toFixed(2)}`],
    ['--- RESULTADO FINAL DEL EJERCICIO ---', '', ''],
    [(sim.saldo_a_favor_proyectado > 0 ? '🏆 SALDO A FAVOR (DEVOLUCIÓN ESTIMADA)' : '⚠️ IMPUESTO ANUAL A CARGO'), (sim.saldo_a_favor_proyectado > 0 ? sim.saldo_a_favor_proyectado : sim.saldo_a_cargo_proyectado).toFixed(2), 'Cálculo algorítmico 100% CFDIs']
  ];

  downloadCsv(`Tributacos_Papel_Trabajo_Anual_${year}`, headers, rows);
}
