const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const app=fs.readFileSync('app.js','utf8');
const start=app.indexOf('async function _saveUserDataToCloud(');
const save=app.slice(start,app.indexOf('// Auto-save every 90s',start));
async function scenario({readError=null,writeError=null}={}) {
  const store=new Map(Object.entries({
    jomaxpath_tasks:JSON.stringify([{id:'keep'}]),
    jomaxpath_lists_v3:JSON.stringify([{id:'personal_default',tasks:[{id:'keep'}]}]),
    jomaxpath_notes_v2:JSON.stringify([{id:'note',content:'Keep current notes'}]),
    jomaxpath_schedule_monthly_2026_8:JSON.stringify({10:[{id:'event'}]}),
    jomaxpath_exams_v1:JSON.stringify([{id:'exam'}]),
  }));
  let payload, injected=[];
  const cloud={future_key:{preserve:true},jomaxpath_tasks:[{id:'keep'},{id:'deleted'},{id:'external'}],jomaxpath_lists_v3:[{id:'personal_default',tasks:[{id:'keep'},{id:'deleted'}]}]};
  const context=vm.createContext({Date,JSON,Set,Array,Object,Promise,
    setTimeout:()=>0, // No real waiting; test responses are immediate.
    localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v),key:i=>[...store.keys()][i],get length(){return store.size;}},
    _syncListsToFlatTasks:()=>{},
    _injectFlatTasksIntoLists:items=>{injected=items;return 0;},
    _currentPage:'home',get:(_k,fallback)=>fallback,
    _supabase:{from:()=>({select:()=>({eq:()=>({single:async()=>({data:readError?null:{data:cloud},error:readError})})}),upsert:async row=>{payload=row;return{error:writeError};}})},
  });
  vm.runInContext(save,context);
  const ok=await vm.runInContext("_saveUserDataToCloud('test-user')",context);
  return {ok,payload,injected};
}
(async()=>{
  const saved=await scenario();
  assert.equal(saved.ok,true);
  assert.equal(saved.payload.data.jomaxpath_notes_v2[0].id,'note');
  assert.equal(saved.payload.data.jomaxpath_schedule_monthly_2026_8[10][0].id,'event');
  assert.equal(saved.payload.data.jomaxpath_exams_v1[0].id,'exam');
  assert.equal(saved.payload.data.future_key.preserve,true);
  assert.deepEqual(saved.injected.map(t=>t.id),['external']);
  const unreadable=await scenario({readError:{message:'Offline'}});
  assert.equal(unreadable.ok,false);
  assert.equal(unreadable.payload,undefined,'Never replace cloud data after a failed read');
  assert.equal((await scenario({writeError:{message:'RLS denied'}})).ok,false);
  console.log('Sync contract OK: notes, calendar, exams, unknown keys, deletions and error reporting (mocked service)');
})().catch(e=>{console.error(e);process.exitCode=1;});
