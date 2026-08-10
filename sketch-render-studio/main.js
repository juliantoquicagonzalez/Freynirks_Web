(function () {
  "use strict";

  const $$ = (sel, scope) => Array.from((scope || document).querySelectorAll(sel));
  function safe(fn, name) { try { fn(); } catch (e) { console.warn("[" + name + "]", e); } }

  function initReveal() {
    const targets = $$("[data-reveal], .chapter");
    if (!targets.length) return;

    // Stagger siblings inside reveal-groups (e.g. the preset grid) without
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

    // Safety net: force-reveal anything still hidden after 6s
    setTimeout(() => {
      targets.forEach((el) => {
        if (!el.classList.contains("is-visible") && el.getBoundingClientRect().top < window.innerHeight) {
          el.classList.add("is-visible");
        }
      });
    }, 6000);
  }

  function initProgressBar() {
    const fill = document.querySelector("[data-progress-fill]");
    if (!fill) return;
    let ticking = false;
    function update() {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      const pct = scrollable > 0 ? (doc.scrollTop / scrollable) * 100 : 0;
      fill.style.width = pct + "%";
      ticking = false;
    }
    window.addEventListener("scroll", () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  function initBackToTop() {
    const btn = document.querySelector("[data-back-to-top]");
    if (!btn) return;
    const hero = document.querySelector(".hero");
    const threshold = hero ? hero.offsetHeight : 600;
    let ticking = false;
    function update() {
      btn.classList.toggle("is-visible", window.scrollY > threshold);
      ticking = false;
    }
    window.addEventListener("scroll", () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    btn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    });
    update();
  }

  function boot() {
    safe(initReveal, "initReveal");
    safe(initProgressBar, "initProgressBar");
    safe(initBackToTop, "initBackToTop");
    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
