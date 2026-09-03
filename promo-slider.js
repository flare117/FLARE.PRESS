const DEFAULT_FLARE_PROMO_SLIDES = [
  { title: 'ГЛАВНЫЕ НОВОСТИ ВСЕГДА ПОД РУКОЙ', text: 'Подписывайтесь на наш канал в Телеграм', button: 'Подробнее', link: 'https://t.me/flare_itv', image: '' },
  { title: 'СОТРУДНИЧАЙТЕ С FLARE', text: 'Реклама, сотрудничество и ваши новости — пишите менеджеру.', button: 'Подробнее', link: 'https://t.me/managerflareof', image: '' }
];

(function () {
  const root = document.getElementById('flarePromo');
  const track = document.getElementById('flarePromoTrack');
  const dots = document.getElementById('flarePromoDots');
  if (!root || !track || !dots) return;

  let current = 0;
  let timer;

  function safe(value) {
    return String(value ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  }

  function render(slides) {
    const list = Array.isArray(slides) && slides.length ? slides : DEFAULT_FLARE_PROMO_SLIDES;
    current = Math.min(current, list.length - 1);

    track.innerHTML = list.map((slide, index) => `
      <article class="flarePromoSlide" data-slide="${index}" aria-hidden="${index !== current}">
        ${slide.image ? `<div class="flarePromoImageWrap"><img class="flarePromoImage" src="${safe(slide.image)}" alt=""></div>` : ''}
        <div class="flarePromoContent">
          <span class="flarePromoLabel">FLARE / РЕКЛАМА</span>
          <h2>${safe(slide.title)}</h2>
          <p>${safe(slide.text)}</p>
          <a href="${safe(slide.link || 'https://t.me/managerflareof')}" class="flarePromoButton" target="_blank" rel="noopener">${safe(slide.button || 'Подробнее')} ↗</a>
        </div>
      </article>
    `).join('');

    dots.innerHTML = list.map((_, index) => `
      <button type="button" class="flarePromoDot${index === current ? ' active' : ''}" aria-label="Слайд ${index + 1}" data-index="${index}"></button>
    `).join('');

    const slideEls = [...track.querySelectorAll('.flarePromoSlide')];
    const dotButtons = [...dots.querySelectorAll('.flarePromoDot')];

    function showSlide(index) {
      current = (index + slideEls.length) % slideEls.length;
      slideEls.forEach((slide, i) => {
        slide.classList.toggle('active', i === current);
        slide.setAttribute('aria-hidden', String(i !== current));
      });
      dotButtons.forEach((dot, i) => dot.classList.toggle('active', i === current));
    }

    function restartTimer() {
      window.clearInterval(timer);
      if (slideEls.length > 1) timer = window.setInterval(() => showSlide(current + 1), 8000);
    }

    dotButtons.forEach(dot => dot.addEventListener('click', () => {
      showSlide(Number(dot.dataset.index));
      restartTimer();
    }));

    root.onmouseenter = () => window.clearInterval(timer);
    root.onmouseleave = restartTimer;
    showSlide(current);
    restartTimer();
  }

  async function load() {
    try {
      const response = await fetch('/api/promo-slides?ts=' + Date.now(), { cache: 'no-store' });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      render(data.slides);
    } catch (error) {
      console.warn('Promo slides API unavailable:', error);
      render(DEFAULT_FLARE_PROMO_SLIDES);
    }
  }

  load();
})();
