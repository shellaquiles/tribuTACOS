import axios from 'axios';
import { Component, useEffect, useState, useCallback } from 'react';
import {
  DashboardSection,
  DeduccionesPersonalesSection,
  DeterminacionSection,
  HonorariosSection,
  FacturasAeypSection,
  NotasCreditoSection,
  SueldosSection,
  NominaDetalleSection,
  EgresosMensualesSection,
  InteresesSection,
  TabNavigation
} from './SatUI';
import { UploadModal } from './components/UploadModal';
import ConciliacionSatSection from './components/ConciliacionSatSection';
import PreDeclaracionMensualSection from './components/PreDeclaracionMensualSection';
import PreDeclaracionAnualSection from './components/PreDeclaracionAnualSection';
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
  const [year, setYear] = useState('2024');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [clients, setClients] = useState([]);
  const [currentClientId, setCurrentClientId] = useState('default');
  const [syncing, setSyncing] = useState(false);

  // Fetch registered clients
  const fetchClients = useCallback(() => {
    axios.get(`${API_BASE}/clients`)
      .then(r => {
        if (r.data && r.data.length > 0) {
          setClients(r.data);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Fetch Fiscal Data for selected Year & Client
  const loadData = useCallback((forceRefresh = false) => {
    setLoading(true);
    const url = `${API_BASE}/summary?year=${year}&client_id=${currentClientId}${forceRefresh ? '&force_refresh=true' : ''}`;
    axios.get(url)
      .then(r => {
        setData(r.data);
        setError(null);
      })
      .catch(e => setError(e.response?.data?.detail || e.message))
      .finally(() => setLoading(false));
  }, [year, currentClientId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await axios.post(`${API_BASE}/sync?client_id=${currentClientId}`);
      loadData(true);
      fetchClients();
    } catch (e) {
      alert("Error al sincronizar: " + (e.response?.data?.detail || e.message));
    } finally {
      setSyncing(false);
    }
  };

  const currentClientInfo = clients.find(c => c.id === currentClientId) || data?.client;

  // ─── Navegación Inteligente tributacos: 6 Módulos Principales ─────────────────
  const navGroups = [
    {
      title: 'Visión General',
      tabs: [
        { id: 'dashboard', label: 'Dashboard Global', icon: '🌮' },
      ]
    },
    {
      title: 'Pre-Declaraciones SAT',
      tabs: [
        { id: 'pre_mensual', label: 'Pre-Declaración Mensual', icon: '📅' },
        { id: 'pre_anual',   label: 'Pre-Declaración Anual',   icon: '🏛️' },
      ]
    },
    {
      title: 'Egresos y Deducciones',
      tabs: [
        { id: 'egresos_mes', label: 'Gastos y Compras',        icon: '📉' },
        { id: 'deducciones', label: 'Deducciones Personales',  icon: '🏥' },
      ]
    },
    {
      title: 'Ingresos y Nómina',
      tabs: [
        { id: 'nomina',        label: 'Sueldos y Salarios',     icon: '👥' },
        { id: 'nomina_detalle',label: 'Detalle de Recibos',     icon: '🧾' },
        { id: 'aeyp',          label: 'Honorarios Emitidos',    icon: '💼' },
        { id: 'facturas_aeyp', label: 'Facturas Clientes',      icon: '📄' },
        { id: 'notas_credito', label: 'Notas de Crédito',       icon: '💵' },
      ]
    },
    {
      title: 'Verificación Oficial',
      tabs: [
        { id: 'conciliacion_sat', label: 'Auditoría SAT (PDFs)', icon: '🔍' },
      ]
    },
  ];

  const allTabs = navGroups.flatMap(g => g.tabs);
  const activeLabel = allTabs.find(t => t.id === activeTab);

  if (loading && !data) return (
    <div className="loading-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '1rem' }}>
      <div style={{ fontSize: '3.5rem', animation: 'bounce 1s infinite' }}>🌮</div>
      <div className="spinner" />
      <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#1e293b' }}>tributacos</div>
      <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>Calculando declaraciones del ejercicio {year} a partir de tus CFDIs…</p>
    </div>
  );

  if (error && !data) return (
    <div className="loading-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '1rem', padding: '2rem', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem' }}>🌮⚠️</div>
      <h3 style={{ margin: 0, color: '#991b1b' }}>No se pudo conectar con el servidor de tributacos</h3>
      <p style={{ color: '#64748b', maxWidth: '480px' }}><code>{error}</code></p>
      <button 
        onClick={() => loadData(true)} 
        style={{ padding: '0.6rem 1.4rem', borderRadius: '8px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: 700, cursor: 'pointer' }}
      >
        Reintentar conexión
      </button>
    </div>
  );

  const { sections, summary } = data || {};

  return (
    <div className="sat-dashboard-app">
      {/* ── SIDEBAR ── */}
      <aside className="sat-sidebar">
        {/* Brand */}
        <div className="sat-sidebar-brand" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontSize: '2rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}>🌮</div>
          <div>
            <div className="header-title" style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #1e293b 0%, #3b82f6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              tributacos
            </div>
            <div className="header-sub" style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b' }}>
              {currentClientInfo?.rfc || 'RFC ACTIVO'}
            </div>
          </div>
        </div>

        {/* Action: Upload XMLs */}
        <div style={{ padding: '0 0.5rem 1rem 0.5rem' }}>
          <button
            onClick={() => setIsUploadOpen(true)}
            style={{
              width: '100%',
              padding: '0.65rem 1rem',
              borderRadius: '10px',
              border: '1.5px solid #3b82f6',
              background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
              color: '#1d4ed8',
              fontWeight: 800,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(59, 130, 246, 0.15)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#3b82f6'; e.currentTarget.style.color = '#ffffff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)'; e.currentTarget.style.color = '#1d4ed8'; }}
          >
            <span>🌮</span>
            <span>Desmenuzar XMLs</span>
          </button>
        </div>

        {/* Client & Year Selectors */}
        <div className="sat-sidebar-controls">
          {clients.length > 1 && (
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
                Contribuyente
              </label>
              <select
                value={currentClientId}
                onChange={(e) => setCurrentClientId(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700, color: '#0f172a', background: '#ffffff', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.rfc} - {c.name}</option>
                ))}
              </select>
            </div>
          )}

          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
            Ejercicio Fiscal
          </label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <select 
              value={year} 
              onChange={(e) => setYear(e.target.value)} 
              style={{ flex: 1, padding: '0.55rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700, color: '#0f172a', background: '#ffffff', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              <option value="2021">2021</option>
              <option value="2022">2022</option>
              <option value="2023">2023</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
            <button
              onClick={handleSync}
              disabled={syncing}
              title="Sincronizar carpetas locales y refrescar"
              style={{
                padding: '0 10px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                cursor: syncing ? 'wait' : 'pointer',
                color: '#475569'
              }}
            >
              {syncing ? '⏳' : '🔄'}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sat-sidebar-nav">
          {navGroups.map((group) => (
            <div key={group.title}>
              <div className="nav-group-title" style={{ marginTop: '1.25rem' }}>{group.title}</div>
              <TabNavigation
                tabs={group.tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            </div>
          ))}
        </nav>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="sat-main-content">
        <header className="sat-content-header">
           <div className="sat-content-title">
             <span style={{ fontSize: '2rem', marginRight: '0.75rem' }}>{activeLabel?.icon}</span>
             <div>
               <h2>{activeLabel?.label}</h2>
               <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500, marginTop: '2px' }}>
                 tributacos — Pre-Declarador Fiscal para <strong>{currentClientInfo?.rfc}</strong> • Ejercicio <strong>{year}</strong>
               </div>
             </div>
           </div>
           {loading && <div className="sat-sync-badge"><div className="spinner-micro"></div>Calculando...</div>}
        </header>

        <div className="sat-content-body">
          {/* ── 1. Dashboard Global ── */}
          {activeTab === 'dashboard' && (
            <ErrorBoundary><DashboardSection sections={sections} year={year} data={data} /></ErrorBoundary>
          )}

          {/* ── 2. Pre-Declaración Mensual ── */}
          {activeTab === 'pre_mensual' && (
            <ErrorBoundary>
              <PreDeclaracionMensualSection data={data} year={year} />
            </ErrorBoundary>
          )}

          {/* ── 3. Pre-Declaración Anual ── */}
          {activeTab === 'pre_anual' && (
            <ErrorBoundary>
              <PreDeclaracionAnualSection data={data} year={year} />
            </ErrorBoundary>
          )}

          {/* ── 4. Egresos y Deducciones ── */}
          {activeTab === 'egresos_mes' && (
            <ErrorBoundary>
              <EgresosMensualesSection data={sections?.reporte_gastos} year={year} />
            </ErrorBoundary>
          )}
          {activeTab === 'deducciones' && (
            <ErrorBoundary>
              <DeduccionesPersonalesSection data={sections?.deducciones_personales} year={year} />
            </ErrorBoundary>
          )}

          {/* ── 5. Ingresos y Nómina ── */}
          {activeTab === 'nomina' && (
            <ErrorBoundary><SueldosSection data={sections?.sueldos} year={year} /></ErrorBoundary>
          )}
          {activeTab === 'nomina_detalle' && (
            <ErrorBoundary><NominaDetalleSection data={sections?.sueldos} year={year} /></ErrorBoundary>
          )}
          {activeTab === 'aeyp' && (
            <ErrorBoundary><HonorariosSection data={sections?.honorarios} year={year} /></ErrorBoundary>
          )}
          {activeTab === 'facturas_aeyp' && (
            <ErrorBoundary><FacturasAeypSection data={sections?.honorarios} year={year} /></ErrorBoundary>
          )}
          {activeTab === 'notas_credito' && (
            <ErrorBoundary>
              <>
                <NotasCreditoSection data={sections?.otros_ingresos} />
                {sections?.intereses && (sections.intereses.nominal > 0 || sections.intereses.real > 0) && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <InteresesSection data={sections.intereses} />
                  </div>
                )}
              </>
            </ErrorBoundary>
          )}

          {/* ── 6. Auditoría & Conciliación Oficial SAT (PDFs) ── */}
          {activeTab === 'conciliacion_sat' && (
            <ErrorBoundary>
              <ConciliacionSatSection year={year} onYearChange={setYear} />
            </ErrorBoundary>
          )}
        </div>
      </main>

      {/* ── MODAL DE UPLOAD DE XMLs ── */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        clientId={currentClientId}
        onUploadSuccess={() => {
          loadData(true);
          fetchClients();
        }}
      />
    </div>
  );
};

export default App;
