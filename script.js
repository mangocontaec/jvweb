/* ==========================================================================
   EL MUÑECAZO — script.js
   Vanilla JS. GSAP (loaded via CDN in index.html) is optional progressive
   enhancement — everything below works even if GSAP fails to load.
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGSAP = typeof window.gsap !== 'undefined';

  /* ----------------------------------------------------------------------
     1. MOBILE NAV TOGGLE
     ---------------------------------------------------------------------- */
  var navToggle = document.getElementById('navToggle');
  var navMenu = document.getElementById('navMenu');
  var navScrim = document.getElementById('navScrim');

  function closeMobileNav() {
    navMenu.classList.remove('is-open');
    navScrim.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  }
  function toggleMobileNav() {
    var open = navMenu.classList.toggle('is-open');
    navScrim.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  if (navToggle) {
    navToggle.addEventListener('click', toggleMobileNav);
    navScrim.addEventListener('click', closeMobileNav);
    navMenu.querySelectorAll('.nav-link').forEach(function (link) {
      link.addEventListener('click', closeMobileNav);
    });
  }

  /* ----------------------------------------------------------------------
     2. ACTIVE SECTION HIGHLIGHT
     ---------------------------------------------------------------------- */
  var navLinks = document.querySelectorAll('.nav-link');
  var topSections = ['home', 'shows', 'saludos', 'contactos']
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);

  if ('IntersectionObserver' in window && topSections.length) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.id;
          navLinks.forEach(function (link) {
            link.classList.toggle('active', link.dataset.section === id);
          });
        }
      });
    }, { threshold: 0.4 });

    topSections.forEach(function (section) { sectionObserver.observe(section); });
  }

  /* ----------------------------------------------------------------------
     3. SCROLL REVEAL (base — always works)
     ---------------------------------------------------------------------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in-view'); });
  }

  /* Optional GSAP enhancement: subtle video parallax on scroll.
     Uses transform only (never opacity) so it can never conflict with the
     base .reveal/.in-view system above — safe to add or remove GSAP. */
  if (hasGSAP && !reduceMotion) {
    try {
      gsap.registerPlugin(ScrollTrigger);
      document.querySelectorAll('.video-bg__frame').forEach(function (frame) {
        gsap.to(frame, {
          yPercent: 12,
          ease: 'none',
          scrollTrigger: {
            trigger: frame.closest('.hero'),
            start: 'top top',
            end: 'bottom top',
            scrub: true
          }
        });
      });
    } catch (e) { /* GSAP present but failed — page still fully functional without it */ }
  }

  /* ----------------------------------------------------------------------
     4. YOUTUBE VIDEO BACKGROUNDS
     ---------------------------------------------------------------------- */
  document.querySelectorAll('.video-bg').forEach(function (bg) {
    var id = bg.dataset.ytId;
    var frame = bg.querySelector('.video-bg__frame');
    if (!id || !frame) return;
    var iframe = document.createElement('iframe');
    iframe.src = 'https://www.youtube.com/embed/' + id +
      '?autoplay=1&mute=1&loop=1&playlist=' + id +
      '&controls=0&showinfo=0&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&playsinline=1';
    iframe.title = 'Video de fondo';
    iframe.allow = 'autoplay; encrypted-media';
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('tabindex', '-1');
    iframe.setAttribute('aria-hidden', 'true');
    frame.appendChild(iframe);
    /* fallback gradient (.video-bg__fallback) stays underneath at all times,
       so if the iframe is blocked/slow the section never looks broken */
  });

  /* ----------------------------------------------------------------------
     5. COLLAGE — hover lift + subtle mouse parallax
     Rotation and the slow "gravity" drift live on the outer <figure>
     (CSS animation, never touched from JS). Only the inner frame gets an
     inline transform here, so hovering/parallax never straightens a photo. */
  var collageGrid = document.getElementById('collageGrid');
  if (collageGrid) {
    var collageItems = collageGrid.querySelectorAll('.collage-item');

    collageItems.forEach(function (item) {
      var frame = item.querySelector('.collage-item__frame');
      if (!frame) return;
      item.addEventListener('mouseenter', function () { frame.style.transform = 'scale(1.07)'; });
      item.addEventListener('mouseleave', function () { frame.style.transform = ''; });
    });

    if (!reduceMotion) {
      collageGrid.addEventListener('mousemove', function (e) {
        var rect = collageGrid.getBoundingClientRect();
        var relX = (e.clientX - rect.left) / rect.width - 0.5;
        var relY = (e.clientY - rect.top) / rect.height - 0.5;

        collageItems.forEach(function (item, i) {
          var frame = item.querySelector('.collage-item__frame');
          if (!frame) return;
          var depth = ((i % 3) + 1) * 5;
          var hovered = item.matches(':hover');
          frame.style.transform =
            'translate(' + (relX * depth) + 'px, ' + (relY * depth) + 'px)' +
            (hovered ? ' scale(1.07)' : '');
        });
      });

      collageGrid.addEventListener('mouseleave', function () {
        collageItems.forEach(function (item) {
          var frame = item.querySelector('.collage-item__frame');
          if (frame) frame.style.transform = '';
        });
      });
    }
  }

  /* ----------------------------------------------------------------------
     6. FLOATING PHOTOS — pause drift + lift on hover
     ---------------------------------------------------------------------- */
  var floatingStage = document.getElementById('floatingStage');
  if (floatingStage) {
    floatingStage.querySelectorAll('.float-photo').forEach(function (photo) {
      photo.addEventListener('mouseenter', function () { photo.classList.add('is-paused'); });
      photo.addEventListener('mouseleave', function () { photo.classList.remove('is-paused'); });
    });
  }

  /* ----------------------------------------------------------------------
     7. STAT COUNTERS
     ---------------------------------------------------------------------- */
  var statNumbers = document.querySelectorAll('.stat-number');
  function animateCount(el) {
    var target = parseInt(el.dataset.target, 10) || 0;
    var duration = 1600;
    var startTime = null;

    function step(ts) {
      if (!startTime) startTime = ts;
      var progress = Math.min((ts - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target).toLocaleString('es-EC');
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target.toLocaleString('es-EC');
      }
    }
    requestAnimationFrame(step);
  }

  if ('IntersectionObserver' in window && statNumbers.length) {
    var statObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          statObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    statNumbers.forEach(function (el) { statObserver.observe(el); });
  } else {
    statNumbers.forEach(function (el) { el.textContent = (el.dataset.target || '0'); });
  }

  /* ----------------------------------------------------------------------
     8. FIREWORKS CANVAS (Shows hero)
     ---------------------------------------------------------------------- */
  (function fireworks() {
    var canvas = document.getElementById('fireworksCanvas');
    if (!canvas || reduceMotion) return;
    var ctx = canvas.getContext('2d');
    var section = canvas.closest('.hero');
    var particles = [];
    var running = true;
    var rafId;

    function resize() {
      canvas.width = section.clientWidth;
      canvas.height = section.clientHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    var palette = ['#e30f24', '#ffffff', '#f4f2ee'];

    function spawnBurst() {
      var x = canvas.width * (0.15 + Math.random() * 0.7);
      var y = canvas.height * (0.2 + Math.random() * 0.35);
      var count = 26 + Math.floor(Math.random() * 14);
      for (var i = 0; i < count; i++) {
        var angle = (Math.PI * 2 * i) / count;
        var speed = 1.4 + Math.random() * 2.4;
        particles.push({
          x: x, y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          decay: 0.012 + Math.random() * 0.012,
          color: palette[Math.floor(Math.random() * palette.length)],
          size: 1.5 + Math.random() * 2
        });
      }
    }

    function tick() {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var i = particles.length - 1; i >= 0; i--) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.02;
        p.life -= p.decay;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        ctx.globalAlpha = Math.max(p.life, 0);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      rafId = requestAnimationFrame(tick);
    }

    var burstInterval = setInterval(function () {
      if (running) spawnBurst();
    }, 1500);

    tick();
    spawnBurst();

    /* pause the whole effect when hero is off-screen to save CPU */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          running = entry.isIntersecting;
          if (running) tick();
        });
      }, { threshold: 0.05 }).observe(section);
    }

    window.addEventListener('beforeunload', function () {
      clearInterval(burstInterval);
      cancelAnimationFrame(rafId);
    });
  })();

  /* ----------------------------------------------------------------------
     9. EMOJI RAIN (Saludos hero)
     ---------------------------------------------------------------------- */
  (function emojiRain() {
    var canvas = document.getElementById('emojiCanvas');
    if (!canvas || reduceMotion) return;
    var ctx = canvas.getContext('2d');
    var section = canvas.closest('.hero');
    var emojis = ['🎉', '🔥', '❤️', '😂', '🎤', '🎵', '🥳'];
    var drops = [];
    var running = true;
    var rafId;

    function resize() {
      canvas.width = section.clientWidth;
      canvas.height = section.clientHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function makeDrop(randomY) {
      return {
        x: Math.random() * canvas.width,
        y: randomY ? Math.random() * canvas.height : -40,
        size: 18 + Math.random() * 22,
        speed: 0.6 + Math.random() * 1.6,
        drift: (Math.random() - 0.5) * 0.6,
        spin: (Math.random() - 0.5) * 0.02,
        angle: Math.random() * Math.PI,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        opacity: 0.55 + Math.random() * 0.4
      };
    }

    var DROP_COUNT = window.innerWidth < 640 ? 16 : 28;
    for (var i = 0; i < DROP_COUNT; i++) drops.push(makeDrop(true));

    function tick() {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drops.forEach(function (d) {
        d.y += d.speed;
        d.x += d.drift;
        d.angle += d.spin;
        if (d.y > canvas.height + 40) {
          Object.assign(d, makeDrop(false));
        }
        ctx.save();
        ctx.globalAlpha = d.opacity;
        ctx.font = d.size + 'px sans-serif';
        ctx.translate(d.x, d.y);
        ctx.rotate(d.angle * 0.15);
        ctx.textAlign = 'center';
        ctx.fillText(d.emoji, 0, 0);
        ctx.restore();
      });
      ctx.globalAlpha = 1;
      rafId = requestAnimationFrame(tick);
    }
    tick();

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          running = entry.isIntersecting;
          if (running) tick();
        });
      }, { threshold: 0.05 }).observe(section);
    }
  })();

  /* ----------------------------------------------------------------------
     10. SALUDOS MODAL
     ---------------------------------------------------------------------- */
  /* Set "video" to a real YouTube ID (e.g. 'dQw4w9WgXcQ') to replace the
     placeholder with an actual demo clip for that greeting type. */
  var modalData = {
    cumple: { title: 'Saludo de Cumpleaños', video: '' },
    sorpresa: { title: 'Saludo Sorpresa', video: '' },
    empresarial: { title: 'Saludo Empresarial / Evento', video: '' }
  };

  var modalOverlay = document.getElementById('modalOverlay');
  var modalClose = document.getElementById('modalClose');
  var modalTitle = document.getElementById('modalTitle');
  var modalVideoFrame = document.getElementById('modalVideoFrame');
  var modalVideoPlaceholder = document.getElementById('modalVideoPlaceholder');
  var modalWhatsapp = document.getElementById('modalWhatsapp');
  var lastFocusedEl = null;

  function openModal(key) {
    var data = modalData[key];
    if (!data || !modalOverlay) return;
    lastFocusedEl = document.activeElement;

    modalTitle.textContent = data.title;

    if (data.video) {
      modalVideoFrame.src = 'https://www.youtube.com/embed/' + data.video + '?autoplay=0&rel=0';
      modalVideoFrame.hidden = false;
      modalVideoPlaceholder.hidden = true;
    } else {
      modalVideoFrame.hidden = true;
      modalVideoPlaceholder.hidden = false;
    }

    /* WhatsApp number placeholder — replace 593XXXXXXXXX with the real number */
    var msg = encodeURIComponent('Hola, quiero solicitar un saludo personalizado de El Muñecazo (' + data.title + ').');
    modalWhatsapp.href = 'https://wa.me/593XXXXXXXXX?text=' + msg;

    modalOverlay.classList.add('is-open');
    modalOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    modalClose.focus();
  }

  function closeModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove('is-open');
    modalOverlay.setAttribute('aria-hidden', 'true');
    modalVideoFrame.src = '';
    document.body.style.overflow = '';
    if (lastFocusedEl) lastFocusedEl.focus();
  }

  document.querySelectorAll('[data-open-modal]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      openModal(btn.dataset.openModal);
    });
  });

  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalOverlay) {
    modalOverlay.addEventListener('click', function (e) {
      if (e.target === modalOverlay) closeModal();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modalOverlay && modalOverlay.classList.contains('is-open')) {
      closeModal();
    }
  });

  /* ----------------------------------------------------------------------
     11. CONTACT FORM
     ---------------------------------------------------------------------- */
  var contactForm = document.getElementById('contactForm');
  var formStatus = document.getElementById('formStatus');

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!contactForm.checkValidity()) {
        formStatus.textContent = 'Por favor completa todos los campos requeridos.';
        return;
      }

      var data = new FormData(contactForm);
      var name = data.get('nombre');
      var phone = data.get('telefono');
      var city = data.get('ciudad');
      var type = data.get('tipo');
      var message = data.get('mensaje');

      /* No backend configured yet — route the request to WhatsApp instead.
         Replace 593XXXXXXXXX with the real business number when wiring a backend/API. */
      var text = encodeURIComponent(
        'Solicitud desde la web de El Muñecazo\n' +
        'Nombre: ' + name + '\n' +
        'Teléfono: ' + phone + '\n' +
        'Ciudad: ' + city + '\n' +
        'Tipo: ' + type + '\n' +
        'Mensaje: ' + message
      );
      window.open('https://wa.me/593XXXXXXXXX?text=' + text, '_blank', 'noopener');

      formStatus.style.color = 'var(--white)';
      formStatus.textContent = '¡Listo! Te redirigimos a WhatsApp para confirmar tu solicitud.';
      contactForm.reset();
    });
  }

})();
