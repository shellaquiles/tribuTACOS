'use client';

import React, { useState, useMemo } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { SectionCard, KpiRow, ConceptCard, fmt } from '../ui/Primitives';

export const SueldosSection = ({ data, sueldos, year }) => {
  const [selectedEmployer, setSelectedEmployer] = useState('Global');
  const currentData = data || sueldos;

  if (!currentData || (!currentData.total_ingresos && !currentData.gravado && (!currentData.detalle || currentData.detalle.length === 0))) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
        No se encontraron comprobantes de sueldos y salarios timbrados para el ejercicio {year || 'seleccionado'}.
      </div>
    );
  }

  const currentViewData = useMemo(() => {
    if (selectedEmployer === 'Global') {
      return {
        totalBruto: currentData.total_bruto || (currentData.gravado + currentData.exento),
        totalDeducciones: currentData.total_deducciones || currentData.isr_retenido,
        totalVales: currentData.total_vales || 0,
        neto: currentData.neto || (currentData.total_ingresos - currentData.isr_retenido),
        percepcionesPorTipo: currentData.percepciones_por_tipo || [],
        deduccionesPorTipo: currentData.deducciones_por_tipo || [],
        nominaMensualData: currentData.nomina_mensual_resumen || [],
        meses: currentData.meses_laborados || 12,
        kpiData: {
          ingresos: currentData.total_ingresos,
          gravado: currentData.gravado,
          exento: currentData.exento,
          isr: currentData.isr_retenido
        },
        salarios: { sbc: null, sdi: null, sd: null }
      };
    }

    const emp = (currentData.detalle || []).find(e => e.nombre === selectedEmployer);
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
  }, [currentData, selectedEmployer]);

  const { totalBruto, totalDeducciones, neto, percepcionesPorTipo, deduccionesPorTipo, kpiData, nominaMensualData, meses } = currentViewData;

  return (
    <div className="flex flex-col gap-6 text-slate-800">

      {/* ── Encabezado y Selector de Empleador ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex justify-between items-center flex-wrap gap-4 pb-4 border-b border-slate-100 mb-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
              Régimen de Sueldos y Salarios • Ejercicio {year}
            </span>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Ingresos y Retenciones de Nómina
            </h2>
          </div>

          {currentData.detalle && currentData.detalle.length > 0 && (
            <div className="flex gap-1.5 flex-wrap bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setSelectedEmployer('Global')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  selectedEmployer === 'Global'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Portafolio Global
              </button>
              {currentData.detalle.map((emp, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedEmployer(emp.nombre)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    selectedEmployer === emp.nombre
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {emp.nombre.length > 25 ? emp.nombre.substring(0, 25) + '...' : emp.nombre}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Resumen de Flujo de Nómina */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Masa Bruta Anual</span>
            <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
              {fmt(totalBruto)}
            </div>
            {Number(meses) > 0 && (
              <div className="text-xs text-slate-500 mt-1">
                Promedio mensual: {fmt(totalBruto / Number(meses))}
              </div>
            )}
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Deducciones y Retenciones</span>
            <div className="text-2xl font-bold text-red-700 font-mono mt-1">
              {fmt(totalDeducciones)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              ISR Retenido: {fmt(kpiData.isr)}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Neto Depositado</span>
            <div className="text-2xl font-bold text-emerald-700 font-mono mt-1">
              {fmt(neto)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Total percibido en cuenta bancaria
            </div>
          </div>
        </div>

        <KpiRow items={[
          { label: 'Total ingresos por nómina', value: kpiData.ingresos, help: 'Bruto percibido' },
          { label: 'Ingresos gravados', value: kpiData.gravado, accent: 'kpi-accent', help: 'Base para cálculo del ISR anual' },
          { label: 'Ingresos exentos', value: kpiData.exento, accent: 'kpi-success', help: 'Aguinaldo, PTU y primas exentas' },
          { label: 'ISR retenido en nómina', value: kpiData.isr, accent: 'kpi-danger', help: 'Enterado por tu empleador al SAT' },
        ]} />
      </div>

      {/* Gráfica de Serie Mensual */}
      {nominaMensualData && nominaMensualData.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4">
            Flujo de Nómina Mensual — Neto vs Retenciones ({year})
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={nominaMensualData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => '$' + (v / 1000).toFixed(0) + 'k'} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(val, name) => [fmt(val), name]} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="Neto en Cuenta" stackId="a" fill="#10b981" name="Neto Depositado" />
              <Bar dataKey="ISR Retenido" stackId="a" fill="#ef4444" name="ISR Retenido" />
              <Bar dataKey="Otras Retenciones" stackId="a" fill="#f59e0b" name="Otras Retenciones" radius={[3, 3, 0, 0]} />
              <Line type="monotone" dataKey="Sueldo Bruto" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3, fill: '#2563eb' }} name="Masa Bruta" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Desglose de Percepciones y Deducciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Percepciones Detectadas</h3>
              <p className="text-xs text-slate-500">Desglose de ingresos timbrados en nómina</p>
            </div>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 font-mono">
              {percepcionesPorTipo.length} conceptos
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {percepcionesPorTipo.map((it, idx) => (
              <ConceptCard
                key={idx}
                badge={it.clave}
                title={(it.items || []).join(' • ') || 'Percepción'}
                value={it.total}
                gravado={it.gravado}
                exento={it.exento}
                accent="blue"
              />
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Deducciones y Retenciones</h3>
              <p className="text-xs text-slate-500">Descuentos y retenciones aplicados en nómina</p>
            </div>
            <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 font-mono">
              {deduccionesPorTipo.length} conceptos
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {deduccionesPorTipo.map((it, idx) => (
              <ConceptCard
                key={idx}
                badge={it.clave}
                title={(it.items || []).join(' • ') || 'Deducción'}
                value={it.total}
                accent="rose"
              />
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
