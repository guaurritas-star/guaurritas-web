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
  lines: ReceiptOrderLine[];
};

const TZ = 'America/Mexico_City';
const ROWS_PER_PAGE = 5;

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatMoney(value: number, currency = 'MXN') {
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

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks.length ? chunks : [[]];
}

function lineDescription(line: ReceiptOrderLine) {
  const extras = [line.detail, line.personalization]
    .map((value) => String(value || '').trim())
    .filter(Boolean);
  return [String(line.name || 'Producto Guaurritas').trim(), ...extras].join(' · ');
}

function notesFor(order: ReceiptOrder) {
  const parts = [order.notes, order.personalization, order.operationalNote]
    .map((value) => String(value || '').trim())
    .filter(Boolean);
  return Array.from(new Set(parts)).join(' · ');
}

function itemRows(lines: ReceiptOrderLine[]) {
  const padded = [...lines];
  while (padded.length < ROWS_PER_PAGE) padded.push({ name: '', quantity: 0, unitPrice: 0, lineTotal: 0 });
  return padded.map((line) => {
    const empty = !line.name;
    return `<tr>
      <td class="qty">${empty ? '' : escapeHtml(line.quantity)}</td>
      <td class="description">${empty ? '' : escapeHtml(lineDescription(line))}</td>
      <td class="price">${empty ? '' : escapeHtml(formatMoney(line.unitPrice))}</td>
      <td class="price">${empty ? '' : escapeHtml(formatMoney(line.lineTotal || line.unitPrice * line.quantity))}</td>
    </tr>`;
  }).join('');
}

function pageMarkup(order: ReceiptOrder, lines: ReceiptOrderLine[], pageIndex: number, pageCount: number) {
  const finalPage = pageIndex === pageCount - 1;
  const orderNumber = order.wixOrderNumber ? `#${order.wixOrderNumber}` : order.reference;
  const deliveryDate = formatReceiptDate(order.scheduledAt || order.deliveryDate);
  const deliveryTime = String(order.deliveryTime || '').trim();
  const delivery = deliveryTime ? `${deliveryDate} · ${deliveryTime}` : deliveryDate;
  const address = order.deliveryPoint || order.address || order.deliveryType || '';
  const notes = notesFor(order);

  return `<section class="page">
    <header class="receipt-head">
      <div class="brand-mark">
        <div class="brand-script">Guaurritas</div>
        <div class="brand-pets">🐱<span>🐶</span></div>
      </div>
      <div class="order-title">PEDIDO N°</div>
      <div class="order-number">${escapeHtml(orderNumber)}</div>
    </header>

    <div class="client-grid">
      <div class="label">Fecha de entrega:</div><div class="value">${escapeHtml(delivery)}</div>
      <div class="label">Cliente:</div><div class="value">${escapeHtml(order.customerName || 'SIN NOMBRE')}</div>
      <div class="label">Dirección:</div><div class="value">${escapeHtml(address || '—')}</div>
    </div>

    ${pageCount > 1 ? `<div class="continuation">${pageIndex ? 'CONTINUACIÓN DEL PEDIDO' : 'PEDIDO'} · PÁGINA ${pageIndex + 1} DE ${pageCount}</div>` : ''}

    <table class="items">
      <thead><tr><th>Cantidad</th><th>Descripción del Producto</th><th>Precio<br>Unitario</th><th>Total</th></tr></thead>
      <tbody>${itemRows(lines)}</tbody>
    </table>

    ${finalPage ? `<div class="notes-wrap">
      <div class="notes-title">NOTAS DEL PEDIDO:</div>
      <div class="notes-box">${escapeHtml(notes || ' ')}</div>
    </div>
    <div class="totals-labels"><div>Total</div><div>Abono</div><div>Valor pendiente</div></div>
    <div class="totals"><div>${escapeHtml(formatMoney(order.total, order.currency))}</div><div>${escapeHtml(formatMoney(order.paidAmount, order.currency))}</div><div>${escapeHtml(formatMoney(order.pendingAmount, order.currency))}</div></div>` : `<div class="continued-note">El resumen de pago aparece en la última página.</div>`}

    <div class="ornament"><span>❧</span><span>GUAURRITAS</span><span>☙</span></div>
  </section>`;
}

