/**
 * Módulo de Renderização A4 em Alta Definição (300 DPI)
 * e Exportação 100% Offline para PDF (.pdf) e Microsoft Word (.docx)
 *
 * Medidas originais extraídas do documento oficial do Colégio Franciscano Santa Isabel:
 * - Folha A4 em pontos (72 DPI): 595.32 pt x 841.92 pt (210 mm x 297 mm)
 */

const A4_PT_W = 595.32;
const A4_PT_H = 841.92;

// Coordenadas da área útil onde a atividade fica (em pontos A4)
// Cabeçalho + Aluno/Professora terminam em y_top = 158 pt
// Linha inferior fica em y_top = 781.8 pt (ou até a borda interna em 810 pt se sem linha inferior)
window.A4_GEOMETRY = {
  ptWidth: A4_PT_W,
  ptHeight: A4_PT_H,
  mmToPt: A4_PT_W / 210, // ~2.834857 pt por mm
  ptToMm: 210 / A4_PT_W,
  borderInnerLeft: 28.44,
  borderInnerRight: 567.0,
  borderInnerTop: 28.44,
  borderInnerBottom: 813.48,
  headerEndTop: 158.0, // Logo abaixo da linha da Professora/Data
  footerLineTop: 781.8, // Posição da linha preta inferior original
};

/**
 * Carrega uma imagem a partir de uma URL / DataURL
 */
function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Desenha a folha A4 completa (Cabeçalho fixo, borda dupla bordô, dados da professora e imagem recortada/posicionada)
 * em um elemento <canvas> na resolução solicitada.
 *
 * @param {HTMLCanvasElement} canvas Canvas de destino
 * @param {Object} state Estado atual da aplicação
 * @param {Object} loadedImages Imagens já carregadas ({ logoAfasjo, logoCfsi, activityImg })
 * @param {Object} options { scaleFactor, showGuides, isInteractivePreview }
 */
