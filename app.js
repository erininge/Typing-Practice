/* Kana Keyboard Trainer
   - Works via physical key codes (KeyboardEvent.code), so IME doesn't matter.
   - Customize key->kana mapping in Settings. Stored in localStorage.
*/
(() => {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const STORAGE = {
    map: "kkt_map_v1",
    sets: "kkt_sets_v1",
    stats: "kkt_stats_v1",
    opts: "kkt_opts_v1",
    wordSets: "kkt_word_sets_v1",
  };

  const BACKGROUND_VIDEO_SRC = "icons/Sakura.mp4";
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  // A basic on-screen keyboard layout (US-ish physical codes). JIS has a few extra keys
  // that browsers may surface as IntlYen / IntlRo / etc depending on device.
  const KEYBOARD_ROWS = [
    // Row 1 (digits)
    [
      {code:"Backquote", label:"`"},
      {code:"Digit1", label:"1"},
      {code:"Digit2", label:"2"},
      {code:"Digit3", label:"3"},
      {code:"Digit4", label:"4"},
      {code:"Digit5", label:"5"},
      {code:"Digit6", label:"6"},
      {code:"Digit7", label:"7"},
      {code:"Digit8", label:"8"},
      {code:"Digit9", label:"9"},
      {code:"Digit0", label:"0"},
      {code:"Minus", label:"-"},
      {code:"Equal", label:"="},
      {code:"Backspace", label:"Bksp", wide:"wider"},
    ],
    // Row 2 (Q row)
    [
      {code:"Tab", label:"Tab", wide:"wide"},
      {code:"KeyQ", label:"Q"},
      {code:"KeyW", label:"W"},
      {code:"KeyE", label:"E"},
      {code:"KeyR", label:"R"},
      {code:"KeyT", label:"T"},
      {code:"KeyY", label:"Y"},
      {code:"KeyU", label:"U"},
      {code:"KeyI", label:"I"},
      {code:"KeyO", label:"O"},
      {code:"KeyP", label:"P"},
      {code:"BracketLeft", label:"["},
      {code:"BracketRight", label:"]"},
      {code:"Backslash", label:"\\"},
    ],
    // Row 3 (A row)
    [
      {code:"CapsLock", label:"Caps", wide:"wider"},
      {code:"KeyA", label:"A"},
      {code:"KeyS", label:"S"},
      {code:"KeyD", label:"D"},
      {code:"KeyF", label:"F"},
      {code:"KeyG", label:"G"},
      {code:"KeyH", label:"H"},
      {code:"KeyJ", label:"J"},
      {code:"KeyK", label:"K"},
      {code:"KeyL", label:"L"},
      {code:"Semicolon", label:";"},
      {code:"Quote", label:"'"},
      {code:"Enter", label:"Enter", wide:"wider"},
    ],
    // Row 4 (Z row)
    [
      {code:"ShiftLeft", label:"Shift", wide:"wider"},
      {code:"KeyZ", label:"Z"},
      {code:"KeyX", label:"X"},
      {code:"KeyC", label:"C"},
      {code:"KeyV", label:"V"},
      {code:"KeyB", label:"B"},
      {code:"KeyN", label:"N"},
      {code:"KeyM", label:"M"},
      {code:"Comma", label:","},
      {code:"Period", label:"."},
      {code:"Slash", label:"/"},
      {code:"ShiftRight", label:"Shift", wide:"wider"},
    ],
    // Row 5 (space)
    [
      {code:"ControlLeft", label:"Ctrl", wide:"wide"},
      {code:"AltLeft", label:"Alt", wide:"wide"},
      {code:"Space", label:"Space", wide:"space"},
      {code:"AltRight", label:"Alt", wide:"wide"},
      {code:"ControlRight", label:"Ctrl", wide:"wide"},
    ]
  ];

  // Default mappings (approximate) for Japanese IME Kana mode.
  // "jis" is based on the common JIS kana layout for letter keys + digits.
  // "us" is a minimal mapping (letters only) to get started.
  const DEFAULT_MAPS = {
    jis: {
      // Digits row (common)
      Backquote: "ろ",
      Digit1: "ぬ",
      Digit2: "ふ",
      Digit3: "あ",
      Digit4: "う",
      Digit5: "え",
      Digit6: "お",
      Digit7: "や",
      Digit8: "ゆ",
      Digit9: "よ",
      Digit0: "わ",
      Minus: "ほ",
      Equal: "へ",
      // Q row
      KeyQ: "た",
      KeyW: "て",
      KeyE: "い",
      KeyR: "す",
      KeyT: "か",
      KeyY: "ん",
      KeyU: "な",
      KeyI: "に",
      KeyO: "ら",
      KeyP: "せ",
      BracketLeft: "゛",
      BracketRight: "゜",
      Backslash: "む",
      // A row
      KeyA: "ち",
      KeyS: "と",
      KeyD: "し",
      KeyF: "は",
      KeyG: "き",
      KeyH: "く",
      KeyJ: "ま",
      KeyK: "の",
      KeyL: "り",
      Semicolon: "れ",
      Quote: "け",
      // Z row
      KeyZ: "つ",
      KeyX: "さ",
      KeyC: "そ",
      KeyV: "ひ",
      KeyB: "こ",
      KeyN: "み",
      KeyM: "も",
      Comma: "ね",
      Period: "る",
      Slash: "め",
      // space is not kana
    },
    us: {
      // Letters only (still trains key positions)
      KeyQ: "た", KeyW:"て", KeyE:"い", KeyR:"す", KeyT:"か",
      KeyY:"ん", KeyU:"な", KeyI:"に", KeyO:"ら", KeyP:"せ",
      KeyA:"ち", KeyS:"と", KeyD:"し", KeyF:"は", KeyG:"き",
      KeyH:"く", KeyJ:"ま", KeyK:"の", KeyL:"り",
      KeyZ:"つ", KeyX:"さ", KeyC:"そ", KeyV:"ひ", KeyB:"こ",
      KeyN:"み", KeyM:"も"
    }
  };

  const DAKUTEN_MAP = {
    う: "ゔ",
    か: "が", き: "ぎ", く: "ぐ", け: "げ", こ: "ご",
    さ: "ざ", し: "じ", す: "ず", せ: "ぜ", そ: "ぞ",
    た: "だ", ち: "ぢ", つ: "づ", て: "で", と: "ど",
    は: "ば", ひ: "び", ふ: "ぶ", へ: "べ", ほ: "ぼ"
  };

  const HANDAKUTEN_MAP = {
    は: "ぱ", ひ: "ぴ", ふ: "ぷ", へ: "ぺ", ほ: "ぽ"
  };

  const VOICED_TO_BASE = {};
  for (const [base, voiced] of Object.entries(DAKUTEN_MAP)) {
    VOICED_TO_BASE[voiced] = { base, mark: "゛" };
  }
  for (const [base, voiced] of Object.entries(HANDAKUTEN_MAP)) {
    VOICED_TO_BASE[voiced] = { base, mark: "゜" };
  }

  function combineDiacritic(base, mark) {
    if (mark === "゛") return DAKUTEN_MAP[base] || null;
    if (mark === "゜") return HANDAKUTEN_MAP[base] || null;
    return null;
  }

  function decomposeVoiced(kana) {
    return VOICED_TO_BASE[kana] || null;
  }

  // Practice sets (what kana can be targeted)
  const SETS = [
    { id:"aiueo", name:"あいうえお", items:["あ","い","う","え","お"] },
    { id:"k", name:"かきくけこ", items:["か","き","く","け","こ"] },
    { id:"s", name:"さしすせそ", items:["さ","し","す","せ","そ"] },
    { id:"t", name:"たちつてと", items:["た","ち","つ","て","と"] },
    { id:"n", name:"なにぬねの", items:["な","に","ぬ","ね","の"] },
    { id:"h", name:"はひふへほ", items:["は","ひ","ふ","へ","ほ"] },
    { id:"m", name:"まみむめも", items:["ま","み","む","め","も"] },
    { id:"y", name:"やゆよ", items:["や","ゆ","よ"] },
    { id:"r", name:"らりるれろ", items:["ら","り","る","れ","ろ"] },
    { id:"w", name:"わをん", items:["わ","を","ん"] },
    { id:"etc", name:"Extra (ね る め れ)", items:["ね","る","め","れ"] },
    { id:"diac", name:"゛゜ (dakuten/handakuten keys)", items:["゛","゜"] },
  ];

  // Built-in practice content (hiragana-only on purpose)
  const WORD_LISTS = {
    basic: [
      "ねこ","いぬ","すし","みず","おちゃ","ごはん","やま","かわ","あめ","ゆき",
      "あさ","よる","ひる","いえ","ともだち","がくせい","せんせい","でんしゃ",
      "たべる","のむ","いく","くる","みる","きく","はなす","よむ","かく",
      "あたらしい","おおきい","ちいさい","はやい","おそい","たのしい","むずかしい",
      "くるま","じてんしゃ","ひこうき","ふね","えき","みせ","こうえん","はし",
      "そら","うみ","もり","なつ","ふゆ","はる","あき","きょう","あした","きのう",
      "あさごはん","ひるごはん","ばんごはん","おかし","くだもの","りんご","みかん",
      "ばなな","いちご","やさい","にんじん","たまねぎ","じゃがいも","ぱん",
      "ぎゅうにゅう","こうちゃ","さかな","にく","たまご","あぶら","しお","さとう",
      "はしる","あるく","およぐ","ねる","おきる","つくる","あそぶ","はたらく","やすむ",
      "あける","しめる","あらう","きる","ぬぐ","すわる","たつ","おぼえる","わすれる",
      "おしえる","ならう","かう","うる","かりる","かえす","あつい","さむい","つめたい",
      "あかるい","くらい","あまい","からい","しおからい","すっぱい","にがい",
      "うれしい","かなしい","きれい","しずか","にぎやか","やさしい","こわい",
      "おもしろい","つかれる","げんき"
    ]
  };

  const SENTENCE_LISTS = {
    basic: [
      "わたしはがくせいです",
      "きょうはいいてんきです",
      "ねこがすきです",
      "あしたともだちにあいます",
      "みずをのみます",
      "でんしゃでいきます",
      "えいがをみにいきます",
      "きのうはさむかったです",
      "まいにちべんきょうします",
      "これをよんでください",
      "あさごはんにたまごをたべました",
      "わたしはこうえんでさんぽします",
      "ともだちといっしょにえいがをみました",
      "ふゆはさむいですがあついおちゃがすきです",
      "じてんしゃでまちまでいきます",
      "ねるまえにほんをよみます",
      "しゅうまつはうみへいきたいです",
      "きのうははやくねました",
      "いえでおんがくをききます",
      "きょうはしごとがやすみです",
      "あたらしいくつをかいました",
      "みずをたくさんのみましょう",
      "いぬがはしってきました",
      "はなにみずをあげます",
      "すずしいかぜがふいています",
      "つくえのうえにほんがあります",
      "でんしゃがこんでいます",
      "えきでともだちをまちます",
      "あたらしいことばをおぼえます",
      "このみちはよるはくらいです",
      "あめのあとにそらがきれいです",
      "ひるやすみにさんどいっちをたべます",
      "やさいをたくさんたべたいです",
      "まいあさはやおきしています",
      "せんせいがしゅくだいをだしました",
      "こうえんでこどもがあそんでいます",
      "わたしはりょこうのけいかくをたてます",
      "かばんのなかにぺんがあります",
      "あついひはみずあそびをします",
      "ゆきがふるとまちがしずかになります",
      "あかるいへやでべんきょうします",
      "すきなうたをくちずさみます",
      "つぎのばすはななじゅっぷんごです",
      "まどをあけてそとをみます",
      "しゅくだいはゆうがたにします",
      "きょうはからだをうごかします"
    ]
  };


  const defaultEnabledSets = () => {
    // enable everything except diacritics by default
    const obj = {};
    for (const s of SETS) obj[s.id] = s.id !== "diac";
    return obj;
  };

  const defaultWordSets = () => [];

  const defaultOpts = () => ({
    layout: "jis",
    inputMode: "native",
    showKeyboard: true,
    typingTimerEnabled: true,
    wordList: "basic",
    wordSetId: "",
    backgroundVideo: "off"
  });

  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch { return fallback; }
  }
  function saveJSON(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

  function normalizeWordSets(rawSets) {
    if (!Array.isArray(rawSets)) return [];
    const seen = new Set();
    const normalized = [];
    for (let i = 0; i < rawSets.length; i += 1) {
      const entry = rawSets[i] || {};
      let id = typeof entry.id === "string" ? entry.id.trim() : "";
      if (!id || seen.has(id)) {
        id = `custom-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
      }
      seen.add(id);
      const name = typeof entry.name === "string" && entry.name.trim()
        ? entry.name.trim()
        : `Custom Set ${normalized.length + 1}`;
      const words = Array.isArray(entry.words)
        ? entry.words.map(word => String(word).trim()).filter(Boolean)
        : [];
      normalized.push({ id, name, words });
    }
    return normalized;
  }

  let opts = loadJSON(STORAGE.opts, defaultOpts());
  // normalize older saved options
  if (!opts.inputMode || !["native", "mapped"].includes(opts.inputMode)) opts.inputMode = "native";
  if (typeof opts.showKeyboard !== "boolean") opts.showKeyboard = true;
  if (typeof opts.typingTimerEnabled !== "boolean") opts.typingTimerEnabled = true;
  if (!opts.wordList || !["basic", "all", "custom"].includes(opts.wordList)) opts.wordList = "basic";
  if (typeof opts.wordSetId !== "string") opts.wordSetId = "";
  if (!["on", "off"].includes(opts.backgroundVideo)) opts.backgroundVideo = "off";
  let map = loadJSON(STORAGE.map, DEFAULT_MAPS[opts.layout] || DEFAULT_MAPS.jis);
  let enabledSets = loadJSON(STORAGE.sets, defaultEnabledSets());
  let wordSets = normalizeWordSets(loadJSON(STORAGE.wordSets, defaultWordSets()));
  let stats = loadJSON(STORAGE.stats, {
    practice: { correct:0, wrong:0, bestStreak:0 },
    typing: { runs:0, bestKpm:0 },
    word: { words:0, correct:0, wrong:0 },
    sentence: { sentences:0, correct:0, wrong:0 },
    kana: {} // {kana: {c,w}}
  });

  function ensureKanaStat(k) {
    if (!stats.kana[k]) stats.kana[k] = { c:0, w:0 };
    return stats.kana[k];
  }

  function getExpectedKana() {
    if (practiceOn) return targetKana;
    if (typingOn) return nextNeededKana();
    if (wordOn) return nextChar(wordTarget, wordTyped);
    if (sentenceOn) return nextChar(sentenceTarget, sentenceTyped);
    return null;
  }

  function nav(id) {
    ["home","practice","word","sentence","typing","stats","settings"].forEach(x => {
      const el = document.getElementById(x);
      el.classList.toggle("hidden", x !== id);
    });
    if (id === "settings") renderSettings();
    if (id === "stats") renderStats();
    if (id === "home") {
      stopAllModes({ recordTyping: false });
      return;
    }
    if (["settings", "stats"].includes(id)) {
      pauseAllModes();
      return;
    }
  }

  const backgroundVideoContainer = $("#background-video");

  function shouldShowBackgroundVideo() {
    if (reducedMotionQuery.matches) return false;
    return opts.backgroundVideo === "on";
  }

  function syncBackgroundVideoUI() {
    const select = $("#backgroundVideoSelect");
    if (!select) return;
    const reduced = reducedMotionQuery.matches;
    if (reduced && opts.backgroundVideo !== "off") {
      opts.backgroundVideo = "off";
      saveJSON(STORAGE.opts, opts);
    }
    select.disabled = reduced;
    select.value = reduced ? "off" : (opts.backgroundVideo || "off");
    const note = $("#backgroundVideoNote");
    if (note) {
      note.textContent = reduced
        ? "Disabled because Reduce Motion is enabled on your device."
        : "Sakura video backdrop behind the UI.";
    }
  }

  function attachVideoFallback(video) {
    const attemptPlay = () => {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        return playPromise;
      }
      return Promise.resolve();
    };
    attemptPlay().catch(() => {
      const handler = () => attemptPlay().catch(() => {});
      window.addEventListener("pointerdown", handler, { once: true });
      window.addEventListener("touchstart", handler, { once: true });
      window.addEventListener("keydown", handler, { once: true });
    });
  }

  function renderBackgroundVideo() {
    if (!backgroundVideoContainer) return;
    backgroundVideoContainer.innerHTML = "";
    if (!shouldShowBackgroundVideo()) return;
    const video = document.createElement("video");
    video.className = "background-video__media";
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = BACKGROUND_VIDEO_SRC;
    video.setAttribute("playsinline", "");
    video.setAttribute("muted", "");
    video.setAttribute("autoplay", "");
    video.setAttribute("loop", "");
    const overlay = document.createElement("div");
    overlay.className = "background-video__overlay";
    backgroundVideoContainer.append(video, overlay);
    attachVideoFallback(video);
  }

  $$("[data-nav]").forEach(btn => btn.addEventListener("click", () => nav(btn.dataset.nav)));

  // ---- Build practicing pool ----
  function getPool({ useMap = false } = {}) {
    const pool = [];
    for (const s of SETS) {
      if (enabledSets[s.id]) pool.push(...s.items);
    }
    if (!useMap || opts.inputMode === "native") return pool;
    // Filter to only kana that exist in current map
    const kanaInMap = new Set(Object.values(map).filter(Boolean));
    const filtered = pool.filter(k => kanaInMap.has(k));
    return filtered.length ? filtered : Array.from(kanaInMap);
  }

  // ---- On-screen keyboard render ----
  function buildKeyboard(el, targetCode=null) {
    el.innerHTML = "";
    for (const row of KEYBOARD_ROWS) {
      const r = document.createElement("div");
      r.className = "krow";
      for (const key of row) {
        const k = document.createElement("div");
        k.className = "key";
        if (key.wide) k.classList.add(key.wide);
        k.dataset.code = key.code;
        if (targetCode && key.code === targetCode) k.classList.add("target");
        const top = document.createElement("div");
        top.className = "top";
        top.textContent = key.label;
        const kana = document.createElement("div");
        kana.className = "kana";
        kana.textContent = map[key.code] || "";
        k.appendChild(top);
        k.appendChild(kana);
        r.appendChild(k);
      }
      el.appendChild(r);
    }
  }
  function flashKey(code) {
    const keys = $$(`.key[data-code="${code}"]`);
    keys.forEach(k => {
      k.classList.add("pressed");
      setTimeout(() => k.classList.remove("pressed"), 80);
    });
  }

  function applyKeyboardVisibility() {
    $$(".kbdWrap").forEach((wrap) => {
      wrap.classList.toggle("hidden", !opts.showKeyboard);
    });
  }

  function renderPassage(el, target, progressIndex, wrongIndices = new Set(), correctIndices = new Set()) {
    el.innerHTML = "";
    if (!target) {
      el.textContent = "—";
      return;
    }
    for (let i = 0; i < target.length; i += 1) {
      const ch = target[i];
      const span = document.createElement("span");
      span.className = "passageChar";
      if (correctIndices.has(i)) span.classList.add("correct");
      if (wrongIndices.has(i)) span.classList.add("wrong");
      if (i === progressIndex && !wrongIndices.has(i)) span.classList.add("current");
      span.textContent = ch;
      el.appendChild(span);
    }
  }

  function evaluateInput(target, input, allowSkipSpaces = false) {
    let ti = 0;
    const correctIndices = new Set();
    const wrongIndices = new Set();
    const inputToTarget = [];
    const inputStates = [];

    for (let ii = 0; ii < input.length && ti < target.length; ii += 1) {
      const inputChar = input[ii];
      if (allowSkipSpaces) {
        while (ti < target.length && target[ti] === " " && inputChar !== " ") {
          correctIndices.add(ti);
          ti += 1;
        }
      }
      if (ti >= target.length) {
        inputToTarget[ii] = null;
        inputStates[ii] = "ignored";
        continue;
      }

      const expected = target[ti];
      const expectedParts = decomposeVoiced(expected);
      const nextChar = input[ii + 1];
      inputToTarget[ii] = ti;

      if (expectedParts && inputChar === expectedParts.base) {
        if (nextChar === expectedParts.mark) {
          inputStates[ii] = "pending";
          inputToTarget[ii + 1] = ti;
          inputStates[ii + 1] = "correct";
          correctIndices.add(ti);
          ti += 1;
          ii += 1;
        } else {
          inputStates[ii] = "pending";
        }
        continue;
      }

      if (inputChar === expected) {
        correctIndices.add(ti);
        inputStates[ii] = "correct";
      } else {
        wrongIndices.add(ti);
        inputStates[ii] = "wrong";
      }
      ti += 1;
    }

    if (allowSkipSpaces) {
      while (ti < target.length && target[ti] === " ") {
        correctIndices.add(ti);
        ti += 1;
      }
    }

    for (let ii = 0; ii < input.length; ii += 1) {
      if (!inputStates[ii]) {
        inputToTarget[ii] = null;
        inputStates[ii] = "ignored";
      }
    }

    return { correctIndices, wrongIndices, nextTargetIndex: ti, inputToTarget, inputStates };
  }

  // ---- Practice mode ----
  let practiceOn = false;
  let practicePaused = false;
  let targetKana = null;
  let targetCode = null;
  let streak = 0, correct=0, wrong=0;
  let pendingDiacritic = null;
  const imeInput = document.createElement("input");
  imeInput.type = "text";
  imeInput.autocapitalize = "off";
  imeInput.autocomplete = "off";
  imeInput.spellcheck = false;
  imeInput.className = "ime-input";
  imeInput.setAttribute("aria-hidden", "true");
  document.body.appendChild(imeInput);

  function focusImeInput() {
    if (opts.inputMode === "native" && practiceOn && !practicePaused) {
      imeInput.focus({ preventScroll: true });
    }
  }

  function clearImeInput() {
    imeInput.value = "";
  }

  function handleImeInput() {
    if (!practiceOn || practicePaused || opts.inputMode !== "native") {
      clearImeInput();
      return;
    }
    const value = imeInput.value;
    if (!value) return;
    for (const ch of value) {
      if (!ch) continue;
      processInput(ch, null);
    }
    clearImeInput();
  }

  function pickTarget() {
    const pool = getPool({ useMap: opts.inputMode !== "native" });
    targetKana = pool[Math.floor(Math.random() * pool.length)];
    targetCode = Object.keys(map).find(code => map[code] === targetKana) || null;
    $("#targetKana").textContent = targetKana || "—";
    $("#feedback").textContent = "";
    $("#feedback").className = "feedback";
    buildKeyboard($("#keyboard"), targetCode);
  }

  function updatePracticeStats() {
    $("#streak").textContent = String(streak);
    $("#correct").textContent = String(correct);
    $("#wrong").textContent = String(wrong);
    const total = correct + wrong;
    $("#acc").textContent = total ? `${Math.round((correct/total)*100)}%` : "—";
  }

  function startPractice() {
    if (practiceOn) return;
    stopAllModes({ recordTyping: false });
    practiceOn = true;
    practicePaused = false;
    streak = 0; correct = 0; wrong = 0;
    pendingDiacritic = null;
    updatePracticeStats();
    pickTarget();
    $("#btnPracticeStart").disabled = true;
    $("#btnPracticePause").disabled = false;
    $("#btnPracticeStop").disabled = false;
    focusImeInput();
  }

  function stopPractice() {
    if (!practiceOn) return;
    practiceOn = false;
    practicePaused = false;
    $("#btnPracticeStart").disabled = false;
    $("#btnPracticePause").disabled = true;
    $("#btnPracticeStop").disabled = true;
    $("#feedback").textContent = "Stopped.";
    $("#feedback").className = "feedback";
    buildKeyboard($("#keyboard"), null);
    $("#targetKana").textContent = "—";
    clearImeInput();
  }

  function pausePractice() {
    if (!practiceOn || practicePaused) return;
    practicePaused = true;
    $("#btnPracticeStart").disabled = false;
    $("#btnPracticePause").disabled = true;
    $("#feedback").textContent = "Paused.";
    $("#feedback").className = "feedback";
    clearImeInput();
  }

  function resumePractice() {
    if (!practiceOn || !practicePaused) return;
    practicePaused = false;
    $("#btnPracticeStart").disabled = true;
    $("#btnPracticePause").disabled = false;
    $("#feedback").textContent = "";
    $("#feedback").className = "feedback";
    focusImeInput();
  }

  $("#btnPracticeStart").addEventListener("click", () => {
    if (practiceOn && practicePaused) {
      resumePractice();
      return;
    }
    startPractice();
  });
  $("#btnPracticePause").addEventListener("click", () => pausePractice());
  $("#btnPracticeStop").addEventListener("click", () => stopPractice());

  function markPractice(correctHit, pressedCode, inputKana) {
    const fb = $("#feedback");
    const gotKana = map[pressedCode] || "—";
    if (pressedCode) flashKey(pressedCode);
    const displayKey = opts.inputMode === "native" ? (inputKana || "—") : pressedCode;
    const displayKana = opts.inputMode === "native" ? (inputKana || "—") : gotKana;

    if (correctHit) {
      fb.textContent = `✅ ${displayKey} = ${displayKana}`;
      fb.className = "feedback good";
      streak += 1;
      correct += 1;
      stats.practice.correct += 1;
      stats.practice.bestStreak = Math.max(stats.practice.bestStreak, streak);
      ensureKanaStat(targetKana).c += 1;
      saveJSON(STORAGE.stats, stats);
      updatePracticeStats();
      setTimeout(pickTarget, 220);
    } else {
      fb.textContent = `❌ ${displayKey} = ${displayKana} (needed ${targetKana})`;
      fb.className = "feedback bad";
      streak = 0;
      wrong += 1;
      stats.practice.wrong += 1;
      ensureKanaStat(targetKana).w += 1;
      saveJSON(STORAGE.stats, stats);
      updatePracticeStats();
    }
  }

  function stopAllModes({ recordTyping = false } = {}) {
    stopPractice();
    stopWord();
    stopSentence();
    stopTyping(recordTyping);
  }

  function pauseAllModes() {
    pausePractice();
    pauseWord();
    pauseSentence();
    pauseTyping();
  }

  // ---- Typing mode ----
  let typingOn = false;
  let typingPaused = false;
  let typingTarget = "";
  let typed = "";
  let typingInput = "";
  let typingMatched = 0;
  let typingWrongIndices = new Set();
  let typingCorrectIndices = new Set();
  let suppressTypingInput = false;
  let tCorrect = 0, tWrong = 0;
  let tStart = 0;
  let tElapsedMs = 0;
  let tTimerId = null;
  let tLimit = 60;
  let typingLength = 60;

  function getTypingElapsedMs() {
    if (!typingOn) return tElapsedMs;
    if (typingPaused) return tElapsedMs;
    return Date.now() - tStart;
  }

  function getTypingRemainingSeconds() {
    if (!opts.typingTimerEnabled) return null;
    const remaining = Math.max(0, Math.round((tLimit * 1000 - getTypingElapsedMs()) / 1000));
    return remaining;
  }

  function setTypingUI() {
    if (typingTarget) {
      renderPassage($("#typingTarget"), typingTarget, typed.length, typingWrongIndices, typingCorrectIndices);
    } else {
      $("#typingTarget").textContent = "—";
    }
    $("#typingTyped").textContent = typed || "";
    const typingInputEl = $("#typingInput");
    if (typingInputEl.value !== typingInput) typingInputEl.value = typingInput;
    $("#tCorrect").textContent = String(tCorrect);
    $("#tWrong").textContent = String(tWrong);
    if (!typingOn) {
      $("#tTime").textContent = opts.typingTimerEnabled ? "—" : "∞";
      $("#tKpm").textContent = "—";
      return;
    }
    const remaining = getTypingRemainingSeconds();
    $("#tTime").textContent = remaining === null ? "∞" : `${remaining}s`;
    const dtMin = getTypingElapsedMs() / 60000;
    const kpm = dtMin > 0 ? Math.round((tCorrect / dtMin)) : 0;
    $("#tKpm").textContent = typingPaused ? "—" : String(kpm);
  }

  function makeKanaStream(n) {
    const pool = getPool();
    let out = "";
    for (let i=0;i<n;i++) out += pool[Math.floor(Math.random()*pool.length)];
    return out;
  }

  function stopTyping(recordStats = true) {
    if (!typingOn) return;
    if (!typingPaused) tElapsedMs = Date.now() - tStart;
    typingOn = false;
    typingPaused = false;
    suppressTypingInput = false;
    clearInterval(tTimerId);
    tTimerId = null;
    $("#btnTypingStart").disabled = false;
    $("#btnTypingPause").disabled = true;
    $("#btnTypingStop").disabled = true;
    $("#typingInput").disabled = true;

    const dtMin = tElapsedMs / 60000;
    const kpm = dtMin > 0 ? Math.round((tCorrect / dtMin)) : 0;
    const remaining = getTypingRemainingSeconds();
    $("#tTime").textContent = remaining === null ? "∞" : `${remaining}s`;
    $("#tKpm").textContent = opts.typingTimerEnabled ? String(kpm) : (dtMin > 0 ? String(kpm) : "—");

    if (recordStats) {
      stats.typing.runs += 1;
      stats.typing.bestKpm = Math.max(stats.typing.bestKpm, kpm);
      saveJSON(STORAGE.stats, stats);
    }
  }

  function tickTypingTimer() {
    if (!typingOn || typingPaused) return;
    const remaining = getTypingRemainingSeconds();
    if (remaining === null) {
      setTypingUI();
      return;
    }
    $("#tTime").textContent = `${remaining}s`;
    const dtMin = getTypingElapsedMs() / 60000;
    const kpm = dtMin > 0 ? Math.round((tCorrect / dtMin)) : 0;
    $("#tKpm").textContent = typingOn ? String(kpm) : "—";
    if (remaining <= 0) stopTyping(true);
  }

  function resetTypingTarget() {
    typingTarget = makeKanaStream(typingLength);
    typed = "";
    typingInput = "";
    typingMatched = 0;
    typingWrongIndices = new Set();
    typingCorrectIndices = new Set();
    const inputEl = $("#typingInput");
    resetInputField(inputEl, (value) => { suppressTypingInput = value; });
    buildKeyboard($("#keyboard2"), nextNeededCode());
    setTypingUI();
  }

  function startTyping() {
    if (typingOn && typingPaused) {
      resumeTyping();
      return;
    }
    if (typingOn) return;
    stopAllModes({ recordTyping: false });
    typingLength = clampInt($("#tLen").value, 10, 300);
    tLimit = clampInt($("#tTimer").value, 10, 600);

    typingOn = true;
    typingPaused = false;
    pendingDiacritic = null;
    typingTarget = makeKanaStream(typingLength);
    typed = "";
    typingInput = "";
    typingMatched = 0;
    typingWrongIndices = new Set();
    typingCorrectIndices = new Set();
    suppressTypingInput = false;
    tCorrect = 0; tWrong = 0;
    tStart = Date.now();
    tElapsedMs = 0;
    setTypingUI();

    $("#btnTypingStart").disabled = true;
    $("#btnTypingPause").disabled = false;
    $("#btnTypingStop").disabled = false;
    $("#typingInput").disabled = false;
    $("#wordInput").disabled = true;
    $("#sentenceInput").disabled = true;

    buildKeyboard($("#keyboard2"), nextNeededCode());
    tickTypingTimer();
    if (opts.typingTimerEnabled) {
      tTimerId = setInterval(tickTypingTimer, 250);
    }
    $("#typingInput").focus();
  }

  $("#btnTypingStart").addEventListener("click", () => startTyping());
  $("#btnTypingPause").addEventListener("click", () => pauseTyping());
  $("#btnTypingStop").addEventListener("click", () => stopTyping(true));

  function pauseTyping() {
    if (!typingOn || typingPaused) return;
    typingPaused = true;
    tElapsedMs = Date.now() - tStart;
    clearInterval(tTimerId);
    tTimerId = null;
    $("#typingInput").disabled = true;
    $("#btnTypingStart").disabled = false;
    $("#btnTypingPause").disabled = true;
    setTypingUI();
  }

  function resumeTyping() {
    if (!typingOn || !typingPaused) return;
    typingPaused = false;
    tStart = Date.now() - tElapsedMs;
    $("#typingInput").disabled = false;
    $("#btnTypingStart").disabled = true;
    $("#btnTypingPause").disabled = false;
    if (opts.typingTimerEnabled) {
      tTimerId = setInterval(tickTypingTimer, 250);
    }
    $("#typingInput").focus();
    setTypingUI();
  }

  function nextNeededKana() {
    return typingTarget.charAt(typed.length) || null;
  }
  function nextNeededCode() {
    const nk = nextNeededKana();
    if (!nk) return null;
    return Object.keys(map).find(code => map[code] === nk) || null;
  }

  function clampInt(v, min, max) {
    const n = parseInt(v, 10);
    if (Number.isNaN(n)) return min;
    return Math.max(min, Math.min(max, n));
  }



  // ---- Word & Sentence practice (type in a normal text box, highlight mistakes) ----
  let wordOn = false, sentenceOn = false;
  let wordPaused = false;
  let sentencePaused = false;
  let wordTarget = "", wordTyped = "";
  let wDone=0, wCorrect=0, wWrong=0;
  let wordWrongIndices = new Set();
  let wordCorrectIndices = new Set();
  let wordInput = "";
  let wordMatched = 0;
  let suppressWordInput = false;

  let sentenceTarget = "", sentenceTyped = "";
  let sDone=0, sCorrect=0, sWrong=0;
  let sentenceWrongIndices = new Set();
  let sentenceCorrectIndices = new Set();
  let sentenceInput = "";
  let sentenceMatched = 0;
  let suppressSentenceInput = false;

  function setWordUI() {
    renderPassage($("#wordTarget"), wordTarget, wordTyped.length, wordWrongIndices, wordCorrectIndices);
    $("#wordTyped").textContent = wordTyped || "";
    const wordInputEl = $("#wordInput");
    if (wordInputEl.value !== wordInput) wordInputEl.value = wordInput;
    $("#wDone").textContent = String(wDone);
    $("#wCorrect").textContent = String(wCorrect);
    $("#wWrong").textContent = String(wWrong);
    const total = wCorrect + wWrong;
    $("#wAcc").textContent = total ? `${Math.round((wCorrect/total)*100)}%` : "—";
  }
  function setSentenceUI() {
    renderPassage($("#sentenceTarget"), sentenceTarget, sentenceTyped.length, sentenceWrongIndices, sentenceCorrectIndices);
    $("#sentenceTyped").textContent = sentenceTyped || "";
    const sentenceInputEl = $("#sentenceInput");
    if (sentenceInputEl.value !== sentenceInput) sentenceInputEl.value = sentenceInput;
    $("#sDone").textContent = String(sDone);
    $("#sCorrect").textContent = String(sCorrect);
    $("#sWrong").textContent = String(sWrong);
    const total = sCorrect + sWrong;
    $("#sAcc").textContent = total ? `${Math.round((sCorrect/total)*100)}%` : "—";
  }

  function nextChar(target, typed) {
    return target.charAt(typed.length) || null;
  }
  function codeForKanaChar(ch) {
    if (!ch) return null;
    if (ch === " ") return "Space";
    return Object.keys(map).find(code => map[code] === ch) || null;
  }

  const wordHintDefault = "Type the word in the text box. Mistakes highlight red on the target line; fix them to advance.";

  function getActiveWordSet() {
    const selectedId = $("#wordSetSelect")?.value || opts.wordSetId;
    return wordSets.find(set => set.id === selectedId) || null;
  }

  function updateWordHint() {
    const hintEl = $("#wordHint");
    if (!hintEl) return;
    const list = $("#wordListSelect")?.value || opts.wordList || "basic";
    if (list !== "custom") {
      hintEl.textContent = wordHintDefault;
      return;
    }
    const activeSet = getActiveWordSet();
    if (!activeSet) {
      hintEl.textContent = "Create a custom word set to practice with your own kana words.";
      return;
    }
    if (!activeSet.words.length) {
      hintEl.textContent = "Add words (one per line) to this set to start practicing.";
      return;
    }
    hintEl.textContent = `Custom set: ${activeSet.name}. ${wordHintDefault}`;
  }

  function pickWord() {
    const maxLen = clampInt($("#wordMaxLen").value, 2, 12);
    const list = ($("#wordListSelect").value || "basic");
    let candidates = [];
    if (list === "all") {
      // generate random "words" as kana sequences from pool
      const pool = getPool();
      const len = Math.max(2, Math.min(maxLen, 2 + Math.floor(Math.random()*Math.max(1, maxLen-1))));
      wordTarget = "";
      for (let i=0;i<len;i++) wordTarget += pool[Math.floor(Math.random()*pool.length)];
      wordTyped = "";
      wordWrongIndices = new Set();
      wordCorrectIndices = new Set();
    } else if (list === "custom") {
      const activeSet = getActiveWordSet();
      const words = activeSet?.words || [];
      candidates = words.filter(w => w.length <= maxLen);
      if (!candidates.length && words.length) candidates = words;
      if (!candidates.length) candidates = WORD_LISTS.basic.slice();
      wordTarget = candidates[Math.floor(Math.random()*candidates.length)];
      wordTyped = "";
      wordWrongIndices = new Set();
      wordCorrectIndices = new Set();
    } else {
      candidates = WORD_LISTS.basic.slice();
      candidates = candidates.filter(w => w.length <= maxLen);
      if (!candidates.length) candidates = WORD_LISTS.basic;
      wordTarget = candidates[Math.floor(Math.random()*candidates.length)];
      wordTyped = "";
      wordWrongIndices = new Set();
      wordCorrectIndices = new Set();
    }
    wordInput = "";
    wordMatched = 0;
    const wordInputEl = $("#wordInput");
    resetInputField(wordInputEl, (value) => { suppressWordInput = value; });
    buildKeyboard($("#keyboardWord"), codeForKanaChar(nextChar(wordTarget, wordTyped)));
    setWordUI();
  }

  function pickSentence() {
    const list = ($("#sentenceListSelect").value || "basic");
    const candidates = (SENTENCE_LISTS[list] || SENTENCE_LISTS.basic).slice();
    sentenceTarget = candidates[Math.floor(Math.random()*candidates.length)];
    sentenceTyped = "";
    sentenceWrongIndices = new Set();
    sentenceCorrectIndices = new Set();
    sentenceInput = "";
    sentenceMatched = 0;
    const sentenceInputEl = $("#sentenceInput");
    resetInputField(sentenceInputEl, (value) => { suppressSentenceInput = value; });
    buildKeyboard($("#keyboardSentence"), codeForKanaChar(nextChar(sentenceTarget, sentenceTyped)));
    setSentenceUI();
  }

  function saveWordSets() {
    saveJSON(STORAGE.wordSets, wordSets);
  }

  function sanitizeWordListInput(value) {
    return value
      .split("\n")
      .map(line => line.trim())
      .filter(Boolean);
  }

  function renderWordSetOptions() {
    const select = $("#wordSetSelect");
    if (!select) return;
    select.innerHTML = "";
    if (!wordSets.length) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "No custom sets yet";
      opt.disabled = true;
      opt.selected = true;
      select.appendChild(opt);
      return;
    }
    for (const set of wordSets) {
      const opt = document.createElement("option");
      opt.value = set.id;
      opt.textContent = set.name;
      select.appendChild(opt);
    }
  }

  function updateWordSetEditor() {
    const nameInput = $("#wordSetName");
    const wordsInput = $("#wordSetWords");
    const deleteBtn = $("#btnWordSetDelete");
    const addLineBtn = $("#btnWordSetAddLine");
    const activeSet = getActiveWordSet();
    const hasSet = !!activeSet;
    if (nameInput) {
      nameInput.disabled = !hasSet;
      nameInput.value = hasSet ? activeSet.name : "";
    }
    if (wordsInput) {
      wordsInput.disabled = !hasSet;
      wordsInput.value = hasSet ? activeSet.words.join("\n") : "";
    }
    if (deleteBtn) deleteBtn.disabled = !hasSet;
    if (addLineBtn) addLineBtn.disabled = !hasSet;
  }

  function updateWordListSelectState() {
    const listSelect = $("#wordListSelect");
    if (!listSelect) return;
    const customOption = listSelect.querySelector('option[value="custom"]');
    if (customOption) customOption.disabled = wordSets.length === 0;
    if (wordSets.length === 0 && listSelect.value === "custom") {
      listSelect.value = "basic";
      opts.wordList = "basic";
      saveJSON(STORAGE.opts, opts);
    }
    updateWordHint();
  }

  function selectWordSet(id) {
    const select = $("#wordSetSelect");
    if (!select) return;
    if (id && wordSets.some(set => set.id === id)) {
      select.value = id;
      opts.wordSetId = id;
    } else if (wordSets.length) {
      select.value = wordSets[0].id;
      opts.wordSetId = wordSets[0].id;
    } else {
      select.value = "";
      opts.wordSetId = "";
    }
    saveJSON(STORAGE.opts, opts);
    updateWordSetEditor();
    updateWordHint();
  }

  function startWord() {
    if (wordOn && wordPaused) {
      resumeWord();
      return;
    }
    if (wordOn) return;
    stopAllModes({ recordTyping: false });
    wordOn = true; sentenceOn = false; practiceOn = false; typingOn = false;
    wordPaused = false;
    wDone=0; wCorrect=0; wWrong=0;
    wordWrongIndices = new Set();
    wordCorrectIndices = new Set();
    wordInput = "";
    wordMatched = 0;
    suppressWordInput = false;
    pendingDiacritic = null;
    $("#btnWordStart").disabled = true;
    $("#btnWordPause").disabled = false;
    $("#btnWordStop").disabled = false;
    $("#wordInput").disabled = false;
    $("#typingInput").disabled = true;
    $("#sentenceInput").disabled = true;
    pickWord();
    $("#wordInput").focus();
  }

  function stopWord() {
    if (!wordOn) return;
    wordOn = false;
    wordPaused = false;
    $("#btnWordStart").disabled = false;
    $("#btnWordPause").disabled = true;
    $("#btnWordStop").disabled = true;
    wordTarget = ""; wordTyped = "";
    wordWrongIndices = new Set();
    wordCorrectIndices = new Set();
    wordInput = "";
    wordMatched = 0;
    suppressWordInput = false;
    $("#wordInput").disabled = true;
    buildKeyboard($("#keyboardWord"), null);
    setWordUI();
  }

  function startSentence() {
    if (sentenceOn && sentencePaused) {
      resumeSentence();
      return;
    }
    if (sentenceOn) return;
    stopAllModes({ recordTyping: false });
    sentenceOn = true; wordOn = false; practiceOn = false; typingOn = false;
    sentencePaused = false;
    sDone=0; sCorrect=0; sWrong=0;
    sentenceWrongIndices = new Set();
    sentenceCorrectIndices = new Set();
    sentenceInput = "";
    sentenceMatched = 0;
    suppressSentenceInput = false;
    pendingDiacritic = null;
    $("#btnSentenceStart").disabled = true;
    $("#btnSentencePause").disabled = false;
    $("#btnSentenceStop").disabled = false;
    $("#sentenceInput").disabled = false;
    $("#typingInput").disabled = true;
    $("#wordInput").disabled = true;
    pickSentence();
    $("#sentenceInput").focus();
  }

  function stopSentence() {
    if (!sentenceOn) return;
    sentenceOn = false;
    sentencePaused = false;
    $("#btnSentenceStart").disabled = false;
    $("#btnSentencePause").disabled = true;
    $("#btnSentenceStop").disabled = true;
    sentenceTarget = ""; sentenceTyped = "";
    sentenceWrongIndices = new Set();
    sentenceCorrectIndices = new Set();
    sentenceInput = "";
    sentenceMatched = 0;
    suppressSentenceInput = false;
    $("#sentenceInput").disabled = true;
    buildKeyboard($("#keyboardSentence"), null);
    setSentenceUI();
  }

  function pauseWord() {
    if (!wordOn || wordPaused) return;
    wordPaused = true;
    $("#wordInput").disabled = true;
    $("#btnWordStart").disabled = false;
    $("#btnWordPause").disabled = true;
  }

  function resumeWord() {
    if (!wordOn || !wordPaused) return;
    wordPaused = false;
    $("#wordInput").disabled = false;
    $("#btnWordStart").disabled = true;
    $("#btnWordPause").disabled = false;
    $("#wordInput").focus();
  }

  function pauseSentence() {
    if (!sentenceOn || sentencePaused) return;
    sentencePaused = true;
    $("#sentenceInput").disabled = true;
    $("#btnSentenceStart").disabled = false;
    $("#btnSentencePause").disabled = true;
  }

  function resumeSentence() {
    if (!sentenceOn || !sentencePaused) return;
    sentencePaused = false;
    $("#sentenceInput").disabled = false;
    $("#btnSentenceStart").disabled = true;
    $("#btnSentencePause").disabled = false;
    $("#sentenceInput").focus();
  }

  $("#btnWordStart").addEventListener("click", () => startWord());
  $("#btnWordPause").addEventListener("click", () => pauseWord());
  $("#btnWordStop").addEventListener("click", () => stopWord());

  $("#btnSentenceStart").addEventListener("click", () => startSentence());
  $("#btnSentencePause").addEventListener("click", () => pauseSentence());
  $("#btnSentenceStop").addEventListener("click", () => stopSentence());

  function maxInputLengthForTarget(target) {
    let extra = 0;
    for (const ch of target) {
      if (decomposeVoiced(ch)) extra += 1;
    }
    return target.length + extra;
  }

  function clampInputToTarget(input, target) {
    const maxLen = maxInputLengthForTarget(target);
    if (input.length <= maxLen) return input;
    return input.slice(0, maxLen);
  }

  function resetTextInput(inputEl) {
    inputEl.value = "";
    inputEl.setSelectionRange(0, 0);
  }

  function resetInputField(inputEl, setSuppressFlag) {
    if (setSuppressFlag) setSuppressFlag(true);
    resetTextInput(inputEl);
    inputEl.dispatchEvent(new Event("input", { bubbles: true }));
    if (setSuppressFlag) setSuppressFlag(false);
  }

  function applyCorrectStats(chars) {
    for (const ch of chars) {
      if (!ch || ch === " ") continue;
      ensureKanaStat(ch).c += 1;
    }
  }

  function applyWrongStats(char, count) {
    if (!char || char === " ") return;
    for (let i = 0; i < count; i += 1) {
      ensureKanaStat(char).w += 1;
    }
  }

  function handleTypingInputChange() {
    if (!typingOn || typingPaused) return;
    const inputEl = $("#typingInput");
    if (suppressTypingInput) {
      suppressTypingInput = false;
      if (typingInput === "") resetTextInput(inputEl);
      else if (inputEl.value !== typingInput) inputEl.value = typingInput;
      return;
    }
    let value = clampInputToTarget(inputEl.value, typingTarget);
    if (value !== inputEl.value) inputEl.value = value;

    const prevValue = typingInput;
    const { correctIndices, wrongIndices, nextTargetIndex, inputToTarget, inputStates } = evaluateInput(typingTarget, value);

    typingInput = value;
    typingMatched = nextTargetIndex;
    typingWrongIndices = wrongIndices;
    typingCorrectIndices = correctIndices;
    typed = typingTarget.slice(0, nextTargetIndex);

    const added = Math.max(0, value.length - prevValue.length);
    if (added > 0) {
      for (let i = prevValue.length; i < value.length; i += 1) {
        const targetIndex = inputToTarget[i];
        if (targetIndex == null) continue;
        const expected = typingTarget.charAt(targetIndex);
        const state = inputStates[i];
        if (state !== "correct" && state !== "wrong") continue;
        if (state === "correct") {
          tCorrect += 1;
          applyCorrectStats(expected);
        } else {
          tWrong += 1;
          applyWrongStats(expected, 1);
        }
      }
      saveJSON(STORAGE.stats, stats);
    }

    buildKeyboard($("#keyboard2"), nextNeededCode());
    setTypingUI();
    if (typingWrongIndices.size === 0 && typingMatched >= typingTarget.length) {
      resetTypingTarget();
    }
  }

  function handleWordInputChange() {
    if (!wordOn || wordPaused) return;
    const inputEl = $("#wordInput");
    if (suppressWordInput) {
      suppressWordInput = false;
      if (wordInput === "") resetTextInput(inputEl);
      else if (inputEl.value !== wordInput) inputEl.value = wordInput;
      return;
    }
    let value = clampInputToTarget(inputEl.value, wordTarget);
    if (value !== inputEl.value) inputEl.value = value;

    const prevValue = wordInput;
    const { correctIndices, wrongIndices, nextTargetIndex, inputToTarget, inputStates } = evaluateInput(wordTarget, value);

    wordInput = value;
    wordMatched = nextTargetIndex;
    wordWrongIndices = wrongIndices;
    wordCorrectIndices = correctIndices;
    wordTyped = wordTarget.slice(0, nextTargetIndex);

    const added = Math.max(0, value.length - prevValue.length);
    if (added > 0) {
      for (let i = prevValue.length; i < value.length; i += 1) {
        const targetIndex = inputToTarget[i];
        if (targetIndex == null) continue;
        const expected = wordTarget.charAt(targetIndex);
        const state = inputStates[i];
        if (state !== "correct" && state !== "wrong") continue;
        if (state === "correct") {
          wCorrect += 1;
          stats.word.correct += 1;
          applyCorrectStats(expected);
        } else {
          wWrong += 1;
          stats.word.wrong += 1;
          applyWrongStats(expected, 1);
        }
      }
      saveJSON(STORAGE.stats, stats);
    }

    if (wordWrongIndices.size === 0 && wordMatched >= wordTarget.length) {
      wDone += 1;
      stats.word.words += 1;
      pickWord();
      $("#wordInput").focus();
      return;
    }
    buildKeyboard($("#keyboardWord"), codeForKanaChar(nextChar(wordTarget, wordTyped)));
    setWordUI();
  }

  function handleSentenceInputChange() {
    if (!sentenceOn || sentencePaused) return;
    const inputEl = $("#sentenceInput");
    if (suppressSentenceInput) {
      suppressSentenceInput = false;
      if (sentenceInput === "") resetTextInput(inputEl);
      else if (inputEl.value !== sentenceInput) inputEl.value = sentenceInput;
      return;
    }
    let value = clampInputToTarget(inputEl.value, sentenceTarget);
    if (value !== inputEl.value) inputEl.value = value;

    const prevValue = sentenceInput;
    const { correctIndices, wrongIndices, nextTargetIndex, inputToTarget, inputStates } = evaluateInput(sentenceTarget, value, true);

    sentenceInput = value;
    sentenceMatched = nextTargetIndex;
    sentenceWrongIndices = wrongIndices;
    sentenceCorrectIndices = correctIndices;
    sentenceTyped = sentenceTarget.slice(0, nextTargetIndex);

    const added = Math.max(0, value.length - prevValue.length);
    if (added > 0) {
      for (let i = prevValue.length; i < value.length; i += 1) {
        const targetIndex = inputToTarget[i];
        if (targetIndex == null) continue;
        const expected = sentenceTarget.charAt(targetIndex);
        const state = inputStates[i];
        if (state !== "correct" && state !== "wrong") continue;
        if (state === "correct") {
          sCorrect += 1;
          stats.sentence.correct += 1;
          applyCorrectStats(expected);
        } else {
          sWrong += 1;
          stats.sentence.wrong += 1;
          applyWrongStats(expected, 1);
        }
      }
      saveJSON(STORAGE.stats, stats);
    }

    if (sentenceWrongIndices.size === 0 && sentenceMatched >= sentenceTarget.length) {
      sDone += 1;
      stats.sentence.sentences += 1;
      pickSentence();
      $("#sentenceInput").focus();
      return;
    }
    buildKeyboard($("#keyboardSentence"), codeForKanaChar(nextChar(sentenceTarget, sentenceTyped)));
    setSentenceUI();
  }

  function processInput(kana, code) {
    if (!kana) return;
    if (practiceOn) {
      if (practicePaused) return;
      if (!targetKana || (opts.inputMode !== "native" && !targetCode)) {
        // If targetCode missing (not in map), just pick another
        pickTarget();
        return;
      }
      const ok = opts.inputMode === "native" ? (kana === targetKana) : (code === targetCode);
      markPractice(ok, code, kana);
    }
  }

  // ---- Global key listener ----
  window.addEventListener("keydown", (e) => {
    // Don't hijack browser shortcuts
    if (e.metaKey || e.ctrlKey) return;

    if (typingOn || wordOn || sentenceOn) return;
    if (opts.inputMode === "native") {
      if (!practiceOn) return;
      if (e.code === "Space") e.preventDefault();
      focusImeInput();
      return;
    }

    const code = e.code;

    if (code === "Backspace" && pendingDiacritic) {
      e.preventDefault();
      pendingDiacritic = null;
      return;
    }

    // Ignore modifier keys
    if (["ShiftLeft","ShiftRight","AltLeft","AltRight","ControlLeft","ControlRight","MetaLeft","MetaRight","CapsLock","Tab"].includes(code)) return;

    // prevent page scroll on space
    if (code === "Space") e.preventDefault();

    let inputKana = "";
    if (opts.inputMode === "native") {
      if (e.isComposing || e.key === "Process") return;
      if (e.key === " " || e.key === "Spacebar") {
        inputKana = " ";
      } else if (e.key && e.key.length === 1) {
        inputKana = e.key;
      } else {
        return;
      }
    } else {
      inputKana = code === "Space" ? " " : (map[code] || "");
    }

    if (!inputKana) return;
    if (opts.inputMode !== "native") {
      const expectedKana = getExpectedKana();
      const isDiacritic = inputKana === "゛" || inputKana === "゜";

      if (pendingDiacritic) {
        if (isDiacritic) {
          const combined = combineDiacritic(pendingDiacritic.kana, inputKana);
          if (combined) {
            inputKana = combined;
            pendingDiacritic = null;
          } else {
            processInput(pendingDiacritic.kana, pendingDiacritic.code);
            pendingDiacritic = null;
          }
        } else {
          processInput(pendingDiacritic.kana, pendingDiacritic.code);
          pendingDiacritic = null;
        }
      }

      if (!pendingDiacritic && !isDiacritic) {
        const expectedParts = expectedKana ? decomposeVoiced(expectedKana) : null;
        if (expectedParts && expectedParts.base === inputKana) {
          pendingDiacritic = { kana: inputKana, code };
          flashKey(code);
          return;
        }
      }
    }

    processInput(inputKana, code);
  });

  $("#typingInput").addEventListener("input", handleTypingInputChange);
  $("#wordInput").addEventListener("input", handleWordInputChange);
  $("#sentenceInput").addEventListener("input", handleSentenceInputChange);
  imeInput.addEventListener("input", handleImeInput);
  imeInput.addEventListener("compositionend", handleImeInput);
  $("#typingInput").disabled = true;
  $("#wordInput").disabled = true;
  $("#sentenceInput").disabled = true;

  // ---- Word Sets UI ----
  $("#wordListSelect").value = opts.wordList || "basic";
  renderWordSetOptions();
  selectWordSet(opts.wordSetId);
  updateWordListSelectState();

  $("#wordListSelect").addEventListener("change", (e) => {
    opts.wordList = e.target.value;
    saveJSON(STORAGE.opts, opts);
    updateWordListSelectState();
    if (wordOn && !wordPaused) pickWord();
  });

  $("#wordSetSelect").addEventListener("change", (e) => {
    opts.wordSetId = e.target.value;
    saveJSON(STORAGE.opts, opts);
    updateWordSetEditor();
    updateWordHint();
    if (wordOn && !wordPaused && $("#wordListSelect").value === "custom") pickWord();
  });

  $("#wordSetName").addEventListener("input", (e) => {
    const activeSet = getActiveWordSet();
    if (!activeSet) return;
    const value = e.target.value.trim();
    activeSet.name = value || activeSet.name;
    saveWordSets();
    renderWordSetOptions();
    selectWordSet(activeSet.id);
  });

  $("#wordSetWords").addEventListener("input", (e) => {
    const activeSet = getActiveWordSet();
    if (!activeSet) return;
    activeSet.words = sanitizeWordListInput(e.target.value);
    saveWordSets();
    updateWordHint();
    if (wordOn && !wordPaused && $("#wordListSelect").value === "custom") pickWord();
  });

  $("#btnWordSetAdd").addEventListener("click", () => {
    const nameInput = $("#wordSetName");
    const rawName = nameInput?.value.trim();
    const baseName = rawName || `Custom Set ${wordSets.length + 1}`;
    const name = wordSets.some(set => set.name === baseName)
      ? `${baseName} (${wordSets.length + 1})`
      : baseName;
    const newSet = {
      id: `custom-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      name,
      words: []
    };
    wordSets.push(newSet);
    saveWordSets();
    renderWordSetOptions();
    selectWordSet(newSet.id);
    updateWordListSelectState();
    if (nameInput) nameInput.value = newSet.name;
    const wordsInput = $("#wordSetWords");
    if (wordsInput) wordsInput.focus();
  });

  $("#btnWordSetDelete").addEventListener("click", () => {
    const activeSet = getActiveWordSet();
    if (!activeSet) return;
    if (!confirm(`Delete "${activeSet.name}"?`)) return;
    wordSets = wordSets.filter(set => set.id !== activeSet.id);
    saveWordSets();
    renderWordSetOptions();
    selectWordSet(opts.wordSetId);
    updateWordListSelectState();
    if (wordOn && !wordPaused && $("#wordListSelect").value === "custom") pickWord();
  });

  $("#btnWordSetAddLine").addEventListener("click", () => {
    const wordsInput = $("#wordSetWords");
    if (!wordsInput || wordsInput.disabled) return;
    if (wordsInput.value && !wordsInput.value.endsWith("\n")) {
      wordsInput.value += "\n";
    } else if (!wordsInput.value) {
      wordsInput.value = "";
    }
    wordsInput.focus();
  });

  // ---- Settings UI ----
  function renderSettings() {
    $("#layoutSelect").value = opts.layout || "jis";
    $("#inputModeSelect").value = opts.inputMode || "mapped";
    $("#keyboardToggle").value = opts.showKeyboard ? "on" : "off";
    $("#typingTimerToggle").value = opts.typingTimerEnabled ? "on" : "off";
    $("#tTimer").disabled = !opts.typingTimerEnabled;
    syncBackgroundVideoUI();

    renderMapTable();
    renderSets();
    // keyboard preview
    buildKeyboard($("#keyboard"), null);
    applyKeyboardVisibility();
  }

  $("#layoutSelect").addEventListener("change", (e) => {
    const v = e.target.value;
    opts.layout = v;
    // If user hasn't customized, swapping layout should also swap default map
    map = loadJSON(STORAGE.map, null) || DEFAULT_MAPS[v] || DEFAULT_MAPS.jis;
    // If stored map exists, keep it. Otherwise load default.
    if (!localStorage.getItem(STORAGE.map)) map = DEFAULT_MAPS[v] || DEFAULT_MAPS.jis;
    saveJSON(STORAGE.opts, opts);
    saveJSON(STORAGE.map, map);
    renderSettings();
  });

  $("#inputModeSelect").addEventListener("change", (e) => {
    opts.inputMode = e.target.value;
    saveJSON(STORAGE.opts, opts);
  });

  $("#keyboardToggle").addEventListener("change", (e) => {
    opts.showKeyboard = e.target.value === "on";
    saveJSON(STORAGE.opts, opts);
    applyKeyboardVisibility();
  });

  $("#typingTimerToggle").addEventListener("change", (e) => {
    opts.typingTimerEnabled = e.target.value === "on";
    saveJSON(STORAGE.opts, opts);
    $("#tTimer").disabled = !opts.typingTimerEnabled;
    if (typingOn && !typingPaused) {
      if (opts.typingTimerEnabled && !tTimerId) {
        tTimerId = setInterval(tickTypingTimer, 250);
      } else if (!opts.typingTimerEnabled && tTimerId) {
        clearInterval(tTimerId);
        tTimerId = null;
      }
    }
    setTypingUI();
  });

  $("#backgroundVideoSelect").addEventListener("change", (e) => {
    opts.backgroundVideo = e.target.value;
    saveJSON(STORAGE.opts, opts);
    renderBackgroundVideo();
    syncBackgroundVideoUI();
  });

  reducedMotionQuery.addEventListener("change", () => {
    syncBackgroundVideoUI();
    renderBackgroundVideo();
  });


  function renderMapTable() {
    const codes = [];
    for (const row of KEYBOARD_ROWS) {
      for (const k of row) {
        if (k.code && !["Space","Enter","Backspace","Tab","CapsLock","ShiftLeft","ShiftRight","ControlLeft","ControlRight","AltLeft","AltRight"].includes(k.code)) {
          codes.push(k.code);
        }
      }
    }
    const host = $("#mapTable");
    host.innerHTML = "";
    for (const code of codes) {
      const cell = document.createElement("div");
      cell.className = "mapCell";
      const c = document.createElement("div");
      c.className = "code";
      c.textContent = code;
      const input = document.createElement("input");
      input.value = map[code] || "";
      input.maxLength = 2;
      input.addEventListener("input", () => {
        const v = input.value.trim();
        if (v === "") delete map[code];
        else map[code] = v;
        saveJSON(STORAGE.map, map);
      });
      cell.appendChild(c);
      cell.appendChild(input);
      host.appendChild(cell);
    }
  }

  function renderSets() {
    const host = $("#sets");
    host.innerHTML = "";
    for (const s of SETS) {
      const chip = document.createElement("label");
      chip.className = "chip";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = !!enabledSets[s.id];
      cb.addEventListener("change", () => {
        enabledSets[s.id] = cb.checked;
        saveJSON(STORAGE.sets, enabledSets);
      });
      const span = document.createElement("span");
      span.textContent = s.name;
      chip.appendChild(cb);
      chip.appendChild(span);
      host.appendChild(chip);
    }
  }

  // Export/Import map
  $("#btnExport").addEventListener("click", async () => {
    const payload = { map, enabledSets, opts, wordSets, version: 1 };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kana_keyboard_trainer_map.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  $("#importFile").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const txt = await file.text();
      const payload = JSON.parse(txt);
      if (payload.map && typeof payload.map === "object") map = payload.map;
      if (payload.enabledSets && typeof payload.enabledSets === "object") enabledSets = payload.enabledSets;
      if (payload.opts && typeof payload.opts === "object") opts = {...opts, ...payload.opts};
      if (Array.isArray(payload.wordSets)) wordSets = normalizeWordSets(payload.wordSets);
      saveJSON(STORAGE.map, map);
      saveJSON(STORAGE.sets, enabledSets);
      saveJSON(STORAGE.opts, opts);
      saveJSON(STORAGE.wordSets, wordSets);
      renderSettings();
      renderWordSetOptions();
      selectWordSet(opts.wordSetId);
      updateWordListSelectState();
      alert("Imported map ✅");
    } catch {
      alert("Import failed. Make sure it's a JSON export from this app.");
    } finally {
      e.target.value = "";
    }
  });

  $("#btnResetMap").addEventListener("click", () => {
    if (!confirm("Reset keyboard map to defaults?")) return;
    map = DEFAULT_MAPS[opts.layout] || DEFAULT_MAPS.jis;
    localStorage.removeItem(STORAGE.map);
    saveJSON(STORAGE.map, map);
    renderSettings();
  });

  // Stats
  function renderStats() {
    const g = $("#statsGrid");
    g.innerHTML = "";

    const cards = [
      { k:"Practice correct", v: stats.practice.correct },
      { k:"Practice wrong", v: stats.practice.wrong },
      { k:"Best streak", v: stats.practice.bestStreak },
      { k:"Typing runs", v: stats.typing.runs },
      { k:"Best KPM", v: stats.typing.bestKpm },
      { k:"Words done", v: stats.word?.words ?? 0 },
      { k:"Sentences done", v: stats.sentence?.sentences ?? 0 },
    ];

    for (const c of cards) {
      const div = document.createElement("div");
      div.className = "statBox";
      div.innerHTML = `<div class="k">${c.k}</div><div class="v">${c.v}</div>`;
      g.appendChild(div);
    }

    // heatmap
    const hm = $("#heatmap");
    hm.innerHTML = "";
    const pool = Array.from(new Set(SETS.flatMap(s => s.items)));
    for (const k of pool) {
      const st = ensureKanaStat(k);
      const total = st.c + st.w;
      const acc = total ? Math.round((st.c/total)*100) : null;

      const cell = document.createElement("div");
      cell.className = "hm";
      // Shade by accuracy (simple inline style)
      let alpha = 0.06;
      if (acc !== null) {
        // lower acc -> higher red alpha
        const miss = 1 - (acc/100);
        alpha = 0.06 + miss * 0.22;
      }
      cell.style.background = `rgba(251, 113, 133, ${alpha})`;
      cell.innerHTML = `<div class="k">${k}</div><div class="v">${acc===null ? "—" : acc + "%"} </div>`;
      hm.appendChild(cell);
    }
  }

  $("#btnResetStats").addEventListener("click", () => {
    if (!confirm("Reset all stats?")) return;
    stats = {
      practice: { correct:0, wrong:0, bestStreak:0 },
      typing: { runs:0, bestKpm:0 },
      word: { words:0, correct:0, wrong:0 },
      sentence: { sentences:0, correct:0, wrong:0 },
      kana: {}
    };
    saveJSON(STORAGE.stats, stats);
    renderStats();
    alert("Stats reset ✅");
  });

  // Initial render
  buildKeyboard($("#keyboard"), null);
  buildKeyboard($("#keyboard2"), null);
  applyKeyboardVisibility();
  $("#tTimer").disabled = !opts.typingTimerEnabled;
  syncBackgroundVideoUI();
  renderBackgroundVideo();
  nav("home");

  // PWA register
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }
})();
