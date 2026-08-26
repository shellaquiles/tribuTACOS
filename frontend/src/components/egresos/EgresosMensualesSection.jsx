import React, { useState, useMemo } from 'react';
import {
  ComposedChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, PieChart, Pie, Cell
} from 'recharts';
import { SectionCard, ConceptCard, CsvExportButton, CHART_COLORS, MONTH_NAMES, fmt } from '../ui/Primitives';
import { CfdiVisualizerModal, XmlViewerModal } from '../ui/Modals';
import { exportEgresos } from '../../csvExport';

// ─── CLASIFICACIÓN DINÁMICA DE RUBROS SAT (ALIMENTADA POR BASE DE DATOS Y CLAVES) ───

export function getConceptoCat(c, parentItem) {
  if (c?.categoria_gasto && c.categoria_gasto.id) return c.categoria_gasto;
  if (parentItem?.categoria_gasto && parentItem.categoria_gasto.id) return parentItem.categoria_gasto;
  return { id: 'otros_operativos', nombre: 'Otros Gastos Operativos', icono: '📋', color: '#475569', tipo: 'operativo' };
}

export function getGastoCat(item) {
  if (item?.categoria_gasto && item.categoria_gasto.id) return item.categoria_gasto;
  const conceptos = item?.conceptos || [];
  if (conceptos.length > 0 && conceptos[0]?.categoria_gasto) {
    return conceptos[0].categoria_gasto;
  }
  return { id: 'otros_operativos', nombre: 'Otros Gastos Operativos', icono: '📋', color: '#64748b', tipo: 'operativo' };
}


