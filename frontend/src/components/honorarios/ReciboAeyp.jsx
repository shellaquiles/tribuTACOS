import React, { useState } from 'react';
import { fmt } from '../ui/Primitives';

export const ReciboAeyp = ({ recibo, onViewCfdi, onViewXml }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="nomina-recibo-card">
      <div className="nomina-recibo-header" onClick={() => setExpanded(!expanded)}>
        <div className="nomina-recibo-summary">
          <div className="nomina-fechas">
            <strong>{recibo.fecha}</strong>
            <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>{recibo.uuid?.split('-')[0]}***</span>
          </div>
          <div className="nomina-kpis">
            <div className="nomina-kpi-min">
              <span className="label">Subtotal PUE</span>
              <span className="val">{fmt(recibo.subtotal)}</span>
            </div>
            <div className="nomina-kpi-min">
              <span className="label">Retenciones</span>
              <span className="val text-danger">{fmt((recibo.isr_ret || 0) + (recibo.iva_ret || 0))}</span>
            </div>
            <div className="nomina-kpi-min highlighted">
              <span className="label">Cobro Neto</span>
              <span className="val">{fmt(recibo.total)}</span>
            </div>
          </div>
          <div className="nomina-expand-icon">
            {expanded ? '▲' : '▼'}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="nomina-recibo-body animate-fade-in">
          <div className="nomina-ticket-grid">
            <div className="nomina-ticket-col">
              <h4>Servicios Facturados</h4>
              <div className="nomina-ticket-items">
                <div className="nomina-ticket-row header">
                  <span>Concepto</span>
                  <span>Importe Base</span>
                </div>
                {(recibo.conceptos || []).map((c, idx) => (
                  <div className="nomina-ticket-row" key={'aeyp-c' + idx}>
                    <span className="concepto">{c.desc}</span>
                    <span className="importe">{fmt(c.imp)}</span>
                  </div>
                ))}
                <div className="nomina-ticket-row total">
                  <span>Subtotal</span>
                  <span>{fmt(recibo.subtotal)}</span>
                </div>
              </div>
            </div>

            <div className="nomina-ticket-col">
              <h4>Impuestos (Traslados y Retenciones)</h4>
              <div className="nomina-ticket-items">
                <div className="nomina-ticket-row header">
                  <span>Rubro Fiscal</span>
                  <span>Monto</span>
                </div>
                {recibo.iva > 0 && (
                  <div className="nomina-ticket-row">
                     <span className="concepto"><span className="clave">002</span> IVA Trasladado</span>
                     <span className="importe">{fmt(recibo.iva)}</span>
                  </div>
                )}
                {recibo.isr_ret > 0 && (
                  <div className="nomina-ticket-row">
                     <span className="concepto"><span className="clave">001</span> Retención ISR</span>
                     <span className="importe text-danger">{fmt(recibo.isr_ret)}</span>
                  </div>
                )}
                {recibo.iva_ret > 0 && (
                  <div className="nomina-ticket-row">
                     <span className="concepto"><span className="clave">002</span> Retención IVA</span>
                     <span className="importe text-danger">{fmt(recibo.iva_ret)}</span>
                  </div>
                )}
                <div className="nomina-ticket-row total">
                  <span>Total Retenciones</span>
                  <span className="text-danger">{fmt((recibo.isr_ret || 0) + (recibo.iva_ret || 0))}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="nomina-ticket-footer">
             <div className="uuid-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                Folio:
                <button
                  onClick={(e) => { e.stopPropagation(); if (onViewCfdi) onViewCfdi(recibo.raw_cfdi); }}
                  style={{
                    background: '#e0f2fe', border: 'none', padding: '3px 8px', borderRadius: '4px',
                    color: '#2563eb', textDecoration: 'underline', fontWeight: '600',
                    cursor: 'pointer', fontFamily: 'monospace', fontSize: '11px', transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.target.style.color = '#1d4ed8'}
                  onMouseLeave={e => e.target.style.color = '#2563eb'}
                >
                  {recibo.uuid}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); if (onViewXml) onViewXml(recibo.raw_cfdi); }}
                  style={{ background: 'none', border: '1px solid #cbd5e1', padding: '2px 6px', borderRadius: '4px', color: '#64748b', cursor: 'pointer', fontSize: '10px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onMouseEnter={e => { e.target.style.background = '#f1f5f9'; e.target.style.color = '#334155'; }}
                  onMouseLeave={e => { e.target.style.background = 'none'; e.target.style.color = '#64748b'; }}
                  title="Ver estructura subyacente del CFDI en JSON"
                >
                  <span role="img" aria-label="code" style={{ fontSize: '11px' }}>💻</span> JSON
                </button>
                {recibo.raw_cfdi?.filename && (
                  <button
                    onClick={(e) => { e.stopPropagation(); window.open(`http://${window.location.hostname}:8010/api/download_xml?filename=${recibo.raw_cfdi.filename}`, '_blank'); }}
                    style={{ background: 'none', border: '1px solid #cbd5e1', padding: '2px 6px', borderRadius: '4px', color: '#64748b', cursor: 'pointer', fontSize: '10px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '4px' }}
                    onMouseEnter={e => { e.target.style.background = '#f1f5f9'; e.target.style.color = '#334155'; }}
                    onMouseLeave={e => { e.target.style.background = 'none'; e.target.style.color = '#64748b'; }}
                    title="Descargar archivo original (.xml)"
                  >
                    <span role="img" aria-label="download" style={{ fontSize: '11px' }}>⬇️</span> XML
                  </button>
                )}
             </div>
             <div className="neto-final">
                Neto Cobrado: <strong>{fmt(recibo.total)}</strong>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
