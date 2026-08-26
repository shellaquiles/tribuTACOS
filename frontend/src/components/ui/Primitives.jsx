'use client';

import React from 'react';
import {
  Download,
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const CHART_COLORS = [
  '#2563eb', '#10b981', '#f59e0b', '#8b5cf6',
  '#06b6d4', '#ec4899', '#6366f1', '#64748b'
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
    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer active:scale-98 whitespace-nowrap"
  >
    <Download className="w-3.5 h-3.5 text-slate-500" />
    <span>{label}</span>
    {count !== undefined && (
      <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded text-[10px] font-mono font-bold">
        {count}
      </span>
    )}
  </button>
);

export const SectionCard = ({ icon, title, badge, children, accent }) => (
  <div className={`bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden mb-5 ${accent || ''}`}>
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
      <div className="flex items-center gap-2.5">
        {icon && (
          <span className="text-slate-600 text-sm font-semibold">
            {icon}
          </span>
        )}
        <span className="text-sm font-bold text-slate-900 tracking-tight">{title}</span>
      </div>
      {badge != null && (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
          {badge}
        </span>
      )}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

export const KpiRow = ({ items }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
    {items.map((k, i) => {
      return (
        <div
          key={i}
          className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {k.label}
            </span>
            {k.tag && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                {k.tag}
              </span>
            )}
          </div>
          
          <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-mono mb-1">
            {fmt(k.value)}
          </div>
          
          {k.help && (
            <div className="text-[11px] text-slate-500 font-normal pt-1.5 border-t border-slate-100 mt-1">
              {k.help}
            </div>
          )}
        </div>
      );
    })}
  </div>
);

export const InfoField = ({ label, value, help, accent }) => (
  <div className={`p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 ${accent || ''}`}>
    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</div>
    <div className="text-base font-bold text-slate-900 font-mono">{fmt(value)}</div>
    {help && <div className="text-xs text-slate-500 mt-0.5">{help}</div>}
  </div>
);

export const Pill = ({ text, color }) => {
  const colorMap = {
    green: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    red: 'bg-red-50 text-red-800 border-red-200',
    rose: 'bg-red-50 text-red-800 border-red-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    yellow: 'bg-amber-50 text-amber-800 border-amber-200',
    blue: 'bg-slate-100 text-slate-800 border-slate-200',
    gray: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const styleClass = colorMap[color] || colorMap.gray;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${styleClass}`}>
      {text}
    </span>
  );
};

export const CalcStep = ({ label, value, op, highlight }) => (
  <div className={`flex items-center justify-between p-2.5 rounded-lg border text-xs ${
    highlight
      ? 'bg-slate-50 border-slate-300 font-bold text-slate-900 shadow-xs'
      : 'bg-white border-slate-200 text-slate-700'
  }`}>
    <div className="flex items-center gap-2">
      <span className="flex items-center justify-center w-5 h-5 rounded bg-slate-100 text-slate-600 font-mono text-[10px] font-bold">
        {op}
      </span>
      <span className="font-medium">{label}</span>
    </div>
    <span className="font-mono font-semibold">{fmt(value)}</span>
  </div>
);

export const ConceptCard = ({ title, value, accent = 'blue', metaItems, badge, gravado, exento }) => {
  let claveNumber = badge || '';
  let cleanTitle = title || '';

  // Parse title if format is "001 — Concepto..."
  if (!badge && title.includes('—')) {
    const parts = title.split('—');
    claveNumber = parts[0].trim();
    cleanTitle = parts.slice(1).join('—').trim();
  } else if (!badge && title.includes(' - ')) {
    const parts = title.split(' - ');
    claveNumber = parts[0].replace('Clave:', '').trim();
    cleanTitle = parts.slice(1).join(' - ').trim();
  }

  const isRed = accent === 'red' || accent === 'danger' || accent === 'rose';
  const isGreen = accent === 'green' || accent === 'emerald';

  const cardBg = isRed
    ? 'bg-gradient-to-br from-rose-50/80 via-orange-50/30 to-white border-rose-200/90 hover:border-rose-300'
    : isGreen
    ? 'bg-gradient-to-br from-emerald-50/80 via-teal-50/30 to-white border-emerald-200/90 hover:border-emerald-300'
    : 'bg-gradient-to-br from-blue-50/80 via-indigo-50/30 to-white border-blue-200/90 hover:border-blue-300';

  const badgeBg = isRed
    ? 'bg-rose-100 text-rose-800 border-rose-200'
    : isGreen
    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
    : 'bg-blue-100 text-blue-800 border-blue-200';

  const amountColor = isRed
    ? 'text-rose-700'
    : isGreen
    ? 'text-emerald-700'
    : 'text-blue-700';

  return (
    <div className={`rounded-xl p-4 border shadow-xs flex flex-col justify-between transition-all hover:shadow-md hover:-translate-y-0.5 ${cardBg}`}>
      <div>
        <div className="flex justify-between items-center gap-2 mb-2">
          {claveNumber && (
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border font-mono tracking-wider ${badgeBg}`}>
              {claveNumber}
            </span>
          )}
        </div>
        <div className="text-xs font-bold text-slate-800 mb-2.5 leading-snug line-clamp-2">
          {cleanTitle}
        </div>
        <div className={`text-xl font-extrabold ${amountColor} font-mono tracking-tight`}>
          {fmt(value)}
        </div>
      </div>

      {(gravado !== undefined || exento !== undefined || (metaItems && metaItems.length > 0)) && (
        <div className="flex flex-col gap-1.5 border-t border-slate-200/60 pt-2 mt-3 text-[11px]">
          {gravado !== undefined && gravado > 0 && (
            <div className="flex justify-between text-slate-600">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Gravado:</span>
              <span className="font-mono font-medium text-slate-800">{fmt(gravado)}</span>
            </div>
          )}
          {exento !== undefined && exento > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span className="text-[10px] font-semibold uppercase">Exento:</span>
              <span className="font-mono font-medium">{fmt(exento)}</span>
            </div>
          )}
          {metaItems && metaItems.map((m, i) => (
            <div key={i} className="flex justify-between text-slate-600">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">{m.label}:</span>
              <span className="font-medium text-slate-800 truncate max-w-[140px]">{m.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const TabNavigation = ({ tabs, activeTab, onTabChange }) => (
  <div className="flex flex-col gap-0.5">
    {tabs.map(tab => {
      const isActive = activeTab === tab.id;
      return (
        <button
          key={tab.id}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
            isActive
              ? 'bg-zinc-800 text-white font-semibold'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
          onClick={() => onTabChange(tab.id)}
        >
          <div className="flex items-center gap-2 truncate">
            <span className="text-sm">{tab.icon}</span>
            <span className="truncate">{tab.label}</span>
          </div>
          {tab.count !== undefined && (
            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold bg-zinc-800 text-zinc-400">
              {tab.count}
            </span>
          )}
        </button>
      );
    })}
  </div>
);
