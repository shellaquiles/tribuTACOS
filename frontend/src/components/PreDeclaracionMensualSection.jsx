import React, { useState } from 'react';

const formatMoney = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '$0.00';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
};

export default function PreDeclaracionMensualSection({ data, year, onSelectMonth }) {
  const [selectedMonthModal, setSelectedMonthModal] = useState(null);

  if (!data) return null;

  const meses = data.simulacion_provisional_mensual || [];
  const totalIngresos = meses.reduce((s, m) => s + (m.ingresos_periodo || 0), 0);
  const totalGastosDed = meses.reduce((s, m) => s + (m.deducciones_bancarizadas_periodo || 0), 0);
  const totalGastosNoDed = meses.reduce((s, m) => s + (m.deducciones_no_deducibles_efectivo || 0), 0);
  const totalIsrCargo = meses.reduce((s, m) => s + (m.isr_a_cargo_mes || 0), 0);
  const totalIvaCobrado = meses.reduce((s, m) => s + (m.iva_cobrado_16 || 0), 0);
  const totalIvaAcred = meses.reduce((s, m) => s + (m.iva_acreditable_gastos || 0), 0);
  const totalIvaCargo = meses.reduce((s, m) => s + (m.iva_a_cargo_mes || 0), 0);
  const totalAPagarAnual = meses.reduce((s, m) => s + (m.total_a_pagar_mes || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* ── HEADER Y EXPLICACIÓN FISCAL ── */}
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.5rem' }}>📅</span>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#0f172a' }}>
                Simulador de Pagos Provisionales Mensuales • Ejercicio {year}
              </h2>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              Cálculo acumulativo automático de <b>ISR (Art. 106 LISR)</b> e <b>IVA definitivo (Art. 5 LIVA)</b> derivado al 100% de tus CFDIs en disco.
            </p>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '12px', textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Total Pagos Provisionales:</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: totalAPagarAnual > 0 ? '#dc2626' : '#059669', fontFamily: 'monospace' }}>
              {formatMoney(totalAPagarAnual)}
            </div>
          </div>
        </div>
      </div>

      {/* ── 4 KPIS EJECUTIVOS DE PROVISIONALES ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div style={{ background: 'white', borderRadius: '16px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Ingresos Facturados (Honorarios)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1d4ed8', marginTop: '4px', fontFamily: 'monospace' }}>
            {formatMoney(totalIngresos)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>IVA Cobrado: {formatMoney(totalIvaCobrado)}</div>
        </div>

        <div style={{ background: 'white', borderRadius: '16px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Gastos Deducibles Bancarizados</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#059669', marginTop: '4px', fontFamily: 'monospace' }}>
            {formatMoney(totalGastosDed)}
          </div>
          <div style={{ fontSize: '0.75rem', color: totalGastosNoDed > 0 ? '#dc2626' : '#64748b', marginTop: '4px' }}>
            {totalGastosNoDed > 0 ? `⚠️ ${formatMoney(totalGastosNoDed)} no deducible (efectivo)` : '✓ 100% Bancarizado'}
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '16px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>ISR Provisional a Pagar</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: totalIsrCargo > 0 ? '#dc2626' : '#059669', marginTop: '4px', fontFamily: 'monospace' }}>
            {formatMoney(totalIsrCargo)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>Acumulable para la Declaración Anual</div>
        </div>

        <div style={{ background: 'white', borderRadius: '16px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>IVA Definitivo a Pagar</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: totalIvaCargo > 0 ? '#dc2626' : '#059669', marginTop: '4px', fontFamily: 'monospace' }}>
            {formatMoney(totalIvaCargo)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>IVA Acreditable: {formatMoney(totalIvaAcred)}</div>
        </div>
      </div>

      {/* ── TABLA MATRIZ DE PRE-DECLARACIÓN MENSUAL (12 MESES) ── */}
      <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
              📊 Matriz de Pre-Declaración Mensual (12 Meses)
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              Haz clic en "Ver Borrador SAT" para obtener el desglose espejo listo para ingresar al portal del SAT.
            </p>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '12px 16px' }}>Mes</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Ingreso Facturado</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Gasto Deducible</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Flujo / Utilidad</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>ISR Retenido</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>ISR a Pagar</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>IVA Cobrado (16%)</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>IVA Acreditable</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>IVA a Pagar</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Total Impuestos</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Borrador SAT</th>
              </tr>
            </thead>
            <tbody>
              {meses.map((m) => {
                const totalMes = m.total_a_pagar_mes || 0;
                const ing = m.ingresos_periodo || 0;
                const ded = m.deducciones_bancarizadas_periodo || 0;
                const utilidadMes = ing - ded;
                const esMesMalo = ing > 0 && utilidadMes < 0;
                const esMesSinIngreso = ing === 0 && ded > 0;
                const tieneActividad = ing > 0 || ded > 0;

                const rowBg = (esMesMalo || esMesSinIngreso) 
                  ? '#fff1f2' 
                  : (totalMes > 0 ? '#fffafa' : (tieneActividad ? 'white' : '#f8fafc'));

                return (
                  <tr
                    key={m.mes_numero}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      background: rowBg,
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <td style={{ padding: '12px 16px', fontWeight: 800, color: '#0f172a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{esMesMalo || esMesSinIngreso ? '🔴' : (ing > 40000 ? '🟢' : '🔵')}</span>
                        <span>{m.mes_numero.toString().padStart(2, '0')}. {m.mes_nombre}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: ing > 0 ? '#0f172a' : '#94a3b8' }}>
                      {formatMoney(ing)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', color: ded > 0 ? '#dc2626' : '#94a3b8' }}>
                      {formatMoney(ded)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 800 }}>
                      {utilidadMes < 0 ? (
                        <span style={{
                          background: '#fee2e2',
                          color: '#b91c1c',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          border: '1px solid #fca5a5',
                          fontSize: '0.75rem'
                        }}>
                          Déficit: -{formatMoney(Math.abs(utilidadMes))}
                        </span>
                      ) : (
                        <span style={{
                          background: ing > 0 ? '#dcfce7' : 'transparent',
                          color: ing > 0 ? '#15803d' : '#94a3b8',
                          padding: ing > 0 ? '3px 8px' : '0',
                          borderRadius: '6px',
                          border: ing > 0 ? '1px solid #86efac' : 'none',
                          fontSize: '0.75rem'
                        }}>
                          {ing > 0 ? `+${formatMoney(utilidadMes)}` : '$0.00'}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', color: m.isr_retenido_periodo > 0 ? '#059669' : '#94a3b8' }}>
                      {m.isr_retenido_periodo > 0 ? `-${formatMoney(m.isr_retenido_periodo)}` : '$0.00'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: m.isr_a_cargo_mes > 0 ? '#dc2626' : '#94a3b8' }}>
                      {formatMoney(m.isr_a_cargo_mes)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', color: m.iva_cobrado_16 > 0 ? '#1d4ed8' : '#94a3b8' }}>
                      {formatMoney(m.iva_cobrado_16)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', color: m.iva_acreditable_gastos > 0 ? '#059669' : '#94a3b8' }}>
                      {m.iva_acreditable_gastos > 0 ? `-${formatMoney(m.iva_acreditable_gastos)}` : '$0.00'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: m.iva_a_cargo_mes > 0 ? '#dc2626' : '#94a3b8' }}>
                      {formatMoney(m.iva_a_cargo_mes)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      {totalMes > 0 ? (
                        <span style={{
                          background: '#fef2f2',
                          color: '#dc2626',
                          border: '1px solid #fecaca',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontWeight: 900,
                          fontSize: '0.8rem',
                          fontFamily: 'monospace'
                        }}>
                          🔴 Pagar: {formatMoney(totalMes)}
                        </span>
                      ) : (
                        <span style={{
                          background: utilidadMes < 0 ? '#fff1f2' : '#f0fdf4',
                          color: utilidadMes < 0 ? '#991b1b' : '#166534',
                          border: utilidadMes < 0 ? '1px solid #fecdd3' : '1px solid #bbf7d0',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontWeight: 800,
                          fontSize: '0.75rem'
                        }}>
                          {utilidadMes < 0 ? '⚠️ Saldo a Favor' : '🟢 $0.00 (Sin Pago)'}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button
                        onClick={() => setSelectedMonthModal(m)}
                        style={{
                          background: '#eff6ff',
                          border: '1px solid #bfdbfe',
                          color: '#1d4ed8',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          padding: '4px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        📋 Borrador SAT
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0', fontWeight: 900, color: '#0f172a' }}>
                <td style={{ padding: '14px 16px' }}>TOTAL ANUAL</td>
                <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace' }}>{formatMoney(totalIngresos)}</td>
                <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace', color: '#059669' }}>{formatMoney(totalGastosDed)}</td>
                <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace', color: '#059669' }}>-{formatMoney(meses.reduce((s, m) => s + (m.isr_retenido_periodo || 0), 0))}</td>
                <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace', color: totalIsrCargo > 0 ? '#dc2626' : '#059669' }}>{formatMoney(totalIsrCargo)}</td>
                <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace', color: '#1d4ed8' }}>{formatMoney(totalIvaCobrado)}</td>
                <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace', color: '#059669' }}>-{formatMoney(totalIvaAcred)}</td>
                <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace', color: totalIvaCargo > 0 ? '#dc2626' : '#059669' }}>{formatMoney(totalIvaCargo)}</td>
                <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace', color: totalAPagarAnual > 0 ? '#dc2626' : '#059669' }}>
                  {formatMoney(totalAPagarAnual)}
                </td>
                <td style={{ padding: '14px 16px' }}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── MODAL BORRADOR ESPEJO SAT (LISTO PARA COPIAR) ── */}
      {selectedMonthModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '24px',
            maxWidth: '850px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header del Modal */}
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', color: 'white', borderTopLeftRadius: '24px', borderTopRightRadius: '24px' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800 }}>
                  BORRADOR DE PRE-DECLARACIÓN PROVISIONAL • FORMATO OFICIAL SAT
                </div>
                <h2 style={{ margin: '4px 0 0 0', fontSize: '1.35rem', fontWeight: 900 }}>
                  {selectedMonthModal.mes_nombre} {year}
                </h2>
              </div>
              <button
                onClick={() => setSelectedMonthModal(null)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 800 }}
              >
                ✕
              </button>
            </div>

            {/* Contenido del Formulario Espejo */}
            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              
              {/* Sección R122: ISR */}
              <div>
                <h4 style={{ margin: '0 0 0.75rem 0', color: '#1e40af', fontSize: '0.95rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🟦</span> DETERMINACIÓN DEL IMPUESTO SOBRE LA RENTA (ISR R122)
                </h4>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', fontSize: '0.85rem' }}>
                  {[
                    ['Ingresos del Periodo', selectedMonthModal.ingresos_periodo],
                    ['Total de Ingresos Acumulables', selectedMonthModal.ingresos_acumulados],
                    ['Compras y Gastos del Periodo (Deducibles)', selectedMonthModal.deducciones_bancarizadas_periodo],
                    ['Total de Deducciones Autorizadas Acumuladas', selectedMonthModal.deducciones_bancarizadas_acumuladas],
                    ['Base Gravable del Pago Provisional', selectedMonthModal.base_gravable_provisional],
                    ['ISR Causado Acumulado', selectedMonthModal.isr_causado_acumulado],
                    ['Total Impuesto Retenido Acumulado', selectedMonthModal.isr_retenido_acumulado],
                    ['ISR a Cargo del Mes', selectedMonthModal.isr_a_cargo_mes]
                  ].map(([label, val], idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', background: idx % 2 === 0 ? 'white' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ color: '#475569' }}>{label}</span>
                      <b style={{ fontFamily: 'monospace', color: (val || 0) > 0 ? '#0f172a' : '#94a3b8' }}>
                        {formatMoney(val || 0)}
                      </b>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sección R21: IVA */}
              <div>
                <h4 style={{ margin: '0 0 0.75rem 0', color: '#065f46', fontSize: '0.95rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🟩</span> DETERMINACIÓN DEL IMPUESTO AL VALOR AGREGADO (IVA R21)
                </h4>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', fontSize: '0.85rem' }}>
                  {[
                    ['Actividades Gravadas a la Tasa del 16%', selectedMonthModal.ingresos_periodo],
                    ['IVA Cobrado del Periodo (16%)', selectedMonthModal.iva_cobrado_16],
                    ['IVA Acreditable del Periodo (Gastos)', selectedMonthModal.iva_acreditable_gastos],
                    ['IVA Retenido por Terceros', selectedMonthModal.iva_retenido],
                    ['Acreditamiento de Saldo a Favor de Meses Anteriores (Art. 6 LIVA)', selectedMonthModal.iva_a_favor_acreditado_periodos_ant],
                    ['IVA a Cargo del Mes', selectedMonthModal.iva_a_cargo_mes],
                    ['IVA a Favor del Mes (Generado)', selectedMonthModal.iva_a_favor_mes],
                    ['Remanente de IVA a Favor Acumulado (para meses futuros)', selectedMonthModal.iva_a_favor_remanente_acumulado]
                  ].map(([label, val], idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', background: idx % 2 === 0 ? 'white' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ color: '#475569' }}>{label}</span>
                      <b style={{ fontFamily: 'monospace', color: (val || 0) > 0 ? '#0f172a' : '#94a3b8' }}>
                        {formatMoney(val || 0)}
                      </b>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resumen Total Pagado */}
              <div style={{ background: '#0f172a', color: 'white', padding: '1.25rem 1.5rem', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>CANTIDAD TOTAL A PAGAR CALCULADA:</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: (selectedMonthModal.total_a_pagar_mes || 0) > 0 ? '#f87171' : '#34d399' }}>
                    {formatMoney(selectedMonthModal.total_a_pagar_mes || 0)}
                  </div>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                  Borrador generado por <b>tributacos 🌮</b>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
