import React, { useState } from 'react';
import { SectionCard, KpiRow, fmt } from '../ui/Primitives';

export function InteresesSection({ data }) {
  const [showDetail, setShowDetail] = useState(false);
  if (!data) return null;
  return (
    <SectionCard icon="🏦" title="Intereses">
      <div
        onClick={() => setShowDetail(!showDetail)}
        style={{ cursor: 'pointer', transition: 'background 0.2s' }}
        className="collapsible-header-card"
        onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <p className="sec-note">
          Intereses generados por instituciones del sistema financiero.
          El ISR es retenido directamente por el banco y solo los intereses reales son acumulables.
          <span style={{ visibility: 'visible', marginLeft: '0.5rem', fontWeight: 'bold' }}>
            {showDetail ? '▼ Ocultar detalle' : '▶ Ver detalle de movimientos'}
          </span>
        </p>
        <KpiRow items={[
          { label: 'Intereses nominales', value: data.nominal || 0, help: 'Informativo' },
          { label: 'Intereses reales', value: data.real || 0, help: 'Acumulables a la base gravable' },
          { label: 'ISR retenido', value: data.isr_retenido || 0, accent: 'kpi-danger', help: 'Acreditable contra ISR del ejercicio' },
        ]} />
      </div>

      {showDetail && data.detalle && (
        <div className="section-detail-table animate-fade-in" style={{ marginTop: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
          <table className="sat-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Institución / Emisor</th>
                <th style={{ textAlign: 'right' }}>Nominal</th>
                <th style={{ textAlign: 'right' }}>Real</th>
                <th style={{ textAlign: 'right' }}>ISR Retenido</th>
              </tr>
            </thead>
            <tbody>
              {data.detalle.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.fecha}</td>
                  <td style={{ fontWeight: '500' }}>{item.emisor}</td>
                  <td style={{ textAlign: 'right' }}>{fmt(item.nominal)}</td>
                  <td style={{ textAlign: 'right' }}>{fmt(item.real)}</td>
                  <td style={{ textAlign: 'right' }} className="val-danger">{fmt(item.retencion_isr)}</td>
                </tr>
              ))}
            </tbody>
            {data.detalle.length > 1 && (
              <tfoot>
                <tr style={{ fontWeight: 'bold', background: '#fcfcfc' }}>
                  <td colSpan="2">Total Detallado</td>
                  <td style={{ textAlign: 'right' }}>{fmt(data.nominal)}</td>
                  <td style={{ textAlign: 'right' }}>{fmt(data.real)}</td>
                  <td style={{ textAlign: 'right' }} className="val-danger">{fmt(data.isr_retenido)}</td>
                </tr>
              </tfoot>
            )}
          </table>
          {data.detalle.length === 0 && (
            <p style={{ textAlign: 'center', color: '#666', padding: '1rem' }}>No hay movimientos detallados para este periodo.</p>
          )}
        </div>
      )}
    </SectionCard>
  );
}
