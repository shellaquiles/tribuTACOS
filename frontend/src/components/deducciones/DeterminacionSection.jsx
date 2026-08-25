import React, { useState } from 'react';
import { SectionCard, fmt } from '../ui/Primitives';

const ISR_TARIFA_2022 = [
  { li: 0.01,         ls: 7735.00,    cuota: 0,          tasa: 0.0192 },
  { li: 7735.01,      ls: 65651.07,   cuota: 148.51,     tasa: 0.0640 },
  { li: 65651.08,     ls: 115375.90,  cuota: 4004.99,    tasa: 0.1088 },
  { li: 115375.91,    ls: 134119.41,  cuota: 8933.72,    tasa: 0.1600 },
  { li: 134119.42,    ls: 160577.65,  cuota: 11828.32,   tasa: 0.1792 },
  { li: 160577.66,    ls: 323862.60,  cuota: 16396.69,   tasa: 0.2136 },
  { li: 323862.61,    ls: 510487.62,  cuota: 49233.00,   tasa: 0.2352 },
  { li: 510487.63,    ls: 971114.30,  cuota: 88141.16,   tasa: 0.3000 },
  { li: 971114.31,    ls: 1294819.06, cuota: 239715.11,  tasa: 0.3200 },
  { li: 1294819.07,   ls: 3884457.19, cuota: 344617.43,  tasa: 0.3400 },
  { li: 3884457.20,   ls: Infinity,   cuota: 1173195.42, tasa: 0.3500 },
];

const ISR_TARIFA_2024 = [
  { li: 0.01,         ls: 8952.49,    cuota: 0,        tasa: 0.0192 },
  { li: 8952.50,      ls: 75984.55,   cuota: 171.88,   tasa: 0.0640 },
  { li: 75984.56,     ls: 133536.07,  cuota: 4461.94,  tasa: 0.1088 },
  { li: 133536.08,    ls: 155229.80,  cuota: 10723.55, tasa: 0.1600 },
  { li: 155229.81,    ls: 185852.57,  cuota: 14194.54, tasa: 0.1792 },
  { li: 185852.58,    ls: 374837.88,  cuota: 19682.13, tasa: 0.2136 },
  { li: 374837.89,    ls: 590795.99,  cuota: 60049.40, tasa: 0.2352 },
  { li: 590796.00,    ls: 1127926.84, cuota: 110842.74, tasa: 0.3000 },
  { li: 1127926.85,   ls: 1503902.46, cuota: 271981.90, tasa: 0.3200 },
  { li: 1503902.47,   ls: 4511707.37, cuota: 392294.17, tasa: 0.3400 },
  { li: 4511707.38,   ls: Infinity,   cuota: 1414947.85, tasa: 0.3500 },
];

const ISR_TARIFA_2025 = [
  { li: 0,           ls: 8952.49,    cuota: 0,        tasa: 0.0192 },
  { li: 8952.50,     ls: 75984.55,   cuota: 171.88,   tasa: 0.0640 },
  { li: 75984.56,    ls: 133536.07,  cuota: 4461.94,  tasa: 0.1088 },
  { li: 133536.08,   ls: 155229.80,  cuota: 10723.55, tasa: 0.1600 },
  { li: 155229.81,   ls: 185852.57,  cuota: 14194.54, tasa: 0.1792 },
  { li: 185852.58,   ls: 374837.88,  cuota: 19682.13, tasa: 0.2136 },
  { li: 374837.89,   ls: 590795.99,  cuota: 60049.40, tasa: 0.2352 },
  { li: 590796.00,   ls: 1127926.84, cuota: 110842.74, tasa: 0.3000 },
  { li: 1127926.85,  ls: 1503902.46, cuota: 271981.90, tasa: 0.3200 },
  { li: 1503902.47,  ls: 4511707.37, cuota: 392294.17, tasa: 0.3400 },
  { li: 4511707.38,  ls: Infinity,   cuota: 1414947.85, tasa: 0.3500 },
];

function calcISR(base, year) {
  let tarifa = ISR_TARIFA_2024;
  if (year === '2022') tarifa = ISR_TARIFA_2022;
  if (year === '2025' || year === '2026') tarifa = ISR_TARIFA_2025;

  const row = tarifa.find(r => base >= r.li && base <= r.ls) || tarifa[tarifa.length - 1];
  const excedente = base - row.li;
  const marginal = excedente * row.tasa;
  const isr = row.cuota + marginal;
  return { isr, cuota: row.cuota, marginal, excedente, tasa: row.tasa, limiteInferior: row.li };
}

