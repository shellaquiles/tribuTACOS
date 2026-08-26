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
  '#06b6d4', '#ec4899', '#6366f1', '#14b8a6'
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

export const CsvExportButton = ({ onClick, label = 'EXPORTAR CSV', count }) => (
  <button
    onClick={onClick}
    title={`Exportar ${count ? count + ' registros' : 'datos'} a CSV`}
    className="inline-flex items-center gap-2 px-3 py-1.5 border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-900 text-[11px] font-mono font-bold tracking-wider uppercase transition-colors cursor-pointer whitespace-nowrap"
  >
    <Download className="w-3.5 h-3.5 text-zinc-600" />
    <span>{label}</span>
    {count !== undefined && (
      <span className="bg-zinc-100 text-zinc-700 px-1 py-0.2 text-[10px] font-mono border border-zinc-200">
        {count}
      </span>
    )}
  </button>
);

export const SectionCard = ({ icon, title, badge, children, accent }) => (
  <div className={`bg-white border border-zinc-300 mb-6 ${accent || ''}`}>
    <div className="flex items-center justify-between px-6 py-3.5 border-b border-zinc-200 bg-zinc-50/70">
      <div className="flex items-center gap-2.5">
        {icon && (
          <span className="text-zinc-600 text-sm font-semibold">
            {icon}
          </span>
        )}
        <span className="text-xs font-mono font-bold text-zinc-900 uppercase tracking-widest">{title}</span>
      </div>
      {badge != null && (
        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-white text-zinc-700 border border-zinc-300">
          {badge}
        </span>
      )}
    </div>
    <div className="p-6">{children}</div>
  </div>
);

export const KpiRow = ({ items }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-zinc-300 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200 bg-white mb-6">
    {items.map((k, i) => (
      <div
        key={i}
        className="p-5 flex flex-col justify-between hover:bg-zinc-50/50 transition-colors"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500">
            {k.label}
          </span>
          {k.tag && (
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 bg-zinc-100 text-zinc-700 border border-zinc-200">
              {k.tag}
            </span>
          )}
        </div>
        
        <div className="text-2xl font-black text-zinc-950 font-mono tracking-tight tabular-nums mb-1">
          {fmt(k.value)}
        </div>
        
        {k.help && (
          <div className="text-[10px] font-mono text-zinc-400 pt-2 border-t border-zinc-200 mt-1 truncate">
            {k.help}
          </div>
        )}
      </div>
    ))}
  </div>
);

export const InfoField = ({ label, value, help, accent }) => (
  <div className={`p-4 border border-zinc-300 bg-white ${accent || ''}`}>
    <div className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest mb-1">{label}</div>
    <div className="text-lg font-bold text-zinc-950 font-mono tabular-nums">{fmt(value)}</div>
    {help && <div className="text-[11px] font-mono text-zinc-400 mt-1">{help}</div>}
  </div>
);

export const Pill = ({ text, color }) => {
  const colorMap = {
    green: 'bg-emerald-50 text-emerald-900 border-emerald-300',
    emerald: 'bg-emerald-50 text-emerald-900 border-emerald-300',
    red: 'bg-rose-50 text-rose-900 border-rose-300',
    rose: 'bg-rose-50 text-rose-900 border-rose-300',
    amber: 'bg-amber-50 text-amber-900 border-amber-300',
    yellow: 'bg-amber-50 text-amber-900 border-amber-300',
    blue: 'bg-zinc-100 text-zinc-900 border-zinc-300',
    gray: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  };

  const styleClass = colorMap[color] || colorMap.gray;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider border ${styleClass}`}>
      {text}
    </span>
  );
};

export const CalcStep = ({ label, value, op, highlight }) => (
  <div className={`flex items-center justify-between p-3 border text-xs font-mono ${
    highlight
      ? 'bg-zinc-100 border-zinc-400 font-bold text-zinc-950'
      : 'bg-white border-zinc-200 text-zinc-800'
  }`}>
    <div className="flex items-center gap-3">
      <span className="flex items-center justify-center w-5 h-5 border border-zinc-300 bg-white text-zinc-700 text-[10px] font-bold">
        {op}
      </span>
      <span className="font-medium text-[11px] uppercase tracking-wider">{label}</span>
    </div>
    <span className="font-bold tabular-nums">{fmt(value)}</span>
  </div>
);

export const ConceptCard = ({ title, value, accent = 'blue', metaItems, badge, gravado, exento }) => {
  let claveNumber = badge || '';
  let cleanTitle = title || '';

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

  const amountColor = isRed
    ? 'text-rose-900'
    : isGreen
    ? 'text-emerald-900'
    : 'text-zinc-950';

  return (
    <div className="border border-zinc-300 bg-white p-4 flex flex-col justify-between hover:bg-zinc-50/50 transition-colors">
      <div>
        <div className="flex justify-between items-center gap-2 mb-2">
          {claveNumber && (
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-zinc-100 text-zinc-800 border border-zinc-300 tracking-wider">
              {claveNumber}
            </span>
          )}
        </div>
        <div className="text-xs font-semibold text-zinc-800 mb-2 leading-snug line-clamp-2 uppercase tracking-wide">
          {cleanTitle}
        </div>
        <div className={`text-xl font-black ${amountColor} font-mono tabular-nums`}>
          {fmt(value)}
        </div>
      </div>

      {(gravado !== undefined || exento !== undefined || (metaItems && metaItems.length > 0)) && (
        <div className="flex flex-col gap-1 border-t border-zinc-200 pt-2.5 mt-3 font-mono text-[10px]">
          {gravado !== undefined && gravado > 0 && (
            <div className="flex justify-between text-zinc-600">
              <span className="text-zinc-400 uppercase">GRAVADO:</span>
              <span className="font-bold text-zinc-900 tabular-nums">{fmt(gravado)}</span>
            </div>
          )}
          {exento !== undefined && exento > 0 && (
            <div className="flex justify-between text-emerald-800">
              <span className="uppercase">EXENTO:</span>
              <span className="font-bold tabular-nums">{fmt(exento)}</span>
            </div>
          )}
          {metaItems && metaItems.map((m, i) => (
            <div key={i} className="flex justify-between text-zinc-600">
              <span className="text-zinc-400 uppercase">{m.label}:</span>
              <span className="font-medium text-zinc-900 truncate max-w-[130px]">{m.value}</span>
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
          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-mono font-medium transition-colors cursor-pointer text-left border ${
            isActive
              ? 'bg-zinc-900 text-white font-bold border-zinc-900'
              : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 border-transparent'
          }`}
          onClick={() => onTabChange(tab.id)}
        >
          <div className="flex items-center gap-2.5 truncate">
            <span className="text-sm">{tab.icon}</span>
            <span className="truncate uppercase tracking-wider">{tab.label}</span>
          </div>
          {tab.count !== undefined && (
            <span className="text-[10px] px-1 py-0.2 font-mono font-bold bg-zinc-800 text-zinc-300">
              {tab.count}
            </span>
          )}
        </button>
      );
    })}
  </div>
);

