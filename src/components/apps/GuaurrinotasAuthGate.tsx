"use client";

import { useEffect, useRef, useState } from "react";
import type { AuthError, User } from "@supabase/supabase-js";
import GuaurrinotasLoading from "./GuaurrinotasLoading";
import styles from "./Guaurrinotas.module.css";
import PetProfilesGate from "@/components/apps/PetProfilesGate";
import { withBasePath } from "@/lib/base-path";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "signup" | "signin";

const PASSWORD_REQUIREMENTS = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const WEB_SOURCE = "guaurritas-web";
const EMBED_SOURCE = "guaurritas-embed";
const MEMBER_STATE_MESSAGE = "guaurritas:member-state";
const MEMBER_STATE_REQUEST_MESSAGE = "guaurritas:member-state-request";
const MEMBER_LOGIN_REQUEST_MESSAGE = "guaurritas:member-login-request";
const GUAURRINOTAS_SESSION_REQUEST_MESSAGE =
  "guaurritas:guaurrinotas-session-request";
const GUAURRINOTAS_SESSION_MESSAGE = "guaurritas:guaurrinotas-session";

type WixMemberState = {
  loggedIn: boolean;
  name: string;
};

const translateAuthError = (error: AuthError) => {
  const normalized = error.message.toLowerCase();

  if (error.code === "signup_disabled") {
    return "El registro de cuentas está desactivado en Supabase. Activa Authentication → Providers → Email.";
  }

  if (
    error.code === "email_provider_disabled" ||
    error.code === "provider_disabled"
  ) {
    return "El acceso por correo está desactivado en Supabase. Activa Authentication → Providers → Email.";
  }

  if (
    error.code === "invalid_credentials" ||
    normalized.includes("invalid login credentials")
  ) {
    return "El correo o la contraseña no coinciden.";
  }

  if (
    error.code === "email_not_confirmed" ||
    normalized.includes("email not confirmed")
  ) {
    return "Primero confirma tu correo desde el mensaje que te enviamos.";
  }

  if (
    error.code === "email_exists" ||
    error.code === "user_already_exists" ||
    normalized.includes("user already registered")
  ) {
    return "Ese correo ya tiene una cuenta. Prueba iniciar sesión.";
  }

  if (error.code === "weak_password" || normalized.includes("password")) {
    return "La contraseña debe tener al menos 8 caracteres, mayúscula, minúscula y número.";
  }

  if (
    error.code === "over_email_send_rate_limit" ||
    error.code === "over_request_rate_limit" ||
    normalized.includes("rate limit")
  ) {
    return "Se hicieron varios intentos seguidos. Espera un momento y vuelve a intentar.";
  }

  if (error.code === "email_address_invalid") {
    return "Supabase rechazó ese correo como inválido. Revisa que esté escrito correctamente.";
  }

  if (error.code === "email_address_not_authorized") {
    return "Ese correo no está autorizado para registrarse en este proyecto de Supabase.";
  }

  if (error.code === "captcha_failed") {
    return "La verificación de seguridad de Supabase falló. Revisa la configuración de CAPTCHA.";
  }

  if (
    error.code === "request_timeout" ||
    normalized.includes("failed to fetch") ||
    normalized.includes("network")
  ) {
    return "No pudimos conectar con Supabase. Revisa tu conexión e inténtalo nuevamente.";
  }

  if (normalized.includes("error sending confirmation email")) {
    return "Supabase no pudo enviar el correo de confirmación. Revisa Authentication → Email Templates y la configuración SMTP.";
  }

  return `Supabase respondió: ${error.message}${error.code ? ` (código: ${error.code})` : ""}`;
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
  const [wixMemberState, setWixMemberState] =
    useState<WixMemberState | null>(null);
  const [isWixConnecting, setIsWixConnecting] = useState(false);
  const [wixBridgeError, setWixBridgeError] = useState("");
  const wixSessionRequestedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const searchParams = new URLSearchParams(window.location.search);
    const authNotice = searchParams.get("auth_notice");

    const noticeTimer = authNotice === "confirmation_requires_sign_in"
      ? window.setTimeout(() => {
          setMode("signin");
          setFeedbackKind("success");
          setFeedback(
            "Tu correo ya recibió la confirmación, pero el enlace se abrió fuera del navegador original. Inicia sesión con tu correo y contraseña.",
          );
        }, 0)
      : null;

    if (authNotice === "confirmation_requires_sign_in") {
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

    const requestWixSession = () => {
      if (
        wixSessionRequestedRef.current ||
        window.self === window.top
      ) {
        return;
      }

      wixSessionRequestedRef.current = true;
      setIsWixConnecting(true);
      setWixBridgeError("");

      window.parent.postMessage(
        {
          source: WEB_SOURCE,
          type: GUAURRINOTAS_SESSION_REQUEST_MESSAGE,
        },
        "*",
      );
    };

    const handleWixBridgeMessage = (event: MessageEvent) => {
      if (event.source !== window.parent) return;

      const message = event.data;
      if (
        !message ||
        typeof message !== "object" ||
        message.source !== EMBED_SOURCE
      ) {
        return;
      }

      if (message.type === MEMBER_STATE_MESSAGE) {
        const loggedIn = Boolean(message.loggedIn);
        setWixMemberState({
          loggedIn,
          name: typeof message.name === "string" ? message.name : "",
        });

        if (loggedIn) {
          requestWixSession();
        } else {
          wixSessionRequestedRef.current = false;
          setIsWixConnecting(false);
          setWixBridgeError("");
        }
        return;
      }

      if (message.type !== GUAURRINOTAS_SESSION_MESSAGE) return;

      if (
        message.ok === true &&
        typeof message.accessToken === "string" &&
        typeof message.refreshToken === "string"
      ) {
        void supabase.auth
          .setSession({
            access_token: message.accessToken,
            refresh_token: message.refreshToken,
          })
          .then(({ data, error }) => {
            if (!isMounted) return;

            setIsWixConnecting(false);

            if (error || !data.user) {
              setWixBridgeError(
                "No pudimos terminar de vincular tu cuenta Guaurritas con Guaurrinotas.",
              );
              return;
            }

            setWixBridgeError("");
            setUser(data.user);
          });
        return;
      }

      setIsWixConnecting(false);
      setWixBridgeError(
        typeof message.message === "string" && message.message
          ? message.message
          : "La vinculación automática de Guaurrinotas todavía no está disponible.",
      );
      setMode("signin");
      setFeedbackKind("error");
      setFeedback(
        "Tu cuenta Wix sí está iniciada. Mientras terminamos la vinculación automática puedes usar tu acceso anterior de Guaurrinotas.",
      );
    };

    window.addEventListener("message", handleWixBridgeMessage);

    if (window.self !== window.top) {
      window.parent.postMessage(
        {
          source: WEB_SOURCE,
          type: MEMBER_STATE_REQUEST_MESSAGE,
        },
        "*",
      );
    } else {
      setWixMemberState({ loggedIn: false, name: "" });
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;

      setUser(session?.user ?? null);
      setIsCheckingSession(false);
    });

    return () => {
      isMounted = false;
      if (noticeTimer !== null) window.clearTimeout(noticeTimer);
      window.removeEventListener("message", handleWixBridgeMessage);
      subscription.unsubscribe();
    };
  }, [supabase]);

  const requestWixLogin = () => {
    if (window.self === window.top) return;

    window.parent.postMessage(
      {
        source: WEB_SOURCE,
        type: MEMBER_LOGIN_REQUEST_MESSAGE,
      },
      "*",
    );
  };

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

    if (mode === "signup" && !PASSWORD_REQUIREMENTS.test(password)) {
      setFeedbackKind("error");
      setFeedback(
        "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.",
      );
      return;
    }

    setIsSubmitting(true);
    setFeedback("");

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}${withBasePath("/auth/confirm/")}`,
        },
      });

      setIsSubmitting(false);

      if (error) {
        setFeedbackKind("error");
        setFeedback(translateAuthError(error));
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
      setFeedback(translateAuthError(error));
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
    return <GuaurrinotasLoading label="Conectando con tu comunidad…" />;
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

  if (wixMemberState === null) {
    return <GuaurrinotasLoading label="Preparando tu cuenta…" />;
  }

  if (!wixMemberState.loggedIn) {
    return (
      <section className={`${styles.workspace} ${styles.authPanel}`}>
        <header className="border-b-2 border-[#425b8c] bg-[#dce4f2] p-5">
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#425b8c]">
            Guaurrinotas.exe
          </p>
          <h2 className="mt-2 text-2xl font-bold text-[#263650]">
            Su mundo empieza contigo
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#53627a]">
            Comparte sus momentos y descubre a otras mascotas. Entra con tu cuenta
            Guaurritas; si ya tienes una, usa la misma.
          </p>
        </header>

        <div className="p-5">
          <button
            type="button"
            onClick={requestWixLogin}
            className="w-full border-2 border-[#425b8c] bg-[#425b8c] px-4 py-3 font-mono text-xs font-bold text-white shadow-[3px_3px_0_#263650] hover:bg-[#263650]"
          >
            Entrar con Guaurritas
          </button>
        </div>
      </section>
    );
  }

  if (isWixConnecting && !wixBridgeError) {
    return <GuaurrinotasLoading label="Abriendo tu Guarriverse…" />;
  }

  return (
    <section className={`${styles.workspace} ${styles.authPanel}`}>
      <header className="border-b-2 border-[#425b8c] bg-[#dce4f2] p-5">
        <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#425b8c]">
          Guaurrinotas.exe
        </p>

        <h2 className="mt-2 text-2xl font-bold text-[#263650]">
          Tu mascota también tiene algo que decir
        </h2>

        <p className="mt-2 text-sm leading-6 text-[#53627a]">
          Crea su perfil, comparte sus momentos y descubre las historias de
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
