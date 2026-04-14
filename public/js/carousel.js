/**
 * carousel.js — Auto-rotating image carousel on hero section
 * Cycles through slides every 5 seconds with smooth transitions.
 * Click indicators to jump to a specific slide.
 */
(function () {
  const carousel = document.querySelector('.hero-carousel');
  const slides    = document.querySelectorAll('.carousel-slide');
  const indicators = document.querySelectorAll('.indicator');

  if (!carousel || slides.length === 0) return;

  let currentSlide = 0;
  const slideCount = slides.length;
  const slideInterval = 5000; // 5 seconds

  // ── Initialize ────────────────────────────────────
  function showSlide(index) {
    slides.forEach(slide => slide.classList.remove('active'));
    indicators.forEach(ind => ind.classList.remove('active'));

    currentSlide = index % slideCount;
    slides[currentSlide].classList.add('active');
    indicators[currentSlide].classList.add('active');
  }

  // ── Auto-rotate ───────────────────────────────────
  function nextSlide() {
    showSlide(currentSlide + 1);
  }

  let autoPlayTimer = setInterval(nextSlide, slideInterval);

  // ── Indicator clicks ───────────────────────────────
  indicators.forEach((indicator, index) => {
    indicator.addEventListener('click', () => {
      clearInterval(autoPlayTimer);
      showSlide(index);
      // Restart auto-play after 2 seconds of user inactivity
      autoPlayTimer = setInterval(nextSlide, slideInterval);
    });
  });

  // ── Pause on hover, resume on mouse leave ──────────
  carousel.addEventListener('mouseenter', () => clearInterval(autoPlayTimer));
  carousel.addEventListener('mouseleave', () => {
    autoPlayTimer = setInterval(nextSlide, slideInterval);
  });

  showSlide(0);
})();
