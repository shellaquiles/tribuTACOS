'use client';

import React, { useState } from 'react';
import { fmt } from '../ui/Primitives';
import { ChevronDown, ChevronUp, Code2, Download, FileText } from 'lucide-react';

export const ReciboAeyp = ({ recibo, onViewCfdi, onViewXml }) => {
  const [expanded, setExpanded] = useState(false);

  if (!recibo) return null;

  const totalRet = (recibo.isr_ret || 0) + (recibo.iva_ret || 0);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-3 shadow-xs hover:border-slate-300 transition-all">
      <div
        className="p-4 bg-slate-50/70 hover:bg-slate-100/70 transition-colors cursor-pointer flex justify-between items-center"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 flex flex-wrap justify-between items-center gap-4">
          <div>
            <span className="font-mono text-xs font-bold text-slate-900 block">{recibo.fecha}</span>
            <span className="font-mono text-[11px] text-slate-400">
              {recibo.uuid?.substring(0, 13)}...
            </span>
          </div>

          <div className="flex gap-5 items-center text-xs flex-wrap">
            <div className="text-right">
              <span className="text-[10px] text-blue-900 font-extrabold uppercase tracking-wider block">Subtotal PUE</span>
              <span className="font-mono font-bold text-blue-700">{fmt(recibo.subtotal)}</span>
            </div>

            {recibo.iva > 0 && (
              <div className="text-right">
                <span className="text-[10px] text-amber-900 font-extrabold uppercase tracking-wider block">IVA (16%)</span>
                <span className="font-mono font-bold text-amber-700">+{fmt(recibo.iva)}</span>
              </div>
            )}

            <div className="text-right">
              <span className="text-[10px] text-purple-900 font-extrabold uppercase tracking-wider block">Retenciones</span>
              {totalRet > 0 ? (
                <span className="font-mono font-bold text-purple-700">-{fmt(totalRet)}</span>
              ) : (
                <span className="text-slate-400 font-mono">$0.00</span>
              )}
            </div>

            <div className="text-right bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
              <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Cobro Neto</span>
              <span className="font-mono font-extrabold text-emerald-700 text-sm">{fmt(recibo.total)}</span>
            </div>
          </div>

          <div className="text-slate-400">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="p-5 border-t border-slate-200 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-4">
            
            {/* SERVICIOS FACTURADOS */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="font-bold text-blue-900 mb-2.5 flex items-center gap-1.5 text-xs">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Conceptos Facturados</span>
              </h4>
              <div className="space-y-1.5">
                {(recibo.conceptos || []).map((c, idx) => (
                  <div className="flex justify-between py-1 border-b border-slate-200/50" key={'aeyp-c' + idx}>
                    <span className="text-slate-700"><span className="font-mono text-blue-600 mr-1">{c.clave || ''}</span> {c.desc}</span>
                    <span className="font-mono font-bold text-blue-700">{fmt(c.imp)}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 font-bold text-slate-900">
                  <span>Subtotal Facturado</span>
                  <span className="font-mono text-blue-700">{fmt(recibo.subtotal)}</span>
                </div>
              </div>
            </div>

            {/* IMPUESTOS Y RETENCIONES */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-900 mb-2.5 text-xs">
                Impuestos (Traslados y Retenciones)
              </h4>
              <div className="space-y-1.5">
                {recibo.iva > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-200/50">
                    <span className="text-slate-700"><span className="font-mono text-amber-600 mr-1">002</span> IVA Trasladado (16%)</span>
                    <span className="font-mono font-bold text-amber-700">+{fmt(recibo.iva)}</span>
                  </div>
                )}
                {recibo.isr_ret > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-200/50">
                    <span className="text-slate-700"><span className="font-mono text-purple-600 mr-1">001</span> Retención ISR</span>
                    <span className="font-mono font-bold text-purple-700">-{fmt(recibo.isr_ret)}</span>
                  </div>
                )}
                {recibo.iva_ret > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-200/50">
                    <span className="text-slate-700"><span className="font-mono text-purple-600 mr-1">002</span> Retención IVA</span>
                    <span className="font-mono font-bold text-purple-700">-{fmt(recibo.iva_ret)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 font-bold text-slate-900">
                  <span>Total Retenciones</span>
                  <span className="font-mono text-purple-700">-{fmt(totalRet)}</span>
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
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[11px] cursor-pointer shadow-2xs"
                title="Ver estructura JSON"
              >
                <Code2 className="w-3 h-3 text-slate-500" />
                <span>JSON</span>
              </button>
              {recibo.raw_cfdi?.filename && (
                <button
                  onClick={(e) => { e.stopPropagation(); window.open(`/api/download_xml?filename=${recibo.raw_cfdi.filename}`, '_blank'); }}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[11px] cursor-pointer shadow-2xs"
                  title="Descargar archivo original .xml"
                >
                  <Download className="w-3 h-3 text-slate-500" />
                  <span>XML</span>
                </button>
              )}
            </div>
            <div className="font-semibold text-slate-900">
              Total Cobrado: <span className="font-mono text-emerald-700 font-black text-sm">{fmt(recibo.total)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
