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
  const keyed = $$('[data-key]');
  const mapped = $$('[data-map], [data-maps]');
  const chips = $$('.text-chip');

  function esc(value){ return CSS.escape(String(value)); }
  function splitMaps(value){ return String(value || '').split(/\s+/).filter(Boolean); }
  function mapsFor(el){
    if(!el) return [];
    return splitMaps([el.dataset.map || '', el.dataset.maps || ''].join(' '));
  }
  function hasMap(el, wanted){
    const own = new Set(mapsFor(el));
    return wanted.some(map => own.has(map));
  }
  function sameKey(key){ return $$('[data-key="' + esc(key) + '"]'); }
  function targetForKey(key){
    const escaped = esc(key);
    return document.getElementById(String(key))
      || $('.qcard[data-key="' + escaped + '"]')
      || $('.kw[data-key="' + escaped + '"]')
      || $('.ev[data-key="' + escaped + '"]')
      || $('.scope-anchor[data-key="' + escaped + '"]')
      || $('.para-target[data-key="' + escaped + '"]');
  }
  function clearMapHighlights(){
    mapped.forEach(el => el.classList.remove('map-active', 'map-source-active', 'source-active', 'stem-active'));
    $$('.stem-key.stem-active,.stem-hit.map-active,.kw.source-active,.ev.source-active,.para-target.source-active,.para-anchor.source-active').forEach(el => {
      el.classList.remove('stem-active', 'map-active', 'source-active', 'map-source-active');
    });
  }
  function activateMaps(maps){
    const wanted = Array.isArray(maps) ? maps.filter(Boolean) : splitMaps(maps);
    if(!wanted.length) return;
    mapped.forEach(el => {
      const hit = hasMap(el, wanted);
      el.classList.toggle('map-active', hit);
      el.classList.toggle('map-source-active', hit && !el.classList.contains('stem-hit') && !el.classList.contains('stem-key'));
      el.classList.toggle('source-active', hit && (el.classList.contains('kw') || el.classList.contains('ev') || el.classList.contains('para-target') || el.classList.contains('para-anchor')));
      el.classList.toggle('stem-active', hit && el.classList.contains('stem-key'));
    });
  }
  function activateQuestion(key, scroll=true){
    if(!key) return;
    keyed.forEach(el => el.classList.toggle('active', el.dataset.key === String(key)));
    clearMapHighlights();
    if(scroll){
      const target = targetForKey(key);
      if(target) target.scrollIntoView({behavior:'smooth', block:'center'});
    }
  }

  document.addEventListener('click', function(e){
    const jump = e.target.closest('[data-target]');
    if(jump){
      e.preventDefault();
      activateQuestion(jump.dataset.target);
      return;
    }
    const keyEl = e.target.closest('[data-key]');
    if(keyEl && !e.target.closest('[data-target]')){
      activateQuestion(keyEl.dataset.key, !keyEl.classList.contains('qcard'));
    }
  });

  document.addEventListener('mouseover', function(e){
    const mapEl = e.target.closest('[data-map], [data-maps]');
    if(mapEl){
      activateMaps(mapsFor(mapEl));
      const key = mapEl.dataset.key;
      if(key) keyed.forEach(el => el.classList.toggle('active', el.dataset.key === key));
      return;
    }
    const keyEl = e.target.closest('[data-key], [data-target]');
    const key = keyEl && (keyEl.dataset.key || keyEl.dataset.target);
    if(key) keyed.forEach(el => el.classList.toggle('active', el.dataset.key === key));
  });

  document.addEventListener('mouseout', function(e){
    if(e.target.closest('[data-map], [data-maps]')) clearMapHighlights();
  });

  if('IntersectionObserver' in window){
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
      if(!visible) return;
      const id = visible.target.id;
      chips.forEach(chip => chip.classList.toggle('active', chip.getAttribute('href') === '#' + id));
    }, {rootMargin:'-28% 0px -55% 0px', threshold:[0.18,0.32,0.5]});
    $$('.text-unit').forEach(unit => observer.observe(unit));
  }
})();
