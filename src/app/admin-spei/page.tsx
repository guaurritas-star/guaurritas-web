'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

const API_URL = 'https://www.guaurritas.com/_functions/speiAdmin';
const SESSION_KEY = 'guaurritas-spei-admin-session';

const MONTHS = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

type Nav = 'dashboard' | 'orders' | 'archive';
type Mode = 'all' | 'today' | 'pending' | 'paid' | 'rejected' | 'quoted' | 'tests';

type OrderLine = {
  name: string;
  category: string;
  detail: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  personalization: string;
};

type ControlOrder = {
  id: string;
  reference: string;
  sourceType: string;
  sourceOrderId: string;
  localOrderId: string;
  status: string;
  statusGroup: 'pending' | 'paid' | 'rejected' | 'quoted' | 'expired';
  actionState: 'readonly' | 'review' | 'validating' | 'paid' | 'rejected' | 'awaiting_proof' | 'expired';
  paymentStatus: string;
  orderStatus: string;
  total: number;
  paidAmount: number;
  pendingAmount: number;
  currency: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  instagram: string;
  address: string;
  channel: string;
  customerType: string;
  region: string;
  paymentMethod: string;
  notes: string;
  personalization: string;
  noteLink: string;
  wixOrderId: string;
  wixOrderNumber: string;
  orderDate: string | null;
  deliveryDate: string | null;
  adminDateKey: string;
  adminYear: number;
  adminMonth: number;
  adminDay: number;
  isTest: boolean;
  hasProof: boolean;
  proofFileName: string;
  productUnits: number;
  lines: OrderLine[];
};

type ArchiveEntry = {
  dateKey: string;
  total: number;
  pending: number;
  paid: number;
  rejected: number;
  quoted?: number;
  expired: number;
};

type Bootstrap = {
  today: string;
  counts: {
    all: number;
    pending: number;
    paid: number;
    rejected: number;
    quoted: number;
    expired: number;
    tests: number;
    review: number;
  };
  archive: ArchiveEntry[];
};

type OrderList = {
  orders: ControlOrder[];
  page: number;
  pageSize: number;
  hasNext: boolean;
  totalCount: number;
};

type DashboardData = {
  period: { year: number; month: number; day: number };
  kpis: {
    sales: number;
    orders: number;
    ticketAverage: number;
    productsSold: number;
    uniqueClients: number;
    paid: number;
    needsReview: number;
    rejected: number;
    quoted: number;
    paidAmount: number;
    pendingAmount: number;
  };
  statusBreakdown: {
    paid: number;
    review: number;
    rejected: number;
    pending: number;
    quoted: number;
  };
  salesTrend: Array<{ label: string; value: number }>;
  byRegion: Array<{ key: string; sales: number; orders: number }>;
  byPayment: Array<{ key: string; sales: number; orders: number }>;
  topProducts: Array<{ name: string; units: number; sales: number }>;
  attentionOrders: ControlOrder[];
  recentOrders: ControlOrder[];
};

type ApiEnvelope<T> = { ok: boolean; data?: T; error?: string };

type Period = { year: number; month: number; day: number };

type ProofReady = { orderId: string; url: string; expiresAt: string | null } | null;

function money(value: number, currency = 'MXN') {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: currency || 'MXN', maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function compactDate(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Mexico_City',
  }).format(date);
}

function dateTime(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Mexico_City',
  }).format(date);
}

function archiveDate(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  if (!year || !month || !day) return dateKey || 'Sin fecha';
  return `${String(day).padStart(2, '0')} de ${MONTHS[month].toLowerCase()} de ${year}`;
}

function sourceLabel(value: string) {
  const map: Record<string, string> = {
    HISTORICAL_SHEET: 'Histórico', LOCAL_SPEI: 'Web Guaurritas', ONLINE_WIX: 'Online Wix',
  };
  return map[value] || value || 'Sin origen';
}

function regionLabel(value: string) {
  const map: Record<string, string> = { LEON: 'León', NACIONAL: 'Nacional', UNKNOWN: 'Sin clasificar' };
  return map[value] || value || 'Sin clasificar';
}

function paymentLabel(value: string) {
  const map: Record<string, string> = {
    SPEI: 'SPEI', ONLINE: 'Online', HISTORICAL: 'Histórico', UNKNOWN: 'Sin registrar',
  };
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

async function panelApi<T>(password: string, action: string, payload: Record<string, unknown> = {}) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({ password, action, ...payload }),
  });
  let result: ApiEnvelope<T>;
  try {
    result = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new Error('Wix respondió sin datos legibles.');
  }
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
    event.preventDefault();
    if (!password.trim() || busy) return;
    setBusy(true);
    setError('');
    try { await onLogin(password.trim()); }
    catch (loginError) { setError(loginError instanceof Error ? loginError.message : 'No pudimos entrar al panel.'); }
    finally { setBusy(false); }
  }

  return (
    <main className="min-h-screen bg-[#f3f5fb] px-5 py-10 text-[#172044]">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center">
        <form onSubmit={submit} className="w-full overflow-hidden rounded-[28px] border border-[#d9dff0] bg-white shadow-[0_24px_80px_rgba(42,57,112,.16)]">
          <div className="bg-[#425BBC] px-7 py-7 text-white">
            <div className="font-title text-2xl tracking-[.08em]">GUAURRITAS</div>
            <div className="mt-1 font-interface text-xs uppercase tracking-[.18em] text-blue-100">Control · Pedidos & Ventas</div>
          </div>
          <div className="space-y-5 p-7">
            <div>
              <h1 className="font-title text-2xl text-[#1f3479]">Acceso administrativo</h1>
              <p className="mt-2 font-interface text-sm leading-6 text-slate-500">Pedidos, ventas y comprobantes privados de Guaurritas.</p>
            </div>
            <label className="block">
              <span className="mb-2 block font-interface text-xs font-bold uppercase tracking-[.12em] text-slate-500">Clave de acceso</span>
              <input autoFocus type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="h-12 w-full rounded-xl border border-[#cbd3e9] bg-[#f8f9fd] px-4 font-interface outline-none transition focus:border-[#425BBC] focus:ring-4 focus:ring-[#425BBC]/10" placeholder="••••••••••••" />
            </label>
            {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 font-interface text-sm text-rose-700">{error}</div> : null}
            <button type="submit" disabled={busy || !password.trim()} className="h-12 w-full rounded-xl bg-[#425BBC] font-title text-sm tracking-[.08em] text-white shadow-lg shadow-[#425BBC]/20 disabled:opacity-50">
              {busy ? 'COMPROBANDO…' : 'ENTRAR A GUAURRITAS CONTROL'}
            </button>
            <p className="text-center font-interface text-[11px] leading-5 text-slate-400">La clave se conserva solo durante esta sesión del navegador.</p>
          </div>
        </form>
      </div>
    </main>
  );
}

