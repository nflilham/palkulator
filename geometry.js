/* ==========================================================================
   Hitung: Mesin Rumus, Validasi, Mesh 3D, & Proyeksi/Jaring-Jaring 2D
   Mendukung 6 Bangun Datar dan 7 Bangun Ruang tanpa pustaka eksternal.
   ========================================================================== */

(function (root) {
  "use strict";

  function cleanNum(val) {
    if (!Number.isFinite(val)) return 0;
    if (Math.abs(val) < 1e-12) return 0;
    return Number(val.toPrecision(10));
  }

  function fmt(val) {
    const c = cleanNum(val);
    if (Math.abs(c) >= 1e9 || (c !== 0 && Math.abs(c) < 1e-5)) {
      return c.toExponential(4);
    }
    return String(Number(c.toFixed(4)));
  }

  const SHAPES = {
    /* ----------------------------------------------------------------------
       BANGUN DATAR (6 Bentuk)
       ---------------------------------------------------------------------- */
    persegi: {
      id: "persegi",
      category: "datar",
      name: "Persegi",
      summary: "Empat sisi sama panjang dan empat sudut siku-siku (90 derajat).",
      fields: [{ key: "s", label: "Sisi (s)", defaultVal: 6 }],
      compute: function (v) {
        const s = v.s;
        const luas = s * s;
        const keliling = 4 * s;
        const diagonal = s * Math.sqrt(2);
        return {
          metrics: [
            { label: "Luas (L)", value: fmt(luas), unit: "satuan²", primary: true },
            { label: "Keliling (K)", value: fmt(keliling), unit: "satuan" },
            { label: "Diagonal (d)", value: fmt(diagonal), unit: "satuan" },
          ],
          steps: [
            "L = s^2 = " + fmt(s) + "^2 = " + fmt(luas),
            "K = 4 * s = 4 * " + fmt(s) + " = " + fmt(keliling),
            "d = s * sqrt(2) = " + fmt(diagonal),
          ],
        };
      },
    },

    "persegi-panjang": {
      id: "persegi-panjang",
      category: "datar",
      name: "Persegi Panjang",
      summary: "Dua pasang sisi sejajar sama panjang dan empat sudut siku-siku.",
      fields: [
        { key: "p", label: "Panjang (p)", defaultVal: 8 },
        { key: "l", label: "Lebar (l)", defaultVal: 5 },
      ],
      compute: function (v) {
        const p = v.p;
        const l = v.l;
        const luas = p * l;
        const keliling = 2 * (p + l);
        const diagonal = Math.sqrt(p * p + l * l);
        return {
          metrics: [
            { label: "Luas (L)", value: fmt(luas), unit: "satuan²", primary: true },
            { label: "Keliling (K)", value: fmt(keliling), unit: "satuan" },
            { label: "Diagonal (d)", value: fmt(diagonal), unit: "satuan" },
          ],
          steps: [
            "L = p * l = " + fmt(p) + " * " + fmt(l) + " = " + fmt(luas),
            "K = 2 * (p + l) = 2 * (" + fmt(p) + " + " + fmt(l) + ") = " + fmt(keliling),
            "d = sqrt(p^2 + l^2) = " + fmt(diagonal),
          ],
        };
      },
    },

    segitiga: {
      id: "segitiga",
      category: "datar",
      name: "Segitiga Sama Kaki",
      summary: "Segitiga dengan alas (a), tinggi tegak lurus (t), dan dua sisi miring sama panjang.",
      fields: [
        { key: "a", label: "Alas (a)", defaultVal: 8 },
        { key: "t", label: "Tinggi (t)", defaultVal: 6 },
      ],
      compute: function (v) {
        const a = v.a;
        const t = v.t;
        const luas = 0.5 * a * t;
        const miring = Math.sqrt(Math.pow(a / 2, 2) + t * t);
        const keliling = a + 2 * miring;
        return {
          metrics: [
            { label: "Luas (L)", value: fmt(luas), unit: "satuan²", primary: true },
            { label: "Keliling (K)", value: fmt(keliling), unit: "satuan" },
            { label: "Sisi Miring (m)", value: fmt(miring), unit: "satuan" },
          ],
          steps: [
            "L = 1/2 * a * t = 0.5 * " + fmt(a) + " * " + fmt(t) + " = " + fmt(luas),
            "m = sqrt((a/2)^2 + t^2) = " + fmt(miring),
            "K = a + 2m = " + fmt(a) + " + 2 * " + fmt(miring) + " = " + fmt(keliling),
          ],
        };
      },
    },

    lingkaran: {
      id: "lingkaran",
      category: "datar",
      name: "Lingkaran",
      summary: "Himpunan titik yang berjarak sama (jari-jari r) terhadap titik pusat.",
      fields: [{ key: "r", label: "Jari-jari (r)", defaultVal: 5 }],
      compute: function (v) {
        const r = v.r;
        const luas = Math.PI * r * r;
        const keliling = 2 * Math.PI * r;
        const diameter = 2 * r;
        return {
          metrics: [
            { label: "Luas (L)", value: fmt(luas), unit: "satuan²", primary: true },
            { label: "Keliling (K)", value: fmt(keliling), unit: "satuan" },
            { label: "Diameter (d)", value: fmt(diameter), unit: "satuan" },
          ],
          steps: [
            "L = pi * r^2 = pi * " + fmt(r) + "^2 = " + fmt(luas),
            "K = 2 * pi * r = 2 * pi * " + fmt(r) + " = " + fmt(keliling),
            "d = 2 * r = " + fmt(diameter),
          ],
        };
      },
    },

    trapesium: {
      id: "trapesium",
      category: "datar",
      name: "Trapesium Sama Kaki",
      summary: "Segi empat dengan sepasang sisi sejajar (a dan b) serta dua kaki miring simetris.",
      fields: [
        { key: "a", label: "Sisi Atas (a)", defaultVal: 5 },
        { key: "b", label: "Sisi Bawah (b)", defaultVal: 9 },
        { key: "t", label: "Tinggi (t)", defaultVal: 4 },
      ],
      compute: function (v) {
        const a = v.a;
        const b = v.b;
        const t = v.t;
        const luas = 0.5 * (a + b) * t;
        const miring = Math.sqrt(Math.pow((b - a) / 2, 2) + t * t);
        const keliling = a + b + 2 * miring;
        return {
          metrics: [
            { label: "Luas (L)", value: fmt(luas), unit: "satuan²", primary: true },
            { label: "Keliling (K)", value: fmt(keliling), unit: "satuan" },
            { label: "Kaki Miring (m)", value: fmt(miring), unit: "satuan" },
          ],
          steps: [
            "L = 1/2 * (a + b) * t = 0.5 * (" + fmt(a) + " + " + fmt(b) + ") * " + fmt(t) + " = " + fmt(luas),
            "m = sqrt(((b - a)/2)^2 + t^2) = " + fmt(miring),
            "K = a + b + 2m = " + fmt(keliling),
          ],
        };
      },
    },

    "jajar-genjang": {
      id: "jajar-genjang",
      category: "datar",
      name: "Jajar Genjang",
      summary: "Segi empat dengan dua pasang sisi sejajar; tinggi (t) tegak lurus terhadap alas (a).",
      fields: [
        { key: "a", label: "Alas (a)", defaultVal: 8 },
        { key: "b", label: "Sisi Miring (b)", defaultVal: 6 },
        { key: "t", label: "Tinggi Tegak (t)", defaultVal: 5 },
      ],
      validate: function (v) {
        if (v.b < v.t) {
          throw new Error(
            "Sisi miring (b) harus lebih besar atau sama dengan tinggi tegak (t)."
          );
        }
      },
      compute: function (v) {
        const a = v.a;
        const b = v.b;
        const t = v.t;
        const luas = a * t;
        const keliling = 2 * (a + b);
        const geser = Math.sqrt(Math.max(0, b * b - t * t));
        return {
          metrics: [
            { label: "Luas (L)", value: fmt(luas), unit: "satuan²", primary: true },
            { label: "Keliling (K)", value: fmt(keliling), unit: "satuan" },
            { label: "Geser Horisontal", value: fmt(geser), unit: "satuan" },
          ],
          steps: [
            "L = a * t = " + fmt(a) + " * " + fmt(t) + " = " + fmt(luas),
            "K = 2 * (a + b) = 2 * (" + fmt(a) + " + " + fmt(b) + ") = " + fmt(keliling),
          ],
        };
      },
    },

    /* ----------------------------------------------------------------------
       BANGUN RUANG (7 Bentuk)
       ---------------------------------------------------------------------- */
    kubus: {
      id: "kubus",
      category: "ruang",
      name: "Kubus",
      summary: "Bangun ruang enam sisi persegi kongruen dengan 12 rusuk sama panjang.",
      fields: [{ key: "s", label: "Rusuk (s)", defaultVal: 5 }],
      compute: function (v) {
        const s = v.s;
        const vol = Math.pow(s, 3);
        const lp = 6 * s * s;
        const diag = s * Math.sqrt(3);
        return {
          metrics: [
            { label: "Volume (V)", value: fmt(vol), unit: "satuan³", primary: true },
            { label: "Luas Permukaan (LP)", value: fmt(lp), unit: "satuan²" },
            { label: "Diagonal Ruang", value: fmt(diag), unit: "satuan" },
          ],
          steps: [
            "V = s^3 = " + fmt(s) + "^3 = " + fmt(vol),
            "LP = 6 * s^2 = 6 * " + fmt(s * s) + " = " + fmt(lp),
            "d_ruang = s * sqrt(3) = " + fmt(diag),
          ],
        };
      },
    },

    balok: {
      id: "balok",
      category: "ruang",
      name: "Balok",
      summary: "Prisma tegak segi empat dengan ukuran panjang (p), lebar (l), dan tinggi (t).",
      fields: [
        { key: "p", label: "Panjang (p)", defaultVal: 8 },
        { key: "l", label: "Lebar (l)", defaultVal: 5 },
        { key: "t", label: "Tinggi (t)", defaultVal: 4 },
      ],
      compute: function (v) {
        const p = v.p;
        const l = v.l;
        const t = v.t;
        const vol = p * l * t;
        const lp = 2 * (p * l + p * t + l * t);
        const diag = Math.sqrt(p * p + l * l + t * t);
        return {
          metrics: [
            { label: "Volume (V)", value: fmt(vol), unit: "satuan³", primary: true },
            { label: "Luas Permukaan (LP)", value: fmt(lp), unit: "satuan²" },
            { label: "Diagonal Ruang", value: fmt(diag), unit: "satuan" },
          ],
          steps: [
            "V = p * l * t = " + fmt(p) + " * " + fmt(l) + " * " + fmt(t) + " = " + fmt(vol),
            "LP = 2 * (pl + pt + lt) = " + fmt(lp),
            "d_ruang = sqrt(p^2 + l^2 + t^2) = " + fmt(diag),
          ],
        };
      },
    },

    tabung: {
      id: "tabung",
      category: "ruang",
      name: "Tabung",
      summary: "Silinder tegak dengan alas dan tutup lingkaran berjari-jari (r) serta tinggi (t).",
      fields: [
        { key: "r", label: "Jari-jari (r)", defaultVal: 4 },
        { key: "t", label: "Tinggi (t)", defaultVal: 7 },
      ],
      compute: function (v) {
        const r = v.r;
        const t = v.t;
        const vol = Math.PI * r * r * t;
        const selimut = 2 * Math.PI * r * t;
        const lp = 2 * Math.PI * r * (r + t);
        return {
          metrics: [
            { label: "Volume (V)", value: fmt(vol), unit: "satuan³", primary: true },
            { label: "Luas Permukaan (LP)", value: fmt(lp), unit: "satuan²" },
            { label: "Luas Selimut", value: fmt(selimut), unit: "satuan²" },
          ],
          steps: [
            "V = pi * r^2 * t = pi * " + fmt(r) + "^2 * " + fmt(t) + " = " + fmt(vol),
            "L_selimut = 2 * pi * r * t = " + fmt(selimut),
            "LP = 2 * pi * r * (r + t) = " + fmt(lp),
          ],
        };
      },
    },

    kerucut: {
      id: "kerucut",
      category: "ruang",
      name: "Kerucut",
      summary: "Limas beralas lingkaran berjari-jari (r) dengan puncak setinggi (t).",
      fields: [
        { key: "r", label: "Jari-jari (r)", defaultVal: 4 },
        { key: "t", label: "Tinggi (t)", defaultVal: 6 },
      ],
      compute: function (v) {
        const r = v.r;
        const t = v.t;
        const s = Math.sqrt(r * r + t * t);
        const vol = (1 / 3) * Math.PI * r * r * t;
        const lp = Math.PI * r * (r + s);
        return {
          metrics: [
            { label: "Volume (V)", value: fmt(vol), unit: "satuan³", primary: true },
            { label: "Luas Permukaan (LP)", value: fmt(lp), unit: "satuan²" },
            { label: "Garis Pelukis (s)", value: fmt(s), unit: "satuan" },
          ],
          steps: [
            "s = sqrt(r^2 + t^2) = sqrt(" + fmt(r * r) + " + " + fmt(t * t) + ") = " + fmt(s),
            "V = 1/3 * pi * r^2 * t = " + fmt(vol),
            "LP = pi * r * (r + s) = " + fmt(lp),
          ],
        };
      },
    },

    bola: {
      id: "bola",
      category: "ruang",
      name: "Bola",
      summary: "Bangun ruang lengkung simetris sempurna dengan jari-jari (r) dari pusat.",
      fields: [{ key: "r", label: "Jari-jari (r)", defaultVal: 5 }],
      compute: function (v) {
        const r = v.r;
        const vol = (4 / 3) * Math.PI * Math.pow(r, 3);
        const lp = 4 * Math.PI * r * r;
        const d = 2 * r;
        return {
          metrics: [
            { label: "Volume (V)", value: fmt(vol), unit: "satuan³", primary: true },
            { label: "Luas Permukaan (LP)", value: fmt(lp), unit: "satuan²" },
            { label: "Diameter (d)", value: fmt(d), unit: "satuan" },
          ],
          steps: [
            "V = 4/3 * pi * r^3 = 4/3 * pi * " + fmt(Math.pow(r, 3)) + " = " + fmt(vol),
            "LP = 4 * pi * r^2 = 4 * pi * " + fmt(r * r) + " = " + fmt(lp),
          ],
        };
      },
    },

    "limas-segiempat": {
      id: "limas-segiempat",
      category: "ruang",
      name: "Limas Segi Empat",
      summary: "Limas beralas persegi (s x s) dengan puncak tegak lurus setinggi (t).",
      fields: [
        { key: "s", label: "Sisi Alas (s)", defaultVal: 6 },
        { key: "t", label: "Tinggi Limas (t)", defaultVal: 5 },
      ],
      compute: function (v) {
        const s = v.s;
        const t = v.t;
        const ts = Math.sqrt(Math.pow(s / 2, 2) + t * t);
        const vol = (1 / 3) * s * s * t;
        const lp = s * s + 2 * s * ts;
        return {
          metrics: [
            { label: "Volume (V)", value: fmt(vol), unit: "satuan³", primary: true },
            { label: "Luas Permukaan (LP)", value: fmt(lp), unit: "satuan²" },
            { label: "Tinggi Sisi Tegak", value: fmt(ts), unit: "satuan" },
          ],
          steps: [
            "V = 1/3 * s^2 * t = 1/3 * " + fmt(s * s) + " * " + fmt(t) + " = " + fmt(vol),
            "t_sisi = sqrt((s/2)^2 + t^2) = " + fmt(ts),
            "LP = s^2 + 4 * (1/2 * s * t_sisi) = " + fmt(lp),
          ],
        };
      },
    },

    "prisma-segitiga": {
      id: "prisma-segitiga",
      category: "ruang",
      name: "Prisma Segitiga",
      summary: "Prisma dengan penampang segitiga sama kaki (alas a, tinggi ta) sepanjang tinggi prisma (tp).",
      fields: [
        { key: "a", label: "Alas Segitiga (a)", defaultVal: 6 },
        { key: "ta", label: "Tinggi Segitiga (ta)", defaultVal: 4 },
        { key: "tp", label: "Tinggi Prisma (tp)", defaultVal: 8 },
      ],
      compute: function (v) {
        const a = v.a;
        const ta = v.ta;
        const tp = v.tp;
        const luasAlas = 0.5 * a * ta;
        const miring = Math.sqrt(Math.pow(a / 2, 2) + ta * ta);
        const kelAlas = a + 2 * miring;
        const vol = luasAlas * tp;
        const lp = 2 * luasAlas + kelAlas * tp;
        return {
          metrics: [
            { label: "Volume (V)", value: fmt(vol), unit: "satuan³", primary: true },
            { label: "Luas Permukaan (LP)", value: fmt(lp), unit: "satuan²" },
            { label: "Luas Alas Segitiga", value: fmt(luasAlas), unit: "satuan²" },
          ],
          steps: [
            "L_alas = 1/2 * a * ta = " + fmt(luasAlas),
            "V = L_alas * tp = " + fmt(luasAlas) + " * " + fmt(tp) + " = " + fmt(vol),
            "LP = 2 * L_alas + K_alas * tp = " + fmt(lp),
          ],
        };
      },
    },
  };

  /**
   * Memvalidasi masukan pengguna dan menghitung metrik bangun.
   */
  function calculateShape(shapeId, rawParams) {
    const spec = SHAPES[shapeId];
    if (!spec) {
      throw new Error('Bangun "' + shapeId + '" tidak ditemukan.');
    }

    const cleanParams = {};
    spec.fields.forEach(function (f) {
      const val = Number(rawParams[f.key]);
      if (!Number.isFinite(val)) {
        throw new Error('Nilai "' + f.label + '" harus berupa angka yang sah.');
      }
      if (val <= 0) {
        throw new Error('Nilai "' + f.label + '" harus lebih besar dari 0.');
      }
      if (val > 1e6) {
        throw new Error('Nilai "' + f.label + '" terlalu besar (maksimal 1.000.000).');
      }
      cleanParams[f.key] = val;
    });

    if (typeof spec.validate === "function") {
      spec.validate(cleanParams);
    }

    const result = spec.compute(cleanParams);
    return {
      shape: spec,
      params: cleanParams,
      metrics: result.metrics,
      steps: result.steps,
    };
  }

  /**
   * Utilitas membuat ekstrusi pelat tipis 3D dari poligon 2D [(x,y), ...]
   * agar Bangun Datar dapat dibolak-balik 360 derajat di ruang 3D.
   */
  function extrudePolygon2D(pts2D, halfThickness, guideLines) {
    const n = pts2D.length;
    const vertices = [];
    const faces = [];
    const edges = [];

    for (let i = 0; i < n; i += 1) {
      vertices.push([pts2D[i][0], pts2D[i][1], halfThickness]);
    }
    for (let i = 0; i < n; i += 1) {
      vertices.push([pts2D[i][0], pts2D[i][1], -halfThickness]);
    }

    const frontIdx = [];
    const backIdx = [];
    for (let i = 0; i < n; i += 1) {
      frontIdx.push(i);
      backIdx.push(2 * n - 1 - i);
      const next = (i + 1) % n;
      faces.push({
        indices: [i, next, n + next, n + i],
        role: "side",
      });
      edges.push([i, next]);
      edges.push([n + i, n + next]);
      edges.push([i, n + i]);
    }

    faces.push({ indices: frontIdx, role: "main" });
    faces.push({ indices: backIdx, role: "cap" });

    return {
      vertices: vertices,
      faces: faces,
      edges: edges,
      guideLines: guideLines || [],
    };
  }

  /**
   * Membangun mesh 3D ternormalisasi (ukuran maksimum ~2.2 unit dunia).
   */
  function buildMesh3D(shapeId, params) {
    const thinZ = 0.08;

    if (shapeId === "persegi") {
      const h = 1.0;
      const pts = [
        [-h, -h],
        [h, -h],
        [h, h],
        [-h, h],
      ];
      return extrudePolygon2D(pts, thinZ, [
        { from: [-h, -h - 0.2, 0], to: [h, -h - 0.2, 0], label: "s = " + fmt(params.s) },
      ]);
    }

    if (shapeId === "persegi-panjang") {
      const maxD = Math.max(params.p, params.l) || 1;
      const hw = (params.p / maxD) * 1.1;
      const hh = (params.l / maxD) * 1.1;
      const pts = [
        [-hw, -hh],
        [hw, -hh],
        [hw, hh],
        [-hw, hh],
      ];
      return extrudePolygon2D(pts, thinZ, [
        { from: [-hw, -hh - 0.2, 0], to: [hw, -hh - 0.2, 0], label: "p = " + fmt(params.p) },
        { from: [hw + 0.2, -hh, 0], to: [hw + 0.2, hh, 0], label: "l = " + fmt(params.l) },
      ]);
    }

    if (shapeId === "segitiga") {
      const maxD = Math.max(params.a, params.t) || 1;
      const hw = (params.a / maxD) * 1.1;
      const hh = (params.t / maxD) * 1.1;
      const pts = [
        [-hw, -hh],
        [hw, -hh],
        [0, hh],
      ];
      return extrudePolygon2D(pts, thinZ, [
        { from: [-hw, -hh - 0.2, 0], to: [hw, -hh - 0.2, 0], label: "a = " + fmt(params.a) },
        { from: [0, -hh, 0], to: [0, hh, 0], label: "t = " + fmt(params.t) },
      ]);
    }

    if (shapeId === "lingkaran") {
      const segs = 28;
      const rad = 1.1;
      const pts = [];
      for (let i = 0; i < segs; i += 1) {
        const ang = (i / segs) * Math.PI * 2;
        pts.push([Math.cos(ang) * rad, Math.sin(ang) * rad]);
      }
      const mesh = extrudePolygon2D(pts, thinZ, [
        { from: [0, 0, thinZ + 0.02], to: [rad, 0, thinZ + 0.02], label: "r = " + fmt(params.r) },
      ]);
      // Kurangi garis rusuk vertikal rapat pada lingkaran agar tampak bersih
      mesh.edges = mesh.edges.filter(function (_e, idx) {
        return idx % 3 !== 2;
      });
      return mesh;
    }

    if (shapeId === "trapesium") {
      const maxD = Math.max(params.a, params.b, params.t) || 1;
      const ha = (params.a / maxD) * 1.1;
      const hb = (params.b / maxD) * 1.1;
      const hh = (params.t / maxD) * 1.0;
      const pts = [
        [-hb, -hh],
        [hb, -hh],
        [ha, hh],
        [-ha, hh],
      ];
      return extrudePolygon2D(pts, thinZ, [
        { from: [-hb, -hh - 0.2, 0], to: [hb, -hh - 0.2, 0], label: "b = " + fmt(params.b) },
        { from: [-ha, hh + 0.2, 0], to: [ha, hh + 0.2, 0], label: "a = " + fmt(params.a) },
        { from: [0, -hh, 0], to: [0, hh, 0], label: "t = " + fmt(params.t) },
      ]);
    }

    if (shapeId === "jajar-genjang") {
      const shiftRaw = Math.sqrt(Math.max(0, params.b * params.b - params.t * params.t));
      const maxD = Math.max(params.a + shiftRaw, params.t) || 1;
      const w = (params.a / maxD) * 1.8;
      const h = (params.t / maxD) * 1.8;
      const sh = (shiftRaw / maxD) * 1.8;
      const cx = (w + sh) / 2;
      const cy = h / 2;
      const pts = [
        [-cx, -cy],
        [w - cx, -cy],
        [w + sh - cx, cy],
        [sh - cx, cy],
      ];
      return extrudePolygon2D(pts, thinZ, [
        { from: [-cx, -cy - 0.2, 0], to: [w - cx, -cy - 0.2, 0], label: "a = " + fmt(params.a) },
        { from: [sh - cx, -cy, 0], to: [sh - cx, cy, 0], label: "t = " + fmt(params.t) },
      ]);
    }

    // BANGUN RUANG: Kubus & Balok
    if (shapeId === "kubus" || shapeId === "balok") {
      const p = shapeId === "kubus" ? params.s : params.p;
      const l = shapeId === "kubus" ? params.s : params.l;
      const t = shapeId === "kubus" ? params.s : params.t;
      const maxD = Math.max(p, l, t) || 1;
      const hx = (p / maxD) * 1.0;
      const hy = (t / maxD) * 1.0;
      const hz = (l / maxD) * 1.0;

      const v = [
        [-hx, -hy, hz],
        [hx, -hy, hz],
        [hx, hy, hz],
        [-hx, hy, hz],
        [-hx, -hy, -hz],
        [hx, -hy, -hz],
        [hx, hy, -hz],
        [-hx, hy, -hz],
      ];
      const f = [
        { indices: [0, 1, 2, 3], role: "main" },
        { indices: [1, 5, 6, 2], role: "side" },
        { indices: [5, 4, 7, 6], role: "main" },
        { indices: [4, 0, 3, 7], role: "side" },
        { indices: [3, 2, 6, 7], role: "cap" },
        { indices: [4, 5, 1, 0], role: "cap" },
      ];
      const e = [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7],
      ];
      const guides =
        shapeId === "kubus"
          ? [{ from: [-hx, -hy - 0.2, hz], to: [hx, -hy - 0.2, hz], label: "s = " + fmt(params.s) }]
          : [
              { from: [-hx, -hy - 0.18, hz], to: [hx, -hy - 0.18, hz], label: "p = " + fmt(p) },
              { from: [hx + 0.18, -hy, hz], to: [hx + 0.18, -hy, -hz], label: "l = " + fmt(l) },
              { from: [-hx - 0.18, -hy, hz], to: [-hx - 0.18, hy, hz], label: "t = " + fmt(t) },
            ];
      return { vertices: v, faces: f, edges: e, guideLines: guides };
    }

    // Tabung
    if (shapeId === "tabung") {
      const maxD = Math.max(params.r * 2, params.t) || 1;
      const rad = (params.r / maxD) * 2.0;
      const hh = (params.t / maxD) * 1.05;
      const segs = 24;
      const v = [];
      const f = [];
      const e = [];
      const topCap = [];
      const botCap = [];

      for (let i = 0; i < segs; i += 1) {
        const ang = (i / segs) * Math.PI * 2;
        const x = Math.cos(ang) * rad;
        const z = Math.sin(ang) * rad;
        v.push([x, hh, z]);
      }
      for (let i = 0; i < segs; i += 1) {
        const ang = (i / segs) * Math.PI * 2;
        const x = Math.cos(ang) * rad;
        const z = Math.sin(ang) * rad;
        v.push([x, -hh, z]);
      }

      for (let i = 0; i < segs; i += 1) {
        const next = (i + 1) % segs;
        topCap.push(i);
        botCap.push(2 * segs - 1 - i);
        f.push({ indices: [i, next, segs + next, segs + i], role: "main" });
        e.push([i, next]);
        e.push([segs + i, segs + next]);
        if (i % 6 === 0) {
          e.push([i, segs + i]);
        }
      }
      f.push({ indices: topCap, role: "cap" });
      f.push({ indices: botCap, role: "cap" });

      return {
        vertices: v,
        faces: f,
        edges: e,
        guideLines: [
          { from: [0, hh, 0], to: [rad, hh, 0], label: "r = " + fmt(params.r) },
          { from: [0, -hh, 0], to: [0, hh, 0], label: "t = " + fmt(params.t) },
        ],
      };
    }

    // Kerucut
    if (shapeId === "kerucut") {
      const maxD = Math.max(params.r * 2, params.t) || 1;
      const rad = (params.r / maxD) * 2.0;
      const hh = (params.t / maxD) * 1.05;
      const segs = 24;
      const v = [[0, hh, 0]]; // puncak di indeks 0
      const f = [];
      const e = [];
      const baseCap = [];

      for (let i = 0; i < segs; i += 1) {
        const ang = (i / segs) * Math.PI * 2;
        v.push([Math.cos(ang) * rad, -hh, Math.sin(ang) * rad]);
      }

      for (let i = 0; i < segs; i += 1) {
        const curr = 1 + i;
        const next = 1 + ((i + 1) % segs);
        baseCap.push(1 + (segs - 1 - i));
        f.push({ indices: [0, next, curr], role: "main" });
        e.push([curr, next]);
        if (i % 6 === 0) {
          e.push([0, curr]);
        }
      }
      f.push({ indices: baseCap, role: "cap" });

      return {
        vertices: v,
        faces: f,
        edges: e,
        guideLines: [
          { from: [0, -hh, 0], to: [rad, -hh, 0], label: "r = " + fmt(params.r) },
          { from: [0, -hh, 0], to: [0, hh, 0], label: "t = " + fmt(params.t) },
        ],
      };
    }

    // Bola
    if (shapeId === "bola") {
      const rad = 1.15;
      const latBands = 12;
      const lonBands = 20;
      const v = [];
      const f = [];
      const e = [];

      for (let lat = 0; lat <= latBands; lat += 1) {
        const theta = (lat * Math.PI) / latBands;
        const sinT = Math.sin(theta);
        const cosT = Math.cos(theta);

        for (let lon = 0; lon < lonBands; lon += 1) {
          const phi = (lon * 2 * Math.PI) / lonBands;
          v.push([
            rad * Math.cos(phi) * sinT,
            rad * cosT,
            rad * Math.sin(phi) * sinT,
          ]);
        }
      }

      for (let lat = 0; lat < latBands; lat += 1) {
        for (let lon = 0; lon < lonBands; lon += 1) {
          const first = lat * lonBands + lon;
          const nextLon = lat * lonBands + ((lon + 1) % lonBands);
          const second = (lat + 1) * lonBands + lon;
          const secondNext = (lat + 1) * lonBands + ((lon + 1) % lonBands);

          f.push({ indices: [first, nextLon, secondNext, second], role: "main" });
          if (lat % 3 === 0) {
            e.push([first, nextLon]);
          }
          if (lon % 5 === 0) {
            e.push([first, second]);
          }
        }
      }

      return {
        vertices: v,
        faces: f,
        edges: e,
        guideLines: [
          { from: [0, 0, 0], to: [rad, 0, 0], label: "r = " + fmt(params.r) },
        ],
      };
    }

    // Limas Segi Empat
    if (shapeId === "limas-segiempat") {
      const maxD = Math.max(params.s, params.t) || 1;
      const hs = (params.s / maxD) * 1.0;
      const hh = (params.t / maxD) * 1.05;

      const v = [
        [0, hh, 0],
        [-hs, -hh, hs],
        [hs, -hh, hs],
        [hs, -hh, -hs],
        [-hs, -hh, -hs],
      ];
      const f = [
        { indices: [0, 1, 2], role: "main" },
        { indices: [0, 2, 3], role: "side" },
        { indices: [0, 3, 4], role: "main" },
        { indices: [0, 4, 1], role: "side" },
        { indices: [4, 3, 2, 1], role: "cap" },
      ];
      const e = [
        [1, 2], [2, 3], [3, 4], [4, 1],
        [0, 1], [0, 2], [0, 3], [0, 4],
      ];
      return {
        vertices: v,
        faces: f,
        edges: e,
        guideLines: [
          { from: [-hs, -hh - 0.16, hs], to: [hs, -hh - 0.16, hs], label: "s = " + fmt(params.s) },
          { from: [0, -hh, 0], to: [0, hh, 0], label: "t = " + fmt(params.t) },
        ],
      };
    }

    // Prisma Segitiga
    const maxD = Math.max(params.a, params.ta, params.tp) || 1;
    const ha = (params.a / maxD) * 1.0;
    const hta = (params.ta / maxD) * 1.0;
    const htp = (params.tp / maxD) * 1.05;

    const v = [
      [-ha, -htp, hta],
      [ha, -htp, hta],
      [0, -htp, -hta],
      [-ha, htp, hta],
      [ha, htp, hta],
      [0, htp, -hta],
    ];
    const f = [
      { indices: [0, 1, 4, 3], role: "main" },
      { indices: [1, 2, 5, 4], role: "side" },
      { indices: [2, 0, 3, 5], role: "side" },
      { indices: [3, 4, 5], role: "cap" },
      { indices: [2, 1, 0], role: "cap" },
    ];
    const e = [
      [0, 1], [1, 2], [2, 0],
      [3, 4], [4, 5], [5, 3],
      [0, 3], [1, 4], [2, 5],
    ];
    return {
      vertices: v,
      faces: f,
      edges: e,
      guideLines: [
        { from: [-ha, -htp - 0.16, hta], to: [ha, -htp - 0.16, hta], label: "a = " + fmt(params.a) },
        { from: [ha + 0.16, -htp, hta], to: [ha + 0.16, htp, hta], label: "tp = " + fmt(params.tp) },
      ],
    };
  }

  const SHAPE_SVGS = {
    persegi:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 64" width="76" height="58" aria-hidden="true">' +
      '<rect x="20" y="12" width="40" height="40" fill="var(--accent)" stroke="#000000" stroke-width="2" stroke-linejoin="round" />' +
      '<path d="M20 52 L60 12" stroke="#1E1C12" stroke-width="1.6" stroke-dasharray="3 3" />' +
      '<path d="M20 44 L28 44 L28 52" fill="none" stroke="#000000" stroke-width="1.6" />' +
      "</svg>",

    "persegi-panjang":
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 64" width="76" height="58" aria-hidden="true">' +
      '<rect x="11" y="16" width="58" height="32" fill="var(--accent-pink)" stroke="#000000" stroke-width="2" stroke-linejoin="round" />' +
      '<path d="M11 48 L69 16" stroke="#1E1C12" stroke-width="1.6" stroke-dasharray="3 3" />' +
      '<path d="M11 41 L18 41 L18 48" fill="none" stroke="#000000" stroke-width="1.6" />' +
      "</svg>",

    segitiga:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 64" width="76" height="58" aria-hidden="true">' +
      '<polygon points="40,10 13,52 67,52" fill="var(--accent)" stroke="#000000" stroke-width="2" stroke-linejoin="round" />' +
      '<line x1="40" y1="10" x2="40" y2="52" stroke="#1E1C12" stroke-width="1.6" stroke-dasharray="3 3" />' +
      '<path d="M40 45 L47 45 L47 52" fill="none" stroke="#000000" stroke-width="1.6" />' +
      "</svg>",

    lingkaran:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 64" width="76" height="58" aria-hidden="true">' +
      '<circle cx="40" cy="32" r="21" fill="var(--accent-pink)" stroke="#000000" stroke-width="2" />' +
      '<line x1="40" y1="32" x2="61" y2="32" stroke="#000000" stroke-width="2" />' +
      '<circle cx="40" cy="32" r="2.8" fill="#000000" />' +
      "</svg>",

    trapesium:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 64" width="76" height="58" aria-hidden="true">' +
      '<polygon points="24,14 56,14 68,50 12,50" fill="var(--accent)" stroke="#000000" stroke-width="2" stroke-linejoin="round" />' +
      '<line x1="24" y1="14" x2="24" y2="50" stroke="#1E1C12" stroke-width="1.6" stroke-dasharray="3 3" />' +
      '<path d="M24 43 L31 43 L31 50" fill="none" stroke="#000000" stroke-width="1.6" />' +
      "</svg>",

    "jajar-genjang":
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 64" width="76" height="58" aria-hidden="true">' +
      '<polygon points="24,14 68,14 56,50 12,50" fill="var(--accent-pink)" stroke="#000000" stroke-width="2" stroke-linejoin="round" />' +
      '<line x1="24" y1="14" x2="24" y2="50" stroke="#1E1C12" stroke-width="1.6" stroke-dasharray="3 3" />' +
      '<path d="M24 43 L31 43 L31 50" fill="none" stroke="#000000" stroke-width="1.6" />' +
      "</svg>",

    kubus:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 64" width="76" height="58" aria-hidden="true">' +
      '<polygon points="40,8 61,19 40,30 19,19" fill="var(--accent)" stroke="#000000" stroke-width="2" stroke-linejoin="round" />' +
      '<polygon points="19,19 40,30 40,55 19,44" fill="var(--accent-pink)" stroke="#000000" stroke-width="2" stroke-linejoin="round" />' +
      '<polygon points="40,30 61,19 61,44 40,55" fill="var(--core-cobalt)" stroke="#000000" stroke-width="2" stroke-linejoin="round" />' +
      "</svg>",

    balok:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 64" width="76" height="58" aria-hidden="true">' +
      '<polygon points="44,10 69,20 35,32 11,22" fill="var(--accent)" stroke="#000000" stroke-width="2" stroke-linejoin="round" />' +
      '<polygon points="11,22 35,32 35,52 11,42" fill="var(--accent-pink)" stroke="#000000" stroke-width="2" stroke-linejoin="round" />' +
      '<polygon points="35,32 69,20 69,40 35,52" fill="var(--core-cobalt)" stroke="#000000" stroke-width="2" stroke-linejoin="round" />' +
      "</svg>",

    tabung:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 64" width="76" height="58" aria-hidden="true">' +
      '<path d="M20 17 L20 47 A20 7.5 0 0 0 60 47 L60 17 Z" fill="var(--accent-pink)" stroke="#000000" stroke-width="2" stroke-linejoin="round" />' +
      '<ellipse cx="40" cy="17" rx="20" ry="7.5" fill="var(--accent)" stroke="#000000" stroke-width="2" />' +
      '<path d="M20 47 A20 7.5 0 0 1 60 47" fill="none" stroke="#1E1C12" stroke-width="1.5" stroke-dasharray="3 3" />' +
      "</svg>",

    kerucut:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 64" width="76" height="58" aria-hidden="true">' +
      '<path d="M40 8 L18 47 A22 7.5 0 0 0 62 47 Z" fill="var(--accent)" stroke="#000000" stroke-width="2" stroke-linejoin="round" />' +
      '<path d="M40 8 L40 54.5 A22 7.5 0 0 0 62 47 Z" fill="var(--accent-pink)" stroke="#000000" stroke-width="2" stroke-linejoin="round" />' +
      '<path d="M18 47 A22 7.5 0 0 1 62 47" fill="none" stroke="#1E1C12" stroke-width="1.5" stroke-dasharray="3 3" />' +
      "</svg>",

    bola:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 64" width="76" height="58" aria-hidden="true">' +
      '<circle cx="40" cy="32" r="22" fill="var(--accent)" stroke="#000000" stroke-width="2" />' +
      '<path d="M40 10 A22 22 0 0 1 40 54 A12 22 0 0 0 40 10 Z" fill="var(--accent-pink)" stroke="#000000" stroke-width="1.6" />' +
      '<ellipse cx="40" cy="32" rx="22" ry="7" fill="none" stroke="#000000" stroke-width="1.75" />' +
      '<circle cx="31" cy="22" r="3" fill="var(--core-cobalt)" />' +
      "</svg>",

    "limas-segiempat":
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 64" width="76" height="58" aria-hidden="true">' +
      '<polygon points="40,8 15,44 43,54" fill="var(--accent)" stroke="#000000" stroke-width="2" stroke-linejoin="round" />' +
      '<polygon points="40,8 43,54 65,42" fill="var(--accent-pink)" stroke="#000000" stroke-width="2" stroke-linejoin="round" />' +
      '<path d="M15 44 L37 33 L65 42" fill="none" stroke="#1E1C12" stroke-width="1.4" stroke-dasharray="3 3" />' +
      "</svg>",

    "prisma-segitiga":
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 64" width="76" height="58" aria-hidden="true">' +
      '<polygon points="14,50 44,50 29,21" fill="var(--accent)" stroke="#000000" stroke-width="2" stroke-linejoin="round" />' +
      '<polygon points="29,21 51,12 66,41 44,50" fill="var(--accent-pink)" stroke="#000000" stroke-width="2" stroke-linejoin="round" />' +
      '<path d="M14 50 L36 41 L66 41 M29 21 L36 41" fill="none" stroke="#1E1C12" stroke-width="1.4" stroke-dasharray="3 3" />' +
      "</svg>",
  };

  function getShapeSvg(shapeId) {
    return SHAPE_SVGS[shapeId] || "";
  }

  const api = {
    SHAPES: SHAPES,
    calculateShape: calculateShape,
    buildMesh3D: buildMesh3D,
    getShapeSvg: getShapeSvg,
    formatValue: fmt,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.HitungGeometry = api;
})(typeof window !== "undefined" ? window : globalThis);
