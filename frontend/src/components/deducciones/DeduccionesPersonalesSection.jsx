import React, { useState } from 'react';
import { SectionCard, CsvExportButton, fmt } from '../ui/Primitives';
import { CfdiVisualizerModal, XmlViewerModal } from '../ui/Modals';
import { exportDeduccionesPersonales } from '../../csvExport';

export const DeduccionesPersonalesSection = ({ data, year }) => {
  const [activeSubTab, setActiveSubTab] = useState('validas');
  const [selectedCfdi, setSelectedCfdi] = useState(null);
  const [viewingXml, setViewingXml] = useState(null);

  if (!data) return null;

  const tope = data.tope || {
    limite_15_pct: 0,
    limite_5_umas: 198031.8,
    tope_aplicable: 198031.8,
    monto_aplicado: 0,
    remanente_disponible: 198031.8,
    porcentaje_aprovechado: 0
  };

  const validas = data.detalle || [];
  const observadas = data.observadas || [];
  const posibles = data.posibles_no_clasificadas || [];

  const CAT_DEDUCCIONES_INFO = [
    { code: 'D01', name: 'Honorarios médicos, dentales y hospitalarios', icon: '🏥', desc: 'Consultas médicas, dentistas, psicólogos y nutriólogos titulados' },
    { code: 'D02', name: 'Gastos médicos por incapacidad / ópticos', icon: '👓', desc: 'Lentes graduados (hasta $2,500) y aparatos de rehabilitación' },
    { code: 'D03', name: 'Gastos funerales', icon: '⚰️', desc: 'Gastos de sepelio para cónyuge, padres, abuelos o hijos' },
    { code: 'D04', name: 'Donativos no onerosos', icon: '🎗️', desc: 'Donaciones a donatarias autorizadas por el SAT (tope 7% ingresos)' },
    { code: 'D05', name: 'Intereses reales crédito hipotecario', icon: '🏠', desc: 'Intereses reales pagados en créditos Infonavit, Fovissste o bancarios' },
    { code: 'D06', name: 'Aportaciones voluntarias al SAR / Afore', icon: '🎓', desc: 'Aportaciones para el retiro (tope 10% ingresos o 5 UMAs)' },
    { code: 'D07', name: 'Primas por seguros de gastos médicos', icon: '💊', desc: 'Pólizas de seguro médico para ti o familiares directos' },
    { code: 'D08', name: 'Gastos de transportación escolar obligatoria', icon: '🚌', desc: 'Transporte escolar obligatorio para hijos' },
    { code: 'D09', name: 'Cuentas especiales para el ahorro', icon: '🏦', desc: 'Planes de ahorro a largo plazo (hasta $152,000 anuales)' },
    { code: 'D10', name: 'Colegiaturas', icon: '🏫', desc: 'Preescolar a Bachillerato con topes específicos por nivel escolar' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* ── 1. TERMÓMETRO DEL TOPE LEGAL DEL SAT (Art. 151 LISR) ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: '20px',
        padding: '2rem',
        color: 'white',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', fontSize: '10rem', opacity: 0.05, pointerEvents: 'none' }}>
          🏥
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              <span>⚖️ Art. 151 LISR</span>
              <span>•</span>
              <span>Tope Anual SAT {year}</span>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.02em', color: 'white' }}>
              Control de Deducciones Personales
            </h3>
            <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: '#94a3b8', maxWidth: '600px' }}>
              Reduce directamente tu base gravable anual. El límite del SAT es el menor entre el <strong>15% de tus ingresos totales</strong> y <strong>5 UMAs anuales ({fmt(tope.limite_5_umas)})</strong>.
            </p>
          </div>

          {validas.length > 0 && (
            <CsvExportButton
              onClick={() => exportDeduccionesPersonales(validas, year)}
              label="Exportar Deducciones"
              count={validas.length}
            />
          )}
        </div>

        {/* KPIs de Aprovechamiento */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '14px', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monto Deducible Aplicado</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#34d399', lineHeight: 1.2, marginTop: '4px' }}>
              {fmt(data.total)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#a7f3d0', marginTop: '4px' }}>
              {validas.length} comprobante(s) válido(s)
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '14px', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tope Legal Máximo SAT</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#60a5fa', lineHeight: 1.2, marginTop: '4px' }}>
              {fmt(tope.tope_aplicable)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#93c5fd', marginTop: '4px' }}>
              5 UMAs: {fmt(tope.limite_5_umas)}
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '14px', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Espacio Fiscal Disponible</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fbbf24', lineHeight: 1.2, marginTop: '4px' }}>
              {fmt(tope.remanente_disponible)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#fde68a', marginTop: '4px' }}>
              Margen aún deducible
            </div>
          </div>
        </div>

        {/* Barra de Progreso */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
            <span style={{ color: '#cbd5e1' }}>Aprovechamiento del Tope Anual</span>
            <span style={{ color: '#34d399' }}>{tope.porcentaje_aprovechado}% utilizado</span>
          </div>
          <div style={{ height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, Math.max(0, tope.porcentaje_aprovechado))}%`,
              background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)',
              borderRadius: '6px',
              transition: 'width 0.8s ease'
            }} />
          </div>
        </div>
      </div>

      {/* ── 2. CATÁLOGO VISUAL DE RUBROS DEDUCIBLES ── */}
      <SectionCard icon="🗂️" title="Desglose por Tipo de Deducción Personal" badge={`${validas.length} comprobantes`}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
          {CAT_DEDUCCIONES_INFO.map(cat => {
            const monto = data.por_uso?.[cat.code] || 0;
            const hasData = monto > 0;
            return (
              <div
                key={cat.code}
                style={{
                  background: hasData ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' : '#f8fafc',
                  border: `1.5px solid ${hasData ? '#86efac' : '#e2e8f0'}`,
                  borderRadius: '14px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  boxShadow: hasData ? '0 4px 10px rgba(16, 185, 129, 0.08)' : 'none'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '1.5rem' }}>{cat.icon}</span>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '12px',
                      background: hasData ? '#10b981' : '#cbd5e1', color: '#ffffff'
                    }}>
                      {cat.code}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: hasData ? '#065f46' : '#334155', lineHeight: 1.3 }}>
                    {cat.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px', lineHeight: 1.3 }}>
                    {cat.desc}
                  </div>
                </div>

                <div style={{ borderTop: `1px solid ${hasData ? 'rgba(16,185,129,0.2)' : '#e2e8f0'}`, paddingTop: '8px', marginTop: '4px' }}>
                  <div style={{ fontSize: '1.15rem', fontWeight: 900, color: hasData ? '#047857' : '#94a3b8' }}>
                    {hasData ? fmt(monto) : '$0'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* ── 3. EXPLORADOR DE COMPROBANTES Y SEMÁFORO FISCAL ── */}
      <SectionCard icon="🧾" title="Comprobantes y Validación Fiscal">
        {/* Selector de Pestañas */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveSubTab('validas')}
            style={{
              padding: '0.6rem 1.2rem', borderRadius: '10px', cursor: 'pointer', border: 'none',
              background: activeSubTab === 'validas' ? 'linear-gradient(135deg, #10b981, #059669)' : '#f1f5f9',
              color: activeSubTab === 'validas' ? 'white' : '#475569',
              fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: activeSubTab === 'validas' ? '0 4px 10px rgba(16, 185, 129, 0.3)' : 'none'
            }}
          >
            <span>✅ Válidas y Deducibles</span>
            <span style={{ background: 'rgba(255,255,255,0.25)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>
              {validas.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('observadas')}
            style={{
              padding: '0.6rem 1.2rem', borderRadius: '10px', cursor: 'pointer', border: 'none',
              background: activeSubTab === 'observadas' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : '#f1f5f9',
              color: activeSubTab === 'observadas' ? 'white' : '#475569',
              fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: activeSubTab === 'observadas' ? '0 4px 10px rgba(245, 158, 11, 0.3)' : 'none'
            }}
          >
            <span>⚠️ Observadas / En Riesgo SAT</span>
            <span style={{ background: 'rgba(255,255,255,0.25)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>
              {observadas.length}
            </span>
          </button>

          {posibles.length > 0 && (
            <button
              onClick={() => setActiveSubTab('posibles')}
              style={{
                padding: '0.6rem 1.2rem', borderRadius: '10px', cursor: 'pointer', border: 'none',
                background: activeSubTab === 'posibles' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : '#f1f5f9',
                color: activeSubTab === 'posibles' ? 'white' : '#475569',
                fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px',
                boxShadow: activeSubTab === 'posibles' ? '0 4px 10px rgba(59, 130, 246, 0.3)' : 'none'
              }}
            >
              <span>💡 Salud con Uso General (G03)</span>
              <span style={{ background: 'rgba(255,255,255,0.25)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>
                {posibles.length}
              </span>
            </button>
          )}
        </div>

        {/* Tab 1: Válidas */}
        {activeSubTab === 'validas' && (
          <div>
            {validas.length > 0 ? (
              <div className="table-responsive">
                <table className="sat-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Emisor / Proveedor</th>
                      <th>Rubro Deducible</th>
                      <th>Forma de Pago</th>
                      <th>UUID / Acciones</th>
                      <th className="text-right">Monto Deducible</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validas.map((cfdi, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600, color: '#334155' }}>{cfdi.fecha}</td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{cfdi.emisor}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{cfdi.rfc_emisor}</div>
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#ecfdf5', color: '#065f46', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid #a7f3d0' }}>
                            <span>{cfdi.uso_icon || '🏥'}</span>
                            <span>{cfdi.uso_cfdi} - {cfdi.uso_nombre}</span>
                          </span>
                        </td>
                        <td>
                          <span style={{ background: '#f1f5f9', color: '#334155', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                            {cfdi.forma_pago === '03' ? '03 Transferencia' : cfdi.forma_pago === '04' ? '04 Tarjeta Crédito' : cfdi.forma_pago === '28' ? '28 Tarjeta Débito' : `Forma ${cfdi.forma_pago}`}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              onClick={() => setSelectedCfdi(cfdi.raw_cfdi)}
                              style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 700 }}
                            >
                              {cfdi.uuid?.slice(0, 8)}...
                            </button>
                            <button
                              onClick={() => setSelectedCfdi(cfdi.raw_cfdi)}
                              style={{ background: 'none', border: '1px solid #cbd5e1', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', color: '#475569', cursor: 'pointer' }}
                              title="Ver JSON estructurado"
                            >
                              💻
                            </button>
                            {cfdi.raw_cfdi?.filename && (
                              <button
                                onClick={() => window.open(`http://${window.location.hostname}:8010/api/download_xml?filename=${cfdi.raw_cfdi.filename}`, '_blank')}
                                style={{ background: 'none', border: '1px solid #cbd5e1', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', color: '#475569', cursor: 'pointer' }}
                                title="Descargar XML original"
                              >
                                ⬇️ XML
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="text-right font-medium" style={{ fontSize: '0.95rem', color: '#047857', fontWeight: 800 }}>
                          {fmt(cfdi.monto)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                      <td colSpan="5">TOTAL DEDUCCIONES VÁLIDAS</td>
                      <td className="text-right" style={{ color: '#047857', fontSize: '1.05rem', fontWeight: 900 }}>
                        {fmt(data.total_valido_bruto || data.total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div style={{
                background: '#f8fafc', borderRadius: '16px', padding: '3rem 2rem', textAlign: 'center',
                border: '1.5px dashed #cbd5e1', color: '#64748b'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🏥✨</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>
                  No se encontraron comprobantes de deducciones personales en el ejercicio {year}
                </div>
                <p style={{ maxWidth: '520px', margin: '8px auto 16px auto', fontSize: '0.85rem' }}>
                  Si tuviste gastos médicos, dentales, hospitalarios, colegiaturas o seguros, asegúrate de pedir las facturas con <strong>Uso CFDI D01 a D10</strong> y pagar siempre con tarjeta, transferencia o cheque.
                </p>
                <div style={{
                  display: 'inline-flex', gap: '8px', background: '#eff6ff', color: '#1d4ed8',
                  padding: '8px 16px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700
                }}>
                  💡 Recuerda: Puedes deducir hasta {fmt(tope.tope_aplicable)} este año para obtener saldo a favor.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Observadas / En Riesgo */}
        {activeSubTab === 'observadas' && (
          <div>
            {observadas.length > 0 ? (
              <div>
                <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', color: '#92400e', padding: '1rem', borderRadius: '10px', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
                  <strong>⚠️ ¿Por qué están observadas?</strong> El SAT rechaza automáticamente deducciones personales si fueron pagadas en efectivo (Forma 01), si se dejaron "Por definir" (99) sin complemento, o si son medicamentos de farmacia comercial no hospitalaria.
                </div>
                <div className="table-responsive">
                  <table className="sat-table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Emisor / Proveedor</th>
                        <th>Uso Reportado</th>
                        <th>Forma de Pago</th>
                        <th>Motivo de Observación SAT</th>
                        <th className="text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {observadas.map((cfdi, idx) => (
                        <tr key={idx} style={{ background: '#fffbeb' }}>
                          <td>{cfdi.fecha}</td>
                          <td>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{cfdi.emisor}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{cfdi.rfc_emisor}</div>
                          </td>
                          <td><span className="sat-badge sat-badge-blue">{cfdi.uso_cfdi}</span></td>
                          <td>
                            <span style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                              Forma {cfdi.forma_pago}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.78rem', color: '#b45309', maxWidth: '300px' }}>
                            {(cfdi.motivos_rechazo || []).map((m, mi) => (
                              <div key={mi} style={{ marginBottom: '2px' }}>• {m}</div>
                            ))}
                          </td>
                          <td className="text-right font-medium" style={{ color: '#b45309', fontWeight: 700 }}>
                            {fmt(cfdi.monto)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#16a34a', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #86efac' }}>
                ✅ No tienes comprobantes observados ni en riesgo de rechazo para el ejercicio {year}.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Posibles no clasificadas */}
        {activeSubTab === 'posibles' && (
          <div>
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', padding: '1rem', borderRadius: '10px', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
              <strong>💡 Oportunidad Fiscal:</strong> Detectamos comprobantes relacionados con salud o laboratorios que tu proveedor emitió con Uso General (G03). Podrías solicitar refacturación con uso D01/D02 para que el SAT los reconozca como deducción personal en tu declaración anual.
            </div>
            <div className="table-responsive">
              <table className="sat-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Proveedor / Emisor</th>
                    <th>Uso Actual</th>
                    <th>Conceptos Facturados</th>
                    <th className="text-right">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {posibles.map((cfdi, idx) => (
                    <tr key={idx}>
                      <td>{cfdi.fecha}</td>
                      <td style={{ fontWeight: 700 }}>{cfdi.emisor}</td>
                      <td><span className="sat-badge" style={{ background: '#e2e8f0', color: '#334155' }}>{cfdi.uso_cfdi}</span></td>
                      <td style={{ fontSize: '0.78rem', color: '#475569' }}>
                        {(cfdi.conceptos || []).map(c => c.desc).join(' • ')}
                      </td>
                      <td className="text-right font-medium">{fmt(cfdi.monto)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Modales */}
      {selectedCfdi && <CfdiVisualizerModal cfdi={selectedCfdi} onClose={() => setSelectedCfdi(null)} />}
      {viewingXml && <XmlViewerModal data={viewingXml} onClose={() => setViewingXml(null)} />}
    </div>
  );
};
