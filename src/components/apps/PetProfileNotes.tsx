"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type NotesProfile = {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
};

type PetNote = {
  id: string;
  pet_profile_id: string;
  owner_id: string;
  message: string;
  image_url: string | null;
  created_at: string;
};

type PetProfileNotesProps = {
  ownerId: string;
  profile: NotesProfile;
};

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_NOTE_LENGTH = 220;

const getImageExtension = (type: string) => {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
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

export default function PetProfileNotes({
  ownerId,
  profile,
}: PetProfileNotesProps) {
  const [supabase] = useState(() => createClient());
  const [notes, setNotes] = useState<PetNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [message, setMessage] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [feedbackKind, setFeedbackKind] = useState<"success" | "error">(
    "success",
  );

  const imagePreview = useMemo(
    () => (image ? URL.createObjectURL(image) : ""),
    [image],
  );

  useEffect(
    () => () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    },
    [imagePreview],
  );

  useEffect(() => {
    let isMounted = true;

    const loadNotes = async () => {
      setIsLoading(true);
      setHasLoadError(false);
      setFeedback("");

      const { data, error } = await supabase
        .from("pet_notes")
        .select(
          "id, pet_profile_id, owner_id, message, image_url, created_at",
        )
        .eq("pet_profile_id", profile.id)
        .order("created_at", { ascending: false });

      if (!isMounted) return;

      if (error) {
        setHasLoadError(true);
        setFeedbackKind("error");
        setFeedback(
          "No pudimos cargar las notas en este momento. Inténtalo nuevamente.",
        );
        setIsLoading(false);
        return;
      }

      setNotes((data ?? []) as PetNote[]);
      setHasLoadError(false);
      setIsLoading(false);
    };

    void loadNotes();

    return () => {
      isMounted = false;
    };
  }, [profile.id, supabase]);

  const selectImage = (file?: File) => {
    if (!file) {
      setImage(null);
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      setImage(null);
      setFeedbackKind("error");
      setFeedback("La foto debe ser JPEG, PNG o WebP.");
      setFileInputKey((currentKey) => currentKey + 1);
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setImage(null);
      setFeedbackKind("error");
      setFeedback("La foto debe pesar máximo 5 MB.");
      setFileInputKey((currentKey) => currentKey + 1);
      return;
    }

    setImage(file);
    setFeedback("");
  };

  const resetComposer = () => {
    setMessage("");
    setImage(null);
    setFileInputKey((currentKey) => currentKey + 1);
    setIsComposerOpen(false);
  };

  const publishNote = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const cleanMessage = message.trim();

    if (!cleanMessage || cleanMessage.length > MAX_NOTE_LENGTH) return;

    setIsPublishing(true);
    setFeedback("");

    let uploadedImagePath = "";
    let imageUrl: string | null = null;

    if (image) {
      const extension = getImageExtension(image.type);
      uploadedImagePath =
        `${ownerId}/${profile.id}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("pet-note-images")
        .upload(uploadedImagePath, image, {
          cacheControl: "3600",
          contentType: image.type,
          upsert: false,
        });

      if (uploadError) {
        setIsPublishing(false);
        setFeedbackKind("error");
        setFeedback(
          "No pudimos subir la foto de la nota. Revisa el formato e inténtalo otra vez.",
        );
        return;
      }

      imageUrl = supabase.storage
        .from("pet-note-images")
        .getPublicUrl(uploadedImagePath).data.publicUrl;
    }

    const { data, error } = await supabase
      .from("pet_notes")
      .insert({
        pet_profile_id: profile.id,
        owner_id: ownerId,
        message: cleanMessage,
        image_url: imageUrl,
      })
      .select(
        "id, pet_profile_id, owner_id, message, image_url, created_at",
      )
      .single();

    if (error) {
      if (uploadedImagePath) {
        await supabase.storage
          .from("pet-note-images")
          .remove([uploadedImagePath]);
      }

      setIsPublishing(false);
      setFeedbackKind("error");
      setFeedback(
        "No pudimos publicar la nota. Revisa tu conexión e inténtalo nuevamente.",
      );
      return;
    }

    setNotes((currentNotes) => [data as PetNote, ...currentNotes]);
    resetComposer();
    setIsPublishing(false);
    setFeedbackKind("success");
    setFeedback(`La nota de ${profile.name} ya está publicada ✓`);
  };

  return (
    <section className="border-2 border-[#425b8c] bg-white p-5 shadow-[5px_5px_0_#425b8c]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#425b8c]">
            Mis notas
          </p>
          <p className="mt-1 text-xs text-[#637497]">
            {isLoading
              ? "Cargando historias..."
              : notes.length === 1
                ? "1 historia publicada"
                : `${notes.length} historias publicadas`}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsComposerOpen((currentValue) => !currentValue);
            setFeedback("");
          }}
          disabled={isPublishing}
          aria-expanded={isComposerOpen}
          className="border-2 border-[#425b8c] bg-[#425b8c] px-4 py-2 font-mono text-xs font-bold text-white shadow-[2px_2px_0_#263650] hover:bg-[#263650] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isComposerOpen ? "× Cerrar" : "+ Nueva nota"}
        </button>
      </div>

      {isComposerOpen && (
        <form
          onSubmit={publishNote}
          className="mt-5 space-y-4 border-2 border-[#425b8c] bg-[#f8f8f8] p-4 shadow-[3px_3px_0_#cbd4e4]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden border-2 border-[#425b8c] bg-[#dce4f2] text-xl">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span aria-hidden="true">🐾</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#263650]">
                Publicar como {profile.name}
              </p>
              <p className="truncate font-mono text-xs text-[#637497]">
                @{profile.username}
              </p>
            </div>
          </div>

          <div>
            <label
              htmlFor={`new-note-${profile.id}`}
              className="font-mono text-xs font-bold text-[#263650]"
            >
              ¿Qué quiere contar {profile.name}?
            </label>
            <textarea
              id={`new-note-${profile.id}`}
              value={message}
              onChange={(event) => {
                setMessage(event.target.value);
                setFeedback("");
              }}
              maxLength={MAX_NOTE_LENGTH}
              disabled={isPublishing}
              required
              placeholder="Escribe una pequeña historia, recuerdo o momento..."
              className="mt-2 min-h-28 w-full resize-none border-2 border-[#425b8c] bg-white p-3 text-sm outline-none focus:bg-[#f8fafc] disabled:opacity-60"
            />
            <p className="mt-1 text-right font-mono text-[10px] text-[#637497]">
              {message.length}/{MAX_NOTE_LENGTH}
            </p>
          </div>

          <div>
            <label
              htmlFor={`note-image-${profile.id}`}
              className="font-mono text-xs font-bold text-[#263650]"
            >
              Agregar una foto{" "}
              <span className="font-normal">(opcional)</span>
            </label>
            <input
              key={fileInputKey}
              id={`note-image-${profile.id}`}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={isPublishing}
              onChange={(event) =>
                selectImage(event.target.files?.[0])
              }
              className="mt-2 block w-full text-xs text-[#53627a] file:mr-3 file:border-2 file:border-[#425b8c] file:bg-white file:px-3 file:py-2 file:font-mono file:text-xs file:font-bold file:text-[#425b8c] disabled:opacity-50"
            />
            <p className="mt-2 text-xs text-[#637497]">
              JPEG, PNG o WebP · máximo 5 MB.
            </p>
          </div>

          {imagePreview && (
            <div className="border-2 border-dashed border-[#cbd4e4] bg-white p-3">
              <div className="overflow-hidden border-2 border-[#425b8c] bg-[#dce4f2]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Vista previa de la nota"
                  className="max-h-72 w-full object-contain"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setImage(null);
                  setFileInputKey((currentKey) => currentKey + 1);
                }}
                disabled={isPublishing}
                className="mt-2 font-mono text-xs font-bold text-[#425b8c] hover:underline disabled:opacity-50"
              >
                × Quitar foto
              </button>
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={resetComposer}
              disabled={isPublishing}
              className="border-2 border-[#425b8c] bg-white px-4 py-2 font-mono text-xs font-bold text-[#425b8c] hover:bg-[#f0f3f8] disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPublishing || !message.trim()}
              className="border-2 border-[#425b8c] bg-[#425b8c] px-4 py-2 font-mono text-xs font-bold text-white shadow-[2px_2px_0_#263650] hover:bg-[#263650] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isPublishing ? "Publicando..." : "Publicar nota"}
            </button>
          </div>
        </form>
      )}

      {feedback && (
        <p
          role="status"
          aria-live="polite"
          className={`mt-4 border-2 border-dashed p-3 font-mono text-xs font-bold leading-5 ${
            feedbackKind === "error"
              ? "border-[#9b3a3a] bg-[#fff0f0] text-[#7b2929]"
              : "border-[#425b8c] bg-[#dce4f2] text-[#263650]"
          }`}
        >
          {feedback}
        </p>
      )}

      {isLoading ? (
        <div className="mt-5 border-2 border-dashed border-[#cbd4e4] bg-[#f8f8f8] p-6 text-center">
          <p className="font-mono text-xs font-bold text-[#637497]">
            Cargando las notas de {profile.name}...
          </p>
        </div>
      ) : hasLoadError ? null : notes.length === 0 ? (
        <div className="mt-5 border-2 border-dashed border-[#cbd4e4] bg-[#f8f8f8] p-6 text-center">
          <span aria-hidden="true" className="text-3xl">
            📝
          </span>
          <h3 className="mt-3 font-bold text-[#263650]">
            {profile.name} todavía no ha publicado notas
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#637497]">
            Su primera historia aparecerá aquí en cuanto la publiques.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {notes.map((note) => (
            <article
              key={note.id}
              className="border-2 border-[#425b8c] bg-[#f8f8f8] p-4 shadow-[3px_3px_0_#cbd4e4]"
            >
              <header className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden border-2 border-[#425b8c] bg-[#dce4f2] text-lg">
                  {profile.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatar_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span aria-hidden="true">🐾</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#263650]">
                    {profile.name}
                  </p>
                  <p className="truncate font-mono text-[10px] text-[#637497]">
                    @{profile.username} · {formatNoteDate(note.created_at)}
                  </p>
                </div>
              </header>

              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#263650]">
                {note.message}
              </p>

              {note.image_url && (
                <div className="mt-4 overflow-hidden border-2 border-[#425b8c] bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={note.image_url}
                    alt={"Foto de una nota de " + profile.name}
                    className="max-h-[28rem] w-full object-contain"
                  />
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
