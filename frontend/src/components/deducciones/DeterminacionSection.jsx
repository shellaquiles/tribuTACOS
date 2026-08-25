import React, { useState } from 'react';
import { SectionCard, fmt } from '../ui/Primitives';

export const DeterminacionSection = ({ sections, summary, year, data }) => {
  const [extraDeduction, setExtraDeduction] = useState(0);
  const [activeTabRegimen, setActiveTabRegimen] = useState('resumen');

  if (!sections || !summary) return null;

  const simAnual = data?.simulacion_anual || {};
  const sueldos = sections.sueldos;
  const honorarios = sections.honorarios;
  const intereses = sections.intereses;

  const totalAcumulables = simAnual.ingresos_acumulables_totales ?? ((sueldos?.gravado || 0) + (honorarios?.ingresos || 0) + (intereses?.real || 0));
  const dedPersonalesReal = simAnual.deducciones_personales_aplicadas ?? (sections.deducciones_personales?.total || 0);
  const baseGravableReal = simAnual.base_gravable_anual ?? Math.max(0, totalAcumulables - dedPersonalesReal);
  const isrCausado = simAnual.isr_anual_causado || 0;
  const totalAcreditables = simAnual.retenciones_totales_acreditables ?? ((sueldos?.isr_retenido || 0) + (honorarios?.isr_retenido || 0) + (intereses?.isr_retenido || 0));

  const isSaldoFavor = (simAnual.saldo_a_favor_proyectado || 0) > 0;
  const saldoNeto = isSaldoFavor ? simAnual.saldo_a_favor_proyectado : (simAnual.saldo_a_cargo_proyectado || 0);
  const isACargo = !isSaldoFavor && (simAnual.saldo_a_cargo_proyectado || 0) > 0;

  const tasaEfectiva = simAnual.tasa_efectiva || (totalAcumulables > 0 ? (isrCausado / totalAcumulables) * 100 : 0);
  const tasaMarginal = simAnual.tasa_marginal || (simAnual.detalle_tarifa_aplicada?.porcentaje_excedente ? simAnual.detalle_tarifa_aplicada.porcentaje_excedente * 100 : 23.52);

  // Simulación dinámica de deducción extra usando la tasa marginal calculada por el backend
  const ahorroSimulado = Math.round(Number(extraDeduction || 0) * (tasaMarginal / 100));
  const nuevoSaldoReal = isSaldoFavor ? (saldoNeto + ahorroSimulado) : (saldoNeto - ahorroSimulado);

  const waterfallPasos = simAnual.waterfall_pasos || [
    { paso: 1, titulo: '1. Ingresos Totales', monto: totalAcumulables, sub: 'Sueldos + AEyP + Intereses' },
    { paso: 2, titulo: '2. (−) Deducciones', monto: dedPersonalesReal, sub: 'Art. 151 LISR aplicadas' },
    { paso: 3, titulo: '3. (=) Base Gravable', monto: baseGravableReal, sub: 'Monto sobre el que aplica tarifa' },
    { paso: 4, titulo: '4. ISR Causado', monto: isrCausado, sub: 'Tarifa Art. 152 aplicada' },
    { paso: 5, titulo: '5. (−) Retenciones', monto: totalAcreditables, sub: 'ISR retenido por terceros' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* ── 1. HERO BANNER DE LIQUIDACIÓN ANUAL (SALDO A FAVOR / CARGO) ── */}
      <div style={{
        background: isACargo
          ? 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 50%, #991b1b 100%)'
          : 'linear-gradient(135deg, #022c22 0%, #065f46 50%, #047857 100%)',
        borderRadius: '24px',
        padding: '2.5rem 2rem',
        color: 'white',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        border: '1px solid rgba(255,255,255,0.15)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', fontSize: '9rem', opacity: 0.08, pointerEvents: 'none' }}>
          {isACargo ? '⚠️' : '🌮'}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: isACargo ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)',
              color: isACargo ? '#fca5a5' : '#6ee7b7',
              padding: '6px 14px', borderRadius: '30px', fontSize: '0.8rem', fontWeight: 800,
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px'
            }}>
              <span>{isACargo ? '🔴 Liquidación Anual' : '🟢 Devolución SAT Estimada'}</span>
              <span>•</span>
              <span>Ejercicio {year}</span>
            </div>

            <h2 style={{ margin: 0, fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.02em', color: 'white' }}>
              {isACargo ? 'ISR a Cargo del Ejercicio' : 'Saldo a Favor del Contribuyente'}
            </h2>
            <p style={{ margin: '8px 0 0 0', fontSize: '0.95rem', color: isACargo ? '#fecaca' : '#a7f3d0', maxWidth: '640px' }}>
              {isACargo
                ? `Tus pagos provisionales y retenciones no cubrieron la totalidad del impuesto causado. Debes pagar ${fmt(saldoNeto)} al presentar tu declaración anual.`
                : `Tus retenciones de nómina y clientes superaron el ISR causado por tus ingresos. El SAT te debe devolver ${fmt(saldoNeto)} en depósito directo.`}
            </p>
          </div>

          <div style={{ textAlign: 'right', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', padding: '1.5rem 2rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.15)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: isACargo ? '#fca5a5' : '#a7f3d0', letterSpacing: '0.08em' }}>
              {isACargo ? 'Monto a Pagar' : 'Monto a Devolver'}
            </span>
            <div style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1.1, color: '#ffffff', textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
              {fmt(saldoNeto)}
            </div>
            <div style={{ fontSize: '0.8rem', color: isACargo ? '#fca5a5' : '#a7f3d0', marginTop: '6px', fontWeight: 600 }}>
              {isACargo ? 'Generar línea de captura SAT' : 'Devolución automática en 5-10 días'}
            </div>
          </div>
        </div>

        {/* KPIs de Eficiencia Fiscal */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '1.5rem' }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 700, textTransform: 'uppercase' }}>Ingresos Acumulables</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', marginTop: '2px' }}>{fmt(totalAcumulables)}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 700, textTransform: 'uppercase' }}>ISR Causado (Art. 152)</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fbbf24', marginTop: '2px' }}>{fmt(isrCausado)}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 700, textTransform: 'uppercase' }}>Retenciones Pagadas</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#60a5fa', marginTop: '2px' }}>{fmt(totalAcreditables)}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 700, textTransform: 'uppercase' }}>Tasa Efectiva Real</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#a7f3d0', marginTop: '2px' }}>{tasaEfectiva.toFixed(2)}%</div>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 700, textTransform: 'uppercase' }}>Tasa Marginal SAT</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fbcfe8', marginTop: '2px' }}>{tasaMarginal.toFixed(2)}%</div>
          </div>
        </div>
      </div>

      {/* ── 2. FLUJO EN CASCADA DEL CÁLCULO (WATERFALL FISCAL) ── */}
      <SectionCard icon="🧮" title="Cascada de Determinación del Impuesto" badge="Cálculo Backend">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'stretch' }}>
          {waterfallPasos.map((p, idx) => (
            <div
              key={idx}
              style={{
                background: idx === 0 ? '#f8fafc' : idx === 1 ? '#fffbeb' : idx === 2 ? '#eff6ff' : idx === 3 ? '#fdf2f8' : '#f0fdf4',
                borderRadius: '14px',
                padding: '1.25rem',
                border: `1px solid ${idx === 0 ? '#e2e8f0' : idx === 1 ? '#fde68a' : idx === 2 ? '#bfdbfe' : idx === 3 ? '#fbcfe8' : '#bbf7d0'}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{
                  fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase',
                  color: idx === 0 ? '#3b82f6' : idx === 1 ? '#d97706' : idx === 2 ? '#2563eb' : idx === 3 ? '#db2777' : '#16a34a'
                }}>
                  {p.titulo}
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1e293b', marginTop: '4px' }}>
                  {fmt(p.monto)}
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '8px' }}>
                {p.sub}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── 3. SIMULADOR INTERACTIVO DE DEDUCCIONES Y AHORRO FISCAL ── */}
      <div style={{
        background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
        borderRadius: '20px',
        padding: '1.75rem 2rem',
        border: '1.5px solid #93c5fd',
        boxShadow: '0 4px 15px rgba(59, 130, 246, 0.08)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '1.4rem' }}>💡</span>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1e3a8a' }}>
                Optimizador Fiscal: Simulación de deducciones personales extra
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#334155' }}>
              Por cada peso que deduces en gastos médicos, colegiaturas, Afore o seguros, recuperas directamente el <strong>{tasaMarginal.toFixed(0)}%</strong> de tu dinero en efectivo gracias a tu tasa marginal del SAT.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', alignItems: 'center', background: 'white', padding: '1.25rem 1.5rem', borderRadius: '14px', border: '1px solid #bfdbfe' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
              Simular Deducción Extra (Médicos, Seguros, SAR, etc.):
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontWeight: 800, color: '#64748b' }}>$</span>
              <input
                type="number"
                min="0"
                step="5000"
                placeholder="Ej. 10000"
                value={extraDeduction || ''}
                onChange={(e) => setExtraDeduction(e.target.value)}
                style={{
                  width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px',
                  border: '1.5px solid #3b82f6', fontSize: '1rem', fontWeight: 700, color: '#1e293b'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Ahorro / Devolución Extra:</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#059669', lineHeight: 1.2 }}>
                +{fmt(ahorroSimulado)}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Nuevo Saldo Fiscal Proyectado:</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#059669', lineHeight: 1.2 }}>
                +{fmt(nuevoSaldoReal)} a favor
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. RESUMEN POR RÉGIMEN FISCAL ── */}
      <SectionCard icon="📊" title="Auditoría de Regímenes Fiscales Consolidados">
        <div className="table-responsive">
          <table className="sat-table">
            <thead>
              <tr>
                <th>Régimen / Origen del Ingreso</th>
                <th className="text-right">Ingreso Bruto</th>
                <th className="text-right">Exento / Deducciones</th>
                <th className="text-right">Ingreso Acumulable</th>
                <th className="text-right">ISR Retenido</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>👥 Sueldos, Salarios y Asimilados (Cap. I)</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Art. 94 LISR — Empleadores y patrones</div>
                </td>
                <td className="text-right">{fmt(sueldos?.total_ingresos || 0)}</td>
                <td className="text-right text-muted">{fmt(sueldos?.exento || 0)}</td>
                <td className="text-right font-medium" style={{ color: '#3b82f6', fontWeight: 800 }}>{fmt(sueldos?.gravado || 0)}</td>
                <td className="text-right" style={{ color: '#059669', fontWeight: 800 }}>{fmt(sueldos?.isr_retenido || 0)}</td>
              </tr>
              <tr>
                <td>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>💼 Actividad Empresarial y Profesional (Cap. II)</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Art. 100 LISR — Honorarios y facturación PUE</div>
                </td>
                <td className="text-right">{fmt(honorarios?.ingresos || 0)}</td>
                <td className="text-right text-muted">−{fmt(honorarios?.deducciones_autorizadas || 0)}</td>
                <td className="text-right font-medium" style={{ color: '#3b82f6', fontWeight: 800 }}>{fmt(honorarios?.utilidad || 0)}</td>
                <td className="text-right" style={{ color: '#059669', fontWeight: 800 }}>{fmt(honorarios?.isr_retenido || 0)}</td>
              </tr>
              <tr>
                <td>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>🏦 Ingresos por Intereses (Cap. VI)</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Art. 133 LISR — Instituciones financieras y Cetes</div>
                </td>
                <td className="text-right">{fmt(intereses?.nominal || 0)}</td>
                <td className="text-right text-muted">Ajuste inflación</td>
                <td className="text-right font-medium" style={{ color: '#3b82f6', fontWeight: 800 }}>{fmt(intereses?.real || 0)}</td>
                <td className="text-right" style={{ color: '#059669', fontWeight: 800 }}>{fmt(intereses?.isr_retenido || 0)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr style={{ background: '#f8fafc', fontWeight: 900 }}>
                <td>TOTALES CONSOLIDADOS</td>
                <td className="text-right">{fmt((sueldos?.total_ingresos || 0) + (honorarios?.ingresos || 0) + (intereses?.nominal || 0))}</td>
                <td className="text-right">—</td>
                <td className="text-right" style={{ color: '#1e3a8a', fontSize: '1rem' }}>{fmt(totalAcumulables)}</td>
                <td className="text-right" style={{ color: '#059669', fontSize: '1rem' }}>{fmt(totalAcreditables)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </SectionCard>

    </div>
  );
};
