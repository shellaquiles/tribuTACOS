import React from 'react';
import { fmt } from './Primitives';

export const FriendlyObjectViewer = ({ data, level = 0 }) => {
  if (data === null || data === undefined) return <span style={{ color: '#94a3b8' }}>null</span>;
  if (typeof data === 'boolean') return <span style={{ color: '#f43f5e' }}>{data ? 'true' : 'false'}</span>;
  if (typeof data === 'number') return <span style={{ color: '#2563eb' }}>{data}</span>;
  if (typeof data === 'string') return <span style={{ color: '#16a34a' }}>"{data}"</span>;

  if (Array.isArray(data)) {
    if (data.length === 0) return <span style={{ color: '#94a3b8' }}>[]</span>;
    return (
      <div style={{ paddingLeft: level > 0 ? '1.5rem' : 0 }}>
        <span style={{ color: '#64748b' }}>[</span>
        {data.map((item, idx) => (
          <div key={idx} style={{ paddingLeft: '1.5rem', marginBottom: '4px' }}>
            <FriendlyObjectViewer data={item} level={level + 1} />
            {idx < data.length - 1 && <span style={{ color: '#64748b' }}>,</span>}
          </div>
        ))}
        <span style={{ color: '#64748b' }}>]</span>
      </div>
    );
  }

  if (typeof data === 'object') {
    const keys = Object.keys(data);
    if (keys.length === 0) return <span style={{ color: '#94a3b8' }}>{`{}`}</span>;
    return (
      <div style={{ paddingLeft: level > 0 ? '1.5rem' : 0 }}>
        <span style={{ color: '#64748b' }}>{`{`}</span>
        {keys.map((key, idx) => (
          <div key={key} style={{ paddingLeft: '1.5rem', margin: '4px 0' }}>
            <strong style={{ color: '#8b5cf6' }}>"{key}"</strong>
            <span style={{ color: '#64748b', margin: '0 6px' }}>:</span>
            <FriendlyObjectViewer data={data[key]} level={level + 1} />
            {idx < keys.length - 1 && <span style={{ color: '#64748b' }}>,</span>}
          </div>
        ))}
        <span style={{ color: '#64748b' }}>{`}`}</span>
      </div>
    );
  }

  return <span>{String(data)}</span>;
};

