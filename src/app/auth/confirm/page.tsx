"use client";

import { useEffect, useState } from "react";
import type { EmailOtpType } from "@supabase/supabase-js";
import { withBasePath } from "@/lib/base-path";
import { createClient } from "@/lib/supabase/client";

export default function ConfirmEmailPage() {
  const [message, setMessage] = useState("Confirmando tu correo…");

  useEffect(() => {
    const confirmEmail = async () => {
      const url = new URL(window.location.href);
      const tokenHash = url.searchParams.get("token_hash");
      const type = url.searchParams.get("type") as EmailOtpType | null;
      const code = url.searchParams.get("code");
      const flowId = url.searchParams.get("sb_flow_id");
      const supabase = createClient();

      const result = tokenHash && type
        ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
        : code
          ? await supabase.auth.exchangeCodeForSession(
              code,
              flowId ? { flowId } : undefined,
            )
          : { error: new Error("El enlace no incluye un código válido.") };

      if (!result.error) {
        window.location.replace(withBasePath("/?auth_notice=confirmed"));
        return;
      }

      setMessage(
        "No pudimos confirmar el correo desde este enlace. Vuelve a Guaurrinotas e inicia sesión.",
      );

      window.setTimeout(() => {
        window.location.replace(
          withBasePath("/?auth_notice=confirmation_requires_sign_in"),
        );
      }, 2200);
    };

    void confirmEmail();
  }, []);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#f2f2f2] p-6 text-[#263650]">
      <section className="w-full max-w-md border-2 border-[#425b8c] bg-white p-8 text-center shadow-[7px_7px_0_#425b8c]">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#637497]">
          Guaurrinotas.exe
        </p>
        <h1 className="mt-4 text-3xl font-semibold">Confirmación de correo</h1>
        <p className="mt-4 text-sm leading-6">{message}</p>
      </section>
    </main>
  );
}
