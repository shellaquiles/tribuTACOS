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
  Building
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
        <div className="p-6 bg-rose-50 border border-rose-200 my-4 text-rose-950 text-xs font-mono">
          <div className="font-bold uppercase tracking-wider mb-1">Error al procesar esta sección:</div>
          <code className="bg-white p-3 border border-rose-200 block mt-2 text-rose-900 overflow-x-auto">
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

  // ─── Estructura de Navegación Editorial Suiza ───────────────────────────
  const navGroups = [
    {
      title: 'RESUMEN Y AUDITORÍA',
      tabs: [
        { id: 'dashboard', label: 'Dashboard Principal', icon: LayoutDashboard },
      ]
    },
    {
      title: 'PRE-DECLARACIONES SAT',
      tabs: [
        { id: 'pre_mensual', label: 'Pagos Provisionales (Mensual)', icon: CalendarCheck },
        { id: 'pre_anual',   label: 'Declaración Anual',              icon: Landmark },
      ]
    },
    {
      title: 'EGRESOS Y DEDUCCIONES',
      tabs: [
        { id: 'egresos_mes', label: 'Gastos y Facturas Recibidas', icon: Receipt },
        { id: 'deducciones', label: 'Deducciones Personales',      icon: HeartHandshake },
      ]
    },
    {
      title: 'INGRESOS Y NÓMINA',
      tabs: [
        { id: 'nomina',        label: 'Sueldos y Salarios',        icon: Users },
        { id: 'nomina_detalle',label: 'Detalle de Recibos',        icon: FileSpreadsheet },
        { id: 'aeyp',          label: 'Honorarios / Act. Prof.',   icon: Briefcase },
        { id: 'facturas_aeyp', label: 'Facturas Emitidas',        icon: FileText },
      ]
    },
    {
      title: 'CONCILIACIÓN OFICIAL',
      tabs: [
        { id: 'conciliacion_sat', label: 'Conciliación SAT (PDFs)', icon: ShieldCheck },
      ]
    },
  ];

  const allTabs = navGroups.flatMap(g => g.tabs);
  const activeTabObj = allTabs.find(t => t.id === activeTab);

  if (loading && !data) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-zinc-900 font-mono">
      <div className="text-2xl font-black tracking-tight mb-1">
        tribuTACOS
      </div>
      <div className="text-[11px] text-zinc-400 uppercase tracking-widest mb-6">
        SISTEMA DE INTELIGENCIA FISCAL • SHELLAQUILES.ORG
      </div>
      <p className="text-zinc-600 text-xs text-center max-w-sm mb-6 uppercase tracking-wider">
        Procesando ejercicio fiscal {year}...
      </p>
      <div className="w-32 h-[2px] bg-zinc-200 overflow-hidden">
        <div className="h-full bg-zinc-900 animate-[pulse_1s_infinite]" />
      </div>
    </div>
  );

  if (error && !data) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-zinc-900 font-mono text-center">
      <div className="text-xs font-bold uppercase tracking-widest text-rose-800 mb-2">ERROR DE CONEXIÓN FISCAL</div>
      <h3 className="text-base font-bold text-zinc-950 mb-1">Servidor API no disponible (:8010)</h3>
      <div className="text-[11px] text-zinc-400 mb-6 uppercase tracking-wider">shellaquiles.org • tribuTACOS</div>
      <p className="text-zinc-600 text-xs max-w-md mb-6 font-mono bg-zinc-50 p-4 border border-zinc-300 text-left overflow-x-auto">
        <code>{error}</code>
      </p>
      <button
        onClick={() => loadData(true)}
        className="px-5 py-2.5 bg-zinc-900 hover:bg-black text-white text-xs font-mono font-bold uppercase tracking-wider border border-zinc-900 transition-colors cursor-pointer"
      >
        Reintentar conexión
      </button>
    </div>
  );

  const { sections } = data || {};

  return (
    <div className="flex h-screen overflow-hidden bg-white text-zinc-900 font-sans">
      
      {/* ── SIDEBAR SUIZO MINIMALISTA (1px Grid Border, Monospace Accents) ── */}
      <aside className="w-64 bg-white text-zinc-800 flex flex-col border-r border-zinc-300 flex-shrink-0 z-30">
        
        {/* Brand Header */}
        <div className="p-5 border-b border-zinc-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-black text-zinc-950 tracking-tight font-mono">
                tribuTACOS
              </div>
              <div className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest">
                shellaquiles.org
              </div>
            </div>
            <div className="w-2 h-2 bg-emerald-800" title="Sistema Activo" />
          </div>
          
          <div className="mt-3 flex items-center justify-between bg-zinc-50 px-2.5 py-1.5 border border-zinc-200 text-[10px] font-mono">
            <span className="text-zinc-400 uppercase">RFC:</span>
            <span className="font-bold text-zinc-900">
              {currentClientInfo?.rfc || 'ACTIVO'}
            </span>
          </div>
        </div>

        {/* Acción Principal: Cargar XMLs */}
        <div className="p-3 border-b border-zinc-200">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-zinc-900 hover:bg-black text-white text-xs font-mono font-bold uppercase tracking-wider border border-zinc-900 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>CARGAR CFDIs (XML)</span>
          </button>
        </div>

        {/* Controles: Contribuyente & Ejercicio Fiscal */}
        <div className="p-3 border-b border-zinc-200 bg-zinc-50/50 flex flex-col gap-2.5 font-mono">
          {clients.length > 1 && (
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                Contribuyente
              </label>
              <div className="relative">
                <select
                  value={currentClientId}
                  onChange={(e) => setCurrentClientId(e.target.value)}
                  className="w-full bg-white text-zinc-900 text-xs font-mono rounded-none px-2.5 py-1.5 border border-zinc-300 focus:outline-none focus:border-zinc-900 cursor-pointer appearance-none pr-7"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.rfc} - {c.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500 absolute right-2 top-2 pointer-events-none" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
              Ejercicio Fiscal
            </label>
            <div className="flex gap-1.5">
              <div className="relative flex-1">
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full bg-white text-zinc-900 text-xs font-mono rounded-none px-2.5 py-1.5 border border-zinc-300 focus:outline-none focus:border-zinc-900 cursor-pointer appearance-none pr-7"
                >
                  <option value="2021">2021</option>
                  <option value="2022">2022</option>
                  <option value="2023">2023</option>
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500 absolute right-2 top-2 pointer-events-none" />
              </div>

              <button
                onClick={handleSync}
                disabled={syncing}
                title="Sincronizar y recalcular"
                className="px-2.5 py-1.5 bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-300 transition-colors cursor-pointer disabled:cursor-wait"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-zinc-900' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Navegación por grupos */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-5">
          {navGroups.map((group) => (
            <div key={group.title}>
              <div className="px-2 text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 mb-1.5">
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
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-mono transition-colors cursor-pointer text-left border ${
                        isActive
                          ? 'bg-zinc-900 text-white font-bold border-zinc-900'
                          : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 border-transparent'
                      }`}
                    >
                      <IconComponent className={`w-3.5 h-3.5 ${
                        isActive ? 'text-white' : 'text-zinc-500'
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
        <div className="p-3 border-t border-zinc-200 text-[10px] font-mono text-zinc-500 flex items-center justify-between bg-zinc-50">
          <a
            href="https://github.com/shellaquiles/tribuTACOS"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-zinc-700 hover:text-blue-600 hover:underline transition-colors cursor-pointer"
            title="Ver repositorio en GitHub"
          >
            v1.0.1 • STABLE
          </a>
          <span className="text-zinc-800 font-bold">
            {(sections?.reporte_gastos?.length || 0) + (sections?.honorarios?.detalle?.length || 0)} CFDIs
          </span>
        </div>
      </aside>



      {/* ── CONTENIDO PRINCIPAL ── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-zinc-50/40">
        
        {/* Top Navbar */}
        <header className="h-14 bg-white border-b border-zinc-300 px-8 flex items-center justify-between flex-shrink-0 z-20">
          <div className="flex items-center gap-4">
            <h1 className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-900">
              {activeTabObj?.label}
            </h1>
            <span className="font-mono text-[11px] font-bold text-zinc-700 bg-zinc-100 px-2 py-0.5 border border-zinc-200">
              EJERCICIO {year}
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono">
            {currentClientInfo && (
              <div className="hidden sm:flex items-center gap-2 bg-white px-3 py-1 border border-zinc-300 text-xs">
                <Building className="w-3.5 h-3.5 text-zinc-500" />
                <span className="font-bold text-zinc-800">{currentClientInfo.name || currentClientInfo.rfc}</span>
              </div>
            )}
          </div>
        </header>

        {/* Contenedor con Scroll */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
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

        {/* Footer Editorial Suizo */}
        <footer className="bg-white border-t border-zinc-300 px-8 py-2.5 flex-shrink-0 z-20 font-mono text-[10px] text-zinc-500 flex justify-between items-center">
          <div>
            <span className="font-bold text-zinc-800 uppercase mr-2">AVISO LEGAL:</span>
            <span>SIMULACIÓN FISCAL ESTIMATIVA (LISR/LIVA). NO SUSTITUYE PRESENTACIONES ANTE EL SAT.</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/shellaquiles/tribuTACOS"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-blue-600 px-2 py-0.5 border border-zinc-300 font-bold transition-colors cursor-pointer"
              title="Repositorio Oficial de tribuTACOS en GitHub"
            >
              v1.0.1 STABLE
            </a>
            <a
              href="https://github.com/shellaquiles/tribuTACOS"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-zinc-900 font-semibold transition-colors cursor-pointer"
            >
              tribuTACOS • shellaquiles.org
            </a>
          </div>
        </footer>
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

