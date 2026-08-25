import React, { useState, useMemo } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { SectionCard, KpiRow, ConceptCard, fmt } from '../ui/Primitives';

export const SueldosSection = ({ data, year }) => {
  const [selectedEmployer, setSelectedEmployer] = useState('Global');
  if (!data) return null;

  const currentViewData = useMemo(() => {
    if (selectedEmployer === 'Global') {
      return {
        totalBruto: data.total_bruto || (data.gravado + data.exento),
        totalDeducciones: data.total_deducciones || data.isr_retenido,
        totalVales: data.total_vales || 0,
        neto: data.neto || (data.total_ingresos - data.isr_retenido),
        percepcionesPorTipo: data.percepciones_por_tipo || [],
        deduccionesPorTipo: data.deducciones_por_tipo || [],
        nominaMensualData: data.nomina_mensual_resumen || [],
        meses: data.meses_laborados || 12,
        kpiData: {
          ingresos: data.total_ingresos,
          gravado: data.gravado,
          exento: data.exento,
          isr: data.isr_retenido
        },
        salarios: { sbc: null, sdi: null, sd: null }
      };
    }

    const emp = (data.detalle || []).find(e => e.nombre === selectedEmployer);
    if (!emp) return { percepcionesPorTipo: [], deduccionesPorTipo: [], nominaMensualData: [] };

    const targetRecibos = emp.recibos || [];
    const allPercs = targetRecibos.flatMap(r => r.percepciones || []).filter(Boolean);
    const allDeds = targetRecibos.flatMap(r => r.deducciones || []).filter(Boolean);

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

    const mLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const nominaMensualData = mLabels.map((m, idx) => {
      const mesNum = idx + 1;
      const recibosMes = targetRecibos.filter(r => {
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
      totalBruto: tBruto,
      totalDeducciones: tDed,
      totalVales: tVales,
      neto: tBruto - tDed - tVales,
      percepcionesPorTipo: calcPercs,
      deduccionesPorTipo: calcDeds,
      nominaMensualData,
      meses: targetRecibos.length > 0 ? (targetRecibos.length / 2).toFixed(1) : '1',
      kpiData: {
        ingresos: emp.gravado + emp.exento,
        gravado: emp.gravado,
        exento: emp.exento,
        isr: emp.isr
      },
      salarios: {
        sbc: targetRecibos[0]?.salario_base_cot_apor,
        sdi: targetRecibos[0]?.salario_diario_integrado,
        sd: targetRecibos[0]?.dias_pagados > 0 ? (tBruto / (targetRecibos.length * 15)).toFixed(2) : '-'
      }
    };
  }, [data, selectedEmployer]);

  const { totalBruto, totalDeducciones, totalVales, neto, percepcionesPorTipo, deduccionesPorTipo, kpiData, nominaMensualData, meses } = currentViewData;

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

      {/* Tarjeta de Masa Bruta y Flujo */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '2rem', alignItems: 'center',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,1) 100%)',
        backdropFilter: 'blur(12px)', borderRadius: '24px', padding: '2.5rem 2rem',
        border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.03)', marginBottom: '2.5rem'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: '1 1 200px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Masa Bruta Anual</span>
          <span style={{ fontSize: '2.75rem', fontWeight: 900, background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em', lineHeight: '1' }}>{fmt(totalBruto)}</span>
          {Number(meses) > 0 && (
            <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 700, marginTop: '16px', background: '#f1f5f9', padding: '6px 16px', borderRadius: '16px' }}>
              Promedio: {fmt(totalBruto / Number(meses))} <span style={{ opacity: 0.6, marginLeft: '4px' }}>({meses}m)</span>
            </div>
          )}
        </div>
        <div style={{ height: '48px', width: '48px', borderRadius: '24px', background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontSize: '1.75rem', fontWeight: 900, boxShadow: '0 4px 6px -1px rgba(239,68,68,0.1)' }}>−</div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: '1 1 200px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Deducciones & Retenciones</span>
          <span style={{ fontSize: '2.75rem', fontWeight: 900, color: '#ef4444', letterSpacing: '-0.02em', lineHeight: '1' }}>{fmt(totalDeducciones)}</span>
          <div style={{ fontSize: '0.9rem', color: '#991b1b', fontWeight: 700, marginTop: '16px', background: '#fef2f2', padding: '6px 16px', borderRadius: '16px' }}>
            ISR: {fmt(kpiData.isr)}
          </div>
        </div>
        <div style={{ height: '48px', width: '48px', borderRadius: '24px', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontSize: '1.75rem', fontWeight: 900, boxShadow: '0 4px 6px -1px rgba(16,185,129,0.1)' }}>=</div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: '1 1 200px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Neto Depositado</span>
          <span style={{ fontSize: '2.75rem', fontWeight: 900, color: '#10b981', letterSpacing: '-0.02em', lineHeight: '1' }}>{fmt(neto)}</span>
          <div style={{ fontSize: '0.9rem', color: '#065f46', fontWeight: 700, marginTop: '16px', background: '#f0fdf4', padding: '6px 16px', borderRadius: '16px' }}>
            Efectivo libre
          </div>
        </div>
      </div>

      <KpiRow items={[
        { label: 'Total ingresos por nómina', value: kpiData.ingresos, help: 'Bruto percibido' },
        { label: 'Ingresos gravados', value: kpiData.gravado, accent: 'kpi-accent', help: 'Base para cálculo del ISR anual' },
        { label: 'Ingresos exentos', value: kpiData.exento, accent: 'kpi-success', help: 'Aguinaldo, PTU y primas exentas' },
        { label: 'ISR retenido en nómina', value: kpiData.isr, accent: 'kpi-danger', help: 'Enterado por tu empleador al SAT' },
      ]} />

      {/* Gráfica de Serie Mensual */}
      {nominaMensualData.length > 0 && (
        <div style={{ background: 'white', padding: '1.75rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', marginTop: '2rem' }}>
          <h4 style={{ margin: '0 0 1.5rem 0', color: '#1e293b', fontSize: '1.05rem', fontWeight: 800 }}>
            📈 Flujo de Nómina Mensual — Neto vs Retenciones ({year})
          </h4>
          <ResponsiveContainer width='100%' height={320}>
            <ComposedChart data={nominaMensualData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray='3 3' vertical={false} stroke='#e2e8f0' />
              <XAxis dataKey='name' tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => '$' + (v / 1000).toFixed(0) + 'k'} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(val, name) => [fmt(val), name]} cursor={{ fill: '#f8fafc' }} />
              <Legend iconType='circle' wrapperStyle={{ fontSize: '13px', fontWeight: 600 }} />
              <Bar dataKey='Neto en Cuenta' stackId='a' fill='#10b981' name='Neto Depositado' />
              <Bar dataKey='ISR Retenido' stackId='a' fill='#ef4444' name='ISR Retenido' />
              <Bar dataKey='Otras Retenciones' stackId='a' fill='#f59e0b' name='Otras Retenciones' radius={[4, 4, 0, 0]} />
              <Line type='monotone' dataKey='Sueldo Bruto' stroke='#3b82f6' strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} name='Masa Bruta' />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Desglose de Percepciones y Deducciones */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
        <div>
          <h4 style={{ marginBottom: '1rem', color: '#1e293b', fontWeight: 800 }}>Percepciones Detectadas</h4>
          <div className="concept-grid">
            {percepcionesPorTipo.map((it, idx) => (
              <ConceptCard key={idx} title={`${it.clave} — ${(it.items || []).join(' / ') || 'Percepción'}`} value={it.total} accent="blue" />
            ))}
          </div>
        </div>

        <div>
          <h4 style={{ marginBottom: '1rem', color: '#1e293b', fontWeight: 800 }}>Deducciones y Retenciones</h4>
          <div className="concept-grid">
            {deduccionesPorTipo.map((it, idx) => (
              <ConceptCard key={idx} title={`${it.clave} — ${(it.items || []).join(' / ') || 'Deducción'}`} value={it.total} accent="red" />
            ))}
          </div>
        </div>
      </div>
    </SectionCard>
  );
};
