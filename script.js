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