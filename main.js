(function () {
  "use strict";

  const $$ = (sel, scope) => Array.from((scope || document).querySelectorAll(sel));
  function safe(fn, name) { try { fn(); } catch (e) { console.warn("[" + name + "]", e); } }

  function initReveal() {
    const targets = $$("[data-reveal]");
    if (!targets.length) return;

    // Stagger siblings inside reveal-groups (e.g. card grids) without
    // permanently delaying their hover transitions.
    $$("[data-reveal-group]").forEach((group) => {
      Array.from(group.children).forEach((el, i) => {
        if (el.hasAttribute("data-reveal")) el.style.transitionDelay = (i * 90) + "ms";
      });
    });

    function clearDelay(el) {
      el.addEventListener("transitionend", () => { el.style.transitionDelay = ""; }, { once: true });
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          if (entry.target.style.transitionDelay) clearDelay(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -18% 0px" });

    targets.forEach((el) => io.observe(el));

    setTimeout(() => {
      targets.forEach((el) => {
        if (!el.classList.contains("is-visible") && el.getBoundingClientRect().top < window.innerHeight) {
          el.classList.add("is-visible");
        }
      });
    }, 6000);
  }

  function initHeroFade() {
    const hero = document.querySelector(".hero");
    const overlay = document.querySelector("[data-hero-fade]");
    if (!hero || !overlay) return;

    function update() {
      const heroHeight = hero.offsetHeight || 1;
      const progress = Math.min(Math.max(window.scrollY / heroHeight, 0), 1);
      hero.style.setProperty("--hero-fade", progress.toFixed(3));
    }

    let ticking = false;
    window.addEventListener("scroll", () => {
      if (!ticking) {
        requestAnimationFrame(() => { update(); ticking = false; });
        ticking = true;
      }
    }, { passive: true });

    update();
  }

  function boot() {
    safe(initReveal, "initReveal");
    safe(initHeroFade, "initHeroFade");
    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
