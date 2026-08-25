/**
 * SatUI Barrel Export
 * Re-exports modularized components for clean backward compatibility.
 */

// UI Primitives
export {
  CHART_COLORS,
  MONTH_NAMES,
  fmt,
  CsvExportButton,
  SectionCard,
  KpiRow,
  InfoField,
  Pill,
  CalcStep,
  ConceptCard,
  TabNavigation
} from './components/ui/Primitives';

// Modals
export {
  FriendlyObjectViewer,
  XmlViewerModal,
  CfdiVisualizerModal
} from './components/ui/Modals';

// Nómina
export { ReciboNomina } from './components/nomina/ReciboNomina';
export { SueldosSection } from './components/nomina/SueldosSection';
export { NominaDetalleSection } from './components/nomina/NominaDetalleSection';

// Honorarios / AEyP
export { ReciboAeyp } from './components/honorarios/ReciboAeyp';
export { HonorariosSection } from './components/honorarios/HonorariosSection';
export { AnaliticaAeypSection } from './components/honorarios/AnaliticaAeypSection';
export { FacturasAeypSection } from './components/honorarios/FacturasAeypSection';

// Egresos & Gastos
export { InteractableRow } from './components/egresos/InteractableRow';
export { GastosReport } from './components/egresos/GastosReport';
export {
  getConceptoCat,
  getGastoCat,
  EgresosMensualesSection
} from './components/egresos/EgresosMensualesSection';

// Deducciones & Determinación
export { NotasCreditoSection } from './components/deducciones/NotasCreditoSection';
export { InteresesSection } from './components/deducciones/InteresesSection';
export { DeterminacionSection } from './components/deducciones/DeterminacionSection';
export { DeduccionesPersonalesSection } from './components/deducciones/DeduccionesPersonalesSection';

// Dashboard
export { DashboardSection } from './components/dashboard/DashboardSection';
