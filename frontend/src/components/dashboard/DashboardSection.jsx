'use client';

import React from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  FileCheck
} from 'lucide-react';

export function DashboardSection({ sections, year, data }) {
  const nomina = sections?.sueldos;
  const aeyp = sections?.honorarios;
  const gastos = sections?.reporte_gastos || [];
  const deducciones = sections?.deducciones_personales || {};
  const simAnual = data?.simulacion_anual || {};
  const oficial = data?.oficial_sat;

  const mLabels = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
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
    { name: 'Honorarios / Act. Prof.', value: totalAeyp },
  ].filter(x => x.value > 0);

  // Paleta moderna, viva y elegante: Azul Eléctrico (#2563eb), Verde Esmeralda Vivo (#10b981), Ámbar Radiante (#f59e0b), Violeta Moderno (#8b5cf6)
  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];
  const esSaldoFavor = (simAnual.saldo_a_favor_proyectado || 0) > 0;
  const saldoMonto = esSaldoFavor ? simAnual.saldo_a_favor_proyectado : simAnual.saldo_a_cargo_proyectado;

  // Custom Modern Tooltip
  const CleanTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-md p-3 rounded-lg border border-slate-200 text-slate-900 text-xs shadow-lg">
          <div className="font-mono font-bold uppercase tracking-wider text-[11px] text-slate-500 mb-1.5 pb-1 border-b border-slate-100">{label}</div>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-6 py-0.5 font-mono">
              <span className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-bold text-slate-900">{fmt(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-8">

      {/* ── SECCIÓN PRINCIPAL: RESUMEN ANUAL (Vibrante y Claro) ── */}
      <div className={`rounded-xl border transition-all overflow-hidden ${
        esSaldoFavor
          ? 'bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-white border-emerald-300 shadow-sm'
          : 'bg-gradient-to-r from-rose-500/10 via-amber-500/5 to-white border-rose-300 shadow-sm'
      }`}>
        
        {/* Top Header Row */}
        <div className="px-6 py-3 border-b border-slate-200/80 flex justify-between items-center bg-white/70">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] font-extrabold uppercase tracking-widest text-slate-600">
              DETERMINACIÓN ANUAL • EJERCICIO {year}
            </span>
            <span className="h-3 w-[1px] bg-slate-300" />
            <span className={`text-[11px] font-bold ${esSaldoFavor ? 'text-emerald-700' : 'text-rose-700'}`}>
              {esSaldoFavor ? 'SALDO A FAVOR PROYECTADO' : 'IMPUESTO A CARGO'}
            </span>
          </div>

          {oficial && (
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-700 bg-white px-2.5 py-0.5 rounded border border-slate-200 shadow-xs">
              <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>FOLIO SAT: {oficial.num_operacion}</span>
            </div>
          )}
        </div>

        {/* Main Banner Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          
          {/* Main Hero Amount */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="font-mono text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                {esSaldoFavor ? 'SALDO A FAVOR PROYECTADO (DEVOLUCIÓN SAT)' : 'IMPUESTO ANUAL A CARGO ESTIMADO'}
              </div>
              <div className={`text-4xl sm:text-5xl lg:text-6xl font-black font-mono tracking-tight tabular-nums ${
                esSaldoFavor ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {fmt(saldoMonto || 0)}
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-600 font-mono">
              <span className="font-medium text-slate-700">RÉGIMEN: PFAE + SUELDOS</span>
              <span className="text-slate-400">BASE LEGAL: ART. 152 LISR</span>
            </div>
          </div>

          {/* Key Breakdown Table */}
          <div className="lg:col-span-5 p-6 bg-white/50 flex flex-col justify-center gap-3 font-mono text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500 uppercase tracking-wider text-[11px]">Ingresos Acumulables</span>
              <span className="font-bold text-slate-900 tabular-nums">{fmt(simAnual.ingresos_acumulables_totales || 0)}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500 uppercase tracking-wider text-[11px]">Deducciones Personales</span>
              <span className="font-bold text-amber-600 tabular-nums">−{fmt(simAnual.deducciones_personales_aplicadas || 0)}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500 uppercase tracking-wider text-[11px]">ISR Anual Causado</span>
              <span className="font-bold text-rose-600 tabular-nums">{fmt(simAnual.isr_anual_causado || 0)}</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-500 uppercase tracking-wider text-[11px]">Retenciones Acreditables</span>
              <span className="font-bold text-emerald-600 tabular-nums">−{fmt(simAnual.retenciones_totales_acreditables || 0)}</span>
            </div>
          </div>

        </div>
      </div>

      {/* ── 4 KPIS CON TOQUES VIBRANTES ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'INGRESOS TOTALES', value: fmt(totalNomina + totalAeyp), sub: `SUELDOS ${fmt(totalNomina)} | HON ${fmt(totalAeyp)}`, color: 'text-blue-600', border: 'border-l-4 border-l-blue-500' },
          { label: 'GASTOS DEDUCIBLES', value: fmt(totalGastosDed), sub: `${gastos.length} COMPROBANTES VÁLIDOS`, color: 'text-emerald-600', border: 'border-l-4 border-l-emerald-500' },
          { label: 'DEDUCCIONES PERSONALES', value: fmt(deducciones.total || 0), sub: `TOPE LEGAL: ${fmt(deducciones.tope?.tope_aplicable || 0)}`, color: 'text-amber-600', border: 'border-l-4 border-l-amber-500' },
          { label: 'RETENCIONES ISR', value: fmt(totalRetenciones), sub: `ACREDITABLE CONTRA ISR ANUAL`, color: 'text-indigo-600', border: 'border-l-4 border-l-indigo-500' },
        ].map((k, i) => (
          <div key={i} className={`bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all ${k.border}`}>
            <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
              {k.label}
            </div>
            <div className={`text-2xl font-black font-mono tracking-tight tabular-nums mb-2 ${k.color}`}>
              {k.value}
            </div>
            <div className="font-mono text-[10px] text-slate-400 pt-2 border-t border-slate-100 truncate">
              {k.sub}
            </div>
          </div>
        ))}
      </div>

      {/* ── GRÁFICA DE EVOLUCIÓN MENSUAL (Azul Eléctrico + Verde Esmeralda Vibrante) ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 flex-wrap gap-3">
          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-slate-900">
              EVOLUCIÓN MENSUAL DE INGRESOS ({year})
            </h3>
            <p className="font-mono text-[11px] text-slate-500 mt-0.5">FLUJO COMPARATIVO: SUELDOS (NÓMINA) Y FACTURACIÓN (HONORARIOS)</p>
          </div>
          <div className="flex items-center gap-5 font-mono text-[11px] text-slate-600">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-xs bg-blue-600 inline-block shadow-xs" /> NÓMINA</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block shadow-xs" /> HONORARIOS</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded-full bg-amber-500 inline-block" /> TOTAL</span>
          </div>
        </div>

        <ResponsiveContainer width='100%' height={280}>
          <ComposedChart data={mensualData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray='3 3' vertical={false} stroke='#f1f5f9' />
            <XAxis dataKey='name' tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace', fontWeight: 600 }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
            <YAxis tickFormatter={v => '$' + (v / 1000).toFixed(0) + 'k'} tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CleanTooltip />} />
            <Bar dataKey='Nómina' stackId='a' fill='#2563eb' radius={[0, 0, 0, 0]} name='Sueldos' />
            <Bar dataKey='Honorarios' stackId='a' fill='#10b981' radius={[3, 3, 0, 0]} name='Honorarios' />
            <Line type='monotone' dataKey='Total' stroke='#f59e0b' strokeWidth={2.5} dot={{ r: 4, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 2 }} name='Total' />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ── COMPOSICIÓN Y TABLA MENSUAL ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Composición de Ingresos */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-slate-900 pb-3 border-b border-slate-100 mb-4">
              COMPOSICIÓN DE FUENTES ({year})
            </h4>
            <ResponsiveContainer width='100%' height={190}>
              <PieChart>
                <Pie data={pieSources} cx='50%' cy='50%' innerRadius={52} outerRadius={80} paddingAngle={3} dataKey='value' stroke='#ffffff' strokeWidth={2}>
                  {pieSources.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CleanTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col gap-2 pt-4 border-t border-slate-100 font-mono text-xs">
            {pieSources.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-none">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-slate-700 font-medium">{s.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-900 tabular-nums">{fmt(s.value)}</span>
                  <span className="text-slate-400 w-10 text-right tabular-nums">
                    {totalGeneral > 0 ? ((s.value / totalGeneral) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabla Mensual Estilo Limpio y Vivo */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-6 shadow-xs overflow-x-auto">
          <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-slate-900 pb-3 border-b border-slate-100 mb-3">
            DESGLOSE MENSUAL TABULAR
          </h4>
          <table className="w-full text-xs font-mono text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                <th className="py-2.5 px-3">MES</th>
                <th className="py-2.5 px-3 text-right text-blue-600">NÓMINA</th>
                <th className="py-2.5 px-3 text-right text-emerald-600">HONORARIOS</th>
                <th className="py-2.5 px-3 text-right text-slate-900">TOTAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mensualData.filter(m => m.Total > 0).map((m, i) => (
                <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2 px-3 text-slate-800 font-semibold">{m.name}</td>
                  <td className="py-2 px-3 text-right text-blue-600 font-medium tabular-nums">{m['Nómina'] > 0 ? fmt(m['Nómina']) : '—'}</td>
                  <td className="py-2 px-3 text-right text-emerald-600 font-medium tabular-nums">{m.Honorarios > 0 ? fmt(m.Honorarios) : '—'}</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900 tabular-nums">{fmt(m.Total)}</td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-200">
                <td className="py-2.5 px-3">TOTAL</td>
                <td className="py-2.5 px-3 text-right tabular-nums text-blue-700">{fmt(totalNomina)}</td>
                <td className="py-2.5 px-3 text-right tabular-nums text-emerald-700">{fmt(totalAeyp)}</td>
                <td className="py-2.5 px-3 text-right font-black tabular-nums">{fmt(totalGeneral)}</td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

      {/* ── RETENCIONES E IMPUESTOS: CASCADA Y MÉTRICAS ── */}
      {(() => {
        const isrNomina = nomina?.isr_retenido || 0;
        const isrAeyp = aeyp?.isr_retenido || 0;
        const isrInt = sections?.intereses?.isr_retenido || 0;
        const ivaTrasl = aeyp?.mensual?.reduce((s, m) => s + (m.datos?.iva_tras || 0), 0) || 0;
        const ivaRet = aeyp?.iva_retenido || 0;
        const totalIsrRet = isrNomina + isrAeyp + isrInt;
        const ivaNetoCargo = ivaTrasl - ivaRet;

        const retRows = [
          { label: 'NÓMINA (PATRONES)', value: isrNomina, color: 'bg-blue-600', text: 'text-blue-600' },
          { label: 'HONORARIOS / ACT. PROF. (CLIENTES PM)', value: isrAeyp, color: 'bg-emerald-500', text: 'text-emerald-600' },
          { label: 'INTERESES Y RENDIMIENTOS', value: isrInt, color: 'bg-indigo-500', text: 'text-indigo-600' },
        ];

        return (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col gap-6">
            <div>
              <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-slate-900">
                RETENCIONES FISCALES E IMPUESTOS INDIRECTOS — {year}
              </h3>
              <p className="font-mono text-[11px] text-slate-500 mt-0.5">CRUCE DE RETENCIONES ACREDITABLES E IVA TRASLADADO</p>
            </div>

            {/* Micro métricas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-100">
                <div className="font-mono text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">TOTAL ISR RETENIDO</div>
                <div className="font-mono text-xl font-black text-blue-900 tabular-nums">{fmt(totalIsrRet)}</div>
              </div>
              <div className="p-4 rounded-lg bg-amber-50/50 border border-amber-100">
                <div className="font-mono text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">IVA TRASLADADO (COBRADO)</div>
                <div className="font-mono text-xl font-black text-amber-900 tabular-nums">{fmt(ivaTrasl)}</div>
              </div>
              <div className="p-4 rounded-lg bg-purple-50/50 border border-purple-100">
                <div className="font-mono text-[10px] font-bold text-purple-600 uppercase tracking-widest mb-1">IVA RETENIDO POR PM</div>
                <div className="font-mono text-xl font-black text-purple-900 tabular-nums">{fmt(ivaRet)}</div>
              </div>
              <div className={`p-4 rounded-lg border ${ivaNetoCargo >= 0 ? 'bg-rose-50/50 border-rose-100' : 'bg-emerald-50/50 border-emerald-100'}`}>
                <div className={`font-mono text-[10px] font-bold uppercase tracking-widest mb-1 ${ivaNetoCargo >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {ivaNetoCargo >= 0 ? 'IVA NETO A CARGO' : 'IVA NETO A FAVOR'}
                </div>
                <div className={`font-mono text-xl font-black tabular-nums ${ivaNetoCargo >= 0 ? 'text-rose-900' : 'text-emerald-900'}`}>
                  {fmt(Math.abs(ivaNetoCargo))}
                </div>
              </div>
            </div>

            {/* Barras de distribución de Retención ISR */}
            <div className="pt-4 border-t border-slate-100">
              <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">
                DISTRIBUCIÓN DE RETENCIONES ISR POR ORIGEN
              </div>
              <div className="flex flex-col gap-3 font-mono text-xs">
                {retRows.map((row, i) => {
                  const pct = totalIsrRet > 0 ? (row.value / totalIsrRet) * 100 : 0;
                  return (
                    <div key={i} className="flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-700">{row.label}</span>
                        <span className={`font-bold tabular-nums ${row.text}`}>
                          {fmt(row.value)} <span className="text-slate-400 font-normal">({pct.toFixed(0)}%)</span>
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${row.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        );
      })()}

    </div>
  );
}

