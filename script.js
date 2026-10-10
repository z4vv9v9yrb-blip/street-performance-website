/* Street Performance – navigation, gallery, counters and transitions */
(() => {
  'use strict';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const menu = document.getElementById('menuButton');
  const nav = document.getElementById('siteNav');

  if (menu && nav) {
    const mobileViewport = window.matchMedia('(max-width: 760px)');

    const setMenuOpen = (requestedOpen, restoreFocus = false) => {
      const open = Boolean(requestedOpen && mobileViewport.matches);
      nav.classList.toggle('open', open);
      menu.classList.toggle('is-open', open);
      menu.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-label', open ? 'Navigation schliessen' : 'Navigation öffnen');

      // Prevent keyboard focus from entering the visually closed menu.
      // Desktop navigation must remain accessible.
      nav.inert = mobileViewport.matches && !open;
      if (!open && restoreFocus && mobileViewport.matches) menu.focus();
    };

    setMenuOpen(false);
    menu.addEventListener('click', () => setMenuOpen(!nav.classList.contains('open')));

    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => setMenuOpen(false));
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && nav.classList.contains('open')) {
        setMenuOpen(false, true);
      }
    });

    document.addEventListener('pointerdown', event => {
      if (nav.classList.contains('open') &&
          !nav.contains(event.target) &&
          !menu.contains(event.target)) {
        setMenuOpen(false);
      }
    });

    // Keep the desktop menu visible after rotating the device or resizing.
    if (mobileViewport.addEventListener) {
      mobileViewport.addEventListener('change', () => setMenuOpen(false));
    } else {
      mobileViewport.addListener(() => setMenuOpen(false));
    }
  }

  // The original WordPress images are loaded from the source domain.
  // Use a local fallback if a source image was moved or access is blocked.
  document.querySelectorAll('img[data-fallback]').forEach(image => {
    const fallback = image.getAttribute('data-fallback');
    if (!fallback) return;
    let attempted = false;
    image.addEventListener('error', () => {
      if (attempted) {
        image.style.opacity = '0.45';
        return;
      }
      attempted = true;
      image.src = fallback;
    });
    if (image.complete && image.naturalWidth === 0) {
      image.dispatchEvent(new Event('error'));
    }
  });

  const slides = [...document.querySelectorAll('.hero-slide')];
  const dots = [...document.querySelectorAll('.slide-pagination button')];
  const prior = document.getElementById('previousSlide');
  const next = document.getElementById('nextSlide');
  let current = 0;
  let timer = null;
  const showSlide = index => {
    if (!slides.length) return;
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, idx) => {
      const active = idx === current;
      slide.classList.toggle('active', active);
      slide.setAttribute('aria-hidden', String(!active));
    });
    dots.forEach((dot, idx) => {
      const active = idx === current;
      dot.classList.toggle('active', active);
      if (active) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  };
  const restartSlider = () => {
    if (timer) window.clearInterval(timer);
    if (!reduceMotion.matches && slides.length > 1) {
      timer = window.setInterval(() => showSlide(current + 1), 6500);
    }
  };
  if (slides.length) {
    showSlide(0);
    dots.forEach((button, index) => button.addEventListener('click', () => {
      showSlide(index); restartSlider();
    }));
    if (prior) prior.addEventListener('click', () => {
      showSlide(current - 1); restartSlider();
    });
    if (next) next.addEventListener('click', () => {
      showSlide(current + 1); restartSlider();
    });
    const banner = document.querySelector('.intro-banner');
    if (banner) {
      banner.addEventListener('mouseenter', () => { if (timer) window.clearInterval(timer); });
      banner.addEventListener('mouseleave', restartSlider);
      banner.addEventListener('focusin', () => { if (timer) window.clearInterval(timer); });
      banner.addEventListener('focusout', event => {
        if (!banner.contains(event.relatedTarget)) restartSlider();
      });
    }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && timer) window.clearInterval(timer);
      else if (!document.hidden) restartSlider();
    });
    reduceMotion.addEventListener?.('change', restartSlider);
    restartSlider();
  }

  const revealItems = [...document.querySelectorAll('.reveal')];
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    const viewport = window.innerHeight;
    revealItems.forEach((element, index) => {
      const r = element.getBoundingClientRect();
      if (r.top > viewport * 0.88 && r.bottom > 0) {
        element.classList.add('reveal-pending');
        element.style.setProperty('--reveal-delay', (index % 2) * 70 + 'ms');
      }
    });
    document.documentElement.classList.add('motion-enabled');
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('reveal-visible');
        entry.target.classList.remove('reveal-pending');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -5% 0px' });
    revealItems.filter(el => el.classList.contains('reveal-pending')).forEach(el => io.observe(el));
  }

  // Animate technical specification numbers once when visible.
  const counts = [...document.querySelectorAll('.count-up[data-target]')];
  function formatNumber(value, type) {
    const n = Math.round(value);
    return type === 'grouped' ? n.toLocaleString('de-CH') : n.toString();
  }
  function animateCount(element) {
    if (element.dataset.animated === 'true') return;
    element.dataset.animated = 'true';
    const target = Number(element.dataset.target);
    if (!Number.isFinite(target)) return;
    const format = element.dataset.format || '';
    if (reduceMotion.matches) {
      element.textContent = formatNumber(target, format);
      return;
    }
    const duration = 1600;
    let start = null;
    const step = t => {
      if (start === null) start = t;
      const progress = Math.min((t - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      element.textContent = formatNumber(target * ease, format);
      if (progress < 1) window.requestAnimationFrame(step);
      else element.textContent = formatNumber(target, format);
    };
    element.textContent = '0';
    window.requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    const numberObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        animateCount(entry.target);
        numberObserver.unobserve(entry.target);
      }
    }, { threshold: 0.3 });
    counts.forEach(el => numberObserver.observe(el));
  }

  // Section-aware navigation.
  const sections = [...document.querySelectorAll('main section[id]')];
  if ('IntersectionObserver' in window && nav) {
    const links = [...nav.querySelectorAll('a[href^="#"]')];
    const observed = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
      });
    }, { rootMargin: '-20% 0px -65% 0px', threshold: 0 });
    sections.forEach(section => observed.observe(section));
  }
})();