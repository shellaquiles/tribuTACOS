'use client';

import React, { useState } from 'react';
import { SectionCard, CsvExportButton, fmt } from '../ui/Primitives';
import { CfdiVisualizerModal, XmlViewerModal } from '../ui/Modals';
import { exportDeduccionesPersonales } from '../../csvExport';
import { Download, FileText, Code2 } from 'lucide-react';

export const DeduccionesPersonalesSection = ({ data, deducciones, year }) => {
  const [activeSubTab, setActiveSubTab] = useState('validas');
  const [selectedCfdi, setSelectedCfdi] = useState(null);
  const [viewingXml, setViewingXml] = useState(null);

  const currentData = data || deducciones;
  if (!currentData) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
        No se encontraron datos de deducciones personales para el ejercicio {year || 'seleccionado'}.
      </div>
    );
  }

  const tope = currentData.tope || {
    limite_15_pct: 0,
    limite_5_umas: 198031.8,
    tope_aplicable: 198031.8,
    monto_aplicado: 0,
    remanente_disponible: 198031.8,
    porcentaje_aprovechado: 0
  };

  const validas = currentData.detalle || [];
  const observadas = currentData.observadas || [];
  const posibles = currentData.posibles_no_clasificadas || [];

  const CAT_DEDUCCIONES_INFO = [
    { code: 'D01', name: 'Honorarios médicos, dentales y hospitalarios', desc: 'Consultas médicas, dentistas, psicólogos y nutriólogos titulados' },
    { code: 'D02', name: 'Gastos médicos por incapacidad / ópticos', desc: 'Lentes graduados (hasta $2,500) y aparatos de rehabilitación' },
    { code: 'D03', name: 'Gastos funerales', desc: 'Gastos de sepelio para cónyuge, padres, abuelos o hijos' },
    { code: 'D04', name: 'Donativos no onerosos', desc: 'Donaciones a donatarias autorizadas por el SAT (tope 7% ingresos)' },
    { code: 'D05', name: 'Intereses reales crédito hipotecario', desc: 'Intereses reales pagados en créditos Infonavit, Fovissste o bancarios' },
    { code: 'D06', name: 'Aportaciones voluntarias al SAR / Afore', desc: 'Aportaciones para el retiro (tope 10% ingresos o 5 UMAs)' },
    { code: 'D07', name: 'Primas por seguros de gastos médicos', desc: 'Pólizas de seguro médico para ti o familiares directos' },
    { code: 'D08', name: 'Gastos de transportación escolar obligatoria', desc: 'Transporte escolar obligatorio para hijos' },
    { code: 'D09', name: 'Cuentas especiales para el ahorro', desc: 'Planes de ahorro a largo plazo (hasta $152,000 anuales)' },
    { code: 'D10', name: 'Colegiaturas', desc: 'Preescolar a Bachillerato con topes específicos por nivel escolar' },
  ];

  return (
    <div className="flex flex-col gap-6 text-slate-800">

      {/* ── 1. Resumen Ejecutivo del Tope Legal (Art. 151 LISR) ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex justify-between items-start flex-wrap gap-4 pb-4 border-b border-slate-100 mb-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
              Art. 151 LISR • Tope Anual SAT {year}
            </span>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Control de Deducciones Personales
            </h2>
            <p className="text-xs text-slate-500 max-w-xl mt-1">
              Reduce directamente tu base gravable anual. El límite del SAT es el menor entre el 15% de tus ingresos totales y 5 UMAs anuales ({fmt(tope.limite_5_umas)}).
            </p>
          </div>

          {validas.length > 0 && (
            <button
              onClick={() => exportDeduccionesPersonales(validas, year)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Exportar Deducciones ({validas.length})</span>
            </button>
          )}
        </div>

        {/* KPIs de Aprovechamiento */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Monto Deducible Aplicado</span>
            <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
              {fmt(currentData.total)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {validas.length} comprobante(s) válido(s)
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Tope Legal Máximo SAT</span>
            <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
              {fmt(tope.tope_aplicable)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              5 UMAs: {fmt(tope.limite_5_umas)}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Espacio Fiscal Disponible</span>
            <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
              {fmt(tope.remanente_disponible)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Margen aún disponible para deducir
            </div>
          </div>
        </div>

        {/* Barra de Progreso */}
        <div>
          <div className="flex justify-between text-xs font-medium text-slate-600 mb-1.5">
            <span>Aprovechamiento del Tope Anual</span>
            <span className="font-semibold text-slate-800">{tope.porcentaje_aprovechado}% utilizado</span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, tope.porcentaje_aprovechado))}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── 2. Catálogo de Rubros Deducibles ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-900">
            Desglose por Tipo de Deducción Personal
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Clasificación fiscal de acuerdo al catálogo oficial de deducciones del SAT.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {CAT_DEDUCCIONES_INFO.map(cat => {
            const monto = currentData.por_uso?.[cat.code] || 0;
            const hasData = monto > 0;
            return (
              <div
                key={cat.code}
                className={`p-3.5 rounded-xl border transition-colors flex flex-col justify-between ${
                  hasData
                    ? 'bg-blue-50/50 border-blue-200'
                    : 'bg-slate-50/70 border-slate-200'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{cat.code}</span>
                    {hasData && (
                      <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded">
                        Activo
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-semibold text-slate-900 line-clamp-2 leading-tight">
                    {cat.name}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    {cat.desc}
                  </div>
                </div>

                <div className="border-t border-slate-200/80 pt-2 mt-2">
                  <div className={`text-sm font-bold font-mono ${hasData ? 'text-blue-700' : 'text-slate-400'}`}>
                    {hasData ? fmt(monto) : '$0.00'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 3. Comprobantes y Validación Fiscal ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex gap-2 mb-4 border-b border-slate-200 pb-3 flex-wrap">
          <button
            onClick={() => setActiveSubTab('validas')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeSubTab === 'validas'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Válidas y Deducibles ({validas.length})
          </button>

          <button
            onClick={() => setActiveSubTab('observadas')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeSubTab === 'observadas'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Observadas ({observadas.length})
          </button>

          {posibles.length > 0 && (
            <button
              onClick={() => setActiveSubTab('posibles')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeSubTab === 'posibles'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Salud con Uso General G03 ({posibles.length})
            </button>
          )}
        </div>

        {/* Tab 1: Válidas */}
        {activeSubTab === 'validas' && (
          <div>
            {validas.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Emisor / Proveedor</th>
                      <th className="p-3">Rubro Deducible</th>
                      <th className="p-3">Forma de Pago</th>
                      <th className="p-3 text-right">Monto</th>
                      <th className="p-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {validas.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-mono text-slate-600 whitespace-nowrap">{item.fecha}</td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-900">{item.emisor}</div>
                          <div className="text-slate-500 font-mono text-[11px]">{item.rfc_emisor}</div>
                        </td>
                        <td className="p-3">
                          <span className="inline-block bg-slate-100 text-slate-700 font-mono text-[10px] px-1.5 py-0.5 rounded border border-slate-200 mr-1.5">
                            {item.uso_cfdi}
                          </span>
                          <span className="text-slate-700">{item.uso_nombre}</span>
                        </td>
                        <td className="p-3">
                          <span className="text-emerald-700 font-medium text-[11px]">
                            {item.forma_pago === '03' ? 'Transferencia (03)' : item.forma_pago === '04' ? 'Tarjeta Crédito (04)' : item.forma_pago === '28' ? 'Tarjeta Débito (28)' : item.forma_pago}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">
                          {fmt(item.monto)}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedCfdi(item.raw_cfdi || item)}
                              className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer"
                              title="Ver CFDI"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setViewingXml(item.raw_cfdi || item)}
                              className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer"
                              title="Ver JSON"
                            >
                              <Code2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                No se registraron deducciones personales válidas en este ejercicio fiscal.
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Observadas */}
        {activeSubTab === 'observadas' && (
          <div>
            {observadas.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Emisor</th>
                      <th className="p-3">Motivo de Observación</th>
                      <th className="p-3 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {observadas.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-mono text-slate-600">{item.fecha}</td>
                        <td className="p-3 font-semibold text-slate-900">{item.emisor}</td>
                        <td className="p-3 text-red-700 font-medium">{item.motivo || 'Pago en efectivo o no deducible'}</td>
                        <td className="p-3 text-right font-mono text-slate-800">{fmt(item.monto)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                No hay deducciones con observaciones fiscales.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Posibles (G03) */}
        {activeSubTab === 'posibles' && (
          <div>
            {posibles.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Emisor</th>
                      <th className="p-3">Concepto Detectado</th>
                      <th className="p-3 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {posibles.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-mono text-slate-600">{item.fecha}</td>
                        <td className="p-3 font-semibold text-slate-900">{item.emisor}</td>
                        <td className="p-3 text-slate-700">{item.concepto}</td>
                        <td className="p-3 text-right font-mono text-slate-800">{fmt(item.monto)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                No se detectaron facturas de salud con uso G03.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modales de Inspección */}
      <CfdiVisualizerModal cfdi={selectedCfdi} onClose={() => setSelectedCfdi(null)} />
      <XmlViewerModal data={viewingXml} onClose={() => setViewingXml(null)} />

    </div>
  );
};
