(function() {
    var fill = document.getElementById('spineFill');
    var dot = document.getElementById('spineDot');
    if (!fill || !dot) return;
    function onScroll() {
      var doc = document.documentElement;
      var scrollTop = window.scrollY || doc.scrollTop;
      var height = doc.scrollHeight - doc.clientHeight;
      var pct = height > 0 ? Math.min(100, Math.max(0, (scrollTop / height) * 100)) : 0;
      fill.style.height = pct + '%';
      dot.style.top = pct + '%';
    }
    document.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
  })();

  // ---- Hero stat counters: count up once when the hero is visible ----
  (function() {
    var counters = document.querySelectorAll('.counter');
    if (!counters.length) return;
    function animateCounter(el) {
      var target = parseFloat(el.getAttribute('data-target'));
      var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
      var start = performance.now();
      var dur = 1300;
      function tick(now) {
        var p = Math.min(1, (now - start) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * eased).toFixed(decimals);
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
    counters.forEach(animateCounter);
  })();

  // ---- Simulated live sensor feed ticker in the hero ----
  (function() {
    var readingEl = document.getElementById('liveReading');
    var syncEl = document.getElementById('liveSync');
    if (!readingEl || !syncEl) return;
    var base = 18.4, secsAgo = 0;
    setInterval(function() {
      secsAgo += 3;
      if (secsAgo >= 60) secsAgo = 0;
      var jitter = (Math.random() - 0.5) * 0.6;
      readingEl.textContent = (base + jitter).toFixed(1) + ' m';
      syncEl.textContent = secsAgo === 0 ? 'synced just now' : 'synced ' + secsAgo + 's ago';
    }, 3000);
  })();

  // ---- Interactive groundwater simulator ----
  (function() {
    var slider = document.getElementById('simSlider');
    var yearEl = document.getElementById('simYear');
    var depthEl = document.getElementById('simDepth');
    var statusEl = document.getElementById('simStatus');
    var statusTextEl = document.getElementById('simStatusText');
    var waterRect = document.getElementById('simWaterRect');
    var marker = document.getElementById('simMarker');
    var simCard = document.getElementById('simCard');
    if (!slider) return;

    var points = [
      { year: 2005, depth: 8 },
      { year: 2010, depth: 12 },
      { year: 2015, depth: 15.5 },
      { year: 2020, depth: 19.5 },
      { year: 2025, depth: 23 }
    ];
    // chart coordinate space: x 40->560 across 2005->2025, y 30->230 across depth 8->23
    function chartX(year) { return 40 + ((year - 2005) / 20) * 520; }
    function chartY(depth) { return 30 + ((depth - 8) / 15) * 200; }

    function depthForYear(year) {
      for (var i = 0; i < points.length - 1; i++) {
        var a = points[i], b = points[i + 1];
        if (year >= a.year && year <= b.year) {
          var t = (year - a.year) / (b.year - a.year);
          return a.depth + t * (b.depth - a.depth);
        }
      }
      return points[points.length - 1].depth;
    }

    function statusForDepth(depth) {
      if (depth < 12) return { text: 'SAFE', color: '#4fd87a', bg: 'rgba(79,216,122,0.14)' };
      if (depth < 19) return { text: 'WATCH', color: '#e8b93a', bg: 'rgba(232,185,58,0.14)' };
      return { text: 'CRITICAL', color: '#e05c4b', bg: 'rgba(224,92,75,0.16)' };
    }

    function update(year) {
      year = Math.round(year);
      var depth = depthForYear(year);
      yearEl.textContent = year;
      depthEl.textContent = depth.toFixed(1) + ' m';

      var st = statusForDepth(depth);
      statusTextEl.textContent = st.text;
      statusEl.style.color = st.color;
      statusEl.style.background = st.bg;

      // well visual: deeper depth => water surface (y) moves further down, less water shown
      var wellY = 120 + ((depth - 8) / 15) * 70;
      waterRect.setAttribute('y', wellY.toFixed(1));
      waterRect.setAttribute('height', (220 - wellY).toFixed(1));

      // chart marker follows the curve
      marker.setAttribute('cx', chartX(year).toFixed(1));
      marker.setAttribute('cy', chartY(depth).toFixed(1));
    }

    slider.addEventListener('input', function() { update(slider.value); });
    update(slider.value);

    // One orchestrated auto-play sweep across the full range when the card first scrolls into view.
    var played = false;
    function autoPlay() {
      if (played) return;
      played = true;
      var startTime = null;
      var from = 2005, to = 2025, dur = 3200;
      function frame(now) {
        if (!startTime) startTime = now;
        var p = Math.min(1, (now - startTime) / dur);
        var eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        var year = from + (to - from) * eased;
        slider.value = year;
        update(year);
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function(entries) {
        entries.forEach(function(e) { if (e.isIntersecting) autoPlay(); });
      }, { threshold: 0.5 });
      io.observe(simCard);
    } else {
      autoPlay();
    }
  })();

  // ---- Scroll reveal ----
  (function() {
    var els = document.querySelectorAll('.reveal, .reveal-stagger');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach(function(el) { el.classList.add('in-view'); });
      return;
    }
    var io = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) {
          e.target.classList.add('in-view');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach(function(el) { io.observe(el); });
  })();

  // ---- Live processing terminal (simulated) ----
  (function() {
    var body = document.getElementById('termBody');
    if (!body) return;
    var wells = ['WB-042', 'WB-017', 'WB-103', 'WB-058', 'WB-091'];
    var clockMin = 4, clockSec = 1;
    function ts() {
      clockSec += Math.floor(Math.random() * 3) + 1;
      if (clockSec >= 60) { clockSec -= 60; clockMin++; }
      return '12:' + String(clockMin).padStart(2, '0') + ':' + String(clockSec).padStart(2, '0');
    }
    function randWell() { return wells[Math.floor(Math.random() * wells.length)]; }
    function randDepth() { return (14 + Math.random() * 10).toFixed(1); }

    function nextLineHTML() {
      var r = Math.random();
      var t = ts(), w = randWell(), d = randDepth();
      if (r < 0.4) {
        return '<span class="t">[' + t + ']</span> sensor <span class="acc">' + w + '</span> → reading: ' + d + 'm';
      } else if (r < 0.65) {
        return '<span class="t">[' + t + ']</span> cloud: forecast model updated <span class="ok">✓</span>';
      } else if (r < 0.82) {
        return '<span class="t">[' + t + ']</span> status <span class="warn">WATCH</span> issued → ' + w + ' (app + SMS)';
      } else if (r < 0.94) {
        return '<span class="t">[' + t + ']</span> status <span class="crit">CRITICAL</span> issued → ' + w + ' (app + SMS)';
      }
      return '<span class="t">[' + t + ']</span> sync: India-WRIS + CGWB block data refreshed';
    }

    var maxLines = 7;
    function addLine() {
      var line = document.createElement('div');
      line.className = 'term-line';
      line.innerHTML = nextLineHTML();
      body.appendChild(line);
      while (body.children.length > maxLines) body.removeChild(body.firstChild);
    }
    for (var i = 0; i < 5; i++) addLine();
    setInterval(addLine, 1700);
  })();

  // ---- Check-your-borewell tool ----
  (function() {
    var slider = document.getElementById('checkSlider');
    var valueEl = document.getElementById('checkValue');
    var msgEl = document.getElementById('checkMsg');
    var iconEl = document.getElementById('checkIcon');
    var resultEl = document.getElementById('checkResult');
    if (!slider) return;

    var typeTimer = null;
    function typeMessage(text, color) {
      if (typeTimer) clearInterval(typeTimer);
      msgEl.innerHTML = '<span class="cur"></span>';
      resultEl.style.borderColor = color;
      var i = 0;
      typeTimer = setInterval(function() {
        i++;
        msgEl.innerHTML = text.slice(0, i) + '<span class="cur"></span>';
        if (i >= text.length) clearInterval(typeTimer);
      }, 14);
    }

    function update() {
      var depth = parseFloat(slider.value);
      valueEl.textContent = depth.toFixed(1);
      var msg, color, icon;
      if (depth < 12) {
        color = '#4fd87a'; icon = '✅';
        msg = 'BhuJal Alert: Your borewell is at ' + depth.toFixed(1) + 'm — SAFE. No action needed this week.';
      } else if (depth < 19) {
        color = '#e8b93a'; icon = '⚠️';
        msg = 'BhuJal Alert: Your borewell is at ' + depth.toFixed(1) + 'm — WATCH. Consider reducing flood irrigation this season.';
      } else {
        color = '#e05c4b'; icon = '🚨';
        msg = 'BhuJal Alert: Your borewell is at ' + depth.toFixed(1) + 'm — CRITICAL. Switch to a low-water crop and avoid new borewells nearby.';
      }
      iconEl.textContent = icon;
      typeMessage(msg, color);
    }
    slider.addEventListener('input', update);
    update();
  })();

  // ---- Live telemetry control panel (district selector, simulated/illustrative) ----
  (function() {
    var sel = document.getElementById('teleSelect');
    if (!sel) return;
    var depthEl = document.getElementById('teleDepth');
    var statusEl = document.getElementById('teleStatus');
    var cropEl = document.getElementById('teleCrop');
    var depthCard = document.getElementById('teleDepthCard');
    var statusCard = document.getElementById('teleStatusCard');
    var cropCard = document.getElementById('teleCropCard');

    // Illustrative figures per district, built from the report's CGWB block-classification
    // pattern — not exact station-level measurements.
    var data = {
      // Punjab — 23 districts. Illustrative figures built from the report's CGWB
      // block-classification pattern, not exact station-level measurements.
      amritsar:      { depth: '16.3 m', status: 'WATCH',    crop: 'Maize / Oilseeds', level: 'watch' },
      barnala:       { depth: '23.4 m', status: 'CRITICAL', crop: 'Cotton / Pulses',  level: 'crit'  },
      bathinda:      { depth: '14.2 m', status: 'WATCH',    crop: 'Cotton / Pulses',  level: 'watch' },
      faridkot:      { depth: '15.8 m', status: 'WATCH',    crop: 'Cotton / Pulses',  level: 'watch' },
      fatehgarhsahib:{ depth: '21.6 m', status: 'CRITICAL', crop: 'Maize / Pulses',   level: 'crit'  },
      fazilka:       { depth: '13.5 m', status: 'WATCH',    crop: 'Cotton / Pulses',  level: 'watch' },
      ferozepur:     { depth: '14.9 m', status: 'WATCH',    crop: 'Cotton / Pulses',  level: 'watch' },
      gurdaspur:     { depth: '9.8 m',  status: 'SAFE',     crop: 'Rice / Vegetables',level: 'safe'  },
      hoshiarpur:    { depth: '9.4 m',  status: 'SAFE',     crop: 'Rice / Vegetables',level: 'safe'  },
      jalandhar:     { depth: '20.9 m', status: 'CRITICAL', crop: 'Maize / Pulses',   level: 'crit'  },
      kapurthala:    { depth: '10.1 m', status: 'SAFE',     crop: 'Rice / Vegetables',level: 'safe'  },
      ludhiana:      { depth: '19.8 m', status: 'CRITICAL', crop: 'Maize / Pulses',   level: 'crit'  },
      malerkotla:    { depth: '22.7 m', status: 'CRITICAL', crop: 'Maize / Pulses',   level: 'crit'  },
      mansa:         { depth: '25.3 m', status: 'CRITICAL', crop: 'Cotton / Pulses',  level: 'crit'  },
      moga:          { depth: '22.3 m', status: 'CRITICAL', crop: 'Maize / Pulses',   level: 'crit'  },
      pathankot:     { depth: '8.6 m',  status: 'SAFE',     crop: 'Rice / Vegetables',level: 'safe'  },
      patiala:       { depth: '17.6 m', status: 'WATCH',    crop: 'Maize / Oilseeds', level: 'watch' },
      phagwara:      { depth: '11.6 m', status: 'WATCH',    crop: 'Rice / Vegetables',level: 'watch' },
      rupnagar:      { depth: '10.7 m', status: 'SAFE',     crop: 'Rice / Vegetables',level: 'safe'  },
      mohali:        { depth: '13.1 m', status: 'WATCH',    crop: 'Maize / Oilseeds', level: 'watch' },
      sangrur:       { depth: '24.1 m', status: 'CRITICAL', crop: 'Cotton / Pulses',  level: 'crit'  },
      sbsnagar:      { depth: '12.4 m', status: 'WATCH',    crop: 'Maize / Oilseeds', level: 'watch' },
      muktsar:       { depth: '23.8 m', status: 'CRITICAL', crop: 'Cotton / Pulses',  level: 'crit'  },
      tarntaran:     { depth: '15.2 m', status: 'WATCH',    crop: 'Maize / Oilseeds', level: 'watch' },

      // Haryana — representative districts from the GRACE study region.
      ambala:        { depth: '11.2 m', status: 'SAFE',     crop: 'Rice / Vegetables',level: 'safe'  },
      fatehabad:     { depth: '18.3 m', status: 'WATCH',    crop: 'Bajra / Mustard',  level: 'watch' },
      hisar:         { depth: '17.9 m', status: 'WATCH',    crop: 'Bajra / Mustard',  level: 'watch' },
      jind:          { depth: '23.1 m', status: 'CRITICAL', crop: 'Bajra / Pulses',   level: 'crit'  },
      kaithal:       { depth: '22.8 m', status: 'CRITICAL', crop: 'Bajra / Pulses',   level: 'crit'  },
      karnal:        { depth: '20.2 m', status: 'CRITICAL', crop: 'Bajra / Pulses',   level: 'crit'  },
      kurukshetra:   { depth: '21.4 m', status: 'CRITICAL', crop: 'Bajra / Pulses',   level: 'crit'  },
      panipat:       { depth: '15.6 m', status: 'WATCH',    crop: 'Bajra / Mustard',  level: 'watch' },
      sirsa:         { depth: '16.7 m', status: 'WATCH',    crop: 'Bajra / Mustard',  level: 'watch' },
      sonipat:       { depth: '16.1 m', status: 'WATCH',    crop: 'Bajra / Mustard',  level: 'watch' },

      // Rajasthan — representative districts from the GRACE study region.
      alwar:         { depth: '17.2 m', status: 'WATCH',    crop: 'Mustard / Moong',  level: 'watch' },
      bikaner:       { depth: '24.6 m', status: 'CRITICAL', crop: 'Bajra / Guar',     level: 'crit'  },
      churu:         { depth: '26.1 m', status: 'CRITICAL', crop: 'Bajra / Guar',     level: 'crit'  },
      ganganagar:    { depth: '16.8 m', status: 'WATCH',    crop: 'Mustard / Moong',  level: 'watch' },
      hanumangarh:   { depth: '15.4 m', status: 'WATCH',    crop: 'Mustard / Moong',  level: 'watch' },
      jaipur:        { depth: '18.6 m', status: 'WATCH',    crop: 'Mustard / Moong',  level: 'watch' },
      jhunjhunu:     { depth: '22.9 m', status: 'CRITICAL', crop: 'Bajra / Guar',     level: 'crit'  },
      jodhpur:       { depth: '24.3 m', status: 'CRITICAL', crop: 'Bajra / Guar',     level: 'crit'  },
      nagaur:        { depth: '25.8 m', status: 'CRITICAL', crop: 'Bajra / Guar',     level: 'crit'  },
      sikar:         { depth: '23.5 m', status: 'CRITICAL', crop: 'Bajra / Guar',     level: 'crit'  }
    };
    var colors = { safe: '#4fd87a', watch: '#e8b93a', crit: '#e05c4b' };

    function render() {
      var d = data[sel.value];
      [depthCard, statusCard, cropCard].forEach(function(c) {
        c.style.opacity = '0.3';
      });
      setTimeout(function() {
        depthEl.textContent = d.depth;
        statusEl.textContent = d.status;
        cropEl.textContent = d.crop;
        var c = colors[d.level];
        depthCard.style.borderLeftColor = c;
        statusCard.style.borderLeftColor = c;
        cropCard.style.borderLeftColor = c;
        statusEl.style.color = c;
        [depthCard, statusCard, cropCard].forEach(function(cd) {
          cd.style.opacity = '1';
        });
      }, 140);
    }
    sel.addEventListener('change', render);
    render();
  })();

  // ---- Subtle 3D tilt on cards (desktop pointer only) ----
  (function() {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    var targets = document.querySelectorAll('.sig-card, .flow-box');
    targets.forEach(function(el) {
      el.classList.add('tilt');
      el.addEventListener('mousemove', function(e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(600px) rotateX(' + (-py * 6) + 'deg) rotateY(' + (px * 6) + 'deg) translateZ(2px)';
      });
      el.addEventListener('mouseleave', function() {
        el.style.transform = 'perspective(600px) rotateX(0) rotateY(0)';
      });
    });
  })();