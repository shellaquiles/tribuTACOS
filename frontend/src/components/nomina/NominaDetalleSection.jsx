import React, { useState } from 'react';
import { SectionCard, CsvExportButton } from '../ui/Primitives';
import { ReciboNomina } from './ReciboNomina';
import { CfdiVisualizerModal, XmlViewerModal } from '../ui/Modals';
import { exportNomina } from '../../csvExport';

export const NominaDetalleSection = ({ data, year }) => {
  const [selectedCfdi, setSelectedCfdi] = useState(null);
  const [viewingXml, setViewingXml] = useState(null);

  if (!data || !data.detalle || data.detalle.length === 0) return (
     <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
        No se encontraron comprobantes de nómina en este ejercicio.
     </div>
  );

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'white', padding: '1.25rem 1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🧾</span> Detalle de Recibos de Nómina ({year})
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              Radiografía de todos los comprobantes timbrados por tus patrones con desglose de percepciones y deducciones.
            </p>
          </div>
          <CsvExportButton
            onClick={() => exportNomina(data.detalle, year)}
            label="Exportar Recibos (CSV)"
            count={data.detalle.reduce((s, e) => s + (e.recibos?.length || 0), 0)}
          />
        </div>

        {data.detalle.map((emp, i) => (
          <SectionCard
             key={`emp-${i}`}
             icon="👨‍💼"
             title={`Nómina: ${emp.nombre}`}
             badge={`${emp.recibos?.length || 0} recibos encontrados`}
          >
            <p className="sec-note">
              Visualización detallada de los recibos de nómina timbrados por tu empleador a lo largo del año.
            </p>

            <div className="nomina-list-container">
              {emp.recibos && emp.recibos.length > 0 ? (
                 emp.recibos.map((recibo, idx) => (
                    <ReciboNomina key={recibo.uuid || idx} recibo={recibo} onViewCfdi={setSelectedCfdi} onViewXml={setViewingXml} />
                 ))
              ) : (
                 <div style={{ padding: '1rem', textAlign: 'center', fontStyle: 'italic', color: '#94a3b8' }}>
                   No hay recibos individuales procesados para este retenedor.
                 </div>
              )}
            </div>
          </SectionCard>
        ))}
      </div>

      {selectedCfdi && <CfdiVisualizerModal cfdi={selectedCfdi} onClose={() => setSelectedCfdi(null)} />}
      {viewingXml && <XmlViewerModal data={viewingXml} onClose={() => setViewingXml(null)} />}
    </>
  );
};
