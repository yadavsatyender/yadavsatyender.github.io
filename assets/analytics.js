/* analytics.js: cookie-free, anonymous audience measurement for this site.
 * Sends events to a private Cloudflare Worker (see site-analytics project). Stores nothing in the
 * browser, except an opt-out flag if the visitor chooses to opt out on the privacy page.
 * Event model after Piano Analytics: page display, click.navigation, click.action, click.download, click.exit.
 * Never sends text typed by visitors. Respects Do Not Track / Global Privacy Control (counted without any code).
 */
(function () {
  "use strict";
  var ENDPOINT = "https://yadavsatyender-analytics.yadavsatyender.workers.dev/t"; // <- deployed Worker URL + /t
  var HASH_ROUTES = ["/blog.html"]; // pages where #something is a separate page (blog posts)
  var OPT_KEY = "analytics-optout";

  // Opt-out controls for the privacy page; work even when measurement is off.
  function optedOut() { try { return localStorage.getItem(OPT_KEY) === "1"; } catch (e) { return false; } }
  window.siteAnalytics = {
    isOptedOut: optedOut,
    optOut: function () { try { localStorage.setItem(OPT_KEY, "1"); } catch (e) {} },
    optIn: function () { try { localStorage.removeItem(OPT_KEY); } catch (e) {} }
  };
  window.siteTrack = function () {};

  var c = window.crypto || window.msCrypto;
  if (/YOUR-WORKER/.test(ENDPOINT) || optedOut() || navigator.webdriver) return;
  if (!c || !c.getRandomValues || !window.JSON || !window.URLSearchParams || !window.fetch) return;

  function id() { var b = new Uint8Array(12); c.getRandomValues(b); return "pv-" + Array.prototype.map.call(b, function (x) { return ("0" + x.toString(16)).slice(-2); }).join(""); }
  function routePath() {
    var p = location.pathname.replace(/\/index\.html$/, "/") || "/";
    if (HASH_ROUTES.indexOf(p) >= 0 && location.hash.length > 1) p += "#" + location.hash.slice(1).replace(/[^A-Za-z0-9_-]/g, "").slice(0, 80);
    return p;
  }
  function vwClass() { var w = window.innerWidth || 1024; return w < 700 ? "small" : w < 1100 ? "medium" : "large"; }

  var pv = id(), path = routePath(), queue = [], timer = null;
  function flush(beacon) {
    clearTimeout(timer); timer = null;
    if (optedOut()) { queue.length = 0; return; } // visitor just opted out on the privacy page
    while (queue.length) {
      var body = JSON.stringify({ pv: queue[0].pv, events: takeBatch() });
      try {
        if (beacon && navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "text/plain" }))) continue;
        fetch(ENDPOINT, { method: "POST", body: body, keepalive: true, credentials: "omit", headers: { "Content-Type": "text/plain" } }).catch(function () {});
      } catch (e) {}
    }
  }
  // A batch holds events of one page view only (the Worker files each batch under one page view id).
  function takeBatch() {
    var first = queue[0].pv, out = [];
    while (queue.length && queue[0].pv === first && out.length < 40) { var e = queue.shift(); delete e.pv; out.push(e); }
    return out;
  }
  function push(e) {
    e.pv = pv; e.p = e.p || path;
    queue.push(e);
    if (queue.length >= 20) flush(false);
    else if (!timer) timer = setTimeout(function () { flush(false); }, 3000);
  }
  function track(t, n, d, v) {
    push({ t: t, n: n == null ? undefined : String(n).slice(0, 200), d: d == null ? undefined : String(d).slice(0, 200), v: v == null ? undefined : v });
  }
  window.siteTrack = track; // siteTrack("action", "Feature", "choice") from page code

  // ---------- page display
  var q = new URLSearchParams(location.search);
  var utm = { us: q.get("utm_source") || q.get("s") || undefined, um: q.get("utm_medium") || undefined, uc: q.get("utm_campaign") || undefined };
  function sendView(ref) {
    push({ t: "view", ti: document.title.slice(0, 200), ref: ref, l: navigator.language || "", vw: vwClass(), us: utm.us, um: utm.um, uc: utm.uc });
    utm = {};
    flush(false);
  }
  var firstRef = "";
  try { firstRef = document.referrer ? new URL(document.referrer).origin + "/" : ""; } catch (e) {}
  sendView(firstRef);
  // Remove campaign tags from the address bar so a shared link does not repeat the campaign.
  if (q.has("utm_source") || q.has("utm_medium") || q.has("utm_campaign") || q.has("s")) {
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "s"].forEach(function (k) { q.delete(k); });
    try { history.replaceState(history.state, "", location.pathname + (q.toString() ? "?" + q : "") + location.hash); } catch (e) {}
  }

  // ---------- engaged time and scroll depth
  var engaged = 0, lastActive = Date.now(), lastTick = Date.now(), maxScroll = 0, left = false;
  ["mousemove", "keydown", "scroll", "touchstart", "click", "pointerdown"].forEach(function (ev) {
    addEventListener(ev, function () { lastActive = Date.now(); }, { passive: true, capture: true });
  });
  function active() { return document.visibilityState === "visible" && Date.now() - lastActive < 30000; }
  function measureScroll() {
    var h = document.documentElement.scrollHeight - innerHeight;
    if (h > 0) maxScroll = Math.max(maxScroll, Math.min(100, Math.round((scrollY / h) * 100)));
    else maxScroll = 100;
    measureRead();
  }
  addEventListener("scroll", measureScroll, { passive: true });

  // ---------- sections: seen once, plus time on screen while the visitor is active
  var secSeen = {}, secTime = {}, secVisible = {}, io = null;
  function secName(el) { return el.getAttribute("data-track-section"); }
  function observeSections() {
    if (!("IntersectionObserver" in window)) return;
    if (io) io.disconnect();
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var name = secName(en.target), vis = en.intersectionRect.height;
        var need = Math.min(0.5 * en.boundingClientRect.height, 0.5 * innerHeight); // works for tall sections too
        var on = en.isIntersecting && vis >= need && vis > 0;
        secVisible[name] = on;
        if (on && !secSeen[name]) { secSeen[name] = true; track("section", name); }
      });
    }, { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] });
    document.querySelectorAll("[data-track-section]").forEach(function (el) { io.observe(el); });
  }

  // ---------- blog post read-through: element with data-track-read="slug"
  var readPct = 0, readEl = null;
  function findRead() { readEl = document.querySelector("[data-track-read]"); readPct = 0; measureRead(); }
  function measureRead() {
    if (!readEl || !readEl.offsetParent) return;
    var r = readEl.getBoundingClientRect();
    if (r.height > 0) readPct = Math.max(readPct, Math.min(100, Math.round(((innerHeight - r.top) / r.height) * 100)));
  }
  function readEvents() {
    if (!readEl || readPct <= 0) return;
    var words = (readEl.textContent || "").split(/\s+/).length, need = Math.max(15, 0.3 * (words / 220) * 60);
    track("read", readEl.getAttribute("data-track-read"), readPct >= 90 && engaged >= need ? "complete" : "partial", readPct);
  }

  setInterval(function () {
    var now = Date.now(), dt = (now - lastTick) / 1000;
    if (active()) {
      engaged += dt;
      for (var k in secVisible) if (secVisible[k]) secTime[k] = (secTime[k] || 0) + dt;
    }
    lastTick = now;
  }, 1000);

  function leave() {
    if (left) return; left = true;
    measureScroll();
    for (var k in secTime) if (secTime[k] >= 1) track("dwell", k, null, Math.round(secTime[k]));
    readEvents();
    push({ t: "leave", v: Math.round(engaged), s: maxScroll });
    flush(true);
  }
  addEventListener("pagehide", leave);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") leave();
    else left = false; // came back: a later leave sends the running totals again (the Worker keeps the largest)
  });

  // ---------- virtual page views for blog posts (#slug)
  addEventListener("hashchange", function () {
    var next = routePath();
    if (next === path) return;
    leave();
    pv = id(); path = next; engaged = 0; maxScroll = 0; left = false; lastActive = Date.now();
    secSeen = {}; secTime = {}; secVisible = {};
    // Wait for the page code to render the post, so the view carries the post's title.
    setTimeout(function () { sendView(location.origin + "/"); observeSections(); findRead(); }, 700);
  });

  // ---------- clicks: feature buttons, files, email, other sites, internal navigation
  var FILE_RE = /\.(pdf|docx?|pptx?|xlsx?|csv|zip|json|geojson|nc|tif|tiff|kmz|png|jpe?g)(\?|#|$)/i;
  document.addEventListener("click", function (e) {
    var el = e.target && e.target.closest ? e.target : null;
    if (!el) return;
    var x = el.closest("[data-track]");
    if (x) return track("action", x.getAttribute("data-track"), x.getAttribute("data-track-detail"));
    var g = el.closest("button, [role=tab]");
    var grp = g && g.closest("[data-track-group]");
    if (grp) return track("action", grp.getAttribute("data-track-group"), (g.getAttribute("data-track-detail") || g.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60));
    var a = el.closest("a[href]");
    if (!a) return;
    var href = a.getAttribute("href") || "";
    if (/^mailto:/i.test(href)) return track("contact", "email");
    if (/^tel:/i.test(href)) return track("contact", "phone");
    var url; try { url = new URL(a.href, location.href); } catch (err) { return; }
    if (a.hasAttribute("download") || (FILE_RE.test(url.pathname) && !/\.html?$/i.test(url.pathname))) return track("download", url.pathname.split("/").pop() || url.href);
    if (!/^https?:$/.test(url.protocol)) return;
    if (url.host !== location.host) return track("exit", url.hostname.replace(/^www\./, "") + url.pathname.replace(/\/$/, ""));
    var target = (url.pathname.replace(/\/index\.html$/, "/") || "/") + (url.hash || "");
    if (target !== path) track("nav", target);
  }, true);

  // ---------- forms: <form data-track-form="Contact"> counts a submit; no field content is sent
  document.addEventListener("submit", function (e) {
    var f = e.target && e.target.closest ? e.target.closest("form[data-track-form]") : null;
    if (f) { track("contact", "form: " + f.getAttribute("data-track-form")); flush(true); }
  }, true);

  // ---------- JavaScript errors (message and file:line only, max 5 per page view)
  var errs = 0;
  function err(msg, src) {
    if (errs++ >= 5) return;
    track("error", String(msg || "Error").replace(/https?:\/\/\S+/g, "[url]").slice(0, 120), src);
  }
  addEventListener("error", function (e) {
    if (e && e.message) err(e.message, ((e.filename || "").split("/").pop() || "inline") + ":" + (e.lineno || 0));
  });
  addEventListener("unhandledrejection", function (e) { err(e && e.reason && (e.reason.message || e.reason), "promise"); });

  // ---------- Core Web Vitals (Google's web-vitals library, served from this site)
  function vitals() {
    var s = document.createElement("script");
    var me = document.querySelector('script[src*="analytics.js"]');
    s.src = me ? me.src.replace(/analytics\.js.*$/, "web-vitals.iife.js") : "assets/web-vitals.iife.js";
    s.async = true;
    s.onload = function () {
      if (!window.webVitals) return;
      var vp = pv, vpath = path; // vitals belong to the first page view
      function send(m) {
        queue.push({ pv: vp, p: vpath, t: "vital", n: m.name, d: m.rating, v: m.name === "CLS" ? Math.round(m.value * 1000) / 1000 : Math.round(m.value) });
        if (document.visibilityState === "hidden") flush(true);
        else if (!timer) timer = setTimeout(function () { flush(false); }, 3000);
      }
      ["onLCP", "onINP", "onCLS", "onFCP", "onTTFB"].forEach(function (f) { if (webVitals[f]) webVitals[f](send); });
    };
    document.head.appendChild(s);
  }

  function start() { observeSections(); findRead(); measureScroll(); vitals(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
