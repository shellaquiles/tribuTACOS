'use client';

import React, { useState } from 'react';
import { fmt } from './Primitives';
import {
  FileText,
  Building2,
  User,
  Copy,
  Check,
  X,
  CreditCard,
  Calendar,
  Layers,
  Coins,
  ShieldCheck
} from 'lucide-react';

export const FriendlyObjectViewer = ({ data, level = 0 }) => {
  if (data === null || data === undefined) return <span className="text-slate-400">null</span>;
  if (typeof data === 'boolean') return <span className="text-rose-600 font-semibold">{data ? 'true' : 'false'}</span>;
  if (typeof data === 'number') return <span className="text-blue-600 font-mono font-medium">{data}</span>;
  if (typeof data === 'string') return <span className="text-emerald-700">"{data}"</span>;

  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="text-slate-400">[]</span>;
    return (
      <div className={level > 0 ? "pl-4" : ""}>
        <span className="text-slate-400">[</span>
        {data.map((item, idx) => (
          <div key={idx} className="pl-4 my-0.5">
            <FriendlyObjectViewer data={item} level={level + 1} />
            {idx < data.length - 1 && <span className="text-slate-400">,</span>}
          </div>
        ))}
        <span className="text-slate-400">]</span>
      </div>
    );
  }

  if (typeof data === 'object') {
    const keys = Object.keys(data);
    if (keys.length === 0) return <span className="text-slate-400">{'{}'}</span>;
    return (
      <div className={level > 0 ? "pl-4" : ""}>
        <span className="text-slate-400">{'{'}</span>
        {keys.map((key, idx) => (
          <div key={key} className="pl-4 my-1">
            <strong className="text-indigo-700 font-semibold">"{key}"</strong>
            <span className="text-slate-400 mx-1">:</span>
            <FriendlyObjectViewer data={data[key]} level={level + 1} />
            {idx < keys.length - 1 && <span className="text-slate-400">,</span>}
          </div>
        ))}
        <span className="text-slate-400">{'}'}</span>
      </div>
    );
  }

  return <span>{String(data)}</span>;
};

export const XmlViewerModal = ({ data, onClose }) => {
  const [copied, setCopied] = useState(false);
  if (!data) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Metadatos Estructurados JSON</h3>
              <p className="text-[11px] text-slate-500">Inspección de propiedades del comprobante</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 transition-colors cursor-pointer shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Console Body */}
        <div className="p-6 font-mono text-xs text-slate-800 overflow-y-auto flex-1 leading-relaxed bg-slate-50/50">
          <FriendlyObjectViewer data={data} />
        </div>
      </div>
    </div>
  );
};

export const CfdiVisualizerModal = ({ cfdi, onClose }) => {
  const [copiedUuid, setCopiedUuid] = useState(false);
  if (!cfdi) return null;

  const copyUuid = () => {
    navigator.clipboard.writeText(cfdi.uuid);
    setCopiedUuid(true);
    setTimeout(() => setCopiedUuid(false), 2000);
  };

  const tipoLabel = cfdi.tipo === 'I' ? 'Ingreso' : cfdi.tipo === 'E' ? 'Egreso' : cfdi.tipo === 'P' ? 'Pago' : cfdi.tipo;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200/80 overflow-hidden">
        {/* Header */}
        <div className="px-6 sm:px-8 py-5 border-b border-slate-200 bg-slate-50/80 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-black uppercase tracking-wider bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
                CFDI 4.0 • {tipoLabel}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Comprobante Fiscal Digital
            </h2>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
              <span>UUID:</span>
              <span className="font-mono bg-slate-200/70 text-slate-800 px-2 py-0.5 rounded-md font-semibold">
                {cfdi.uuid}
              </span>
              <button
                onClick={copyUuid}
                className="p-1 rounded-md hover:bg-slate-200 text-slate-500 transition-colors"
                title="Copiar UUID"
              >
                {copiedUuid ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
          {/* Emisor y Receptor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Emisor */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Emisor</span>
              </div>
              <div className="text-sm font-bold text-slate-900 mb-2">{cfdi.emisor_nombre}</div>
              <div className="space-y-1 text-xs text-slate-600">
                <div><span className="font-semibold text-slate-400">RFC:</span> <span className="font-mono font-bold text-slate-800">{cfdi.emisor_rfc}</span></div>
                <div><span className="font-semibold text-slate-400">Régimen:</span> <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-mono">{cfdi.emisor_regimen}</span></div>
              </div>
            </div>

            {/* Receptor */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span>Receptor</span>
              </div>
              <div className="text-sm font-bold text-slate-900 mb-2">{cfdi.receptor_nombre}</div>
              <div className="space-y-1 text-xs text-slate-600">
                <div><span className="font-semibold text-slate-400">RFC:</span> <span className="font-mono font-bold text-slate-800">{cfdi.receptor_rfc}</span></div>
                <div><span className="font-semibold text-slate-400">Uso CFDI:</span> <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-mono">{cfdi.uso_cfdi}</span></div>
              </div>
            </div>
          </div>

          {/* Factura Meta */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Fecha Emisión</span>
              <span className="font-bold text-slate-800">{(cfdi.fecha || '').replace('T', ' ')}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Tipo</span>
              <span className="font-bold text-slate-800">{tipoLabel}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Moneda</span>
              <span className="font-bold text-slate-800">{cfdi.moneda || 'MXN'}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Forma Pago</span>
              <span className="font-bold text-slate-800">{cfdi.forma_pago || 'N/D'}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Método Pago</span>
              <span className="font-bold text-slate-800">{cfdi.metodo_pago || 'N/D'}</span>
            </div>
          </div>

          {/* Conceptos Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Descripción del Bien o Servicio</th>
                  <th className="p-3.5 text-right w-40">Importe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cfdi.conceptos && cfdi.conceptos.length > 0 ? (
                  cfdi.conceptos.map((c, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="p-3.5 text-slate-800 font-medium">{c.desc}</td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-800">
                        {fmt(parseFloat(c.imp))}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="p-6 text-center text-slate-400 italic">
                      Sin conceptos detallados en el comprobante procesado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="flex justify-end">
            <div className="w-full sm:w-80 bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono font-bold text-slate-800">{fmt(cfdi.subtotal)}</span>
              </div>
              {cfdi.descuento > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Descuento:</span>
                  <span className="font-mono font-bold">-{fmt(cfdi.descuento)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>IVA Trasladado:</span>
                <span className="font-mono font-bold text-slate-800">{fmt(cfdi.iva)}</span>
              </div>
              {cfdi.retencion_iva > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Retención IVA:</span>
                  <span className="font-mono font-bold">-{fmt(cfdi.retencion_iva)}</span>
                </div>
              )}
              {cfdi.retencion_isr > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Retención ISR:</span>
                  <span className="font-mono font-bold">-{fmt(cfdi.retencion_isr)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-200 pt-2 mt-2">
                <span>TOTAL:</span>
                <span className="font-mono text-base">{fmt(cfdi.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
