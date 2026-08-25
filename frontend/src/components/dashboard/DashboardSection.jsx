import React from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

export function DashboardSection({ sections, year, data }) {
  const nomina = sections?.sueldos;
  const aeyp = sections?.honorarios;
  const gastos = sections?.reporte_gastos || [];
  const deducciones = sections?.deducciones_personales || {};
  const simAnual = data?.simulacion_anual || {};
  const oficial = data?.oficial_sat;

  const mLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const fmt = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val ?? 0);

  const nominaMaps = {};
  (nomina?.detalle || []).flatMap(emp => emp.recibos || []).forEach(r => {
    const month = parseInt((r.fecha || '').split('-')[1]);
    if (isNaN(month) || month < 1 || month > 12) return;
    const m = mLabels[month - 1];
    const montoRecibo = ((r.gravado || 0) + (r.exento || 0)) > 0
      ? ((r.gravado || 0) + (r.exento || 0))
      : (r.total || 0);
    nominaMaps[m] = (nominaMaps[m] || 0) + montoRecibo;
  });

  const aeypMaps = {};
  (aeyp?.detalle || []).forEach(item => {
    const month = parseInt((item.fecha || '').split('-')[1]);
    if (isNaN(month) || month < 1 || month > 12) return;
    const m = mLabels[month - 1];
    aeypMaps[m] = (aeypMaps[m] || 0) + (item.subtotal || 0);
  });

  const totalNomina = (nomina?.gravado || 0) + (nomina?.exento || 0);
  const totalAeyp = aeyp?.ingresos || 0;
  const totalGeneral = totalNomina + totalAeyp;
  const totalGastosDed = gastos.filter(g => g.es_deducible_fiscal !== false).reduce((s, g) => s + (g.subtotal || 0), 0);
  const totalRetenciones = (nomina?.isr_retenido || 0) + (aeyp?.isr_retenido || 0) + (sections?.intereses?.isr_retenido || 0);

  const mensualData = mLabels.map(m => ({
    name: m,
    'Nómina': nominaMaps[m] || 0,
    'Honorarios': aeypMaps[m] || 0,
    'Total': (nominaMaps[m] || 0) + (aeypMaps[m] || 0),
  }));

  const pieSources = [
    { name: 'Sueldos y Nómina', value: totalNomina },
    { name: 'Honorarios / AEyP', value: totalAeyp },
  ].filter(x => x.value > 0);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];
  const esSaldoFavor = (simAnual.saldo_a_favor_proyectado || 0) > 0;
  const saldoMonto = esSaldoFavor ? simAnual.saldo_a_favor_proyectado : simAnual.saldo_a_cargo_proyectado;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* ── HERO BANNER DEL RESULTADO ANUAL PREVIO ── */}
      <div style={{
        background: esSaldoFavor
          ? 'linear-gradient(135deg, #022c22 0%, #065f46 50%, #0f172a 100%)'
          : 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 50%, #1e1b4b 100%)',
        borderRadius: '24px',
        padding: '2.25rem',
        color: 'white',
        boxShadow: esSaldoFavor ? '0 12px 30px -8px rgba(6,78,59,0.4)' : '0 12px 30px -8px rgba(127,29,29,0.4)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: esSaldoFavor ? 'rgba(52, 211, 153, 0.2)' : 'rgba(248, 113, 113, 0.2)',
            border: `1px solid ${esSaldoFavor ? 'rgba(52, 211, 153, 0.4)' : 'rgba(248, 113, 113, 0.4)'}`,
            padding: '4px 14px',
            borderRadius: '999px',
            fontSize: '0.8rem',
            fontWeight: 800,
            color: esSaldoFavor ? '#6ee7b7' : '#fca5a5'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: esSaldoFavor ? '#34d399' : '#ef4444' }} />
            PRE-DECLARACIÓN FISCAL ANUAL • EJERCICIO {year}
          </div>

          {oficial && (
            <span style={{ fontSize: '0.8rem', color: '#cbd5e1', background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: '8px', fontWeight: 700 }}>
              🏛️ Acuse SAT Registrado (Op. {oficial.num_operacion})
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: esSaldoFavor ? '#a7f3d0' : '#fecaca', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {esSaldoFavor ? '🎉 Saldo a Favor Estimado (Devolución)' : '⚠️ Impuesto Anual a Cargo Estimado'}
            </div>
            <h1 style={{ margin: '4px 0 0 0', fontSize: '2.8rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {fmt(saldoMonto || 0)}
            </h1>
            <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.9rem', color: '#f1f5f9', opacity: 0.9 }}>
              {esSaldoFavor
                ? `Cálculo automático de tus XMLs: Tienes derecho a solicitar ${fmt(saldoMonto)} de devolución ante el SAT.`
                : `Cálculo automático de tus XMLs: Se proyecta un impuesto a cargo de ${fmt(saldoMonto)} para este año.`}
            </p>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', padding: '1.25rem 1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: '#cbd5e1' }}>Ingresos Acumulables:</span>
              <b style={{ color: 'white', fontFamily: 'monospace' }}>{fmt(simAnual.ingresos_acumulables_totales || 0)}</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: '#cbd5e1' }}>Deducciones Personales:</span>
              <b style={{ color: '#fcd34d', fontFamily: 'monospace' }}>-{fmt(simAnual.deducciones_personales_aplicadas || 0)}</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: '#cbd5e1' }}>ISR Causado (Art. 152):</span>
              <b style={{ color: '#fca5a5', fontFamily: 'monospace' }}>{fmt(simAnual.isr_anual_causado || 0)}</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: '#cbd5e1' }}>Retenciones Acreditables:</span>
              <b style={{ color: '#34d399', fontFamily: 'monospace' }}>-{fmt(simAnual.retenciones_totales_acreditables || 0)}</b>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4 KPIS CONSOLIDADOS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Ingresos Totales', value: fmt(totalNomina + totalAeyp), color: '#3b82f6', icon: '💼', sub: `Sueldos: ${fmt(totalNomina)} | Hon: ${fmt(totalAeyp)}` },
          { label: 'Gastos Deducibles', value: fmt(totalGastosDed), color: '#059669', icon: '📉', sub: `${gastos.length} comprobantes en disco` },
          { label: 'Deducciones Personales', value: fmt(deducciones.total || 0), color: '#f59e0b', icon: '🏥', sub: `Tope: ${fmt(deducciones.tope?.tope_aplicable || 0)}` },
          { label: 'Retenciones ISR', value: fmt(totalRetenciones), color: '#7c3aed', icon: '🏛️', sub: `Acreditables a tu favor` },
        ].map((k, i) => (
          <div key={i} style={{ background: 'white', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <span style={{ fontSize: '1.1rem' }}>{k.icon}</span>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>{k.label}</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: k.color, fontFamily: 'monospace' }}>{k.value}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px', fontWeight: 600 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ── GRÁFICA DE EVOLUCIÓN MENSUAL ── */}
      <div style={{ background: 'white', padding: '1.5rem 1.75rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <h4 style={{ margin: '0 0 1.25rem 0', color: '#0f172a', fontSize: '1rem', fontWeight: 800 }}>
          📈 Flujo Mensual de Ingresos — Sueldos vs Honorarios ({year})
        </h4>
        <ResponsiveContainer width='100%' height={280}>
          <ComposedChart data={mensualData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray='3 3' vertical={false} stroke='#e2e8f0' />
            <XAxis dataKey='name' tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => '$' + (v / 1000).toFixed(0) + 'k'} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(val, name) => [fmt(val), name]} cursor={{ fill: '#f8fafc' }} />
            <Legend iconType='circle' wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} />
            <Bar dataKey='Nómina' stackId='a' fill='#6366f1' name='Sueldos y Salarios' />
            <Bar dataKey='Honorarios' stackId='a' fill='#10b981' radius={[4, 4, 0, 0]} name='Honorarios / Facturación' />
            <Line type='monotone' dataKey='Total' stroke='#f59e0b' strokeWidth={3} dot={{ r: 4, fill: '#f59e0b' }} name='Ingreso Total' />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>
            Composición de Ingresos {year}
          </h4>
          <ResponsiveContainer width='100%' height={200}>
            <PieChart>
              <Pie data={pieSources} cx='50%' cy='50%' innerRadius={55} outerRadius={85} paddingAngle={3} dataKey='value' stroke='none'>
                {pieSources.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(val) => fmt(val)} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '0.75rem' }}>
            {pieSources.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: '13px', color: '#334155', fontWeight: 600 }}>{s.name}</span>
                <span style={{ fontSize: '13px', color: '#475569', fontWeight: 700 }}>{fmt(s.value)}</span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>{totalGeneral > 0 ? ((s.value / totalGeneral) * 100).toFixed(0) : 0}%</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', overflowX: 'auto' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Resumen por Mes
          </h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ textAlign: 'left', padding: '4px 8px', color: '#64748b', fontWeight: 700 }}>Mes</th>
                <th style={{ textAlign: 'right', padding: '4px 8px', color: '#6366f1', fontWeight: 700 }}>Nómina</th>
                <th style={{ textAlign: 'right', padding: '4px 8px', color: '#10b981', fontWeight: 700 }}>Honorarios</th>
                <th style={{ textAlign: 'right', padding: '4px 8px', color: '#f59e0b', fontWeight: 700 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {mensualData.filter(m => m.Total > 0).map((m, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '5px 8px', fontWeight: 600, color: '#334155' }}>{m.name}</td>
                  <td style={{ padding: '5px 8px', textAlign: 'right', color: '#6366f1' }}>{m['Nómina'] > 0 ? fmt(m['Nómina']) : '—'}</td>
                  <td style={{ padding: '5px 8px', textAlign: 'right', color: '#10b981' }}>{m.Honorarios > 0 ? fmt(m.Honorarios) : '—'}</td>
                  <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>{fmt(m.Total)}</td>
                </tr>
              ))}
              <tr style={{ borderTop: '2px solid #e2e8f0', background: '#f8fafc' }}>
                <td style={{ padding: '6px 8px', fontWeight: 800, color: '#0f172a' }}>TOTAL</td>
                <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 800, color: '#6366f1' }}>{fmt(totalNomina)}</td>
                <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 800, color: '#10b981' }}>{fmt(totalAeyp)}</td>
                <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 900, color: '#0f172a' }}>{fmt(totalGeneral)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Panel Fiscal: Impuestos y Retenciones ── */}
      {(() => {
        const isrNomina = nomina?.isr_retenido || 0;
        const isrAeyp = aeyp?.isr_retenido || 0;
        const isrInt = sections?.intereses?.isr_retenido || 0;
        const ivaTrasl = aeyp?.mensual?.reduce((s, m) => s + (m.datos?.iva_tras || 0), 0) || 0;
        const ivaRet = aeyp?.iva_retenido || 0;
        const totalIsrRet = isrNomina + isrAeyp + isrInt;
        const ivaNetoCargo = ivaTrasl - ivaRet;

        const kpis = [
          { label: 'ISR Retenido (Nómina)', value: fmt(isrNomina), color: '#6366f1', icon: '👥', tip: 'ISR que tus empleadores retuvieron al pagarte' },
          { label: 'ISR Retenido (AEyP)', value: fmt(isrAeyp), color: '#10b981', icon: '💼', tip: 'ISR que tus clientes retuvieron en facturas' },
          { label: 'ISR Retenido (Intereses)', value: fmt(isrInt), color: '#8b5cf6', icon: '🏦', tip: 'ISR retenido por Cetes/bancos en tus rendimientos' },
          { label: 'Total ISR Retenido', value: fmt(totalIsrRet), color: '#ef4444', icon: '🧮', tip: 'Acreditable contra tu ISR anual' },
          { label: 'IVA Trasladado (Cobrado)', value: fmt(ivaTrasl), color: '#f59e0b', icon: '🏛️', tip: 'IVA que cobraste a clientes — pertenece al SAT' },
          { label: 'IVA Retenido (por Clientes)', value: fmt(ivaRet), color: '#ec4899', icon: '✂️', tip: 'IVA que clientes te retuvieron y enteraron al SAT' },
          { label: ivaNetoCargo >= 0 ? 'IVA a Cargo (SAT)' : 'IVA a Favor', value: fmt(Math.abs(ivaNetoCargo)), color: ivaNetoCargo >= 0 ? '#ef4444' : '#10b981', icon: ivaNetoCargo >= 0 ? '⬆️' : '⬇️', tip: 'IVA Trasladado − IVA Retenido (sin acreditable de gastos)' },
        ];

        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
              <div style={{ width: '4px', height: '22px', borderRadius: '2px', background: 'linear-gradient(180deg,#ef4444,#f59e0b)' }} />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#334155' }}>Impuestos y Retenciones — {year}</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem' }}>
              {kpis.map((k, i) => (
                <div key={i} title={k.tip} style={{ background: 'white', borderRadius: '12px', padding: '1rem 1.25rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden', cursor: 'default' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: k.color }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <span>{k.icon}</span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', lineHeight: 1.2 }}>{k.label}</span>
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: k.color }}>{k.value}</div>
                </div>
              ))}
            </div>

            {/* Waterfall visual ISR */}
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', marginTop: '1rem' }}>
              <h4 style={{ margin: '0 0 1.25rem 0', color: '#475569', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '1px' }}>ISR Retenido por Fuente</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'Nómina (empleadores)', value: isrNomina, color: '#6366f1' },
                  { label: 'AEyP / Honorarios (clientes)', value: isrAeyp, color: '#10b981' },
                  { label: 'Intereses y Rendimientos', value: isrInt, color: '#8b5cf6' },
                ].map((row, i) => {
                  const pct = totalIsrRet > 0 ? (row.value / totalIsrRet) * 100 : 0;
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '12px' }}>
                        <span style={{ color: '#475569', fontWeight: 600 }}>{row.label}</span>
                        <span style={{ color: row.color, fontWeight: 800 }}>{fmt(row.value)} <span style={{ color: '#94a3b8', fontWeight: 500 }}>({pct.toFixed(0)}%)</span></span>
                      </div>
                      <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: pct + '%', background: row.color, borderRadius: '4px', transition: 'width 0.8s ease' }} />
                      </div>
                    </div>
                  );
                })}
                <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ fontWeight: 800, color: '#0f172a' }}>Total ISR Retenido (Acreditable)</span>
                  <span style={{ fontWeight: 900, color: '#ef4444', fontSize: '1rem' }}>{fmt(totalIsrRet)}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
