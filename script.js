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
