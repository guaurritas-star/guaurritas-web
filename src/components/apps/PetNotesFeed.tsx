"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
    <section className="border-2 border-[#425b8c] bg-white shadow-[5px_5px_0_#425b8c]">
      <header className="border-b-2 border-[#425b8c] bg-[#f0f3f8] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#425b8c]">
              Inicio
            </p>
            <h2 className="mt-2 text-2xl font-bold text-[#263650]">
              El muro de Guaurrinotas
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#53627a]">
              Historias reales de las mascotas de la comunidad, de la más nueva
              a la más antigua.
            </p>
          </div>

          <button
            type="button"
            onClick={onCreateNote}
            className="border-2 border-[#425b8c] bg-[#425b8c] px-4 py-2 font-mono text-xs font-bold text-white shadow-[2px_2px_0_#263650] hover:bg-[#263650]"
          >
            + Escribir nota
          </button>
        </div>
      </header>

      <div className="p-5">
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
          <div className="border-2 border-dashed border-[#cbd4e4] bg-[#f8f8f8] p-8 text-center">
            <span aria-hidden="true" className="text-4xl">
              📝
            </span>
            <h3 className="mt-3 font-bold text-[#263650]">
              El muro está listo para su primera historia
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#637497]">
              Publica una nota desde el perfil de una de tus mascotas y
              aparecerá aquí.
            </p>
            <button
              type="button"
              onClick={onCreateNote}
              className="mt-4 border-2 border-[#425b8c] bg-white px-4 py-2 font-mono text-xs font-bold text-[#425b8c] shadow-[2px_2px_0_#425b8c] hover:bg-[#dce4f2]"
            >
              Elegir mascota
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
                  className="border-2 border-[#425b8c] bg-[#f8f8f8] p-4 shadow-[3px_3px_0_#cbd4e4]"
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
                      {isOwnProfile ? "Administrar nota" : "Ver perfil"} →
                    </button>
                  </header>

                  <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#263650]">
                    {note.message}
                  </p>

                  {note.image_url && (
                    <div className="mt-4 overflow-hidden border-2 border-[#425b8c] bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={note.image_url}
                        alt={`Foto de una nota de ${note.profile.name}`}
                        className="max-h-[32rem] w-full object-contain"
                      />
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
