/* Light/dark switch.
   The first choice is made by a small script in each page's <head> (before anything is drawn):
   1. the visitor's own earlier choice, if any (stored only in their browser, key "theme");
   2. otherwise dark if their device is set to dark;
   3. otherwise by their own clock: dark from 19:00 to 06:59, light in the day.
   This file runs the switch button. Nothing here is sent anywhere. */
(function () {
  "use strict";
  var root = document.documentElement, KEY = "theme";
  var BAR = { light: "#F2F5F4", dark: "#132020" }; /* --snow in each mode, for the phone's browser bar */

  function current() { return root.getAttribute("data-theme") === "dark" ? "dark" : "light"; }
  function saved() { try { var t = localStorage.getItem(KEY); return t === "light" || t === "dark" ? t : null; } catch (e) { return null; } }
  function auto() {
    var h = new Date().getHours();
    var deviceDark = window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches;
    return deviceDark || h >= 19 || h < 7 ? "dark" : "light";
  }

  function sync() {
    var t = current(), next = t === "dark" ? "light" : "dark";
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", BAR[t]);
    document.querySelectorAll(".theme-toggle").forEach(function (b) {
      b.setAttribute("aria-label", "Switch to " + next + " mode");
      b.title = "Switch to " + next + " mode";
    });
  }

  function apply(t, fade) {
    if (fade && !(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)) {
      root.classList.add("theme-fade");
      clearTimeout(apply.timer);
      apply.timer = setTimeout(function () { root.classList.remove("theme-fade"); }, 350);
    }
    root.setAttribute("data-theme", t);
    sync();
    document.dispatchEvent(new CustomEvent("themechange", { detail: t }));
  }

  document.addEventListener("click", function (e) {
    var b = e.target && e.target.closest ? e.target.closest(".theme-toggle") : null;
    if (!b) return;
    var t = current() === "dark" ? "light" : "dark";
    try { localStorage.setItem(KEY, t); } catch (err) {}
    apply(t, true);
    if (window.siteTrack) window.siteTrack("action", "Theme switch", t);
  });

  /* If the visitor has not chosen, follow their device when it changes (for example at sunset). */
  if (window.matchMedia) {
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
      if (!saved()) apply(auto(), true);
    });
  }

  sync();
})();
