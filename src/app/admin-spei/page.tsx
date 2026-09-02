'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

const API_URL = 'https://www.guaurritas.com/_functions/speiAdmin';
const SESSION_KEY = 'guaurritas-spei-admin-session';

const MONTHS = [
  '',
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

type Mode = 'all' | 'today' | 'pending' | 'paid' | 'rejected' | 'tests';

type OrderLine = {
  name: string;
  detail: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type SpeiOrder = {
  id: string;
  reference: string;
  status: string;
  statusGroup: 'pending' | 'paid' | 'rejected' | 'expired';
  total: number;
  currency: string;
  fulfillment: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  buyerNote: string;
  adminNote: string;
  wixOrderNumber: string;
  receiptStatus: string;
  createdAt: string | null;
  proofSubmittedAt: string | null;
  validatedAt: string | null;
  rejectedAt: string | null;
  expiresAt: string | null;
  adminDateKey: string;
  adminYear: number;
  isTest: boolean;
  hasProof: boolean;
  proofFileName: string;
  proofAccessExpiresAt: string | null;
  lines: OrderLine[];
};

type ArchiveEntry = {
  dateKey: string;
  total: number;
  pending: number;
  paid: number;
  rejected: number;
  expired: number;
};

type Bootstrap = {
  today: string;
  counts: {
    all: number;
    pending: number;
    paid: number;
    rejected: number;
    expired: number;
    tests: number;
  };
  archive: ArchiveEntry[];
};

type OrderList = {
  orders: SpeiOrder[];
  page: number;
  pageSize: number;
  hasNext: boolean;
  totalCount: number;
};

type ApiEnvelope<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};

function money(value: number, currency = 'MXN') {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency || 'MXN',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function dateTime(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Mexico_City',
  }).format(date);
}

function statusMeta(status: string) {
  const map: Record<string, { label: string; icon: string; cls: string }> = {
    PENDING_PAYMENT: {
      label: 'Esperando comprobante',
      icon: '○',
      cls: 'border-amber-300 bg-amber-50 text-amber-900',
    },
    PROOF_RECEIVED: {
      label: 'Comprobante recibido',
      icon: '●',
      cls: 'border-amber-300 bg-amber-50 text-amber-900',
    },
    LATE_PAYMENT_REVIEW: {
      label: 'Comprobante tardío',
      icon: '!',
      cls: 'border-orange-300 bg-orange-50 text-orange-900',
    },
    VALIDATING_PAYMENT: {
      label: 'Validando pago',
      icon: '↻',
      cls: 'border-blue-300 bg-blue-50 text-blue-900',
    },
    PAYMENT_VALIDATED: {
      label: 'Pagado',
      icon: '✓',
      cls: 'border-emerald-300 bg-emerald-50 text-emerald-900',
    },
    CONFIRMED: {
      label: 'Confirmado',
      icon: '✓',
      cls: 'border-emerald-300 bg-emerald-50 text-emerald-900',
    },
    PROOF_REJECTED: {
      label: 'Comprobante rechazado',
      icon: '×',
      cls: 'border-rose-300 bg-rose-50 text-rose-900',
    },
    EXPIRED: {
      label: 'Vencido',
      icon: '⌛',
      cls: 'border-slate-300 bg-slate-100 text-slate-700',
    },
  };

  return map[status] || {
    label: status || 'Sin estado',
    icon: '•',
    cls: 'border-slate-300 bg-slate-100 text-slate-700',
  };
}

function productSummary(order: SpeiOrder) {
  if (!order.lines.length) return 'Sin productos';
  return order.lines
    .map((line) => `${line.quantity}× ${line.name}${line.detail ? ` · ${line.detail}` : ''}`)
    .join(' / ');
}

