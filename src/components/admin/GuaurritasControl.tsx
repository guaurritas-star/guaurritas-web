'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { openOrderReceipt } from './orderReceipt';

const API_URL = 'https://www.guaurritas.com/_functions/speiAdmin';
const SESSION_KEY = 'guaurritas-spei-admin-session';
const TZ = 'America/Mexico_City';

const MONTHS = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

type Nav = 'dashboard' | 'orders' | 'spei' | 'agenda' | 'archive';
type Mode = 'all' | 'today' | 'pending' | 'paid' | 'rejected' | 'quoted' | 'tests' | 'spei';
type Period = { year: number; month: number; day: number };

type OrderLine = {
  name: string; category: string; detail: string; quantity: number;
  unitPrice: number; lineTotal: number; personalization: string;
};

type ControlOrder = {
  id: string; reference: string; sourceType: string; sourceOrderId: string; localOrderId: string;
  status: string; statusGroup: 'pending' | 'paid' | 'rejected' | 'quoted' | 'expired';
  actionState: 'readonly' | 'review' | 'validating' | 'paid' | 'rejected' | 'awaiting_proof' | 'expired';
  paymentStatus: string; orderStatus: string; total: number; paidAmount: number; pendingAmount: number; currency: string;
  customerName: string; customerPhone: string; customerEmail: string; instagram: string; address: string;
  channel: string; customerType: string; region: string; paymentMethod: string; notes: string; personalization: string; noteLink: string;
  wixOrderId: string; wixOrderNumber: string; orderDate: string | null; deliveryDate: string | null; scheduledAt: string | null;
  deliveryTime: string; deliveryType: string; deliveryPoint: string; operationalNote: string;
  adminDateKey: string; adminYear: number; adminMonth: number; adminDay: number;
  isTest: boolean; hasProof: boolean; proofFileName: string; productUnits: number; canDelete: boolean;
  lines: OrderLine[];
};

type ArchiveEntry = { dateKey: string; total: number; pending: number; paid: number; rejected: number; quoted?: number; expired: number };
type Bootstrap = {
  today: string;
  counts: { all: number; pending: number; paid: number; rejected: number; quoted: number; expired: number; tests: number; review: number; speiOpen: number };
  archive: ArchiveEntry[];
};
type OrderList = { orders: ControlOrder[]; page: number; pageSize: number; hasNext: boolean; totalCount: number };
type DashboardData = {
  period: Period;
  kpis: {
    sales: number; orders: number; ticketAverage: number; productsSold: number; uniqueClients: number;
    paid: number; needsReview: number; speiPending: number; rejected: number; quoted: number; paidAmount: number; pendingAmount: number;
  };
  statusBreakdown: { paid: number; review: number; rejected: number; pending: number; quoted: number };
  salesTrend: Array<{ label: string; value: number }>;
  byRegion: Array<{ key: string; sales: number; orders: number }>;
  byPayment: Array<{ key: string; sales: number; orders: number }>;
  topProducts: Array<{ name: string; units: number; sales: number }>;
  topClients: Array<{ name: string; sales: number; orders: number; ticketAverage: number; lastOrderDate: string | null }>;
  attentionOrders: ControlOrder[];
  upcomingOrders: ControlOrder[];
  recentOrders: ControlOrder[];
};
type ApiEnvelope<T> = { ok: boolean; data?: T; error?: string };
type ProofReady = { orderId: string; url: string; expiresAt: string | null } | null;

type ScheduleDraft = { date: string; time: string; deliveryType: string; deliveryPoint: string; operationalNote: string };

function money(value: number, currency = 'MXN') {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: currency || 'MXN', maximumFractionDigits: 2 }).format(Number(value || 0));
}

function compactDate(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric', timeZone: TZ }).format(date);
}

function fullDate(value: string | null) {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-MX', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric', timeZone: TZ }).format(date);
}

function dateTime(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short', timeZone: TZ }).format(date);
}

function dateInput(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function archiveDate(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  if (!year || !month || !day) return dateKey || 'Sin fecha';
  return `${String(day).padStart(2, '0')} de ${MONTHS[month].toLowerCase()} de ${year}`;
}

function sourceLabel(value: string) {
  const map: Record<string, string> = { HISTORICAL_SHEET: 'Histórico', LOCAL_SPEI: 'Web Guaurritas', WIX_ECOM: 'Online Wix' };
  return map[value] || value || 'Sin origen';
}

function regionLabel(value: string) {
  const map: Record<string, string> = { LEON: 'León', NACIONAL: 'Nacional', UNKNOWN: 'Sin clasificar' };
  return map[value] || value || 'Sin clasificar';
}

function paymentLabel(value: string) {
  const map: Record<string, string> = { SPEI: 'SPEI', ONLINE: 'Online', WIX: 'Wix', HISTORICAL: 'Histórico', UNKNOWN: 'Sin registrar' };
  return map[value] || value || 'Sin registrar';
}

function statusInfo(order: ControlOrder) {
  if (order.actionState === 'review') return { label: 'Por revisar', dot: 'bg-amber-400', cls: 'bg-amber-50 text-amber-800 border-amber-200' };
  if (order.actionState === 'validating') return { label: 'Validando', dot: 'bg-blue-500', cls: 'bg-blue-50 text-blue-800 border-blue-200' };
  if (order.statusGroup === 'paid') return { label: 'Pagado', dot: 'bg-emerald-500', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
  if (order.statusGroup === 'rejected') return { label: 'Rechazado', dot: 'bg-rose-500', cls: 'bg-rose-50 text-rose-800 border-rose-200' };
  if (order.statusGroup === 'quoted') return { label: 'Cotizado', dot: 'bg-violet-400', cls: 'bg-violet-50 text-violet-800 border-violet-200' };
  if (order.statusGroup === 'expired') return { label: 'Vencido', dot: 'bg-slate-400', cls: 'bg-slate-100 text-slate-700 border-slate-200' };
  if (order.actionState === 'awaiting_proof') return { label: 'Esperando comprobante', dot: 'bg-amber-300', cls: 'bg-amber-50 text-amber-800 border-amber-200' };
  return { label: order.paymentStatus === 'PARTIAL' ? 'Pago parcial' : 'Pendiente', dot: 'bg-amber-400', cls: 'bg-amber-50 text-amber-800 border-amber-200' };
}

function productSummary(order: ControlOrder) {
  if (!order.lines.length) return 'Sin productos registrados';
  return order.lines.map((line) => {
    const extra = line.detail || line.personalization;
    return `${line.quantity}× ${line.name}${extra ? ` · ${extra}` : ''}`;
  }).join(' / ');
}

function agendaDayLabel(value: string | null, todayKey: string) {
  const key = dateInput(value);
  if (!key) return 'Sin fecha';
  if (key === todayKey) return 'Hoy';
  const today = new Date(`${todayKey}T12:00:00-06:00`);
  const next = new Date(today.getTime() + 86400000);
  const nextKey = dateInput(next.toISOString());
  if (key === nextKey) return 'Mañana';
  return fullDate(value);
}

async function panelApi<T>(password: string, action: string, payload: Record<string, unknown> = {}) {
  const response = await fetch(API_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store',
    body: JSON.stringify({ password, action, ...payload }),
  });
  let result: ApiEnvelope<T>;
  try { result = (await response.json()) as ApiEnvelope<T>; }
  catch { throw new Error('Wix respondió sin datos legibles.'); }
  if (!response.ok || !result.ok) {
    const error = new Error(result.error || `Error ${response.status}`);
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }
  return result.data as T;
}

function Login({ onLogin }: { onLogin: (password: string) => Promise<void> }) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!password.trim() || busy) return;
    setBusy(true); setError('');
    try { await onLogin(password.trim()); }
    catch (err) { setError(err instanceof Error ? err.message : 'No pudimos entrar al panel.'); }
    finally { setBusy(false); }
  }
  return <main className="min-h-screen bg-[#f3f5fb] px-5 py-10 text-[#172044]"><div className="mx-auto flex min-h-[80vh] max-w-md items-center"><form onSubmit={submit} className="w-full overflow-hidden rounded-[28px] border border-[#d9dff0] bg-white shadow-[0_24px_80px_rgba(42,57,112,.16)]"><div className="bg-[#425BBC] px-7 py-7 text-white"><div className="font-title text-2xl tracking-[.08em]">GUAURRITAS</div><div className="mt-1 font-interface text-xs uppercase tracking-[.18em] text-blue-100">Control · Pedidos & Ventas</div></div><div className="space-y-5 p-7"><div><h1 className="font-title text-2xl text-[#1f3479]">Acceso administrativo</h1><p className="mt-2 font-interface text-sm leading-6 text-slate-500">Pedidos, agenda, ventas y comprobantes privados de Guaurritas.</p></div><label className="block"><span className="mb-2 block font-interface text-xs font-bold uppercase tracking-[.12em] text-slate-500">Clave de acceso</span><input autoFocus type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 w-full rounded-xl border border-[#cbd3e9] bg-[#f8f9fd] px-4 font-interface outline-none transition focus:border-[#425BBC] focus:ring-4 focus:ring-[#425BBC]/10" placeholder="••••••••••••" /></label>{error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 font-interface text-sm text-rose-700">{error}</div> : null}<button type="submit" disabled={busy || !password.trim()} className="h-12 w-full rounded-xl bg-[#425BBC] font-title text-sm tracking-[.08em] text-white shadow-lg shadow-[#425BBC]/20 disabled:opacity-50">{busy ? 'COMPROBANDO…' : 'ENTRAR A GUAURRITAS CONTROL'}</button></div></form></div></main>;
}

