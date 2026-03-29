import axios from 'axios';
import { Component, useEffect, useState } from 'react';
import {
  DashboardSection,
  DeduccionesPersonalesSection,
  DeterminacionSection,
  HonorariosSection,
  AnaliticaAeypSection,
  FacturasAeypSection,
  InteresesSection,
  OtrosIngresosSection,
  SueldosSection,
  NominaDetalleSection,
  GastosReport,
  TabNavigation
} from './SatUI';
import { AnaliticaSection } from './SatAnalitica';
import './index.css';

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(e) { return { hasError: true, error: e }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '1rem', background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px', margin: '1rem 0', color: '#856404', fontSize: '0.85rem' }}>
          <strong>⚠️ Error en sección:</strong> {this.state.error?.message}
        </div>
      );
    }
    return this.props.children;
  }
}

const API_BASE = `http://${window.location.hostname}:8010/api`;

const App = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [year, setYear] = useState('2024'); // Default to 2024 as requested

  useEffect(() => {
    setLoading(true);
    axios.get(`${API_BASE}/summary?year=${year}`)
      .then(r => setData(r.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [year]);

  if (loading) return (
    <div className="loading-container">
      <div className="spinner" />
      <p>Analizando CFDIs del ejercicio {year}…</p>
    </div>
  );

  if (error) return (
    <div className="loading-container">
      <p>❌ No se pudo conectar con el backend: <code>{error}</code></p>
    </div>
  );

  const { sections, summary } = data;

  const tabs = [
    // Dashboard Global
    { id: 'dashboard',    label: 'Dashboard',             icon: '🏠' },

    // 0-2: Nómina
    { id: 'sueldos',      label: 'Info Global',           icon: '👥' },
    { id: 'analitica',    label: 'Gráficas',              icon: '📊' },
    { id: 'nomina',       label: 'Detalle de Recibos',    icon: '🧾' },

    // 3-6: AEyP y Otros
    { id: 'honorarios',   label: 'Info Global (AEyP)',    icon: '💼' },
    { id: 'analitica_aeyp',label: 'Gráficas (AEyP)',      icon: '📈' },
    { id: 'detalle_aeyp', label: 'Detalle de Facturas',   icon: '📄' },
    { id: 'otros',        label: 'Otros Ingresos',        icon: '💵' },

    // 7-9: Egresos
    { id: 'gastos',       label: 'Egresos (Negocio)',     icon: '💳' },
    { id: 'intereses',    label: 'Intereses y Notas',     icon: '🏦' },
    { id: 'deduciones',   label: 'Ded. Personales',       icon: '🏥' },

    // 10: Cálculo
    { id: 'determinacion',label: 'Determinación ISR',     icon: '🧮' },
  ];

  return (
    <div className="sat-dashboard-app">
      <aside className="sat-sidebar">
        <div className="sat-sidebar-brand">
          <div className="sat-header-logo">🇲🇽</div>
          <div>
            <div className="header-title">Declara Pro</div>
            <div className="header-sub" style={{ fontSize: '0.65rem', marginTop: '2px', opacity: 0.9 }}>GAQA810905BCA</div>
          </div>
        </div>
        
        <div className="sat-sidebar-controls">
           <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Ejercicio Fiscal</label>
           <select 
             value={year} 
             onChange={(e) => setYear(e.target.value)} 
             style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700, color: '#0f172a', background: '#ffffff', cursor: 'pointer', fontSize: '0.95rem' }}
           >
             <option value="2022">2022</option>
             <option value="2023">2023</option>
             <option value="2024">2024</option>
             <option value="2025">2025</option>
             <option value="2026">2026</option>
           </select>
        </div>

        <nav className="sat-sidebar-nav">
           <div className="nav-group-title">Resumen Fiscal</div>
           <TabNavigation tabs={tabs.slice(0, 1)} activeTab={activeTab} onTabChange={setActiveTab} />

           <div className="nav-group-title" style={{ marginTop: '1.75rem' }}>Sueldos y Nómina</div>
           <TabNavigation tabs={tabs.slice(1, 4)} activeTab={activeTab} onTabChange={setActiveTab} />
           
           <div className="nav-group-title" style={{ marginTop: '1.75rem' }}>AEyP y Otros Ingresos</div>
           <TabNavigation tabs={tabs.slice(4, 8)} activeTab={activeTab} onTabChange={setActiveTab} />
           
           <div className="nav-group-title" style={{ marginTop: '1.75rem' }}>Egresos y Deducciones</div>
           <TabNavigation tabs={tabs.slice(8, 11)} activeTab={activeTab} onTabChange={setActiveTab} />

           <div className="nav-group-title" style={{ marginTop: '1.75rem' }}>Cálculo Anual</div>
           <TabNavigation tabs={tabs.slice(11, 12)} activeTab={activeTab} onTabChange={setActiveTab} />
        </nav>
      </aside>

      <main className="sat-main-content">
        <header className="sat-content-header">
           <div className="sat-content-title">
             <span style={{ fontSize: '2rem', marginRight: '0.75rem' }}>{tabs.find(t => t.id === activeTab)?.icon}</span>
             <h2>{tabs.find(t => t.id === activeTab)?.label}</h2>
           </div>
           {loading && <div className="sat-sync-badge"><div className="spinner-micro"></div>Sincronizando...</div>}
           {!loading && <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Cálculo Anual ISR: {year}</div>}
        </header>

        <div className="sat-content-body">
          {activeTab === 'dashboard' && (
            <ErrorBoundary><DashboardSection sections={sections} year={year} /></ErrorBoundary>
          )}

          {activeTab === 'sueldos' && (
            <ErrorBoundary><SueldosSection data={sections.sueldos} year={year} /></ErrorBoundary>
          )}
          
          {activeTab === 'analitica' && (
            <ErrorBoundary><AnaliticaSection data={sections.sueldos} year={year} /></ErrorBoundary>
          )}

          {activeTab === 'nomina' && (
            <ErrorBoundary><NominaDetalleSection data={sections.sueldos} year={year} /></ErrorBoundary>
          )}

          {activeTab === 'honorarios' && (
            <ErrorBoundary><HonorariosSection data={sections.honorarios} year={year} /></ErrorBoundary>
          )}

          {activeTab === 'analitica_aeyp' && (
            <ErrorBoundary><AnaliticaAeypSection data={sections.honorarios} year={year} /></ErrorBoundary>
          )}

          {activeTab === 'detalle_aeyp' && (
            <ErrorBoundary><FacturasAeypSection data={sections.honorarios} year={year} /></ErrorBoundary>
          )}
          
          {activeTab === 'otros' && (
            <ErrorBoundary><OtrosIngresosSection data={sections.otros_ingresos} /></ErrorBoundary>
          )}
          
          {activeTab === 'intereses' && (
            <ErrorBoundary><InteresesSection data={sections.intereses} year={year} /></ErrorBoundary>
          )}

          {activeTab === 'deduciones' && (
            <ErrorBoundary>
              <DeduccionesPersonalesSection data={sections.deducciones_personales} year={year} />
            </ErrorBoundary>
          )}

          {activeTab === 'gastos' && (
            <ErrorBoundary>
              <GastosReport data={sections.reporte_gastos} year={year} />
            </ErrorBoundary>
          )}

          {activeTab === 'determinacion' && (
            <ErrorBoundary>
              <DeterminacionSection sections={sections} summary={summary} year={year} />
            </ErrorBoundary>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
