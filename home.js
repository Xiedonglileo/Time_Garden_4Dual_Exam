
(function(){
  const body = document.body;
  const buttons = Array.from(document.querySelectorAll('[data-set-exam]'));
  const hotspots = Array.from(document.querySelectorAll('.year-hotspot'));
  const eyebrow = document.getElementById('examEyebrow');
  const caption = document.getElementById('sceneCaption');

  function setExam(mode){
    const next = mode === 'two' ? 'two' : 'one';
    body.dataset.exam = next;
    body.classList.toggle('exam-two', next === 'two');
    body.classList.toggle('exam-one', next === 'one');
    body.classList.add('is-switching');
    window.setTimeout(() => body.classList.remove('is-switching'), 1120);

    buttons.forEach(btn => {
      const active = btn.dataset.setExam === next;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    hotspots.forEach(a => {
      const year = a.dataset.transitionYear || (a.href.match(/(20\d\d)/) || ['',''])[1];
      const href = next === 'two' ? a.dataset.hrefTwo : a.dataset.hrefOne;
      a.href = href;
      a.dataset.examTarget = next;
      const examName = next === 'two' ? '考研英语二' : '考研英语一';
      a.setAttribute('aria-label', `进入 ${year} 年${examName}阅读路径图`);
      a.setAttribute('title', `进入 ${year} 年${examName}阅读路径图`);
    });
    if(eyebrow) eyebrow.textContent = next === 'two' ? '考研英语二阅读高分路径图 · 2010—2026' : '考研英语一阅读高分路径图 · 2010—2026';
    if(caption) caption.textContent = next === 'two' ? '英语二 · 2010—2026' : '英语一 · 2010—2026';
  }

  buttons.forEach(btn => btn.addEventListener('click', () => setExam(btn.dataset.setExam)));
  const params = new URLSearchParams(window.location.search);
  const initial = params.get('exam') === 'two' ? 'two' : 'one';
  setExam(initial);
})();
