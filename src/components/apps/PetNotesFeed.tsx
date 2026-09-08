"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./Guaurrinotas.module.css";

export type CommunityPetProfile = {
  id: string;
  owner_id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  region: string | null;
  country_code: string;
  created_at: string;
};

type PetNoteRow = {
  id: string;
  pet_profile_id: string;
  owner_id: string;
  message: string;
  image_url: string | null;
  created_at: string;
};

type FeedNote = PetNoteRow & {
  profile: CommunityPetProfile;
};

type PetNotesFeedProps = {
  profiles: CommunityPetProfile[];
  currentOwnerId: string;
  onOpenProfile: (profile: CommunityPetProfile) => void;
  onCreateNote: () => void;
};

const formatNoteDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Fecha no disponible";

  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const getLocationLabel = (profile: CommunityPetProfile) =>
  [profile.city, profile.region].filter(Boolean).join(", ");

export default function PetNotesFeed({
  profiles,
  currentOwnerId,
  onOpenProfile,
  onCreateNote,
}: PetNotesFeedProps) {
  const [supabase] = useState(() => createClient());
  const [notes, setNotes] = useState<FeedNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState("");

  const loadFeed = useCallback(async () => {
    setIsLoading(true);
    setFeedback("");

    const { data: noteData, error: noteError } = await supabase
      .from("pet_notes")
      .select(
        "id, pet_profile_id, owner_id, message, image_url, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(50);

    if (noteError) {
      setFeedback(
        "No pudimos cargar el muro en este momento. Inténtalo nuevamente.",
      );
      setIsLoading(false);
      return;
    }

    const noteRows = (noteData ?? []) as PetNoteRow[];

    if (noteRows.length === 0) {
      setNotes([]);
      setIsLoading(false);
      return;
    }

    const profileIds = Array.from(
      new Set(noteRows.map((note) => note.pet_profile_id)),
    );

    const { data: profileData, error: profileError } = await supabase
      .from("pet_profiles")
      .select(
        "id, owner_id, name, username, avatar_url, bio, city, region, country_code, created_at",
      )
      .in("id", profileIds);

    if (profileError) {
      setFeedback(
        "Las notas están disponibles, pero no pudimos cargar sus perfiles. Inténtalo nuevamente.",
      );
      setIsLoading(false);
      return;
    }

    const profilesById = new Map(
      ((profileData ?? []) as CommunityPetProfile[]).map((profile) => [
        profile.id,
        profile,
      ]),
    );

    setNotes(
      noteRows.flatMap((note) => {
        const profile = profilesById.get(note.pet_profile_id);
        return profile ? [{ ...note, profile }] : [];
      }),
    );
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadFeed();
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [loadFeed]);

  return (
    <section className={styles.feed}>
      <header className={styles.feedHeader}>
        <div>
          <p className={styles.eyebrow}>GUAURRINOTAS · VIDA PET, EN COMUNIDAD</p>
          <h2>Su pequeño gran mundo<span aria-hidden="true">✦</span></h2>
          <p>Travesuras, paseos y momentos que merecen presumirse.</p>
        </div>
      </header>
      <div className={styles.petStrip} aria-label="Tus mascotas: abrir perfil">
        {profiles.map((profile) => (
          <button key={profile.id} type="button" onClick={() => onOpenProfile(profile)}>
            <span className={styles.stripAvatar}>
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt="" />
              ) : <span aria-hidden="true">🐾</span>}
            </span>
            <span>{profile.name}</span>
          </button>
        ))}
      </div>
      <button type="button" className={styles.composerPrompt} onClick={onCreateNote}>
        <span aria-hidden="true" className={styles.composeIcon}>＋</span>
        <span><strong>¿Qué hizo hoy tu mascota?</strong><small>Comparte una foto o una anécdota</small></span>
        <span className={styles.publishLabel}>Publicar ↗</span>
      </button>
      <div className={styles.feedLabel}><span>Momentos de la comunidad</span><small>Más recientes</small></div>
      <div>
        {feedback && (
          <div className="border-2 border-dashed border-[#9b3a3a] bg-[#fff0f0] p-4">
            <p
              role="status"
              aria-live="polite"
              className="font-mono text-xs font-bold leading-5 text-[#7b2929]"
            >
              {feedback}
            </p>
            <button
              type="button"
              onClick={() => void loadFeed()}
              className="mt-3 border-2 border-[#9b3a3a] bg-white px-3 py-2 font-mono text-[10px] font-bold text-[#7b2929] hover:bg-[#fff8f8]"
            >
              ↻ Reintentar
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="border-2 border-dashed border-[#cbd4e4] bg-[#f8f8f8] p-8 text-center">
            <p className="font-mono text-xs font-bold text-[#637497]">
              Cargando historias de la comunidad...
            </p>
          </div>
        ) : feedback ? null : notes.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyArtwork} aria-hidden="true">
              <span>MI PRIMERA<br />GUAURRINOTA <b>✦</b></span><span>🐾</span>
            </div>
            <p className={styles.eyebrow}>AQUÍ CABE TODA SU PERSONALIDAD</p>
            <h3>El primer momento puede ser suyo.</h3>
            <p>Una siesta épica, su paseo favorito o esa cara de “yo no fui”.<br />No tiene que ser perfecto. Tiene que ser suyo.</p>
            <button type="button" onClick={onCreateNote} className={styles.primary}>
              Compartir su primer momento ↗
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {notes.map((note) => {
              const isOwnProfile = note.profile.owner_id === currentOwnerId;
              const location = getLocationLabel(note.profile);

              return (
                <article
                  key={note.id}
                  className={styles.noteCard}
                >
                  <header className="flex flex-wrap items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => onOpenProfile(note.profile)}
                      className="flex min-w-0 items-center gap-3 text-left focus:outline-none focus:ring-2 focus:ring-[#425b8c] focus:ring-offset-2"
                      aria-label={`Abrir el perfil de ${note.profile.name}`}
                    >
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden border-2 border-[#425b8c] bg-[#dce4f2] text-xl">
                        {note.profile.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={note.profile.avatar_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span aria-hidden="true">🐾</span>
                        )}
                      </span>

                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-bold text-[#263650]">
                            {note.profile.name}
                          </span>
                          {isOwnProfile && (
                            <span className="border border-[#425b8c] bg-[#dce4f2] px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[#425b8c]">
                              Tu mascota
                            </span>
                          )}
                        </span>
                        <span className="block truncate font-mono text-[10px] text-[#637497]">
                          @{note.profile.username} · {formatNoteDate(note.created_at)}
                        </span>
                        {location && (
                          <span className="mt-1 block truncate text-[10px] text-[#637497]">
                            📍 {location}
                          </span>
                        )}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenProfile(note.profile)}
                      className="shrink-0 border-2 border-[#425b8c] bg-white px-3 py-2 font-mono text-[10px] font-bold text-[#425b8c] shadow-[2px_2px_0_#425b8c] hover:bg-[#dce4f2]"
                    >
                      Ver perfil →
                    </button>
                  </header>

                  {note.image_url && (
                    <div className={styles.notePhoto}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={note.image_url}
                        alt={`Foto de una nota de ${note.profile.name}`}
                        className="max-h-[32rem] w-full object-contain"
                      />
                    </div>
                  )}
                  <p className={styles.noteMessage}>{note.message}</p>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
