import React, { useState, useMemo } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { CHART_COLORS, MONTH_NAMES, fmt } from '../ui/Primitives';

export function AnaliticaAeypSection({ data, year }) {
  const [selectedClient, setSelectedClient] = useState('Global');
  if (!data || !data.detalle) return null;

  const clients = useMemo(() => {
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
    return data.detalle.filter(d => (d.rfc || d.cliente) === selectedClient);
  }, [data.detalle, selectedClient]);

  const mensualData = useMemo(() => {
    const maps = {};
    targetRecibos.forEach(item => {
      if (!item.fecha) return;
      const month = parseInt(item.fecha.split('-')[1]);
      if (isNaN(month) || month < 1 || month > 12) return;
      const name = MONTH_NAMES[month - 1].slice(0, 3);
      if (!maps[name]) maps[name] = { name, Subtotal: 0, IVA: 0, Neto: 0 };
      maps[name].Subtotal += item.subtotal || 0;
      maps[name].IVA += item.iva || 0;
      maps[name].Neto += (item.subtotal || 0) + (item.iva || 0);
    });
    return MONTH_NAMES.map(m => maps[m.slice(0, 3)] || { name: m.slice(0, 3), Subtotal: 0, IVA: 0, Neto: 0 });
  }, [targetRecibos]);

  const serviceMix = useMemo(() => {
    const map = {};
    targetRecibos.forEach(r => {
      (r.conceptos || []).forEach(c => {
        const key = c.clave || '00000000';
        const label = c.desc_sat || c.desc || key;
        if (!map[key]) map[key] = { name: label.length > 40 ? label.slice(0, 40) + '\u2026' : label, value: 0 };
        map[key].value += c.imp || 0;
      });
    });
    return Object.values(map).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [targetRecibos]);

  const clientData = useMemo(() => {
    const g = {};
    data.detalle.forEach(item => {
      const key = item.rfc || item.cliente;
      if (!g[key]) g[key] = { name: item.cliente, value: 0 };
      else if (item.cliente && item.cliente.length < g[key].name.length) g[key].name = item.cliente;
      g[key].value += item.subtotal + item.iva;
    });
    return Object.values(g).sort((a, b) => b.value - a.value);
  }, [data.detalle]);

  const totalBruto = targetRecibos.reduce((s, r) => s + r.subtotal + r.iva, 0);
  const totalSubtotal = targetRecibos.reduce((s, r) => s + r.subtotal, 0);
  const totalIva = targetRecibos.reduce((s, r) => s + r.iva, 0);
  const bestMonth = mensualData.reduce((a, b) => b.Neto > a.Neto ? b : a, mensualData[0]);

  return (
    <>
      {clients.length > 0 && (
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <button onClick={() => setSelectedClient('Global')} style={{ padding: '0.5rem 1.1rem', borderRadius: '30px', cursor: 'pointer', border: 'none', background: selectedClient === 'Global' ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : '#f1f5f9', color: selectedClient === 'Global' ? 'white' : '#475569', fontWeight: selectedClient === 'Global' ? '700' : '500', fontSize: '0.85rem', transition: 'all 0.3s' }}>
            🌎 Global
          </button>
          {clients.map((cli, i) => (
            <button key={i} onClick={() => setSelectedClient(cli.rfc)} style={{ padding: '0.5rem 1.1rem', borderRadius: '30px', cursor: 'pointer', border: 'none', background: selectedClient === cli.rfc ? 'linear-gradient(135deg, #10b981, #059669)' : '#f1f5f9', color: selectedClient === cli.rfc ? 'white' : '#475569', fontWeight: selectedClient === cli.rfc ? '700' : '500', fontSize: '0.85rem', transition: 'all 0.3s' }}>
              🏢 {cli.nombre}
            </button>
          ))}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Facturado Bruto', value: fmt(totalBruto), color: '#3b82f6', icon: '💰' },
          { label: 'Subtotal Neto', value: fmt(totalSubtotal), color: '#10b981', icon: '📄' },
          { label: 'IVA Trasladado', value: fmt(totalIva), color: '#f59e0b', icon: '🏛️' },
          { label: 'Mejor Mes', value: bestMonth?.name || '—', color: '#6366f1', icon: '📅', sub: fmt(bestMonth?.Neto) },
        ].map((k, i) => (
          <div key={i} style={{ background: 'white', borderRadius: '12px', padding: '1rem 1.25rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <span>{k.icon}</span>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>{k.label}</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: k.color }}>{k.value}</div>
            {k.sub && <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>{k.sub}</div>}
          </div>
        ))}
      </div>
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.04)', marginBottom: '1.5rem' }}>
        <h4 style={{ margin: '0 0 1.5rem 0', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Evolución Mensual — Subtotal + IVA vs Bruto Cobrado
        </h4>
        <ResponsiveContainer width='100%' height={290}>
          <ComposedChart data={mensualData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray='3 3' vertical={false} stroke='#e2e8f0' />
            <XAxis dataKey='name' tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => '$' + (v / 1000).toFixed(0) + 'k'} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(val, name) => [fmt(val), name]} cursor={{ fill: '#f8fafc' }} />
            <Legend iconType='circle' wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey='Subtotal' stackId='a' fill='#94a3b8' name='Subtotal' />
            <Bar dataKey='IVA' stackId='a' fill='#fbbf24' radius={[4, 4, 0, 0]} name='IVA Trasladado' />
            <Line type='monotone' dataKey='Neto' stroke='#3b82f6' strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} name='Bruto Cobrado' />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>
            Mix de Servicios (Catálogo SAT)
          </h4>
          {serviceMix.length > 0 ? (
            <>
              <ResponsiveContainer width='100%' height={200}>
                <PieChart>
                  <Pie data={serviceMix} cx='50%' cy='50%' innerRadius={50} outerRadius={82} paddingAngle={2} dataKey='value' stroke='none'>
                    {serviceMix.map((e, idx) => <Cell key={'sm-' + idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(val) => fmt(val)} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '0.5rem' }}>
                {(() => {
                  const total = serviceMix.reduce((s, e) => s + e.value, 0);
                  return serviceMix.map((c, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                      <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
                      <span style={{ color: '#475569', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                      <span style={{ color: '#94a3b8', flexShrink: 0, fontWeight: 700 }}>{total > 0 ? ((c.value / total) * 100).toFixed(0) : 0}%</span>
                    </div>
                  ));
                })()}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '180px', color: '#94a3b8' }}>Sin conceptos disponibles</div>
          )}
        </div>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>
            Concentración de Clientes
          </h4>
          <ResponsiveContainer width='100%' height={200}>
            <PieChart>
              <Pie data={clientData.slice(0, 6)} cx='50%' cy='50%' innerRadius={50} outerRadius={80} paddingAngle={2} dataKey='value' stroke='none'>
                {clientData.map((e, idx) => <Cell key={'c-' + idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(val) => fmt(val)} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '0.5rem' }}>
            {clientData.slice(0, 6).map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
                <span style={{ color: '#475569', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                <span style={{ color: '#94a3b8', flexShrink: 0, fontWeight: 700 }}>{totalBruto > 0 ? ((c.value / totalBruto) * 100).toFixed(0) : 0}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