export const XmlViewerModal = ({ data, onClose }) => {
  if (!data) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(5px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
      <div style={{ backgroundColor: '#0f172a', borderRadius: '12px', width: '100%', maxWidth: '800px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.5)', position: 'relative', border: '1px solid #334155' }}>

        {/* Header */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
             <span style={{ fontSize: '1.25rem' }}>💻</span>
             <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.05rem', fontWeight: 600, fontFamily: 'monospace' }}>
               Datos Estructurados (Metadatos JSON)
             </h3>
          </div>
          <button onClick={onClose} style={{ cursor: 'pointer', background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.2rem', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>✖</button>
        </div>

        {/* Console Body */}
        <div style={{ padding: '1.5rem', fontFamily: 'monospace', fontSize: '0.82rem', color: '#e2e8f0', lineHeight: 1.5, overflowX: 'auto' }}>
           <FriendlyObjectViewer data={data} />
        </div>
      </div>
    </div>
  );
};

export const CfdiVisualizerModal = ({ cfdi, onClose }) => {
  if (!cfdi) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(5px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.35)', position: 'relative' }}>

        {/* Header */}
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', position: 'sticky', top: 0, zIndex: 10 }}>
          <div>
             <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Comprobante Fiscal Digital por Internet</h2>
             <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 600 }}>Folio Fiscal (UUID):</span>
                <span style={{ fontFamily: 'monospace', background: '#e2e8f0', padding: '2px 8px', borderRadius: '4px', color: '#334155' }}>{cfdi.uuid}</span>
             </div>
          </div>
          <button onClick={onClose} style={{ cursor: 'pointer', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#64748b', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'} onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}>✖</button>
        </div>

        {/* Body */}
        <div style={{ padding: '2.5rem' }}>
          {/* Top Info Grid (Emisor & Receptor) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '2rem', marginBottom: '2.5rem' }}>
            {/* Emisor */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', background: 'linear-gradient(to bottom right, #ffffff, #f8fafc)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '1rem', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}><span>🏢</span> DATOS DEL EMISOR</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem', lineHeight: 1.3 }}>{cfdi.emisor_nombre}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '0.9rem', color: '#475569' }}><strong style={{ color: '#334155' }}>RFC:</strong> {cfdi.emisor_rfc}</div>
                  <div style={{ fontSize: '0.9rem', color: '#475569' }}><strong style={{ color: '#334155' }}>Régimen Fiscal:</strong> <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '0.85rem' }}>{cfdi.emisor_regimen}</span></div>
              </div>
            </div>

            {/* Receptor */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', background: 'linear-gradient(to bottom right, #ffffff, #f8fafc)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '1rem', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}><span>👤</span> DATOS DEL RECEPTOR</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem', lineHeight: 1.3 }}>{cfdi.receptor_nombre}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '0.9rem', color: '#475569' }}><strong style={{ color: '#334155' }}>RFC:</strong> {cfdi.receptor_rfc}</div>
                  <div style={{ fontSize: '0.9rem', color: '#475569' }}><strong style={{ color: '#334155' }}>Uso CFDI:</strong> <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '0.85rem' }}>{cfdi.uso_cfdi}</span></div>
              </div>
            </div>
          </div>

          {/* Factura Meta */}
          <div style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '1.5rem', marginBottom: '2.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1.5rem' }}>
             <div><span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Fecha Emisión</span><strong style={{ color: '#0f172a', fontSize: '1rem' }}>{(cfdi.fecha || '').replace('T', ' ')}</strong></div>
             <div><span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Efecto Comp.</span><strong style={{ color: '#0f172a', fontSize: '1rem' }}>{cfdi.tipo === 'I' ? 'Ingreso' : cfdi.tipo === 'E' ? 'Egreso' : cfdi.tipo === 'P' ? 'Pago' : cfdi.tipo}</strong></div>
             <div><span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Moneda</span><strong style={{ color: '#0f172a', fontSize: '1rem' }}>{cfdi.moneda || 'MXN'}</strong></div>
             <div><span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Forma Pago</span><strong style={{ color: '#0f172a', fontSize: '1rem' }}>{cfdi.forma_pago || 'N/D'}</strong></div>
             <div><span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Método Pago</span><strong style={{ color: '#0f172a', fontSize: '1rem' }}>{cfdi.metodo_pago || 'N/D'}</strong></div>
          </div>

          {/* Conceptos Table */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', marginBottom: '2.5rem', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' }}>
             <table style={{ width: '100%', borderCollapse: 'collapse', margin: 0 }}>
               <thead style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                 <tr>
                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left', color: '#334155', fontSize: '0.85rem', fontWeight: 600 }}>Descripción del Servicio / Bien</th>
                    <th style={{ padding: '1rem 1.5rem', textAlign: 'right', color: '#334155', fontSize: '0.85rem', fontWeight: 600, width: '180px' }}>Importe</th>
                 </tr>
               </thead>
               <tbody>
                 {cfdi.conceptos && cfdi.conceptos.length > 0 ? (
                   cfdi.conceptos.map((c, idx) => (
                     <tr key={idx} style={{ borderBottom: idx !== cfdi.conceptos.length - 1 ? '1px solid #e2e8f0' : 'none', backgroundColor: '#ffffff' }}>
                       <td style={{ padding: '1.25rem 1.5rem', color: '#0f172a', fontSize: '0.95rem', lineHeight: 1.4 }}>{c.desc}</td>
                       <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right', fontFamily: 'monospace', color: '#334155', fontSize: '1rem' }}>{fmt(parseFloat(c.imp))}</td>
                     </tr>
                   ))
                 ) : (
                   <tr><td colSpan={2} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>Sin conceptos detallados en el XML procesado.</td></tr>
                 )}
               </tbody>
             </table>
          </div>

          {/* Totals Summary */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
             <div style={{ width: '350px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', color: '#475569', fontSize: '1rem' }}><span>Subtotal:</span> <strong style={{ fontFamily: 'monospace', color: '#1e293b' }}>{fmt(cfdi.subtotal)}</strong></div>
                {cfdi.descuento > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', color: '#475569', fontSize: '1rem' }}><span>Descuento:</span> <strong style={{ fontFamily: 'monospace', color: '#ef4444' }}>-{fmt(cfdi.descuento)}</strong></div>}

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', color: '#475569', fontSize: '1rem' }}><span>IVA Trasladado:</span> <strong style={{ fontFamily: 'monospace', color: '#1e293b' }}>{fmt(cfdi.iva)}</strong></div>
                {cfdi.retencion_iva > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', color: '#475569', fontSize: '1rem' }}><span>Retención IVA:</span> <strong style={{ fontFamily: 'monospace', color: '#ef4444' }}>-{fmt(cfdi.retencion_iva)}</strong></div>}
                {cfdi.retencion_isr > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', color: '#475569', fontSize: '1rem' }}><span>Retención ISR:</span> <strong style={{ fontFamily: 'monospace', color: '#ef4444' }}>-{fmt(cfdi.retencion_isr)}</strong></div>}

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0 0.25rem 0', color: '#0f172a', fontSize: '1.35rem', fontWeight: 800, borderTop: '2px solid #cbd5e1', marginTop: '1rem' }}><span>TOTAL:</span> <span style={{ fontFamily: 'monospace' }}>{fmt(cfdi.total)}</span></div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
