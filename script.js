/* CaucasusTours73 — interactions */
(function () {
  'use strict';

  /* ---------- header on scroll ---------- */
  var header = document.getElementById('header');
  function onScroll() {
    if (window.scrollY > 40) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- mobile nav ---------- */
  var burger = document.getElementById('burger');
  var mnav = document.getElementById('mnav');
  var mnavClose = document.getElementById('mnavClose');
  function closeNav() { mnav.classList.remove('open'); document.body.style.overflow = ''; }
  burger.addEventListener('click', function () {
    mnav.classList.add('open'); document.body.style.overflow = 'hidden';
  });
  mnavClose.addEventListener('click', closeNav);
  mnav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeNav); });

  /* ---------- accordions (geo + faq) ---------- */
  function setupAccordion(id) {
    var root = document.getElementById(id);
    if (!root) return;
    var items = root.querySelectorAll('.acc-item');
    function setH(item) {
      var a = item.querySelector('.acc-a');
      if (item.classList.contains('open')) a.style.maxHeight = a.scrollHeight + 'px';
      else a.style.maxHeight = '';
    }
    items.forEach(function (item) {
      var btn = item.querySelector('.acc-q');
      btn.addEventListener('click', function () {
        var wasOpen = item.classList.contains('open');
        items.forEach(function (it) { it.classList.remove('open'); setH(it); });
        if (!wasOpen) { item.classList.add('open'); setH(item); }
      });
      setH(item);
    });
    // recompute open item height on resize
    window.addEventListener('resize', function () {
      items.forEach(function (it) { if (it.classList.contains('open')) setH(it); });
    });
  }
  setupAccordion('geoAcc');
  setupAccordion('faqAcc');

  /* ---------- reviews carousel ---------- */
  var track = document.getElementById('revTrack');
  if (track) {
    var slides = track.children.length;
    var idx = 0;
    var dotsWrap = document.getElementById('revDots');
    for (var i = 0; i < slides; i++) {
      var d = document.createElement('button');
      d.setAttribute('aria-label', 'Отзыв ' + (i + 1));
      (function (n) { d.addEventListener('click', function () { go(n); }); })(i);
      dotsWrap.appendChild(d);
    }
    var dots = dotsWrap.children;
    function render() {
      track.style.transform = 'translateX(' + (-idx * 100) + '%)';
      for (var j = 0; j < dots.length; j++) dots[j].classList.toggle('active', j === idx);
    }
    function go(n) { idx = (n + slides) % slides; render(); restart(); }
    document.getElementById('revPrev').addEventListener('click', function () { go(idx - 1); });
    document.getElementById('revNext').addEventListener('click', function () { go(idx + 1); });
    render();
    var timer;
    function restart() { clearInterval(timer); timer = setInterval(function () { go(idx + 1); }, 7000); }
    restart();
    // swipe
    var sx = null;
    track.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 45) go(idx + (dx < 0 ? 1 : -1));
      sx = null;
    });
  }

  /* ---------- booking form -> Telegram ---------- */
  var form = document.getElementById('bookForm');
  var toast = document.getElementById('toast');
  var toastMsg = document.getElementById('toastMsg');
  var toastTimer;
  function showToast(msg) {
    if (msg) toastMsg.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 5200);
  }
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('bName').value.trim() || 'Здравствуйте';
      var tour = document.getElementById('bTour').value;
      var date = document.getElementById('bDate').value.trim();
      var people = document.getElementById('bPeople').value;
      var msg = 'Здравствуйте, Людмила! Меня зовут ' + name + '. '
        + 'Хочу на тур: ' + tour + '. '
        + (date ? 'Желаемые даты: ' + date + '. ' : '')
        + 'Количество человек: ' + people + '. '
        + 'Подскажите, пожалуйста, ближайшие свободные даты 🙂';

      var openTg = function () { window.open('https://t.me/Ludmila_Bas', '_blank', 'noopener'); };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(msg).then(function () {
          showToast('Заявка скопирована — вставьте её в чат с Людмилой');
          openTg();
        }).catch(function () {
          fallbackCopy(msg); openTg();
        });
      } else {
        fallbackCopy(msg); openTg();
      }
    });
  }
  function fallbackCopy(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
      showToast('Заявка скопирована — вставьте её в чат с Людмилой');
    } catch (err) {
      showToast('Откройте чат и опишите тур — Людмила подскажет даты');
    }
  }

  /* ---------- ambient reel (lazy fetch -> blob; host serves no range requests) ---------- */
  var reel = document.getElementById('reelVid');
  if (reel) {
    var reelStarted = false;
    function loadReel() {
      if (reelStarted) return;
      reelStarted = true;
      reel.addEventListener('canplay', function () { reel.classList.add('ready'); });
      // Try a direct src first (works on real servers); fall back to a fully-fetched blob.
      var settled = false;
      var watchdog = setTimeout(fetchBlob, 2500);
      reel.addEventListener('loadeddata', function () { settled = true; clearTimeout(watchdog); }, { once: true });
      reel.src = 'assets/reel.mp4';
      var p = reel.play(); if (p && p.catch) p.catch(function () {});
      function fetchBlob() {
        if (settled) return;
        fetch('assets/reel.mp4').then(function (r) { return r.blob(); }).then(function (b) {
          settled = true;
          reel.src = URL.createObjectURL(b);
          var pp = reel.play(); if (pp && pp.catch) pp.catch(function () {});
        }).catch(function () {});
      }
    }
    if ('IntersectionObserver' in window) {
      var rio = new IntersectionObserver(function (es) {
        es.forEach(function (en) { if (en.isIntersecting) { loadReel(); rio.disconnect(); } });
      }, { rootMargin: '300px' });
      rio.observe(reel);
    } else {
      loadReel();
    }
  }

  /* ---------- video lightbox ---------- */
  var vmodal = document.getElementById('vmodal');
  var vmodalVid = document.getElementById('vmodalVid');
  var vmodalClose = document.getElementById('vmodalClose');
  var vmodalBackdrop = document.getElementById('vmodalBackdrop');
  function openVideoModal() {
    if (!vmodal) return;
    vmodal.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (vmodalVid) { try { vmodalVid.play(); } catch(e){} }
  }
  function closeVideoModal() {
    if (!vmodal) return;
    vmodal.classList.remove('open');
    document.body.style.overflow = '';
    if (vmodalVid) vmodalVid.pause();
  }
  var heroPlayBtn = document.getElementById('heroPlay');
  var reelPlayBtn = document.getElementById('reelPlay');
  if (heroPlayBtn) heroPlayBtn.addEventListener('click', openVideoModal);
  if (reelPlayBtn) reelPlayBtn.addEventListener('click', openVideoModal);
  if (vmodalClose) vmodalClose.addEventListener('click', closeVideoModal);
  if (vmodalBackdrop) vmodalBackdrop.addEventListener('click', closeVideoModal);
  document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeVideoModal(); });

  /* ---------- scroll reveal ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el, k) {
      el.style.transitionDelay = ((k % 3) * 0.08) + 's';
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }
})();
