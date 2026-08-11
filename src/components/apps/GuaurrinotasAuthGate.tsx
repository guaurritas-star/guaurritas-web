"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import PetProfilesGate from "@/components/apps/PetProfilesGate";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "signup" | "signin";

const translateAuthError = (message: string) => {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "El correo o la contraseña no coinciden.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Primero confirma tu correo desde el mensaje que te enviamos.";
  }

  if (normalized.includes("user already registered")) {
    return "Ese correo ya tiene una cuenta. Prueba iniciar sesión.";
  }

  if (normalized.includes("password")) {
    return "La contraseña debe tener al menos 8 caracteres, mayúscula, minúscula y número.";
  }

  if (normalized.includes("rate limit")) {
    return "Se hicieron varios intentos seguidos. Espera un momento y vuelve a intentar.";
  }

  return "No pudimos completar el acceso. Revisa los datos e inténtalo nuevamente.";
};

export default function GuaurrinotasAuthGate() {
  const [supabase] = useState(() => createClient());
  const [mode, setMode] = useState<AuthMode>("signup");
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackKind, setFeedbackKind] = useState<"success" | "error">(
    "success",
  );

  useEffect(() => {
    let isMounted = true;

    const searchParams = new URLSearchParams(window.location.search);
    const authNotice = searchParams.get("auth_notice");

    if (authNotice === "confirmation_requires_sign_in") {
      setMode("signin");
      setFeedbackKind("success");
      setFeedback(
        "Tu correo ya recibió la confirmación, pero el enlace se abrió fuera del navegador original. Inicia sesión con tu correo y contraseña.",
      );
      window.history.replaceState({}, "", window.location.pathname);
    }

    const loadUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!isMounted) return;

      setUser(currentUser);
      setIsCheckingSession(false);
    };

    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;

      setUser(session?.user ?? null);
      setIsCheckingSession(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setPassword("");
    setPasswordConfirmation("");
    setFeedback("");
  };

  const submitAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) return;

    if (mode === "signup" && password !== passwordConfirmation) {
      setFeedbackKind("error");
      setFeedback("Las contraseñas no coinciden.");
      return;
    }

    setIsSubmitting(true);
    setFeedback("");

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      });

      setIsSubmitting(false);

      if (error) {
        setFeedbackKind("error");
        setFeedback(translateAuthError(error.message));
        return;
      }

      if (data.session) {
        setUser(data.user);
        return;
      }

      setFeedbackKind("success");
      setFeedback(
        "Cuenta creada. Abre el enlace de confirmación en este mismo navegador y dispositivo. Si se abre en otra app, vuelve aquí e inicia sesión.",
      );
      setPassword("");
      setPasswordConfirmation("");
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    setIsSubmitting(false);

    if (error) {
      setFeedbackKind("error");
      setFeedback(translateAuthError(error.message));
      return;
    }

    setUser(data.user);
    setPassword("");
  };

  const signOut = async () => {
    setIsSubmitting(true);
    await supabase.auth.signOut();
    setUser(null);
    setIsSubmitting(false);
    setMode("signin");
    setFeedback("");
  };

  if (isCheckingSession) {
    return (
      <section className="mx-auto max-w-xl border-2 border-[#425b8c] bg-white p-6 text-center shadow-[4px_4px_0_#425b8c]">
        <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#425b8c]">
          Conectando con Guaurrinotas...
        </p>
      </section>
    );
  }

  if (user) {
    return (
      <PetProfilesGate
        user={user}
        isSigningOut={isSubmitting}
        onSignOut={signOut}
      />
    );
  }

  return (
    <section className="mx-auto max-w-xl border-2 border-[#425b8c] bg-white shadow-[5px_5px_0_#425b8c]">
      <header className="border-b-2 border-[#425b8c] bg-[#dce4f2] p-5">
        <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#425b8c]">
          Guaurrinotas.exe
        </p>

        <h2 className="mt-2 text-2xl font-bold text-[#263650]">
          Tu mascota también tiene algo que decir
        </h2>

        <p className="mt-2 text-sm leading-6 text-[#53627a]">
          Crea su perfil para compartir notas, seguir amistades y formar parte de
          la comunidad Guaurritas.
        </p>
      </header>

      <div className="p-5">
        <div
          className="grid grid-cols-2 border-2 border-[#425b8c]"
          role="tablist"
          aria-label="Acceso a Guaurrinotas"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "signup"}
            onClick={() => changeMode("signup")}
            className={`border-r-2 border-[#425b8c] px-3 py-3 font-mono text-xs font-bold ${
              mode === "signup"
                ? "bg-[#425b8c] text-white"
                : "bg-white text-[#425b8c] hover:bg-[#f0f3f8]"
            }`}
          >
            Crear cuenta
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={mode === "signin"}
            onClick={() => changeMode("signin")}
            className={`px-3 py-3 font-mono text-xs font-bold ${
              mode === "signin"
                ? "bg-[#425b8c] text-white"
                : "bg-white text-[#425b8c] hover:bg-[#f0f3f8]"
            }`}
          >
            Iniciar sesión
          </button>
        </div>

        <form onSubmit={submitAuth} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="guaurrinotas-email"
              className="font-mono text-xs font-bold text-[#263650]"
            >
              Correo electrónico
            </label>

            <input
              id="guaurrinotas-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              placeholder="tucorreo@ejemplo.com"
              className="mt-2 w-full border-2 border-[#425b8c] bg-white p-3 text-sm outline-none focus:bg-[#f8fafc]"
            />
          </div>

          <div>
            <label
              htmlFor="guaurrinotas-password"
              className="font-mono text-xs font-bold text-[#263650]"
            >
              Contraseña
            </label>

            <input
              id="guaurrinotas-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              minLength={8}
              required
              placeholder="Mínimo 8 caracteres"
              className="mt-2 w-full border-2 border-[#425b8c] bg-white p-3 text-sm outline-none focus:bg-[#f8fafc]"
            />

            {mode === "signup" && (
              <p className="mt-2 text-xs leading-5 text-[#637497]">
                Usa al menos 8 caracteres, una mayúscula, una minúscula y un
                número.
              </p>
            )}
          </div>

          {mode === "signup" && (
            <div>
              <label
                htmlFor="guaurrinotas-password-confirmation"
                className="font-mono text-xs font-bold text-[#263650]"
              >
                Confirma tu contraseña
              </label>

              <input
                id="guaurrinotas-password-confirmation"
                type="password"
                value={passwordConfirmation}
                onChange={(event) =>
                  setPasswordConfirmation(event.target.value)
                }
                autoComplete="new-password"
                minLength={8}
                required
                placeholder="Escríbela otra vez"
                className="mt-2 w-full border-2 border-[#425b8c] bg-white p-3 text-sm outline-none focus:bg-[#f8fafc]"
              />
            </div>
          )}

          {feedback && (
            <p
              role="status"
              aria-live="polite"
              className={`border-2 border-dashed p-3 font-mono text-xs font-bold leading-5 ${
                feedbackKind === "error"
                  ? "border-[#9b3a3a] bg-[#fff0f0] text-[#7b2929]"
                  : "border-[#425b8c] bg-[#dce4f2] text-[#263650]"
              }`}
            >
              {feedback}
            </p>
          )}

          <button
            type="submit"
            disabled={
              isSubmitting ||
              !email.trim() ||
              !password ||
              (mode === "signup" && !passwordConfirmation)
            }
            className="w-full border-2 border-[#425b8c] bg-[#425b8c] px-4 py-3 font-mono text-xs font-bold text-white shadow-[3px_3px_0_#263650] hover:bg-[#263650] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting
              ? "Conectando..."
              : mode === "signup"
                ? "Crear mi cuenta"
                : "Entrar a Guaurrinotas"}
          </button>
        </form>
      </div>
    </section>
  );
}
