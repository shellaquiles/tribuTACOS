import React, { useState } from 'react';
import { fmt } from '../ui/Primitives';

export const InteractableRow = ({ item, groupBy, onViewCfdi }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        onClick={() => setExpanded(!expanded)}
        style={{ cursor: 'pointer', transition: 'background-color 0.2s', backgroundColor: expanded ? '#f8fafc' : 'transparent' }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = expanded ? '#f8fafc' : 'transparent'}
      >
        <td style={{ whiteSpace: 'nowrap', color: '#475569' }}>
          <span style={{ marginRight: '8px', fontSize: '0.75rem', color: '#94a3b8', display: 'inline-block', width: '12px' }}>
            {expanded ? '▼' : '▶'}
          </span>
          {item.fecha}
        </td>
        <td style={{ fontSize: '0.85rem', fontWeight: 500, color: '#334155' }}>
          {groupBy === 'emisor' ? item.uso_cfdi : item.emisor}
        </td>
        <td><span className={`sat-badge ${item.metodo === 'PUE' ? 'sat-badge-green' : 'sat-badge-blue'}`}>{item.metodo}</span></td>
        <td className="text-right mono">{fmt(item.subtotal)}</td>
        <td className="text-right mono">{fmt(item.iva)}</td>
        <td className="text-right font-medium mono">{fmt(item.total)}</td>
      </tr>

      {expanded && (
        <tr style={{ backgroundColor: '#f8fafc' }}>
          <td colSpan={6} style={{ padding: '0' }}>
             <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0', boxShadow: 'inset 0 3px 6px -3px rgb(0 0 0 / 0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      <strong style={{ color: '#475569' }}>UUID Folio Fiscal:</strong> <span onClick={() => onViewCfdi(item.raw_cfdi)} onMouseEnter={(e) => e.target.style.color = '#1d4ed8'} onMouseLeave={(e) => e.target.style.color = '#2563eb'} style={{ fontFamily: 'monospace', letterSpacing: '0.5px', background: '#e0f2fe', color: '#2563eb', padding: '3px 8px', borderRadius: '4px', marginLeft: '6px', cursor: 'pointer', textDecoration: 'underline', transition: 'color 0.2s', fontWeight: 600 }}>{item.uuid || 'N/D'}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      <strong style={{ color: '#475569' }}>Forma de Pago SAT:</strong> <span style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px' }}>{item.forma_pago || 'N/D'}</span>
                    </div>
                </div>

                {item.conceptos && item.conceptos.length > 0 ? (
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse', margin: 0 }}>
                      <thead style={{ backgroundColor: '#f1f5f9' }}>
                        <tr>
                          <th style={{ textAlign: 'left', padding: '0.5rem 1rem', fontWeight: 600, color: '#475569', borderBottom: '1px solid #e2e8f0' }}>Concepto / Descripción del CFDI</th>
                          <th style={{ textAlign: 'right', padding: '0.5rem 1rem', fontWeight: 600, color: '#475569', width: '150px', borderBottom: '1px solid #e2e8f0' }}>Subtotal Importe</th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.conceptos.map((c, idx) => (
                          <tr key={idx}>
                            <td style={{ padding: '0.75rem 1rem', color: '#334155', borderBottom: idx !== item.conceptos.length - 1 ? '1px solid #f1f5f9' : 'none' }}>{c.desc}</td>
                            <td style={{ textAlign: 'right', padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#475569', borderBottom: idx !== item.conceptos.length - 1 ? '1px solid #f1f5f9' : 'none' }}>{fmt(parseFloat(c.imp || 0))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic', marginTop: '0.5rem' }}>
                    El desglose de conceptos (XML Node) no está disponible en este comprobante.
                  </div>
                )}
             </div>
          </td>
        </tr>
      )}
    </>
  );
};
