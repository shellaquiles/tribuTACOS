'use client';

import React, { useState } from 'react';
import { exportPapelTrabajoAnual } from '../csvExport';
import { Download, Briefcase, HeartHandshake, Landmark, FileCheck2, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';

const formatMoney = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '$0.00';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
};

export default function PreDeclaracionAnualSection({ data, year }) {
  const [showDetalleNomina, setShowDetalleNomina] = useState(true);

  if (!data) return null;

  const sim = data.simulacion_anual || {};
  const oficial = data.oficial_sat;
  const esSaldoFavor = (sim.saldo_a_favor_proyectado || 0) > 0;
  const saldoMonto = esSaldoFavor ? sim.saldo_a_favor_proyectado : sim.saldo_a_cargo_proyectado;

  const tope = data.sections?.deducciones_personales?.tope || {};
  const deduccionesValidas = sim.deducciones_personales_aplicadas || 0;
  const remanenteDeducciones = sim.remanente_deducciones || 0;
  const pctAprovechado = parseFloat(tope.porcentaje_aprovechado || 0);

  const sueldosSec = data.sections?.sueldos || {};
  const honorariosSec = data.sections?.honorarios || {};
  const interesesSec = data.sections?.intereses || {};
  const patrones = sueldosSec.detalle || [];

  return (
    <div className="flex flex-col gap-6 text-slate-800">
      
      {/* ── 1. Resumen Ejecutivo del Ejercicio (Hero Financiero Autodescriptivo) ── */}
      <div className={`p-6 rounded-2xl border shadow-xs transition-all ${
        esSaldoFavor
          ? 'bg-gradient-to-r from-emerald-50/70 via-teal-50/30 to-white border-emerald-200'
          : 'bg-gradient-to-r from-rose-50/70 via-amber-50/30 to-white border-rose-200'
      }`}>
        <div className="flex justify-between items-center flex-wrap gap-3 pb-4 border-b border-slate-200/80 mb-6">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-0.5">
              Determinación Anual ISR • Ejercicio Fiscal {year}
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Pre-Declaración Anual Personas Físicas
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => exportPapelTrabajoAnual(data, year)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Exportar Papel de Trabajo (CSV)</span>
            </button>

            {oficial && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 shadow-2xs">
                <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                Acuse SAT: Op. {oficial.num_operacion}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-6">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
              {esSaldoFavor ? 'Saldo a Favor Proyectado (Devolución SAT)' : 'Impuesto Anual a Cargo Estimado'}
            </span>
            <div className={`text-4xl sm:text-5xl font-black tracking-tight font-mono mb-2 ${
              esSaldoFavor ? 'text-emerald-700' : 'text-rose-700'
            }`}>
              {formatMoney(saldoMonto)}
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md leading-relaxed">
              {esSaldoFavor
                ? `Cálculo a partir de tus CFDIs: cuentas con un saldo a favor estimado de ${formatMoney(saldoMonto)} para devolución automática.`
                : `Cálculo a partir de tus CFDIs: se proyecta un impuesto a cargo de ${formatMoney(saldoMonto)} a liquidar en la anual.`}
            </p>
          </div>

          {/* Cascada Fiscal Oficial Art. 152 con Colores Semánticos */}
          <div className="lg:col-span-6 bg-white/95 backdrop-blur-xs p-4.5 rounded-xl border border-slate-200/90 shadow-xs flex flex-col gap-2 text-xs">
            <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-0.5">
              Cascada Fiscal Oficial (Art. 152 LISR)
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">1. Ingresos Acumulables Totales:</span>
              <span className="font-mono font-bold text-blue-700">{formatMoney(sim.ingresos_acumulables_totales)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">2. Deducciones Personales Aplicadas:</span>
              <span className="font-mono font-bold text-emerald-700">-{formatMoney(sim.deducciones_personales_aplicadas)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 font-semibold bg-slate-50/70 px-2 rounded">
              <span className="text-slate-800">3. Base Gravable del Ejercicio:</span>
              <span className="font-mono font-black text-slate-900">{formatMoney(sim.base_gravable_anual)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">4. ISR Causado (Tarifa Art. 152):</span>
              <span className="font-mono font-bold text-rose-700">{formatMoney(sim.isr_anual_causado)}</span>
            </div>
            {sim.pagos_provisionales_acreditables > 0 && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">5. Pagos Provisionales Realizados:</span>
                <span className="font-mono font-bold text-blue-700">-{formatMoney(sim.pagos_provisionales_acreditables)}</span>
              </div>
            )}
            <div className="flex justify-between py-1 pt-1.5 border-t border-slate-200">
              <span className="text-slate-700 font-semibold">{sim.pagos_provisionales_acreditables > 0 ? '6.' : '5.'} Retenciones Totales de ISR:</span>
              <span className="font-mono font-bold text-emerald-700">-{formatMoney(sim.retenciones_totales_acreditables)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Desglose de Origen de Ingresos Acumulables con Tarjetas Codificadas ── */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex justify-between items-center mb-5 flex-wrap gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Origen de Ingresos Acumulables ({formatMoney(sim.ingresos_acumulables_totales)})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Consolidación por régimen: Sueldos y Salarios, Honorarios / Actividad Profesional y Rendimientos de Inversión.
            </p>
          </div>
          <button
            onClick={() => setShowDetalleNomina(!showDetalleNomina)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
          >
            {showDetalleNomina ? 'Ocultar Detalle de Patrones' : 'Ver Detalle de Patrones'}
          </button>
        </div>

        {/* Tarjetas de Regímenes con Acentos Autodescriptivos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          
          {/* Sueldos (Azul Royal) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 border-t-4 border-t-blue-600 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-900">Sueldos y Salarios</span>
                <span className="text-[10px] bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full font-bold">
                  {patrones.length} patrón{patrones.length !== 1 ? 'es' : ''}
                </span>
              </div>
              <div className="text-2xl font-black text-blue-700 font-mono tracking-tight mb-1">
                {formatMoney(sim.ingresos_sueldos_gravados)}
              </div>
            </div>
            <div className="text-xs text-slate-500 pt-2.5 border-t border-slate-100 mt-2 font-mono">
              ISR Retenido: <span className="font-bold text-emerald-700">{formatMoney(sueldosSec.isr_retenido)}</span>
            </div>
          </div>

          {/* Honorarios (Verde Esmeralda) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 border-t-4 border-t-emerald-600 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-900">Honorarios / Act. Prof.</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                  Facturado: {formatMoney(honorariosSec.ingresos)}
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-700 font-mono tracking-tight mb-1">
                {formatMoney(sim.ingresos_honorarios_utilidad)}
              </div>
            </div>
            <div className="text-xs text-slate-500 pt-2.5 border-t border-slate-100 mt-2 font-mono">
              Utilidad neta (Gastos: <span className="font-semibold text-slate-700">{formatMoney(honorariosSec.deducciones_autorizadas)}</span>)
            </div>
          </div>

          {/* Intereses Financieros (Índigo) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 border-t-4 border-t-indigo-600 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-900">Intereses Financieros</span>
                <span className="text-[10px] bg-indigo-50 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-full font-bold">
                  Bancos / Cetes
                </span>
              </div>
              <div className="text-2xl font-black text-indigo-700 font-mono tracking-tight mb-1">
                {formatMoney(sim.ingresos_intereses_reales)}
              </div>
            </div>
            <div className="text-xs text-slate-500 pt-2.5 border-t border-slate-100 mt-2 font-mono">
              ISR Retenido: <span className="font-bold text-slate-800">{formatMoney(interesesSec.isr_retenido)}</span>
            </div>
          </div>

        </div>

        {/* Desglose por Patrón de Nómina */}
        {showDetalleNomina && patrones.length > 0 && (
          <div className="border-t border-slate-200 pt-4 mt-2">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
              Desglose de Nómina por Empleador ({year})
            </h4>
            <div className="space-y-2.5">
              {patrones.map((p, idx) => (
                <div key={idx} className="flex justify-between items-center p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex-wrap gap-2 hover:bg-slate-100/70 transition-colors">
                  <div>
                    <div className="font-bold text-slate-900 text-xs">{p.nombre}</div>
                    <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                      RFC: {p.rfc} • {p.recibos?.length || 0} recibos timbrados
                    </div>
                  </div>
                  <div className="flex gap-6 items-center">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Ingreso Gravado</span>
                      <span className="font-mono font-bold text-blue-700">{formatMoney(p.gravado)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">ISR Retenido</span>
                      <span className="font-mono font-bold text-emerald-700">{formatMoney(p.isr)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 3. Deducciones Personales y Termómetro del Tope Legal ── */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex justify-between items-center flex-wrap gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Deducciones Personales (Art. 151 LISR)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Límite fiscal global: el menor entre el 15% de los ingresos acumulables o 5 UMAs anuales.
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-xl text-xs font-bold text-amber-900">
            Tope Legal Máximo: <span className="font-mono">{formatMoney(sim.tope_legal_deducciones)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Deducciones Aplicadas (Verde Esmeralda) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 border-t-4 border-t-emerald-600 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-900 block mb-1">
                Deducciones Aplicadas
              </span>
              <div className="text-2xl font-black text-emerald-700 font-mono tracking-tight mb-1">
                {formatMoney(deduccionesValidas)}
              </div>
            </div>
            <div className="text-xs text-slate-500 pt-2.5 border-t border-slate-100 mt-2">
              Facturas D01 a D10 validadas por SAT
            </div>
          </div>

          {/* Remanente Libre (Azul Royal) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 border-t-4 border-t-blue-600 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-900 block mb-1">
                Remanente Libre para Deducir
              </span>
              <div className="text-2xl font-black text-blue-700 font-mono tracking-tight mb-1">
                {formatMoney(remanenteDeducciones)}
              </div>
            </div>
            <div className="text-xs text-slate-500 pt-2.5 border-t border-slate-100 mt-2">
              Margen fiscal disponible no utilizado
            </div>
          </div>

          {/* Aprovechamiento del Tope (Ámbar) con Barra de Progreso */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 border-t-4 border-t-amber-500 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900 block mb-1">
                Aprovechamiento del Tope
              </span>
              <div className="text-2xl font-black text-amber-700 font-mono tracking-tight mb-2">
                {pctAprovechado}%
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, pctAprovechado))}%` }}
                />
              </div>
            </div>
            <div className="text-xs text-slate-500 pt-2.5 border-t border-slate-100 mt-2">
              Del límite máximo deducible permitido
            </div>
          </div>

        </div>
      </div>

      {/* ── 4. Comparativa con Acuse Oficial SAT (si existe) ── */}
      {oficial && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Conciliación: Simulación XMLs vs Declaración Oficial SAT
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cotejo entre los cálculos generados por comprobantes timbrados y la declaración definitiva procesada por el SAT.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Acuse Validado
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-blue-900 font-extrabold uppercase tracking-wider block mb-2">
                Ingresos Acumulables
              </span>
              <div className="flex justify-between text-slate-600 py-1 border-b border-slate-200/60">
                <span>Cálculo XMLs:</span>
                <b className="font-mono text-blue-700">{formatMoney(sim.ingresos_acumulables_totales)}</b>
              </div>
              <div className="flex justify-between text-slate-600 py-1 pt-1.5">
                <span>SAT Oficial:</span>
                <b className="font-mono text-slate-900">{formatMoney(oficial.ingresos_acumulables_totales)}</b>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-rose-900 font-extrabold uppercase tracking-wider block mb-2">
                ISR Causado Anual
              </span>
              <div className="flex justify-between text-slate-600 py-1 border-b border-slate-200/60">
                <span>Cálculo XMLs:</span>
                <b className="font-mono text-rose-700">{formatMoney(sim.isr_anual_causado)}</b>
              </div>
              <div className="flex justify-between text-slate-600 py-1 pt-1.5">
                <span>SAT Oficial:</span>
                <b className="font-mono text-slate-900">{formatMoney(oficial.isr_tarifa)}</b>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-900 font-extrabold uppercase tracking-wider block mb-2">
                Saldo del Ejercicio
              </span>
              <div className="flex justify-between text-slate-600 py-1 border-b border-slate-200/60">
                <span>Cálculo XMLs:</span>
                <b className={`font-mono ${esSaldoFavor ? 'text-emerald-700' : 'text-rose-700'}`}>{formatMoney(saldoMonto)}</b>
              </div>
              <div className="flex justify-between text-slate-600 py-1 pt-1.5">
                <span>SAT Oficial:</span>
                <b className="font-mono text-slate-900">{formatMoney(oficial.saldo_a_favor > 0 ? oficial.saldo_a_favor : oficial.saldo_a_cargo)}</b>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
