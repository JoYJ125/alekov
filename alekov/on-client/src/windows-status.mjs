// Windows 진단: 고정된 읽기 전용 명령만 실행. 권한 상승·설정 변경 없음.
import os from 'node:os';
import dns from 'node:dns';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const execFileAsync=promisify(execFile);
const unknown=reason=>({status:'unavailable',reason,measuredAt:new Date().toISOString()});
async function ps(script){
  const {stdout}=await execFileAsync('powershell.exe',['-NoProfile','-NonInteractive','-Command',script],{windowsHide:true,timeout:8000,maxBuffer:1024*1024,encoding:'utf8'});
  const raw=stdout.trim();if(!raw)throw Error('조회 결과가 비어 있습니다');
  return JSON.parse(raw);
}
function errorText(error){
  if(error?.killed||error?.signal)return '조회 시간 초과';
  const msg=String(error?.stderr||error?.message||'알 수 없는 오류');
  if(/access is denied|unauthorized|액세스가 거부|권한/i.test(msg))return '현재 사용자에게 로그 조회 권한이 없습니다';
  return 'Windows 조회 실패: '+msg.slice(0,150);
}
export async function readWindowsStatus(){
  const at=new Date().toISOString();
  const result={source:'windows-local-read-only',measuredAt:at,network:unknown('조회하지 않음'),firewall:unknown('조회하지 않음'),events:unknown('조회하지 않음'),sdp:{status:'disconnected',label:'SDP 미연결',reason:'실제 SDP 연결 성공을 확인하지 않았습니다',measuredAt:at}};
  if(process.platform!=='win32'){
    for(const key of ['network','firewall','events'])result[key]=unknown('Windows에서만 조회할 수 있습니다');
    return result;
  }
  try{
    const adapters=Object.entries(os.networkInterfaces()).flatMap(([name,entries])=>(entries||[]).filter(v=>!v.internal).map(v=>({name,family:v.family,address:v.address}))).slice(0,20);
    const dns=dns.getServers().slice(0,8);
    result.network={status:'ok',measuredAt:new Date().toISOString(),adapters,dns,unit:'개'};
  }catch(e){result.network=unknown('네트워크 조회 실패: '+String(e.message).slice(0,100));}
  try{
    const profiles=await ps("$ErrorActionPreference='Stop'; @(Get-NetFirewallProfile | Select-Object Name,Enabled | ForEach-Object { [pscustomobject]@{name=[string]$_.Name; enabled=[bool]$_.Enabled} }) | ConvertTo-Json -Compress");
    result.firewall={status:'ok',measuredAt:new Date().toISOString(),profiles:Array.isArray(profiles)?profiles:[profiles],readOnly:true};
  }catch(e){result.firewall=unknown(errorText(e));}
  try{
    const script="$ErrorActionPreference='Stop'; $since=(Get-Date).AddHours(-24); $out=@(); foreach($log in @('System','Application')) { $items=@(Get-WinEvent -FilterHashtable @{LogName=$log;StartTime=$since;Level=@(2,3)} -ErrorAction SilentlyContinue); $out+= [pscustomobject]@{log=$log;warning=@($items | Where-Object Level -eq 3).Count;error=@($items | Where-Object Level -eq 2).Count} }; $out | ConvertTo-Json -Compress";
    const counts=await ps(script);
    result.events={status:'ok',measuredAt:new Date().toISOString(),windowHours:24,unit:'건',counts:Array.isArray(counts)?counts:[counts],disclaimer:'Windows 경고·오류 건수는 운영체제 이벤트 통계이며, 침해나 공격 탐지 결과가 아닙니다.'};
  }catch(e){result.events=unknown(errorText(e));}
  return result;
}
