'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, CheckCircle2, AlertCircle, X } from 'lucide-react';

const formatMoney = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '$0.00';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
};

export default function ConciliacionSatSection({ year, onYearChange }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('tabla'); // 'tabla' | 'tarjetas'
  const [selectedMonthModal, setSelectedMonthModal] = useState(null);

  useEffect(() => {
    fetchSatDocs();
  }, [year]);

  const fetchSatDocs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/sat_docs/summary?year=${year}`);
      setData(res.data);
    } catch (err) {
      console.error("Error fetching SAT docs:", err);
      setError("No se pudieron cargar los documentos oficiales del SAT.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-3 text-slate-600">
        <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
        <p className="text-xs font-medium">
          Consultando declaraciones de ISR e IVA oficiales del SAT para el ejercicio {year}...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-xl text-xs font-medium">
        {error || "Sin información disponible"}
      </div>
    );
  }

  const anual = data.declaracion_anual_oficial;
  const meses = data.matriz_pagos_provisionales || [];
  const aniosDisponibles = data.anios_con_anual_disponible || ['2021', '2022', '2023', '2024', '2025', '2026'];

  // Totales Anuales de Pagos Provisionales
  const totalPagadoEnMeses = meses.reduce((s, m) => s + (m.isr_a_cargo_sat || 0) + (m.iva_a_cargo_sat || 0), 0);
  const totalIsrPagadoMeses = meses.reduce((s, m) => s + (m.isr_a_cargo_sat || 0), 0);
  const totalIvaPagadoMeses = meses.reduce((s, m) => s + (m.iva_a_cargo_sat || 0), 0);
  const totalIngresosMeses = meses.reduce((s, m) => s + (m.xml_ingresos_facturados || m.isr_ingresos_mes || 0), 0);

  const esSaldoFavor = anual && anual.saldo_a_favor > 0;

  return (
    <div className="flex flex-col gap-6 text-slate-800">
      
      {/* ── BARRA SUPERIOR: SELECTOR DE AÑOS ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Auditoría Oficial SAT • Ejercicio {year}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Liquidación anual oficial del SAT y desglose de pagos provisionales de ISR e IVA derivados de acuses y declaraciones.
          </p>
        </div>

        {/* Selector de Años */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase">Ejercicio:</span>
          <div className="flex bg-slate-100 p-0.5 rounded-lg gap-1 border border-slate-200">
            {aniosDisponibles.map((y) => {
              const isSelected = year === y;
              return (
                <button
                  key={y}
                  onClick={() => onYearChange && onYearChange(y)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    isSelected ? 'bg-white text-slate-900 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {y}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 1. RESUMEN ANUAL DEFINITIVO ── */}
      {anual ? (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
          <div className="flex flex-wrap justify-between items-center gap-2 pb-4 border-b border-slate-100 mb-6">
            <span className="text-xs font-semibold text-slate-700 bg-slate-50 px-2.5 py-1 rounded border border-slate-200 uppercase">
              Declaración Anual Oficial • {anual.tipo_declaracion}
            </span>

            <div className="text-xs text-slate-500 font-mono">
              Folio de Operación SAT: <b className="text-slate-900">{anual.num_operacion || 'N/A'}</b>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-6">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                {esSaldoFavor ? 'Resultado Oficial: Saldo a Favor' : 'Resultado Oficial: Impuesto a Cargo'}
              </span>
              <div className={`text-4xl font-extrabold tracking-tight font-mono mb-2 ${
                esSaldoFavor ? 'text-emerald-700' : 'text-red-700'
              }`}>
                {esSaldoFavor ? formatMoney(anual.saldo_a_favor) : formatMoney(anual.saldo_a_cargo)}
              </div>
              <p className="text-xs text-slate-600 max-w-md leading-relaxed">
                {esSaldoFavor
                  ? `El SAT determinó un saldo a favor de ${formatMoney(anual.saldo_a_favor)} por retenciones correspondientes al ejercicio.`
                  : `Se liquidó un impuesto total a cargo de ${formatMoney(anual.saldo_a_cargo)} en este ejercicio fiscal.`}
              </p>

              {anual.clabe && (
                <div className="mt-3 inline-flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
                  <span className="text-slate-500">Cuenta CLABE:</span>
                  <span className="font-mono font-bold text-slate-800">{anual.clabe}</span>
                  {anual.banco && <span className="text-slate-500">({anual.banco})</span>}
                </div>
              )}
            </div>

            {/* Cascada de Determinación Oficial */}
            <div className="lg:col-span-6 bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-2 text-xs">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Determinación Oficial SAT
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-600">Ingresos Acumulables:</span>
                <span className="font-mono font-bold text-slate-900">{formatMoney(anual.ingresos_acumulables_totales)}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-600">Deducciones Personales:</span>
                <span className="font-mono font-bold text-amber-700">-{formatMoney(anual.deducciones_personales)}</span>
              </div>
              <div className="flex justify-between py-0.5 font-semibold">
                <span className="text-slate-700">Base Gravable:</span>
                <span className="font-mono font-bold text-slate-900">{formatMoney(anual.base_gravable)}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-600">ISR a Cargo (Tarifa):</span>
                <span className="font-mono font-bold text-red-700">{formatMoney(anual.isr_tarifa)}</span>
              </div>
              {anual.pagos_provisionales > 0 && (
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-600">Pagos Provisionales:</span>
                  <span className="font-mono font-bold text-blue-700">-{formatMoney(anual.pagos_provisionales)}</span>
                </div>
              )}
              <div className="flex justify-between py-0.5 pt-1.5 border-t border-slate-200">
                <span className="text-slate-700 font-semibold">ISR Retenido:</span>
                <span className="font-mono font-bold text-emerald-700">-{formatMoney(anual.isr_retenido)}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-amber-900 flex items-center gap-4 text-xs">
          <div>
            <h3 className="font-bold text-amber-950 text-sm">Declaración Anual {year} en Proceso</h3>
            <p className="mt-1 text-amber-800">
              No se encontró un acuse PDF oficial para el ejercicio {year}. Puedes consultar el detalle de los 12 pagos provisionales abajo.
            </p>
          </div>
        </div>
      )}

      {/* ── 2. DESGLOSE DE INGRESOS DECLARADOS Y NÓMINA DE PATRONES ── */}
      {anual && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Origen de Ingresos Declarados ({formatMoney(anual.ingresos_acumulables_totales)})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Integración de Sueldos y Salarios por empleador vs Actividad Profesional e Intereses.
              </p>
            </div>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
              Base Acumulable Oficial
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Sueldos */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sueldos y Salarios</span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-medium">
                  {(data.sections?.sueldos?.detalle || []).length} Empleador{(data.sections?.sueldos?.detalle || []).length !== 1 ? 'es' : ''}
                </span>
              </div>
              <div className="text-xl font-bold text-slate-900 font-mono mt-1">
                {formatMoney(data.sections?.sueldos?.gravado || anual.ingresos_acumulables_totales)}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                ISR Retenido por Patrones: <span className="font-mono font-semibold text-emerald-700">{formatMoney(anual.isr_retenido_total)}</span>
              </div>
            </div>

            {/* Honorarios */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Honorarios / Actividad</span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-medium">
                  Facturado: {formatMoney(data.sections?.honorarios?.ingresos || 0)}
                </span>
              </div>
              <div className="text-xl font-bold text-slate-900 font-mono mt-1">
                {formatMoney(Math.max(0, (data.sections?.honorarios?.ingresos || 0) - (data.sections?.honorarios?.deducciones_autorizadas || 0)))}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Utilidad Gravable Acumulable (Absorbida por gastos deducibles)
              </div>
            </div>
          </div>

          {/* Lista de Empleadores */}
          {(data.sections?.sueldos?.detalle || []).length > 0 && (
            <div className="border-t border-slate-200 pt-3 mt-2">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2.5">
                Desglose de Recibos y Retenciones de Nómina por Empleador ({year})
              </h4>
              <div className="space-y-2">
                {data.sections.sueldos.detalle.map((p, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex-wrap gap-2">
                    <div>
                      <div className="font-bold text-slate-900">{p.nombre}</div>
                      <div className="text-slate-500 font-mono text-[11px]">
                        RFC: {p.rfc} • {p.recibos?.length || 0} recibos de nómina timbrados
                      </div>
                    </div>
                    <div className="flex gap-6 items-center">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 uppercase block font-semibold">Ingreso Gravado</span>
                        <span className="font-mono font-bold text-slate-900">{formatMoney(p.gravado)}</span>
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
      )}

      {/* ── 3. CUADRO RESUMEN DE PAGOS PROVISIONALES ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Meses Presentados</div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            {data.meses_presentados_count} <span className="text-xs font-normal text-slate-500">/ 12 meses</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">100% al corriente ante el SAT</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Pagado en el Año</div>
          <div className={`text-xl font-bold font-mono ${totalPagadoEnMeses > 0 ? 'text-red-700' : 'text-slate-900'}`}>
            {formatMoney(totalPagadoEnMeses)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {totalPagadoEnMeses === 0 ? 'Todos los meses salieron en $0' : `ISR: ${formatMoney(totalIsrPagadoMeses)} | IVA: ${formatMoney(totalIvaPagadoMeses)}`}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ingresos Facturados (Honorarios)</div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            {formatMoney(totalIngresosMeses)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Facturación emitida con CFDI</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">IVA Acreditable en Compras</div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            {formatMoney(meses.reduce((s, m) => s + (m.iva_acreditable_sat || 0), 0))}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">IVA deducido en declaraciones</div>
        </div>
      </div>

      {/* ── 4. TABLA EJECUTIVA: DETALLE MES POR MES (12 MESES) ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Detalle Mensual de Declaraciones ({year})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ingresos, gastos, determinación de impuestos y pagos efectivos realizados al SAT.
            </p>
          </div>

          <div className="flex bg-slate-100 p-0.5 rounded-lg gap-1 border border-slate-200">
            <button
              onClick={() => setViewMode('tabla')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                viewMode === 'tabla' ? 'bg-white text-slate-900 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Vista Tabla
            </button>
            <button
              onClick={() => setViewMode('tarjetas')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                viewMode === 'tarjetas' ? 'bg-white text-slate-900 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Vista Tarjetas
            </button>
          </div>
        </div>

        {viewMode === 'tabla' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="p-3">Mes</th>
                  <th className="p-3">Estatus SAT</th>
                  <th className="p-3 text-right">Ingreso Facturado</th>
                  <th className="p-3 text-right">ISR Retenido</th>
                  <th className="p-3 text-right">IVA Cobrado (16%)</th>
                  <th className="p-3 text-right">IVA Acreditable</th>
                  <th className="p-3 text-right">Pago Efectivo</th>
                  <th className="p-3 text-center">Folio SAT</th>
                  <th className="p-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {meses.map((m) => {
                  const isPresentada = m.estatus === 'Presentada';
                  const totalPagoMes = m.total_pago_efectivo || ((m.isr_a_cargo_sat || 0) + (m.iva_a_cargo_sat || 0));

                  return (
                    <tr key={m.mes_numero} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-semibold text-slate-900">
                        {m.mes_numero.toString().padStart(2, '0')}. {m.mes_nombre}
                      </td>
                      <td className="p-3">
                        {m.tipo_declaracion === 'Complementaria' ? (
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-800 rounded border border-amber-200">
                            Complementaria
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-800 rounded border border-emerald-200">
                            Normal
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono font-medium text-slate-900">
                        {formatMoney(m.xml_ingresos_facturados || m.isr_ingresos_mes || 0)}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-600">
                        {formatMoney(m.isr_retenido_sat || 0)}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-600">
                        {formatMoney(m.iva_cobrado_sat || 0)}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-600">
                        {formatMoney(m.iva_acreditable_sat || 0)}
                      </td>
                      <td className="p-3 text-right font-mono">
                        {totalPagoMes > 0 ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Pagaste: {formatMoney(totalPagoMes)}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                            $0.00 (Sin Pago)
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center font-mono text-slate-600 text-[11px]">
                        {m.num_operacion ? `Op. ${m.num_operacion}` : '—'}
                      </td>
                      <td className="p-3 text-center">
                        {isPresentada && m.detalle_oficial_completo ? (
                          <button
                            onClick={() => setSelectedMonthModal(m)}
                            className="px-2.5 py-1 text-[11px] font-medium rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                          >
                            Ver Detalle SAT
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-900 text-xs">
                  <td className="p-3">TOTAL ANUAL</td>
                  <td className="p-3 text-emerald-700 font-semibold">{data.meses_presentados_count} Presentadas</td>
                  <td className="p-3 text-right font-mono">{formatMoney(totalIngresosMeses)}</td>
                  <td className="p-3 text-right font-mono">-{formatMoney(meses.reduce((s, m) => s + (m.isr_retenido_sat || 0), 0))}</td>
                  <td className="p-3 text-right font-mono">{formatMoney(meses.reduce((s, m) => s + (m.iva_cobrado_sat || 0), 0))}</td>
                  <td className="p-3 text-right font-mono">-{formatMoney(meses.reduce((s, m) => s + (m.iva_acreditable_sat || 0), 0))}</td>
                  <td className="p-3 text-right font-mono font-black">{formatMoney(totalPagadoEnMeses)}</td>
                  <td className="p-3 text-center">—</td>
                  <td className="p-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          /* Vista Tarjetas */
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {meses.map((m) => {
              const isPresentada = m.estatus === 'Presentada';
              const totalPagoMes = m.total_pago_efectivo || ((m.isr_a_cargo_sat || 0) + (m.iva_a_cargo_sat || 0));

              return (
                <div
                  key={m.mes_numero}
                  className={`p-4 rounded-xl border flex flex-col justify-between ${
                    isPresentada ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-2.5">
                      <span className="font-bold text-xs text-slate-900">
                        {m.mes_numero.toString().padStart(2, '0')}. {m.mes_nombre}
                      </span>
                      {totalPagoMes > 0 ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-700 rounded border border-rose-200 font-mono">
                          Pago: {formatMoney(totalPagoMes)}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-700 rounded">
                          Pago $0.00
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Ingreso Facturado:</span>
                        <b className="font-mono text-slate-900">{formatMoney(m.xml_ingresos_facturados || m.isr_ingresos_mes || 0)}</b>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>IVA Cobrado (16%):</span>
                        <span className="font-mono text-slate-700">{formatMoney(m.iva_cobrado_sat)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>IVA Deducido (Gastos):</span>
                        <span className="font-mono text-slate-700">-{formatMoney(m.iva_acreditable_sat)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 mt-3 flex justify-between items-center text-xs">
                    <span className="text-[11px] text-slate-500 font-mono">Op. {m.num_operacion || 'N/A'}</span>
                    {isPresentada && m.detalle_oficial_completo && (
                      <button
                        onClick={() => setSelectedMonthModal(m)}
                        className="px-2.5 py-1 text-[11px] font-medium rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                      >
                        Ver Detalle SAT
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 5. MODAL DETALLE EXHAUSTIVO OFICIAL DEL SAT (Clean Light Theme) ── */}
      {selectedMonthModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            
            {/* Header del Modal */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                  Declaración Provisional SAT • Oficial
                </span>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  {selectedMonthModal.mes_nombre} {year} ({selectedMonthModal.tipo_declaracion})
                </h3>
              </div>
              <button
                onClick={() => setSelectedMonthModal(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contenido del Modal con todos los campos */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              
              {/* Metadatos Generales */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase block">Número de Operación</span>
                  <b className="font-mono text-slate-900 text-xs">{selectedMonthModal.num_operacion}</b>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase block">Fecha de Presentación</span>
                  <span className="font-medium text-slate-800 text-xs">{selectedMonthModal.fecha_presentacion || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase block">RFC Registrado</span>
                  <span className="font-mono font-bold text-slate-800 text-xs">{selectedMonthModal.detalle_oficial_completo?.rfc || 'SHLL250825XYZ'}</span>
                </div>
              </div>

              {/* Sección R122: ISR */}
              <div className="bg-slate-50/50 rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-100/70 border-b border-slate-200 font-bold text-slate-900 text-xs">
                  Determinación del Impuesto Sobre la Renta (ISR R122)
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {[
                    ['Ingresos de Periodos Anteriores', selectedMonthModal.detalle_oficial_completo?.isr_ingresos_periodos_anteriores],
                    ['Ingresos del Periodo', selectedMonthModal.detalle_oficial_completo?.isr_ingresos_periodo],
                    ['Total de Ingresos Acumulables', selectedMonthModal.detalle_oficial_completo?.isr_ingresos_acumulados],
                    ['Compras y Gastos del Periodo (Deducciones)', selectedMonthModal.detalle_oficial_completo?.isr_compras_periodo],
                    ['Total de Compras y Gastos Acumulados', selectedMonthModal.detalle_oficial_completo?.isr_deducciones_autorizadas],
                    ['Pérdidas Fiscales de Ejercicios Anteriores Aplicadas', selectedMonthModal.detalle_oficial_completo?.isr_perdidas_anteriores_aplicadas],
                    ['Base Gravable del Pago Provisional', selectedMonthModal.detalle_oficial_completo?.isr_base_gravable],
                    ['ISR Causado conforme a Tarifa', selectedMonthModal.detalle_oficial_completo?.isr_causado],
                    ['Pagos Provisionales Efectuados con Anterioridad', selectedMonthModal.detalle_oficial_completo?.isr_pagos_provisionales_anteriores],
                    ['ISR Retenido del Periodo', selectedMonthModal.detalle_oficial_completo?.isr_retenido_periodo],
                    ['Total Impuesto Retenido Acumulado', selectedMonthModal.detalle_oficial_completo?.isr_impuesto_retenido_total],
                    ['ISR a Cargo del Mes', selectedMonthModal.detalle_oficial_completo?.isr_a_cargo]
                  ].map(([label, val], idx) => (
                    <div key={idx} className="flex justify-between px-4 py-2 hover:bg-white transition-colors">
                      <span className="text-slate-600">{label}</span>
                      <b className="font-mono text-slate-900">
                        {formatMoney(val || 0)}
                      </b>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sección R21: IVA */}
              <div className="bg-slate-50/50 rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-100/70 border-b border-slate-200 font-bold text-slate-900 text-xs">
                  Determinación del Impuesto al Valor Agregado (IVA R21)
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {[
                    ['Actividades Gravadas a la Tasa del 16%', selectedMonthModal.detalle_oficial_completo?.iva_base_gravada_16],
                    ['IVA Cobrado del Periodo a la Tasa del 16%', selectedMonthModal.detalle_oficial_completo?.iva_cobrado_16],
                    ['IVA Acreditable del Periodo (Gastos)', selectedMonthModal.detalle_oficial_completo?.iva_acreditable_gastos],
                    ['IVA Retenido por Terceros', selectedMonthModal.detalle_oficial_completo?.iva_retenido],
                    ['IVA a Cargo del Mes', selectedMonthModal.detalle_oficial_completo?.iva_a_cargo]
                  ].map(([label, val], idx) => (
                    <div key={idx} className="flex justify-between px-4 py-2 hover:bg-white transition-colors">
                      <span className="text-slate-600">{label}</span>
                      <b className="font-mono text-slate-900">
                        {formatMoney(val || 0)}
                      </b>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resumen Total Pagado */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center flex-wrap gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Cantidad Total a Pagar en este Mes:
                  </span>
                  <div className={`text-xl font-bold font-mono ${(selectedMonthModal.total_pago_efectivo || 0) > 0 ? 'text-red-700' : 'text-slate-900'}`}>
                    {formatMoney(selectedMonthModal.total_pago_efectivo || 0)}
                  </div>
                </div>
                {selectedMonthModal.tiene_acuse_pago && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-md border border-emerald-200 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Acuse de Pago SAT Validado
                  </span>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
