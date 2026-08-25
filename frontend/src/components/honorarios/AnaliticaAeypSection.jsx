import React, { useState, useMemo } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { CHART_COLORS, MONTH_NAMES, fmt } from '../ui/Primitives';

export function AnaliticaAeypSection({ data, year }) {
  const [selectedClient, setSelectedClient] = useState('Global');
  if (!data) return null;

  const topClientes = data.top_clientes || [];
  const mixConceptos = data.mix_conceptos || [];
  const backendMensual = data.analitica_mensual || [];

  // Cuando está en modo Global, consumimos directamente las series ya calculadas por el backend
  // Si se selecciona un cliente específico, filtramos sólo las facturas de ese cliente
  const filteredData = useMemo(() => {
    if (selectedClient === 'Global') {
      const best = backendMensual.reduce((a, b) => (b.Neto > (a?.Neto || 0) ? b : a), backendMensual[0]);
      return {
        mensual: backendMensual,
        totalBruto: (data.ingresos || 0) + (data.iva_trasladado || data.total_iva_tras || 0),
        totalSubtotal: data.ingresos || 0,
        totalIva: data.iva_trasladado || data.total_iva_tras || 0,
        bestMonth: best,
        serviceMix: mixConceptos.slice(0, 8),
        clientsPie: topClientes.slice(0, 6).map(c => ({ name: c.nombre, value: c.total }))
      };
    }

    const clientRecibos = (data.detalle || []).filter(d => (d.rfc || d.cliente) === selectedClient);
    const maps = {};
    clientRecibos.forEach(item => {
      if (!item.fecha) return;
      const month = parseInt(item.fecha.split('-')[1]);
      if (isNaN(month) || month < 1 || month > 12) return;
      const name = MONTH_NAMES[month - 1].slice(0, 3);
      if (!maps[name]) maps[name] = { name, Subtotal: 0, IVA: 0, Neto: 0 };
      maps[name].Subtotal += item.subtotal || 0;
      maps[name].IVA += item.iva || 0;
      maps[name].Neto += (item.subtotal || 0) + (item.iva || 0);
    });

    const mensual = MONTH_NAMES.map(m => maps[m.slice(0, 3)] || { name: m.slice(0, 3), Subtotal: 0, IVA: 0, Neto: 0 });
    const totalSub = clientRecibos.reduce((s, r) => s + (r.subtotal || 0), 0);
    const totalIva = clientRecibos.reduce((s, r) => s + (r.iva || 0), 0);
    const best = mensual.reduce((a, b) => (b.Neto > (a?.Neto || 0) ? b : a), mensual[0]);

    return {
      mensual,
      totalBruto: totalSub + totalIva,
      totalSubtotal: totalSub,
      totalIva,
      bestMonth: best,
      serviceMix: mixConceptos.slice(0, 8),
      clientsPie: topClientes.slice(0, 6).map(c => ({ name: c.nombre, value: c.total }))
    };
  }, [selectedClient, data, backendMensual, topClientes, mixConceptos]);

  return (
    <>
      {topClientes.length > 0 && (
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedClient('Global')}
            style={{
              padding: '0.5rem 1.1rem', borderRadius: '30px', cursor: 'pointer', border: 'none',
              background: selectedClient === 'Global' ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : '#f1f5f9',
              color: selectedClient === 'Global' ? 'white' : '#475569',
              fontWeight: selectedClient === 'Global' ? '700' : '500', fontSize: '0.85rem', transition: 'all 0.3s'
            }}
          >
            🌎 Global
          </button>
          {topClientes.map((cli, i) => (
            <button
              key={i}
              onClick={() => setSelectedClient(cli.rfc)}
              style={{
                padding: '0.5rem 1.1rem', borderRadius: '30px', cursor: 'pointer', border: 'none',
                background: selectedClient === cli.rfc ? 'linear-gradient(135deg, #10b981, #059669)' : '#f1f5f9',
                color: selectedClient === cli.rfc ? 'white' : '#475569',
                fontWeight: selectedClient === cli.rfc ? '700' : '500', fontSize: '0.85rem', transition: 'all 0.3s'
              }}
            >
              🏢 {cli.nombre}
            </button>
          ))}
        </div>
      )}

      {/* KPIs Consolidados */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Facturado Bruto', value: fmt(filteredData.totalBruto), color: '#3b82f6', icon: '💰' },
          { label: 'Subtotal Neto', value: fmt(filteredData.totalSubtotal), color: '#10b981', icon: '📄' },
          { label: 'IVA Trasladado', value: fmt(filteredData.totalIva), color: '#f59e0b', icon: '🏛️' },
          { label: 'Mejor Mes', value: filteredData.bestMonth?.name || '—', color: '#6366f1', icon: '📅', sub: fmt(filteredData.bestMonth?.Neto) },
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

      {/* Gráfica de Evolución Mensual */}
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.04)', marginBottom: '1.5rem' }}>
        <h4 style={{ margin: '0 0 1.5rem 0', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Evolución Mensual — Subtotal + IVA vs Bruto Cobrado ({year})
        </h4>
        <ResponsiveContainer width='100%' height={290}>
          <ComposedChart data={filteredData.mensual} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
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

      {/* Gráficas de Mix de Servicios y Concentración de Clientes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>
            Mix de Servicios (Catálogo SAT)
          </h4>
          {filteredData.serviceMix.length > 0 ? (
            <>
              <ResponsiveContainer width='100%' height={200}>
                <PieChart>
                  <Pie data={filteredData.serviceMix} cx='50%' cy='50%' innerRadius={50} outerRadius={82} paddingAngle={2} dataKey='value' stroke='none'>
                    {filteredData.serviceMix.map((e, idx) => <Cell key={'sm-' + idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(val) => fmt(val)} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '0.5rem' }}>
                {(() => {
                  const total = filteredData.serviceMix.reduce((s, e) => s + e.value, 0);
                  return filteredData.serviceMix.map((c, i) => (
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
          {filteredData.clientsPie.length > 0 ? (
            <>
              <ResponsiveContainer width='100%' height={200}>
                <PieChart>
                  <Pie data={filteredData.clientsPie} cx='50%' cy='50%' innerRadius={50} outerRadius={80} paddingAngle={2} dataKey='value' stroke='none'>
                    {filteredData.clientsPie.map((e, idx) => <Cell key={'c-' + idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(val) => fmt(val)} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '0.5rem' }}>
                {filteredData.clientsPie.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                    <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
                    <span style={{ color: '#475569', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                    <span style={{ color: '#94a3b8', flexShrink: 0, fontWeight: 700 }}>
                      {filteredData.totalBruto > 0 ? ((c.value / filteredData.totalBruto) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '180px', color: '#94a3b8' }}>Sin clientes disponibles</div>
          )}
        </div>
      </div>
    </>
  );
}
