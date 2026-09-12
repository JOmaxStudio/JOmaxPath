// Local, read-only preview. Development files are never exposed as assets.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const assets = new Set(fs.readdirSync(root).filter(file=>/\.(html|css|js|png)$/.test(file)&&file!=='worker.js'));
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png'};
http.createServer((req,res)=>{
  const url = new URL(req.url,'http://127.0.0.1');
  if(url.pathname.startsWith('/api/')) {res.writeHead(503,{'Content-Type':'application/json'});return res.end(JSON.stringify({error:'El servidor local de previsualització no executa el Worker d’IA.'}));}
  const name=url.pathname.slice(1);
  const file=assets.has(name)?name:(!path.extname(name)&&!name.includes('.')?'index.html':null);
  if(!file){res.writeHead(404);return res.end('Not found');}
  fs.readFile(path.join(root,file),(error,body)=>{
    res.writeHead(error?500:200,{'Content-Type':types[path.extname(file)],'Cache-Control':'no-store'});
    res.end(error?'Read error':body);
  });
}).listen(4173,'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:4173'));
