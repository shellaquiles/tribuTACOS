import React, { useState } from 'react';
import { fmt } from '../ui/Primitives';

export const ReciboNomina = ({ recibo, onViewCfdi, onViewXml }) => {
  const [expanded, setExpanded] = useState(false);

  if (!recibo) return null;

  return (
    <div className="nomina-recibo-card">
      <div
        className="nomina-recibo-header"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="nomina-recibo-summary">
          <div className="nomina-fechas">
            <strong>{recibo.fecha}</strong>
            <span>Periodo: {recibo.fecha_inicial} - {recibo.fecha_final} ({recibo.dias_pagados} días)</span>
          </div>
          <div className="nomina-kpis" style={{ display: 'flex', gap: '1.75rem', alignItems: 'center' }}>
            <div className="nomina-kpi-min" style={{ minWidth: '90px', textAlign: 'right' }}>
              <span className="label">Bruto</span>
              <span className="val">{fmt(recibo.total_bruto)}</span>
            </div>
            <div className="nomina-kpi-min" style={{ minWidth: '95px', textAlign: 'right' }}>
              <span className="label">Vales (029)</span>
              {recibo.vales > 0 ? (
                <span className="val text-danger">-{fmt(recibo.vales)}</span>
              ) : (
                <span className="val" style={{ color: '#cbd5e1', fontWeight: 400 }}>—</span>
              )}
            </div>
            <div className="nomina-kpi-min" style={{ minWidth: '95px', textAlign: 'right' }}>
              <span className="label">Deducciones</span>
              <span className="val text-danger">-{fmt(recibo.total_deducciones)}</span>
            </div>
            <div className="nomina-kpi-min highlighted" style={{ minWidth: '110px', textAlign: 'right' }}>
              <span className="label">NETO A PAGAR</span>
              <span className="val">{fmt(recibo.neto)}</span>
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
            {/* PERCEPCIONES */}
            <div className="nomina-ticket-col">
              <h4>Percepciones</h4>
              <div className="nomina-ticket-items">
                <div className="nomina-ticket-row header">
                  <span>Concepto</span>
                  <span>Importe</span>
                </div>
                {recibo.percepciones.length === 0 && <div className="nomina-ticket-row empty">No hay percepciones detalladas</div>}
                {recibo.percepciones.map((p, idx) => (
                  <div className="nomina-ticket-row" key={'p' + idx}>
                    <span className="concepto"><span className="clave">{p.tipo}</span> {p.concepto}</span>
                    <span className="importe">{fmt(p.total)}</span>
                  </div>
                ))}
                <div className="nomina-ticket-row total">
                  <span>Suma Percepciones</span>
                  <span>{fmt(recibo.total_bruto)}</span>
                </div>
              </div>
            </div>

            {/* DEDUCCIONES */}
            <div className="nomina-ticket-col">
              <h4>Deducciones</h4>
              <div className="nomina-ticket-items">
                <div className="nomina-ticket-row header">
                  <span>Concepto</span>
                  <span>Importe</span>
                </div>
                {recibo.deducciones.length === 0 && <div className="nomina-ticket-row empty">No hay deducciones detalladas</div>}
                {recibo.deducciones.map((d, idx) => (
                  <div className="nomina-ticket-row" key={'d' + idx}>
                    <span className="concepto"><span className="clave">{d.tipo}</span> {d.concepto}</span>
                    <span className="importe text-danger">{fmt(d.importe)}</span>
                  </div>
                ))}
                <div className="nomina-ticket-row total">
                  <span>Suma Deducciones</span>
                  <span className="text-danger">{fmt(recibo.total_deducciones)}</span>
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
                style={{
                  background: 'none', border: '1px solid #cbd5e1', padding: '2px 6px', borderRadius: '4px',
                  color: '#64748b', cursor: 'pointer', fontSize: '10px', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: '4px'
                }}
                onMouseEnter={e => { e.target.style.background = '#f1f5f9'; e.target.style.color = '#334155'; }}
                onMouseLeave={e => { e.target.style.background = 'none'; e.target.style.color = '#64748b'; }}
                title="Ver estructura subyacente del CFDI"
              >
                <span role="img" aria-label="code" style={{ fontSize: '11px' }}>💻</span> JSON
              </button>
              {recibo.raw_cfdi?.filename && (
                <button
                  onClick={(e) => { e.stopPropagation(); window.open(`http://${window.location.hostname}:8010/api/download_xml?filename=${recibo.raw_cfdi.filename}`, '_blank'); }}
                  style={{
                    background: 'none', border: '1px solid #cbd5e1', padding: '2px 6px', borderRadius: '4px',
                    color: '#64748b', cursor: 'pointer', fontSize: '10px', transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', gap: '4px'
                  }}
                  onMouseEnter={e => { e.target.style.background = '#f1f5f9'; e.target.style.color = '#334155'; }}
                  onMouseLeave={e => { e.target.style.background = 'none'; e.target.style.color = '#64748b'; }}
                  title="Descargar archivo original (.xml)"
                >
                  <span role="img" aria-label="download" style={{ fontSize: '11px' }}>⬇️</span> XML
                </button>
              )}
            </div>
            <div className="neto-final">
              Neto a Pagar: <strong>{fmt(recibo.neto)}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
