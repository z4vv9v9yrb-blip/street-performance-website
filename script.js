(() => {
  const menu = document.getElementById('menuToggle');
  const nav = document.getElementById('mobileNav');
  if (menu && nav) {
    menu.addEventListener('click', () => {
      const opened = nav.classList.toggle('open');
      menu.setAttribute('aria-expanded', String(opened));
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false');
    }));
  }
  const dialog = document.getElementById('videoDialog');
  const opener = document.getElementById('playReel');
  const closer = document.getElementById('closeVideo');
  if (dialog && opener && closer) {
    opener.addEventListener('click', () => dialog.showModal());
    closer.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  }
  const form = document.getElementById('quoteForm');
  if (form) form.addEventListener('submit', e => {
    e.preventDefault();
    const data = new FormData(form);
    const email = document.body.dataset.contactEmail || 'example@example.com';
    const subject = `Detailed enquiry — ${data.get('service') || 'Car service'}`;
    const text = `Name: ${data.get('name')}\nEmail: ${data.get('email')}\nPhone: ${data.get('phone')}\nService: ${data.get('service')}\n\n${data.get('message')}`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
    document.getElementById('formFeedback').textContent = 'Your email application should now open. The form does not send messages by itself.';
  });

  // Scroll reveal: add effects only when the browser supports them.
  // Content stays visible in unsupported browsers and with reduced-motion settings.
  const motionOK = 'IntersectionObserver' in window &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const revealSelectors = [
    '.hero-top h1', '.hero-top p', '.hero-top .inline-link', '.hero-picture',
    '.services .section-pretitle', '.services-heading h2', '.services-heading p',
    '.service-card', '.reel-image', '.numbers .stat',
    '.about h2', '.about-visual img', '.about-right .reason',
    '.about-right > .mini-link', '.faq h2', '.faq-items details',
    '.contact-banner .banner-image', '.footer-grid > div', '.footer-bottom',
    '.quote-intro h1', '.quote-intro > p', '.quote-contact-row',
    '.quote-form > div', '.quote-form > button', '.quote-page + .faq h2'
  ];

  if (motionOK) {
    const nodes = [...document.querySelectorAll(revealSelectors.join(', '))];
    const delayStep = 85;
    const groups = [
      ['.hero-top h1', '.hero-top p', '.hero-top .inline-link', '.hero-picture'],
      ['.service-card'], ['.numbers .stat'], ['.about-right .reason'],
      ['.faq-items details'], ['.footer-grid > div'],
      ['.quote-contact-row'], ['.quote-form > div']
    ];
    groups.forEach(selectors => {
      const matched = [...document.querySelectorAll(selectors.join(', '))];
      matched.forEach((node, i) => {
        node.style.setProperty('--reveal-delay', Math.min(i * delayStep, 340) + 'ms');
      });
    });

    // Elements below the fold should not suddenly disappear while JavaScript starts.
    // Animate only the elements which are not yet visible.
    const viewportH = window.innerHeight || document.documentElement.clientHeight;
    nodes.forEach(node => {
      const rect = node.getBoundingClientRect();
      if (rect.top < viewportH * 0.87 && rect.bottom > 0) {
        node.classList.add('scroll-reveal', 'is-visible');
      } else {
        node.classList.add('scroll-reveal');
      }
    });
    document.documentElement.classList.add('js-motion');

    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -7% 0px' });
    nodes.filter(node => !node.classList.contains('is-visible'))
      .forEach(node => revealObserver.observe(node));
  }

  // Count each number from zero the first time it appears in the viewport.
  const counters = [...document.querySelectorAll('.counter[data-count]')];
  const displayNumber = (value, decimals) =>
    value.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });

  function countUp(element) {
    if (element.dataset.counted === 'true') return;
    element.dataset.counted = 'true';
    const end = Number(element.dataset.count);
    const decimals = Number(element.dataset.decimals || 0);
    if (!Number.isFinite(end)) return;
    const duration = 1700;
    let start;
    element.textContent = displayNumber(0, decimals);
    const frame = now => {
      if (start === undefined) start = now;
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = decimals ? end * eased : Math.round(end * eased);
      element.textContent = displayNumber(current, decimals);
      if (progress < 1) window.requestAnimationFrame(frame);
      else element.textContent = displayNumber(end, decimals);
    };
    window.requestAnimationFrame(frame);
  }

  if (motionOK && counters.length) {
    const numberObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        countUp(entry.target);
        numberObserver.unobserve(entry.target);
      });
    }, { threshold: 0.4, rootMargin: '0px 0px -6% 0px' });
    counters.forEach(counter => numberObserver.observe(counter));
  }

})();
