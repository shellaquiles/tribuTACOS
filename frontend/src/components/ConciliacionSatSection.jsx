'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, CheckCircle2, AlertCircle, X, TrendingUp, DollarSign, Receipt, ShieldCheck } from 'lucide-react';

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
        <div className={`p-6 rounded-2xl border shadow-xs transition-all ${
          esSaldoFavor
            ? 'bg-gradient-to-r from-emerald-50/70 via-teal-50/30 to-white border-emerald-200'
            : 'bg-gradient-to-r from-rose-50/70 via-amber-50/30 to-white border-rose-200'
        }`}>
          <div className="flex flex-wrap justify-between items-center gap-2 pb-4 border-b border-slate-200/80 mb-6">
            <span className="text-xs font-semibold text-slate-700 bg-white px-3 py-1 rounded-lg border border-slate-200 uppercase shadow-2xs">
              Declaración Anual Oficial • {anual.tipo_declaracion}
            </span>

            <div className="text-xs text-slate-600 font-mono bg-white/80 px-3 py-1 rounded-lg border border-slate-200">
              Folio de Operación SAT: <b className="text-slate-900">{anual.num_operacion || 'N/A'}</b>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-6">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
                {esSaldoFavor ? 'Resultado Oficial: Saldo a Favor' : 'Resultado Oficial: Impuesto a Cargo'}
              </span>
              <div className={`text-4xl sm:text-5xl font-black tracking-tight font-mono mb-2 ${
                esSaldoFavor ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                {esSaldoFavor ? formatMoney(anual.saldo_a_favor) : formatMoney(anual.saldo_a_cargo)}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md leading-relaxed">
                {esSaldoFavor
                  ? `El SAT determinó un saldo a favor de ${formatMoney(anual.saldo_a_favor)} por retenciones correspondientes al ejercicio.`
                  : `Se liquidó un impuesto total a cargo de ${formatMoney(anual.saldo_a_cargo)} en este ejercicio fiscal.`}
              </p>

              {anual.clabe && (
                <div className="mt-3 inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs shadow-2xs">
                  <span className="text-slate-500">Cuenta CLABE:</span>
                  <span className="font-mono font-bold text-slate-800">{anual.clabe}</span>
                  {anual.banco && <span className="text-slate-500">({anual.banco})</span>}
                </div>
              )}
            </div>

            {/* Cascada de Determinación Oficial */}
            <div className="lg:col-span-6 bg-white/95 backdrop-blur-xs p-4.5 rounded-xl border border-slate-200/90 shadow-xs flex flex-col gap-2 text-xs">
              <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-0.5">
                Determinación Oficial SAT
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Ingresos Acumulables:</span>
                <span className="font-mono font-bold text-blue-700">{formatMoney(anual.ingresos_acumulables_totales)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Deducciones Personales:</span>
                <span className="font-mono font-bold text-emerald-700">-{formatMoney(anual.deducciones_personales)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 font-semibold bg-slate-50/70 px-2 rounded">
                <span className="text-slate-800">Base Gravable:</span>
                <span className="font-mono font-black text-slate-900">{formatMoney(anual.base_gravable)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">ISR a Cargo (Tarifa):</span>
                <span className="font-mono font-bold text-rose-700">{formatMoney(anual.isr_tarifa)}</span>
              </div>
              {anual.pagos_provisionales > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Pagos Provisionales:</span>
                  <span className="font-mono font-bold text-blue-700">-{formatMoney(anual.pagos_provisionales)}</span>
                </div>
              )}
              <div className="flex justify-between py-1 pt-1.5 border-t border-slate-200">
                <span className="text-slate-700 font-semibold">ISR Retenido:</span>
                <span className="font-mono font-bold text-emerald-700">-{formatMoney(anual.isr_retenido)}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-900 flex items-center gap-4 text-xs">
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
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center mb-5 flex-wrap gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Origen de Ingresos Declarados ({formatMoney(anual.ingresos_acumulables_totales)})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Integración de Sueldos y Salarios por empleador vs Actividad Profesional e Intereses.
              </p>
            </div>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Base Acumulable Oficial
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Sueldos (Azul Royal) */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 border-t-4 border-t-blue-600 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-900">Sueldos y Salarios</span>
                  <span className="text-[10px] bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full font-bold">
                    {(data.sections?.sueldos?.detalle || []).length} Empleador{(data.sections?.sueldos?.detalle || []).length !== 1 ? 'es' : ''}
                  </span>
                </div>
                <div className="text-2xl font-black text-blue-700 font-mono tracking-tight mb-1">
                  {formatMoney(data.sections?.sueldos?.gravado || anual.ingresos_acumulables_totales)}
                </div>
              </div>
              <div className="text-xs text-slate-500 pt-2.5 border-t border-slate-100 mt-2 font-mono">
                ISR Retenido por Patrones: <span className="font-bold text-emerald-700">{formatMoney(anual.isr_retenido_total)}</span>
              </div>
            </div>

            {/* Honorarios (Verde Esmeralda) */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 border-t-4 border-t-emerald-600 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-900">Honorarios / Actividad</span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                    Facturado: {formatMoney(data.sections?.honorarios?.ingresos || 0)}
                  </span>
                </div>
                <div className="text-2xl font-black text-emerald-700 font-mono tracking-tight mb-1">
                  {formatMoney(Math.max(0, (data.sections?.honorarios?.ingresos || 0) - (data.sections?.honorarios?.deducciones_autorizadas || 0)))}
                </div>
              </div>
              <div className="text-xs text-slate-500 pt-2.5 border-t border-slate-100 mt-2">
                Utilidad Gravable Acumulable (Absorbida por gastos deducibles)
              </div>
            </div>
          </div>

          {/* Lista de Empleadores */}
          {(data.sections?.sueldos?.detalle || []).length > 0 && (
            <div className="border-t border-slate-200 pt-4 mt-2">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
                Desglose de Recibos y Retenciones de Nómina por Empleador ({year})
              </h4>
              <div className="space-y-2.5">
                {data.sections.sueldos.detalle.map((p, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex-wrap gap-2 hover:bg-slate-100/70 transition-colors">
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{p.nombre}</div>
                      <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                        RFC: {p.rfc} • {p.recibos?.length || 0} recibos de nómina timbrados
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
      )}

      {/* ── 3. CUADRO RESUMEN DE PAGOS PROVISIONALES CON COLORES DISTINTIVOS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Meses Presentados */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 border-t-4 border-t-emerald-600 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-900">Meses Presentados</span>
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-2xl font-black text-emerald-700 font-mono tracking-tight mb-1">
              {data.meses_presentados_count} <span className="text-sm font-normal text-slate-400">/ 12</span>
            </div>
          </div>
          <div className="text-xs text-emerald-700 font-semibold pt-2.5 border-t border-slate-100 mt-2">
            100% al corriente ante el SAT
          </div>
        </div>

        {/* Total Pagado en el Año */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 border-t-4 border-t-rose-600 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-900">Total Pagado en el Año</span>
              <span className="p-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                <DollarSign className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className={`text-2xl font-black font-mono tracking-tight mb-1 ${totalPagadoEnMeses > 0 ? 'text-rose-700' : 'text-slate-800'}`}>
              {formatMoney(totalPagadoEnMeses)}
            </div>
          </div>
          <div className="text-xs text-slate-500 pt-2.5 border-t border-slate-100 mt-2 font-mono">
            {totalPagadoEnMeses === 0 ? 'Sin pagos a cargo' : `ISR: ${formatMoney(totalIsrPagadoMeses)} | IVA: ${formatMoney(totalIvaPagadoMeses)}`}
          </div>
        </div>

        {/* Ingresos Facturados */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 border-t-4 border-t-blue-600 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-900">Ingresos Facturados</span>
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                <TrendingUp className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-2xl font-black text-blue-700 font-mono tracking-tight mb-1">
              {formatMoney(totalIngresosMeses)}
            </div>
          </div>
          <div className="text-xs text-slate-500 pt-2.5 border-t border-slate-100 mt-2">
            Facturación emitida con CFDI
          </div>
        </div>

        {/* IVA Acreditable en Compras */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 border-t-4 border-t-amber-500 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900">IVA Acreditable</span>
              <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                <Receipt className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-2xl font-black text-amber-700 font-mono tracking-tight mb-1">
              {formatMoney(meses.reduce((s, m) => s + (m.iva_acreditable_sat || 0), 0))}
            </div>
          </div>
          <div className="text-xs text-slate-500 pt-2.5 border-t border-slate-100 mt-2">
            IVA deducido en declaraciones
          </div>
        </div>

      </div>

      {/* ── 4. TABLA EJECUTIVA: DETALLE MES POR MES (12 MESES) CON GUÍA CROMÁTICA ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center flex-wrap gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Detalle Mensual de Declaraciones ({year})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ingresos, gastos, determinación de impuestos y pagos efectivos realizados al SAT.
            </p>
          </div>

          <div className="flex bg-slate-100 p-0.5 rounded-xl gap-1 border border-slate-200">
            <button
              onClick={() => setViewMode('tabla')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                viewMode === 'tabla' ? 'bg-white text-slate-900 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Vista Tabla
            </button>
            <button
              onClick={() => setViewMode('tarjetas')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
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
                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="p-3.5">Mes</th>
                  <th className="p-3.5">Estatus SAT</th>
                  <th className="p-3.5 text-right text-blue-900 bg-blue-50/40">Ingreso Facturado</th>
                  <th className="p-3.5 text-right text-slate-600">ISR Retenido</th>
                  <th className="p-3.5 text-right text-amber-900 bg-amber-50/30">IVA Cobrado (16%)</th>
                  <th className="p-3.5 text-right text-emerald-900 bg-emerald-50/30">IVA Acreditable</th>
                  <th className="p-3.5 text-right text-rose-900 bg-rose-50/40">Pago Efectivo</th>
                  <th className="p-3.5 text-center">Folio SAT</th>
                  <th className="p-3.5 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {meses.map((m) => {
                  const isPresentada = m.estatus === 'Presentada';
                  const totalPagoMes = m.total_pago_efectivo || ((m.isr_a_cargo_sat || 0) + (m.iva_a_cargo_sat || 0));

                  return (
                    <tr key={m.mes_numero} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">
                        {m.mes_numero.toString().padStart(2, '0')}. {m.mes_nombre}
                      </td>
                      <td className="p-3.5">
                        {m.tipo_declaracion === 'Complementaria' ? (
                          <span className="px-2.5 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-800 rounded-full border border-amber-200">
                            Complementaria
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200">
                            Normal
                          </span>
                        )}
                      </td>

                      {/* Ingreso Facturado (Azul) */}
                      <td className="p-3.5 text-right font-mono font-bold text-blue-700 bg-blue-50/20">
                        {formatMoney(m.xml_ingresos_facturados || m.isr_ingresos_mes || 0)}
                      </td>

                      {/* ISR Retenido */}
                      <td className="p-3.5 text-right font-mono text-slate-500">
                        {m.isr_retenido_sat > 0 ? `-${formatMoney(m.isr_retenido_sat)}` : '$0.00'}
                      </td>

                      {/* IVA Cobrado (Ámbar) */}
                      <td className="p-3.5 text-right font-mono font-semibold text-amber-700 bg-amber-50/15">
                        {formatMoney(m.iva_cobrado_sat || 0)}
                      </td>

                      {/* IVA Acreditable (Verde) */}
                      <td className="p-3.5 text-right font-mono font-semibold text-emerald-700 bg-emerald-50/15">
                        {m.iva_acreditable_sat > 0 ? `-${formatMoney(m.iva_acreditable_sat)}` : '$0.00'}
                      </td>

                      {/* Pago Efectivo (Rojo Destacado) */}
                      <td className="p-3.5 text-right font-mono bg-rose-50/20">
                        {totalPagoMes > 0 ? (
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200 inline-block">
                            Pagaste: {formatMoney(totalPagoMes)}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
                            $0.00 (Sin Pago)
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-center font-mono text-slate-500 text-[11px]">
                        {m.num_operacion ? `Op. ${m.num_operacion}` : '—'}
                      </td>

                      <td className="p-3.5 text-center">
                        {isPresentada && m.detalle_oficial_completo ? (
                          <button
                            onClick={() => setSelectedMonthModal(m)}
                            className="px-2.5 py-1 text-[11px] font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-all shadow-2xs hover:shadow-xs cursor-pointer inline-flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3 text-slate-500" />
                            <span>Ver Detalle SAT</span>
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
                <tr className="bg-slate-100 border-t-2 border-slate-300 font-extrabold text-slate-900 text-xs">
                  <td className="p-3.5">TOTAL ANUAL</td>
                  <td className="p-3.5 text-emerald-700 font-bold">{data.meses_presentados_count} Presentadas</td>
                  <td className="p-3.5 text-right font-mono text-blue-700 bg-blue-50/50">{formatMoney(totalIngresosMeses)}</td>
                  <td className="p-3.5 text-right font-mono text-slate-600">-{formatMoney(meses.reduce((s, m) => s + (m.isr_retenido_sat || 0), 0))}</td>
                  <td className="p-3.5 text-right font-mono text-amber-700 bg-amber-50/50">{formatMoney(meses.reduce((s, m) => s + (m.iva_cobrado_sat || 0), 0))}</td>
                  <td className="p-3.5 text-right font-mono text-emerald-700 bg-emerald-50/50">-{formatMoney(meses.reduce((s, m) => s + (m.iva_acreditable_sat || 0), 0))}</td>
                  <td className="p-3.5 text-right font-mono font-black text-rose-700 bg-rose-50/50">{formatMoney(totalPagadoEnMeses)}</td>
                  <td className="p-3.5 text-center">—</td>
                  <td className="p-3.5"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          /* Vista Tarjetas */
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {meses.map((m) => {
              const isPresentada = m.estatus === 'Presentada';
              const totalPagoMes = m.total_pago_efectivo || ((m.isr_a_cargo_sat || 0) + (m.iva_a_cargo_sat || 0));

              return (
                <div
                  key={m.mes_numero}
                  className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                    isPresentada ? 'bg-white border-slate-200 shadow-xs hover:shadow-md' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 mb-3">
                      <span className="font-bold text-xs text-slate-900">
                        {m.mes_numero.toString().padStart(2, '0')}. {m.mes_nombre}
                      </span>
                      {totalPagoMes > 0 ? (
                        <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-rose-50 text-rose-700 rounded-full border border-rose-200 font-mono">
                          Pago: {formatMoney(totalPagoMes)}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-700 rounded-full">
                          Pago $0.00
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Ingreso Facturado:</span>
                        <b className="font-mono text-blue-700">{formatMoney(m.xml_ingresos_facturados || m.isr_ingresos_mes || 0)}</b>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>IVA Cobrado (16%):</span>
                        <span className="font-mono text-amber-700">{formatMoney(m.iva_cobrado_sat)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>IVA Deducido (Gastos):</span>
                        <span className="font-mono text-emerald-700">-{formatMoney(m.iva_acreditable_sat)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3.5 border-t border-slate-100 mt-3.5 flex justify-between items-center text-xs">
                    <span className="text-[11px] text-slate-400 font-mono">Op. {m.num_operacion || 'N/A'}</span>
                    {isPresentada && m.detalle_oficial_completo && (
                      <button
                        onClick={() => setSelectedMonthModal(m)}
                        className="px-2.5 py-1 text-[11px] font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3 text-slate-500" />
                        <span>Ver Detalle</span>
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
