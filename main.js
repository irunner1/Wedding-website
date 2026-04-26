(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reveals = document.querySelectorAll(".reveal");

  function markVisible() {
    reveals.forEach(function (el) {
      el.classList.add("reveal--visible");
    });
  }

  if (reduceMotion.matches) {
    root.classList.add("js-ready");
    markVisible();
    return;
  }

  if (typeof IntersectionObserver === "undefined") {
    root.classList.add("js-ready");
    markVisible();
    return;
  }

  var observer = new IntersectionObserver(
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
      rootMargin: "0px 0px -5% 0px",
      threshold: 0.1,
    }
  );

  root.classList.add("js-ready");

  reveals.forEach(function (el) {
    var r = el.getBoundingClientRect();
    var vh = window.innerHeight;
    if (r.top < vh * 0.92 && r.bottom > 0) {
      el.classList.add("reveal--visible");
    } else {
      observer.observe(el);
    }
  });
})();
