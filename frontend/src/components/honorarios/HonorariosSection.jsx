'use client';

import React, { useState, useMemo } from 'react';
import { SectionCard, KpiRow, ConceptCard, fmt } from '../ui/Primitives';

export function HonorariosSection({ data, honorarios, year }) {
  const [selectedClient, setSelectedClient] = useState('Global');
  const currentData = data || honorarios;

  if (!currentData || (!currentData.ingresos && (!currentData.detalle || currentData.detalle.length === 0))) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
        No se encontraron comprobantes de honorarios o actividades profesionales timbrados para el ejercicio {year || 'seleccionado'}.
      </div>
    );
  }

  const clients = useMemo(() => {
    if (!currentData.detalle) return [];
    const dict = {};
    currentData.detalle.forEach(d => {
      const key = d.rfc || d.cliente;
      if (!dict[key]) dict[key] = d.cliente;
      else if (d.cliente && d.cliente.length < dict[key].length) dict[key] = d.cliente;
    });
    return Object.entries(dict).map(([rfc, nombre]) => ({ rfc, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [currentData.detalle]);

  const targetRecibos = useMemo(() => {
    if (selectedClient === 'Global') return currentData.detalle || [];
    return currentData.detalle?.filter(d => (d.rfc || d.cliente) === selectedClient) || [];
  }, [currentData.detalle, selectedClient]);

  const sumSubtotal = targetRecibos.reduce((acc, curr) => acc + (Number(curr.subtotal) || 0), 0);
  const sumIva = targetRecibos.reduce((acc, curr) => acc + (Number(curr.iva) || 0), 0);
  const sumIsrRet = targetRecibos.reduce((acc, curr) => acc + (Number(curr.ret_isr ?? curr.isr_ret) || 0), 0);
  const sumIvaRet = targetRecibos.reduce((acc, curr) => acc + (Number(curr.ret_iva ?? curr.iva_ret) || 0), 0);
  const cobradoBruto = sumSubtotal + sumIva;
  const sumRetenciones = sumIsrRet + sumIvaRet;
  const totalPagadoEfectivo = cobradoBruto - sumRetenciones;

  const calcConceptos = useMemo(() => {
    const cons = {};
    targetRecibos.forEach(r => {
      (r.conceptos || []).forEach(c => {
        const clave = c.clave || '00000000';
        if (!cons[clave]) {
          cons[clave] = {
            clave: clave,
            desc_sat: c.desc_sat || c.desc || 'Servicio profesional',
            importe: 0,
            no_ids: new Set()
          };
        }
        cons[clave].importe += c.imp || 0;
        if (c.desc && c.desc !== cons[clave].desc_sat) cons[clave].no_ids.add(c.desc);
      });
    });
    return Object.values(cons).map(c => ({
      ...c,
      no_ids: Array.from(c.no_ids)
    })).sort((a, b) => b.importe - a.importe);
  }, [targetRecibos]);

  return (
    <div className="flex flex-col gap-6 text-slate-800">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex justify-between items-center flex-wrap gap-4 pb-4 border-b border-slate-100 mb-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
              Honorarios / Servicios Profesionales • Ejercicio {year}
            </span>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Ingresos Facturados y Retenciones
            </h2>
          </div>

          {clients.length > 0 && (
            <div className="flex gap-1.5 flex-wrap bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setSelectedClient('Global')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  selectedClient === 'Global'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Portafolio Global
              </button>
              {clients.map((cli, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedClient(cli.rfc)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    selectedClient === cli.rfc
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cli.nombre.length > 25 ? cli.nombre.substring(0, 25) + '...' : cli.nombre}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Resumen de Flujo de Honorarios */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Subtotal Facturado</span>
            <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
              {fmt(sumSubtotal)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              IVA Trasladado: {fmt(sumIva)}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Retenciones Sufridas</span>
            <div className="text-2xl font-bold text-red-700 font-mono mt-1">
              {fmt(sumRetenciones)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              ISR: {fmt(sumIsrRet)} • IVA: {fmt(sumIvaRet)}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Neto Percibido</span>
            <div className="text-2xl font-bold text-emerald-700 font-mono mt-1">
              {fmt(totalPagadoEfectivo)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Cobrado en cuenta bancaria
            </div>
          </div>
        </div>

        <KpiRow items={[
          { label: 'Subtotal Facturado', value: sumSubtotal, accent: 'kpi-accent', help: 'Ingreso Base Acumulado' },
          { label: 'IVA Trasladado (16%)', value: sumIva, help: 'IVA trasladado a clientes' },
          { label: 'Retenciones Sufridas', value: sumRetenciones, accent: 'kpi-danger', help: 'ISR e IVA retenido por clientes' },
        ]} />
      </div>

      {/* Desglose de Conceptos */}
      {calcConceptos.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3">
            Desglose de Conceptos Facturados
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {calcConceptos.map((c, i) => (
              <ConceptCard
                key={i}
                title={c.desc_sat}
                value={c.importe}
                accent="blue"
                badge={c.clave}
                metaItems={c.no_ids.length > 0 ? [{ label: 'Conceptos reportados', value: c.no_ids.join(' • ') }] : []}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
