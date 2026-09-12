const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const context = vm.createContext({ Date });
vm.runInContext(fs.readFileSync('nlp-parser.js','utf8'), context);
const parse = text => vm.runInContext(`parseNaturalLanguage(${JSON.stringify(text)})`, context);
for (const [input, title, end] of [
  ['estudiar física demà a les 18 durant una hora','Estudiar física','19:00'],
  ['estudiar física demà a les 18 durant 30 minuts','Estudiar física','18:30'],
  ['reunió demà de les 18 a les 20','Reunió','20:00'],
]) {
  const result = parse(input);
  assert.equal(result.title,title);
  assert.equal(result.hora_fi,end);
  assert.equal(result.type,'event');
}
assert.equal(parse('nota: portar el llibre').type,'note');
assert.equal(parse('urgent entregar redacció divendres').priority,'urgent');
const app = fs.readFileSync('app.js','utf8');
// Event cards must honor explicit durations, including midnight crossings.
vm.runInContext(app.slice(app.indexOf('function _scheduleEndMinute('),app.indexOf('function _dbRenderNow(')),context);
for (const [event,start,end] of [[{timeEnd:'20:30'},1200,1230],[{endTime:'00:15'},1410,1455],[{duration:30},900,930],[{timeEnd:'99:99'},900,960]]) {
  context.testEvent=event;
  assert.equal(vm.runInContext(`_scheduleEndMinute(testEvent,${start})`,context),end);
}
const localDate = app.match(/function _localDateStr\(d\)\{[\s\S]*?\n\}/)[0];
vm.runInContext(localDate,context);
assert.equal(vm.runInContext('_localDateStr(new Date(2026,8,9,0,15))',context),'2026-09-09');
// Isolate the real dashboard renderer with fixed data; persistence methods must never run.
const home = app.slice(app.indexOf('async function renderHome()'),app.indexOf('function renderExamCountdown()'));
const today = new Date();
const date = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
let counts,shownTasks;
const container = {innerHTML:''};
Object.assign(context, {
  document:{getElementById:id=>id==='dashboard-content'?container:null},
  HABITS_KEY:'habits', STREAK_KEY:'streak', POMO_KEY:'pomo', SCHEDULE_KEY:'schedule',
  get:(key, fallback)=>fallback,
  getLists:()=>[{tasks:[{name:'Completed',done:true,completed_at:today.toISOString()},{name:'Pending',done:false,date},{name:'Overdue',done:false,date:'2020-01-01'},{name:'Old',done:true,completed_at:'2020-01-01T12:00:00Z'}]}],
  _getProfile:async()=>null, _userProfile:{},
  _dbRenderHeader:(_p,_r,_s,_pm,done,pending)=>{counts={done,pending};return '';},
  _dbRenderNow:()=>'', _dbRenderTimeline:(_events,tasks)=>{shownTasks=tasks;return '';}, _dbRenderHabits:()=>'', _dbRenderBottom:()=>'',
});
vm.runInContext(home,context);
vm.runInContext('renderHome()',context).then(()=>{
  assert.deepEqual(counts,{done:1,pending:2});
  assert.ok(shownTasks.some(task=>task.name==='Overdue'),'Overdue work remains actionable on Home');
  console.log('Regressions OK: local date, actual completions, NLP duration/range/type/priority');
}).catch(error=>{console.error(error);process.exitCode=1;});
