"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import GuaurrinotasApp from "@/components/apps/GuaurrinotasApp";
import { createClient } from "@/lib/supabase/client";

type PetProfile = {
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

type ProfileDraft = {
  name: string;
  username: string;
  bio: string;
  city: string;
  region: string;
  avatar: File | null;
};

type EditProfileDraft = Pick<
  ProfileDraft,
  "name" | "bio" | "city" | "region"
>;

type PetProfilesGateProps = {
  user: User;
  isSigningOut: boolean;
  onSignOut: () => Promise<void>;
};

const EMPTY_DRAFT: ProfileDraft = {
  name: "",
  username: "",
  bio: "",
  city: "",
  region: "",
  avatar: null,
};

const ALLOWED_AVATAR_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const USERNAME_PATTERN = /^[a-z0-9_]{3,24}$/;

const getAvatarExtension = (type: string) => {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
};

const getProfileError = (message: string, code?: string) => {
  const normalized = message.toLowerCase();

  if (code === "23505" || normalized.includes("duplicate")) {
    return "Ese usuario ya está ocupado. Prueba con otro para tu mascota.";
  }

  if (
    normalized.includes("row-level security") ||
    normalized.includes("jwt")
  ) {
    return "Tu sesión necesita actualizarse. Recarga la página e inicia sesión otra vez.";
  }

  return "No pudimos guardar el perfil. Revisa los datos e inténtalo nuevamente.";
};

const getLocationLabel = (profile: PetProfile) =>
  [profile.city, profile.region].filter(Boolean).join(", ") ||
  "Ubicación no agregada";

const getJoinedLabel = (createdAt: string) => {
  const joinedDate = new Date(createdAt);

  if (Number.isNaN(joinedDate.getTime())) {
    return "Fecha de ingreso no disponible";
  }

  return `En Guaurritas desde ${new Intl.DateTimeFormat("es-MX", {
    month: "long",
    year: "numeric",
  }).format(joinedDate)}`;
};

export default function PetProfilesGate({
  user,
  isSigningOut,
  onSignOut,
}: PetProfilesGateProps) {
  const [supabase] = useState(() => createClient());
  const [profiles, setProfiles] = useState<PetProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null,
  );
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [draft, setDraft] = useState<ProfileDraft>(EMPTY_DRAFT);
  const [editDraft, setEditDraft] = useState<EditProfileDraft>({
    name: "",
    bio: "",
    city: "",
    region: "",
  });
  const [feedback, setFeedback] = useState("");
  const [feedbackKind, setFeedbackKind] = useState<"success" | "error">(
    "success",
  );
  const [fileInputKey, setFileInputKey] = useState(0);

  const avatarPreview = useMemo(
    () => (draft.avatar ? URL.createObjectURL(draft.avatar) : ""),
    [draft.avatar],
  );

  const selectedProfile = selectedProfileId
    ? profiles.find((profile) => profile.id === selectedProfileId) ?? null
    : null;

  useEffect(
    () => () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    },
    [avatarPreview],
  );

  useEffect(() => {
    let isMounted = true;

    const loadProfiles = async () => {
      setIsLoading(true);
      setFeedback("");

      const { data, error } = await supabase
        .from("pet_profiles")
        .select(
          "id, owner_id, name, username, avatar_url, bio, city, region, country_code, created_at",
        )
        .eq("owner_id", user.id)
        .order("created_at", { ascending: true });

      if (!isMounted) return;

      if (error) {
        setFeedbackKind("error");
        setFeedback(getProfileError(error.message, error.code));
        setIsLoading(false);
        return;
      }

      const currentProfiles = (data ?? []) as PetProfile[];
      setProfiles(currentProfiles);
      setShowForm(currentProfiles.length === 0);
      setIsLoading(false);
    };

    void loadProfiles();

    return () => {
      isMounted = false;
    };
  }, [supabase, user.id]);

  const updateDraft = (
    field: Exclude<keyof ProfileDraft, "avatar">,
    value: string,
  ) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [field]: value,
    }));
    setFeedback("");
  };

  const selectAvatar = (file?: File) => {
    if (!file) {
      setDraft((currentDraft) => ({ ...currentDraft, avatar: null }));
      return;
    }

    if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
      setDraft((currentDraft) => ({ ...currentDraft, avatar: null }));
      setFeedbackKind("error");
      setFeedback("La foto debe ser JPEG, PNG o WebP.");
      setFileInputKey((currentKey) => currentKey + 1);
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setDraft((currentDraft) => ({ ...currentDraft, avatar: null }));
      setFeedbackKind("error");
      setFeedback("La foto debe pesar máximo 5 MB.");
      setFileInputKey((currentKey) => currentKey + 1);
      return;
    }

    setDraft((currentDraft) => ({ ...currentDraft, avatar: file }));
    setFeedback("");
  };

  const resetForm = () => {
    setDraft(EMPTY_DRAFT);
    setFileInputKey((currentKey) => currentKey + 1);
  };

  const cancelForm = () => {
    resetForm();
    setFeedback("");
    setShowForm(false);
  };

  const openProfile = (profile: PetProfile) => {
    setSelectedProfileId(profile.id);
    setIsEditingProfile(false);
    setFeedback("");
  };

  const closeProfile = () => {
    setSelectedProfileId(null);
    setIsEditingProfile(false);
    setFeedback("");
  };

  const startEditingProfile = (profile: PetProfile) => {
    setEditDraft({
      name: profile.name,
      bio: profile.bio ?? "",
      city: profile.city ?? "",
      region: profile.region ?? "",
    });
    setFeedback("");
    setIsEditingProfile(true);
  };

  const updateEditDraft = (
    field: keyof EditProfileDraft,
    value: string,
  ) => {
    setEditDraft((currentDraft) => ({
      ...currentDraft,
      [field]: value,
    }));
    setFeedback("");
  };

  const saveEditedProfile = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!selectedProfile) return;

    const name = editDraft.name.trim();
    const bio = editDraft.bio.trim();
    const city = editDraft.city.trim();
    const region = editDraft.region.trim();

    if (!name) {
      setFeedbackKind("error");
      setFeedback("Escribe el nombre de tu mascota.");
      return;
    }

    setIsSavingProfile(true);
    setFeedback("");

    const { data, error } = await supabase
      .from("pet_profiles")
      .update({
        name,
        bio: bio || null,
        city: city || null,
        region: region || null,
      })
      .eq("id", selectedProfile.id)
      .eq("owner_id", user.id)
      .select(
        "id, owner_id, name, username, avatar_url, bio, city, region, country_code, created_at",
      )
      .single();

    setIsSavingProfile(false);

    if (error) {
      setFeedbackKind("error");
      setFeedback(getProfileError(error.message, error.code));
      return;
    }

    const updatedProfile = data as PetProfile;

    setProfiles((currentProfiles) =>
      currentProfiles.map((profile) =>
        profile.id === updatedProfile.id ? updatedProfile : profile,
      ),
    );
    setFeedbackKind("success");
    setFeedback(`Los cambios de ${updatedProfile.name} quedaron guardados ✓`);
    setIsEditingProfile(false);
  };

  const shareProfile = async (profile: PetProfile) => {
    const profileText = [
      `${profile.name} · @${profile.username}`,
      profile.bio,
      `📍 ${getLocationLabel(profile)}`,
      getJoinedLabel(profile.created_at),
      "",
      "Conoce su historia en Guaurrinotas.",
    ]
      .filter((line): line is string => Boolean(line))
      .join("\n");

    setFeedback("");

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Perfil de ${profile.name} | Guaurritas`,
          text: profileText,
        });
        setFeedbackKind("success");
        setFeedback("Perfil compartido ✓");
        return;
      }

      await navigator.clipboard.writeText(profileText);
      setFeedbackKind("success");
      setFeedback("Perfil copiado. Ya puedes pegarlo donde quieras ✓");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;

      setFeedbackKind("error");
      setFeedback("No pudimos compartir el perfil desde este navegador.");
    }
  };

  const createProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = draft.name.trim();
    const username = draft.username.trim().toLowerCase();
    const bio = draft.bio.trim();
    const city = draft.city.trim();
    const region = draft.region.trim();

    if (!name) {
      setFeedbackKind("error");
      setFeedback("Escribe el nombre de tu mascota.");
      return;
    }

    if (!USERNAME_PATTERN.test(username)) {
      setFeedbackKind("error");
      setFeedback(
        "El usuario necesita de 3 a 24 caracteres y solo puede llevar letras minúsculas, números o guion bajo.",
      );
      return;
    }

    setIsSubmitting(true);
    setFeedback("");

    let uploadedAvatarPath = "";
    let avatarUrl: string | null = null;

    if (draft.avatar) {
      const extension = getAvatarExtension(draft.avatar.type);
      uploadedAvatarPath = `${user.id}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("pet-avatars")
        .upload(uploadedAvatarPath, draft.avatar, {
          cacheControl: "3600",
          contentType: draft.avatar.type,
          upsert: false,
        });

      if (uploadError) {
        setIsSubmitting(false);
        setFeedbackKind("error");
        setFeedback(
          "No pudimos subir la foto. Comprueba que sea JPEG, PNG o WebP y pese menos de 5 MB.",
        );
        return;
      }

      avatarUrl = supabase.storage
        .from("pet-avatars")
        .getPublicUrl(uploadedAvatarPath).data.publicUrl;
    }

    const { data, error } = await supabase
      .from("pet_profiles")
      .insert({
        owner_id: user.id,
        name,
        username,
        avatar_url: avatarUrl,
        bio: bio || null,
        city: city || null,
        region: region || null,
        country_code: "MX",
      })
      .select(
        "id, owner_id, name, username, avatar_url, bio, city, region, country_code, created_at",
      )
      .single();

    if (error) {
      if (uploadedAvatarPath) {
        await supabase.storage
          .from("pet-avatars")
          .remove([uploadedAvatarPath]);
      }

      setIsSubmitting(false);
      setFeedbackKind("error");
      setFeedback(getProfileError(error.message, error.code));
      return;
    }

    setProfiles((currentProfiles) => [
      ...currentProfiles,
      data as PetProfile,
    ]);
    resetForm();
    setShowForm(false);
    setIsSubmitting(false);
    setFeedbackKind("success");
    setFeedback(`El perfil de ${name} quedó guardado ✓`);
  };

  if (isLoading) {
    return (
      <section className="mx-auto max-w-xl border-2 border-[#425b8c] bg-white p-6 text-center shadow-[4px_4px_0_#425b8c]">
        <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#425b8c]">
          Buscando perfiles de mascota...
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <section className="border-2 border-[#425b8c] bg-[#dce4f2] p-5 shadow-[4px_4px_0_#425b8c]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#425b8c]">
              Cuenta conectada ✓
            </p>
            <p className="mt-2 break-all text-sm text-[#53627a]">
              {user.email}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void onSignOut()}
            disabled={isSigningOut || isSubmitting || isSavingProfile}
            className="border-2 border-[#425b8c] bg-white px-4 py-2 font-mono text-xs font-bold text-[#425b8c] shadow-[2px_2px_0_#425b8c] hover:bg-[#f0f3f8] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cerrar sesión
          </button>
        </div>
      </section>

      {showForm ? (
        <section className="border-2 border-[#425b8c] bg-white shadow-[5px_5px_0_#425b8c]">
          <header className="border-b-2 border-[#425b8c] bg-[#f0f3f8] p-5">
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#425b8c]">
              Nuevo perfil
            </p>
            <h2 className="mt-2 text-2xl font-bold text-[#263650]">
              {profiles.length === 0
                ? "Crea el perfil de tu mascota"
                : "Agrega otra mascota"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#53627a]">
              Este será su nombre, foto y usuario dentro de Guaurrinotas.
              Después podrás editar los datos cuando lo necesites.
            </p>
          </header>

          <form onSubmit={createProfile} className="space-y-5 p-5">
            <fieldset disabled={isSubmitting} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-[96px_1fr] sm:items-center">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden border-2 border-[#425b8c] bg-[#dce4f2] text-4xl shadow-[3px_3px_0_#425b8c]">
                  {avatarPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarPreview}
                      alt="Vista previa de la mascota"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span aria-hidden="true">🐾</span>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="pet-avatar"
                    className="font-mono text-xs font-bold text-[#263650]"
                  >
                    Foto de perfil <span className="font-normal">(opcional)</span>
                  </label>
                  <input
                    key={fileInputKey}
                    id="pet-avatar"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) =>
                      selectAvatar(event.target.files?.[0])
                    }
                    className="mt-2 block w-full text-xs text-[#53627a] file:mr-3 file:border-2 file:border-[#425b8c] file:bg-white file:px-3 file:py-2 file:font-mono file:text-xs file:font-bold file:text-[#425b8c]"
                  />
                  <p className="mt-2 text-xs text-[#637497]">
                    JPEG, PNG o WebP · máximo 5 MB.
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="pet-name"
                  className="font-mono text-xs font-bold text-[#263650]"
                >
                  Nombre de tu mascota
                </label>
                <input
                  id="pet-name"
                  value={draft.name}
                  onChange={(event) =>
                    updateDraft("name", event.target.value)
                  }
                  maxLength={40}
                  required
                  placeholder="Ej. Robbie"
                  className="mt-2 w-full border-2 border-[#425b8c] bg-white p-3 text-sm outline-none focus:bg-[#f8fafc]"
                />
                <p className="mt-1 text-right font-mono text-[10px] text-[#637497]">
                  {draft.name.length}/40
                </p>
              </div>

              <div>
                <label
                  htmlFor="pet-username"
                  className="font-mono text-xs font-bold text-[#263650]"
                >
                  Usuario único
                </label>
                <div className="mt-2 flex border-2 border-[#425b8c] bg-white focus-within:bg-[#f8fafc]">
                  <span className="flex items-center border-r-2 border-[#425b8c] bg-[#dce4f2] px-3 font-mono text-sm font-bold text-[#425b8c]">
                    @
                  </span>
                  <input
                    id="pet-username"
                    value={draft.username}
                    onChange={(event) =>
                      updateDraft(
                        "username",
                        event.target.value
                          .toLowerCase()
                          .replace(/^@/, "")
                          .replace(/[^a-z0-9_]/g, "")
                          .slice(0, 24),
                      )
                    }
                    minLength={3}
                    maxLength={24}
                    pattern="[a-z0-9_]{3,24}"
                    required
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder="robbie_guaurritas"
                    className="min-w-0 flex-1 bg-transparent p-3 text-sm outline-none"
                  />
                </div>
                <p className="mt-2 text-xs leading-5 text-[#637497]">
                  De 3 a 24 caracteres. Usa letras, números o guion bajo; no
                  podrás repetir un usuario existente.
                </p>
              </div>

              <div>
                <label
                  htmlFor="pet-bio"
                  className="font-mono text-xs font-bold text-[#263650]"
                >
                  Cuéntanos algo de su personalidad{" "}
                  <span className="font-normal">(opcional)</span>
                </label>
                <textarea
                  id="pet-bio"
                  value={draft.bio}
                  onChange={(event) =>
                    updateDraft("bio", event.target.value)
                  }
                  maxLength={160}
                  placeholder="Ej. Experto en paseos largos y hacer amigos."
                  className="mt-2 min-h-24 w-full resize-none border-2 border-[#425b8c] bg-white p-3 text-sm outline-none focus:bg-[#f8fafc]"
                />
                <p className="mt-1 text-right font-mono text-[10px] text-[#637497]">
                  {draft.bio.length}/160
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="pet-city"
                    className="font-mono text-xs font-bold text-[#263650]"
                  >
                    Ciudad <span className="font-normal">(opcional)</span>
                  </label>
                  <input
                    id="pet-city"
                    value={draft.city}
                    onChange={(event) =>
                      updateDraft("city", event.target.value)
                    }
                    maxLength={80}
                    placeholder="Ej. León"
                    className="mt-2 w-full border-2 border-[#425b8c] bg-white p-3 text-sm outline-none focus:bg-[#f8fafc]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="pet-region"
                    className="font-mono text-xs font-bold text-[#263650]"
                  >
                    Estado <span className="font-normal">(opcional)</span>
                  </label>
                  <input
                    id="pet-region"
                    value={draft.region}
                    onChange={(event) =>
                      updateDraft("region", event.target.value)
                    }
                    maxLength={80}
                    placeholder="Ej. Guanajuato"
                    className="mt-2 w-full border-2 border-[#425b8c] bg-white p-3 text-sm outline-none focus:bg-[#f8fafc]"
                  />
                </div>
              </div>

              <p className="border-2 border-dashed border-[#cbd4e4] bg-[#f8f8f8] p-3 text-xs leading-5 text-[#637497]">
                Solo se mostrará ciudad y estado. No pedimos ni guardamos tu
                dirección exacta.
              </p>
            </fieldset>

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

            <div className="flex flex-wrap justify-end gap-3">
              {profiles.length > 0 && (
                <button
                  type="button"
                  onClick={cancelForm}
                  disabled={isSubmitting}
                  className="border-2 border-[#425b8c] bg-white px-4 py-3 font-mono text-xs font-bold text-[#425b8c] hover:bg-[#f0f3f8] disabled:opacity-50"
                >
                  Cancelar
                </button>
              )}

              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  !draft.name.trim() ||
                  !USERNAME_PATTERN.test(draft.username)
                }
                className="border-2 border-[#425b8c] bg-[#425b8c] px-5 py-3 font-mono text-xs font-bold text-white shadow-[3px_3px_0_#263650] hover:bg-[#263650] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSubmitting ? "Guardando perfil..." : "Crear perfil"}
              </button>
            </div>
          </form>
        </section>
      ) : selectedProfile ? (
        <div className="space-y-5">
          <section className="border-2 border-[#425b8c] bg-white shadow-[5px_5px_0_#425b8c]">
            <header className="border-b-2 border-[#425b8c] bg-[#f0f3f8] p-4">
              <button
                type="button"
                onClick={closeProfile}
                disabled={isSavingProfile}
                className="font-mono text-xs font-bold text-[#425b8c] hover:underline disabled:opacity-50"
              >
                ← Volver a mis mascotas
              </button>
            </header>

            <div className="p-5">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden border-2 border-[#425b8c] bg-[#dce4f2] text-4xl shadow-[3px_3px_0_#425b8c]">
                  {selectedProfile.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedProfile.avatar_url}
                      alt={`Foto de ${selectedProfile.name}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span aria-hidden="true">🐾</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#637497]">
                    Perfil de mascota
                  </p>
                  <h2 className="mt-1 truncate text-3xl font-bold text-[#263650]">
                    {selectedProfile.name}
                  </h2>
                  <p className="truncate font-mono text-sm text-[#425b8c]">
                    @{selectedProfile.username}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => startEditingProfile(selectedProfile)}
                      disabled={isSavingProfile}
                      className="border-2 border-[#425b8c] bg-[#425b8c] px-3 py-2 font-mono text-xs font-bold text-white shadow-[2px_2px_0_#263650] hover:bg-[#263650] disabled:opacity-50"
                    >
                      ✎ Editar perfil
                    </button>
                    <button
                      type="button"
                      onClick={() => void shareProfile(selectedProfile)}
                      disabled={isSavingProfile}
                      className="border-2 border-[#425b8c] bg-white px-3 py-2 font-mono text-xs font-bold text-[#425b8c] shadow-[2px_2px_0_#425b8c] hover:bg-[#dce4f2] disabled:opacity-50"
                    >
                      ↗ Compartir
                    </button>
                  </div>
                </div>
              </div>

              {isEditingProfile ? (
                <form
                  onSubmit={saveEditedProfile}
                  className="mt-6 space-y-4 border-2 border-[#425b8c] bg-[#f8f8f8] p-4"
                >
                  <div>
                    <p className="font-mono text-sm font-bold text-[#263650]">
                      Editar datos de {selectedProfile.name}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#637497]">
                      El usuario @{selectedProfile.username} identifica este
                      perfil y no cambia en esta sección.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="edit-pet-name"
                      className="font-mono text-xs font-bold text-[#263650]"
                    >
                      Nombre
                    </label>
                    <input
                      id="edit-pet-name"
                      value={editDraft.name}
                      onChange={(event) =>
                        updateEditDraft("name", event.target.value)
                      }
                      maxLength={40}
                      required
                      className="mt-2 w-full border-2 border-[#425b8c] bg-white p-3 text-sm outline-none focus:bg-[#f8fafc]"
                    />
                    <p className="mt-1 text-right font-mono text-[10px] text-[#637497]">
                      {editDraft.name.length}/40
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="edit-pet-bio"
                      className="font-mono text-xs font-bold text-[#263650]"
                    >
                      Personalidad <span className="font-normal">(opcional)</span>
                    </label>
                    <textarea
                      id="edit-pet-bio"
                      value={editDraft.bio}
                      onChange={(event) =>
                        updateEditDraft("bio", event.target.value)
                      }
                      maxLength={160}
                      className="mt-2 min-h-24 w-full resize-none border-2 border-[#425b8c] bg-white p-3 text-sm outline-none focus:bg-[#f8fafc]"
                    />
                    <p className="mt-1 text-right font-mono text-[10px] text-[#637497]">
                      {editDraft.bio.length}/160
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="edit-pet-city"
                        className="font-mono text-xs font-bold text-[#263650]"
                      >
                        Ciudad <span className="font-normal">(opcional)</span>
                      </label>
                      <input
                        id="edit-pet-city"
                        value={editDraft.city}
                        onChange={(event) =>
                          updateEditDraft("city", event.target.value)
                        }
                        maxLength={80}
                        className="mt-2 w-full border-2 border-[#425b8c] bg-white p-3 text-sm outline-none focus:bg-[#f8fafc]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="edit-pet-region"
                        className="font-mono text-xs font-bold text-[#263650]"
                      >
                        Estado <span className="font-normal">(opcional)</span>
                      </label>
                      <input
                        id="edit-pet-region"
                        value={editDraft.region}
                        onChange={(event) =>
                          updateEditDraft("region", event.target.value)
                        }
                        maxLength={80}
                        className="mt-2 w-full border-2 border-[#425b8c] bg-white p-3 text-sm outline-none focus:bg-[#f8fafc]"
                      />
                    </div>
                  </div>

                  <p className="border-2 border-dashed border-[#cbd4e4] bg-white p-3 text-xs leading-5 text-[#637497]">
                    Solo se mostrará ciudad y estado; nunca una dirección exacta.
                  </p>

                  <div className="flex flex-wrap justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingProfile(false);
                        setFeedback("");
                      }}
                      disabled={isSavingProfile}
                      className="border-2 border-[#425b8c] bg-white px-4 py-2 font-mono text-xs font-bold text-[#425b8c] hover:bg-[#f0f3f8] disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingProfile || !editDraft.name.trim()}
                      className="border-2 border-[#425b8c] bg-[#425b8c] px-4 py-2 font-mono text-xs font-bold text-white shadow-[2px_2px_0_#263650] hover:bg-[#263650] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {isSavingProfile ? "Guardando cambios..." : "Guardar cambios"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-6 space-y-4">
                  <p className="text-sm leading-6 text-[#263650]">
                    {selectedProfile.bio ||
                      "Este perfil todavía no tiene una descripción."}
                  </p>
                  <div className="space-y-1 border-t-2 border-dashed border-[#cbd4e4] pt-4 font-mono text-xs text-[#637497]">
                    <p>📍 {getLocationLabel(selectedProfile)}</p>
                    <p>🗓 {getJoinedLabel(selectedProfile.created_at)}</p>
                  </div>
                </div>
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
            </div>
          </section>

          <section className="border-2 border-[#425b8c] bg-white p-5 shadow-[5px_5px_0_#425b8c]">
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#425b8c]">
              Mis notas
            </p>
            <div className="mt-4 border-2 border-dashed border-[#cbd4e4] bg-[#f8f8f8] p-6 text-center">
              <span aria-hidden="true" className="text-3xl">
                📝
              </span>
              <h3 className="mt-3 font-bold text-[#263650]">
                {selectedProfile.name} todavía no ha publicado notas
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#637497]">
                Aquí aparecerán sus historias cuando conectemos el editor de
                Guaurrinotas en el siguiente paso.
              </p>
            </div>
          </section>
        </div>
      ) : (
        <section className="border-2 border-[#425b8c] bg-white p-5 shadow-[5px_5px_0_#425b8c]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#425b8c]">
                Tus mascotas
              </p>
              <h2 className="mt-2 text-2xl font-bold text-[#263650]">
                {profiles.length === 1
                  ? "Perfil guardado"
                  : `${profiles.length} perfiles guardados`}
              </h2>
            </div>

            <button
              type="button"
              onClick={() => {
                setFeedback("");
                setShowForm(true);
              }}
              className="border-2 border-[#425b8c] bg-[#425b8c] px-4 py-2 font-mono text-xs font-bold text-white shadow-[2px_2px_0_#263650] hover:bg-[#263650]"
            >
              + Agregar otra mascota
            </button>
          </div>

          {feedback && (
            <p
              role="status"
              aria-live="polite"
              className="mt-4 border-2 border-dashed border-[#425b8c] bg-[#dce4f2] p-3 font-mono text-xs font-bold leading-5 text-[#263650]"
            >
              {feedback}
            </p>
          )}

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                type="button"
                onClick={() => openProfile(profile)}
                className="flex w-full items-start gap-3 border-2 border-[#425b8c] bg-[#f8f8f8] p-4 text-left shadow-[3px_3px_0_#cbd4e4] transition-transform hover:-translate-y-0.5 hover:bg-[#f0f3f8] focus:outline-none focus:ring-2 focus:ring-[#425b8c] focus:ring-offset-2"
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden border-2 border-[#425b8c] bg-[#dce4f2] text-2xl">
                  {profile.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatar_url}
                      alt={`Foto de ${profile.name}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span aria-hidden="true">🐾</span>
                  )}
                </div>

                <div className="min-w-0">
                  <h3 className="truncate font-bold text-[#263650]">
                    {profile.name}
                  </h3>
                  <p className="truncate font-mono text-xs text-[#425b8c]">
                    @{profile.username}
                  </p>
                  <p className="mt-2 text-xs text-[#637497]">
                    📍 {getLocationLabel(profile)}
                  </p>
                  <p className="mt-3 font-mono text-[10px] font-bold uppercase tracking-wider text-[#425b8c]">
                    Ver perfil →
                  </p>
                </div>
              </button>
            ))}
          </div>

          <p className="mt-5 border-t-2 border-dashed border-[#cbd4e4] pt-4 text-sm leading-6 text-[#53627a]">
            Los perfiles ya están guardados en tu cuenta. El siguiente bloque
            conectará cada mascota con sus notas, comentarios y amistades.
          </p>
        </section>
      )}

      <div className="pointer-events-none opacity-40" aria-hidden="true">
        <GuaurrinotasApp />
      </div>
    </div>
  );
}
