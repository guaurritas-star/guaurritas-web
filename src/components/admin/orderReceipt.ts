export type ReceiptOrderLine = {
  name: string;
  detail?: string;
  personalization?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type ReceiptOrder = {
  reference: string;
  wixOrderNumber?: string;
  customerName?: string;
  address?: string;
  deliveryPoint?: string;
  deliveryType?: string;
  deliveryTime?: string;
  scheduledAt?: string | null;
  deliveryDate?: string | null;
  total: number;
  paidAmount: number;
  pendingAmount: number;
  currency?: string;
  notes?: string;
  personalization?: string;
  operationalNote?: string;
  paymentStatus?: string;
  statusGroup?: string;
  lines: ReceiptOrderLine[];
};

const TZ = 'America/Mexico_City';
const ROWS_PER_PAGE = 5;
const PAGE_W = 1240;
const PAGE_H = 1754;
const PDF_W = 595.28;
const PDF_H = 841.89;

const LOGO_URL = 'https://static.wixstatic.com/media/24a095_03ad817b85c84e91989175cbcc3ba6b1~mv2.jpeg';
const FLOWER_RIGHT_URL = 'https://static.wixstatic.com/media/24a095_449ce81898d94269bb7353d07f712b4d~mv2.jpeg';
const FLOWER_LEFT_URL = 'https://static.wixstatic.com/media/24a095_1c918af1a87f4c08a6d258e416f4c533~mv2.jpeg';

type ReceiptAssets = {
  logo: HTMLImageElement;
  flowerLeft: HTMLImageElement;
  flowerRight: HTMLImageElement;
};

function money(value: number, currency = 'MXN') {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency || 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatReceiptDate(value?: string | null) {
  if (!value) return 'POR DEFINIR';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'POR DEFINIR';
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.day}/${map.month}/${map.year}`;
}

function notesFor(order: ReceiptOrder) {
  const values = [order.notes, order.personalization, order.operationalNote]
    .map((value) => String(value || '').trim())
    .filter(Boolean);
  return Array.from(new Set(values)).join(' · ');
}

function orderNumber(order: ReceiptOrder) {
  if (order.wixOrderNumber) return `#${order.wixOrderNumber}`;
  return String(order.reference || '—').trim();
}

function splitLines<T>(items: T[], size: number) {
  const groups: T[][] = [];
  for (let index = 0; index < items.length; index += size) groups.push(items.slice(index, index + size));
  return groups.length ? groups : [[]];
}

function fontFamilyFromVar(name: string, fallback: string) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

async function ensureFonts() {
  try {
    await Promise.all([
      document.fonts.ready,
      document.fonts.load('42px Mansalva'),
      document.fonts.load('42px Cinzel'),
    ]);
  } catch {
    // Next/font is already present in the page; canvas falls back safely if the browser
    // does not expose the family by its human-readable name.
  }
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('No pudimos cargar uno de los elementos visuales de la nota.'));
    image.src = url;
  });
}

async function loadAssets(): Promise<ReceiptAssets> {
  const [logo, flowerRight, flowerLeft] = await Promise.all([
    loadImage(LOGO_URL),
    loadImage(FLOWER_RIGHT_URL),
    loadImage(FLOWER_LEFT_URL),
  ]);
  return { logo, flowerLeft, flowerRight };
}