function archiveLabel(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  if (!year || !month || !day) return dateKey;
  return `${String(day).padStart(2, '0')} de ${MONTHS[month].toLowerCase()} de ${year}`;
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
    try {
      await onLogin(password.trim());
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'No pudimos entrar al panel.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="fixed inset-0 overflow-auto bg-[#e9edf8] text-[#152253]">
      <div className="mx-auto flex min-h-full max-w-md items-center px-5 py-10">
        <form
          onSubmit={submit}
          className="w-full overflow-hidden border-2 border-[#233e91] bg-white shadow-[8px_8px_0_rgba(34,56,118,0.18)]"
        >
          <div className="border-b-2 border-[#233e91] bg-gradient-to-b from-[#617be0] via-[#425BBC] to-[#29439d] px-5 py-4 text-white">
            <div className="font-title text-xl tracking-[0.08em]">GUAURRITAS</div>
            <div className="mt-1 font-interface text-xs uppercase tracking-[0.18em] text-blue-100">
              Pedidos SPEI · panel privado
            </div>
          </div>

          <div className="space-y-5 p-5 sm:p-7">
            <div>
              <div className="font-title text-2xl text-[#233e91]">Acceso administrativo</div>
              <p className="mt-2 font-interface text-sm leading-6 text-slate-600">
                Este panel contiene comprobantes y datos de pedidos. Ingresa la clave privada de Guaurritas.
              </p>
            </div>

            <label className="block">
              <span className="mb-2 block font-interface text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
                Clave de acceso
              </span>
              <input
                autoFocus
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 w-full border-2 border-[#8595c8] bg-[#f8faff] px-3 font-interface text-base outline-none focus:border-[#425BBC] focus:ring-2 focus:ring-[#425BBC]/20"
                placeholder="••••••••••••••••"
              />
            </label>

            {error ? (
              <div className="border border-rose-300 bg-rose-50 px-3 py-2 font-interface text-sm text-rose-800">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={busy || !password.trim()}
              className="h-12 w-full border-2 border-[#1e377f] bg-[#425BBC] font-title text-sm tracking-[0.08em] text-white shadow-[inset_0_1px_rgba(255,255,255,.35)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? 'COMPROBANDO…' : 'ENTRAR AL PANEL'}
            </button>

            <p className="font-interface text-center text-[11px] leading-5 text-slate-500">
              La sesión se conserva únicamente mientras esta pestaña del navegador permanezca abierta.
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}

function StatusPill({ status }: { status: string }) {
  const meta = statusMeta(status);
  return (
    <span className={`inline-flex items-center gap-1.5 border px-2.5 py-1 font-interface text-[11px] font-bold uppercase tracking-[0.06em] ${meta.cls}`}>
      <span>{meta.icon}</span>
      {meta.label}
    </span>
  );
}

export default function SpeiAdminPage() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [bootstrap, setBootstrap] = useState<Bootstrap | null>(null);
  const [list, setList] = useState<OrderList>({ orders: [], page: 0, pageSize: 50, hasNext: false, totalCount: 0 });
  const [mode, setMode] = useState<Mode>('today');
  const [dateKey, setDateKey] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [detail, setDetail] = useState<SpeiOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailBusy, setDetailBusy] = useState('');
  const [error, setError] = useState('');
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({});
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setPassword('');
    setAuthenticated(false);
    setBootstrap(null);
    setDetail(null);
  }, []);

  const handleApiError = useCallback((apiError: unknown) => {
    const typed = apiError as Error & { status?: number };
    if (typed?.status === 403) {
      logout();
      return 'La sesión dejó de ser válida. Vuelve a ingresar la clave.';
    }
    return typed?.message || 'Ocurrió un error en el panel.';
  }, [logout]);

  const loadBootstrap = useCallback(async (secret: string) => {
    const data = await panelApi<Bootstrap>(secret, 'bootstrap');
    setBootstrap(data);
    const [year, month] = data.today.split('-');
    setExpandedYears((current) => ({ ...current, [year]: true }));
    setExpandedMonths((current) => ({ ...current, [`${year}-${month}`]: true }));
  }, []);

  const loadOrders = useCallback(async (
    secret: string,
    nextMode: Mode,
    nextDateKey: string,
    nextSearch: string,
    nextPage: number,
  ) => {
    setLoading(true);
    setError('');
    try {
      const data = await panelApi<OrderList>(secret, 'list', {
        mode: nextMode,
        dateKey: nextDateKey,
        search: nextSearch,
        page: nextPage,
      });
      setList(data);
    } catch (apiError) {
      setError(handleApiError(apiError));
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  async function login(secret: string) {
    await panelApi<{ authenticated: boolean }>(secret, 'verify');
    sessionStorage.setItem(SESSION_KEY, secret);
    setPassword(secret);
    setAuthenticated(true);
  }

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY) || '';
    if (!saved) {
      setCheckingSession(false);
      return;
    }

    panelApi<{ authenticated: boolean }>(saved, 'verify')
      .then(() => {
        setPassword(saved);
        setAuthenticated(true);
      })
      .catch(() => sessionStorage.removeItem(SESSION_KEY))
      .finally(() => setCheckingSession(false));
  }, []);

  useEffect(() => {
    if (!authenticated || !password) return;
    setCheckingSession(false);
    loadBootstrap(password).catch((apiError) => setError(handleApiError(apiError)));
  }, [authenticated, password, loadBootstrap, handleApiError]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 280);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!authenticated || !password) return;
    loadOrders(password, mode, dateKey, search, page);
  }, [authenticated, password, mode, dateKey, search, page, loadOrders]);

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

    return Array.from(tree.entries())
      .sort(([a], [b]) => b - a)
      .map(([year, months]) => ({
        year,
        months: Array.from(months.entries())
          .sort(([a], [b]) => b - a)
          .map(([month, days]) => ({
            month,
            days: [...days].sort((a, b) => b.dateKey.localeCompare(a.dateKey)),
          })),
      }));
  }, [bootstrap]);

  function selectMode(nextMode: Mode) {
    setMode(nextMode);
    setDateKey('');
    setPage(0);
    setDetail(null);
  }

  function selectArchive(nextDateKey: string) {
    setMode('all');
    setDateKey(nextDateKey);
    setPage(0);
    setArchiveOpen(false);
    setDetail(null);
  }

  async function refreshAfterAction(updated?: SpeiOrder) {
    if (updated) setDetail(updated);
    await Promise.all([
      loadBootstrap(password),
      loadOrders(password, mode, dateKey, search, page),
    ]);
  }

  async function openDetail(order: SpeiOrder) {
    setDetail(order);
    setDetailBusy('get');
    try {
      const fresh = await panelApi<SpeiOrder>(password, 'get', { orderId: order.id });
      setDetail(fresh);
    } catch (apiError) {
      setError(handleApiError(apiError));
    } finally {
      setDetailBusy('');
    }
  }

  async function openProof(order: SpeiOrder) {
    const popup = window.open('', '_blank');
    if (popup) {
      popup.document.title = 'Abriendo comprobante…';
      popup.document.body.innerHTML = '<p style="font-family:system-ui;padding:24px">Generando enlace seguro…</p>';
    }

    setDetailBusy('proof');
    try {
      const result = await panelApi<{ order: SpeiOrder; url: string; expiresAt: string | null }>(
        password,
        'proof',
        { orderId: order.id },
      );
      setDetail(result.order);
      if (!result.url) throw new Error('Wix no devolvió el enlace del comprobante.');
      if (popup) {
        popup.location.href = result.url;
      } else {
        window.location.href = result.url;
      }
    } catch (apiError) {
      if (popup) popup.close();
      setError(handleApiError(apiError));
    } finally {
      setDetailBusy('');
    }
  }

  async function validateOrder(order: SpeiOrder) {
    const accepted = window.confirm(
      `¿Validar el pago de ${order.customerName || order.reference} por ${money(order.total, order.currency)}?\n\nEsto creará/recuperará el pedido de Wix y registrará el SPEI como pago offline aprobado.`,
    );
    if (!accepted) return;

    setDetailBusy('validate');
    setError('');
    try {
      const updated = await panelApi<SpeiOrder>(password, 'validate', { orderId: order.id });
      await refreshAfterAction(updated);
    } catch (apiError) {
      setError(handleApiError(apiError));
    } finally {
      setDetailBusy('');
    }
  }

  async function rejectOrder(order: SpeiOrder) {
    const accepted = window.confirm(
      `¿Rechazar el comprobante de ${order.customerName || order.reference}?\n\nNo se creará ningún pedido ni pago de Wix.`,
    );
    if (!accepted) return;

    setDetailBusy('reject');
    setError('');
    try {
      const updated = await panelApi<SpeiOrder>(password, 'reject', { orderId: order.id });
      await refreshAfterAction(updated);
    } catch (apiError) {
      setError(handleApiError(apiError));
    } finally {
      setDetailBusy('');
    }
  }

  if (checkingSession) {
    return (
      <main className="fixed inset-0 grid place-items-center bg-[#e9edf8] font-interface text-sm text-[#233e91]">
        Cargando panel privado…
      </main>
    );
  }

  if (!authenticated) return <Login onLogin={login} />;

  const counts = bootstrap?.counts;
  const selectedLabel = search
    ? `Resultados para “${search}”`
    : dateKey
      ? archiveLabel(dateKey)
      : mode === 'today'
        ? 'Pedidos de hoy'
        : mode === 'pending'
          ? 'Pendientes'
          : mode === 'paid'
            ? 'Pagados'
            : mode === 'rejected'
              ? 'Rechazados'
              : mode === 'tests'
                ? 'Pruebas del sistema'
                : 'Todos los pedidos';

  const filterButtons: Array<{ mode: Mode; label: string; count?: number; icon: string }> = [
    { mode: 'today', label: 'Hoy', icon: '☀' },
    { mode: 'pending', label: 'Pendientes', count: counts?.pending, icon: '●' },
    { mode: 'paid', label: 'Pagados', count: counts?.paid, icon: '✓' },
    { mode: 'rejected', label: 'Rechazados', count: counts?.rejected, icon: '×' },
    { mode: 'all', label: 'Todos', count: counts?.all, icon: '▤' },
    { mode: 'tests', label: 'Pruebas', count: counts?.tests, icon: '🧪' },
  ];

  const Archive = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={mobile ? 'pb-3' : ''}>
      <div className="mb-3 flex items-center justify-between px-1">
        <span className="font-title text-xs tracking-[0.1em] text-[#2b428d]">ARCHIVO</span>
        <span className="font-interface text-[10px] uppercase text-slate-500">Año / Mes / Día</span>
      </div>
      <div className="space-y-2">
        {archiveTree.map(({ year, months }) => {
          const yearKey = String(year);
          const yearOpen = Boolean(expandedYears[yearKey]);
          const yearCount = months.reduce((sum, month) => sum + month.days.reduce((daySum, day) => daySum + day.total, 0), 0);
          return (
            <div key={year} className="border border-[#b9c4e7] bg-white">
              <button
                type="button"
                onClick={() => setExpandedYears((current) => ({ ...current, [yearKey]: !yearOpen }))}
                className="flex w-full items-center gap-2 px-3 py-2 text-left font-interface text-sm font-bold text-[#233e91]"
              >
                <span className="text-base">{yearOpen ? '📂' : '📁'}</span>
                <span className="flex-1">{year}</span>
                <span className="text-[10px] font-normal text-slate-500">{yearCount}</span>
                <span>{yearOpen ? '▾' : '▸'}</span>
              </button>
              {yearOpen ? (
                <div className="border-t border-[#d6ddf2] bg-[#f7f9ff] px-2 py-2">
                  {months.map(({ month, days }) => {
                    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
                    const monthOpen = Boolean(expandedMonths[monthKey]);
                    const monthCount = days.reduce((sum, day) => sum + day.total, 0);
                    return (
                      <div key={monthKey} className="mb-1 last:mb-0">
                        <button
                          type="button"
                          onClick={() => setExpandedMonths((current) => ({ ...current, [monthKey]: !monthOpen }))}
                          className="flex w-full items-center gap-2 px-2 py-2 text-left font-interface text-xs font-semibold text-slate-700 hover:bg-white"
                        >
                          <span>{monthOpen ? '📂' : '📁'}</span>
                          <span className="flex-1">{MONTHS[month]}</span>
                          <span className="text-[10px] font-normal text-slate-500">{monthCount}</span>
                          <span>{monthOpen ? '▾' : '▸'}</span>
                        </button>
                        {monthOpen ? (
                          <div className="ml-5 border-l border-[#c5cfea] pl-2">
                            {days.map((day) => {
                              const selected = dateKey === day.dateKey && mode === 'all' && !search;
                              const dayNumber = day.dateKey.split('-')[2];
                              return (
                                <button
                                  key={day.dateKey}
                                  type="button"
                                  onClick={() => selectArchive(day.dateKey)}
                                  className={`mb-1 flex w-full items-center gap-2 px-2 py-2 text-left font-interface text-xs ${selected ? 'bg-[#425BBC] text-white' : 'text-slate-700 hover:bg-white'}`}
                                >
                                  <span>📄</span>
                                  <span className="flex-1">Día {dayNumber}</span>
                                  {day.pending ? <span title="Pendientes">● {day.pending}</span> : null}
                                  <span>{day.total}</span>
                                </button>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
        {!archiveTree.length ? (
          <div className="border border-dashed border-slate-300 p-4 font-interface text-xs text-slate-500">
            Todavía no hay fechas archivadas.
          </div>
        ) : null}
      </div>
    </div>
  );

  return (
    <main className="fixed inset-0 overflow-auto bg-[#edf0f8] text-[#172044]">
      <header className="sticky top-0 z-30 border-b-2 border-[#213b86] bg-gradient-to-b from-[#5d78da] via-[#425BBC] to-[#29439d] text-white shadow-md">
        <div className="mx-auto flex max-w-[1500px] items-center gap-3 px-3 py-2.5 sm:px-5">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center border border-white/40 bg-white/15 text-lg">G</div>
            <div className="min-w-0">
              <div className="truncate font-title text-base tracking-[0.08em] sm:text-lg">GUAURRITAS</div>
              <div className="truncate font-interface text-[10px] uppercase tracking-[0.16em] text-blue-100">
                Panel privado · pedidos SPEI
              </div>
            </div>
          </div>
          <div className="hidden items-center gap-2 border border-blue-200/40 bg-blue-950/20 px-3 py-1.5 font-interface text-[10px] uppercase tracking-[0.1em] sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_6px_#86efac]" />
            En línea
          </div>
          <button
            type="button"
            onClick={logout}
            className="border border-white/40 bg-white/10 px-3 py-2 font-interface text-[11px] font-bold uppercase tracking-[0.08em] hover:bg-white/20"
          >
            Salir
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-3 py-3 sm:px-5 sm:py-5">
        <div className="mb-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {filterButtons.map((filter) => {
            const active = mode === filter.mode && !dateKey && !search;
            return (
              <button
                key={filter.mode}
                type="button"
                onClick={() => selectMode(filter.mode)}
                className={`flex min-h-11 items-center justify-between gap-2 border-2 px-3 font-interface text-xs font-bold uppercase tracking-[0.04em] transition sm:min-w-[130px] ${active ? 'border-[#243d87] bg-[#425BBC] text-white' : 'border-[#b6c2e4] bg-white text-[#2a3f83] hover:border-[#7184c1]'}`}
              >
                <span className="flex items-center gap-2"><span>{filter.icon}</span>{filter.label}</span>
                {typeof filter.count === 'number' ? <span className={active ? 'text-blue-100' : 'text-slate-500'}>{filter.count}</span> : null}
              </button>
            );
          })}
        </div>

        <div className="mb-3 flex gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => setArchiveOpen((open) => !open)}
            className="h-11 shrink-0 border-2 border-[#9aa9d5] bg-white px-3 font-interface text-xs font-bold text-[#2a3f83]"
          >
            {archiveOpen ? 'Cerrar archivo' : '📁 Archivo'}
          </button>
          <div className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-interface text-slate-400">⌕</span>
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Buscar cliente, # pedido, referencia, teléfono…"
              className="h-11 w-full border-2 border-[#9aa9d5] bg-white pl-9 pr-9 font-interface text-sm outline-none focus:border-[#425BBC]"
            />
            {searchInput ? (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 font-interface text-lg text-slate-500"
                aria-label="Limpiar búsqueda"
              >×</button>
            ) : null}
          </div>
        </div>

        {archiveOpen ? (
          <div className="mb-3 border-2 border-[#aab7dc] bg-[#eef2fc] p-3 lg:hidden">
            <Archive mobile />
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="hidden self-start border-2 border-[#9eacd5] bg-[#e7ecfa] p-3 shadow-[4px_4px_0_rgba(44,64,127,.12)] lg:sticky lg:top-[76px] lg:block">
            <div className="mb-4 relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-interface text-slate-400">⌕</span>
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Buscar cualquier pedido…"
                className="h-11 w-full border-2 border-[#9aa9d5] bg-white pl-9 pr-8 font-interface text-sm outline-none focus:border-[#425BBC]"
              />
              {searchInput ? (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-1 font-interface text-lg text-slate-500"
                >×</button>
              ) : null}
            </div>
            <Archive />
          </aside>

          <section className="min-w-0">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2 border-b border-[#bac4df] pb-3">
              <div>
                <div className="font-title text-xl text-[#233e91] sm:text-2xl">{selectedLabel}</div>
                <div className="mt-1 font-interface text-xs text-slate-500">
                  {loading ? 'Actualizando…' : `${list.totalCount ?? list.orders.length} pedido(s)`}
                  {search ? ' · búsqueda global' : ''}
                </div>
              </div>
              {dateKey && !search ? (
                <button
                  type="button"
                  onClick={() => { setDateKey(''); setPage(0); }}
                  className="border border-[#aeb9d7] bg-white px-3 py-2 font-interface text-xs text-[#2a3f83]"
                >
                  × Quitar fecha
                </button>
              ) : null}
            </div>

            {error ? (
              <div className="mb-3 flex items-start justify-between gap-3 border border-rose-300 bg-rose-50 p-3 font-interface text-sm text-rose-800">
                <span>{error}</span>
                <button type="button" onClick={() => setError('')} className="font-bold">×</button>
              </div>
            ) : null}

            <div className={`space-y-3 transition-opacity ${loading ? 'opacity-60' : 'opacity-100'}`}>
              {list.orders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => openDetail(order)}
                  className="group block w-full border-2 border-[#a8b4d7] bg-white p-0 text-left shadow-[3px_3px_0_rgba(48,64,119,.08)] hover:border-[#425BBC]"
                >
                  <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:p-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <StatusPill status={order.status} />
                        {order.isTest ? (
                          <span className="border border-violet-300 bg-violet-50 px-2 py-1 font-interface text-[10px] font-bold uppercase text-violet-800">🧪 Prueba</span>
                        ) : null}
                        {order.wixOrderNumber ? (
                          <span className="font-interface text-xs font-bold text-[#425BBC]">Wix #{order.wixOrderNumber}</span>
                        ) : null}
                      </div>
                      <div className="truncate font-title text-base text-[#223b83] sm:text-lg">
                        {order.customerName || 'Cliente pendiente'}
                      </div>
                      <div className="mt-1 break-all font-interface text-xs font-semibold text-slate-500">
                        {order.reference}
                      </div>
                      <div className="mt-2 line-clamp-2 font-interface text-xs leading-5 text-slate-600 sm:text-sm">
                        {productSummary(order)}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center justify-between gap-4 border-t border-slate-200 pt-3 sm:block sm:min-w-36 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0 sm:text-right">
                      <div className="font-title text-lg text-[#233e91]">{money(order.total, order.currency)}</div>
                      <div className="mt-1 font-interface text-[11px] text-slate-500">{archiveLabel(order.adminDateKey)}</div>
                      <div className="mt-2 font-interface text-xs font-bold text-[#425BBC] group-hover:underline">Abrir →</div>
                    </div>
                  </div>
                </button>
              ))}

              {!loading && !list.orders.length ? (
                <div className="border-2 border-dashed border-[#b9c3df] bg-white/60 px-5 py-14 text-center">
                  <div className="text-3xl">📭</div>
                  <div className="mt-3 font-title text-lg text-[#2a3f83]">No hay pedidos aquí</div>
                  <div className="mt-1 font-interface text-sm text-slate-500">Prueba otro filtro, fecha o término de búsqueda.</div>
                </div>
              ) : null}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={page <= 0 || loading}
                onClick={() => setPage((current) => Math.max(0, current - 1))}
                className="border-2 border-[#9eacd3] bg-white px-4 py-2 font-interface text-xs font-bold text-[#2a3f83] disabled:opacity-40"
              >
                ← Anterior
              </button>
              <span className="font-interface text-xs text-slate-500">Página {page + 1}</span>
              <button
                type="button"
                disabled={!list.hasNext || loading}
                onClick={() => setPage((current) => current + 1)}
                className="border-2 border-[#9eacd3] bg-white px-4 py-2 font-interface text-xs font-bold text-[#2a3f83] disabled:opacity-40"
              >
                Siguiente →
              </button>
            </div>
          </section>
        </div>
      </div>

      {detail ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#101936]/70 p-0 sm:items-center sm:p-5" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !detailBusy) setDetail(null);
        }}>
          <article className="max-h-[94dvh] w-full overflow-auto border-2 border-[#243e8b] bg-[#f8f9fd] shadow-2xl sm:max-w-3xl">
            <div className="sticky top-0 z-10 flex items-start gap-3 border-b-2 border-[#253e88] bg-gradient-to-b from-[#5d78da] via-[#425BBC] to-[#29439d] px-4 py-3 text-white">
              <div className="min-w-0 flex-1">
                <div className="font-title text-lg tracking-[0.04em]">{detail.customerName || 'Pedido Guaurritas'}</div>
                <div className="mt-1 break-all font-interface text-[11px] text-blue-100">{detail.reference}</div>
              </div>
              <button
                type="button"
                disabled={Boolean(detailBusy)}
                onClick={() => setDetail(null)}
                className="h-9 w-9 shrink-0 border border-white/40 bg-white/10 font-interface text-xl disabled:opacity-40"
                aria-label="Cerrar pedido"
              >×</button>
            </div>

            <div className="space-y-4 p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill status={detail.status} />
                {detail.wixOrderNumber ? (
                  <span className="border border-emerald-300 bg-emerald-50 px-2.5 py-1 font-interface text-xs font-bold text-emerald-800">
                    Pedido Wix #{detail.wixOrderNumber}
                  </span>
                ) : null}
                {detail.isTest ? (
                  <span className="border border-violet-300 bg-violet-50 px-2.5 py-1 font-interface text-xs font-bold text-violet-800">🧪 PRUEBA</span>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="border border-[#c6cee5] bg-white p-3">
                  <div className="font-interface text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Total</div>
                  <div className="mt-1 font-title text-2xl text-[#233e91]">{money(detail.total, detail.currency)}</div>
                </div>
                <div className="border border-[#c6cee5] bg-white p-3">
                  <div className="font-interface text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Archivo</div>
                  <div className="mt-1 font-interface text-sm font-bold text-[#233e91]">📁 {archiveLabel(detail.adminDateKey)}</div>
                </div>
              </div>

              <section className="border border-[#c6cee5] bg-white p-3 sm:p-4">
                <div className="mb-3 font-title text-sm tracking-[0.05em] text-[#233e91]">PRODUCTOS</div>
                <div className="divide-y divide-slate-200">
                  {detail.lines.map((line, index) => (
                    <div key={`${line.name}-${index}`} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="grid h-9 w-9 shrink-0 place-items-center border border-[#bcc7e7] bg-[#eef2ff] font-interface text-xs font-bold text-[#425BBC]">{line.quantity}×</div>
                      <div className="min-w-0 flex-1">
                        <div className="font-interface text-sm font-bold text-slate-800">{line.name}</div>
                        {line.detail ? <div className="mt-1 font-interface text-xs leading-5 text-slate-500">{line.detail}</div> : null}
                      </div>
                      <div className="shrink-0 font-interface text-sm font-bold text-slate-700">{money(line.lineTotal || line.unitPrice * line.quantity, detail.currency)}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="grid gap-3 sm:grid-cols-2">
                <div className="border border-[#c6cee5] bg-white p-3 sm:p-4">
                  <div className="mb-3 font-title text-sm tracking-[0.05em] text-[#233e91]">CLIENTE</div>
                  <dl className="space-y-2 font-interface text-xs">
                    <div><dt className="text-slate-500">Nombre</dt><dd className="mt-0.5 font-semibold text-slate-800">{detail.customerName || '—'}</dd></div>
                    <div><dt className="text-slate-500">WhatsApp</dt><dd className="mt-0.5 break-all font-semibold text-slate-800">{detail.customerPhone || '—'}</dd></div>
                    <div><dt className="text-slate-500">Email</dt><dd className="mt-0.5 break-all font-semibold text-slate-800">{detail.customerEmail || '—'}</dd></div>
                  </dl>
                </div>
                <div className="border border-[#c6cee5] bg-white p-3 sm:p-4">
                  <div className="mb-3 font-title text-sm tracking-[0.05em] text-[#233e91]">MOVIMIENTOS</div>
                  <dl className="space-y-2 font-interface text-xs">
                    <div><dt className="text-slate-500">Creado</dt><dd className="mt-0.5 font-semibold text-slate-800">{dateTime(detail.createdAt)}</dd></div>
                    <div><dt className="text-slate-500">Comprobante</dt><dd className="mt-0.5 font-semibold text-slate-800">{dateTime(detail.proofSubmittedAt)}</dd></div>
                    <div><dt className="text-slate-500">Pago validado</dt><dd className="mt-0.5 font-semibold text-slate-800">{dateTime(detail.validatedAt)}</dd></div>
                  </dl>
                </div>
              </section>

              {detail.adminNote ? (
                <section className="border border-[#d4c4a1] bg-[#fffaf0] p-3 font-interface text-xs leading-5 text-[#675329]">
                  <strong>Nota interna:</strong> {detail.adminNote}
                </section>
              ) : null}

              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={!detail.hasProof || Boolean(detailBusy)}
                  onClick={() => openProof(detail)}
                  className="min-h-12 border-2 border-[#5f70a9] bg-white px-4 font-interface text-sm font-bold text-[#2a3f83] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {detailBusy === 'proof' ? 'Generando enlace…' : detail.hasProof ? '👁 Ver comprobante SPEI' : 'Sin comprobante'}
                </button>

                {detail.statusGroup === 'paid' ? (
                  <div className="grid min-h-12 place-items-center border-2 border-emerald-400 bg-emerald-50 px-4 text-center font-interface text-sm font-bold text-emerald-800">
                    ✓ PAGADO{detail.wixOrderNumber ? ` · Wix #${detail.wixOrderNumber}` : ''}
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={!detail.hasProof || Boolean(detailBusy) || detail.statusGroup === 'rejected' || detail.statusGroup === 'expired'}
                    onClick={() => validateOrder(detail)}
                    className="min-h-12 border-2 border-[#176b37] bg-[#218a49] px-4 font-interface text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {detailBusy === 'validate' ? 'Validando…' : '✓ Validar pago'}
                  </button>
                )}
              </div>

              {detail.statusGroup !== 'paid' && detail.statusGroup !== 'rejected' && detail.statusGroup !== 'expired' ? (
                <button
                  type="button"
                  disabled={!detail.hasProof || Boolean(detailBusy)}
                  onClick={() => rejectOrder(detail)}
                  className="min-h-11 w-full border-2 border-rose-400 bg-rose-50 px-4 font-interface text-sm font-bold text-rose-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {detailBusy === 'reject' ? 'Rechazando…' : '✕ Rechazar comprobante'}
                </button>
              ) : null}

              {detail.statusGroup === 'rejected' ? (
                <div className="border border-rose-300 bg-rose-50 p-3 font-interface text-sm text-rose-800">
                  Este comprobante fue rechazado. El cliente puede volver a cargar uno mientras su flujo lo permita.
                </div>
              ) : null}

              <div className="border-t border-slate-200 pt-3 font-interface text-[10px] leading-5 text-slate-400">
                Los comprobantes permanecen privados. “Ver comprobante” genera un enlace temporal seguro de Wix.
              </div>
            </div>
          </article>
        </div>
      ) : null}
    </main>
  );
}
