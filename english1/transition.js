
(function(){
  document.addEventListener('click', function(e){
    const link = e.target.closest('a[data-transition-year], .year-hotspot');
    if(!link) return;
    const href = link.getAttribute('href');
    if(!href || href.startsWith('#') || link.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const year = link.dataset.transitionYear || (href.match(/(20\d\d)/) || [,''])[1] || '';
    const exam = link.dataset.examTarget === 'two' ? '英语二' : '英语一';
    const card = document.querySelector('.page-pass');
    if(card){
      const b = card.querySelector('b');
      const span = card.querySelector('span');
      if(b && year) b.textContent = year;
      if(span) span.textContent = `进入${exam}`;
    }
    e.preventDefault();
    document.body.classList.add('is-leaving');
    window.setTimeout(function(){ window.location.href = href; }, 820);
  }, {capture:true});
})();
