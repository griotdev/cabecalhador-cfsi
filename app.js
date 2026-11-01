/**
 * Aplicação Principal — Cabeçalhador de Atividades A4 (CFSI)
 */

(function () {
  const STORAGE_KEY = 'cabecalhador_cfsi_prefs_v1';
  const G = window.A4_GEOMETRY;
  const MOBILE_QUERY = window.matchMedia('(max-width: 760px)');
  const isMobile = () => MOBILE_QUERY.matches;

  // Estado central da aplicação
  const state = {
    header: {
      teacherRole: 'PROFESSORA:',
      teacherName: '',
      turma: 'INFANTIL III',
      dateDay: '',
      dateMonth: '',
      dateYear: String(new Date().getFullYear()),
      showBottomLine: true,
    },
    border: { ...window.DEFAULT_BORDER },
    marginMm: 6,
    lockAspect: true,
    zoomScale: 1.0, // Fator de zoom visual na tela (1.0 = 595.32px x 841.92px)
    image: null,
    /* Quando há uma imagem carregada, state.image possui:
      { src, x, y, width, height (pt A4), cropTop/Bottom/Left/Right (%),
        rotation, brightness, contrast, grayscale }
    */
  };

  // Objetos HTMLImageElement carregados em memória para renderização rápida no Canvas
  const loadedImages = { logoAfasjo: null, logoCfsi: null, activityImg: null };

  const $ = (id) => document.getElementById(id);
  const els = {
    panelSheet: $('panelSheet'),
    tabs: $('tabs'),
    panelDados: $('panelDados'),
    netDot: $('netDot'),
    brandLogo: $('brandLogo'),

    teacherRole: $('teacherRole'),
    turmaInput: $('turmaInput'),
    teacherNameInput: $('teacherNameInput'),
    dateDayInput: $('dateDayInput'),
    dateMonthInput: $('dateMonthInput'),
    dateYearInput: $('dateYearInput'),
    btnFillToday: $('btnFillToday'),
    showBottomLineCheck: $('showBottomLineCheck'),
    saveIndicator: $('saveIndicator'),

    fileInput: $('fileInput'),
    cameraInput: $('cameraInput'),
    btnPasteImage: $('btnPasteImage'),
    btnChooseFile: $('btnChooseFile'),
    btnCamera: $('btnCamera'),
    btnRemoveImage: $('btnRemoveImage'),

    adjustEmptyHint: $('adjustEmptyHint'),
    adjustControls: $('adjustControls'),
    btnOpenCropModal: $('btnOpenCropModal'),
    btnAutoTrimWhite: $('btnAutoTrimWhite'),
    btnResetCrop: $('btnResetCrop'),
    sliderCropTop: $('sliderCropTop'),
    sliderCropBottom: $('sliderCropBottom'),
    sliderCropLeft: $('sliderCropLeft'),
    sliderCropRight: $('sliderCropRight'),
    valCropTop: $('valCropTop'),
    valCropBottom: $('valCropBottom'),
    valCropLeft: $('valCropLeft'),
    valCropRight: $('valCropRight'),
    sliderMarginMm: $('sliderMarginMm'),
    valMarginMm: $('valMarginMm'),
    btnFitContain: $('btnFitContain'),
    btnFitFill: $('btnFitFill'),
    btnCenterImg: $('btnCenterImg'),
    btnRotateImg: $('btnRotateImg'),
    lockAspectCheck: $('lockAspectCheck'),
    btnEnhanceLineArt: $('btnEnhanceLineArt'),
    sliderBrightness: $('sliderBrightness'),
    sliderContrast: $('sliderContrast'),
    valBrightness: $('valBrightness'),
    valContrast: $('valContrast'),

    borderPresets: $('borderPresets'),
    borderColorField: $('borderColorField'),
    borderSwatches: $('borderSwatches'),
    borderColorInput: $('borderColorInput'),
    sliderBorderOffset: $('sliderBorderOffset'),
    valBorderOffset: $('valBorderOffset'),
    btnResetBorder: $('btnResetBorder'),

    fileNameInput: $('fileNameInput'),
    btnExportPdf: $('btnExportPdf'),
    btnExportDocx: $('btnExportDocx'),
    btnMore: $('btnMore'),
    moreMenu: $('moreMenu'),
    btnPrintSheet: $('btnPrintSheet'),
    btnInstallPwa: $('btnInstallPwa'),

    canvasScrollWrap: $('canvasScrollWrap'),
    a4Stage: $('a4Stage'),
    a4PreviewCanvas: $('a4PreviewCanvas'),
    usableAreaGuide: $('usableAreaGuide'),
    snapLineV: $('snapLineV'),
    snapLineH: $('snapLineH'),
    emptyDropzone: $('emptyDropzone'),
    imageTransformBox: $('imageTransformBox'),
    btnZoomOut: $('btnZoomOut'),
    btnZoomIn: $('btnZoomIn'),
    btnZoomFit: $('btnZoomFit'),
    zoomLabel: $('zoomLabel'),

    cropModalBackdrop: $('cropModalBackdrop'),
    btnCloseCropModal: $('btnCloseCropModal'),
    cropStageContainer: $('cropStageContainer'),
    cropModalImg: $('cropModalImg'),
    cropShadeTop: $('cropShadeTop'),
    cropShadeBottom: $('cropShadeBottom'),
    cropShadeLeft: $('cropShadeLeft'),
    cropShadeRight: $('cropShadeRight'),
    cropSelectionRect: $('cropSelectionRect'),
    cropBarTop: $('cropBarTop'),
    cropBarBottom: $('cropBarBottom'),
    cropBarLeft: $('cropBarLeft'),
    cropBarRight: $('cropBarRight'),
    btnModalResetCrop: $('btnModalResetCrop'),
    btnModalAutoTrim: $('btnModalAutoTrim'),
    btnApplyCropAndFit: $('btnApplyCropAndFit'),

    printOnlyImg: $('printOnlyImg'),
    toastMsg: $('toastMsg'),
  };

  let toastTimeout = null;
  function showToast(message) {
    els.toastMsg.textContent = message;
    els.toastMsg.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => els.toastMsg.classList.remove('show'), 3000);
  }

  // ============================================================================
  // Preferências salvas no computador (localStorage)
  // ============================================================================
  function loadSavedPrefs() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (saved.teacherRole) state.header.teacherRole = saved.teacherRole;
      if (typeof saved.teacherName === 'string') state.header.teacherName = saved.teacherName;
      if (typeof saved.turma === 'string') state.header.turma = saved.turma;
      if (typeof saved.dateYear === 'string' && saved.dateYear) state.header.dateYear = saved.dateYear;
      if (typeof saved.showBottomLine === 'boolean') state.header.showBottomLine = saved.showBottomLine;
      if (typeof saved.marginMm === 'number') state.marginMm = saved.marginMm;
      if (saved.border && typeof saved.border === 'object') {
        state.border = { ...window.DEFAULT_BORDER, ...saved.border };
      }
    } catch (e) {
      console.warn('Não foi possível ler as preferências:', e);
    }

    els.teacherRole.value = state.header.teacherRole;
    els.teacherNameInput.value = state.header.teacherName;
    els.turmaInput.value = state.header.turma;
    els.dateYearInput.value = state.header.dateYear;
    els.showBottomLineCheck.checked = state.header.showBottomLine;
    els.sliderMarginMm.value = String(state.marginMm);
    els.valMarginMm.textContent = `${state.marginMm} mm`;
    if (state.header.turma) els.fileNameInput.value = `Atividade - ${state.header.turma}`;

    // Dados já preenchidos: deixa a seção recolhida no computador
    if (state.header.teacherName.trim()) els.panelDados.open = false;
  }

  let saveFlashTimeout = null;
  function savePrefs() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          teacherRole: state.header.teacherRole,
          teacherName: state.header.teacherName,
          turma: state.header.turma,
          dateYear: state.header.dateYear,
          showBottomLine: state.header.showBottomLine,
          marginMm: state.marginMm,
          border: state.border,
        })
      );
      els.saveIndicator.style.opacity = '1';
      clearTimeout(saveFlashTimeout);
      saveFlashTimeout = setTimeout(() => (els.saveIndicator.style.opacity = '0.6'), 1200);
    } catch (e) {
      console.warn('Erro ao salvar preferências:', e);
    }
  }

  // Logos do cabeçalho embutidas em Base64 (nunca falham offline)
  function initLogos() {
    const assets = window.EMBEDDED_ASSETS || {};
    if (assets.logoCfsi) els.brandLogo.src = assets.logoCfsi;
    const loadImg = (src) =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
      });
    return Promise.all([
      loadImg(assets.logoAfasjo || './assets/logo-afasjo.png'),
      loadImg(assets.logoCfsi || './assets/logo-cfsi.png'),
    ]).then(([afasjo, cfsi]) => {
      loadedImages.logoAfasjo = afasjo;
      loadedImages.logoCfsi = cfsi;
    });
  }

  // ============================================================================
  // Imagem: encaixe, posição e controles
  // ============================================================================
  function getCroppedAspectRatio() {
    if (!loadedImages.activityImg || !state.image) return 1;
    const im = state.image;
    const natW = loadedImages.activityImg.naturalWidth || 100;
    const natH = loadedImages.activityImg.naturalHeight || 100;
    const effW = Math.max(1, natW * (1 - (im.cropLeft + im.cropRight) / 100));
    const effH = Math.max(1, natH * (1 - (im.cropTop + im.cropBottom) / 100));
    return Math.abs(im.rotation || 0) % 180 === 90 ? effH / effW : effW / effH;
  }

  function fitImageContain() {
    if (!state.image) return;
    const b = window.getUsableAreaBoundsPt(state);
    const aspect = getCroppedAspectRatio();
    let w = b.width;
    let h = w / aspect;
    if (h > b.height) {
      h = b.height;
      w = h * aspect;
    }
    Object.assign(state.image, {
      width: w,
      height: h,
      x: b.x + (b.width - w) / 2,
      y: b.y + (b.height - h) / 2,
    });
    renderPreview();
  }

  function fitImageFill() {
    if (!state.image) return;
    const b = window.getUsableAreaBoundsPt(state);
    Object.assign(state.image, { x: b.x, y: b.y, width: b.width, height: b.height });
    renderPreview();
  }

  function centerImageInArea() {
    if (!state.image) return;
    const b = window.getUsableAreaBoundsPt(state);
    state.image.x = b.x + (b.width - state.image.width) / 2;
    state.image.y = b.y + (b.height - state.image.height) / 2;
    renderPreview();
  }

  function setActivityImageDataUrl(dataUrl, toastMsg) {
    const img = new Image();
    img.onload = () => {
      loadedImages.activityImg = img;
      state.image = {
        src: dataUrl,
        x: 0, y: 0, width: 100, height: 100,
        cropTop: 0, cropBottom: 0, cropLeft: 0, cropRight: 0,
        rotation: 0, brightness: 100, contrast: 100, grayscale: false,
      };
      syncImageControlsFromState();
      fitImageContain();
      if (toastMsg) showToast(toastMsg);
      // No celular, depois de escolher a imagem vai direto para "Ajustar"
      if (isMobile()) setActiveTab('ajustar', true);
    };
    img.onerror = () => showToast('❌ Não foi possível abrir essa imagem.');
    img.src = dataUrl;
  }

  function syncImageControlsFromState() {
    const hasImg = Boolean(state.image && loadedImages.activityImg);
    els.btnRemoveImage.hidden = !hasImg;
    els.emptyDropzone.style.display = hasImg ? 'none' : 'flex';
    els.adjustEmptyHint.hidden = hasImg;
    els.adjustControls.hidden = !hasImg;
    if (!hasImg) return;

    const im = state.image;
    const setPair = (slider, out, val, suffix = '%') => {
      slider.value = String(val);
      out.textContent = `${Math.round(val)}${suffix}`;
    };
    setPair(els.sliderCropTop, els.valCropTop, im.cropTop);
    setPair(els.sliderCropBottom, els.valCropBottom, im.cropBottom);
    setPair(els.sliderCropLeft, els.valCropLeft, im.cropLeft);
    setPair(els.sliderCropRight, els.valCropRight, im.cropRight);
    setPair(els.sliderBrightness, els.valBrightness, im.brightness);
    setPair(els.sliderContrast, els.valContrast, im.contrast);
  }

  // ============================================================================
  // Renderização da folha na tela
  // ============================================================================
  let renderQueued = false;
  function renderPreview() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(() => {
      renderQueued = false;
      renderNow();
    });
  }

  function renderNow() {
    const z = state.zoomScale;
    els.a4Stage.style.width = `${Math.round(G.ptWidth * z)}px`;
    els.a4Stage.style.height = `${Math.round(G.ptHeight * z)}px`;
    els.zoomLabel.textContent = `${Math.round(z * 100)}%`;

    const dpr = window.devicePixelRatio || 1;
    window.renderA4SheetToCanvas(els.a4PreviewCanvas, state, loadedImages, {
      scaleFactor: Math.min(4, Math.max(1.5, z * dpr * 1.25)),
    });

    const b = window.getUsableAreaBoundsPt(state);
    const place = (el, x, y, w, h) => {
      el.style.left = `${x * z}px`;
      el.style.top = `${y * z}px`;
      el.style.width = `${w * z}px`;
      el.style.height = `${h * z}px`;
    };
    place(els.usableAreaGuide, b.x, b.y, b.width, b.height);
    place(els.emptyDropzone, b.x + 10, b.y + 10, Math.max(60, b.width - 20), Math.max(60, b.height - 20));

    if (state.image && loadedImages.activityImg) {
      els.imageTransformBox.style.display = 'block';
      place(els.imageTransformBox, state.image.x, state.image.y, state.image.width, state.image.height);
    } else {
      els.imageTransformBox.style.display = 'none';
    }
  }

  function fitZoomToWorkspace() {
    const wrap = els.canvasScrollWrap;
    const cs = getComputedStyle(wrap);
    const availW = wrap.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    let availH = wrap.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    if (availW <= 0) return;
    // No celular, ajusta pela largura (a folha rola na vertical)
    const scale = isMobile()
      ? availW / G.ptWidth
      : Math.min(availW / G.ptWidth, Math.max(200, availH) / G.ptHeight);
    state.zoomScale = Math.max(0.3, Math.min(1.6, scale));
    renderPreview();
  }

  function loadFileBlob(blob, label) {
    if (!blob || !blob.type.startsWith('image/')) {
      showToast('⚠️ Escolha um arquivo de imagem (PNG, JPG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setActivityImageDataUrl(ev.target.result, `✅ ${label}`);
    reader.readAsDataURL(blob);
  }

  // ============================================================================
  // Mover, redimensionar e pinça (dois dedos) sobre a imagem
  // ============================================================================
  function setupTransformBoxInteractions() {
    const box = els.imageTransformBox;
    const pointers = new Map();
    let mode = null; // 'move' | 'resize' | 'pinch'
    let handle = null;
    let start = null;

    const resetStart = (e) => {
      start = {
        mouseX: e ? e.clientX : 0,
        mouseY: e ? e.clientY : 0,
        img: { ...state.image },
      };
    };

    const pinchInfo = () => {
      const [a, b] = [...pointers.values()];
      return {
        dist: Math.hypot(a.x - b.x, a.y - b.y),
      };
    };

    box.addEventListener('pointerdown', (e) => {
      if (!state.image) return;
      e.preventDefault();
      box.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.size === 2) {
        mode = 'pinch';
        resetStart();
        start.pinchDist = pinchInfo().dist;
        return;
      }

      const handleEl = e.target.closest('.resize-handle');
      mode = handleEl ? 'resize' : 'move';
      handle = handleEl ? handleEl.dataset.handle : null;
      resetStart(e);
      box.classList.add('dragging');
      els.usableAreaGuide.classList.add('active');
    });

    box.addEventListener('pointermove', (e) => {
      if (!mode || !state.image || !pointers.has(e.pointerId)) return;
      e.preventDefault();
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const z = state.zoomScale;

      if (mode === 'pinch') {
        if (pointers.size < 2) return;
        const ratio = Math.max(0.2, pinchInfo().dist / start.pinchDist);
        const s = start.img;
        const w = Math.max(36, s.width * ratio);
        const h = Math.max(36, s.height * ratio);
        const cx = s.x + s.width / 2;
        const cy = s.y + s.height / 2;
        Object.assign(state.image, { width: w, height: h, x: cx - w / 2, y: cy - h / 2 });
        renderPreview();
        return;
      }

      const dx = (e.clientX - start.mouseX) / z;
      const dy = (e.clientY - start.mouseY) / z;
      const s = start.img;
      const bounds = window.getUsableAreaBoundsPt(state);

      if (mode === 'move') {
        let nx = s.x + dx;
        let ny = s.y + dy;
        const tcx = bounds.x + bounds.width / 2;
        const tcy = bounds.y + bounds.height / 2;
        const snap = 5;
        const snapX = Math.abs(nx + s.width / 2 - tcx) < snap;
        const snapY = Math.abs(ny + s.height / 2 - tcy) < snap;
        if (snapX) nx = tcx - s.width / 2;
        if (snapY) ny = tcy - s.height / 2;
        els.snapLineV.style.display = snapX ? 'block' : 'none';
        els.snapLineV.style.left = `${tcx * z}px`;
        els.snapLineH.style.display = snapY ? 'block' : 'none';
        els.snapLineH.style.top = `${tcy * z}px`;
        state.image.x = nx;
        state.image.y = ny;
      } else if (mode === 'resize') {
        let { x, y, width: w, height: h } = s;
        const aspect = s.width / Math.max(1, s.height);
        const min = 36;
        if (handle.includes('e')) w = Math.max(min, s.width + dx);
        if (handle.includes('s')) h = Math.max(min, s.height + dy);
        if (handle.includes('w') && s.width - dx >= min) { w = s.width - dx; x = s.x + dx; }
        if (handle.includes('n') && s.height - dy >= min) { h = s.height - dy; y = s.y + dy; }

        if (state.lockAspect && handle.length === 2) {
          if (Math.abs(dx) > Math.abs(dy)) {
            const nh = w / aspect;
            if (handle.includes('n')) y = s.y + (s.height - nh);
            h = nh;
          } else {
            const nw = h * aspect;
            if (handle.includes('w')) x = s.x + (s.width - nw);
            w = nw;
          }
        }
        Object.assign(state.image, { x, y, width: w, height: h });
      }
      renderPreview();
    });

    const end = (e) => {
      pointers.delete(e.pointerId);
      if (mode === 'pinch' && pointers.size === 1) {
        // Continua movendo com o dedo que sobrou
        const [p] = [...pointers.values()];
        mode = 'move';
        start = { mouseX: p.x, mouseY: p.y, img: { ...state.image } };
        return;
      }
      if (pointers.size > 0) return;
      mode = null;
      handle = null;
      box.classList.remove('dragging');
      els.usableAreaGuide.classList.remove('active');
      els.snapLineV.style.display = 'none';
      els.snapLineH.style.display = 'none';
    };
    box.addEventListener('pointerup', end);
    box.addEventListener('pointercancel', end);
  }

  // ============================================================================
  // Modal de recorte visual
  // ============================================================================
  function openCropModal() {
    if (!state.image) return;
    els.cropModalImg.src = state.image.src;
    els.cropModalBackdrop.classList.add('open');
    requestAnimationFrame(updateCropModalOverlay);
  }
  function closeCropModal() {
    els.cropModalBackdrop.classList.remove('open');
  }

  function updateCropModalOverlay() {
    if (!state.image) return;
    const { cropTop: t, cropBottom: b, cropLeft: l, cropRight: r } = state.image;
    Object.assign(els.cropShadeTop.style, { top: '0', left: '0', right: '0', height: `${t}%` });
    Object.assign(els.cropShadeBottom.style, { bottom: '0', left: '0', right: '0', height: `${b}%` });
    Object.assign(els.cropShadeLeft.style, { top: `${t}%`, bottom: `${b}%`, left: '0', width: `${l}%` });
    Object.assign(els.cropShadeRight.style, { top: `${t}%`, bottom: `${b}%`, right: '0', width: `${r}%` });
    Object.assign(els.cropSelectionRect.style, { top: `${t}%`, bottom: `${b}%`, left: `${l}%`, right: `${r}%` });
    els.cropBarTop.style.top = `calc(${t}% - 14px)`;
    els.cropBarBottom.style.bottom = `calc(${b}% - 14px)`;
    els.cropBarLeft.style.left = `calc(${l}% - 14px)`;
    els.cropBarRight.style.right = `calc(${r}% - 14px)`;
  }

  function applyAutoTrim() {
    if (!state.image || !loadedImages.activityImg) return;
    const detected = window.autoDetectWhiteMargins(loadedImages.activityImg);
    if (!detected) return;
    Object.assign(state.image, detected);
    syncImageControlsFromState();
    updateCropModalOverlay();
    fitImageContain();
    showToast('✨ Sobras brancas removidas!');
  }

  function resetCrop() {
    if (!state.image) return;
    Object.assign(state.image, { cropTop: 0, cropBottom: 0, cropLeft: 0, cropRight: 0 });
    syncImageControlsFromState();
    updateCropModalOverlay();
    fitImageContain();
  }

  function setupCropModalInteractions() {
    [els.cropBarTop, els.cropBarBottom, els.cropBarLeft, els.cropBarRight].forEach((bar) => {
      let active = false;
      bar.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        active = true;
        bar.setPointerCapture(e.pointerId);
      });
      bar.addEventListener('pointermove', (e) => {
        if (!active || !state.image) return;
        e.preventDefault();
        const rect = els.cropStageContainer.getBoundingClientRect();
        const relX = ((e.clientX - rect.left) / rect.width) * 100;
        const relY = ((e.clientY - rect.top) / rect.height) * 100;
        const im = state.image;
        const clamp = (v, max) => Math.max(0, Math.min(max, Number(v.toFixed(1))));
        switch (bar.dataset.cropEdge) {
          case 'top': im.cropTop = clamp(relY, 75 - im.cropBottom); break;
          case 'bottom': im.cropBottom = clamp(100 - relY, 75 - im.cropTop); break;
          case 'left': im.cropLeft = clamp(relX, 75 - im.cropRight); break;
          case 'right': im.cropRight = clamp(100 - relX, 75 - im.cropLeft); break;
        }
        syncImageControlsFromState();
        updateCropModalOverlay();
      });
      const stop = () => (active = false);
      bar.addEventListener('pointerup', stop);
      bar.addEventListener('pointercancel', stop);
    });

    els.btnOpenCropModal.addEventListener('click', openCropModal);
    els.btnCloseCropModal.addEventListener('click', () => {
      closeCropModal();
      fitImageContain();
    });
    els.btnApplyCropAndFit.addEventListener('click', () => {
      closeCropModal();
      fitImageContain();
      showToast('✂️ Corte aplicado!');
    });
    els.btnModalResetCrop.addEventListener('click', resetCrop);
    els.btnModalAutoTrim.addEventListener('click', applyAutoTrim);
  }

  // ============================================================================
  // Borda da folha
  // ============================================================================
  const PRESET_ORDER = ['double-official', 'double-custom', 'single-thin', 'single-thick', 'dashed', 'rounded', 'none'];

  function buildBorderPresets() {
    els.borderPresets.innerHTML = '';
    PRESET_ORDER.forEach((style) => {
      const preset = window.BORDER_PRESETS[style];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'preset';
      btn.dataset.style = style;
      const c = document.createElement('canvas');
      c.width = 84;
      c.height = 118;
      btn.appendChild(c);
      btn.appendChild(document.createTextNode(preset.label));
      btn.addEventListener('click', () => {
        state.border.style = style;
        onBorderChange();
      });
      els.borderPresets.appendChild(btn);
    });
  }

  function syncBorderControls() {
    const b = window.getBorderConfig(state);
    els.borderPresets.querySelectorAll('.preset').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.style === b.style);
      window.drawBorderThumbnail(btn.querySelector('canvas'), btn.dataset.style, state.border.color);
    });
    const preset = window.BORDER_PRESETS[b.style];
    const colorEnabled = !preset.fixedColor && b.style !== 'none';
    els.borderColorField.classList.toggle('disabled', !colorEnabled);
    els.borderSwatches.querySelectorAll('.swatch[data-color]').forEach((sw) => {
      sw.classList.toggle('active', sw.dataset.color.toLowerCase() === String(state.border.color).toLowerCase());
    });
    els.borderColorInput.value = state.border.color;
    els.sliderBorderOffset.value = String(b.offsetMm);
    els.valBorderOffset.textContent = `${String(b.offsetMm).replace('.', ',')} mm`;
  }

  function onBorderChange() {
    savePrefs();
    syncBorderControls();
    if (state.image) fitImageContain();
    else renderPreview();
  }

  // ============================================================================
  // Abas do celular
  // ============================================================================
  function setActiveTab(name, forceOpen) {
    const sheet = els.panelSheet;
    const same = sheet.dataset.active === name;
    sheet.dataset.active = name;
    els.tabs.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
    if (forceOpen) sheet.classList.remove('collapsed');
    else if (same) sheet.classList.toggle('collapsed');
    else sheet.classList.remove('collapsed');
  }

  function applyLayoutMode() {
    // No celular todas as seções ficam "abertas" (a aba decide qual aparece)
    if (isMobile()) {
      document.querySelectorAll('.panel').forEach((p) => (p.open = true));
    }
    fitZoomToWorkspace();
  }

  // ============================================================================
  // Exportação (download ou compartilhar no celular)
  // ============================================================================
  async function deliverFile(blob, filename) {
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    if (coarse && navigator.canShare) {
      try {
        const file = new File([blob], filename, { type: blob.type });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: filename });
          return 'shared';
        }
      } catch (err) {
        if (err && err.name === 'AbortError') return 'cancelled';
      }
    }
    window.triggerBlobDownload(blob, filename);
    return 'downloaded';
  }

  function getSafeBaseFilename() {
    const raw = (els.fileNameInput.value || 'Atividade').trim();
    return raw.replace(/[\\/:*?"<>|]+/g, '-') || 'Atividade';
  }

  async function exportWith(button, label, generator, ext) {
    const original = button.innerHTML;
    try {
      button.disabled = true;
      button.textContent = '⏳ Gerando...';
      const blob = await generator(state, loadedImages);
      const filename = `${getSafeBaseFilename()}.${ext}`;
      const result = await deliverFile(blob, filename);
      if (result === 'downloaded') showToast(`✅ "${filename}" salvo em Downloads`);
    } catch (err) {
      console.error(err);
      showToast(`❌ Erro ao gerar ${label}.`);
    } finally {
      button.disabled = false;
      button.innerHTML = original;
    }
  }

  // ============================================================================
  // Eventos
  // ============================================================================
  function bindEvents() {
    // Dados da professora
    const onHeaderChange = () => {
      Object.assign(state.header, {
        teacherRole: els.teacherRole.value,
        teacherName: els.teacherNameInput.value,
        turma: els.turmaInput.value,
        dateDay: els.dateDayInput.value,
        dateMonth: els.dateMonthInput.value,
        dateYear: els.dateYearInput.value || String(new Date().getFullYear()),
        showBottomLine: els.showBottomLineCheck.checked,
      });
      savePrefs();
      if (state.image) fitImageContain();
      else renderPreview();
    };
    [els.teacherRole, els.teacherNameInput, els.turmaInput, els.dateDayInput,
      els.dateMonthInput, els.dateYearInput, els.showBottomLineCheck].forEach((el) => {
      el.addEventListener('input', onHeaderChange);
      el.addEventListener('change', onHeaderChange);
    });
    els.btnFillToday.addEventListener('click', () => {
      const now = new Date();
      els.dateDayInput.value = String(now.getDate()).padStart(2, '0');
      els.dateMonthInput.value = String(now.getMonth() + 1).padStart(2, '0');
      els.dateYearInput.value = String(now.getFullYear());
      onHeaderChange();
    });

    // Inserir imagem
    els.btnChooseFile.addEventListener('click', () => els.fileInput.click());
    els.btnCamera.addEventListener('click', () => els.cameraInput.click());
    els.emptyDropzone.addEventListener('click', () => els.fileInput.click());
    const onFilePicked = (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        if (!/^IMG[_-]|^image/i.test(file.name)) {
          els.fileNameInput.value = `Atividade - ${file.name.replace(/\.[^/.]+$/, '')}`;
        }
        loadFileBlob(file, 'Imagem carregada!');
      }
      e.target.value = '';
    };
    els.fileInput.addEventListener('change', onFilePicked);
    els.cameraInput.addEventListener('change', onFilePicked);

    els.btnPasteImage.addEventListener('click', async () => {
      try {
        if (!navigator.clipboard || !navigator.clipboard.read) throw new Error('sem suporte');
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const type = item.types.find((t) => t.startsWith('image/'));
          if (type) {
            loadFileBlob(await item.getType(type), 'Imagem colada!');
            return;
          }
        }
        showToast('⚠️ Nenhuma imagem copiada. Copie uma imagem primeiro.');
      } catch (err) {
        showToast(isMobile() ? '💡 Use "Galeria" para escolher a imagem.' : '💡 Aperte Ctrl + V para colar a imagem.');
      }
    });

    window.addEventListener('paste', (e) => {
      const items = (e.clipboardData && e.clipboardData.items) || [];
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          loadFileBlob(item.getAsFile(), 'Imagem colada com Ctrl + V!');
          return;
        }
      }
    });

    window.addEventListener('dragover', (e) => {
      e.preventDefault();
      els.emptyDropzone.classList.add('dragover');
    });
    window.addEventListener('dragleave', () => els.emptyDropzone.classList.remove('dragover'));
    window.addEventListener('drop', (e) => {
      e.preventDefault();
      els.emptyDropzone.classList.remove('dragover');
      const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) loadFileBlob(file, 'Imagem adicionada!');
    });

    els.btnRemoveImage.addEventListener('click', () => {
      state.image = null;
      loadedImages.activityImg = null;
      syncImageControlsFromState();
      renderPreview();
      showToast('🗑️ Imagem removida.');
    });

    // Ajustes
    const onCropSlider = () => {
      if (!state.image) return;
      Object.assign(state.image, {
        cropTop: Number(els.sliderCropTop.value),
        cropBottom: Number(els.sliderCropBottom.value),
        cropLeft: Number(els.sliderCropLeft.value),
        cropRight: Number(els.sliderCropRight.value),
      });
      syncImageControlsFromState();
      fitImageContain();
    };
    [els.sliderCropTop, els.sliderCropBottom, els.sliderCropLeft, els.sliderCropRight].forEach((s) =>
      s.addEventListener('input', onCropSlider)
    );
    els.btnAutoTrimWhite.addEventListener('click', applyAutoTrim);
    els.btnResetCrop.addEventListener('click', () => {
      resetCrop();
      showToast('↺ Cortes desfeitos.');
    });

    els.sliderMarginMm.addEventListener('input', () => {
      state.marginMm = Number(els.sliderMarginMm.value);
      els.valMarginMm.textContent = `${state.marginMm} mm`;
      els.usableAreaGuide.classList.add('active');
      savePrefs();
      if (state.image) fitImageContain();
      else renderPreview();
    });
    els.sliderMarginMm.addEventListener('change', () =>
      setTimeout(() => els.usableAreaGuide.classList.remove('active'), 600)
    );

    els.btnFitContain.addEventListener('click', fitImageContain);
    els.btnFitFill.addEventListener('click', fitImageFill);
    els.btnCenterImg.addEventListener('click', centerImageInArea);
    els.btnRotateImg.addEventListener('click', () => {
      if (!state.image) return;
      state.image.rotation = ((state.image.rotation || 0) + 90) % 360;
      fitImageContain();
    });
    els.lockAspectCheck.addEventListener('change', () => (state.lockAspect = els.lockAspectCheck.checked));

    const onFilter = () => {
      if (!state.image) return;
      state.image.brightness = Number(els.sliderBrightness.value);
      state.image.contrast = Number(els.sliderContrast.value);
      syncImageControlsFromState();
      renderPreview();
    };
    els.sliderBrightness.addEventListener('input', onFilter);
    els.sliderContrast.addEventListener('input', onFilter);
    els.btnEnhanceLineArt.addEventListener('click', () => {
      if (!state.image) return;
      const on = state.image.brightness === 112 && state.image.contrast === 135;
      state.image.brightness = on ? 100 : 112;
      state.image.contrast = on ? 100 : 135;
      syncImageControlsFromState();
      renderPreview();
    });

    // Borda
    els.borderSwatches.querySelectorAll('.swatch[data-color]').forEach((sw) => {
      sw.addEventListener('click', () => {
        state.border.color = sw.dataset.color;
        if (window.BORDER_PRESETS[state.border.style].fixedColor) state.border.style = 'double-custom';
        onBorderChange();
      });
    });
    els.borderColorInput.addEventListener('input', () => {
      state.border.color = els.borderColorInput.value;
      onBorderChange();
    });
    els.sliderBorderOffset.addEventListener('input', () => {
      state.border.offsetMm = Number(els.sliderBorderOffset.value);
      onBorderChange();
    });
    els.btnResetBorder.addEventListener('click', () => {
      state.border = { ...window.DEFAULT_BORDER };
      onBorderChange();
    });

    // Zoom
    els.btnZoomIn.addEventListener('click', () => {
      state.zoomScale = Math.min(2, +(state.zoomScale + 0.1).toFixed(2));
      renderPreview();
    });
    els.btnZoomOut.addEventListener('click', () => {
      state.zoomScale = Math.max(0.3, +(state.zoomScale - 0.1).toFixed(2));
      renderPreview();
    });
    els.btnZoomFit.addEventListener('click', fitZoomToWorkspace);

    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(fitZoomToWorkspace, 120);
    });
    MOBILE_QUERY.addEventListener('change', applyLayoutMode);

    // Abas (celular)
    els.tabs.querySelectorAll('.tab').forEach((tab) =>
      tab.addEventListener('click', () => setActiveTab(tab.dataset.tab))
    );

    // Exportar
    els.btnExportPdf.addEventListener('click', () =>
      exportWith(els.btnExportPdf, 'o PDF', window.generatePdfBlob, 'pdf')
    );
    els.btnExportDocx.addEventListener('click', () =>
      exportWith(els.btnExportDocx, 'o Word', window.generateDocxBlob, 'docx')
    );

    // Menu "⋯"
    els.btnMore.addEventListener('click', (e) => {
      e.stopPropagation();
      els.moreMenu.hidden = !els.moreMenu.hidden;
    });
    document.addEventListener('click', (e) => {
      if (!els.moreMenu.hidden && !els.moreMenu.contains(e.target)) els.moreMenu.hidden = true;
    });

    els.btnPrintSheet.addEventListener('click', () => {
      els.moreMenu.hidden = true;
      const off = document.createElement('canvas');
      window.renderA4SheetToCanvas(off, state, loadedImages, { scaleFactor: 4.1666667 });
      els.printOnlyImg.onload = () => window.print();
      els.printOnlyImg.src = off.toDataURL('image/jpeg', 0.95);
    });

    // Indicador online/offline
    const updateNet = () => {
      els.netDot.classList.toggle('offline', !navigator.onLine);
      els.netDot.title = navigator.onLine ? 'Funciona sem internet' : 'Modo offline';
    };
    window.addEventListener('online', updateNet);
    window.addEventListener('offline', updateNet);
    updateNet();
  }

  // ============================================================================
  // PWA: instalar e service worker
  // ============================================================================
  function setupPwa() {
    let deferredPrompt = null;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
    });
    els.btnInstallPwa.addEventListener('click', async () => {
      els.moreMenu.hidden = true;
      if (!deferredPrompt) {
        showToast('💡 Use o menu do navegador › "Instalar app" ou "Adicionar à tela inicial".');
        return;
      }
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') showToast('📌 Aplicativo instalado!');
      deferredPrompt = null;
    });
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('./sw.js').catch((err) => console.warn('SW:', err));
    }
  }

  // ============================================================================
  // Inicialização
  // ============================================================================
  function init() {
    loadSavedPrefs();
    buildBorderPresets();
    syncBorderControls();
    syncImageControlsFromState();
    setupTransformBoxInteractions();
    setupCropModalInteractions();
    bindEvents();
    setupPwa();
    applyLayoutMode();
    initLogos().then(() => {
      fitZoomToWorkspace();
      renderPreview();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
