'use client';

import React, { useState, useMemo } from 'react';
import { ConceptCard, fmt } from '../ui/Primitives';
import { TrendingUp, Receipt, ShieldAlert, DollarSign } from 'lucide-react';

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
  const sumRetenciones = sumIsrRet + sumIvaRet;
  const totalPagadoEfectivo = sumSubtotal + sumIva - sumRetenciones;

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
      
      {/* ── Encabezado y Selector de Cliente ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex justify-between items-center flex-wrap gap-4 pb-5 border-b border-slate-200 mb-6">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-0.5">
              Honorarios / Servicios Profesionales • Ejercicio {year}
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Ingresos Facturados y Retenciones
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Desglose de comprobantes fiscales emitidos, IVA trasladado y retenciones efectuadas por clientes.
            </p>
          </div>

          {clients.length > 0 && (
            <div className="flex gap-1.5 flex-wrap bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setSelectedClient('Global')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
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
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
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

        {/* ── 4 Tarjetas de Métricas Clave Autodescriptivas con Color Distinctivo ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* 1. Subtotal Facturado (Azul Royal) */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 border-t-4 border-t-blue-600 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-900">Subtotal Facturado</span>
                <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                  <TrendingUp className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-2xl font-black text-blue-700 font-mono tracking-tight mb-1">
                {fmt(sumSubtotal)}
              </div>
            </div>
            <div className="text-xs text-slate-500 pt-2.5 border-t border-slate-100 mt-2">
              Ingreso base acumulable
            </div>
          </div>

          {/* 2. IVA Trasladado (Ámbar Dorado) */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 border-t-4 border-t-amber-500 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900">IVA Trasladado (16%)</span>
                <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                  <Receipt className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-2xl font-black text-amber-700 font-mono tracking-tight mb-1">
                {fmt(sumIva)}
              </div>
            </div>
            <div className="text-xs text-slate-500 pt-2.5 border-t border-slate-100 mt-2 font-mono">
              Total Bruto: <span className="font-semibold text-slate-700">{fmt(sumSubtotal + sumIva)}</span>
            </div>
          </div>

          {/* 3. Retenciones Sufridas (Púrpura / Rosa) */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 border-t-4 border-t-purple-600 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-900">Retenciones Sufridas</span>
                <span className="p-1.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200">
                  <ShieldAlert className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className={`text-2xl font-black font-mono tracking-tight mb-1 ${sumRetenciones > 0 ? 'text-purple-700' : 'text-slate-800'}`}>
                {fmt(sumRetenciones)}
              </div>
            </div>
            <div className="text-xs text-slate-500 pt-2.5 border-t border-slate-100 mt-2 font-mono">
              ISR: <span className="font-semibold text-slate-700">{fmt(sumIsrRet)}</span> • IVA: <span className="font-semibold text-slate-700">{fmt(sumIvaRet)}</span>
            </div>
          </div>

          {/* 4. Neto Percibido en Cuenta (Verde Esmeralda) */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 border-t-4 border-t-emerald-600 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-900">Neto Percibido</span>
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <DollarSign className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-700 font-mono tracking-tight mb-1">
                {fmt(totalPagadoEfectivo)}
              </div>
            </div>
            <div className="text-xs text-slate-500 pt-2.5 border-t border-slate-100 mt-2">
              Cobrado efectivamente en banco
            </div>
          </div>

        </div>
      </div>

      {/* ── Desglose de Conceptos Facturados con Tarjetas Dinámicas ── */}
      {calcConceptos.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Desglose de Conceptos Facturados
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Clasificación por Clave de Producto/Servicio del catálogo SAT.
              </p>
            </div>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 font-mono">
              {calcConceptos.length} conceptos
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
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
