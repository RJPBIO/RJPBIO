export function exportNOM035(st){try{
  const ml=st.moodLog||[];const h=st.history||[];const now=new Date();
  const totalMin=Math.round((st.totalTime||0)/60);
  const avgMd=ml.length?+(ml.reduce((a,m)=>a+m.mood,0)/ml.length).toFixed(1):0;
  const avgEn=ml.filter(m=>m.energy).length?+(ml.filter(m=>m.energy).reduce((a,m)=>a+m.energy,0)/ml.filter(m=>m.energy).length).toFixed(1):0;
  const withPre=ml.filter(m=>m.pre>0);
  const delta=withPre.length?+(withPre.reduce((a,m)=>a+(m.mood-m.pre),0)/withPre.length).toFixed(2):0;
  const riskCount=ml.filter(m=>m.mood<=2).length;
  const riskPct=ml.length?Math.round((riskCount/ml.length)*100):0;
  const tags={};ml.forEach(m=>{if(m.tag){tags[m.tag]=(tags[m.tag]||0)+1;}});
  const topTags=Object.entries(tags).sort((a,b)=>b[1]-a[1]).slice(0,3);
  const protos={};h.forEach(x=>{protos[x.p]=(protos[x.p]||0)+1;});
  const topProtos=Object.entries(protos).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const hrs=Array(24).fill(0);h.forEach(x=>{hrs[new Date(x.ts).getHours()]++;});
  const peakHr=hrs.indexOf(Math.max(...hrs));
  const uniqueDays=new Set(h.map(x=>new Date(x.ts).toDateString())).size;
  const freqPerWeek=uniqueDays>0?(st.totalSessions/(uniqueDays/7)).toFixed(1):"0";
  const moodByWeek=[];for(let i=0;i<Math.min(ml.length,28);i+=7){const slice=ml.slice(i,i+7);moodByWeek.push(+(slice.reduce((a,m)=>a+m.mood,0)/slice.length).toFixed(1));}
  const bestProto=withPre.length>=2?(()=>{const bp={};withPre.forEach(m=>{if(!bp[m.proto])bp[m.proto]={s:0,c:0};bp[m.proto].s+=m.mood-m.pre;bp[m.proto].c++;});const sorted=Object.entries(bp).sort((a,b)=>(b[1].s/b[1].c)-(a[1].s/a[1].c));return sorted[0]?sorted[0][0]+" (+"+(sorted[0][1].s/sorted[0][1].c).toFixed(1)+")":"N/D";})():"Datos insuficientes";

  const html=`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Informe de Bienestar Laboral — NOM-035</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0F172A;background:#fff;padding:40px;max-width:800px;margin:0 auto;font-size:14px;line-height:1.6}
.header{border-bottom:3px solid #10B981;padding-bottom:20px;margin-bottom:30px}.logo{font-size:24px;font-weight:800;color:#10B981;letter-spacing:-0.5px}.sub{font-size:11px;color:#64748B;margin-top:4px;letter-spacing:2px;text-transform:uppercase}
.meta{display:flex;justify-content:space-between;margin-top:12px;font-size:11px;color:#475569}.badge{background:#10B981;color:#fff;padding:3px 10px;border-radius:12px;font-size:10px;font-weight:700}
h2{font-size:16px;font-weight:800;color:#0F172A;margin:28px 0 14px;padding-bottom:6px;border-bottom:1px solid #E2E8F0}
.grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:20px}.card{background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:14px}.card .v{font-size:22px;font-weight:800;color:#0F172A}.card .l{font-size:10px;color:#64748B;margin-top:2px;text-transform:uppercase;letter-spacing:1px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px}
.risk{background:#FEF2F2;border:1px solid #FECACA;border-radius:10px;padding:14px;margin-bottom:20px}.risk .v{font-size:20px;font-weight:800;color:#DC2626}.risk .l{font-size:11px;color:#DC2626}
.ok{background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:14px;margin-bottom:20px}.ok .v{font-size:20px;font-weight:800;color:#10B981}.ok .l{font-size:11px;color:#10B981}
table{width:100%;border-collapse:collapse;margin-bottom:20px}th{text-align:left;padding:8px 10px;background:#F1F5F9;font-size:10px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #E2E8F0}td{padding:8px 10px;border-bottom:1px solid #F1F5F9;font-size:12px}
.footer{margin-top:40px;padding-top:16px;border-top:2px solid #E2E8F0;font-size:10px;color:#94A3B8;text-align:center}
.imp{font-size:28px;font-weight:800;color:${delta>=0?"#10B981":"#DC2626"};text-align:center;padding:20px;background:${delta>=0?"#F0FDF4":"#FEF2F2"};border-radius:12px;margin-bottom:20px}
.imp span{display:block;font-size:11px;font-weight:400;color:#64748B;margin-top:4px}
@media print{body{padding:20px}}</style></head><body>
<div class="header"><div class="logo">BIO-IGNICIÓN</div><div class="sub">Informe de Bienestar Laboral — Cumplimiento NOM-035-STPS-2018</div>
<div class="meta"><span>Fecha: ${now.toLocaleDateString("es-MX",{year:"numeric",month:"long",day:"numeric"})}</span><span>Periodo: ${h.length?new Date(h[0].ts).toLocaleDateString("es-MX"):"—"} al ${now.toLocaleDateString("es-MX")}</span><span class="badge">MEDIDA PREVENTIVA</span></div></div>

<h2>Resumen Ejecutivo</h2>
<div class="grid"><div class="card"><div class="v">${st.totalSessions}</div><div class="l">Sesiones realizadas</div></div>
<div class="card"><div class="v">${totalMin} min</div><div class="l">Tiempo invertido</div></div>
<div class="card"><div class="v">${uniqueDays}</div><div class="l">Días activos</div></div></div>

<div class="imp">${delta>=0?"+":""}${delta} puntos<span>Mejora promedio de estado emocional por sesión (escala 1-5)</span></div>

<h2>Indicadores de Bienestar (KPIs)</h2>
<div class="grid2">
<div class="${riskPct>30?"risk":"ok"}"><div class="v">${riskPct}%</div><div class="l">Sesiones con estado de tensión alta o agotamiento</div></div>
<div class="ok"><div class="v">${avgMd}/5</div><div class="l">Estado emocional promedio</div></div>
<div class="card"><div class="v">${avgEn}/3</div><div class="l">Energía promedio reportada</div></div>
<div class="card"><div class="v">${freqPerWeek}/sem</div><div class="l">Frecuencia semanal</div></div>
<div class="card"><div class="v">${st.streak} días</div><div class="l">Racha consecutiva actual</div></div>
<div class="card"><div class="v">${peakHr}:00</div><div class="l">Hora pico de actividad</div></div></div>

<h2>Protocolos Utilizados</h2>
<table><tr><th>Protocolo</th><th>Veces usado</th><th>% del total</th></tr>
${topProtos.map(([n,c])=>`<tr><td>${n}</td><td>${c}</td><td>${Math.round(c/st.totalSessions*100)}%</td></tr>`).join("")}</table>

<h2>Contexto Laboral</h2>
<table><tr><th>Contexto</th><th>Frecuencia</th></tr>
${topTags.map(([t,c])=>`<tr><td>${t}</td><td>${c} sesiones</td></tr>`).join("")}
${topTags.length===0?"<tr><td colspan='2'>Sin datos de contexto aún</td></tr>":""}</table>

<h2>Análisis de Efectividad</h2>
<div class="grid2"><div class="card"><div class="v">${bestProto}</div><div class="l">Protocolo más efectivo</div></div>
<div class="card"><div class="v">${withPre.length}</div><div class="l">Sesiones con evaluación pre/post</div></div></div>

<h2>Identificación de Factores de Riesgo</h2>
<div class="${riskPct>30?"risk":"ok"}">
<div class="l">${riskPct>30?"⚠️ Se detectaron "+riskCount+" sesiones con indicadores de tensión alta o agotamiento ("+riskPct+"%). Se recomienda seguimiento y posible canalización conforme al numeral 5.5 de la NOM-035.":"✅ Los indicadores de bienestar se encuentran dentro de rangos aceptables. "+riskCount+" sesiones con tensión detectada ("+riskPct+"%)."}</div></div>

<h2>Cumplimiento NOM-035-STPS-2018</h2>
<table><tr><th>Requisito</th><th>Estado</th><th>Evidencia</th></tr>
<tr><td>Medidas de prevención (5.2)</td><td>✅ Implementado</td><td>${st.totalSessions} sesiones de intervención realizadas</td></tr>
<tr><td>Identificación de riesgo (5.3)</td><td>✅ Activo</td><td>Check-in emocional pre/post en cada sesión</td></tr>
<tr><td>Seguimiento (5.5)</td><td>${riskPct>30?"⚠️ Requiere acción":"✅ Sin alertas"}</td><td>${riskPct}% de sesiones con indicadores de riesgo</td></tr>
<tr><td>Entorno organizacional (5.6)</td><td>✅ Monitoreado</td><td>Datos de contexto laboral: ${topTags.map(t=>t[0]).join(", ")||"pendiente"}</td></tr></table>

<div class="footer">
<p><strong>BIO-IGNICIÓN</strong> — Plataforma de Rendimiento Cognitivo y Bienestar Laboral</p>
<p>Este informe fue generado automáticamente como evidencia de implementación de medidas preventivas conforme a la NOM-035-STPS-2018.</p>
<p>Documento generado: ${now.toLocaleString("es-MX")} | Los datos presentados son autorreportados por el usuario.</p>
</div></body></html>`;

  const blob=new Blob([html],{type:"text/html"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download=`Informe-Bienestar-NOM035-${now.toISOString().split("T")[0]}.html`;
  a.click();URL.revokeObjectURL(url);
}catch(e){console.error(e);}}