window.renderA4SheetToCanvas = function renderA4SheetToCanvas(
  canvas,
  state,
  loadedImages,
  options = {}
) {
  // scaleFactor = 4.166 equivale a ~300 DPI (2480 x 3508 px)
  const scale = options.scaleFactor || 2;
  const w = Math.round(A4_PT_W * scale);
  const h = Math.round(A4_PT_H * scale);

  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }

  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.scale(scale, scale);

  // 1. Fundo branco da folha A4
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, A4_PT_W, A4_PT_H);

  // 2. Área útil para a imagem da atividade (desenhada ANTES do cabeçalho/bordas para nunca cobrir o cabeçalho!)
  const areaBounds = window.getUsableAreaBoundsPt(state);

  if (loadedImages && loadedImages.activityImg && state.image) {
    const actImg = loadedImages.activityImg;
    const imgState = state.image;

    // Clipa na área útil (respeitando as margens configuradas) para garantir que a imagem nunca invada o cabeçalho ou a borda
    ctx.save();
    ctx.beginPath();
    ctx.rect(
      areaBounds.x,
      areaBounds.y,
      areaBounds.width,
      areaBounds.height
    );
    ctx.clip();

    // Calcula retângulo de origem (recorte / crop em porcentagem 0..100)
    const cropL = Math.max(0, Math.min(95, imgState.cropLeft || 0)) / 100;
    const cropR = Math.max(0, Math.min(95, imgState.cropRight || 0)) / 100;
    const cropT = Math.max(0, Math.min(95, imgState.cropTop || 0)) / 100;
    const cropB = Math.max(0, Math.min(95, imgState.cropBottom || 0)) / 100;

    const sx = actImg.naturalWidth * cropL;
    const sy = actImg.naturalHeight * cropT;
    const sw = Math.max(1, actImg.naturalWidth * (1 - cropL - cropR));
    const sh = Math.max(1, actImg.naturalHeight * (1 - cropT - cropB));

    // Destino em pontos A4
    const dx = imgState.x;
    const dy = imgState.y;
    const dw = imgState.width;
    const dh = imgState.height;

    // Aplica filtros de clareamento/contraste se configurados (ótimo para limpar fundo cinza de atividades da internet)
    const brightness = imgState.brightness ?? 100;
    const contrast = imgState.contrast ?? 100;
    const grayscale = imgState.grayscale ? 100 : 0;
    if (brightness !== 100 || contrast !== 100 || grayscale > 0) {
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) grayscale(${grayscale}%)`;
    }

    // Rotação opcional em torno do centro da imagem posicionada
    const rotation = imgState.rotation || 0;
    const cx = dx + dw / 2;
    const cy = dy + dh / 2;
    ctx.translate(cx, cy);
    if (rotation !== 0) {
      ctx.rotate((rotation * Math.PI) / 180);
    }

    ctx.drawImage(actImg, sx, sy, sw, sh, -dw / 2, -dh / 2, dw, dh);
    ctx.filter = 'none';
    ctx.restore();
  }

  // 3. Borda Dupla Bordô Oficial (#800000) ao redor da folha A4
  // Coordenadas exatas extraídas do PDF original:
  // Retângulo externo: x=24, y=24, w=547.44, h=794.04, espessura=3pt
  // Espaço branco: 0.72pt
  // Retângulo interno: x=27.72, y=27.72, w=540.0, h=786.6, espessura=0.72pt
  ctx.strokeStyle = '#800000';
  ctx.lineWidth = 3.0;
  ctx.strokeRect(25.5, 25.5, 544.44, 791.04);

  ctx.strokeStyle = '#800000';
  ctx.lineWidth = 0.85;
  ctx.strokeRect(28.08, 28.08, 539.28, 785.88);

  // 4. Logos do Cabeçalho
  // Logo esquerda (AFASJO): x=35.85, y_top=35.45, w=62.25, h=61.5
  if (loadedImages && loadedImages.logoAfasjo) {
    ctx.drawImage(loadedImages.logoAfasjo, 35.85, 35.45, 62.25, 61.5);
  }
  // Logo direita (CFSI): x=489.4, y_top=41.6, w=58.45, h=57.8
  if (loadedImages && loadedImages.logoCfsi) {
    ctx.drawImage(loadedImages.logoCfsi, 489.4, 41.6, 58.45, 57.8);
  }

  // 5. Textos Institucionais do Cabeçalho (Centralizados entre as logos, centro X = 297.66 pt)
  const centerX = A4_PT_W / 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // Linha 1: ASSOCIAÇÃO FRANCISCANA DE ASSISTÊNCIA SOCIAL SÃO JOSÉ
  ctx.font = 'bold 11.04px Calibri, "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#00000A';
  ctx.fillText(
    'ASSOCIAÇÃO FRANCISCANA DE ASSISTÊNCIA SOCIAL SÃO JOSÉ',
    centerX,
    45.84
  );

  // Linha 2: COLÉGIO FRANCISCANO SANTA ISABEL
  ctx.font = 'bold 11.04px Calibri, "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#8C3449';
  ctx.fillText('COLÉGIO FRANCISCANO SANTA ISABEL', centerX, 61.44);

  // Linha 3: CNPJ nº 72.303.589/0015-03
  ctx.font = '9.96px Calibri, "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#000000';
  ctx.fillText('CNPJ nº 72.303.589/0015-03', centerX, 75.36);

  // Linha 4: Rua Dino Veiga, nº 238 – Centro – CEP 86360-007 – Bandeirantes – PR
  ctx.fillText(
    'Rua Dino Veiga, nº 238 – Centro – CEP 86360-007 – Bandeirantes – PR',
    centerX,
    89.42
  );

  // Linha 5: Fone/Fax: 43 3542-4467  e-mail: secretaria.cfsi@afasjo.org.br
  const phonePart = 'Fone/Fax: 43 3542-4467   e-mail: ';
  const emailPart = 'secretaria.cfsi@afasjo.org.br';
  const phoneW = ctx.measureText(phonePart).width;
  const emailW = ctx.measureText(emailPart).width;
  const totalLine5W = phoneW + emailW;
  const startLine5X = centerX - totalLine5W / 2;

  ctx.textAlign = 'left';
  ctx.fillStyle = '#000000';
  ctx.fillText(phonePart, startLine5X, 103.34);

  const emailX = startLine5X + phoneW;
  ctx.fillStyle = '#0563C1';
  ctx.fillText(emailPart, emailX, 103.34);
  // Sublinhado do e-mail
  ctx.fillRect(emailX, 104.5, emailW, 0.65);

  // 6. Linha divisória preta abaixo do cabeçalho (x=33.96, y_top=107.78, w=527.52, h=1.44)
  ctx.fillStyle = '#00000A';
  ctx.fillRect(33.96, 107.78, 527.52, 1.44);

  // 7. Bloco ALUNO (A) / TURMA e PROFESSORA / DATA
  ctx.font = '11.04px Arial, Helvetica, sans-serif';
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'left';

  const studentY = 126.86;
  const teacherY = 145.82;
  const leftTextX = 63.5;
  const rightEdgeX = 502.0;

  // Linha ALUNO(A) + TURMA
  const turmaText = (state.header.turma || 'INFANTIL III').trim().toUpperCase();
  ctx.textAlign = 'right';
  ctx.fillText(turmaText, rightEdgeX, studentY);
  const turmaWidth = ctx.measureText(turmaText).width;

  ctx.textAlign = 'left';
  const alunoLabel = 'ALUNO (A): ';
  ctx.fillText(alunoLabel, leftTextX, studentY);
  const alunoLabelW = ctx.measureText(alunoLabel).width;

  // Desenha a linha contínua do nome do aluno até encostar na turma (igual aos underscores do Word)
  const lineStartX = leftTextX + alunoLabelW;
  const lineEndX = rightEdgeX - turmaWidth - 3;
  if (lineEndX > lineStartX + 20) {
    ctx.fillRect(lineStartX, studentY + 1.2, lineEndX - lineStartX, 0.75);
  }

  // Linha PROFESSORA + DATA
  const roleLabel = (state.header.teacherRole || 'PROFESSORA:').trim();
  const teacherName = (state.header.teacherName || '').trim().toUpperCase();
  ctx.textAlign = 'left';
  if (teacherName) {
    ctx.fillText(`${roleLabel} ${teacherName}`, leftTextX, teacherY);
  } else {
    ctx.fillText(`${roleLabel} `, leftTextX, teacherY);
    const labelW = ctx.measureText(`${roleLabel} `).width;
    const lineStartX = leftTextX + labelW;
    const lineEndX = rightEdgeX - 160;
    if (lineEndX > lineStartX) {
      ctx.fillRect(lineStartX, teacherY + 1.2, lineEndX - lineStartX, 0.75);
    }
  }

  // Formatação da Data (ex: _____/_____/2026 ou data preenchida)
  const dayStr = (state.header.dateDay || '').trim();
  const monthStr = (state.header.dateMonth || '').trim();
  const yearStr = (state.header.dateYear || '2026').trim();

  const dPart = dayStr ? `  ${dayStr.padStart(2, '0')}  ` : '_____';
  const mPart = monthStr ? `  ${monthStr.padStart(2, '0')}  ` : '_____';
  const datePrefix = `${dPart}/${mPart}/`;

  ctx.textAlign = 'right';
  ctx.fillText(yearStr, rightEdgeX, teacherY);
  const yearW = ctx.measureText(yearStr).width;
  // Sublinhado sob o ano (como no modelo original)
  ctx.fillRect(rightEdgeX - yearW, teacherY + 1.3, yearW, 0.8);

  // Sublinhado sob dia/mês caso preenchidos ou underscores
  ctx.fillText(datePrefix, rightEdgeX - yearW, teacherY);

  // 8. Linha horizontal inferior opcional (presente no modelo original em y_top = 781.8 pt)
  if (state.header.showBottomLine !== false) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(51.86, 780.45, 484.54, 1.34);
  }

  ctx.restore();
};

/**
 * Calcula a área útil (em pontos A4) onde a atividade pode ser posicionada,
 * já descontando o cabeçalho fixo, a borda dupla e a margem interna configurada.
 */
window.getUsableAreaBoundsPt = function getUsableAreaBoundsPt(state) {
  const G = window.A4_GEOMETRY;
  const marginMm = Number(state.marginMm ?? 6);
  const marginPt = marginMm * G.mmToPt;

  const minX = G.borderInnerLeft + marginPt;
  const maxX = G.borderInnerRight - marginPt;
  const minY = G.headerEndTop + Math.max(4, marginPt * 0.6);
  const bottomLimit =
    state.header && state.header.showBottomLine !== false
      ? G.footerLineTop - Math.max(4, marginPt * 0.5)
      : G.borderInnerBottom - marginPt;

  return {
    x: minX,
    y: minY,
    width: Math.max(50, maxX - minX),
    height: Math.max(50, bottomLimit - minY),
  };
};

/**
 * Converte DataURL base64 em Uint8Array
 */
function dataURLToUint8Array(dataURL) {
  const base64 = dataURL.split(',')[1];
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Renderiza a folha A4 em altíssima definição (300 DPI: 2480 x 3508 px)
 * e retorna os bytes JPEG + dimensões.
 */
async function renderHighResPageJpeg(state, loadedImages, quality = 0.95) {
  const offCanvas = document.createElement('canvas');
  // Escala 4.1666 -> 2480 x 3508 pixels (300 DPI real para impressão impecável)
  window.renderA4SheetToCanvas(offCanvas, state, loadedImages, {
    scaleFactor: 4.1666667,
  });
  const jpegDataUrl = offCanvas.toDataURL('image/jpeg', quality);
  return {
    bytes: dataURLToUint8Array(jpegDataUrl),
    widthPx: offCanvas.width,
    heightPx: offCanvas.height,
  };
}

/**
 * Gera um arquivo PDF 1.4 binário 100% válido e nativo em JavaScript puro (sem dependências externas)
 * contendo a página A4 em 300 DPI.
 */
window.generatePdfBlob = async function generatePdfBlob(state, loadedImages) {
  const { bytes: jpgBytes, widthPx, heightPx } = await renderHighResPageJpeg(
    state,
    loadedImages,
    0.95
  );

  const encoder = new TextEncoder();
  const chunks = [];
  const offsets = [];
  let currentOffset = 0;

  function pushStr(str) {
    const b = encoder.encode(str);
    chunks.push(b);
    currentOffset += b.length;
  }

  function pushBytes(b) {
    chunks.push(b);
    currentOffset += b.length;
  }

  function startObj(id) {
    offsets[id] = currentOffset;
    pushStr(`${id} 0 obj\n`);
  }

  const pageW = A4_PT_W.toFixed(2);
  const pageH = A4_PT_H.toFixed(2);

  // Cabeçalho PDF 1.4
  pushStr('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');

  // Objeto 1: Catalog
  startObj(1);
  pushStr('<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // Objeto 2: Pages
  startObj(2);
  pushStr('<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

  // Objeto 3: Page (A4: 595.32 x 841.92 pt)
  startObj(3);
  pushStr(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`
  );

  // Objeto 4: XObject Image (JPEG 300 DPI)
  startObj(4);
  pushStr(
    `<< /Type /XObject /Subtype /Image /Width ${widthPx} /Height ${heightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpgBytes.length} >>\nstream\n`
  );
  pushBytes(jpgBytes);
  pushStr('\nendstream\nendobj\n');

  // Objeto 5: Content Stream que desenha a imagem preenchendo a folha A4 exata
  const contentStream = `q\n${pageW} 0 0 ${pageH} 0 0 cm\n/Im0 Do\nQ\n`;
  startObj(5);
  pushStr(`<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream\nendobj\n`);

  // Tabela XREF
  const xrefOffset = currentOffset;
  pushStr('xref\n0 6\n');
  pushStr('0000000000 65535 f \n');
  for (let i = 1; i <= 5; i++) {
    const offStr = String(offsets[i]).padStart(10, '0');
    pushStr(`${offStr} 00000 n \n`);
  }

  // Trailer
  pushStr(
    `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`
  );

  return new Blob(chunks, { type: 'application/pdf' });
};

