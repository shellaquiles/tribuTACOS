'use client';

import React, { useState, useMemo } from 'react';
import { SectionCard, CsvExportButton, fmt } from '../ui/Primitives';
import { ReciboAeyp } from './ReciboAeyp';
import { CfdiVisualizerModal, XmlViewerModal } from '../ui/Modals';
import { exportHonorarios } from '../../csvExport';

export function FacturasAeypSection({ data, honorarios, year }) {
  const [selectedCfdi, setSelectedCfdi] = useState(null);
  const [viewingXml, setViewingXml] = useState(null);

  const currentData = data || honorarios;

  if (!currentData || !currentData.detalle || currentData.detalle.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
        No se encontraron comprobantes PUE emitidos en el ejercicio {year || 'seleccionado'}.
      </div>
    );
  }

  const clientGroups = useMemo(() => {
    const groups = {};
    currentData.detalle.forEach(item => {
      const key = item.rfc || item.cliente;
      if (!groups[key]) {
        groups[key] = { nombre: item.cliente, rfc: key, recibos: [], subtotal: 0, iva: 0, isr_ret: 0, iva_ret: 0, total: 0 };
      } else if (item.cliente && item.cliente.length < groups[key].nombre.length) {
        groups[key].nombre = item.cliente;
      }

      groups[key].recibos.push(item);
      groups[key].subtotal += item.subtotal;
      groups[key].iva += item.iva;
      groups[key].isr_ret += item.isr_ret;
      groups[key].iva_ret += item.iva_ret;
      groups[key].total += item.total;
    });
    return Object.values(groups).sort((a, b) => b.recibos.length - a.recibos.length);
  }, [currentData.detalle]);

  return (
    <div className="flex flex-col gap-6 text-slate-800">
      <div className="flex justify-between items-center flex-wrap gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
            Ingresos Facturados • Ejercicio {year}
          </span>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Facturas Emitidas a Clientes ({currentData.detalle.length} comprobantes)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Comprobantes fiscales de ingresos emitidos por servicios profesionales agrupados por cliente.
          </p>
        </div>
        <CsvExportButton
          onClick={() => exportHonorarios(currentData.detalle, year)}
          label="Exportar Facturas (CSV)"
          count={currentData.detalle.length}
        />
      </div>

      {clientGroups.map((grp, i) => (
        <SectionCard
          key={`cli-${i}`}
          title={`Cliente: ${grp.nombre}`}
          badge={`${grp.recibos.length} facturas • Total: ${fmt(grp.subtotal)}`}
        >
          <div className="nomina-list-container">
            {grp.recibos.map((recibo, idx) => (
              <ReciboAeyp key={recibo.uuid || idx} recibo={recibo} onViewCfdi={setSelectedCfdi} onViewXml={setViewingXml} />
            ))}
          </div>
        </SectionCard>
      ))}

      {selectedCfdi && <CfdiVisualizerModal cfdi={selectedCfdi} onClose={() => setSelectedCfdi(null)} />}
      {viewingXml && <XmlViewerModal data={viewingXml} onClose={() => setViewingXml(null)} />}
    </div>
  );
}
