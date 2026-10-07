"use client";

import { useEffect, useMemo, useState } from "react";

/** A result belongs to one request; an old response cannot replace a new one. */
export function useAsyncResource<T>(
  load: (signal: AbortSignal) => Promise<T>,
  key: string | null,
) {
  const request = useMemo(() => ({ load, key }), [load, key]);
  const [result, setResult] = useState<{
    request: typeof request;
    data: T | null;
    error: string;
  } | null>(null);

  useEffect(() => {
    if (request.key === null) return;
    const controller = new AbortController();
    request.load(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setResult({ request, data, error: "" });
      },
      (error: unknown) => {
        if (!controller.signal.aborted) setResult({
          request,
          data: null,
          error: error instanceof Error ? error.message : "No pudimos cargar la configuración.",
        });
      },
    );
    return () => controller.abort();
  }, [request]);

  const current = key !== null && result?.request === request ? result : null;
  return {
    data: current?.data ?? null,
    error: current?.error ?? "",
    loading: key !== null && current === null,
  };
}
