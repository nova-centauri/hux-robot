(function(){
  'use strict';
  const data=window.HuxProofSimulation, $=id=>document.getElementById(id);
  const all=[...data.nominal,...data.challenge,...(data.mitigation||[])], select=$('scenario');
  $('suite-result').textContent=`${data.summary.passed} / ${data.summary.total} qualification runs passed`;
  $('suite-explanation').textContent=`Nominal ${data.nominal.filter(r=>r.pass).length}/${data.nominal.length}. Timestep consistency ${data.summary.convergencePass?'passed':'needs investigation'}. All physical tests remain open.`;
  for(const group of [{label:'Nominal qualification runs',rows:data.nominal},{label:'Challenge cases',rows:data.challenge},{label:'CoM adjustment checks',rows:data.mitigation||[]}]){
    const optgroup=document.createElement('optgroup');optgroup.label=group.label;
    for(const row of group.rows){const option=document.createElement('option');option.value=all.indexOf(row);option.textContent=`${row.id} · ${row.pass?'pass':'fail'}`;optgroup.append(option);}select.append(optgroup);
  }
  for(const row of data.summary.groups){const tr=document.createElement('tr');if(row.passed<row.total)tr.className='failed';
    for(const value of [row.id,`${row.passed}/${row.total}`,`${row.worstPathErrorM.toFixed(3)} m`,`${row.worstHeadingErrorDeg.toFixed(2)}°`,`${row.worstPitchDeg.toFixed(2)}°`]){const td=document.createElement('td');td.textContent=value;tr.append(td);}$('sim-results').append(tr);}
  let current, playing=false, lastFrame=null, progress=0;
  const line=(pts,x,y,key)=>pts.map((p,i)=>`${i?'L':'M'}${x(p).toFixed(2)},${y(p[key]).toFixed(2)}`).join(' ');
  function stop(){playing=false;$('play').textContent='Play trace';lastFrame=null;}
  function draw(){
    const trace=current.trace,p=trace[Number($('sample').value)],width=560,height=380,pad=46;
    $('sample-time').value=`${p.t.toFixed(2)} s`;$('sample-speed').textContent=`${p.speed.toFixed(3)} m/s`;
    $('sample-heading').textContent=`${p.heading.toFixed(1)}°`;$('sample-current').textContent=`${p.current.toFixed(2)} A`;
    $('case-error').textContent=`${current.metrics.pathErrorM.toFixed(3)} m`;
    const xs=[0,current.expected.x,...trace.map(p=>p.x)],ys=[0,current.expected.y,...trace.map(p=>p.y)];
    const xmin=Math.min(...xs)-.16,xmax=Math.max(...xs)+.16,ymin=Math.min(...ys)-.16,ymax=Math.max(...ys)+.16;
    const sc=Math.min((width-2*pad)/(xmax-xmin),(height-2*pad)/(ymax-ymin));
    const x=v=>width/2+(v-(xmin+xmax)/2)*sc,y=v=>height/2-(v-(ymin+ymax)/2)*sc;
    const path=trace.map((pt,i)=>`${i?'L':'M'}${x(pt.x)},${y(pt.y)}`).join(' ');
    const tolerance=current.id.includes('grade')?.15:current.id==='drive-with-push'?.2:.12;
    $('path-chart').innerHTML=`<title>${current.id}: recorded ground path</title><path d="M${pad} ${height-pad}H${width-pad} M${pad} ${height-pad}V${pad}" fill="none" stroke="#cad6ca"/><text x="${width-pad}" y="${height-12}" text-anchor="end">Forward X (m)</text><text x="12" y="25">Left Y (m)</text><circle cx="${x(current.expected.x)}" cy="${y(current.expected.y)}" r="${sc*tolerance}" fill="#e7eee2" stroke="#90a98e" stroke-dasharray="4 4"/><path d="${path}" fill="none" stroke="#265f4d" stroke-width="2.5"/><circle cx="${x(0)}" cy="${y(0)}" r="4" fill="#a65431"/><text x="${x(0)+7}" y="${y(0)+18}">start</text><path d="M-10 -6L12 0L-10 6Z" transform="translate(${x(p.x)},${y(p.y)}) rotate(${-p.heading})" fill="#a65431" stroke="#fffefa"/><text x="${pad}" y="${height-12}">${xmin.toFixed(2)} … ${xmax.toFixed(2)} m</text><text x="12" y="45">${ymin.toFixed(2)} … ${ymax.toFixed(2)} m</text>`;
    const extent=Math.max(14,...trace.map(p=>Math.max(Math.abs(p.pitch),Math.abs(p.roll)))),end=trace.at(-1).t||1;
    const tx=pt=>pad+pt.t/end*(width-2*pad),ay=v=>height/2-v/extent*(height/2-pad);
    const grid=[-12,0,12].map(v=>`<path d="M${pad} ${ay(v)}H${width-pad}" stroke="#cad6ca" ${v?'stroke-dasharray="4 4"':''}/><text x="${pad-8}" y="${ay(v)+4}" text-anchor="end">${v}°</text>`).join('');
    $('angle-chart').innerHTML=`<title>${current.id}: pitch and roll over time</title>${grid}<path d="${line(trace,tx,ay,'pitch')}" stroke="#265f4d" fill="none" stroke-width="2"/><path d="${line(trace,tx,ay,'roll')}" stroke="#a65431" fill="none" stroke-width="2"/><path d="M${tx(p)} ${pad}V${height-pad}" stroke="#203830" stroke-width="1"/><circle cx="${tx(p)}" cy="${ay(p.pitch)}" r="4" fill="#265f4d"/><text x="${pad}" y="${height-12}">0 s</text><text x="${width-pad}" y="${height-12}" text-anchor="end">${end.toFixed(1)} s</text>`;
  }
  function choose(){stop();current=all[Number(select.value)];$('sample').max=current.trace.length-1;$('sample').value=0;progress=0;
    $('case-status').className=`status ${current.pass?'pass':'fail'}`;$('case-status').textContent=current.pass?'PASS / simulated':'FAIL / simulated';
    $('case-reasons').textContent=current.reasons.join('; ')||'Every numerical gate passed in this recorded run.';draw();}
  function frame(now){if(!playing)return;if(lastFrame!==null)progress+=(now-lastFrame)/1000;lastFrame=now;
    const trace=current.trace;let i=Number($('sample').value);while(i<trace.length-1&&trace[i].t<progress)i++;$('sample').value=i;draw();if(i===trace.length-1)stop();else requestAnimationFrame(frame);}
  select.addEventListener('change',choose);$('sample').addEventListener('input',()=>{stop();progress=current.trace[Number($('sample').value)].t;draw();});
  $('play').addEventListener('click',()=>{if(playing){stop();return;}if(Number($('sample').value)===current.trace.length-1){$('sample').value=0;progress=0;}playing=true;$('play').textContent='Pause';requestAnimationFrame(frame);});
  choose();
})();