function StatusPill({ order }: { order: ControlOrder }) {
  const info = statusInfo(order);
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-interface text-[10px] font-bold uppercase tracking-[.05em] ${info.cls}`}><span className={`h-1.5 w-1.5 rounded-full ${info.dot}`} />{info.label}</span>;
}

function KpiCard({ label, value, note, tone = 'blue' }: { label: string; value: string; note: string; tone?: 'blue' | 'green' | 'amber' | 'rose' }) {
  const accents = { blue: 'bg-[#eef1ff] text-[#425BBC]', green: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600', rose: 'bg-rose-50 text-rose-600' };
  return <div className="rounded-2xl border border-[#e0e4f0] bg-white p-4 shadow-[0_8px_26px_rgba(35,50,100,.06)] sm:p-5"><div className="flex items-start justify-between gap-2"><div className="font-interface text-[10px] font-bold uppercase tracking-[.1em] text-slate-500">{label}</div><span className={`grid h-7 w-7 place-items-center rounded-lg text-xs ${accents[tone]}`}>●</span></div><div className="mt-3 font-title text-2xl text-[#182a67] sm:text-[28px]">{value}</div><div className="mt-1 font-interface text-[11px] text-slate-400">{note}</div></div>;
}

function LineChart({ data }: { data: Array<{ label: string; value: number }> }) {
  if (!data.length) return <div className="grid h-52 place-items-center font-interface text-sm text-slate-400">Todavía no hay ventas pagadas en este periodo.</div>;
  const width = 700, height = 220, padX = 26, padY = 24;
  const max = Math.max(...data.map((item) => item.value), 1);
  const points = data.map((item, index) => ({ x: data.length === 1 ? width / 2 : padX + (index / (data.length - 1)) * (width - padX * 2), y: height - padY - (item.value / max) * (height - padY * 2), ...item }));
  const path = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
  return <div><svg viewBox={`0 0 ${width} ${height}`} className="h-52 w-full overflow-visible" role="img" aria-label="Ventas en el periodo">{[0.25, 0.5, 0.75].map((ratio) => <line key={ratio} x1={padX} x2={width - padX} y1={height * ratio} y2={height * ratio} stroke="#e8ebf4" strokeWidth="1" />)}<path d={path} fill="none" stroke="#425BBC" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />{points.map((point) => <circle key={`${point.label}-${point.x}`} cx={point.x} cy={point.y} r="5" fill="white" stroke="#425BBC" strokeWidth="3" />)}</svg><div className="mt-1 flex justify-between gap-2 overflow-hidden font-interface text-[9px] text-slate-400"><span>{data[0]?.label}</span><span>{data[Math.floor((data.length - 1) / 2)]?.label}</span><span>{data[data.length - 1]?.label}</span></div></div>;
}

function Donut({ data }: { data: DashboardData['statusBreakdown'] }) {
  const values = [data.paid, data.review, data.rejected, data.pending, data.quoted];
  const total = Math.max(values.reduce((a, b) => a + b, 0), 1);
  const a = (data.paid / total) * 100, b = a + (data.review / total) * 100, c = b + (data.rejected / total) * 100, d = c + (data.pending / total) * 100;
  const background = `conic-gradient(#22c55e 0 ${a}%, #f59e0b ${a}% ${b}%, #f87171 ${b}% ${c}%, #94a3b8 ${c}% ${d}%, #a78bfa ${d}% 100%)`;
  return <div className="flex items-center gap-5 py-3"><div className="relative h-32 w-32 shrink-0 rounded-full" style={{ background }}><div className="absolute inset-[18px] grid place-items-center rounded-full bg-white"><div className="text-center"><div className="font-title text-2xl text-[#1f3479]">{values.reduce((x, y) => x + y, 0)}</div><div className="font-interface text-[9px] uppercase text-slate-400">pedidos</div></div></div></div><div className="min-w-0 space-y-2 font-interface text-xs text-slate-600"><div><span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-500" />Pagados <b>{data.paid}</b></div><div><span className="mr-2 inline-block h-2 w-2 rounded-full bg-amber-400" />Por revisar <b>{data.review}</b></div><div><span className="mr-2 inline-block h-2 w-2 rounded-full bg-rose-400" />Rechazados <b>{data.rejected}</b></div><div><span className="mr-2 inline-block h-2 w-2 rounded-full bg-slate-400" />Pendientes <b>{data.pending}</b></div>{data.quoted ? <div><span className="mr-2 inline-block h-2 w-2 rounded-full bg-violet-400" />Cotizados <b>{data.quoted}</b></div> : null}</div></div>;
}

function Bars({ data }: { data: Array<{ key: string; sales: number; orders: number }> }) {
  const max = Math.max(...data.map((item) => item.sales), 1);
  if (!data.length) return <div className="py-10 text-center font-interface text-sm text-slate-400">Sin datos para este periodo.</div>;
  return <div className="space-y-4 py-2">{data.slice(0, 5).map((item) => <div key={item.key}><div className="mb-1 flex justify-between gap-3 font-interface text-xs"><span className="font-semibold text-slate-600">{regionLabel(item.key)}</span><span className="text-slate-400">{money(item.sales)} · {item.orders}</span></div><div className="h-2 overflow-hidden rounded-full bg-[#edf0f7]"><div className="h-full rounded-full bg-[#6277c4]" style={{ width: `${Math.max(6, (item.sales / max) * 100)}%` }} /></div></div>)}</div>;
}

function OrderCard({ order, onOpen, agenda = false }: { order: ControlOrder; onOpen: (order: ControlOrder) => void; agenda?: boolean }) {
  return <button type="button" onClick={() => onOpen(order)} className="w-full rounded-2xl border border-[#e0e4f0] bg-white p-4 text-left shadow-[0_7px_22px_rgba(34,49,100,.05)] transition hover:border-[#9ca9d7] hover:shadow-[0_10px_28px_rgba(34,49,100,.09)]"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><StatusPill order={order} /><div className="mt-2 truncate font-title text-base text-[#203676]">{order.customerName || order.reference}</div><div className="mt-1 truncate font-interface text-[11px] text-slate-400">{order.wixOrderNumber ? `#${order.wixOrderNumber} · ` : ''}{order.reference}</div></div><div className="shrink-0 text-right"><div className="font-title text-lg text-[#203676]">{money(order.total, order.currency)}</div><div className="mt-1 font-interface text-[10px] text-slate-400">{agenda && order.scheduledAt ? compactDate(order.scheduledAt) : archiveDate(order.adminDateKey)}</div></div></div><div className="mt-3 line-clamp-2 font-interface text-xs leading-5 text-slate-500">{productSummary(order)}</div>{agenda ? <div className="mt-3 rounded-xl bg-[#f7f8fc] px-3 py-2 font-interface text-[11px] text-slate-500"><b className="text-[#425BBC]">Entrega:</b> {order.deliveryTime || 'Hora por definir'}{order.deliveryType ? ` · ${order.deliveryType}` : ''}{order.deliveryPoint ? ` · ${order.deliveryPoint}` : ''}</div> : null}<div className="mt-3 flex flex-wrap gap-1.5"><span className="rounded-full bg-[#f0f3fb] px-2 py-1 font-interface text-[9px] font-bold uppercase text-[#53659e]">{paymentLabel(order.paymentMethod)}</span><span className="rounded-full bg-[#f0f3fb] px-2 py-1 font-interface text-[9px] font-bold uppercase text-[#53659e]">{regionLabel(order.region)}</span><span className="rounded-full bg-[#f0f3fb] px-2 py-1 font-interface text-[9px] font-bold uppercase text-[#53659e]">{sourceLabel(order.sourceType)}</span></div></button>;
}

function DetailPanel({ order, proofReady, busy, todayKey, onClose, onProof, onValidate, onReject, onSchedule, onDelete }: {
  order: ControlOrder; proofReady: ProofReady; busy: string; todayKey: string; onClose: () => void;
  onProof: (o: ControlOrder) => Promise<void>; onValidate: (o: ControlOrder) => Promise<void>; onReject: (o: ControlOrder) => Promise<void>;
  onSchedule: (o: ControlOrder, draft: ScheduleDraft) => Promise<void>; onDelete: (o: ControlOrder) => Promise<void>;
}) {
  const [draft, setDraft] = useState<ScheduleDraft>({ date: dateInput(order.scheduledAt || order.deliveryDate), time: order.deliveryTime || '', deliveryType: order.deliveryType || '', deliveryPoint: order.deliveryPoint || '', operationalNote: order.operationalNote || '' });
  useEffect(() => { setDraft({ date: dateInput(order.scheduledAt || order.deliveryDate), time: order.deliveryTime || '', deliveryType: order.deliveryType || '', deliveryPoint: order.deliveryPoint || '', operationalNote: order.operationalNote || '' }); }, [order]);
  return <div className="fixed inset-0 z-50 bg-[#10162a]/35 backdrop-blur-[2px]" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><aside className="absolute inset-y-0 right-0 w-full overflow-y-auto bg-[#f5f6fa] shadow-[-24px_0_70px_rgba(20,30,70,.22)] sm:max-w-xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#dfe4ef] bg-white/95 px-4 py-4 backdrop-blur"><div><div className="font-title text-lg text-[#203676]">{order.customerName || order.reference}</div><div className="font-interface text-[10px] text-slate-400">{order.wixOrderNumber ? `Wix #${order.wixOrderNumber} · ` : ''}{order.reference}</div></div><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl bg-[#f1f3f9] font-interface text-lg text-slate-500">×</button></div><div className="space-y-4 p-4 sm:p-5"><div className="flex items-center justify-between gap-3"><StatusPill order={order} /><div className="font-title text-2xl text-[#203676]">{money(order.total, order.currency)}</div></div>

  <section className="rounded-2xl border border-[#e0e4f0] bg-white p-4"><h3 className="font-title text-base text-[#2a4189]">Pedido</h3><div className="mt-3 space-y-3">{order.lines.map((line, index) => <div key={`${line.name}-${index}`} className="rounded-xl bg-[#f8f9fc] p-3"><div className="flex justify-between gap-3 font-interface text-sm font-semibold text-slate-700"><span>{line.name}</span><span>{line.quantity}×</span></div>{line.detail || line.personalization ? <div className="mt-1 font-interface text-xs text-slate-400">{line.detail || line.personalization}</div> : null}<div className="mt-1 font-interface text-xs text-[#425BBC]">{money(line.lineTotal || line.unitPrice * line.quantity)}</div></div>)}</div></section>

  <div className="grid gap-4 sm:grid-cols-2"><section className="rounded-2xl border border-[#e0e4f0] bg-white p-4"><h3 className="font-title text-base text-[#2a4189]">Cliente</h3><div className="mt-3 space-y-2 font-interface text-xs text-slate-500"><div>{order.customerName || 'Sin nombre'}</div>{order.customerPhone ? <a className="block font-semibold text-[#425BBC]" href={`tel:${order.customerPhone}`}>☎ {order.customerPhone}</a> : null}{order.customerEmail ? <a className="block break-all font-semibold text-[#425BBC]" href={`mailto:${order.customerEmail}`}>✉ {order.customerEmail}</a> : null}{order.instagram ? <div>@ {order.instagram}</div> : null}{order.address ? <div>⌖ {order.address}</div> : null}</div></section><section className="rounded-2xl border border-[#e0e4f0] bg-white p-4"><h3 className="font-title text-base text-[#2a4189]">Origen & pago</h3><div className="mt-3 space-y-2 font-interface text-xs text-slate-500"><div><b>Canal:</b> {sourceLabel(order.sourceType)}{order.channel ? ` · ${order.channel}` : ''}</div><div><b>Entrega:</b> {regionLabel(order.region)}</div><div><b>Pago:</b> {paymentLabel(order.paymentMethod)}</div><div><b>Pagado:</b> {money(order.paidAmount)}</div>{order.pendingAmount ? <div><b>Pendiente:</b> {money(order.pendingAmount)}</div> : null}<div><b>Registro:</b> {archiveDate(order.adminDateKey)}</div></div></section></div>

  <section className="rounded-2xl border border-[#dce2f0] bg-white p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-title text-base text-[#2a4189]">Agenda de entrega</h3><p className="mt-1 font-interface text-[11px] text-slate-400">Guarda día, hora y punto para que aparezca en Próximos pedidos.</p></div>{order.scheduledAt ? <span className="rounded-full bg-[#eef1ff] px-2 py-1 font-interface text-[9px] font-bold uppercase text-[#425BBC]">{agendaDayLabel(order.scheduledAt, todayKey)}</span> : null}</div><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="font-interface text-[10px] font-bold uppercase tracking-[.08em] text-slate-500">Fecha<input type="date" value={draft.date} onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-[#d8deec] bg-[#fafbfe] px-3 text-xs font-normal text-slate-700 outline-none focus:border-[#425BBC]" /></label><label className="font-interface text-[10px] font-bold uppercase tracking-[.08em] text-slate-500">Hora<input type="time" value={draft.time} onChange={(e) => setDraft((d) => ({ ...d, time: e.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-[#d8deec] bg-[#fafbfe] px-3 text-xs font-normal text-slate-700 outline-none focus:border-[#425BBC]" /></label><label className="font-interface text-[10px] font-bold uppercase tracking-[.08em] text-slate-500">Tipo de entrega<select value={draft.deliveryType} onChange={(e) => setDraft((d) => ({ ...d, deliveryType: e.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-[#d8deec] bg-[#fafbfe] px-3 text-xs font-normal text-slate-700 outline-none focus:border-[#425BBC]"><option value="">Sin definir</option><option>Recolección</option><option>Punto medio</option><option>Domicilio</option><option>Envío</option><option>Otro</option></select></label><label className="font-interface text-[10px] font-bold uppercase tracking-[.08em] text-slate-500">Punto / lugar<input value={draft.deliveryPoint} onChange={(e) => setDraft((d) => ({ ...d, deliveryPoint: e.target.value }))} placeholder="HEB, Plaza Mayor, domicilio…" className="mt-1 h-11 w-full rounded-xl border border-[#d8deec] bg-[#fafbfe] px-3 text-xs font-normal text-slate-700 outline-none focus:border-[#425BBC]" /></label></div><label className="mt-3 block font-interface text-[10px] font-bold uppercase tracking-[.08em] text-slate-500">Nota operativa<textarea value={draft.operationalNote} onChange={(e) => setDraft((d) => ({ ...d, operationalNote: e.target.value }))} rows={3} placeholder="Indicaciones para preparación o entrega" className="mt-1 w-full rounded-xl border border-[#d8deec] bg-[#fafbfe] px-3 py-2 text-xs font-normal text-slate-700 outline-none focus:border-[#425BBC]" /></label><button onClick={() => onSchedule(order, draft)} disabled={busy === 'schedule' || !draft.date} className="mt-3 w-full rounded-xl bg-[#425BBC] px-4 py-3 font-interface text-xs font-bold text-white disabled:opacity-50">{busy === 'schedule' ? 'Guardando agenda…' : 'GUARDAR FECHA Y ENTREGA'}</button></section>

  {order.hasProof ? <section className="rounded-2xl border border-[#dce2f0] bg-white p-4"><div className="flex items-center justify-between gap-3"><div><h3 className="font-title text-base text-[#2a4189]">Comprobante SPEI</h3><p className="mt-1 font-interface text-[11px] text-slate-400">{order.proofFileName || 'Archivo privado de Wix'}</p></div><span className="rounded-full bg-[#eef1ff] px-2 py-1 font-interface text-[9px] font-bold uppercase text-[#425BBC]">Privado</span></div>{proofReady?.orderId === order.id ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3"><div className="font-interface text-xs font-bold text-emerald-800">✓ Comprobante listo</div><div className="mt-1 font-interface text-[10px] text-emerald-700">Enlace temporal seguro{proofReady.expiresAt ? ` · vence ${dateTime(proofReady.expiresAt)}` : ''}</div><a href={proofReady.url} target="_blank" rel="noreferrer" className="mt-3 block rounded-xl bg-[#425BBC] px-4 py-3 text-center font-interface text-xs font-bold text-white">ABRIR COMPROBANTE ↗</a></div> : <button onClick={() => onProof(order)} disabled={busy === 'proof'} className="mt-4 w-full rounded-xl border border-[#b8c3e4] bg-[#f7f8fd] px-4 py-3 font-interface text-xs font-bold text-[#425BBC] disabled:opacity-50">{busy === 'proof' ? 'Generando enlace seguro…' : '👁 Generar enlace seguro'}</button>}</section> : order.actionState === 'awaiting_proof' ? <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 font-interface text-xs text-amber-800">Todavía no se ha subido un comprobante para este pedido.</section> : null}

  {order.noteLink ? <a href={order.noteLink} target="_blank" rel="noreferrer" className="block rounded-2xl border border-[#e0e4f0] bg-white p-4 font-interface text-xs font-bold text-[#425BBC]">Abrir nota histórica original ↗</a> : null}
  {order.notes ? <section className="rounded-2xl border border-[#e0e4f0] bg-white p-4"><h3 className="font-title text-base text-[#2a4189]">Notas</h3><p className="mt-2 whitespace-pre-wrap font-interface text-xs leading-5 text-slate-500">{order.notes}</p></section> : null}
  {order.operationalNote ? <section className="rounded-2xl border border-[#e0e4f0] bg-white p-4"><h3 className="font-title text-base text-[#2a4189]">Nota operativa</h3><p className="mt-2 whitespace-pre-wrap font-interface text-xs leading-5 text-slate-500">{order.operationalNote}</p></section> : null}

  {order.statusGroup !== 'rejected' ? <button onClick={() => { try { openOrderReceipt(order); } catch (error) { window.alert(error instanceof Error ? error.message : 'No pudimos abrir el recibo.'); } }} className="w-full rounded-xl border border-[#b8c3e4] bg-[#eef1ff] px-4 py-3.5 font-interface text-xs font-bold text-[#425BBC]">🧾 GENERAR RECIBO / NOTA</button> : null}
  {order.actionState === 'review' ? <div className="grid gap-2 sm:grid-cols-2"><button onClick={() => onValidate(order)} disabled={Boolean(busy)} className="rounded-xl bg-[#425BBC] px-4 py-3.5 font-interface text-xs font-bold text-white disabled:opacity-50">{busy === 'validate' ? 'Validando…' : '✓ VALIDAR PAGO'}</button><button onClick={() => onReject(order)} disabled={Boolean(busy)} className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3.5 font-interface text-xs font-bold text-rose-700 disabled:opacity-50">{busy === 'reject' ? 'Rechazando…' : '✕ RECHAZAR'}</button></div> : null}
  {order.actionState === 'paid' && order.wixOrderNumber ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><div className="font-title text-base text-emerald-800">✓ PAGADO · Wix #{order.wixOrderNumber}</div><p className="mt-1 font-interface text-xs text-emerald-700">El pedido ya fue formalizado y registrado como pagado.</p></div> : null}
  {(order.canDelete || (order.statusGroup === 'rejected' && order.sourceType === 'LOCAL_SPEI')) ? <button onClick={() => onDelete(order)} disabled={Boolean(busy)} className="w-full rounded-xl border border-rose-200 bg-white px-4 py-3 font-interface text-xs font-bold text-rose-600 disabled:opacity-50">{busy === 'delete' ? 'Eliminando…' : '🗑 Eliminar pedido del historial'}</button> : null}
  </div></aside></div>;
}

export default function GuaurritasControl() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [bootstrap, setBootstrap] = useState<Bootstrap | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [list, setList] = useState<OrderList>({ orders: [], page: 0, pageSize: 50, hasNext: false, totalCount: 0 });
  const [upcoming, setUpcoming] = useState<ControlOrder[]>([]);
  const [nav, setNav] = useState<Nav>('dashboard');
  const [mode, setMode] = useState<Mode>('all');
  const [period, setPeriod] = useState<Period>({ year: 0, month: 0, day: 0 });
  const [periodInitialized, setPeriodInitialized] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [detail, setDetail] = useState<ControlOrder | null>(null);
  const [proofReady, setProofReady] = useState<ProofReady>(null);
  const [loading, setLoading] = useState(false);
  const [detailBusy, setDetailBusy] = useState('');
  const [error, setError] = useState('');
  const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({});
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});

  const logout = useCallback(() => { sessionStorage.removeItem(SESSION_KEY); setPassword(''); setAuthenticated(false); setBootstrap(null); setDashboard(null); setDetail(null); setProofReady(null); }, []);
  const handleApiError = useCallback((apiError: unknown) => { const typed = apiError as Error & { status?: number }; if (typed?.status === 403) { logout(); return 'La sesión dejó de ser válida. Vuelve a ingresar la clave.'; } return typed?.message || 'Ocurrió un error en Guaurritas Control.'; }, [logout]);

  const loadBootstrap = useCallback(async (secret: string) => {
    const data = await panelApi<Bootstrap>(secret, 'bootstrap'); setBootstrap(data);
    const [year, month] = data.today.split('-').map(Number);
    setExpandedYears((c) => ({ ...c, [String(year)]: true })); setExpandedMonths((c) => ({ ...c, [`${year}-${String(month).padStart(2, '0')}`]: true }));
    if (!periodInitialized) { setPeriod({ year, month, day: 0 }); setPeriodInitialized(true); }
  }, [periodInitialized]);
  const loadDashboard = useCallback(async (secret: string, p: Period) => setDashboard(await panelApi<DashboardData>(secret, 'dashboard', p)), []);
  const loadOrders = useCallback(async (secret: string, nextMode: Mode, p: Period, nextSearch: string, nextPage: number) => { setLoading(true); setError(''); try { setList(await panelApi<OrderList>(secret, 'list', { mode: nextMode, ...p, search: nextSearch, page: nextPage })); } catch (err) { setError(handleApiError(err)); } finally { setLoading(false); } }, [handleApiError]);
  const loadUpcoming = useCallback(async (secret: string) => { try { setUpcoming(await panelApi<ControlOrder[]>(secret, 'upcoming', { limit: 150 })); } catch (err) { setError(handleApiError(err)); } }, [handleApiError]);

  async function login(secret: string) { await panelApi<{ authenticated: boolean }>(secret, 'verify'); sessionStorage.setItem(SESSION_KEY, secret); setPassword(secret); setAuthenticated(true); }

  useEffect(() => { const saved = sessionStorage.getItem(SESSION_KEY) || ''; if (!saved) { setCheckingSession(false); return; } panelApi<{ authenticated: boolean }>(saved, 'verify').then(() => { setPassword(saved); setAuthenticated(true); }).catch(() => sessionStorage.removeItem(SESSION_KEY)).finally(() => setCheckingSession(false)); }, []);
  useEffect(() => { if (!authenticated || !password) return; setCheckingSession(false); loadBootstrap(password).catch((err) => setError(handleApiError(err))); loadUpcoming(password); }, [authenticated, password, loadBootstrap, loadUpcoming, handleApiError]);
  useEffect(() => { const timer = window.setTimeout(() => { setSearch(searchInput.trim()); setPage(0); }, 260); return () => window.clearTimeout(timer); }, [searchInput]);
  useEffect(() => { if (!authenticated || !password || !periodInitialized) return; loadDashboard(password, period).catch((err) => setError(handleApiError(err))); }, [authenticated, password, period, periodInitialized, loadDashboard, handleApiError]);
  useEffect(() => { if (!authenticated || !password || !periodInitialized) return; const effectiveMode: Mode = nav === 'spei' ? 'spei' : mode; loadOrders(password, effectiveMode, period, search, page); }, [authenticated, password, nav, mode, period, search, page, periodInitialized, loadOrders]);
  useEffect(() => { if (nav === 'agenda' && password) loadUpcoming(password); }, [nav, password, loadUpcoming]);

  const archiveTree = useMemo(() => {
    const tree = new Map<number, Map<number, ArchiveEntry[]>>();
    for (const entry of bootstrap?.archive || []) { const [year, month] = entry.dateKey.split('-').map(Number); if (!year || !month) continue; if (!tree.has(year)) tree.set(year, new Map()); const months = tree.get(year)!; if (!months.has(month)) months.set(month, []); months.get(month)!.push(entry); }
    return Array.from(tree.entries()).sort(([a], [b]) => b - a).map(([year, months]) => ({ year, months: Array.from(months.entries()).sort(([a], [b]) => b - a).map(([month, days]) => ({ month, days: [...days].sort((a, b) => b.dateKey.localeCompare(a.dateKey)) })) }));
  }, [bootstrap]);
  const years = useMemo(() => archiveTree.map((e) => e.year), [archiveTree]);
  const months = useMemo(() => period.year ? archiveTree.find((e) => e.year === period.year)?.months.map((e) => e.month) || [] : [], [archiveTree, period.year]);
  const days = useMemo(() => { if (!period.year || !period.month) return []; return archiveTree.find((e) => e.year === period.year)?.months.find((e) => e.month === period.month)?.days.map((e) => Number(e.dateKey.split('-')[2])) || []; }, [archiveTree, period.year, period.month]);

  function setYear(year: number) { setPeriod({ year, month: 0, day: 0 }); setPage(0); }
  function setMonth(month: number) { setPeriod((c) => ({ ...c, month, day: 0 })); setPage(0); }
  function setDay(day: number) { setPeriod((c) => ({ ...c, day })); setPage(0); }
  function quickPeriod(kind: 'today' | 'month' | 'year' | 'all') { const [year, month, day] = (bootstrap?.today || '').split('-').map(Number); if (kind === 'today') setPeriod({ year, month, day }); if (kind === 'month') setPeriod({ year, month, day: 0 }); if (kind === 'year') setPeriod({ year, month: 0, day: 0 }); if (kind === 'all') setPeriod({ year: 0, month: 0, day: 0 }); setPage(0); }

  async function refreshAll(updated?: ControlOrder) { if (updated) setDetail(updated); await Promise.all([loadBootstrap(password), loadDashboard(password, period), loadOrders(password, nav === 'spei' ? 'spei' : mode, period, search, page), loadUpcoming(password)]); }
  async function openDetail(order: ControlOrder) { setProofReady(null); setDetail(order); setDetailBusy('get'); try { setDetail(await panelApi<ControlOrder>(password, 'get', { orderId: order.id })); } catch (err) { setError(handleApiError(err)); } finally { setDetailBusy(''); } }
  async function prepareProof(order: ControlOrder) { setDetailBusy('proof'); setError(''); setProofReady(null); try { const result = await panelApi<{ order: ControlOrder; url: string; expiresAt: string | null }>(password, 'proof', { orderId: order.id }); setDetail(result.order); if (!result.url) throw new Error('Wix no devolvió el enlace del comprobante.'); setProofReady({ orderId: order.id, url: result.url, expiresAt: result.expiresAt }); } catch (err) { setError(handleApiError(err)); } finally { setDetailBusy(''); } }
  async function validateOrder(order: ControlOrder) { if (!window.confirm(`¿Validar el pago de ${order.customerName || order.reference} por ${money(order.total, order.currency)}?`)) return; setDetailBusy('validate'); setError(''); try { const updated = await panelApi<ControlOrder>(password, 'validate', { orderId: order.id }); setProofReady(null); await refreshAll(updated); } catch (err) { setError(handleApiError(err)); } finally { setDetailBusy(''); } }
  async function rejectOrder(order: ControlOrder) { if (!window.confirm(`¿Rechazar el comprobante de ${order.customerName || order.reference}?`)) return; setDetailBusy('reject'); setError(''); try { const updated = await panelApi<ControlOrder>(password, 'reject', { orderId: order.id }); setProofReady(null); await refreshAll(updated); } catch (err) { setError(handleApiError(err)); } finally { setDetailBusy(''); } }
  async function saveSchedule(order: ControlOrder, draft: ScheduleDraft) { setDetailBusy('schedule'); setError(''); try { const updated = await panelApi<ControlOrder>(password, 'schedule', { orderId: order.id, ...draft }); await refreshAll(updated); } catch (err) { setError(handleApiError(err)); } finally { setDetailBusy(''); } }
  async function deletePending(order: ControlOrder) { const label = order.statusGroup === 'rejected' ? 'pedido rechazado' : 'pedido pendiente'; if (!window.confirm(`¿Eliminar definitivamente este ${label} (${order.reference}) del historial?\n\nEsta acción no se puede deshacer.`)) return; setDetailBusy('delete'); setError(''); try { await panelApi<{ deleted: boolean }>(password, 'delete', { orderId: order.id }); setDetail(null); setProofReady(null); await refreshAll(); } catch (err) { setError(handleApiError(err)); } finally { setDetailBusy(''); } }
  function selectArchiveDate(dateKey: string) { const [year, month, day] = dateKey.split('-').map(Number); setPeriod({ year, month, day }); setMode('all'); setNav('orders'); setPage(0); }

  if (checkingSession) return <main className="grid min-h-screen place-items-center bg-[#f4f6fb] font-interface text-sm text-[#425BBC]">Cargando Guaurritas Control…</main>;
  if (!authenticated) return <Login onLogin={login} />;

  const kpi = dashboard?.kpis;
  const periodLabel = period.day ? `${period.day} de ${MONTHS[period.month]} de ${period.year}` : period.month ? `${MONTHS[period.month]} ${period.year}` : period.year ? String(period.year) : 'Todo el histórico';
  const maxProductSales = Math.max(...(dashboard?.topProducts || []).map((p) => p.sales), 1);
  const maxClientSales = Math.max(...(dashboard?.topClients || []).map((c) => c.sales), 1);

  const PeriodControls = () => <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#e0e4f0] bg-white p-2 shadow-sm"><select value={period.year || ''} onChange={(e) => setYear(Number(e.target.value || 0))} className="h-10 min-w-[92px] rounded-xl border border-[#d8deec] bg-white px-3 font-interface text-xs text-slate-600 outline-none focus:border-[#425BBC]"><option value="">Todos los años</option>{years.map((year) => <option key={year} value={year}>{year}</option>)}</select><select value={period.month || ''} onChange={(e) => setMonth(Number(e.target.value || 0))} disabled={!period.year} className="h-10 min-w-[118px] rounded-xl border border-[#d8deec] bg-white px-3 font-interface text-xs text-slate-600 outline-none disabled:opacity-45"><option value="">Todos los meses</option>{months.map((month) => <option key={month} value={month}>{MONTHS[month]}</option>)}</select><select value={period.day || ''} onChange={(e) => setDay(Number(e.target.value || 0))} disabled={!period.month} className="h-10 min-w-[102px] rounded-xl border border-[#d8deec] bg-white px-3 font-interface text-xs text-slate-600 outline-none disabled:opacity-45"><option value="">Todos los días</option>{days.map((day) => <option key={day} value={day}>{String(day).padStart(2, '0')}</option>)}</select><div className="flex gap-1 rounded-xl bg-[#f3f5fa] p-1"><button onClick={() => quickPeriod('today')} className="rounded-lg px-2.5 py-2 font-interface text-[10px] font-bold text-slate-500 hover:bg-white">Hoy</button><button onClick={() => quickPeriod('month')} className="rounded-lg px-2.5 py-2 font-interface text-[10px] font-bold text-slate-500 hover:bg-white">Este mes</button><button onClick={() => quickPeriod('year')} className="hidden rounded-lg px-2.5 py-2 font-interface text-[10px] font-bold text-slate-500 hover:bg-white sm:block">Este año</button><button onClick={() => quickPeriod('all')} className="rounded-lg px-2.5 py-2 font-interface text-[10px] font-bold text-slate-500 hover:bg-white">Todo</button></div></div>;

  const navItems: Array<[Nav, string, string]> = [['dashboard','⌂','Dashboard'],['orders','▣','Pedidos'],['spei','$','SPEI'],['agenda','◷','Agenda'],['archive','□','Archivo']];
  const DesktopSidebar = () => <aside className="hidden min-h-screen w-[230px] shrink-0 flex-col bg-[#344fae] px-4 py-6 text-white lg:flex"><div className="px-2"><div className="font-title text-xl tracking-[.08em]">GUAURRITAS</div><div className="mt-1 font-interface text-[10px] uppercase tracking-[.16em] text-blue-100">Control Center</div></div><nav className="mt-9 space-y-2">{navItems.map(([key, icon, label]) => <button key={key} onClick={() => { setNav(key); setPage(0); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 font-interface text-sm font-semibold transition ${nav === key ? 'bg-white/16 text-white shadow-inner' : 'text-blue-100 hover:bg-white/10'}`}><span className="w-5 text-center">{icon}</span>{label}{key === 'spei' && bootstrap?.counts.speiOpen ? <span className="ml-auto rounded-full bg-amber-300 px-2 py-0.5 text-[9px] font-bold text-amber-950">{bootstrap.counts.speiOpen}</span> : null}</button>)}</nav><div className="mt-auto space-y-2"><div className="rounded-xl bg-white/10 px-3 py-3 font-interface text-[10px] text-blue-100"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-300" />Sistema en línea</div><button onClick={logout} className="w-full rounded-xl px-3 py-3 text-left font-interface text-xs text-blue-100 hover:bg-white/10">↪ Cerrar sesión</button></div></aside>;
  const MobileHeader = () => <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#e4e7f0] bg-white/95 px-4 py-3 backdrop-blur lg:hidden"><div><div className="font-title text-sm tracking-[.07em] text-[#203676]">GUAURRITAS CONTROL</div><div className="font-interface text-[9px] uppercase text-slate-400">Pedidos & Ventas</div></div><button onClick={logout} className="rounded-lg bg-[#f1f3f9] px-3 py-2 font-interface text-[10px] font-bold text-slate-500">Salir</button></header>;

  const ArchiveTree = () => <div className="space-y-2">{archiveTree.map(({ year, months: monthEntries }) => { const yearKey = String(year), open = Boolean(expandedYears[yearKey]); return <div key={year} className="overflow-hidden rounded-xl border border-[#e0e4f0] bg-white"><button onClick={() => setExpandedYears((c) => ({ ...c, [yearKey]: !open }))} className="flex w-full items-center gap-2 px-3 py-3 text-left font-interface text-sm font-bold text-[#2a3f83]"><span>{open ? '📂' : '📁'}</span><span className="flex-1">{year}</span><span className="text-slate-400">{open ? '▾' : '▸'}</span></button>{open ? <div className="border-t border-[#edf0f6] bg-[#f9faff] p-2">{monthEntries.map(({ month, days: dayEntries }) => { const key = `${year}-${String(month).padStart(2, '0')}`, monthOpen = Boolean(expandedMonths[key]); return <div key={key}><button onClick={() => setExpandedMonths((c) => ({ ...c, [key]: !monthOpen }))} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 font-interface text-xs font-semibold text-slate-600 hover:bg-white"><span>{monthOpen ? '📂' : '📁'}</span><span className="flex-1 text-left">{MONTHS[month]}</span><span>{dayEntries.reduce((sum, item) => sum + item.total, 0)}</span><span>{monthOpen ? '▾' : '▸'}</span></button>{monthOpen ? <div className="ml-4 border-l border-[#dce2f2] pl-2">{dayEntries.map((entry) => <button key={entry.dateKey} onClick={() => selectArchiveDate(entry.dateKey)} className="my-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left font-interface text-xs text-slate-600 hover:bg-white"><span>📄</span><span className="flex-1">Día {entry.dateKey.split('-')[2]}</span>{entry.pending ? <span>● {entry.pending}</span> : null}<span>{entry.total}</span></button>)}</div> : null}</div>; })}</div> : null}</div>; })}</div>;

  return <main className="min-h-screen bg-[#f4f5f9] text-[#172044]"><div className="flex min-h-screen"><DesktopSidebar /><div className="min-w-0 flex-1 pb-24 lg:pb-0"><MobileHeader /><div className="mx-auto max-w-[1500px] p-3 sm:p-5 lg:p-7">{error ? <div className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 font-interface text-sm text-rose-700"><span>{error}</span><button onClick={() => setError('')} className="font-bold">×</button></div> : null}

  {nav === 'dashboard' ? <><div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><div className="font-interface text-xs font-semibold text-slate-400">Resumen general del negocio</div><h1 className="mt-1 font-title text-2xl text-[#1d3378] sm:text-3xl">Guaurritas Control</h1><div className="mt-1 font-interface text-xs text-slate-400">{periodLabel}</div></div><PeriodControls /></div><div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-6"><KpiCard label="Ventas" value={money(kpi?.sales || 0)} note="solo ventas pagadas" /><KpiCard label="Pedidos" value={String(kpi?.orders || 0)} note={`${kpi?.productsSold || 0} unidades vendidas`} /><KpiCard label="Ticket promedio" value={money(kpi?.ticketAverage || 0)} note={`${kpi?.uniqueClients || 0} clientes`} /><KpiCard label="Pagados" value={String(kpi?.paid || 0)} note={`${money(kpi?.paidAmount || 0)} registrado`} tone="green" /><KpiCard label="SPEI abiertos" value={String((kpi?.speiPending || 0) + (kpi?.needsReview || 0))} note={`${kpi?.needsReview || 0} con comprobante por revisar`} tone="amber" /><KpiCard label="Rechazados" value={String(kpi?.rejected || 0)} note={`${kpi?.quoted || 0} cotizados fuera de ventas`} tone="rose" /></div>

  <div className="mt-4 grid gap-4 xl:grid-cols-[1.45fr_.8fr_.9fr]"><section className="rounded-2xl border border-[#e0e4f0] bg-white p-4 shadow-sm"><h2 className="font-title text-xl text-[#25418e]">Ventas en el tiempo</h2><p className="font-interface text-xs text-slate-400">Ventas pagadas del periodo</p><LineChart data={dashboard?.salesTrend || []} /></section><section className="rounded-2xl border border-[#e0e4f0] bg-white p-4 shadow-sm"><h2 className="font-title text-xl text-[#25418e]">Pedidos por estado</h2>{dashboard ? <Donut data={dashboard.statusBreakdown} /> : null}</section><section className="rounded-2xl border border-[#e0e4f0] bg-white p-4 shadow-sm"><h2 className="font-title text-xl text-[#25418e]">Ventas por origen</h2><p className="font-interface text-xs text-slate-400">León y nacional</p><Bars data={dashboard?.byRegion || []} /></section></div>

  <section className={`mt-4 rounded-2xl border p-4 ${((kpi?.needsReview || 0) + (kpi?.speiPending || 0)) ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className={`font-title text-xl ${((kpi?.needsReview || 0) + (kpi?.speiPending || 0)) ? 'text-amber-800' : 'text-emerald-800'}`}>{((kpi?.needsReview || 0) + (kpi?.speiPending || 0)) ? 'SPEI en seguimiento' : '✓ Todo al día'}</h2><p className={`mt-1 font-interface text-xs ${((kpi?.needsReview || 0) + (kpi?.speiPending || 0)) ? 'text-amber-700' : 'text-emerald-700'}`}>{kpi?.needsReview ? `${kpi.needsReview} comprobante(s) necesitan validación.` : kpi?.speiPending ? `${kpi.speiPending} pedido(s) están esperando comprobante.` : 'No hay comprobantes pendientes de revisión en este periodo.'}</p></div>{((kpi?.needsReview || 0) + (kpi?.speiPending || 0)) ? <button onClick={() => { setNav('spei'); setPage(0); }} className="rounded-xl bg-amber-600 px-4 py-2.5 font-interface text-xs font-bold text-white">IR A VALIDAR SPEI</button> : null}</div></section>

  <div className="mt-4 grid gap-4 xl:grid-cols-2"><section className="rounded-2xl border border-[#e0e4f0] bg-white p-4 shadow-sm"><div className="flex items-end justify-between gap-3"><div><h2 className="font-title text-xl text-[#25418e]">Próximos pedidos</h2><p className="font-interface text-xs text-slate-400">Agenda operativa de entregas</p></div><button onClick={() => setNav('agenda')} className="font-interface text-[11px] font-bold text-[#425BBC]">Ver agenda →</button></div><div className="mt-4 space-y-2">{(dashboard?.upcomingOrders || []).slice(0, 5).map((order) => <button key={order.id} onClick={() => openDetail(order)} className="flex w-full items-center gap-3 rounded-xl bg-[#f8f9fc] p-3 text-left"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eef1ff] font-title text-sm text-[#425BBC]">{dateInput(order.scheduledAt).slice(-2) || '—'}</div><div className="min-w-0 flex-1"><div className="truncate font-interface text-xs font-bold text-slate-700">{order.customerName || order.reference}</div><div className="truncate font-interface text-[10px] text-slate-400">{productSummary(order)}</div></div><div className="text-right font-interface text-[10px] text-slate-500"><div>{order.deliveryTime || 'Hora por definir'}</div><div className="text-[#425BBC]">{compactDate(order.scheduledAt)}</div></div></button>)}{!(dashboard?.upcomingOrders || []).length ? <div className="py-8 text-center font-interface text-xs text-slate-400">No hay entregas próximas en este periodo.</div> : null}</div></section><section className="rounded-2xl border border-[#e0e4f0] bg-white p-4 shadow-sm"><h2 className="font-title text-xl text-[#25418e]">Top clientes</h2><p className="font-interface text-xs text-slate-400">Quienes más compran en el periodo</p><div className="mt-4 space-y-3">{(dashboard?.topClients || []).map((client, index) => <div key={`${client.name}-${index}`}><div className="mb-1 flex items-center gap-3 font-interface"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#eef1ff] text-[10px] font-bold text-[#425BBC]">{index + 1}</span><div className="min-w-0 flex-1"><div className="truncate text-xs font-bold text-slate-700">{client.name}</div><div className="text-[9px] text-slate-400">{client.orders} pedidos · ticket {money(client.ticketAverage)} · última {compactDate(client.lastOrderDate)}</div></div><div className="text-xs font-bold text-[#425BBC]">{money(client.sales)}</div></div><div className="ml-10 h-1.5 overflow-hidden rounded-full bg-[#edf0f7]"><div className="h-full rounded-full bg-[#6277c4]" style={{ width: `${Math.max(5, (client.sales / maxClientSales) * 100)}%` }} /></div></div>)}{!(dashboard?.topClients || []).length ? <div className="py-8 text-center font-interface text-xs text-slate-400">Sin clientes con ventas pagadas en este periodo.</div> : null}</div></section></div>

  <div className="mt-4 grid gap-4 xl:grid-cols-2"><section className="rounded-2xl border border-[#e0e4f0] bg-white p-4 shadow-sm"><h2 className="font-title text-xl text-[#25418e]">Top productos</h2><p className="font-interface text-xs text-slate-400">Por ventas pagadas en el periodo</p><div className="mt-4 space-y-3">{(dashboard?.topProducts || []).map((product) => <div key={product.name}><div className="mb-1 flex justify-between gap-3 font-interface text-xs"><span className="truncate font-semibold text-slate-600">{product.name}</span><span className="shrink-0 text-slate-400">{money(product.sales)} · {product.units}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-[#edf0f7]"><div className="h-full rounded-full bg-[#4d67c9]" style={{ width: `${Math.max(5, (product.sales / maxProductSales) * 100)}%` }} /></div></div>)}</div></section><section className="rounded-2xl border border-[#e0e4f0] bg-white p-4 shadow-sm"><h2 className="font-title text-xl text-[#25418e]">Últimos pedidos</h2><p className="font-interface text-xs text-slate-400">Actividad más reciente</p><div className="mt-4 grid gap-2">{(dashboard?.recentOrders || []).slice(0, 5).map((order) => <OrderCard key={order.id} order={order} onOpen={openDetail} />)}</div></section></div></> : null}

  {nav === 'orders' ? <><div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><div className="font-interface text-xs font-semibold text-slate-400">Centro de pedidos</div><h1 className="mt-1 font-title text-2xl text-[#1d3378] sm:text-3xl">Pedidos</h1><div className="mt-1 font-interface text-xs text-slate-400">{periodLabel}</div></div><PeriodControls /></div><div className="rounded-2xl border border-[#e0e4f0] bg-white p-3 shadow-sm"><input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Buscar pedido, cliente, referencia, teléfono, email o producto" className="h-12 w-full rounded-xl border border-[#d8deec] bg-[#fafbfe] px-4 font-interface text-sm text-slate-700 outline-none focus:border-[#425BBC]" /><div className="mt-3 flex gap-2 overflow-x-auto pb-1">{([['all','Todos'],['pending','Pendientes'],['paid','Pagados'],['rejected','Rechazados'],['quoted','Cotizados'],['tests','Pruebas']] as Array<[Mode,string]>).map(([key,label]) => <button key={key} onClick={() => { setMode(key); setPage(0); }} className={`shrink-0 rounded-xl px-4 py-2.5 font-interface text-[10px] font-bold uppercase ${mode === key ? 'bg-[#425BBC] text-white' : 'bg-[#f1f3f8] text-slate-500'}`}>{label}</button>)}</div></div><div className="mt-4 grid gap-3 xl:grid-cols-2">{loading ? <div className="col-span-full py-12 text-center font-interface text-sm text-slate-400">Cargando pedidos…</div> : list.orders.map((order) => <OrderCard key={order.id} order={order} onOpen={openDetail} />)}</div>{!loading && !list.orders.length ? <div className="mt-4 rounded-2xl border border-[#e0e4f0] bg-white py-12 text-center font-interface text-sm text-slate-400">No encontramos pedidos con estos filtros.</div> : null}<div className="mt-5 flex items-center justify-center gap-3 font-interface text-xs text-slate-500"><button disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} className="rounded-xl border border-[#d9deec] bg-white px-4 py-2 disabled:opacity-35">← Anterior</button><span>Página {page + 1}</span><button disabled={!list.hasNext} onClick={() => setPage((p) => p + 1)} className="rounded-xl border border-[#d9deec] bg-white px-4 py-2 disabled:opacity-35">Siguiente →</button></div></> : null}

  {nav === 'spei' ? <><div className="mb-5"><div className="font-interface text-xs font-semibold text-amber-600">Pagos manuales</div><h1 className="mt-1 font-title text-2xl text-[#1d3378] sm:text-3xl">Validar pagos SPEI</h1><p className="mt-1 font-interface text-xs text-slate-400">Comprobantes recibidos y transferencias que siguen esperando evidencia.</p></div><div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4"><div className="font-title text-lg text-amber-800">{bootstrap?.counts.speiOpen || 0} SPEI abiertos</div><p className="mt-1 font-interface text-xs text-amber-700">Los pedidos con comprobante muestran acciones de validar/rechazar; los demás siguen en espera.</p></div><div className="grid gap-3 xl:grid-cols-2">{loading ? <div className="col-span-full py-12 text-center font-interface text-sm text-slate-400">Cargando SPEI…</div> : list.orders.map((order) => <OrderCard key={order.id} order={order} onOpen={openDetail} />)}</div>{!loading && !list.orders.length ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center font-interface text-sm text-emerald-700">✓ No hay pagos SPEI abiertos.</div> : null}</> : null}

  {nav === 'agenda' ? <><div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><div className="font-interface text-xs font-semibold text-slate-400">Operación y entregas</div><h1 className="mt-1 font-title text-2xl text-[#1d3378] sm:text-3xl">Próximos pedidos</h1><p className="mt-1 font-interface text-xs text-slate-400">Abre cualquier pedido para registrar o modificar fecha, hora y punto de entrega.</p></div><button onClick={() => loadUpcoming(password)} className="rounded-xl border border-[#cbd3e8] bg-white px-4 py-2.5 font-interface text-xs font-bold text-[#425BBC]">↻ Actualizar</button></div><div className="space-y-5">{Array.from(new Set(upcoming.map((o) => dateInput(o.scheduledAt)))).filter(Boolean).map((dateKey) => { const orders = upcoming.filter((o) => dateInput(o.scheduledAt) === dateKey); return <section key={dateKey}><div className="mb-2 flex items-center gap-2"><div className="font-title text-lg text-[#28438d]">{agendaDayLabel(orders[0]?.scheduledAt || null, bootstrap?.today || '')}</div><span className="rounded-full bg-[#e9edfa] px-2 py-1 font-interface text-[9px] font-bold text-[#52659f]">{orders.length}</span></div><div className="grid gap-3 xl:grid-cols-2">{orders.map((order) => <OrderCard key={order.id} order={order} onOpen={openDetail} agenda />)}</div></section>; })}{!upcoming.length ? <div className="rounded-2xl border border-[#e0e4f0] bg-white py-14 text-center font-interface text-sm text-slate-400">No hay próximos pedidos con fecha registrada.</div> : null}</div></> : null}

  {nav === 'archive' ? <><div className="mb-5"><div className="font-interface text-xs font-semibold text-slate-400">Histórico organizado</div><h1 className="mt-1 font-title text-2xl text-[#1d3378] sm:text-3xl">Archivo</h1><p className="mt-1 font-interface text-xs text-slate-400">Año → mes → día. Toca un día para abrir sus pedidos.</p></div><div className="max-w-3xl"><ArchiveTree /></div></> : null}
  </div>

  <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-[22px] border border-[#dbe1ef] bg-white/95 p-1.5 shadow-[0_16px_50px_rgba(23,35,75,.2)] backdrop-blur lg:hidden">{navItems.map(([key, icon, label]) => <button key={key} onClick={() => { setNav(key); setPage(0); }} className={`relative flex min-w-0 flex-col items-center gap-1 rounded-[16px] px-1 py-2.5 font-interface text-[9px] font-bold ${nav === key ? 'bg-[#eef1ff] text-[#425BBC]' : 'text-slate-400'}`}><span className="text-sm">{icon}</span><span className="truncate">{label}</span>{key === 'spei' && bootstrap?.counts.speiOpen ? <span className="absolute right-2 top-1 h-2 w-2 rounded-full bg-amber-400" /> : null}</button>)}</nav>
  </div></div>
  {detail ? <DetailPanel order={detail} proofReady={proofReady} busy={detailBusy} todayKey={bootstrap?.today || ''} onClose={() => { setDetail(null); setProofReady(null); }} onProof={prepareProof} onValidate={validateOrder} onReject={rejectOrder} onSchedule={saveSchedule} onDelete={deletePending} /> : null}
  </main>;
}
