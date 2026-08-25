import React from 'react';

export const CHART_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'
];

export const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export const fmt = (val) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0
  }).format(val ?? 0);

export const CsvExportButton = ({ onClick, label = 'Exportar CSV', count }) => (
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
    onMouseEnter={e => {
      e.currentTarget.style.background = 'linear-gradient(135deg, #10b981, #059669)';
      e.currentTarget.style.color = '#ffffff';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.background = 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)';
      e.currentTarget.style.color = '#065f46';
    }}
  >
    <span style={{ fontSize: '1rem' }}>⬇️</span>
    {label}
    {count !== undefined && (
      <span style={{ background: 'rgba(16,185,129,0.15)', padding: '1px 6px', borderRadius: '10px', fontSize: '0.75rem' }}>
        {count}
      </span>
    )}
  </button>
);

export const SectionCard = ({ icon, title, badge, children, accent }) => (
  <div className={`sec-card ${accent || ''}`}>
    <div className="sec-header">
      <span className="sec-icon">{icon}</span>
      <span className="sec-title">{title}</span>
      {badge != null && <span className="sec-badge">{badge}</span>}
    </div>
    <div className="sec-body">{children}</div>
  </div>
);

export const KpiRow = ({ items }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
    {items.map((k, i) => (
      <div key={i} style={{
        background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: '16px',
        padding: '1.5rem',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: '4px',
          background: k.accent === 'kpi-danger' ? '#ef4444' : (k.accent === 'kpi-accent' ? '#f59e0b' : '#3b82f6')
        }} />
        <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
          {k.label}
        </div>
        <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
          {fmt(k.value)}
        </div>
        {k.help && <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>{k.help}</div>}
      </div>
    ))}
  </div>
);

export const InfoField = ({ label, value, help, accent }) => (
  <div className={`info-field ${accent || ''}`}>
    <div className="info-label">{label}</div>
    <div className="info-value">{fmt(value)}</div>
    {help && <div className="info-help">{help}</div>}
  </div>
);

export const Pill = ({ text, color }) => (
  <span className={`pill pill-${color || 'gray'}`}>{text}</span>
);

export const CalcStep = ({ label, value, op, highlight }) => (
  <div className={`calc-step ${highlight ? 'calc-highlight' : ''}`}>
    <span className="calc-op">{op}</span>
    <span className="calc-label">{label}</span>
    <span className="calc-value">{fmt(value)}</span>
  </div>
);

export const ConceptCard = ({ title, value, accent, metaItems, badge }) => {
  let claveNumber = '';
  let cleanTitle = title;

  if (badge) {
    claveNumber = badge;
    cleanTitle = title;
  } else {
    const titleParts = title.split(' - ');
    claveNumber = titleParts[0].replace('Clave: ', '');
    if (titleParts.length > 1 && titleParts[0].startsWith('Clave:')) {
      cleanTitle = titleParts.slice(1).join(' - ');
    }
  }

  const isGreen = accent === 'green';
  const isBlue = accent === 'blue';

  const colorBase = isGreen ? '#10b981' : (isBlue ? '#ef4444' : '#ef4444');
  const bgSoft = isGreen ? 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)' : 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)';
  const borderCol = isGreen ? '#a7f3d0' : '#fca5a5';
  const shadowHover = isGreen ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)';

  return (
    <div
       style={{
         background: bgSoft,
         borderRadius: '16px',
         padding: '1.25rem',
         border: `1px solid ${borderCol}`,
         boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
         display: 'flex',
         flexDirection: 'column',
         position: 'relative',
         overflow: 'hidden'
       }}
       onMouseEnter={(e) => {
         e.currentTarget.style.transform = 'translateY(-4px)';
         e.currentTarget.style.boxShadow = `0 12px 20px -8px ${shadowHover}`;
         e.currentTarget.style.transition = 'all 0.3s ease';
       }}
       onMouseLeave={(e) => {
         e.currentTarget.style.transform = 'translateY(0)';
         e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.02)';
       }}
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
