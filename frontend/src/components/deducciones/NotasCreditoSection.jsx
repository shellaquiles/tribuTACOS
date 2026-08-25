import React from 'react';
import { SectionCard, ConceptCard, fmt } from '../ui/Primitives';

export function NotasCreditoSection({ data }) {
  if (!data || !data.detalle || data.detalle.length === 0) return null;
  return (
    <SectionCard icon="💵" title="Notas de Crédito (Devoluciones y Bonificaciones)">
      <p className="sec-note">
        CFDIs de tipo <strong>Egreso</strong> donde eres el receptor. Representan devoluciones, descuentos o bonificaciones que operan como ingreso contable.
      </p>

      <div className="kpi-grid">
        <div className="kpi-card kpi-accent">
          <span className="kpi-label">Total Otros Ingresos</span>
          <span className="kpi-value">{fmt(data.total)}</span>
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h4 style={{ marginBottom: '1rem', color: 'var(--text-color)', fontWeight: '600' }}>
          Conceptos de Notas de Crédito
        </h4>
        <div className="concept-grid">
          {(data.resumen_conceptos || []).map((it, idx) => (
            <ConceptCard
              key={idx}
              title={it.concepto}
              value={it.importe}
              accent="amber"
            />
          ))}
        </div>
      </div>
    </SectionCard>
  );
}
