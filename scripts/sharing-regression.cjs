const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const app=fs.readFileSync('app.js','utf8');
const code=app.slice(app.indexOf('async function acceptBoardInvite('),app.indexOf('async function joinSharedBoard('));
async function run(action, failure) {
  let accepted=false, added=0, success=0, errors=0, reads=0;
  const context=vm.createContext({
    _supabase:{from(table){
      const query={update(){return query;},eq(){return query;},select(){return query;},async maybeSingle(){
        if(table==='board_invites') {
          if(failure==='write')return {error:{message:'denied'}};
          if(failure==='empty')return {data:null};
          accepted=true;return {data:{id:'temporary'}};
        }
        reads++;
        if(failure==='read')return {error:{message:'offline'}};
        return {data:accepted?{owner_name:'Test'}:null};
      }};return query;
    }},
    getLists:()=>[],_addSharedListFromCloud:async()=>{added++;},
    showErrorToast:()=>errors++,showWarningToast:()=>{},showToast:()=>success++,
    loadBoardInvites:()=>{},renderListsCollection:()=>{},updateSharedTabBadge:()=>{}
  });
  vm.runInContext(code,context);
  await vm.runInContext(`${action}('temporary','BRD_TEST')`,context);
  return {added,success,errors,reads};
}
(async()=>{
  assert.deepEqual(await run('acceptBoardInvite'),{added:1,success:1,errors:0,reads:1});
  for(const action of ['acceptBoardInvite','rejectBoardInvite']) {
    for(const failure of ['write','empty']) {
      assert.deepEqual(await run(action,failure),{added:0,success:0,errors:1,reads:0});
    }
  }
  assert.deepEqual(await run('acceptBoardInvite','read'),{added:0,success:0,errors:1,reads:1});
  assert.equal((await run('rejectBoardInvite')).success,1);
  console.log('Sharing regression OK: acceptance before protected read; no false success on denied/empty writes or failed reads (mocked service)');
})().catch(e=>{console.error(e);process.exitCode=1;});
