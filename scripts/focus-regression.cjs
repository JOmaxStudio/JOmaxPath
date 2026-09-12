const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const app=fs.readFileSync('app.js','utf8');
let saved,awards=0;
const button={textContent:''};
const ctx=vm.createContext({Date,console,
  _pomoInterval:1,_pomoSeconds:1,_pomoCurrent:0,_pomoSessions:4,_pomoBreakMin:5,_pomoState:'focus',POMO_KEY:'pomo',
  get:()=>({total:8,today:3,week:8,todayDate:'Wed Sep 09 2020'}),set:(_k,d)=>{saved=d;},
  clearInterval:()=>{},setInterval:()=>2,updatePomoDisplay:()=>{},updatePomoStats:()=>{},updatePomoDailyGoal:()=>{},updatePomoLevel:()=>{},
  showToast:()=>{},_playPomoAlarm:()=>{},rpgOnPomodoro:()=>{awards++;return Promise.resolve();},
  document:{getElementById:()=>button},
});
for(const [a,b] of [['function _pomoTick()','function _playPomoAlarm()'],['function _pomoCompleteFocus()','function pomoReset()']]) vm.runInContext(app.slice(app.indexOf(a),app.indexOf(b)),ctx);
vm.runInContext('_pomoTick()',ctx);
assert.equal(saved.total,9);
assert.equal(saved.today,1,'A session crossing midnight starts the new day count');
assert.equal(saved.todayDate,new Date().toDateString());
assert.equal(ctx._pomoState,'break');assert.equal(ctx._pomoSeconds,300);assert.equal(awards,1);
vm.runInContext('_pomoSeconds=1;_pomoTick()',ctx);
assert.equal(ctx._pomoState,'idle');assert.equal(awards,1,'Break completion never grants a second focus reward');
console.log('Focus lifecycle OK: completion, midnight, break, single reward');
