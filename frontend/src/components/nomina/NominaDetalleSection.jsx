'use client';

import React, { useState } from 'react';
import { SectionCard, CsvExportButton } from '../ui/Primitives';
import { ReciboNomina } from './ReciboNomina';
import { CfdiVisualizerModal, XmlViewerModal } from '../ui/Modals';
import { exportNomina } from '../../csvExport';

export const NominaDetalleSection = ({ data, sueldos, year }) => {
  const [selectedCfdi, setSelectedCfdi] = useState(null);
  const [viewingXml, setViewingXml] = useState(null);

  const currentData = data || sueldos;

  if (!currentData || !currentData.detalle || currentData.detalle.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
        No se encontraron comprobantes de nómina timbrados para el ejercicio {year || 'seleccionado'}.
      </div>
    );
  }

  const totalRecibos = currentData.detalle.reduce((s, e) => s + (e.recibos?.length || 0), 0);

  return (
    <div className="flex flex-col gap-6 text-slate-800">
      <div className="flex justify-between items-center flex-wrap gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
            Recibos Timbrados • Ejercicio {year}
          </span>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Detalle de Recibos de Nómina ({totalRecibos} comprobantes)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Comprobantes de nómina timbrados por tus patrones con desglose de percepciones y deducciones.
          </p>
        </div>
        <CsvExportButton
          onClick={() => exportNomina(currentData.detalle, year)}
          label="Exportar Recibos (CSV)"
          count={totalRecibos}
        />
      </div>

      {currentData.detalle.map((emp, i) => (
        <SectionCard
          key={`emp-${i}`}
          title={`Nómina: ${emp.nombre}`}
          badge={`${emp.recibos?.length || 0} recibos`}
        >
          <div className="nomina-list-container">
            {emp.recibos && emp.recibos.length > 0 ? (
              emp.recibos.map((recibo, idx) => (
                <ReciboNomina key={recibo.uuid || idx} recibo={recibo} onViewCfdi={setSelectedCfdi} onViewXml={setViewingXml} />
              ))
            ) : (
              <div className="p-4 text-center text-slate-400 text-xs italic">
                No hay recibos individuales procesados para este retenedor.
              </div>
            )}
          </div>
        </SectionCard>
      ))}

      {selectedCfdi && <CfdiVisualizerModal cfdi={selectedCfdi} onClose={() => setSelectedCfdi(null)} />}
      {viewingXml && <XmlViewerModal data={viewingXml} onClose={() => setViewingXml(null)} />}
    </div>
  );
};
