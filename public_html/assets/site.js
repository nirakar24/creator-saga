(function () {
  "use strict";
  var C = window.CS_CONFIG || {};
  var doc = document;
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };
  var reducedMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function store(kind, key, val) {
    try {
      var s = kind === "local" ? localStorage : sessionStorage;
      if (val === undefined) return s.getItem(key);
      s.setItem(key, val);
    } catch (e) { return null; }
  }

  /* ---------- attribution: last non-empty UTM set wins for the session ---------- */

  var UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  var attr = {};
  try { attr = JSON.parse(store("session", "cs_attr") || "{}"); } catch (e) { attr = {}; }
  var qs = new URLSearchParams(location.search);
  if (UTM.some(function (k) { return qs.get(k); })) {
    attr = { landing_page: location.pathname };
    UTM.forEach(function (k) { if (qs.get(k)) attr[k] = qs.get(k).slice(0, 150); });
    store("session", "cs_attr", JSON.stringify(attr));
  }
  function withAttr(url) {
    try {
      var u = new URL(url, location.href);
      UTM.forEach(function (k) { if (attr[k]) u.searchParams.set(k, attr[k]); });
      return u.toString();
    } catch (e) { return url; }
  }

  /* ---------- analytics (consent-gated) ---------- */

  window.dataLayer = window.dataLayer || [];
  var analyticsConfigured = !!(C.ga4Id || C.metaPixelId);
  var loaded = false;

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = doc.createElement("script");
      s.src = src; s.async = true; s.onload = resolve; s.onerror = reject;
      doc.head.appendChild(s);
    });
  }

  function loadAnalytics() {
    if (loaded || !analyticsConfigured) return;
    loaded = true;
    if (C.ga4Id) {
      window.gtag = function () { dataLayer.push(arguments); };
      gtag("js", new Date());
      gtag("config", C.ga4Id);
      loadScript("https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(C.ga4Id)).catch(function () {});
    }
    if (C.metaPixelId) {
      /* Meta Pixel base code */
      !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, doc, "script", "https://connect.facebook.net/en_US/fbevents.js");
      fbq("init", C.metaPixelId);
      fbq("track", "PageView");
    }
    pending.forEach(function (e) { send(e[0], e[1]); });
    pending = [];
  }

  var pending = [];
  var META_STANDARD = { booking_completed: "Schedule", inquiry_submitted: "Lead" };

  function send(name, params) {
    if (window.gtag && C.ga4Id) gtag("event", name, params);
    if (window.fbq && C.metaPixelId) {
      var opts = params.event_id ? { eventID: params.event_id } : undefined;
      if (META_STANDARD[name]) fbq("track", META_STANDARD[name], params, opts);
      else fbq("trackCustom", name, params, opts);
    }
  }

  // Never pass names, emails, or free text here.
  function track(name, params) {
    params = Object.assign({ page_path: location.pathname }, attr, params || {});
    delete params.landing_page;
    dataLayer.push(Object.assign({ event: name }, params));
    if (loaded) send(name, params); else if (store("local", "cs_consent") !== "denied") pending.push([name, params]);
  }
  window.csTrack = track;

  function setConsent(v) {
    store("local", "cs_consent", v);
    var b = $("#consent"); if (b) b.hidden = true;
    if (v === "granted") loadAnalytics(); else pending = [];
  }

  function showConsent() {
    var b = $("#consent");
    if (!b) {
      b = doc.createElement("div");
      b.id = "consent"; b.className = "consent";
      b.setAttribute("role", "region"); b.setAttribute("aria-label", "Cookie preferences");
      b.innerHTML = '<p>We use analytics and advertising cookies to understand which pages help visitors and to measure our ads. They only load if you accept. <a class="link" href="/privacy-policy/">Privacy policy</a></p>' +
        '<div class="btn-row"><button type="button" class="btn btn-primary" data-consent="granted">Accept</button><button type="button" class="btn btn-ghost" data-consent="denied">Decline</button></div>';
      doc.body.appendChild(b);
      b.addEventListener("click", function (e) { var v = e.target.getAttribute("data-consent"); if (v) setConsent(v); });
    }
    b.hidden = false;
  }

  if (analyticsConfigured) {
    var choice = store("local", "cs_consent");
    if (choice === "granted") loadAnalytics(); else if (!choice) showConsent();
  }
  $$("[data-consent-open]").forEach(function (el) {
    if (!analyticsConfigured) { (el.closest("li") || el).hidden = true; return; }
    el.addEventListener("click", showConsent);
  });

  /* ---------- navigation ---------- */

  var toggle = $(".menu-toggle"), nav = $("#site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); toggle.focus(); }
    });
  }

  /* ---------- reveal on scroll ---------- */

  if ("IntersectionObserver" in window && !reducedMotion) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); ro.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    $$(".reveal").forEach(function (el) { ro.observe(el); });
  } else {
    $$(".reveal").forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- CTA tracking ---------- */

  doc.addEventListener("click", function (e) {
    var a = e.target.closest("[data-cta]");
    if (a) track("primary_cta_click", { cta_location: a.getAttribute("data-cta") });
  });

  /* ---------- portfolio videos: one plays at a time ---------- */

  $$("video[data-clip]").forEach(function (v) {
    v.addEventListener("play", function () {
      $$("video[data-clip]").forEach(function (o) { if (o !== v) o.pause(); });
      if (!v._tracked) { v._tracked = true; track("portfolio_video_play", { clip: v.getAttribute("data-clip") }); }
    });
  });

  // Decorative autoplay loop: respect reduced motion and offer a pause control (WCAG 2.2.2).
  $$("video[data-loop]").forEach(function (v) {
    var btn = v.parentNode.querySelector(".pause-btn");
    function sync() { if (btn) { btn.textContent = v.paused ? "▶" : "❚❚"; btn.setAttribute("aria-label", v.paused ? "Play background video" : "Pause background video"); } }
    if (reducedMotion) v.pause(); else { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    if (btn) btn.addEventListener("click", function () { v.paused ? v.play() : v.pause(); sync(); });
    v.addEventListener("play", sync); v.addEventListener("pause", sync); sync();
  });

  /* ---------- booking ---------- */

  var flowOpened = false;
  function flowOpen(via) { if (!flowOpened) { flowOpened = true; track("booking_flow_open", { booking_via: via }); } }

  $$("[data-booking-link]").forEach(function (a) {
    a.href = withAttr(C.fallbackBookingUrl || a.href);
    a.addEventListener("click", function () { flowOpen("form"); });
  });

  var blocks = $$("[data-booking]");
  if (C.calendlyUrl && blocks.length) {
    blocks.forEach(function (b) {
      $("[data-booking-fallback]", b).hidden = true;
      var embed = $("[data-booking-embed]", b);
      embed.hidden = false;
      embed.classList.add("loading");
      embed.textContent = "Loading the scheduler…";
    });

    var calendlyLoading = null;
    var initBlock = function (b) {
      if (b._init) return; b._init = true;
      calendlyLoading = calendlyLoading || loadScript("https://assets.calendly.com/assets/external/widget.js");
      calendlyLoading.then(function () {
        var embed = $("[data-booking-embed]", b);
        embed.classList.remove("loading"); embed.textContent = "";
        Calendly.initInlineWidget({
          url: C.calendlyUrl + (C.calendlyUrl.indexOf("?") < 0 ? "?" : "&") + "hide_gdpr_banner=1",
          parentElement: embed,
          utm: { utmSource: attr.utm_source, utmMedium: attr.utm_medium, utmCampaign: attr.utm_campaign, utmContent: attr.utm_content, utmTerm: attr.utm_term }
        });
      }).catch(function () {
        // Scheduler failed to load (blocked or offline): fall back to the booking form link.
        var embed = $("[data-booking-embed]", b);
        embed.hidden = true;
        $("[data-booking-fallback]", b).hidden = false;
      });
    };

    if ("IntersectionObserver" in window) {
      var bo = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { initBlock(en.target); bo.unobserve(en.target); } });
      }, { rootMargin: "900px 0px" });
      blocks.forEach(function (b) { bo.observe(b); });
    } else blocks.forEach(initBlock);

    window.addEventListener("message", function (e) {
      if (e.origin !== "https://calendly.com" || !e.data || typeof e.data.event !== "string") return;
      var ev = e.data.event;
      if (ev === "calendly.event_type_viewed" || ev === "calendly.profile_page_viewed") flowOpen("calendly");
      if (ev === "calendly.event_scheduled") {
        // Only a confirmed scheduling message counts as a booking. Shared event_id lets server-side CAPI dedupe later.
        track("booking_completed", { booking_via: "calendly", event_id: "bk_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8) });
        blocks.forEach(function (b) {
          var done = $("[data-booking-done]", b);
          done.hidden = false;
          if (b.getBoundingClientRect().top < innerHeight && b.getBoundingClientRect().bottom > 0) done.focus();
        });
      }
    });
  }

  /* ---------- VSL ---------- */

  var vslSection = $("[data-vsl]");
  if (vslSection && C.vsl && C.vsl.src) {
    var v = doc.createElement("video");
    v.controls = true; v.preload = "none"; v.playsInline = true;
    v.setAttribute("aria-label", "The Creator Saga content production system — video overview");
    if (C.vsl.poster) v.poster = C.vsl.poster;
    v.src = C.vsl.src;
    if (C.vsl.captions) {
      var t = doc.createElement("track");
      t.kind = "captions"; t.srclang = "en"; t.label = "English"; t.src = C.vsl.captions; t.default = true;
      v.appendChild(t);
    }
    $(".video-wide", vslSection).appendChild(v);
    vslSection.hidden = false;
    var marks = [25, 50, 75, 100], hit = {};
    v.addEventListener("play", function () { if (!hit.start) { hit.start = true; track("vsl_start"); } });
    v.addEventListener("timeupdate", function () {
      if (!v.duration) return;
      var pct = (v.currentTime / v.duration) * 100;
      marks.forEach(function (m) { if (pct >= (m === 100 ? 99 : m) && !hit[m]) { hit[m] = true; track("vsl_progress", { percent: m }); } });
    });
  }

  /* ---------- landing page view ---------- */

  if (doc.body.getAttribute("data-page") === "landing") track("landing_page_view");

  /* ---------- inquiry form ---------- */

  var form = $("#inquiry-form");
  if (form && C.inquiryEndpoint) {
    $("#inquiry").hidden = false;
    form.action = C.inquiryEndpoint;
    UTM.concat(["landing_page"]).forEach(function (k) {
      var i = form.elements[k]; if (i && attr[k]) i.value = attr[k];
    });
    var status = $(".form-status", form);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      $$("[required]", form).forEach(function (f) {
        var err = $("#" + f.id + "-error");
        var valid = f.checkValidity();
        f.setAttribute("aria-invalid", String(!valid));
        if (err) err.textContent = valid ? "" : (f.type === "email" && f.value ? "Enter a valid email address." : "This field is required.");
        if (!valid && ok) { ok = false; f.focus(); }
      });
      if (!ok) return;
      var btn = $("button[type=submit]", form);
      btn.disabled = true; status.textContent = "Sending…";
      fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          if (!res.ok) throw new Error(res.j.error || "failed");
          form.reset();
          status.textContent = "Thanks — your message is in. We'll reply by email.";
          track("inquiry_submitted", { business_type: form.dataset.lastType || "" });
        })
        .catch(function (err) {
          status.innerHTML = "";
          status.append(err.message && err.message !== "failed" ? err.message + " " : "Something went wrong sending your message. ");
          var a = doc.createElement("a"); a.className = "link"; a.href = "#book"; a.textContent = "Book a call instead";
          status.append(a);
        })
        .finally(function () { btn.disabled = false; status.focus(); });
    });
    form.addEventListener("change", function (e) { if (e.target.name === "business_type") form.dataset.lastType = e.target.value; });
  }
})();
