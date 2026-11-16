(function () {
  'use strict';
  var doc = document;
  doc.documentElement.classList.add('js');
  doc.getElementById('year').textContent = new Date().getFullYear();

  /* Header: border on scroll */
  var header = doc.querySelector('.top');
  function onScroll() { header.classList.toggle('scrolled', window.scrollY > 10); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  if ('IntersectionObserver' in window) {
    /* One quiet reveal for the main blocks */
    var rv = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); rv.unobserve(en.target); } });
    }, { threshold: 0.12 });
    doc.querySelectorAll('.room, .plans, .gallery, .contact > *').forEach(function (el) { el.classList.add('reveal'); rv.observe(el); });
  }

  /* Photos: show a neutral placeholder if an image file is missing */
  doc.querySelectorAll('.photo img').forEach(function (img) {
    function miss() { img.parentElement.classList.add('empty'); }
    if (img.complete && img.naturalWidth === 0) miss();
    img.addEventListener('error', miss);
  });

  /* Gallery lightbox */
  var box = doc.getElementById('lightbox');
  var boxImg = box.querySelector('img');
  doc.querySelectorAll('.gallery .photo').forEach(function (fig) {
    fig.addEventListener('click', function () {
      var img = fig.querySelector('img');
      if (fig.classList.contains('empty') || !box.showModal) return;
      boxImg.src = img.currentSrc || img.src; boxImg.alt = img.alt; box.showModal();
    });
  });
  box.addEventListener('click', function (e) { if (e.target === box || e.target.classList.contains('close')) box.close(); });

  /* Enquiry form: validation + Netlify Forms submission */
  var form = doc.getElementById('enquiry');
  var status = doc.getElementById('status');
  var WA = 'https://wa.me/918961410963';

  function cleanPhone(v) {
    var d = v.replace(/[\s\-().]/g, '').replace(/^\+/, '');
    if (/^91\d{10}$/.test(d)) d = d.slice(2);
    else if (/^0\d{10}$/.test(d)) d = d.slice(1);
    return d;
  }
  var rules = {
    name: function (v) { return v.trim().length >= 2 ? '' : 'Please enter your name.'; },
    phone: function (v) { return /^[6-9]\d{9}$/.test(cleanPhone(v)) ? '' : 'Enter a valid 10-digit Indian mobile number.'; },
    message: function (v) { return v.trim().length >= 10 ? '' : 'Please write a short message (at least 10 characters).'; }
  };
  function check(field) {
    var el = form.elements[field];
    var msg = rules[field](el.value);
    doc.getElementById(field + '-err').textContent = msg;
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (msg) el.setAttribute('aria-describedby', field + '-err'); else el.removeAttribute('aria-describedby');
    return !msg;
  }
  Object.keys(rules).forEach(function (f) {
    form.elements[f].addEventListener('blur', function () { check(f); });
    form.elements[f].addEventListener('input', function () { if (form.elements[f].getAttribute('aria-invalid') === 'true') check(f); });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    status.className = 'status'; status.textContent = '';
    var results = Object.keys(rules).map(check);
    if (results.indexOf(false) !== -1) {
      form.querySelector('[aria-invalid="true"]').focus();
      return;
    }
    if (form.elements['bot-field'].value) return; /* honeypot */
    form.elements.phone.value = cleanPhone(form.elements.phone.value);

    var btn = form.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'Sending...';
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(form)).toString()
    }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      form.reset();
      status.className = 'status ok';
      status.textContent = 'Thank you. Your enquiry has been sent and we will contact you soon.';
    }).catch(function () {
      var text = encodeURIComponent('Hi, I am ' + form.elements.name.value + '. ' + form.elements.message.value + ' (Phone: ' + form.elements.phone.value + ')');
      status.className = 'status bad';
      status.innerHTML = 'Your enquiry could not be sent. Please call 62916 02241 or <a href="' + WA + '?text=' + text + '" target="_blank" rel="noopener">send it on WhatsApp</a>.';
    }).finally(function () {
      btn.disabled = false; btn.textContent = 'Send enquiry';
    });
  });
})();
