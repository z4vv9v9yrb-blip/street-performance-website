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

  // Reveal page elements only as they reach the viewport, each with a small delay.
  // No-JS, unsupported browsers and reduced-motion users see all content normally.
  const canAnimate = 'IntersectionObserver' in window && !reduceMotion.matches;
  if (canAnimate) {
    // Break up large content groups, so headings, descriptions and details
    // do not all pop in together. Photos/cards keep their existing reveal class.
    const groupedContainers = [
      '.section-intro', '.feature-copy', '.dyno-stats', '.racing-tiers'
    ];
    document.querySelectorAll(groupedContainers.join(',')).forEach(el => {
      el.classList.remove('reveal');
    });

    const revealTargets = [
      '.section-intro > .section-index',
      '.section-intro > h2',
      '.section-intro > p',
      '.feature-copy > .minor-heading',
      '.feature-copy > h3',
      '.feature-copy > p',
      '.feature-copy > .features-list > div',
      '.feature-copy > .text-link',
      '.dyno-stats > div',
      '.racing-tiers > .tier',
      '.quick-services-grid > a',
      '.partner-ribbon > div',
      '.brands > span', '.brands > div',
      '.contact-card > h3',
      '.contact-card > dl',
      '.contact-card > .primary-cta',
      '.contact-card > .outline-cta'
    ];
    document.querySelectorAll(revealTargets.join(',')).forEach(el => {
      el.classList.add('reveal');
    });

    const allRevealItems = [...document.querySelectorAll('main .reveal')];
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const sectionCount = new Map();

    // Apply off-screen initial states BEFORE enabling the hidden-item rule.
    // Items already on screen remain visible when refreshing mid-page.
    allRevealItems.forEach(element => {
      const bounds = element.getBoundingClientRect();
      const section = element.closest('section') || document.body;
      const index = sectionCount.get(section) || 0;
      sectionCount.set(section, index + 1);
      const isDyno = section.id === 'dyno';
      const delay = isDyno ? Math.min(index * 140, 700)
                           : Math.min((index % 5) * 95, 380);
      element.style.setProperty('--reveal-delay', delay + 'ms');
      if (bounds.top > viewportHeight * .76 && bounds.bottom > 0) {
        element.classList.add('reveal-pending');
      } else {
        element.classList.add('reveal-visible');
      }
    });

    document.documentElement.classList.add('motion-enabled');

    const revealObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target;
        el.classList.remove('reveal-pending');
        el.classList.add('reveal-visible');
        revealObserver.unobserve(el);
      }
    }, { threshold: .04, rootMargin: '0px 0px -18% 0px' });

    allRevealItems.filter(el => el.classList.contains('reveal-pending'))
      .forEach(el => revealObserver.observe(el));
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
        // The figure is now within view: start when its fade-in is underway.
        const el = entry.target;
        const stat = el.closest('.reveal');
        const delay = stat ? Math.min(Number.parseInt(
          stat.style.getPropertyValue('--reveal-delay'), 10) || 0, 700) : 0;
        window.setTimeout(() => animateCount(el), delay + 260);
        numberObserver.unobserve(el);
      }
    }, { threshold: 0.6, rootMargin: '0px 0px -14% 0px' });
    counts.forEach(el => numberObserver.observe(el));
  }


  // ECU video: user-initiated playback WITH SOUND, with a native volume slider.
  // Browsers prohibit automatic playback with sound; do not autoplay or mute it.
  const ecuVideo = document.getElementById('ecuVideo');
  const ecuVideoPlay = document.getElementById('ecuVideoPlay');
  const ecuVideoFrame = document.getElementById('ecuVideoFrame');
  const ecuVideoError = document.getElementById('ecuVideoError');
  if (ecuVideo && ecuVideoPlay && ecuVideoFrame) {
    ecuVideo.muted = false;
    ecuVideoPlay.addEventListener('click', () => {
      ecuVideo.muted = false;
      const playback = ecuVideo.play();
      if (playback && typeof playback.catch === 'function') {
        playback.catch(() => {
          // Retain browser controls so users can retry even if their browser blocked play.
          ecuVideoPlay.hidden = true;
        });
      }
    });
    ecuVideo.addEventListener('playing', () => {
      ecuVideoFrame.classList.add('is-playing');
      ecuVideoPlay.hidden = true;
    });
    ecuVideo.addEventListener('pause', () => {
      ecuVideoFrame.classList.remove('is-playing');
      if (!ecuVideo.error) ecuVideoPlay.hidden = false;
    });
    ecuVideo.addEventListener('ended', () => {
      ecuVideoFrame.classList.remove('is-playing');
      ecuVideoPlay.hidden = false;
    });
    const showVideoError = () => {
      ecuVideoPlay.hidden = true;
      ecuVideoFrame.classList.add('has-error');
      if (ecuVideoError) ecuVideoError.hidden = false;
    };
    ecuVideo.addEventListener('error', showVideoError);
    ecuVideo.querySelector('source')?.addEventListener('error', () => {
      // Wait for the media element to settle before showing fallback.
      window.setTimeout(() => {
        if (ecuVideo.error) showVideoError();
      }, 0);
    });
  }


  // Dyno video: user gesture is required for playback WITH audio.
  // Keep headings, statistics and inquiry CTA above the motion video.
  const dynoVideo = document.getElementById('dynoBackgroundVideo');
  const dynoVideoToggle = document.getElementById('dynoVideoToggle');
  const dynoVideoSound = document.getElementById('dynoVideoSound');
  const dynoToggleLabel = document.getElementById('dynoToggleLabel');
  const dynoToggleIcon = document.getElementById('dynoToggleIcon');
  const dynoSoundIcon = document.getElementById('dynoSoundIcon');
  const dynoVideoError = document.getElementById('dynoVideoError');

  if (dynoVideo && dynoVideoToggle && dynoVideoSound &&
      dynoToggleLabel && dynoToggleIcon && dynoSoundIcon) {
    // No autoplay and no forced mute: playback with sound begins on click.
    dynoVideo.muted = false;
    dynoVideo.volume = 1;

    const updateDynoControls = () => {
      const playing = !dynoVideo.paused && !dynoVideo.ended;
      dynoToggleIcon.textContent = playing ? 'Ⅱ' : '▶';
      dynoToggleLabel.textContent = playing ? 'VIDEO PAUSIEREN'
        : (dynoVideo.currentTime > 0 ? 'VIDEO FORTSETZEN' : 'VIDEO MIT TON STARTEN');
      dynoVideoToggle.setAttribute('aria-label', dynoToggleLabel.textContent);
      dynoVideoSound.hidden = !playing;
      dynoSoundIcon.textContent = dynoVideo.muted ? '✕' : '♫';
      dynoVideoSound.setAttribute('aria-label', dynoVideo.muted ? 'Ton einschalten' : 'Ton ausschalten');
    };
    const dynoFail = () => {
      if (dynoVideoError) dynoVideoError.hidden = false;
      dynoVideoToggle.disabled = true;
      dynoVideoToggle.setAttribute('aria-label', 'Video nicht verfügbar');
      dynoToggleLabel.textContent = 'VIDEO NICHT VERFÜGBAR';
      dynoVideoSound.hidden = true;
    };

    dynoVideoToggle.addEventListener('click', () => {
      if (!dynoVideo.paused) {
        dynoVideo.pause();
        return;
      }
      // A repeat click continues in the user's previously chosen sound state.
      const promise = dynoVideo.play();
      if (promise && typeof promise.catch === 'function') promise.catch(dynoFail);
    });
    dynoVideoSound.addEventListener('click', () => {
      dynoVideo.muted = !dynoVideo.muted;
      updateDynoControls();
    });
    ['playing', 'pause', 'ended', 'volumechange'].forEach(name => {
      dynoVideo.addEventListener(name, updateDynoControls);
    });
    dynoVideo.addEventListener('error', dynoFail);
    dynoVideo.querySelector('source')?.addEventListener('error', () => {
      if (dynoVideo.error) dynoFail();
    });

    // Avoid invisible audio continuing once the visitor leaves the section.
    if ('IntersectionObserver' in window) {
      const dynoWatcher = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting && !dynoVideo.paused) dynoVideo.pause();
        }
      }, { threshold: 0 });
      dynoWatcher.observe(document.getElementById('dyno'));
    }
    updateDynoControls();
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