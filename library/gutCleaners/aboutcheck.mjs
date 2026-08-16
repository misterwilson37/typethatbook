import JSZip from 'jszip'; import {readFileSync,readdirSync} from 'fs'; import {JSDOM} from 'jsdom';
const dom=new JSDOM(); const {DOMParser}=dom.window; const parser=new DOMParser();
const SRC=readFileSync('./admin.js','utf8');
function lift(n){const s=SRC.indexOf(`function ${n}(`);let d=0,e=-1;for(let j=SRC.indexOf('{',s);j<SRC.length;j++){if(SRC[j]==='{')d++;else if(SRC[j]==='}'){d--;if(!d){e=j+1;break;}}}return SRC.slice(s,e);}
const K=['ABOUT_FILE','ABOUT_EPUB_TYPE','SUBJECT_TO_GENRE'].map(n=>{const m=SRC.match(new RegExp('^const '+n+'[\\s\\S]*?;$','m'));if(!m)throw new Error('miss '+n);return m[0];}).join('\n');
const {detectAbout,classifyDocument,guessGenre,slugifyBookId}=new Function(K+'\n'+
  ['detectAbout','classifyDocument','guessGenre','slugifyBookId'].map(lift).join('\n')+
  '\nreturn{detectAbout,classifyDocument,guessGenre,slugifyBookId};')();
const dir=process.argv[2];
for(const f of readdirSync(dir).filter(x=>x.endsWith('.epub')).sort()){
  const zip=await JSZip.loadAsync(readFileSync(dir+'/'+f));
  const opf=parser.parseFromString(await zip.file('OEBPS/content.opf').async('string'),'text/xml');
  const DC='http://purl.org/dc/elements/1.1/';
  const g=t=>Array.from(opf.getElementsByTagNameNS(DC,t)).map(e=>(e.textContent||'').trim()).filter(Boolean);
  console.log('■',f);
  console.log('  title  ',g('title')[0],'| id:',slugifyBookId(g('title')[0]));
  console.log('  genre  ',guessGenre(g('subject'))||'(blank)');
  console.log('  rights ',g('rights')[0],'→',g('rights')[0]==='Public domain (United States)'?'✓ dropdown':'✗ custom');
  console.log('  source ',g('source')[0],'→',['Standard Ebooks','Project Gutenberg','Global Grey'].includes(g('source')[0])?'✓ dropdown':'✗ custom');
  for(const it of Array.from(opf.getElementsByTagName('item'))){
    const h=it.getAttribute('href'); if(!h.endsWith('.xhtml')||h==='nav.xhtml') continue;
    if(/^chapter-/.test(h)) continue;
    const d=parser.parseFromString(await zip.file('OEBPS/'+h).async('string'),'application/xhtml+xml');
    const cls=classifyDocument(d,h);
    console.log('   %s  matter=%-5s about=%s', h.padEnd(26), cls.cls, detectAbout(d,h,cls.cls)?'YES ✓':'no  ✗');
  }
}
