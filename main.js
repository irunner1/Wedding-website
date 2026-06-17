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

(function () {
  "use strict";

  var form = document.getElementById("guest-form-form");
  if (!form) {
    return;
  }

  var config = window.GUEST_FORM_CONFIG || {};
  var submitButton = form.querySelector(".guest-form__submit");
  var alcoholOtherWrap = document.getElementById("guest-form-alcohol-other");
  var alcoholOtherInput = form.querySelector('input[name="alcohol-other"]');
  var status = document.getElementById("guest-form-status");

  function setStatus(message, isError) {
    if (!status) {
      return;
    }

    status.textContent = message;
    status.hidden = !message;
    status.classList.toggle("guest-form__status--error", Boolean(isError));
  }

  function isConfigured() {
    return (
      config.formAction &&
      config.formAction.indexOf("YOUR_FORM_ID") === -1 &&
      config.fields &&
      config.fields.transfer &&
      config.fields.transfer.indexOf("entry.") === 0 &&
      config.fields.alcohol &&
      config.fields.alcohol.indexOf("entry.") === 0
    );
  }

  function toggleAlcoholOther() {
    var selected = form.querySelector('input[name="alcohol"]:checked');
    var showOther = selected && selected.value === "other";

    if (alcoholOtherWrap) {
      alcoholOtherWrap.hidden = !showOther;
    }

    if (alcoholOtherInput) {
      alcoholOtherInput.required = showOther;
      if (!showOther) {
        alcoholOtherInput.value = "";
      }
    }
  }

  function setSubmitting(isSubmitting) {
    if (!submitButton) {
      return;
    }

    submitButton.disabled = isSubmitting;
    submitButton.textContent = isSubmitting ? "Отправляем..." : "Отправить";
  }

  function buildPayload(transferValue, alcoholValue, alcoholOtherValue) {
    var body = new URLSearchParams();
    var transferLabel = config.labels.transfer[transferValue];
    var alcoholLabel = config.labels.alcohol[alcoholValue];

    body.append(config.fields.transfer, transferLabel);
    body.append(config.fields.alcohol, alcoholLabel);

    if (config.fields.alcoholOther && alcoholOtherValue) {
      body.append(config.fields.alcoholOther, alcoholOtherValue);
    }

    return body;
  }

  form.addEventListener("change", function (event) {
    if (event.target && event.target.name === "alcohol") {
      toggleAlcoholOther();
      setStatus("", false);
    }
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    setStatus("", false);

    if (!isConfigured()) {
      setStatus(
        "Форма ещё не подключена к Google Forms. См. GOOGLE_FORMS_SETUP.md.",
        true
      );
      return;
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    var transfer = form.querySelector('input[name="transfer"]:checked');
    var alcohol = form.querySelector('input[name="alcohol"]:checked');
    var alcoholOtherText = alcoholOtherInput ? alcoholOtherInput.value.trim() : "";

    if (alcohol && alcohol.value === "other" && !alcoholOtherText) {
      setStatus("Пожалуйста, уточните напиток.", true);
      alcoholOtherInput.focus();
      return;
    }

    setSubmitting(true);

    fetch(config.formAction, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: buildPayload(transfer.value, alcohol.value, alcoholOtherText).toString(),
    })
      .then(function () {
        setStatus("Спасибо! Ваши ответы отправлены.", false);
        form.reset();
        toggleAlcoholOther();
      })
      .catch(function () {
        setStatus("Не удалось отправить. Попробуйте ещё раз.", true);
      })
      .finally(function () {
        setSubmitting(false);
      });
  });

  toggleAlcoholOther();
})();
