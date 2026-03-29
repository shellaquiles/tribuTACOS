import React, { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const COLORS_IN = ['#10b981', '#34d399', '#6ee7b7', '#059669', '#047857', '#065f46'];
const COLORS_OUT = ['#ef4444', '#f87171', '#fca5a5', '#dc2626', '#b91c1c', '#991b1b'];

const fmt = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val || 0);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: 'white', padding: '10px', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <p style={{ fontWeight: 'bold', margin: '0 0 5px 0' }}>{label}</p>
        {payload.map((entry, index) => (
          <div key={index} style={{ color: entry.color, fontSize: '0.9rem', marginBottom: '3px' }}>
             {entry.name}: {fmt(entry.value)}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const AnaliticaSection = ({ data, year }) => {
  const [selectedEmployer, setSelectedEmployer] = React.useState('Global');

  const { lineData, pieIngresos, pieRetenciones } = useMemo(() => {
    if (!data || !data.detalle) return { lineData: [], pieIngresos: [], pieRetenciones: [] };
    
    // Filter by selected employer
    const targetDetalles = selectedEmployer === 'Global' 
        ? data.detalle 
        : data.detalle.filter(emp => emp.nombre === selectedEmployer);

    const allRecibos = targetDetalles.flatMap(emp => emp.recibos);
    
    const byMonth = Array(12).fill(0).map((_, i) => ({ name: monthNames[i], bruto: 0, retenido: 0, neto: 0 }));
    
    let percMap = {};
    let retMap = {};
    
    allRecibos.forEach(r => {
      const mMatch = r.fecha.match(/-(\d{2})-/);
      if (mMatch) {
         const mIdx = parseInt(mMatch[1], 10) - 1;
         const rBruto = (r.percepciones || []).reduce((acc, p) => acc + (p.total || 0), 0);
         const rDeduc = (r.deducciones || []).reduce((acc, d) => acc + (d.importe || 0), 0);
         
         byMonth[mIdx].bruto += rBruto;
         byMonth[mIdx].retenido += rDeduc;
         byMonth[mIdx].neto += (rBruto - rDeduc);
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

    // Group small slices as "Otros"
    const processPie = (arr) => {
        if (arr.length <= 5) return arr;
        const top = arr.slice(0, 4);
        const others = arr.slice(4).reduce((sum, item) => sum + item.value, 0);
        return [...top, { name: 'Otros', value: others }];
    };

    return { lineData: byMonth, pieIngresos: processPie(pieIngresos), pieRetenciones: processPie(pieRetenciones) };
  }, [data, selectedEmployer]);

  if (!data) return null;

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    if (percent < 0.05) return null;
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="0.75rem" fontWeight="bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {data.detalle && data.detalle.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
           <button 
             onClick={() => setSelectedEmployer('Global')}
             style={{ 
               padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid #cbd5e1', cursor: 'pointer',
               backgroundColor: selectedEmployer === 'Global' ? '#0ea5e9' : 'white',
               color: selectedEmployer === 'Global' ? 'white' : '#475569',
               fontWeight: selectedEmployer === 'Global' ? '600' : '400',
               transition: 'all 0.2s', fontSize: '0.9rem'
             }}
           >
             🌐 Global
           </button>
           {data.detalle.map((emp, i) => (
             <button 
               key={i}
               onClick={() => setSelectedEmployer(emp.nombre)}
               style={{ 
                 padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid #cbd5e1', cursor: 'pointer',
                 backgroundColor: selectedEmployer === emp.nombre ? '#0ea5e9' : 'white',
                 color: selectedEmployer === emp.nombre ? 'white' : '#475569',
                 fontWeight: selectedEmployer === emp.nombre ? '600' : '400',
                 transition: 'all 0.2s', fontSize: '0.9rem'
               }}
             >
               🏢 {emp.nombre.length > 25 ? emp.nombre.substring(0, 25) + '...' : emp.nombre}
             </button>
           ))}
        </div>
      )}
      
      {/* 1. Bar/Line Chart Evolución */}
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#1e293b', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
           📈 Evolución Salarial Anual
        </h3>
        <div style={{ width: '100%', height: 350 }}>
          <ResponsiveContainer>
            <BarChart data={lineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(val) => `$${val/1000}k`} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="bruto" name="Ingreso Bruto" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="retenido" name="Retenciones" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="neto" name="Neto Recibido" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Donut Charts Composition */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1fr)', gap: '2rem' }}>
         <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#1e293b', fontSize: '1.1rem', textAlign: 'center' }}>🟢 Composición del Ingreso</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie label={renderCustomizedLabel} labelLine={false} data={pieIngresos} cx="50%" cy="50%" innerRadius={50} outerRadius={110} paddingAngle={2} dataKey="value">
                    {pieIngresos.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS_IN[index % COLORS_IN.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '20px', fontSize: '0.8rem' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
         </div>

         <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#1e293b', fontSize: '1.1rem', textAlign: 'center' }}>🔴 Desglose de Deducciones</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie label={renderCustomizedLabel} labelLine={false} data={pieRetenciones} cx="50%" cy="50%" innerRadius={50} outerRadius={110} paddingAngle={2} dataKey="value">
                    {pieRetenciones.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS_OUT[index % COLORS_OUT.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '20px', fontSize: '0.8rem' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
         </div>
      </div>
      
    </div>
  );
};
