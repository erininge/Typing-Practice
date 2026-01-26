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
  };

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
      "あたらしい","おおきい","ちいさい","はやい","おそい","たのしい","むずかしい"
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
      "これをよんでください"
    ]
  };


  const defaultEnabledSets = () => {
    // enable everything except diacritics by default
    const obj = {};
    for (const s of SETS) obj[s.id] = s.id !== "diac";
    return obj;
  };

  const defaultOpts = () => ({
    tts: "off",
    ttsFallback: "jpOnly",
    layout: "jis",
    inputMode: "mapped",
    showKeyboard: true
  });

  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch { return fallback; }
  }
  function saveJSON(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

  let opts = loadJSON(STORAGE.opts, defaultOpts());
  // normalize older saved options
  if (!opts.ttsFallback) opts.ttsFallback = "jpOnly";
  if (!opts.inputMode) opts.inputMode = "mapped";
  if (typeof opts.showKeyboard !== "boolean") opts.showKeyboard = true;
  let map = loadJSON(STORAGE.map, DEFAULT_MAPS[opts.layout] || DEFAULT_MAPS.jis);
  let enabledSets = loadJSON(STORAGE.sets, defaultEnabledSets());
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

  function nav(id) {
    ["home","practice","word","sentence","typing","stats","settings"].forEach(x => {
      const el = document.getElementById(x);
      el.classList.toggle("hidden", x !== id);
    });
    if (id === "settings") renderSettings();
    if (id === "stats") renderStats();
  }

  $$("[data-nav]").forEach(btn => btn.addEventListener("click", () => nav(btn.dataset.nav)));

  // ---- TTS ----
  let cachedVoices = [];
  function refreshVoices() {
    try { cachedVoices = speechSynthesis.getVoices?.() || []; } catch { cachedVoices = []; }
  }
  if ("speechSynthesis" in window) {
    refreshVoices();
    window.speechSynthesis.onvoiceschanged = () => refreshVoices();
  }

  function speakKana(kana) {
    if (opts.tts !== "on") return;
    if (!("speechSynthesis" in window)) return;

    refreshVoices();
    const u = new SpeechSynthesisUtterance(kana);
    const voices = cachedVoices || [];
    const ja = voices.find(v => /ja|jpn/i.test(v.lang) || /japanese/i.test(v.name));

    if (ja) {
      u.voice = ja;
      u.lang = ja.lang || "ja-JP";
    } else {
      // fallback behavior for devices without Japanese voices installed
      if ((opts.ttsFallback || "jpOnly") === "jpOnly") return;
      u.lang = "ja-JP";
    }

    u.rate = 1.0;
    try {
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    } catch {
      // ignore
    }
  }

  // ---- Build practicing pool ----
  function getPool() {
    const pool = [];
    for (const s of SETS) {
      if (enabledSets[s.id]) pool.push(...s.items);
    }
    if (opts.inputMode === "native") return pool;
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

  function renderPassage(el, target, typedValue, wrongIndex) {
    el.innerHTML = "";
    if (!target) {
      el.textContent = "—";
      return;
    }
    for (let i = 0; i < target.length; i += 1) {
      const ch = target[i];
      const span = document.createElement("span");
      span.className = "passageChar";
      if (i < typedValue.length) span.classList.add("correct");
      if (wrongIndex === i) span.classList.add("wrong");
      if (i === typedValue.length && wrongIndex == null) span.classList.add("current");
      span.textContent = ch;
      el.appendChild(span);
    }
  }

  // ---- Practice mode ----
  let practiceOn = false;
  let targetKana = null;
  let targetCode = null;
  let streak = 0, correct=0, wrong=0;

  function pickTarget() {
    const pool = getPool();
    targetKana = pool[Math.floor(Math.random() * pool.length)];
    targetCode = Object.keys(map).find(code => map[code] === targetKana) || null;
    $("#targetKana").textContent = targetKana || "—";
    $("#feedback").textContent = "";
    $("#feedback").className = "feedback";
    buildKeyboard($("#keyboard"), targetCode);
    speakKana(targetKana);
  }

  function updatePracticeStats() {
    $("#streak").textContent = String(streak);
    $("#correct").textContent = String(correct);
    $("#wrong").textContent = String(wrong);
    const total = correct + wrong;
    $("#acc").textContent = total ? `${Math.round((correct/total)*100)}%` : "—";
  }

  $("#btnPracticeStart").addEventListener("click", () => {
    practiceOn = true;
    streak = 0; correct = 0; wrong = 0;
    updatePracticeStats();
    pickTarget();
    $("#btnPracticeStart").disabled = true;
    $("#btnPracticeStop").disabled = false;
  });

  $("#btnPracticeStop").addEventListener("click", () => {
    practiceOn = false;
    $("#btnPracticeStart").disabled = false;
    $("#btnPracticeStop").disabled = true;
    $("#feedback").textContent = "Stopped.";
    $("#feedback").className = "feedback";
    buildKeyboard($("#keyboard"), null);
    $("#targetKana").textContent = "—";
  });

  function markPractice(correctHit, pressedCode, inputKana) {
    const fb = $("#feedback");
    const gotKana = map[pressedCode] || "—";
    flashKey(pressedCode);
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

  // ---- Typing mode ----
  let typingOn = false;
  let typingTarget = "";
  let typed = "";
  let tCorrect = 0, tWrong = 0;
  let tStart = 0;
  let tTimerId = null;
  let tLimit = 60;

  function setTypingUI() {
    $("#typingTarget").textContent = typingTarget || "—";
    $("#typingTyped").textContent = typed || "";
    $("#tCorrect").textContent = String(tCorrect);
    $("#tWrong").textContent = String(tWrong);
    if (!typingOn) {
      $("#tTime").textContent = "—";
      $("#tKpm").textContent = "—";
    }
  }

  function makeKanaStream(n) {
    const pool = getPool();
    let out = "";
    for (let i=0;i<n;i++) out += pool[Math.floor(Math.random()*pool.length)];
    return out;
  }

  function stopTyping() {
    typingOn = false;
    clearInterval(tTimerId);
    tTimerId = null;
    $("#btnTypingStart").disabled = false;
    $("#btnTypingStop").disabled = true;

    const dtMin = (Date.now() - tStart) / 60000;
    const kpm = dtMin > 0 ? Math.round((tCorrect / dtMin)) : 0;
    $("#tTime").textContent = `${Math.max(0, Math.round((tLimit*1000 - (Date.now()-tStart))/1000))}s`;
    $("#tKpm").textContent = String(kpm);

    stats.typing.runs += 1;
    stats.typing.bestKpm = Math.max(stats.typing.bestKpm, kpm);
    saveJSON(STORAGE.stats, stats);
  }

  function tickTypingTimer() {
    const remaining = Math.max(0, Math.round((tLimit*1000 - (Date.now()-tStart))/1000));
    $("#tTime").textContent = `${remaining}s`;
    const dtMin = (Date.now() - tStart) / 60000;
    const kpm = dtMin > 0 ? Math.round((tCorrect / dtMin)) : 0;
    $("#tKpm").textContent = typingOn ? String(kpm) : "—";
    if (remaining <= 0) stopTyping();
  }

  $("#btnTypingStart").addEventListener("click", () => {
    const len = clampInt($("#tLen").value, 10, 300);
    tLimit = clampInt($("#tTimer").value, 10, 600);

    typingOn = true;
    typingTarget = makeKanaStream(len);
    typed = "";
    tCorrect = 0; tWrong = 0;
    tStart = Date.now();
    setTypingUI();

    $("#btnTypingStart").disabled = true;
    $("#btnTypingStop").disabled = false;

    buildKeyboard($("#keyboard2"), nextNeededCode());
    tickTypingTimer();
    tTimerId = setInterval(tickTypingTimer, 250);
  });

  $("#btnTypingStop").addEventListener("click", () => stopTyping());

  function nextNeededKana() {
    return typingTarget.charAt(typed.length) || null;
  }
  function nextNeededCode() {
    const nk = nextNeededKana();
    if (!nk) return null;
    return Object.keys(map).find(code => map[code] === nk) || null;
  }

  function typingKey(kana, pressedCode) {
    if (!typingOn) return;
    if (!kana) return;

    const need = nextNeededKana();
    flashKey(pressedCode);

    if (kana === need) {
      typed += kana;
      tCorrect += 1;
      ensureKanaStat(kana).c += 1;
      // advance highlight
      buildKeyboard($("#keyboard2"), nextNeededCode());
      if (typed.length >= typingTarget.length) stopTyping();
    } else {
      tWrong += 1;
      ensureKanaStat(need || kana).w += 1;
    }
    saveJSON(STORAGE.stats, stats);
    setTypingUI();
  }

  function clampInt(v, min, max) {
    const n = parseInt(v, 10);
    if (Number.isNaN(n)) return min;
    return Math.max(min, Math.min(max, n));
  }



  // ---- Word & Sentence practice (step-through typing, no advance on wrong key) ----
  let wordOn = false, sentenceOn = false;
  let wordTarget = "", wordTyped = "";
  let wDone=0, wCorrect=0, wWrong=0;
  let wordWrongIndex = null;

  let sentenceTarget = "", sentenceTyped = "";
  let sDone=0, sCorrect=0, sWrong=0;
  let sentenceWrongIndex = null;

  function setWordUI() {
    renderPassage($("#wordTarget"), wordTarget, wordTyped, wordWrongIndex);
    $("#wordTyped").textContent = wordTyped || "";
    $("#wDone").textContent = String(wDone);
    $("#wCorrect").textContent = String(wCorrect);
    $("#wWrong").textContent = String(wWrong);
    const total = wCorrect + wWrong;
    $("#wAcc").textContent = total ? `${Math.round((wCorrect/total)*100)}%` : "—";
  }
  function setSentenceUI() {
    renderPassage($("#sentenceTarget"), sentenceTarget, sentenceTyped, sentenceWrongIndex);
    $("#sentenceTyped").textContent = sentenceTyped || "";
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
      wordWrongIndex = null;
    } else {
      candidates = WORD_LISTS.basic.slice();
      // filter to mapped kana only (unless native input mode)
      if (opts.inputMode !== "native") {
        const kanaInMap = new Set(Object.values(map).filter(Boolean));
        candidates = candidates.filter(w => [...w].every(ch => kanaInMap.has(ch)));
      }
      candidates = candidates.filter(w => w.length <= maxLen);
      if (!candidates.length) candidates = WORD_LISTS.basic;
      wordTarget = candidates[Math.floor(Math.random()*candidates.length)];
      wordTyped = "";
      wordWrongIndex = null;
    }
    buildKeyboard($("#keyboardWord"), codeForKanaChar(nextChar(wordTarget, wordTyped)));
    speakKana(wordTarget);
    setWordUI();
  }

  function pickSentence() {
    const list = ($("#sentenceListSelect").value || "basic");
    const candidates = (SENTENCE_LISTS[list] || SENTENCE_LISTS.basic).slice();
    let use = candidates;
    if (opts.inputMode !== "native") {
      const kanaInMap = new Set(Object.values(map).filter(Boolean));
      // allow spaces in sentence; filter other chars
      const filtered = candidates.filter(s => [...s].every(ch => ch === " " || kanaInMap.has(ch)));
      use = filtered.length ? filtered : candidates;
    }
    sentenceTarget = use[Math.floor(Math.random()*use.length)];
    sentenceTyped = "";
    sentenceWrongIndex = null;
    buildKeyboard($("#keyboardSentence"), codeForKanaChar(nextChar(sentenceTarget, sentenceTyped)));
    speakKana(sentenceTarget);
    setSentenceUI();
  }

  $("#btnWordStart").addEventListener("click", () => {
    wordOn = true; sentenceOn = false; practiceOn = false; typingOn = false;
    wDone=0; wCorrect=0; wWrong=0;
    wordWrongIndex = null;
    $("#btnWordStart").disabled = true;
    $("#btnWordStop").disabled = false;
    pickWord();
  });
  $("#btnWordStop").addEventListener("click", () => {
    wordOn = false;
    $("#btnWordStart").disabled = false;
    $("#btnWordStop").disabled = true;
    wordTarget = ""; wordTyped = "";
    wordWrongIndex = null;
    buildKeyboard($("#keyboardWord"), null);
    setWordUI();
  });

  $("#btnSentenceStart").addEventListener("click", () => {
    sentenceOn = true; wordOn = false; practiceOn = false; typingOn = false;
    sDone=0; sCorrect=0; sWrong=0;
    sentenceWrongIndex = null;
    $("#btnSentenceStart").disabled = true;
    $("#btnSentenceStop").disabled = false;
    pickSentence();
  });
  $("#btnSentenceStop").addEventListener("click", () => {
    sentenceOn = false;
    $("#btnSentenceStart").disabled = false;
    $("#btnSentenceStop").disabled = true;
    sentenceTarget = ""; sentenceTyped = "";
    sentenceWrongIndex = null;
    buildKeyboard($("#keyboardSentence"), null);
    setSentenceUI();
  });

  function handleStepPractice(mode, pressedKana, pressedCode) {
    if (mode === "word") {
      const need = nextChar(wordTarget, wordTyped);
      if (!need) return;
      if (pressedKana === need) {
        wordTyped += need;
        wCorrect += 1;
        wordWrongIndex = null;
        ensureKanaStat(need).c += 1;
        stats.word.correct += 1;
        if (wordTyped.length >= wordTarget.length) {
          wDone += 1;
          stats.word.words += 1;
          pickWord();
        } else {
          buildKeyboard($("#keyboardWord"), codeForKanaChar(nextChar(wordTarget, wordTyped)));
          setWordUI();
        }
      } else {
        wWrong += 1;
        wordWrongIndex = wordTyped.length;
        ensureKanaStat(need).w += 1;
        stats.word.wrong += 1;
        // keep same target; just flash
        buildKeyboard($("#keyboardWord"), codeForKanaChar(need));
        setWordUI();
      }
      saveJSON(STORAGE.stats, stats);
    } else if (mode === "sentence") {
      const need = nextChar(sentenceTarget, sentenceTyped);
      if (!need) return;
      // Spaces are optional: if need is space, user can either press space OR type the next kana directly.
      if (need === " " && pressedKana !== " ") {
        // treat as skip-space attempt: evaluate against next non-space char
        const nextNonSpace = sentenceTarget.charAt(sentenceTyped.length + 1) || null;
        if (pressedKana === nextNonSpace) {
          sentenceTyped += " " + nextNonSpace;
          sCorrect += 1;
          sentenceWrongIndex = null;
          ensureKanaStat(nextNonSpace).c += 1;
          stats.sentence.correct += 1;
        } else {
          sWrong += 1;
          sentenceWrongIndex = sentenceTyped.length;
          ensureKanaStat(nextNonSpace || pressedKana || " ").w += 1;
          stats.sentence.wrong += 1;
        }
      } else if (pressedKana === need) {
        sentenceTyped += need;
        sCorrect += 1;
        sentenceWrongIndex = null;
        if (need !== " ") ensureKanaStat(need).c += 1;
        stats.sentence.correct += 1;
      } else {
        sWrong += 1;
        sentenceWrongIndex = sentenceTyped.length;
        if (need !== " ") ensureKanaStat(need).w += 1;
        stats.sentence.wrong += 1;
      }

      if (sentenceTyped.length >= sentenceTarget.length) {
        sDone += 1;
        stats.sentence.sentences += 1;
        pickSentence();
      } else {
        buildKeyboard($("#keyboardSentence"), codeForKanaChar(nextChar(sentenceTarget, sentenceTyped)));
        setSentenceUI();
      }
      saveJSON(STORAGE.stats, stats);
    }
  }

  // ---- Global key listener ----
  window.addEventListener("keydown", (e) => {
    // Don't hijack browser shortcuts
    if (e.metaKey || e.ctrlKey) return;

    const code = e.code;

    // Allow backspace in typing/word/sentence
    if ((typingOn || wordOn || sentenceOn) && code === "Backspace") {
      e.preventDefault();
      if (typingOn) {
        if (typed.length) typed = typed.slice(0, -1);
        buildKeyboard($("#keyboard2"), nextNeededCode());
        setTypingUI();
      } else if (wordOn) {
        if (wordTyped.length) wordTyped = wordTyped.slice(0, -1);
        wordWrongIndex = null;
        buildKeyboard($("#keyboardWord"), codeForKanaChar(nextChar(wordTarget, wordTyped)));
        setWordUI();
      } else if (sentenceOn) {
        if (sentenceTyped.length) sentenceTyped = sentenceTyped.slice(0, -1);
        sentenceWrongIndex = null;
        buildKeyboard($("#keyboardSentence"), codeForKanaChar(nextChar(sentenceTarget, sentenceTyped)));
        setSentenceUI();
      }
      return;
    }

    // Ignore modifier keys
    if (["ShiftLeft","ShiftRight","AltLeft","AltRight","ControlLeft","ControlRight","MetaLeft","MetaRight","CapsLock","Tab"].includes(code)) return;

    // prevent page scroll on space
    if (code === "Space") e.preventDefault();

    let inputKana = "";
    if (opts.inputMode === "native") {
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
    if (practiceOn) {
      if (!targetKana || (opts.inputMode !== "native" && !targetCode)) {
        // If targetCode missing (not in map), just pick another
        pickTarget();
        return;
      }
      const ok = opts.inputMode === "native" ? (inputKana === targetKana) : (code === targetCode);
      markPractice(ok, code, inputKana);
    } else if (typingOn) {
      typingKey(inputKana, code);
    } else if (wordOn) {
      handleStepPractice("word", inputKana, code);
    } else if (sentenceOn) {
      handleStepPractice("sentence", inputKana, code);
    }
  });

  // ---- Settings UI ----
  function renderSettings() {
    $("#layoutSelect").value = opts.layout || "jis";
    $("#inputModeSelect").value = opts.inputMode || "mapped";
    $("#ttsSelect").value = opts.tts || "off";
    $("#ttsFallback").value = opts.ttsFallback || "jpOnly";
    $("#keyboardToggle").value = opts.showKeyboard ? "on" : "off";

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

  $("#ttsSelect").addEventListener("change", (e) => {
    opts.tts = e.target.value;
    saveJSON(STORAGE.opts, opts);
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

  $("#ttsFallback").addEventListener("change", (e) => {
    opts.ttsFallback = e.target.value;
    saveJSON(STORAGE.opts, opts);
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
    const payload = { map, enabledSets, opts, version: 1 };
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
      saveJSON(STORAGE.map, map);
      saveJSON(STORAGE.sets, enabledSets);
      saveJSON(STORAGE.opts, opts);
      renderSettings();
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

  $("#btnTestVoice").addEventListener("click", () => {
    if (opts.tts !== "on") {
      alert("Turn TTS On first (Settings → Audio).");
      return;
    }
    refreshVoices();
    speakKana("あ い う え お");
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
  nav("home");

  // PWA register
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }
})();
