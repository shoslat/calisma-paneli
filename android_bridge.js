// --- ANDROID NATIVE APK BRIDGE, FULLSCREEN, BIG-ART SPOTIFY PLAYER, MARQUEE, SPEAKER GUARD & GITHUB OTA (v1.4) ---
(function initAndroidApkBridge() {
  if (!window.AndroidApp) return;

  const themeSysColors = {
    amoled: { bg: "#000000", light: false },
    midnight: { bg: "#060912", light: false },
    emerald: { bg: "#040c09", light: false },
    graphite: { bg: "#101114", light: false },
    obsidiangold: { bg: "#09080a", light: false },
    aurora: { bg: "#060914", light: false },
    crimsoncarbon: { bg: "#0b0708", light: false },
    tokyosakura: { bg: "#0e0810", light: false },
    matrixterminal: { bg: "#020804", light: false },
    arcticfrost: { bg: "#edf4fb", light: true }
  };

  const syncAndroidSystemBars = (themeName) => {
    try {
      const t = themeSysColors[themeName] || themeSysColors.amoled;
      window.AndroidApp.setThemeColor(t.bg, Boolean(t.light));
    } catch (e) {}
  };

  if (typeof setTheme === "function") {
    const origSetTheme = setTheme;
    setTheme = function(name, save = true) {
      origSetTheme(name, save);
      syncAndroidSystemBars(name);
    };
  }
  syncAndroidSystemBars((typeof safeStorage !== "undefined" ? safeStorage.getItem("lg_theme") : null) || "amoled");

  if (typeof downloadBackupFile === "function") {
    const origDownloadBackupFile = downloadBackupFile;
    downloadBackupFile = function() {
      try {
        const jsonStr = JSON.stringify(collectBackupData(), null, 2);
        const now = new Date();
        const dateTag = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        const res = window.AndroidApp.saveFile(`calisma-paneli-yedek-${dateTag}.json`, "application/json", jsonStr, false);
        if (res && String(res).startsWith("OK:")) {
          if (typeof setBackupStatus === "function") setBackupStatus("Yedek Downloads/YKS Panel klasörüne kaydedildi ✓");
          if (typeof showSaveNote === "function") showSaveNote("💾 Yedek Downloads/YKS Panel klasörüne kaydedildi ✓");
          return;
        }
      } catch (e) {}
      origDownloadBackupFile();
    };
  }

  if (typeof exportBackupJson === "function") {
    const origExportBackupJson = exportBackupJson;
    exportBackupJson = function(copyToClipboard = true) {
      const jsonStr = JSON.stringify(collectBackupData());
      const inp = document.getElementById("backupJsonInput");
      const drawer = document.getElementById("backupDrawer");
      if (inp) inp.value = jsonStr;
      if (drawer && !drawer.classList.contains("open")) drawer.classList.add("open");
      if (!copyToClipboard) return jsonStr;
      try {
        if (window.AndroidApp.copyText(jsonStr)) {
          if (typeof setBackupStatus === "function") setBackupStatus("Yedek JSON panoya kopyalandı ✓");
          if (typeof showSaveNote === "function") showSaveNote("📋 Yedek panoya kopyalandı ✓");
          return jsonStr;
        }
      } catch (e) {}
      return origExportBackupJson(copyToClipboard);
    };
  }

  if (typeof downloadWeeklyReportPng === "function") {
    const origDownloadPng = downloadWeeklyReportPng;
    downloadWeeklyReportPng = function() {
      if (typeof lastGeneratedPngDataUrl !== "undefined" && !lastGeneratedPngDataUrl && typeof openWeeklyReportPngPreview === "function") {
        openWeeklyReportPngPreview();
      }
      if (typeof lastGeneratedPngDataUrl === "undefined" || !lastGeneratedPngDataUrl) return;
      try {
        const fname = (typeof lastGeneratedPngFileName !== "undefined" && lastGeneratedPngFileName) || "yks-haftalik-rapor.png";
        const res = window.AndroidApp.saveFile(fname, "image/png", lastGeneratedPngDataUrl, true);
        if (res && String(res).startsWith("OK:")) {
          if (typeof showSaveNote === "function") showSaveNote("💾 PNG kartı Downloads/YKS Panel klasörüne kaydedildi ✓");
          return;
        }
      } catch (e) {}
      origDownloadPng();
    };
  }

  if (typeof shareWeeklyReportPng === "function") {
    const origSharePng = shareWeeklyReportPng;
    shareWeeklyReportPng = async function() {
      if (typeof lastGeneratedPngDataUrl !== "undefined" && !lastGeneratedPngDataUrl && typeof openWeeklyReportPngPreview === "function") {
        openWeeklyReportPngPreview();
      }
      if (typeof lastGeneratedPngDataUrl === "undefined" || !lastGeneratedPngDataUrl) return;
      try {
        const fname = (typeof lastGeneratedPngFileName !== "undefined" && lastGeneratedPngFileName) || "yks-haftalik-rapor.png";
        const ok = window.AndroidApp.sharePng(fname, lastGeneratedPngDataUrl, "Bu haftaki YKS çalışma raporum");
        if (ok) return;
      } catch (e) {}
      return origSharePng();
    };
  }

  // Arka planda geçirilen sürede kronometre sapmasını önle (bölünmüş ekranda çift sayım yapmaz)
  let swPausedTimestamp = 0;
  let swPausedSecSnapshot = 0;
  if (typeof startSw === "function") {
    const origStartSw = startSw;
    startSw = function() {
      origStartSw();
      try { window.AndroidApp.setKeepScreenOn(true); } catch (e) {}
    };
  }
  if (typeof stopSw === "function") {
    const origStopSw = stopSw;
    stopSw = function() {
      origStopSw();
      swPausedTimestamp = 0;
      swPausedSecSnapshot = 0;
      try { window.AndroidApp.setKeepScreenOn(false); } catch (e) {}
    };
  }

  window.__yksOnPause = function() {
    if (typeof swInt !== "undefined" && swInt) {
      swPausedTimestamp = Date.now();
      swPausedSecSnapshot = typeof swSec !== "undefined" ? swSec : 0;
    }
    if (typeof safeStorage !== "undefined" && typeof swSec !== "undefined") {
      safeStorage.setItem("lg_sapiens_sw", String(swSec));
    }
    if (typeof saveLessonStopwatchMaps === "function") saveLessonStopwatchMaps();
    if (typeof saveCurrentWeekToStore === "function") saveCurrentWeekToStore();
  };

  window.__yksOnResume = function() {
    if (typeof swInt !== "undefined" && swInt && swPausedTimestamp > 0) {
      const wallDelta = Math.floor((Date.now() - swPausedTimestamp) / 1000);
      const alreadyTicked = Math.max(0, swSec - swPausedSecSnapshot);
      const missedSec = wallDelta - alreadyTicked;
      swPausedTimestamp = 0;
      swPausedSecSnapshot = 0;
      if (missedSec > 2 && missedSec < 43200) {
        swSec += missedSec;
        if (typeof getActiveStopwatchLessonName === "function" && typeof getActiveDayIndex === "function") {
          const activeLesson = getActiveStopwatchLessonName();
          const activeDay = getActiveDayIndex();
          lessonStudySecMap[activeLesson] = (Number(lessonStudySecMap[activeLesson]) || 0) + missedSec;
          dayStudySecMap[activeDay] = (Number(dayStudySecMap[activeDay]) || 0) + missedSec;
        }
        if (typeof renderSw === "function") renderSw();
        if (typeof safeStorage !== "undefined") safeStorage.setItem("lg_sapiens_sw", String(swSec));
        if (typeof saveLessonStopwatchMaps === "function") saveLessonStopwatchMaps();
      }
    }
    if (typeof updateScheduleEngine === "function") updateScheduleEngine(true);
    pollMediaStateFromAndroid();
  };

  // Android Geri Tuşu: Açık modal, medya paneli, ayarlar veya gizli çekmece varsa önce onu kapat
  window.__yksHandleAndroidBack = function() {
    const closers = [
      ["newWeekModal", typeof closeNewWeekModal === "function" ? closeNewWeekModal : null],
      ["missedTasksModal", typeof closeMissedTasksModal === "function" ? closeMissedTasksModal : null],
      ["quickDistModal", typeof closeQuickDistModal === "function" ? closeQuickDistModal : null],
      ["reportModal", typeof closeReportModal === "function" ? closeReportModal : null],
      ["customLessonModal", typeof closeCustomLessonModal === "function" ? closeCustomLessonModal : null]
    ];
    for (const [id, fn] of closers) {
      const el = document.getElementById(id);
      if (el && el.classList.contains("open")) {
        if (fn) fn();
        else el.classList.remove("open");
        return true;
      }
    }
    const mediaPanel = document.getElementById("yksMediaPanel");
    if (mediaPanel && mediaPanel.classList.contains("open")) {
      mediaPanel.classList.remove("open");
      return true;
    }
    for (const panelId of ["settingsPanel", "colorsPanel"]) {
      const p = document.getElementById(panelId);
      if (p && p.classList.contains("open")) {
        if (typeof togglePanel === "function") togglePanel(panelId);
        else p.classList.remove("open");
        return true;
      }
    }
    const weekBar = document.getElementById("weekSwitcherBar");
    if (weekBar && weekBar.classList.contains("open")) {
      if (typeof toggleWeekDrawer === "function") toggleWeekDrawer(false);
      else weekBar.classList.remove("open");
      return true;
    }
    return false;
  };

  // --- SPOTIFY GLASSMORPHIC SVG İKONLARI ---
  const SVG = {
    note: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
    prev: `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="5" width="2.6" height="14" rx="1.1"/><path d="M18.8 5.4a1.1 1.1 0 0 1 1.2 1v11.2a1.1 1.1 0 0 1-1.7.92L9.2 12.92a1.1 1.1 0 0 1 0-1.84l9.1-5.6a1.1 1.1 0 0 1 .5-.08z"/></svg>`,
    next: `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="17.4" y="5" width="2.6" height="14" rx="1.1"/><path d="M5.2 5.4a1.1 1.1 0 0 0-1.2 1v11.2a1.1 1.1 0 0 0 1.7.92l9.1-5.6a1.1 1.1 0 0 0 0-1.84l-9.1-5.6a1.1 1.1 0 0 0-.5-.08z"/></svg>`,
    play: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7.6 5.2a1.2 1.2 0 0 1 1.85-.98l10.2 6.8a1.2 1.2 0 0 1 0 1.96l-10.2 6.8A1.2 1.2 0 0 1 7.6 18.8V5.2z"/></svg>`,
    pause: `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6.5" y="4.8" width="4.1" height="14.4" rx="1.5"/><rect x="13.4" y="4.8" width="4.1" height="14.4" rx="1.5"/></svg>`,
    vol: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M3 9.5v5a1 1 0 0 0 1 1h3.2l4.4 3.6A.9.9 0 0 0 13 18.4V5.6a.9.9 0 0 0-1.4-.7L7.2 8.5H4a1 1 0 0 0-1 1zm12.8-1.4a1 1 0 0 0 0 1.4 3.5 3.5 0 0 1 0 5 1 1 0 1 0 1.4 1.4 5.5 5.5 0 0 0 0-7.8 1 1 0 0 0-1.4 0z"/></svg>`,
    volMute: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"/><line x1="22" y1="9" x2="16" y2="15"/><line x1="16" y1="9" x2="22" y2="15"/></svg>`,
    headphone: `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>`,
    phone: `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="20" rx="2.6"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
    shield: `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>`,
    spotifyApp: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
    pin: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="13" width="18" height="7" rx="3.5"/><path d="M8 7l4-4 4 4"/><line x1="12" y1="3" x2="12" y2="10"/></svg>`,
    grip: `<svg viewBox="0 0 14 24" fill="currentColor"><circle cx="4" cy="6" r="1.5"/><circle cx="10" cy="6" r="1.5"/><circle cx="4" cy="12" r="1.5"/><circle cx="10" cy="12" r="1.5"/><circle cx="4" cy="18" r="1.5"/><circle cx="10" cy="18" r="1.5"/></svg>`,
    close: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>`,
    resetPos: `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><polyline points="3 3 3 8 8 8"/></svg>`
  };

  // --- SPOTIFY / MEDYA DURUMU & MİNİ BAR ---
  let latestMediaState = {
    hasAccess: false,
    hasSession: false,
    playing: false,
    headphoneConnected: false,
    remotePlayback: false,
    silentOrDnd: false,
    guardBlocking: false,
    guardMode: "silent_only",
    outputLabel: "Bu tablet",
    title: "Medya Hazır",
    artist: "Spotify veya müzik uygulaması başlatın",
    appName: "Spotify",
    artDataUrl: "",
    positionMs: 0,
    durationMs: 0,
    volumePct: 50,
    syncedAt: Date.now()
  };

  let isMiniDockPinned = (typeof safeStorage !== "undefined" && safeStorage.getItem("lg_media_mini_pinned") === "1");
  let miniDockScale = 1.0;
  try {
    const savedScale = parseFloat((typeof safeStorage !== "undefined" ? safeStorage.getItem("lg_media_mini_scale") : "") || "1");
    if (!Number.isNaN(savedScale) && savedScale >= 0.7 && savedScale <= 1.35) {
      miniDockScale = savedScale;
    }
  } catch (e) {}

  let mediaPanelScale = 1.0;
  try {
    const savedPanelScale = parseFloat((typeof safeStorage !== "undefined" ? safeStorage.getItem("lg_media_panel_scale") : "") || "1");
    if (!Number.isNaN(savedPanelScale) && savedPanelScale >= 0.7 && savedPanelScale <= 1.35) {
      mediaPanelScale = savedPanelScale;
    }
  } catch (e) {}

  let miniDockPosRatio = null;
  try {
    const savedPos = JSON.parse((typeof safeStorage !== "undefined" ? safeStorage.getItem("lg_media_mini_pos") : "") || "null");
    if (savedPos && typeof savedPos.rx === "number" && typeof savedPos.ry === "number") {
      miniDockPosRatio = {
        rx: Math.max(0, Math.min(1, savedPos.rx)),
        ry: Math.max(0, Math.min(1, savedPos.ry))
      };
    }
  } catch (e) {}

  let mediaPanelPosRatio = null;
  try {
    const savedPanelPos = JSON.parse((typeof safeStorage !== "undefined" ? safeStorage.getItem("lg_media_panel_pos") : "") || "null");
    if (savedPanelPos && typeof savedPanelPos.rx === "number" && typeof savedPanelPos.ry === "number") {
      mediaPanelPosRatio = {
        rx: Math.max(0, Math.min(1, savedPanelPos.rx)),
        ry: Math.max(0, Math.min(1, savedPanelPos.ry))
      };
    }
  } catch (e) {}

  function fmtMediaMs(ms) {
    const s = Math.max(0, Math.floor((Number(ms) || 0) / 1000));
    const m = Math.floor(s / 60);
    const sec = String(s % 60).padStart(2, "0");
    return `${String(m).padStart(2, "0")}:${sec}`;
  }

  let __yksMeasureSpan = null;
  function measureTextPx(text, fontCss) {
    if (!__yksMeasureSpan && document.body) {
      __yksMeasureSpan = document.createElement("span");
      __yksMeasureSpan.style.cssText =
        "position:fixed;left:-9999px;top:-9999px;visibility:hidden;pointer-events:none;white-space:nowrap;padding:0;margin:0;border:0;";
      document.body.appendChild(__yksMeasureSpan);
    }
    if (!__yksMeasureSpan) return Math.max(48, (text || "").length * 8);
    __yksMeasureSpan.style.font = fontCss;
    __yksMeasureSpan.textContent = text || " ";
    return Math.max(24, Math.ceil(__yksMeasureSpan.getBoundingClientRect().width));
  }

  function measureInViewportPx(viewportEl, text, fallbackFont) {
    if (viewportEl && viewportEl.clientWidth > 20) {
      const probe = document.createElement("span");
      probe.style.cssText =
        "position:absolute;left:-9999px;top:0;visibility:hidden;pointer-events:none;white-space:nowrap;display:inline-block;padding:0;margin:0;border:0;";
      probe.textContent = text || " ";
      viewportEl.appendChild(probe);
      const w = Math.ceil(probe.getBoundingClientRect().width || probe.scrollWidth || 0);
      viewportEl.removeChild(probe);
      if (w > 0) return w;
    }
    return measureTextPx(text, fallbackFont);
  }

  function buildStaticMarqueeLine(viewportEl, text, alignCenter) {
    if (!viewportEl) return;
    viewportEl.innerHTML = "";
    const span = document.createElement("span");
    span.className = "yks-marquee-static";
    span.style.textAlign = alignCenter ? "center" : "left";
    span.textContent = text;
    viewportEl.appendChild(span);
  }

  function buildSyncMarqueeTrack(viewportEl, text, blockW, gapW, strideW, durS) {
    if (!viewportEl) return;
    viewportEl.innerHTML = "";
    const track = document.createElement("div");
    track.className = "yks-marquee-track-sync";
    track.style.setProperty("--stride-px", `-${strideW}px`);
    track.style.animationDuration = `${durS}s`;

    for (let i = 0; i < 2; i++) {
      const item = document.createElement("span");
      item.className = "yks-marquee-item-sync";
      if (i === 1) item.setAttribute("aria-hidden", "true");
      item.style.width = `${blockW}px`;
      item.style.minWidth = `${blockW}px`;
      item.style.maxWidth = `${blockW}px`;
      item.style.marginRight = `${gapW}px`;
      item.style.textAlign = "left";
      item.textContent = text;
      track.appendChild(item);
    }
    viewportEl.appendChild(track);
  }

  function setMarqueePair(titleViewport, titleText, artistViewport, artistText, isMini, forceReset) {
    if (!titleViewport || !artistViewport) return;
    const cleanTitle = (titleText || "").trim() || "Medya Hazır";
    const cleanArtist = (artistText || "").trim() || " ";

    const rawW = titleViewport.clientWidth || artistViewport.clientWidth || 0;
    const W = rawW > 40 ? rawW : Math.round(isMini ? (134 * miniDockScale) : (220 * mediaPanelScale));

    const titleFont = isMini
      ? `800 ${Math.round(11.5 * miniDockScale)}px system-ui, -apple-system, sans-serif`
      : `850 ${Math.round(17.2 * mediaPanelScale)}px system-ui, -apple-system, sans-serif`;
    const artistFont = isMini
      ? `600 ${Math.round(9.5 * miniDockScale)}px system-ui, -apple-system, sans-serif`
      : `600 ${Math.round(12.5 * mediaPanelScale)}px system-ui, -apple-system, sans-serif`;

    const tW = measureInViewportPx(titleViewport, cleanTitle, titleFont);
    const aW = measureInViewportPx(artistViewport, cleanArtist, artistFont);

    // Yazı kutuya sığıyorsa sabit kalır (kaymaz); yalnızca taşan satırlar daha yavaş ve senkronize kayar
    const titleFits = tW <= (W - 2);
    const artistFits = aW <= (W - 2);

    const sharedBlockW = (!titleFits && !artistFits)
      ? (Math.max(tW, aW) + 6)
      : ((!titleFits ? tW : aW) + 6);
    const gapW = Math.round(isMini ? (44 * miniDockScale) : (58 * mediaPanelScale));
    const strideW = sharedBlockW + gapW;
    // Daha yavaş, sakin ve okunaklı teyp hızı (~21-22 px/sn)
    const speedPxPerSec = isMini ? 21 : 22;
    const durS = Math.max(8.5, Math.min(25.0, strideW / speedPxPerSec)).toFixed(2);

    const pairSig = `${cleanTitle}||${cleanArtist}||${W}||${titleFits ? "S" : "M"}||${artistFits ? "S" : "M"}||${strideW}||${durS}`;
    if (!forceReset && titleViewport.dataset.pairSig === pairSig && artistViewport.dataset.pairSig === pairSig) {
      return;
    }
    titleViewport.dataset.pairSig = pairSig;
    artistViewport.dataset.pairSig = pairSig;

    const alignCenter = !isMini;
    if (titleFits) {
      buildStaticMarqueeLine(titleViewport, cleanTitle, alignCenter);
    } else {
      buildSyncMarqueeTrack(titleViewport, cleanTitle, sharedBlockW, gapW, strideW, durS);
    }

    if (artistFits) {
      buildStaticMarqueeLine(artistViewport, cleanArtist, alignCenter);
    } else {
      buildSyncMarqueeTrack(artistViewport, cleanArtist, sharedBlockW, gapW, strideW, durS);
    }
  }

  function injectMediaStyles() {
    if (document.getElementById("yksMediaStyles")) return;
    const style = document.createElement("style");
    style.id = "yksMediaStyles";
    style.textContent = `
      .yks-media-toolbar-btn {
        position: relative;
        display: inline-grid !important;
        place-items: center;
      }
      .yks-media-toolbar-btn.is-playing {
        border-color: rgba(30, 215, 96, 0.72) !important;
        box-shadow: 0 0 16px rgba(30, 215, 96, 0.34);
        color: #1ed760 !important;
      }
      .yks-media-toolbar-btn.is-playing::after {
        content: "";
        position: absolute;
        top: 5px;
        right: 5px;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #1ed760;
        box-shadow: 0 0 8px #1ed760;
      }

      /* Senkronize Teyp / Kayan Yazı Motoru (Sığıyorsa Sabit, Taşıyorsa Yavaş & Senkronize) */
      .yks-marquee-viewport {
        width: 100%;
        overflow: hidden !important;
        white-space: nowrap;
        position: relative;
        text-align: left;
        contain: paint;
        transform: translateZ(0);
      }
      .yks-marquee-static {
        display: block;
        width: 100%;
        white-space: nowrap;
        overflow: hidden;
      }
      .yks-marquee-track-sync {
        display: inline-flex;
        align-items: center;
        white-space: nowrap;
        will-change: transform;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
        animation: yksSyncTape 9s linear infinite;
      }
      .yks-marquee-item-sync {
        display: inline-block;
        flex: 0 0 auto;
        box-sizing: border-box;
        overflow: hidden;
        white-space: nowrap;
      }
      @keyframes yksSyncTape {
        0%, 8% { transform: translate3d(0, 0, 0); }
        100% { transform: translate3d(var(--stride-px, -240px), 0, 0); }
      }

      /* Sade Büyük Kapaklı, Sürüklenebilir & Boyutlandırılabilir Medya Penceresi */
      .yks-media-panel {
        --ps: 1;
        position: fixed;
        top: 62px;
        right: 14px;
        z-index: 88;
        width: min(calc(322px * var(--ps)), calc(100vw - 16px));
        max-height: calc(100dvh - 16px);
        overflow-x: hidden !important;
        overflow-y: auto;
        overscroll-behavior: contain;
        padding: calc(14px * var(--ps)) calc(15px * var(--ps)) calc(15px * var(--ps));
        border-radius: calc(26px * var(--ps));
        background: linear-gradient(160deg, rgba(16, 21, 32, 0.94), rgba(7, 10, 16, 0.97));
        border: 1px solid rgba(255, 255, 255, 0.14);
        box-shadow: 0 26px 65px rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(255,255,255,.12);
        display: none;
        flex-direction: column;
        align-items: center;
        gap: calc(11px * var(--ps));
        color: #f4f7fb;
        isolation: isolate;
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
        cursor: grab;
      }
      .yks-media-panel.open { display: flex; }
      .yks-media-panel.dragging {
        cursor: grabbing;
        border-color: rgba(30, 215, 96, 0.65);
        box-shadow: 0 30px 75px rgba(0, 0, 0, 0.96), 0 0 26px rgba(30, 215, 96, 0.28);
      }
      .yks-media-panel input[type="range"] {
        touch-action: auto;
      }
      .yks-media-bg-clip {
        position: absolute;
        inset: 0;
        z-index: -1;
        border-radius: inherit;
        overflow: hidden;
        pointer-events: none;
      }
      .yks-media-bg-blur {
        position: absolute;
        inset: 0;
        background-size: cover;
        background-position: center;
        filter: blur(34px) saturate(1.6);
        opacity: 0.34;
        transform: scale(1.22);
        pointer-events: none;
        transition: opacity .35s;
      }
      .yks-media-head {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: calc(6px * var(--ps));
      }
      .yks-out-pill {
        display: inline-flex;
        align-items: center;
        gap: calc(5px * var(--ps));
        padding: calc(4px * var(--ps)) calc(10px * var(--ps));
        border-radius: 999px;
        font-size: calc(.64rem * var(--ps));
        font-weight: 800;
        background: rgba(30, 215, 96, 0.16);
        border: 1px solid rgba(30, 215, 96, 0.42);
        color: #2ce878;
        max-width: calc(195px * var(--ps));
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
      .yks-out-pill.guarded {
        background: rgba(255, 166, 77, 0.18);
        border-color: rgba(255, 166, 77, 0.55);
        color: #ffbe76;
      }
      .yks-out-pill.remote-phone {
        background: rgba(56, 217, 192, 0.18);
        border-color: rgba(56, 217, 192, 0.52);
        color: #5ef2da;
      }
      .yks-media-head-btns {
        display: flex;
        align-items: center;
        gap: calc(5px * var(--ps));
        flex-shrink: 0;
      }
      .yks-icon-pill {
        width: calc(28px * var(--ps));
        height: calc(28px * var(--ps));
        border-radius: 50%;
        border: 1px solid rgba(255,255,255,.12);
        background: rgba(255,255,255,.07);
        color: rgba(255,255,255,.88);
        display: inline-grid;
        place-items: center;
        cursor: pointer;
        transition: background .15s, border-color .15s, color .15s;
      }
      .yks-icon-pill.active {
        background: rgba(30, 215, 96, 0.22);
        border-color: rgba(30, 215, 96, 0.65);
        color: #1ed760;
      }

      /* Büyük Ortalanmış Albüm Kapağı (Tablet Kilit Ekranı Tarzı) */
      .yks-media-art-big {
        width: calc(176px * var(--ps));
        height: calc(176px * var(--ps));
        border-radius: calc(24px * var(--ps));
        background: linear-gradient(135deg, rgba(30,215,96,.28), rgba(56,217,192,.24));
        border: 1px solid rgba(255,255,255,.18);
        display: grid;
        place-items: center;
        overflow: hidden;
        color: #1ed760;
        box-shadow: 0 18px 40px rgba(0, 0, 0, 0.62);
        flex-shrink: 0;
      }
      .yks-media-art-big img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .yks-media-art-big svg { width: calc(52px * var(--ps)); height: calc(52px * var(--ps)); }

      .yks-media-text-block {
        width: calc(220px * var(--ps));
        max-width: 100%;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        text-align: center;
      }
      .yks-media-title {
        font-size: calc(1.06rem * var(--ps));
        font-weight: 850;
        letter-spacing: -.01em;
        color: #ffffff;
      }
      .yks-media-artist {
        font-size: calc(.78rem * var(--ps));
        font-weight: 600;
        color: rgba(226, 232, 240, 0.74);
      }

      /* Alt Buzlu Cam Kontrol Kapsülü */
      .yks-media-capsule {
        width: 100%;
        padding: calc(12px * var(--ps)) calc(14px * var(--ps)) calc(11px * var(--ps));
        border-radius: calc(22px * var(--ps));
        background: rgba(255, 255, 255, 0.085);
        border: 1px solid rgba(255, 255, 255, 0.13);
        display: flex;
        flex-direction: column;
        gap: calc(9px * var(--ps));
      }
      .yks-media-progress-wrap {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .yks-range {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 4px;
        border-radius: 999px;
        background: rgba(255,255,255,.2);
        outline: none;
        cursor: pointer;
      }
      .yks-range::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #3ee88b;
        box-shadow: 0 0 10px rgba(30,215,96,.72);
        cursor: pointer;
        border: none;
      }
      .yks-range.vol::-webkit-slider-thumb {
        width: 11px;
        height: 11px;
        background: #ffffff;
        box-shadow: 0 0 8px rgba(255,255,255,.65);
      }
      .yks-range.locked {
        opacity: .45;
      }
      .yks-media-times {
        display: flex;
        justify-content: space-between;
        font-size: calc(.64rem * var(--ps));
        font-weight: 650;
        color: rgba(235, 242, 250, 0.72);
        font-variant-numeric: tabular-nums;
      }

      /* Spotify Transport Kontrolleri */
      .yks-media-controls {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: calc(26px * var(--ps));
        padding: 2px 0;
      }
      .yks-skip-btn {
        width: calc(38px * var(--ps));
        height: calc(38px * var(--ps));
        border: none;
        background: transparent;
        color: #ffffff;
        display: grid;
        place-items: center;
        cursor: pointer;
        border-radius: 50%;
        transition: transform .12s, background .15s;
      }
      .yks-skip-btn svg { width: calc(24px * var(--ps)); height: calc(24px * var(--ps)); }
      .yks-skip-btn:active { transform: scale(0.86); background: rgba(255,255,255,.12); }

      .yks-play-circle {
        width: calc(52px * var(--ps));
        height: calc(52px * var(--ps));
        border-radius: 50%;
        border: none;
        background: #ffffff;
        color: #0d1117;
        display: grid;
        place-items: center;
        cursor: pointer;
        box-shadow: 0 0 22px rgba(255, 255, 255, 0.34), 0 0 34px rgba(30, 215, 96, 0.22);
        transition: transform .12s;
      }
      .yks-play-circle svg { width: calc(24px * var(--ps)); height: calc(24px * var(--ps)); }
      .yks-play-circle:active { transform: scale(0.91); }

      .yks-vol-row {
        display: flex;
        align-items: center;
        gap: 9px;
        padding-top: 4px;
        border-top: 1px solid rgba(255,255,255,.09);
      }
      .yks-vol-icon-btn {
        border: none;
        background: transparent;
        color: rgba(255,255,255,.84);
        display: grid;
        place-items: center;
        cursor: pointer;
        padding: 2px;
        flex-shrink: 0;
      }
      .yks-vol-row .yks-range { flex: 1; }
      .yks-guard-hint {
        display: none;
        width: 100%;
        text-align: center;
        font-size: .64rem;
        font-weight: 700;
        color: #ffbe76;
        padding: 5px 8px;
        border-radius: 9px;
        background: rgba(255, 166, 77, 0.13);
        border: 1px solid rgba(255, 166, 77, 0.32);
        gap: 6px;
        flex-direction: column;
        align-items: center;
      }
      .yks-guard-hint.show { display: flex; }
      .yks-guard-remote-btn {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 4px 10px;
        border-radius: 999px;
        border: 1px solid rgba(56, 189, 248, 0.55);
        background: rgba(56, 189, 248, 0.18);
        color: #7dd3fc;
        font-size: .64rem;
        font-weight: 800;
        cursor: pointer;
      }
      .yks-guard-remote-btn:active { transform: scale(0.96); }
      .yks-out-pill { cursor: pointer; }

      /* Ayarlar Paneli İçindeki Mini Bar Boyut Kontrolleri */
      .yks-size-presets {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .yks-size-chip {
        padding: 2px 8px;
        border-radius: 7px;
        border: 1px solid rgba(255,255,255,.15);
        background: rgba(255,255,255,.05);
        color: var(--text, #fff);
        font-size: .63rem;
        font-weight: 800;
        cursor: pointer;
      }
      .yks-size-chip.active {
        background: rgba(30, 215, 96, 0.22);
        border-color: rgba(30, 215, 96, 0.65);
        color: #1ed760;
      }

      /* TAŞINABİLİR & KAYAN YAZILI MİNİ BAR */
      .yks-media-mini-dock {
        --ms: 1;
        position: fixed;
        right: 12px;
        bottom: 12px;
        z-index: 78;
        display: none;
        align-items: center;
        gap: calc(7px * var(--ms));
        width: min(calc(314px * var(--ms)), calc(100vw - 16px));
        padding: calc(6px * var(--ms)) calc(9px * var(--ms));
        border-radius: 999px;
        background: linear-gradient(145deg, rgba(16, 20, 30, 0.94), rgba(8, 10, 15, 0.96));
        border: 1px solid rgba(255, 255, 255, 0.16);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.78), 0 0 18px rgba(30, 215, 96, 0.14);
        color: #f8fafc;
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
        cursor: grab;
      }
      .yks-media-mini-dock.show { display: flex; }
      .yks-media-mini-dock.dragging {
        cursor: grabbing;
        border-color: rgba(30, 215, 96, 0.72);
        box-shadow: 0 18px 42px rgba(0, 0, 0, 0.9), 0 0 24px rgba(30, 215, 96, 0.34);
      }
      .yks-mini-grip {
        display: grid;
        place-items: center;
        width: calc(11px * var(--ms));
        height: calc(22px * var(--ms));
        color: rgba(255,255,255,.35);
        flex-shrink: 0;
      }
      .yks-mini-grip svg { width: calc(9px * var(--ms)); height: calc(17px * var(--ms)); }
      .yks-mini-art {
        width: calc(34px * var(--ms));
        height: calc(34px * var(--ms));
        border-radius: calc(10px * var(--ms));
        flex-shrink: 0;
        background: linear-gradient(135deg, rgba(30,215,96,.28), rgba(56,217,192,.22));
        border: 1px solid rgba(255,255,255,.16);
        display: grid;
        place-items: center;
        overflow: hidden;
        color: #1ed760;
      }
      .yks-mini-art img { width: 100%; height: 100%; object-fit: cover; pointer-events: none; }
      .yks-mini-art svg { width: calc(15px * var(--ms)); height: calc(15px * var(--ms)); }
      .yks-mini-info {
        min-width: 0;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 1px;
      }
      .yks-mini-title {
        font-size: calc(11.5px * var(--ms));
        font-weight: 800;
        color: #fff;
        line-height: 1.22;
      }
      .yks-mini-artist {
        font-size: calc(9.5px * var(--ms));
        color: rgba(226, 232, 240, 0.68);
        line-height: 1.2;
      }
      .yks-mini-skip {
        width: calc(27px * var(--ms));
        height: calc(27px * var(--ms));
        border: none;
        background: transparent;
        color: #ffffff;
        display: grid;
        place-items: center;
        cursor: pointer;
        flex-shrink: 0;
        border-radius: 50%;
      }
      .yks-mini-skip svg { width: calc(16px * var(--ms)); height: calc(16px * var(--ms)); }
      .yks-mini-skip:active { background: rgba(255,255,255,.12); transform: scale(.88); }
      .yks-mini-play {
        width: calc(32px * var(--ms));
        height: calc(32px * var(--ms));
        border-radius: 50%;
        border: none;
        background: #ffffff;
        color: #0d1117;
        display: grid;
        place-items: center;
        cursor: pointer;
        flex-shrink: 0;
        box-shadow: 0 0 14px rgba(255,255,255,.32);
      }
      .yks-mini-play svg { width: calc(16px * var(--ms)); height: calc(16px * var(--ms)); }
      .yks-mini-play:active { transform: scale(.9); }
      .yks-mini-close {
        width: calc(22px * var(--ms));
        height: calc(22px * var(--ms));
        border: none;
        background: rgba(255,255,255,.08);
        color: rgba(255,255,255,.68);
        border-radius: 50%;
        display: grid;
        place-items: center;
        cursor: pointer;
        flex-shrink: 0;
      }
      .yks-mini-close svg { width: calc(10px * var(--ms)); height: calc(10px * var(--ms)); }

      /* Açık tema (Arctic Frost) uyumu */
      body[data-theme="arcticfrost"] .yks-media-panel,
      body[data-theme="arcticfrost"] .yks-media-mini-dock {
        background: linear-gradient(155deg, rgba(246, 250, 255, 0.96), rgba(232, 241, 250, 0.96));
        border-color: rgba(15, 23, 42, 0.14);
        color: #0f172a;
      }
      body[data-theme="arcticfrost"] .yks-media-title,
      body[data-theme="arcticfrost"] .yks-mini-title,
      body[data-theme="arcticfrost"] .yks-skip-btn,
      body[data-theme="arcticfrost"] .yks-mini-skip,
      body[data-theme="arcticfrost"] .yks-vol-icon-btn { color: #0f172a; }
      body[data-theme="arcticfrost"] .yks-play-circle,
      body[data-theme="arcticfrost"] .yks-mini-play {
        background: #0f172a;
        color: #ffffff;
        box-shadow: 0 6px 18px rgba(15,23,42,.26);
      }
      body[data-theme="arcticfrost"] .yks-media-artist,
      body[data-theme="arcticfrost"] .yks-mini-artist,
      body[data-theme="arcticfrost"] .yks-media-times { color: #475569; }
      body[data-theme="arcticfrost"] .yks-media-capsule {
        background: rgba(15, 23, 42, 0.06);
        border-color: rgba(15, 23, 42, 0.12);
      }

      /* Yatay Kısa Ekran Optimizasyonu */
      @media (orientation: landscape) and (max-height: 500px) {
        .yks-media-panel {
          top: 44px;
          padding: calc(10px * var(--ps)) calc(13px * var(--ps));
          gap: calc(7px * var(--ps));
          border-radius: calc(20px * var(--ps));
          width: min(calc(310px * var(--ps)), calc(100vw - 16px));
        }
        .yks-media-art-big {
          width: calc(112px * var(--ps));
          height: calc(112px * var(--ps));
          border-radius: calc(18px * var(--ps));
        }
        .yks-media-title { font-size: calc(.94rem * var(--ps)); }
        .yks-media-artist { font-size: calc(.72rem * var(--ps)); }
        .yks-media-capsule { padding: calc(9px * var(--ps)) calc(12px * var(--ps)); gap: calc(6px * var(--ps)); border-radius: calc(17px * var(--ps)); }
        .yks-play-circle { width: calc(44px * var(--ps)); height: calc(44px * var(--ps)); }
        .yks-play-circle svg { width: calc(20px * var(--ps)); height: calc(20px * var(--ps)); }
        .yks-skip-btn { width: calc(32px * var(--ps)); height: calc(32px * var(--ps)); }
        .yks-skip-btn svg { width: calc(20px * var(--ps)); height: calc(20px * var(--ps)); }
      }
    `;
    document.head.appendChild(style);
  }

  function styleRangeFill(el, pct, isVol) {
    if (!el) return;
    const p = Math.max(0, Math.min(100, Number(pct) || 0));
    const fill = isVol
      ? `linear-gradient(90deg, #56d8e8 0%, #e2f9ff ${p}%, rgba(255,255,255,0.2) ${p}%, rgba(255,255,255,0.2) 100%)`
      : `linear-gradient(90deg, #38d9c0 0%, #1ed760 ${p}%, rgba(255,255,255,0.2) ${p}%, rgba(255,255,255,0.2) 100%)`;
    el.style.background = fill;
  }

  function applyMiniDockScaleAndPosition() {
    const dock = document.getElementById("yksMediaMiniDock");
    if (!dock) return;
    dock.style.setProperty("--ms", String(miniDockScale));

    if (miniDockPosRatio) {
      const vw = window.innerWidth || 360;
      const vh = window.innerHeight || 640;
      const rect = dock.getBoundingClientRect();
      const dw = rect.width || Math.min(314 * miniDockScale, vw - 16);
      const dh = rect.height || (48 * miniDockScale);
      const margin = 8;
      const maxX = Math.max(margin, vw - dw - margin);
      const maxY = Math.max(margin, vh - dh - margin);
      const x = Math.round(margin + miniDockPosRatio.rx * (maxX - margin));
      const y = Math.round(margin + miniDockPosRatio.ry * (maxY - margin));
      dock.style.left = `${x}px`;
      dock.style.top = `${y}px`;
      dock.style.right = "auto";
      dock.style.bottom = "auto";
    } else {
      dock.style.left = "";
      dock.style.top = "";
      dock.style.right = "12px";
      dock.style.bottom = "12px";
    }
  }

  function updateSizeControlsUI() {
    const slider = document.getElementById("yksMiniScaleSlider");
    const pctLbl = document.getElementById("yksMiniScalePct");
    const pct = Math.round(miniDockScale * 100);
    if (slider && document.activeElement !== slider) {
      slider.value = String(pct);
      styleRangeFill(slider, ((pct - 70) / 65) * 100, true);
    }
    if (pctLbl) pctLbl.textContent = `${pct}%`;
    document.querySelectorAll(".js-mini-size-chip").forEach(ch => {
      const target = parseFloat(ch.dataset.scale);
      ch.classList.toggle("active", Math.abs(target - miniDockScale) < 0.06);
    });

    const pSlider = document.getElementById("yksPanelScaleSlider");
    const pPctLbl = document.getElementById("yksPanelScalePct");
    const pPct = Math.round(mediaPanelScale * 100);
    if (pSlider && document.activeElement !== pSlider) {
      pSlider.value = String(pPct);
      styleRangeFill(pSlider, ((pPct - 70) / 65) * 100, true);
    }
    if (pPctLbl) pPctLbl.textContent = `${pPct}%`;
    document.querySelectorAll(".js-panel-size-chip").forEach(ch => {
      const target = parseFloat(ch.dataset.scale);
      ch.classList.toggle("active", Math.abs(target - mediaPanelScale) < 0.06);
    });
  }

  function saveMiniDockScale(val) {
    miniDockScale = Math.max(0.7, Math.min(1.35, Number(val) || 1));
    if (typeof safeStorage !== "undefined") {
      safeStorage.setItem("lg_media_mini_scale", String(miniDockScale));
    }
    applyMiniDockScaleAndPosition();
    updateSizeControlsUI();
    setMarqueePair(
      document.getElementById("yksMiniTitle"),
      latestMediaState.title || "Medya",
      document.getElementById("yksMiniArtist"),
      latestMediaState.artist || "Spotify",
      true,
      true
    );
  }

  function saveMediaPanelScale(val) {
    mediaPanelScale = Math.max(0.7, Math.min(1.35, Number(val) || 1));
    if (typeof safeStorage !== "undefined") {
      safeStorage.setItem("lg_media_panel_scale", String(mediaPanelScale));
    }
    applyMediaPanelPosition();
    updateSizeControlsUI();
    setMarqueePair(
      document.getElementById("yksMediaTitle"),
      latestMediaState.title || "Medya Hazır",
      document.getElementById("yksMediaArtist"),
      latestMediaState.artist || "",
      false,
      true
    );
  }

  function renderMediaUI() {
    const st = latestMediaState;
    const tbBtn = document.getElementById("yksMediaToolbarBtn");
    if (tbBtn) tbBtn.classList.toggle("is-playing", Boolean(st.playing));

    // Ses Çıkışı & Kulaklık / Uzak Telefon (Xiaomi 13) Rozeti
    const outPill = document.getElementById("yksMediaOutPill");
    if (outPill) {
      outPill.classList.toggle("guarded", Boolean(st.guardBlocking && !st.remotePlayback));
      outPill.classList.toggle("remote-phone", Boolean(st.remotePlayback && !st.headphoneConnected));
      if (st.headphoneConnected) {
        outPill.innerHTML = `${SVG.headphone} <span>${st.outputLabel || "Kulaklık"}</span>`;
      } else if (st.remotePlayback) {
        const cleanRemote = String(st.outputLabel || st.remotePhoneName || "Xiaomi 13")
          .replace(/(listening on|playing on|üzerinde|cihazında|dinleniyor|dinliyor|çalıyor|çalınıyor)/gi, "")
          .replace(/['’](te|ta|de|da|ten|tan)\b/gi, "")
          .replace(/\s{2,}/g, " ")
          .replace(/^[\s·:\-]+|[\s·:\-]+$/g, "")
          .trim() || (st.remotePhoneName || "Xiaomi 13");
        outPill.innerHTML = `${SVG.phone} <span>${cleanRemote}</span>`;
      } else if (st.guardBlocking) {
        outPill.innerHTML = `${SVG.shield} <span>Hoparlör Korumalı</span>`;
      } else {
        outPill.innerHTML = `<span>${st.outputLabel || "Bu tablet"}</span>`;
      }
    }

    const guardHint = document.getElementById("yksGuardHint");
    if (guardHint) {
      guardHint.classList.toggle("show", Boolean(st.guardBlocking));
    }
    const guardRemoteBtn = document.getElementById("yksGuardRemoteBtn");
    if (guardRemoteBtn) {
      const pName = st.remotePhoneName || "Xiaomi 13";
      guardRemoteBtn.innerHTML = `${SVG.phone} <span>${pName}</span>`;
    }

    const hasValidArt = Boolean(st.artDataUrl && st.artDataUrl.startsWith("data:image/"));
    const artSig = hasValidArt
      ? `${st.artDataUrl.length}_${st.artDataUrl.slice(-24)}`
      : "none";

    const bgBlur = document.getElementById("yksMediaBgBlur");
    if (bgBlur) {
      if (hasValidArt) {
        if (bgBlur.dataset.artSig !== artSig) {
          bgBlur.style.backgroundImage = `url("${st.artDataUrl}")`;
          bgBlur.dataset.artSig = artSig;
        }
        bgBlur.style.opacity = "0.36";
      } else {
        bgBlur.style.backgroundImage = "none";
        bgBlur.style.opacity = "0";
        bgBlur.dataset.artSig = "none";
      }
    }

    function applyArtworkToContainer(container, sig, dataUrl) {
      if (!container) return;
      const hasImg = Boolean(container.querySelector("img"));
      if (sig !== "none") {
        if (container.dataset.artSig !== sig || !hasImg) {
          container.innerHTML = "";
          const img = document.createElement("img");
          img.alt = "";
          img.decoding = "async";
          img.onerror = () => {
            container.dataset.artSig = "err";
            container.innerHTML = SVG.note;
          };
          img.src = dataUrl;
          container.appendChild(img);
          container.dataset.artSig = sig;
        }
      } else if (container.dataset.artSig !== "none" || hasImg) {
        container.innerHTML = SVG.note;
        container.dataset.artSig = "none";
      }
    }

    applyArtworkToContainer(document.getElementById("yksMediaArtBig"), artSig, st.artDataUrl);
    applyArtworkToContainer(document.getElementById("yksMiniArt"), artSig, st.artDataUrl);

    if (st.hasSession && !hasValidArt && !window.__yksArtRetryTimer) {
      window.__yksArtRetryTimer = setTimeout(() => {
        window.__yksArtRetryTimer = null;
        pollMediaStateFromAndroid();
      }, 650);
    }

    // Senkronize kayan teyp yazıları (Üst ve Alt satır birebir aynı hızda ve beklemesiz)
    setMarqueePair(
      document.getElementById("yksMediaTitle"),
      st.title || "Medya Hazır",
      document.getElementById("yksMediaArtist"),
      st.artist || "",
      false,
      false
    );
    setMarqueePair(
      document.getElementById("yksMiniTitle"),
      st.title || "Medya",
      document.getElementById("yksMiniArtist"),
      st.artist || "Spotify",
      true,
      false
    );

    const playBtn = document.getElementById("yksMediaPlayBtn");
    if (playBtn) {
      const nextIconKey = st.playing ? "pause" : "play";
      if (playBtn.dataset.icon !== nextIconKey) {
        playBtn.innerHTML = st.playing ? SVG.pause : SVG.play;
        playBtn.dataset.icon = nextIconKey;
      }
    }

    const miniPlay = document.getElementById("yksMiniPlayBtn");
    if (miniPlay) {
      const nextIconKey = st.playing ? "pause" : "play";
      if (miniPlay.dataset.icon !== nextIconKey) {
        miniPlay.innerHTML = st.playing ? SVG.pause : SVG.play;
        miniPlay.dataset.icon = nextIconKey;
      }
    }

    const progWrap = document.getElementById("yksMediaProgressWrap");
    const seekEl = document.getElementById("yksMediaSeek");
    const curTimeEl = document.getElementById("yksMediaCurTime");
    const durTimeEl = document.getElementById("yksMediaDurTime");
    const hasDur = Number(st.durationMs) > 0;
    if (progWrap) progWrap.style.display = hasDur ? "flex" : "none";
    if (hasDur && seekEl) {
      const livePos = st.playing
        ? Math.min(st.durationMs, (Number(st.positionMs) || 0) + (Date.now() - (st.syncedAt || Date.now())))
        : (Number(st.positionMs) || 0);
      seekEl.max = String(st.durationMs);
      if (document.activeElement !== seekEl) seekEl.value = String(Math.floor(livePos));
      styleRangeFill(seekEl, (livePos / st.durationMs) * 100, false);
      if (curTimeEl) curTimeEl.textContent = fmtMediaMs(livePos);
      if (durTimeEl) durTimeEl.textContent = fmtMediaMs(st.durationMs);
    }

    const volSlider = document.getElementById("yksMediaVolSlider");
    const volIconBtn = document.getElementById("yksMediaVolIconBtn");
    const volLocked = Boolean(st.guardBlocking || (st.remotePlayback && !st.headphoneConnected));
    const vPct = volLocked ? 0 : (st.volumePct != null ? st.volumePct : 50);
    if (volSlider) {
      volSlider.classList.toggle("locked", volLocked);
      volSlider.disabled = volLocked;
      if (document.activeElement !== volSlider) {
        volSlider.value = String(vPct);
        styleRangeFill(volSlider, vPct, true);
      }
    }
    if (volIconBtn) {
      const vIcon = (volLocked || vPct === 0) ? "mute" : "vol";
      if (volIconBtn.dataset.icon !== vIcon) {
        volIconBtn.innerHTML = vIcon === "mute" ? SVG.volMute : SVG.vol;
        volIconBtn.dataset.icon = vIcon;
      }
    }

    const permBtn = document.getElementById("yksMediaPermBtn");
    if (permBtn) permBtn.style.display = st.hasAccess ? "none" : "";

    const pinBtn = document.getElementById("yksMediaPinBtn");
    if (pinBtn) pinBtn.classList.toggle("active", Boolean(isMiniDockPinned));

    const dock = document.getElementById("yksMediaMiniDock");
    if (dock) {
      dock.classList.toggle("show", Boolean(isMiniDockPinned));
      if (isMiniDockPinned) applyMiniDockScaleAndPosition();
    }
    updateSizeControlsUI();
  }

  window.__yksOnMediaUpdate = function(jsonStr) {
    try {
      const parsed = typeof jsonStr === "string" ? JSON.parse(jsonStr) : jsonStr;
      if (parsed && typeof parsed === "object") {
        latestMediaState = { ...latestMediaState, ...parsed, syncedAt: Date.now() };
        renderMediaUI();
      }
    } catch (e) {}
  };

  function pollMediaStateFromAndroid() {
    if (!window.AndroidApp || typeof window.AndroidApp.getMediaState !== "function") return;
    try {
      window.__yksOnMediaUpdate(window.AndroidApp.getMediaState());
    } catch (e) {}
  }

  function applyMediaPanelPosition() {
    const panel = document.getElementById("yksMediaPanel");
    if (!panel) return;
    panel.style.setProperty("--ps", String(mediaPanelScale));
    if (mediaPanelPosRatio) {
      const vw = window.innerWidth || 360;
      const vh = window.innerHeight || 640;
      const rect = panel.getBoundingClientRect();
      const pw = rect.width || Math.min(322 * mediaPanelScale, vw - 16);
      const ph = rect.height || Math.min(400 * mediaPanelScale, vh - 16);
      const margin = 8;
      const maxX = Math.max(margin, vw - pw - margin);
      const maxY = Math.max(margin, vh - ph - margin);
      const x = Math.round(margin + mediaPanelPosRatio.rx * (maxX - margin));
      const y = Math.round(margin + mediaPanelPosRatio.ry * (maxY - margin));
      panel.style.left = `${x}px`;
      panel.style.top = `${y}px`;
      panel.style.right = "auto";
      panel.style.bottom = "auto";
    } else {
      panel.style.left = "";
      panel.style.top = "";
      panel.style.right = "";
      panel.style.bottom = "";
    }
  }

  function setupDraggableMediaPanel(panel) {
    let dragging = false;
    let hasMoved = false;
    let pointerId = null;
    let startClientX = 0;
    let startClientY = 0;
    let startLeft = 0;
    let startTop = 0;

    panel.addEventListener("pointerdown", (ev) => {
      if (ev.target.closest("button, input, select, a, label, .yks-out-pill")) return;
      pointerId = ev.pointerId;
      startClientX = ev.clientX;
      startClientY = ev.clientY;
      const rect = panel.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      dragging = true;
      hasMoved = false;
      try { panel.setPointerCapture(pointerId); } catch (e) {}
    });

    panel.addEventListener("pointermove", (ev) => {
      if (!dragging || ev.pointerId !== pointerId) return;
      const dx = ev.clientX - startClientX;
      const dy = ev.clientY - startClientY;
      if (!hasMoved && Math.hypot(dx, dy) < 5) return;
      hasMoved = true;
      panel.classList.add("dragging");

      const vw = window.innerWidth || 360;
      const vh = window.innerHeight || 640;
      const rect = panel.getBoundingClientRect();
      const margin = 8;
      const maxX = Math.max(margin, vw - rect.width - margin);
      const maxY = Math.max(margin, vh - rect.height - margin);
      const nextX = Math.max(margin, Math.min(maxX, startLeft + dx));
      const nextY = Math.max(margin, Math.min(maxY, startTop + dy));

      panel.style.left = `${Math.round(nextX)}px`;
      panel.style.top = `${Math.round(nextY)}px`;
      panel.style.right = "auto";
      panel.style.bottom = "auto";

      mediaPanelPosRatio = {
        rx: maxX > margin ? (nextX - margin) / (maxX - margin) : 1,
        ry: maxY > margin ? (nextY - margin) / (maxY - margin) : 0
      };
    });

    const finishDrag = (ev) => {
      if (!dragging || (pointerId !== null && ev.pointerId !== pointerId)) return;
      dragging = false;
      panel.classList.remove("dragging");
      try { panel.releasePointerCapture(pointerId); } catch (e) {}
      pointerId = null;
      if (hasMoved && mediaPanelPosRatio && typeof safeStorage !== "undefined") {
        safeStorage.setItem("lg_media_panel_pos", JSON.stringify(mediaPanelPosRatio));
      }
    };

    panel.addEventListener("pointerup", finishDrag);
    panel.addEventListener("pointercancel", finishDrag);
    window.addEventListener("resize", () => {
      if (panel.classList.contains("open")) applyMediaPanelPosition();
    });
  }

  function toggleMediaPanel(forceState) {
    const panel = document.getElementById("yksMediaPanel");
    if (!panel) return;
    const willOpen = typeof forceState === "boolean" ? forceState : !panel.classList.contains("open");
    if (willOpen) {
      ["settingsPanel", "colorsPanel"].forEach(id => {
        const p = document.getElementById(id);
        if (p) p.classList.remove("open");
      });
    }
    panel.classList.toggle("open", willOpen);
    if (willOpen) {
      applyMediaPanelPosition();
      pollMediaStateFromAndroid();
      setMarqueePair(
        document.getElementById("yksMediaTitle"),
        latestMediaState.title || "Medya Hazır",
        document.getElementById("yksMediaArtist"),
        latestMediaState.artist || "",
        false,
        true
      );
    }
  }

  function setupDraggableMiniDock(dock) {
    let dragging = false;
    let hasMoved = false;
    let pointerId = null;
    let startClientX = 0;
    let startClientY = 0;
    let startLeft = 0;
    let startTop = 0;

    dock.addEventListener("pointerdown", (ev) => {
      if (ev.target.closest("button")) return;
      pointerId = ev.pointerId;
      startClientX = ev.clientX;
      startClientY = ev.clientY;
      const rect = dock.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      dragging = true;
      hasMoved = false;
      try { dock.setPointerCapture(pointerId); } catch (e) {}
    });

    dock.addEventListener("pointermove", (ev) => {
      if (!dragging || ev.pointerId !== pointerId) return;
      const dx = ev.clientX - startClientX;
      const dy = ev.clientY - startClientY;
      if (!hasMoved && Math.hypot(dx, dy) < 6) return;
      hasMoved = true;
      dock.classList.add("dragging");

      const vw = window.innerWidth || 360;
      const vh = window.innerHeight || 640;
      const rect = dock.getBoundingClientRect();
      const margin = 8;
      const maxX = Math.max(margin, vw - rect.width - margin);
      const maxY = Math.max(margin, vh - rect.height - margin);
      const nextX = Math.max(margin, Math.min(maxX, startLeft + dx));
      const nextY = Math.max(margin, Math.min(maxY, startTop + dy));

      dock.style.left = `${Math.round(nextX)}px`;
      dock.style.top = `${Math.round(nextY)}px`;
      dock.style.right = "auto";
      dock.style.bottom = "auto";

      miniDockPosRatio = {
        rx: maxX > margin ? (nextX - margin) / (maxX - margin) : 1,
        ry: maxY > margin ? (nextY - margin) / (maxY - margin) : 1
      };
    });

    const finishDrag = (ev) => {
      if (!dragging || (pointerId !== null && ev.pointerId !== pointerId)) return;
      dragging = false;
      dock.classList.remove("dragging");
      try { dock.releasePointerCapture(pointerId); } catch (e) {}
      pointerId = null;

      if (hasMoved && miniDockPosRatio) {
        if (typeof safeStorage !== "undefined") {
          safeStorage.setItem("lg_media_mini_pos", JSON.stringify(miniDockPosRatio));
        }
      } else if (!ev.target.closest("button")) {
        toggleMediaPanel(true);
      }
    };

    dock.addEventListener("pointerup", finishDrag);
    dock.addEventListener("pointercancel", finishDrag);
    window.addEventListener("resize", () => {
      if (isMiniDockPinned) applyMiniDockScaleAndPosition();
    });
  }

  function setMiniDockPinned(val) {
    isMiniDockPinned = Boolean(val);
    if (typeof safeStorage !== "undefined") {
      safeStorage.setItem("lg_media_mini_pinned", isMiniDockPinned ? "1" : "0");
    }
    renderMediaUI();
  }

  function mountMediaControllerUI() {
    if (!window.AndroidApp || typeof window.AndroidApp.mediaAction !== "function") return;
    if (document.getElementById("yksMediaPanel")) return;

    injectMediaStyles();

    const toolbar = document.querySelector(".toolbar");
    if (toolbar && !document.getElementById("yksMediaToolbarBtn")) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.id = "yksMediaToolbarBtn";
      btn.className = "toolbar-btn yks-media-toolbar-btn";
      btn.title = "Spotify & Müzik Kontrolü";
      btn.innerHTML = SVG.note;
      btn.addEventListener("click", () => toggleMediaPanel());
      toolbar.insertBefore(btn, toolbar.firstChild);
    }

    // Ultra sade, büyük kapaklı, kayan yazılı ve sürüklenebilir Medya Penceresi
    const panel = document.createElement("section");
    panel.id = "yksMediaPanel";
    panel.className = "yks-media-panel";
    panel.innerHTML = `
      <div class="yks-media-bg-clip"><div class="yks-media-bg-blur" id="yksMediaBgBlur"></div></div>
      <div class="yks-media-head">
        <span class="yks-out-pill" id="yksMediaOutPill"><span>Bu tablet</span></span>
        <div class="yks-media-head-btns">
          <button type="button" class="yks-icon-pill" id="yksMediaOpenAppBtn" title="Spotify / Müzik Uygulamasını Aç">${SVG.spotifyApp}</button>
          <button type="button" class="yks-icon-pill" id="yksMediaPinBtn" title="Taşınabilir Mini Barı Aç / Kapat">${SVG.pin}</button>
          <button type="button" class="yks-icon-pill" id="yksMediaCloseBtn" title="Kapat">${SVG.close}</button>
        </div>
      </div>

      <div class="yks-media-art-big" id="yksMediaArtBig">${SVG.note}</div>

      <div class="yks-media-text-block">
        <div class="yks-marquee-viewport yks-media-title" id="yksMediaTitle"></div>
        <div class="yks-marquee-viewport yks-media-artist" id="yksMediaArtist"></div>
      </div>

      <div class="yks-guard-hint" id="yksGuardHint">
        <span>🛡️ Kulaklık takılı değil · Sessiz modda hoparlör kilitli</span>
        <button type="button" class="yks-guard-remote-btn" id="yksGuardRemoteBtn">${SVG.phone} <span>Xiaomi 13</span></button>
      </div>

      <div class="yks-media-capsule">
        <div class="yks-media-progress-wrap" id="yksMediaProgressWrap" style="display:none;">
          <input type="range" id="yksMediaSeek" class="yks-range" min="0" max="100" value="0">
          <div class="yks-media-times">
            <span id="yksMediaCurTime">00:00</span>
            <span id="yksMediaDurTime">00:00</span>
          </div>
        </div>

        <div class="yks-media-controls">
          <button type="button" class="yks-skip-btn" id="yksMediaPrevBtn" title="Önceki Şarkı">${SVG.prev}</button>
          <button type="button" class="yks-play-circle" id="yksMediaPlayBtn" title="Oynat / Duraklat">${SVG.play}</button>
          <button type="button" class="yks-skip-btn" id="yksMediaNextBtn" title="Sonraki Şarkı">${SVG.next}</button>
        </div>

        <div class="yks-vol-row">
          <button type="button" class="yks-vol-icon-btn" id="yksMediaVolIconBtn" title="Sessize Al / Sesi Kıs">${SVG.vol}</button>
          <input type="range" id="yksMediaVolSlider" class="yks-range vol" min="0" max="100" value="50">
        </div>
      </div>

      <button type="button" class="mini-action-btn purple" id="yksMediaPermBtn" style="width:100%; padding:7px; font-size:.67rem;">✨ Şarkı Adı & Büyük Kapak İçin İzin Ver</button>
    `;
    document.body.appendChild(panel);
    setupDraggableMediaPanel(panel);
    applyMediaPanelPosition();

    const dock = document.createElement("div");
    dock.id = "yksMediaMiniDock";
    dock.className = "yks-media-mini-dock";
    dock.innerHTML = `
      <div class="yks-mini-grip" title="Basılı tutup taşı">${SVG.grip}</div>
      <div class="yks-mini-art" id="yksMiniArt">${SVG.note}</div>
      <div class="yks-mini-info" id="yksMiniInfo">
        <div class="yks-marquee-viewport yks-mini-title" id="yksMiniTitle"></div>
        <div class="yks-marquee-viewport yks-mini-artist" id="yksMiniArtist"></div>
      </div>
      <button type="button" class="yks-mini-skip" id="yksMiniPrevBtn" title="Önceki">${SVG.prev}</button>
      <button type="button" class="yks-mini-play" id="yksMiniPlayBtn" title="Oynat / Duraklat">${SVG.play}</button>
      <button type="button" class="yks-mini-skip" id="yksMiniNextBtn" title="Sonraki">${SVG.next}</button>
      <button type="button" class="yks-mini-close" id="yksMiniHideBtn" title="Mini barı gizle">${SVG.close}</button>
    `;
    document.body.appendChild(dock);
    setupDraggableMiniDock(dock);

    document.getElementById("yksMediaOutPill").addEventListener("click", (ev) => {
      ev.stopPropagation();
      if (window.AndroidApp && typeof window.AndroidApp.toggleRemotePhoneMode === "function") {
        window.AndroidApp.toggleRemotePhoneMode();
      }
    });
    document.getElementById("yksGuardRemoteBtn").addEventListener("click", (ev) => {
      ev.stopPropagation();
      if (window.AndroidApp && typeof window.AndroidApp.toggleRemotePhoneMode === "function") {
        window.AndroidApp.toggleRemotePhoneMode();
      }
    });

    document.getElementById("yksMediaCloseBtn").addEventListener("click", () => toggleMediaPanel(false));
    document.getElementById("yksMediaPinBtn").addEventListener("click", () => setMiniDockPinned(!isMiniDockPinned));
    document.getElementById("yksMiniHideBtn").addEventListener("click", (ev) => {
      ev.stopPropagation();
      setMiniDockPinned(false);
    });

    document.getElementById("yksMediaPrevBtn").addEventListener("click", () => window.AndroidApp.mediaAction("prev"));
    document.getElementById("yksMediaPlayBtn").addEventListener("click", () => window.AndroidApp.mediaAction("play_pause"));
    document.getElementById("yksMediaNextBtn").addEventListener("click", () => window.AndroidApp.mediaAction("next"));
    document.getElementById("yksMiniPrevBtn").addEventListener("click", (ev) => { ev.stopPropagation(); window.AndroidApp.mediaAction("prev"); });
    document.getElementById("yksMiniPlayBtn").addEventListener("click", (ev) => { ev.stopPropagation(); window.AndroidApp.mediaAction("play_pause"); });
    document.getElementById("yksMiniNextBtn").addEventListener("click", (ev) => { ev.stopPropagation(); window.AndroidApp.mediaAction("next"); });

    document.getElementById("yksMediaVolIconBtn").addEventListener("click", () => {
      if (latestMediaState.remotePlayback && !latestMediaState.headphoneConnected) return;
      window.AndroidApp.mediaAction("mute");
    });
    document.getElementById("yksMediaVolSlider").addEventListener("input", (ev) => {
      const pct = Number(ev.target.value);
      if (latestMediaState.remotePlayback && !latestMediaState.headphoneConnected) {
        ev.target.value = "0";
        styleRangeFill(ev.target, 0, true);
        return;
      }
      if (latestMediaState.guardBlocking && pct > 0) {
        ev.target.value = "0";
        styleRangeFill(ev.target, 0, true);
        window.AndroidApp.setMusicVolumePct(pct); // Java tarafı korumalı toast gösterir
        return;
      }
      styleRangeFill(ev.target, pct, true);
      if (typeof window.AndroidApp.setMusicVolumePct === "function") {
        window.AndroidApp.setMusicVolumePct(pct);
      }
    });
    document.getElementById("yksMediaSeek").addEventListener("input", (ev) => {
      const maxVal = Number(ev.target.max) || 100;
      const curVal = Number(ev.target.value) || 0;
      styleRangeFill(ev.target, (curVal / maxVal) * 100, false);
      const curTimeEl = document.getElementById("yksMediaCurTime");
      if (curTimeEl) curTimeEl.textContent = fmtMediaMs(curVal);
    });
    document.getElementById("yksMediaSeek").addEventListener("change", (ev) => {
      const targetMs = Number(ev.target.value);
      if (typeof window.AndroidApp.seekMediaMs === "function") {
        window.AndroidApp.seekMediaMs(targetMs);
      }
    });

    document.getElementById("yksMediaOpenAppBtn").addEventListener("click", () => window.AndroidApp.mediaAction("open_app"));
    document.getElementById("yksMediaPermBtn").addEventListener("click", () => window.AndroidApp.mediaAction("open_permission"));

    if (typeof togglePanel === "function") {
      const origTogglePanel = togglePanel;
      togglePanel = function(panelId) {
        toggleMediaPanel(false);
        origTogglePanel(panelId);
      };
    }

    setInterval(() => {
      const p = document.getElementById("yksMediaPanel");
      if (latestMediaState.playing && p && p.classList.contains("open") && latestMediaState.durationMs > 0) {
        renderMediaUI();
      }
    }, 1000);

    pollMediaStateFromAndroid();
  }

  // --- APK AYARLARI (TAM EKRAN, KÜTÜPHANE KULAKLIK KORUMASI, MEDYA & MİNİ BAR BOYUTU & GITHUB OTA) ---
  function refreshOtaPanelUI(customMsg, isErr) {
    const statusEl = document.getElementById("otaStatusLine");
    const metaEl = document.getElementById("otaMetaBadge");
    const urlInp = document.getElementById("otaUrlInput");
    const autoChk = document.getElementById("otaAutoCheckChk");
    const fullChk = document.getElementById("otaFullscreenChk");
    const guardSel = document.getElementById("otaSpeakerGuardSelect");
    const remotePhoneInp = document.getElementById("otaRemotePhoneInput");
    if (!window.AndroidApp || typeof window.AndroidApp.getOtaInfo !== "function") return;
    try {
      const info = JSON.parse(window.AndroidApp.getOtaInfo() || "{}");
      if (urlInp && document.activeElement !== urlInp) {
        urlInp.value = info.url || "https://github.com/shoslat/calisma-paneli";
      }
      if (autoChk) autoChk.checked = info.autoCheck !== false;
      if (fullChk) fullChk.checked = info.fullscreen !== false;
      if (guardSel) guardSel.value = info.speakerGuardMode || "silent_only";
      if (remotePhoneInp && document.activeElement !== remotePhoneInp) {
        remotePhoneInp.value = info.remotePhoneName || "Xiaomi 13";
      }
      if (metaEl) {
        const srcLabel = info.source === "github"
          ? `🌐 GitHub${info.commit ? " #" + info.commit : ""}`
          : (info.source === "local" ? "📁 Yerel Dosya" : `📦 Dahili v${info.appVersion || "1.8.0"}`);
        metaEl.textContent = srcLabel;
      }
      if (statusEl) {
        if (customMsg) {
          statusEl.style.color = isErr ? "#ff8585" : "var(--green)";
          statusEl.textContent = customMsg;
        } else {
          statusEl.style.color = "var(--muted)";
          const parts = [];
          if (info.updatedAt) parts.push(`Güncelleme: ${info.updatedAt}`);
          if (info.lastCheckAt) parts.push(`Son kontrol: ${info.lastCheckAt}`);
          statusEl.textContent = parts.length > 0 ? parts.join(" · ") : "GitHub deposu otomatik güncellemeye hazır";
        }
      }
    } catch (e) {}
    updateSizeControlsUI();
  }

  window.__yksOnOtaStatus = function(msg, isErr) {
    refreshOtaPanelUI(msg, Boolean(isErr));
    if (msg && !isErr && typeof showSaveNote === "function") {
      showSaveNote(msg);
    }
  };

  function mountOtaSettingsCard() {
    if (!window.AndroidApp || typeof window.AndroidApp.getOtaInfo !== "function") return;
    if (document.getElementById("yksOtaSection")) {
      refreshOtaPanelUI();
      return;
    }
    const settingsPanel = document.getElementById("settingsPanel");
    if (!settingsPanel) return;

    const section = document.createElement("div");
    section.id = "yksOtaSection";
    section.className = "backup-section";
    section.innerHTML = `
      <div class="backup-section-title">
        <span>🚀 APK, Medya & GitHub Ayarları</span>
        <span id="otaMetaBadge" style="font-size:.62rem; color:var(--cyan); font-weight:750;">📦 Dahili</span>
      </div>
      <label style="display:flex; align-items:center; gap:7px; font-size:.7rem; color:var(--text); cursor:pointer;">
        <input type="checkbox" id="otaFullscreenChk" checked style="width:15px; height:15px; accent-color:var(--cyan);">
        <span>🖥️ Tam Ekran Modu (Üst saat & alt çubuğu gizle)</span>
      </label>

      <div style="display:flex; flex-direction:column; gap:5px; padding:7px 9px; border-radius:10px; background:rgba(255,166,77,.07); border:1px solid rgba(255,166,77,.24);">
        <label for="otaSpeakerGuardSelect" style="font-size:.67rem; font-weight:750; color:#ffbe76;">🛡️ Kütüphane Hoparlör Koruması</label>
        <select id="otaSpeakerGuardSelect" class="font-select" style="width:100%; font-size:.68rem; padding:5px 7px;">
          <option value="silent_only">🔕 Sessiz / Rahatsız Etme'de kulaklık yoksa engelle</option>
          <option value="always">🛡️ Her zaman (Kulaklık yoksa hoparlörü engelle)</option>
          <option value="off">Kapalı (Hoparlöre her zaman izin ver)</option>
        </select>
        <div style="display:flex; align-items:center; gap:5px; margin-top:2px;">
          <span style="font-size:.64rem; color:var(--muted); white-space:nowrap;">📱 Uzak Telefon Adı:</span>
          <input type="text" id="otaRemotePhoneInput" value="Xiaomi 13" placeholder="Xiaomi 13" style="flex:1; min-width:0; padding:4px 7px; border-radius:7px; border:1px solid rgba(255,255,255,.15); background:rgba(0,0,0,.4); color:var(--text); font-size:.66rem; outline:none;">
        </div>
      </div>

      <div style="display:flex; flex-direction:column; gap:5px; padding:7px 9px; border-radius:10px; background:rgba(255,255,255,.035); border:1px solid rgba(255,255,255,.1);">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:6px; font-size:.67rem; color:var(--text); font-weight:700;">
          <span>🎛️ Müzik Penceresi Boyutu (<span id="yksPanelScalePct">100%</span>)</span>
          <div class="yks-size-presets">
            <button type="button" class="yks-size-chip js-panel-size-chip" data-scale="0.78">S</button>
            <button type="button" class="yks-size-chip js-panel-size-chip" data-scale="1">M</button>
            <button type="button" class="yks-size-chip js-panel-size-chip" data-scale="1.22">L</button>
            <button type="button" class="yks-size-chip" id="yksPanelResetPosBtn" title="Müzik penceresini varsayılan konuma döndür" style="display:inline-grid; place-items:center; padding:2px 5px;">${SVG.resetPos}</button>
          </div>
        </div>
        <input type="range" id="yksPanelScaleSlider" class="yks-range vol" min="70" max="135" value="100">
      </div>

      <div style="display:flex; flex-direction:column; gap:5px; padding:7px 9px; border-radius:10px; background:rgba(255,255,255,.035); border:1px solid rgba(255,255,255,.1);">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:6px; font-size:.67rem; color:var(--text); font-weight:700;">
          <span>🎵 Mini Bar Boyutu (<span id="yksMiniScalePct">100%</span>)</span>
          <div class="yks-size-presets">
            <button type="button" class="yks-size-chip js-mini-size-chip" data-scale="0.78">S</button>
            <button type="button" class="yks-size-chip js-mini-size-chip" data-scale="1">M</button>
            <button type="button" class="yks-size-chip js-mini-size-chip" data-scale="1.24">L</button>
            <button type="button" class="yks-size-chip" id="yksMiniResetPosBtn" title="Mini barı varsayılan köşeye döndür" style="display:inline-grid; place-items:center; padding:2px 5px;">${SVG.resetPos}</button>
          </div>
        </div>
        <input type="range" id="yksMiniScaleSlider" class="yks-range vol" min="70" max="135" value="100">
      </div>

      <div style="display:flex; gap:5px; align-items:center;">
        <input type="url" id="otaUrlInput" style="flex:1; min-width:0; padding:6px 8px; border-radius:8px; border:1px solid rgba(255,255,255,.16); background:rgba(0,0,0,.45); color:var(--text); font-size:.67rem; outline:none;" placeholder="https://github.com/kullanici/repo">
        <button type="button" id="otaSaveUrlBtn" class="mini-action-btn cyan-btn" style="padding:6px 9px; font-size:.66rem;">Kaydet</button>
      </div>
      <label style="display:flex; align-items:center; gap:7px; font-size:.68rem; color:var(--text); cursor:pointer;">
        <input type="checkbox" id="otaAutoCheckChk" style="width:15px; height:15px; accent-color:var(--green);">
        <span>Uygulama her açıldığında GitHub'dan otomatik güncelle</span>
      </label>
      <div class="backup-btn-grid">
        <button type="button" id="otaCheckNowBtn" class="mini-action-btn green-btn" style="grid-column:1 / -1; padding:7px; font-size:.72rem;">🔄 GitHub'dan Şimdi Kontrol Et & Güncelle</button>
        <button type="button" id="otaPickLocalBtn" class="mini-action-btn purple" style="padding:6px; font-size:.66rem;">📁 Yerel HTML Yükle</button>
        <button type="button" id="otaResetBundledBtn" class="mini-action-btn" style="padding:6px; font-size:.66rem;">↩ Dahili Sürüme Dön</button>
      </div>
      <div id="otaStatusLine" style="font-size:.65rem; color:var(--muted); line-height:1.35;">Hazır</div>
    `;

    const backupSec = settingsPanel.querySelector(".backup-section");
    if (backupSec) {
      settingsPanel.insertBefore(section, backupSec);
    } else {
      settingsPanel.appendChild(section);
    }

    document.getElementById("otaFullscreenChk").addEventListener("change", (ev) => {
      if (typeof window.AndroidApp.setFullscreenMode === "function") {
        window.AndroidApp.setFullscreenMode(Boolean(ev.target.checked));
      }
      refreshOtaPanelUI(ev.target.checked ? "🖥️ Tam ekran modu açıldı" : "Sistem çubukları gösteriliyor", false);
    });

    document.getElementById("otaSpeakerGuardSelect").addEventListener("change", (ev) => {
      if (typeof window.AndroidApp.setSpeakerGuardMode === "function") {
        window.AndroidApp.setSpeakerGuardMode(ev.target.value);
      }
      const msg = ev.target.value === "off"
        ? "Hoparlör koruması kapatıldı"
        : (ev.target.value === "always" ? "🛡️ Kulaklık yoksa hoparlör her zaman engellenecek" : "🔕 Sessiz/Rahatsız Etme modunda kulaklık koruması aktif");
      refreshOtaPanelUI(msg, false);
    });

    document.getElementById("otaRemotePhoneInput").addEventListener("change", (ev) => {
      const val = (ev.target.value || "").trim() || "Xiaomi 13";
      ev.target.value = val;
      if (typeof window.AndroidApp.setRemotePhoneName === "function") {
        window.AndroidApp.setRemotePhoneName(val);
      }
      refreshOtaPanelUI(`📱 Uzak telefon adı "${val}" olarak kaydedildi`, false);
    });

    document.getElementById("yksPanelScaleSlider").addEventListener("input", (ev) => {
      const pct = Number(ev.target.value);
      styleRangeFill(ev.target, ((pct - 70) / 65) * 100, true);
      saveMediaPanelScale(pct / 100);
    });
    document.querySelectorAll(".js-panel-size-chip").forEach(ch => {
      ch.addEventListener("click", () => {
        const s = parseFloat(ch.dataset.scale);
        saveMediaPanelScale(s);
      });
    });
    document.getElementById("yksPanelResetPosBtn").addEventListener("click", () => {
      mediaPanelPosRatio = null;
      if (typeof safeStorage !== "undefined") {
        safeStorage.removeItem("lg_media_panel_pos");
      }
      applyMediaPanelPosition();
      refreshOtaPanelUI("✓ Müzik penceresi varsayılan konuma alındı", false);
    });

    document.getElementById("yksMiniScaleSlider").addEventListener("input", (ev) => {
      const pct = Number(ev.target.value);
      styleRangeFill(ev.target, ((pct - 70) / 65) * 100, true);
      if (!isMiniDockPinned) setMiniDockPinned(true);
      saveMiniDockScale(pct / 100);
    });
    document.querySelectorAll(".js-mini-size-chip").forEach(ch => {
      ch.addEventListener("click", () => {
        if (!isMiniDockPinned) setMiniDockPinned(true);
        const s = parseFloat(ch.dataset.scale);
        saveMiniDockScale(s);
      });
    });
    document.getElementById("yksMiniResetPosBtn").addEventListener("click", () => {
      miniDockPosRatio = null;
      if (typeof safeStorage !== "undefined") {
        safeStorage.removeItem("lg_media_mini_pos");
      }
      applyMiniDockScaleAndPosition();
      refreshOtaPanelUI("✓ Mini bar varsayılan köşeye alındı", false);
    });

    document.getElementById("otaSaveUrlBtn").addEventListener("click", () => {
      const val = (document.getElementById("otaUrlInput").value || "").trim();
      if (!val) return;
      window.AndroidApp.setOtaUrl(val);
      refreshOtaPanelUI("✓ GitHub adresi kaydedildi", false);
    });

    document.getElementById("otaAutoCheckChk").addEventListener("change", (ev) => {
      window.AndroidApp.setOtaAutoCheck(Boolean(ev.target.checked));
      refreshOtaPanelUI(ev.target.checked ? "✓ Açılışta otomatik güncelleme açık" : "Otomatik kontrol kapatıldı", false);
    });

    document.getElementById("otaCheckNowBtn").addEventListener("click", () => {
      const val = (document.getElementById("otaUrlInput").value || "").trim();
      if (val) window.AndroidApp.setOtaUrl(val);
      refreshOtaPanelUI("⏳ GitHub kontrol ediliyor...", false);
      window.AndroidApp.checkGitHubUpdateNow();
    });

    document.getElementById("otaPickLocalBtn").addEventListener("click", () => {
      window.AndroidApp.pickLocalHtmlUpdate();
    });

    document.getElementById("otaResetBundledBtn").addEventListener("click", () => {
      if (!confirm("APK içine gömülü orijinal sürüme dönmek istiyor musunuz?\n(Çalışma verileriniz, haftalarınız ve tikleriniz KORUNUR.)")) return;
      window.AndroidApp.resetToBundledHtml();
    });

    refreshOtaPanelUI();
  }

  function bootNativeUi() {
    mountOtaSettingsCard();
    mountMediaControllerUI();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootNativeUi);
  } else {
    bootNativeUi();
  }
})();
