(function(){
  const corpus = window.TG_SEED_CORPUS || [];
  const index = window.TG_SEED_INDEX || {};
  const forms = window.TG_SEED_FORMS || {};
  const lemmaForms = window.TG_SEED_LEMMA_FORMS || {};
  const dict = window.TG_SEED_DICT || {};
  let seedMode=false, card=null, toggleBtn=null;

  function escapeHTML(s){return String(s||'').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  function escapeRegExp(s){return String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
  function cleanWord(raw){
    const m=String(raw||'').toLowerCase().replace(/’/g,"'").match(/[a-z]+(?:'[a-z]+)?/);
    let w=m ? m[0].replace(/^'+|'+$/g,'') : '';
    if(w.endsWith("'s") && w.length>2) w=w.slice(0,-2);
    if(w.endsWith("s'") && w.length>3) w=w.slice(0,-1);
    return w;
  }
  function fallbackLemma(w){
    if(!w) return '';
    if(forms[w]) return forms[w];
    if(index[w]) return w;
    if(w.length>4 && /ies$/.test(w)) return w.slice(0,-3)+'y';
    if(w.length>5 && /ing$/.test(w)){
      const b=w.slice(0,-3), opts=[b,b+'e',b.replace(/([b-df-hj-np-tv-z])\1$/,'$1')];
      return opts.find(x=>index[x]) || opts[1];
    }
    if(w.length>4 && /ied$/.test(w)) return w.slice(0,-3)+'y';
    if(w.length>4 && /ed$/.test(w)){
      const b=w.slice(0,-2), opts=[b,b+'e',b.replace(/([b-df-hj-np-tv-z])\1$/,'$1')];
      return opts.find(x=>index[x]) || opts[1];
    }
    if(w.length>4 && /es$/.test(w)) return index[w.slice(0,-2)] ? w.slice(0,-2) : w.slice(0,-1);
    if(w.length>3 && /s$/.test(w) && !/ss$/.test(w)) return w.slice(0,-1);
    return w;
  }
  function toLemma(raw){const w=cleanWord(raw); return forms[w] || (index[w] ? w : fallbackLemma(w));}
  function variantsFor(lemma, raw){return Array.from(new Set([raw, lemma].concat(lemmaForms[lemma] || []))).filter(Boolean).sort((a,b)=>b.length-a.length);}
  function rootPrefix(){return /\/(english1|english2)\//.test(location.pathname) ? '../' : '';}
  function hitURL(hit, lemma){const q=new URLSearchParams({tg_seed:lemma,tg_hit:hit.id,tg_text:String(hit.text),tg_para:String(hit.paragraph),tg_sent:String(hit.sentenceNo)}); return rootPrefix()+hit.path+'?'+q.toString();}
  function seedbankURL(raw){
    const cleanReturn = new URL(location.href);
    cleanReturn.searchParams.delete('tg_return_y');
    cleanReturn.searchParams.delete('tg_seed_mode');
    const u = new URL(rootPrefix()+'seedbank.html', location.href);
    u.searchParams.set('q', cleanWord(raw));
    u.searchParams.set('from', 'reader');
    u.searchParams.set('return', cleanReturn.href);
    u.searchParams.set('y', String(Math.max(0, Math.round(window.scrollY || document.documentElement.scrollTop || 0))));
    return u.href;
  }
  function highlight(sentence, variants){let safe=escapeHTML(sentence); const words=variants.map(escapeRegExp).filter(Boolean); if(!words.length) return safe; const re=new RegExp('\\b('+words.join('|')+')\\b','gi'); return safe.replace(re,'<mark class="tg-seed-mark">$1</mark>');}
  function hitsFor(lemma){return (index[lemma]||[]).map(i=>corpus[i]).filter(Boolean);}
  function removeCard(){ if(card){ card.remove(); card=null; } }
  function wordFromPoint(x,y,target){
    let node=null, offset=0;
    if(document.caretRangeFromPoint){ const r=document.caretRangeFromPoint(x,y); if(r){node=r.startContainer; offset=r.startOffset;} }
    else if(document.caretPositionFromPoint){ const p=document.caretPositionFromPoint(x,y); if(p){node=p.offsetNode; offset=p.offset;} }
    if(node && node.nodeType===3){
      const text=node.textContent||''; let left=offset,right=offset;
      while(left>0 && /[A-Za-z'’]/.test(text[left-1])) left--;
      while(right<text.length && /[A-Za-z'’]/.test(text[right])) right++;
      return cleanWord(text.slice(left,right));
    }
    return cleanWord(target && target.textContent);
  }
  function showCard(raw, x, y){
    removeCard(); const lemma=toLemma(raw); if(!lemma) return;
    const hits=hitsFor(lemma), d=dict[lemma], seedbankHref=seedbankURL(raw);
    card=document.createElement('div'); card.className='tg-seed-card'; card.setAttribute('role','dialog'); card.setAttribute('aria-label','种子查词卡');
    const ety = d && d.etymology && d.etymology.hint ? `<div class="tg-seed-etymology"><div class="tg-seed-etymology-title"><span>🫛</span><b>词源小提示</b></div><span>${escapeHTML(d.etymology.hint)}</span></div>` : '';
    card.innerHTML=`<div class="tg-seed-card-head"><div><h3>${escapeHTML(raw)}</h3>${lemma!==raw?`<span class="lemma">原型：${escapeHTML(lemma)}</span>`:'<span class="lemma">种子原型</span>'}${d&&d.phonetic?`<div class="phonetic">/${escapeHTML(d.phonetic)}/</div>`:''}</div><button class="tg-seed-close" type="button" aria-label="关闭">×</button></div><div class="translation">${d?escapeHTML(d.translation):'暂时没有找到合适的内置释义，可以打开种子库，结合真题原句继续查看。'}</div>${ety}<p class="summary">这粒种子在真题中出现 ${hits.length} 处。打开种子库后，可以顺着词源小提示与不同释义，查看它在各年份里的原句；点击“返回阅读位置”会回到你刚才看的地方。</p><div class="tg-seed-actions"><a class="tg-seed-action primary" href="${escapeHTML(seedbankHref)}">打开种子库</a></div>`;
    document.body.appendChild(card);
    const rect=card.getBoundingClientRect();
    const left=Math.min(Math.max(14,x+12), window.innerWidth-rect.width-14);
    const top=Math.min(Math.max(14,y+12), window.innerHeight-rect.height-14);
    card.style.left=left+'px'; card.style.top=top+'px';
    card.querySelector('.tg-seed-close').addEventListener('click', removeCard);
  }
  function addToggle(){
    if(!document.querySelector('.article-text')) return;
    const params=new URLSearchParams(location.search);
    const btn=document.createElement('button'); toggleBtn=btn; btn.className='tg-seed-toggle'; btn.type='button'; btn.textContent='拾取种子'; btn.title='开启后点击原文英文单词查词';
    function render(){ document.body.classList.toggle('tg-seed-mode',seedMode); btn.classList.toggle('is-on',seedMode); btn.textContent=seedMode?'种子拾取中':'拾取种子'; }
    btn.addEventListener('click',()=>{seedMode=!seedMode; render(); removeCard();});
    document.body.appendChild(btn);
    if(params.get('tg_seed_mode')==='1'){ seedMode=true; render(); }
  }
  function markWords(el, variants){
    const words=variants.map(escapeRegExp).filter(Boolean); if(!words.length) return;
    const re=new RegExp('\\b('+words.join('|')+')\\b','gi');
    const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,{acceptNode(n){ if(!n.nodeValue.trim()) return NodeFilter.FILTER_REJECT; if(n.parentElement && n.parentElement.closest('script,style,mark,.tg-seed-located-note')) return NodeFilter.FILTER_REJECT; return re.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; }});
    const nodes=[]; while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node=>{ const frag=document.createDocumentFragment(); let last=0; node.nodeValue.replace(re,(m,_w,off)=>{ frag.appendChild(document.createTextNode(node.nodeValue.slice(last,off))); const mark=document.createElement('mark'); mark.className='tg-seed-word-mark'; mark.textContent=m; frag.appendChild(mark); last=off+m.length; }); frag.appendChild(document.createTextNode(node.nodeValue.slice(last))); node.parentNode.replaceChild(frag,node); });
  }
  function showToast(text){ const toast=document.createElement('div'); toast.className='tg-seed-located-toast'; toast.textContent=text; document.body.appendChild(toast); setTimeout(()=>toast.remove(),5200); }
  function locateFromURL(){
    const params=new URLSearchParams(location.search); const hitId=params.get('tg_hit'); const seed=params.get('tg_seed'); if(!hitId || !seed) return;
    const lemma=toLemma(seed); const hit=corpus.find(h=>h.id===hitId); if(!hit) return;
    const unit=document.getElementById(`y${hit.year}-t${hit.text}`) || document.getElementById(`text-${hit.text}`) || document.querySelectorAll('.text-unit')[hit.text-1];
    const paras=unit ? Array.from(unit.querySelectorAll('.article-body.article-text p.para, .article-body.article-text p')) : [];
    const para=paras[hit.paragraph-1] || paras[0]; if(!para) return;
    para.classList.add('tg-seed-hit-para');
    const note=document.createElement('span'); note.className='tg-seed-located-note'; note.textContent=`已定位：${seed} · ${hit.examLabel} ${hit.year} Text ${hit.text} P${hit.paragraph} S${hit.sentenceNo}｜${hit.sentence}`;
    para.insertBefore(note, para.firstChild);
    markWords(para, variantsFor(lemma, seed));
    setTimeout(()=>para.scrollIntoView({behavior:'smooth',block:'center'}),80);
    showToast(`已高亮：${seed} · ${hit.examLabel} ${hit.year} Text ${hit.text} P${hit.paragraph} S${hit.sentenceNo}`);
  }
  function handleReaderReturn(){
    const params=new URLSearchParams(location.search); const y=params.get('tg_return_y'); if(y===null) return;
    const pos=Math.max(0, parseInt(y,10)||0);
    setTimeout(()=>window.scrollTo({top:pos,behavior:'auto'}),80);
    showToast('已返回到刚才阅读的位置');
    params.delete('tg_return_y'); params.delete('tg_seed_mode');
    const clean=location.pathname+(params.toString()?('?'+params.toString()):'')+location.hash;
    setTimeout(()=>history.replaceState(null,'',clean),120);
  }
  document.addEventListener('click',e=>{
    if(!seedMode) return;
    if(e.target.closest('.tg-seed-card,.tg-seed-toggle')) return;
    const article=e.target.closest('.article-text'); if(!article) return;
    const word=wordFromPoint(e.clientX,e.clientY,e.target); if(!word) return;
    e.preventDefault(); e.stopPropagation(); showCard(word,e.clientX,e.clientY);
  }, true);
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') removeCard(); });
  addToggle(); handleReaderReturn(); locateFromURL();
})();
