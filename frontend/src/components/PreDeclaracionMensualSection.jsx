'use client';

import React, { useState } from 'react';
import { FileText, DollarSign, TrendingUp, TrendingDown, Receipt, ShieldCheck, X } from 'lucide-react';

const formatMoney = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '$0.00';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
};

export default function PreDeclaracionMensualSection({ data, year }) {
  const [selectedMonthModal, setSelectedMonthModal] = useState(null);

  if (!data) return null;

  const meses = data.simulacion_provisional_mensual || [];
  const totalIngresos = meses.reduce((s, m) => s + (m.ingresos_periodo || 0), 0);
  const totalGastosDed = meses.reduce((s, m) => s + (m.deducciones_bancarizadas_periodo || 0), 0);
  const totalGastosNoDed = meses.reduce((s, m) => s + (m.deducciones_no_deducibles_efectivo || 0), 0);
  const totalIsrCargo = meses.reduce((s, m) => s + (m.isr_a_cargo_mes || 0), 0);
  const totalIvaCobrado = meses.reduce((s, m) => s + (m.iva_cobrado_16 || 0), 0);
  const totalIvaAcred = meses.reduce((s, m) => s + (m.iva_acreditable_gastos || 0), 0);
  const totalIvaCargo = meses.reduce((s, m) => s + (m.iva_a_cargo_mes || 0), 0);
  const totalAPagarAnual = meses.reduce((s, m) => s + (m.total_a_pagar_mes || 0), 0);
  const totalUtilidad = totalIngresos - totalGastosDed;

  return (
    <div className="flex flex-col gap-6 text-slate-800">
      
      {/* ── Encabezado y Resumen Hero ── */}
      <div className={`p-6 rounded-2xl border shadow-xs transition-all ${
        totalAPagarAnual > 0
          ? 'bg-gradient-to-r from-rose-50/70 via-amber-50/30 to-white border-rose-200'
          : 'bg-gradient-to-r from-emerald-50/70 via-teal-50/30 to-white border-emerald-200'
      }`}>
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
              Régimen de Actividad Profesional / Honorarios • Ejercicio {year}
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Pagos Provisionales Mensuales (ISR e IVA)
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-xl">
              Determinación acumulativa de pagos a cuenta de ISR (Art. 106 LISR) y cálculo definitivo de IVA (Art. 5 LIVA) a partir de tus CFDIs timbrados.
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur-xs border border-slate-200 p-4 rounded-xl shadow-xs text-right min-w-[220px]">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
              Total Acumulado a Pagar:
            </span>
            <div className={`text-2xl font-black font-mono tracking-tight ${totalAPagarAnual > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
              {formatMoney(totalAPagarAnual)}
            </div>
            <div className="text-[11px] font-medium text-slate-500 mt-1 flex justify-end gap-2">
              <span className="text-rose-700 font-mono">ISR: {formatMoney(totalIsrCargo)}</span>
              <span>•</span>
              <span className="text-amber-700 font-mono">IVA: {formatMoney(totalIvaCargo)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4 Tarjetas de Métricas Clave Autodescriptivas con Color Distinctivo ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Ingresos (Azul Royal) */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 border-t-4 border-t-blue-600 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-900">Ingresos Facturados</span>
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                <TrendingUp className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-2xl font-black text-blue-700 font-mono tracking-tight mb-1">
              {formatMoney(totalIngresos)}
            </div>
          </div>
          <div className="text-xs text-slate-500 pt-2.5 border-t border-slate-100 mt-2 font-mono">
            IVA Trasladado: <span className="font-semibold text-slate-700">{formatMoney(totalIvaCobrado)}</span>
          </div>
        </div>

        {/* 2. Gastos Deducibles (Verde Esmeralda) */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 border-t-4 border-t-emerald-600 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-900">Gastos Deducibles</span>
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Receipt className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-2xl font-black text-emerald-700 font-mono tracking-tight mb-1">
              {formatMoney(totalGastosDed)}
            </div>
          </div>
          <div className="text-xs text-slate-500 pt-2.5 border-t border-slate-100 mt-2">
            {totalGastosNoDed > 0 ? (
              <span className="text-amber-700 font-mono">No deducible: {formatMoney(totalGastosNoDed)}</span>
            ) : (
              <span className="text-emerald-700 font-medium">100% Bancarizado y Acreditado</span>
            )}
          </div>
        </div>

        {/* 3. ISR Provisional (Rojo Coral) */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 border-t-4 border-t-rose-600 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-900">ISR Provisional a Pagar</span>
              <span className="p-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                <DollarSign className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className={`text-2xl font-black font-mono tracking-tight mb-1 ${totalIsrCargo > 0 ? 'text-rose-700' : 'text-slate-800'}`}>
              {formatMoney(totalIsrCargo)}
            </div>
          </div>
          <div className="text-xs text-slate-500 pt-2.5 border-t border-slate-100 mt-2">
            Acreditable en la Declaración Anual
          </div>
        </div>

        {/* 4. IVA Definitivo (Ámbar Dorado) */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 border-t-4 border-t-amber-500 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900">IVA Definitivo a Pagar</span>
              <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                <ShieldCheck className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className={`text-2xl font-black font-mono tracking-tight mb-1 ${totalIvaCargo > 0 ? 'text-amber-700' : 'text-slate-800'}`}>
              {formatMoney(totalIvaCargo)}
            </div>
          </div>
          <div className="text-xs text-slate-500 pt-2.5 border-t border-slate-100 mt-2 font-mono">
            IVA Acreditable: <span className="font-semibold text-slate-700">{formatMoney(totalIvaAcred)}</span>
          </div>
        </div>

      </div>

      {/* ── Tabla Matriz de Pagos Provisionales (12 Meses) con Guía Cromática ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center flex-wrap gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Matriz de Pagos Provisionales (12 Meses)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparativa fiscal mes a mes: Ingresos cobrados, deducciones aplicadas y determinación de ISR e IVA.
            </p>
          </div>

          {/* Leyenda Autodescriptiva */}
          <div className="flex items-center gap-3 text-[11px] font-medium flex-wrap">
            <span className="flex items-center gap-1.5 text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-semibold">
              <span className="w-2 h-2 rounded-full bg-blue-600" /> Ingresos
            </span>
            <span className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-600" /> Gastos / Utilidad
            </span>
            <span className="flex items-center gap-1.5 text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-semibold">
              <span className="w-2 h-2 rounded-full bg-rose-600" /> ISR a Cargo
            </span>
            <span className="flex items-center gap-1.5 text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-600" /> IVA a Cargo
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <th className="p-3.5">Mes</th>
                <th className="p-3.5 text-right text-blue-900 bg-blue-50/40">Ingreso Facturado</th>
                <th className="p-3.5 text-right text-slate-700">Gasto Deducible</th>
                <th className="p-3.5 text-right text-emerald-900 bg-emerald-50/30">Flujo / Utilidad</th>
                <th className="p-3.5 text-right text-slate-600">ISR Retenido</th>
                <th className="p-3.5 text-right text-rose-900 bg-rose-50/40">ISR a Pagar</th>
                <th className="p-3.5 text-right text-slate-600">IVA Cobrado (16%)</th>
                <th className="p-3.5 text-right text-slate-600">IVA Acreditable</th>
                <th className="p-3.5 text-right text-amber-900 bg-amber-50/40">IVA a Pagar</th>
                <th className="p-3.5 text-right font-black text-slate-900 bg-slate-100/70">Total Impuestos</th>
                <th className="p-3.5 text-center">Borrador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {meses.map((m) => {
                const totalMes = m.total_a_pagar_mes || 0;
                const ing = m.ingresos_periodo || 0;
                const ded = m.deducciones_bancarizadas_periodo || 0;
                const utilidadMes = ing - ded;

                return (
                  <tr
                    key={m.mes_numero}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="p-3.5 font-bold text-slate-900">
                      {m.mes_numero.toString().padStart(2, '0')}. {m.mes_nombre}
                    </td>

                    {/* Ingreso Facturado (Azul) */}
                    <td className="p-3.5 text-right font-mono font-bold text-blue-700 bg-blue-50/20">
                      {formatMoney(ing)}
                    </td>

                    {/* Gasto Deducible */}
                    <td className="p-3.5 text-right font-mono text-slate-700">
                      {formatMoney(ded)}
                    </td>

                    {/* Flujo / Utilidad (Verde si positivo, Rojo si negativo) */}
                    <td className="p-3.5 text-right font-mono font-bold bg-emerald-50/15">
                      {utilidadMes < 0 ? (
                        <span className="text-rose-700 font-bold">-{formatMoney(Math.abs(utilidadMes))}</span>
                      ) : (
                        <span className="text-emerald-700 font-bold">{formatMoney(utilidadMes)}</span>
                      )}
                    </td>

                    {/* ISR Retenido */}
                    <td className="p-3.5 text-right font-mono text-slate-500">
                      {m.isr_retenido_periodo > 0 ? `-${formatMoney(m.isr_retenido_periodo)}` : '$0.00'}
                    </td>

                    {/* ISR a Pagar (Rojo Coral destacado) */}
                    <td className="p-3.5 text-right font-mono font-bold bg-rose-50/20">
                      {m.isr_a_cargo_mes > 0 ? (
                        <span className="text-rose-700 font-black">
                          {formatMoney(m.isr_a_cargo_mes)}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">$0.00</span>
                      )}
                    </td>

                    {/* IVA Cobrado */}
                    <td className="p-3.5 text-right font-mono text-slate-600">
                      {formatMoney(m.iva_cobrado_16)}
                    </td>

                    {/* IVA Acreditable */}
                    <td className="p-3.5 text-right font-mono text-slate-600">
                      {m.iva_acreditable_gastos > 0 ? `-${formatMoney(m.iva_acreditable_gastos)}` : '$0.00'}
                    </td>

                    {/* IVA a Pagar (Ámbar destacado) */}
                    <td className="p-3.5 text-right font-mono font-bold bg-amber-50/20">
                      {m.iva_a_cargo_mes > 0 ? (
                        <span className="text-amber-700 font-black">
                          {formatMoney(m.iva_a_cargo_mes)}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">$0.00</span>
                      )}
                    </td>

                    {/* Total Impuestos Mes */}
                    <td className="p-3.5 text-right font-mono font-black bg-slate-100/50">
                      {totalMes > 0 ? (
                        <span className="text-slate-900 font-black">
                          {formatMoney(totalMes)}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">$0.00</span>
                      )}
                    </td>

                    {/* Acción */}
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => setSelectedMonthModal(m)}
                        className="px-2.5 py-1 text-[11px] font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-all shadow-2xs hover:shadow-xs cursor-pointer inline-flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3 text-slate-500" />
                        <span>Ver Detalle</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 border-t-2 border-slate-300 font-extrabold text-slate-900 text-xs">
                <td className="p-3.5">TOTALES ANUALES</td>
                <td className="p-3.5 text-right font-mono text-blue-700 bg-blue-50/50">{formatMoney(totalIngresos)}</td>
                <td className="p-3.5 text-right font-mono text-slate-800">{formatMoney(totalGastosDed)}</td>
                <td className="p-3.5 text-right font-mono text-emerald-700 bg-emerald-50/50">{formatMoney(totalUtilidad)}</td>
                <td className="p-3.5 text-right font-mono text-slate-600">-{formatMoney(meses.reduce((s, m) => s + (m.isr_retenido_periodo || 0), 0))}</td>
                <td className="p-3.5 text-right font-mono text-rose-700 bg-rose-50/50 font-black">{formatMoney(totalIsrCargo)}</td>
                <td className="p-3.5 text-right font-mono text-slate-700">{formatMoney(totalIvaCobrado)}</td>
                <td className="p-3.5 text-right font-mono text-slate-700">-{formatMoney(totalIvaAcred)}</td>
                <td className="p-3.5 text-right font-mono text-amber-700 bg-amber-50/50 font-black">{formatMoney(totalIvaCargo)}</td>
                <td className="p-3.5 text-right font-mono text-slate-950 font-black bg-slate-200/70">{formatMoney(totalAPagarAnual)}</td>
                <td className="p-3.5"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── Modal Detalle Mensual (Clean Light Mode) ── */}
      {selectedMonthModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                  Borrador de Declaración Provisional
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  {selectedMonthModal.mes_nombre} {year}
                </h3>
              </div>
              <button
                onClick={() => setSelectedMonthModal(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Sección ISR */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-rose-900 mb-2 pb-1 border-b border-slate-200 flex justify-between items-center">
                  <span>Determinación de ISR (Art. 106 LISR)</span>
                  <span className="text-[10px] font-mono bg-rose-100 text-rose-800 px-2 py-0.5 rounded">A cuenta anual</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between py-0.5 text-slate-600">
                    <span>Ingresos del periodo:</span>
                    <span className="font-mono font-semibold text-blue-700">{formatMoney(selectedMonthModal.ingresos_periodo)}</span>
                  </div>
                  <div className="flex justify-between py-0.5 text-slate-600">
                    <span>Gastos deducibles del periodo:</span>
                    <span className="font-mono text-emerald-700">-{formatMoney(selectedMonthModal.deducciones_bancarizadas_periodo)}</span>
                  </div>
                  <div className="flex justify-between py-0.5 font-semibold text-slate-800 border-t border-slate-200 pt-1.5">
                    <span>Base Gravable Acumulada:</span>
                    <span className="font-mono">{formatMoney(selectedMonthModal.base_gravable_acumulada)}</span>
                  </div>
                  <div className="flex justify-between py-0.5 font-extrabold text-slate-900 pt-1">
                    <span>ISR a Pagar del Mes:</span>
                    <span className="font-mono text-rose-700">{formatMoney(selectedMonthModal.isr_a_cargo_mes)}</span>
                  </div>
                </div>
              </div>

              {/* Sección IVA */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-amber-900 mb-2 pb-1 border-b border-slate-200 flex justify-between items-center">
                  <span>Determinación de IVA (Art. 5 LIVA)</span>
                  <span className="text-[10px] font-mono bg-amber-100 text-amber-800 px-2 py-0.5 rounded">Definitivo mensual</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between py-0.5 text-slate-600">
                    <span>IVA Cobrado (16%):</span>
                    <span className="font-mono text-slate-800">{formatMoney(selectedMonthModal.iva_cobrado_16)}</span>
                  </div>
                  <div className="flex justify-between py-0.5 text-slate-600">
                    <span>IVA Acreditable en Gastos:</span>
                    <span className="font-mono text-emerald-700">-{formatMoney(selectedMonthModal.iva_acreditable_gastos)}</span>
                  </div>
                  <div className="flex justify-between py-0.5 text-slate-600">
                    <span>IVA Retenido por Personas Morales:</span>
                    <span className="font-mono text-slate-700">-{formatMoney(selectedMonthModal.iva_retenido_periodo)}</span>
                  </div>
                  <div className="flex justify-between py-0.5 font-extrabold text-slate-900 border-t border-slate-200 pt-1.5">
                    <span>IVA a Pagar del Mes:</span>
                    <span className="font-mono text-amber-700">{formatMoney(selectedMonthModal.iva_a_cargo_mes)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedMonthModal(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