/**
 * Tabela CRC32 para criação de arquivo ZIP (.docx é um pacote ZIP OpenXML)
 */
const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Cria um arquivo ZIP válido em memória (método STORE = sem compressão adicional,
 * já que a imagem interna já está comprimida em JPEG e os XMLs têm poucos bytes).
 */
function createZipBlob(files, mimeType) {
  const encoder = new TextEncoder();
  const localFileParts = [];
  const centralDirParts = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const dataBytes =
      typeof file.data === 'string' ? encoder.encode(file.data) : file.data;
    const crc = crc32(dataBytes);
    const size = dataBytes.length;

    // Local File Header (30 bytes + name)
    const lfh = new Uint8Array(30 + nameBytes.length);
    const lfhView = new DataView(lfh.buffer);
    lfhView.setUint32(0, 0x04034b50, true); // Signature
    lfhView.setUint16(4, 20, true); // Version needed (2.0)
    lfhView.setUint16(6, 0x0800, true); // UTF-8 flag
    lfhView.setUint16(8, 0, true); // Compression method: 0 (STORE)
    lfhView.setUint16(10, 0, true); // Mod time
    lfhView.setUint16(12, 0x21, true); // Mod date
    lfhView.setUint32(14, crc, true); // CRC32
    lfhView.setUint32(18, size, true); // Compressed size
    lfhView.setUint32(22, size, true); // Uncompressed size
    lfhView.setUint16(26, nameBytes.length, true);
    lfhView.setUint16(28, 0, true);
    lfh.set(nameBytes, 30);

    localFileParts.push(lfh, dataBytes);

    // Central Directory File Header (46 bytes + name)
    const cdfh = new Uint8Array(46 + nameBytes.length);
    const cdfhView = new DataView(cdfh.buffer);
    cdfhView.setUint32(0, 0x02014b50, true); // Signature
    cdfhView.setUint16(4, 20, true); // Version made by
    cdfhView.setUint16(6, 20, true); // Version needed
    cdfhView.setUint16(8, 0x0800, true); // UTF-8 flag
    cdfhView.setUint16(10, 0, true); // Compression method: 0 (STORE)
    cdfhView.setUint16(12, 0, true);
    cdfhView.setUint16(14, 0x21, true);
    cdfhView.setUint32(16, crc, true);
    cdfhView.setUint32(20, size, true);
    cdfhView.setUint32(24, size, true);
    cdfhView.setUint16(28, nameBytes.length, true);
    cdfhView.setUint16(30, 0, true);
    cdfhView.setUint16(32, 0, true);
    cdfhView.setUint16(34, 0, true);
    cdfhView.setUint16(36, 0, true);
    cdfhView.setUint32(38, 0, true);
    cdfhView.setUint32(42, offset, true); // Relative offset of local header
    cdfh.set(nameBytes, 46);

    centralDirParts.push(cdfh);
    offset += lfh.length + size;
  }

  let centralDirSize = 0;
  for (const part of centralDirParts) {
    centralDirSize += part.length;
  }

  // End of Central Directory Record (22 bytes)
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true);
  eocdView.setUint16(4, 0, true);
  eocdView.setUint16(6, 0, true);
  eocdView.setUint16(8, files.length, true);
  eocdView.setUint16(10, files.length, true);
  eocdView.setUint32(12, centralDirSize, true);
  eocdView.setUint32(16, offset, true);
  eocdView.setUint16(20, 0, true);

  return new Blob([...localFileParts, ...centralDirParts, eocd], {
    type: mimeType,
  });
}

