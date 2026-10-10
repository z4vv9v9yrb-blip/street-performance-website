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
})();

