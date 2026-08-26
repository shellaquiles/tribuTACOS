'use client';

import React, { useState } from 'react';
import { exportPapelTrabajoAnual } from '../csvExport';
import { Download, ChevronDown, ChevronUp } from 'lucide-react';

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

  const sueldosSec = data.sections?.sueldos || {};
  const honorariosSec = data.sections?.honorarios || {};
  const interesesSec = data.sections?.intereses || {};
  const patrones = sueldosSec.detalle || [];

  return (
    <div className="flex flex-col gap-6 text-slate-800">
      
      {/* ── 1. Resumen Ejecutivo del Ejercicio (Clean Financial Card) ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex justify-between items-center flex-wrap gap-3 pb-4 border-b border-slate-100 mb-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Determinación Anual ISR • Ejercicio Fiscal {year}
            </span>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Pre-Declaración Anual Personas Físicas
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportPapelTrabajoAnual(data, year)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Exportar Papel de Trabajo (CSV)</span>
            </button>

            {oficial && (
              <span className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
                Acuse Oficial SAT (Op. {oficial.num_operacion})
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              {esSaldoFavor ? 'Saldo a Favor Proyectado (Devolución)' : 'Impuesto Anual a Cargo Estimado'}
            </span>
            <div className={`text-4xl font-extrabold tracking-tight font-mono mb-2 ${
              esSaldoFavor ? 'text-emerald-700' : 'text-red-700'
            }`}>
              {formatMoney(saldoMonto)}
            </div>
            <p className="text-xs text-slate-600 max-w-md leading-relaxed">
              {esSaldoFavor
                ? `Resultado del cálculo fiscal a partir de tus CFDIs: cuentas con un saldo a favor estimado de ${formatMoney(saldoMonto)}.`
                : `Se proyecta un impuesto a cargo de ${formatMoney(saldoMonto)} para este ejercicio fiscal.`}
            </p>
          </div>

          {/* Cascada de Determinación Anual */}
          <div className="lg:col-span-6 bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-2 text-xs">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Cascada Fiscal Oficial (Art. 152 LISR)
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-600">1. Ingresos Acumulables Totales:</span>
              <span className="font-mono font-bold text-slate-900">{formatMoney(sim.ingresos_acumulables_totales)}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-600">2. Deducciones Personales Aplicadas:</span>
              <span className="font-mono font-bold text-amber-700">-{formatMoney(sim.deducciones_personales_aplicadas)}</span>
            </div>
            <div className="flex justify-between py-0.5 font-semibold">
              <span className="text-slate-700">3. Base Gravable del Ejercicio:</span>
              <span className="font-mono font-bold text-slate-900">{formatMoney(sim.base_gravable_anual)}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-600">4. ISR Causado (Tarifa Art. 152):</span>
              <span className="font-mono font-bold text-red-700">{formatMoney(sim.isr_anual_causado)}</span>
            </div>
            {sim.pagos_provisionales_acreditables > 0 && (
              <div className="flex justify-between py-0.5">
                <span className="text-slate-600">5. Pagos Provisionales Realizados:</span>
                <span className="font-mono font-bold text-blue-700">-{formatMoney(sim.pagos_provisionales_acreditables)}</span>
              </div>
            )}
            <div className="flex justify-between py-0.5 pt-1.5 border-t border-slate-200">
              <span className="text-slate-700 font-semibold">{sim.pagos_provisionales_acreditables > 0 ? '6.' : '5.'} Retenciones Totales de ISR:</span>
              <span className="font-mono font-bold text-emerald-700">-{formatMoney(sim.retenciones_totales_acreditables)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Desglose de Origen de Ingresos Acumulables ── */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Origen de Ingresos Acumulables ({formatMoney(sim.ingresos_acumulables_totales)})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Consolidación por régimen: Sueldos y Salarios, Honorarios y Rendimientos de Inversión.
            </p>
          </div>
          <button
            onClick={() => setShowDetalleNomina(!showDetalleNomina)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
          >
            {showDetalleNomina ? 'Ocultar Detalle de Patrones' : 'Ver Detalle de Patrones'}
          </button>
        </div>

        {/* Tarjetas de Regímenes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-4">
          {/* Sueldos */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sueldos y Salarios</span>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-medium">
                {patrones.length} patrón{patrones.length !== 1 ? 'es' : ''}
              </span>
            </div>
            <div className="text-xl font-bold text-slate-900 font-mono mt-1">
              {formatMoney(sim.ingresos_sueldos_gravados)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              ISR Retenido: <span className="font-mono font-semibold text-slate-800">{formatMoney(sueldosSec.isr_retenido)}</span>
            </div>
          </div>

          {/* Honorarios */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Honorarios / Act. Prof.</span>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-medium">
                Facturado: {formatMoney(honorariosSec.ingresos)}
              </span>
            </div>
            <div className="text-xl font-bold text-slate-900 font-mono mt-1">
              {formatMoney(sim.ingresos_honorarios_utilidad)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Utilidad neta (Gastos: {formatMoney(honorariosSec.deducciones_autorizadas)})
            </div>
          </div>

          {/* Intereses */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Intereses Financieros</span>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-medium">
                Bancos / Cetes
              </span>
            </div>
            <div className="text-xl font-bold text-slate-900 font-mono mt-1">
              {formatMoney(sim.ingresos_intereses_reales)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              ISR Retenido: <span className="font-mono font-semibold text-slate-800">{formatMoney(interesesSec.isr_retenido)}</span>
            </div>
          </div>
        </div>

        {/* Desglose por Patrón de Nómina */}
        {showDetalleNomina && patrones.length > 0 && (
          <div className="border-t border-slate-200 pt-3 mt-2">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2.5">
              Detalle de Nómina por Empleador ({year})
            </h4>
            <div className="space-y-2">
              {patrones.map((p, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex-wrap gap-2">
                  <div>
                    <div className="font-bold text-slate-900">{p.nombre}</div>
                    <div className="text-slate-500 font-mono text-[11px]">
                      RFC: {p.rfc} • {p.recibos?.length || 0} recibos timbrados
                    </div>
                  </div>
                  <div className="flex gap-6 items-center">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Ingreso Gravado</span>
                      <span className="font-mono font-bold text-slate-900">{formatMoney(p.gravado)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">ISR Retenido</span>
                      <span className="font-mono font-bold text-slate-900">{formatMoney(p.isr)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 3. Deducciones Personales y Tope Legal ── */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
        <div className="flex justify-between items-center flex-wrap gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Deducciones Personales (Art. 151 LISR)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tope legal máximo permitido: el menor entre el 15% de ingresos brutos o 5 UMAs anuales.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700">
            Tope Legal: {formatMoney(sim.tope_legal_deducciones)}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Deducciones Aplicadas</div>
            <div className="text-xl font-bold text-slate-900 font-mono">
              {formatMoney(deduccionesValidas)}
            </div>
            <div className="text-xs text-slate-500 mt-1">Facturas D01 a D10 validadas</div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Remanente Libre para Deducir</div>
            <div className="text-xl font-bold text-slate-900 font-mono">
              {formatMoney(remanenteDeducciones)}
            </div>
            <div className="text-xs text-slate-500 mt-1">Margen disponible no utilizado</div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Aprovechamiento del Tope</div>
            <div className="text-xl font-bold text-slate-900 font-mono">
              {tope.porcentaje_aprovechado || 0}%
            </div>
            <div className="text-xs text-slate-500 mt-1">Del límite fiscal máximo</div>
          </div>
        </div>
      </div>

      {/* ── 4. Comparativa con Acuse Oficial SAT (si existe) ── */}
      {oficial && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Conciliación: Simulación XMLs vs Declaración Oficial SAT
            </h3>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Acuse Validado
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Ingresos Acumulables</span>
              <div className="flex justify-between text-slate-700 py-0.5"><span>XMLs:</span> <b className="font-mono">{formatMoney(sim.ingresos_acumulables_totales)}</b></div>
              <div className="flex justify-between text-slate-700 py-0.5"><span>SAT:</span> <b className="font-mono">{formatMoney(oficial.ingresos_acumulables_totales)}</b></div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">ISR Causado</span>
              <div className="flex justify-between text-slate-700 py-0.5"><span>XMLs:</span> <b className="font-mono">{formatMoney(sim.isr_anual_causado)}</b></div>
              <div className="flex justify-between text-slate-700 py-0.5"><span>SAT:</span> <b className="font-mono">{formatMoney(oficial.isr_tarifa)}</b></div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Saldo del Ejercicio</span>
              <div className="flex justify-between text-slate-700 py-0.5"><span>XMLs:</span> <b className="font-mono">{formatMoney(saldoMonto)}</b></div>
              <div className="flex justify-between text-slate-700 py-0.5"><span>SAT:</span> <b className="font-mono">{formatMoney(oficial.saldo_a_favor > 0 ? oficial.saldo_a_favor : oficial.saldo_a_cargo)}</b></div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
