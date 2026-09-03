const flarePromoSlides = [
  {
    title: 'ГЛАВНЫЕ НОВОСТИ ВСЕГДА ПОД РУКОЙ',
    text: 'Подписывайтесь на наш канал в Телеграм',
    button: 'Подробнее',
    link: 'https://t.me/flare_itv'
  },
  {
    title: 'СОТРУДНИЧАЙТЕ С FLARE',
    text: 'Реклама, сотрудничество и ваши новости — пишите менеджеру.',
    button: 'Подробнее',
    link: 'https://t.me/managerflareof'
  }
];

(function () {
  const root = document.getElementById('flarePromo');
  const track = document.getElementById('flarePromoTrack');
  const dots = document.getElementById('flarePromoDots');
  if (!root || !track || !dots || !flarePromoSlides.length) return;

  let current = 0;
  let timer;

  track.innerHTML = flarePromoSlides.map((slide, index) => `
    <article class="flarePromoSlide" data-slide="${index}" aria-hidden="${index !== 0}">
      <div class="flarePromoContent">
        <span class="flarePromoLabel">FLARE / РЕКЛАМА</span>
        <h2>${slide.title}</h2>
        <p>${slide.text}</p>
        <a href="${slide.link}" class="flarePromoButton" target="_blank" rel="noopener">${slide.button} ↗</a>
      </div>
    </article>
  `).join('');

  dots.innerHTML = flarePromoSlides.map((_, index) => `
    <button type="button" class="flarePromoDot${index === 0 ? ' active' : ''}" aria-label="Слайд ${index + 1}" data-index="${index}"></button>
  `).join('');

  const slides = [...track.querySelectorAll('.flarePromoSlide')];
  const dotButtons = [...dots.querySelectorAll('.flarePromoDot')];

  function showSlide(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === current);
      slide.setAttribute('aria-hidden', String(i !== current));
    });
    dotButtons.forEach((dot, i) => dot.classList.toggle('active', i === current));
  }

  function restartTimer() {
    window.clearInterval(timer);
    timer = window.setInterval(() => showSlide(current + 1), 8000);
  }

  dotButtons.forEach((dot) => {
    dot.addEventListener('click', () => {
      showSlide(Number(dot.dataset.index));
      restartTimer();
    });
  });

  showSlide(0);
  restartTimer();
})();
