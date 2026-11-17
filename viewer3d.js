/* ==========================================================================
   Hitung: Penampil Kanvas Interaktif 3D (Orbit Kursor 360°) & Proyeksi/Jaring 2D
   Mendukung tema Terang/Gelap, drag mouse/sentuh, dan kontrol keyboard.
   ========================================================================== */

(function (root) {
  "use strict";

  function createGeometryViewer(canvas, options) {
    const opts = options || {};
    const onAngleChange = typeof opts.onAngleChange === "function" ? opts.onAngleChange : function () {};

    const ctx = canvas.getContext("2d");
    const state = {
      shapeId: "kubus",
      category: "ruang",
      params: { s: 5 },
      mesh: null,
      viewMode: "3d", // "3d" atau "2d"
      wireframe: false,
      autoRotate: false,
      rotX: -0.42, // radian (sekitar -24 derajat)
      rotY: 0.66,  // radian (sekitar 38 derajat)
      rot2D: 0,    // radian untuk rotasi bidang 2D dengan kursor
      zoom: 1.0,
      dragging: false,
      lastX: 0,
      lastY: 0,
      rafId: null,
    };

    function getThemeColors() {
      const style = window.getComputedStyle(document.documentElement);
      const isDark = document.documentElement.getAttribute("data-theme") === "dark";
      return {
        isDark: isDark,
        bgPage: style.getPropertyValue("--bg-subtle").trim() || (isDark ? "#1a1914" : "#faf3e3"),
        bgSurface: style.getPropertyValue("--bg-surface").trim() || (isDark ? "#23211a" : "#ffffff"),
        ink: style.getPropertyValue("--ink-primary").trim() || (isDark ? "#f7f0e0" : "#1e1c12"),
        muted: style.getPropertyValue("--ink-muted").trim() || (isDark ? "#cec6ad" : "#4b4734"),
        border: style.getPropertyValue("--border-subtle").trim() || (isDark ? "#9e967d" : "#4b4734"),
        cobalt: style.getPropertyValue("--core-cobalt").trim() || (isDark ? "#59f8ff" : "#00696d"),
        accent: style.getPropertyValue("--accent").trim() || "#fde047",
        pink: style.getPropertyValue("--accent-pink").trim() || "#f472b6",
        darkInk: "#1e1c12",
      };
    }

    function hexToRgb(hex) {
      const clean = hex.replace("#", "").trim();
      if (clean.length === 3) {
        return [
          parseInt(clean[0] + clean[0], 16),
          parseInt(clean[1] + clean[1], 16),
          parseInt(clean[2] + clean[2], 16),
        ];
      }
      if (clean.length >= 6) {
        return [
          parseInt(clean.slice(0, 2), 16),
          parseInt(clean.slice(2, 4), 16),
          parseInt(clean.slice(4, 6), 16),
        ];
      }
      return [19, 58, 94];
    }

    function shadeColor(baseHex, factor, alpha) {
      const rgb = hexToRgb(baseHex);
      const r = Math.min(255, Math.max(0, Math.round(rgb[0] * factor)));
      const g = Math.min(255, Math.max(0, Math.round(rgb[1] * factor)));
      const b = Math.min(255, Math.max(0, Math.round(rgb[2] * factor)));
      return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
    }

    function rotatePoint3D(pt, rx, ry) {
      const x = pt[0];
      const y = pt[1];
      const z = pt[2];

      // Putar terhadap sumbu Y (yaw)
      const cosY = Math.cos(ry);
      const sinY = Math.sin(ry);
      const x1 = x * cosY + z * sinY;
      const z1 = -x * sinY + z * cosY;

      // Putar terhadap sumbu X (pitch)
      const cosX = Math.cos(rx);
      const sinX = Math.sin(rx);
      const y2 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;

      return [x1, y2, z2];
    }

    function project3D(pt3, width, height, scale) {
      const camDist = 4.6;
      const z = pt3[2];
      const factor = camDist / Math.max(1.2, camDist - z);
      const sx = width * 0.5 + pt3[0] * scale * factor;
      const sy = height * 0.5 - pt3[1] * scale * factor;
      return [sx, sy, z];
    }

    function drawPillLabel(text, x, y, colors, isAccent) {
      ctx.save();
      ctx.font = "700 12px 'IBM Plex Mono', monospace";
      const padX = 8;
      const textW = ctx.measureText(text).width;
      const boxW = textW + padX * 2;
      const boxH = 24;
      const bx = x - boxW / 2;
      const by = y - boxH / 2;

      // Bayangan offset keras Neubrutalist (2px 2px 0 #000000)
      ctx.fillStyle = "#000000";
      ctx.fillRect(bx + 2, by + 2, boxW, boxH);

      ctx.fillStyle = isAccent ? colors.accent : colors.bgSurface;
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.rect(bx, by, boxW, boxH);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isAccent ? colors.darkInk : colors.ink;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, x, y + 0.5);
      ctx.restore();
    }

    function drawAxisTriad(width, height, colors) {
      const originX = 46;
      const originY = height - 42;
      const axisLen = 24;
      const axes = [
        { dir: [1, 0, 0], name: "X", color: colors.ink },
        { dir: [0, 1, 0], name: "Y", color: colors.cobalt },
        { dir: [0, 0, 1], name: "Z", color: colors.muted },
      ];

      ctx.save();
      ctx.font = "600 11px 'IBM Plex Mono', monospace";
      axes.forEach(function (ax) {
        const rot = rotatePoint3D(ax.dir, state.rotX, state.rotY);
        const ex = originX + rot[0] * axisLen;
        const ey = originY - rot[1] * axisLen;

        ctx.strokeStyle = ax.color;
        ctx.lineWidth = 1.75;
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(ex, ey);
        ctx.stroke();

        ctx.fillStyle = ax.color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          ax.name,
          originX + rot[0] * (axisLen + 10),
          originY - rot[1] * (axisLen + 10)
        );
      });
      ctx.restore();
    }

    function render3D(width, height, colors) {
      if (!state.mesh) return;
      const baseScale = Math.min(width, height) * 0.27 * state.zoom;

      const rotatedVerts = state.mesh.vertices.map(function (v) {
        return rotatePoint3D(v, state.rotX, state.rotY);
      });

      const projectedVerts = rotatedVerts.map(function (rv) {
        return project3D(rv, width, height, baseScale);
      });

      // Urutkan sisi dari belakang ke depan (Painter's Algorithm)
      const sortedFaces = state.mesh.faces
        .map(function (face) {
          let sumZ = 0;
          face.indices.forEach(function (idx) {
            sumZ += rotatedVerts[idx][2];
          });
          const p0 = rotatedVerts[face.indices[0]];
          const p1 = rotatedVerts[face.indices[1]];
          const p2 = rotatedVerts[face.indices[2]];
          const ux = p1[0] - p0[0];
          const uy = p1[1] - p0[1];
          const uz = p1[2] - p0[2];
          const vx = p2[0] - p0[0];
          const vy = p2[1] - p0[1];
          const vz = p2[2] - p0[2];
          const nx = uy * vz - uz * vy;
          const ny = uz * vx - ux * vz;
          const nz = ux * vy - uy * vx;
          const len = Math.hypot(nx, ny, nz) || 1;

          return {
            indices: face.indices,
            role: face.role,
            avgZ: sumZ / face.indices.length,
            normal: [nx / len, ny / len, nz / len],
          };
        })
        .sort(function (a, b) {
          return a.avgZ - b.avgZ;
        });

      // Gambar poligon permukaan bergaya Neubrutalist Toy-Block
      sortedFaces.forEach(function (face) {
        const n = face.normal;
        const lightDot = Math.abs(n[0] * 0.35 + n[1] * 0.65 + n[2] * 0.68);
        const shadeFactor = 0.8 + lightDot * 0.25;
        const alpha = state.wireframe ? 0.16 : 0.92;

        let faceHex = colors.accent;
        if (face.role === "side") {
          faceHex = colors.pink;
        } else if (face.role === "cap") {
          faceHex = colors.cobalt;
        }

        ctx.beginPath();
        face.indices.forEach(function (vIdx, i) {
          const pt = projectedVerts[vIdx];
          if (i === 0) ctx.moveTo(pt[0], pt[1]);
          else ctx.lineTo(pt[0], pt[1]);
        });
        ctx.closePath();

        ctx.fillStyle = shadeColor(faceHex, shadeFactor, alpha);
        ctx.fill();

        if (!state.wireframe) {
          ctx.strokeStyle = shadeColor(colors.ink, 1, 0.28);
          ctx.lineWidth = 0.9;
          ctx.stroke();
        }
      });

      // Gambar rusuk struktural utama (tegas 2px)
      ctx.save();
      ctx.strokeStyle = colors.ink;
      ctx.lineWidth = state.wireframe ? 2.0 : 1.75;
      ctx.lineJoin = "round";
      state.mesh.edges.forEach(function (edge) {
        const a = projectedVerts[edge[0]];
        const b = projectedVerts[edge[1]];
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.stroke();
      });
      ctx.restore();

      // Gambar garis ukur dimensi (guideLines)
      if (state.mesh.guideLines) {
        state.mesh.guideLines.forEach(function (g) {
          const rFrom = rotatePoint3D(g.from, state.rotX, state.rotY);
          const rTo = rotatePoint3D(g.to, state.rotX, state.rotY);
          const pFrom = project3D(rFrom, width, height, baseScale);
          const pTo = project3D(rTo, width, height, baseScale);

          ctx.save();
          ctx.strokeStyle = colors.ink;
          ctx.lineWidth = 2.25;
          ctx.setLineDash([5, 4]);
          ctx.beginPath();
          ctx.moveTo(pFrom[0], pFrom[1]);
          ctx.lineTo(pTo[0], pTo[1]);
          ctx.stroke();
          ctx.restore();

          const mx = (pFrom[0] + pTo[0]) / 2;
          const my = (pFrom[1] + pTo[1]) / 2;
          drawPillLabel(g.label, mx, my, colors, true);
        });
      }

      drawAxisTriad(width, height, colors);
    }

    function render2D(width, height, colors) {
      const cx = width * 0.5;
      const cy = height * 0.5;
      const unit = Math.min(width, height) * 0.31 * state.zoom;
      const p = state.params;
      const fmt = root.HitungGeometry.formatValue;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(state.rot2D);

      ctx.fillStyle = shadeColor(colors.accent, 0.98, 0.65);
      ctx.strokeStyle = colors.ink;
      ctx.lineWidth = 2.25;

      if (state.shapeId === "persegi" || state.shapeId === "persegi-panjang") {
        const wRaw = state.shapeId === "persegi" ? p.s : p.p;
        const hRaw = state.shapeId === "persegi" ? p.s : p.l;
        const maxD = Math.max(wRaw, hRaw) || 1;
        const w = (wRaw / maxD) * unit * 1.6;
        const h = (hRaw / maxD) * unit * 1.6;

        ctx.beginPath();
        ctx.rect(-w / 2, -h / 2, w, h);
        ctx.fill();
        ctx.stroke();

        // Diagonal putus-putus
        ctx.save();
        ctx.strokeStyle = colors.ink;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(-w / 2, h / 2);
        ctx.lineTo(w / 2, -h / 2);
        ctx.stroke();
        ctx.restore();

        drawPillLabel(
          (state.shapeId === "persegi" ? "s = " : "p = ") + fmt(wRaw),
          0,
          h / 2 + 22,
          colors,
          false
        );
        if (state.shapeId === "persegi-panjang") {
          drawPillLabel("l = " + fmt(hRaw), w / 2 + 38, 0, colors, false);
        }
      } else if (state.shapeId === "segitiga") {
        const maxD = Math.max(p.a, p.t) || 1;
        const w = (p.a / maxD) * unit * 1.65;
        const h = (p.t / maxD) * unit * 1.65;

        ctx.beginPath();
        ctx.moveTo(-w / 2, h / 2);
        ctx.lineTo(w / 2, h / 2);
        ctx.lineTo(0, -h / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.save();
        ctx.strokeStyle = colors.ink;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(0, -h / 2);
        ctx.lineTo(0, h / 2);
        ctx.stroke();
        ctx.restore();

        drawPillLabel("a = " + fmt(p.a), 0, h / 2 + 22, colors, false);
        drawPillLabel("t = " + fmt(p.t), 28, 0, colors, true);
      } else if (state.shapeId === "lingkaran" || state.shapeId === "bola") {
        const rad = unit * 0.85;
        ctx.beginPath();
        ctx.arc(0, 0, rad, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (state.shapeId === "bola") {
          ctx.save();
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = colors.cobalt;
          ctx.beginPath();
          ctx.ellipse(0, 0, rad, rad * 0.32, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        ctx.save();
        ctx.strokeStyle = colors.ink;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(rad, 0);
        ctx.stroke();
        ctx.restore();

        drawPillLabel("r = " + fmt(p.r), rad * 0.5, -18, colors, true);
      } else if (state.shapeId === "trapesium") {
        const maxD = Math.max(p.a, p.b, p.t) || 1;
        const wa = (p.a / maxD) * unit * 1.6;
        const wb = (p.b / maxD) * unit * 1.6;
        const h = (p.t / maxD) * unit * 1.4;

        ctx.beginPath();
        ctx.moveTo(-wb / 2, h / 2);
        ctx.lineTo(wb / 2, h / 2);
        ctx.lineTo(wa / 2, -h / 2);
        ctx.lineTo(-wa / 2, -h / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        drawPillLabel("a = " + fmt(p.a), 0, -h / 2 - 20, colors, false);
        drawPillLabel("b = " + fmt(p.b), 0, h / 2 + 22, colors, false);
        drawPillLabel("t = " + fmt(p.t), 0, 0, colors, true);
      } else if (state.shapeId === "jajar-genjang") {
        const shRaw = Math.sqrt(Math.max(0, p.b * p.b - p.t * p.t));
        const maxD = Math.max(p.a + shRaw, p.t) || 1;
        const w = (p.a / maxD) * unit * 1.6;
        const h = (p.t / maxD) * unit * 1.5;
        const sh = (shRaw / maxD) * unit * 1.5;
        const ox = (w + sh) / 2;

        ctx.beginPath();
        ctx.moveTo(-ox, h / 2);
        ctx.lineTo(w - ox, h / 2);
        ctx.lineTo(w + sh - ox, -h / 2);
        ctx.lineTo(sh - ox, -h / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        drawPillLabel("a = " + fmt(p.a), -sh / 2, h / 2 + 22, colors, false);
        drawPillLabel("t = " + fmt(p.t), sh - ox + 28, 0, colors, true);
      } else if (state.shapeId === "kubus" || state.shapeId === "balok") {
        // Jaring-jaring (Net) 2D Kubus / Balok (6 bidang terbentang)
        const s = unit * 0.42;
        const cells = [
          [0, -1],
          [-1, 0],
          [0, 0],
          [1, 0],
          [2, 0],
          [0, 1],
        ];
        cells.forEach(function (c, i) {
          const x = (c[0] - 0.5) * s;
          const y = c[1] * s - s * 0.5;
          ctx.fillStyle = i === 2 ? shadeColor(colors.pink, 1, 0.75) : shadeColor(colors.accent, 0.98, 0.65);
          ctx.beginPath();
          ctx.rect(x, y, s, s);
          ctx.fill();
          ctx.stroke();
        });
        const lbl =
          state.shapeId === "kubus"
            ? "Jaring-jaring Kubus (s = " + fmt(p.s) + ")"
            : "Jaring-jaring Balok (" + fmt(p.p) + "x" + fmt(p.l) + "x" + fmt(p.t) + ")";
        drawPillLabel(lbl, 0, unit * 0.95, colors, false);
      } else if (state.shapeId === "tabung") {
        // Jaring-jaring Tabung: persegi panjang selimut + 2 lingkaran
        const rw = unit * 1.3;
        const rh = unit * 0.55;
        const cr = unit * 0.24;
        ctx.beginPath();
        ctx.rect(-rw / 2, -rh / 2, rw, rh);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, -rh / 2 - cr - 4, cr, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, rh / 2 + cr + 4, cr, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        drawPillLabel("Selimut (2*pi*r x t)", 0, 0, colors, false);
        drawPillLabel("r = " + fmt(p.r), cr + 34, -rh / 2 - cr - 4, colors, true);
      } else if (state.shapeId === "kerucut") {
        // Jaring-jaring Kerucut: juring selimut + lingkaran alas
        const sr = unit * 0.85;
        const cr = unit * 0.28;
        ctx.beginPath();
        ctx.moveTo(0, -unit * 0.7);
        ctx.arc(0, -unit * 0.7, sr, Math.PI * 0.25, Math.PI * 0.75);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, unit * 0.48, cr, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        drawPillLabel("Juring Selimut (s)", 0, -unit * 0.18, colors, false);
        drawPillLabel("Alas r = " + fmt(p.r), 0, unit * 0.48, colors, true);
      } else if (state.shapeId === "limas-segiempat") {
        // Jaring-jaring Bintang Limas Segi Empat
        const hs = unit * 0.34;
        const peak = unit * 0.85;
        ctx.beginPath();
        ctx.rect(-hs, -hs, hs * 2, hs * 2);
        ctx.fill();
        ctx.stroke();

        const tris = [
          [[-hs, -hs], [hs, -hs], [0, -peak]],
          [[hs, -hs], [hs, hs], [peak, 0]],
          [[hs, hs], [-hs, hs], [0, peak]],
          [[-hs, hs], [-hs, -hs], [-peak, 0]],
        ];
        tris.forEach(function (tri) {
          ctx.beginPath();
          ctx.moveTo(tri[0][0], tri[0][1]);
          ctx.lineTo(tri[1][0], tri[1][1]);
          ctx.lineTo(tri[2][0], tri[2][1]);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        });
        drawPillLabel("s = " + fmt(p.s), 0, 0, colors, true);
      } else {
        // Jaring-jaring Prisma Segitiga
        const w = unit * 0.38;
        const h = unit * 0.62;
        for (let i = -1; i <= 1; i += 1) {
          ctx.beginPath();
          ctx.rect(i * w - w / 2, -h / 2, w, h);
          ctx.fill();
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(-w / 2, -h / 2);
        ctx.lineTo(w / 2, -h / 2);
        ctx.lineTo(0, -h / 2 - unit * 0.34);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-w / 2, h / 2);
        ctx.lineTo(w / 2, h / 2);
        ctx.lineTo(0, h / 2 + unit * 0.34);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        drawPillLabel("tp = " + fmt(p.tp), 0, 0, colors, true);
      }

      ctx.restore();
    }

    function reportAngles() {
      const degX = Math.round((state.rotX * 180) / Math.PI);
      const degY = Math.round((state.rotY * 180) / Math.PI);
      const deg2D = Math.round((state.rot2D * 180) / Math.PI);
      const zoomPct = Math.round(state.zoom * 100);
      onAngleChange({
        viewMode: state.viewMode,
        degX: degX,
        degY: degY,
        deg2D: deg2D,
        zoomPct: zoomPct,
      });
    }

    function draw() {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(260, rect.width || 480);
      const height = Math.max(240, rect.height || 340);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const colors = getThemeColors();
      ctx.fillStyle = colors.bgPage;
      ctx.fillRect(0, 0, width, height);

      if (state.viewMode === "3d") {
        render3D(width, height, colors);
      } else {
        render2D(width, height, colors);
      }

      ctx.restore();
      reportAngles();
    }

    function tickAutoRotate() {
      if (!state.autoRotate) {
        state.rafId = null;
        return;
      }
      if (!state.dragging) {
        if (state.viewMode === "3d") {
          state.rotY += 0.012;
        } else {
          state.rot2D += 0.008;
        }
        draw();
      }
      state.rafId = window.requestAnimationFrame(tickAutoRotate);
    }

    // Event Drag Kursor & Sentuh (Bolak-Balik 360 Derajat)
    canvas.addEventListener("pointerdown", function (event) {
      state.dragging = true;
      state.lastX = event.clientX;
      state.lastY = event.clientY;
      if (canvas.setPointerCapture) {
        try {
          canvas.setPointerCapture(event.pointerId);
        } catch (_err) {
          // Abaikan bila pointer sintetik
        }
      }
    });

    canvas.addEventListener("pointermove", function (event) {
      if (!state.dragging) return;
      const dx = event.clientX - state.lastX;
      const dy = event.clientY - state.lastY;
      state.lastX = event.clientX;
      state.lastY = event.clientY;

      if (state.viewMode === "3d") {
        state.rotY += dx * 0.011;
        state.rotX += dy * 0.011;
      } else {
        state.rot2D += dx * 0.01;
      }
      draw();
    });

    function stopDrag() {
      state.dragging = false;
    }

    canvas.addEventListener("pointerup", stopDrag);
    canvas.addEventListener("pointercancel", stopDrag);

    // Navigasi Papan Ketik saat Kanvas Fokus (Aksesibilitas R-32)
    canvas.addEventListener("keydown", function (event) {
      const step = 0.12;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (state.viewMode === "3d") state.rotY -= step;
        else state.rot2D -= step;
        draw();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        if (state.viewMode === "3d") state.rotY += step;
        else state.rot2D += step;
        draw();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        if (state.viewMode === "3d") state.rotX -= step;
        else state.rot2D -= step;
        draw();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        if (state.viewMode === "3d") state.rotX += step;
        else state.rot2D += step;
        draw();
      } else if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        state.zoom = Math.min(1.65, state.zoom + 0.12);
        draw();
      } else if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        state.zoom = Math.max(0.6, state.zoom - 0.12);
        draw();
      } else if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        resetOrientation();
      }
    });

    window.addEventListener("resize", draw);

    function setShape(shapeId, params) {
      state.shapeId = shapeId;
      state.params = params;
      state.mesh = root.HitungGeometry.buildMesh3D(shapeId, params);
      draw();
    }

    function setViewMode(mode) {
      state.viewMode = mode === "2d" ? "2d" : "3d";
      draw();
    }

    function setWireframe(flag) {
      state.wireframe = Boolean(flag);
      draw();
    }

    function setAutoRotate(flag) {
      state.autoRotate = Boolean(flag);
      if (state.autoRotate && !state.rafId) {
        state.rafId = window.requestAnimationFrame(tickAutoRotate);
      }
    }

    function adjustZoom(delta) {
      state.zoom = Math.min(1.65, Math.max(0.6, Number((state.zoom + delta).toFixed(2))));
      draw();
    }

    function resetOrientation() {
      state.rotX = -0.42;
      state.rotY = 0.66;
      state.rot2D = 0;
      state.zoom = 1.0;
      draw();
    }

    return {
      setShape: setShape,
      setViewMode: setViewMode,
      setWireframe: setWireframe,
      setAutoRotate: setAutoRotate,
      adjustZoom: adjustZoom,
      resetOrientation: resetOrientation,
      redraw: draw,
    };
  }

  root.HitungViewer3D = {
    createGeometryViewer: createGeometryViewer,
  };
})(typeof window !== "undefined" ? window : globalThis);
