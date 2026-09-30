/* ================================================================
   INTERACTIVE GRID BACKGROUND
   Adds a subtle, non-interactive square-grid canvas behind the dark
   surfaces listed in SURFACES: a single continuous surface spanning
   #showreel + #longform + #reels (via the #gridSurface wrapper in
   index.html, so the grid reads as one unbroken surface with no seam
   at the section boundaries), and a separate #contact surface.
   Follows the same conventions as the Hero's #pixelCanvas IIFE in
   script.js (tile-based draw loop, IntersectionObserver start/stop,
   prefers-reduced-motion check) but is otherwise fully independent of it —
   the Hero keeps its own canvas/background untouched.

   The canvas is purely decorative: it is `position:absolute; inset:0` (it
   never changes layout/size) and `pointer-events:none` (CSS, see
   style.css), so nothing here can ever intercept a click, tap, or scroll —
   the Reels carousel's native touch-scroll and every button/link/card in
   these sections behave exactly as before.
   ================================================================ */
(function(){
  'use strict';

  // Each entry's `id` is the element the canvas is sized to and painted
  // into (for the first entry, #gridSurface — a wrapper spanning Showreel
  // through Reels — so one canvas covers all three with no per-section
  // restart of the grid origin, seed, or animation clock). `seed` namespaces
  // the deterministic random pattern.
  var SURFACES = [
    {id: 'gridSurface', seed: 'grid-surface'},
    {id: 'contact', seed: 'contact'}
  ];
  var MOBILE_BP = 640;
  var DPR_CAP = 1.5;

  // Tuning (calm/quiet background texture, not a visible effect):
  var GRID_LINE_ALPHA = 0.08;         // 6-10% dark grey grid lines
  var IDLE_ALPHA_MIN = 0.03;          // idle seeded orange cells: 3-7%
  var IDLE_ALPHA_MAX = 0.07;
  var ACTIVE_ALPHA_MAX = 0.16;        // closest cell to pointer: ~14-18%
  var INTERACT_RADIUS = 75;           // px, within the 60-90px range
  var FADE_IN_K = 0.08;               // per-frame lerp factor, ~600-700ms to settle
  var FADE_OUT_K = 0.04;              // per-frame lerp factor, ~1200-1400ms to settle
  var LIFT_EPSILON = 0.004;

  var reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var isTouch = window.matchMedia('(hover: none)').matches;

  /* ---- deterministic seeded pattern -----------------------------------
     A tiny string hash (FNV-1a) feeds a tiny seeded PRNG (mulberry32) so the
     sparse orange cells are a pure function of (surface seed, cell x, cell y)
     — the same cells every reload/resize, never reshuffled at random. */
  function hashSeed(str){
    var h = 2166136261;
    for(var i = 0; i < str.length; i++){
      h ^= str.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) | 0;
    }
    return h >>> 0;
  }
  function mulberry32(seed){
    return function(){
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function cellRandom(seedNs, cx, cy){
    return mulberry32(hashSeed(seedNs + ':' + cx + ',' + cy))();
  }

  function isMobileWidth(){
    return window.matchMedia('(max-width:' + MOBILE_BP + 'px)').matches;
  }

  /* ---- one coordinated rAF loop for every surface's canvas -------------- */
  var controllers = [];
  var rafId = null;
  var loopRunning = false;

  function tick(){
    rafId = null;
    if(document.visibilityState === 'hidden'){ loopRunning = false; return; }
    var anyVisible = false;
    for(var i = 0; i < controllers.length; i++){
      var c = controllers[i];
      if(c.visible){ anyVisible = true; c.update(); }
    }
    if(anyVisible){
      rafId = requestAnimationFrame(tick);
    } else {
      loopRunning = false;
    }
  }
  function ensureLoop(){
    if(loopRunning || reduceMotionQuery.matches) return;
    loopRunning = true;
    rafId = requestAnimationFrame(tick);
  }
  document.addEventListener('visibilitychange', function(){
    if(document.visibilityState === 'visible') ensureLoop();
  });

  /* ---- resize: rAF-debounced, never raw high-frequency resize events --- */
  var resizeScheduled = false;
  function onResize(){
    if(resizeScheduled) return;
    resizeScheduled = true;
    requestAnimationFrame(function(){
      resizeScheduled = false;
      for(var i = 0; i < controllers.length; i++) controllers[i].build();
    });
  }
  window.addEventListener('resize', onResize);

  // No scroll listener: per the current spec the grid must never animate or
  // shift during normal page scrolling (the static layer is simply redrawn
  // as-is by the rAF loop while visible; scroll position never feeds it).

  function createController(surfaceEl, seedNs){
    var reduced = reduceMotionQuery.matches;
    var canvas = document.createElement('canvas');
    canvas.className = 'interactive-grid-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    surfaceEl.insertBefore(canvas, surfaceEl.firstChild);
    if(!canvas.getContext) return null; // CSS-only fallback grid stays visible
    var ctx = canvas.getContext('2d');
    if(!ctx) return null;

    var staticLayer = document.createElement('canvas');
    var staticCtx = staticLayer.getContext('2d');

    var cssW = 0, cssH = 0, dpr = 1, cellSize = 37, cols = 0, rows = 0;
    var seedCells = [];        // sparse deterministic faint-orange cells
    var liveCells = new Map(); // key -> {lift} for cells near the pointer, fading
    var mouse = {x: -9999, y: -9999};
    var frameCount = 0;

    function build(){
      var rect = surfaceEl.getBoundingClientRect();
      cssW = Math.max(1, Math.round(rect.width));
      cssH = Math.max(1, Math.round(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      cellSize = isMobileWidth() ? 29 : 37;

      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.width = cssW + 'px';
      canvas.style.height = cssH + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      staticLayer.width = canvas.width;
      staticLayer.height = canvas.height;
      staticCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      cols = Math.ceil(cssW / cellSize) + 1;
      rows = Math.ceil(cssH / cellSize) + 1;

      // Because this canvas spans the full continuous surface (all of
      // Showreel+Long Form+Reels for the main surface), the grid origin,
      // row/col indices and seeded random draw below are computed exactly
      // once across the whole height — there is no per-section reset, so
      // lines and orange cells never jump or duplicate at a boundary.
      seedCells = [];
      for(var y = 0; y < rows; y++){
        for(var x = 0; x < cols; x++){
          var r = cellRandom(seedNs, x, y);
          if(r < 0.055){
            seedCells.push({x: x, y: y, alpha: IDLE_ALPHA_MIN + (r / 0.055) * (IDLE_ALPHA_MAX - IDLE_ALPHA_MIN)});
          }
        }
      }
      drawStaticLayer();
      renderStaticOnly(); // keep something correct on screen even if the loop is paused
    }

    function drawStaticLayer(){
      staticCtx.clearRect(0, 0, cssW, cssH);
      staticCtx.strokeStyle = 'rgba(69,79,87,' + GRID_LINE_ALPHA + ')';
      staticCtx.lineWidth = 1;
      staticCtx.beginPath();
      for(var x = 0; x <= cols; x++){
        var px = Math.round(x * cellSize) + 0.5;
        staticCtx.moveTo(px, 0);
        staticCtx.lineTo(px, cssH);
      }
      for(var y = 0; y <= rows; y++){
        var py = Math.round(y * cellSize) + 0.5;
        staticCtx.moveTo(0, py);
        staticCtx.lineTo(cssW, py);
      }
      staticCtx.stroke();

      staticCtx.fillStyle = '#F36B36';
      for(var i = 0; i < seedCells.length; i++){
        var c = seedCells[i];
        staticCtx.globalAlpha = c.alpha;
        staticCtx.fillRect(c.x * cellSize, c.y * cellSize, cellSize, cellSize);
      }
      staticCtx.globalAlpha = 1;
    }

    function renderStaticOnly(){
      ctx.clearRect(0, 0, cssW, cssH);
      ctx.drawImage(staticLayer, 0, 0, cssW, cssH);
    }

    // Pointer-follow highlight (desktop only, and only outside reduced-motion).
    function onPointerMove(e){
      var r = surfaceEl.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    }
    function onPointerLeave(){ mouse.x = -9999; mouse.y = -9999; }

    // Optional, minimal tap reaction (mobile): a single tap sets the pointer
    // point once, then it is cleared almost immediately so the cells simply
    // ease back to idle over the slow fade-out — no continuous touch-follow,
    // and touchmove is intentionally NOT listened to, so dragging a finger
    // (scrolling, or working the Reels carousel) never feeds this and never
    // does any per-frame work during that gesture.
    var touchDecayTimer = null;
    function onTouchStart(e){
      if(!e.touches || !e.touches.length) return;
      var t = e.touches[0];
      var r = surfaceEl.getBoundingClientRect();
      mouse.x = t.clientX - r.left;
      mouse.y = t.clientY - r.top;
      if(touchDecayTimer) clearTimeout(touchDecayTimer);
      touchDecayTimer = setTimeout(function(){ mouse.x = -9999; mouse.y = -9999; }, 120);
    }

    function update(){
      frameCount++;
      if(isTouch && (frameCount % 2 !== 0)) return; // calmer/lower frame rate on touch

      var radius = INTERACT_RADIUS;
      var radiusSq = radius * radius;

      // Only touch cells that could plausibly be near the pointer/touch point,
      // rather than scanning the whole grid every frame. This also keeps the
      // reaction confined to roughly the nearest 1-2 rings around the pointer.
      if(mouse.x > -1000){
        var minX = Math.max(0, Math.floor((mouse.x - radius) / cellSize));
        var maxX = Math.min(cols, Math.ceil((mouse.x + radius) / cellSize));
        var minY = Math.max(0, Math.floor((mouse.y - radius) / cellSize));
        var maxY = Math.min(rows, Math.ceil((mouse.y + radius) / cellSize));
        for(var y = minY; y <= maxY; y++){
          for(var x = minX; x <= maxX; x++){
            var cx = x * cellSize + cellSize / 2;
            var cy = y * cellSize + cellSize / 2;
            var dx = cx - mouse.x, dy = cy - mouse.y;
            var distSq = dx * dx + dy * dy;
            if(distSq < radiusSq){
              var key = x + ',' + y;
              var cell = liveCells.get(key);
              if(!cell){ cell = {lift: 0}; liveCells.set(key, cell); }
              cell.target = 1 - Math.sqrt(distSq) / radius;
            }
          }
        }
      }

      ctx.clearRect(0, 0, cssW, cssH);
      ctx.drawImage(staticLayer, 0, 0, cssW, cssH);

      var toDelete = [];
      liveCells.forEach(function(cell, key){
        var target = cell.target || 0;
        cell.target = 0; // consumed; re-set above next frame if still in range
        // Smooth, never-instant interpolation: a faster lerp while rising
        // toward the target (fade-in, ~600-700ms to settle) and a slower one
        // while easing back down (fade-out, ~1200-1400ms) — cells emerge
        // gently and settle back slowly, never blink or jump.
        var k = target > cell.lift ? FADE_IN_K : FADE_OUT_K;
        cell.lift += (target - cell.lift) * k;
        if(cell.lift < LIFT_EPSILON && target === 0){
          toDelete.push(key);
          return;
        }
        var parts = key.split(',');
        var gx = +parts[0], gy = +parts[1];
        // No scale/pulse/flash: cells only fade opacity in place, fixed size.
        ctx.globalAlpha = Math.max(0, Math.min(ACTIVE_ALPHA_MAX, ACTIVE_ALPHA_MAX * cell.lift));
        ctx.fillStyle = '#F36B36';
        ctx.fillRect(gx * cellSize, gy * cellSize, cellSize, cellSize);
      });
      ctx.globalAlpha = 1;
      for(var i = 0; i < toDelete.length; i++) liveCells.delete(toDelete[i]);
    }

    var controller = {
      visible: false,
      build: build,
      update: update
    };

    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        controller.visible = entry.isIntersecting;
        if(entry.isIntersecting){
          if(reduced){ renderStaticOnly(); }
          else { ensureLoop(); }
        }
      });
    }, {threshold: 0});
    io.observe(surfaceEl);

    build();
    surfaceEl.classList.add('grid-js-ready');

    if(reduced){
      // Static render only: no pointer-follow, no scale pulsing, no fades —
      // idle opacities only, fully static.
      renderStaticOnly();
    } else if(!isTouch){
      surfaceEl.addEventListener('mousemove', onPointerMove);
      surfaceEl.addEventListener('mouseleave', onPointerLeave);
    } else {
      // Touch: tap-only, static otherwise (see onTouchStart comment above).
      surfaceEl.addEventListener('touchstart', onTouchStart, {passive: true});
    }

    return controller;
  }

  function init(){
    SURFACES.forEach(function(s){
      var surfaceEl = document.getElementById(s.id);
      if(!surfaceEl) return;
      surfaceEl.classList.add('interactive-grid-section');
      var c = createController(surfaceEl, s.seed);
      if(c) controllers.push(c);
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
