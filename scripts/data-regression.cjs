const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const app = fs.readFileSync('app.js','utf8');
const source = (start,end) => app.slice(app.indexOf(start),app.indexOf(end,app.indexOf(start)));
const data = {
  tasks:[{id:'old-deleted',name:'Old flat task'}],
  lists:[{id:'personal_default',tasks:[{id:'keep',name:'Keep me',done:true,completed_at:'2026-09-09T12:00:00Z'}]}],
  notes:[{id:'old-note',title:'Keep note',content:'Existing content'}],
};
let parsed;
const field = {value:'test'};
const ctx = vm.createContext({Date,console,Set,JSON,
  TASKS_KEY:'tasks',SCHEDULE_KEY:'schedule',NOTES_KEY:'legacy-notes',
  get:(key,fallback)=>structuredClone(data[key]??fallback),
  set:(key,value)=>{data[key]=structuredClone(value);},
  getLists:()=>structuredClone(data.lists),setLists:value=>{data.lists=structuredClone(value);},
  _getNotes:()=>structuredClone(data.notes),_setNotes:value=>{data.notes=structuredClone(value);},
  document:{getElementById:()=>field},parseNaturalLanguage:()=>parsed,
  showToast:()=>{},showWarningToast:()=>{},renderTasques:()=>{},renderNotes:()=>{},closeQuickCapture:()=>{},renderHome:()=>{},
});
vm.runInContext(source('function _injectFlatTasksIntoLists(','// Abans de pujar al núvol'),ctx);
vm.runInContext(source('function submitQuickCapture()','const NOTES_KEY_V2'),ctx);
parsed={type:'task',title:'Captured task',priority:'urgent',date:'2026-09-11'};
vm.runInContext('submitQuickCapture()',ctx);
assert.equal(data.lists[0].tasks.length,2);
assert.equal(data.lists[0].tasks[1].name,'Captured task');
assert.equal(data.lists[0].tasks[1].prio,1);
assert.ok(!data.lists[0].tasks.some(task=>task.id==='old-deleted'));
assert.equal(data.lists[0].tasks[0].completed_at,'2026-09-09T12:00:00Z');
field.value='note';parsed={type:'note',title:'Captured note'};
vm.runInContext('submitQuickCapture()',ctx);
assert.equal(data.notes.length,2);
assert.equal(data.notes[0].content,'Captured note');
assert.equal(data.notes[1].content,'Existing content');
assert.equal(data['legacy-notes'],undefined);
ctx.imported=[{id:'external-completed',name:'Imported',done:true,completed_at:'2026-09-09T12:00:00Z',desc:'Preserve details',subtasks:[{id:'sub',completed:true}]}];
vm.runInContext('_injectFlatTasksIntoLists(imported)',ctx);
const imported=data.lists[0].tasks.find(task=>task.id==='external-completed');
assert.equal(imported.completed_at,'2026-09-09T12:00:00Z');
assert.equal(imported.desc,'Preserve details');
assert.equal(imported.subtasks[0].completed,true);
const analytics = fs.readFileSync('analytics.js','utf8');
vm.runInContext(analytics.slice(analytics.indexOf('function analyticsSummary('),analytics.indexOf('/* ═',analytics.indexOf('function analyticsSummary('))),ctx);
const now = Date.now(), day=864e5;
ctx.sample=[{_ts:now-day},{_ts:now-2*day},{_ts:now-8*day}];ctx.now=now;
assert.match(vm.runInContext('analyticsSummary(sample,now)',ctx),/100% més/);
assert.match(vm.runInContext('analyticsSummary([{_ts:0}],now)',ctx),/no tenen data de completat/);
assert.ok(!vm.runInContext('analyticsSummary([{_ts:now}],now)',ctx).includes('%'));
console.log('Data regressions OK: capture preserves V3 lists/V2 notes, no resurrection, factual analytics');
