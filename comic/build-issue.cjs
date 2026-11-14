const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'..');
const id=process.argv[2]||'2026-11';
if(!/^\d{4}-\d{2}$/.test(id))throw Error('Use YYYY-MM');
const issue=JSON.parse(fs.readFileSync(path.join(__dirname,'issues',id,'issue.json'),'utf8'));
const cast=['ferret','jo','arthur','spyro','tilly','trixie','dexter','daisy'];
if(issue.stories.length!==8||cast.some(n=>!issue.stories.some(s=>s.cast===n&&s.panels.length===4)))throw Error('Eight complete character stories required');
let source=fs.readFileSync(path.join(__dirname,'reader.js'),'utf8').split('function safeHash()')[0];
source+='issue=INPUT;build();OUTPUT=pages;})();';
const context={INPUT:issue,OUTPUT:null};vm.createContext(context);vm.runInContext(source,context);
if(context.OUTPUT.length!==16)throw Error('Expected 16 pages');
const html='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><base href="../../../"><title>'+issue.date+' - The Magnificent Nonsense</title><link rel="stylesheet" href="comic/reader.css"><body><main style="max-width:820px;margin:auto"><p><a href="comic.html#issue='+id+'">Open page-turning reader</a></p>'+context.OUTPUT.map(p=>p.html.replace(/loading="lazy"/g,'loading="eager"')).join('')+'</main></body></html>';
fs.writeFileSync(path.join(__dirname,'issues',id,'transcript.html'),html);
console.log('Validated '+id+': 16 pages; eight four-panel stories; complete standalone edition generated.');

