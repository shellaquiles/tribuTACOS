import React, { useState, useEffect } from 'react';
import axios from 'axios';

const formatMoney = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '$0.00';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
};

export default function ConciliacionSatSection({ year, onYearChange }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('tabla'); // 'tabla' o 'tarjetas'
  const [selectedMonthModal, setSelectedMonthModal] = useState(null);

  useEffect(() => {
    fetchSatDocs();
  }, [year]);

  const fetchSatDocs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`http://localhost:8010/api/sat_docs/summary?year=${year}`);
      setData(res.data);
    } catch (err) {
      console.error("Error fetching SAT docs:", err);
      setError("No se pudieron cargar los documentos oficiales del SAT.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', gap: '1rem' }}>
        <div style={{ fontSize: '3rem', animation: 'bounce 1s infinite' }}>🏛️</div>
        <div className="spinner" />
        <p style={{ color: '#64748b', fontWeight: 600, margin: 0 }}>
          Consultando declaraciones de ISR e IVA oficiales del SAT para el ejercicio {year}…
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '1.5rem', borderRadius: '16px', fontWeight: 600 }}>
        ⚠️ {error || "Sin información disponible"}
      </div>
    );
  }

  const anual = data.declaracion_anual_oficial;
  const meses = data.matriz_pagos_provisionales || [];
  const aniosDisponibles = data.anios_con_anual_disponible || ['2021', '2022', '2023', '2024', '2025'];

  // Totales Anuales de Pagos Provisionales
  const totalPagadoEnMeses = meses.reduce((s, m) => s + (m.isr_a_cargo_sat || 0) + (m.iva_a_cargo_sat || 0), 0);
  const totalIsrPagadoMeses = meses.reduce((s, m) => s + (m.isr_a_cargo_sat || 0), 0);
  const totalIvaPagadoMeses = meses.reduce((s, m) => s + (m.iva_a_cargo_sat || 0), 0);
  const totalIngresosMeses = meses.reduce((s, m) => s + (m.xml_ingresos_facturados || m.isr_ingresos_mes || 0), 0);

  const esSaldoFavor = anual && anual.saldo_a_favor > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* ── BARRA SUPERIOR: SELECTOR DE AÑOS Y VISTA ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.75rem' }}>🏛️</span>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Auditoría Oficial SAT • Ejercicio {year}
            </h2>
          </div>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Liquidación anual oficial del SAT y desglose exhaustivo de los 12 pagos provisionales de ISR e IVA.
          </p>
        </div>

        {/* Selector de Años */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Ejercicio:</span>
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '12px', gap: '4px' }}>
            {aniosDisponibles.map((y) => {
              const isSelected = year === y;
              return (
                <button
                  key={y}
                  onClick={() => onYearChange && onYearChange(y)}
                  style={{
                    padding: '6px 14px',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: isSelected ? '#0f172a' : 'transparent',
                    color: isSelected ? '#ffffff' : '#64748b',
                    boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.15)' : 'none'
                  }}
                >
                  {y}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 1. GRAN HERO CARD: RESULTADO ANUAL DEFINITIVO (¿PAGASTE O SALISTE A FAVOR?) ── */}
      {anual ? (
        <div style={{
          background: esSaldoFavor
            ? 'linear-gradient(135deg, #022c22 0%, #065f46 50%, #0f172a 100%)'
            : 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 50%, #1e1b4b 100%)',
          borderRadius: '24px',
          padding: '2.25rem',
          color: 'white',
          boxShadow: esSaldoFavor ? '0 12px 30px -8px rgba(6,78,59,0.4)' : '0 12px 30px -8px rgba(127,29,29,0.4)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', fontSize: '9rem', opacity: 0.08, pointerEvents: 'none' }}>
            {esSaldoFavor ? '💰' : '📑'}
          </div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Header del Banner */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: esSaldoFavor ? 'rgba(52, 211, 153, 0.2)' : 'rgba(248, 113, 113, 0.2)',
                border: `1px solid ${esSaldoFavor ? 'rgba(52, 211, 153, 0.4)' : 'rgba(248, 113, 113, 0.4)'}`,
                padding: '6px 16px',
                borderRadius: '999px',
                fontSize: '0.8rem',
                fontWeight: 800,
                color: esSaldoFavor ? '#6ee7b7' : '#fca5a5',
                letterSpacing: '0.04em'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: esSaldoFavor ? '#34d399' : '#ef4444', display: 'inline-block' }} />
                DECLARACIÓN ANUAL OFICIAL • {anual.tipo_declaracion.toUpperCase()}
              </div>

              <div style={{ fontSize: '0.85rem', color: '#cbd5e1', fontFamily: 'monospace' }}>
                FOLIO OPERACIÓN SAT: <b style={{ color: 'white', fontSize: '0.95rem' }}>{anual.num_operacion || 'N/A'}</b>
              </div>
            </div>

            {/* Cuerpo del Banner */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: esSaldoFavor ? '#a7f3d0' : '#fecaca', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  {esSaldoFavor ? '🎉 Resultado Oficial: Saldo a Favor' : '⚠️ Resultado Oficial: Impuesto a Cargo'}
                </div>
                <h1 style={{ margin: 0, fontSize: '3rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {esSaldoFavor ? formatMoney(anual.saldo_a_favor) : formatMoney(anual.saldo_a_cargo)}
                </h1>
                <p style={{ margin: '1rem 0 0 0', fontSize: '0.95rem', color: '#f1f5f9', opacity: 0.9, lineHeight: 1.5 }}>
                  {esSaldoFavor
                    ? `El SAT autorizó devolverte ${formatMoney(anual.saldo_a_favor)} por retenciones a tu favor.`
                    : `Se liquidó un impuesto total a cargo de ${formatMoney(anual.saldo_a_cargo)} en este ejercicio.`}
                </p>

                {anual.clabe && (
                  <div style={{
                    marginTop: '1.25rem',
                    display: 'inline-flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'rgba(255, 255, 255, 0.12)',
                    backdropFilter: 'blur(8px)',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    fontSize: '0.85rem'
                  }}>
                    <span style={{ color: '#34d399', fontWeight: 700 }}>💳 Cuenta CLABE Registrada:</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'white', letterSpacing: '0.05em' }}>{anual.clabe}</span>
                    {anual.banco && <span style={{ color: '#a7f3d0' }}>({anual.banco})</span>}
                  </div>
                )}
              </div>

              {/* Cascada de Determinación Oficial */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(16px)',
                borderRadius: '20px',
                padding: '1.5rem 1.75rem',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Liquidación Oficial de la Anual
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: '#cbd5e1' }}>1. Ingresos Acumulables:</span>
                  <span style={{ fontWeight: 800, color: 'white', fontFamily: 'monospace' }}>{formatMoney(anual.ingresos_acumulables_totales)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: '#cbd5e1' }}>2. Deducciones Personales:</span>
                  <span style={{ fontWeight: 800, color: '#fcd34d', fontFamily: 'monospace' }}>-{formatMoney(anual.deducciones_personales)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: '#cbd5e1' }}>3. Base Gravable:</span>
                  <span style={{ fontWeight: 900, color: '#6ee7b7', fontFamily: 'monospace' }}>{formatMoney(anual.base_gravable)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: '#cbd5e1' }}>4. ISR Causado (Art. 152):</span>
                  <span style={{ fontWeight: 800, color: '#fca5a5', fontFamily: 'monospace' }}>{formatMoney(anual.isr_tarifa)}</span>
                </div>
                {anual.pagos_provisionales_acreditados > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: '#cbd5e1' }}>5. Pagos Provisionales (Meses):</span>
                    <span style={{ fontWeight: 900, color: '#60a5fa', fontFamily: 'monospace' }}>-{formatMoney(anual.pagos_provisionales_acreditados)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: '#cbd5e1' }}>{anual.pagos_provisionales_acreditados > 0 ? '6.' : '5.'} ISR Retenido (Patrones):</span>
                  <span style={{ fontWeight: 900, color: '#34d399', fontFamily: 'monospace' }}>-{formatMoney(anual.isr_retenido_total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '20px', padding: '1.75rem 2rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <span style={{ fontSize: '3rem' }}>⏳</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#78350f' }}>Declaración Anual {year} en Proceso</h3>
            <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.9rem', color: '#b45309' }}>
              No se encontró un acuse PDF oficial para el ejercicio {year}. Puedes consultar el detalle de los 12 pagos provisionales abajo.
            </p>
          </div>
        </div>
      )}

      {/* ── 2. CUADRO RESUMEN DE PAGOS PROVISIONALES ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div style={{ background: 'white', borderRadius: '16px', padding: '1.25rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Meses Presentados</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', marginTop: '4px' }}>
            {data.meses_presentados_count} <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>/ 12 meses</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700, marginTop: '4px' }}>✓ 100% al corriente ante el SAT</div>
        </div>

        <div style={{ background: 'white', borderRadius: '16px', padding: '1.25rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Total Pagado en el Año (Meses)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: totalPagadoEnMeses > 0 ? '#dc2626' : '#059669', marginTop: '4px' }}>
            {formatMoney(totalPagadoEnMeses)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            {totalPagadoEnMeses === 0 ? '🟢 Todos los meses salieron en $0' : `🔴 ISR: ${formatMoney(totalIsrPagadoMeses)} | IVA: ${formatMoney(totalIvaPagadoMeses)}`}
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '16px', padding: '1.25rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Ingresos Facturados (Honorarios)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1d4ed8', marginTop: '4px' }}>
            {formatMoney(totalIngresosMeses)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>Facturación emitida con CFDI</div>
        </div>

        <div style={{ background: 'white', borderRadius: '16px', padding: '1.25rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>IVA Acreditable en Compras</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#047857', marginTop: '4px' }}>
            {formatMoney(meses.reduce((s, m) => s + (m.iva_acreditable_sat || 0), 0))}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>IVA deducido en declaraciones</div>
        </div>
      </div>

      {/* ── 3. TABLA EJECUTIVA: DETALLE MES POR MES (12 MESES) ── */}
      <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
              📅 Detalle Mensual de Declaraciones ({year})
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              Ingresos, gastos, determinación de impuestos y pagos efectivos realizados al SAT.
            </p>
          </div>

          <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
            <button
              onClick={() => setViewMode('tabla')}
              style={{
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: viewMode === 'tabla' ? 'white' : 'transparent',
                color: viewMode === 'tabla' ? '#0f172a' : '#64748b',
                boxShadow: viewMode === 'tabla' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              📊 Vista Tabla
            </button>
            <button
              onClick={() => setViewMode('tarjetas')}
              style={{
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: viewMode === 'tarjetas' ? 'white' : 'transparent',
                color: viewMode === 'tarjetas' ? '#0f172a' : '#64748b',
                boxShadow: viewMode === 'tarjetas' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              🗂️ Vista Tarjetas
            </button>
          </div>
        </div>

        {viewMode === 'tabla' ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '12px 16px' }}>Mes</th>
                  <th style={{ padding: '12px 16px' }}>Estatus SAT</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Ingreso Facturado</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>ISR Retenido</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>IVA Cobrado (16%)</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>IVA Acreditable (Gastos)</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Pago Efectivo al SAT</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Folio SAT</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {meses.map((m) => {
                  const isPresentada = m.estatus === 'Presentada';
                  const totalPagoMes = m.total_pago_efectivo || ((m.isr_a_cargo_sat || 0) + (m.iva_a_cargo_sat || 0));

                  return (
                    <tr
                      key={m.mes_numero}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: totalPagoMes > 0 ? '#fffafa' : (isPresentada ? 'white' : '#f8fafc'),
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: '#0f172a' }}>
                        {m.mes_numero.toString().padStart(2, '0')}. {m.mes_nombre}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {isPresentada ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: m.tiene_complementaria ? '#fef3c7' : '#ecfdf5',
                            color: m.tiene_complementaria ? '#92400e' : '#065f46',
                            border: `1px solid ${m.tiene_complementaria ? '#fde68a' : '#a7f3d0'}`,
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '999px'
                          }}>
                            ✓ {m.tiene_complementaria ? 'Complementaria' : 'Normal'}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>{m.estatus}</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: (m.xml_ingresos_facturados || m.isr_ingresos_mes) > 0 ? '#0f172a' : '#94a3b8' }}>
                        {formatMoney(m.xml_ingresos_facturados || m.isr_ingresos_mes || 0)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', color: m.isr_retenido_sat > 0 ? '#059669' : '#94a3b8' }}>
                        {m.isr_retenido_sat > 0 ? `-${formatMoney(m.isr_retenido_sat)}` : '$0.00'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', color: m.iva_cobrado_sat > 0 ? '#1d4ed8' : '#94a3b8' }}>
                        {formatMoney(m.iva_cobrado_sat)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', color: m.iva_acreditable_sat > 0 ? '#059669' : '#94a3b8' }}>
                        {m.iva_acreditable_sat > 0 ? `-${formatMoney(m.iva_acreditable_sat)}` : '$0.00'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        {isPresentada ? (
                          totalPagoMes > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
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
                                🔴 Pagaste: {formatMoney(totalPagoMes)}
                              </span>
                              {m.tiene_acuse_pago && (
                                <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 800 }}>
                                  ✓ Acuse de Pago SAT
                                </span>
                              )}
                            </div>
                          ) : (
                            <span style={{
                              background: '#f0fdf4',
                              color: '#166534',
                              border: '1px solid #bbf7d0',
                              padding: '4px 10px',
                              borderRadius: '8px',
                              fontWeight: 800,
                              fontSize: '0.75rem'
                            }}>
                              🟢 $0.00 (Sin Pago)
                            </span>
                          )
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', fontSize: '0.8rem', color: '#64748b' }}>
                        {m.num_operacion ? `Op. ${m.num_operacion}` : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {isPresentada && m.detalle_oficial_completo && (
                          <button
                            onClick={() => setSelectedMonthModal(m)}
                            style={{
                              background: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              color: '#1e293b',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              padding: '4px 10px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span>🔍</span> Ver Detalle SAT
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0', fontWeight: 900, color: '#0f172a' }}>
                  <td style={{ padding: '14px 16px' }}>TOTAL ANUAL</td>
                  <td style={{ padding: '14px 16px', color: '#059669' }}>12 Presentadas</td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace', color: '#0f172a' }}>{formatMoney(totalIngresosMeses)}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace', color: '#059669' }}>-{formatMoney(meses.reduce((s, m) => s + (m.isr_retenido_sat || 0), 0))}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace', color: '#1d4ed8' }}>{formatMoney(meses.reduce((s, m) => s + (m.iva_cobrado_sat || 0), 0))}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace', color: '#059669' }}>-{formatMoney(meses.reduce((s, m) => s + (m.iva_acreditable_sat || 0), 0))}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace', color: totalPagadoEnMeses > 0 ? '#dc2626' : '#059669' }}>
                    {formatMoney(totalPagadoEnMeses)}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', color: '#64748b' }}>—</td>
                  <td style={{ padding: '14px 16px' }}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          /* Vista Tarjetas */
          <div style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {meses.map((m) => {
              const isPresentada = m.estatus === 'Presentada';
              const totalPagoMes = m.total_pago_efectivo || ((m.isr_a_cargo_sat || 0) + (m.iva_a_cargo_sat || 0));

              return (
                <div
                  key={m.mes_numero}
                  style={{
                    background: isPresentada ? 'white' : '#f8fafc',
                    border: `1px solid ${isPresentada ? '#e2e8f0' : '#f1f5f9'}`,
                    borderRadius: '16px',
                    padding: '1.25rem',
                    boxShadow: isPresentada ? '0 2px 6px rgba(0,0,0,0.03)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
                      {m.mes_numero.toString().padStart(2, '0')}. {m.mes_nombre}
                    </div>
                    {isPresentada ? (
                      totalPagoMes > 0 ? (
                        <span style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontSize: '0.75rem', fontWeight: 900, padding: '2px 8px', borderRadius: '999px' }}>
                          🔴 Pago: {formatMoney(totalPagoMes)}
                        </span>
                      ) : (
                        <span style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', fontSize: '0.75rem', fontWeight: 800, padding: '2px 8px', borderRadius: '999px' }}>
                          🟢 Pago $0.00
                        </span>
                      )
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{m.estatus}</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                      <span>Ingreso Facturado:</span>
                      <b style={{ color: '#0f172a', fontFamily: 'monospace' }}>{formatMoney(m.xml_ingresos_facturados || m.isr_ingresos_mes || 0)}</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                      <span>IVA Cobrado (16%):</span>
                      <span style={{ color: '#1d4ed8', fontFamily: 'monospace' }}>{formatMoney(m.iva_cobrado_sat)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                      <span>IVA Deducido (Gastos):</span>
                      <span style={{ color: '#059669', fontFamily: 'monospace' }}>-{formatMoney(m.iva_acreditable_sat)}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f8fafc', paddingTop: '0.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                    <span>Folio SAT:</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#475569' }}>Op. {m.num_operacion || 'N/A'}</span>
                  </div>

                  {isPresentada && m.detalle_oficial_completo && (
                    <button
                      onClick={() => setSelectedMonthModal(m)}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        color: '#334155',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        padding: '6px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        marginTop: '4px'
                      }}
                    >
                      🔍 Ver Desglose Oficial SAT
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 4. MODAL DETALLE EXHAUSTIVO OFICIAL DEL SAT (FORMULARIO SAT COMPLETO) ── */}
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
                  DECLARACIÓN PROVISIONAL DE IMPUESTOS FEDERALES • SAT OFICIAL
                </div>
                <h2 style={{ margin: '4px 0 0 0', fontSize: '1.35rem', fontWeight: 900 }}>
                  {selectedMonthModal.mes_nombre} {year} ({selectedMonthModal.tipo_declaracion})
                </h2>
              </div>
              <button
                onClick={() => setSelectedMonthModal(null)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 800 }}
              >
                ✕
              </button>
            </div>

            {/* Contenido del Modal con todos los campos */}
            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              
              {/* Metadatos Generales */}
              <div style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, display: 'block' }}>NÚMERO DE OPERACIÓN:</span>
                  <b style={{ fontFamily: 'monospace', fontSize: '0.95rem' }}>{selectedMonthModal.num_operacion}</b>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, display: 'block' }}>FECHA DE PRESENTACIÓN:</span>
                  <b>{selectedMonthModal.fecha_presentacion || 'N/A'}</b>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, display: 'block' }}>RFC / CURP:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{selectedMonthModal.detalle_oficial_completo?.rfc || 'GAQA810905BCA'}</span>
                </div>
              </div>

              {/* Sección R122: ISR */}
              <div>
                <h4 style={{ margin: '0 0 0.75rem 0', color: '#1e40af', fontSize: '0.95rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🟦</span> DETERMINACIÓN DEL IMPUESTO SOBRE LA RENTA (ISR R122)
                </h4>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', fontSize: '0.85rem' }}>
                  {[
                    ['Ingresos de Periodos Anteriores', selectedMonthModal.detalle_oficial_completo?.isr_ingresos_periodos_anteriores],
                    ['Ingresos del Periodo', selectedMonthModal.detalle_oficial_completo?.isr_ingresos_periodo],
                    ['Total de Ingresos Acumulables', selectedMonthModal.detalle_oficial_completo?.isr_ingresos_acumulados],
                    ['Compras y Gastos del Periodo (Deducciones)', selectedMonthModal.detalle_oficial_completo?.isr_compras_periodo],
                    ['Total de Compras y Gastos Acumulados', selectedMonthModal.detalle_oficial_completo?.isr_deducciones_autorizadas],
                    ['Pérdidas Fiscales de Ejercicios Anteriores Aplicadas', selectedMonthModal.detalle_oficial_completo?.isr_perdidas_anteriores_aplicadas],
                    ['Base Gravable del Pago Provisional', selectedMonthModal.detalle_oficial_completo?.isr_base_gravable],
                    ['ISR Causado conforme a Tarifa', selectedMonthModal.detalle_oficial_completo?.isr_causado],
                    ['Pagos Provisionales Efectuados con Anterioridad', selectedMonthModal.detalle_oficial_completo?.isr_pagos_provisionales_anteriores],
                    ['ISR Retenido del Periodo', selectedMonthModal.detalle_oficial_completo?.isr_retenido_periodo],
                    ['Total Impuesto Retenido Acumulado', selectedMonthModal.detalle_oficial_completo?.isr_impuesto_retenido_total],
                    ['ISR a Cargo del Mes', selectedMonthModal.detalle_oficial_completo?.isr_a_cargo]
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
                    ['Actividades Gravadas a la Tasa del 16%', selectedMonthModal.detalle_oficial_completo?.iva_base_gravada_16],
                    ['IVA Cobrado del Periodo a la Tasa del 16%', selectedMonthModal.detalle_oficial_completo?.iva_cobrado_16],
                    ['IVA Acreditable del Periodo (Gastos)', selectedMonthModal.detalle_oficial_completo?.iva_acreditable_gastos],
                    ['IVA Retenido por Terceros', selectedMonthModal.detalle_oficial_completo?.iva_retenido],
                    ['IVA a Cargo del Mes', selectedMonthModal.detalle_oficial_completo?.iva_a_cargo]
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
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>CANTIDAD TOTAL A PAGAR EN ESTE MES:</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: (selectedMonthModal.total_pago_efectivo || 0) > 0 ? '#f87171' : '#34d399' }}>
                    {formatMoney(selectedMonthModal.total_pago_efectivo || 0)}
                  </div>
                </div>
                {selectedMonthModal.tiene_acuse_pago && (
                  <div style={{ background: 'rgba(52, 211, 153, 0.2)', border: '1px solid #34d399', padding: '6px 14px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 800, color: '#6ee7b7' }}>
                    ✓ Acuse de Recibo Bancario SAT Validado
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