export function EgresosMensualesSection({ data, gastos, notasCreditoData, notasCredito, year }) {
  const [activeSubTab, setActiveSubTab] = useState('gastos'); // 'gastos' | 'notas_credito'
  const [selectedMonth, setSelectedMonth] = useState('Global'); // 'Global' | 1..12
  const [selectedCategory, setSelectedCategory] = useState('ALL'); // 'ALL' | cat_id
  const [viewMode, setViewMode] = useState('categoria'); // 'categoria' | 'proveedor' | 'lista'
  const [expandedProviders, setExpandedProviders] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy] = useState('fecha_desc');
  const [selectedCfdi, setSelectedCfdi] = useState(null);
  const [viewingXml, setViewingXml] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});

  const toggleRow = (uuid) => {
    setExpandedRows(prev => ({ ...prev, [uuid]: !prev[uuid] }));
  };

  const toggleProvider = (provKey) => {
    setExpandedProviders(prev => ({ ...prev, [provKey]: !prev[provKey] }));
  };

  const rawList = useMemo(() => (Array.isArray(data || gastos) ? (data || gastos) : []), [data, gastos]);

  // Cálculos agrupados por los 12 meses
  const {
    mesesData,
    totalesAnuales,
    promedioMensual,
    mesPico,
    deduciblesSubtotal,
    noDeduciblesSubtotal,
    ivaAcreditable,
    mixDeducibilidad,
    topProveedoresPeriodo
  } = useMemo(() => {
    const meses = MONTH_NAMES.map((name, idx) => ({
      mes: idx + 1,
      name,
      shortName: name.slice(0, 3),
      subtotal: 0,
      iva: 0,
      total: 0,
      count: 0,
      items: [],
      proveedoresMap: {}
    }));

    let sumSubtotal = 0;
    let sumIva = 0;
    let sumTotal = 0;
    let sumCount = 0;
    const activeMonths = new Set();

    rawList.forEach(item => {
      const fecha = item.fecha || '';
      const parts = fecha.split('-');
      const mIdx = parts.length > 1 ? parseInt(parts[1], 10) - 1 : -1;

      if (mIdx >= 0 && mIdx < 12) {
        const isDed = item.es_deducible_fiscal !== false;
        const subDed = isDed ? (item.subtotal || 0) : 0;
        const subNoDed = isDed ? 0 : (item.subtotal || 0);
        const ivaAcred = isDed ? (item.iva || 0) : 0;
        const ivaNoAcred = isDed ? 0 : (item.iva || 0);

        meses[mIdx].subtotal += item.subtotal || 0;
        meses[mIdx].subtotalDeducible = (meses[mIdx].subtotalDeducible || 0) + subDed;
        meses[mIdx].subtotalNoDeducible = (meses[mIdx].subtotalNoDeducible || 0) + subNoDed;
        meses[mIdx].iva += item.iva || 0;
        meses[mIdx].ivaAcreditableFiscal = (meses[mIdx].ivaAcreditableFiscal || 0) + ivaAcred;
        meses[mIdx].ivaNoAcreditable = (meses[mIdx].ivaNoAcreditable || 0) + ivaNoAcred;
        meses[mIdx].total += item.total || 0;
        meses[mIdx].count += 1;
        meses[mIdx].items.push(item);
        activeMonths.add(mIdx);

        const prov = item.emisor || 'Desconocido';
        meses[mIdx].proveedoresMap[prov] = (meses[mIdx].proveedoresMap[prov] || 0) + (item.subtotal || 0);
      }

      sumSubtotal += item.subtotal || 0;
      sumIva += item.iva || 0;
      sumTotal += item.total || 0;
      sumCount += 1;
    });

    // Identificar top provider por mes
    meses.forEach(m => {
      const provEntries = Object.entries(m.proveedoresMap);
      if (provEntries.length > 0) {
        provEntries.sort((a, b) => b[1] - a[1]);
        m.topProvider = provEntries[0][0];
      } else {
        m.topProvider = '—';
      }
    });

    const activeCount = activeMonths.size || 1;
    const promTotal = sumTotal / activeCount;
    const promSubtotal = sumSubtotal / activeCount;

    // Mes pico (mayor gasto total)
    const pico = meses.reduce((max, curr) => (curr.total > max.total ? curr : max), meses[0]);

    // Items para el periodo seleccionado (Global o mes específico)
    const targetItems = selectedMonth === 'Global'
      ? rawList
      : (meses[selectedMonth - 1]?.items || []);

    // Deducibilidad e IVA del periodo seleccionado
    let deduciblesSubtotal = 0;
    let noDeduciblesSubtotal = 0;
    let ivaAcreditable = 0;
    let ivaNoAcreditable = 0;

    targetItems.forEach(item => {
      const isDed = item.es_deducible_fiscal !== false;
      const sub = Number(item.subtotal) || 0;
      const iva = Number(item.iva) || 0;
      if (isDed) {
        deduciblesSubtotal += sub;
        ivaAcreditable += iva;
      } else {
        noDeduciblesSubtotal += sub;
        ivaNoAcreditable += iva;
      }
    });

    const mixDeducibilidad = [
      { name: '100% Deducible Fiscal', value: deduciblesSubtotal, color: '#10b981' },
      ...(noDeduciblesSubtotal > 0 ? [{ name: 'No Deducible / Observado', value: noDeduciblesSubtotal, color: '#ef4444' }] : [])
    ];

    // Top Proveedores del periodo
    const provMap = {};
    targetItems.forEach(item => {
      const k = item.emisor || 'Desconocido';
      provMap[k] = (provMap[k] || 0) + (item.total || 0);
    });
    const topProveedoresPeriodo = Object.entries(provMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    return {
      mesesData: meses,
      totalesAnuales: {
        subtotal: sumSubtotal,
        iva: sumIva,
        total: sumTotal,
        count: sumCount
      },
      promedioMensual: {
        total: promTotal,
        subtotal: promSubtotal,
        activeMonths: activeCount
      },
      mesPico: pico,
      deduciblesSubtotal,
      noDeduciblesSubtotal,
      ivaAcreditable,
      mixDeducibilidad,
      topProveedoresPeriodo
    };
  }, [rawList, selectedMonth]);

  // Resumen y agrupación por categorías del periodo actual calculando por PARTIDA / ARTÍCULO
  const categorySummary = useMemo(() => {
    const base = selectedMonth === 'Global' ? rawList : (mesesData[selectedMonth - 1]?.items || []);
    const map = {};
    base.forEach(it => {
      const conceptos = (it.conceptos && it.conceptos.length > 0)
        ? it.conceptos
        : [{ desc: it.emisor, imp: it.subtotal, clave: '' }];

      const subtotalFactura = Number(it.subtotal) || 1;
      const ivaFactura = Number(it.iva) || 0;
      const factorIva = subtotalFactura > 0 ? (ivaFactura / subtotalFactura) : 0.16;

      conceptos.forEach((c, ci) => {
        const cat = getConceptoCat(c, it);
        if (!map[cat.id]) {
          map[cat.id] = { ...cat, total: 0, subtotal: 0, iva: 0, count: 0, conceptosList: [], uuidsSet: new Set() };
        }
        const impPartida = Number(c.subtotal_partida != null ? c.subtotal_partida : (c.imp != null ? c.imp : it.subtotal)) || 0;
        const ivaPartida = Number(c.iva_partida != null ? c.iva_partida : (impPartida * factorIva)) || 0;
        const totalPartida = Number(c.total_partida != null ? c.total_partida : (impPartida + ivaPartida)) || 0;

        map[cat.id].subtotal += impPartida;
        map[cat.id].iva += ivaPartida;
        map[cat.id].total += totalPartida;
        map[cat.id].count += 1;
        if (it.uuid) map[cat.id].uuidsSet.add(it.uuid);

        map[cat.id].conceptosList.push({
          rowId: `${it.uuid || 'cfdi'}_p_${ci}`,
          fecha: it.fecha,
          desc: c.desc || it.emisor,
          clave: c.clave || '—',
          emisor: it.emisor,
          rfc_emisor: it.rfc_emisor || it.raw_cfdi?.emisor_rfc || '',
          metodo: it.metodo,
          forma_pago: it.forma_pago,
          uso_cfdi: it.uso_cfdi,
          es_deducible_fiscal: it.es_deducible_fiscal,
          motivo_no_deducible: it.motivo_no_deducible,
          subtotal: impPartida,
          iva: ivaPartida,
          total: totalPartida,
          concepto_raw: c,
          cfdi_padre: it
        });
      });
    });
    return Object.values(map)
      .map(cat => ({ ...cat, numFacturas: cat.uuidsSet?.size || cat.count }))
      .sort((a, b) => b.total - a.total);
  }, [rawList, selectedMonth, mesesData]);

  // Resumen y agrupación por proveedores del periodo actual
  const providerSummary = useMemo(() => {
    const base = selectedMonth === 'Global' ? rawList : (mesesData[selectedMonth - 1]?.items || []);
    const map = {};
    base.forEach(it => {
      const key = it.emisor || 'Desconocido';
      if (!map[key]) {
        map[key] = { name: key, rfc: it.rfc_emisor || it.raw_cfdi?.emisor_rfc || '', total: 0, subtotal: 0, iva: 0, count: 0, items: [] };
      }
      map[key].total += (it.total || 0);
      map[key].subtotal += (it.subtotal || 0);
      map[key].iva += (it.iva || 0);
      map[key].count += 1;
      map[key].items.push(it);
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [rawList, selectedMonth, mesesData]);

  // Filtrar y ordenar facturas del mes y categoría seleccionados
  const displayItems = useMemo(() => {
    let items = selectedMonth === 'Global'
      ? [...rawList]
      : [...(mesesData[selectedMonth - 1]?.items || [])];

    if (selectedCategory !== 'ALL') {
      if (selectedCategory === 'no_deducible') {
        items = items.filter(it => it.es_deducible_fiscal === false);
      } else {
        items = items.filter(it => getGastoCat(it).id === selectedCategory);
      }
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      items = items.filter(it => {
        const emisor = (it.emisor || '').toLowerCase();
        const rfc = ((it.raw_cfdi?.emisor_rfc) || '').toLowerCase();
        const uuid = (it.uuid || '').toLowerCase();
        const uso = (it.uso_cfdi || '').toLowerCase();
        const catName = (getGastoCat(it).nombre || '').toLowerCase();
        const conceptos = (it.conceptos || []).some(c =>
          (c.desc || '').toLowerCase().includes(q) ||
          (c.desc_sat || '').toLowerCase().includes(q) ||
          (c.clave || '').includes(q)
        );
        return emisor.includes(q) || rfc.includes(q) || uuid.includes(q) || uso.includes(q) || catName.includes(q) || conceptos;
      });
    }

    items.sort((a, b) => {
      if (sortBy === 'fecha_desc') return (b.fecha || '').localeCompare(a.fecha || '');
      if (sortBy === 'fecha_asc') return (a.fecha || '').localeCompare(b.fecha || '');
      if (sortBy === 'monto_desc') return (b.total || 0) - (a.total || 0);
      if (sortBy === 'monto_asc') return (a.total || 0) - (b.total || 0);
      if (sortBy === 'emisor_asc') return (a.emisor || '').localeCompare(b.emisor || '');
      return 0;
    });

    return items;
  }, [rawList, selectedMonth, selectedCategory, mesesData, searchTerm, sortBy]);

  const activeMonthName = selectedMonth === 'Global'
    ? 'Todo el Ejercicio'
    : `${MONTH_NAMES[selectedMonth - 1]} ${year}`;

  const periodItems = useMemo(() => {
    return selectedMonth === 'Global'
      ? rawList
      : (mesesData[selectedMonth - 1]?.items || []);
  }, [rawList, selectedMonth, mesesData]);

  const periodTotal = useMemo(() => periodItems.reduce((acc, it) => acc + (it.total || 0), 0), [periodItems]);
  const periodSubtotal = useMemo(() => periodItems.reduce((acc, it) => acc + (it.subtotal || 0), 0), [periodItems]);
  const periodIva = useMemo(() => periodItems.reduce((acc, it) => acc + (it.iva || 0), 0), [periodItems]);

  const currentSubtotal = displayItems.reduce((acc, it) => acc + (it.subtotal || 0), 0);
  const currentIva = displayItems.reduce((acc, it) => acc + (it.iva || 0), 0);
  const currentTotal = displayItems.reduce((acc, it) => acc + (it.total || 0), 0);

  if (!rawList.length) {
    return (
      <SectionCard title="Gastos y Comprobantes Recibidos" badge="0 comprobantes">
        <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
          No se encontraron facturas ni complementos de egreso registrados para el ejercicio {year || 'seleccionado'}.
        </div>
      </SectionCard>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* ── 0. SELECTOR PRINCIPAL: GASTOS VS NOTAS DE CRÉDITO ── */}
      {notasCreditoData && (notasCreditoData.total > 0 || (notasCreditoData.detalle && notasCreditoData.detalle.length > 0)) && (
        <div style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', padding: '4px', borderRadius: '14px', width: 'fit-content' }}>
          <button
            onClick={() => setActiveSubTab('gastos')}
            style={{
              padding: '8px 18px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '0.85rem',
              transition: 'all 0.2s ease',
              background: activeSubTab === 'gastos' ? '#0f172a' : 'transparent',
              color: activeSubTab === 'gastos' ? '#ffffff' : '#64748b',
              boxShadow: activeSubTab === 'gastos' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none'
            }}
          >
            📉 Compras y Gastos ({rawList.length})
          </button>
          <button
            onClick={() => setActiveSubTab('notas_credito')}
            style={{
              padding: '8px 18px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '0.85rem',
              transition: 'all 0.2s ease',
              background: activeSubTab === 'notas_credito' ? '#0f172a' : 'transparent',
              color: activeSubTab === 'notas_credito' ? '#ffffff' : '#64748b',
              boxShadow: activeSubTab === 'notas_credito' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none'
            }}
          >
            💵 Devoluciones y Reembolsos ({notasCreditoData.detalle?.length || 0}) • {fmt(notasCreditoData.total || 0)}
          </button>
        </div>
      )}

      {activeSubTab === 'notas_credito' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '16px', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '2.25rem' }}>💵</span>
            <div>
              <h4 style={{ margin: 0, color: '#166534', fontSize: '1.05rem', fontWeight: 800 }}>Notas de Crédito y Devoluciones de Proveedores</h4>
              <p style={{ margin: '4px 0 0 0', color: '#15803d', fontSize: '0.85rem' }}>
                CFDIs de tipo <strong>Egreso (E)</strong> recibidos. Representan reembolsos de compras a tus tarjetas o descuentos otorgados por proveedores que disminuyen tus compras acumuladas del ejercicio {year}.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'white', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Total Reembolsos / Bonificaciones</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#059669', marginTop: '4px', fontFamily: 'monospace' }}>
                {fmt(notasCreditoData.total || 0)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>{notasCreditoData.detalle?.length || 0} comprobantes recibidos</div>
            </div>
          </div>

          {/* Conceptos */}
          {(notasCreditoData.resumen_conceptos || []).length > 0 && (
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#334155', fontWeight: 800, textTransform: 'uppercase' }}>
                Conceptos Reembolsados
              </h4>
              <div className="concept-grid">
                {(notasCreditoData.resumen_conceptos || []).map((it, idx) => (
                  <ConceptCard
                    key={idx}
                    title={it.concepto}
                    value={it.importe}
                    accent="amber"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Tabla Detallada */}
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', fontWeight: 800, color: '#0f172a' }}>
              Comprobantes Fiscales de Reembolso / Descuento ({year})
            </div>
            <table className="sat-table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Proveedor / Emisor</th>
                  <th>Concepto Principal</th>
                  <th style={{ textAlign: 'right' }}>Subtotal</th>
                  <th style={{ textAlign: 'right' }}>IVA</th>
                  <th style={{ textAlign: 'right' }}>Total Devuelto</th>
                </tr>
              </thead>
              <tbody>
                {(notasCreditoData.detalle || []).map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ fontFamily: 'monospace' }}>{item.fecha}</td>
                    <td><strong style={{ color: '#0f172a' }}>{item.emisor}</strong></td>
                    <td style={{ color: '#475569', fontSize: '0.85rem' }}>
                      {item.conceptos?.[0]?.desc || 'Devolución / Descuento'}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmt(item.subtotal)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmt(item.iva)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: '#059669' }}>
                      {fmt(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          {/* ── 1. SELECTOR DE MESES TIPO PILLS ── */}
          <div style={{ background: 'white', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>
                📅 Seleccionar Periodo Mensual:
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Periodo Activo: <strong style={{ color: '#0f172a' }}>{activeMonthName}</strong> ({displayItems.length} comprobantes)
              </div>
            </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedMonth('Global')}
            style={{
              padding: '0.55rem 1.1rem',
              borderRadius: '24px',
              cursor: 'pointer',
              border: 'none',
              background: selectedMonth === 'Global' ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : '#f1f5f9',
              color: selectedMonth === 'Global' ? '#ffffff' : '#475569',
              fontWeight: selectedMonth === 'Global' ? 700 : 500,
              fontSize: '0.85rem',
              boxShadow: selectedMonth === 'Global' ? '0 4px 10px rgba(59, 130, 246, 0.35)' : 'none',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🗓️ Todo el Año</span>
            <span style={{ background: selectedMonth === 'Global' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', padding: '1px 6px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
              {rawList.length}
            </span>
          </button>

          {mesesData.map((m) => {
            const isSelected = selectedMonth === m.mes;
            const hasData = m.count > 0;
            return (
              <button
                key={m.mes}
                onClick={() => setSelectedMonth(m.mes)}
                style={{
                  padding: '0.55rem 0.9rem',
                  borderRadius: '24px',
                  cursor: 'pointer',
                  border: isSelected ? 'none' : (hasData ? '1px solid #cbd5e1' : '1px dashed #e2e8f0'),
                  background: isSelected
                    ? 'linear-gradient(135deg, #10b981, #059669)'
                    : (hasData ? '#ffffff' : '#f8fafc'),
                  color: isSelected ? '#ffffff' : (hasData ? '#1e293b' : '#94a3b8'),
                  fontWeight: isSelected ? 700 : (hasData ? 600 : 400),
                  fontSize: '0.85rem',
                  boxShadow: isSelected ? '0 4px 10px rgba(16, 185, 129, 0.35)' : 'none',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <span>{m.shortName}</span>
                {hasData && (
                  <span style={{
                    background: isSelected ? 'rgba(255,255,255,0.25)' : '#e0f2fe',
                    color: isSelected ? '#ffffff' : '#0369a1',
                    padding: '1px 6px',
                    borderRadius: '12px',
                    fontSize: '0.72rem',
                    fontWeight: 700
                  }}>
                    {m.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. KPIS SUPERIORES ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        {[
          {
            label: selectedMonth === 'Global' ? 'Egresos Pagados (Anual)' : `Egresos Pagados (${activeMonthName})`,
            value: fmt(currentTotal),
            color: '#ef4444',
            icon: '💳',
            sub: `${displayItems.length} comprobantes en periodo`
          },
          {
            label: 'Gasto Neto Deducible (Base)',
            value: fmt(currentSubtotal),
            color: '#3b82f6',
            icon: '📉',
            sub: `Subtotal sin IVA trasladado`
          },
          {
            label: 'IVA Acreditable Acumulado',
            value: fmt(currentIva),
            color: '#f59e0b',
            icon: '🏛️',
            sub: `${currentSubtotal > 0 ? ((currentIva / currentSubtotal) * 100).toFixed(1) : 0}% efectividad fiscal`
          },
          {
            label: selectedMonth === 'Global' ? 'Promedio Mensual' : 'Mes Pico Anual',
            value: selectedMonth === 'Global' ? fmt(promedioMensual.total) : `${mesPico.shortName}: ${fmt(mesPico.total)}`,
            color: '#10b981',
            icon: '📊',
            sub: selectedMonth === 'Global' ? `Pico: ${mesPico.shortName} (${fmt(mesPico.total)})` : `Mayor volumen de gasto anual`
          }
        ].map((kpi, idx) => (
          <div key={idx} style={{
            background: 'white',
            borderRadius: '16px',
            padding: '1.25rem 1.5rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>
                {kpi.label}
              </span>
              <span style={{ fontSize: '1.25rem' }}>{kpi.icon}</span>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: kpi.color, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
              {kpi.value}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
              {kpi.sub}
            </div>
          </div>
        ))}
      </div>

      {/* ── 3. GRÁFICA DE EVOLUCIÓN MENSUAL DE EGRESOS ── */}
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', fontWeight: 700 }}>
              📈 Evolución y Flujo de Egresos por Mes ({year})
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              Subtotal Deducible + IVA Acreditable pagado en cada periodo. Haz clic en una barra para filtrar ese mes.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>
            <span>Promedio Mensual: <strong style={{ color: '#10b981' }}>{fmt(promedioMensual.total)}</strong></span>
            <span>Total Anual: <strong style={{ color: '#ef4444' }}>{fmt(totalesAnuales.total)}</strong></span>
          </div>
        </div>

        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer>
            <ComposedChart
              data={mesesData}
              margin={{ top: 15, right: 15, left: 10, bottom: 5 }}
              onClick={(e) => {
                if (e && e.activePayload && e.activePayload.length) {
                  const m = e.activePayload[0].payload.mes;
                  setSelectedMonth(m);
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <defs>
                <linearGradient id="gradEgrSubtotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.7} />
                </linearGradient>
                <linearGradient id="gradEgrIva" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#d97706" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="shortName" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} dy={8} />
              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} dx={-8} />
              <Tooltip
                formatter={(val, name) => [fmt(val), name]}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const row = payload[0].payload;
                    return (
                      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xl text-slate-800 text-xs">
                        <div className="font-bold text-slate-900 mb-1.5 pb-1 border-b border-slate-100">
                          {row.name} ({row.count} comprobantes)
                        </div>
                        <div className="flex justify-between gap-4 py-0.5 text-slate-600">
                          <span>Subtotal Deducible:</span>
                          <strong className="font-mono text-slate-900">{fmt(row.subtotal)}</strong>
                        </div>
                        <div className="flex justify-between gap-4 py-0.5 text-slate-600">
                          <span>IVA Acreditable:</span>
                          <strong className="font-mono text-amber-700">{fmt(row.iva)}</strong>
                        </div>
                        <div className="flex justify-between gap-4 pt-1 mt-1 border-t border-slate-100 font-bold text-slate-900">
                          <span>Total Pagado:</span>
                          <strong className="font-mono">{fmt(row.total)}</strong>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '15px', fontSize: '0.85rem', fontWeight: 600 }} iconType="circle" />
              <ReferenceLine
                y={promedioMensual.total}
                stroke="#10b981"
                strokeDasharray="4 4"
                strokeWidth={2}
                label={{
                  position: 'insideTopLeft',
                  value: `Promedio: ${fmt(promedioMensual.total)}`,
                  fill: '#065f46',
                  fontSize: 12,
                  fontWeight: 800
                }}
              />
              <Bar dataKey="subtotal" stackId="egr" name="Subtotal Deducible" fill="url(#gradEgrSubtotal)" maxBarSize={38} radius={[0, 0, 0, 0]} />
              <Bar dataKey="iva" stackId="egr" name="IVA Acreditable" fill="url(#gradEgrIva)" maxBarSize={38} radius={[4, 4, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── 4. GRÁFICAS DE DISTRIBUCIÓN (Top Proveedores & Mix Uso CFDI) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>

        {/* Top Proveedores */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#334155', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>
            🏢 Concentración por Proveedor ({activeMonthName})
          </h4>
          {topProveedoresPeriodo.length > 0 ? (
            <>
              <div style={{ width: '100%', height: 210 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={topProveedoresPeriodo}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {topProveedoresPeriodo.map((_, idx) => (
                        <Cell key={`prov-cell-${idx}`} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => fmt(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '0.75rem' }}>
                {topProveedoresPeriodo.map((p, idx) => {
                  const pct = currentTotal > 0 ? ((p.value / currentTotal) * 100).toFixed(1) : 0;
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: CHART_COLORS[idx % CHART_COLORS.length], flexShrink: 0 }} />
                        <span style={{ color: '#334155', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', fontFamily: 'monospace' }}>
                        <span style={{ color: '#64748b' }}>{fmt(p.value)}</span>
                        <span style={{ color: '#0f172a', fontWeight: 700, width: '45px', textAlign: 'right' }}>{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              Sin datos para este periodo
            </div>
          )}
        </div>

        {/* Deducibilidad Fiscal e IVA */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#334155', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>
            🛡️ Deducibilidad e IVA Acreditable ({activeMonthName})
          </h4>
          {mixDeducibilidad.length > 0 ? (
            <>
              <div style={{ width: '100%', height: 210 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={mixDeducibilidad}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={mixDeducibilidad.length > 1 ? 4 : 0}
                      dataKey="value"
                      stroke="none"
                    >
                      {mixDeducibilidad.map((entry, idx) => (
                        <Cell key={`ded-cell-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => fmt(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', padding: '6px 10px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
                    <span style={{ color: '#166534', fontWeight: 700 }}>Deducible Fiscal (Art. 27):</span>
                  </div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 800, color: '#15803d' }}>
                    {fmt(deduciblesSubtotal)}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', padding: '6px 10px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
                    <span style={{ color: '#1e40af', fontWeight: 700 }}>IVA Acreditable al SAT:</span>
                  </div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 800, color: '#2563eb' }}>
                    {fmt(ivaAcreditable)}
                  </div>
                </div>

                {noDeduciblesSubtotal > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', padding: '6px 10px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                      <span style={{ color: '#991b1b', fontWeight: 700 }}>No Deducible / Efectivo:</span>
                    </div>
                    <div style={{ fontFamily: 'monospace', fontWeight: 800, color: '#dc2626' }}>
                      {fmt(noDeduciblesSubtotal)}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              Sin datos para este periodo
            </div>
          )}
        </div>
      </div>

      {/* ── 5. TABLA MATRIZ ANUAL (12 MESES) ── */}
      <SectionCard
        icon="🗓️"
        title="Matriz de Egresos Mensuales (12 Meses)"
        badge={`${totalesAnuales.count} facturas | Total: ${fmt(totalesAnuales.total)}`}
      >
        <div className="table-responsive">
          <table className="sat-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th style={{ width: '140px' }}>Mes</th>
                <th style={{ width: '110px' }} className="text-center">Comprobantes</th>
                <th className="text-right" style={{ width: '140px' }}>Deducible Fiscal</th>
                <th className="text-right" style={{ width: '120px' }}>No Deducible</th>
                <th className="text-right" style={{ width: '130px' }}>Subtotal Disco</th>
                <th className="text-right" style={{ width: '120px' }}>IVA Acreditable</th>
                <th className="text-right" style={{ width: '130px' }}>Total Pagado</th>
                <th style={{ width: '110px' }} className="text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {mesesData.map((m) => {
                const isCurrentActive = selectedMonth === m.mes;
                const subDed = m.subtotalDeducible || 0;
                const subNoDed = m.subtotalNoDeducible || 0;

                return (
                  <tr
                    key={m.mes}
                    style={{
                      backgroundColor: isCurrentActive ? '#eff6ff' : 'transparent',
                      fontWeight: isCurrentActive ? 600 : 'normal'
                    }}
                  >
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: m.count > 0 ? '#10b981' : '#cbd5e1' }} />
                        <strong style={{ color: '#0f172a' }}>{m.name}</strong>
                      </span>
                    </td>
                    <td className="text-center">
                      {m.count > 0 ? (
                        <span className="sat-badge sat-badge-blue">{m.count} docs</span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>0</span>
                      )}
                    </td>
                    <td className="text-right mono font-bold" style={{ color: subDed > 0 ? '#059669' : '#94a3b8' }}>
                      {fmt(subDed)}
                    </td>
                    <td className="text-right mono" style={{ color: subNoDed > 0 ? '#dc2626' : '#94a3b8', fontSize: '0.8rem' }}>
                      {subNoDed > 0 ? `⚠️ ${fmt(subNoDed)}` : '—'}
                    </td>
                    <td className="text-right mono font-medium" style={{ color: m.subtotal > 0 ? '#1e293b' : '#94a3b8' }}>
                      {fmt(m.subtotal)}
                    </td>
                    <td className="text-right mono" style={{ color: (m.ivaAcreditableFiscal || m.iva) > 0 ? '#2563eb' : '#94a3b8' }}>
                      {fmt(m.ivaAcreditableFiscal || m.iva)}
                    </td>
                    <td className="text-right mono font-medium" style={{ color: m.total > 0 ? '#0f172a' : '#94a3b8' }}>
                      {fmt(m.total)}
                    </td>
                    <td className="text-center">
                      {m.count > 0 && (
                        <button
                          onClick={() => setSelectedMonth(m.mes)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: isCurrentActive ? '1px solid #3b82f6' : '1px solid #cbd5e1',
                            background: isCurrentActive ? '#3b82f6' : '#ffffff',
                            color: isCurrentActive ? '#ffffff' : '#334155',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            transition: 'all 0.2s'
                          }}
                        >
                          {isCurrentActive ? '✓ Viendo' : 'Ver Mes'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f8fafc', fontWeight: 800, borderTop: '2px solid #cbd5e1' }}>
                <td>TOTAL ANUAL</td>
                <td className="text-center">{totalesAnuales.count} facturas</td>
                <td className="text-right mono font-bold" style={{ color: '#059669' }}>
                  {fmt(mesesData.reduce((s, m) => s + (m.subtotalDeducible || 0), 0))}
                </td>
                <td className="text-right mono" style={{ color: '#dc2626' }}>
                  {fmt(mesesData.reduce((s, m) => s + (m.subtotalNoDeducible || 0), 0))}
                </td>
                <td className="text-right mono" style={{ color: '#1e293b' }}>{fmt(totalesAnuales.subtotal)}</td>
                <td className="text-right mono" style={{ color: '#2563eb' }}>
                  {fmt(mesesData.reduce((s, m) => s + (m.ivaAcreditableFiscal || m.iva || 0), 0))}
                </td>
                <td className="text-right mono font-medium" style={{ color: '#0f172a', fontSize: '1rem' }}>{fmt(totalesAnuales.total)}</td>
                <td style={{ textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
                  Total Egresos
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </SectionCard>

      {/* ── 6. VISTAS Y AGRUPACIÓN DE GASTOS ── */}
      <SectionCard
        icon="📊"
        title={`Explorador y Agrupación de Gastos: ${activeMonthName}`}
        badge={`${displayItems.length} comprobantes filtrados • ${fmt(currentTotal)}`}
      >
        {/* Barra superior de Modos de Visualización y Búsqueda */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>

          {/* Selector de Modo de Vista */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '12px', gap: '4px' }}>
            {[
              { id: 'categoria', label: '📁 Por Rubro / Categoría', desc: 'Agrupado por tipo de gasto' },
              { id: 'proveedor', label: '🏢 Por Proveedor', desc: 'Agrupado por emisor / RFC' },
              { id: 'lista', label: '📋 Lista Cronológica', desc: 'Tabla plana con todas las facturas' }
            ].map(vm => (
              <button
                key={vm.id}
                onClick={() => setViewMode(vm.id)}
                title={vm.desc}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: viewMode === vm.id ? 800 : 600,
                  cursor: 'pointer',
                  background: viewMode === vm.id ? '#0f172a' : 'transparent',
                  color: viewMode === vm.id ? '#ffffff' : '#64748b',
                  transition: 'all 0.15s ease',
                  boxShadow: viewMode === vm.id ? '0 2px 6px rgba(0,0,0,0.12)' : 'none'
                }}
              >
                {vm.label}
              </button>
            ))}
          </div>

          {/* Buscador y Exportación */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, justifyContent: 'flex-end', minWidth: '280px' }}>
            <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '380px' }}>
              <input
                type="text"
                placeholder="🔍 Filtrar por artículo, clave SAT, proveedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.9rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', fontWeight: 800 }}
                >
                  ✖
                </button>
              )}
            </div>

            <CsvExportButton
              onClick={() => exportEgresos(displayItems, year, activeMonthName)}
              label={`Exportar (${displayItems.length})`}
              count={displayItems.length}
            />
          </div>
        </div>

        {/* ── MODO 1: MAESTRO-DETALLE (POR RUBRO SAT A NIVEL DE PARTIDAS/ARTÍCULOS) ── */}
        {viewMode === 'categoria' && (() => {
          const allConceptosList = categorySummary.flatMap(c => c.conceptosList || []);

          const activeCat = selectedCategory === 'ALL'
            ? {
                id: 'ALL',
                nombre: 'Todos los Artículos y Conceptos',
                icono: '✨',
                color: '#0f172a',
                conceptosList: allConceptosList,
                total: periodTotal,
                subtotal: periodSubtotal,
                iva: periodIva,
                count: allConceptosList.length,
                numFacturas: periodItems.length
              }
            : (categorySummary.find(c => c.id === selectedCategory) || {
                id: selectedCategory,
                nombre: 'Rubro Seleccionado',
                icono: '📋',
                color: '#0f172a',
                conceptosList: [],
                total: 0,
                subtotal: 0,
                iva: 0,
                count: 0,
                numFacturas: 0
              });

          const filteredConceptos = (activeCat.conceptosList || []).filter(p => {
            if (!searchTerm.trim()) return true;
            const q = searchTerm.toLowerCase().trim();
            const desc = (p.desc || '').toLowerCase();
            const clave = (p.clave || '').toLowerCase();
            const emisor = (p.emisor || '').toLowerCase();
            const rfc = (p.rfc_emisor || '').toLowerCase();
            const uuid = (p.cfdi_padre?.uuid || '').toLowerCase();
            return desc.includes(q) || clave.includes(q) || emisor.includes(q) || rfc.includes(q) || uuid.includes(q);
          });

          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: '1.25rem', alignItems: 'start' }}>

              {/* ── PANEL IZQUIERDO: LISTA DE RUBROS SAT (MAESTRO) ── */}
              <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>

                {/* Cabecera del Panel Izquierdo */}
                <div style={{ padding: '0.9rem 1.1rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Rubros SAT
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                    {categorySummary.length} categorías
                  </span>
                </div>

                {/* Lista de Tarjetas de Categoría */}
                <div style={{ maxHeight: '640px', overflowY: 'auto', padding: '0.4rem' }}>

                  {/* Opción 1: Todos los Gastos (Global Periodo) */}
                  <div
                    onClick={() => setSelectedCategory('ALL')}
                    style={{
                      padding: '0.75rem 0.9rem',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      background: selectedCategory === 'ALL' ? '#0f172a' : 'transparent',
                      color: selectedCategory === 'ALL' ? '#ffffff' : '#0f172a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '4px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.2rem' }}>✨</span>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>Todos los Artículos</div>
                        <div style={{ fontSize: '0.7rem', color: selectedCategory === 'ALL' ? '#94a3b8' : '#64748b' }}>
                          {periodItems.length} facturas • {allConceptosList.length} partidas
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontWeight: 800, fontFamily: 'monospace', fontSize: '0.88rem' }}>
                      {fmt(periodTotal)}
                    </div>
                  </div>

                  {/* Opción 2: Alerta de No Deducibles */}
                  {noDeduciblesSubtotal > 0 && (
                    <div
                      onClick={() => setSelectedCategory('no_deducible')}
                      style={{
                        padding: '0.75rem 0.9rem',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        background: selectedCategory === 'no_deducible' ? '#fee2e2' : 'transparent',
                        borderLeft: selectedCategory === 'no_deducible' ? '4px solid #ef4444' : '4px solid transparent',
                        color: '#991b1b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '4px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>No Deducibles</div>
                          <div style={{ fontSize: '0.7rem', opacity: 0.85 }}>Efectivo 01 &gt; $2,000</div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }} />

                  {/* Lista de Categorías */}
                  {categorySummary.map(cat => {
                    const isSelected = selectedCategory === cat.id;
                    const pctGasto = periodTotal > 0 ? (cat.total / periodTotal) * 100 : 0;

                    return (
                      <div
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        style={{
                          padding: '0.75rem 0.9rem',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          background: isSelected ? '#eff6ff' : 'transparent',
                          borderLeft: isSelected ? '4px solid #3b82f6' : '4px solid transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '4px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                          <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{cat.icono}</span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: isSelected ? 800 : 600, fontSize: '0.82rem', color: isSelected ? '#1d4ed8' : '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {cat.nombre}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{cat.count} partidas ({cat.numFacturas} facturas)</span>
                              <span>•</span>
                              <span>{pctGasto.toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: '8px' }}>
                          <div style={{ fontWeight: 800, fontFamily: 'monospace', fontSize: '0.85rem', color: isSelected ? '#1d4ed8' : '#0f172a' }}>
                            {fmt(cat.total)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── PANEL DERECHO: DETALLE DE ARTÍCULOS Y CONCEPTOS (DETALLE) ── */}
              <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column' }}>

                {/* Cabecera del Panel Detalle */}
                <div style={{ padding: '1.25rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.8rem', background: '#ffffff', padding: '6px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>{activeCat.icono}</span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', fontWeight: 800 }}>{activeCat.nombre}</h3>
                        <span style={{ background: '#e2e8f0', color: '#475569', fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: '12px' }}>
                          {filteredConceptos.length} artículos / partidas
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px', display: 'flex', gap: '12px' }}>
                        <span>Subtotal Partidas: <strong style={{ color: '#1e293b' }}>{fmt(activeCat.subtotal)}</strong></span>
                        <span>IVA Acreditable: <strong style={{ color: '#2563eb' }}>{fmt(activeCat.iva)}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Total Rubro</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', fontFamily: 'monospace' }}>
                      {fmt(activeCat.total)}
                    </div>
                  </div>
                </div>

                {/* Tabla de Artículos / Partidas */}
                <div className="table-responsive" style={{ maxHeight: '640px', overflowY: 'auto' }}>
                  <table className="sat-table" style={{ margin: 0, fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ background: '#ffffff', position: 'sticky', top: 0, zIndex: 2, borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                        <th style={{ width: '30px' }}></th>
                        <th style={{ width: '95px' }}>Fecha</th>
                        <th>Artículo / Concepto Facturado</th>
                        <th style={{ width: '85px' }}>Clave SAT</th>
                        <th>Proveedor / Emisor</th>
                        <th style={{ width: '100px' }}>Deducibilidad</th>
                        <th className="text-right" style={{ width: '95px' }}>Subtotal</th>
                        <th className="text-right" style={{ width: '80px' }}>IVA</th>
                        <th className="text-right" style={{ width: '95px' }}>Total</th>
                        <th className="text-center" style={{ width: '75px' }}>CFDI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredConceptos.length === 0 ? (
                        <tr>
                          <td colSpan={10} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔍</div>
                            <div>No se encontraron artículos o partidas para este rubro o filtro</div>
                          </td>
                        </tr>
                      ) : (
                        filteredConceptos.map((partida, idx) => {
                          const rowId = partida.rowId || `part-${idx}`;
                          const isRowExp = expandedRows[rowId];
                          const isDed = partida.es_deducible_fiscal !== false;
                          const cfdiPadre = partida.cfdi_padre;

                          return (
                            <React.Fragment key={rowId}>
                              <tr
                                onClick={() => toggleRow(rowId)}
                                style={{
                                  cursor: 'pointer',
                                  background: isRowExp ? '#f8fafc' : (isDed ? '#ffffff' : '#fffbeb'),
                                  borderBottom: isRowExp ? 'none' : '1px solid #f1f5f9'
                                }}
                              >
                                <td style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.65rem' }}>
                                  {isRowExp ? '▼' : '▶'}
                                </td>
                                <td style={{ fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>{partida.fecha}</td>
                                <td>
                                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{partida.desc}</div>
                                </td>
                                <td>
                                  <span style={{ fontFamily: 'monospace', color: '#475569', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>
                                    {partida.clave}
                                  </span>
                                </td>
                                <td>
                                  <div style={{ fontWeight: 600, color: '#334155' }}>{partida.emisor}</div>
                                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{partida.rfc_emisor}</div>
                                </td>
                                <td>
                                  {isDed ? (
                                    <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 700 }}>✓ Deducible</span>
                                  ) : (
                                    <span style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: 800 }}>⚠️ Efectivo 01</span>
                                  )}
                                </td>
                                <td className="text-right mono">{fmt(partida.subtotal)}</td>
                                <td className="text-right mono" style={{ color: '#2563eb' }}>{fmt(partida.iva)}</td>
                                <td className="text-right mono font-bold" style={{ color: '#0f172a' }}>{fmt(partida.total)}</td>
                                <td className="text-center" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => cfdiPadre?.raw_cfdi && setSelectedCfdi(cfdiPadre.raw_cfdi)}
                                    title="Ver CFDI completo en visor oficial"
                                    style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', fontSize: '0.7rem', fontWeight: 800, padding: '3px 8px', borderRadius: '4px', cursor: 'pointer' }}
                                  >
                                    🔍 CFDI
                                  </button>
                                </td>
                              </tr>

                              {/* Drill-Down del CFDI Origen */}
                              {isRowExp && (
                                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                                  <td colSpan={10} style={{ padding: '1rem 1.5rem' }}>
                                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem' }}>

                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                                        <div>
                                          <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#0f172a' }}>
                                            📄 CFDI Origen: {cfdiPadre?.emisor} ({cfdiPadre?.rfc_emisor || cfdiPadre?.raw_cfdi?.emisor_rfc || 'Sin RFC'})
                                          </span>
                                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                                            <b>UUID:</b> <span style={{ fontFamily: 'monospace', color: '#1d4ed8' }}>{cfdiPadre?.uuid || 'N/D'}</span> • <b>Método:</b> {cfdiPadre?.metodo || 'PUE'} • <b>Forma Pago:</b> {cfdiPadre?.forma_pago || 'N/D'} • <b>Uso:</b> {cfdiPadre?.uso_cfdi || 'N/D'} • <b>Total CFDI:</b> {fmt(cfdiPadre?.total || partida.total)}
                                          </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '6px' }}>
                                          <button
                                            onClick={() => cfdiPadre?.raw_cfdi && setSelectedCfdi(cfdiPadre.raw_cfdi)}
                                            style={{ padding: '4px 10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                                          >
                                            Ver CFDI Completo
                                          </button>
                                          <button
                                            onClick={() => cfdiPadre?.raw_cfdi && setViewingXml(cfdiPadre.raw_cfdi)}
                                            style={{ padding: '4px 10px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                                          >
                                            Ver XML
                                          </button>
                                        </div>
                                      </div>

                                      {/* Desglose de todas las partidas de este CFDI si tiene más de una */}
                                      {cfdiPadre?.conceptos && cfdiPadre.conceptos.length > 1 && (
                                        <div style={{ marginTop: '10px' }}>
                                          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '4px', textTransform: 'uppercase' }}>
                                            Todas las partidas de esta factura ({cfdiPadre.conceptos.length}):
                                          </div>
                                          <table style={{ width: '100%', fontSize: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                                            <thead>
                                              <tr style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.68rem' }}>
                                                <th style={{ padding: '3px 8px', textAlign: 'left' }}>Clave SAT</th>
                                                <th style={{ padding: '3px 8px', textAlign: 'left' }}>Concepto</th>
                                                <th style={{ padding: '3px 8px', textAlign: 'left' }}>Rubro</th>
                                                <th style={{ padding: '3px 8px', textAlign: 'right' }}>Importe</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {cfdiPadre.conceptos.map((c, ci) => {
                                                const cCat = getConceptoCat(c, cfdiPadre);
                                                const isCurrentPartida = c.desc === partida.desc;
                                                return (
                                                  <tr key={ci} style={{ borderBottom: '1px solid #e2e8f0', background: isCurrentPartida ? '#eff6ff' : 'transparent' }}>
                                                    <td style={{ padding: '4px 8px', fontFamily: 'monospace', color: '#64748b' }}>{c.clave || '—'}</td>
                                                    <td style={{ padding: '4px 8px', color: '#0f172a', fontWeight: isCurrentPartida ? 700 : 400 }}>
                                                      {c.desc} {isCurrentPartida && '👈 (Esta partida)'}
                                                    </td>
                                                    <td style={{ padding: '4px 8px', color: cCat.color || '#475569', fontWeight: 600 }}>
                                                      {cCat.icono} {cCat.nombre}
                                                    </td>
                                                    <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>
                                                      {fmt(c.subtotal_partida != null ? c.subtotal_partida : c.imp)}
                                                    </td>
                                                  </tr>
                                                );
                                              })}
                                            </tbody>
                                          </table>
                                        </div>
                                      )}

                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          );
        })()}

        {/* ── MODO 2: AGRUPADO POR PROVEEDOR ── */}
        {viewMode === 'proveedor' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {providerSummary
              .filter(prov => {
                if (!searchTerm) return true;
                const q = searchTerm.toLowerCase();
                return prov.name.toLowerCase().includes(q) || prov.rfc.toLowerCase().includes(q);
              })
              .map((prov, pIdx) => {
                const isProvExp = expandedProviders[prov.name] !== false;
                const pctGasto = currentTotal > 0 ? ((prov.total / currentTotal) * 100).toFixed(1) : 0;

                return (
                  <div key={pIdx} style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <div
                      onClick={() => toggleProvider(prov.name)}
                      style={{
                        padding: '1rem 1.25rem',
                        background: '#f8fafc',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        borderBottom: isProvExp ? '1px solid #e2e8f0' : 'none',
                        flexWrap: 'wrap',
                        gap: '0.75rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.3rem' }}>🏢</span>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{prov.name}</strong>
                            <span style={{ fontSize: '0.72rem', background: '#e2e8f0', color: '#475569', padding: '2px 8px', borderRadius: '10px', fontWeight: 800 }}>
                              {prov.count} facturas
                            </span>
                            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>({pctGasto}% del gasto)</span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                            RFC: {prov.rfc || 'N/A'} • Subtotal: {fmt(prov.subtotal)} • IVA: {fmt(prov.iva)}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Total Facturado</div>
                          <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', fontFamily: 'monospace' }}>
                            {fmt(prov.total)}
                          </div>
                        </div>
                        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{isProvExp ? '▲' : '▼'}</span>
                      </div>
                    </div>

                    {isProvExp && (
                      <div className="table-responsive">
                        <table className="sat-table" style={{ margin: 0, fontSize: '0.82rem' }}>
                          <thead>
                            <tr style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                              <th style={{ width: '100px' }}>Fecha</th>
                              <th>Rubro / Concepto Principal</th>
                              <th style={{ width: '100px' }}>Método</th>
                              <th style={{ width: '120px' }}>Estatus</th>
                              <th className="text-right" style={{ width: '110px' }}>Subtotal</th>
                              <th className="text-right" style={{ width: '90px' }}>IVA</th>
                              <th className="text-right" style={{ width: '110px' }}>Total</th>
                              <th className="text-center" style={{ width: '80px' }}>Acción</th>
                            </tr>
                          </thead>
                          <tbody>
                            {prov.items.map((item, idx) => {
                              const cat = getGastoCat(item);
                              return (
                                <tr key={idx}>
                                  <td style={{ fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>{item.fecha}</td>
                                  <td>
                                    <span style={{ fontSize: '0.72rem', background: '#f1f5f9', color: cat.color, padding: '2px 6px', borderRadius: '4px', fontWeight: 700, marginRight: '6px' }}>
                                      {cat.icono} {cat.nombre}
                                    </span>
                                    <span style={{ color: '#475569', fontSize: '0.8rem' }}>
                                      {item.conceptos?.[0]?.desc || 'Gasto operativo'}
                                    </span>
                                  </td>
                                  <td>
                                    <span className={`sat-badge ${item.metodo === 'PUE' ? 'sat-badge-green' : 'sat-badge-blue'}`} style={{ fontSize: '0.68rem' }}>
                                      {item.metodo}
                                    </span>
                                  </td>
                                  <td>
                                    {item.es_deducible_fiscal !== false ? (
                                      <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 700 }}>✓ Deducible</span>
                                    ) : (
                                      <span style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: 800 }}>⚠️ No Deducible</span>
                                    )}
                                  </td>
                                  <td className="text-right mono">{fmt(item.subtotal)}</td>
                                  <td className="text-right mono" style={{ color: '#2563eb' }}>{fmt(item.iva)}</td>
                                  <td className="text-right mono font-bold" style={{ color: '#0f172a' }}>{fmt(item.total)}</td>
                                  <td className="text-center">
                                    <button
                                      onClick={() => item.raw_cfdi && setSelectedCfdi(item.raw_cfdi)}
                                      style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', fontSize: '0.7rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                      🔍 CFDI
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {/* ── MODO 3: LISTA CRONOLÓGICA PLANA ── */}
        {viewMode === 'lista' && (
          <div className="table-responsive">
            <table className="sat-table" style={{ margin: 0, fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ width: '30px' }}></th>
                  <th style={{ width: '105px' }}>Fecha</th>
                  <th>Proveedor / Emisor</th>
                  <th style={{ width: '170px' }}>Rubro / Categoría</th>
                  <th style={{ width: '130px' }}>Estatus Fiscal</th>
                  <th className="text-right" style={{ width: '110px' }}>Subtotal Base</th>
                  <th className="text-right" style={{ width: '95px' }}>IVA</th>
                  <th className="text-right" style={{ width: '115px' }}>Total Pagado</th>
                  <th className="text-center" style={{ width: '80px' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {displayItems.map((item, idx) => {
                  const rowId = item.uuid || `egr-${idx}`;
                  const isExpanded = expandedRows[rowId];
                  const isDed = item.es_deducible_fiscal !== false;
                  const cat = getGastoCat(item);

                  return (
                    <React.Fragment key={rowId}>
                      <tr
                        onClick={() => toggleRow(rowId)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: isExpanded ? '#f8fafc' : (isDed ? '#ffffff' : '#fffbeb'),
                          borderBottom: isExpanded ? 'none' : '1px solid #f1f5f9',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        <td style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem' }}>
                          {isExpanded ? '▼' : '▶'}
                        </td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>
                          {item.fecha}
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.emisor}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace' }}>
                            {item.raw_cfdi?.emisor_rfc || ''}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.75rem', background: '#f1f5f9', color: cat.color, border: `1px solid ${cat.color}33`, padding: '3px 8px', borderRadius: '6px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <span>{cat.icono}</span>
                            <span>{cat.nombre}</span>
                          </span>
                        </td>
                        <td>
                          {isDed ? (
                            <span style={{ fontSize: '0.72rem', background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>
                              ✓ Deducible
                            </span>
                          ) : (
                            <span
                              title={item.motivo_no_deducible || 'Pago en Efectivo'}
                              style={{ fontSize: '0.72rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}
                            >
                              ⚠️ Efectivo 01
                            </span>
                          )}
                        </td>
                        <td className="text-right mono font-medium" style={{ color: isDed ? '#1e293b' : '#94a3b8' }}>
                          {fmt(item.subtotal)}
                        </td>
                        <td className="text-right mono" style={{ color: isDed ? '#2563eb' : '#94a3b8' }}>
                          {fmt(item.iva)}
                        </td>
                        <td className="text-right mono font-bold" style={{ color: '#0f172a' }}>
                          {fmt(item.total)}
                        </td>
                        <td className="text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              if (item.raw_cfdi) setSelectedCfdi(item.raw_cfdi);
                            }}
                            style={{
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              color: '#1d4ed8',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                          >
                            🔍 CFDI
                          </button>
                        </td>
                      </tr>

                      {/* Fila expandible */}
                      {isExpanded && (
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                          <td colSpan={9} style={{ padding: '1rem 1.5rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                                  <b>UUID Fiscal:</b> <span style={{ fontFamily: 'monospace', color: '#1d4ed8' }}>{item.uuid || 'N/A'}</span>
                                  {item.forma_pago && <span style={{ marginLeft: '12px' }}><b>Forma de Pago:</b> {item.forma_pago}</span>}
                                  {item.uso_cfdi && <span style={{ marginLeft: '12px' }}><b>Uso CFDI:</b> {item.uso_cfdi}</span>}
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button
                                    onClick={() => item.raw_cfdi && setSelectedCfdi(item.raw_cfdi)}
                                    style={{ padding: '4px 10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                                  >
                                    Ver Detalle Fiscal
                                  </button>
                                  <button
                                    onClick={() => item.raw_cfdi && setViewingXml(item.raw_cfdi)}
                                    style={{ padding: '4px 10px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                                  >
                                    Ver XML Original
                                  </button>
                                </div>
                              </div>

                              {item.conceptos && item.conceptos.length > 0 ? (
                                <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', margin: 0 }}>
                                    <thead>
                                      <tr style={{ background: '#f1f5f9', color: '#475569', fontWeight: 700 }}>
                                        <th style={{ padding: '6px 12px', textAlign: 'left' }}>Clave SAT</th>
                                        <th style={{ padding: '6px 12px', textAlign: 'left' }}>Descripción del Concepto</th>
                                        <th style={{ padding: '6px 12px', textAlign: 'right' }}>Importe</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {item.conceptos.map((c, cIdx) => (
                                        <tr key={cIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                          <td style={{ padding: '6px 12px', fontFamily: 'monospace', color: '#64748b' }}>{c.clave || '—'}</td>
                                          <td style={{ padding: '6px 12px', color: '#0f172a' }}>{c.desc || 'Sin descripción'}</td>
                                          <td style={{ padding: '6px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{fmt(c.imp)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                  Sin desglose individual de conceptos en el CFDI.
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {displayItems.length === 0 && (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '12px' }}>
            No se encontraron comprobantes que coincidan con los filtros seleccionados.
          </div>
        )}
      </SectionCard>
        </>
      )}

      {/* Modales */}
      {selectedCfdi && <CfdiVisualizerModal cfdi={selectedCfdi} onClose={() => setSelectedCfdi(null)} />}
      {viewingXml && <XmlViewerModal data={viewingXml} onClose={() => setViewingXml(null)} />}
    </div>
  );
}
