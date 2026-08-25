import React, { useState, useMemo } from 'react';
import { SectionCard, CsvExportButton, fmt } from '../ui/Primitives';
import { ReciboAeyp } from './ReciboAeyp';
import { CfdiVisualizerModal, XmlViewerModal } from '../ui/Modals';
import { exportHonorarios } from '../../csvExport';

export function FacturasAeypSection({ data, year }) {
  const [selectedCfdi, setSelectedCfdi] = useState(null);
  const [viewingXml, setViewingXml] = useState(null);

  if (!data || !data.detalle || data.detalle.length === 0) return (
     <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
        No se encontraron comprobantes PUE emitidos en este ejercicio.
     </div>
  );

  const clientGroups = useMemo(() => {
    const groups = {};
    data.detalle.forEach(item => {
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
  }, [data.detalle]);

  const totalSubtotal = data.detalle.reduce((acc, curr) => acc + curr.subtotal, 0);
  const totalIva = data.detalle.reduce((acc, curr) => acc + curr.iva, 0);
  const totalIsrRet = data.detalle.reduce((acc, curr) => acc + curr.isr_ret, 0);
  const totalIvaRet = data.detalle.reduce((acc, curr) => acc + curr.iva_ret, 0);
  const granTotalNeto = data.detalle.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'white', padding: '1.25rem 1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📄</span> Facturas Emitidas a Clientes ({year})
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              Comprobantes fiscales de ingresos emitidos por servicios profesionales agrupados por cliente.
            </p>
          </div>
          <CsvExportButton
            onClick={() => exportHonorarios(data.detalle, year)}
            label="Exportar Facturas (CSV)"
            count={data.detalle.length}
          />
        </div>

        {clientGroups.map((grp, i) => (
          <SectionCard
             key={`cli-${i}`}
             icon="🏢"
             title={`Cliente: ${grp.nombre}`}
             badge={`${grp.recibos?.length || 0} facturas | Total Neto: ${fmt(grp.total)}`}
          >
            <p className="sec-note">
              Total facturado a este cliente: <strong>Subtotal {fmt(grp.subtotal)}</strong> + <strong>IVA {fmt(grp.iva)}</strong> = <strong>Efectivo Bruto {fmt(grp.subtotal + grp.iva)}</strong>.
            </p>

            <div className="nomina-list-container">
               {grp.recibos.map((recibo, idx) => (
                  <ReciboAeyp key={idx} recibo={recibo} onViewCfdi={setSelectedCfdi} onViewXml={setViewingXml} />
               ))}

               {/* Fila de Totales por Cliente */}
               <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '1.5rem', background: '#f8fafc', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-color)', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
                  <span>Total Acumulado Cliente:</span>
                  <span style={{ color: 'var(--blue)' }}>Base: {fmt(grp.subtotal)}</span>
                  <span>IVA: {fmt(grp.iva)}</span>
                  <span style={{ color: 'var(--red)' }}>Retenciones: {fmt((grp.isr_ret || 0) + (grp.iva_ret || 0))}</span>
                  <span>Neto: {fmt(grp.total)}</span>
               </div>
            </div>
          </SectionCard>
        ))}
      </div>

      <div className="data-table" style={{ marginTop: '2rem', padding: '1.5rem', background: 'white', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
         <span style={{ color: 'var(--text-color)' }}>Gran Total Acumulado ({data.detalle.length} facturas)</span>
         <span style={{ color: 'var(--blue)' }}>Subtotal: {fmt(totalSubtotal)}</span>
         <span style={{ color: 'var(--text-2)' }}>IVA: {fmt(totalIva)}</span>
         <span style={{ color: 'var(--red)' }}>Retenciones: {fmt(totalIsrRet + totalIvaRet)}</span>
         <span style={{ color: 'var(--green)' }}>Total Neto: {fmt(granTotalNeto)}</span>
      </div>

      {selectedCfdi && <CfdiVisualizerModal cfdi={selectedCfdi} onClose={() => setSelectedCfdi(null)} />}
      {viewingXml && <XmlViewerModal data={viewingXml} onClose={() => setViewingXml(null)} />}
    </>
  );
}
