document.getElementById("year").textContent = new Date().getFullYear();

/* The dot after "Uche" becomes the cursor: it leaves the heading when the
   mouse moves, grows over links, and floats back home when the mouse leaves. */
(function () {
  var cur = document.querySelector(".cursor");
  var anchor = document.querySelector(".dot");
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!fine || !cur || !anchor) { if (cur) cur.remove(); return; }

  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var mx = 0, my = 0, active = false, overLink = false;
  var x = null, y = null, size = null;

  function home() {
    var r = anchor.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, s: r.width };
  }

  window.addEventListener("mousemove", function (e) {
    mx = e.clientX; my = e.clientY;
    overLink = !!(e.target.closest && e.target.closest("a, button"));
    if (!active) { active = true; root.classList.add("live"); }
  });
  root.addEventListener("mouseleave", function () { active = false; });

  function tick() {
    var h = home();
    var tx = active ? mx : h.x;
    var ty = active ? my : h.y;
    var ts = active ? (overLink ? 44 : 18) : h.s;
    if (x === null) { x = h.x; y = h.y; size = h.s; cur.style.opacity = 1; }
    var k = active ? 0.8 : 0.14;
    x += (tx - x) * k;
    y += (ty - y) * k;
    size += (ts - size) * (reduce ? 1 : 0.3);
    cur.style.width = cur.style.height = size + "px";
    cur.style.transform = "translate(" + (x - size / 2) + "px," + (y - size / 2) + "px)";
    if (!active && Math.abs(tx - x) < 1 && Math.abs(ty - y) < 1) root.classList.remove("live");
    requestAnimationFrame(tick);
  }

  root.classList.add("has-cursor");
  tick();
})();

/* Light / dark toggle: a small button fixed at the bottom of the screen.
   The choice is remembered, so every page opens in the mode you picked. */
(function () {
  var root = document.documentElement;
  var meta = document.querySelector('meta[name="color-scheme"]');
  var theme = "dark";
  try { if (localStorage.getItem("uche-theme") === "light") theme = "light"; } catch (e) {}

  var sun = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
            '<circle cx="12" cy="12" r="4"/>' +
            '<path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  var moon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
             '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';

  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "theme-toggle";

  function apply(t) {
    theme = t;
    root.setAttribute("data-theme", t);
    if (meta) meta.setAttribute("content", t);
    btn.innerHTML = (t === "dark" ? sun + "<span>Light mode</span>" : moon + "<span>Dark mode</span>");
    btn.setAttribute("aria-label", t === "dark" ? "Switch to light mode" : "Switch to dark mode");
  }

  btn.addEventListener("click", function () {
    var next = theme === "dark" ? "light" : "dark";
    apply(next);
    try { localStorage.setItem("uche-theme", next); } catch (e) {}
  });

  apply(theme);
  document.body.appendChild(btn);
})();

/* Cursor trail: the cursor draws a line on the page as you move and scroll.
   It lives in page coordinates, so it scrolls with the content and sits behind it.
   It fades away when the mouse leaves the page. */
(function () {
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!fine || reduce) return;

  var root = document.documentElement;
  var canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:-1;pointer-events:none;";
  document.body.appendChild(canvas);
  var ctx = canvas.getContext("2d");

  var points = [];            // path in page coordinates
  var mx = null, my = null;   // last mouse position on screen
  var dirty = false;
  var fadeStart = null;       // set when the mouse leaves the page
  var FADE_MS = 500;
  var MIN_DIST = 4;
  var MAX_POINTS = 4000;

  function resize() {
    var dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dirty = true;
  }

  function addPoint(px, py) {
    var last = points[points.length - 1];
    if (last && Math.abs(px - last[0]) + Math.abs(py - last[1]) < MIN_DIST) return;
    points.push([px, py]);
    if (points.length > MAX_POINTS) points.splice(0, 500);
    dirty = true;
  }

  function stopFade() { fadeStart = null; }

  window.addEventListener("mousemove", function (e) {
    mx = e.clientX; my = e.clientY;
    if (fadeStart !== null) { points = []; stopFade(); }
    addPoint(mx + window.scrollX, my + window.scrollY);
  });

  /* scrolling with a still mouse also draws, because the cursor moves across the page */
  window.addEventListener("scroll", function () {
    if (mx === null) return;
    addPoint(mx + window.scrollX, my + window.scrollY);
  }, { passive: true });

  root.addEventListener("mouseleave", function () {
    if (points.length && fadeStart === null) { fadeStart = performance.now(); dirty = true; }
  });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { points = []; stopFade(); dirty = true; }
  });
  window.addEventListener("resize", resize);

  function draw(now) {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    if (points.length < 2) return;

    var alpha = 0.55;
    if (fadeStart !== null) {
      var t = (now - fadeStart) / FADE_MS;
      if (t >= 1) { points = []; stopFade(); return; }
      alpha *= 1 - t;
      dirty = true; // keep animating until it is gone
    }

    ctx.save();
    ctx.translate(-window.scrollX, -window.scrollY);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = getComputedStyle(root).getPropertyValue("--lilac").trim() || "#c3a6ff";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (var i = 1; i < points.length - 1; i++) {
      var mxp = (points[i][0] + points[i + 1][0]) / 2;
      var myp = (points[i][1] + points[i + 1][1]) / 2;
      ctx.quadraticCurveTo(points[i][0], points[i][1], mxp, myp);
    }
    var end = points[points.length - 1];
    ctx.lineTo(end[0], end[1]);
    ctx.stroke();
    ctx.restore();
  }

  function frame(now) {
    if (dirty) { dirty = false; draw(now); }
    requestAnimationFrame(frame);
  }

  resize();
  requestAnimationFrame(frame);
})();