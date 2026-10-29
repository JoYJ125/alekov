const $=id=>document.getElementById(id);
const fields=['cpu','memory','disk'];
const history=[];
function render(data) {
  const at=data?.measuredAt?new Date(data.measuredAt).toLocaleString('ko-KR'):'측정 시각 확인 불가';
  for(const key of fields) {
    const el=$('pc-'+key);if(!el)continue;
    const item=data?.results?.[key];
    el.textContent=typeof item?.value==='number'&&Number.isFinite(item.value)?item.value.toLocaleString('ko-KR')+' '+item.unit:'확인 불가';
    $('pc-'+key+'-detail').textContent=(item?.reason||'실제 PC 측정')+' · '+at;
    updateMeter(key,item);
  }
  $('pc-connection').textContent=document.getElementById('mode-badge')?.textContent||'확인 불가';
  $('pc-connection-detail').textContent='보안 서버 연결은 별도 확인 · '+at;
  $('pc-source').textContent='실제 로컬 PC 측정 · '+at+' · '+(data.notes||'');
  const log=$('pc-log');
  const line=document.createElement('li');
  line.textContent=at+' · '+fields.map(k=>{const v=data.results?.[k];return k.toUpperCase()+': '+(typeof v?.value==='number'?v.value+' '+v.unit:'확인 불가 ('+(v?.reason||'값 없음')+')');}).join(' / ');
  log.prepend(line);while(log.children.length>12)log.lastElementChild.remove();
  const cpu=data.results?.cpu?.value;
  if(typeof cpu==='number'){history.push({at:data.measuredAt,value:cpu});if(history.length>20)history.shift();}
  drawTrend();
}
function updateMeter(key,item) {
  const track=$('pc-'+key+'-track'),bar=$('pc-'+key+'-bar');
  const value=item?.value,total=key==='cpu'?100:item?.total;
  const valid=typeof value==='number'&&Number.isFinite(value)&&typeof total==='number'&&Number.isFinite(total)&&total>0&&value>=0;
  track.classList.toggle('is-unavailable',!valid);
  bar.style.width=valid?Math.min(100,Math.max(0,value/total*100))+'%':'0%';
  if(valid){
    const ratio=Math.min(100,Math.max(0,value/total*100));
    track.setAttribute('aria-valuenow',String(Math.round(ratio)));
    track.setAttribute('aria-valuetext',value+' '+item.unit+' / '+total+' '+item.unit+' ('+ratio.toFixed(1)+'%)');
    if(key!=='cpu')$('pc-'+key).textContent=value.toLocaleString('ko-KR')+' / '+total.toLocaleString('ko-KR')+' '+item.unit;
  }else{
    track.removeAttribute('aria-valuenow');
    track.setAttribute('aria-valuetext','확인 불가: '+(item?.reason||'비율 계산에 필요한 측정값이 없습니다'));
    if(typeof value==='number'&&Number.isFinite(value))$('pc-'+key+'-detail').textContent='실측값 '+value+' '+item.unit+' · 전체 용량 확인 불가 (막대 표시 불가)';
  }
}
function drawTrend() {
  const target=$('pc-trend');target.replaceChildren();
  if(history.length<2){target.textContent='비교할 실측 기록이 부족합니다. 새로 측정 버튼을 눌러 주세요.';return;}
  const ns='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(ns,'svg');
  svg.setAttribute('viewBox','0 0 620 140');svg.setAttribute('role','img');svg.setAttribute('aria-label','CPU 사용률 실측 추이 (단위 퍼센트)');
  const points=history.map((p,i)=>[16+i*588/(history.length-1),124-p.value*1.05]);
  const poly=document.createElementNS(ns,'polyline');
  poly.setAttribute('points',points.map(p=>p.join(',')).join(' '));
  poly.setAttribute('fill','none');poly.setAttribute('stroke','#59e6d2');poly.setAttribute('stroke-width','3');
  svg.append(poly);target.append(svg);
  const note=document.createElement('p');note.className='muted';note.textContent='CPU 사용률 (%) · '+history[0].at+' ~ '+history.at(-1).at+' · 현재 브라우저 세션의 실측값만 비교';target.append(note);
}
async function measure(){
  const button=$('pc-refresh');button.disabled=true;$('pc-source').textContent='측정 중…';
  try {
    const response=await fetch('/api/pc-status',{cache:'no-store'});
    if(!response.ok)throw Error('HTTP '+response.status);
    const json=await response.json();if(!json.ok||!json.data)throw Error('측정 응답 확인 실패');
    render(json.data);
  }catch(e){
    const now=new Date().toLocaleString('ko-KR');
    for(const key of fields){$('pc-'+key).textContent='확인 불가';$('pc-'+key+'-detail').textContent='조회 실패 ('+String(e.message).slice(0,100)+') · '+now;updateMeter(key,null);}
    $('pc-source').textContent='확인 불가 — 로컬 측정 API 응답 실패 · '+now;
    const li=document.createElement('li');li.textContent=now+' · 측정 실패: '+String(e.message).slice(0,100);$('pc-log').prepend(li);
  }finally{button.disabled=false;}
}
$('pc-refresh')?.addEventListener('click',measure);
measure();
