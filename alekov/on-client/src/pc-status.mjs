import os from 'node:os';
import {statfs} from 'node:fs/promises';

const cpuTotals = () => os.cpus().reduce((a,c) => {
  const t=c.times; a.idle+=t.idle; a.total+=t.user+t.nice+t.sys+t.idle+t.irq; return a;
},{idle:0,total:0});
const round=(v,n=1)=>Math.round(v*10**n)/10**n;
export async function readPcStatus({wait=350}={}) {
  const measuredAt=new Date().toISOString();
  const results={cpu:{value:null,unit:'%',reason:null},memory:{value:null,unit:'GB',reason:null},disk:{value:null,unit:'GB',reason:null}};
  try {
    const a=cpuTotals();await new Promise(resolve=>setTimeout(resolve,wait));const b=cpuTotals();
    if(b.total<=a.total)throw Error('CPU 샘플 차이가 없습니다');
    results.cpu.value=round(100*(1-(b.idle-a.idle)/(b.total-a.total)));
  }catch{results.cpu.reason='CPU 사용률을 읽지 못했습니다';}
  try {
    const total=os.totalmem(),free=os.freemem();
    if(!Number.isFinite(total)||total<=0||!Number.isFinite(free))throw Error('memory');
    results.memory.value=round((total-free)/1e9,2);
    results.memory.total=round(total/1e9,2);
  }catch{results.memory.reason='운영체제 메모리 정보를 읽지 못했습니다';}
  try {
    const disk=await statfs(process.cwd(),{bigint:true});
    const free=Number(disk.bavail*disk.bsize)/1e9;
    if(!Number.isFinite(free))throw Error('disk');
    results.disk.value=round(free,2);
    const total=Number(disk.blocks*disk.bsize)/1e9;
    if(Number.isFinite(total)&&total>0)results.disk.total=round(total,2);
  }catch{results.disk.reason='프로젝트가 있는 디스크의 여유 공간을 읽지 못했습니다';}
  return {source:'local-os',measuredAt,results,notes:'메모리는 시스템 전체 사용량 추정치, 디스크는 프로젝트 폴더가 있는 볼륨의 가용 공간입니다.'};
}
