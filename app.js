/**
 * Aplicação Principal — Cabeçalhador de Atividades A4 (CFSI)
 */

(function () {
  const STORAGE_KEY = 'cabecalhador_cfsi_prefs_v1';
  const G = window.A4_GEOMETRY;

  // Estado central da aplicação
  const state = {
    header: {
      teacherRole: 'PROFESSORA:',
      teacherName: 'DAIANA ICHIHASHI RODRIGUES',
      turma: 'INFANTIL III',
      dateDay: '',
      dateMonth: '',
      dateYear: '2026',
      showBottomLine: true,
    },
    marginMm: 6,
    lockAspect: true,
    zoomScale: 1.0, // Fator de zoom visual na tela (1.0 = 595.32px x 841.92px)
    image: null,
    /* Quando há uma imagem carregada, state.image possui:
      {
        src: string (DataURL),
        x: number (em pt A4),
        y: number (em pt A4),
        width: number (em pt A4),
        height: number (em pt A4),
        cropTop: number (0..60 %),
        cropBottom: number (0..60 %),
        cropLeft: number (0..60 %),
        cropRight: number (0..60 %),
        rotation: number (0, 90, 180, 270),
        brightness: number (70..140),
        contrast: number (80..180),
        grayscale: boolean
      }
    */
  };

  // Objetos HTMLImageElement carregados em memória para renderização rápida no Canvas
  const loadedImages = {
    logoAfasjo: null,
    logoCfsi: null,
    activityImg: null,
  };

  // Referências de DOM
  const els = {
    teacherRole: document.getElementById('teacherRole'),
    turmaInput: document.getElementById('turmaInput'),
    teacherNameInput: document.getElementById('teacherNameInput'),
    dateDayInput: document.getElementById('dateDayInput'),
    dateMonthInput: document.getElementById('dateMonthInput'),
    dateYearInput: document.getElementById('dateYearInput'),
    btnFillToday: document.getElementById('btnFillToday'),
    showBottomLineCheck: document.getElementById('showBottomLineCheck'),
    saveIndicator: document.getElementById('saveIndicator'),

    fileInput: document.getElementById('fileInput'),
    btnPasteImage: document.getElementById('btnPasteImage'),
    btnChooseFile: document.getElementById('btnChooseFile'),
    btnLoadSample: document.getElementById('btnLoadSample'),
    btnRemoveImage: document.getElementById('btnRemoveImage'),

    btnOpenCropModal: document.getElementById('btnOpenCropModal'),
    btnAutoTrimWhite: document.getElementById('btnAutoTrimWhite'),
    btnResetCrop: document.getElementById('btnResetCrop'),

    sliderCropTop: document.getElementById('sliderCropTop'),
    sliderCropBottom: document.getElementById('sliderCropBottom'),
    sliderCropLeft: document.getElementById('sliderCropLeft'),
    sliderCropRight: document.getElementById('sliderCropRight'),
    valCropTop: document.getElementById('valCropTop'),
    valCropBottom: document.getElementById('valCropBottom'),
    valCropLeft: document.getElementById('valCropLeft'),
    valCropRight: document.getElementById('valCropRight'),

    sliderMarginMm: document.getElementById('sliderMarginMm'),
    valMarginMm: document.getElementById('valMarginMm'),

    btnFitContain: document.getElementById('btnFitContain'),
    btnFitFill: document.getElementById('btnFitFill'),
    btnCenterImg: document.getElementById('btnCenterImg'),
    btnRotateImg: document.getElementById('btnRotateImg'),
    lockAspectCheck: document.getElementById('lockAspectCheck'),

    btnEnhanceLineArt: document.getElementById('btnEnhanceLineArt'),
    sliderBrightness: document.getElementById('sliderBrightness'),
    sliderContrast: document.getElementById('sliderContrast'),
    valBrightness: document.getElementById('valBrightness'),
    valContrast: document.getElementById('valContrast'),

    fileNameInput: document.getElementById('fileNameInput'),
    btnExportPdf: document.getElementById('btnExportPdf'),
    btnExportDocx: document.getElementById('btnExportDocx'),
    btnPrintSheet: document.getElementById('btnPrintSheet'),

    workspaceArea: document.getElementById('workspaceArea'),
    canvasScrollWrap: document.getElementById('canvasScrollWrap'),
    a4Stage: document.getElementById('a4Stage'),
    a4PreviewCanvas: document.getElementById('a4PreviewCanvas'),
    usableAreaGuide: document.getElementById('usableAreaGuide'),
    snapLineV: document.getElementById('snapLineV'),
    snapLineH: document.getElementById('snapLineH'),
    emptyDropzone: document.getElementById('emptyDropzone'),
    imageTransformBox: document.getElementById('imageTransformBox'),

    btnZoomOut: document.getElementById('btnZoomOut'),
    btnZoomIn: document.getElementById('btnZoomIn'),
    btnZoomFit: document.getElementById('btnZoomFit'),
    zoomLabel: document.getElementById('zoomLabel'),

    cropModalBackdrop: document.getElementById('cropModalBackdrop'),
    btnCloseCropModal: document.getElementById('btnCloseCropModal'),
    cropStageContainer: document.getElementById('cropStageContainer'),
    cropModalImg: document.getElementById('cropModalImg'),
    cropShadeTop: document.getElementById('cropShadeTop'),
    cropShadeBottom: document.getElementById('cropShadeBottom'),
    cropShadeLeft: document.getElementById('cropShadeLeft'),
    cropShadeRight: document.getElementById('cropShadeRight'),
    cropSelectionRect: document.getElementById('cropSelectionRect'),
    cropBarTop: document.getElementById('cropBarTop'),
    cropBarBottom: document.getElementById('cropBarBottom'),
    cropBarLeft: document.getElementById('cropBarLeft'),
    cropBarRight: document.getElementById('cropBarRight'),
    btnModalResetCrop: document.getElementById('btnModalResetCrop'),
    btnModalAutoTrim: document.getElementById('btnModalAutoTrim'),
    btnApplyCropAndFit: document.getElementById('btnApplyCropAndFit'),

    helpModalBackdrop: document.getElementById('helpModalBackdrop'),
    btnHowToUse: document.getElementById('btnHowToUse'),
    btnCloseHelpModal: document.getElementById('btnCloseHelpModal'),
    btnOkHelpModal: document.getElementById('btnOkHelpModal'),

    btnInstallPwa: document.getElementById('btnInstallPwa'),
    offlineBadge: document.getElementById('offlineBadge'),
    topBrandLogo: document.getElementById('topBrandLogo'),
    printOnlyImg: document.getElementById('printOnlyImg'),
    toastMsg: document.getElementById('toastMsg'),
  };

  let toastTimeout = null;
  function showToast(message) {
    if (!els.toastMsg) return;
    els.toastMsg.textContent = message;
    els.toastMsg.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      els.toastMsg.classList.remove('show');
    }, 3200);
  }

  // Carrega preferências salvas no localStorage
  function loadSavedPrefs() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved.teacherRole) state.header.teacherRole = saved.teacherRole;
      if (typeof saved.teacherName === 'string')
        state.header.teacherName = saved.teacherName;
      if (typeof saved.turma === 'string') state.header.turma = saved.turma;
      if (typeof saved.dateYear === 'string')
        state.header.dateYear = saved.dateYear;
      if (typeof saved.showBottomLine === 'boolean')
        state.header.showBottomLine = saved.showBottomLine;
      if (typeof saved.marginMm === 'number') state.marginMm = saved.marginMm;
    } catch (e) {
      console.warn('Não foi possível ler localStorage:', e);
    }

    // Sincroniza inputs com o estado carregado
    els.teacherRole.value = state.header.teacherRole;
    els.teacherNameInput.value = state.header.teacherName;
    els.turmaInput.value = state.header.turma;
    els.dateYearInput.value = state.header.dateYear;
    els.showBottomLineCheck.checked = state.header.showBottomLine;
    els.sliderMarginMm.value = String(state.marginMm);
    els.valMarginMm.textContent = `${state.marginMm} mm`;

    if (state.header.turma) {
      els.fileNameInput.value = `Atividade - ${state.header.turma}`;
    }
  }

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
        })
      );
      if (els.saveIndicator) {
        els.saveIndicator.textContent = '✓ Salvo no PC';
      }
    } catch (e) {
      console.warn('Erro ao salvar preferências:', e);
    }
  }

  // Carrega as logos do cabeçalho a partir do Base64 embutido (nunca falha offline nem bloqueia canvas)
  function initLogos() {
    const assets = window.EMBEDDED_ASSETS || {};
    if (assets.logoCfsi && els.topBrandLogo) {
      els.topBrandLogo.src = assets.logoCfsi;
    }

    const loadImg = (src) =>
      new Promise((resolve) => {
        if (!src) return resolve(null);
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
      renderPreview();
    });
  }

  // Calcula proporção efetiva (largura / altura) da imagem já descontando o corte (crop)
  function getCroppedAspectRatio() {
    if (!loadedImages.activityImg || !state.image) return 1;
    const natW = loadedImages.activityImg.naturalWidth || 100;
    const natH = loadedImages.activityImg.naturalHeight || 100;
    const cropL = (state.image.cropLeft || 0) / 100;
    const cropR = (state.image.cropRight || 0) / 100;
    const cropT = (state.image.cropTop || 0) / 100;
    const cropB = (state.image.cropBottom || 0) / 100;

    const effW = Math.max(1, natW * (1 - cropL - cropR));
    const effH = Math.max(1, natH * (1 - cropT - cropB));
    const rot = Math.abs(state.image.rotation || 0) % 180;
    return rot === 90 ? effH / effW : effW / effH;
  }

  // Encaixa a imagem proporcionalmente dentro da área útil das margens
  function fitImageContain() {
    if (!state.image || !loadedImages.activityImg) return;
    const bounds = window.getUsableAreaBoundsPt(state);
    const aspect = getCroppedAspectRatio();

    let w = bounds.width;
    let h = w / aspect;
    if (h > bounds.height) {
      h = bounds.height;
      w = h * aspect;
    }

    state.image.width = w;
    state.image.height = h;
    state.image.x = bounds.x + (bounds.width - w) / 2;
    state.image.y = bounds.y + (bounds.height - h) / 2;
    renderPreview();
  }

  // Preenche toda a área útil das margens
  function fitImageFill() {
    if (!state.image || !loadedImages.activityImg) return;
    const bounds = window.getUsableAreaBoundsPt(state);
    state.image.x = bounds.x;
    state.image.y = bounds.y;
    state.image.width = bounds.width;
    state.image.height = bounds.height;
    renderPreview();
  }

  // Centraliza a imagem mantendo o tamanho atual
  function centerImageInArea() {
    if (!state.image) return;
    const bounds = window.getUsableAreaBoundsPt(state);
    state.image.x = bounds.x + (bounds.width - state.image.width) / 2;
    state.image.y = bounds.y + (bounds.height - state.image.height) / 2;
    renderPreview();
  }

  // Define uma nova imagem de atividade a partir de um DataURL
  function setActivityImageDataUrl(dataUrl, options = {}) {
    const img = new Image();
    img.onload = () => {
      loadedImages.activityImg = img;
      state.image = {
        src: dataUrl,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        cropTop: options.cropTop || 0,
        cropBottom: options.cropBottom || 0,
        cropLeft: options.cropLeft || 0,
        cropRight: options.cropRight || 0,
        rotation: 0,
        brightness: 100,
        contrast: 100,
        grayscale: false,
      };

      syncImageControlsFromState();
      fitImageContain();
      if (options.toastMsg) {
        showToast(options.toastMsg);
      }
    };
    img.onerror = () => {
      showToast('❌ Não foi possível abrir essa imagem. Tente outra imagem.');
    };
    img.src = dataUrl;
  }

  // Sincroniza sliders de corte e nitidez com o estado atual da imagem
  function syncImageControlsFromState() {
    const hasImg = Boolean(state.image && loadedImages.activityImg);
    els.btnRemoveImage.style.display = hasImg ? 'inline-flex' : 'none';
    els.emptyDropzone.style.display = hasImg ? 'none' : 'flex';
    els.imageTransformBox.style.display = hasImg ? 'block' : 'none';

    const controlsToToggle = [
      els.btnOpenCropModal,
      els.btnAutoTrimWhite,
      els.btnResetCrop,
      els.sliderCropTop,
      els.sliderCropBottom,
      els.sliderCropLeft,
      els.sliderCropRight,
      els.btnFitContain,
      els.btnFitFill,
      els.btnCenterImg,
      els.btnRotateImg,
      els.btnEnhanceLineArt,
      els.sliderBrightness,
      els.sliderContrast,
    ];
    controlsToToggle.forEach((el) => {
      if (el) el.disabled = !hasImg;
    });

    if (!hasImg) return;

    const im = state.image;
    els.sliderCropTop.value = String(im.cropTop);
    els.sliderCropBottom.value = String(im.cropBottom);
    els.sliderCropLeft.value = String(im.cropLeft);
    els.sliderCropRight.value = String(im.cropRight);

    els.valCropTop.textContent = `${Math.round(im.cropTop)}%`;
    els.valCropBottom.textContent = `${Math.round(im.cropBottom)}%`;
    els.valCropLeft.textContent = `${Math.round(im.cropLeft)}%`;
    els.valCropRight.textContent = `${Math.round(im.cropRight)}%`;

    els.sliderBrightness.value = String(im.brightness);
    els.sliderContrast.value = String(im.contrast);
    els.valBrightness.textContent = `${im.brightness}%`;
    els.valContrast.textContent = `${im.contrast}%`;
  }

  // Atualiza tamanho na tela e desenha a folha A4 no Canvas de Preview
  function renderPreview() {
    const stageW = Math.round(G.ptWidth * state.zoomScale);
    const stageH = Math.round(G.ptHeight * state.zoomScale);

    els.a4Stage.style.width = `${stageW}px`;
    els.a4Stage.style.height = `${stageH}px`;
    els.zoomLabel.textContent = `${Math.round(state.zoomScale * 100)}%`;

    // Renderiza a folha A4 em alta nitidez para a tela
    window.renderA4SheetToCanvas(els.a4PreviewCanvas, state, loadedImages, {
      scaleFactor: Math.max(2, window.devicePixelRatio || 2),
    });

    // Posiciona a guia tracejada da área útil (margens)
    const bounds = window.getUsableAreaBoundsPt(state);
    els.usableAreaGuide.style.left = `${bounds.x * state.zoomScale}px`;
    els.usableAreaGuide.style.top = `${bounds.y * state.zoomScale}px`;
    els.usableAreaGuide.style.width = `${bounds.width * state.zoomScale}px`;
    els.usableAreaGuide.style.height = `${bounds.height * state.zoomScale}px`;

    // Posiciona a dropzone vazia dentro da área útil
    els.emptyDropzone.style.left = `${(bounds.x + 12) * state.zoomScale}px`;
    els.emptyDropzone.style.top = `${(bounds.y + 12) * state.zoomScale}px`;
    els.emptyDropzone.style.width = `${Math.max(100, (bounds.width - 24) * state.zoomScale)}px`;
    els.emptyDropzone.style.height = `${Math.max(100, (bounds.height - 24) * state.zoomScale)}px`;

    // Posiciona a caixa azul interativa da imagem
    if (state.image && loadedImages.activityImg) {
      els.imageTransformBox.style.display = 'block';
      els.imageTransformBox.style.left = `${state.image.x * state.zoomScale}px`;
      els.imageTransformBox.style.top = `${state.image.y * state.zoomScale}px`;
      els.imageTransformBox.style.width = `${state.image.width * state.zoomScale}px`;
      els.imageTransformBox.style.height = `${state.image.height * state.zoomScale}px`;
    } else {
      els.imageTransformBox.style.display = 'none';
    }
  }

  // Ajusta o zoom automaticamente para caber na altura da tela do computador
  function fitZoomToWorkspace() {
    const wrapRect = els.canvasScrollWrap.getBoundingClientRect();
    if (!wrapRect.height || !wrapRect.width) return;
    const availH = wrapRect.height - 48;
    const availW = wrapRect.width - 48;
    const scaleH = availH / G.ptHeight;
    const scaleW = availW / G.ptWidth;
    state.zoomScale = Math.max(0.45, Math.min(1.5, Math.min(scaleH, scaleW)));
    renderPreview();
  }

  // Lê um File/Blob de imagem e carrega na folha
  function loadFileBlob(blob, sourceLabel = 'Imagem carregada!') {
    if (!blob || !blob.type.startsWith('image/')) {
      showToast('⚠️ Escolha um arquivo de imagem válido (PNG, JPG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setActivityImageDataUrl(ev.target.result, {
        toastMsg: `✅ ${sourceLabel}`,
      });
    };
    reader.readAsDataURL(blob);
  }

  // ============================================================================
  // Eventos de Movimentação e Redimensionamento da Imagem na Folha A4
  // ============================================================================
  function setupTransformBoxInteractions() {
    let mode = null; // 'move' ou 'resize'
    let activeHandle = null;
    let startMouseX = 0;
    let startMouseY = 0;
    let startImg = null;

    els.imageTransformBox.addEventListener('pointerdown', (e) => {
      if (!state.image) return;
      e.preventDefault();
      e.stopPropagation();

      const handleEl = e.target.closest('.resize-handle');
      if (handleEl) {
        mode = 'resize';
        activeHandle = handleEl.getAttribute('data-handle');
      } else {
        mode = 'move';
        activeHandle = null;
      }

      startMouseX = e.clientX;
      startMouseY = e.clientY;
      startImg = { ...state.image };
      els.imageTransformBox.classList.add('dragging');
      els.usableAreaGuide.classList.add('active');
      els.imageTransformBox.setPointerCapture(e.pointerId);
    });

    els.imageTransformBox.addEventListener('pointermove', (e) => {
      if (!mode || !state.image || !startImg) return;
      e.preventDefault();

      const dxPt = (e.clientX - startMouseX) / state.zoomScale;
      const dyPt = (e.clientY - startMouseY) / state.zoomScale;
      const bounds = window.getUsableAreaBoundsPt(state);

      if (mode === 'move') {
        let newX = startImg.x + dxPt;
        let newY = startImg.y + dyPt;

        // Atração magnética (Snap) ao centro horizontal e vertical da área útil
        const targetCenterX = bounds.x + bounds.width / 2;
        const targetCenterY = bounds.y + bounds.height / 2;
        const imgCenterX = newX + startImg.width / 2;
        const imgCenterY = newY + startImg.height / 2;
        const snapThreshold = 5;

        if (Math.abs(imgCenterX - targetCenterX) < snapThreshold) {
          newX = targetCenterX - startImg.width / 2;
          els.snapLineV.style.display = 'block';
          els.snapLineV.style.left = `${targetCenterX * state.zoomScale}px`;
        } else {
          els.snapLineV.style.display = 'none';
        }

        if (Math.abs(imgCenterY - targetCenterY) < snapThreshold) {
          newY = targetCenterY - startImg.height / 2;
          els.snapLineH.style.display = 'block';
          els.snapLineH.style.top = `${targetCenterY * state.zoomScale}px`;
        } else {
          els.snapLineH.style.display = 'none';
        }

        state.image.x = newX;
        state.image.y = newY;
      } else if (mode === 'resize') {
        let { x, y, width: w, height: h } = startImg;
        const aspect = w / Math.max(1, h);
        const minSize = 36;

        if (activeHandle.includes('e')) w = Math.max(minSize, startImg.width + dxPt);
        if (activeHandle.includes('s')) h = Math.max(minSize, startImg.height + dyPt);
        if (activeHandle.includes('w')) {
          const possibleW = startImg.width - dxPt;
          if (possibleW >= minSize) {
            w = possibleW;
            x = startImg.x + dxPt;
          }
        }
        if (activeHandle.includes('n')) {
          const possibleH = startImg.height - dyPt;
          if (possibleH >= minSize) {
            h = possibleH;
            y = startImg.y + dyPt;
          }
        }

        // Mantém proporção nos cantos se "Manter proporção" estiver marcado
        const isCorner = activeHandle.length === 2;
        if (state.lockAspect && isCorner) {
          if (Math.abs(dxPt) > Math.abs(dyPt)) {
            const newH = w / aspect;
            if (activeHandle.includes('n')) {
              y = startImg.y + (startImg.height - newH);
            }
            h = newH;
          } else {
            const newW = h * aspect;
            if (activeHandle.includes('w')) {
              x = startImg.x + (startImg.width - newW);
            }
            w = newW;
          }
        }

        state.image.x = x;
        state.image.y = y;
        state.image.width = w;
        state.image.height = h;
      }

      renderPreview();
    });

    const endDrag = () => {
      if (!mode) return;
      mode = null;
      activeHandle = null;
      els.imageTransformBox.classList.remove('dragging');
      els.usableAreaGuide.classList.remove('active');
      els.snapLineV.style.display = 'none';
      els.snapLineH.style.display = 'none';
    };

    els.imageTransformBox.addEventListener('pointerup', endDrag);
    els.imageTransformBox.addEventListener('pointercancel', endDrag);
  }

  // ============================================================================
  // Modal Visual de Recorte de Bordas (Cortar Topo / Base / Esquerda / Direita)
  // ============================================================================
  function openCropModal() {
    if (!state.image || !loadedImages.activityImg) return;
    els.cropModalImg.src = state.image.src;
    els.cropModalBackdrop.classList.add('open');
    requestAnimationFrame(() => {
      updateCropModalOverlay();
    });
  }

  function closeCropModal() {
    els.cropModalBackdrop.classList.remove('open');
  }

  function updateCropModalOverlay() {
    if (!state.image) return;
    const cTop = state.image.cropTop || 0;
    const cBottom = state.image.cropBottom || 0;
    const cLeft = state.image.cropLeft || 0;
    const cRight = state.image.cropRight || 0;

    // Atualiza sombras vermelhas nas 4 bordas cortadas
    els.cropShadeTop.style.top = '0%';
    els.cropShadeTop.style.left = '0%';
    els.cropShadeTop.style.right = '0%';
    els.cropShadeTop.style.height = `${cTop}%`;

    els.cropShadeBottom.style.bottom = '0%';
    els.cropShadeBottom.style.left = '0%';
    els.cropShadeBottom.style.right = '0%';
    els.cropShadeBottom.style.height = `${cBottom}%`;

    els.cropShadeLeft.style.top = `${cTop}%`;
    els.cropShadeLeft.style.bottom = `${cBottom}%`;
    els.cropShadeLeft.style.left = '0%';
    els.cropShadeLeft.style.width = `${cLeft}%`;

    els.cropShadeRight.style.top = `${cTop}%`;
    els.cropShadeRight.style.bottom = `${cBottom}%`;
    els.cropShadeRight.style.right = '0%';
    els.cropShadeRight.style.width = `${cRight}%`;

    // Retângulo central mantido
    els.cropSelectionRect.style.top = `${cTop}%`;
    els.cropSelectionRect.style.bottom = `${cBottom}%`;
    els.cropSelectionRect.style.left = `${cLeft}%`;
    els.cropSelectionRect.style.right = `${cRight}%`;

    // Posição das 4 barras arrastáveis
    els.cropBarTop.style.top = `calc(${cTop}% - 10px)`;
    els.cropBarBottom.style.bottom = `calc(${cBottom}% - 10px)`;
    els.cropBarLeft.style.left = `calc(${cLeft}% - 10px)`;
    els.cropBarRight.style.right = `calc(${cRight}% - 10px)`;
  }

  function setupCropModalInteractions() {
    let activeEdge = null;

    const bars = [
      els.cropBarTop,
      els.cropBarBottom,
      els.cropBarLeft,
      els.cropBarRight,
    ];

    bars.forEach((bar) => {
      bar.addEventListener('pointerdown', (e) => {
        if (!state.image) return;
        e.preventDefault();
        activeEdge = bar.getAttribute('data-crop-edge');
        bar.setPointerCapture(e.pointerId);
      });

      bar.addEventListener('pointermove', (e) => {
        if (!activeEdge || !state.image) return;
        e.preventDefault();
        const rect = els.cropStageContainer.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        const relX = ((e.clientX - rect.left) / rect.width) * 100;
        const relY = ((e.clientY - rect.top) / rect.height) * 100;

        if (activeEdge === 'top') {
          state.image.cropTop = Math.max(
            0,
            Math.min(75 - state.image.cropBottom, Number(relY.toFixed(1)))
          );
        } else if (activeEdge === 'bottom') {
          const fromBottom = 100 - relY;
          state.image.cropBottom = Math.max(
            0,
            Math.min(75 - state.image.cropTop, Number(fromBottom.toFixed(1)))
          );
        } else if (activeEdge === 'left') {
          state.image.cropLeft = Math.max(
            0,
            Math.min(75 - state.image.cropRight, Number(relX.toFixed(1)))
          );
        } else if (activeEdge === 'right') {
          const fromRight = 100 - relX;
          state.image.cropRight = Math.max(
            0,
            Math.min(75 - state.image.cropLeft, Number(fromRight.toFixed(1)))
          );
        }

        syncImageControlsFromState();
        updateCropModalOverlay();
        renderPreview();
      });

      const stopEdge = () => {
        activeEdge = null;
      };
      bar.addEventListener('pointerup', stopEdge);
      bar.addEventListener('pointercancel', stopEdge);
    });

    els.btnOpenCropModal.addEventListener('click', openCropModal);
    els.btnCloseCropModal.addEventListener('click', closeCropModal);
    els.btnApplyCropAndFit.addEventListener('click', () => {
      closeCropModal();
      fitImageContain();
      showToast('✂️ Corte aplicado e imagem ajustada na folha!');
    });

    els.btnModalResetCrop.addEventListener('click', () => {
      if (!state.image) return;
      state.image.cropTop = 0;
      state.image.cropBottom = 0;
      state.image.cropLeft = 0;
      state.image.cropRight = 0;
      syncImageControlsFromState();
      updateCropModalOverlay();
      fitImageContain();
    });

    els.btnModalAutoTrim.addEventListener('click', () => {
      if (!state.image || !loadedImages.activityImg) return;
      const detected = window.autoDetectWhiteMargins(loadedImages.activityImg);
      if (detected) {
        Object.assign(state.image, detected);
        syncImageControlsFromState();
        updateCropModalOverlay();
        fitImageContain();
        showToast('✨ Sobras brancas removidas automaticamente!');
      }
    });
  }

  // ============================================================================
  // Eventos dos Controles da Barra Lateral e Atalhos Globais
  // ============================================================================
  function bindEvents() {
    // Passo 1: Cabeçalho
    const onHeaderChange = () => {
      state.header.teacherRole = els.teacherRole.value;
      state.header.teacherName = els.teacherNameInput.value;
      state.header.turma = els.turmaInput.value;
      state.header.dateDay = els.dateDayInput.value;
      state.header.dateMonth = els.dateMonthInput.value;
      state.header.dateYear = els.dateYearInput.value || '2026';
      state.header.showBottomLine = els.showBottomLineCheck.checked;
      savePrefs();
      renderPreview();
    };

    [
      els.teacherRole,
      els.teacherNameInput,
      els.turmaInput,
      els.dateDayInput,
      els.dateMonthInput,
      els.dateYearInput,
      els.showBottomLineCheck,
    ].forEach((el) => {
      el.addEventListener('input', onHeaderChange);
      el.addEventListener('change', onHeaderChange);
    });

    els.btnFillToday.addEventListener('click', () => {
      const now = new Date();
      els.dateDayInput.value = String(now.getDate()).padStart(2, '0');
      els.dateMonthInput.value = String(now.getMonth() + 1).padStart(2, '0');
      els.dateYearInput.value = String(now.getFullYear());
      onHeaderChange();
      showToast('📅 Data de hoje preenchida!');
    });

    // Passo 2: Inserir Imagem
    els.btnChooseFile.addEventListener('click', () => els.fileInput.click());
    els.emptyDropzone.addEventListener('click', () => els.fileInput.click());

    els.fileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '');
        els.fileNameInput.value = `Atividade - ${cleanName}`;
        loadFileBlob(file, 'Imagem carregada do computador!');
      }
      els.fileInput.value = '';
    });

    // Botão de Colar Imagem da Área de Transferência
    els.btnPasteImage.addEventListener('click', async () => {
      try {
        if (!navigator.clipboard || !navigator.clipboard.read) {
          showToast('💡 Aperte as teclas Ctrl + V no teclado para colar a imagem!');
          return;
        }
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imgType = item.types.find((t) => t.startsWith('image/'));
          if (imgType) {
            const blob = await item.getType(imgType);
            loadFileBlob(blob, 'Imagem colada da área de transferência!');
            return;
          }
        }
        showToast('⚠️ Nenhuma imagem encontrada ao colar. Copie uma imagem na internet primeiro!');
      } catch (err) {
        showToast('💡 Aperte Ctrl + V no seu teclado para colar a imagem copiada!');
      }
    });

    // Atalho global Ctrl + V
    window.addEventListener('paste', (e) => {
      const items = e.clipboardData && e.clipboardData.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          e.preventDefault();
          const blob = items[i].getAsFile();
          loadFileBlob(blob, 'Imagem colada com Ctrl + V!');
          return;
        }
      }
    });

    // Arrastar e soltar (Drag & Drop) na janela inteira
    window.addEventListener('dragover', (e) => {
      e.preventDefault();
      els.emptyDropzone.classList.add('dragover');
    });
    window.addEventListener('dragleave', () => {
      els.emptyDropzone.classList.remove('dragover');
    });
    window.addEventListener('drop', (e) => {
      e.preventDefault();
      els.emptyDropzone.classList.remove('dragover');
      const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        loadFileBlob(file, 'Imagem solta na folha!');
      }
    });

    // Carregar imagem de exemplo (Dia do Estudante extraída do PDF original)
    els.btnLoadSample.addEventListener('click', () => {
      const sampleSrc =
        (window.EMBEDDED_ASSETS && window.EMBEDDED_ASSETS.sampleActivity) ||
        './assets/exemplo-atividade.jpg';
      els.fileNameInput.value = 'Atividade - Dia do Estudante';
      setActivityImageDataUrl(sampleSrc, {
        toastMsg: '🎨 Atividade de exemplo carregada! Experimente cortar a linha "NOME:" embaixo.',
      });
    });

    els.btnRemoveImage.addEventListener('click', () => {
      state.image = null;
      loadedImages.activityImg = null;
      syncImageControlsFromState();
      renderPreview();
      showToast('🗑️ Imagem removida da folha.');
    });

    // Passo 3: Sliders rápidos de corte
    const onCropSliderInput = () => {
      if (!state.image) return;
      state.image.cropTop = Number(els.sliderCropTop.value);
      state.image.cropBottom = Number(els.sliderCropBottom.value);
      state.image.cropLeft = Number(els.sliderCropLeft.value);
      state.image.cropRight = Number(els.sliderCropRight.value);

      els.valCropTop.textContent = `${Math.round(state.image.cropTop)}%`;
      els.valCropBottom.textContent = `${Math.round(state.image.cropBottom)}%`;
      els.valCropLeft.textContent = `${Math.round(state.image.cropLeft)}%`;
      els.valCropRight.textContent = `${Math.round(state.image.cropRight)}%`;

      fitImageContain();
    };

    [
      els.sliderCropTop,
      els.sliderCropBottom,
      els.sliderCropLeft,
      els.sliderCropRight,
    ].forEach((slider) => {
      slider.addEventListener('input', onCropSliderInput);
    });

    els.btnAutoTrimWhite.addEventListener('click', () => {
      if (!state.image || !loadedImages.activityImg) return;
      const detected = window.autoDetectWhiteMargins(loadedImages.activityImg);
      if (detected) {
        Object.assign(state.image, detected);
        syncImageControlsFromState();
        fitImageContain();
        showToast('✨ Sobras brancas removidas e imagem reajustada!');
      }
    });

    els.btnResetCrop.addEventListener('click', () => {
      if (!state.image) return;
      state.image.cropTop = 0;
      state.image.cropBottom = 0;
      state.image.cropLeft = 0;
      state.image.cropRight = 0;
      syncImageControlsFromState();
      fitImageContain();
      showToast('↺ Cortes desfeitos.');
    });

    // Margem Interna (mm)
    els.sliderMarginMm.addEventListener('input', () => {
      state.marginMm = Number(els.sliderMarginMm.value);
      els.valMarginMm.textContent = `${state.marginMm} mm`;
      els.usableAreaGuide.classList.add('active');
      savePrefs();
      if (state.image) {
        fitImageContain();
      } else {
        renderPreview();
      }
    });
    els.sliderMarginMm.addEventListener('change', () => {
      setTimeout(() => els.usableAreaGuide.classList.remove('active'), 600);
    });

    document.querySelectorAll('[data-margin-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mm = Number(btn.getAttribute('data-margin-preset'));
        state.marginMm = mm;
        els.sliderMarginMm.value = String(mm);
        els.valMarginMm.textContent = `${mm} mm`;
        savePrefs();
        if (state.image) {
          fitImageContain();
        } else {
          renderPreview();
        }
      });
    });

    // Botões de Posicionamento e Encaixe
    els.btnFitContain.addEventListener('click', () => {
      fitImageContain();
      showToast('📏 Imagem encaixada mantendo a proporção!');
    });
    els.btnFitFill.addEventListener('click', () => {
      fitImageFill();
      showToast('↔️ Imagem esticada para preencher a área útil!');
    });
    els.btnCenterImg.addEventListener('click', () => {
      centerImageInArea();
      showToast('🎯 Imagem centralizada na folha!');
    });
    els.btnRotateImg.addEventListener('click', () => {
      if (!state.image) return;
      state.image.rotation = ((state.image.rotation || 0) + 90) % 360;
      fitImageContain();
    });

    els.lockAspectCheck.addEventListener('change', () => {
      state.lockAspect = els.lockAspectCheck.checked;
    });

    // Brilho / Contraste / Nitidez
    const onFilterChange = () => {
      if (!state.image) return;
      state.image.brightness = Number(els.sliderBrightness.value);
      state.image.contrast = Number(els.sliderContrast.value);
      els.valBrightness.textContent = `${state.image.brightness}%`;
      els.valContrast.textContent = `${state.image.contrast}%`;
      renderPreview();
    };
    els.sliderBrightness.addEventListener('input', onFilterChange);
    els.sliderContrast.addEventListener('input', onFilterChange);

    els.btnEnhanceLineArt.addEventListener('click', () => {
      if (!state.image) return;
      if (state.image.brightness === 112 && state.image.contrast === 135) {
        state.image.brightness = 100;
        state.image.contrast = 100;
        showToast('↺ Brilho e contraste originais restaurados.');
      } else {
        state.image.brightness = 112;
        state.image.contrast = 135;
        showToast('☀️ Fundo clareado e traços reforçados para impressão!');
      }
      syncImageControlsFromState();
      renderPreview();
    });

    // Controles de Zoom da Folha
    els.btnZoomIn.addEventListener('click', () => {
      state.zoomScale = Math.min(1.8, Number((state.zoomScale + 0.1).toFixed(2)));
      renderPreview();
    });
    els.btnZoomOut.addEventListener('click', () => {
      state.zoomScale = Math.max(0.4, Number((state.zoomScale - 0.1).toFixed(2)));
      renderPreview();
    });
    els.btnZoomFit.addEventListener('click', fitZoomToWorkspace);
    window.addEventListener('resize', fitZoomToWorkspace);

    // Passo 4: Exportar PDF, Word (.docx) e Imprimir
    const getSafeBaseFilename = () => {
      const raw = (els.fileNameInput.value || 'Atividade').trim();
      return raw.replace(/[\\/:*?"<>|]+/g, '-');
    };

    els.btnExportPdf.addEventListener('click', async () => {
      try {
        els.btnExportPdf.disabled = true;
        els.btnExportPdf.textContent = '⏳ Gerando PDF...';
        const blob = await window.generatePdfBlob(state, loadedImages);
        const filename = `${getSafeBaseFilename()}.pdf`;
        window.triggerBlobDownload(blob, filename);
        showToast(`✅ Arquivo "${filename}" salvo na pasta Downloads!`);
      } catch (err) {
        console.error(err);
        showToast('❌ Erro ao gerar o PDF.');
      } finally {
        els.btnExportPdf.disabled = false;
        els.btnExportPdf.textContent = '📄 Baixar PDF';
      }
    });

    els.btnExportDocx.addEventListener('click', async () => {
      try {
        els.btnExportDocx.disabled = true;
        els.btnExportDocx.textContent = '⏳ Gerando Word...';
        const blob = await window.generateDocxBlob(state, loadedImages);
        const filename = `${getSafeBaseFilename()}.docx`;
        window.triggerBlobDownload(blob, filename);
        showToast(`✅ Arquivo Word "${filename}" salvo na pasta Downloads!`);
      } catch (err) {
        console.error(err);
        showToast('❌ Erro ao gerar o arquivo Word (.docx).');
      } finally {
        els.btnExportDocx.disabled = false;
        els.btnExportDocx.textContent = '📘 Baixar Word (.docx)';
      }
    });

    els.btnPrintSheet.addEventListener('click', () => {
      const offCanvas = document.createElement('canvas');
      window.renderA4SheetToCanvas(offCanvas, state, loadedImages, {
        scaleFactor: 4.1666667,
      });
      els.printOnlyImg.onload = () => {
        window.print();
      };
      els.printOnlyImg.src = offCanvas.toDataURL('image/jpeg', 0.95);
    });

    // Modal de Ajuda
    els.btnHowToUse.addEventListener('click', () => {
      els.helpModalBackdrop.classList.add('open');
    });
    const closeHelp = () => els.helpModalBackdrop.classList.remove('open');
    els.btnCloseHelpModal.addEventListener('click', closeHelp);
    els.btnOkHelpModal.addEventListener('click', closeHelp);

    // Status Online / Offline
    const updateNetworkBadge = () => {
      if (!els.offlineBadge) return;
      if (navigator.onLine) {
        els.offlineBadge.textContent = '🟢 Pronto (Funciona Offline)';
      } else {
        els.offlineBadge.textContent = '⚡ Modo Offline Ativo';
      }
    };
    window.addEventListener('online', updateNetworkBadge);
    window.addEventListener('offline', updateNetworkBadge);
    updateNetworkBadge();
  }

  // ============================================================================
  // Instalação PWA (Criar Atalho na Área de Trabalho) e Service Worker
  // ============================================================================
  function setupPwa() {
    let deferredPrompt = null;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      if (els.btnInstallPwa) {
        els.btnInstallPwa.style.display = 'inline-flex';
      }
    });

    if (els.btnInstallPwa) {
      els.btnInstallPwa.addEventListener('click', async () => {
        if (!deferredPrompt) {
          els.helpModalBackdrop.classList.add('open');
          return;
        }
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          els.btnInstallPwa.style.display = 'none';
          showToast('📌 Atalho instalado com sucesso no seu computador!');
        }
        deferredPrompt = null;
      });
    }

    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('./sw.js').catch((err) => {
        console.warn('Service Worker não registrado neste protocolo:', err);
      });
    }
  }

  // Inicialização
  function init() {
    loadSavedPrefs();
    syncImageControlsFromState();
    setupTransformBoxInteractions();
    setupCropModalInteractions();
    bindEvents();
    setupPwa();
    initLogos().then(() => {
      fitZoomToWorkspace();
      // Carrega automaticamente a atividade de exemplo na primeira abertura para demonstrar o funcionamento
      const sampleSrc =
        (window.EMBEDDED_ASSETS && window.EMBEDDED_ASSETS.sampleActivity) ||
        null;
      if (sampleSrc) {
        setActivityImageDataUrl(sampleSrc, {
          cropBottom: 14.5, // Já demonstra o corte da linha duplicada "NOME: ___" do rodapé da figura!
        });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
