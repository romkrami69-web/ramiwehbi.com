/* =========================================================
   APERTURE — vanilla JS
   Every init guards missing elements and runs independently.
   No third-party libs, no external scripts (Bootstrap bundle is local).
   ========================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- header: solid on scroll ---------- */
  function initHeaderScroll() {
    var header = document.querySelector(".ap-header");
    if (!header) return;
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 40);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- mobile nav ---------- */
  function initMobileNav() {
    var toggle = document.querySelector(".ap-nav__toggle");
    var list = document.getElementById("ap-menu");
    if (!toggle || !list) return;

    var close = function () {
      list.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
    };
    var open = function () {
      list.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close menu");
    };

    toggle.addEventListener("click", function () {
      if (list.classList.contains("is-open")) { close(); } else { open(); }
    });

    list.addEventListener("click", function (e) {
      if (e.target.closest("a")) close();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });

    // reset when returning to desktop
    window.addEventListener("resize", function () {
      if (window.innerWidth > 860) close();
    });
  }

  /* ---------- smooth scroll for in-page links ---------- */
  function initSmoothScroll() {
    var links = document.querySelectorAll('a[href^="#"]');
    if (!links.length) return;
    links.forEach(function (link) {
      link.addEventListener("click", function (e) {
        var id = link.getAttribute("href");
        if (id === "#" || id.length < 2) return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
        if (history.replaceState) history.replaceState(null, "", id);
      });
    });
  }

  /* ---------- scroll reveal ---------- */
  function initScrollReveal() {
    var els = document.querySelectorAll(".ap-reveal");
    if (!els.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    // stagger index for gallery tiles
    var tiles = document.querySelectorAll(".ap-masonry .ap-tile");
    tiles.forEach(function (t, i) { t.style.setProperty("--i", (i % 6)); });

    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- animated stat counters ---------- */
  function initCounters() {
    var nums = document.querySelectorAll("[data-count]");
    if (!nums.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) return;

    var run = function (el) {
      var target = parseInt(el.getAttribute("data-count"), 10) || 0;
      var start = null, dur = 1400;
      var step = function (ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString();
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { run(entry.target); obs.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    nums.forEach(function (n) { io.observe(n); });
  }

  /* ---------- gallery filter ---------- */
  function initGalleryFilter() {
    var buttons = document.querySelectorAll(".ap-filter__btn");
    var tiles = document.querySelectorAll("#ap-gallery .ap-tile");
    var empty = document.querySelector(".ap-work__empty");
    if (!buttons.length || !tiles.length) return;

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var filter = btn.getAttribute("data-filter");
        buttons.forEach(function (b) {
          var active = b === btn;
          b.classList.toggle("is-active", active);
          b.setAttribute("aria-pressed", active ? "true" : "false");
        });
        var shown = 0;
        tiles.forEach(function (tile) {
          var match = filter === "all" || tile.getAttribute("data-cat") === filter;
          tile.classList.toggle("is-hidden", !match);
          if (match) shown++;
        });
        if (empty) empty.hidden = shown !== 0;
      });
    });
  }

  /* ---------- lightbox ---------- */
  function initLightbox() {
    var lb = document.getElementById("ap-lightbox");
    var gallery = document.getElementById("ap-gallery");
    if (!lb || !gallery) return;

    var imgEl = document.getElementById("ap-lb-img");
    var capEl = document.getElementById("ap-lb-cap");
    var exifEl = document.getElementById("ap-lb-exif");
    var triggers = Array.prototype.slice.call(gallery.querySelectorAll(".ap-tile__btn"));
    var current = 0;
    var visible = [];
    var lastFocused = null;

    var render = function () {
      var btn = visible[current];
      if (!btn) return;
      var img = btn.querySelector("img");
      imgEl.src = btn.getAttribute("data-full");
      imgEl.alt = img ? img.alt : "";
      capEl.textContent = (btn.getAttribute("data-caption") || "").replace(/&amp;/g, "&");
      exifEl.textContent = btn.getAttribute("data-exif") || "";
    };

    var open = function (btn) {
      // only navigate among currently visible (unfiltered) tiles
      visible = triggers.filter(function (t) {
        var tile = t.closest(".ap-tile");
        return tile && !tile.classList.contains("is-hidden");
      });
      current = visible.indexOf(btn);
      if (current < 0) current = 0;
      lastFocused = btn;
      render();
      lb.hidden = false;
      lb.classList.add("is-open");
      document.body.style.overflow = "hidden";
      var closeBtn = lb.querySelector(".ap-lb__close");
      if (closeBtn) closeBtn.focus();
    };

    var close = function () {
      lb.hidden = true;
      lb.classList.remove("is-open");
      document.body.style.overflow = "";
      imgEl.src = "";
      if (lastFocused) lastFocused.focus();
    };

    var move = function (dir) {
      if (!visible.length) return;
      current = (current + dir + visible.length) % visible.length;
      render();
    };

    triggers.forEach(function (btn) {
      btn.addEventListener("click", function () { open(btn); });
    });

    lb.querySelectorAll("[data-lb-close]").forEach(function (el) {
      el.addEventListener("click", close);
    });
    var prev = lb.querySelector("[data-lb-prev]");
    var next = lb.querySelector("[data-lb-next]");
    if (prev) prev.addEventListener("click", function () { move(-1); });
    if (next) next.addEventListener("click", function () { move(1); });

    document.addEventListener("keydown", function (e) {
      if (lb.hidden) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") move(-1);
      else if (e.key === "ArrowRight") move(1);
    });

    // basic swipe on touch
    var sx = 0;
    lb.addEventListener("touchstart", function (e) { sx = e.changedTouches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) move(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  /* ---------- contact form validation ---------- */
  function initContactForm() {
    var form = document.getElementById("ap-contact-form");
    if (!form) return;
    var ok = form.querySelector(".ap-form__ok");

    var validateField = function (field) {
      var input = field.querySelector("input, textarea, select");
      if (!input || !input.hasAttribute("required")) return true;
      var valid = input.value.trim() !== "";
      if (valid && input.type === "email") {
        valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
      }
      field.classList.toggle("is-invalid", !valid);
      return valid;
    };

    form.querySelectorAll(".ap-field").forEach(function (field) {
      var input = field.querySelector("input, textarea, select");
      if (!input) return;
      input.addEventListener("blur", function () { validateField(field); });
      input.addEventListener("input", function () {
        if (field.classList.contains("is-invalid")) validateField(field);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var allValid = true;
      var firstBad = null;
      form.querySelectorAll(".ap-field").forEach(function (field) {
        var good = validateField(field);
        if (!good && !firstBad) firstBad = field.querySelector("input, textarea, select");
        if (!good) allValid = false;
      });
      if (!allValid) {
        if (firstBad) firstBad.focus();
        return;
      }
      if (ok) ok.hidden = false;
      form.reset();
      setTimeout(function () { if (ok) ok.hidden = true; }, 6000);
    });
  }

  /* ---------- active nav highlight (scrollspy) ---------- */
  function initActiveNav() {
    var links = document.querySelectorAll(".ap-nav__list a[data-nav]");
    if (!links.length || !("IntersectionObserver" in window)) return;
    var map = {};
    links.forEach(function (l) {
      var id = l.getAttribute("href");
      if (id && id.charAt(0) === "#") map[id.slice(1)] = l;
    });
    var sections = Object.keys(map).map(function (id) { return document.getElementById(id); }).filter(Boolean);
    if (!sections.length) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          links.forEach(function (l) { l.classList.remove("is-current"); });
          var link = map[entry.target.id];
          if (link) link.classList.add("is-current");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });

    sections.forEach(function (s) { io.observe(s); });
  }

  /* ---------- boot ---------- */
  function boot() {
    initHeaderScroll();
    initMobileNav();
    initSmoothScroll();
    initScrollReveal();
    initCounters();
    initGalleryFilter();
    initLightbox();
    initContactForm();
    initActiveNav();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
