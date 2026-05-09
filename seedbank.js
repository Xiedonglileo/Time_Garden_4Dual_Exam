(function(){
  const corpus = window.TG_SEED_CORPUS || [];
  const index = window.TG_SEED_INDEX || {};
  const forms = window.TG_SEED_FORMS || {};
  const lemmaForms = window.TG_SEED_LEMMA_FORMS || {};
  const dict = window.TG_SEED_DICT || {};
  const stats = window.TG_SEED_STATS || {};
  const input = document.getElementById('seedInput');
  const form = document.getElementById('seedSearch');
  const empty = document.getElementById('seedEmpty');
  const result = document.getElementById('seedResult');
  const definition = document.getElementById('definitionCard');
  const toolbar = document.getElementById('resultToolbar');
  const list = document.getElementById('resultList');
  const meta = document.getElementById('seedMeta');
  const returnButton = document.getElementById('seedReturn');
  const urlParams = new URLSearchParams(location.search);
  const returnUrl = urlParams.get('return') || '';
  const returnY = urlParams.get('y') || '0';
  let current = null;
  const filters = { year: 'all', exam: 'all' };

  const STOPWORDS = new Set(['a','an','the','and','or','of','to','in','on','for','with','without','by','from','into','onto','over','under','about','than','then','if','but','as','at','it','its','is','are','was','were','be','been','being','am','do','does','did','done','doing','have','has','had','that','this','these','those','i','you','he','she','they','we','them','our','their','my','your','his','her','not','so','such','because','while','when','where','who','which','what','how']);
  const DETS = new Set(['a','an','the','this','that','these','those','my','your','his','her','its','our','their','each','every','some','any','no','another','such','what','which','one','two','three','many','few','several','most']);
  const MODALS = new Set(['to','will','would','shall','should','can','could','may','might','must','do','does','did','not','never','cannot']);
  const PRONOUNS = new Set(['i','you','he','she','it','we','they','someone','somebody','something','people','person','one']);
  const LINKING = new Set(['be','am','is','are','was','were','been','being','seem','become','remain','feel','appear','look','sound','stay','grow','get']);
  const PREPS = new Set(['of','for','with','to','in','on','at','by','from','about','into','over','under','through','during','after','before','between','among','around']);
  const DOMAIN_HINTS = {
    '计':['computer','computing','digital','online','internet','software','data','network','algorithm','system','technology','address'],
    '经':['business','market','company','economic','economy','financial','trade','industry','commercial'],
    '法':['law','legal','court','rights','judge','policy','patent','case'],
    '医':['medical','health','patient','disease','doctor','clinical','brain'],
    '心理':['mental','mind','psychology','cognitive','emotion'],
    '教育':['education','school','student','learning','teaching']
  };

  const CURATED_CLUES = {
    vessel:[['容器|器皿|承载','container,contain,hold,capacity,liquid'],['船|舰|轮船','ship,boat,sea,ocean,crew,cargo,passenger,sail'],['血管|脉管','blood,vein,artery,vascular,heart,fluid,body']],
    state:[['状态|情形|状况','condition,situation,current,mental,physical'],['国家|州|政府|政权','government,federal,country,nation,public,law,policy'],['陈述|说明|声明|规定','say,claim,argue,report,rule,statement']],
    subject:[['主题|题目|讨论对象','topic,matter,discussion,issue,question'],['科目|学科','school,student,study,education,course'],['主语','grammar,sentence,verb,language'],['对象|受试者|臣民','experiment,participant,authority,citizen,king']],
    object:[['物体|东西|对象','thing,physical,material,item'],['目标|目的','goal,aim,purpose,objective'],['宾语','grammar,verb,sentence,language'],['反对|异议','oppose,against,disagree,protest,complain']],
    present:[['现在|目前|当前','now,current,today'],['出席|在场','attend,presence,there'],['礼物|赠品','gift,give,birthday'],['提出|呈现|展示|介绍','show,offer,introduce,evidence,data,argument']],
    mean:[['意思|意味着|表示','meaning,means,signify,indicate'],['打算|意欲','intend,plan,purpose'],['吝啬|刻薄|卑劣','unkind,cruel,selfish'],['平均|中间|平均数','average,middle,number,data']],
    record:[['记录|记载|档案|录制','record,document,file,history,data,evidence'],['最高纪录|创纪录','highest,best,new'],['唱片|录音','music,album,song,sound']],
    address:[['地址|住址|通信位置','home,email,mail,location,place'],['演说|讲话|称呼','speech,audience,speak,remarks'],['处理|应对|解决','problem,issue,solve,deal,tackle'],['写地址|致函','letter,mail,write']],
    case:[['情况|实例|案例','situation,example,instance'],['案件|诉讼','court,law,legal,judge,patent'],['病例|病案','patient,disease,medical,doctor'],['理由|论据|主张','argument,evidence,claim,reason'],['箱子|盒子|外壳','box,container,cover,protect']],
    value:[['价值|价格|估价','price,worth,market,cost,valuable'],['重要性|重视|珍视','important,value,care,respect'],['数值|量|计算结果','number,data,calculation,result'],['价值观|准则','belief,principle,moral,society']],
    left:[['左边|向左|左侧','side,right,hand,turn,direction'],['剩下|留下','remain,remaining,leave,behind'],['左派|左翼','political,liberal,party,right']]
  };

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
      return opts.find(x=>index[x]) || opts.find(Boolean) || w;
    }
    if(w.length>4 && /ied$/.test(w)) return w.slice(0,-3)+'y';
    if(w.length>4 && /ed$/.test(w)){
      const b=w.slice(0,-2), opts=[b,b+'e',b.replace(/([b-df-hj-np-tv-z])\1$/,'$1')];
      return opts.find(x=>index[x]) || opts.find(Boolean) || w;
    }
    if(w.length>4 && /es$/.test(w)) return index[w.slice(0,-2)] ? w.slice(0,-2) : w.slice(0,-1);
    if(w.length>3 && /s$/.test(w) && !/ss$/.test(w)) return w.slice(0,-1);
    return w;
  }
  function toLemma(raw){const w=cleanWord(raw); return forms[w] || (index[w] ? w : fallbackLemma(w));}
  function variantsFor(lemma, raw){return Array.from(new Set([raw, lemma].concat(lemmaForms[lemma] || []))).filter(Boolean).sort((a,b)=>b.length-a.length);}
  function rootPrefix(){return '';}  
  function hitURL(hit, lemma){
    const q = new URLSearchParams({tg_seed:lemma,tg_hit:hit.id,tg_text:String(hit.text),tg_para:String(hit.paragraph),tg_sent:String(hit.sentenceNo)});
    return rootPrefix()+hit.path+'?'+q.toString();
  }
  function highlight(sentence, variants){
    let safe=escapeHTML(sentence);
    const words=variants.map(escapeRegExp).filter(Boolean);
    if(!words.length) return safe;
    const re=new RegExp('\\b('+words.join('|')+')\\b','gi');
    return safe.replace(re,'<mark class="seed-mark">$1</mark>');
  }
  function normalizePos(pos){
    const p=(pos||'').toLowerCase();
    if(p==='a.') return 'adj';
    if(p==='adj.') return 'adj';
    if(p==='adv.') return 'adv';
    if(p==='n.') return 'noun';
    if(p==='vt.'||p==='vi.'||p==='v.') return 'verb';
    if(p==='prep.') return 'prep';
    if(p==='pron.') return 'pron';
    if(p==='conj.') return 'conj';
    if(p==='abbr.') return 'abbr';
    return p.replace('.','') || 'generic';
  }
  function yearSort(a,b){ return Number(a)-Number(b); }
  function tokenizeContext(sentence){ return (String(sentence).match(/[A-Za-z]+/g)||[]).map(x=>x.toLowerCase()); }
  function pickSurface(sentence, variants){
    for(const v of variants){
      const re = new RegExp('\\b'+escapeRegExp(v)+'\\b','i');
      const m = sentence.match(re);
      if(m) return m[0];
    }
    return variants[0] || '';
  }
  function domainWords(sense){
    const out=[];
    (sense.domains||[]).forEach(d=>{
      const inner = String(d).replace(/[\[\]]/g,'');
      Object.keys(DOMAIN_HINTS).forEach(k=>{ if(inner.includes(k)) out.push(...DOMAIN_HINTS[k]); });
    });
    return Array.from(new Set([...(sense.domainKeywords||[]), ...out]));
  }
  function senseEntries(d, lemma){
    const senses = (d && Array.isArray(d.senses) && d.senses.length ? d.senses : [{id:'s1',pos:'',posLabel:'释义',translation:d ? d.translation : '',definition:d ? d.definition : '',domains:[],keywords:[],domainKeywords:[],label:(d && d.translation) || lemma}]).map((s,idx)=>({
      id: s.id || ('s'+(idx+1)),
      pos: s.pos || '',
      posLabel: s.posLabel || '释义',
      translation: s.translation || '',
      definition: s.definition || '',
      domains: s.domains || [],
      keywords: s.keywords || [],
      domainKeywords: s.domainKeywords || domainWords(s),
      label: s.label || ((s.posLabel || '释义') + '：' + (s.translation || s.definition || lemma))
    }));
    return senses;
  }
  function buildContext(hit, variants){
    const tokens = tokenizeContext(hit.sentence);
    const tokenSet = new Set(tokens.filter(w=>!STOPWORDS.has(w) && !variants.includes(w)));
    let focusIndex = -1; let surface='';
    for(let i=0;i<tokens.length;i++){
      if(variants.includes(tokens[i])){ focusIndex=i; surface=tokens[i]; break; }
    }
    if(focusIndex<0){ surface=cleanWord(pickSurface(hit.sentence, variants)); focusIndex=tokens.indexOf(surface); }
    const prev = focusIndex>0 ? tokens[focusIndex-1] : '';
    const prev2 = focusIndex>1 ? tokens[focusIndex-2] : '';
    const next = focusIndex>=0 && focusIndex<tokens.length-1 ? tokens[focusIndex+1] : '';
    const next2 = focusIndex>=0 && focusIndex<tokens.length-2 ? tokens[focusIndex+2] : '';
    return {tokens, tokenSet, focusIndex, surface, prev, prev2, next, next2};
  }
  function scorePOS(kind, ctx){
    let score = 0;
    const {surface, prev, prev2, next, next2} = ctx;
    const nextNounish = next && !STOPWORDS.has(next) && !PREPS.has(next);
    if(kind==='noun'){
      if(DETS.has(prev) || DETS.has(prev2)) score += 4;
      if(PREPS.has(prev)) score += 2;
      if(surface.endsWith('s') && !surface.endsWith('ss')) score += 1;
      if(next==='' || PREPS.has(next) || /^[0-9]+$/.test(next)) score += 1;
      if(prev && (prev.endsWith('ive')||prev.endsWith('al')||prev.endsWith('ous')||prev.endsWith('ic')||prev.endsWith('ary')||prev.endsWith('ory'))) score += 1;
    } else if(kind==='verb'){
      if(MODALS.has(prev) || MODALS.has(prev2)) score += 5;
      if(PRONOUNS.has(prev) || PRONOUNS.has(prev2)) score += 2;
      if(nextNounish || PREPS.has(next) || next==='that') score += 2;
      if(surface.endsWith('ed') || surface.endsWith('ing')) score += 1.2;
    } else if(kind==='adj'){
      if(DETS.has(prev) && nextNounish) score += 4;
      if(LINKING.has(prev) || LINKING.has(prev2)) score += 5;
      if(surface.endsWith('ous')||surface.endsWith('ive')||surface.endsWith('al')||surface.endsWith('ful')||surface.endsWith('less')||surface.endsWith('able')||surface.endsWith('ible')||surface.endsWith('ic')||surface.endsWith('ary')||surface.endsWith('ory')) score += 2;
      if(next && next.endsWith('ly')) score -= 1;
    } else if(kind==='adv'){
      if(surface.endsWith('ly')) score += 6;
      if(next && (next.endsWith('ed') || next.endsWith('ing') || next.endsWith('ive') || next.endsWith('al') || next.endsWith('ous'))) score += 2;
    } else if(kind==='abbr'){
      if(surface === surface.toUpperCase() && surface.length <= 6) score += 6;
    } else if(kind==='prep'){
      if(next) score += 1;
    }
    return score;
  }

  function lexicalClueScore(lemma, sense, ctx){
    const rules = CURATED_CLUES[lemma] || [];
    if(!rules.length) return 0;
    const label = `${sense.translation || ''} ${sense.label || ''}`;
    const tokens = new Set(ctx.tokens || []);
    let bonus = 0;
    rules.forEach(([sensePattern, words])=>{
      const senseRe = new RegExp(sensePattern);
      if(!senseRe.test(label)) return;
      String(words).split(',').forEach(w=>{ if(tokens.has(w)) bonus += 4.2; });
    });
    return bonus;
  }
  function scoreSense(sense, ctx, lemma){
    const kind = normalizePos(sense.pos);
    let score = 0.2;
    score += scorePOS(kind, ctx);
    score += lexicalClueScore(lemma, sense, ctx);
    const keywordSet = new Set([...(sense.keywords||[]), ...(sense.domainKeywords||[])]);
    for(const t of ctx.tokenSet){ if(keywordSet.has(t)) score += 1.6; }
    const label = (sense.translation || '').toLowerCase();
    if((/平均|均值/.test(label)) && ctx.tokenSet.has('average')) score += 3;
    if((/州|国家|政府/.test(label)) && (ctx.tokenSet.has('government')||ctx.tokenSet.has('country')||ctx.tokenSet.has('federal')||ctx.tokenSet.has('states'))) score += 2.6;
    if((/商业|企业|生意/.test(label)) && (ctx.tokenSet.has('market')||ctx.tokenSet.has('company')||ctx.tokenSet.has('commercial')||ctx.tokenSet.has('industry')||ctx.tokenSet.has('economic'))) score += 2.6;
    if((/研究|学习|论文/.test(label)) && (ctx.tokenSet.has('research')||ctx.tokenSet.has('scientists')||ctx.tokenSet.has('evidence')||ctx.tokenSet.has('students'))) score += 2.6;
    if((/地址|住址/.test(label)) && (ctx.tokenSet.has('email')||ctx.tokenSet.has('memory')||ctx.tokenSet.has('location')||ctx.tokenSet.has('home'))) score += 2;
    if((/讲话|演说/.test(label)) && (ctx.tokenSet.has('speech')||ctx.tokenSet.has('audience')||ctx.tokenSet.has('remarks'))) score += 2;
    if((/礼物/.test(label)) && (ctx.tokenSet.has('gift')||ctx.tokenSet.has('birthday')||ctx.tokenSet.has('present'))) score += 1.5;
    if((/孩子|儿童/.test(label)) && (ctx.tokenSet.has('young')||ctx.tokenSet.has('school')||ctx.tokenSet.has('parents')||ctx.tokenSet.has('age'))) score += 1.8;
    return score;
  }
  function classifyHits(lemma, raw){
    const ids = index[lemma] || [];
    const hits = ids.map(i=>corpus[i]).filter(Boolean);
    const variants = variantsFor(lemma, raw);
    const d = dict[lemma] || {};
    const senses = senseEntries(d, lemma).map(s=>Object.assign({}, s, {count:0, items:[]}));
    if(!senses.length) return {hits, variants, senses:[]};
    hits.forEach(hit=>{
      const ctx = buildContext(hit, variants);
      let best = senses[0], bestScore=-Infinity;
      for(const sense of senses){
        const score = scoreSense(sense, ctx, lemma);
        if(score > bestScore){ best = sense; bestScore = score; }
      }
      best.items.push(hit);
      best.count += 1;
    });
    return {hits, variants, senses};
  }
  function groupByYear(items){
    const map = new Map();
    items.forEach(item=>{
      const key = `${item.year}`;
      if(!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return Array.from(map.entries()).sort((a,b)=>yearSort(a[0],b[0]));
  }
  function filteredItems(items){
    return (items || []).filter(hit => (filters.year === 'all' || String(hit.year) === String(filters.year)) && (filters.exam === 'all' || hit.examKey === filters.exam));
  }
  function allYears(hits){
    return Array.from(new Set((hits || []).map(h=>String(h.year)))).sort((a,b)=>Number(a)-Number(b));
  }
  function allExams(hits){
    const seen = new Map();
    (hits || []).forEach(h=>{ if(!seen.has(h.examKey)) seen.set(h.examKey, h.examLabel); });
    return Array.from(seen.entries());
  }
  function visibleSenseCount(sense){ return filteredItems(sense.items).length; }
  function renderEtymology(d){
    const ety = d && d.etymology;
    if(!ety || !ety.hint) return '';
    const parts = Array.isArray(ety.parts) ? ety.parts : [];
    const family = Array.isArray(ety.family) ? ety.family : [];
    return `<section class="etymology-card" aria-label="词源小提示">
      <div class="etymology-title"><span>🫛</span><strong>词源小提示</strong></div>
      <p>${escapeHTML(ety.hint)}</p>
      ${parts.length ? `<div class="etymology-parts">${parts.map(x=>`<span>${escapeHTML(x)}</span>`).join('')}</div>` : ''}
      ${family.length ? `<div class="word-family"><b>同族/变形：</b>${family.map(x=>`<button type="button" data-seed="${escapeHTML(x)}">${escapeHTML(x)}</button>`).join('')}</div>` : ''}
    </section>`;
  }
  function renderFilters(hits){
    const years = allYears(hits);
    const exams = allExams(hits);
    return `<section class="filter-panel" aria-label="年份与试卷筛选">
      <div class="filter-panel-title"><span>✦</span><strong>阅读筛选</strong><em>按年份、试卷与释义自由查看</em></div>
      <div class="filter-row"><strong>年份</strong><div class="filter-pills"><button type="button" data-filter-year="all" class="${filters.year==='all'?'is-active':''}">全部年份</button>${years.map(y=>`<button type="button" data-filter-year="${escapeHTML(y)}" class="${filters.year===y?'is-active':''}">${escapeHTML(y)}</button>`).join('')}</div></div>
      <div class="filter-row"><strong>试卷</strong><div class="filter-pills"><button type="button" data-filter-exam="all" class="${filters.exam==='all'?'is-active':''}">英语一 + 英语二</button>${exams.map(([key,label])=>`<button type="button" data-filter-exam="${escapeHTML(key)}" class="${filters.exam===key?'is-active':''}">${escapeHTML(label)}</button>`).join('')}</div></div>
      <div class="filter-actions"><button type="button" data-open-all>展开全部释义</button><button type="button" data-close-all>收起全部释义</button></div>
    </section>`;
  }
  function renderDefinition(raw, lemma, classified){
    const d=dict[lemma];
    const display=raw || lemma;
    const senses = classified.senses;
    const total = classified.hits.length;
    const visibleTotal = filteredItems(classified.hits).length;
    definition.innerHTML = `
      <div class="seed-word-row">
        <div>
          <strong class="seed-word">${escapeHTML(display)}</strong>
          <div class="seed-mini-row">
            ${lemma && lemma!==display ? `<span class="seed-lemma">原型：${escapeHTML(lemma)}</span>` : `<span class="seed-lemma">种子原型</span>`}
            ${d && d.phonetic ? `<span class="phonetic">/${escapeHTML(d.phonetic)}/</span>` : ''}
          </div>
        </div>
        <div class="seed-overall-badge"><b>${visibleTotal}</b><span>/ ${total} 处语境</span></div>
      </div>
      <div class="translation summary-translation">${d ? escapeHTML(d.translation) : '未命中字典释义。'}</div>
      ${renderEtymology(d)}
      <p class="seed-note">你可以先抓住词源小提示里的核心画面，再顺着不同释义与逐年份原句，慢慢理解这粒种子的生长路径。</p>
      ${renderFilters(classified.hits)}
      <section class="sense-overview-block" aria-label="释义总览">
        <div class="sense-overview-title"><span>✦</span><strong>释义总览</strong><em>点击卡片可跳到对应释义</em></div>
        <div class="sense-overview">
          ${senses.map((sense, idx)=>`<button type="button" class="sense-chip ${visibleSenseCount(sense)===0?'is-empty':''}" data-scroll-sense="${escapeHTML(sense.id)}"><span class="sense-chip-index">${idx+1}</span><span class="sense-chip-text">${escapeHTML(sense.label)}</span><span class="sense-chip-count">${visibleSenseCount(sense)}</span></button>`).join('')}
        </div>
      </section>`;
  }
  function renderList(lemma, raw, classified){
    const hits = classified.hits;
    const variants = classified.variants;
    const visibleHits = filteredItems(hits);
    toolbar.innerHTML = `<strong>${escapeHTML(lemma)}</strong><span>按释义整理 · 当前显示 ${visibleHits.length} / ${hits.length} 个原句 · 共 ${classified.senses.length} 组释义</span>`;
    if(!hits.length){
      list.innerHTML='<div class="seed-empty"><h2>还没有找到</h2><p>这粒种子暂未在当前真题库中出现。可以检查拼写，或换成原文里的另一个单词。</p></div>';
      return;
    }
    if(!visibleHits.length){
      list.innerHTML='<div class="seed-empty"><h2>当前筛选没有结果</h2><p>换一个年份或试卷筛选，就能继续查看这粒种子的其他语境。</p></div>';
      return;
    }
    list.innerHTML = classified.senses.map((sense, idx)=>{
      const visibleItems = filteredItems(sense.items);
      const years = groupByYear(visibleItems);
      return `<details class="sense-card" id="sense-${escapeHTML(sense.id)}" ${visibleItems.length ? 'open' : ''}>
        <summary class="sense-card-head">
          <div>
            <p class="sense-kicker">释义 ${idx+1}</p>
            <h3>${escapeHTML(sense.label)}</h3>
            ${sense.definition ? `<p class="sense-definition">${escapeHTML(sense.definition)}</p>` : ''}
          </div>
          <div class="sense-stats"><span>${visibleItems.length} 处</span><em>点击查看这一组原句</em></div>
        </summary>
        ${sense.domains && sense.domains.length ? `<div class="sense-domains">${sense.domains.map(d=>`<span>${escapeHTML(d)}</span>`).join('')}</div>` : ''}
        ${visibleItems.length ? `<div class="year-stack">${years.map(([year,items])=>`<section class="year-group"><header class="year-group-head"><h4>${escapeHTML(year)} 年</h4><span>${items.length} 处</span></header><div class="sentence-list">${items.map(item=>`<div class="sentence-card">
            <div>
              <div class="hit-meta"><b>${escapeHTML(item.examLabel)}</b><span>${escapeHTML(item.year)}</span><span>Text ${item.text}</span><span>P${item.paragraph}</span><span>S${item.sentenceNo}</span></div>
              <p>${highlight(item.sentence, variants)}</p>
            </div>
            <a class="seed-jump" href="${escapeHTML(hitURL(item, lemma))}">跳转并高亮</a>
          </div>`).join('')}</div></section>`).join('')}</div>` : `<div class="sense-empty-state">当前筛选下，这个释义没有真题语境。</div>`}
      </details>`;
    }).join('');
  }
  function renderCurrent(){
    if(!current) return;
    renderDefinition(current.raw, current.lemma, current.classified);
    renderList(current.lemma, current.raw, current.classified);
  }
  function renderHits(lemma, raw){
    const classified = classifyHits(lemma, raw);
    current = { lemma, raw, classified };
    renderCurrent();
  }
  function search(raw, push=true){
    const word=cleanWord(raw); if(!word) return;
    const lemma=toLemma(word);
    filters.year='all'; filters.exam='all';
    empty.hidden=true; result.hidden=false;
    renderHits(lemma, word);
    input.value=word;
    if(push){ const u=new URL(location.href); u.searchParams.set('q', word); u.searchParams.delete('year'); u.searchParams.delete('exam'); history.replaceState(null,'',u); }
  }
  function configureReturn(){
    if(!returnButton || !returnUrl) return;
    returnButton.hidden=false;
    returnButton.addEventListener('click',()=>{
      try{
        const u=new URL(returnUrl, location.href);
        if(u.origin !== location.origin) throw new Error('unsafe return origin');
        if(!/\/(english1|english2)\/\d{4}\.html$/.test(u.pathname)) throw new Error('unsafe return path');
        u.searchParams.set('tg_return_y', String(Math.max(0, parseInt(returnY,10)||0)));
        u.searchParams.set('tg_seed_mode', '1');
        location.href=u.href;
      }catch(err){ history.back(); }
    });
  }
  if(meta){ meta.textContent=`已收录 ${stats.sentences||corpus.length} 个真题原句、${stats.lemmas||Object.keys(index).length} 粒种子、${stats.dictionaryEntries||Object.keys(dict).length} 条释义。你可以从一个单词出发，沿着词源与真题语境慢慢理解它。`; }
  configureReturn();
  form.addEventListener('submit', e=>{e.preventDefault(); search(input.value);});
  document.addEventListener('click', e=>{
    const btn=e.target.closest('[data-seed]');
    if(btn){search(btn.dataset.seed); window.scrollTo({top:0,behavior:'smooth'}); return;}
    const yearBtn=e.target.closest('[data-filter-year]');
    if(yearBtn){ filters.year=yearBtn.dataset.filterYear || 'all'; const u=new URL(location.href); filters.year==='all'?u.searchParams.delete('year'):u.searchParams.set('year',filters.year); history.replaceState(null,'',u); renderCurrent(); return; }
    const examBtn=e.target.closest('[data-filter-exam]');
    if(examBtn){ filters.exam=examBtn.dataset.filterExam || 'all'; const u=new URL(location.href); filters.exam==='all'?u.searchParams.delete('exam'):u.searchParams.set('exam',filters.exam); history.replaceState(null,'',u); renderCurrent(); return; }
    if(e.target.closest('[data-open-all]')){ document.querySelectorAll('.sense-card').forEach(d=>d.open=true); return; }
    if(e.target.closest('[data-close-all]')){ document.querySelectorAll('.sense-card').forEach(d=>d.open=false); return; }
    const chip=e.target.closest('[data-scroll-sense]');
    if(chip){ const sec=document.getElementById('sense-'+chip.dataset.scrollSense); if(sec) sec.scrollIntoView({behavior:'smooth', block:'start'}); }
  });
  const q=urlParams.get('q');
  if(urlParams.get('year')) filters.year=urlParams.get('year');
  if(urlParams.get('exam')) filters.exam=urlParams.get('exam');
  if(q) search(q,false);
})();