function fitFont(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, startSize: number, family: string, minSize = 18) {
  let size = startSize;
  while (size > minSize) {
    ctx.font = `${size}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 1;
  }
  return size;
}

function drawCentered(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, size: number, family: string, color = '#111', weight = '400') {
  ctx.save();
  const fitted = fitFont(ctx, text, width, size, family);
  ctx.font = `${weight} ${fitted}px ${family}`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + width / 2, y);
  ctx.restore();
}

function drawWrapped(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines: number, font: string, color = '#fff') {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  ctx.save();
  ctx.font = font;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length >= maxLines) break;
    } else {
      line = test;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (words.length && lines.length === maxLines) {
    const last = lines[maxLines - 1];
    if (!String(text).trim().endsWith(last)) lines[maxLines - 1] = `${last.replace(/\s+$/, '')}…`;
  }
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  lines.forEach((value, index) => ctx.fillText(value, x, y + index * lineHeight));
  ctx.restore();
}

function drawDashedLine(ctx: CanvasRenderingContext2D, x1: number, y: number, x2: number) {
  ctx.save();
  ctx.strokeStyle = '#575757';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([7, 5]);
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
  ctx.restore();
}

function drawReceiptPage(
  order: ReceiptOrder,
  lines: ReceiptOrderLine[],
  pageIndex: number,
  pageCount: number,
  assets: ReceiptAssets,
  mansalva: string,
  cinzel: string,
) {
  const canvas = document.createElement('canvas');
  canvas.width = PAGE_W;
  canvas.height = PAGE_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Tu navegador no pudo preparar el recibo.');

  const finalPage = pageIndex === pageCount - 1;
  const tan = '#d8aa88';
  const blue = '#596d9d';
  const ink = '#101010';
  const left = 75;
  const right = PAGE_W - 75;
  const tableTop = 555;
  const tableHeaderH = 92;
  const rowH = 112;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);

  // Logo original Guaurritas
  ctx.drawImage(assets.logo, 90, 90, 160, 126);

  // Encabezado
  ctx.fillStyle = ink;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.font = `400 76px ${mansalva}`;
  ctx.fillText('PEDIDO N°', 1035, 145);

  // Folio completo, sin recuadro: conserva el identificador único y evita recortar referencias largas.
  const receiptReference = orderNumber(order);
  const referenceSize = fitFont(ctx, receiptReference, 390, 30, cinzel, 18);
  ctx.fillStyle = '#555b6f';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${referenceSize}px ${cinzel}`;
  ctx.fillText(receiptReference, 1188, 194);

  // Datos del cliente
  const dataLabelX = 128;
  const dataValueX = 430;
  const dataRight = 1040;
  const firstY = 305;
  const gap = 68;

  ctx.fillStyle = ink;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `400 42px ${mansalva}`;
  ctx.fillText('Fecha de entrega:', dataLabelX, firstY);
  ctx.fillText('Cliente:', dataLabelX, firstY + gap);
  ctx.fillText('Dirección:', dataLabelX, firstY + gap * 2);

  const dateText = [
    formatReceiptDate(order.scheduledAt || order.deliveryDate),
    String(order.deliveryTime || '').trim(),
  ].filter(Boolean).join(' · ');

  const address = String(order.deliveryPoint || order.address || order.deliveryType || '—').trim() || '—';
  const values = [dateText, order.customerName || 'SIN NOMBRE', address];

  values.forEach((value, index) => {
    const y = firstY + index * gap - 6;
    const size = fitFont(ctx, String(value), dataRight - dataValueX, 36, cinzel, 22);
    ctx.font = `400 ${size}px ${cinzel}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = ink;
    ctx.fillText(String(value), (dataValueX + dataRight) / 2, y);
    drawDashedLine(ctx, dataValueX, firstY + index * gap + 13, dataRight);
  });

  if (pageCount > 1) {
    ctx.fillStyle = blue;
    ctx.textAlign = 'right';
    ctx.font = `400 22px ${mansalva}`;
    ctx.fillText(`PÁGINA ${pageIndex + 1} DE ${pageCount}`, right, 505);
  }

  // Tabla
  const columns = [left, 280, 770, 965, right];
  const tableBottom = tableTop + tableHeaderH + ROWS_PER_PAGE * rowH;

  ctx.fillStyle = tan;
  ctx.fillRect(left, tableTop, right - left, tableHeaderH);

  ctx.strokeStyle = '#202020';
  ctx.lineWidth = 1.8;
  for (const x of columns) {
    ctx.beginPath();
    ctx.moveTo(x, tableTop);
    ctx.lineTo(x, tableBottom);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(left, tableTop);
  ctx.lineTo(right, tableTop);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(left, tableTop + tableHeaderH);
  ctx.lineTo(right, tableTop + tableHeaderH);
  ctx.stroke();
  for (let row = 1; row <= ROWS_PER_PAGE; row += 1) {
    const y = tableTop + tableHeaderH + row * rowH;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
  }

  drawCentered(ctx, 'Cantidad', columns[0], tableTop + 46, columns[1] - columns[0], 31, mansalva, ink);
  drawCentered(ctx, 'Descripción del Producto', columns[1], tableTop + 46, columns[2] - columns[1], 31, mansalva, ink);
  drawCentered(ctx, 'Precio Unitario', columns[2], tableTop + 46, columns[3] - columns[2], 28, mansalva, ink);
  drawCentered(ctx, 'Total', columns[3], tableTop + 46, columns[4] - columns[3], 31, mansalva, ink);

  for (let row = 0; row < ROWS_PER_PAGE; row += 1) {
    const line = lines[row];
    if (!line) continue;
    const centerY = tableTop + tableHeaderH + row * rowH + rowH / 2;
    drawCentered(ctx, String(line.quantity || 0), columns[0], centerY, columns[1] - columns[0], 29, mansalva, ink);
    const description = [
      String(line.name || 'Producto Guaurritas').trim(),
      String(line.detail || line.personalization || '').trim(),
    ].filter(Boolean).join(' · ');
    drawCentered(ctx, description, columns[1] + 12, centerY, columns[2] - columns[1] - 24, 27, mansalva, ink);
    drawCentered(ctx, money(line.unitPrice, order.currency), columns[2], centerY, columns[3] - columns[2], 25, mansalva, ink);
    drawCentered(ctx, money(line.lineTotal || line.unitPrice * line.quantity, order.currency), columns[3], centerY, columns[4] - columns[3], 25, mansalva, ink);
  }

  if (finalPage) {
    // Notas
    ctx.fillStyle = ink;
    ctx.textAlign = 'left';
    ctx.font = `400 39px ${mansalva}`;
    ctx.fillText('NOTAS DEL PEDIDO:', 155, 1325);

    ctx.fillStyle = blue;
    ctx.fillRect(155, 1350, 930, 100);
    drawWrapped(ctx, notesFor(order), 178, 1370, 882, 25, 3, `400 21px ${mansalva}`);

    const explicitPaid = Math.max(0, Number(order.paidAmount || 0));
    const isPaid = String(order.statusGroup || '').toLowerCase() === 'paid'
      || String(order.paymentStatus || '').toUpperCase() === 'PAID';
    const paid = isPaid
      ? Number(order.total || 0)
      : Math.min(Number(order.total || 0), explicitPaid);
    const pending = isPaid
      ? 0
      : Number(order.pendingAmount || 0) > 0
        ? Number(order.pendingAmount || 0)
        : Math.max(0, Number(order.total || 0) - paid);

    const totalX = [155, 465, 775];
    const totalW = 250;
    const labels = ['Total', 'Abono', 'Valor pendiente'];
    const valuesMoney = [money(order.total, order.currency), money(paid, order.currency), money(pending, order.currency)];

    labels.forEach((label, index) => {
      drawCentered(ctx, label, totalX[index], 1500, totalW, 30, mansalva, ink);
      ctx.fillStyle = tan;
      ctx.strokeStyle = '#202020';
      ctx.lineWidth = 1.6;
      ctx.fillRect(totalX[index], 1524, totalW, 62);
      ctx.strokeRect(totalX[index], 1524, totalW, 62);
      drawCentered(ctx, valuesMoney[index], totalX[index], 1555, totalW, 25, mansalva, ink);
    });

    // Florecitas originales: quedan debajo de los totales para no tapar los recuadros.
    ctx.drawImage(assets.flowerLeft, 38, 1600, 205, 145);
    ctx.drawImage(assets.flowerRight, PAGE_W - 243, 1600, 205, 145);
  } else {
    ctx.fillStyle = blue;
    ctx.textAlign = 'center';
    ctx.font = `400 27px ${mansalva}`;
    ctx.fillText('CONTINUACIÓN DEL PEDIDO', PAGE_W / 2, 1395);
  }

  return canvas;
}

function dataUrlToBytes(dataUrl: string) {
  const base64 = dataUrl.split(',')[1] || '';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function asciiBytes(value: string) {
  return new TextEncoder().encode(value);
}

function concatBytes(parts: Uint8Array[]) {
  const length = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function makePdf(jpegs: Array<{ bytes: Uint8Array; width: number; height: number }>) {
  const objects: Array<Uint8Array> = [];
  const pageRefs: number[] = [];
  let nextObject = 3;

  for (let index = 0; index < jpegs.length; index += 1) {
    pageRefs.push(nextObject);
    nextObject += 3;
  }

  objects[1] = asciiBytes('<< /Type /Catalog /Pages 2 0 R >>');
  objects[2] = asciiBytes(`<< /Type /Pages /Kids [${pageRefs.map((ref) => `${ref} 0 R`).join(' ')}] /Count ${jpegs.length} >>`);

  jpegs.forEach((jpeg, index) => {
    const pageObj = 3 + index * 3;
    const imageObj = pageObj + 1;
    const contentObj = pageObj + 2;
    const imageName = `Im${index + 1}`;

    objects[pageObj] = asciiBytes(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PDF_W} ${PDF_H}] /Resources << /XObject << /${imageName} ${imageObj} 0 R >> >> /Contents ${contentObj} 0 R >>`,
    );

    objects[imageObj] = concatBytes([
      asciiBytes(`<< /Type /XObject /Subtype /Image /Width ${jpeg.width} /Height ${jpeg.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.bytes.length} >>\nstream\n`),
      jpeg.bytes,
      asciiBytes('\nendstream'),
    ]);

    const stream = `q\n${PDF_W} 0 0 ${PDF_H} 0 0 cm\n/${imageName} Do\nQ\n`;
    objects[contentObj] = asciiBytes(`<< /Length ${stream.length} >>\nstream\n${stream}endstream`);
  });

  const parts: Uint8Array[] = [asciiBytes('%PDF-1.4\n%âãÏÓ\n')];
  const offsets = new Array(objects.length).fill(0);
  let cursor = parts[0].length;

  for (let objectNumber = 1; objectNumber < objects.length; objectNumber += 1) {
    const object = objects[objectNumber];
    if (!object) continue;
    offsets[objectNumber] = cursor;
    const prefix = asciiBytes(`${objectNumber} 0 obj\n`);
    const suffix = asciiBytes('\nendobj\n');
    parts.push(prefix, object, suffix);
    cursor += prefix.length + object.length + suffix.length;
  }

  const xrefOffset = cursor;
  const xref: string[] = [];
  xref.push(`xref\n0 ${objects.length}\n`);
  xref.push('0000000000 65535 f \n');
  for (let objectNumber = 1; objectNumber < objects.length; objectNumber += 1) {
    xref.push(`${String(offsets[objectNumber] || 0).padStart(10, '0')} 00000 n \n`);
  }
  xref.push(`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);
  parts.push(asciiBytes(xref.join('')));
  return new Blob(parts as BlobPart[], { type: 'application/pdf' });
}

function safeFileName(order: ReceiptOrder) {
  const raw = order.wixOrderNumber ? `Pedido-${order.wixOrderNumber}` : `Pedido-${order.reference || 'Guaurritas'}`;
  return raw.replace(/[^a-zA-Z0-9-_]/g, '-').replace(/-+/g, '-');
}

export function openOrderReceipt(order: ReceiptOrder) {
  const popup = window.open('', '_blank');
  if (!popup) throw new Error('Tu navegador bloqueó la ventana del recibo. Permite ventanas emergentes e intenta de nuevo.');

  popup.document.open();
  popup.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Generando nota…</title><style>html,body{height:100%;margin:0;background:#f4f5f9;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#425BBC}.wrap{height:100%;display:grid;place-items:center;text-align:center;padding:24px;box-sizing:border-box}.card{background:#fff;border:1px solid #dde2ef;border-radius:20px;padding:26px;box-shadow:0 18px 55px rgba(36,54,111,.12)}b{display:block;font-size:16px;margin-bottom:8px}span{font-size:12px;color:#7b86a1}</style></head><body><div class="wrap"><div class="card"><b>Preparando tu nota Guaurritas…</b><span>Un momento 🐾</span></div></div></body></html>`);
  popup.document.close();

  void (async () => {
    try {
      await ensureFonts();
      const assets = await loadAssets();
      const mansalva = fontFamilyFromVar('--font-mansalva', 'Mansalva, cursive');
      const cinzel = fontFamilyFromVar('--font-cinzel', 'Cinzel, serif');
      const groups = splitLines(order.lines || [], ROWS_PER_PAGE);

      const jpegs = groups.map((lines, index) => {
        const canvas = drawReceiptPage(order, lines, index, groups.length, assets, mansalva, cinzel);
        return {
          bytes: dataUrlToBytes(canvas.toDataURL('image/jpeg', 0.96)),
          width: canvas.width,
          height: canvas.height,
        };
      });

      const pdf = makePdf(jpegs);
      const url = URL.createObjectURL(pdf);
      const filename = `${safeFileName(order)}.pdf`;

      popup.document.open();
      popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${filename}</title><style>html,body{margin:0;height:100%;background:#111}iframe{width:100%;height:100%;border:0}.receipt-action{position:fixed;z-index:2;bottom:14px;border:0;border-radius:999px;padding:12px 16px;text-decoration:none;font:700 12px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 8px 26px rgba(0,0,0,.22);cursor:pointer}.save{right:14px;background:#425BBC;color:#fff}.close{left:14px;background:#fff;color:#425BBC}</style></head><body><iframe src="${url}" title="${filename}"></iframe><button class="receipt-action close" type="button" onclick="window.close()">Cerrar</button><a class="receipt-action save" href="${url}" download="${filename}">Guardar PDF</a></body></html>`);
      popup.document.close();

      window.setTimeout(() => URL.revokeObjectURL(url), 10 * 60 * 1000);
    } catch (error) {
      popup.document.open();
      popup.document.write(`<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:24px"><h2>No pudimos generar la nota</h2><p>${String(error instanceof Error ? error.message : error)}</p></body></html>`);
      popup.document.close();
    }
  })();
}
