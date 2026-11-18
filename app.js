/* ==========================================================================
   Hitung: Pengendali Antarmuka, Status UI, Grafik f(x), & Papan Ketik
   ========================================================================== */

(function () {
  "use strict";

  const STORAGE_KEYS = {
    theme: "hitung-theme",
    history: "hitung-history",
  };

  const state = {
    mode: "standar",
    angleUnit: "DEG",
    history: [],
    storageError: false,
    lastFxRunId: 0,
    fxHasActiveData: true,
  };

  // Elemen DOM Utama
  const htmlEl = document.documentElement;
  const themeToggleBtn = document.getElementById("theme-toggle");
  const themeLabelEl = document.getElementById("theme-label");
  const mobileMenuBtn = document.getElementById("mobile-menu-toggle");
  const mobileNavPanel = document.getElementById("mobile-nav-panel");

  const focusCalcBtn = document.getElementById("focus-calc-btn");
  const jumpToInputBtn = document.getElementById("jump-to-input-btn");

  const tabButtons = document.querySelectorAll(".mode-tab[data-mode]");
  const sciKeysPanel = document.getElementById("calc-sci-keys");
  const angleToggleBtn = document.getElementById("angle-toggle");
  const historyToggleBtn = document.getElementById("history-toggle");
  const historyCountEl = document.getElementById("history-count");
  const historyPanel = document.getElementById("calc-history-panel");
  const historyStorageErr = document.getElementById("history-storage-error");
  const historyEmptyEl = document.getElementById("history-empty");
  const historyListEl = document.getElementById("history-list");
  const clearHistoryBtn = document.getElementById("clear-history-btn");
  const loadSampleBtn = document.getElementById("load-sample-calc");

  const exprInput = document.getElementById("calc-expression");
  const prevExprEl = document.getElementById("calc-prev-expr");
  const statusBadgeEl = document.getElementById("calc-status-badge");
  const resultEl = document.getElementById("calc-result");
  const calcErrorEl = document.getElementById("calc-error");
  const calcErrorTextEl = document.getElementById("calc-error-text");

  const fxForm = document.getElementById("fx-form");
  const fxFormulaInput = document.getElementById("fx-formula");
  const fxMinInput = document.getElementById("fx-min");
  const fxMaxInput = document.getElementById("fx-max");
  const fxStepInput = document.getElementById("fx-step");
  const fxClearBtn = document.getElementById("fx-clear-btn");
  const fxAngleNoteEl = document.getElementById("fx-angle-note");
  const fxStateEmpty = document.getElementById("fx-state-empty");
  const fxStateLoading = document.getElementById("fx-state-loading");
  const fxLoadingText = document.getElementById("fx-loading-text");
  const fxStateError = document.getElementById("fx-state-error");
  const fxErrorText = document.getElementById("fx-error-text");
  const fxStateReady = document.getElementById("fx-state-ready");
  const fxSvg = document.getElementById("fx-svg");
  const fxTableBody = document.getElementById("fx-table-body");
  const presetButtons = document.querySelectorAll(".preset-chip");

  const resetAllBtn = document.getElementById("reset-all-btn");
  const footerStatusEl = document.getElementById("footer-status");

  /* ------------------------------------------------------------------------
     Utilitas Penyimpanan Lokal Aman
     ------------------------------------------------------------------------ */
  function readStorage(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (_err) {
      state.storageError = true;
      return null;
    }
  }

  function writeStorage(key, value) {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (_err) {
      state.storageError = true;
      return false;
    }
  }

  function removeStorage(key) {
    try {
      window.localStorage.removeItem(key);
    } catch (_err) {
      state.storageError = true;
    }
  }

  /* ------------------------------------------------------------------------
     Tema Terang & Gelap (R-21, R-34)
     ------------------------------------------------------------------------ */
  const colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');

  function applyTheme(theme, explicitOverride) {
    const nextTheme = theme === "dark" ? "dark" : "light";
    htmlEl.setAttribute("data-theme", nextTheme);
    if (colorSchemeMeta) {
      colorSchemeMeta.content = explicitOverride ? nextTheme : "light dark";
    }

    const isDark = nextTheme === "dark";
    themeToggleBtn.setAttribute("aria-pressed", String(isDark));
    themeToggleBtn.setAttribute(
      "aria-label",
      isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap"
    );
    themeLabelEl.textContent = isDark ? "Mode Terang" : "Mode Gelap";

    const sunIcon = themeToggleBtn.querySelector(".theme-icon-sun");
    const moonIcon = themeToggleBtn.querySelector(".theme-icon-moon");
    if (sunIcon && moonIcon) {
      sunIcon.hidden = !isDark;
      moonIcon.hidden = isDark;
    }

    if (typeof state.redrawGeoViewer === "function") {
      state.redrawGeoViewer();
    }
  }

  function initTheme() {
    const saved = readStorage(STORAGE_KEYS.theme);
    if (saved === "dark" || saved === "light") {
      applyTheme(saved, true);
      return;
    }
    const prefersDark =
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(prefersDark ? "dark" : "light", false);
  }

  themeToggleBtn.addEventListener("click", function () {
    const current = htmlEl.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next, true);
    writeStorage(STORAGE_KEYS.theme, next);
  });

  window.addEventListener("storage", function (event) {
    if (event.key === STORAGE_KEYS.theme) {
      initTheme();
    }
  });

  /* ------------------------------------------------------------------------
     Menu Seluler (Aksesibel Keyboard & Escape)
     ------------------------------------------------------------------------ */
  function setMobileMenuOpen(open) {
    mobileMenuBtn.setAttribute("aria-expanded", String(open));
    mobileNavPanel.hidden = !open;
  }

  mobileMenuBtn.addEventListener("click", function () {
    const isOpen = mobileMenuBtn.getAttribute("aria-expanded") === "true";
    setMobileMenuOpen(!isOpen);
  });

  mobileNavPanel.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      setMobileMenuOpen(false);
    });
  });

  /* ------------------------------------------------------------------------
     Pita Riwayat Hitung
     ------------------------------------------------------------------------ */
  function loadHistory() {
    const raw = readStorage(STORAGE_KEYS.history);
    if (!raw) {
      state.history = [];
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        state.history = parsed.filter(function (item) {
          return item && typeof item.expr === "string" && typeof item.result === "string";
        });
      }
    } catch (_err) {
      state.history = [];
      removeStorage(STORAGE_KEYS.history);
    }
  }

  function saveHistory() {
    writeStorage(STORAGE_KEYS.history, JSON.stringify(state.history.slice(0, 20)));
  }

  function renderHistory() {
    historyCountEl.textContent = String(state.history.length);
    historyStorageErr.hidden = !state.storageError;

    if (state.history.length === 0) {
      historyEmptyEl.hidden = false;
      historyListEl.hidden = true;
      historyListEl.replaceChildren();
      return;
    }

    historyEmptyEl.hidden = true;
    historyListEl.hidden = false;
    historyListEl.replaceChildren();

    state.history.forEach(function (entry) {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "history-item-btn";
      btn.setAttribute("aria-label", "Muat ulang perhitungan " + entry.expr + " sama dengan " + entry.result);

      const exprSpan = document.createElement("span");
      exprSpan.className = "history-item-expr";
      exprSpan.textContent = entry.expr + " =";

      const resSpan = document.createElement("span");
      resSpan.className = "history-item-res";
      resSpan.textContent = entry.result;

      btn.appendChild(exprSpan);
      btn.appendChild(resSpan);
      btn.addEventListener("click", function () {
        exprInput.value = entry.expr;
        evaluateCurrent(false);
        exprInput.focus();
      });

      li.appendChild(btn);
      historyListEl.appendChild(li);
    });
  }

  function pushHistory(expr, result) {
    const cleanExpr = expr.trim();
    if (!cleanExpr) return;
    if (
      state.history.length > 0 &&
      state.history[0].expr === cleanExpr &&
      state.history[0].result === result
    ) {
      return;
    }
    state.history.unshift({ expr: cleanExpr, result: result });
    if (state.history.length > 20) {
      state.history.length = 20;
    }
    saveHistory();
    renderHistory();
  }

  historyToggleBtn.addEventListener("click", function () {
    const isExpanded = historyToggleBtn.getAttribute("aria-expanded") === "true";
    historyToggleBtn.setAttribute("aria-expanded", String(!isExpanded));
    historyPanel.hidden = isExpanded;
  });

  clearHistoryBtn.addEventListener("click", function () {
    state.history = [];
    saveHistory();
    renderHistory();
  });

  loadSampleBtn.addEventListener("click", function () {
    exprInput.value = "125 * (4 + 8)";
    evaluateCurrent(true);
  });

  /* ------------------------------------------------------------------------
     Logika Layar & Keypad Kalkulator
     ------------------------------------------------------------------------ */
  function setStatus(label, isError) {
    statusBadgeEl.textContent = label;
    if (isError) {
      statusBadgeEl.classList.add("is-error");
    } else {
      statusBadgeEl.classList.remove("is-error");
    }
  }

  function showCalcError(message) {
    calcErrorTextEl.textContent = message;
    calcErrorEl.hidden = false;
    setStatus("GALAT", true);
  }

  function hideCalcError() {
    calcErrorTextEl.textContent = "";
    calcErrorEl.hidden = true;
  }

  function previewCurrent() {
    const expr = exprInput.value.trim();
    hideCalcError();

    if (!expr) {
      prevExprEl.textContent = "Siap menghitung";
      resultEl.textContent = "0";
      setStatus("SIAP", false);
      return;
    }

    try {
      const value = window.HitungMath.evaluateExpression(expr, {
        angleUnit: state.angleUnit,
      });
      resultEl.textContent = window.HitungMath.formatResult(value);
      setStatus("PRATINJAU", false);
    } catch (_err) {
      // Saat mengetik ekspresi belum lengkap (misal "sin("), jangan ganggu dengan banner error
      setStatus("MENGETIK", false);
    }
  }

  function evaluateCurrent(saveToHistory) {
    const expr = exprInput.value.trim();
    if (!expr) {
      showCalcError("Masukkan ekspresi matematika terlebih dahulu sebelum menekan =.");
      resultEl.textContent = "0";
      return;
    }

    try {
      const value = window.HitungMath.evaluateExpression(expr, {
        angleUnit: state.angleUnit,
      });
      const formatted = window.HitungMath.formatResult(value);
      hideCalcError();
      prevExprEl.textContent = expr + " =";
      resultEl.textContent = formatted;
      setStatus("HASIL", false);

      if (saveToHistory) {
        pushHistory(expr, formatted);
      }
    } catch (err) {
      showCalcError(err.message);
    }
  }

  function insertTextAtCursor(text) {
    const start = exprInput.selectionStart;
    const end = exprInput.selectionEnd;
    const current = exprInput.value;

    if (typeof start === "number" && typeof end === "number") {
      exprInput.value = current.slice(0, start) + text + current.slice(end);
      const nextPos = start + text.length;
      exprInput.setSelectionRange(nextPos, nextPos);
    } else {
      exprInput.value = current + text;
    }
    previewCurrent();
  }

  function handleBackspace() {
    const start = exprInput.selectionStart;
    const end = exprInput.selectionEnd;
    const current = exprInput.value;

    if (!current) return;

    if (typeof start === "number" && typeof end === "number" && start !== end) {
      exprInput.value = current.slice(0, start) + current.slice(end);
      exprInput.setSelectionRange(start, start);
    } else if (typeof start === "number" && start > 0) {
      exprInput.value = current.slice(0, start - 1) + current.slice(start);
      exprInput.setSelectionRange(start - 1, start - 1);
    } else {
      exprInput.value = current.slice(0, -1);
    }
    previewCurrent();
  }

  function clearCalculator() {
    exprInput.value = "";
    prevExprEl.textContent = "Siap menghitung";
    resultEl.textContent = "0";
    hideCalcError();
    setStatus("SIAP", false);
  }

  function toggleSign() {
    const val = exprInput.value.trim();
    if (!val) {
      insertTextAtCursor("-");
      return;
    }
    if (val.startsWith("-(") && val.endsWith(")")) {
      exprInput.value = val.slice(2, -1);
    } else if (/^-[0-9.]+$/.test(val)) {
      exprInput.value = val.slice(1);
    } else if (/^[0-9.]+$/.test(val)) {
      exprInput.value = "-" + val;
    } else {
      exprInput.value = "-(" + val + ")";
    }
    previewCurrent();
  }

  function flashKeyButton(keyToken) {
    const matchingBtn = document.querySelector('.key[data-insert="' + keyToken + '"]');
    if (!matchingBtn) return;
    matchingBtn.classList.add("is-pressed");
    window.setTimeout(function () {
      matchingBtn.classList.remove("is-pressed");
    }, 110);
  }

  function syncTabState(tabs, activeTab) {
    tabs.forEach(function (btn) {
      const active = btn === activeTab;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", String(active));
      btn.setAttribute("tabindex", active ? "0" : "-1");
      btn.toggleAttribute("focusgroupstart", active);
    });
  }

  function bindTablistKeyboard(tablistEl) {
    if (!tablistEl) return;
    tablistEl.addEventListener("keydown", function (event) {
      const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
      if (!keys.includes(event.key)) return;
      const tabs = Array.from(tablistEl.querySelectorAll('[role="tab"]'));
      if (tabs.length === 0) return;
      const idx = tabs.indexOf(document.activeElement);
      if (idx === -1) return;
      event.preventDefault();
      let nextIdx = idx;
      if (event.key === "ArrowRight") nextIdx = (idx + 1) % tabs.length;
      else if (event.key === "ArrowLeft") nextIdx = (idx - 1 + tabs.length) % tabs.length;
      else if (event.key === "Home") nextIdx = 0;
      else if (event.key === "End") nextIdx = tabs.length - 1;
      tabs[nextIdx].focus();
      tabs[nextIdx].click();
    });
  }

  document.querySelectorAll('[role="tablist"]').forEach(bindTablistKeyboard);

  // Tab Standar vs Ilmiah
  tabButtons.forEach(function (tabBtn) {
    tabBtn.addEventListener("click", function () {
      const nextMode = tabBtn.getAttribute("data-mode");
      state.mode = nextMode;
      syncTabState(tabButtons, tabBtn);
      sciKeysPanel.hidden = nextMode !== "ilmiah";
    });
  });

  // Tombol Satuan Sudut DEG / RAD
  angleToggleBtn.addEventListener("click", function () {
    state.angleUnit = state.angleUnit === "DEG" ? "RAD" : "DEG";
    angleToggleBtn.textContent = state.angleUnit;
    angleToggleBtn.setAttribute("aria-pressed", String(state.angleUnit === "RAD"));
    fxAngleNoteEl.textContent = state.angleUnit;
    previewCurrent();
    if (state.fxHasActiveData) {
      runFxEvaluation();
    }
  });

  // Klik tombol keypad kalkulator
  document.querySelectorAll(".key").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const insertVal = btn.getAttribute("data-insert");
      const action = btn.getAttribute("data-action");

      if (insertVal !== null) {
        insertTextAtCursor(insertVal);
        return;
      }

      if (action === "clear") {
        clearCalculator();
      } else if (action === "backspace") {
        handleBackspace();
      } else if (action === "negate") {
        toggleSign();
      } else if (action === "evaluate") {
        evaluateCurrent(true);
      }
    });
  });

  // Input langsung & pintasan keyboard di layar kalkulator
  exprInput.addEventListener("input", previewCurrent);

  exprInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter" || event.key === "=") {
      event.preventDefault();
      if (event.isComposing || event.keyCode === 229) {
        return;
      }
      const eqBtn = document.querySelector('.key[data-action="evaluate"]');
      if (eqBtn) {
        eqBtn.classList.add("is-pressed");
        window.setTimeout(function () {
          eqBtn.classList.remove("is-pressed");
        }, 110);
      }
      evaluateCurrent(true);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      clearCalculator();
      return;
    }

    if (/^[0-9+\-*/^().%]$/.test(event.key)) {
      flashKeyButton(event.key);
    }
  });

  // Tombol Fokus CTA ke layar kalkulator
  function scrollAndFocusCalc() {
    const section = document.getElementById("kalkulator");
    if (section) {
      const reduced =
        window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      section.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    }
    window.setTimeout(function () {
      exprInput.focus();
    }, 180);
  }

  focusCalcBtn.addEventListener("click", scrollAndFocusCalc);
  jumpToInputBtn.addEventListener("click", scrollAndFocusCalc);

  /* ------------------------------------------------------------------------
     Workbench Tabel & Kurva SVG f(x) (dengan status Empty / Loading / Error)
     ------------------------------------------------------------------------ */
  function showFxView(viewName, errorMessage) {
    fxStateEmpty.hidden = viewName !== "empty";
    fxStateLoading.hidden = viewName !== "loading";
    fxStateError.hidden = viewName !== "error";
    fxStateReady.hidden = viewName !== "ready";

    if (viewName === "error") {
      fxErrorText.textContent = errorMessage || "Terjadi kesalahan perhitungan.";
    }
  }

  const SVG_NS = "http://www.w3.org/2000/svg";

  function createSvgEl(tag, attrs, text) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs).forEach(function (k) {
      el.setAttribute(k, String(attrs[k]));
    });
    if (text !== undefined) {
      el.textContent = text;
    }
    return el;
  }

  function renderFxPlotAndTable(points, formulaLabel) {
    fxTableBody.replaceChildren();
    points.forEach(function (pt) {
      const tr = document.createElement("tr");
      const tdX = document.createElement("td");
      const tdY = document.createElement("td");

      tdX.textContent = window.HitungMath.formatResult(pt.x);
      if (pt.valid) {
        tdY.textContent = window.HitungMath.formatResult(pt.y);
      } else {
        tdY.textContent = "Tak terdefinisi";
        tdY.className = "cell-undefined";
      }

      tr.appendChild(tdX);
      tr.appendChild(tdY);
      fxTableBody.appendChild(tr);
    });

    // Bangun koordinat SVG dari titik valid
    const validPoints = points.filter(function (pt) {
      return pt.valid;
    });

    const width = 560;
    const height = 240;
    const padLeft = 48;
    const padRight = 20;
    const padTop = 20;
    const padBottom = 32;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    if (validPoints.length === 0) {
      fxSvg.replaceChildren(
        createSvgEl(
          "text",
          {
            x: 280,
            y: 120,
            "text-anchor": "middle",
            fill: "currentColor",
            "font-family": "IBM Plex Mono, monospace",
            "font-size": 13,
          },
          "Tidak ada titik terdefinisi pada rentang ini."
        )
      );
      return;
    }

    const minX = points[0].x;
    const maxX = points[points.length - 1].x;
    let minY = Math.min.apply(
      null,
      validPoints.map(function (p) {
        return p.y;
      })
    );
    let maxY = Math.max.apply(
      null,
      validPoints.map(function (p) {
        return p.y;
      })
    );

    if (minY === maxY) {
      minY -= 1;
      maxY += 1;
    } else {
      const yMargin = (maxY - minY) * 0.1;
      minY -= yMargin;
      maxY += yMargin;
    }

    function mapX(val) {
      return padLeft + ((val - minX) / (maxX - minX || 1)) * plotW;
    }

    function mapY(val) {
      return padTop + plotH - ((val - minY) / (maxY - minY || 1)) * plotH;
    }

    const svgNodes = [];

    // Bingkai area plot
    svgNodes.push(
      createSvgEl("rect", {
        x: padLeft,
        y: padTop,
        width: plotW,
        height: plotH,
        fill: "none",
        stroke: "var(--border-subtle)",
        "stroke-width": 1,
      })
    );

    // Garis sumbu X = 0 dan Y = 0 jika berada dalam rentang
    if (minX <= 0 && maxX >= 0) {
      const zx = mapX(0).toFixed(1);
      svgNodes.push(
        createSvgEl("line", {
          x1: zx,
          y1: padTop,
          x2: zx,
          y2: padTop + plotH,
          stroke: "var(--ink-muted)",
          "stroke-width": 1.25,
          "stroke-dasharray": "4 3",
        })
      );
    }

    if (minY <= 0 && maxY >= 0) {
      const zy = mapY(0).toFixed(1);
      svgNodes.push(
        createSvgEl("line", {
          x1: padLeft,
          y1: zy,
          x2: padLeft + plotW,
          y2: zy,
          stroke: "var(--ink-muted)",
          "stroke-width": 1.25,
          "stroke-dasharray": "4 3",
        })
      );
    }

    // Pisahkan segmen garis bila terdapat titik tak terdefinisi (mis. asimtot 1/x)
    const segments = [];
    let currentSegment = [];
    points.forEach(function (pt) {
      if (pt.valid) {
        currentSegment.push(mapX(pt.x).toFixed(1) + "," + mapY(pt.y).toFixed(1));
      } else if (currentSegment.length > 0) {
        segments.push(currentSegment);
        currentSegment = [];
      }
    });
    if (currentSegment.length > 0) {
      segments.push(currentSegment);
    }

    segments.forEach(function (seg) {
      if (seg.length >= 2) {
        svgNodes.push(
          createSvgEl("polyline", {
            fill: "none",
            stroke: "var(--core-cobalt)",
            "stroke-width": 2.75,
            "stroke-linejoin": "round",
            "stroke-linecap": "round",
            points: seg.join(" "),
          })
        );
      }
    });

    // Penanda titik hasil evaluasi bergaya Neubrutalist
    validPoints.forEach(function (pt) {
      svgNodes.push(
        createSvgEl("circle", {
          cx: mapX(pt.x).toFixed(1),
          cy: mapY(pt.y).toFixed(1),
          r: 4,
          fill: "var(--accent-pink)",
          stroke: "var(--border-strong)",
          "stroke-width": 1.5,
        })
      );
    });

    // Label batas sumbu
    svgNodes.push(
      createSvgEl(
        "text",
        {
          x: padLeft,
          y: height - 8,
          fill: "var(--ink-muted)",
          "font-family": "IBM Plex Mono, monospace",
          "font-size": 11,
        },
        "x: " + window.HitungMath.formatResult(minX)
      ),
      createSvgEl(
        "text",
        {
          x: padLeft + plotW,
          y: height - 8,
          "text-anchor": "end",
          fill: "var(--ink-muted)",
          "font-family": "IBM Plex Mono, monospace",
          "font-size": 11,
        },
        "x: " + window.HitungMath.formatResult(maxX)
      ),
      createSvgEl(
        "text",
        {
          x: padLeft - 6,
          y: padTop + 10,
          "text-anchor": "end",
          fill: "var(--ink-muted)",
          "font-family": "IBM Plex Mono, monospace",
          "font-size": 11,
        },
        window.HitungMath.formatResult(maxY)
      ),
      createSvgEl(
        "text",
        {
          x: padLeft - 6,
          y: padTop + plotH,
          "text-anchor": "end",
          fill: "var(--ink-muted)",
          "font-family": "IBM Plex Mono, monospace",
          "font-size": 11,
        },
        window.HitungMath.formatResult(minY)
      )
    );

    fxSvg.setAttribute("aria-label", "Grafik fungsi f(x) = " + formulaLabel);
    fxSvg.replaceChildren.apply(fxSvg, svgNodes);
  }

  function runFxEvaluation() {
    const formula = fxFormulaInput.value.trim();
    const xMin = Number(fxMinInput.value);
    const xMax = Number(fxMaxInput.value);
    const step = Number(fxStepInput.value);

    if (!formula) {
      state.fxHasActiveData = false;
      showFxView("error", "Rumus f(x) masih kosong. Masukkan rumus seperti x^2 - 4.");
      return;
    }

    if (!Number.isFinite(xMin) || !Number.isFinite(xMax) || !Number.isFinite(step)) {
      state.fxHasActiveData = false;
      showFxView("error", "Nilai x awal, x akhir, dan langkah harus berupa angka yang sah.");
      return;
    }

    if (step <= 0) {
      state.fxHasActiveData = false;
      showFxView("error", "Nilai langkah (step) harus lebih besar dari 0.");
      return;
    }

    if (xMin >= xMax) {
      state.fxHasActiveData = false;
      showFxView("error", "Nilai x awal harus lebih kecil dari nilai x akhir.");
      return;
    }

    const estimatedPoints = Math.floor((xMax - xMin) / step) + 1;
    if (estimatedPoints > 200) {
      state.fxHasActiveData = false;
      showFxView(
        "error",
        "Rentang menghasilkan lebih dari 200 titik (" +
          estimatedPoints +
          "). Perbesar langkah agar grafik dan tabel tetap terbaca."
      );
      return;
    }

    // Validasi awal sintaks ekspresi pada titik pertama sebelum merender grafik
    try {
      window.HitungMath.evaluateExpression(formula, {
        angleUnit: state.angleUnit,
        xValue: xMin,
      });
    } catch (err) {
      // Jika gagal hanya karena domain pada titik awal (mis. 1/0), biarkan proses lanjut;
      // jika gagal karena sintaks/simbol tak dikenal, tampilkan error langsung.
      if (!/nol|negatif|asimtot|Logaritma/.test(err.message)) {
        state.fxHasActiveData = false;
        showFxView("error", err.message);
        return;
      }
    }

    state.lastFxRunId += 1;
    const currentRunId = state.lastFxRunId;
    fxLoadingText.textContent = "Menghitung " + estimatedPoints + " titik nilai untuk f(x) = " + formula + "...";
    showFxView("loading");

    // Eksekusi asinkron per batch frame agar status loading benar-benar terlihat dan antarmuka responsif
    window.requestAnimationFrame(function () {
      if (currentRunId !== state.lastFxRunId) return;

      const points = [];
      for (let i = 0; i < estimatedPoints; i += 1) {
        const xVal = Number((xMin + i * step).toPrecision(12));
        if (xVal > xMax + 1e-12) break;

        try {
          const yVal = window.HitungMath.evaluateExpression(formula, {
            angleUnit: state.angleUnit,
            xValue: xVal,
          });
          points.push({ x: xVal, y: yVal, valid: true });
        } catch (_domainErr) {
          points.push({ x: xVal, y: NaN, valid: false });
        }
      }

      state.fxHasActiveData = true;
      renderFxPlotAndTable(points, formula);
      showFxView("ready");
    });
  }

  fxForm.addEventListener("submit", function (event) {
    event.preventDefault();
    runFxEvaluation();
  });

  fxClearBtn.addEventListener("click", function () {
    state.lastFxRunId += 1;
    state.fxHasActiveData = false;
    fxFormulaInput.value = "";
    fxTableBody.replaceChildren();
    fxSvg.replaceChildren();
    showFxView("empty");
    fxFormulaInput.focus();
  });

  presetButtons.forEach(function (chip) {
    chip.addEventListener("click", function () {
      fxFormulaInput.value = chip.getAttribute("data-formula") || "";
      fxMinInput.value = chip.getAttribute("data-min") || "-4";
      fxMaxInput.value = chip.getAttribute("data-max") || "4";
      fxStepInput.value = chip.getAttribute("data-step") || "1";
      runFxEvaluation();
    });
  });

  /* ------------------------------------------------------------------------
     Workbench Geometri Bangun Datar & Bangun Ruang 2D/3D
     ------------------------------------------------------------------------ */
  const geoCatButtons = document.querySelectorAll("[data-geo-cat]");
  const geoShapeListEl = document.getElementById("geo-shape-list");
  const geoActiveTitleEl = document.getElementById("geo-active-title");
  const geoActiveDescEl = document.getElementById("geo-active-desc");
  const geoForm = document.getElementById("geo-form");
  const geoFieldsContainer = document.getElementById("geo-fields-container");
  const geoClearBtn = document.getElementById("geo-clear-btn");
  const geoDefaultBtn = document.getElementById("geo-default-btn");

  const geoStateEmpty = document.getElementById("geo-state-empty");
  const geoStateLoading = document.getElementById("geo-state-loading");
  const geoStateError = document.getElementById("geo-state-error");
  const geoErrorText = document.getElementById("geo-error-text");
  const geoStateReady = document.getElementById("geo-state-ready");
  const geoMetricsList = document.getElementById("geo-metrics-list");
  const geoStepsList = document.getElementById("geo-steps-list");

  const geoView3DBtn = document.getElementById("geo-view-3d");
  const geoView2DBtn = document.getElementById("geo-view-2d");
  const geoWireframeBtn = document.getElementById("geo-wireframe-btn");
  const geoAutoRotateBtn = document.getElementById("geo-autorotate-btn");
  const geoZoomOutBtn = document.getElementById("geo-zoom-out");
  const geoZoomInBtn = document.getElementById("geo-zoom-in");
  const geoResetViewBtn = document.getElementById("geo-reset-view");
  const geoCanvas = document.getElementById("geo-canvas");
  const geoAngleReadoutEl = document.getElementById("geo-angle-readout");

  const geoState = {
    category: "ruang",
    shapeId: "kubus",
    viewMode: "3d",
    wireframe: false,
    autoRotate: false,
    runId: 0,
  };

  const geoViewer = window.HitungViewer3D.createGeometryViewer(geoCanvas, {
    onAngleChange: function (info) {
      if (info.viewMode === "3d") {
        geoAngleReadoutEl.textContent =
          "Mode 3D | Sudut X: " +
          info.degX +
          "°, Y: " +
          info.degY +
          "° | Skala: " +
          info.zoomPct +
          "%";
      } else {
        geoAngleReadoutEl.textContent =
          "Mode 2D | Rotasi Bidang: " +
          info.deg2D +
          "° | Skala: " +
          info.zoomPct +
          "%";
      }
    },
  });

  state.redrawGeoViewer = function () {
    geoViewer.redraw();
  };

  function showGeoView(viewName, errMsg) {
    geoStateEmpty.hidden = viewName !== "empty";
    geoStateLoading.hidden = viewName !== "loading";
    geoStateError.hidden = viewName !== "error";
    geoStateReady.hidden = viewName !== "ready";

    if (viewName === "error") {
      geoErrorText.textContent = errMsg || "Input ukuran tidak valid.";
    }
  }

  const domParser = new DOMParser();

  function renderGeoShapeButtons() {
    geoShapeListEl.replaceChildren();
    const shapes = window.HitungGeometry.SHAPES;
    const shapeIds = Object.keys(shapes).filter(function (id) {
      return shapes[id].category === geoState.category;
    });
    geoShapeListEl.setAttribute("data-count", String(shapeIds.length));

    shapeIds.forEach(function (id) {
      const item = shapes[id];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.role = "tab";
      const isSelected = id === geoState.shapeId;
      btn.className = "geo-shape-chip" + (isSelected ? " is-active" : "");
      btn.setAttribute("aria-selected", String(isSelected));
      btn.setAttribute("tabindex", isSelected ? "0" : "-1");
      btn.toggleAttribute("focusgroupstart", isSelected);

      const thumb = document.createElement("span");
      thumb.className = "geo-shape-thumb";
      const parsedSvg = domParser.parseFromString(
        window.HitungGeometry.getShapeSvg(id),
        "image/svg+xml"
      ).documentElement;
      if (parsedSvg && parsedSvg.namespaceURI === SVG_NS) {
        thumb.replaceChildren(document.importNode(parsedSvg, true));
      }

      const label = document.createElement("span");
      label.className = "geo-shape-name";
      label.textContent = item.name;

      btn.appendChild(thumb);
      btn.appendChild(label);
      btn.addEventListener("click", function () {
        selectGeoShape(id);
      });
      geoShapeListEl.appendChild(btn);
    });
  }

  function renderGeoFields(useDefaults) {
    const spec = window.HitungGeometry.SHAPES[geoState.shapeId];
    if (!spec) return;

    geoActiveTitleEl.textContent = spec.name;
    geoActiveDescEl.textContent = spec.summary;
    geoFieldsContainer.replaceChildren();
    geoFieldsContainer.setAttribute("data-fields", String(spec.fields.length));

    spec.fields.forEach(function (f) {
      const wrap = document.createElement("div");
      wrap.className = "field-group";

      const lbl = document.createElement("label");
      const inputId = "geo-input-" + f.key;
      lbl.setAttribute("for", inputId);
      lbl.textContent = f.label;

      const inp = document.createElement("input");
      inp.id = inputId;
      inp.type = "number";
      inp.step = "any";
      inp.setAttribute("data-geo-field", f.key);
      inp.placeholder = "Contoh: " + f.defaultVal;
      inp.value = useDefaults ? String(f.defaultVal) : "";

      wrap.appendChild(lbl);
      wrap.appendChild(inp);
      geoFieldsContainer.appendChild(wrap);
    });
  }

  function evaluateGeoShape() {
    const spec = window.HitungGeometry.SHAPES[geoState.shapeId];
    if (!spec) return;

    const inputs = geoFieldsContainer.querySelectorAll("[data-geo-field]");
    const rawParams = {};
    let allBlank = true;

    for (let i = 0; i < inputs.length; i += 1) {
      const valStr = inputs[i].value.trim();
      if (valStr !== "") {
        allBlank = false;
      }
      rawParams[inputs[i].getAttribute("data-geo-field")] = valStr === "" ? NaN : Number(valStr);
    }

    if (allBlank) {
      showGeoView("empty");
      return;
    }

    let calcResult;
    try {
      calcResult = window.HitungGeometry.calculateShape(geoState.shapeId, rawParams);
    } catch (err) {
      showGeoView("error", err.message);
      return;
    }

    geoState.runId += 1;
    const currentRun = geoState.runId;
    showGeoView("loading");

    window.requestAnimationFrame(function () {
      if (currentRun !== geoState.runId) return;

      geoMetricsList.replaceChildren();
      calcResult.metrics.forEach(function (m) {
        const card = document.createElement("div");
        card.className = "geo-metric-card" + (m.primary ? " is-primary" : "");

        const dt = document.createElement("dt");
        dt.textContent = m.label;

        const dd = document.createElement("dd");
        const valSpan = document.createElement("span");
        valSpan.className = "geo-metric-val";
        valSpan.textContent = m.value;
        dd.appendChild(valSpan);

        const unitSpan = document.createElement("span");
        unitSpan.className = "geo-metric-unit";
        unitSpan.textContent = m.unit;
        dd.appendChild(unitSpan);

        card.appendChild(dt);
        card.appendChild(dd);
        geoMetricsList.appendChild(card);
      });

      geoStepsList.replaceChildren();
      calcResult.steps.forEach(function (s) {
        const li = document.createElement("li");
        li.textContent = s;
        geoStepsList.appendChild(li);
      });

      geoViewer.setShape(geoState.shapeId, calcResult.params);
      showGeoView("ready");
    });
  }

  function selectGeoShape(shapeId) {
    const spec = window.HitungGeometry.SHAPES[shapeId];
    if (!spec) return;
    geoState.shapeId = shapeId;
    geoState.category = spec.category;
    renderGeoShapeButtons();
    renderGeoFields(true);
    evaluateGeoShape();
  }

  geoCatButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      const cat = btn.getAttribute("data-geo-cat");
      geoState.category = cat;
      syncTabState(geoCatButtons, btn);

      const firstMatch = Object.keys(window.HitungGeometry.SHAPES).find(function (k) {
        return window.HitungGeometry.SHAPES[k].category === cat;
      });
      if (firstMatch) {
        selectGeoShape(firstMatch);
      }
    });
  });

  geoForm.addEventListener("submit", function (event) {
    event.preventDefault();
    evaluateGeoShape();
  });

  geoClearBtn.addEventListener("click", function () {
    renderGeoFields(false);
    showGeoView("empty");
    const firstInp = geoFieldsContainer.querySelector("input");
    if (firstInp) firstInp.focus();
  });

  geoDefaultBtn.addEventListener("click", function () {
    renderGeoFields(true);
    evaluateGeoShape();
  });

  function setGeoViewMode(mode) {
    geoState.viewMode = mode === "2d" ? "2d" : "3d";
    const is3D = geoState.viewMode === "3d";
    syncTabState([geoView3DBtn, geoView2DBtn], is3D ? geoView3DBtn : geoView2DBtn);
    geoViewer.setViewMode(geoState.viewMode);
  }

  geoView3DBtn.addEventListener("click", function () {
    setGeoViewMode("3d");
  });

  geoView2DBtn.addEventListener("click", function () {
    setGeoViewMode("2d");
  });

  geoWireframeBtn.addEventListener("click", function () {
    geoState.wireframe = !geoState.wireframe;
    geoWireframeBtn.setAttribute("aria-pressed", String(geoState.wireframe));
    geoViewer.setWireframe(geoState.wireframe);
  });

  geoAutoRotateBtn.addEventListener("click", function () {
    geoState.autoRotate = !geoState.autoRotate;
    geoAutoRotateBtn.setAttribute("aria-pressed", String(geoState.autoRotate));
    geoViewer.setAutoRotate(geoState.autoRotate);
  });

  geoZoomOutBtn.addEventListener("click", function () {
    geoViewer.adjustZoom(-0.15);
  });

  geoZoomInBtn.addEventListener("click", function () {
    geoViewer.adjustZoom(0.15);
  });

  geoResetViewBtn.addEventListener("click", function () {
    geoViewer.resetOrientation();
  });

  /* ------------------------------------------------------------------------
     Penutup Global Escape & Reset Footer
     ------------------------------------------------------------------------ */
  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;

    const menuOpen = mobileMenuBtn.getAttribute("aria-expanded") === "true";
    if (menuOpen) {
      setMobileMenuOpen(false);
      mobileMenuBtn.focus();
      return;
    }

    const historyOpen = historyToggleBtn.getAttribute("aria-expanded") === "true";
    if (historyOpen) {
      historyToggleBtn.setAttribute("aria-expanded", "false");
      historyPanel.hidden = true;
      historyToggleBtn.focus();
    }
  });

  resetAllBtn.addEventListener("click", function () {
    removeStorage(STORAGE_KEYS.theme);
    removeStorage(STORAGE_KEYS.history);
    state.history = [];
    initTheme();
    renderHistory();
    clearCalculator();
    footerStatusEl.textContent = "Preferensi tema dan pita riwayat telah dikosongkan.";
  });

  /* ------------------------------------------------------------------------
     Animasi Gulir Halus (MOTION 2, menghormati prefers-reduced-motion)
     ------------------------------------------------------------------------ */
  function initRevealObserver() {
    const items = document.querySelectorAll(".reveal-item");
    const reduced =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced || !("IntersectionObserver" in window)) {
      items.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    htmlEl.classList.add("has-reveal");
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );

    items.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ------------------------------------------------------------------------
     Inisialisasi Awal
     ------------------------------------------------------------------------ */
  initTheme();
  loadHistory();
  renderHistory();
  initRevealObserver();
  runFxEvaluation();
  selectGeoShape("kubus");
})();
