import { useState, useMemo } from 'react';

const MONTH_NAMES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
];

const fmt = (val) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val ?? 0);

// ─── Shared UI primitives ────────────────────────────────────────────────────

const SectionCard = ({ icon, title, badge, children, accent }) => (
  <div className={`sec-card ${accent || ''}`}>
    <div className="sec-header">
      <span className="sec-icon">{icon}</span>
      <span className="sec-title">{title}</span>
      {badge != null && <span className="sec-badge">{badge}</span>}
    </div>
    <div className="sec-body">{children}</div>
  </div>
);

const KpiRow = ({ items }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
    {items.map((k, i) => (
      <div key={i} style={{
        background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8f0',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: k.accent === 'kpi-danger' ? '#ef4444' : (k.accent === 'kpi-accent' ? '#f59e0b' : '#3b82f6') }} />
        <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>{k.label}</div>
        <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>{fmt(k.value)}</div>
        {k.help && <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>{k.help}</div>}
      </div>
    ))}
  </div>
);

const InfoField = ({ label, value, help, accent }) => (
  <div className={`info-field ${accent || ''}`}>
    <div className="info-label">{label}</div>
    <div className="info-value">{fmt(value)}</div>
    {help && <div className="info-help">{help}</div>}
  </div>
);

const Pill = ({ text, color }) => (
  <span className={`pill pill-${color || 'gray'}`}>{text}</span>
);

const CalcStep = ({ label, value, op, highlight }) => (
  <div className={`calc-step ${highlight ? 'calc-highlight' : ''}`}>
    <span className="calc-op">{op}</span>
    <span className="calc-label">{label}</span>
    <span className="calc-value">{fmt(value)}</span>
  </div>
);

const ConceptCard = ({ title, value, accent, metaItems, badge }) => {
  let claveNumber = '';
  let cleanTitle = title;

  if (badge) {
    claveNumber = badge;
    cleanTitle = title;
  } else {
    const titleParts = title.split(' - ');
    claveNumber = titleParts[0].replace('Clave: ', '');
    // Solo si el formato coincide con 'Clave: '
    if (titleParts.length > 1 && titleParts[0].startsWith('Clave:')) {
      cleanTitle = titleParts.slice(1).join(' - ');
    }
  }
  
  const isGreen = accent === 'green';
  const isBlue = accent === 'blue';
  
  const colorBase = isGreen ? '#10b981' : (isBlue ? '#ef4444' : '#ef4444'); // Mantenemos el look and feel "rojo" por default o blue-to-red si el usuario prefiere ese contraste.
  const bgSoft = isGreen ? 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)' : 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)';
  const borderCol = isGreen ? '#a7f3d0' : '#fca5a5';
  const shadowHover = isGreen ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)';

  return (
    <div 
       style={{ 
         background: bgSoft, borderRadius: '16px', padding: '1.25rem', border: `1px solid ${borderCol}`,
         boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden'
       }}
       onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 20px -8px ${shadowHover}`; e.currentTarget.style.transition = 'all 0.3s ease'; }}
       onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.02)'; }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: colorBase }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: colorBase, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {claveNumber}
            </span>
            <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b', lineHeight: '1.2' }}>
              {cleanTitle}
            </span>
         </div>
      </div>
      <div style={{ fontSize: '1.75rem', fontWeight: 900, color: colorBase, marginBottom: '1.25rem', letterSpacing: '-0.02em' }}>
        {fmt(value)}
      </div>

      {metaItems && metaItems.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px dashed #cbd5e1', paddingTop: '1rem', marginTop: 'auto' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            <span style={{ display: 'block', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase', fontSize: '0.65rem' }}>Conceptos reportados</span>
            <span style={{ color: '#475569', lineHeight: '1.4' }}>{metaItems[0].value}</span>
          </div>
          {metaItems.length > 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: 'rgba(255,255,255,0.7)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.04)' }}>
               {metaItems.slice(1).map((m, i) => (
                 <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                   <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>{m.label}</span>
                   <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>{m.value}</span>
                 </div>
               ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Tab Navigation ─────────────────────────────────────────────────────────

export const TabNavigation = ({ tabs, activeTab, onTabChange }) => (
  <div className="tab-nav">
    {tabs.map(tab => (
      <button
        key={tab.id}
        className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
        onClick={() => onTabChange(tab.id)}
      >
        <span className="tab-icon">{tab.icon}</span>
        <span>{tab.label}</span>
        {tab.count !== undefined && <span className="tab-badge">{tab.count}</span>}
      </button>
    ))}
  </div>
);

// ─── SECCIÓN 1: Sueldos ──────────────────────────────────────────────────────

export const SueldosSection = ({ data, year }) => {
  const [selectedEmployer, setSelectedEmployer] = useState('Global');

  const { totalBruto, totalDeducciones, neto, percepcionesPorTipo, deduccionesPorTipo, kpiData, latestSalaries, tiempo } = useMemo(() => {
    if (!data) return {};
    
    let targetRecibos = [];
    let tmpKpi = { ingresos: 0, gravado: 0, exento: 0, isr: 0 };
    let sal = { sbc: null, sdi: null, sd: null };
    
    if (selectedEmployer === 'Global') {
       targetRecibos = (data.detalle || []).flatMap(emp => emp.recibos);
       tmpKpi = { ingresos: data.total_ingresos, gravado: data.gravado, exento: data.exento, isr: data.isr_retenido };
    } else {
       const emp = (data.detalle || []).find(e => e.nombre === selectedEmployer);
       if (emp) {
         targetRecibos = emp.recibos;
         tmpKpi = { ingresos: emp.gravado + emp.exento, gravado: emp.gravado, exento: emp.exento, isr: emp.isr };
         
         let latestRecibo = null;
         // Buscar el recibo regular más reciente (excluyendo finiquitos y liquidaciones)
         for (let i = emp.recibos.length - 1; i >= 0; i--) {
            const r = emp.recibos[i];
            const isFiniquito = r.percepciones.some(p => p.concepto.toLowerCase().includes('finiquito') || p.concepto.toLowerCase().includes('liquidac'));
            if (r.dias_pagados > 0 && r.percepciones.some(p => p.tipo === '001') && !isFiniquito) {
                latestRecibo = r;
                break;
            }
         }
         // Fallback si todos son irregulares
         if (!latestRecibo && emp.recibos.length > 0) {
             latestRecibo = emp.recibos[emp.recibos.length - 1];
         }

         if (latestRecibo && latestRecibo.raw_cfdi) {
            const raw = latestRecibo.raw_cfdi;
            sal.sbc = raw.salario_base_cot_apor;
            sal.sdi = raw.salario_diario_integrado;
            
            // Calcular SD estimado sumando TODOS los nodos 001 (Sueldo, Vacaciones ordinarias, etc.)
            const sueldos001 = latestRecibo.percepciones.filter(p => p.tipo === '001');
            const valSueldo = sueldos001.reduce((acc, p) => acc + (p.total || (p.gravado + p.exento)), 0);
            sal.sd = latestRecibo.dias_pagados > 0 ? (valSueldo / latestRecibo.dias_pagados).toFixed(2) : '-';
         }
       }
    }

    const allPercs = targetRecibos.flatMap(r => r.percepciones);
    const allDeds = targetRecibos.flatMap(r => r.deducciones);

    const calcPercs = Object.values(
       allPercs.reduce((acc, p) => {
         const tipoClave = p.tipo || 'S/C';
         if (!acc[tipoClave]) acc[tipoClave] = { clave: tipoClave, total: 0, gravado: 0, exento: 0, items: [] };
         acc[tipoClave].total += p.total || 0;
         acc[tipoClave].gravado += p.gravado || 0;
         acc[tipoClave].exento += p.exento || 0;
         if (p.concepto) acc[tipoClave].items.push(p.concepto.trim());
         return acc;
       }, {})
    ).sort((a,b) => b.total - a.total);

    const calcDeds = Object.values(
       allDeds.reduce((acc, d) => {
         const tipoClave = d.tipo || 'S/C';
         if (!acc[tipoClave]) acc[tipoClave] = { clave: tipoClave, total: 0, items: [] };
         acc[tipoClave].total += d.importe || 0;
         if (d.concepto) acc[tipoClave].items.push(d.concepto.trim());
         return acc;
       }, {})
    ).sort((a,b) => b.total - a.total);

    const tBruto = calcPercs.reduce((acc, p) => acc + p.total, 0);
    const tDed = calcDeds.reduce((acc, d) => acc + d.total, 0);

    const targetRecibosConSueldo = targetRecibos.filter(r => r.percepciones && r.percepciones.some(p => p.tipo === '001'));
    const totalDias = targetRecibosConSueldo.reduce((acc, r) => acc + (parseFloat(r.dias_pagados) || 0), 0);
    const meses = (totalDias / 30).toFixed(1);

    return { percepcionesPorTipo: calcPercs, deduccionesPorTipo: calcDeds, kpiData: tmpKpi, totalBruto: tBruto, totalDeducciones: tDed, neto: tBruto - tDed, latestSalaries: sal, tiempo: { totalDias, meses } };
  }, [data, selectedEmployer]);

  if (!data || !percepcionesPorTipo) return null;

  return (
    <SectionCard icon="👥" title="Sueldos, salarios y asimilados">
      
      {data.detalle && data.detalle.length > 0 && (
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
           <button 
             onClick={() => setSelectedEmployer('Global')}
             style={{ 
               padding: '0.6rem 1.2rem', borderRadius: '30px', cursor: 'pointer', border: 'none',
               background: selectedEmployer === 'Global' ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : '#f1f5f9',
               color: selectedEmployer === 'Global' ? 'white' : '#475569',
               fontWeight: selectedEmployer === 'Global' ? '700' : '500',
               boxShadow: selectedEmployer === 'Global' ? '0 4px 10px rgba(59, 130, 246, 0.4)' : 'none',
               transition: 'all 0.3s ease', fontSize: '0.9rem'
             }}
           >
             🌐 Portafolio Global
           </button>
           {data.detalle.map((emp, i) => (
             <button 
               key={i}
               onClick={() => setSelectedEmployer(emp.nombre)}
               style={{ 
                 padding: '0.6rem 1.2rem', borderRadius: '30px', cursor: 'pointer', border: 'none',
                 background: selectedEmployer === emp.nombre ? 'linear-gradient(135deg, #10b981, #059669)' : '#f1f5f9',
                 color: selectedEmployer === emp.nombre ? 'white' : '#475569',
                 fontWeight: selectedEmployer === emp.nombre ? '700' : '500',
                 boxShadow: selectedEmployer === emp.nombre ? '0 4px 10px rgba(16, 185, 129, 0.4)' : 'none',
                 transition: 'all 0.3s ease', fontSize: '0.9rem'
               }}
             >
               🏢 {emp.nombre.length > 25 ? emp.nombre.substring(0, 25) + '...' : emp.nombre}
             </button>
           ))}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '2rem', alignItems: 'center', background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,1) 100%)', backdropFilter: 'blur(12px)', borderRadius: '24px', padding: '2.5rem 2rem', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.03)', marginBottom: '3rem' }}>
         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: '1 1 200px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Masa Bruta Anual</span>
            <span style={{ fontSize: '2.75rem', fontWeight: 900, background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em', lineHeight: '1' }}>{fmt(totalBruto)}</span>
            {tiempo && tiempo.totalDias > 0 && parseFloat(tiempo.meses) > 0 && (
              <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 700, marginTop: '16px', background: '#f1f5f9', padding: '6px 16px', borderRadius: '16px' }}>
                Promedio: {fmt(totalBruto / tiempo.meses)} <span style={{opacity:0.6, marginLeft: '4px'}}>({tiempo.meses}m)</span>
              </div>
            )}
         </div>
         <div style={{ height: '48px', width: '48px', borderRadius: '24px', background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontSize: '1.75rem', fontWeight: 900, boxShadow: '0 4px 6px -1px rgba(239,68,68,0.1)' }}>−</div>
         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: '1 1 200px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Retenciones Fiscales</span>
            <span style={{ fontSize: '2.75rem', fontWeight: 900, background: 'linear-gradient(135deg, #7f1d1d, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em', lineHeight: '1' }}>{fmt(totalDeducciones)}</span>
            {tiempo && tiempo.totalDias > 0 && parseFloat(tiempo.meses) > 0 && (
              <div style={{ fontSize: '0.9rem', color: '#ef4444', fontWeight: 700, marginTop: '16px', background: '#fef2f2', padding: '6px 16px', borderRadius: '16px' }}>
                Impacto Mensual: {fmt(totalDeducciones / tiempo.meses)}
              </div>
            )}
         </div>
         <div style={{ height: '48px', width: '48px', borderRadius: '24px', background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontSize: '1.75rem', fontWeight: 900, boxShadow: '0 4px 6px -1px rgba(16,185,129,0.1)' }}>=</div>
         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: '1 1 200px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Liquidez Neta Libre</span>
            <span style={{ fontSize: '2.75rem', fontWeight: 900, background: 'linear-gradient(135deg, #064e3b, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em', lineHeight: '1' }}>{fmt(neto)}</span>
            {tiempo && tiempo.totalDias > 0 && parseFloat(tiempo.meses) > 0 && (
              <div style={{ fontSize: '0.9rem', color: '#10b981', fontWeight: 700, marginTop: '16px', background: '#ecfdf5', padding: '6px 16px', borderRadius: '16px' }}>
                Libre Mensual: {fmt(neto / tiempo.meses)}
              </div>
            )}
         </div>
      </div>

      <KpiRow items={[
        { label: 'Ingreso total (Base SAT)', value: kpiData.ingresos, help: 'Gravado + Exento' },
        { label: 'Ingreso gravado (acumulable)', value: kpiData.gravado, accent: 'kpi-accent' },
        { label: 'Ingreso exento', value: kpiData.exento },
        { label: 'ISR retenido', value: kpiData.isr, accent: 'kpi-danger' },
      ]} />
      
      {selectedEmployer !== 'Global' && latestSalaries && (latestSalaries.sbc || latestSalaries.sdi || latestSalaries.sd) && (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.5rem', marginBottom: '2.5rem' }}>
         <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--gray)', fontWeight: '600', textTransform: 'uppercase' }}>Salario Diario (SD)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--dark)' }}>{latestSalaries.sd === '-' ? '-' : fmt(latestSalaries.sd)}</div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Estimado sueldo/días</div>
         </div>
         <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--gray)', fontWeight: '600', textTransform: 'uppercase' }}>Sal. Diario Integrado (SDI)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--dark)' }}>{latestSalaries.sdi ? fmt(latestSalaries.sdi) : '-'}</div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Dato del XML (Base SAT)</div>
         </div>
         <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--gray)', fontWeight: '600', textTransform: 'uppercase' }}>Salario Base de Cotización (SBC)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--dark)' }}>{latestSalaries.sbc ? fmt(latestSalaries.sbc) : '-'}</div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Dato del XML (Aportaciones)</div>
         </div>
      </div>
      )}

      <div style={{ marginTop: '2.5rem' }}>
        <h4 style={{ marginBottom: '1rem', color: 'var(--green)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          📈 Lo que ganaste (Percepciones)
        </h4>
        <div className="concept-grid">
          {percepcionesPorTipo.length === 0 ? (
             <p style={{color: 'var(--gray)', fontSize: '0.85rem'}}>No hay percepciones registradas.</p>
          ) : (
            percepcionesPorTipo.map((g, i) => (
              <ConceptCard
                key={'gp'+i}
                title={`Clave: ${g.clave} - ${Array.from(new Set(g.items))[0] || 'Varios'}`}
                value={g.total}
                accent="green"
                metaItems={[
                  { label: 'Detalle', value: Array.from(new Set(g.items)).join(', ') },
                  { label: 'Gravado', value: fmt(g.gravado) },
                  { label: 'Exento', value: fmt(g.exento) }
                ]}
              />
            ))
          )}
        </div>
      </div>

      <div style={{ marginTop: '2.5rem' }}>
        <h4 style={{ marginBottom: '1rem', color: 'var(--red)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          📉 Lo que te descontaron (Deducciones e Impuestos)
        </h4>
        <div className="concept-grid">
          {deduccionesPorTipo.length === 0 ? (
             <p style={{color: 'var(--gray)', fontSize: '0.85rem'}}>No hay deducciones registradas.</p>
          ) : (
            deduccionesPorTipo.map((g, i) => (
              <ConceptCard
                key={'gd'+i}
                title={`Clave: ${g.clave} - ${Array.from(new Set(g.items))[0] || 'Varios'}`}
                value={g.total}
                accent="red"
                metaItems={[
                  { label: 'Detalle', value: Array.from(new Set(g.items)).join(', ') }
                ]}
              />
            ))
          )}
        </div>
      </div>

    </SectionCard>
  );
};

// ─── SECCIÓN 1.5: Nómina Detallada (Recibos Virtuales) ───────────────────────

const ReciboNomina = ({ recibo, onViewCfdi, onViewXml }) => {
  const [expanded, setExpanded] = useState(false);
  
  if (!recibo) return null;
  
  return (
    <div className="nomina-recibo-card">
      <div 
        className="nomina-recibo-header" 
        onClick={() => setExpanded(!expanded)}
      >
        <div className="nomina-recibo-summary">
          <div className="nomina-fechas">
            <strong>{recibo.fecha}</strong>
            <span>Periodo: {recibo.fecha_inicial} - {recibo.fecha_final} ({recibo.dias_pagados} días)</span>
          </div>
          <div className="nomina-kpis">
            <div className="nomina-kpi-min">
              <span className="label">Bruto</span>
              <span className="val">{fmt(recibo.total_bruto)}</span>
            </div>
            <div className="nomina-kpi-min">
              <span className="label">ISR Ret.</span>
              <span className="val text-danger">-{fmt(recibo.isr_retenido)}</span>
            </div>
            <div className="nomina-kpi-min">
              <span className="label">Deducciones</span>
              <span className="val text-danger">-{fmt(recibo.total_deducciones)}</span>
            </div>
            <div className="nomina-kpi-min highlighted">
              <span className="label">NETO A PAGAR</span>
              <span className="val">{fmt(recibo.neto)}</span>
            </div>
          </div>
          <div className="nomina-expand-icon">
            {expanded ? '▲' : '▼'}
          </div>
        </div>
      </div>
      
      {expanded && (
        <div className="nomina-recibo-body animate-fade-in">
          <div className="nomina-ticket-grid">
            {/* PERCEPCIONES */}
            <div className="nomina-ticket-col">
              <h4>Percepciones</h4>
              <div className="nomina-ticket-items">
                <div className="nomina-ticket-row header">
                  <span>Concepto</span>
                  <span>Importe</span>
                </div>
                {recibo.percepciones.length === 0 && <div className="nomina-ticket-row empty">No hay percepciones detalladas</div>}
                {recibo.percepciones.map((p, idx) => (
                  <div className="nomina-ticket-row" key={'p'+idx}>
                    <span className="concepto"><span className="clave">{p.tipo}</span> {p.concepto}</span>
                    <span className="importe">{fmt(p.total)}</span>
                  </div>
                ))}
                <div className="nomina-ticket-row total">
                  <span>Suma Percepciones</span>
                  <span>{fmt(recibo.total_bruto)}</span>
                </div>
              </div>
            </div>
            
            {/* DEDUCCIONES */}
            <div className="nomina-ticket-col">
              <h4>Deducciones</h4>
              <div className="nomina-ticket-items">
                <div className="nomina-ticket-row header">
                  <span>Concepto</span>
                  <span>Importe</span>
                </div>
                {recibo.deducciones.length === 0 && <div className="nomina-ticket-row empty">No hay deducciones detalladas</div>}
                {recibo.deducciones.map((d, idx) => (
                  <div className="nomina-ticket-row" key={'d'+idx}>
                    <span className="concepto"><span className="clave">{d.tipo}</span> {d.concepto}</span>
                    <span className="importe text-danger">{fmt(d.importe)}</span>
                  </div>
                ))}
                <div className="nomina-ticket-row total">
                  <span>Suma Deducciones</span>
                  <span className="text-danger">{fmt(recibo.total_deducciones)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="nomina-ticket-footer">
            <div className="uuid-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              Folio: 
              <button 
                onClick={(e) => { e.stopPropagation(); if (onViewCfdi) onViewCfdi(recibo.raw_cfdi); }}
                style={{ 
                  background: '#e0f2fe', border: 'none', padding: '3px 8px', borderRadius: '4px',
                  color: '#2563eb', textDecoration: 'underline', fontWeight: '600',
                  cursor: 'pointer', fontFamily: 'monospace', fontSize: '11px', transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.target.style.color = '#1d4ed8'}
                onMouseLeave={e => e.target.style.color = '#2563eb'}
              >
                {recibo.uuid}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); if (onViewXml) onViewXml(recibo.raw_cfdi); }}
                style={{
                  background: 'none', border: '1px solid #cbd5e1', padding: '2px 6px', borderRadius: '4px',
                  color: '#64748b', cursor: 'pointer', fontSize: '10px', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: '4px'
                }}
                onMouseEnter={e => { e.target.style.background = '#f1f5f9'; e.target.style.color = '#334155'; }}
                onMouseLeave={e => { e.target.style.background = 'none'; e.target.style.color = '#64748b'; }}
                title="Ver estructura subyacente del CFDI"
              >
                <span role="img" aria-label="code" style={{ fontSize: '11px' }}>💻</span> JSON
              </button>
              {recibo.raw_cfdi?.filename && (
                <button
                  onClick={(e) => { e.stopPropagation(); window.open(`http://localhost:8010/api/download_xml?filename=${recibo.raw_cfdi.filename}`, '_blank'); }}
                  style={{
                    background: 'none', border: '1px solid #cbd5e1', padding: '2px 6px', borderRadius: '4px',
                    color: '#64748b', cursor: 'pointer', fontSize: '10px', transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', gap: '4px'
                  }}
                  onMouseEnter={e => { e.target.style.background = '#f1f5f9'; e.target.style.color = '#334155'; }}
                  onMouseLeave={e => { e.target.style.background = 'none'; e.target.style.color = '#64748b'; }}
                  title="Descargar archivo original (.xml)"
                >
                  <span role="img" aria-label="download" style={{ fontSize: '11px' }}>⬇️</span> XML
                </button>
              )}
            </div>
            <div className="neto-final">
              Neto a Pagar: <strong>{fmt(recibo.neto)}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
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

