(function () {
  "use strict";

  const $ = (sel, scope) => (scope || document).querySelector(sel);
  const $$ = (sel, scope) => Array.from((scope || document).querySelectorAll(sel));
  function safe(fn, name) { try { fn(); } catch (e) { console.warn("[" + name + "]", e); } }

  function initTree() {
    const toggles = $$("[data-toggle]");
    toggles.forEach((toggle) => {
      const parent = toggle.closest(".nav-tree__parent");
      const children = parent ? parent.querySelector(".nav-tree__children") : null;
      if (!children) return;

      function toggleOpen() {
        const open = parent.classList.toggle("is-open");
        children.classList.toggle("is-open", open);
      }

      toggle.addEventListener("click", toggleOpen);
      toggle.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleOpen(); }
      });
    });

    const expandAllBtn = $("[data-expand-all]");
    const collapseAllBtn = $("[data-collapse-all]");
    if (expandAllBtn) {
      expandAllBtn.addEventListener("click", () => {
        $$(".nav-tree__parent").forEach((p) => p.classList.add("is-open"));
        $$(".nav-tree__children").forEach((c) => c.classList.add("is-open"));
      });
    }
    if (collapseAllBtn) {
      collapseAllBtn.addEventListener("click", () => {
        $$(".nav-tree__parent").forEach((p) => p.classList.remove("is-open"));
        $$(".nav-tree__children").forEach((c) => c.classList.remove("is-open"));
      });
    }
  }

  function initSidebarDrawer() {
    const sidebar = $("[data-sidebar]");
    const scrim = $("[data-sidebar-scrim]");
    const toggleBtn = $("[data-sidebar-toggle]");
    if (!sidebar || !toggleBtn) return;

    function open() {
      sidebar.classList.add("is-open");
      if (scrim) scrim.classList.add("is-open");
      toggleBtn.setAttribute("aria-expanded", "true");
    }
    function close() {
      sidebar.classList.remove("is-open");
      if (scrim) scrim.classList.remove("is-open");
      toggleBtn.setAttribute("aria-expanded", "false");
    }
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.contains("is-open") ? close() : open();
    });
    if (scrim) scrim.addEventListener("click", close);
    $$(".nav-tree__link").forEach((link) => link.addEventListener("click", close));
  }

  function initThemeToggle() {
    const btn = $("[data-theme-toggle]");
    const icon = $("[data-theme-icon]");
    if (!btn) return;

    const stored = localStorage.getItem("srs-manual-theme");
    if (stored === "light") {
      document.documentElement.setAttribute("data-theme", "light");
      if (icon) icon.textContent = "☀";
    }

    btn.addEventListener("click", () => {
      const isLight = document.documentElement.getAttribute("data-theme") === "light";
      if (isLight) {
        document.documentElement.removeAttribute("data-theme");
        localStorage.setItem("srs-manual-theme", "dark");
        if (icon) icon.textContent = "☾";
      } else {
        document.documentElement.setAttribute("data-theme", "light");
        localStorage.setItem("srs-manual-theme", "light");
        if (icon) icon.textContent = "☀";
      }
    });
  }

  function initReveal() {
    const targets = $$(".content > *");
    if (!targets.length) return;
    targets.forEach((el) => el.setAttribute("data-reveal", ""));

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
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

  function initScrollspy() {
    const links = $$(".nav-tree__link");
    if (!links.length) return;
    const map = new Map();
    links.forEach((link) => {
      const id = link.getAttribute("href").slice(1);
      const target = document.getElementById(id);
      if (target) map.set(target, link);
    });
    if (!map.size) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const link = map.get(entry.target);
        if (!link) return;
        if (entry.isIntersecting) {
          links.forEach((l) => l.classList.remove("is-active"));
          link.classList.add("is-active");
          const parentChildren = link.closest(".nav-tree__children");
          if (parentChildren && !parentChildren.classList.contains("is-open")) {
            parentChildren.classList.add("is-open");
            const parent = parentChildren.closest(".nav-tree__parent");
            if (parent) parent.classList.add("is-open");
          }
        }
      });
    }, { rootMargin: "-10% 0px -70% 0px", threshold: 0.01 });

    map.forEach((_, target) => io.observe(target));
  }

  function boot() {
    safe(initTree, "initTree");
    safe(initSidebarDrawer, "initSidebarDrawer");
    safe(initThemeToggle, "initThemeToggle");
    safe(initReveal, "initReveal");
    safe(initScrollspy, "initScrollspy");
    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
