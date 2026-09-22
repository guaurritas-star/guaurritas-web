export type WixMemberState = {
  loggedIn: boolean;
  name: string;
  photoUrl: string;
};

export const WIX_MEMBER_STATE_CACHE_KEY = "guaurritas:wix-member-state:v1";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function getNestedString(value: unknown, path: string[]): string {
  let current: unknown = value;

  for (const key of path) {
    const record = asRecord(current);
    if (!record) return "";
    current = record[key];
  }

  return typeof current === "string" ? current.trim() : "";
}

export function cleanWixMemberName(value: unknown): string {
  if (typeof value !== "string") return "";

  return value
    .replace(/^\s*hola\s*,?\s*/i, "")
    .replace(
      /\s*(?:my\s*account|my\s*orders?|mi\s*cuenta|mis\s*pedidos?|log\s*out|logout|cerrar\s*sesi[oó]n).*$/i,
      "",
    )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

export function readCachedWixMemberState(): WixMemberState | null {
  if (typeof window === "undefined") return null;

  try {
    const cached = JSON.parse(window.localStorage.getItem(WIX_MEMBER_STATE_CACHE_KEY) || "null");
    if (!cached || typeof cached !== "object") return null;

    return {
      loggedIn: Boolean(cached.loggedIn),
      name: cleanWixMemberName(cached.name),
      photoUrl: typeof cached.photoUrl === "string" ? cached.photoUrl.trim() : "",
    };
  } catch {
    return null;
  }
}

export function normalizeWixMemberState(
  value: unknown,
  fallback: WixMemberState | null = null,
): WixMemberState {
  const record = asRecord(value) || {};
  const loggedIn = Boolean(record.loggedIn);
  const name = cleanWixMemberName(record.name) || (loggedIn ? fallback?.name || "" : "");
  const photoUrl =
    getNestedString(record, ["photoUrl"]) ||
    getNestedString(record, ["profilePhoto"]) ||
    getNestedString(record, ["picture"]) ||
    getNestedString(record, ["imageUrl"]) ||
    getNestedString(record, ["member", "profile", "photo", "url"]) ||
    getNestedString(record, ["profile", "photo", "url"]) ||
    (loggedIn ? fallback?.photoUrl || "" : "");

  return { loggedIn, name, photoUrl };
}

export function cacheWixMemberState(state: WixMemberState) {
  if (typeof window === "undefined") return;

  try {
    if (state.loggedIn) {
      window.localStorage.setItem(WIX_MEMBER_STATE_CACHE_KEY, JSON.stringify(state));
    } else {
      window.localStorage.removeItem(WIX_MEMBER_STATE_CACHE_KEY);
    }
  } catch {
    // Storage can be unavailable in strict private browsing; the live message still works.
  }
}
