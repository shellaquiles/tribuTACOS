import React, { useMemo } from 'react';
import {
  ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, ReferenceLine
} from 'recharts';
import './SatAnalitica.css';

const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// Vibrant, Premium Color Palettes
const COLORS_IN = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#3b82f6'];
const COLORS_OUT = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16'];

const fmt = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val || 0);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const rawData = payload[0].payload;
    return (
      <div className="custom-tooltip">
        <div className="label">{label}</div>
        <div style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 800, marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '6px', display: 'flex', justifyContent: 'space-between', gap: '2rem' }}>
           <span>Ingreso Bruto Total</span>
           <span>{fmt(rawData.bruto)}</span>
        </div>
        {payload.map((entry, index) => {
          const percent = rawData.bruto ? ((entry.value / rawData.bruto) * 100).toFixed(1) : 0;
          return (
            <div key={index} style={{ color: entry.fill || entry.color || '#fff', fontSize: '0.95rem', fontWeight: 600, marginBottom: '6px', display: 'flex', justifyContent: 'space-between', gap: '2rem' }}>
               <span>{entry.name} <span style={{opacity: 0.7, fontWeight: 400, marginLeft: '4px'}}>({percent}%)</span></span>
               <span>{fmt(entry.value)}</span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

export const AnaliticaSection = ({ data, year }) => {
  const [selectedEmployer, setSelectedEmployer] = React.useState('Global');

  const { lineData, pieIngresos, pieRetenciones, summary } = useMemo(() => {
    if (!data || !data.detalle) return { lineData: [], pieIngresos: [], pieRetenciones: [], summary: {} };
    
    const targetDetalles = selectedEmployer === 'Global' 
        ? data.detalle 
        : data.detalle.filter(emp => emp.nombre === selectedEmployer);

    const allRecibos = targetDetalles.flatMap(emp => emp.recibos);
    const byMonth = Array(12).fill(0).map((_, i) => ({ name: monthNames[i], bruto: 0, retenido: 0, neto: 0 }));
    
    let percMap = {};
    let retMap = {};
    let tBruto = 0, tRet = 0, tNeto = 0, mesesActivos = new Set();
    
    allRecibos.forEach(r => {
      const mMatch = r.fecha.match(/-(\d{2})-/);
      if (mMatch) {
         const mIdx = parseInt(mMatch[1], 10) - 1;
         mesesActivos.add(mIdx);
         const rBruto = (r.percepciones || []).reduce((acc, p) => acc + (p.total || 0), 0);
         const rDeduc = (r.deducciones || []).reduce((acc, d) => acc + (d.importe || 0), 0);
         
         byMonth[mIdx].bruto += rBruto;
         byMonth[mIdx].retenido += rDeduc;
         byMonth[mIdx].neto += (rBruto - rDeduc);

         tBruto += rBruto;
         tRet += rDeduc;
         tNeto += (rBruto - rDeduc);
      }
      
      (r.percepciones || []).forEach(p => {
         const key = `${p.tipo} - ${p.concepto.toUpperCase()}`;
         percMap[p.tipo] = percMap[p.tipo] || { name: key, total: 0 };
         percMap[p.tipo].total += (p.total || 0);
      });
      (r.deducciones || []).forEach(d => {
         const key = `${d.tipo} - ${d.concepto.toUpperCase()}`;
         retMap[d.tipo] = retMap[d.tipo] || { name: key, total: 0 };
         retMap[d.tipo].total += (d.importe || 0);
      });
    });

    const pieIngresos = Object.values(percMap).map(v => ({ name: v.name, value: v.total })).filter(x => x.value > 0).sort((a,b) => b.value - a.value);
    const pieRetenciones = Object.values(retMap).map(v => ({ name: v.name, value: v.total })).filter(x => x.value > 0).sort((a,b) => b.value - a.value);

    const processPie = (arr) => {
        if (arr.length <= 5) return arr;
        const top = arr.slice(0, 4);
        const others = arr.slice(4).reduce((sum, item) => sum + item.value, 0);
        return [...top, { name: 'Otros', value: others }];
    };

    return { 
      lineData: byMonth, 
      pieIngresos: processPie(pieIngresos), 
      pieRetenciones: processPie(pieRetenciones),
      summary: { 
        bruto: tBruto, 
        retenidas: tRet, 
        neto: tNeto, 
        promNeto: tNeto / (mesesActivos.size || 1),
        promBruto: tBruto / (mesesActivos.size || 1)
      }
    };
  }, [data, selectedEmployer]);

  if (!data) return null;

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.45;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    if (percent < 0.04) return null;
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="0.85rem" fontWeight="800" textShadow="0px 1px 3px rgba(0,0,0,0.4)">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '2rem' }}>

      {/* Employeers Navigator */}
      {data.detalle && data.detalle.length > 0 && (
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
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
      )}

      {/* KPI Row (Glowing Premium Cards) */}
      <div className="kpi-row">
         <div className="kpi-card" style={{ '--kpi-gradient': 'linear-gradient(90deg, #3b82f6, #8b5cf6)', '--kpi-text-gradient': 'linear-gradient(135deg, #1e3a8a, #3b82f6)' }}>
            <div className="kpi-title">Masa Salarial Bruta Anual</div>
            <div className="kpi-value">{fmt(summary.bruto)}</div>
         </div>
         <div className="kpi-card" style={{ '--kpi-gradient': 'linear-gradient(90deg, #ef4444, #f97316)', '--kpi-text-gradient': 'linear-gradient(135deg, #7f1d1d, #ef4444)' }}>
            <div className="kpi-title">Deducciones Impactadas</div>
            <div className="kpi-value">{fmt(summary.retenidas)}</div>
         </div>
         <div className="kpi-card" style={{ '--kpi-gradient': 'linear-gradient(90deg, #10b981, #059669)', '--kpi-text-gradient': 'linear-gradient(135deg, #064e3b, #10b981)' }}>
            <div className="kpi-title">Promedio Mensual Neto</div>
            <div className="kpi-value">{fmt(summary.promNeto)}</div>
         </div>
      </div>
      
      {/* 1. Composed Chart Evolución */}
      <div className="chart-card">
        <h3 className="chart-title">📈 Flujo de Caja Mensual</h3>
        <div style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            <ComposedChart data={lineData} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="colorBruto" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.7}/>
                </linearGradient>
                <linearGradient id="colorRetenido" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.7}/>
                </linearGradient>
                <linearGradient id="colorNeto" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.7}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
              <YAxis tickFormatter={(val) => `$${val/1000}k`} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} axisLine={false} tickLine={false} dx={-10} />
              <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(241, 245, 249, 0.4)'}} />
              <Legend wrapperStyle={{ paddingTop: '20px', fontWeight: 600, color: '#475569' }} iconType="circle" />
              <ReferenceLine 
                 y={summary.promBruto} 
                 stroke="#8b5cf6" 
                 strokeDasharray="4 4" 
                 strokeWidth={2} 
                 label={{ 
                   position: 'insideTopLeft', 
                   value: `Promedio Mensual Bruto: ${fmt(summary.promBruto)}`, 
                   fill: '#312e81', 
                   fontSize: 14, 
                   fontWeight: 900,
                   stroke: 'rgba(255,255,255,0.9)',
                   strokeWidth: 4,
                   paintOrder: 'stroke'
                 }} 
              />
              <ReferenceLine 
                 y={summary.promNeto} 
                 stroke="#10b981" 
                 strokeDasharray="4 4" 
                 strokeWidth={2} 
                 label={{ 
                   position: 'insideTopLeft', 
                   value: `Promedio Mensual Neto: ${fmt(summary.promNeto)}`, 
                   fill: '#064e3b', 
                   fontSize: 14, 
                   fontWeight: 900,
                   stroke: 'rgba(255,255,255,0.9)',
                   strokeWidth: 4,
                   paintOrder: 'stroke'
                 }} 
              />
              <Bar dataKey="neto" stackId="a" name="Ingreso Neto" fill="url(#colorNeto)" maxBarSize={40} animationDuration={1000} />
              <Bar dataKey="retenido" stackId="a" name="Retenciones" fill="url(#colorRetenido)" radius={[6, 6, 0, 0]} maxBarSize={40} animationDuration={1000} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Donut Charts Composition */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
         <div className="chart-card">
            <h3 className="chart-title" style={{justifyContent: 'center'}}>🟣 Arquitectura del Ingreso Bruto</h3>
            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie label={renderCustomizedLabel} labelLine={false} data={pieIngresos} cx="50%" cy="50%" innerRadius={80} outerRadius={130} paddingAngle={3} dataKey="value" stroke="none" isAnimationActive={true} animationDuration={1200} animationEasing="ease-out">
                    {pieIngresos.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS_IN[index % COLORS_IN.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '15px', fontWeight: 600, fontSize: '0.9rem', color: '#475569' }} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
         </div>

         <div className="chart-card">
            <h3 className="chart-title" style={{justifyContent: 'center'}}>🔴 Espectro de Deducciones</h3>
            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie label={renderCustomizedLabel} labelLine={false} data={pieRetenciones} cx="50%" cy="50%" innerRadius={80} outerRadius={130} paddingAngle={3} dataKey="value" stroke="none" isAnimationActive={true} animationDuration={1200} animationEasing="ease-out">
                    {pieRetenciones.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS_OUT[index % COLORS_OUT.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '15px', fontWeight: 600, fontSize: '0.9rem', color: '#475569' }} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
         </div>
      </div>
      
    </div>
  );
};