// ─── SECCIÓN 2: AEyP / Honorarios ────────────────────────────────────────────

export function HonorariosSection({ data, year }) {
  const [selectedClient, setSelectedClient] = useState('Global');
  if (!data) return null;

  const clients = useMemo(() => {
    if (!data.detalle) return [];
    const dict = {};
    data.detalle.forEach(d => {
      const key = d.rfc || d.cliente;
      if (!dict[key]) dict[key] = d.cliente;
      else if (d.cliente && d.cliente.length < dict[key].length) dict[key] = d.cliente; // Prefer shorter names
    });
    return Object.entries(dict).map(([rfc, nombre]) => ({ rfc, nombre })).sort((a,b) => a.nombre.localeCompare(b.nombre));
  }, [data.detalle]);

  const targetRecibos = useMemo(() => {
    if (selectedClient === 'Global') return data.detalle || [];
    return data.detalle?.filter(d => (d.rfc || d.cliente) === selectedClient) || [];
  }, [data.detalle, selectedClient]);

  // Calculamos montos totales puros (solo INGRESO EMITIDO) filtrados
  const sumSubtotal = targetRecibos.reduce((acc, curr) => acc + curr.subtotal, 0);
  const sumIva = targetRecibos.reduce((acc, curr) => acc + curr.iva, 0);
  const sumIsrRet = targetRecibos.reduce((acc, curr) => acc + curr.isr_ret, 0);
  const sumIvaRet = targetRecibos.reduce((acc, curr) => acc + curr.iva_ret, 0);
  const cobradoBruto = sumSubtotal + sumIva;
  const sumRetenciones = sumIsrRet + sumIvaRet;
  const totalPagadoEfectivo = cobradoBruto - sumRetenciones;

  // Recalcular conceptos según el filtro
  const calcConceptos = useMemo(() => {
    const cons = {};
    targetRecibos.forEach(r => {
      (r.conceptos || []).forEach(c => {
         const clave = c.clave || '00000000';
         if (!cons[clave]) {
             cons[clave] = {
                 clave: clave,
                 desc_sat: c.desc_sat || c.desc || 'Servicio profesional',
                 importe: 0,
                 no_ids: new Set()
             };
         }
         cons[clave].importe += c.imp || 0;
         
         // Agregamos el NoIdentificacion a la lista si no está vacío y difiere de la descripción base
         if (c.no_id && c.no_id.trim() !== '' && c.no_id.toLowerCase() !== c.desc.toLowerCase()) {
             cons[clave].no_ids.add(c.no_id.trim());
         }
      });
    });
    return Object.values(cons).map(item => ({
       ...item,
       no_ids: Array.from(item.no_ids)
    })).sort((a,b) => b.importe - a.importe);
  }, [targetRecibos]);

  return (
    <SectionCard icon="💼" title="Facturación Emitida (AEyP)">
      <p className="sec-note">
        Base de cálculo: <strong>Facturas PUE (Pagadas en una exhibición)</strong>. 
        Muestra la radiografía cruda de tus cobros a lo largo del <strong>ejercicio {year}</strong>.
      </p>

      {clients.length > 0 && (
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
           <button 
             onClick={() => setSelectedClient('Global')}
             style={{ 
               padding: '0.6rem 1.2rem', borderRadius: '30px', cursor: 'pointer', border: 'none',
               background: selectedClient === 'Global' ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : '#f1f5f9',
               color: selectedClient === 'Global' ? 'white' : '#475569',
               fontWeight: selectedClient === 'Global' ? '700' : '500',
               boxShadow: selectedClient === 'Global' ? '0 4px 10px rgba(59, 130, 246, 0.4)' : 'none',
               transition: 'all 0.3s ease', fontSize: '0.9rem'
             }}
           >
             🌐 Portafolio Global
           </button>
           {clients.map((cli, i) => (
             <button 
               key={i}
               onClick={() => setSelectedClient(cli.rfc)}
               style={{ 
                 padding: '0.6rem 1.2rem', borderRadius: '30px', cursor: 'pointer', border: 'none',
                 background: selectedClient === cli.rfc ? 'linear-gradient(135deg, #10b981, #059669)' : '#f1f5f9',
                 color: selectedClient === cli.rfc ? 'white' : '#475569',
                 fontWeight: selectedClient === cli.rfc ? '700' : '500',
                 boxShadow: selectedClient === cli.rfc ? '0 4px 10px rgba(16, 185, 129, 0.4)' : 'none',
                 transition: 'all 0.3s ease', fontSize: '0.9rem'
               }}
             >
               🏢 {cli.nombre}
             </button>
           ))}
        </div>
      )}

      <KpiRow items={[
        { label: 'Subtotal Facturado', value: sumSubtotal, accent: 'kpi-accent', help: 'Ingreso Base Acumulado' },
        { label: 'IVA Trasladado (16%)', value: sumIva, help: 'Dinero recaudado pero del SAT' },
        { label: 'Retenciones Sufridas', value: sumRetenciones, accent: 'kpi-danger', help: 'ISR e IVA retenido por clientes' },
      ]} />

      <div className="waterfall-summary" style={{ marginTop: '2rem' }}>
        <div className="waterfall-item">
          <span>Facturado Bruto (Sub+IVA)</span>
          <strong style={{ color: 'var(--blue)' }}>{fmt(cobradoBruto)}</strong>
        </div>
        <div className="waterfall-op">−</div>
        <div className="waterfall-item">
          <span>El «Peaje» (Retenciones)</span>
          <strong style={{ color: 'var(--red)' }}>{fmt(Math.abs(sumRetenciones))}</strong>
        </div>
        <div className="waterfall-op">=</div>
        <div className="waterfall-item">
          <span>Neto Depositado / Efectivo</span>
          <strong style={{ color: 'var(--green)' }}>{fmt(totalPagadoEfectivo)}</strong>
        </div>
      </div>

      <div className="animate-fade-in" style={{ marginTop: '2.5rem' }}>
        <h3 style={{ fontSize: '1.05rem', color: 'var(--blue)', marginBottom: '1rem' }}>Desglose de Conceptos Billed</h3>
        <div className="concept-grid">
          {calcConceptos.map((c, i) => (
            <ConceptCard
              key={i}
              title={c.desc_sat} // Título principal (Descripción capitalizada)
              value={c.importe}
              accent="blue"
              badge={c.clave} // Código fiscal SAT de 8 dígitos
              metaItems={c.no_ids.length > 0 ? [{ label: 'Conceptos reportados', value: c.no_ids.join(' • ') }] : []}
            />
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

export function AnaliticaAeypSection({ data, year }) {
  if (!data || !data.detalle) return null;

  const monthMaps = {};
  data.detalle.forEach(item => {
    const month = parseInt(item.fecha.split('-')[1]);
    const monthName = MONTH_NAMES[month - 1].slice(0, 3);
    if (!monthMaps[monthName]) monthMaps[monthName] = { name: monthName, Subtotal: 0, Neto: 0 };
    monthMaps[monthName].Subtotal += item.subtotal;
    monthMaps[monthName].Neto += item.total;
  });
  
  // Rellenar meses vacíos
  const mensualData = MONTH_NAMES.map(m => {
    const name = m.slice(0, 3);
    return monthMaps[name] || { name, Subtotal: 0, Neto: 0 };
  });

  const clientGroups = {};
  data.detalle.forEach(item => {
    const key = item.rfc || item.cliente;
    if (!clientGroups[key]) clientGroups[key] = { name: item.cliente, value: 0 };
    else if (item.cliente && item.cliente.length < clientGroups[key].name.length) clientGroups[key].name = item.cliente; // Prefer shorter names
    
    // El usuario pidió considerar el IVA en los totales de concentración / facturación
    clientGroups[key].value += (item.subtotal + item.iva);
  });
  const clientData = Object.values(clientGroups).sort((a,b) => b.value - a.value);

  return (
    <SectionCard icon="📈" title="Evolución de Facturación (AEyP)">
      <p className="sec-note">Auditoría visual interactiva de tus ingresos mes a mes y concentración financiera de clientes.</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '2rem', marginTop: '2rem' }}>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
          <h4 style={{ margin: '0 0 1.5rem 0', color: 'var(--text-2)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Curva de Facturación vs Liquidez
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mensualData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(val) => '$'+(val/1000)+'k'} tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
              <Tooltip formatter={(val) => fmt(val)} cursor={{ fill: '#f1f5f9' }} />
              <Legend iconType="circle" />
              <Bar dataKey="Subtotal" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Subtotal Facturado" />
              <Line type="monotone" dataKey="Neto" stroke="var(--blue)" strokeWidth={4} dot={{r:4}} isAnimationActive={false} name="Neto Depositado" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-2)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>
            Top Clientes (Concentración)
          </h4>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={clientData.slice(0, 5)} 
                cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {clientData.map((e, idx) => <Cell key={`c-${idx}`} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(val) => fmt(val)} />
              <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </SectionCard>
  );
}

const ReciboAeyp = ({ recibo, onViewCfdi, onViewXml }) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="nomina-recibo-card">
      <div className="nomina-recibo-header" onClick={() => setExpanded(!expanded)}>
        <div className="nomina-recibo-summary">
          <div className="nomina-fechas">
            <strong>{recibo.fecha}</strong>
            <span style={{fontFamily: 'monospace', fontSize: '11px'}}>{recibo.uuid?.split('-')[0]}***</span>
          </div>
          <div className="nomina-kpis">
            <div className="nomina-kpi-min">
              <span className="label">Subtotal PUE</span>
              <span className="val">{fmt(recibo.subtotal)}</span>
            </div>
            <div className="nomina-kpi-min">
              <span className="label">Retenciones</span>
              <span className="val text-danger">{fmt(recibo.isr_ret + recibo.iva_ret)}</span>
            </div>
            <div className="nomina-kpi-min highlighted">
              <span className="label">Cobro Neto</span>
              <span className="val">{fmt(recibo.total)}</span>
            </div>
          </div>
          <div className="nomina-expand-icon">
            {expanded ? '▲' : '▼'}
          </div>
        </div>
      </div>
      
      {expanded && (
        <div className="nomina-recibo-body animate-fade-in">
          <div className="nomina-ticket-grid">
            <div className="nomina-ticket-col">
              <h4>Servicios Facturados</h4>
              <div className="nomina-ticket-items">
                <div className="nomina-ticket-row header">
                  <span>Concepto</span>
                  <span>Importe Base</span>
                </div>
                {(recibo.conceptos || []).map((c, idx) => (
                  <div className="nomina-ticket-row" key={'aeyp-c'+idx}>
                    <span className="concepto">{c.desc}</span>
                    <span className="importe">{fmt(c.imp)}</span>
                  </div>
                ))}
                <div className="nomina-ticket-row total">
                  <span>Subtotal</span>
                  <span>{fmt(recibo.subtotal)}</span>
                </div>
              </div>
            </div>
            
            <div className="nomina-ticket-col">
              <h4>Impuestos (Traslados y Retenciones)</h4>
              <div className="nomina-ticket-items">
                <div className="nomina-ticket-row header">
                  <span>Rubro Fiscal</span>
                  <span>Monto</span>
                </div>
                {recibo.iva > 0 && (
                  <div className="nomina-ticket-row">
                     <span className="concepto"><span className="clave">002</span> IVA Trasladado</span>
                     <span className="importe">{fmt(recibo.iva)}</span>
                  </div>
                )}
                {recibo.isr_ret > 0 && (
                  <div className="nomina-ticket-row">
                     <span className="concepto"><span className="clave">001</span> Retención ISR</span>
                     <span className="importe text-danger">{fmt(recibo.isr_ret)}</span>
                  </div>
                )}
                {recibo.iva_ret > 0 && (
                  <div className="nomina-ticket-row">
                     <span className="concepto"><span className="clave">002</span> Retención IVA</span>
                     <span className="importe text-danger">{fmt(recibo.iva_ret)}</span>
                  </div>
                )}
                <div className="nomina-ticket-row total">
                  <span>Total Retenciones</span>
                  <span className="text-danger">{fmt(recibo.isr_ret + recibo.iva_ret)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="nomina-ticket-footer">
             <div className="uuid-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                Folio: 
                <button 
                  onClick={(e) => { e.stopPropagation(); if (onViewCfdi) onViewCfdi(recibo.raw_cfdi); }}
                  style={{ 
                    background: '#e0f2fe', border: 'none', padding: '3px 8px', borderRadius: '4px',
                    color: '#2563eb', textDecoration: 'underline', fontWeight: '600',
                    cursor: 'pointer', fontFamily: 'monospace', fontSize: '11px', transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.target.style.color = '#1d4ed8'}
                  onMouseLeave={e => e.target.style.color = '#2563eb'}
                >
                  {recibo.uuid}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); if (onViewXml) onViewXml(recibo.raw_cfdi); }}
                  style={{ background: 'none', border: '1px solid #cbd5e1', padding: '2px 6px', borderRadius: '4px', color: '#64748b', cursor: 'pointer', fontSize: '10px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onMouseEnter={e => { e.target.style.background = '#f1f5f9'; e.target.style.color = '#334155'; }}
                  onMouseLeave={e => { e.target.style.background = 'none'; e.target.style.color = '#64748b'; }}
                  title="Ver estructura subyacente del CFDI en JSON"
                >
                  <span role="img" aria-label="code" style={{ fontSize: '11px' }}>💻</span> JSON
                </button>
                {recibo.raw_cfdi?.filename && (
                  <button
                    onClick={(e) => { e.stopPropagation(); window.open(`http://localhost:8010/api/download_xml?filename=${recibo.raw_cfdi.filename}`, '_blank'); }}
                    style={{ background: 'none', border: '1px solid #cbd5e1', padding: '2px 6px', borderRadius: '4px', color: '#64748b', cursor: 'pointer', fontSize: '10px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '4px' }}
                    onMouseEnter={e => { e.target.style.background = '#f1f5f9'; e.target.style.color = '#334155'; }}
                    onMouseLeave={e => { e.target.style.background = 'none'; e.target.style.color = '#64748b'; }}
                    title="Descargar archivo original (.xml)"
                  >
                    <span role="img" aria-label="download" style={{ fontSize: '11px' }}>⬇️</span> XML
                  </button>
                )}
             </div>
             <div className="neto-final">
                Neto Cobrado: <strong>{fmt(recibo.total)}</strong>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

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
        groups[key].nombre = item.cliente; // Prefer shorter names
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

  // Totales acumulados para el pie de tabla o resumen en tarjetas
  const totalSubtotal = data.detalle.reduce((acc, curr) => acc + curr.subtotal, 0);
  const totalIva = data.detalle.reduce((acc, curr) => acc + curr.iva, 0);
  const totalIsrRet = data.detalle.reduce((acc, curr) => acc + curr.isr_ret, 0);
  const totalIvaRet = data.detalle.reduce((acc, curr) => acc + curr.iva_ret, 0);
  const granTotalNeto = data.detalle.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
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
                  <span style={{color: 'var(--blue)'}}>Base: {fmt(grp.subtotal)}</span>
                  <span>IVA: {fmt(grp.iva)}</span>
                  <span style={{color: 'var(--red)'}}>Retenciones: {fmt(grp.isr_ret + grp.iva_ret)}</span>
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

// ─── SECCIÓN 2.5: Otros Ingresos (Notas de Crédito Recibidas) ─────────────────

export function OtrosIngresosSection({ data }) {
  if (!data || !data.detalle || data.detalle.length === 0) return null;
  return (
    <SectionCard icon="💰" title="Otros Ingresos (Notas de Crédito de Proveedores)">
      <p className="sec-note">
        CFDIs de tipo <strong>Egreso</strong> donde eres el receptor. Representan devoluciones, descuentos o bonificaciones que operan como ingreso contable.
      </p>

      <div className="kpi-grid">
        <div className="kpi-card kpi-accent">
          <span className="kpi-label">Total Otros Ingresos</span>
          <span className="kpi-value">{fmt(data.total)}</span>
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h4 style={{ marginBottom: '1rem', color: 'var(--text-color)', fontWeight: '600' }}>
          Conceptos de Notas de Crédito
        </h4>
        <div className="concept-grid">
          {(data.resumen_conceptos || []).map((it, idx) => (
            <ConceptCard
              key={idx}
              title={it.concepto}
              value={it.importe}
              accent="amber"
            />
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

// ─── SECCIÓN 3: Intereses ─────────────────────────────────────────────────────

export function InteresesSection({ data }) {
  const [showDetail, setShowDetail] = useState(false);
  if (!data) return null;
  return (
    <SectionCard icon="🏦" title="Intereses">
      <div 
        onClick={() => setShowDetail(!showDetail)} 
        style={{ cursor: 'pointer', transition: 'background 0.2s' }}
        className="collapsible-header-card"
        onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <p className="sec-note">
          Intereses generados por instituciones del sistema financiero. 
          El ISR es retenido directamente por el banco y solo los intereses reales son acumulables.
          <span style={{ visibility: 'visible', marginLeft: '0.5rem', fontWeight: 'bold' }}>
            {showDetail ? '▼ Ocultar detalle' : '▶ Ver detalle de movimientos'}
          </span>
        </p>
        <KpiRow items={[
          { label: 'Intereses nominales', value: data.nominal || 0, help: 'Informativo' },
          { label: 'Intereses reales', value: data.real || 0, help: 'Acumulables a la base gravable' },
          { label: 'ISR retenido', value: data.isr_retenido || 0, accent: 'kpi-danger', help: 'Acreditable contra ISR del ejercicio' },
        ]} />
      </div>

      {showDetail && data.detalle && (
        <div className="section-detail-table animate-fade-in" style={{ marginTop: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
          <table className="sat-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Institución / Emisor</th>
                <th style={{ textAlign: 'right' }}>Nominal</th>
                <th style={{ textAlign: 'right' }}>Real</th>
                <th style={{ textAlign: 'right' }}>ISR Retenido</th>
              </tr>
            </thead>
            <tbody>
              {data.detalle.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.fecha}</td>
                  <td style={{ fontWeight: '500' }}>{item.emisor}</td>
                  <td style={{ textAlign: 'right' }}>{fmt(item.nominal)}</td>
                  <td style={{ textAlign: 'right' }}>{fmt(item.real)}</td>
                  <td style={{ textAlign: 'right' }} className="val-danger">{fmt(item.retencion_isr)}</td>
                </tr>
              ))}
            </tbody>
            {data.detalle.length > 1 && (
              <tfoot>
                <tr style={{ fontWeight: 'bold', background: '#fcfcfc' }}>
                  <td colSpan="2">Total Detallado</td>
                  <td style={{ textAlign: 'right' }}>{fmt(data.nominal)}</td>
                  <td style={{ textAlign: 'right' }}>{fmt(data.real)}</td>
                  <td style={{ textAlign: 'right' }} className="val-danger">{fmt(data.isr_retenido)}</td>
                </tr>
              </tfoot>
            )}
          </table>
          {data.detalle.length === 0 && (
            <p style={{ textAlign: 'center', color: '#666', padding: '1rem' }}>No hay movimientos detallados para este periodo.</p>
          )}
        </div>
      )}
    </SectionCard>
  );
}

// ─── SECCIÓN 4: Determinación ISR ─────────────────────────────────────────────

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
  { li: 590796.00,    ls: 1127926.84, cuota: 110842.74,tasa: 0.3000 },
  { li: 1127926.85,   ls: 1503902.46, cuota: 271981.90,tasa: 0.3200 },
  { li: 1503902.47,   ls: 4511707.37, cuota: 392294.17,tasa: 0.3400 },
  { li: 4511707.38,   ls: Infinity,   cuota: 1414947.85,tasa: 0.3500 },
];

const ISR_TARIFA_2025 = [
  { li: 0,           ls: 8952.49,    cuota: 0,        tasa: 0.0192 },
  { li: 8952.50,     ls: 75984.55,   cuota: 171.88,   tasa: 0.0640 },
  { li: 75984.56,    ls: 133536.07,  cuota: 4461.94,  tasa: 0.1088 },
  { li: 133536.08,   ls: 155229.80,  cuota: 10723.55, tasa: 0.1600 },
  { li: 155229.81,   ls: 185852.57,  cuota: 14194.54, tasa: 0.1792 },
  { li: 185852.58,   ls: 374837.88,  cuota: 19682.13, tasa: 0.2136 },
  { li: 374837.89,   ls: 590795.99,  cuota: 60049.40, tasa: 0.2352 },
  { li: 590796.00,   ls: 1127926.84, cuota: 110842.74,tasa: 0.3000 },
  { li: 1127926.85,  ls: 1503902.46, cuota: 271981.99,tasa: 0.3200 },
  { li: 1503902.47,  ls: 4511707.37, cuota: 392294.17,tasa: 0.3400 },
  { li: 4511707.38,  ls: Infinity,   cuota: 1414947.85,tasa: 0.3500 },
];

function calcISR(base, year) {
  let tarifa = ISR_TARIFA_2024; // 2023 and 2024 are same
  if (year === '2022') tarifa = ISR_TARIFA_2022;
  if (year === '2025' || year === '2026') tarifa = ISR_TARIFA_2025;
  
  const row = tarifa.find(r => base >= r.li && base <= r.ls) || tarifa[tarifa.length - 1];
  const excedente = base - row.li;
  const marginal = excedente * row.tasa;
  const isr = row.cuota + marginal;
  return { isr, cuota: row.cuota, marginal, excedente, tasa: row.tasa, limiteInferior: row.li };
}


export const DeterminacionSection = ({ sections, summary, year }) => {
  if (!sections || !summary) return null;

  const sueldos = sections.sueldos;
  const honorarios = sections.honorarios;
  const intereses = sections.intereses;

  // Ingresos acumulables
  const ingSueldos = sueldos?.gravado || 0;
  const ingHonorarios = Math.max(0, (honorarios?.ingresos || 0) - (honorarios?.deducciones_autorizadas || 0));
  const ingIntereses = intereses?.real || 0;
  const totalAcumulables = ingSueldos + ingHonorarios + ingIntereses;

  // Deducciones personales (placeholder — SAT precarga)
  const dedPersonales = sections.deducciones_personales?.total || 0;

  const baseGravable = Math.max(0, totalAcumulables - dedPersonales);
  const { isr, cuota, marginal, excedente, tasa, limiteInferior } = calcISR(baseGravable, year);

  // Acreditables
  const isrSueldos = sueldos?.isr_retenido || 0;
  const isrHonorarios = honorarios?.isr_retenido || 0;
  const isrIntereses = intereses?.isr_retenido || 0;
  const totalAcreditables = isrSueldos + isrHonorarios + isrIntereses;

  const resultado = isr - totalAcreditables;
  const isACargo = resultado > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <SectionCard icon="🧮" title="Ingresos acumulables">
        <p className="sec-note">Suma de todos los ingresos del ejercicio que forman la base gravable del ISR.</p>
        <div className="calc-block">
          <CalcStep label="Sueldos y salarios (gravado)" value={ingSueldos} op="+" />
          <CalcStep label={ingHonorarios >= 0 ? "Utilidad fiscal AEyP" : "Pérdida fiscal AEyP (no acumula)"} value={ingHonorarios} op="+" />
          <CalcStep label="Intereses nominales" value={ingIntereses} op="+" />
          <CalcStep label="Total de ingresos acumulables" value={totalAcumulables} op="=" highlight />
        </div>
      </SectionCard>

      <SectionCard icon="📋" title="Base gravable del ISR">
        <p className="sec-note">Se restan las deducciones personales autorizadas (Art. 151 LISR) al total acumulable.</p>
        <div className="calc-block">
          <CalcStep label="Total ingresos acumulables" value={totalAcumulables} op=" " />
          <CalcStep label="Deducciones personales" value={dedPersonales} op="−" />
          <CalcStep label="Base gravable" value={baseGravable} op="=" highlight />
        </div>
      </SectionCard>

      <SectionCard icon="📊" title={`Cálculo del ISR (Tarifa Art. 152 LISR ${year})`}>
        <p className="sec-note">Se aplica la tarifa anual del ISR a la base gravable para determinar el impuesto del ejercicio.</p>
        <div className="calc-block">
          <CalcStep label="Base gravable" value={baseGravable} op=" " />
          <CalcStep label={`Límite inferior (renglón tarifa)`} value={limiteInferior} op="−" />
          <CalcStep label="Excedente del límite inferior" value={excedente} op="=" />
          <CalcStep label={`× Tasa marginal (${(tasa * 100).toFixed(2)}%)`} value={marginal} op="×" />
          <CalcStep label="+ Cuota fija del renglón" value={cuota} op="+" />
          <CalcStep label="ISR del ejercicio (Art. 152)" value={isr} op="=" highlight />
        </div>
      </SectionCard>

      <SectionCard icon="🧾" title="Pagos acreditables (retenciones y pagos provisionales)">
        <p className="sec-note">ISR ya pagado durante el año, ya sea por retención de patrones/clientes o pagos provisionales propios.</p>
        <div className="calc-block">
          <CalcStep label="ISR retenido por sueldos (patrones)" value={isrSueldos} op=" " />
          <CalcStep label="ISR retenido por clientes (honorarios)" value={isrHonorarios} op="+" />
          <CalcStep label="ISR retenido por intereses (bancos)" value={isrIntereses} op="+" />
          <CalcStep label="Total de pagos acreditables" value={totalAcreditables} op="=" highlight />
        </div>
      </SectionCard>

      <SectionCard
        icon={isACargo ? "⚠️" : "✅"}
        title={isACargo ? "ISR a cargo del ejercicio" : "Saldo a favor del ejercicio"}
        accent={isACargo ? 'card-danger' : 'card-success'}
      >
        <div className="calc-block">
          <CalcStep label="ISR del ejercicio" value={isr} op=" " />
          <CalcStep label="Total acreditables" value={totalAcreditables} op="−" />
          <CalcStep
            label={isACargo ? "ISR A CARGO — debes pagar al SAT" : "SALDO A FAVOR — SAT te debe devolver"}
            value={Math.abs(resultado)}
            op="="
            highlight
          />
        </div>
        <div className={`resultado-banner ${isACargo ? 'banner-danger' : 'banner-success'}`}>
          {isACargo
            ? `⚠️ Pagarás ${fmt(resultado)} al SAT al presentar tu declaración anual`
            : `✅ Tienes un saldo a favor de ${fmt(Math.abs(resultado))} — puedes solicitar devolución o compensación`}
        </div>
        <div className="sec-note" style={{ marginTop: '0.75rem' }}>
          * Cálculo estimado. El SAT puede ajustar las cifras al presentar la declaración anual.
          La tarifa aplicada es la del Artículo 152 LISR vigente para {year}.
        </div>
      </SectionCard>
    </div>
  );
};

// ─── SECCIÓN 5: Deducciones Personales ───────────────────────────────────────

export const DeduccionesPersonalesSection = ({ data, year }) => {
  if (!data) return null;
  return (
    <SectionCard icon="🏥" title="Deducciones personales (Art. 151 LISR)">
      <p className="sec-note">
        Gastos personales deducibles que reducen tu base gravable del ISR. 
        El SAT los precarga automáticamente de tus CFDIs recibidos.
        Se aplica el límite del 15% del ingreso total o 5 UMAs anuales.
      </p>
      <div className="ded-grid">
        {[
          ['🏥 Honorarios médicos, dentales y hospitalarios', 'D01'],
          ['👓 Gastos médicos por incapacidad / ópticos', 'D02'],
          ['⚰️ Gastos funerales', 'D03'],
          ['🎗️ Donativos', 'D04'],
          ['🏠 Intereses reales de crédito hipotecario', 'D05'],
          ['🎓 Aportaciones voluntarias SAR', 'D06'],
          ['💊 Primas de seguro de gastos médicos', 'D07'],
          ['🚌 Gastos de transportación escolar', 'D08'],
          ['🏦 Cuentas para el ahorro / pensiones', 'D09'],
          ['🏫 Colegiaturas', 'D10'],
        ].map(([label, codigo]) => {
          const val = data.por_uso?.[codigo];
          // If the API detected it, or if it is exactly 0, render the value rather than "SAT precarga"
          const hasValue = val !== undefined && val !== null;
          return (
            <div key={codigo} className="ded-item">
              <span className="ded-label">{label} <small className="text-muted">({codigo})</small></span>
              <span className="ded-value">{hasValue ? fmt(val) : <span className="text-muted">SAT precarga</span>}</span>
            </div>
          );
        })}
      </div>
      <InfoField
        label="Total de deducciones personales declaradas"
        value={data.total}
        help="Monto que reduce tu base gravable"
        accent="field-accent"
      />
      
      {data.detalle && data.detalle.length > 0 && (
        <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          <h4 style={{ marginBottom: '1rem', fontSize: '0.95rem', color: '#1a365d', fontWeight: '600' }}>
            📄 Desglose de Comprobantes (CFDI)
          </h4>
          <div className="table-responsive">
            <table className="sat-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Emisor</th>
                  <th>Uso CFDI</th>
                  <th>UUID</th>
                  <th className="text-right">Monto Deducible</th>
                </tr>
              </thead>
              <tbody>
                {data.detalle.map((cfdi, idx) => (
                  <tr key={idx}>
                    <td>{cfdi.fecha}</td>
                    <td style={{ fontSize: '0.8rem' }}>{cfdi.emisor}</td>
                    <td><span className="sat-badge sat-badge-blue">{cfdi.uso_cfdi}</span></td>
                    <td style={{ fontSize: '0.7rem', color: '#64748b' }}>{cfdi.uuid?.slice(0, 13)}...</td>
                    <td className="text-right font-medium">{fmt(cfdi.monto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </SectionCard>
  );
};

// ─── Componente Modal para Visualizador CFDI (PDF Stylized) ──────────────────

const FriendlyObjectViewer = ({ data, level = 0 }) => {
  if (data === null || data === undefined) return <span style={{ color: '#94a3b8' }}>null</span>;
  if (typeof data === 'boolean') return <span style={{ color: '#f43f5e' }}>{data ? 'true' : 'false'}</span>;
  if (typeof data === 'number') return <span style={{ color: '#2563eb' }}>{data}</span>;
  if (typeof data === 'string') return <span style={{ color: '#16a34a' }}>"{data}"</span>;

  if (Array.isArray(data)) {
    if (data.length === 0) return <span style={{ color: '#94a3b8' }}>[]</span>;
    return (
      <div style={{ paddingLeft: level > 0 ? '1.5rem' : 0 }}>
        <span style={{ color: '#64748b' }}>[</span>
        {data.map((item, idx) => (
          <div key={idx} style={{ paddingLeft: '1.5rem', marginBottom: '4px' }}>
            <FriendlyObjectViewer data={item} level={level + 1} />
            {idx < data.length - 1 && <span style={{ color: '#64748b' }}>,</span>}
          </div>
        ))}
        <span style={{ color: '#64748b' }}>]</span>
      </div>
    );
  }

  if (typeof data === 'object') {
    const keys = Object.keys(data);
    if (keys.length === 0) return <span style={{ color: '#94a3b8' }}>{`{}`}</span>;
    return (
      <div style={{ paddingLeft: level > 0 ? '1.5rem' : 0 }}>
        <span style={{ color: '#64748b' }}>{`{`}</span>
        {keys.map((key, idx) => (
          <div key={key} style={{ paddingLeft: '1.5rem', margin: '4px 0' }}>
            <strong style={{ color: '#8b5cf6' }}>"{key}"</strong>
            <span style={{ color: '#64748b', margin: '0 6px' }}>:</span>
            <FriendlyObjectViewer data={data[key]} level={level + 1} />
            {idx < keys.length - 1 && <span style={{ color: '#64748b' }}>,</span>}
          </div>
        ))}
        <span style={{ color: '#64748b' }}>{`}`}</span>
      </div>
    );
  }

  return <span>{String(data)}</span>;
};

const XmlViewerModal = ({ data, onClose }) => {
  if (!data) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(5px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
      <div style={{ backgroundColor: '#0f172a', borderRadius: '12px', width: '100%', maxWidth: '800px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.5)', position: 'relative', border: '1px solid #334155' }}>
        
        {/* Header */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
             <span style={{ fontSize: '1.25rem' }}>💻</span>
             <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.05rem', fontWeight: 600, fontFamily: 'monospace' }}>
               Datos Estructurados (Metadatos JSON)
             </h3>
          </div>
          <button onClick={onClose} style={{ cursor: 'pointer', background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.2rem', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>✖</button>
        </div>

        {/* Console Body */}
        <div style={{ padding: '1.5rem', fontFamily: 'monospace', fontSize: '0.82rem', color: '#e2e8f0', lineHeight: 1.5, overflowX: 'auto' }}>
           <FriendlyObjectViewer data={data} />
        </div>
      </div>
    </div>
  );
};

const CfdiVisualizerModal = ({ cfdi, onClose }) => {
  if (!cfdi) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(5px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.35)', position: 'relative' }}>
        
        {/* Header */}
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', sticky: 'top' }}>
          <div>
             <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Comprobante Fiscal Digital por Internet</h2>
             <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 600 }}>Folio Fiscal (UUID):</span> 
                <span style={{ fontFamily: 'monospace', background: '#e2e8f0', padding: '2px 8px', borderRadius: '4px', color: '#334155' }}>{cfdi.uuid}</span>
             </div>
          </div>
          <button onClick={onClose} style={{ cursor: 'pointer', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#64748b', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'} onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}>✖</button>
        </div>

        {/* Body */}
        <div style={{ padding: '2.5rem' }}>
          {/* Top Info Grid (Emisor & Receptor) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '2rem', marginBottom: '2.5rem' }}>
            {/* Emisor */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', background: 'linear-gradient(to bottom right, #ffffff, #f8fafc)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '1rem', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}><span>🏢</span> DATOS DEL EMISOR</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem', lineHeight: 1.3 }}>{cfdi.emisor_nombre}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '0.9rem', color: '#475569' }}><strong style={{ color: '#334155' }}>RFC:</strong> {cfdi.emisor_rfc}</div>
                  <div style={{ fontSize: '0.9rem', color: '#475569' }}><strong style={{ color: '#334155' }}>Régimen Fiscal:</strong> <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '0.85rem' }}>{cfdi.emisor_regimen}</span></div>
              </div>
            </div>
            
            {/* Receptor */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', background: 'linear-gradient(to bottom right, #ffffff, #f8fafc)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '1rem', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}><span>👤</span> DATOS DEL RECEPTOR</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem', lineHeight: 1.3 }}>{cfdi.receptor_nombre}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '0.9rem', color: '#475569' }}><strong style={{ color: '#334155' }}>RFC:</strong> {cfdi.receptor_rfc}</div>
                  <div style={{ fontSize: '0.9rem', color: '#475569' }}><strong style={{ color: '#334155' }}>Uso CFDI:</strong> <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '0.85rem' }}>{cfdi.uso_cfdi}</span></div>
              </div>
            </div>
          </div>
          
          {/* Factura Meta */}
          <div style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '1.5rem', marginBottom: '2.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1.5rem' }}>
             <div><span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Fecha Emisión</span><strong style={{ color: '#0f172a', fontSize: '1rem' }}>{cfdi.fecha.replace('T', ' ')}</strong></div>
             <div><span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Efecto Comp.</span><strong style={{ color: '#0f172a', fontSize: '1rem' }}>{cfdi.tipo === 'I' ? 'Ingreso' : cfdi.tipo === 'E' ? 'Egreso' : cfdi.tipo === 'P' ? 'Pago' : cfdi.tipo}</strong></div>
             <div><span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Moneda</span><strong style={{ color: '#0f172a', fontSize: '1rem' }}>{cfdi.moneda || 'MXN'}</strong></div>
             <div><span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Forma Pago</span><strong style={{ color: '#0f172a', fontSize: '1rem' }}>{cfdi.forma_pago || 'N/D'}</strong></div>
             <div><span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Método Pago</span><strong style={{ color: '#0f172a', fontSize: '1rem' }}>{cfdi.metodo_pago || 'N/D'}</strong></div>
          </div>

          {/* Conceptos Table */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', marginBottom: '2.5rem', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' }}>
             <table style={{ width: '100%', borderCollapse: 'collapse', margin: 0 }}>
               <thead style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                 <tr>
                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left', color: '#334155', fontSize: '0.85rem', fontWeight: 600 }}>Descripción del Servicio / Bien</th>
                    <th style={{ padding: '1rem 1.5rem', textAlign: 'right', color: '#334155', fontSize: '0.85rem', fontWeight: 600, width: '180px' }}>Importe</th>
                 </tr>
               </thead>
               <tbody>
                 {cfdi.conceptos && cfdi.conceptos.length > 0 ? (
                   cfdi.conceptos.map((c, idx) => (
                     <tr key={idx} style={{ borderBottom: idx !== cfdi.conceptos.length - 1 ? '1px solid #e2e8f0' : 'none', backgroundColor: '#ffffff' }}>
                       <td style={{ padding: '1.25rem 1.5rem', color: '#0f172a', fontSize: '0.95rem', lineHeight: 1.4 }}>{c.desc}</td>
                       <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right', fontFamily: 'monospace', color: '#334155', fontSize: '1rem' }}>{fmt(parseFloat(c.imp))}</td>
                     </tr>
                   ))
                 ) : (
                   <tr><td colSpan={2} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>Sin conceptos detallados en el XML procesado.</td></tr>
                 )}
               </tbody>
             </table>
          </div>

          {/* Totals Summary */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
             <div style={{ width: '350px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', color: '#475569', fontSize: '1rem' }}><span>Subtotal:</span> <strong style={{ fontFamily: 'monospace', color: '#1e293b' }}>{fmt(cfdi.subtotal)}</strong></div>
                {cfdi.descuento > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', color: '#475569', fontSize: '1rem' }}><span>Descuento:</span> <strong style={{ fontFamily: 'monospace', color: '#ef4444' }}>-{fmt(cfdi.descuento)}</strong></div>}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', color: '#475569', fontSize: '1rem' }}><span>IVA Trasladado:</span> <strong style={{ fontFamily: 'monospace', color: '#1e293b' }}>{fmt(cfdi.iva)}</strong></div>
                {cfdi.retencion_iva > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', color: '#475569', fontSize: '1rem' }}><span>Retención IVA:</span> <strong style={{ fontFamily: 'monospace', color: '#ef4444' }}>-{fmt(cfdi.retencion_iva)}</strong></div>}
                {cfdi.retencion_isr > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', color: '#475569', fontSize: '1rem' }}><span>Retención ISR:</span> <strong style={{ fontFamily: 'monospace', color: '#ef4444' }}>-{fmt(cfdi.retencion_isr)}</strong></div>}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0 0.25rem 0', color: '#0f172a', fontSize: '1.35rem', fontWeight: 800, borderTop: '2px solid #cbd5e1', marginTop: '1rem' }}><span>TOTAL:</span> <span style={{ fontFamily: 'monospace' }}>{fmt(cfdi.total)}</span></div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Componente Auxiliar para Filas Interactivas (Drill-Down) ────────────────

const InteractableRow = ({ item, groupBy, onViewCfdi }) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <>
      <tr 
        onClick={() => setExpanded(!expanded)} 
        style={{ cursor: 'pointer', transition: 'background-color 0.2s', backgroundColor: expanded ? '#f8fafc' : 'transparent' }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = expanded ? '#f8fafc' : 'transparent'}
      >
        <td style={{ whiteSpace: 'nowrap', color: '#475569' }}>
          <span style={{ marginRight: '8px', fontSize: '0.75rem', color: '#94a3b8', display: 'inline-block', width: '12px' }}>
            {expanded ? '▼' : '▶'}
          </span>
          {item.fecha}
        </td>
        <td style={{ fontSize: '0.85rem', fontWeight: 500, color: '#334155' }}>
          {groupBy === 'emisor' ? item.uso_cfdi : item.emisor}
        </td>
        <td><span className={`sat-badge ${item.metodo === 'PUE' ? 'sat-badge-green' : 'sat-badge-blue'}`}>{item.metodo}</span></td>
        <td className="text-right mono">{fmt(item.subtotal)}</td>
        <td className="text-right mono">{fmt(item.iva)}</td>
        <td className="text-right font-medium mono">{fmt(item.total)}</td>
      </tr>
      
      {expanded && (
        <tr style={{ backgroundColor: '#f8fafc' }}>
          <td colSpan={6} style={{ padding: '0' }}>
             <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0', boxShadow: 'inset 0 3px 6px -3px rgb(0 0 0 / 0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      <strong style={{ color: '#475569' }}>UUID Folio Fiscal:</strong> <span onClick={() => onViewCfdi(item.raw_cfdi)} onMouseEnter={(e) => e.target.style.color = '#1d4ed8'} onMouseLeave={(e) => e.target.style.color = '#2563eb'} style={{ fontFamily: 'monospace', letterSpacing: '0.5px', background: '#e0f2fe', color: '#2563eb', padding: '3px 8px', borderRadius: '4px', marginLeft: '6px', cursor: 'pointer', textDecoration: 'underline', transition: 'color 0.2s', fontWeight: 600 }}>{item.uuid || 'N/D'}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      <strong style={{ color: '#475569' }}>Forma de Pago SAT:</strong> <span style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px' }}>{item.forma_pago || 'N/D'}</span>
                    </div>
                </div>
                
                {item.conceptos && item.conceptos.length > 0 ? (
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse', margin: 0 }}>
                      <thead style={{ backgroundColor: '#f1f5f9' }}>
                        <tr>
                          <th style={{ textAlign: 'left', padding: '0.5rem 1rem', fontWeight: 600, color: '#475569', borderBottom: '1px solid #e2e8f0' }}>Concepto / Descripción del CFDI</th>
                          <th style={{ textAlign: 'right', padding: '0.5rem 1rem', fontWeight: 600, color: '#475569', width: '150px', borderBottom: '1px solid #e2e8f0' }}>Subtotal Importe</th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.conceptos.map((c, idx) => (
                          <tr key={idx}>
                            <td style={{ padding: '0.75rem 1rem', color: '#334155', borderBottom: idx !== item.conceptos.length - 1 ? '1px solid #f1f5f9' : 'none' }}>{c.desc}</td>
                            <td style={{ textAlign: 'right', padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#475569', borderBottom: idx !== item.conceptos.length - 1 ? '1px solid #f1f5f9' : 'none' }}>{fmt(parseFloat(c.imp || 0))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic', marginTop: '0.5rem' }}>
                    El desglose de conceptos (XML Node) no está disponible en este comprobante.
                  </div>
                )}
             </div>
          </td>
        </tr>
      )}
    </>
  );
};

// ─── SECCIÓN 4: Reporte Detallado de Gastos ───────────────────────────────────

export const GastosReport = ({ data, year }) => {
  const [groupBy, setGroupBy] = useState('emisor'); // 'emisor' | 'uso_cfdi'
  const [selectedCfdi, setSelectedCfdi] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});

  const toggleGroup = (idx) => {
    setExpandedGroups(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const groupedData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    
    const groups = data.reduce((acc, curr) => {
      const key = curr[groupBy] || 'Sin Clasificar';
      if (!acc[key]) acc[key] = { key, subtotal: 0, iva: 0, total: 0, items: [] };
      acc[key].subtotal += curr.subtotal;
      acc[key].iva += curr.iva;
      acc[key].total += curr.total;
      acc[key].items.push(curr);
      return acc;
    }, {});

    return Object.values(groups)
      .sort((a, b) => b.subtotal - a.subtotal)
      .map(g => {
        g.items.sort((a, b) => b.fecha.localeCompare(a.fecha));
        return g;
      });
  }, [data, groupBy]);

  if (!data?.length) return <SectionCard icon="📈" title="Reporte Detallado de Egresos" badge="0">No hay gastos deducibles registrados en este periodo.</SectionCard>;

  const totalSubtotal = data.reduce((s, d) => s + d.subtotal, 0);
  const totalIva = data.reduce((s, d) => s + d.iva, 0);

  return (
    <>
      <SectionCard icon="📈" title="Reporte Detallado de Egresos (Negocio)" badge={`${data.length} comprobantes`}>
      
      {/* Controles de Agrupación y KPI Globales */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            className={`pill ${groupBy === 'emisor' ? 'pill-blue' : 'pill-gray'}`} 
            onClick={() => setGroupBy('emisor')}
            style={{ cursor: 'pointer', border: 'none', transition: 'all 0.2s', padding: '0.5rem 1rem' }}
          >
            🏢 Agrupar por Proveedor / Emisor
          </button>
          <button 
            className={`pill ${groupBy === 'uso_cfdi' ? 'pill-blue' : 'pill-gray'}`} 
            onClick={() => setGroupBy('uso_cfdi')}
            style={{ cursor: 'pointer', border: 'none', transition: 'all 0.2s', padding: '0.5rem 1rem' }}
          >
            🏷️ Agrupar por Cuenta / Uso CFDI
          </button>
        </div>
        <div style={{ textAlign: 'right', background: '#f8fafc', padding: '0.75rem 1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '4px' }}>
            Gasto Autorizado Acumulado: <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '1rem' }}>{fmt(totalSubtotal)}</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
            IVA Acreditable Acumulado: <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '1rem' }}>{fmt(totalIva)}</span>
          </div>
        </div>
      </div>

      {groupedData.map((g, idx) => (
        <div key={idx} style={{ marginBottom: '2rem', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
          <div 
            onClick={() => toggleGroup(idx)}
            style={{ backgroundColor: '#f1f5f9', padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', cursor: 'pointer', transition: 'background-color 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
          >
            <div>
              <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#1e293b', fontWeight: 600 }}>
                {expandedGroups[idx] ? '▼' : '▶'} {g.key}
              </h4>
              <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '1.25rem' }}>{g.items.length} movimientos</span>
            </div>
            <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem' }}>
              <div><span style={{ color: '#64748b', marginRight: '6px' }}>Subtotal Base:</span><strong style={{ color: '#0f172a' }}>{fmt(g.subtotal)}</strong></div>
              <div><span style={{ color: '#64748b', marginRight: '6px' }}>IVA:</span><strong style={{ color: '#0f172a' }}>{fmt(g.iva)}</strong></div>
              <div><span style={{ color: '#64748b', marginRight: '6px' }}>Total Pagado:</span><strong style={{ color: '#0f172a' }}>{fmt(g.total)}</strong></div>
            </div>
          </div>
          {expandedGroups[idx] && (
          <div className="table-responsive">
            <table className="sat-table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>Fecha</th>
                  <th>{groupBy === 'emisor' ? 'Uso CFDI' : 'Emisor'}</th>
                  <th style={{ width: '100px' }}>Método</th>
                  <th className="text-right" style={{ width: '130px' }}>Base</th>
                  <th className="text-right" style={{ width: '110px' }}>IVA</th>
                  <th className="text-right" style={{ width: '130px' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {g.items.map((item, i) => (
                  <InteractableRow key={i} item={item} groupBy={groupBy} onViewCfdi={setSelectedCfdi} />
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      ))}
      </SectionCard>
      
      {/* Modal Visualizador en alta fidelidad */}
      <CfdiVisualizerModal cfdi={selectedCfdi} onClose={() => setSelectedCfdi(null)} />
    </>
  );
};
