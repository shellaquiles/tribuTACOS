'use client';

import axios from 'axios';
import { Component, useEffect, useState, useCallback } from 'react';
import {
  LayoutDashboard,
  CalendarCheck,
  Landmark,
  Receipt,
  HeartHandshake,
  Users,
  FileSpreadsheet,
  Briefcase,
  FileText,
  ShieldCheck,
  Upload,
  RefreshCw,
  ChevronDown,
  Building,
  CheckCircle2
} from 'lucide-react';
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
} from './SatUI';
import { UploadModal } from './components/UploadModal';
import ConciliacionSatSection from './components/ConciliacionSatSection';
import PreDeclaracionMensualSection from './components/PreDeclaracionMensualSection';
import PreDeclaracionAnualSection from './components/PreDeclaracionAnualSection';
import './index.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(e) {
    return { hasError: true, error: e };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl my-4 text-red-900 text-sm">
          <div className="font-semibold mb-1">Error al procesar esta sección:</div>
          <code className="text-xs bg-red-100/70 p-2 rounded block mt-2 font-mono text-red-800">
            {this.state.error?.message}
          </code>
        </div>
      );
    }
    return this.props.children;
  }
}

const API_BASE = '/api';

const App = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [year, setYear] = useState(() => String(new Date().getFullYear()));
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

  // ─── Estructura de Navegación Profesional y Limpia ───────────────────────────
  const navGroups = [
    {
      title: 'Resumen',
      tabs: [
        { id: 'dashboard', label: 'Dashboard Principal', icon: LayoutDashboard },
      ]
    },
    {
      title: 'Pre-Declaraciones SAT',
      tabs: [
        { id: 'pre_mensual', label: 'Pagos Provisionales (Mensual)', icon: CalendarCheck },
        { id: 'pre_anual',   label: 'Declaración Anual',              icon: Landmark },
      ]
    },
    {
      title: 'Egresos y Deducciones',
      tabs: [
        { id: 'egresos_mes', label: 'Gastos y Facturas Recibidas', icon: Receipt },
        { id: 'deducciones', label: 'Deducciones Personales',      icon: HeartHandshake },
      ]
    },
    {
      title: 'Ingresos y Nómina',
      tabs: [
        { id: 'nomina',        label: 'Sueldos y Salarios',        icon: Users },
        { id: 'nomina_detalle',label: 'Detalle de Recibos',        icon: FileSpreadsheet },
        { id: 'aeyp',          label: 'Honorarios / Act. Prof.',   icon: Briefcase },
        { id: 'facturas_aeyp', label: 'Facturas Emitidas',        icon: FileText },
      ]
    },
    {
      title: 'Auditoría SAT',
      tabs: [
        { id: 'conciliacion_sat', label: 'Conciliación Oficial (PDFs)', icon: ShieldCheck },
      ]
    },
  ];

  const allTabs = navGroups.flatMap(g => g.tabs);
  const activeTabObj = allTabs.find(t => t.id === activeTab);

  if (loading && !data) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-800">
      <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-md mb-4">
        🌮
      </div>
      <div className="text-lg font-bold text-slate-900 tracking-tight mb-1">
        tribuTACOS
      </div>
      <div className="text-xs text-slate-500 mb-4">
        un proyecto de <span className="font-semibold text-blue-600">shellaquiles.org</span>
      </div>
      <p className="text-slate-600 text-xs text-center max-w-sm mb-4">
        Procesando y recalculando declaraciones fiscales del ejercicio {year}...
      </p>
      <div className="w-36 h-1 bg-slate-200 rounded-full overflow-hidden">
        <div className="h-full bg-blue-600 rounded-full animate-[pulse_1s_infinite]" />
      </div>
    </div>
  );

  if (error && !data) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-800 text-center">
      <div className="w-12 h-12 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold text-xl mb-4 border border-red-200">
        !
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-1">No se pudo conectar con el servidor fiscal</h3>
      <div className="text-xs text-slate-500 mb-4">shellaquiles.org • tribuTACOS</div>
      <p className="text-slate-600 text-xs max-w-md mb-6 font-mono bg-white p-3 rounded-lg border border-slate-200 text-left overflow-x-auto">
        <code>{error}</code>
      </p>
      <button
        onClick={() => loadData(true)}
        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
      >
        Reintentar conexión
      </button>
    </div>
  );

  const { sections, summary } = data || {};

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      
      {/* ── SIDEBAR LUMINOSO Y LIMPIO (Light Theme) ── */}
      <aside className="w-64 bg-white text-slate-700 flex flex-col border-r border-slate-200 shadow-xs flex-shrink-0 z-30">
        
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-base font-black shadow-sm">
              🌮
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                tribuTACOS
              </div>
              <div className="text-[10px] text-slate-400 font-medium">
                by <span className="text-blue-600 font-semibold">shellaquiles.org</span>
              </div>
            </div>
          </div>
          
          <div className="mt-3 flex items-center justify-between bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200/80 text-[11px]">
            <span className="text-slate-400 font-medium">RFC:</span>
            <span className="font-mono font-bold text-slate-800">
              {currentClientInfo?.rfc || 'RFC ACTIVO'}
            </span>
          </div>
        </div>

        {/* Accion Principal: Importar / Desmenuzar XMLs */}
        <div className="p-3 border-b border-slate-100">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Cargar Comprobantes XML</span>
          </button>
        </div>

        {/* Controles: Contribuyente & Ejercicio Fiscal */}
        <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-2.5">
          {clients.length > 1 && (
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Contribuyente
              </label>
              <div className="relative">
                <select
                  value={currentClientId}
                  onChange={(e) => setCurrentClientId(e.target.value)}
                  className="w-full bg-white text-slate-800 text-xs font-medium rounded-lg px-2.5 py-1.5 border border-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer appearance-none pr-7 shadow-xs"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.rfc} - {c.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2 pointer-events-none" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Ejercicio Fiscal
            </label>
            <div className="flex gap-1.5">
              <div className="relative flex-1">
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full bg-white text-slate-800 text-xs font-medium rounded-lg px-2.5 py-1.5 border border-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer appearance-none pr-7 shadow-xs"
                >
                  <option value="2021">2021</option>
                  <option value="2022">2022</option>
                  <option value="2023">2023</option>
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2 pointer-events-none" />
              </div>

              <button
                onClick={handleSync}
                disabled={syncing}
                title="Sincronizar y recalcular"
                className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 border border-slate-200 transition-colors cursor-pointer shadow-xs disabled:cursor-wait"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-blue-600' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto p-2.5 space-y-4">
          {navGroups.map((group) => (
            <div key={group.title}>
              <div className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                {group.title}
              </div>
              <div className="space-y-0.5">
                {group.tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200/60 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                      }`}
                    >
                      <IconComponent className={`w-4 h-4 ${
                        isActive ? 'text-blue-600' : 'text-slate-400'
                      }`} />
                      <span className="truncate">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer institucional */}
        <div className="p-3 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between bg-slate-50/50">
          <span>shellaquiles.org</span>
          <span className="font-mono text-slate-700 font-medium">
            {(sections?.reporte_gastos?.length || 0) + (sections?.honorarios?.detalle?.length || 0)} CFDIs
          </span>
        </div>
      </aside>

      {/* ── CONTENIDO PRINCIPAL ── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Navbar */}
        <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0 z-20">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              {activeTabObj?.label}
            </h1>
            <span className="bg-slate-100 text-slate-700 text-xs font-medium px-2 py-0.5 rounded border border-slate-200">
              Ejercicio {year}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {currentClientInfo && (
              <div className="hidden sm:flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 text-xs">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium text-slate-700">{currentClientInfo.name || currentClientInfo.rfc}</span>
              </div>
            )}
          </div>
        </header>

        {/* Contenedor con Scroll */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto pb-12">
            <ErrorBoundary>
              {activeTab === 'dashboard' && (
                <DashboardSection sections={sections} year={year} data={data} />
              )}
              {activeTab === 'pre_mensual' && (
                <PreDeclaracionMensualSection data={data} aeypData={sections?.honorarios} gastosData={sections?.reporte_gastos} year={year} />
              )}
              {activeTab === 'pre_anual' && (
                <PreDeclaracionAnualSection sections={sections} year={year} data={data} />
              )}
              {activeTab === 'egresos_mes' && (
                <EgresosMensualesSection data={sections?.reporte_gastos || []} gastos={sections?.reporte_gastos || []} notasCreditoData={sections?.notas_credito || []} notasCredito={sections?.notas_credito || []} year={year} />
              )}
              {activeTab === 'deducciones' && (
                <DeduccionesPersonalesSection data={sections?.deducciones_personales} deducciones={sections?.deducciones_personales} year={year} />
              )}
              {activeTab === 'nomina' && (
                <SueldosSection data={sections?.sueldos} sueldos={sections?.sueldos} year={year} />
              )}
              {activeTab === 'nomina_detalle' && (
                <NominaDetalleSection data={sections?.sueldos} sueldos={sections?.sueldos} year={year} />
              )}
              {activeTab === 'aeyp' && (
                <HonorariosSection data={sections?.honorarios} honorarios={sections?.honorarios} year={year} />
              )}
              {activeTab === 'facturas_aeyp' && (
                <FacturasAeypSection data={sections?.honorarios} honorarios={sections?.honorarios} year={year} />
              )}
              {activeTab === 'conciliacion_sat' && (
                <ConciliacionSatSection data={data} year={year} onRefresh={loadData} />
              )}
            </ErrorBoundary>
          </div>
        </div>
      </main>

      {/* Modal de Subida de Archivos */}
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