/**
 * Gera um arquivo Microsoft Word (.docx) nativo e 100% offline.
 * A folha A4 inteira (210mm x 297mm = 7560000 x 10692000 EMUs) é inserida na página A4
 * sem margens externas para que NADA desconfigure ao abrir em qualquer versão do Word!
 */
window.generateDocxBlob = async function generateDocxBlob(state, loadedImages) {
  const { bytes: jpgBytes } = await renderHighResPageJpeg(
    state,
    loadedImages,
    0.95
  );

  // Dimensões exatas da folha A4 em EMUs (1 mm = 36000 EMUs)
  // 210 mm = 7560000 EMUs | 297 mm = 10692000 EMUs
  // Em Twips (1/20 de ponto): Largura A4 = 11906 twips, Altura A4 = 16838 twips
  const cxEmu = 7560000;
  const cyEmu = 10692000;

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="jpeg" ContentType="image/jpeg"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const docRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdImg1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/atividade_a4.jpeg"/>
</Relationships>`;

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
            xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
            xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
            xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
  <w:body>
    <w:p>
      <w:pPr>
        <w:spacing w:before="0" w:after="0" w:line="20" w:lineRule="exact"/>
      </w:pPr>
      <w:r>
        <w:drawing>
          <wp:anchor distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="1" behindDoc="0" locked="0" layoutInCell="1" allowOverlap="1">
            <wp:simplePos x="0" y="0"/>
            <wp:positionH relativeFrom="page">
              <wp:posOffset>0</wp:posOffset>
            </wp:positionH>
            <wp:positionV relativeFrom="page">
              <wp:posOffset>0</wp:posOffset>
            </wp:positionV>
            <wp:extent cx="${cxEmu}" cy="${cyEmu}"/>
            <wp:effectExtent l="0" t="0" r="0" b="0"/>
            <wp:wrapNone/>
            <wp:docPr id="1" name="Folha Atividade A4"/>
            <wp:cNvGraphicFramePr>
              <a:graphicFrameLocks noChangeAspect="1"/>
            </wp:cNvGraphicFramePr>
            <a:graphic>
              <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                <pic:pic>
                  <pic:nvPicPr>
                    <pic:cNvPr id="1" name="atividade_a4.jpeg"/>
                    <pic:cNvPicPr/>
                  </pic:nvPicPr>
                  <pic:blipFill>
                    <a:blip r:embed="rIdImg1"/>
                    <a:stretch>
                      <a:fillRect/>
                    </a:stretch>
                  </pic:blipFill>
                  <pic:spPr>
                    <a:xfrm>
                      <a:off x="0" y="0"/>
                      <a:ext cx="${cxEmu}" cy="${cyEmu}"/>
                    </a:xfrm>
                    <a:prstGeom prst="rect">
                      <a:avLst/>
                    </a:prstGeom>
                  </pic:spPr>
                </pic:pic>
              </a:graphicData>
            </a:graphic>
          </wp:anchor>
        </w:drawing>
      </w:r>
    </w:p>
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="0" w:right="0" w:bottom="0" w:left="0" w:header="0" w:footer="0" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  return createZipBlob(
    [
      { name: '[Content_Types].xml', data: contentTypesXml },
      { name: '_rels/.rels', data: rootRelsXml },
      { name: 'word/_rels/document.xml.rels', data: docRelsXml },
      { name: 'word/document.xml', data: documentXml },
      { name: 'word/media/atividade_a4.jpeg', data: jpgBytes },
    ],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  );
};

/**
 * Detecta automaticamente bordas brancas/claras ao redor da imagem da atividade
 * e retorna { cropTop, cropBottom, cropLeft, cropRight } em porcentagem (0..45)
 */
window.autoDetectWhiteMargins = function autoDetectWhiteMargins(imgElement) {
  if (!imgElement) return null;
  const w = Math.min(400, imgElement.naturalWidth || 400);
  const h = Math.min(500, imgElement.naturalHeight || 500);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(imgElement, 0, 0, w, h);

  const data = ctx.getImageData(0, 0, w, h).data;
  const threshold = 242; // Pixels mais escuros que 242 são considerados conteúdo

  function isDarkPixel(x, y) {
    const idx = (y * w + x) * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    return r < threshold || g < threshold || b < threshold;
  }

  let top = 0;
  let bottom = h - 1;
  let left = 0;
  let right = w - 1;

  // Ignora os primeiros 2% das bordas caso haja um risco preto de moldura externa
  const padX = Math.floor(w * 0.015);
  const padY = Math.floor(h * 0.015);

  topLoop: for (let y = padY; y < h - padY; y++) {
    for (let x = padX; x < w - padX; x++) {
      if (isDarkPixel(x, y)) {
        top = Math.max(0, y - 4);
        break topLoop;
      }
    }
  }

  bottomLoop: for (let y = h - 1 - padY; y > top; y--) {
    for (let x = padX; x < w - padX; x++) {
      if (isDarkPixel(x, y)) {
        bottom = Math.min(h - 1, y + 4);
        break bottomLoop;
      }
    }
  }

  leftLoop: for (let x = padX; x < w - padX; x++) {
    for (let y = top; y <= bottom; y++) {
      if (isDarkPixel(x, y)) {
        left = Math.max(0, x - 4);
        break leftLoop;
      }
    }
  }

  rightLoop: for (let x = w - 1 - padX; x > left; x--) {
    for (let y = top; y <= bottom; y++) {
      if (isDarkPixel(x, y)) {
        right = Math.min(w - 1, x + 4);
        break rightLoop;
      }
    }
  }

  return {
    cropTop: Number(((top / h) * 100).toFixed(1)),
    cropBottom: Number((((h - 1 - bottom) / h) * 100).toFixed(1)),
    cropLeft: Number(((left / w) * 100).toFixed(1)),
    cropRight: Number((((w - 1 - right) / w) * 100).toFixed(1)),
  };
};

/**
 * Dispara o download de um Blob no navegador com o nome de arquivo informado
 */
window.triggerBlobDownload = function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1500);
};