function StatusPill({ order }: { order: ControlOrder }) {
  const info = statusInfo(order);
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-interface text-[10px] font-bold uppercase tracking-[.05em] ${info.cls}`}><span className={`h-1.5 w-1.5 rounded-full ${info.dot}`} />{info.label}</span>;
}

function KpiCard({ label, value, note, tone = 'blue' }: { label: string; value: string; note: string; tone?: 'blue' | 'green' | 'amber' | 'rose' }) {
  const accents = { blue: 'bg-[#eef1ff] text-[#425BBC]', green: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600', rose: 'bg-rose-50 text-rose-600' };
  return (
    <div className="rounded-2xl border border-[#e0e4f0] bg-white p-4 shadow-[0_8px_26px_rgba(35,50,100,.06)] sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="font-interface text-[10px] font-bold uppercase tracking-[.1em] text-slate-500">{label}</div>
        <span className={`grid h-7 w-7 place-items-center rounded-lg text-xs ${accents[tone]}`}>●</span>
      </div>
      <div className="mt-3 font-title text-2xl text-[#182a67] sm:text-[28px]">{value}</div>
      <div className="mt-1 font-interface text-[11px] text-slate-400">{note}</div>
    </div>
  );
}

function LineChart({ data }: { data: Array<{ label: string; value: number }> }) {
  if (!data.length) return <div className="grid h-52 place-items-center font-interface text-sm text-slate-400">Todavía no hay ventas en este periodo.</div>;
  const width = 700;
  const height = 220;
  const padX = 26;
  const padY = 24;
  const max = Math.max(...data.map((item) => item.value), 1);
  const points = data.map((item, index) => {
    const x = data.length === 1 ? width / 2 : padX + (index / (data.length - 1)) * (width - padX * 2);
    const y = height - padY - (item.value / max) * (height - padY * 2);
    return { x, y, ...item };
  });
  const path = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-52 w-full overflow-visible" role="img" aria-label="Ventas en el periodo">
        {[0.25, 0.5, 0.75].map((ratio) => <line key={ratio} x1={padX} x2={width - padX} y1={height * ratio} y2={height * ratio} stroke="#e8ebf4" strokeWidth="1" />)}
        <path d={path} fill="none" stroke="#425BBC" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point) => <circle key={`${point.label}-${point.x}`} cx={point.x} cy={point.y} r="5" fill="white" stroke="#425BBC" strokeWidth="3" />)}
      </svg>
      <div className="mt-1 flex justify-between gap-2 overflow-hidden font-interface text-[9px] text-slate-400">
        <span>{data[0]?.label}</span><span>{data[Math.floor((data.length - 1) / 2)]?.label}</span><span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}

function Donut({ data }: { data: DashboardData['statusBreakdown'] }) {
  const values = [data.paid, data.review, data.rejected, data.pending, data.quoted];
  const total = Math.max(values.reduce((a, b) => a + b, 0), 1);
  const paidEnd = (data.paid / total) * 100;
  const reviewEnd = paidEnd + (data.review / total) * 100;
  const rejectedEnd = reviewEnd + (data.rejected / total) * 100;
  const pendingEnd = rejectedEnd + (data.pending / total) * 100;
  const background = `conic-gradient(#22c55e 0 ${paidEnd}%, #f59e0b ${paidEnd}% ${reviewEnd}%, #f87171 ${reviewEnd}% ${rejectedEnd}%, #94a3b8 ${rejectedEnd}% ${pendingEnd}%, #a78bfa ${pendingEnd}% 100%)`;
  return (
    <div className="flex items-center gap-5 py-3">
      <div className="relative h-32 w-32 shrink-0 rounded-full" style={{ background }}><div className="absolute inset-[18px] grid place-items-center rounded-full bg-white"><div className="text-center"><div className="font-title text-2xl text-[#1f3479]">{values.reduce((a, b) => a + b, 0)}</div><div className="font-interface text-[9px] uppercase text-slate-400">pedidos</div></div></div></div>
      <div className="min-w-0 space-y-2 font-interface text-xs text-slate-600">
        <div><span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-500" />Pagados <b>{data.paid}</b></div>
        <div><span className="mr-2 inline-block h-2 w-2 rounded-full bg-amber-400" />Por revisar <b>{data.review}</b></div>
        <div><span className="mr-2 inline-block h-2 w-2 rounded-full bg-rose-400" />Rechazados <b>{data.rejected}</b></div>
        <div><span className="mr-2 inline-block h-2 w-2 rounded-full bg-slate-400" />Pendientes <b>{data.pending}</b></div>
        {data.quoted ? <div><span className="mr-2 inline-block h-2 w-2 rounded-full bg-violet-400" />Cotizados <b>{data.quoted}</b></div> : null}
      </div>
    </div>
  );
}

function Bars({ data }: { data: Array<{ key: string; sales: number; orders: number }> }) {
  const max = Math.max(...data.map((item) => item.sales), 1);
  if (!data.length) return <div className="py-10 text-center font-interface text-sm text-slate-400">Sin datos para este periodo.</div>;
  return <div className="space-y-4 py-2">{data.slice(0, 5).map((item) => <div key={item.key}><div className="mb-1 flex justify-between gap-3 font-interface text-xs"><span className="font-semibold text-slate-600">{regionLabel(item.key)}</span><span className="text-slate-400">{money(item.sales)} · {item.orders}</span></div><div className="h-2 overflow-hidden rounded-full bg-[#edf0f7]"><div className="h-full rounded-full bg-[#6277c4]" style={{ width: `${Math.max(6, (item.sales / max) * 100)}%` }} /></div></div>)}</div>;
}

function OrderCard({ order, onOpen }: { order: ControlOrder; onOpen: (order: ControlOrder) => void }) {
  return (
    <button type="button" onClick={() => onOpen(order)} className="w-full rounded-2xl border border-[#e0e4f0] bg-white p-4 text-left shadow-[0_7px_22px_rgba(34,49,100,.05)] transition hover:border-[#9ca9d7] hover:shadow-[0_10px_28px_rgba(34,49,100,.09)]">
      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><StatusPill order={order} /><div className="mt-2 truncate font-title text-base text-[#203676]">{order.customerName || order.reference}</div><div className="mt-1 truncate font-interface text-[11px] text-slate-400">{order.wixOrderNumber ? `#${order.wixOrderNumber} · ` : ''}{order.reference}</div></div><div className="shrink-0 text-right"><div className="font-title text-lg text-[#203676]">{money(order.total, order.currency)}</div><div className="mt-1 font-interface text-[10px] text-slate-400">{archiveDate(order.adminDateKey)}</div></div></div>
      <div className="mt-3 line-clamp-2 font-interface text-xs leading-5 text-slate-500">{productSummary(order)}</div>
      <div className="mt-3 flex flex-wrap gap-1.5"><span className="rounded-full bg-[#f0f3fb] px-2 py-1 font-interface text-[9px] font-bold uppercase text-[#53659e]">{paymentLabel(order.paymentMethod)}</span><span className="rounded-full bg-[#f0f3fb] px-2 py-1 font-interface text-[9px] font-bold uppercase text-[#53659e]">{regionLabel(order.region)}</span><span className="rounded-full bg-[#f0f3fb] px-2 py-1 font-interface text-[9px] font-bold uppercase text-[#53659e]">{sourceLabel(order.sourceType)}</span></div>
    </button>
  );
}

export default function GuaurritasControlPage() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [bootstrap, setBootstrap] = useState<Bootstrap | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [list, setList] = useState<OrderList>({ orders: [], page: 0, pageSize: 50, hasNext: false, totalCount: 0 });
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

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setPassword(''); setAuthenticated(false); setBootstrap(null); setDashboard(null); setDetail(null); setProofReady(null);
  }, []);

  const handleApiError = useCallback((apiError: unknown) => {
    const typed = apiError as Error & { status?: number };
    if (typed?.status === 403) { logout(); return 'La sesión dejó de ser válida. Vuelve a ingresar la clave.'; }
    return typed?.message || 'Ocurrió un error en Guaurritas Control.';
  }, [logout]);

  const loadBootstrap = useCallback(async (secret: string) => {
    const data = await panelApi<Bootstrap>(secret, 'bootstrap');
    setBootstrap(data);
    const [year, month] = data.today.split('-').map(Number);
    setExpandedYears((current) => ({ ...current, [String(year)]: true }));
    setExpandedMonths((current) => ({ ...current, [`${year}-${String(month).padStart(2, '0')}`]: true }));
    if (!periodInitialized) {
      setPeriod({ year, month, day: 0 });
      setPeriodInitialized(true);
    }
  }, [periodInitialized]);

  const loadDashboard = useCallback(async (secret: string, nextPeriod: Period) => {
    const data = await panelApi<DashboardData>(secret, 'dashboard', nextPeriod);
    setDashboard(data);
  }, []);

  const loadOrders = useCallback(async (secret: string, nextMode: Mode, nextPeriod: Period, nextSearch: string, nextPage: number) => {
    setLoading(true); setError('');
    try {
      const data = await panelApi<OrderList>(secret, 'list', { mode: nextMode, ...nextPeriod, search: nextSearch, page: nextPage });
      setList(data);
    } catch (apiError) { setError(handleApiError(apiError)); }
    finally { setLoading(false); }
  }, [handleApiError]);

  async function login(secret: string) {
    await panelApi<{ authenticated: boolean }>(secret, 'verify');
    sessionStorage.setItem(SESSION_KEY, secret); setPassword(secret); setAuthenticated(true);
  }

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY) || '';
    if (!saved) { setCheckingSession(false); return; }
    panelApi<{ authenticated: boolean }>(saved, 'verify').then(() => { setPassword(saved); setAuthenticated(true); }).catch(() => sessionStorage.removeItem(SESSION_KEY)).finally(() => setCheckingSession(false));
  }, []);

  useEffect(() => {
    if (!authenticated || !password) return;
    setCheckingSession(false);
    loadBootstrap(password).catch((apiError) => setError(handleApiError(apiError)));
  }, [authenticated, password, loadBootstrap, handleApiError]);

  useEffect(() => {
    const timer = window.setTimeout(() => { setSearch(searchInput.trim()); setPage(0); }, 260);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!authenticated || !password || !periodInitialized) return;
    loadDashboard(password, period).catch((apiError) => setError(handleApiError(apiError)));
  }, [authenticated, password, period, periodInitialized, loadDashboard, handleApiError]);

  useEffect(() => {
    if (!authenticated || !password || !periodInitialized) return;
    loadOrders(password, mode, period, search, page);
  }, [authenticated, password, mode, period, search, page, periodInitialized, loadOrders]);

  const archiveTree = useMemo(() => {
    const tree = new Map<number, Map<number, ArchiveEntry[]>>();
    for (const entry of bootstrap?.archive || []) {
      const [year, month] = entry.dateKey.split('-').map(Number);
      if (!year || !month) continue;
      if (!tree.has(year)) tree.set(year, new Map());
      const months = tree.get(year)!;
      if (!months.has(month)) months.set(month, []);
      months.get(month)!.push(entry);
    }
    return Array.from(tree.entries()).sort(([a], [b]) => b - a).map(([year, months]) => ({
      year,
      months: Array.from(months.entries()).sort(([a], [b]) => b - a).map(([month, days]) => ({ month, days: [...days].sort((a, b) => b.dateKey.localeCompare(a.dateKey)) })),
    }));
  }, [bootstrap]);

  const years = useMemo(() => archiveTree.map((entry) => entry.year), [archiveTree]);
  const months = useMemo(() => {
    if (!period.year) return [];
    return archiveTree.find((entry) => entry.year === period.year)?.months.map((entry) => entry.month) || [];
  }, [archiveTree, period.year]);
  const days = useMemo(() => {
    if (!period.year || !period.month) return [];
    const month = archiveTree.find((entry) => entry.year === period.year)?.months.find((entry) => entry.month === period.month);
    return month?.days.map((entry) => Number(entry.dateKey.split('-')[2])) || [];
  }, [archiveTree, period.year, period.month]);

  function setYear(year: number) { setPeriod({ year, month: 0, day: 0 }); setPage(0); }
  function setMonth(month: number) { setPeriod((current) => ({ ...current, month, day: 0 })); setPage(0); }
  function setDay(day: number) { setPeriod((current) => ({ ...current, day })); setPage(0); }
  function quickPeriod(kind: 'today' | 'month' | 'year' | 'all') {
    const [year, month, day] = (bootstrap?.today || '').split('-').map(Number);
    if (kind === 'today') setPeriod({ year, month, day });
    if (kind === 'month') setPeriod({ year, month, day: 0 });
    if (kind === 'year') setPeriod({ year, month: 0, day: 0 });
    if (kind === 'all') setPeriod({ year: 0, month: 0, day: 0 });
    setPage(0);
  }

  async function refreshAll(updated?: ControlOrder) {
    if (updated) setDetail(updated);
    await Promise.all([loadBootstrap(password), loadDashboard(password, period), loadOrders(password, mode, period, search, page)]);
  }

  async function openDetail(order: ControlOrder) {
    setProofReady(null); setDetail(order); setDetailBusy('get');
    try { setDetail(await panelApi<ControlOrder>(password, 'get', { orderId: order.id })); }
    catch (apiError) { setError(handleApiError(apiError)); }
    finally { setDetailBusy(''); }
  }

  async function prepareProof(order: ControlOrder) {
    setDetailBusy('proof'); setError(''); setProofReady(null);
    try {
      const result = await panelApi<{ order: ControlOrder; url: string; expiresAt: string | null }>(password, 'proof', { orderId: order.id });
      setDetail(result.order);
      if (!result.url) throw new Error('Wix no devolvió el enlace del comprobante.');
      setProofReady({ orderId: order.id, url: result.url, expiresAt: result.expiresAt });
    } catch (apiError) { setError(handleApiError(apiError)); }
    finally { setDetailBusy(''); }
  }

  async function validateOrder(order: ControlOrder) {
    if (!window.confirm(`¿Validar el pago de ${order.customerName || order.reference} por ${money(order.total, order.currency)}?`)) return;
    setDetailBusy('validate'); setError('');
    try { const updated = await panelApi<ControlOrder>(password, 'validate', { orderId: order.id }); setProofReady(null); await refreshAll(updated); }
    catch (apiError) { setError(handleApiError(apiError)); }
    finally { setDetailBusy(''); }
  }

  async function rejectOrder(order: ControlOrder) {
    if (!window.confirm(`¿Rechazar el comprobante de ${order.customerName || order.reference}?`)) return;
    setDetailBusy('reject'); setError('');
    try { const updated = await panelApi<ControlOrder>(password, 'reject', { orderId: order.id }); setProofReady(null); await refreshAll(updated); }
    catch (apiError) { setError(handleApiError(apiError)); }
    finally { setDetailBusy(''); }
  }

  function selectArchiveDate(dateKey: string) {
    const [year, month, day] = dateKey.split('-').map(Number);
    setPeriod({ year, month, day }); setMode('all'); setPage(0);
  }

  if (checkingSession) return <main className="grid min-h-screen place-items-center bg-[#f4f6fb] font-interface text-sm text-[#425BBC]">Cargando Guaurritas Control…</main>;
  if (!authenticated) return <Login onLogin={login} />;

  const kpi = dashboard?.kpis;
  const periodLabel = period.day ? `${period.day} de ${MONTHS[period.month]} de ${period.year}` : period.month ? `${MONTHS[period.month]} ${period.year}` : period.year ? String(period.year) : 'Todo el histórico';
  const maxProductSales = Math.max(...(dashboard?.topProducts || []).map((product) => product.sales), 1);

  const PeriodControls = ({ compact = false }: { compact?: boolean }) => (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? '' : 'rounded-2xl border border-[#e0e4f0] bg-white p-2 shadow-sm'}`}>
      <select value={period.year || ''} onChange={(e) => setYear(Number(e.target.value || 0))} className="h-10 min-w-[92px] rounded-xl border border-[#d8deec] bg-white px-3 font-interface text-xs text-slate-600 outline-none focus:border-[#425BBC]"><option value="">Todos los años</option>{years.map((year) => <option key={year} value={year}>{year}</option>)}</select>
      <select value={period.month || ''} onChange={(e) => setMonth(Number(e.target.value || 0))} disabled={!period.year} className="h-10 min-w-[118px] rounded-xl border border-[#d8deec] bg-white px-3 font-interface text-xs text-slate-600 outline-none disabled:opacity-45 focus:border-[#425BBC]"><option value="">Todos los meses</option>{months.map((month) => <option key={month} value={month}>{MONTHS[month]}</option>)}</select>
      <select value={period.day || ''} onChange={(e) => setDay(Number(e.target.value || 0))} disabled={!period.month} className="h-10 min-w-[102px] rounded-xl border border-[#d8deec] bg-white px-3 font-interface text-xs text-slate-600 outline-none disabled:opacity-45 focus:border-[#425BBC]"><option value="">Todos los días</option>{days.map((day) => <option key={day} value={day}>{String(day).padStart(2, '0')}</option>)}</select>
      <div className="flex gap-1 rounded-xl bg-[#f3f5fa] p-1"><button onClick={() => quickPeriod('today')} className="rounded-lg px-2.5 py-2 font-interface text-[10px] font-bold text-slate-500 hover:bg-white">Hoy</button><button onClick={() => quickPeriod('month')} className="rounded-lg px-2.5 py-2 font-interface text-[10px] font-bold text-slate-500 hover:bg-white">Este mes</button><button onClick={() => quickPeriod('year')} className="hidden rounded-lg px-2.5 py-2 font-interface text-[10px] font-bold text-slate-500 hover:bg-white sm:block">Este año</button><button onClick={() => quickPeriod('all')} className="rounded-lg px-2.5 py-2 font-interface text-[10px] font-bold text-slate-500 hover:bg-white">Todo</button></div>
    </div>
  );

  const ArchiveTree = () => (
    <div className="space-y-2">
      {archiveTree.map(({ year, months: monthEntries }) => {
        const yearKey = String(year); const open = Boolean(expandedYears[yearKey]);
        return <div key={year} className="overflow-hidden rounded-xl border border-[#e0e4f0] bg-white"><button onClick={() => setExpandedYears((current) => ({ ...current, [yearKey]: !open }))} className="flex w-full items-center gap-2 px-3 py-3 text-left font-interface text-sm font-bold text-[#2a3f83]"><span>{open ? '📂' : '📁'}</span><span className="flex-1">{year}</span><span className="text-slate-400">{open ? '▾' : '▸'}</span></button>{open ? <div className="border-t border-[#edf0f6] bg-[#f9faff] p-2">{monthEntries.map(({ month, days: dayEntries }) => { const key = `${year}-${String(month).padStart(2, '0')}`; const monthOpen = Boolean(expandedMonths[key]); return <div key={key}><button onClick={() => setExpandedMonths((current) => ({ ...current, [key]: !monthOpen }))} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 font-interface text-xs font-semibold text-slate-600 hover:bg-white"><span>{monthOpen ? '📂' : '📁'}</span><span className="flex-1 text-left">{MONTHS[month]}</span><span>{dayEntries.reduce((sum, item) => sum + item.total, 0)}</span><span>{monthOpen ? '▾' : '▸'}</span></button>{monthOpen ? <div className="ml-4 border-l border-[#dce2f2] pl-2">{dayEntries.map((entry) => { const selected = period.year === year && period.month === month && period.day === Number(entry.dateKey.split('-')[2]); return <button key={entry.dateKey} onClick={() => selectArchiveDate(entry.dateKey)} className={`my-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left font-interface text-xs ${selected ? 'bg-[#425BBC] text-white' : 'text-slate-600 hover:bg-white'}`}><span>📄</span><span className="flex-1">Día {entry.dateKey.split('-')[2]}</span>{entry.pending ? <span>● {entry.pending}</span> : null}<span>{entry.total}</span></button>; })}</div> : null}</div>; })}</div> : null}</div>;
      })}
    </div>
  );

  const DesktopSidebar = () => (
    <aside className="hidden min-h-screen w-[230px] shrink-0 flex-col bg-[#344fae] px-4 py-6 text-white lg:flex">
      <div className="px-2"><div className="font-title text-xl tracking-[.08em]">GUAURRITAS</div><div className="mt-1 font-interface text-[10px] uppercase tracking-[.16em] text-blue-100">Control Center</div></div>
      <nav className="mt-9 space-y-2">{([['dashboard','⌂','Dashboard'],['orders','▣','Pedidos'],['archive','□','Archivo']] as Array<[Nav,string,string]>).map(([key, icon, label]) => <button key={key} onClick={() => setNav(key)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 font-interface text-sm font-semibold transition ${nav === key ? 'bg-white/16 text-white shadow-inner' : 'text-blue-100 hover:bg-white/10'}`}><span className="w-5 text-center">{icon}</span>{label}</button>)}</nav>
      <div className="mt-auto space-y-2"><div className="rounded-xl bg-white/10 px-3 py-3 font-interface text-[10px] text-blue-100"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-300" />Sistema en línea</div><button onClick={logout} className="w-full rounded-xl px-3 py-3 text-left font-interface text-xs text-blue-100 hover:bg-white/10">↪ Cerrar sesión</button></div>
    </aside>
  );

  const MobileHeader = () => <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#e4e7f0] bg-white/95 px-4 py-3 backdrop-blur lg:hidden"><div><div className="font-title text-sm tracking-[.07em] text-[#203676]">GUAURRITAS CONTROL</div><div className="font-interface text-[9px] uppercase text-slate-400">Pedidos & Ventas</div></div><button onClick={logout} className="rounded-lg bg-[#f1f3f9] px-3 py-2 font-interface text-[10px] font-bold text-slate-500">Salir</button></header>;

  return (
    <main className="min-h-screen bg-[#f4f5f9] text-[#172044]">
      <div className="flex min-h-screen"><DesktopSidebar />
        <div className="min-w-0 flex-1 pb-24 lg:pb-0"><MobileHeader />
          <div className="mx-auto max-w-[1500px] p-3 sm:p-5 lg:p-7">
            {error ? <div className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 font-interface text-sm text-rose-700"><span>{error}</span><button onClick={() => setError('')} className="font-bold">×</button></div> : null}

            {nav === 'dashboard' ? <>
              <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><div className="font-interface text-xs font-semibold text-slate-400">Resumen general del negocio</div><h1 className="mt-1 font-title text-2xl text-[#1d3378] sm:text-3xl">Guaurritas Control</h1><div className="mt-1 font-interface text-xs text-slate-400">{periodLabel}</div></div><PeriodControls /></div>

              <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-6">
                <KpiCard label="Ventas" value={money(kpi?.sales || 0)} note="ventas confirmadas / entregadas" />
                <KpiCard label="Pedidos" value={String(kpi?.orders || 0)} note={`${kpi?.productsSold || 0} unidades`} />
                <KpiCard label="Ticket promedio" value={money(kpi?.ticketAverage || 0)} note={`${kpi?.uniqueClients || 0} clientes únicos`} />
                <KpiCard label="Pagados" value={String(kpi?.paid || 0)} note={`${money(kpi?.paidAmount || 0)} registrado`} tone="green" />
                <KpiCard label="Por revisar" value={String(kpi?.needsReview || 0)} note="requieren acción" tone="amber" />
                <KpiCard label="Rechazados" value={String(kpi?.rejected || 0)} note={`${kpi?.quoted || 0} cotizados`} tone="rose" />
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-[1.55fr_.75fr_.9fr]">
                <section className="rounded-2xl border border-[#e0e4f0] bg-white p-4 shadow-[0_8px_26px_rgba(35,50,100,.05)] sm:p-5"><div className="mb-2"><h2 className="font-title text-lg text-[#233a80]">Ventas en el periodo</h2><p className="font-interface text-[11px] text-slate-400">Evolución según la fecha archivada del pedido</p></div><LineChart data={dashboard?.salesTrend || []} /></section>
                <section className="rounded-2xl border border-[#e0e4f0] bg-white p-4 shadow-[0_8px_26px_rgba(35,50,100,.05)] sm:p-5"><h2 className="font-title text-lg text-[#233a80]">Pedidos por estado</h2><Donut data={dashboard?.statusBreakdown || { paid:0, review:0, rejected:0, pending:0, quoted:0 }} /></section>
                <section className="rounded-2xl border border-[#e0e4f0] bg-white p-4 shadow-[0_8px_26px_rgba(35,50,100,.05)] sm:p-5"><h2 className="font-title text-lg text-[#233a80]">Ventas por origen</h2><p className="mb-3 font-interface text-[11px] text-slate-400">León, nacional y registros aún sin clasificar</p><Bars data={dashboard?.byRegion || []} /></section>
              </div>

              <div className={`mt-4 flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${kpi?.needsReview ? 'border-[#f0cdd7] bg-[#fff2f5]' : 'border-emerald-200 bg-emerald-50'}`}><div><div className={`font-title text-base ${kpi?.needsReview ? 'text-[#a24364]' : 'text-emerald-800'}`}>{kpi?.needsReview ? `⚠ ${kpi.needsReview} pedido(s) necesitan tu atención` : '✓ Todo al día'}</div><div className={`mt-1 font-interface text-xs ${kpi?.needsReview ? 'text-[#a66a80]' : 'text-emerald-700'}`}>{kpi?.needsReview ? 'Revisa comprobantes y valida los pagos pendientes.' : 'No hay comprobantes pendientes de revisión en este periodo.'}</div></div>{kpi?.needsReview ? <button onClick={() => { setNav('orders'); setMode('pending'); }} className="rounded-xl bg-[#d98fa7] px-4 py-2.5 font-interface text-xs font-bold text-white">Ver pendientes →</button> : null}</div>

              <div className="mt-4 grid gap-4 xl:grid-cols-[.85fr_1.35fr]">
                <section className="rounded-2xl border border-[#e0e4f0] bg-white p-4 shadow-[0_8px_26px_rgba(35,50,100,.05)] sm:p-5"><div className="mb-4 flex items-end justify-between"><div><h2 className="font-title text-lg text-[#233a80]">Top productos</h2><p className="font-interface text-[11px] text-slate-400">Por ventas en el periodo</p></div></div><div className="space-y-3">{(dashboard?.topProducts || []).map((product) => <div key={product.name}><div className="mb-1 flex justify-between gap-3 font-interface text-xs"><span className="truncate font-semibold text-slate-600">{product.name}</span><span className="shrink-0 text-slate-400">{product.units} u. · {money(product.sales)}</span></div><div className="h-1.5 rounded-full bg-[#edf0f7]"><div className="h-full rounded-full bg-[#425BBC]" style={{ width: `${Math.max(5, product.sales / maxProductSales * 100)}%` }} /></div></div>)}{!dashboard?.topProducts?.length ? <div className="py-10 text-center font-interface text-sm text-slate-400">Sin productos para este periodo.</div> : null}</div></section>
                <section className="rounded-2xl border border-[#e0e4f0] bg-white p-4 shadow-[0_8px_26px_rgba(35,50,100,.05)] sm:p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-title text-lg text-[#233a80]">Últimos pedidos</h2><p className="font-interface text-[11px] text-slate-400">Actividad más reciente del periodo</p></div><button onClick={() => setNav('orders')} className="font-interface text-xs font-bold text-[#425BBC]">Ver todos →</button></div><div className="space-y-2 md:hidden">{(dashboard?.recentOrders || []).slice(0,5).map((order) => <OrderCard key={order.id} order={order} onOpen={openDetail} />)}</div><div className="hidden overflow-x-auto md:block"><table className="w-full border-collapse"><thead><tr className="border-b border-[#edf0f5] text-left font-interface text-[9px] uppercase tracking-[.08em] text-slate-400"><th className="py-2 pr-3">Pedido</th><th className="py-2 pr-3">Cliente</th><th className="py-2 pr-3">Origen</th><th className="py-2 pr-3">Pago</th><th className="py-2 pr-3">Total</th><th className="py-2">Estado</th></tr></thead><tbody>{(dashboard?.recentOrders || []).map((order) => <tr key={order.id} onClick={() => openDetail(order)} className="cursor-pointer border-b border-[#f0f2f6] font-interface text-xs text-slate-600 hover:bg-[#fafbfe]"><td className="py-3 pr-3 font-semibold text-[#304887]">{order.wixOrderNumber ? `#${order.wixOrderNumber}` : order.reference}</td><td className="py-3 pr-3">{order.customerName || '—'}</td><td className="py-3 pr-3">{regionLabel(order.region)}</td><td className="py-3 pr-3">{paymentLabel(order.paymentMethod)}</td><td className="py-3 pr-3 font-semibold">{money(order.total)}</td><td className="py-3"><StatusPill order={order} /></td></tr>)}</tbody></table></div></section>
              </div>
            </> : null}

            {nav === 'orders' ? <>
              <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><div className="font-interface text-xs text-slate-400">Centro de pedidos</div><h1 className="mt-1 font-title text-2xl text-[#1d3378] sm:text-3xl">Pedidos</h1><div className="mt-1 font-interface text-xs text-slate-400">{list.totalCount} resultado(s) · {periodLabel}</div></div><PeriodControls /></div>
              <div className="mb-4 rounded-2xl border border-[#e0e4f0] bg-white p-3 shadow-sm"><div className="flex flex-col gap-3 lg:flex-row lg:items-center"><div className="relative min-w-0 flex-1"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">⌕</span><input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Buscar pedido, cliente, referencia, teléfono, email o producto…" className="h-11 w-full rounded-xl border border-[#dce1ed] bg-[#fafbfe] pl-9 pr-10 font-interface text-sm outline-none focus:border-[#425BBC]" />{searchInput ? <button onClick={() => setSearchInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-slate-400">×</button> : null}</div><div className="flex gap-1 overflow-x-auto pb-1 lg:pb-0">{([['all','Todos'],['pending','Pendientes'],['paid','Pagados'],['rejected','Rechazados'],['quoted','Cotizados'],['tests','Pruebas']] as Array<[Mode,string]>).map(([key,label]) => <button key={key} onClick={() => { setMode(key); setPage(0); }} className={`whitespace-nowrap rounded-xl px-3 py-2.5 font-interface text-[10px] font-bold uppercase ${mode === key ? 'bg-[#425BBC] text-white' : 'bg-[#f1f3f8] text-slate-500'}`}>{label}</button>)}</div></div></div>
              {loading ? <div className="mb-3 font-interface text-xs text-slate-400">Actualizando pedidos…</div> : null}
              <div className="grid gap-3 md:grid-cols-2 xl:hidden">{list.orders.map((order) => <OrderCard key={order.id} order={order} onOpen={openDetail} />)}</div>
              <div className="hidden overflow-hidden rounded-2xl border border-[#e0e4f0] bg-white shadow-[0_8px_26px_rgba(35,50,100,.05)] xl:block"><table className="w-full border-collapse"><thead className="bg-[#fafbfe]"><tr className="text-left font-interface text-[9px] font-bold uppercase tracking-[.08em] text-slate-400"><th className="px-4 py-3">Pedido</th><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Productos</th><th className="px-4 py-3">Origen</th><th className="px-4 py-3">Pago</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Fecha</th></tr></thead><tbody>{list.orders.map((order) => <tr key={order.id} onClick={() => openDetail(order)} className="cursor-pointer border-t border-[#eef0f5] font-interface text-xs text-slate-600 hover:bg-[#fafbfe]"><td className="px-4 py-3 font-bold text-[#344d93]">{order.wixOrderNumber ? `#${order.wixOrderNumber}` : order.reference}</td><td className="px-4 py-3">{order.customerName || '—'}</td><td className="max-w-[330px] truncate px-4 py-3">{productSummary(order)}</td><td className="px-4 py-3">{regionLabel(order.region)}</td><td className="px-4 py-3">{paymentLabel(order.paymentMethod)}</td><td className="px-4 py-3 font-semibold">{money(order.total)}</td><td className="px-4 py-3"><StatusPill order={order} /></td><td className="px-4 py-3 text-slate-400">{order.adminDateKey}</td></tr>)}</tbody></table></div>
              {!loading && !list.orders.length ? <div className="rounded-2xl border border-dashed border-[#cfd5e5] bg-white/70 py-16 text-center font-interface text-sm text-slate-400">No encontramos pedidos con estos filtros.</div> : null}
              <div className="mt-4 flex items-center justify-center gap-2"><button disabled={page <= 0} onClick={() => setPage((current) => Math.max(0, current - 1))} className="rounded-xl border border-[#d8deeb] bg-white px-4 py-2 font-interface text-xs text-slate-500 disabled:opacity-35">← Anterior</button><span className="font-interface text-xs text-slate-400">Página {page + 1}</span><button disabled={!list.hasNext} onClick={() => setPage((current) => current + 1)} className="rounded-xl border border-[#d8deeb] bg-white px-4 py-2 font-interface text-xs text-slate-500 disabled:opacity-35">Siguiente →</button></div>
            </> : null}

            {nav === 'archive' ? <>
              <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><div className="font-interface text-xs text-slate-400">Archivo inteligente</div><h1 className="mt-1 font-title text-2xl text-[#1d3378] sm:text-3xl">Año · Mes · Día</h1><div className="mt-1 font-interface text-xs text-slate-400">Los pedidos se organizan automáticamente sin crear colecciones separadas.</div></div><PeriodControls /></div>
              <div className="grid gap-4 lg:grid-cols-[310px_minmax(0,1fr)]"><aside className="self-start rounded-2xl border border-[#e0e4f0] bg-[#f1f3fa] p-3 lg:sticky lg:top-6"><ArchiveTree /></aside><section><div className="mb-3 flex items-end justify-between"><div><h2 className="font-title text-xl text-[#233a80]">{period.day ? archiveDate(`${period.year}-${String(period.month).padStart(2,'0')}-${String(period.day).padStart(2,'0')}`) : periodLabel}</h2><div className="mt-1 font-interface text-xs text-slate-400">{list.totalCount} pedido(s)</div></div></div><div className="grid gap-3 xl:grid-cols-2">{list.orders.map((order) => <OrderCard key={order.id} order={order} onOpen={openDetail} />)}</div>{!list.orders.length ? <div className="rounded-2xl border border-dashed border-[#cfd5e5] bg-white/70 py-16 text-center font-interface text-sm text-slate-400">Selecciona una carpeta con pedidos.</div> : null}</section></div>
            </> : null}
          </div>
        </div>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-3 rounded-2xl border border-[#dfe3ef] bg-white/95 p-1.5 shadow-[0_12px_40px_rgba(30,45,90,.18)] backdrop-blur lg:hidden">{([['dashboard','⌂','Dashboard'],['orders','▣','Pedidos'],['archive','□','Archivo']] as Array<[Nav,string,string]>).map(([key,icon,label]) => <button key={key} onClick={() => setNav(key)} className={`rounded-xl py-2 text-center font-interface text-[10px] font-bold ${nav === key ? 'bg-[#eef1ff] text-[#425BBC]' : 'text-slate-400'}`}><span className="mb-0.5 block text-base">{icon}</span>{label}</button>)}</nav>

      {detail ? <div className="fixed inset-0 z-50 bg-[#172044]/30 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget) { setDetail(null); setProofReady(null); } }}><aside className="absolute inset-y-0 right-0 w-full overflow-y-auto bg-[#f8f9fc] shadow-[-20px_0_70px_rgba(25,37,80,.18)] sm:max-w-[560px]"><div className="sticky top-0 z-10 border-b border-[#e1e5ef] bg-white/95 px-5 py-4 backdrop-blur"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><StatusPill order={detail} />{detail.isTest ? <span className="rounded-full bg-violet-50 px-2 py-1 font-interface text-[9px] font-bold uppercase text-violet-700">🧪 Prueba</span> : null}{detail.sourceType === 'HISTORICAL_SHEET' ? <span className="rounded-full bg-slate-100 px-2 py-1 font-interface text-[9px] font-bold uppercase text-slate-500">Histórico · solo lectura</span> : null}</div><h2 className="mt-2 truncate font-title text-2xl text-[#203676]">{detail.customerName || 'Pedido Guaurritas'}</h2><div className="mt-1 break-all font-interface text-xs text-slate-400">{detail.wixOrderNumber ? `Pedido Wix #${detail.wixOrderNumber} · ` : ''}{detail.reference}</div></div><button onClick={() => { setDetail(null); setProofReady(null); }} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f0f2f7] text-xl text-slate-500">×</button></div></div>
        <div className="space-y-4 p-4 sm:p-5">
          {detailBusy === 'get' ? <div className="font-interface text-xs text-slate-400">Actualizando detalle…</div> : null}
          <section className="rounded-2xl border border-[#e0e4f0] bg-white p-4"><div className="mb-3 flex items-center justify-between"><h3 className="font-title text-base text-[#2a4189]">Pedido</h3><div className="font-title text-xl text-[#203676]">{money(detail.total, detail.currency)}</div></div><div className="space-y-3">{detail.lines.map((line, index) => <div key={`${line.name}-${index}`} className="rounded-xl bg-[#f8f9fc] p-3"><div className="flex justify-between gap-3 font-interface text-sm font-semibold text-slate-700"><span>{line.name}</span><span>{line.quantity}×</span></div>{line.detail || line.personalization ? <div className="mt-1 font-interface text-xs text-slate-400">{line.detail || line.personalization}</div> : null}<div className="mt-1 font-interface text-xs text-[#425BBC]">{money(line.lineTotal || line.unitPrice * line.quantity)}</div></div>)}</div></section>

          <div className="grid gap-4 sm:grid-cols-2"><section className="rounded-2xl border border-[#e0e4f0] bg-white p-4"><h3 className="font-title text-base text-[#2a4189]">Cliente</h3><div className="mt-3 space-y-2 font-interface text-xs text-slate-500"><div>{detail.customerName || 'Sin nombre'}</div>{detail.customerPhone ? <a className="block font-semibold text-[#425BBC]" href={`tel:${detail.customerPhone}`}>☎ {detail.customerPhone}</a> : null}{detail.customerEmail ? <a className="block break-all font-semibold text-[#425BBC]" href={`mailto:${detail.customerEmail}`}>✉ {detail.customerEmail}</a> : null}{detail.instagram ? <div>@ {detail.instagram}</div> : null}{detail.address ? <div>⌖ {detail.address}</div> : null}</div></section><section className="rounded-2xl border border-[#e0e4f0] bg-white p-4"><h3 className="font-title text-base text-[#2a4189]">Origen & pago</h3><div className="mt-3 space-y-2 font-interface text-xs text-slate-500"><div><b>Canal:</b> {sourceLabel(detail.sourceType)}{detail.channel ? ` · ${detail.channel}` : ''}</div><div><b>Entrega:</b> {regionLabel(detail.region)}</div><div><b>Pago:</b> {paymentLabel(detail.paymentMethod)}</div><div><b>Pagado:</b> {money(detail.paidAmount)}</div>{detail.pendingAmount ? <div><b>Pendiente:</b> {money(detail.pendingAmount)}</div> : null}<div><b>Fecha:</b> {archiveDate(detail.adminDateKey)}</div>{detail.deliveryDate ? <div><b>Entrega:</b> {compactDate(detail.deliveryDate)}</div> : null}</div></section></div>

          {detail.hasProof ? <section className="rounded-2xl border border-[#dce2f0] bg-white p-4"><div className="flex items-center justify-between gap-3"><div><h3 className="font-title text-base text-[#2a4189]">Comprobante SPEI</h3><p className="mt-1 font-interface text-[11px] text-slate-400">{detail.proofFileName || 'Archivo privado de Wix'}</p></div><span className="rounded-full bg-[#eef1ff] px-2 py-1 font-interface text-[9px] font-bold uppercase text-[#425BBC]">Privado</span></div>{proofReady?.orderId === detail.id ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3"><div className="font-interface text-xs font-bold text-emerald-800">✓ Comprobante listo</div><div className="mt-1 font-interface text-[10px] text-emerald-700">Enlace temporal seguro{proofReady.expiresAt ? ` · vence ${dateTime(proofReady.expiresAt)}` : ''}</div><a href={proofReady.url} target="_blank" rel="noreferrer" className="mt-3 block rounded-xl bg-[#425BBC] px-4 py-3 text-center font-interface text-xs font-bold text-white">ABRIR COMPROBANTE ↗</a></div> : <button onClick={() => prepareProof(detail)} disabled={detailBusy === 'proof'} className="mt-4 w-full rounded-xl border border-[#b8c3e4] bg-[#f7f8fd] px-4 py-3 font-interface text-xs font-bold text-[#425BBC] disabled:opacity-50">{detailBusy === 'proof' ? 'Generando enlace seguro…' : '👁 Generar enlace seguro'}</button>}<p className="mt-2 font-interface text-[10px] leading-4 text-slate-400">Primero generamos el acceso privado y luego tú lo abres con un segundo toque. Esto evita el problema de about:blank en iPhone.</p></section> : detail.actionState === 'awaiting_proof' ? <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 font-interface text-xs text-amber-800">Todavía no se ha subido un comprobante para este pedido.</section> : null}

          {detail.noteLink ? <a href={detail.noteLink} target="_blank" rel="noreferrer" className="block rounded-2xl border border-[#e0e4f0] bg-white p-4 font-interface text-xs font-bold text-[#425BBC]">Abrir nota histórica original ↗</a> : null}
          {detail.notes ? <section className="rounded-2xl border border-[#e0e4f0] bg-white p-4"><h3 className="font-title text-base text-[#2a4189]">Notas</h3><p className="mt-2 whitespace-pre-wrap font-interface text-xs leading-5 text-slate-500">{detail.notes}</p></section> : null}

          {detail.actionState === 'review' ? <div className="grid gap-2 sm:grid-cols-2"><button onClick={() => validateOrder(detail)} disabled={Boolean(detailBusy)} className="rounded-xl bg-[#425BBC] px-4 py-3.5 font-interface text-xs font-bold text-white disabled:opacity-50">{detailBusy === 'validate' ? 'Validando…' : '✓ VALIDAR PAGO'}</button><button onClick={() => rejectOrder(detail)} disabled={Boolean(detailBusy)} className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3.5 font-interface text-xs font-bold text-rose-700 disabled:opacity-50">{detailBusy === 'reject' ? 'Rechazando…' : '✕ RECHAZAR'}</button></div> : null}
          {detail.actionState === 'paid' && detail.wixOrderNumber ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><div className="font-title text-base text-emerald-800">✓ PAGADO · Wix #{detail.wixOrderNumber}</div><p className="mt-1 font-interface text-xs text-emerald-700">El pedido ya fue formalizado y registrado como pagado.</p></div> : null}
        </div></aside></div> : null}
    </main>
  );
}
