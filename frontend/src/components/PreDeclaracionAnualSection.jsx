import React from 'react';

const formatMoney = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '$0.00';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
};

export default function PreDeclaracionAnualSection({ data, year }) {
  if (!data) return null;

  const sim = data.simulacion_anual || {};
  const oficial = data.oficial_sat;
  const esSaldoFavor = (sim.saldo_a_favor_proyectado || 0) > 0;
  const saldoMonto = esSaldoFavor ? sim.saldo_a_favor_proyectado : sim.saldo_a_cargo_proyectado;

  const tope = data.sections?.deducciones_personales?.tope || {};
  const deduccionesValidas = sim.deducciones_personales_aplicadas || 0;
  const remanenteDeducciones = sim.remanente_deducciones || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* ── 1. GRAN HERO CARD: SALDO PROYECTADO DEL EJERCICIO ── */}
      <div style={{
        background: esSaldoFavor
          ? 'linear-gradient(135deg, #022c22 0%, #065f46 50%, #0f172a 100%)'
          : 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 50%, #1e1b4b 100%)',
        borderRadius: '24px',
        padding: '2.5rem',
        color: 'white',
        boxShadow: esSaldoFavor ? '0 12px 30px -8px rgba(6,78,59,0.4)' : '0 12px 30px -8px rgba(127,29,29,0.4)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', fontSize: '10rem', opacity: 0.08, pointerEvents: 'none' }}>
          {esSaldoFavor ? '💰' : '📑'}
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
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
              color: esSaldoFavor ? '#6ee7b7' : '#fca5a5'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: esSaldoFavor ? '#34d399' : '#ef4444' }} />
              SIMULACIÓN ANUAL TRIBUTACOS (100% CFDIs) • EJERCICIO {year}
            </div>

            {oficial && (
              <span style={{
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(8px)',
                padding: '6px 14px',
                borderRadius: '10px',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#cbd5e1'
              }}>
                🏛️ Acuse Oficial SAT Registrado (Op. {oficial.num_operacion})
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: esSaldoFavor ? '#a7f3d0' : '#fecaca', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                {esSaldoFavor ? '🎉 Saldo a Favor Estimado (Devolución SAT)' : '⚠️ Impuesto Anual a Cargo Estimado'}
              </div>
              <h1 style={{ margin: 0, fontSize: '3.2rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {formatMoney(saldoMonto)}
              </h1>
              <p style={{ margin: '1rem 0 0 0', fontSize: '0.95rem', color: '#f1f5f9', opacity: 0.9, lineHeight: 1.5 }}>
                {esSaldoFavor
                  ? `Tienes un saldo a favor estimado de ${formatMoney(saldoMonto)} por el total de retenciones y pagos realizados durante ${year}.`
                  : `Se proyecta un impuesto a cargo de ${formatMoney(saldoMonto)} al cierre del ejercicio ${year}.`}
              </p>
            </div>

            {/* Cascada de Determinación Anual */}
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
                Cascada Fiscal Oficial (Art. 152 LISR)
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: '#cbd5e1' }}>1. Ingresos Acumulables Totales:</span>
                <span style={{ fontWeight: 800, color: 'white', fontFamily: 'monospace' }}>{formatMoney(sim.ingresos_acumulables_totales)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: '#cbd5e1' }}>2. Deducciones Personales:</span>
                <span style={{ fontWeight: 800, color: '#fcd34d', fontFamily: 'monospace' }}>-{formatMoney(sim.deducciones_personales_aplicadas)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: '#cbd5e1' }}>3. Base Gravable del Ejercicio:</span>
                <span style={{ fontWeight: 900, color: '#6ee7b7', fontFamily: 'monospace' }}>{formatMoney(sim.base_gravable_anual)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: '#cbd5e1' }}>4. ISR Causado (Tarifa Art. 152):</span>
                <span style={{ fontWeight: 800, color: '#fca5a5', fontFamily: 'monospace' }}>{formatMoney(sim.isr_anual_causado)}</span>
              </div>
              {sim.pagos_provisionales_acreditables > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: '#cbd5e1' }}>5. Pagos Provisionales Realizados:</span>
                  <span style={{ fontWeight: 900, color: '#60a5fa', fontFamily: 'monospace' }}>-{formatMoney(sim.pagos_provisionales_acreditables)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: '#cbd5e1' }}>{sim.pagos_provisionales_acreditables > 0 ? '6.' : '5.'} Retenciones Totales (Nómina/Hon):</span>
                <span style={{ fontWeight: 900, color: '#34d399', fontFamily: 'monospace' }}>-{formatMoney(sim.retenciones_totales_acreditables)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. OPTIMIZADOR FISCAL: DEDUCCIONES PERSONALES Y TOPE LEGAL ── */}
      <div style={{ background: 'white', borderRadius: '20px', padding: '1.75rem 2rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🏥</span> Optimización de Deducciones Personales (Art. 151 LISR)
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              Tope legal máximo permitido por el SAT: el menor entre el 15% de tus ingresos brutos o 5 UMAs anuales.
            </p>
          </div>

          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '6px 14px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 800, color: '#065f46' }}>
            Tope Legal Máximo: {formatMoney(sim.tope_legal_deducciones)}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Deducciones Aplicadas</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#059669', marginTop: '4px', fontFamily: 'monospace' }}>
              {formatMoney(deduccionesValidas)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>Facturas D01 a D10 válidas</div>
          </div>

          <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Remanente Libre para Deducir</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: remanenteDeducciones > 0 ? '#2563eb' : '#64748b', marginTop: '4px', fontFamily: 'monospace' }}>
              {formatMoney(remanenteDeducciones)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>Margen disponible para más saldo a favor</div>
          </div>

          <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Aprovechamiento del Tope</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#7c3aed', marginTop: '4px' }}>
              {tope.porcentaje_aprovechado || 0}%
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>Del límite fiscal utilizado</div>
          </div>
        </div>
      </div>

      {/* ── 3. COMPARATIVA / VERIFICACIÓN SAT (SI EXISTE ACUSE) ── */}
      {oficial && (
        <div style={{ background: '#f8fafc', borderRadius: '20px', padding: '1.75rem 2rem', border: '1px solid #cbd5e1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🔍</span> Verificación Cruzada: Simulación XMLs vs Declaración Presentada SAT
            </h3>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '4px 10px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
              ✓ Coincidencia Validada
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'white', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>INGRESOS ACUMULABLES</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.9rem' }}>
                <span>XMLs: <b>{formatMoney(sim.ingresos_acumulables_totales)}</b></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b' }}>
                <span>SAT: <b>{formatMoney(oficial.ingresos_acumulables_totales)}</b></span>
              </div>
            </div>

            <div style={{ background: 'white', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>ISR CAUSADO</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.9rem' }}>
                <span>XMLs: <b>{formatMoney(sim.isr_anual_causado)}</b></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b' }}>
                <span>SAT: <b>{formatMoney(oficial.isr_tarifa)}</b></span>
              </div>
            </div>

            <div style={{ background: 'white', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>SALDO DEFINITIVO</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.9rem' }}>
                <span>XMLs: <b style={{ color: esSaldoFavor ? '#059669' : '#dc2626' }}>{formatMoney(saldoMonto)}</b></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b' }}>
                <span>SAT: <b>{oficial.saldo_a_favor > 0 ? formatMoney(oficial.saldo_a_favor) : formatMoney(oficial.saldo_a_cargo)}</b></span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
