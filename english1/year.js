
(function(){

  const THEME_KEY = 'timeGardenTheme';
  const THEME_DARK = 'dark';
  const THEME_LIGHT = 'light';
  const darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function systemTheme(){
    return darkQuery && darkQuery.matches ? THEME_DARK : THEME_LIGHT;
  }
  function storedTheme(){
    const saved = localStorage.getItem(THEME_KEY);
    return (saved === THEME_DARK || saved === THEME_LIGHT) ? saved : null;
  }
  function themeLabel(theme){
    return theme === THEME_DARK ? '返回晨园' : '进入月园';
  }
  function themeTitle(theme){
    return theme === THEME_DARK ? '返回晨园' : '进入月园';
  }
  function applyTheme(theme){
    const isDark = theme === THEME_DARK;
    document.documentElement.classList.toggle('theme-dark', isDark);
    document.documentElement.classList.toggle('theme-light', !isDark);
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.textContent = themeLabel(theme);
      btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      btn.setAttribute('title', themeTitle(theme));
    });
  }
  applyTheme(storedTheme() || systemTheme());
  if(darkQuery){
    const syncSystemTheme = () => {
      if(!storedTheme()) applyTheme(systemTheme());
    };
    if(darkQuery.addEventListener) darkQuery.addEventListener('change', syncSystemTheme);
    else if(darkQuery.addListener) darkQuery.addListener(syncSystemTheme);
  }
  document.addEventListener('click', function(e){
    const btn = e.target.closest('.theme-toggle');
    if(!btn) return;
    const next = document.documentElement.classList.contains('theme-dark') ? THEME_LIGHT : THEME_DARK;
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  });

  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const linked = $$('[data-key]');
  const chips = $$('.text-chip');

  function mapsFor(el){
    if(!el) return [];
    const raw = [el.dataset.map || '', el.dataset.maps || ''].join(' ').trim();
    return raw ? raw.split(/\s+/).filter(Boolean) : [];
  }
  function esc(v){ return CSS.escape(String(v)); }
  function stemKeysFor(key){ return $$('.stem-key[data-key="' + esc(key) + '"]'); }
  function stemKeysForMap(map){ return $$('.stem-key[data-map="' + esc(map) + '"]'); }
  function sourceForMap(map){ return $$('[data-map="' + esc(map) + '"], [data-maps~="' + esc(map) + '"]'); }
  function clearStemHover(){
    $$('.stem-key.stem-active').forEach(el => el.classList.remove('stem-active'));
    $$('.kw.source-active,.ev.source-active,.para-target.source-active,.para-anchor.source-active').forEach(el => el.classList.remove('source-active'));
  }
  function highlightStemMaps(maps, key){
    clearStemHover();
    if(maps && maps.length){
      maps.forEach(map => stemKeysForMap(map).forEach(el => el.classList.add('stem-active')));
      maps.forEach(map => sourceForMap(map).forEach(el => {
        if(el.classList && (el.classList.contains('kw') || el.classList.contains('ev') || el.classList.contains('para-target') || el.classList.contains('para-anchor'))){
          el.classList.add('source-active');
        }
      }));
      return;
    }
    if(key) stemKeysFor(key).forEach(el => el.classList.add('stem-active'));
  }
  function activateQuestion(key, scroll=true){
    if(!key) return;
    linked.forEach(el => el.classList.toggle('active', el.dataset.key === String(key)));
    highlightStemMaps([], key);
    if(scroll){
      const escaped = esc(key);
      const target = document.getElementById(String(key)) || $('.kw[data-key="'+escaped+'"]') || $('.ev[data-key="'+escaped+'"]') || $('.qcard[data-key="'+escaped+'"]');
      if(target){ target.scrollIntoView({behavior:'smooth', block:'center'}); }
    }
  }
  document.addEventListener('click', function(e){
    const qTarget = e.target.closest('[data-target]');
    if(qTarget){ e.preventDefault(); activateQuestion(qTarget.dataset.target); return; }
    const k = e.target.closest('[data-key]');
    if(k && !e.target.closest('[data-target]')){ activateQuestion(k.dataset.key, !k.classList.contains('qcard')); }
  });
  document.addEventListener('mouseover', function(e){
    const el = e.target.closest('.kw[data-key], .ev[data-key], .para-target[data-key], .para-anchor[data-key], .stem-key[data-key], .route-card[data-target], .qcard[data-key]');
    if(!el) return;
    const key = el.dataset.key || el.dataset.target;
    if(!key) return;
    linked.forEach(x => x.classList.toggle('active', x.dataset.key === key));
    highlightStemMaps(mapsFor(el), key);
  });
  document.addEventListener('mouseout', function(e){
    const source = e.target.closest('.kw[data-key], .ev[data-key], .para-target[data-key], .para-anchor[data-key], .stem-key[data-key]');
    if(!source) return;
    const related = e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.kw[data-key], .ev[data-key], .para-target[data-key], .para-anchor[data-key], .stem-key[data-key]');
    const srcMaps = mapsFor(source).join(' ');
    const relMaps = mapsFor(related).join(' ');
    if(!related || srcMaps !== relMaps){ clearStemHover(); }
  });
  if('IntersectionObserver' in window){
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(e => e.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
      if(!visible) return;
      const id = visible.target.id;
      chips.forEach(ch => ch.classList.toggle('active', ch.getAttribute('href') === '#' + id));
    }, {rootMargin:'-28% 0px -55% 0px', threshold:[0.18,0.32,.5]});
    $$('.text-unit').forEach(unit => observer.observe(unit));
  }
})();
