/* ==========================================================================
   Hitung: Mesin Parser & Evaluator Ekspresi Matematika (Tanpa eval)
   Mendukung presedensi standar, perkalian implisit, fungsi ilmiah, dan f(x).
   ========================================================================== */

(function (root) {
  "use strict";

  const FUNCTIONS = new Set(["sin", "cos", "tan", "sqrt", "log", "ln", "abs"]);
  const CONSTANTS = {
    pi: Math.PI,
    e: Math.E,
  };

  /**
   * Memecah teks ekspresi menjadi daftar token yang terstruktur.
   */
  function tokenize(rawInput, options) {
    const allowVariableX = Boolean(options && options.allowVariableX);
    const normalized = String(rawInput || "")
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/−/g, "-")
      .replace(/π/g, "pi")
      .replace(/√/g, "sqrt")
      .replace(/,/g, ".");

    const rawTokens = [];
    let i = 0;

    while (i < normalized.length) {
      const ch = normalized[i];

      // Lewati spasi putih
      if (/\s/.test(ch)) {
        i += 1;
        continue;
      }

      // Token angka (mendukung format desimal seperti 12.5 atau .5)
      if (/[0-9.]/.test(ch)) {
        let numStr = "";
        let dotCount = 0;

        while (i < normalized.length && /[0-9.]/.test(normalized[i])) {
          if (normalized[i] === ".") {
            dotCount += 1;
            if (dotCount > 1) {
              throw new Error("Angka mengandung lebih dari satu titik desimal.");
            }
          }
          numStr += normalized[i];
          i += 1;
        }

        if (numStr === ".") {
          throw new Error("Titik desimal tidak diikuti angka.");
        }

        const value = Number(numStr);
        if (!Number.isFinite(value)) {
          throw new Error("Angka melebihi batas representasi.");
        }
        rawTokens.push({ type: "number", value: value });
        continue;
      }

      // Token nama fungsi, konstanta, atau variabel x
      if (/[a-zA-Z]/.test(ch)) {
        let ident = "";
        while (i < normalized.length && /[a-zA-Z]/.test(normalized[i])) {
          ident += normalized[i].toLowerCase();
          i += 1;
        }

        if (FUNCTIONS.has(ident)) {
          rawTokens.push({ type: "func", value: ident });
        } else if (Object.prototype.hasOwnProperty.call(CONSTANTS, ident)) {
          rawTokens.push({ type: "const", value: ident });
        } else if (allowVariableX && ident === "x") {
          rawTokens.push({ type: "var", value: "x" });
        } else {
          throw new Error(
            'Simbol "' +
              ident +
              '" tidak dikenali. Gunakan sin, cos, tan, sqrt, log, ln, abs, pi, atau e.'
          );
        }
        continue;
      }

      // Operator biner, pangkat, persen, dan tanda kurung
      if (ch === "+" || ch === "-" || ch === "*" || ch === "/" || ch === "^") {
        rawTokens.push({ type: "op", value: ch });
        i += 1;
        continue;
      }

      if (ch === "%") {
        rawTokens.push({ type: "percent", value: "%" });
        i += 1;
        continue;
      }

      if (ch === "(") {
        rawTokens.push({ type: "lparen", value: "(" });
        i += 1;
        continue;
      }

      if (ch === ")") {
        rawTokens.push({ type: "rparen", value: ")" });
        i += 1;
        continue;
      }

      throw new Error('Karakter "' + ch + '" tidak didukung dalam ekspresi.');
    }

    // Sisipkan perkalian implisit (misal 2pi, 2(3+4), (1+2)(3+4), 2sin(30), 2x)
    const tokens = [];
    for (let idx = 0; idx < rawTokens.length; idx += 1) {
      const curr = rawTokens[idx];
      if (idx > 0) {
        const prev = rawTokens[idx - 1];
        const prevCanMultiply =
          prev.type === "number" ||
          prev.type === "const" ||
          prev.type === "var" ||
          prev.type === "rparen" ||
          prev.type === "percent";
        const currCanMultiply =
          curr.type === "number" ||
          curr.type === "const" ||
          curr.type === "var" ||
          curr.type === "func" ||
          curr.type === "lparen";
        const bothNumbers = prev.type === "number" && curr.type === "number";

        if (prevCanMultiply && currCanMultiply && !bothNumbers) {
          tokens.push({ type: "op", value: "*" });
        }
      }
      tokens.push(curr);
    }

    return tokens;
  }

  /**
   * Mengevaluasi fungsi ilmiah dengan pemeriksaan domain bilangan real.
   */
  function applyMathFunction(name, arg, angleUnit) {
    const toRad = angleUnit === "RAD" ? arg : (arg * Math.PI) / 180;

    switch (name) {
      case "sin":
        return Math.sin(toRad);
      case "cos":
        return Math.cos(toRad);
      case "tan":
        if (Math.abs(Math.cos(toRad)) < 1e-12) {
          throw new Error(
            "Nilai tan tidak terdefinisi pada sudut asimtot (misalnya 90 derajat)."
          );
        }
        return Math.tan(toRad);
      case "sqrt":
        if (arg < 0) {
          throw new Error(
            "Akar kuadrat bilangan negatif tidak terdefinisi di bilangan real."
          );
        }
        return Math.sqrt(arg);
      case "log":
        if (arg <= 0) {
          throw new Error("Logaritma (log) hanya terdefinisi untuk angka > 0.");
        }
        return Math.log10(arg);
      case "ln":
        if (arg <= 0) {
          throw new Error("Logaritma natural (ln) hanya terdefinisi untuk angka > 0.");
        }
        return Math.log(arg);
      case "abs":
        return Math.abs(arg);
      default:
        throw new Error('Fungsi "' + name + '" tidak didukung.');
    }
  }

  /**
   * Membersihkan galat kecil floating-point biner (misal 0.1 + 0.2 -> 0.3).
   */
  function normalizeNumber(value) {
    if (!Number.isFinite(value)) {
      throw new Error("Hasil perhitungan melampaui batas angka (overflow).");
    }
    if (Math.abs(value) < 1e-12) {
      return 0;
    }
    return Number(value.toPrecision(12));
  }

  /**
   * Mengevaluasi ekspresi matematika menggunakan Recursive Descent Parser.
   */
  function evaluateExpression(rawInput, options) {
    const opts = options || {};
    const angleUnit = opts.angleUnit === "RAD" ? "RAD" : "DEG";
    const xValue = opts.xValue;
    const allowVariableX = typeof xValue === "number";

    const trimmed = String(rawInput || "").trim();
    if (!trimmed) {
      throw new Error("Ekspresi masih kosong. Masukkan angka atau rumus.");
    }

    const tokens = tokenize(trimmed, { allowVariableX: allowVariableX });
    let pos = 0;

    function peek() {
      return tokens[pos] || null;
    }

    function consume() {
      const tok = tokens[pos] || null;
      pos += 1;
      return tok;
    }

    // Tingkat 1: Penjumlahan & Pengurangan
    function parseExpression() {
      let left = parseTerm();
      while (peek() && peek().type === "op" && (peek().value === "+" || peek().value === "-")) {
        const op = consume().value;
        const right = parseTerm();
        left = op === "+" ? left + right : left - right;
      }
      return left;
    }

    // Tingkat 2: Perkalian & Pembagian
    function parseTerm() {
      let left = parseUnary();
      while (peek() && peek().type === "op" && (peek().value === "*" || peek().value === "/")) {
        const op = consume().value;
        const right = parseUnary();
        if (op === "/") {
          if (Math.abs(right) === 0) {
            throw new Error("Pembagian dengan nol tidak terdefinisi. Ubah penyebut selain 0.");
          }
          left = left / right;
        } else {
          left = left * right;
        }
      }
      return left;
    }

    // Tingkat 3: Tanda positif/negatif unary
    function parseUnary() {
      if (peek() && peek().type === "op" && (peek().value === "+" || peek().value === "-")) {
        const op = consume().value;
        const val = parseUnary();
        return op === "-" ? -val : val;
      }
      return parsePower();
    }

    // Tingkat 4: Pangkat berasosiasi kanan (2^3^2 = 512, -3^2 = -9)
    function parsePower() {
      const base = parsePostfix();
      if (peek() && peek().type === "op" && peek().value === "^") {
        consume();
        const exponent = parseUnary();
        const powered = Math.pow(base, exponent);
        if (!Number.isFinite(powered)) {
          throw new Error("Hasil pemangkatan tidak terdefinisi atau terlalu besar.");
        }
        return powered;
      }
      return base;
    }

    // Tingkat 5: Akhiran persen (% = dibagi 100)
    function parsePostfix() {
      let val = parsePrimary();
      while (peek() && peek().type === "percent") {
        consume();
        val = val / 100;
      }
      return val;
    }

    // Tingkat 6: Angka, konstanta, variabel, fungsi, dan kurung
    function parsePrimary() {
      const tok = peek();
      if (!tok) {
        throw new Error("Ekspresi belum lengkap. Periksa operator di akhir rumus.");
      }

      if (tok.type === "number") {
        consume();
        return tok.value;
      }

      if (tok.type === "const") {
        consume();
        return CONSTANTS[tok.value];
      }

      if (tok.type === "var") {
        consume();
        return xValue;
      }

      if (tok.type === "func") {
        const fnName = consume().value;
        if (!peek() || peek().type !== "lparen") {
          throw new Error(
            'Fungsi "' + fnName + '" memerlukan tanda kurung, contoh: ' + fnName + "(9)."
          );
        }
        consume(); // '('
        const argVal = parseExpression();
        if (!peek() || peek().type !== "rparen") {
          throw new Error("Tanda kurung tutup ')' belum ditulis untuk fungsi " + fnName + ".");
        }
        consume(); // ')'
        return applyMathFunction(fnName, argVal, angleUnit);
      }

      if (tok.type === "lparen") {
        consume();
        const inner = parseExpression();
        if (!peek() || peek().type !== "rparen") {
          throw new Error("Tanda kurung belum ditutup. Tambahkan ')' sebelum menghitung.");
        }
        consume();
        return inner;
      }

      if (tok.type === "rparen") {
        throw new Error("Tanda kurung tutup ')' muncul tanpa pembuka yang sesuai.");
      }

      throw new Error('Urutan operator tidak valid di dekat "' + tok.value + '".');
    }

    const rawResult = parseExpression();

    if (pos < tokens.length) {
      const leftover = tokens[pos];
      if (leftover.type === "rparen") {
        throw new Error("Tanda kurung tutup ')' berlebih tanpa pasangan pembuka.");
      }
      throw new Error('Ekspresi tidak valid di dekat "' + leftover.value + '".');
    }

    return normalizeNumber(rawResult);
  }

  /**
   * Memformat angka hasil ke string bersih untuk tampilan layar & tabel.
   */
  function formatResult(num) {
    if (!Number.isFinite(num)) {
      return "Tak terdefinisi";
    }
    const clean = normalizeNumber(num);
    if (Math.abs(clean) >= 1e12 || (clean !== 0 && Math.abs(clean) < 1e-7)) {
      return clean.toExponential(6).replace(/\.?0+e/, "e");
    }
    return String(clean);
  }

  const api = {
    evaluateExpression: evaluateExpression,
    formatResult: formatResult,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.HitungMath = api;
})(typeof window !== "undefined" ? window : globalThis);
