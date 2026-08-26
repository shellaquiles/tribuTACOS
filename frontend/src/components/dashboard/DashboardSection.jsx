'use client';

import React from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  Briefcase,
  Users,
  Receipt,
  HeartHandshake,
  Landmark,
  CheckCircle2,
  AlertCircle,
  FileCheck
} from 'lucide-react';

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
    { name: 'Sueldos y Salarios', value: totalNomina },
    { name: 'Honorarios y Act. Profesional', value: totalAeyp },
  ].filter(x => x.value > 0);

  // Paleta luminosa, amable y profesional (Azul Royal, Verde Esmeralda, Ámbar, Violeta)
  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6'];
  const esSaldoFavor = (simAnual.saldo_a_favor_proyectado || 0) > 0;
  const saldoMonto = esSaldoFavor ? simAnual.saldo_a_favor_proyectado : simAnual.saldo_a_cargo_proyectado;

  // Custom Clean Tooltip
  const CleanTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xl text-slate-800 text-xs">
          <div className="font-bold text-slate-900 mb-1.5 pb-1 border-b border-slate-100">{label}</div>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4 py-0.5">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-mono font-bold text-slate-900">{fmt(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-6">

      {/* ── BANNER DEL RESULTADO ANUAL (Luminoso y Claro) ── */}
      <div className={`rounded-2xl p-6 sm:p-7 border transition-all ${
        esSaldoFavor
          ? 'bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white border-emerald-200 text-emerald-950 shadow-xs'
          : 'bg-gradient-to-r from-rose-50 via-amber-50/40 to-white border-rose-200 text-rose-950 shadow-xs'
      }`}>
        <div className="flex justify-between items-center flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
              esSaldoFavor
                ? 'bg-emerald-100/90 border-emerald-300 text-emerald-800'
                : 'bg-rose-100/90 border-rose-300 text-rose-800'
            }`}>
              {esSaldoFavor ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              Pre-Declaración Anual • Ejercicio {year}
            </span>
          </div>

          {oficial && (
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 bg-white px-3 py-1 rounded-full border border-slate-200 font-medium shadow-xs">
              <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
              Acuse Oficial SAT: Op. {oficial.num_operacion}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              {esSaldoFavor ? 'Saldo a Favor Proyectado (Devolución SAT)' : 'Impuesto Anual a Cargo Estimado'}
            </div>
            <div className={`text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-2 ${
              esSaldoFavor ? 'text-emerald-700' : 'text-rose-700'
            }`}>
              {fmt(saldoMonto || 0)}
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
              {esSaldoFavor
                ? `Cálculo a partir de tus CFDIs: Cuentas con un saldo a favor estimado de ${fmt(saldoMonto)} para devolución.`
                : `Cálculo a partir de tus CFDIs: Se proyecta un impuesto a cargo de ${fmt(saldoMonto)} para este ejercicio.`}
            </p>
          </div>

          <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200/90 flex flex-col gap-2.5 shadow-sm">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Ingresos Acumulables:</span>
              <span className="font-mono font-bold text-slate-900">{fmt(simAnual.ingresos_acumulables_totales || 0)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Deducciones Personales:</span>
              <span className="font-mono font-bold text-amber-700">-{fmt(simAnual.deducciones_personales_aplicadas || 0)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">ISR Causado (Art. 152 LISR):</span>
              <span className="font-mono font-bold text-rose-700">{fmt(simAnual.isr_anual_causado || 0)}</span>
            </div>
            <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-100">
              <span className="text-slate-500 font-medium">Retenciones Acreditables:</span>
              <span className="font-mono font-bold text-emerald-700">-{fmt(simAnual.retenciones_totales_acreditables || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4 KPIS CONSOLIDADOS (Luminosos y Limpios) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Ingresos Totales', value: fmt(totalNomina + totalAeyp), icon: Briefcase, colorClass: 'text-blue-600', iconBg: 'bg-blue-50 text-blue-600 border-blue-100', sub: `Sueldos: ${fmt(totalNomina)} | Hon: ${fmt(totalAeyp)}` },
          { label: 'Gastos Deducibles', value: fmt(totalGastosDed), icon: Receipt, colorClass: 'text-emerald-600', iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100', sub: `${gastos.length} comprobantes registrados` },
          { label: 'Deducciones Personales', value: fmt(deducciones.total || 0), icon: HeartHandshake, colorClass: 'text-amber-600', iconBg: 'bg-amber-50 text-amber-600 border-amber-100', sub: `Tope: ${fmt(deducciones.tope?.tope_aplicable || 0)}` },
          { label: 'Retenciones ISR', value: fmt(totalRetenciones), icon: Landmark, colorClass: 'text-indigo-600', iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100', sub: `Acreditables contra ISR anual` },
        ].map((k, i) => {
          const IconComp = k.icon;
          return (
            <div key={i} className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{k.label}</span>
                  <div className={`p-2 rounded-lg border ${k.iconBg}`}>
                    <IconComp className="w-4 h-4" />
                  </div>
                </div>
                <div className={`text-2xl font-bold ${k.colorClass} tracking-tight font-mono mb-1`}>
                  {k.value}
                </div>
              </div>
              <div className="text-xs text-slate-500 font-normal pt-2.5 border-t border-slate-100 mt-2">
                {k.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── GRÁFICA DE EVOLUCIÓN MENSUAL (Azul Royal + Verde Esmeralda) ── */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
          <div>
            <h4 className="text-sm font-bold text-slate-900 tracking-tight">
              Evolución Mensual de Ingresos
            </h4>
            <p className="text-xs text-slate-500">Comparativa Sueldos vs Honorarios ({year})</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-600 inline-block" /> Nómina</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> Honorarios</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> Total</span>
          </div>
        </div>
        <ResponsiveContainer width='100%' height={270}>
          <ComposedChart data={mensualData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray='3 3' vertical={false} stroke='#f1f5f9' />
            <XAxis dataKey='name' tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => '$' + (v / 1000).toFixed(0) + 'k'} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CleanTooltip />} />
            <Bar dataKey='Nómina' stackId='a' fill='#2563eb' radius={[0, 0, 0, 0]} name='Sueldos y Salarios' />
            <Bar dataKey='Honorarios' stackId='a' fill='#10b981' radius={[4, 4, 0, 0]} name='Honorarios / Facturación' />
            <Line type='monotone' dataKey='Total' stroke='#f59e0b' strokeWidth={2.5} dot={{ r: 3.5, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 1.5 }} name='Ingreso Total' />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Composición de Ingresos */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 text-center">
            Composición de Ingresos {year}
          </h4>
          <ResponsiveContainer width='100%' height={190}>
            <PieChart>
              <Pie data={pieSources} cx='50%' cy='50%' innerRadius={55} outerRadius={82} paddingAngle={3} dataKey='value' stroke='none'>
                {pieSources.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip content={<CleanTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-slate-100">
            {pieSources.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-xs py-0.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-slate-700 font-medium">{s.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-900">{fmt(s.value)}</span>
                  <span className="text-slate-400 font-mono w-10 text-right">
                    {totalGeneral > 0 ? ((s.value / totalGeneral) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resumen por Mes */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Resumen Mensual
          </h4>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3">Mes</th>
                <th className="py-2.5 px-3 text-right text-blue-600">Nómina</th>
                <th className="py-2.5 px-3 text-right text-emerald-600">Honorarios</th>
                <th className="py-2.5 px-3 text-right text-slate-900">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mensualData.filter(m => m.Total > 0).map((m, i) => (
                <tr key={i} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-3 text-slate-700 font-medium">{m.name}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-blue-600 font-medium">{m['Nómina'] > 0 ? fmt(m['Nómina']) : '—'}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-600 font-medium">{m.Honorarios > 0 ? fmt(m.Honorarios) : '—'}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{fmt(m.Total)}</td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-200">
                <td className="py-2.5 px-3">TOTAL</td>
                <td className="py-2.5 px-3 text-right font-mono text-blue-600">{fmt(totalNomina)}</td>
                <td className="py-2.5 px-3 text-right font-mono text-emerald-600">{fmt(totalAeyp)}</td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-900 font-black">{fmt(totalGeneral)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Impuestos y Retenciones ── */}
      {(() => {
        const isrNomina = nomina?.isr_retenido || 0;
        const isrAeyp = aeyp?.isr_retenido || 0;
        const isrInt = sections?.intereses?.isr_retenido || 0;
        const ivaTrasl = aeyp?.mensual?.reduce((s, m) => s + (m.datos?.iva_tras || 0), 0) || 0;
        const ivaRet = aeyp?.iva_retenido || 0;
        const totalIsrRet = isrNomina + isrAeyp + isrInt;
        const ivaNetoCargo = ivaTrasl - ivaRet;

        const kpis = [
          { label: 'ISR Retenido (Nómina)', value: fmt(isrNomina), colorClass: 'text-blue-600', tip: 'ISR retenido por empleadores' },
          { label: 'ISR Retenido (Honorarios)', value: fmt(isrAeyp), colorClass: 'text-emerald-600', tip: 'ISR retenido por personas morales en facturas' },
          { label: 'ISR Retenido (Intereses)', value: fmt(isrInt), colorClass: 'text-indigo-600', tip: 'ISR retenido en rendimientos e inversiones' },
          { label: 'Total ISR Retenido', value: fmt(totalIsrRet), colorClass: 'text-slate-900', tip: 'Acreditable contra el ISR anual', highlight: true },
          { label: 'IVA Trasladado (Cobrado)', value: fmt(ivaTrasl), colorClass: 'text-amber-600', tip: 'IVA cobrado en facturas emitidas' },
          { label: 'IVA Retenido por Clientes', value: fmt(ivaRet), colorClass: 'text-purple-600', tip: 'IVA retenido por personas morales' },
          { label: ivaNetoCargo >= 0 ? 'IVA a Cargo (Bruto)' : 'IVA a Favor (Bruto)', value: fmt(Math.abs(ivaNetoCargo)), colorClass: ivaNetoCargo >= 0 ? 'text-rose-600' : 'text-emerald-600', tip: 'IVA Trasladado − IVA Retenido' },
        ];

        return (
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Desglose de Retenciones e Impuestos — {year}</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {kpis.map((k, i) => (
                <div key={i} title={k.tip} className={`bg-white rounded-xl p-4 border ${k.highlight ? 'border-blue-300 bg-blue-50/30' : 'border-slate-200'}`}>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{k.label}</div>
                  <div className={`text-xl font-bold font-mono ${k.colorClass}`}>{k.value}</div>
                </div>
              ))}
            </div>

            {/* Waterfall visual ISR */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs mt-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                Distribución de Retenciones ISR por Fuente
              </h4>
              <div className="flex flex-col gap-3.5">
                {[
                  { label: 'Nómina (empleadores)', value: isrNomina, barBg: 'bg-blue-600', textClass: 'text-blue-600' },
                  { label: 'Honorarios / Act. Prof. (clientes)', value: isrAeyp, barBg: 'bg-emerald-500', textClass: 'text-emerald-600' },
                  { label: 'Intereses y Rendimientos', value: isrInt, barBg: 'bg-indigo-500', textClass: 'text-indigo-600' },
                ].map((row, i) => {
                  const pct = totalIsrRet > 0 ? (row.value / totalIsrRet) * 100 : 0;
                  return (
                    <div key={i}>
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="text-slate-700 font-medium">{row.label}</span>
                        <span className={`font-mono font-bold ${row.textClass}`}>
                          {fmt(row.value)} <span className="text-slate-400 font-normal">({pct.toFixed(0)}%)</span>
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${row.barBg} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-900">Total ISR Retenido (Acreditable):</span>
                  <span className="font-black text-slate-900 font-mono text-base">{fmt(totalIsrRet)}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
