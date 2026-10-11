/* Street Performance – navigation, gallery, counters and transitions */
(() => {
  'use strict';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Hero SP badge: responsive 3D parallax, smoothly tracking the mouse
  // while staying in the right-hand hero column (never attached to cursor).
  // Pointer touch gestures give a similar effect on mobile.
  const heroPanel = document.querySelector('#top.intro-banner.hero-split');
  const heroBadge = heroPanel?.querySelector('.hero-identity');
  const heroBadgeScene = heroBadge?.querySelector('.hero-logo-assembly');
  if (heroPanel && heroBadge && heroBadgeScene) {
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
    const current = [0, 0, 0, 0]; // rotateX, rotateY, x-shift, y-shift
    const target = [0, 0, 0, 0];
    let raf = 0;
    let isVisible = true;
    let fingerIsMovingBadge = false;

    const frame = () => {
      raf = 0;
      if (reduceMotion.matches) return;

      let distance = 0;
      for (let index = 0; index < current.length; index++) {
        const delta = target[index] - current[index];
        current[index] += delta * .125; // inertial movement without jump
        distance = Math.max(distance, Math.abs(delta));
      }

      heroBadgeScene.style.setProperty('--logo-rotate-x', current[0].toFixed(3) + 'deg');
      heroBadgeScene.style.setProperty('--logo-rotate-y', current[1].toFixed(3) + 'deg');
      heroBadgeScene.style.setProperty('--logo-shift-x', current[2].toFixed(2) + 'px');
      heroBadgeScene.style.setProperty('--logo-shift-y', current[3].toFixed(2) + 'px');
      heroBadge.style.setProperty('--logo-light-x', (50 + current[1] * 2.1).toFixed(2) + '%');
      heroBadge.style.setProperty('--logo-light-y', (45 - current[0] * 2.1).toFixed(2) + '%');

      if (distance > .018) raf = window.requestAnimationFrame(frame);
    };
    const queue = () => {
      if (!raf && !reduceMotion.matches) raf = window.requestAnimationFrame(frame);
    };
    const neutral = () => {
      target.fill(0);
      queue();
    };
    const aimAt = (clientX, clientY, bounds, extraTilt = false) => {
      if (!bounds.width || !bounds.height || reduceMotion.matches) return;
      const x = clamp((clientX - bounds.left - bounds.width / 2) / (bounds.width / 2), -1, 1);
      const y = clamp((clientY - bounds.top - bounds.height / 2) / (bounds.height / 2), -1, 1);
      const strength = extraTilt ? 1.25 : 1;
      target[0] = -y * 10 * strength;
      target[1] = x * 13 * strength;
      target[2] = x * 10;
      target[3] = y * 7;
      queue();
    };

    // Track the mouse over the entire visible page, not just over the logo.
    // This makes the badge feel visually connected to the cursor.
    window.addEventListener('pointermove', event => {
      if (event.pointerType === 'touch' || !finePointer.matches || !isVisible) return;
      const box = heroPanel.getBoundingClientRect();
      if (box.bottom < 0 || box.top > window.innerHeight) return;
      aimAt(event.clientX, event.clientY, box);
    }, { passive: true });

    // On mobile: drag across the badge to tilt it (vertical scrolling still works).
    heroBadge.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
      fingerIsMovingBadge = true;
      aimAt(event.clientX, event.clientY, heroBadge.getBoundingClientRect(), true);
    }, { passive: true });
    heroBadge.addEventListener('pointermove', event => {
      if (!fingerIsMovingBadge || (event.pointerType !== 'touch' && event.pointerType !== 'pen')) return;
      aimAt(event.clientX, event.clientY, heroBadge.getBoundingClientRect(), true);
    }, { passive: true });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => {
      heroBadge.addEventListener(type, () => {
        if (!fingerIsMovingBadge) return;
        fingerIsMovingBadge = false;
        neutral();
      }, { passive: true });
    });

    if ('IntersectionObserver' in window) {
      const observeHero = new IntersectionObserver(entries => {
        isVisible = entries.some(entry => entry.isIntersecting);
        if (!isVisible) neutral();
      }, { threshold: 0 });
      observeHero.observe(heroPanel);
    }
    window.addEventListener('blur', neutral);
    if (reduceMotion.addEventListener) {
      reduceMotion.addEventListener('change', () => {
        if (reduceMotion.matches) {
          target.fill(0);
          current.fill(0);
          if (raf) window.cancelAnimationFrame(raf);
          raf = 0;
          heroBadgeScene.style.removeProperty('--logo-rotate-x');
          heroBadgeScene.style.removeProperty('--logo-rotate-y');
          heroBadgeScene.style.removeProperty('--logo-shift-x');
          heroBadgeScene.style.removeProperty('--logo-shift-y');
        } else queue();
      });
    }
  }

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


  // Tuning: zugänglicher Vorher/Nachher-Schieberegler für Maus, Touch und Tastatur.
  document.querySelectorAll('.engine-compare').forEach(compare => {
    const slider = compare.querySelector('.engine-compare-range');
    if (!slider) return;

    const render = value => {
      const amount = Math.max(0, Math.min(100, Number(value) || 0));
      compare.style.setProperty('--compare-position', amount + '%');
      slider.value = String(Math.round(amount));
      slider.setAttribute('aria-valuetext', Math.round(amount) + ' Prozent Vorher sichtbar');
    };
    const updateFromPointer = clientX => {
      const bounds = compare.getBoundingClientRect();
      if (bounds.width > 0) {
        render((clientX - bounds.left) / bounds.width * 100);
      }
    };

    slider.addEventListener('input', () => render(slider.value));
    let dragging = false;
    compare.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      dragging = true;
      if (slider.setPointerCapture) {
        try { slider.setPointerCapture(event.pointerId); } catch (_) {}
      }
      updateFromPointer(event.clientX);
    });
    compare.addEventListener('pointermove', event => {
      if (dragging) updateFromPointer(event.clientX);
    });
    const endDrag = () => { dragging = false; };
    compare.addEventListener('pointerup', endDrag);
    compare.addEventListener('pointercancel', endDrag);
    compare.addEventListener('lostpointercapture', endDrag);

    render(slider.value);
  });


  // The navigation floats without any bar while the hero is still underneath.
  // Only after the whole hero has passed the fixed header do we show carbon.
  const stickyHeader = document.querySelector('header.site-header');
  const heroSection = document.querySelector('main > section#top.intro-banner.hero-split');
  if (stickyHeader) {
    const updateHeaderAppearance = () => {
      const heroStillUnderHeader = heroSection
        ? heroSection.getBoundingClientRect().bottom > stickyHeader.getBoundingClientRect().bottom
        : window.scrollY < window.innerHeight * 0.75;
      stickyHeader.classList.toggle('is-scrolled', !heroStillUnderHeader);
    };
    updateHeaderAppearance();
    window.addEventListener('scroll', updateHeaderAppearance, { passive: true });
    window.addEventListener('resize', updateHeaderAppearance, { passive: true });
    window.addEventListener('pageshow', updateHeaderAppearance);
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