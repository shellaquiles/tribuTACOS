import React, { useState, useMemo } from 'react';
import {
  ComposedChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { SectionCard, KpiRow, ConceptCard, fmt } from '../ui/Primitives';

export function HonorariosSection({ data, year }) {
  const [selectedClient, setSelectedClient] = useState('Global');
  if (!data) return null;

  const clients = useMemo(() => {
    if (!data.detalle) return [];
    const dict = {};
    data.detalle.forEach(d => {
      const key = d.rfc || d.cliente;
      if (!dict[key]) dict[key] = d.cliente;
      else if (d.cliente && d.cliente.length < dict[key].length) dict[key] = d.cliente;
    });
    return Object.entries(dict).map(([rfc, nombre]) => ({ rfc, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [data.detalle]);

  const targetRecibos = useMemo(() => {
    if (selectedClient === 'Global') return data.detalle || [];
    return data.detalle?.filter(d => (d.rfc || d.cliente) === selectedClient) || [];
  }, [data.detalle, selectedClient]);

  const sumSubtotal = targetRecibos.reduce((acc, curr) => acc + (Number(curr.subtotal) || 0), 0);
  const sumIva = targetRecibos.reduce((acc, curr) => acc + (Number(curr.iva) || 0), 0);
  const sumIsrRet = targetRecibos.reduce((acc, curr) => acc + (Number(curr.ret_isr ?? curr.isr_ret) || 0), 0);
  const sumIvaRet = targetRecibos.reduce((acc, curr) => acc + (Number(curr.ret_iva ?? curr.iva_ret) || 0), 0);
  const cobradoBruto = sumSubtotal + sumIva;
  const sumRetenciones = sumIsrRet + sumIvaRet;
  const totalPagadoEfectivo = cobradoBruto - sumRetenciones;

  const calcConceptos = useMemo(() => {
    const cons = {};
    targetRecibos.forEach(r => {
      (r.conceptos || []).forEach(c => {
         const clave = c.clave || '00000000';
         if (!cons[clave]) {
             cons[clave] = {
                 clave: clave,
                 desc_sat: c.desc_sat || c.desc || 'Servicio profesional',
                 importe: 0,
                 no_ids: new Set()
             };
         }
         cons[clave].importe += c.imp || 0;

         if (c.no_id && c.no_id.trim() !== '' && c.no_id.toLowerCase() !== (c.desc || '').toLowerCase()) {
             cons[clave].no_ids.add(c.no_id.trim());
         }
      });
    });
    return Object.values(cons).map(item => ({
       ...item,
       no_ids: Array.from(item.no_ids)
    })).sort((a, b) => b.importe - a.importe);
  }, [targetRecibos]);

  return (
    <SectionCard icon="💼" title="Facturación Emitida (AEyP)">
      <div style={{ marginBottom: '1.25rem' }}>
        <p className="sec-note" style={{ margin: 0 }}>
          Base de cálculo: <strong>Facturas PUE (Pagadas en una exhibición)</strong>.
          Muestra la radiografía cruda de tus cobros a lo largo del <strong>ejercicio {year}</strong>.
        </p>
      </div>

      {clients.length > 0 && (
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
           <button
             onClick={() => setSelectedClient('Global')}
             style={{
               padding: '0.6rem 1.2rem', borderRadius: '30px', cursor: 'pointer', border: 'none',
               background: selectedClient === 'Global' ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : '#f1f5f9',
               color: selectedClient === 'Global' ? 'white' : '#475569',
               fontWeight: selectedClient === 'Global' ? '700' : '500',
               boxShadow: selectedClient === 'Global' ? '0 4px 10px rgba(59, 130, 246, 0.4)' : 'none',
               transition: 'all 0.3s ease', fontSize: '0.9rem'
             }}
           >
             🌐 Portafolio Global
           </button>
           {clients.map((cli, i) => (
             <button
               key={i}
               onClick={() => setSelectedClient(cli.rfc)}
               style={{
                 padding: '0.6rem 1.2rem', borderRadius: '30px', cursor: 'pointer', border: 'none',
                 background: selectedClient === cli.rfc ? 'linear-gradient(135deg, #10b981, #059669)' : '#f1f5f9',
                 color: selectedClient === cli.rfc ? 'white' : '#475569',
                 fontWeight: selectedClient === cli.rfc ? '700' : '500',
                 boxShadow: selectedClient === cli.rfc ? '0 4px 10px rgba(16, 185, 129, 0.4)' : 'none',
                 transition: 'all 0.3s ease', fontSize: '0.9rem'
               }}
             >
               🏢 {cli.nombre}
             </button>
           ))}
        </div>
      )}

      <KpiRow items={[
        { label: 'Subtotal Facturado', value: sumSubtotal, accent: 'kpi-accent', help: 'Ingreso Base Acumulado' },
        { label: 'IVA Trasladado (16%)', value: sumIva, help: 'Dinero recaudado pero del SAT' },
        { label: 'Retenciones Sufridas', value: sumRetenciones, accent: 'kpi-danger', help: 'ISR e IVA retenido por clientes' },
      ]} />

      <div className="waterfall-summary" style={{ marginTop: '2rem' }}>
        <div className="waterfall-item">
          <span>Facturado Bruto (Sub+IVA)</span>
          <strong style={{ color: 'var(--blue)' }}>{fmt(cobradoBruto)}</strong>
        </div>
        <div className="waterfall-op">−</div>
        <div className="waterfall-item">
          <span>El «Peaje» (Retenciones)</span>
          <strong style={{ color: 'var(--red)' }}>{fmt(Math.abs(sumRetenciones))}</strong>
        </div>
        <div className="waterfall-op">=</div>
        <div className="waterfall-item">
          <span>Neto Depositado / Efectivo</span>
          <strong style={{ color: 'var(--green)' }}>{fmt(totalPagadoEfectivo)}</strong>
        </div>
      </div>

      <div className="animate-fade-in" style={{ marginTop: '2.5rem' }}>
        <h3 style={{ fontSize: '1.05rem', color: 'var(--blue)', marginBottom: '1rem' }}>Desglose de Conceptos Billed</h3>
        <div className="concept-grid">
          {calcConceptos.map((c, i) => (
            <ConceptCard
              key={i}
              title={c.desc_sat}
              value={c.importe}
              accent="blue"
              badge={c.clave}
              metaItems={c.no_ids.length > 0 ? [{ label: 'Conceptos reportados', value: c.no_ids.join(' • ') }] : []}
            />
          ))}
        </div>
      </div>

      {/* ── Evolución Mensual ── */}
      {(() => {
        const mensualMap = {};
        targetRecibos.forEach(item => {
          if (!item.fecha) return;
          const month = parseInt(item.fecha.split('-')[1]);
          if (isNaN(month) || month < 1 || month > 12) return;
          const name = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][month - 1];
          if (!mensualMap[name]) mensualMap[name] = { name, Subtotal: 0, IVA: 0 };
          mensualMap[name].Subtotal += item.subtotal || 0;
          mensualMap[name].IVA += item.iva || 0;
        });
        const mData = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'].map(
          n => mensualMap[n] || { name: n, Subtotal: 0, IVA: 0 }
        );
        if (!mData.some(d => d.Subtotal > 0)) return null;
        return (
          <div style={{ marginTop: '2rem', background: '#f8fafc', borderRadius: '12px', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 1.25rem 0', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Evolución Mensual — Subtotal + IVA Facturado
            </h4>
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={mData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => '$' + (v / 1000).toFixed(0) + 'k'} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(val, name) => [fmt(val), name]} cursor={{ fill: '#f1f5f9' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Subtotal" stackId="a" fill="#10b981" name="Subtotal Base" />
                <Bar dataKey="IVA" stackId="a" fill="#6366f1" radius={[4, 4, 0, 0]} name="IVA Trasladado" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        );
      })()}
    </SectionCard>
  );
}
