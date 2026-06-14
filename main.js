(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reveals = document.querySelectorAll(".reveal");
  var observer = null;

  function markVisible() {
    reveals.forEach(function (el) {
      el.classList.add("reveal--visible");
    });
  }

  function viewportHeight() {
    return window.innerHeight || document.documentElement.clientHeight || 0;
  }

  function isInView(el) {
    var rect = el.getBoundingClientRect();
    var vh = viewportHeight();
    return rect.top < vh * 0.98 && rect.bottom > vh * 0.02;
  }

  function revealInView() {
    reveals.forEach(function (el) {
      if (!el.classList.contains("reveal--visible") && isInView(el)) {
        el.classList.add("reveal--visible");
        if (observer) {
          observer.unobserve(el);
        }
      }
    });
  }

  function observeHidden() {
    if (!observer) {
      return;
    }

    reveals.forEach(function (el) {
      if (!el.classList.contains("reveal--visible")) {
        observer.observe(el);
      }
    });
  }

  function init() {
    root.classList.add("js-ready");
    revealInView();
    observeHidden();
  }

  if (reduceMotion.matches) {
    markVisible();
    root.classList.add("js-ready");
    return;
  }

  if (typeof IntersectionObserver === "undefined") {
    markVisible();
    root.classList.add("js-ready");
    return;
  }

  observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal--visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      root: null,
      rootMargin: "0px 0px 0px 0px",
      threshold: 0,
    }
  );

  init();

  window.addEventListener("scroll", revealInView, { passive: true });
  window.addEventListener("resize", revealInView, { passive: true });
  window.addEventListener("orientationchange", function () {
    window.setTimeout(revealInView, 150);
  });

  window.addEventListener("pageshow", function (event) {
    if (event.persisted) {
      revealInView();
      observeHidden();
    }
  });

  if (document.readyState === "complete") {
    window.requestAnimationFrame(revealInView);
  } else {
    window.addEventListener(
      "load",
      function () {
        window.requestAnimationFrame(function () {
          revealInView();
          observeHidden();
        });
      },
      { once: true }
    );
  }

  window.setTimeout(revealInView, 250);
})();
