'use client';

import React, { useState } from 'react';
import { fmt } from '../ui/Primitives';
import { ChevronDown, ChevronUp, FileText, Code2, Download } from 'lucide-react';

export const ReciboNomina = ({ recibo, onViewCfdi, onViewXml }) => {
  const [expanded, setExpanded] = useState(false);

  if (!recibo) return null;

  return (
    <div className="nomina-recibo-card bg-white border border-slate-200 rounded-xl overflow-hidden mb-3 shadow-xs">
      <div
        className="nomina-recibo-header p-4 bg-slate-50/70 hover:bg-slate-100/70 transition-colors cursor-pointer flex justify-between items-center"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="nomina-recibo-summary flex-1 flex flex-wrap justify-between items-center gap-4">
          <div className="nomina-fechas">
            <strong className="text-slate-900 font-bold text-xs block">{recibo.fecha}</strong>
            <span className="text-[11px] text-slate-500">
              Periodo: {recibo.fecha_inicial} - {recibo.fecha_final} ({recibo.dias_pagados} días)
            </span>
          </div>

          <div className="nomina-kpis flex gap-5 items-center text-xs">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Bruto</span>
              <span className="font-mono font-semibold text-slate-800">{fmt(recibo.total_bruto)}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Vales</span>
              {recibo.vales > 0 ? (
                <span className="font-mono font-semibold text-red-700">-{fmt(recibo.vales)}</span>
              ) : (
                <span className="text-slate-400 font-mono">—</span>
              )}
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Deducciones</span>
              <span className="font-mono font-semibold text-red-700">-{fmt(recibo.total_deducciones)}</span>
            </div>
            <div className="text-right bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              <span className="text-[10px] text-emerald-800 font-bold uppercase block">Neto Pagado</span>
              <span className="font-mono font-bold text-emerald-700">{fmt(recibo.neto)}</span>
            </div>
          </div>

          <div className="text-slate-400">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="p-4 border-t border-slate-200 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-4">
            {/* PERCEPCIONES */}
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <h4 className="font-bold text-slate-900 mb-2">Percepciones</h4>
              <div className="space-y-1.5">
                {recibo.percepciones.length === 0 && <div className="text-slate-400 italic">No hay percepciones detalladas</div>}
                {recibo.percepciones.map((p, idx) => (
                  <div className="flex justify-between py-0.5" key={'p' + idx}>
                    <span className="text-slate-700"><span className="font-mono text-slate-400 mr-1">{p.tipo}</span> {p.concepto}</span>
                    <span className="font-mono font-semibold text-slate-900">{fmt(p.total)}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-slate-900">
                  <span>Suma Percepciones</span>
                  <span className="font-mono">{fmt(recibo.total_bruto)}</span>
                </div>
              </div>
            </div>

            {/* DEDUCCIONES */}
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <h4 className="font-bold text-slate-900 mb-2">Deducciones</h4>
              <div className="space-y-1.5">
                {recibo.deducciones.length === 0 && <div className="text-slate-400 italic">No hay deducciones detalladas</div>}
                {recibo.deducciones.map((d, idx) => (
                  <div className="flex justify-between py-0.5" key={'d' + idx}>
                    <span className="text-slate-700"><span className="font-mono text-slate-400 mr-1">{d.tipo}</span> {d.concepto}</span>
                    <span className="font-mono font-semibold text-red-700">{fmt(d.importe)}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-red-700">
                  <span>Suma Deducciones</span>
                  <span className="font-mono">{fmt(recibo.total_deducciones)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-between items-center gap-3 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-400">UUID:</span>
              <button
                onClick={(e) => { e.stopPropagation(); if (onViewCfdi) onViewCfdi(recibo.raw_cfdi); }}
                className="font-mono text-[11px] text-blue-600 hover:text-blue-800 underline cursor-pointer"
              >
                {recibo.uuid}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); if (onViewXml) onViewXml(recibo.raw_cfdi); }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[11px] cursor-pointer"
                title="Ver JSON estructurado"
              >
                <Code2 className="w-3 h-3 text-slate-500" />
                <span>JSON</span>
              </button>
              {recibo.raw_cfdi?.filename && (
                <button
                  onClick={(e) => { e.stopPropagation(); window.open(`/api/download_xml?filename=${recibo.raw_cfdi.filename}`, '_blank'); }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[11px] cursor-pointer"
                  title="Descargar archivo original .xml"
                >
                  <Download className="w-3 h-3 text-slate-500" />
                  <span>XML</span>
                </button>
              )}
            </div>
            <div className="font-semibold text-slate-900">
              Neto Pagado: <span className="font-mono text-emerald-700 font-bold text-sm">{fmt(recibo.neto)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
