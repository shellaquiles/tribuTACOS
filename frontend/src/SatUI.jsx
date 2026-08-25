import { useState, useMemo } from 'react';
import {
  ComposedChart, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine
} from 'recharts';
import { exportEgresos, exportHonorarios, exportNomina, exportDeduccionesPersonales, exportIngresos } from './csvExport';

const CHART_COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6'];

const MONTH_NAMES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
];

const fmt = (val) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val ?? 0);

// ─── Shared UI primitives ────────────────────────────────────────────────────

// Botón reutilizable de exportación CSV
const CsvExportButton = ({ onClick, label = 'Exportar CSV', count }) => (
  <button
    onClick={onClick}
    title={`Exportar ${count ? count + ' registros' : 'datos'} a CSV`}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '0.5rem 1rem',
      borderRadius: '8px',
      border: '1.5px solid #10b981',
      background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
      color: '#065f46',
      fontSize: '0.82rem',
      fontWeight: 700,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      letterSpacing: '0.01em',
      whiteSpace: 'nowrap',
    }}
    onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #10b981, #059669)'; e.currentTarget.style.color = '#ffffff'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'; e.currentTarget.style.color = '#065f46'; }}
  >
    <span style={{ fontSize: '1rem' }}>⬇️</span>
    {label}
    {count !== undefined && <span style={{ background: 'rgba(16,185,129,0.15)', padding: '1px 6px', borderRadius: '10px', fontSize: '0.75rem' }}>{count}</span>}
  </button>
);

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

  const { totalBruto, totalDeducciones, totalVales, neto, percepcionesPorTipo, deduccionesPorTipo, kpiData, latestSalaries, tiempo } = useMemo(() => {
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
    const tVales = calcPercs.find(p => p.clave === '029')?.total || 0;

    const targetRecibosConSueldo = targetRecibos.filter(r => r.percepciones && r.percepciones.some(p => p.tipo === '001'));
    const totalDias = targetRecibosConSueldo.reduce((acc, r) => acc + (parseFloat(r.dias_pagados) || 0), 0);
    const meses = (totalDias / 30).toFixed(1);

    return { 
      percepcionesPorTipo: calcPercs, 
      deduccionesPorTipo: calcDeds, 
      kpiData: tmpKpi, 
      totalBruto: tBruto, 
      totalDeducciones: tDed, 
      totalVales: tVales,
      neto: tBruto - tDed - tVales, 
      latestSalaries: sal, 
      tiempo: { totalDias, meses } 
    };
  }, [data, selectedEmployer]);

  if (!data || !percepcionesPorTipo) return null;

  return (
    <SectionCard icon="👥" title="Sueldos, salarios y asimilados">
      
      {data.detalle && data.detalle.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
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
          <CsvExportButton
            onClick={() => exportNomina(data.detalle, year)}
            label="Exportar Nómina"
            count={data.detalle.reduce((s, e) => s + (e.recibos?.length || 0), 0)}
          />
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
         <div style={{ height: '48px', width: '48px', borderRadius: '24px', background: 'linear-gradient(135deg, #fdf2f8, #fce7f3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ec4899', fontSize: '1.75rem', fontWeight: 900, boxShadow: '0 4px 6px -1px rgba(236,72,153,0.1)' }}>−</div>
         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: '1 1 200px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ec4899', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Vales de Despensa</span>
            <span style={{ fontSize: '2.75rem', fontWeight: 900, background: 'linear-gradient(135deg, #9d174d, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em', lineHeight: '1' }}>{fmt(totalVales)}</span>
            {tiempo && tiempo.totalDias > 0 && parseFloat(tiempo.meses) > 0 && (
              <div style={{ fontSize: '0.9rem', color: '#ec4899', fontWeight: 700, marginTop: '16px', background: '#fdf2f8', padding: '6px 16px', borderRadius: '16px' }}>
                Promedio: {fmt(totalVales / tiempo.meses)}
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
            {recibo.vales > 0 && (
              <div className="nomina-kpi-min">
                <span className="label">Vales (029)</span>
                <span className="val text-danger">-{fmt(recibo.vales)}</span>
              </div>
            )}
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

export function DashboardSection({ sections, year }) {
  const nomina = sections?.sueldos;
  const aeyp = sections?.honorarios;

  const mLabels = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const fmt = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val ?? 0);

  const nominaMaps = {};
  (nomina?.detalle || []).flatMap(emp => emp.recibos || []).forEach(r => {
    const month = parseInt(r.fecha.split('-')[1]);
    if (isNaN(month) || month < 1 || month > 12) return;
    const m = mLabels[month-1];
    const valesMensual = (r.percepciones || []).reduce((s,p) => s + (p.tipo === '029' ? (p.total || 0) : 0), 0);
    const percepcionesMensual = (r.percepciones || []).reduce((s,p) => s+(p.total||0), 0);
    const deduccionesMensual = (r.deducciones || []).reduce((s,d) => s+(d.importe||0), 0);
    
    // We want the chart to show "Neto efectivo" (Cash income)
    nominaMaps[m] = (nominaMaps[m] || 0) + (percepcionesMensual - deduccionesMensual - valesMensual);
  });

  const aeypMaps = {};
  (aeyp?.detalle || []).forEach(item => {
    const month = parseInt(item.fecha.split('-')[1]);
    if (isNaN(month) || month < 1 || month > 12) return;
    const m = mLabels[month-1];
    aeypMaps[m] = (aeypMaps[m] || 0) + (item.subtotal||0) + (item.iva||0);
  });

  const totalNomina = Object.values(nominaMaps).reduce((s,v)=>s+v,0);
  const totalAeyp = Object.values(aeypMaps).reduce((s,v)=>s+v,0);
  const totalGeneral = totalNomina + totalAeyp;

  const mensualData = mLabels.map(m => ({
    name: m,
    'Nómina': nominaMaps[m] || 0,
    'Honorarios': aeypMaps[m] || 0,
    'Total': (nominaMaps[m]||0) + (aeypMaps[m]||0),
  }));

  const pieSources = [
    { name: 'Sueldos y Nómina', value: totalNomina },
    { name: 'AEyP / Honorarios', value: totalAeyp },
  ].filter(x => x.value > 0);

  const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444'];
  const bestMonth = mensualData.reduce((a,b) => b.Total > a.Total ? b : a, mensualData[0]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Ingreso Total',       value: fmt(totalGeneral), color: '#6366f1', icon: '💰', sub: year },
          { label: 'Sueldos y Nómina',    value: fmt(totalNomina),  color: '#3b82f6', icon: '👥', sub: totalGeneral>0 ? ((totalNomina/totalGeneral)*100).toFixed(0)+'%' : '—' },
          { label: 'AEyP / Honorarios',   value: fmt(totalAeyp),    color: '#10b981', icon: '💼', sub: totalGeneral>0 ? ((totalAeyp/totalGeneral)*100).toFixed(0)+'%' : '—' },
          { label: 'Mejor Mes',           value: bestMonth?.name||'—', color: '#f59e0b', icon: '📅', sub: fmt(bestMonth?.Total) },
        ].map((k,i) => (
          <div key={i} style={{ background:'white', borderRadius:'14px', padding:'1.25rem 1.5rem', border:'1px solid #e2e8f0', boxShadow:'0 4px 12px rgba(0,0,0,0.04)', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:k.color }} />
            <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'8px' }}>
              <span style={{ fontSize:'1.1rem' }}>{k.icon}</span>
              <span style={{ fontSize:'0.7rem', fontWeight:800, textTransform:'uppercase', color:'#94a3b8', letterSpacing:'0.05em' }}>{k.label}</span>
            </div>
            <div style={{ fontSize:'1.5rem', fontWeight:900, color:k.color, lineHeight:1 }}>{k.value}</div>
            <div style={{ fontSize:'0.75rem', color:'#94a3b8', marginTop:'4px', fontWeight:600 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ background:'white', padding:'1.5rem 1.75rem', borderRadius:'14px', border:'1px solid #e2e8f0', boxShadow:'0 4px 12px rgba(0,0,0,0.04)' }}>
        <h4 style={{ margin:'0 0 1.5rem 0', color:'#475569', fontSize:'0.85rem', textTransform:'uppercase', letterSpacing:'1px' }}>
          Evolución Mensual — Sueldos vs Honorarios
        </h4>
        <ResponsiveContainer width='100%' height={300}>
          <ComposedChart data={mensualData} margin={{ top:10, right:20, left:0, bottom:0 }}>
            <CartesianGrid strokeDasharray='3 3' vertical={false} stroke='#e2e8f0' />
            <XAxis dataKey='name' tick={{ fill:'#64748b', fontSize:12 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => '$'+(v/1000).toFixed(0)+'k'} tick={{ fill:'#64748b', fontSize:12 }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(val,name) => [fmt(val),name]} cursor={{ fill:'#f8fafc' }} />
            <Legend iconType='circle' wrapperStyle={{ fontSize:'12px' }} />
            <Bar dataKey='Nómina' stackId='a' fill='#6366f1' name='Sueldos y Nómina' />
            <Bar dataKey='Honorarios' stackId='a' fill='#10b981' radius={[4,4,0,0]} name='AEyP / Honorarios' />
            <Line type='monotone' dataKey='Total' stroke='#f59e0b' strokeWidth={3} dot={{ r:4, fill:'#f59e0b' }} name='Total Ingreso' />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem' }}>
        <div style={{ background:'white', padding:'1.5rem', borderRadius:'14px', border:'1px solid #e2e8f0', boxShadow:'0 4px 12px rgba(0,0,0,0.04)' }}>
          <h4 style={{ margin:'0 0 1rem 0', color:'#475569', fontSize:'0.85rem', textTransform:'uppercase', letterSpacing:'1px', textAlign:'center' }}>
            Composición de Ingresos {year}
          </h4>
          <ResponsiveContainer width='100%' height={200}>
            <PieChart>
              <Pie data={pieSources} cx='50%' cy='50%' innerRadius={55} outerRadius={85} paddingAngle={3} dataKey='value' stroke='none'>
                {pieSources.map((e,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(val) => fmt(val)} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginTop:'0.75rem' }}>
            {pieSources.map((s,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                <span style={{ width:'10px', height:'10px', borderRadius:'50%', background:COLORS[i%COLORS.length], flexShrink:0 }} />
                <span style={{ flex:1, fontSize:'13px', color:'#334155', fontWeight:600 }}>{s.name}</span>
                <span style={{ fontSize:'13px', color:'#475569', fontWeight:700 }}>{fmt(s.value)}</span>
                <span style={{ fontSize:'11px', color:'#94a3b8' }}>{totalGeneral>0 ? ((s.value/totalGeneral)*100).toFixed(0) : 0}%</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background:'white', padding:'1.5rem', borderRadius:'14px', border:'1px solid #e2e8f0', boxShadow:'0 4px 12px rgba(0,0,0,0.04)', overflowX:'auto' }}>
          <h4 style={{ margin:'0 0 1rem 0', color:'#475569', fontSize:'0.85rem', textTransform:'uppercase', letterSpacing:'1px' }}>
            Resumen por Mes
          </h4>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px' }}>
            <thead>
              <tr style={{ borderBottom:'2px solid #e2e8f0' }}>
                <th style={{ textAlign:'left', padding:'4px 8px', color:'#64748b', fontWeight:700 }}>Mes</th>
                <th style={{ textAlign:'right', padding:'4px 8px', color:'#6366f1', fontWeight:700 }}>Nómina</th>
                <th style={{ textAlign:'right', padding:'4px 8px', color:'#10b981', fontWeight:700 }}>Honorarios</th>
                <th style={{ textAlign:'right', padding:'4px 8px', color:'#f59e0b', fontWeight:700 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {mensualData.filter(m => m.Total > 0).map((m,i) => (
                <tr key={i} style={{ borderBottom:'1px solid #f1f5f9' }}>
                  <td style={{ padding:'5px 8px', fontWeight:600, color:'#334155' }}>{m.name}</td>
                  <td style={{ padding:'5px 8px', textAlign:'right', color:'#6366f1' }}>{m['Nómina']>0 ? fmt(m['Nómina']) : '—'}</td>
                  <td style={{ padding:'5px 8px', textAlign:'right', color:'#10b981' }}>{m.Honorarios>0 ? fmt(m.Honorarios) : '—'}</td>
                  <td style={{ padding:'5px 8px', textAlign:'right', fontWeight:700, color:'#0f172a' }}>{fmt(m.Total)}</td>
                </tr>
              ))}
              <tr style={{ borderTop:'2px solid #e2e8f0', background:'#f8fafc' }}>
                <td style={{ padding:'6px 8px', fontWeight:800, color:'#0f172a' }}>TOTAL</td>
                <td style={{ padding:'6px 8px', textAlign:'right', fontWeight:800, color:'#6366f1' }}>{fmt(totalNomina)}</td>
                <td style={{ padding:'6px 8px', textAlign:'right', fontWeight:800, color:'#10b981' }}>{fmt(totalAeyp)}</td>
                <td style={{ padding:'6px 8px', textAlign:'right', fontWeight:900, color:'#0f172a' }}>{fmt(totalGeneral)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Panel Fiscal: Impuestos y Retenciones ──────────────────────────── */}
      {(() => {
        const isrNomina   = nomina?.isr_retenido || 0;
        const isrAeyp     = aeyp?.isr_retenido   || 0;
        const isrInt      = sections?.intereses?.isr_retenido || 0;
        const ivaTrasl    = aeyp?.mensual?.reduce((s, m) => s + (m.datos?.iva_tras || 0), 0) || 0;
        const ivaRet      = aeyp?.iva_retenido    || 0;
        const totalIsrRet = isrNomina + isrAeyp + isrInt;
        const ivaNetoCargo = ivaTrasl - ivaRet; // > 0 = a cargo del SAT

        const kpis = [
          { label: 'ISR Retenido (Nómina)',     value: fmt(isrNomina),   color: '#6366f1', icon: '👥', tip: 'ISR que tus empleadores retuvieron al pagarte' },
          { label: 'ISR Retenido (AEyP)',        value: fmt(isrAeyp),    color: '#10b981', icon: '💼', tip: 'ISR que tus clientes retuvieron en facturas' },
          { label: 'ISR Retenido (Intereses)',   value: fmt(isrInt),     color: '#8b5cf6', icon: '🏦', tip: 'ISR retenido por Cetes/bancos en tus rendimientos' },
          { label: 'Total ISR Retenido',         value: fmt(totalIsrRet),color: '#ef4444', icon: '🧮', tip: 'Acreditable contra tu ISR anual' },
          { label: 'IVA Trasladado (Cobrado)',   value: fmt(ivaTrasl),   color: '#f59e0b', icon: '🏛️', tip: 'IVA que cobraste a clientes — pertenece al SAT' },
          { label: 'IVA Retenido (por Clientes)',value: fmt(ivaRet),     color: '#ec4899', icon: '✂️', tip: 'IVA que clientes te retuvieron y enteraron al SAT' },
          { label: ivaNetoCargo >= 0 ? 'IVA a Cargo (SAT)' : 'IVA a Favor', value: fmt(Math.abs(ivaNetoCargo)), color: ivaNetoCargo >= 0 ? '#ef4444' : '#10b981', icon: ivaNetoCargo >= 0 ? '⬆️' : '⬇️', tip: 'IVA Trasladado − IVA Retenido (sin acreditable de gastos)' },
        ];

        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
              <div style={{ width: '4px', height: '22px', borderRadius: '2px', background: 'linear-gradient(180deg,#ef4444,#f59e0b)' }} />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#334155' }}>Impuestos y Retenciones — {year}</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem' }}>
              {kpis.map((k, i) => (
                <div key={i} title={k.tip} style={{ background: 'white', borderRadius: '12px', padding: '1rem 1.25rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden', cursor: 'default' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: k.color }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <span>{k.icon}</span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', lineHeight: 1.2 }}>{k.label}</span>
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: k.color }}>{k.value}</div>
                </div>
              ))}
            </div>

            {/* Waterfall visual ISR */}
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', marginTop: '1rem' }}>
              <h4 style={{ margin: '0 0 1.25rem 0', color: '#475569', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '1px' }}>ISR Retenido por Fuente</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'Nómina (empleadores)', value: isrNomina, color: '#6366f1' },
                  { label: 'AEyP / Honorarios (clientes)', value: isrAeyp, color: '#10b981' },
                  { label: 'Intereses y Rendimientos', value: isrInt, color: '#8b5cf6' },
                ].map((row, i) => {
                  const pct = totalIsrRet > 0 ? (row.value / totalIsrRet) * 100 : 0;
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '12px' }}>
                        <span style={{ color: '#475569', fontWeight: 600 }}>{row.label}</span>
                        <span style={{ color: row.color, fontWeight: 800 }}>{fmt(row.value)} <span style={{ color: '#94a3b8', fontWeight: 500 }}>({pct.toFixed(0)}%)</span></span>
                      </div>
                      <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: pct + '%', background: row.color, borderRadius: '4px', transition: 'width 0.8s ease' }} />
                      </div>
                    </div>
                  );
                })}
                <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ fontWeight: 800, color: '#0f172a' }}>Total ISR Retenido (Acreditable)</span>
                  <span style={{ fontWeight: 900, color: '#ef4444', fontSize: '1rem' }}>{fmt(totalIsrRet)}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Panel de Exportación CSV ──────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
        border: '1.5px solid #86efac',
        borderRadius: '14px',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1.25rem',
        flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1.2rem' }}>⬇️</span>
            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#14532d' }}>Exportar Ingresos a CSV</span>
          </div>
          <p style={{ margin: 0, fontSize: '0.78rem', color: '#166534' }}>
            Descarga tus ingresos en formato Excel-compatible para análisis externo.
            Genera hasta 3 archivos: resumen mensual, nómina detallada y facturas AEyP.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <CsvExportButton
            onClick={() => exportIngresos(mensualData, nomina?.detalle, aeyp?.detalle, year)}
            label="Resumen Mensual"
            count={mensualData.filter(m => m.Total > 0).length + ' meses'}
          />
          {nomina?.detalle?.length > 0 && (
            <CsvExportButton
              onClick={() => exportNomina(nomina.detalle, year)}
              label="Nómina Detallada"
              count={nomina.detalle.reduce((s, e) => s + (e.recibos?.length || 0), 0)}
            />
          )}
          {aeyp?.detalle?.length > 0 && (
            <CsvExportButton
              onClick={() => exportHonorarios(aeyp.detalle, year)}
              label="Facturas AEyP"
              count={aeyp.detalle.length}
            />
          )}
        </div>
      </div>

    </div>
  );
}


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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.5rem' }}>
        <p className="sec-note" style={{ margin: 0 }}>
          Base de cálculo: <strong>Facturas PUE (Pagadas en una exhibición)</strong>. 
          Muestra la radiografía cruda de tus cobros a lo largo del <strong>ejercicio {year}</strong>.
        </p>
        <CsvExportButton
          onClick={() => exportHonorarios(targetRecibos, year)}
          label="Exportar Honorarios"
          count={targetRecibos.length}
        />
      </div>

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
  const [selectedClient, setSelectedClient] = useState('Global');
  if (!data || !data.detalle) return null;

  const clients = useMemo(() => {
    const dict = {};
    data.detalle.forEach(d => {
      const key = d.rfc || d.cliente;
      if (!dict[key]) dict[key] = d.cliente;
      else if (d.cliente && d.cliente.length < dict[key].length) dict[key] = d.cliente;
    });
    return Object.entries(dict).map(([rfc, nombre]) => ({ rfc, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [data.detalle]);

  const targetRecibos = useMemo(() => {
    if (selectedClient === 'Global') return data.detalle || [];
    return data.detalle.filter(d => (d.rfc || d.cliente) === selectedClient);
  }, [data.detalle, selectedClient]);

  const mensualData = useMemo(() => {
    const maps = {};
    targetRecibos.forEach(item => {
      if (!item.fecha) return;
      const month = parseInt(item.fecha.split('-')[1]);
      if (isNaN(month) || month < 1 || month > 12) return;
      const name = MONTH_NAMES[month - 1].slice(0, 3);
      if (!maps[name]) maps[name] = { name, Subtotal: 0, IVA: 0, Neto: 0 };
      maps[name].Subtotal += item.subtotal || 0;
      maps[name].IVA += item.iva || 0;
      maps[name].Neto += (item.subtotal || 0) + (item.iva || 0);
    });
    return MONTH_NAMES.map(m => maps[m.slice(0, 3)] || { name: m.slice(0, 3), Subtotal: 0, IVA: 0, Neto: 0 });
  }, [targetRecibos]);

  const serviceMix = useMemo(() => {
    const map = {};
    targetRecibos.forEach(r => {
      (r.conceptos || []).forEach(c => {
        const key = c.clave || '00000000';
        const label = c.desc_sat || c.desc || key;
        if (!map[key]) map[key] = { name: label.length > 40 ? label.slice(0, 40) + '\u2026' : label, value: 0 };
        map[key].value += c.imp || 0;
      });
    });
    return Object.values(map).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [targetRecibos]);

  const clientData = useMemo(() => {
    const g = {};
    data.detalle.forEach(item => {
      const key = item.rfc || item.cliente;
      if (!g[key]) g[key] = { name: item.cliente, value: 0 };
      else if (item.cliente && item.cliente.length < g[key].name.length) g[key].name = item.cliente;
      g[key].value += item.subtotal + item.iva;
    });
    return Object.values(g).sort((a, b) => b.value - a.value);
  }, [data.detalle]);

  const totalBruto = targetRecibos.reduce((s, r) => s + r.subtotal + r.iva, 0);
  const totalSubtotal = targetRecibos.reduce((s, r) => s + r.subtotal, 0);
  const totalIva = targetRecibos.reduce((s, r) => s + r.iva, 0);
  const bestMonth = mensualData.reduce((a, b) => b.Neto > a.Neto ? b : a, mensualData[0]);

  return (
    <>
      {clients.length > 0 && (
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <button onClick={() => setSelectedClient('Global')} style={{ padding: '0.5rem 1.1rem', borderRadius: '30px', cursor: 'pointer', border: 'none', background: selectedClient === 'Global' ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : '#f1f5f9', color: selectedClient === 'Global' ? 'white' : '#475569', fontWeight: selectedClient === 'Global' ? '700' : '500', fontSize: '0.85rem', transition: 'all 0.3s' }}>
            🌎 Global
          </button>
          {clients.map((cli, i) => (
            <button key={i} onClick={() => setSelectedClient(cli.rfc)} style={{ padding: '0.5rem 1.1rem', borderRadius: '30px', cursor: 'pointer', border: 'none', background: selectedClient === cli.rfc ? 'linear-gradient(135deg, #10b981, #059669)' : '#f1f5f9', color: selectedClient === cli.rfc ? 'white' : '#475569', fontWeight: selectedClient === cli.rfc ? '700' : '500', fontSize: '0.85rem', transition: 'all 0.3s' }}>
              🏢 {cli.nombre}
            </button>
          ))}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Facturado Bruto', value: fmt(totalBruto), color: '#3b82f6', icon: '💰' },
          { label: 'Subtotal Neto', value: fmt(totalSubtotal), color: '#10b981', icon: '📄' },
          { label: 'IVA Trasladado', value: fmt(totalIva), color: '#f59e0b', icon: '🏛️' },
          { label: 'Mejor Mes', value: bestMonth?.name || '—', color: '#6366f1', icon: '📅', sub: fmt(bestMonth?.Neto) },
        ].map((k, i) => (
          <div key={i} style={{ background: 'white', borderRadius: '12px', padding: '1rem 1.25rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <span>{k.icon}</span>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>{k.label}</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: k.color }}>{k.value}</div>
            {k.sub && <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>{k.sub}</div>}
          </div>
        ))}
      </div>
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.04)', marginBottom: '1.5rem' }}>
        <h4 style={{ margin: '0 0 1.5rem 0', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Evolución Mensual — Subtotal + IVA vs Bruto Cobrado
        </h4>
        <ResponsiveContainer width='100%' height={290}>
          <ComposedChart data={mensualData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray='3 3' vertical={false} stroke='#e2e8f0' />
            <XAxis dataKey='name' tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => '$' + (v / 1000).toFixed(0) + 'k'} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(val, name) => [fmt(val), name]} cursor={{ fill: '#f8fafc' }} />
            <Legend iconType='circle' wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey='Subtotal' stackId='a' fill='#94a3b8' name='Subtotal' />
            <Bar dataKey='IVA' stackId='a' fill='#fbbf24' radius={[4, 4, 0, 0]} name='IVA Trasladado' />
            <Line type='monotone' dataKey='Neto' stroke='#3b82f6' strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} name='Bruto Cobrado' />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>
            Mix de Servicios (Catálogo SAT)
          </h4>
          {serviceMix.length > 0 ? (
            <>
              <ResponsiveContainer width='100%' height={200}>
                <PieChart>
                  <Pie data={serviceMix} cx='50%' cy='50%' innerRadius={50} outerRadius={82} paddingAngle={2} dataKey='value' stroke='none'>
                    {serviceMix.map((e, idx) => <Cell key={'sm-'+idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(val) => fmt(val)} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '0.5rem' }}>
                {(() => { const total = serviceMix.reduce((s, e) => s + e.value, 0); return serviceMix.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                    <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
                    <span style={{ color: '#475569', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                    <span style={{ color: '#94a3b8', flexShrink: 0, fontWeight: 700 }}>{total > 0 ? ((c.value / total) * 100).toFixed(0) : 0}%</span>
                  </div>
                )); })()}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '180px', color: '#94a3b8' }}>Sin conceptos disponibles</div>
          )}
        </div>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>
            Concentración de Clientes
          </h4>
          <ResponsiveContainer width='100%' height={200}>
            <PieChart>
              <Pie data={clientData.slice(0, 6)} cx='50%' cy='50%' innerRadius={50} outerRadius={80} paddingAngle={2} dataKey='value' stroke='none'>
                {clientData.map((e, idx) => <Cell key={'c-'+idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(val) => fmt(val)} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '0.5rem' }}>
            {clientData.slice(0, 6).map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
                <span style={{ color: '#475569', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                <span style={{ color: '#94a3b8', flexShrink: 0, fontWeight: 700 }}>{totalBruto > 0 ? ((c.value / totalBruto) * 100).toFixed(0) : 0}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
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
  // Sueldos: solo el ingreso GRAVADO (Art. 94 LISR — exento no acumula)
  const ingSueldos = sueldos?.gravado || 0;

  // AEyP: suma de subtotales del detalle — MISMA fuente que Info Global AEyP
  // (honorarios.ingresos solo incluye PUE, pero ambos deben cuadrar)
  const aeypSubtotalTotal = (honorarios?.detalle || []).reduce((s, r) => s + (r.subtotal || 0), 0);
  const aeypDeducciones   = honorarios?.deducciones_autorizadas || 0;
  const ingHonorarios = Math.max(0, aeypSubtotalTotal - aeypDeducciones);

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
        <p className="sec-note">Suma de todos los ingresos del ejercicio que forman la base gravable del ISR.
          Los valores coinciden con los módulos <strong>Sueldos y Nómina</strong> y <strong>AEyP / Honorarios</strong>.
        </p>
        <div className="calc-block">
          <CalcStep label={`Sueldos y salarios — gravado (de ${fmt(sueldos?.total_ingresos || 0)} total, exento no acumula)`} value={ingSueldos} op="+" />
          <CalcStep
            label={ingHonorarios >= 0
              ? `Utilidad fiscal AEyP (${fmt(aeypSubtotalTotal)} subtotal − ${fmt(aeypDeducciones)} egresos negocio)`
              : 'Pérdida fiscal AEyP (no acumula — Art. 109 LISR)'}
            value={ingHonorarios} op="+" />
          <CalcStep label="Intereses reales acumulables" value={ingIntereses} op="+" />
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.5rem' }}>
        <p className="sec-note" style={{ margin: 0 }}>
          Gastos personales deducibles que reducen tu base gravable del ISR. 
          El SAT los precarga automáticamente de tus CFDIs recibidos.
          Se aplica el límite del 15% del ingreso total o 5 UMAs anuales.
        </p>
        {data.detalle && data.detalle.length > 0 && (
          <CsvExportButton
            onClick={() => exportDeduccionesPersonales(data.detalle, year)}
            label="Exportar Deducciones"
            count={data.detalle.length}
          />
        )}
      </div>
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

// ─── SECCIÓN 4: Reporte Detallado de Gastos ───────────────────────────────────

export const GastosReport = ({ data, year }) => {
  const [groupBy, setGroupBy] = useState('emisor'); // 'emisor' | 'uso_cfdi' | 'mes'
  const [selectedCfdi, setSelectedCfdi] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});

  const toggleGroup = (idx) => {
    setExpandedGroups(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const groupedData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    
    const groups = data.reduce((acc, curr) => {
      let key = 'Sin Clasificar';
      if (groupBy === 'mes') {
        const m = curr.fecha ? parseInt(curr.fecha.split('-')[1], 10) : null;
        key = (m && m >= 1 && m <= 12) ? `${MONTH_NAMES[m - 1]} (${curr.fecha.slice(0, 7)})` : 'Fecha No Definida';
      } else {
        key = curr[groupBy] || 'Sin Clasificar';
      }

      if (!acc[key]) acc[key] = { key, subtotal: 0, iva: 0, total: 0, items: [], mesNum: curr.fecha ? parseInt(curr.fecha.split('-')[1], 10) : 99 };
      acc[key].subtotal += curr.subtotal;
      acc[key].iva += curr.iva;
      acc[key].total += curr.total;
      acc[key].items.push(curr);
      return acc;
    }, {});

    const list = Object.values(groups);
    if (groupBy === 'mes') {
      list.sort((a, b) => a.mesNum - b.mesNum);
    } else {
      list.sort((a, b) => b.subtotal - a.subtotal);
    }

    return list.map(g => {
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
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button 
            className={`pill ${groupBy === 'emisor' ? 'pill-blue' : 'pill-gray'}`} 
            onClick={() => setGroupBy('emisor')}
            style={{ cursor: 'pointer', border: 'none', transition: 'all 0.2s', padding: '0.5rem 1rem' }}
          >
            🏢 Agrupar por Proveedor / Emisor
          </button>
          <button 
            className={`pill ${groupBy === 'mes' ? 'pill-blue' : 'pill-gray'}`} 
            onClick={() => setGroupBy('mes')}
            style={{ cursor: 'pointer', border: 'none', transition: 'all 0.2s', padding: '0.5rem 1rem' }}
          >
            📅 Agrupar por Mes
          </button>
          <button 
            className={`pill ${groupBy === 'uso_cfdi' ? 'pill-blue' : 'pill-gray'}`} 
            onClick={() => setGroupBy('uso_cfdi')}
            style={{ cursor: 'pointer', border: 'none', transition: 'all 0.2s', padding: '0.5rem 1rem' }}
          >
            🏷️ Agrupar por Cuenta / Uso CFDI
          </button>
          <CsvExportButton
            onClick={() => exportEgresos(data, year, 'Detalle')}
            label="Exportar CSV"
            count={data.length}
          />
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

// ─── SECCIÓN 5: Vista de Egresos por Mes (Analítica y Desglose Mensual) ──────

export function EgresosMensualesSection({ data, year }) {
  const [selectedMonth, setSelectedMonth] = useState('Global'); // 'Global' | 1..12
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('fecha_desc'); // 'fecha_desc' | 'monto_desc' | 'monto_asc' | 'emisor_asc'
  const [selectedCfdi, setSelectedCfdi] = useState(null);
  const [viewingXml, setViewingXml] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});

  const toggleRow = (uuid) => {
    setExpandedRows(prev => ({ ...prev, [uuid]: !prev[uuid] }));
  };

  const rawList = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  // Cálculos agrupados por los 12 meses
  const {
    mesesData,
    totalesAnuales,
    promedioMensual,
    mesPico,
    distribucionUso,
    topProveedoresPeriodo
  } = useMemo(() => {
    const meses = MONTH_NAMES.map((name, idx) => ({
      mes: idx + 1,
      name,
      shortName: name.slice(0, 3),
      subtotal: 0,
      iva: 0,
      total: 0,
      count: 0,
      items: [],
      proveedoresMap: {}
    }));

    let sumSubtotal = 0;
    let sumIva = 0;
    let sumTotal = 0;
    let sumCount = 0;
    const activeMonths = new Set();

    rawList.forEach(item => {
      const fecha = item.fecha || '';
      const parts = fecha.split('-');
      const mIdx = parts.length > 1 ? parseInt(parts[1], 10) - 1 : -1;

      if (mIdx >= 0 && mIdx < 12) {
        meses[mIdx].subtotal += item.subtotal || 0;
        meses[mIdx].iva += item.iva || 0;
        meses[mIdx].total += item.total || 0;
        meses[mIdx].count += 1;
        meses[mIdx].items.push(item);
        activeMonths.add(mIdx);

        const prov = item.emisor || 'Desconocido';
        meses[mIdx].proveedoresMap[prov] = (meses[mIdx].proveedoresMap[prov] || 0) + (item.subtotal || 0);
      }

      sumSubtotal += item.subtotal || 0;
      sumIva += item.iva || 0;
      sumTotal += item.total || 0;
      sumCount += 1;
    });

    // Identificar top provider por mes
    meses.forEach(m => {
      const provEntries = Object.entries(m.proveedoresMap);
      if (provEntries.length > 0) {
        provEntries.sort((a, b) => b[1] - a[1]);
        m.topProvider = provEntries[0][0];
      } else {
        m.topProvider = '—';
      }
    });

    const activeCount = activeMonths.size || 1;
    const promTotal = sumTotal / activeCount;
    const promSubtotal = sumSubtotal / activeCount;

    // Mes pico (mayor gasto total)
    const pico = meses.reduce((max, curr) => (curr.total > max.total ? curr : max), meses[0]);

    // Items para el periodo seleccionado (Global o mes específico)
    const targetItems = selectedMonth === 'Global' 
      ? rawList 
      : (meses[selectedMonth - 1]?.items || []);

    // Mix por Uso CFDI
    const usoMap = {};
    targetItems.forEach(item => {
      const k = item.uso_cfdi || 'Sin Uso';
      usoMap[k] = (usoMap[k] || 0) + (item.subtotal || 0);
    });
    const distribucionUso = Object.entries(usoMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Top Proveedores del periodo
    const provMap = {};
    targetItems.forEach(item => {
      const k = item.emisor || 'Desconocido';
      provMap[k] = (provMap[k] || 0) + (item.total || 0);
    });
    const topProveedoresPeriodo = Object.entries(provMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    return {
      mesesData: meses,
      totalesAnuales: {
        subtotal: sumSubtotal,
        iva: sumIva,
        total: sumTotal,
        count: sumCount
      },
      promedioMensual: {
        total: promTotal,
        subtotal: promSubtotal,
        activeMonths: activeCount
      },
      mesPico: pico,
      distribucionUso,
      topProveedoresPeriodo
    };
  }, [rawList, selectedMonth]);

  // Filtrar y ordenar facturas del mes seleccionado
  const displayItems = useMemo(() => {
    let items = selectedMonth === 'Global' 
      ? [...rawList] 
      : [...(mesesData[selectedMonth - 1]?.items || [])];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      items = items.filter(it => {
        const emisor = (it.emisor || '').toLowerCase();
        const rfc = ((it.raw_cfdi?.emisor_rfc) || '').toLowerCase();
        const uuid = (it.uuid || '').toLowerCase();
        const uso = (it.uso_cfdi || '').toLowerCase();
        const conceptos = (it.conceptos || []).some(c => 
          (c.desc || '').toLowerCase().includes(q) || 
          (c.desc_sat || '').toLowerCase().includes(q) ||
          (c.clave || '').includes(q)
        );
        return emisor.includes(q) || rfc.includes(q) || uuid.includes(q) || uso.includes(q) || conceptos;
      });
    }

    items.sort((a, b) => {
      if (sortBy === 'fecha_desc') return (b.fecha || '').localeCompare(a.fecha || '');
      if (sortBy === 'fecha_asc') return (a.fecha || '').localeCompare(b.fecha || '');
      if (sortBy === 'monto_desc') return (b.total || 0) - (a.total || 0);
      if (sortBy === 'monto_asc') return (a.total || 0) - (b.total || 0);
      if (sortBy === 'emisor_asc') return (a.emisor || '').localeCompare(b.emisor || '');
      return 0;
    });

    return items;
  }, [rawList, selectedMonth, mesesData, searchTerm, sortBy]);

  const activeMonthName = selectedMonth === 'Global' 
    ? 'Todo el Ejercicio' 
    : `${MONTH_NAMES[selectedMonth - 1]} ${year}`;

  const currentSubtotal = displayItems.reduce((acc, it) => acc + (it.subtotal || 0), 0);
  const currentIva = displayItems.reduce((acc, it) => acc + (it.iva || 0), 0);
  const currentTotal = displayItems.reduce((acc, it) => acc + (it.total || 0), 0);

  if (!rawList.length) {
    return (
      <SectionCard icon="📅" title="Vista de Egresos por Mes" badge="0 comprobantes">
        <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
          No se encontraron facturas ni complementos de egreso registrados para el ejercicio {year}.
        </div>
      </SectionCard>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* ── 1. SELECTOR DE MESES TIPO PILLS ── */}
      <div style={{ background: 'white', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>
            📅 Seleccionar Periodo Mensual:
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Periodo Activo: <strong style={{ color: '#0f172a' }}>{activeMonthName}</strong> ({displayItems.length} comprobantes)
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedMonth('Global')}
            style={{
              padding: '0.55rem 1.1rem',
              borderRadius: '24px',
              cursor: 'pointer',
              border: 'none',
              background: selectedMonth === 'Global' ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : '#f1f5f9',
              color: selectedMonth === 'Global' ? '#ffffff' : '#475569',
              fontWeight: selectedMonth === 'Global' ? 700 : 500,
              fontSize: '0.85rem',
              boxShadow: selectedMonth === 'Global' ? '0 4px 10px rgba(59, 130, 246, 0.35)' : 'none',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🗓️ Todo el Año</span>
            <span style={{ background: selectedMonth === 'Global' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', padding: '1px 6px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
              {rawList.length}
            </span>
          </button>

          {mesesData.map((m) => {
            const isSelected = selectedMonth === m.mes;
            const hasData = m.count > 0;
            return (
              <button
                key={m.mes}
                onClick={() => setSelectedMonth(m.mes)}
                style={{
                  padding: '0.55rem 0.9rem',
                  borderRadius: '24px',
                  cursor: 'pointer',
                  border: isSelected ? 'none' : (hasData ? '1px solid #cbd5e1' : '1px dashed #e2e8f0'),
                  background: isSelected 
                    ? 'linear-gradient(135deg, #10b981, #059669)' 
                    : (hasData ? '#ffffff' : '#f8fafc'),
                  color: isSelected ? '#ffffff' : (hasData ? '#1e293b' : '#94a3b8'),
                  fontWeight: isSelected ? 700 : (hasData ? 600 : 400),
                  fontSize: '0.85rem',
                  boxShadow: isSelected ? '0 4px 10px rgba(16, 185, 129, 0.35)' : 'none',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <span>{m.shortName}</span>
                {hasData && (
                  <span style={{
                    background: isSelected ? 'rgba(255,255,255,0.25)' : '#e0f2fe',
                    color: isSelected ? '#ffffff' : '#0369a1',
                    padding: '1px 6px',
                    borderRadius: '12px',
                    fontSize: '0.72rem',
                    fontWeight: 700
                  }}>
                    {m.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. KPIS SUPERIORES ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        {[
          {
            label: selectedMonth === 'Global' ? 'Egresos Pagados (Anual)' : `Egresos Pagados (${activeMonthName})`,
            value: fmt(currentTotal),
            color: '#ef4444',
            icon: '💳',
            sub: `${displayItems.length} comprobantes en periodo`
          },
          {
            label: 'Gasto Neto Deducible (Base)',
            value: fmt(currentSubtotal),
            color: '#3b82f6',
            icon: '📉',
            sub: `Subtotal sin IVA trasladado`
          },
          {
            label: 'IVA Acreditable Acumulado',
            value: fmt(currentIva),
            color: '#f59e0b',
            icon: '🏛️',
            sub: `${currentSubtotal > 0 ? ((currentIva / currentSubtotal) * 100).toFixed(1) : 0}% efectividad fiscal`
          },
          {
            label: selectedMonth === 'Global' ? 'Promedio Mensual' : 'Mes Pico Anual',
            value: selectedMonth === 'Global' ? fmt(promedioMensual.total) : `${mesPico.shortName}: ${fmt(mesPico.total)}`,
            color: '#10b981',
            icon: '📊',
            sub: selectedMonth === 'Global' ? `Pico: ${mesPico.shortName} (${fmt(mesPico.total)})` : `Mayor volumen de gasto anual`
          }
        ].map((kpi, idx) => (
          <div key={idx} style={{
            background: 'white',
            borderRadius: '16px',
            padding: '1.25rem 1.5rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>
                {kpi.label}
              </span>
              <span style={{ fontSize: '1.25rem' }}>{kpi.icon}</span>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: kpi.color, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
              {kpi.value}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
              {kpi.sub}
            </div>
          </div>
        ))}
      </div>

      {/* ── 3. GRÁFICA DE EVOLUCIÓN MENSUAL DE EGRESOS ── */}
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', fontWeight: 700 }}>
              📈 Evolución y Flujo de Egresos por Mes ({year})
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              Subtotal Deducible + IVA Acreditable pagado en cada periodo. Haz clic en una barra para filtrar ese mes.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>
            <span>Promedio Mensual: <strong style={{ color: '#10b981' }}>{fmt(promedioMensual.total)}</strong></span>
            <span>Total Anual: <strong style={{ color: '#ef4444' }}>{fmt(totalesAnuales.total)}</strong></span>
          </div>
        </div>

        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer>
            <ComposedChart
              data={mesesData}
              margin={{ top: 15, right: 15, left: 10, bottom: 5 }}
              onClick={(e) => {
                if (e && e.activePayload && e.activePayload.length) {
                  const m = e.activePayload[0].payload.mes;
                  setSelectedMonth(m);
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <defs>
                <linearGradient id="gradEgrSubtotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.7} />
                </linearGradient>
                <linearGradient id="gradEgrIva" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#d97706" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="shortName" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} dy={8} />
              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} dx={-8} />
              <Tooltip
                formatter={(val, name) => [fmt(val), name]}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const row = payload[0].payload;
                    return (
                      <div style={{ background: '#0f172a', color: 'white', padding: '0.85rem 1.1rem', borderRadius: '8px', boxShadow: '0 10px 15px rgba(0,0,0,0.3)', fontSize: '0.85rem' }}>
                        <div style={{ fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '4px', marginBottom: '6px', fontSize: '0.95rem' }}>
                          {row.name} ({row.count} comprobantes)
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem', color: '#93c5fd' }}>
                          <span>Subtotal Deducible:</span>
                          <strong style={{ fontFamily: 'monospace' }}>{fmt(row.subtotal)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem', color: '#fde68a' }}>
                          <span>IVA Acreditable:</span>
                          <strong style={{ fontFamily: 'monospace' }}>{fmt(row.iva)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem', marginTop: '6px', paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.2)', fontWeight: 800, color: '#fca5a5' }}>
                          <span>Total Pagado:</span>
                          <strong style={{ fontFamily: 'monospace' }}>{fmt(row.total)}</strong>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '15px', fontSize: '0.85rem', fontWeight: 600 }} iconType="circle" />
              <ReferenceLine
                y={promedioMensual.total}
                stroke="#10b981"
                strokeDasharray="4 4"
                strokeWidth={2}
                label={{
                  position: 'insideTopLeft',
                  value: `Promedio: ${fmt(promedioMensual.total)}`,
                  fill: '#065f46',
                  fontSize: 12,
                  fontWeight: 800
                }}
              />
              <Bar dataKey="subtotal" stackId="egr" name="Subtotal Deducible" fill="url(#gradEgrSubtotal)" maxBarSize={38} radius={[0, 0, 0, 0]} />
              <Bar dataKey="iva" stackId="egr" name="IVA Acreditable" fill="url(#gradEgrIva)" maxBarSize={38} radius={[4, 4, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── 4. GRÁFICAS DE DISTRIBUCIÓN (Top Proveedores & Mix Uso CFDI) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
        
        {/* Top Proveedores */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#334155', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>
            🏢 Concentración por Proveedor ({activeMonthName})
          </h4>
          {topProveedoresPeriodo.length > 0 ? (
            <>
              <div style={{ width: '100%', height: 210 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={topProveedoresPeriodo}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {topProveedoresPeriodo.map((_, idx) => (
                        <Cell key={`prov-cell-${idx}`} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => fmt(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '0.75rem' }}>
                {topProveedoresPeriodo.map((p, idx) => {
                  const pct = currentTotal > 0 ? ((p.value / currentTotal) * 100).toFixed(1) : 0;
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: CHART_COLORS[idx % CHART_COLORS.length], flexShrink: 0 }} />
                        <span style={{ color: '#334155', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', fontFamily: 'monospace' }}>
                        <span style={{ color: '#64748b' }}>{fmt(p.value)}</span>
                        <span style={{ color: '#0f172a', fontWeight: 700, width: '45px', textAlign: 'right' }}>{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              Sin datos para este periodo
            </div>
          )}
        </div>

        {/* Mix Uso CFDI */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#334155', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>
            🏷️ Mix por Uso CFDI / Categoría ({activeMonthName})
          </h4>
          {distribucionUso.length > 0 ? (
            <>
              <div style={{ width: '100%', height: 210 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={distribucionUso}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {distribucionUso.map((_, idx) => (
                        <Cell key={`uso-cell-${idx}`} fill={CHART_COLORS[(idx + 3) % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => fmt(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '0.75rem' }}>
                {distribucionUso.slice(0, 6).map((u, idx) => {
                  const pct = currentSubtotal > 0 ? ((u.value / currentSubtotal) * 100).toFixed(1) : 0;
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: CHART_COLORS[(idx + 3) % CHART_COLORS.length], flexShrink: 0 }} />
                        <span style={{ color: '#334155', fontWeight: 600 }}>{u.name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', fontFamily: 'monospace' }}>
                        <span style={{ color: '#64748b' }}>{fmt(u.value)}</span>
                        <span style={{ color: '#0f172a', fontWeight: 700, width: '45px', textAlign: 'right' }}>{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              Sin datos para este periodo
            </div>
          )}
        </div>
      </div>

      {/* ── 5. TABLA MATRIZ ANUAL (12 MESES) ── */}
      <SectionCard
        icon="🗓️"
        title="Matriz de Egresos Mensuales (12 Meses)"
        badge={`${totalesAnuales.count} facturas | Total: ${fmt(totalesAnuales.total)}`}
      >
        <div className="table-responsive">
          <table className="sat-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th style={{ width: '140px' }}>Mes</th>
                <th style={{ width: '110px' }} className="text-center">Comprobantes</th>
                <th className="text-right" style={{ width: '140px' }}>Subtotal Base</th>
                <th className="text-right" style={{ width: '120px' }}>IVA Acreditable</th>
                <th className="text-right" style={{ width: '140px' }}>Total Pagado</th>
                <th style={{ width: '140px' }}>% del Anual</th>
                <th>Proveedor Principal</th>
                <th style={{ width: '110px' }} className="text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {mesesData.map((m) => {
                const pctAnual = totalesAnuales.total > 0 ? (m.total / totalesAnuales.total) * 100 : 0;
                const isCurrentActive = selectedMonth === m.mes;
                return (
                  <tr
                    key={m.mes}
                    style={{
                      backgroundColor: isCurrentActive ? '#eff6ff' : 'transparent',
                      fontWeight: isCurrentActive ? 600 : 'normal'
                    }}
                  >
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: m.count > 0 ? '#10b981' : '#cbd5e1' }} />
                        <strong style={{ color: '#0f172a' }}>{m.name}</strong>
                      </span>
                    </td>
                    <td className="text-center">
                      {m.count > 0 ? (
                        <span className="sat-badge sat-badge-blue">{m.count} docs</span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>0</span>
                      )}
                    </td>
                    <td className="text-right mono">{fmt(m.subtotal)}</td>
                    <td className="text-right mono">{fmt(m.iva)}</td>
                    <td className="text-right mono font-medium" style={{ color: m.total > 0 ? '#0f172a' : '#94a3b8' }}>
                      {fmt(m.total)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(pctAnual, 100)}%`, height: '100%', background: '#3b82f6', borderRadius: '4px' }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', width: '38px', color: '#64748b' }}>
                          {pctAnual.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: '#475569', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.topProvider}
                    </td>
                    <td className="text-center">
                      {m.count > 0 && (
                        <button
                          onClick={() => setSelectedMonth(m.mes)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: isCurrentActive ? '1px solid #3b82f6' : '1px solid #cbd5e1',
                            background: isCurrentActive ? '#3b82f6' : '#ffffff',
                            color: isCurrentActive ? '#ffffff' : '#334155',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            transition: 'all 0.2s'
                          }}
                        >
                          {isCurrentActive ? '✓ Viendo' : 'Ver Mes'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f8fafc', fontWeight: 800, borderTop: '2px solid #cbd5e1' }}>
                <td>TOTAL ANUAL</td>
                <td className="text-center">{totalesAnuales.count} facturas</td>
                <td className="text-right mono" style={{ color: '#2563eb' }}>{fmt(totalesAnuales.subtotal)}</td>
                <td className="text-right mono" style={{ color: '#d97706' }}>{fmt(totalesAnuales.iva)}</td>
                <td className="text-right mono font-medium" style={{ color: '#0f172a', fontSize: '1rem' }}>{fmt(totalesAnuales.total)}</td>
                <td colSpan={3} style={{ textAlign: 'right', color: '#64748b', fontSize: '0.85rem' }}>
                  100% Gasto Acumulado
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </SectionCard>

      {/* ── 6. LISTADO DETALLADO DE FACTURAS DEL MES SELECCIONADO ── */}
      <SectionCard
        icon="🧾"
        title={`Comprobantes de Egresos: ${activeMonthName}`}
        badge={`${displayItems.length} comprobantes`}
      >
        {/* Controles de Búsqueda y Ordenamiento */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: '280px', maxWidth: '480px' }}>
            <input
              type="text"
              placeholder="🔍 Buscar por proveedor, concepto, RFC o UUID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 1rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                outline: 'none',
                transition: 'border 0.2s'
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 12px', cursor: 'pointer', color: '#64748b' }}
              >
                ✖
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '0.55rem 0.9rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                color: '#1e293b',
                background: '#ffffff',
                cursor: 'pointer'
              }}
            >
              <option value="fecha_desc">Fecha (más reciente primero)</option>
              <option value="fecha_asc">Fecha (más antigua primero)</option>
              <option value="monto_desc">Monto Mayor a Menor</option>
              <option value="monto_asc">Monto Menor a Mayor</option>
              <option value="emisor_asc">Proveedor (A - Z)</option>
            </select>
            <CsvExportButton
              onClick={() => exportEgresos(displayItems, year, activeMonthName)}
              label={`Exportar ${activeMonthName}`}
              count={displayItems.length}
            />
          </div>

        </div>

        {/* Listado de Facturas */}
        {displayItems.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {displayItems.map((item, idx) => {
              const rowId = item.uuid || `egr-${idx}`;
              const isExpanded = expandedRows[rowId];
              return (
                <div
                  key={rowId}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    background: '#ffffff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    overflow: 'hidden',
                    transition: 'all 0.2s'
                  }}
                >
                  {/* Header de la tarjeta de factura */}
                  <div
                    onClick={() => toggleRow(rowId)}
                    style={{
                      padding: '1rem 1.25rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      background: isExpanded ? '#f8fafc' : '#ffffff',
                      borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none',
                      flexWrap: 'wrap',
                      gap: '1rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '240px' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.8rem', width: '12px' }}>
                        {isExpanded ? '▼' : '▶'}
                      </span>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3b82f6', background: '#eff6ff', padding: '2px 8px', borderRadius: '6px' }}>
                            {item.fecha}
                          </span>
                          <span className={`sat-badge ${item.metodo === 'PUE' ? 'sat-badge-green' : 'sat-badge-blue'}`} style={{ fontSize: '0.7rem' }}>
                            {item.metodo}
                          </span>
                          <span style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#475569', fontWeight: 600 }}>
                            {item.uso_cfdi}
                          </span>
                        </div>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                          {item.emisor}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Base: <span className="mono">{fmt(item.subtotal)}</span></div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>IVA: <span className="mono">{fmt(item.iva)}</span></div>
                      </div>
                      <div style={{ textAlign: 'right', minWidth: '120px' }}>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Total Pagado</div>
                        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
                          {fmt(item.total)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cuerpo expandible: conceptos y botones de acción SAT */}
                  {isExpanded && (
                    <div style={{ padding: '1.25rem 1.5rem', background: '#fafbfc' }}>
                      
                      {/* Metadatos y 3 Botones de Acción SAT */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>UUID / Folio:</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (item.raw_cfdi) setSelectedCfdi(item.raw_cfdi);
                            }}
                            style={{
                              background: '#e0f2fe',
                              border: 'none',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              color: '#1d4ed8',
                              fontFamily: 'monospace',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              textDecoration: 'underline'
                            }}
                            title="Ver Comprobante Fiscal Digital en alta fidelidad"
                          >
                            🔍 {item.uuid || 'N/D'}
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (item.raw_cfdi) setViewingXml(item.raw_cfdi);
                            }}
                            style={{
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              color: '#475569',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontWeight: 600
                            }}
                            title="Ver estructura JSON del comprobante"
                          >
                            💻 JSON
                          </button>

                          {item.raw_cfdi?.filename && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`http://localhost:8010/api/download_xml?filename=${item.raw_cfdi.filename}`, '_blank');
                              }}
                              style={{
                                background: '#ffffff',
                                border: '1px solid #cbd5e1',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                color: '#475569',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontWeight: 600
                              }}
                              title="Descargar archivo original (.xml)"
                            >
                              ⬇️ XML
                            </button>
                          )}
                        </div>

                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          <strong>Forma de Pago:</strong> <span style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', marginLeft: '4px' }}>{item.forma_pago || 'N/D'}</span>
                        </div>
                      </div>

                      {/* Tabla de Conceptos */}
                      {item.conceptos && item.conceptos.length > 0 ? (
                        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                          <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse', margin: 0 }}>
                            <thead style={{ backgroundColor: '#f1f5f9' }}>
                              <tr>
                                <th style={{ textAlign: 'left', padding: '0.6rem 1rem', fontWeight: 700, color: '#475569', borderBottom: '1px solid #e2e8f0' }}>Clave SAT & Descripción del Concepto</th>
                                <th style={{ textAlign: 'right', padding: '0.6rem 1rem', fontWeight: 700, color: '#475569', width: '160px', borderBottom: '1px solid #e2e8f0' }}>Subtotal Base</th>
                              </tr>
                            </thead>
                            <tbody>
                              {item.conceptos.map((c, cIdx) => (
                                <tr key={cIdx}>
                                  <td style={{ padding: '0.75rem 1rem', color: '#1e293b', borderBottom: cIdx !== item.conceptos.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                    <div style={{ fontWeight: 600 }}>{c.desc}</div>
                                    {c.clave && (
                                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                                        Clave SAT: <span style={{ fontFamily: 'monospace', color: '#2563eb' }}>{c.clave}</span> {c.desc_sat ? `(${c.desc_sat})` : ''}
                                      </div>
                                    )}
                                  </td>
                                  <td style={{ textAlign: 'right', padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#334155', fontWeight: 600, borderBottom: cIdx !== item.conceptos.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                    {fmt(parseFloat(c.imp || 0))}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
                          No hay desglose de conceptos detallado en el comprobante.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '8px' }}>
            No se encontraron comprobantes que coincidan con el criterio de búsqueda "{searchTerm}".
          </div>
        )}
      </SectionCard>

      {/* Modales */}
      {selectedCfdi && <CfdiVisualizerModal cfdi={selectedCfdi} onClose={() => setSelectedCfdi(null)} />}
      {viewingXml && <XmlViewerModal data={viewingXml} onClose={() => setViewingXml(null)} />}
    </div>
  );
}

