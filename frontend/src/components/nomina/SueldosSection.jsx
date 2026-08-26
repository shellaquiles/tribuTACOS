'use client';

import React, { useState, useMemo } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { ConceptCard, fmt } from '../ui/Primitives';
import { TrendingUp, ShieldCheck, DollarSign, Receipt } from 'lucide-react';

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
    const isGlobal = selectedEmployer === 'Global';
    const targetRecibos = isGlobal
      ? (currentData.detalle || []).flatMap(e => e.recibos || [])
      : ((currentData.detalle || []).find(e => e.nombre === selectedEmployer || e.rfc === selectedEmployer)?.recibos || []);

    const allPercs = targetRecibos.flatMap(r => r.percepciones || []).filter(Boolean);
    const allDeds = targetRecibos.flatMap(r => r.deducciones || []).filter(Boolean);

    const calcPercs = Object.values(
      allPercs.reduce((acc, p) => {
        if (!p) return acc;
        const tipoClave = p.tipo || 'S/C';
        if (!acc[tipoClave]) acc[tipoClave] = { clave: tipoClave, total: 0, gravado: 0, exento: 0, items: new Set() };
        acc[tipoClave].total += (p.total || ((p.gravado || 0) + (p.exento || 0)) || 0);
        acc[tipoClave].gravado += (p.gravado || 0);
        acc[tipoClave].exento += (p.exento || 0);
        if (p.concepto) acc[tipoClave].items.add(p.concepto.trim());
        return acc;
      }, {})
    ).map(c => ({
      ...c,
      items: Array.from(c.items)
    })).sort((a, b) => b.total - a.total);

    const calcDeds = Object.values(
      allDeds.reduce((acc, d) => {
        if (!d) return acc;
        const tipoClave = d.tipo || 'S/C';
        if (!acc[tipoClave]) acc[tipoClave] = { clave: tipoClave, total: 0, items: new Set() };
        acc[tipoClave].total += (d.importe || d.total || 0);
        if (d.concepto) acc[tipoClave].items.add(d.concepto.trim());
        return acc;
      }, {})
    ).map(c => ({
      ...c,
      items: Array.from(c.items)
    })).sort((a, b) => b.total - a.total);

    const tBruto = isGlobal
      ? (currentData.total_bruto || currentData.total_ingresos || calcPercs.reduce((acc, p) => acc + p.total, 0))
      : calcPercs.reduce((acc, p) => acc + p.total, 0);

    const tGravado = isGlobal
      ? (currentData.gravado || calcPercs.reduce((acc, p) => acc + p.gravado, 0))
      : calcPercs.reduce((acc, p) => acc + p.gravado, 0);

    const tExento = isGlobal
      ? (currentData.exento || calcPercs.reduce((acc, p) => acc + p.exento, 0))
      : calcPercs.reduce((acc, p) => acc + p.exento, 0);

    const tIsr = isGlobal
      ? (currentData.isr_retenido || targetRecibos.reduce((s, r) => s + (r.isr_retenido || 0), 0))
      : targetRecibos.reduce((s, r) => s + (r.isr_retenido || 0), 0);

    const tDed = calcDeds.reduce((acc, d) => acc + d.total, 0);
    const tVales = calcPercs.find(p => p.clave === '029')?.total || 0;
    const tNeto = targetRecibos.reduce((s, r) => s + (r.neto || (r.total_bruto - (r.isr_retenido || 0)) || 0), 0);

    const mLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const nominaMensualData = mLabels.map((m, idx) => {
      const mesNum = idx + 1;
      const recibosMes = targetRecibos.filter(r => {
        const rm = parseInt((r.fecha || '').split('-')[1]);
        return rm === mesNum;
      });
      const brutoMes = recibosMes.reduce((s, r) => s + (r.total_bruto || ((r.gravado || 0) + (r.exento || 0)) || 0), 0);
      const isrMes = recibosMes.reduce((s, r) => s + (r.isr_retenido || 0), 0);
      const netoMes = recibosMes.reduce((s, r) => s + (r.neto || (r.total_bruto - (r.isr_retenido || 0)) || 0), 0);
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
      gravado: tGravado,
      exento: tExento,
      isr: tIsr,
      totalDeducciones: tDed,
      totalVales: tVales,
      neto: tNeto,
      percepcionesPorTipo: calcPercs,
      deduccionesPorTipo: calcDeds,
      nominaMensualData,
      recibosCount: targetRecibos.length
    };
  }, [currentData, selectedEmployer]);

  const { totalBruto, gravado, exento, isr, percepcionesPorTipo, deduccionesPorTipo, nominaMensualData, recibosCount } = currentViewData;

  return (
    <div className="flex flex-col gap-6 text-slate-800">

      {/* ── Encabezado y Selector de Empleador ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex justify-between items-center flex-wrap gap-4 pb-5 border-b border-slate-200 mb-6">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-0.5">
              Régimen de Sueldos y Salarios • Ejercicio {year}
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Ingresos y Retenciones de Nómina
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Desglose de comprobantes de nómina timbrados, percepciones gravadas/exentas y retenciones de ISR.
            </p>
          </div>

          {currentData.detalle && currentData.detalle.length > 0 && (
            <div className="flex gap-1.5 flex-wrap bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setSelectedEmployer('Global')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
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
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
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

        {/* ── 4 Tarjetas de Métricas Clave Autodescriptivas con Color Distinctivo ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* 1. Total Ingresos Nómina (Azul Royal) */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 border-t-4 border-t-blue-600 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-900">Total Ingresos Nómina</span>
                <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                  <TrendingUp className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-2xl font-black text-blue-700 font-mono tracking-tight mb-1">
                {fmt(totalBruto)}
              </div>
            </div>
            <div className="text-xs text-slate-500 pt-2.5 border-t border-slate-100 mt-2 font-mono">
              Comprobantes: <span className="font-semibold text-slate-700">{recibosCount} recibos</span>
            </div>
          </div>

          {/* 2. Ingresos Gravados (Índigo) */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 border-t-4 border-t-indigo-600 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-900">Ingresos Gravados</span>
                <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <DollarSign className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-2xl font-black text-indigo-700 font-mono tracking-tight mb-1">
                {fmt(gravado)}
              </div>
            </div>
            <div className="text-xs text-slate-500 pt-2.5 border-t border-slate-100 mt-2">
              Base para el cálculo del ISR anual
            </div>
          </div>

          {/* 3. Ingresos Exentos (Verde Esmeralda) */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 border-t-4 border-t-emerald-600 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-900">Ingresos Exentos</span>
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-700 font-mono tracking-tight mb-1">
                {fmt(exento)}
              </div>
            </div>
            <div className="text-xs text-slate-500 pt-2.5 border-t border-slate-100 mt-2">
              Aguinaldo, PTU y primas exentas
            </div>
          </div>

          {/* 4. ISR Retenido en Nómina (Rojo Coral) */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 border-t-4 border-t-rose-600 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-900">ISR Retenido en Nómina</span>
                <span className="p-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                  <Receipt className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-2xl font-black text-rose-700 font-mono tracking-tight mb-1">
                {fmt(isr)}
              </div>
            </div>
            <div className="text-xs text-slate-500 pt-2.5 border-t border-slate-100 mt-2">
              Enterado por tus empleadores al SAT
            </div>
          </div>

        </div>
      </div>

      {/* ── Gráfica de Serie Mensual ── */}
      {nominaMensualData && nominaMensualData.some(d => (d['Sueldo Bruto'] || 0) > 0) && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-4">
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

      {/* ── Desglose de Percepciones y Deducciones con Tarjetas Vivas ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Percepciones */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Percepciones Detectadas</h3>
              <p className="text-xs text-slate-500 mt-0.5">Desglose de conceptos e ingresos percibidos</p>
            </div>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 font-mono">
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

        {/* Deducciones */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Deducciones y Retenciones</h3>
              <p className="text-xs text-slate-500 mt-0.5">Descuentos y retenciones aplicados por empleadores</p>
            </div>
            <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200 font-mono">
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
