import axios from 'axios';
import { Component, useEffect, useState } from 'react';
import {
  DeduccionesPersonalesSection,
  DeterminacionSection,
  HonorariosSection,
  InteresesSection,
  OtrosIngresosSection,
  SueldosSection,
  NominaDetalleSection,
  GastosReport,
  TabNavigation
} from './SatUI';
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
  const [activeTab, setActiveTab] = useState('ingresos');
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
    { id: 'ingresos',     label: 'Ingresos',              icon: '💰' },
    { id: 'nomina',       label: 'Nómina Detallada',      icon: '🧾' },
    { id: 'gastos',       label: 'Egresos (Negocio)',     icon: '📈' },
    { id: 'deduciones',   label: 'Ded. personales',       icon: '🏥' },
    { id: 'determinacion',label: 'Determinación ISR',     icon: '🧮' },
  ];

  return (
    <div className="sat-app">
      <header className="sat-header-main" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="header-title">
            Declaración Anual — Simulador ISR Personas Físicas
            <select 
              value={year} 
              onChange={e => setYear(e.target.value)}
              style={{ marginLeft: '1rem', fontSize: '1rem', padding: '0.2rem' }}
            >
              <option value="2022">2022</option>
              <option value="2023">2023</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
          </div>
          <div className="header-sub">RFC: GAQA810905BCA · Adan Garcia Quiroz · Ejercicio {year}</div>
        </div>
        <div className="sat-header-logo">🇲🇽</div>
      </header>

      <main className="sat-content">
        <TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'ingresos' && (
          <div>
            <ErrorBoundary><SueldosSection data={sections.sueldos} year={year} /></ErrorBoundary>
            <ErrorBoundary><HonorariosSection data={sections.honorarios} year={year} /></ErrorBoundary>
            <ErrorBoundary><OtrosIngresosSection data={sections.otros_ingresos} /></ErrorBoundary>
            <ErrorBoundary><InteresesSection data={sections.intereses} year={year} /></ErrorBoundary>
          </div>
        )}

        {activeTab === 'nomina' && (
          <ErrorBoundary>
            <NominaDetalleSection data={sections.sueldos} year={year} />
          </ErrorBoundary>
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
      </main>

      <footer className="sat-footer">
        <button className="btn-sat secondary">⚙️ Configurar</button>
        <button className="btn-sat primary">📄 Exportar</button>
      </footer>
    </div>
  );
};

export default App;