export const DeterminacionSection = ({ sections, summary, year }) => {
  const [extraDeduction, setExtraDeduction] = useState(0);
  const [activeTabRegimen, setActiveTabRegimen] = useState('resumen');

  if (!sections || !summary) return null;

  const sueldos = sections.sueldos;
  const honorarios = sections.honorarios;
  const intereses = sections.intereses;

  // 1. Ingresos acumulables por régimen
  const ingSueldos = sueldos?.gravado || 0;
  const aeypSubtotalTotal = (honorarios?.detalle || []).reduce((s, r) => s + (r.subtotal || 0), 0);
  const aeypDeducciones = honorarios?.deducciones_autorizadas || 0;
  const ingHonorarios = Math.max(0, aeypSubtotalTotal - aeypDeducciones);
  const ingIntereses = intereses?.real || 0;
  const totalAcumulables = ingSueldos + ingHonorarios + ingIntereses;

  // 2. Deducciones personales
  const dedPersonalesReal = sections.deducciones_personales?.total || 0;
  const dedPersonalesSimuladas = Math.max(0, dedPersonalesReal + Number(extraDeduction || 0));

  // 3. Base gravable y cálculo de ISR real
  const baseGravableReal = Math.max(0, totalAcumulables - dedPersonalesReal);
  const calcReal = calcISR(baseGravableReal, year);

  // 4. Cálculo simulado con deducción extra
  const baseGravableSimulada = Math.max(0, totalAcumulables - dedPersonalesSimuladas);
  const calcSimulado = calcISR(baseGravableSimulada, year);

  // 5. Acreditables (Retenciones ya pagadas durante el año)
  const isrSueldos = sueldos?.isr_retenido || 0;
  const isrHonorarios = honorarios?.isr_retenido || 0;
  const isrIntereses = intereses?.isr_retenido || 0;
  const totalAcreditables = isrSueldos + isrHonorarios + isrIntereses;

  // 6. Resultados
  const resultadoReal = calcReal.isr - totalAcreditables;
  const isACargo = resultadoReal > 0;
  const saldoNeto = Math.abs(resultadoReal);

  const resultadoSimulado = calcSimulado.isr - totalAcreditables;
  const ahorroSimulado = Math.max(0, calcReal.isr - calcSimulado.isr);

  // 7. Métricas de eficiencia fiscal
  const tasaEfectiva = totalAcumulables > 0 ? (calcReal.isr / totalAcumulables) * 100 : 0;
  const tasaMarginal = calcReal.tasa * 100;

  let tarifaActual = ISR_TARIFA_2024;
  if (year === '2022') tarifaActual = ISR_TARIFA_2022;
  if (year === '2025' || year === '2026') tarifaActual = ISR_TARIFA_2025;

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
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fbbf24', marginTop: '2px' }}>{fmt(calcReal.isr)}</div>
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
      <SectionCard icon="🧮" title="Cascada de Determinación del Impuesto" badge="Paso a paso">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'stretch' }}>

          <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '1.25rem', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase' }}>1. Ingresos Totales</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1e293b', marginTop: '4px' }}>{fmt(totalAcumulables)}</div>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '8px' }}>Sueldos + AEyP + Intereses</div>
          </div>

          <div style={{ background: '#fffbeb', borderRadius: '14px', padding: '1.25rem', border: '1px solid #fde68a', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#d97706', textTransform: 'uppercase' }}>2. (−) Deducciones</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#b45309', marginTop: '4px' }}>{fmt(dedPersonalesReal)}</div>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#92400e', marginTop: '8px' }}>Art. 151 LISR aplicadas</div>
          </div>

          <div style={{ background: '#eff6ff', borderRadius: '14px', padding: '1.25rem', border: '1px solid #bfdbfe', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase' }}>3. (=) Base Gravable</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1d4ed8', marginTop: '4px' }}>{fmt(baseGravableReal)}</div>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#1e40af', marginTop: '8px' }}>Monto sobre el que aplica tarifa</div>
          </div>

          <div style={{ background: '#fdf2f8', borderRadius: '14px', padding: '1.25rem', border: '1px solid #fbcfe8', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#db2777', textTransform: 'uppercase' }}>4. ISR Causado</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#be185d', marginTop: '4px' }}>{fmt(calcReal.isr)}</div>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#9d174d', marginTop: '8px' }}>Tarifa Art. 152 aplicada</div>
          </div>

          <div style={{ background: '#f0fdf4', borderRadius: '14px', padding: '1.25rem', border: '1px solid #bbf7d0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#16a34a', textTransform: 'uppercase' }}>5. (−) Retenciones</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#15803d', marginTop: '4px' }}>{fmt(totalAcreditables)}</div>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#166534', marginTop: '8px' }}>ISR retenido por terceros</div>
          </div>

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
                Optimizador Fiscal: ¿Qué pasa si agregas deducciones personales?
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
              <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Nuevo Saldo Fiscal:</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: resultadoSimulado <= 0 ? '#059669' : '#dc2626', lineHeight: 1.2 }}>
                {resultadoSimulado <= 0 ? `+${fmt(Math.abs(resultadoSimulado))} a favor` : `${fmt(resultadoSimulado)} a cargo`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. AUDITORÍA DE REGÍMENES FISCALES & TARIFA ART. 152 ── */}
      <SectionCard icon="📊" title="Auditoría de Tarifa SAT y Regímenes">
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTabRegimen('resumen')}
            style={{
              padding: '0.55rem 1.1rem', borderRadius: '8px', cursor: 'pointer', border: 'none',
              background: activeTabRegimen === 'resumen' ? '#1e293b' : '#f1f5f9',
              color: activeTabRegimen === 'resumen' ? 'white' : '#475569',
              fontWeight: 700, fontSize: '0.85rem'
            }}
          >
            📋 Resumen por Régimen Fiscal
          </button>
          <button
            onClick={() => setActiveTabRegimen('tarifa')}
            style={{
              padding: '0.55rem 1.1rem', borderRadius: '8px', cursor: 'pointer', border: 'none',
              background: activeTabRegimen === 'tarifa' ? '#1e293b' : '#f1f5f9',
              color: activeTabRegimen === 'tarifa' ? 'white' : '#475569',
              fontWeight: 700, fontSize: '0.85rem'
            }}
          >
            ⚖️ Tarifa Oficial SAT (Art. 152 LISR)
          </button>
        </div>

        {activeTabRegimen === 'resumen' && (
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
                  <td className="text-right font-medium" style={{ color: '#3b82f6', fontWeight: 800 }}>{fmt(ingSueldos)}</td>
                  <td className="text-right" style={{ color: '#059669', fontWeight: 800 }}>{fmt(isrSueldos)}</td>
                </tr>
                <tr>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>💼 Actividad Empresarial y Profesional (Cap. II)</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Art. 100 LISR — Honorarios y facturación PUE</div>
                  </td>
                  <td className="text-right">{fmt(aeypSubtotalTotal)}</td>
                  <td className="text-right text-muted">−{fmt(aeypDeducciones)}</td>
                  <td className="text-right font-medium" style={{ color: '#3b82f6', fontWeight: 800 }}>{fmt(ingHonorarios)}</td>
                  <td className="text-right" style={{ color: '#059669', fontWeight: 800 }}>{fmt(isrHonorarios)}</td>
                </tr>
                <tr>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>🏦 Ingresos por Intereses (Cap. VI)</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Art. 133 LISR — Instituciones financieras y Cetes</div>
                  </td>
                  <td className="text-right">{fmt(intereses?.nominal || 0)}</td>
                  <td className="text-right text-muted">Ajuste inflación</td>
                  <td className="text-right font-medium" style={{ color: '#3b82f6', fontWeight: 800 }}>{fmt(ingIntereses)}</td>
                  <td className="text-right" style={{ color: '#059669', fontWeight: 800 }}>{fmt(isrIntereses)}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr style={{ background: '#f8fafc', fontWeight: 900 }}>
                  <td>TOTALES CONSOLIDADOS</td>
                  <td className="text-right">{fmt((sueldos?.total_ingresos || 0) + aeypSubtotalTotal + (intereses?.nominal || 0))}</td>
                  <td className="text-right">—</td>
                  <td className="text-right" style={{ color: '#1e3a8a', fontSize: '1rem' }}>{fmt(totalAcumulables)}</td>
                  <td className="text-right" style={{ color: '#059669', fontSize: '1rem' }}>{fmt(totalAcreditables)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {activeTabRegimen === 'tarifa' && (
          <div>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1rem 0' }}>
              Tarifa anual progresiva del <strong>Artículo 152 LISR vigente para {year}</strong>. El renglón aplicable a tu base gravable ({fmt(baseGravableReal)}) está resaltado:
            </p>
            <div className="table-responsive">
              <table className="sat-table" style={{ fontSize: '0.82rem' }}>
                <thead>
                  <tr>
                    <th>Límite Inferior</th>
                    <th>Límite Superior</th>
                    <th>Cuota Fija</th>
                    <th className="text-right">% Sobre Excedente</th>
                    <th className="text-right">Estatus</th>
                  </tr>
                </thead>
                <tbody>
                  {tarifaActual.map((row, idx) => {
                    const isMyRow = baseGravableReal >= row.li && baseGravableReal <= row.ls;
                    return (
                      <tr key={idx} style={{
                        background: isMyRow ? '#ecfdf5' : idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                        borderLeft: isMyRow ? '4px solid #10b981' : 'none',
                        fontWeight: isMyRow ? 800 : 400
                      }}>
                        <td>{fmt(row.li)}</td>
                        <td>{row.ls === Infinity ? 'En adelante' : fmt(row.ls)}</td>
                        <td>{fmt(row.cuota)}</td>
                        <td className="text-right">{(row.tasa * 100).toFixed(2)}%</td>
                        <td className="text-right">
                          {isMyRow ? (
                            <span style={{ background: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 800 }}>
                              📍 Tu Tramo
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </SectionCard>

    </div>
  );
};