export function openOrderReceipt(order: ReceiptOrder) {
  const popup = window.open('', '_blank');
  if (!popup) throw new Error('Tu navegador bloqueó la ventana del recibo. Permite ventanas emergentes e intenta de nuevo.');

  const groups = chunk(order.lines || [], ROWS_PER_PAGE);
  const pages = groups.map((lines, index) => pageMarkup(order, lines, index, groups.length)).join('');
  const title = `Pedido ${order.wixOrderNumber ? `#${order.wixOrderNumber}` : order.reference || 'Guaurritas'}`;

  popup.document.open();
  popup.document.write(`<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${escapeHtml(title)}</title>
<style>
  *{box-sizing:border-box}
  html,body{margin:0;background:#edf0f6;color:#111}
  body{font-family:Georgia,'Times New Roman',serif;padding:76px 12px 24px}
  .toolbar{position:fixed;z-index:20;left:0;right:0;top:0;display:flex;align-items:center;justify-content:center;gap:10px;padding:12px max(12px,env(safe-area-inset-left));background:rgba(255,255,255,.96);border-bottom:1px solid #dfe3ec;backdrop-filter:blur(12px)}
  .toolbar button{border:0;border-radius:12px;padding:12px 16px;font:700 13px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;cursor:pointer}
  .toolbar .primary{background:#425BBC;color:#fff}.toolbar .secondary{background:#eef1f8;color:#42506f}
  .page{position:relative;width:210mm;min-height:297mm;margin:0 auto 18px;padding:14mm 13mm 12mm;background:white;box-shadow:0 14px 46px rgba(25,40,85,.14);page-break-after:always;overflow:hidden}
  .page:last-child{page-break-after:auto}
  .receipt-head{display:grid;grid-template-columns:32mm 1fr 34mm;align-items:center;min-height:30mm}
  .brand-mark{text-align:center;line-height:1}.brand-script{font:700 16px 'Comic Sans MS','Bradley Hand',cursive;transform:rotate(-7deg);letter-spacing:.4px}.brand-pets{font-size:22px;margin-top:6px}.brand-pets span{display:inline-block;margin-left:-8px;transform:translateY(7px)}
  .order-title{text-align:right;font-size:35px;font-weight:700;letter-spacing:-1px;white-space:nowrap}.order-number{height:17mm;display:grid;place-items:center;background:#d9ae8f;font-size:16px;font-weight:700}
  .client-grid{display:grid;grid-template-columns:48mm 1fr;align-items:end;margin:7mm 12mm 5mm;font-size:16px}.client-grid .label{font:700 17px 'Comic Sans MS','Bradley Hand',cursive;padding:2.2mm 0}.client-grid .value{min-height:9mm;padding:1.5mm 2mm;border-bottom:1px dashed #6c6c6c;text-align:center;font-size:18px;overflow-wrap:anywhere}
  .continuation{text-align:right;margin:0 0 2.5mm;font:700 8px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;letter-spacing:1.3px;color:#596891}
  table.items{width:100%;border-collapse:collapse;table-layout:fixed;margin-top:1mm}table.items th,table.items td{border:1.1px solid #222;text-align:center;vertical-align:middle}table.items th{height:18mm;background:#d9ae8f;font:700 13px 'Comic Sans MS','Bradley Hand',cursive}table.items th:nth-child(1){width:20%}table.items th:nth-child(2){width:46%}table.items th:nth-child(3){width:18%}table.items th:nth-child(4){width:16%}table.items td{height:18mm;padding:2mm 2.5mm;font:15px 'Comic Sans MS','Bradley Hand',cursive}.items .description{font-size:13px;line-height:1.25}.items .price{white-space:nowrap;font-size:13px}
  .notes-wrap{margin:13mm 13mm 0}.notes-title{font-size:17px;font-weight:700;margin-bottom:1.5mm}.notes-box{min-height:21mm;padding:3mm;background:#596891;color:white;font:12px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.4;overflow-wrap:anywhere}
  .totals-labels,.totals{display:grid;grid-template-columns:1.25fr .9fr .9fr;gap:7mm;margin:4mm 13mm 0;text-align:center}.totals-labels{font:700 13px 'Comic Sans MS','Bradley Hand',cursive;margin-top:4mm}.totals{margin-top:2mm}.totals div{min-height:12mm;display:grid;place-items:center;background:#d9ae8f;border:1px solid #222;font:700 15px 'Comic Sans MS','Bradley Hand',cursive}
  .continued-note{margin-top:15mm;text-align:center;font:11px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#75809a}
  .ornament{position:absolute;left:13mm;right:13mm;bottom:7mm;display:flex;justify-content:space-between;align-items:center;color:#596891;font:700 9px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;letter-spacing:2px}.ornament span:first-child,.ornament span:last-child{font:32px Georgia,serif;letter-spacing:0}
  @media(max-width:800px){body{padding:68px 0 20px}.page{width:100%;min-height:auto;margin:0 0 12px;padding:8vw 5vw;box-shadow:none}.order-title{font-size:8vw}.receipt-head{grid-template-columns:24vw 1fr 25vw}.client-grid{margin-left:2vw;margin-right:2vw;grid-template-columns:37vw 1fr}.items td{height:15vw}.notes-wrap,.totals-labels,.totals{margin-left:2vw;margin-right:2vw}.ornament{position:static;margin-top:9vw}}
  @media print{
    @page{size:A4 portrait;margin:0}
    html,body{background:#fff}.toolbar{display:none!important}body{padding:0}.page{width:210mm;height:297mm;min-height:297mm;margin:0;padding:14mm 13mm 12mm;box-shadow:none;break-after:page;page-break-after:always}.page:last-child{break-after:auto;page-break-after:auto}.ornament{position:absolute;left:13mm;right:13mm;bottom:7mm}.items td{height:18mm}
  }
</style>
</head>
<body>
<div class="toolbar"><button class="secondary" onclick="window.close()">Cerrar</button><button class="primary" onclick="window.print()">Imprimir / Guardar PDF</button></div>
${pages}
</body>
</html>`);
  popup.document.close();
  popup.focus();
}
