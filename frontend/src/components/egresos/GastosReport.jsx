import React, { useState, useMemo } from 'react';
import { SectionCard, CsvExportButton, MONTH_NAMES, fmt } from '../ui/Primitives';
import { InteractableRow } from './InteractableRow';
import { CfdiVisualizerModal } from '../ui/Modals';
import { exportEgresos } from '../../csvExport';

export const GastosReport = ({ data, year }) => {
  const [groupBy, setGroupBy] = useState('emisor');
  const [selectedCfdi, setSelectedCfdi] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});

  const toggleGroup = (idx) => {
    setExpandedGroups(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const groupedData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];

    const groups = data.reduce((acc, curr) => {
      let key = 'Sin Clasificar';
      if (groupBy === 'mes') {
        const m = curr.fecha ? parseInt(curr.fecha.split('-')[1], 10) : null;
        key = (m && m >= 1 && m <= 12) ? `${MONTH_NAMES[m - 1]} (${curr.fecha.slice(0, 7)})` : 'Fecha No Definida';
      } else {
        key = curr[groupBy] || 'Sin Clasificar';
      }

      if (!acc[key]) acc[key] = { key, subtotal: 0, iva: 0, total: 0, items: [], mesNum: curr.fecha ? parseInt(curr.fecha.split('-')[1], 10) : 99 };
      acc[key].subtotal += curr.subtotal;
      acc[key].iva += curr.iva;
      acc[key].total += curr.total;
      acc[key].items.push(curr);
      return acc;
    }, {});

    const list = Object.values(groups);
    if (groupBy === 'mes') {
      list.sort((a, b) => a.mesNum - b.mesNum);
    } else {
      list.sort((a, b) => b.subtotal - a.subtotal);
    }

    return list.map(g => {
      g.items.sort((a, b) => b.fecha.localeCompare(a.fecha));
      return g;
    });
  }, [data, groupBy]);

  if (!data?.length) return <SectionCard icon="📈" title="Reporte Detallado de Egresos" badge="0">No hay gastos deducibles registrados en este periodo.</SectionCard>;

  const totalSubtotal = data.reduce((s, d) => s + d.subtotal, 0);
  const totalIva = data.reduce((s, d) => s + d.iva, 0);

  return (
    <>
      <SectionCard icon="📈" title="Reporte Detallado de Egresos (Negocio)" badge={`${data.length} comprobantes`}>

      {/* Controles de Agrupación y KPI Globales */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            className={`pill ${groupBy === 'emisor' ? 'pill-blue' : 'pill-gray'}`}
            onClick={() => setGroupBy('emisor')}
            style={{ cursor: 'pointer', border: 'none', transition: 'all 0.2s', padding: '0.5rem 1rem' }}
          >
            🏢 Agrupar por Proveedor / Emisor
          </button>
          <button
            className={`pill ${groupBy === 'mes' ? 'pill-blue' : 'pill-gray'}`}
            onClick={() => setGroupBy('mes')}
            style={{ cursor: 'pointer', border: 'none', transition: 'all 0.2s', padding: '0.5rem 1rem' }}
          >
            📅 Agrupar por Mes
          </button>
          <button
            className={`pill ${groupBy === 'uso_cfdi' ? 'pill-blue' : 'pill-gray'}`}
            onClick={() => setGroupBy('uso_cfdi')}
            style={{ cursor: 'pointer', border: 'none', transition: 'all 0.2s', padding: '0.5rem 1rem' }}
          >
            🏷️ Agrupar por Cuenta / Uso CFDI
          </button>
          <CsvExportButton
            onClick={() => exportEgresos(data, year, 'Detalle')}
            label="Exportar CSV"
            count={data.length}
          />
        </div>
        <div style={{ textAlign: 'right', background: '#f8fafc', padding: '0.75rem 1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '4px' }}>
            Gasto Autorizado Acumulado: <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '1rem' }}>{fmt(totalSubtotal)}</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
            IVA Acreditable Acumulado: <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '1rem' }}>{fmt(totalIva)}</span>
          </div>
        </div>
      </div>

      {groupedData.map((g, idx) => (
        <div key={idx} style={{ marginBottom: '2rem', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
          <div
            onClick={() => toggleGroup(idx)}
            style={{ backgroundColor: '#f1f5f9', padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', cursor: 'pointer', transition: 'background-color 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
          >
            <div>
              <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#1e293b', fontWeight: 600 }}>
                {expandedGroups[idx] ? '▼' : '▶'} {g.key}
              </h4>
              <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '1.25rem' }}>{g.items.length} movimientos</span>
            </div>
            <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem' }}>
              <div><span style={{ color: '#64748b', marginRight: '6px' }}>Subtotal Base:</span><strong style={{ color: '#0f172a' }}>{fmt(g.subtotal)}</strong></div>
              <div><span style={{ color: '#64748b', marginRight: '6px' }}>IVA:</span><strong style={{ color: '#0f172a' }}>{fmt(g.iva)}</strong></div>
              <div><span style={{ color: '#64748b', marginRight: '6px' }}>Total Pagado:</span><strong style={{ color: '#0f172a' }}>{fmt(g.total)}</strong></div>
            </div>
          </div>
          {expandedGroups[idx] && (
            <div className="table-responsive">
              <table className="sat-table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th style={{ width: '120px' }}>Fecha</th>
                    <th>{groupBy === 'emisor' ? 'Uso CFDI' : 'Emisor'}</th>
                    <th style={{ width: '100px' }}>Método</th>
                    <th className="text-right" style={{ width: '130px' }}>Base</th>
                    <th className="text-right" style={{ width: '110px' }}>IVA</th>
                    <th className="text-right" style={{ width: '130px' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {g.items.map((item, i) => (
                    <InteractableRow key={i} item={item} groupBy={groupBy} onViewCfdi={setSelectedCfdi} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
      </SectionCard>

      <CfdiVisualizerModal cfdi={selectedCfdi} onClose={() => setSelectedCfdi(null)} />
    </>
  );
};
