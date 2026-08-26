'use client';

import React, { useState } from 'react';

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

  return (
    <div className="flex flex-col gap-6 text-slate-800">
      
      {/* ── Encabezado y Resumen ── */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Pagos Provisionales Mensuales • Ejercicio {year}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Determinación acumulativa de ISR (Art. 106 LISR) e IVA definitivo (Art. 5 LIVA) a partir de comprobantes timbrados.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg text-right">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Total a Pagar en Provisionales:</span>
            <div className={`text-lg font-bold font-mono ${totalAPagarAnual > 0 ? 'text-red-700' : 'text-slate-900'}`}>
              {formatMoney(totalAPagarAnual)}
            </div>
          </div>
        </div>
      </div>

      {/* ── Métricas Clave ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ingresos Facturados (Honorarios)</div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            {formatMoney(totalIngresos)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">IVA Trasladado: {formatMoney(totalIvaCobrado)}</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Gastos Deducibles Bancarizados</div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            {formatMoney(totalGastosDed)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {totalGastosNoDed > 0 ? `${formatMoney(totalGastosNoDed)} no deducible (efectivo)` : '100% Bancarizado'}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">ISR Provisional a Pagar</div>
          <div className={`text-xl font-bold font-mono ${totalIsrCargo > 0 ? 'text-red-700' : 'text-slate-900'}`}>
            {formatMoney(totalIsrCargo)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Acreditable en la Declaración Anual</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">IVA Definitivo a Pagar</div>
          <div className={`text-xl font-bold font-mono ${totalIvaCargo > 0 ? 'text-red-700' : 'text-slate-900'}`}>
            {formatMoney(totalIvaCargo)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">IVA Acreditable: {formatMoney(totalIvaAcred)}</div>
        </div>
      </div>

      {/* ── Tabla Matriz de Pagos Provisionales (12 Meses) ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900">
            Matriz de Pagos Provisionales (12 Meses)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Desglose mensual de ingresos, gastos y cálculo provisional de impuestos.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <th className="p-3">Mes</th>
                <th className="p-3 text-right">Ingreso Facturado</th>
                <th className="p-3 text-right">Gasto Deducible</th>
                <th className="p-3 text-right">Flujo / Utilidad</th>
                <th className="p-3 text-right">ISR Retenido</th>
                <th className="p-3 text-right">ISR a Pagar</th>
                <th className="p-3 text-right">IVA Cobrado (16%)</th>
                <th className="p-3 text-right">IVA Acreditable</th>
                <th className="p-3 text-right">IVA a Pagar</th>
                <th className="p-3 text-right font-bold text-slate-900">Total Impuestos</th>
                <th className="p-3 text-center">Borrador</th>
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
                    <td className="p-3 font-semibold text-slate-900">
                      {m.mes_numero.toString().padStart(2, '0')}. {m.mes_nombre}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-800">
                      {formatMoney(ing)}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-600">
                      {formatMoney(ded)}
                    </td>
                    <td className="p-3 text-right font-mono font-medium">
                      <span className={utilidadMes < 0 ? 'text-red-700 font-semibold' : 'text-slate-800'}>
                        {formatMoney(utilidadMes)}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-slate-600">
                      {formatMoney(m.isr_retenido_periodo)}
                    </td>
                    <td className="p-3 text-right font-mono font-medium">
                      <span className={m.isr_a_cargo_mes > 0 ? 'text-red-700 font-bold' : 'text-slate-500'}>
                        {formatMoney(m.isr_a_cargo_mes)}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-slate-600">
                      {formatMoney(m.iva_cobrado_16)}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-600">
                      {formatMoney(m.iva_acreditable_gastos)}
                    </td>
                    <td className="p-3 text-right font-mono font-medium">
                      <span className={m.iva_a_cargo_mes > 0 ? 'text-red-700 font-bold' : 'text-slate-500'}>
                        {formatMoney(m.iva_a_cargo_mes)}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900 bg-slate-50/50">
                      {formatMoney(totalMes)}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setSelectedMonthModal(m)}
                        className="px-2.5 py-1 text-[11px] font-medium rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                      >
                        Ver Detalle
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-900 text-xs">
                <td className="p-3">TOTALES</td>
                <td className="p-3 text-right font-mono">{formatMoney(totalIngresos)}</td>
                <td className="p-3 text-right font-mono">{formatMoney(totalGastosDed)}</td>
                <td className="p-3 text-right font-mono">{formatMoney(totalIngresos - totalGastosDed)}</td>
                <td className="p-3 text-right font-mono">{formatMoney(meses.reduce((s, m) => s + (m.isr_retenido_periodo || 0), 0))}</td>
                <td className="p-3 text-right font-mono text-red-700">{formatMoney(totalIsrCargo)}</td>
                <td className="p-3 text-right font-mono">{formatMoney(totalIvaCobrado)}</td>
                <td className="p-3 text-right font-mono">{formatMoney(totalIvaAcred)}</td>
                <td className="p-3 text-right font-mono text-red-700">{formatMoney(totalIvaCargo)}</td>
                <td className="p-3 text-right font-mono text-slate-900 font-black">{formatMoney(totalAPagarAnual)}</td>
                <td className="p-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Modal Detalle Mensual */}
      {selectedMonthModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                Borrador SAT: {selectedMonthModal.mes_nombre} {year}
              </h3>
              <button
                onClick={() => setSelectedMonthModal(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-semibold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="font-bold text-slate-900 mb-2">Determinación de ISR (Art. 106 LISR)</div>
                <div className="flex justify-between py-1"><span>Ingresos del periodo:</span><span className="font-mono">{formatMoney(selectedMonthModal.ingresos_periodo)}</span></div>
                <div className="flex justify-between py-1"><span>Gastos deducibles del periodo:</span><span className="font-mono">-{formatMoney(selectedMonthModal.deducciones_bancarizadas_periodo)}</span></div>
                <div className="flex justify-between py-1 font-semibold border-t border-slate-200 pt-1"><span>Base Gravable Acumulada:</span><span className="font-mono">{formatMoney(selectedMonthModal.base_gravable_acumulada)}</span></div>
                <div className="flex justify-between py-1 font-bold text-slate-900"><span>ISR a Pagar del Mes:</span><span className="font-mono">{formatMoney(selectedMonthModal.isr_a_cargo_mes)}</span></div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="font-bold text-slate-900 mb-2">Determinación de IVA (Art. 5 LIVA)</div>
                <div className="flex justify-between py-1"><span>IVA Cobrado (16%):</span><span className="font-mono">{formatMoney(selectedMonthModal.iva_cobrado_16)}</span></div>
                <div className="flex justify-between py-1"><span>IVA Acreditable en Gastos:</span><span className="font-mono">-{formatMoney(selectedMonthModal.iva_acreditable_gastos)}</span></div>
                <div className="flex justify-between py-1"><span>IVA Retenido por Personas Morales:</span><span className="font-mono">-{formatMoney(selectedMonthModal.iva_retenido_periodo)}</span></div>
                <div className="flex justify-between py-1 font-bold text-slate-900 border-t border-slate-200 pt-1"><span>IVA a Pagar del Mes:</span><span className="font-mono">{formatMoney(selectedMonthModal.iva_a_cargo_mes)}</span></div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedMonthModal(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
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
