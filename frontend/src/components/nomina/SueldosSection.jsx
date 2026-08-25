import React, { useState, useMemo } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { SectionCard, KpiRow, ConceptCard, fmt } from '../ui/Primitives';

export const SueldosSection = ({ data, year }) => {
  const [selectedEmployer, setSelectedEmployer] = useState('Global');

  const {
    totalBruto, totalDeducciones, totalVales, neto,
    percepcionesPorTipo, deduccionesPorTipo, kpiData,
    latestSalaries, tiempo, nominaMensualData
  } = useMemo(() => {
    if (!data) return {};

    let targetRecibos = [];
    let tmpKpi = { ingresos: 0, gravado: 0, exento: 0, isr: 0 };
    let sal = { sbc: null, sdi: null, sd: null };

    if (selectedEmployer === 'Global') {
       targetRecibos = (data.detalle || []).flatMap(emp => emp.recibos);
       tmpKpi = { ingresos: data.total_ingresos, gravado: data.gravado, exento: data.exento, isr: data.isr_retenido };
    } else {
       const emp = (data.detalle || []).find(e => e.nombre === selectedEmployer);
       if (emp) {
         targetRecibos = emp.recibos;
         tmpKpi = { ingresos: emp.gravado + emp.exento, gravado: emp.gravado, exento: emp.exento, isr: emp.isr };

         let latestRecibo = null;
         const rList = emp.recibos || [];
         for (let i = rList.length - 1; i >= 0; i--) {
            const r = rList[i];
            const percs = r.percepciones || [];
            const isFiniquito = percs.some(p => p && (p.concepto || '').toLowerCase().includes('finiquito') || (p?.concepto || '').toLowerCase().includes('liquidac'));
            if (r.dias_pagados > 0 && percs.some(p => p && p.tipo === '001') && !isFiniquito) {
                latestRecibo = r;
                break;
            }
         }
         // Fallback si todos son irregulares
         if (!latestRecibo && rList.length > 0) {
             latestRecibo = rList[rList.length - 1];
         }

         if (latestRecibo && latestRecibo.raw_cfdi) {
            const raw = latestRecibo.raw_cfdi;
            sal.sbc = raw.salario_base_cot_apor;
            sal.sdi = raw.salario_diario_integrado;

            // Calcular SD estimado sumando TODOS los nodos 001 (Sueldo, Vacaciones ordinarias, etc.)
            const sueldos001 = (latestRecibo.percepciones || []).filter(p => p && p.tipo === '001');
            const valSueldo = sueldos001.reduce((acc, p) => acc + (p.total || (p.gravado + p.exento) || 0), 0);
            sal.sd = latestRecibo.dias_pagados > 0 ? (valSueldo / latestRecibo.dias_pagados).toFixed(2) : '-';
         }
       }
    }

    const allPercs = (targetRecibos || []).flatMap(r => r.percepciones || []).filter(Boolean);
    const allDeds = (targetRecibos || []).flatMap(r => r.deducciones || []).filter(Boolean);

    const calcPercs = Object.values(
       allPercs.reduce((acc, p) => {
         if (!p) return acc;
         const tipoClave = p.tipo || 'S/C';
         if (!acc[tipoClave]) acc[tipoClave] = { clave: tipoClave, total: 0, gravado: 0, exento: 0, items: [] };
         acc[tipoClave].total += (p.total || (p.gravado + p.exento) || 0);
         acc[tipoClave].gravado += p.gravado || 0;
         acc[tipoClave].exento += p.exento || 0;
         if (p.concepto) acc[tipoClave].items.push(p.concepto.trim());
         return acc;
       }, {})
    ).sort((a, b) => b.total - a.total);

    const calcDeds = Object.values(
       allDeds.reduce((acc, d) => {
         if (!d) return acc;
         const tipoClave = d.tipo || 'S/C';
         if (!acc[tipoClave]) acc[tipoClave] = { clave: tipoClave, total: 0, items: [] };
         acc[tipoClave].total += (d.importe || d.total || 0);
         if (d.concepto) acc[tipoClave].items.push(d.concepto.trim());
         return acc;
       }, {})
    ).sort((a, b) => b.total - a.total);

    const tBruto = calcPercs.reduce((acc, p) => acc + p.total, 0);
    const tDed = calcDeds.reduce((acc, d) => acc + d.total, 0);
    const tVales = calcPercs.find(p => p.clave === '029')?.total || 0;

    const targetRecibosConSueldo = (targetRecibos || []).filter(r => r.percepciones && r.percepciones.some(p => p && p.tipo === '001'));
    const totalDias = targetRecibosConSueldo.reduce((acc, r) => acc + (parseFloat(r.dias_pagados) || 0), 0);
    const meses = totalDias > 0 ? (totalDias / 30).toFixed(1) : ((targetRecibos || []).length > 0 ? ((targetRecibos.length) / 2).toFixed(1) : '1');

    const mLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const nominaMensualData = mLabels.map((m, idx) => {
      const mesNum = idx + 1;
      const recibosMes = (targetRecibos || []).filter(r => {
        const rm = parseInt((r.fecha || '').split('-')[1]);
        return rm === mesNum;
      });
      const brutoMes = recibosMes.reduce((s, r) => s + (r.total_bruto || (r.gravado + r.exento) || 0), 0);
      const isrMes = recibosMes.reduce((s, r) => s + (r.isr_retenido || 0), 0);
      const netoMes = recibosMes.reduce((s, r) => s + (r.neto || (r.total_bruto - r.isr_retenido) || 0), 0);
      const otrasDed = Math.max(0, Math.round((brutoMes - isrMes - netoMes) * 100) / 100);
      return {
        name: m,
        'Neto en Cuenta': netoMes,
        'ISR Retenido': isrMes,
        'Otras Retenciones': otrasDed,
        'Sueldo Bruto': brutoMes
      };
    });

    return {
      percepcionesPorTipo: calcPercs,
      deduccionesPorTipo: calcDeds,
      kpiData: tmpKpi,
      totalBruto: tBruto,
      totalDeducciones: tDed,
      totalVales: tVales,
      neto: tBruto - tDed - tVales,
      latestSalaries: sal,
      tiempo: { totalDias, meses },
      nominaMensualData
    };
  }, [data, selectedEmployer]);

  if (!data || !percepcionesPorTipo) return null;

  return (
    <SectionCard icon="👥" title="Sueldos, salarios y asimilados">

      {data.detalle && data.detalle.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
           <button
             onClick={() => setSelectedEmployer('Global')}
             style={{
               padding: '0.6rem 1.2rem', borderRadius: '30px', cursor: 'pointer', border: 'none',
               background: selectedEmployer === 'Global' ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : '#f1f5f9',
               color: selectedEmployer === 'Global' ? 'white' : '#475569',
               fontWeight: selectedEmployer === 'Global' ? '700' : '500',
               boxShadow: selectedEmployer === 'Global' ? '0 4px 10px rgba(59, 130, 246, 0.4)' : 'none',
               transition: 'all 0.3s ease', fontSize: '0.9rem'
             }}
           >
             🌐 Portafolio Global
           </button>
           {data.detalle.map((emp, i) => (
             <button
               key={i}
               onClick={() => setSelectedEmployer(emp.nombre)}
               style={{
                 padding: '0.6rem 1.2rem', borderRadius: '30px', cursor: 'pointer', border: 'none',
                 background: selectedEmployer === emp.nombre ? 'linear-gradient(135deg, #10b981, #059669)' : '#f1f5f9',
                 color: selectedEmployer === emp.nombre ? 'white' : '#475569',
                 fontWeight: selectedEmployer === emp.nombre ? '700' : '500',
                 boxShadow: selectedEmployer === emp.nombre ? '0 4px 10px rgba(16, 185, 129, 0.4)' : 'none',
                 transition: 'all 0.3s ease', fontSize: '0.9rem'
               }}
             >
               🏢 {emp.nombre.length > 25 ? emp.nombre.substring(0, 25) + '...' : emp.nombre}
             </button>
           ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '2rem', alignItems: 'center', background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,1) 100%)', backdropFilter: 'blur(12px)', borderRadius: '24px', padding: '2.5rem 2rem', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.03)', marginBottom: '2.5rem' }}>
         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: '1 1 200px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Masa Bruta Anual</span>
            <span style={{ fontSize: '2.75rem', fontWeight: 900, background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em', lineHeight: '1' }}>{fmt(totalBruto)}</span>
            {tiempo && tiempo.totalDias > 0 && parseFloat(tiempo.meses) > 0 && (
              <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 700, marginTop: '16px', background: '#f1f5f9', padding: '6px 16px', borderRadius: '16px' }}>
                Promedio: {fmt(totalBruto / tiempo.meses)} <span style={{ opacity: 0.6, marginLeft: '4px' }}>({tiempo.meses}m)</span>
              </div>
            )}
         </div>
         <div style={{ height: '48px', width: '48px', borderRadius: '24px', background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontSize: '1.75rem', fontWeight: 900, boxShadow: '0 4px 6px -1px rgba(239,68,68,0.1)' }}>−</div>
         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: '1 1 200px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Retenciones Fiscales</span>
            <span style={{ fontSize: '2.75rem', fontWeight: 900, background: 'linear-gradient(135deg, #7f1d1d, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em', lineHeight: '1' }}>{fmt(totalDeducciones)}</span>
            {tiempo && tiempo.totalDias > 0 && parseFloat(tiempo.meses) > 0 && (
              <div style={{ fontSize: '0.9rem', color: '#ef4444', fontWeight: 700, marginTop: '16px', background: '#fef2f2', padding: '6px 16px', borderRadius: '16px' }}>
                Impacto Mensual: {fmt(totalDeducciones / tiempo.meses)}
              </div>
            )}
         </div>
         <div style={{ height: '48px', width: '48px', borderRadius: '24px', background: 'linear-gradient(135deg, #fdf2f8, #fce7f3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ec4899', fontSize: '1.75rem', fontWeight: 900, boxShadow: '0 4px 6px -1px rgba(236,72,153,0.1)' }}>−</div>
         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: '1 1 200px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ec4899', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Vales de Despensa</span>
            <span style={{ fontSize: '2.75rem', fontWeight: 900, background: 'linear-gradient(135deg, #9d174d, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em', lineHeight: '1' }}>{fmt(totalVales)}</span>
            {tiempo && tiempo.totalDias > 0 && parseFloat(tiempo.meses) > 0 && (
              <div style={{ fontSize: '0.9rem', color: '#ec4899', fontWeight: 700, marginTop: '16px', background: '#fdf2f8', padding: '6px 16px', borderRadius: '16px' }}>
                Promedio: {fmt(totalVales / tiempo.meses)}
              </div>
            )}
         </div>
         <div style={{ height: '48px', width: '48px', borderRadius: '24px', background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontSize: '1.75rem', fontWeight: 900, boxShadow: '0 4px 6px -1px rgba(16,185,129,0.1)' }}>=</div>
         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: '1 1 200px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Liquidez Neta Libre</span>
            <span style={{ fontSize: '2.75rem', fontWeight: 900, background: 'linear-gradient(135deg, #064e3b, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em', lineHeight: '1' }}>{fmt(neto)}</span>
            {tiempo && tiempo.totalDias > 0 && parseFloat(tiempo.meses) > 0 && (
              <div style={{ fontSize: '0.9rem', color: '#10b981', fontWeight: 700, marginTop: '16px', background: '#ecfdf5', padding: '6px 16px', borderRadius: '16px' }}>
                Libre Mensual: {fmt(neto / tiempo.meses)}
              </div>
            )}
         </div>
      </div>

      <KpiRow items={[
        { label: 'Ingreso total (Base SAT)', value: kpiData.ingresos, help: 'Gravado + Exento' },
        { label: 'Ingreso gravado (acumulable)', value: kpiData.gravado, accent: 'kpi-accent' },
        { label: 'Ingreso exento', value: kpiData.exento },
        { label: 'ISR retenido', value: kpiData.isr, accent: 'kpi-danger' },
      ]} />

      {/* ── GRÁFICA DE EVOLUCIÓN MENSUAL DE NÓMINA (APILADA) ── */}
      {(() => {
        const mesesConSueldo = (nominaMensualData || []).filter(d => d['Sueldo Bruto'] > 0).length || 1;
        const promedioSueldoBruto = totalBruto > 0 ? (totalBruto / mesesConSueldo) : 0;
        const totalNetoCobrado = (nominaMensualData || []).reduce((s, d) => s + (d['Neto en Cuenta'] || 0), 0);
        const promedioSueldoNeto = totalNetoCobrado > 0 ? (totalNetoCobrado / mesesConSueldo) : 0;

        return (
          <div style={{ background: 'white', padding: '1.5rem 1.75rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', marginTop: '2rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h4 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '1rem', fontWeight: 800 }}>
                  📊 Composición Mensual de Nómina — Neto + Retenciones = Sueldo Bruto ({year})
                </h4>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Barras apiladas por componente con líneas de promedio mensual bruto y neto.</span>
              </div>
              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                <span style={{ color: '#64748b' }}>
                  Prom. Bruto: <strong style={{ color: '#6366f1', fontWeight: 800 }}>{fmt(promedioSueldoBruto)}</strong>
                </span>
                <span style={{ color: '#64748b' }}>
                  Prom. Neto: <strong style={{ color: '#10b981', fontWeight: 800 }}>{fmt(promedioSueldoNeto)}</strong>
                </span>
                <span style={{ color: '#64748b' }}>
                  Total Anual: <strong style={{ color: '#0f172a', fontWeight: 800 }}>{fmt(totalBruto)}</strong>
                </span>
              </div>
            </div>
            <ResponsiveContainer width='100%' height={290}>
              <ComposedChart data={nominaMensualData} margin={{ top: 15, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray='3 3' vertical={false} stroke='#e2e8f0' />
                <XAxis dataKey='name' tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => '$' + (v / 1000).toFixed(0) + 'k'} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(val, name) => [fmt(val), name]} cursor={{ fill: '#f8fafc' }} />
                <Legend iconType='circle' wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '10px' }} />
                <Bar dataKey='Neto en Cuenta' stackId='nomina' fill='#10b981' name='Neto en Cuenta' />
                <Bar dataKey='ISR Retenido' stackId='nomina' fill='#ef4444' name='ISR Retenido' />
                <Bar dataKey='Otras Retenciones' stackId='nomina' fill='#f59e0b' radius={[4, 4, 0, 0]} name='Otras Retenciones (IMSS/Ahorro)' />
                <Line type='monotone' dataKey='Sueldo Bruto' stroke='#6366f1' strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} name='Sueldo Bruto Total' />
                {promedioSueldoBruto > 0 && (
                  <ReferenceLine
                    y={promedioSueldoBruto}
                    stroke="#6366f1"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    label={{
                      position: 'insideTopLeft',
                      value: `Prom. Bruto: ${fmt(promedioSueldoBruto)}`,
                      fill: '#4338ca',
                      fontSize: 11,
                      fontWeight: 800
                    }}
                  />
                )}
                {promedioSueldoNeto > 0 && (
                  <ReferenceLine
                    y={promedioSueldoNeto}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    label={{
                      position: 'insideBottomLeft',
                      value: `Prom. Neto: ${fmt(promedioSueldoNeto)}`,
                      fill: '#065f46',
                      fontSize: 11,
                      fontWeight: 800
                    }}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        );
      })()}

      {selectedEmployer !== 'Global' && latestSalaries && (latestSalaries.sbc || latestSalaries.sdi || latestSalaries.sd) && (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.5rem', marginBottom: '2.5rem' }}>
         <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--gray)', fontWeight: '600', textTransform: 'uppercase' }}>Salario Diario (SD)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--dark)' }}>{latestSalaries.sd === '-' ? '-' : fmt(latestSalaries.sd)}</div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Estimado sueldo/días</div>
         </div>
         <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--gray)', fontWeight: '600', textTransform: 'uppercase' }}>Sal. Diario Integrado (SDI)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--dark)' }}>{latestSalaries.sdi ? fmt(latestSalaries.sdi) : '-'}</div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Dato del XML (Base SAT)</div>
         </div>
         <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--gray)', fontWeight: '600', textTransform: 'uppercase' }}>Salario Base de Cotización (SBC)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--dark)' }}>{latestSalaries.sbc ? fmt(latestSalaries.sbc) : '-'}</div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Dato del XML (Aportaciones)</div>
         </div>
      </div>
      )}

      <div style={{ marginTop: '2.5rem' }}>
        <h4 style={{ marginBottom: '1rem', color: 'var(--green)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          📈 Lo que ganaste (Percepciones)
        </h4>
        <div className="concept-grid">
          {percepcionesPorTipo.length === 0 ? (
             <p style={{ color: 'var(--gray)', fontSize: '0.85rem' }}>No hay percepciones registradas.</p>
          ) : (
            percepcionesPorTipo.map((g, i) => (
              <ConceptCard
                key={'gp' + i}
                title={`Clave: ${g.clave} - ${Array.from(new Set(g.items))[0] || 'Varios'}`}
                value={g.total}
                accent="green"
                metaItems={[
                  { label: 'Detalle', value: Array.from(new Set(g.items)).join(', ') },
                  { label: 'Gravado', value: fmt(g.gravado) },
                  { label: 'Exento', value: fmt(g.exento) }
                ]}
              />
            ))
          )}
        </div>
      </div>

      <div style={{ marginTop: '2.5rem' }}>
        <h4 style={{ marginBottom: '1rem', color: 'var(--red)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          📉 Lo que te descontaron (Deducciones e Impuestos)
        </h4>
        <div className="concept-grid">
          {deduccionesPorTipo.length === 0 ? (
             <p style={{ color: 'var(--gray)', fontSize: '0.85rem' }}>No hay deducciones registradas.</p>
          ) : (
            deduccionesPorTipo.map((g, i) => (
              <ConceptCard
                key={'gd' + i}
                title={`Clave: ${g.clave} - ${Array.from(new Set(g.items))[0] || 'Varios'}`}
                value={g.total}
                accent="red"
                metaItems={[
                  { label: 'Detalle', value: Array.from(new Set(g.items)).join(', ') }
                ]}
              />
            ))
          )}
        </div>
      </div>

    </SectionCard>
  );
};
